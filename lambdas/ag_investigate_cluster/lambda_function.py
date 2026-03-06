"""
Action Group Lambda: ag_investigate_cluster
--------------------------------------------
Called by Bedrock Agent to deep-dive one cluster (shared address).
Returns directors, politician links, contracts, total value.

Bedrock Agent calls this after identifying a suspicious address cluster.
"""

import json, os, boto3
from decimal import Decimal

TABLE_PREFIX = os.environ.get("TABLE_PREFIX", "tender-trace-")
TABLE_REGION = os.environ.get("TABLE_REGION", "ap-south-1")
dynamodb     = boto3.resource("dynamodb", region_name=TABLE_REGION)


def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


def scan_with_filter(table_name, filter_key, filter_values):
    """Scan a table and return items where filter_key is in filter_values."""
    table  = dynamodb.Table(f"{TABLE_PREFIX}{table_name}")
    result = []
    resp   = table.scan()
    result.extend(resp["Items"])
    while "LastEvaluatedKey" in resp:
        resp = table.scan(ExclusiveStartKey=resp["LastEvaluatedKey"])
        result.extend(resp["Items"])
    return [item for item in result if str(item.get(filter_key, "")) in filter_values]


def lambda_handler(event, context):
    print(f"[ag_investigate_cluster] event={json.dumps(event, default=str)}")

    # Get address parameter from Bedrock Agent
    address     = None
    company_ids = []
    for param in event.get("parameters", []):
        if param.get("name") == "address":
            address = param.get("value")
        if param.get("name") == "company_ids":
            # comma-separated list
            company_ids = [c.strip() for c in str(param.get("value", "")).split(",") if c.strip()]

    # If address given, find all companies at that address
    if address and not company_ids:
        co_table = dynamodb.Table(f"{TABLE_PREFIX}companies")
        resp     = co_table.scan()
        all_cos  = resp["Items"]
        while "LastEvaluatedKey" in resp:
            resp = co_table.scan(ExclusiveStartKey=resp["LastEvaluatedKey"])
            all_cos.extend(resp["Items"])
        company_ids = [str(c["company_id"]) for c in all_cos
                       if str(c.get("registered_address", "")).strip() == address.strip()]

    if not company_ids:
        return _ag_response(event, {"error": "No companies found for given address or company_ids"})

    # Look up directors for these companies
    directors  = scan_with_filter("directors",  "company_id", set(company_ids))
    contracts  = scan_with_filter("contracts",  "company_id", set(company_ids))
    politicians= []
    director_dins = {str(d.get("din", "")) for d in directors if d.get("din")}
    if director_dins:
        all_pols = dynamodb.Table(f"{TABLE_PREFIX}politicians").scan()["Items"]
        politicians = [p for p in all_pols if str(p.get("related_din", "")) in director_dins]

    total_contract_value = sum(float(c.get("value_inr", 0)) for c in contracts)

    result = {
        "cluster_address":      address or "multiple",
        "company_ids":          company_ids,
        "company_count":        len(company_ids),
        "director_rows":        len(directors),
        "unique_directors":     len({str(d.get("director_id")) for d in directors}),
        "political_links":      len(politicians),
        "total_contract_value": total_contract_value,
        "directors":  [{"director_id": str(d.get("director_id")), "name": str(d.get("name","")), "din": str(d.get("din","")), "company_id": str(d.get("company_id",""))} for d in directors],
        "politicians":[{"politician_id": str(p.get("politician_id")), "name": str(p.get("name","")), "party": str(p.get("party","")), "relation": str(p.get("relation","")), "related_din": str(p.get("related_din",""))} for p in politicians],
        # contracts summary: contract_id, company_id, value_inr, award_date, ministry, state
        "contracts":  [{"contract_id": str(c.get("contract_id")), "company_id": str(c.get("company_id")), "value_inr": float(c.get("value_inr",0)), "award_date": str(c.get("award_date","")), "ministry": str(c.get("ministry","")), "state": str(c.get("state",""))} for c in contracts],
    }

    return _ag_response(event, result)


def _ag_response(event, result):
    return {
        "messageVersion": "1.0",
        "response": {
            "actionGroup": event.get("actionGroup", "ag_investigate_cluster"),
            "function":    event.get("function", "investigate_cluster"),
            "functionResponse": {
                "responseBody": {
                    "TEXT": {
                        "body": json.dumps(result, default=decimal_default)
                    }
                }
            }
        }
    }
