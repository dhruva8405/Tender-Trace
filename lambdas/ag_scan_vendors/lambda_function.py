"""
Action Group Lambda: ag_scan_vendors  (v2 — pre-clustered)
------------------------------------------------------------
Returns vendors PRE-GROUPED by shared address so the agent
only needs to call ag_compute_risk on 5 representative companies,
not all 284. This stops the agent loop runaway.

Response includes:
  - top_clusters: top 5 clusters by size (address → company list)
  - clean_count: number of clean (single-address) vendors
  - total_vendors: total scanned
"""

import json, os, boto3
from decimal import Decimal
from collections import defaultdict

TABLE_PREFIX = os.environ.get("TABLE_PREFIX", "tender-trace-")
TABLE_REGION = os.environ.get("TABLE_REGION", "ap-south-1")
dynamodb     = boto3.resource("dynamodb", region_name=TABLE_REGION)


def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


def lambda_handler(event, context):
    print(f"[ag_scan_vendors] event={json.dumps(event, default=str)}")

    # Scan all companies
    table    = dynamodb.Table(f"{TABLE_PREFIX}companies")
    response = table.scan()
    items    = response["Items"]
    while "LastEvaluatedKey" in response:
        response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
        items.extend(response["Items"])

    # Group companies by registered_address
    addr_map = defaultdict(list)
    for c in items:
        addr = str(c.get("registered_address", "unknown")).strip()
        addr_map[addr].append({
            "company_id":        str(c["company_id"]),
            "name":              str(c.get("name", "")),
            "registration_date": str(c.get("registration_date", "")),
            "paid_up_capital":   float(c.get("paid_up_capital", 0)),
        })

    # Sort clusters by size descending, take top 5 (most suspicious = largest clusters)
    sorted_clusters = sorted(addr_map.items(), key=lambda x: len(x[1]), reverse=True)
    top_clusters = []
    for addr, cos in sorted_clusters[:5]:
        if len(cos) > 1:  # only shared addresses
            top_clusters.append({
                "shared_address":  addr,
                "company_count":   len(cos),
                "company_ids":     [c["company_id"] for c in cos],
                "company_names":   [c["name"] for c in cos[:5]],  # first 5 names
                "sample_company":  cos[0]["company_id"],  # one to pass to compute_risk
            })

    clean_count = sum(1 for cos in addr_map.values() if len(cos) == 1)

    result = {
        "total_vendors":   len(items),
        "cluster_count":   len([a for a in addr_map.values() if len(a) > 1]),
        "clean_vendors":   clean_count,
        "top_clusters":    top_clusters,
        "instruction":     (
            "IMPORTANT: Call compute_risk ONLY on the sample_company from each cluster above. "
            "That is at most 5 calls. Do NOT compute risk for all companies. "
            "After scoring the top clusters, call save_report and return your findings."
        ),
    }

    print(f"[ag_scan_vendors] {len(items)} vendors, {len(top_clusters)} top clusters")
    return {
        "messageVersion": "1.0",
        "response": {
            "actionGroup": event.get("actionGroup", "ag_scan_vendors"),
            "function":    event.get("function", "scan_vendors"),
            "functionResponse": {
                "responseBody": {
                    "TEXT": {
                        "body": json.dumps(result, default=decimal_default)
                    }
                }
            }
        }
    }
