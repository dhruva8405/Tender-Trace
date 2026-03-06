"""
Lambda: narrator
-----------------
Triggered by: risk_scorer Lambda (synchronous invoke)
Does: Takes risk flags + score → calls Amazon Bedrock Claude → returns plain English narration
On March 7: Calls real Bedrock API
Locally: Uses a template-based fallback (no API key needed until March 7)
"""

import json
import os
import sys

LOCAL_MODE = os.getenv("LOCAL_MODE", "true").lower() == "true"
BEDROCK_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0"

# ─── PROMPT BUILDER ───────────────────────────────────────────────

FLAG_DESCRIPTIONS = {
    "FLAG_NEW_COMPANY":
        "was registered less than 90 days before winning its first government contract",
    "FLAG_SHARED_ADDRESS":
        "shares its registered office address with multiple other contract-winning vendors",
    "FLAG_SHARED_DIRECTOR":
        "shares a common director with one or more competing vendors who also won contracts",
    "FLAG_POLITICAL_LINK":
        "has a director who is a politician or a declared family member of a politician",
    "FLAG_CAPITAL_MISMATCH":
        "has won government contracts totalling more than 30 times its paid-up capital",
}

def build_prompt(vendor_name, score, flags, contract_total_inr, address):
    triggered_descriptions = [FLAG_DESCRIPTIONS[f] for f in flags if f in FLAG_DESCRIPTIONS]
    reasons_text = "; ".join(triggered_descriptions) if triggered_descriptions else "no specific flags"
    risk_level = "HIGH RISK" if score >= 70 else "MEDIUM RISK" if score >= 40 else "LOW RISK"

    return f"""You are Tender Trace, an AI system that analyses Indian government procurement data for fraud indicators.

Vendor: {vendor_name}
Registered address: {address}
Tender Trace risk score: {score}/100 ({risk_level})
Total government contracts won: ₹{contract_total_inr:,.0f}
Red flags detected: {reasons_text}

Write a clear, factual, 3–4 sentence summary of why this vendor has been flagged. 
Write as if explaining to a civil servant, auditor, or investigative journalist. 
Be specific and factual. Do not use dramatic language. End with the risk score and a one-line recommendation.
Do not use bullet points — write in plain prose paragraphs."""

# ─── LOCAL FALLBACK (no Bedrock needed pre-March 7) ───────────────

def narrate_local(vendor_name, score, flags, contract_total_inr, address):
    """Template-based narration for local testing. No API key needed."""
    triggered = [FLAG_DESCRIPTIONS[f] for f in flags if f in FLAG_DESCRIPTIONS]
    risk_level = "HIGH RISK" if score >= 70 else "MEDIUM RISK" if score >= 40 else "LOW RISK"

    if not triggered:
        return (f"{vendor_name} has been assessed by Tender Trace with a score of {score}/100 "
                f"({risk_level}). No significant procurement irregularities were detected "
                f"based on currently available data.")

    reasons = " and ".join(triggered)
    narration = (
        f"{vendor_name}, registered at {address}, has been flagged by Tender Trace with a risk "
        f"score of {score}/100 ({risk_level}). Analysis of government procurement records "
        f"indicates that this vendor {reasons}. "
        f"The total value of government contracts awarded to this vendor amounts to "
        f"₹{contract_total_inr:,.0f}, raising concerns about the legitimacy of the "
        f"procurement process. "
        f"Recommendation: Refer to the concerned ministry's vigilance unit for further "
        f"manual verification before processing future contract awards to this vendor."
    )
    return narration

# ─── REAL BEDROCK CALL (March 7) ──────────────────────────────────

def narrate_bedrock(prompt):
    """Call Amazon Bedrock Claude 3 Haiku. Used only when AWS is available."""
    import boto3
    client = boto3.client("bedrock-runtime", region_name="ap-south-1")

    request_body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 400,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
    }

    response = client.invoke_model(
        modelId=BEDROCK_MODEL_ID,
        body=json.dumps(request_body),
        contentType="application/json",
        accept="application/json",
    )

    result = json.loads(response["body"].read())
    return result["content"][0]["text"].strip()

# ─── LAMBDA HANDLER ───────────────────────────────────────────────

def lambda_handler(event, context):
    """
    Expected event shape:
    {
        "vendor_id": "C001",
        "vendor_name": "Kanpur MediTech Pvt Ltd",
        "score": 84,
        "flags": ["FLAG_SHARED_ADDRESS", "FLAG_SHARED_DIRECTOR", "FLAG_POLITICAL_LINK"],
        "address": "14-A Civil Lines, Kanpur UP 208001",
        "contract_total_inr": 32000000
    }
    """
    vendor_name       = event.get("vendor_name", "Unknown Vendor")
    score             = event.get("score", 0)
    flags             = event.get("flags", [])
    contract_total    = event.get("contract_total_inr", 0)
    address           = event.get("address", "Unknown")
    vendor_id         = event.get("vendor_id", "")

    if LOCAL_MODE:
        narration = narrate_local(vendor_name, score, flags, contract_total, address)
    else:
        prompt    = build_prompt(vendor_name, score, flags, contract_total, address)
        narration = narrate_bedrock(prompt)

    result = {
        "vendor_id":   vendor_id,
        "vendor_name": vendor_name,
        "score":       score,
        "risk_level":  "HIGH" if score >= 70 else "MEDIUM" if score >= 40 else "LOW",
        "flags":       flags,
        "narration":   narration,
        "address":     address,
    }

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(result),
    }

# ─── LOCAL ENTRYPOINT ──────────────────────────────────────────────
if __name__ == "__main__":
    # Test with the Kanpur demo cluster flagship vendor
    test_event = {
        "vendor_id":         "C001",
        "vendor_name":       "Kanpur MediTech Pvt Ltd",
        "score":             84,
        "flags":             ["FLAG_NEW_COMPANY", "FLAG_SHARED_ADDRESS",
                              "FLAG_SHARED_DIRECTOR", "FLAG_POLITICAL_LINK"],
        "address":           "14-A Civil Lines, Kanpur UP 208001",
        "contract_total_inr": 32000000,
    }
    response = lambda_handler(test_event, {})
    body = json.loads(response["body"])
    print("\n=== RISK REPORT ===")
    print(f"Vendor:     {body['vendor_name']}")
    print(f"Score:      {body['score']}/100  [{body['risk_level']}]")
    print(f"Flags:      {', '.join(body['flags'])}")
    print(f"\nNarration:\n{body['narration']}")
