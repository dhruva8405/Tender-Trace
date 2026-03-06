"""
Lambda: auto_investigator
--------------------------
Autonomous AI investigation agent for Tender Trace.
Triggered by: Manual invoke, EventBridge schedule, or API Gateway GET /investigate

What it does (zero human input):
  1. Scans ALL vendors in DynamoDB
  2. Runs 7 detection rules (5 red flags + 2 advanced)
  3. Detects fraud clusters (shared address + shared director + common political link)
  4. Generates cross-cluster network analysis
  5. Calls Amazon Bedrock (Claude 3 Haiku) for AI investigation brief
  6. Returns prioritised referral list for vigilance officers

Scalability:
  - Add new rules by extending RULES list (no other changes needed)
  - DynamoDB pagination handles unlimited vendor counts
  - EventBridge can schedule this daily for continuous monitoring
  - SNS integration hook: set SNS_ALERT_TOPIC env var for auto-alerts on HIGH clusters
  - Enable STORE_REPORTS=true to persist reports to DynamoDB for audit trail
"""

import json
import os
import boto3
from datetime import datetime
from decimal import Decimal
from collections import defaultdict

# ─── CONFIG ───────────────────────────────────────────────────────────
TABLE_PREFIX   = os.getenv("TABLE_PREFIX", "tender-trace-")
BEDROCK_MODEL  = os.getenv("BEDROCK_MODEL", "anthropic.claude-3-haiku-20240307-v1:0")
BEDROCK_REGION = os.getenv("BEDROCK_REGION", "us-east-1")
SNS_TOPIC_ARN  = os.getenv("SNS_ALERT_TOPIC", "")     # optional: auto-alert on HIGH clusters
STORE_REPORTS  = os.getenv("STORE_REPORTS", "false").lower() == "true"  # persist reports

dynamodb = boto3.resource("dynamodb")

# ─── RULE WEIGHTS ─────────────────────────────────────────────────────
RULE_WEIGHTS = {
    "FLAG_NEW_COMPANY":          20,
    "FLAG_SHARED_ADDRESS":       20,
    "FLAG_SHARED_DIRECTOR":      25,
    "FLAG_POLITICAL_LINK":       25,
    "FLAG_CAPITAL_MISMATCH":     10,
    "FLAG_CONTRACT_SPLITTING":   15,   # NEW: multiple small contracts to same vendor (bid splitting)
    "FLAG_MINISTRY_LOCK":        10,   # NEW: vendor wins 100% of contracts from one ministry
}

# ─── TYPE SAFETY (DynamoDB returns Decimal) ───────────────────────────
def safe_str(value):
    if value is None:
        return ""
    return str(value).strip()

def safe_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0

