"""
Lambda: risk_scorer
--------------------
Triggered by: GET /vendor?id=C001  via API Gateway
Does: Runs all 5 red-flag rules, returns score 0-100 + flag list

DYNAMODB_MODE (default): Reads from DynamoDB tables
LOCAL_MODE=true:          Reads from local CSV files (no AWS needed)
"""

import json
import os
import sys
import csv
from datetime import datetime
import boto3
from boto3.dynamodb.conditions import Key, Attr

# ─── CONFIG ───────────────────────────────────────────────────────────
LOCAL_MODE   = os.getenv("LOCAL_MODE", "false").lower() == "true"
TABLE_PREFIX = os.getenv("TABLE_PREFIX", "tender-trace-")
DATA_DIR     = os.path.join(os.path.dirname(__file__), "../../data")

# ─── RULE WEIGHTS ─────────────────────────────────────────────────────
RULE_WEIGHTS = {
    "FLAG_NEW_COMPANY":      20,   # registered < 90 days before first contract
    "FLAG_SHARED_ADDRESS":   20,   # same address as other winning vendors
    "FLAG_SHARED_DIRECTOR":  25,   # director shared with a competitor
    "FLAG_POLITICAL_LINK":   25,   # director linked to politician family
    "FLAG_CAPITAL_MISMATCH": 10,   # contracts > 30x paid-up capital
}

