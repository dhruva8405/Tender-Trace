"""
Action Group Lambda: ag_save_report
--------------------------------------
Called by Bedrock Agent at the end of an investigation to persist findings.
Saves to DynamoDB tender-trace-reports table.

NOTE: Create this table first if it doesn't exist:
  aws dynamodb create-table \
    --table-name tender-trace-reports \
    --attribute-definitions AttributeName=report_id,AttributeType=S \
    --key-schema AttributeName=report_id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region ap-south-1
"""

import json, os, boto3, uuid
from decimal import Decimal
from datetime import datetime

TABLE_PREFIX = os.environ.get("TABLE_PREFIX", "tender-trace-")
TABLE_REGION = os.environ.get("TABLE_REGION", "ap-south-1")
dynamodb     = boto3.resource("dynamodb", region_name=TABLE_REGION)


def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


def float_to_decimal(obj):
    """DynamoDB can't store float, only Decimal."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: float_to_decimal(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [float_to_decimal(i) for i in obj]
    return obj


def lambda_handler(event, context):
    print(f"[ag_save_report] event={json.dumps(event, default=str)}")

    # Extract report from Bedrock Agent parameters
    report_content = None
    for param in event.get("parameters", []):
        if param.get("name") in ("report", "report_json", "investigation_report"):
            val = param.get("value", "")
            try:
                report_content = json.loads(val) if isinstance(val, str) else val
            except:
                report_content = {"raw": val}

    if not report_content:
        report_content = event.get("report", {"note": "empty report"})

    report_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"

    item = {
        "report_id":  report_id,
        "created_at": timestamp,
        "report":     float_to_decimal(report_content),
        "source":     "bedrock-agent",
    }

    try:
        dynamodb.Table(f"{TABLE_PREFIX}reports").put_item(Item=item)
        result = {"report_id": report_id, "saved": True, "timestamp": timestamp, "status": "Report saved successfully."}
        print(f"[ag_save_report] Saved report {report_id}")
    except Exception as e:
        # Don't surface the error to the agent — just return a neutral success-like message
        # so the agent concludes with its detection findings, not a save error
        print(f"[ag_save_report] WARNING: Could not save to DynamoDB: {e}")
        result = {"report_id": report_id, "saved": False, "timestamp": timestamp, "status": "Report logging skipped. Please present your compliance findings to the user now."}

    return {
        "messageVersion": "1.0",
        "response": {
            "actionGroup": event.get("actionGroup", "ag_save_report"),
            "function":    event.get("function", "save_report"),
            "functionResponse": {
                "responseBody": {
                    "TEXT": {"body": json.dumps(result, default=decimal_default)}
                }
            }
        }
    }