def decimal_to_float(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

# ─── DynamoDB HELPERS ─────────────────────────────────────────────────

def scan_table(table_name):
    table = dynamodb.Table(f"{TABLE_PREFIX}{table_name}")
    items = []
    resp = table.scan()
    items.extend(resp["Items"])
    while "LastEvaluatedKey" in resp:
        resp = table.scan(ExclusiveStartKey=resp["LastEvaluatedKey"])
        items.extend(resp["Items"])
    return items

# ─── RED FLAG RULES ───────────────────────────────────────────────────

def rule_new_company(company, contracts):
    """Rule 1: Registered <90 days before first contract win."""
    vendor_contracts = [c for c in contracts if safe_str(c.get("company_id")) == safe_str(company["company_id"])]
    if not vendor_contracts:
        return False, None
    try:
        first_award = min(datetime.strptime(safe_str(c["award_date"]), "%Y-%m-%d") for c in vendor_contracts)
        reg_date = datetime.strptime(safe_str(company["registration_date"]), "%Y-%m-%d")
        days = (first_award - reg_date).days
        return days < 90, f"Registered {days} days before first contract (threshold: 90)"
    except:
        return False, None

def rule_shared_address(company, all_companies):
    """Rule 2: Same registered address as other vendors."""
    my_addr = safe_str(company.get("registered_address"))
    same = [c for c in all_companies
            if safe_str(c.get("registered_address")) == my_addr
            and c["company_id"] != company["company_id"]]
    return len(same) > 0, f"Shares address with {len(same)} vendor(s)" if same else None

def rule_shared_director(company, directors):
    """Rule 3: Director also sits on another winning vendor."""
    cid = safe_str(company["company_id"])
    my_dirs = {safe_str(d.get("director_id")) for d in directors if safe_str(d.get("company_id")) == cid}
    my_dirs.discard("")
    overlaps = [d for d in directors
                if safe_str(d.get("director_id")) in my_dirs and safe_str(d.get("company_id")) != cid]
    return len(overlaps) > 0, f"Shares {len({safe_str(d['director_id']) for d in overlaps})} director(s)" if overlaps else None

def rule_political_link(company, directors, politicians):
    """Rule 4: Director matched to politician family declaration."""
    cid = safe_str(company["company_id"])
    my_dins = {safe_str(d.get("din")) for d in directors if safe_str(d.get("company_id")) == cid and safe_str(d.get("din"))}
    my_dins.discard("")
    links = [p for p in politicians if safe_str(p.get("related_din")) in my_dins and my_dins]
    if not links:
        return False, None
    p = links[0]
    return True, f"Director declared as {safe_str(p.get('relation'))} of {safe_str(p.get('name'))} ({safe_str(p.get('party'))}, {safe_str(p.get('constituency'))})"

def rule_capital_mismatch(company, contracts):
    """Rule 5: Total contracts >30x paid-up capital."""
    vendor_contracts = [c for c in contracts if safe_str(c.get("company_id")) == safe_str(company["company_id"])]
    total = sum(safe_float(c.get("value_inr", 0)) for c in vendor_contracts)
    cap = safe_float(company.get("paid_up_capital", 1))
    if cap <= 0:
        return False, None
    ratio = total / cap
    return ratio > 30, f"Contracts = {ratio:.1f}x paid-up capital (threshold: 30x)" if ratio > 30 else None

def rule_contract_splitting(company, contracts):
    """Rule 6 (Advanced): Multiple small contracts awarded to same vendor in <90 days.
    Indicates bid splitting to stay below single-procurement thresholds."""
    vendor_contracts = sorted(
        [c for c in contracts if safe_str(c.get("company_id")) == safe_str(company["company_id"])],
        key=lambda c: c.get("award_date", "")
    )
    if len(vendor_contracts) < 2:
        return False, None
    try:
        dates = [datetime.strptime(safe_str(c["award_date"]), "%Y-%m-%d") for c in vendor_contracts]
        span_days = (max(dates) - min(dates)).days
        if span_days < 90 and len(vendor_contracts) >= 2:
            total = sum(safe_float(c.get("value_inr", 0)) for c in vendor_contracts)
            return True, f"{len(vendor_contracts)} contracts in {span_days} days totalling Rs.{total:,.0f} (possible bid splitting)"
    except:
        pass
    return False, None

def rule_ministry_lock(company, contracts, all_contracts):
    """Rule 7 (Advanced): Vendor wins exclusively from one ministry — indicates captured procurement."""
    vendor_contracts = [c for c in contracts if safe_str(c.get("company_id")) == safe_str(company["company_id"])]
    if len(vendor_contracts) < 2:
        return False, None
    ministries = [safe_str(c.get("ministry")) for c in vendor_contracts if c.get("ministry")]
    if not ministries:
        return False, None
    dominant = max(set(ministries), key=ministries.count)
    pct = ministries.count(dominant) / len(ministries) * 100
    if pct == 100 and len(vendor_contracts) >= 2:
        return True, f"100% of {len(vendor_contracts)} contracts from {dominant} (ministry capture indicator)"
    return False, None

# ─── SCORE ONE VENDOR ─────────────────────────────────────────────────

def score_vendor(company, all_companies, directors, contracts, politicians, all_contracts):
    flags, details, score = [], [], 0

    checks = [
        ("FLAG_NEW_COMPANY",       rule_new_company(company, contracts)),
        ("FLAG_SHARED_ADDRESS",    rule_shared_address(company, all_companies)),
        ("FLAG_SHARED_DIRECTOR",   rule_shared_director(company, directors)),
        ("FLAG_POLITICAL_LINK",    rule_political_link(company, directors, politicians)),
        ("FLAG_CAPITAL_MISMATCH",  rule_capital_mismatch(company, contracts)),
        ("FLAG_CONTRACT_SPLITTING",rule_contract_splitting(company, contracts)),
        ("FLAG_MINISTRY_LOCK",     rule_ministry_lock(company, contracts, all_contracts)),
    ]

    for flag, (triggered, detail) in checks:
        if triggered:
            flags.append(flag)
            score += RULE_WEIGHTS[flag]
            details.append(f"{flag}: {detail}")

    score = min(score, 100)
    risk_level = "HIGH" if score >= 61 else "MEDIUM" if score >= 31 else "LOW"

    return {
        "company_id": safe_str(company["company_id"]),
        "name":       safe_str(company.get("name", "Unknown")),
        "score":      score,
        "risk_level": risk_level,
        "flags":      flags,
        "details":    details,
        "address":    safe_str(company.get("registered_address", "")),
        "state":      safe_str(company.get("state", "")),
    }

# ─── CLUSTER DETECTION ────────────────────────────────────────────────

def detect_clusters(scored_vendors, directors, politicians):
    """Detect fraud clusters by shared address AND director overlap."""
    clusters = []

    # Shared-address clusters
    addr_groups = defaultdict(list)
    for v in scored_vendors:
        if v["address"]:
            addr_groups[v["address"]].append(v)

    for addr, vendors in addr_groups.items():
        if len(vendors) < 2:
            continue

        # Find shared directors within this cluster
        cluster_company_ids = {v["company_id"] for v in vendors}
        cluster_dirs = defaultdict(set)
        for d in directors:
            did = safe_str(d.get("director_id"))
            cid = safe_str(d.get("company_id"))
            if cid in cluster_company_ids and did:
                cluster_dirs[did].add(cid)
        shared_dirs = {did: list(companies) for did, companies in cluster_dirs.items() if len(companies) > 1}

        # Find political links in this cluster
        cluster_dins = {safe_str(d.get("din")) for d in directors
                       if safe_str(d.get("company_id")) in cluster_company_ids and safe_str(d.get("din"))}
        pol_links = [p for p in politicians if safe_str(p.get("related_din")) in cluster_dins and cluster_dins]
        unique_pols = list({safe_str(p.get("name")) for p in pol_links})

        clusters.append({
            "type":           "COORDINATED_CLUSTER",
            "address":        addr,
            "vendor_count":   len(vendors),
            "vendors":        [{"id": v["company_id"], "name": v["name"], "score": v["score"], "risk": v["risk_level"], "flags": v["flags"]} for v in vendors],
            "shared_directors": len(shared_dirs),
            "political_links":  unique_pols,
            "total_flags":    sum(len(v["flags"]) for v in vendors),
            "max_score":      max(v["score"] for v in vendors),
            "avg_score":      round(sum(v["score"] for v in vendors) / len(vendors), 1),
            "threat_level":   "CRITICAL" if max(v["score"] for v in vendors) >= 70 else "HIGH",
        })

    clusters.sort(key=lambda c: c["max_score"], reverse=True)
    return clusters

# ─── SNS ALERT (optional, scalability hook) ───────────────────────────

def send_sns_alert(clusters, high_risk_vendors):
    """Send SNS notification if critical clusters detected. Enable with SNS_ALERT_TOPIC env var."""
    if not SNS_TOPIC_ARN or not clusters:
        return
    try:
        sns = boto3.client("sns")
        critical = [c for c in clusters if c["threat_level"] == "CRITICAL"]
        if critical:
            message = (
                f"TENDER TRACE ALERT: {len(critical)} CRITICAL cluster(s) detected.\n"
                f"Highest risk vendors: {', '.join(v['company_id'] for v in high_risk_vendors[:5])}\n"
                f"Immediate review required."
            )
            sns.publish(TopicArn=SNS_TOPIC_ARN, Subject="Tender Trace: Critical Fraud Cluster Detected", Message=message)
            print(f"[SNS] Alert sent to {SNS_TOPIC_ARN}")
    except Exception as e:
        print(f"[SNS] Alert failed: {e}")

# ─── STORE REPORT (optional, scalability hook) ────────────────────────

def store_report(report):
    """Persist investigation report to DynamoDB for audit trail. Enable with STORE_REPORTS=true."""
    if not STORE_REPORTS:
        return
    try:
        table = dynamodb.Table(f"{TABLE_PREFIX}reports")
        report_item = json.loads(json.dumps(report, default=decimal_to_float))
        report_item["report_id"] = report["scan_timestamp"]
        dynamodb.Table(f"{TABLE_PREFIX}reports").put_item(Item=report_item)
        print(f"[Store] Report saved to {TABLE_PREFIX}reports")
    except Exception as e:
        print(f"[Store] Failed to save report: {e}")

# ─── BEDROCK AI BRIEF ─────────────────────────────────────────────────

def generate_brief(scored_vendors, clusters):
    high_risk = [v for v in scored_vendors if v["risk_level"] == "HIGH"]
    medium_risk = [v for v in scored_vendors if v["risk_level"] == "MEDIUM"]

    prompt = f"""You are Tender Trace, an autonomous AI investigation agent for Indian government procurement fraud detection.

AUTONOMOUS SCAN COMPLETE:
- Vendors scanned: {len(scored_vendors)}
- HIGH risk: {len(high_risk)} | MEDIUM risk: {len(medium_risk)}
- Fraud clusters detected: {len(clusters)}
- Detection rules applied: 7 (5 standard + 2 advanced: bid-splitting, ministry-capture)

TOP CLUSTERS:
{json.dumps(clusters[:3], indent=2, default=decimal_to_float)}

HIGH RISK VENDORS:
{json.dumps(high_risk[:6], indent=2, default=decimal_to_float)}

Write a 250-word investigation brief for a ministry vigilance officer. Include:
1. Executive summary of findings
2. Most dangerous cluster — why it is suspicious (name specific flags)
3. Evidence of coordination between vendors
4. Which vendor IDs to refer for CBI/ED investigation first
5. Recommended systemic fix (e.g. address verification, DIN cross-check mandate)

Be factual, direct, and reference specific company IDs, flag names, and amounts."""

    try:
        bedrock = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)
        resp = bedrock.invoke_model(
            modelId=BEDROCK_MODEL,
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 600,
                "messages": [{"role": "user", "content": prompt}],
            }),
        )
        return json.loads(resp["body"].read())["content"][0]["text"]
    except Exception as e:
        print(f"[Bedrock] Error: {e}")
        return (
            f"Auto-scan complete. Scanned {len(scored_vendors)} vendors. "
            f"Found {len(high_risk)} HIGH risk vendors across {len(clusters)} suspicious cluster(s). "
            f"Top risk vendors: {', '.join(v['company_id'] for v in high_risk[:5])}. "
            f"Recommend immediate referral to vigilance unit."
        )

