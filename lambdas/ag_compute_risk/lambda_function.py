"""
Action Group Lambda: ag_compute_risk
--------------------------------------
Called by Bedrock Agent to compute a 7-rule risk score for one company.
Uses correct DynamoDB attribute names: value_inr, company_id, director_id, din, related_din.

Bedrock Agent calls this after identifying suspicious companies in a cluster.
"""

import json, os, boto3
from decimal import Decimal
from datetime import datetime

TABLE_PREFIX = os.environ.get("TABLE_PREFIX", "tender-trace-")
TABLE_REGION = os.environ.get("TABLE_REGION", "ap-south-1")
dynamodb     = boto3.resource("dynamodb", region_name=TABLE_REGION)

RULE_WEIGHTS = {
    "FLAG_NEW_COMPANY":       20,
    "FLAG_SHARED_ADDRESS":    20,
    "FLAG_SHARED_DIRECTOR":   25,
    "FLAG_POLITICAL_LINK":    25,
    "FLAG_CAPITAL_MISMATCH":  10,
    "FLAG_CONTRACT_SPLITTING":15,
    "FLAG_MINISTRY_LOCK":     10,
}

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def safe_str(v):
    return "" if v is None else str(v).strip()

def safe_float(v):
    try: return float(v)
    except: return 0.0