# ─── CSV HELPERS (local mode) ─────────────────────────────────────────
def read_csv(filename):
    with open(os.path.join(DATA_DIR, filename), newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

# ─── DYNAMODB HELPERS ─────────────────────────────────────────────────
def get_dynamo():
    return boto3.resource("dynamodb", region_name="us-east-1")

def dynamo_get_all(table_name):
    db    = get_dynamo()
    table = db.Table(f"{TABLE_PREFIX}{table_name}")
    result = []
    resp   = table.scan()
    result.extend(resp["Items"])
    while "LastEvaluatedKey" in resp:
        resp = table.scan(ExclusiveStartKey=resp["LastEvaluatedKey"])
        result.extend(resp["Items"])
    return result

# ─── THE 5 RED FLAG RULES ─────────────────────────────────────────────

def rule_new_company(company, contracts):
    """Rule 1: Registered < 90 days before first contract win."""
    vendor_contracts = [c for c in contracts if c["company_id"] == company["company_id"]]
    if not vendor_contracts:
        return False, None
    first_award = min(datetime.strptime(c["award_date"], "%Y-%m-%d") for c in vendor_contracts)
    reg_date    = datetime.strptime(company["registration_date"], "%Y-%m-%d")
    days_diff   = (first_award - reg_date).days
    triggered   = days_diff < 90
    detail = f"Registered {days_diff} days before first contract (threshold: 90 days)"
    return triggered, detail

def rule_shared_address(company, all_companies):
    """Rule 2: Same registered address as other vendors."""
    same_addr = [c for c in all_companies
                 if c["registered_address"] == company["registered_address"]
                 and c["company_id"] != company["company_id"]]
    triggered = len(same_addr) > 0
    detail = f"Shares address with {len(same_addr)} other vendor(s): {[c['name'] for c in same_addr]}"
    return triggered, detail

def rule_shared_director(company, all_directors):
    """Rule 3: Director also sits on another winning vendor."""
    my_director_ids = {d["director_id"] for d in all_directors
                       if d["company_id"] == company["company_id"]}
    overlaps = []
    for d in all_directors:
        if d["director_id"] in my_director_ids and d["company_id"] != company["company_id"]:
            overlaps.append(f"{d['name']} (also in company {d['company_id']})")
    triggered = len(overlaps) > 0
    detail = f"Shared directors: {overlaps}" if triggered else None
    return triggered, detail

def rule_political_link(company, all_directors, politicians):
    """Rule 4: A director matches a politician's declared family member (DIN match)."""
    my_directors = [d for d in all_directors if d["company_id"] == company["company_id"]]
    my_dins = {d.get("din", "").strip() for d in my_directors if d.get("din")}
    links = []
    for p in politicians:
        related_din = p.get("related_din", "").strip()
        if related_din and related_din in my_dins:
            links.append(
                f"{p['related_name']} ({p['relation']} of MLA {p['name']}, {p['party']}, {p['constituency']})"
            )
    triggered = len(links) > 0
    detail = f"Political links found: {links}" if triggered else None
    return triggered, detail

def rule_capital_mismatch(company, contracts):
    """Rule 5: Total contracts > 30x paid-up capital."""
    vendor_contracts = [c for c in contracts if c["company_id"] == company["company_id"]]
    total_value = sum(float(c["value_inr"]) for c in vendor_contracts)
    paid_up_cap = float(company["paid_up_capital"])
    if paid_up_cap <= 0:
        return False, None
    ratio     = total_value / paid_up_cap
    triggered = ratio > 30
    detail = (f"Contracts Rs.{total_value:,.0f} = {ratio:.1f}x paid-up capital "
              f"Rs.{paid_up_cap:,.0f} (threshold: 30x)")
    return triggered, detail

# ─── SCORE ENGINE ─────────────────────────────────────────────────────

def score_vendor(vendor_id, companies, directors, contracts, politicians):
    """Run all 5 rules. Works for both local CSV and DynamoDB data."""
    company_list = [c for c in companies if c["company_id"] == vendor_id]
    if not company_list:
        return {"error": f"Vendor {vendor_id} not found"}
    company = company_list[0]

    flags  = []
    score  = 0
    report = []

    checks = [
        ("FLAG_NEW_COMPANY",      rule_new_company(company, contracts)),
        ("FLAG_SHARED_ADDRESS",   rule_shared_address(company, companies)),
        ("FLAG_SHARED_DIRECTOR",  rule_shared_director(company, directors)),
        ("FLAG_POLITICAL_LINK",   rule_political_link(company, directors, politicians)),
        ("FLAG_CAPITAL_MISMATCH", rule_capital_mismatch(company, contracts)),
    ]

    for flag_name, (triggered, detail) in checks:
        if triggered:
            flags.append(flag_name)
            score += RULE_WEIGHTS[flag_name]
            report.append({"flag": flag_name, "weight": RULE_WEIGHTS[flag_name], "detail": detail})

    score      = min(score, 100)
    risk_level = "HIGH" if score >= 61 else "MEDIUM" if score >= 31 else "LOW"

    return {
        "vendor_id":   vendor_id,
        "vendor_name": company["name"],
        "score":       score,
        "risk_level":  risk_level,
        "flags":       flags,
        "report":      report,
        "address":     company["registered_address"],
        "registered":  company["registration_date"],
        "paid_up_cap": company["paid_up_capital"],
    }

# ─── LAMBDA HANDLER ───────────────────────────────────────────────────

def lambda_handler(event, context):
    # Support both ?id=C001 query string and path param
    qsp       = event.get("queryStringParameters") or {}
    vendor_id = qsp.get("id") or (event.get("pathParameters") or {}).get("id") or event.get("vendor_id")

    if not vendor_id:
        return {"statusCode": 400, "body": json.dumps({"error": "vendor_id required. Use ?id=C001"})}

    if LOCAL_MODE:
        companies   = read_csv("companies.csv")
        directors   = read_csv("directors.csv")
        contracts   = read_csv("contracts.csv")
        politicians = read_csv("politicians.csv")
    else:
        # DynamoDB mode (production path)
        companies   = dynamo_get_all("companies")
        directors   = dynamo_get_all("directors")
        contracts   = dynamo_get_all("contracts")
        politicians = dynamo_get_all("politicians")

    result = score_vendor(vendor_id, companies, directors, contracts, politicians)

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
        },
        "body": json.dumps(result),
    }

# ─── LOCAL ENTRYPOINT ──────────────────────────────────────────────────
if __name__ == "__main__":
    vendor_id = sys.argv[1] if len(sys.argv) > 1 else "C001"
    os.environ["LOCAL_MODE"] = "true"
    result = lambda_handler({"queryStringParameters": {"id": vendor_id}}, None)
    print(json.dumps(json.loads(result["body"]), indent=2))
