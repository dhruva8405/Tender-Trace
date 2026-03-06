"""
invoke_agent Lambda
--------------------
Thin wrapper called by API Gateway POST /agent
Invokes the Bedrock Agent and streams the response back.

Env vars to set in Lambda console:
  AGENT_ID       = your Bedrock Agent ID  (e.g. ABCDEF1234)
  AGENT_ALIAS_ID = your Agent Alias ID    (e.g. TSTALIASID or the live alias)
  AWS_REGION_AG  = us-east-1  (Bedrock Agents only in us-east-1)

How to find AGENT_ID:
  Bedrock Console → Agents → TenderTraceAgent → Agent ID (top of page)
How to find AGENT_ALIAS_ID:
  Bedrock Console → Agents → TenderTraceAgent → Aliases → copy Alias ID
"""

import json
import os
import boto3
import uuid

AGENT_ID       = os.environ.get("AGENT_ID", "")
AGENT_ALIAS_ID = os.environ.get("AGENT_ALIAS_ID", "TSTALIASID")   # TSTALIASID = Draft, use your live alias
REGION         = os.environ.get("AWS_REGION_AG", "us-east-1")

bedrock_agent_rt = boto3.client("bedrock-agent-runtime", region_name=REGION)


def lambda_handler(event, context):
    # Support both direct invoke and API Gateway
    if isinstance(event.get("body"), str):
        body = json.loads(event["body"])
    elif isinstance(event.get("body"), dict):
        body = event["body"]
    else:
        body = event

    user_query   = body.get("query", "Run a full fraud investigation on all procurement data")
    session_id   = body.get("session_id", str(uuid.uuid4()))

    if not AGENT_ID:
        return _resp(400, {"error": "AGENT_ID environment variable not set. Go to Lambda console → Configuration → Env vars."})

    print(f"[invoke_agent] Invoking agent {AGENT_ID}/{AGENT_ALIAS_ID} | session={session_id}")
    print(f"[invoke_agent] Query: {user_query}")

    try:
        response = bedrock_agent_rt.invoke_agent(
            agentId=AGENT_ID,
            agentAliasId=AGENT_ALIAS_ID,
            sessionId=session_id,
            inputText=user_query,
            enableTrace=True,      # ← shows reasoning steps to frontend
        )

        # Collect streamed response chunks
        completion_text = ""
        trace_steps = []

        for event_chunk in response.get("completion", []):
            # Text chunks
            if "chunk" in event_chunk:
                chunk_bytes = event_chunk["chunk"].get("bytes", b"")
                completion_text += chunk_bytes.decode("utf-8", errors="replace")

            # Reasoning trace steps
            if "trace" in event_chunk:
                trace = event_chunk["trace"].get("trace", {})
                if "orchestrationTrace" in trace:
                    orch = trace["orchestrationTrace"]
                    if "rationale" in orch:
                        trace_steps.append({
                            "type": "reasoning",
                            "text": orch["rationale"].get("text", ""),
                        })
                    if "invocationInput" in orch:
                        inp = orch["invocationInput"]
                        if "actionGroupInvocationInput" in inp:
                            ag = inp["actionGroupInvocationInput"]
                            trace_steps.append({
                                "type": "tool_call",
                                "action_group": ag.get("actionGroupName", ""),
                                "function": ag.get("function", ""),
                                "parameters": ag.get("parameters", []),
                            })
                    if "observation" in orch:
                        obs = orch["observation"]
                        if "actionGroupInvocationOutput" in obs:
                            trace_steps.append({
                                "type": "observation",
                                "text": obs["actionGroupInvocationOutput"].get("text", ""),
                            })

        result = {
            "session_id":    session_id,
            "response":      completion_text,
            "trace_steps":   trace_steps,
            "agent_id":      AGENT_ID,
            "alias_id":      AGENT_ALIAS_ID,
        }

        print(f"[invoke_agent] Done. {len(trace_steps)} trace steps.")
        return _resp(200, result)

    except bedrock_agent_rt.exceptions.ResourceNotFoundException:
        return _resp(404, {"error": f"Agent {AGENT_ID} not found. Check AGENT_ID env var and region ({REGION})."})
    except bedrock_agent_rt.exceptions.AccessDeniedException as e:
        return _resp(403, {"error": f"Access denied: {str(e)}. Check IAM role has bedrock:InvokeAgent permission."})
    except Exception as e:
        print(f"[invoke_agent] ERROR: {e}")
        return _resp(500, {"error": str(e)})


def _resp(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        "body": json.dumps(body, default=str),
    }