def lambda_handler(event, context):
    print(f"[ag_compute_risk] event={json.dumps(event, default=str)}")

    # Extract company_id from Bedrock Agent parameters
    company_id = None
    for param in event.get("parameters", []):
        if param.get("name") in ("company_id", "companyId"):
            company_id = str(param.get("value", "")).strip()
    # Also try top-level (direct test invocation)
    if not company_id:
        company_id = str(event.get("company_id", "")).strip()

    if not company_id:
        return _ag_response(event, {"error": "company_id parameter required"})

    # Load company
    co_resp = dynamodb.Table(f"{TABLE_PREFIX}companies").get_item(Key={"company_id": company_id})
    company = co_resp.get("Item")
    if not company:
        return _ag_response(event, {"error": f"Company {company_id} not found"})

    # Load all companies (for shared address check)
    all_cos_resp = dynamodb.Table(f"{TABLE_PREFIX}companies").scan()
    all_cos = all_cos_resp["Items"]

    # Load directors
    dirs_resp = dynamodb.Table(f"{TABLE_PREFIX}directors").scan()
    all_dirs  = dirs_resp["Items"]

    # Load contracts
    cons_resp = dynamodb.Table(f"{TABLE_PREFIX}contracts").scan()
    all_cons  = cons_resp["Items"]

    # Load politicians
    pols_resp = dynamodb.Table(f"{TABLE_PREFIX}politicians").scan()
    all_pols  = pols_resp["Items"]

    my_contracts = [c for c in all_cons if safe_str(c.get("company_id")) == company_id]
    my_dirs      = [d for d in all_dirs  if safe_str(d.get("company_id")) == company_id]
    my_dins      = {safe_str(d.get("din")) for d in my_dirs if safe_str(d.get("din"))}
    my_dir_ids   = {safe_str(d.get("director_id")) for d in my_dirs}
    my_addr      = safe_str(company.get("registered_address"))

    flags, details = [], []
    score = 0

    # Rule 1: NEW COMPANY
    if my_contracts:
        try:
            first_award = min(datetime.strptime(safe_str(c["award_date"]), "%Y-%m-%d") for c in my_contracts)
            reg_date    = datetime.strptime(safe_str(company["registration_date"]), "%Y-%m-%d")
            days = (first_award - reg_date).days
            if days < 90:
                flags.append("FLAG_NEW_COMPANY")
                score += RULE_WEIGHTS["FLAG_NEW_COMPANY"]
                details.append(f"Registered {days} days before first contract")
        except: pass

    # Rule 2: SHARED ADDRESS
    same_addr = [c for c in all_cos if safe_str(c.get("registered_address")) == my_addr and c["company_id"] != company_id]
    if same_addr:
        flags.append("FLAG_SHARED_ADDRESS")
        score += RULE_WEIGHTS["FLAG_SHARED_ADDRESS"]
        details.append(f"Shares address with {len(same_addr)} other vendor(s)")

    # Rule 3: SHARED DIRECTOR
    overlaps = [d for d in all_dirs if safe_str(d.get("director_id")) in my_dir_ids and safe_str(d.get("company_id")) != company_id]
    if overlaps:
        flags.append("FLAG_SHARED_DIRECTOR")
        score += RULE_WEIGHTS["FLAG_SHARED_DIRECTOR"]
        details.append(f"Director(s) also on {len({safe_str(d['company_id']) for d in overlaps})} other vendor(s)")

    # Rule 4: POLITICAL LINK (match by related_din)
    pol_links = [p for p in all_pols if safe_str(p.get("related_din")) in my_dins and my_dins]
    if pol_links:
        p = pol_links[0]
        flags.append("FLAG_POLITICAL_LINK")
        score += RULE_WEIGHTS["FLAG_POLITICAL_LINK"]
        details.append(f"Director is {safe_str(p.get('relation'))} of {safe_str(p.get('name'))} ({safe_str(p.get('party'))})")

    # Rule 5: CAPITAL MISMATCH (use value_inr)
    total_contracts = sum(safe_float(c.get("value_inr", 0)) for c in my_contracts)
    capital = safe_float(company.get("paid_up_capital", 1))
    if capital > 0 and total_contracts / capital > 30:
        flags.append("FLAG_CAPITAL_MISMATCH")
        score += RULE_WEIGHTS["FLAG_CAPITAL_MISMATCH"]
        details.append(f"Contracts = {total_contracts/capital:.1f}× capital")

    # Rule 6: CONTRACT SPLITTING
    if len(my_contracts) >= 2:
        try:
            dates = sorted(datetime.strptime(safe_str(c["award_date"]), "%Y-%m-%d") for c in my_contracts)
            span  = (dates[-1] - dates[0]).days
            if span < 90:
                flags.append("FLAG_CONTRACT_SPLITTING")
                score += RULE_WEIGHTS["FLAG_CONTRACT_SPLITTING"]
                details.append(f"{len(my_contracts)} contracts in {span} days (bid splitting)")
        except: pass

    # Rule 7: MINISTRY LOCK
    ministries = [safe_str(c.get("ministry")) for c in my_contracts if c.get("ministry")]
    if ministries:
        dominant = max(set(ministries), key=ministries.count)
        pct = ministries.count(dominant) / len(ministries) * 100
        if pct == 100 and len(ministries) >= 2:
            flags.append("FLAG_MINISTRY_LOCK")
            score += RULE_WEIGHTS["FLAG_MINISTRY_LOCK"]
            details.append(f"100% of contracts from {dominant}")

    score      = min(score, 100)
    risk_level = "HIGH" if score >= 61 else "MEDIUM" if score >= 31 else "LOW"

    result = {
        "company_id":       company_id,
        "name":             safe_str(company.get("name")),
        "score":            score,
        "risk_level":       risk_level,
        "flags":            flags,
        "details":          details,
        "contract_count":   len(my_contracts),
        "total_value_inr":  total_contracts,
        "paid_up_capital":  capital,
    }

    print(f"[ag_compute_risk] {company_id}: {risk_level} {score}/100 flags={flags}")
    return _ag_response(event, result)


def _ag_response(event, result):
    return {
        "messageVersion": "1.0",
        "response": {
            "actionGroup": event.get("actionGroup", "ag_compute_risk"),
            "function":    event.get("function", "compute_risk"),
            "functionResponse": {
                "responseBody": {
                    "TEXT": {"body": json.dumps(result, default=decimal_default)}
                }
            }
        }
    }