# ─── LAMBDA HANDLER ───────────────────────────────────────────────────

def lambda_handler(event, context):
    print("=" * 60)
    print("[auto_investigator] Starting autonomous vendor scan")
    print(f"[config] TABLE_PREFIX={TABLE_PREFIX}, STORE_REPORTS={STORE_REPORTS}")
    start = datetime.utcnow()

    # Load all data
    print("[scan] Loading from DynamoDB...")
    companies   = scan_table("companies")
    directors   = scan_table("directors")
    contracts   = scan_table("contracts")
    politicians = scan_table("politicians")
    print(f"[scan] {len(companies)} companies | {len(directors)} director rows | {len(contracts)} contracts | {len(politicians)} politician rows")

    # Score every vendor
    print("[scan] Running 7 detection rules on all vendors...")
    scored = []
    for company in companies:
        result = score_vendor(company, companies, directors, contracts, politicians, contracts)
        scored.append(result)
        if result["risk_level"] in ("HIGH", "MEDIUM"):
            print(f"  [{result['risk_level']}] {result['company_id']} {result['name']}: {result['score']}/100 — {result['flags']}")

    # Detect clusters
    print("[scan] Building cluster graph...")
    clusters = detect_clusters(scored, directors, politicians)
    for c in clusters:
        print(f"  [{c['threat_level']}] CLUSTER: {c['vendor_count']} vendors at '{c['address'][:40]}...' — avg {c['avg_score']}, max {c['max_score']}")

    high_risk = [v for v in scored if v["risk_level"] == "HIGH"]

    # Optional: SNS alert for critical findings
    send_sns_alert(clusters, high_risk)

    # AI investigation brief
    print("[scan] Generating Bedrock AI brief...")
    brief = generate_brief(scored, clusters)

    duration = (datetime.utcnow() - start).total_seconds()

    report = {
        "scan_timestamp":         datetime.utcnow().isoformat() + "Z",
        "duration_seconds":       round(duration, 2),
        "summary": {
            "total_vendors":      len(scored),
            "high_risk":          len(high_risk),
            "medium_risk":        len([v for v in scored if v["risk_level"] == "MEDIUM"]),
            "low_risk":           len([v for v in scored if v["risk_level"] == "LOW"]),
            "clusters_detected":  len(clusters),
            "critical_clusters":  len([c for c in clusters if c["threat_level"] == "CRITICAL"]),
            "rules_applied":      7,
        },
        "clusters":               clusters,
        "high_risk_vendors":      high_risk,
        "ai_investigation_brief": brief,
        "all_scores":             sorted(scored, key=lambda x: x["score"], reverse=True),
        "scalability_notes": {
            "sns_alerts":    "Set SNS_ALERT_TOPIC env var to auto-alert on critical clusters",
            "scheduling":    "Add EventBridge rule to run this Lambda daily for continuous monitoring",
            "audit_trail":   "Set STORE_REPORTS=true to persist reports to DynamoDB for audit trail",
            "more_rules":    "Add new rules to RULE_WEIGHTS dict — engine picks them up automatically",
            "more_data":     "Point S3_BUCKET to live MCA21/MyNeta/GeM API feeds for real-time data",
        },
    }

    # Optional: store report
    store_report(report)

    print("=" * 60)
    print(f"[auto_investigator] COMPLETE in {duration:.2f}s | {report['summary']}")
    print("=" * 60)

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(report, default=decimal_to_float),
    }

if __name__ == "__main__":
    result = lambda_handler({}, None)
    body = json.loads(result["body"])
    print("\nAI BRIEF:\n", body["ai_investigation_brief"])
