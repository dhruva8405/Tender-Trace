# TenderTrace — Learner Lab Deployment Guide
> **Goal:** Full working deployment in < 3 hours using AWS Academy Learner Lab.
> **Region:** `us-east-1` only (Learner Labs restriction)
> **No Bedrock, No Amplify** — uses S3 static hosting + mock AI fallback

---

## Prerequisites (before lab starts)
- [ ] GitHub repo: `https://github.com/dhruva8405/Tender-Trace` (code is ready)
- [ ] GitHub PAT with `repo` scope — generate at github.com/settings/tokens

---

## Phase 1 — Account Setup (2 min)

1. Start Learner Lab → click **AWS** to open console
2. Open **CloudShell** (top-right `>_` icon) — ALL commands run here
3. Set variables:

```bash
export ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export REGION="us-east-1"
export ROLE_ARN="arn:aws:iam::${ACCOUNT}:role/LabRole"
echo "Account: $ACCOUNT | Role: $ROLE_ARN"
```

> ✅ **No IAM creation needed** — `LabRole` is pre-created in every Learner Lab account.

---

## Phase 2 — Clone Repo (2 min)

```bash
cd /tmp
git clone https://ghp_YOURPAT@github.com/dhruva8405/Tender-Trace.git tt
cd tt
echo "Repo cloned!"
ls
```

---

## Phase 3 — DynamoDB Tables (5 min)

```bash
# Vendors table
aws dynamodb create-table \
  --table-name vendors \
  --attribute-definitions AttributeName=vendor_id,AttributeType=S \
  --key-schema AttributeName=vendor_id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION

# Reports table
aws dynamodb create-table \
  --table-name reports \
  --attribute-definitions AttributeName=report_id,AttributeType=S \
  --key-schema AttributeName=report_id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION

echo "Tables created!"
```

---

## Phase 4 — Upload Vendor Data (5 min)

Run this Python script directly in CloudShell (no local machine needed):

```bash
cd /tmp/tt
python3 << 'EOF'
import json, boto3, decimal

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('vendors')

with open('data/vendors.json') as f:
    vendors = json.load(f)

def fix(obj):
    if isinstance(obj, float): return decimal.Decimal(str(obj))
    if isinstance(obj, dict): return {k: fix(v) for k, v in obj.items()}
    if isinstance(obj, list): return [fix(i) for i in obj]
    return obj

with table.batch_writer() as batch:
    for v in vendors:
        batch.put_item(Item=fix(v))

print(f"Uploaded {len(vendors)} vendors to DynamoDB!")
EOF
```

Verify:
```bash
aws dynamodb scan --table-name vendors --region $REGION --select COUNT
# Should show Count: 20
```

---

## Phase 5 — Lambda Functions (15 min)

> All lambdas use the pre-existing **LabRole**.

### 5a. Deploy all at once (run this full block):
```bash
cd /tmp/tt

for fn in ag_scan_vendors ag_investigate_cluster ag_compute_risk ag_save_report; do
  name="${fn#ag_}"
  dir="lambdas/${fn}"
  echo "Deploying: $name from $dir"
  cd /tmp/tt/$dir
  zip -r function.zip lambda_function.py 2>/dev/null || zip -r function.zip . -i "*.py"
  aws lambda create-function \
    --function-name $name \
    --runtime python3.12 \
    --role $ROLE_ARN \
    --handler lambda_function.lambda_handler \
    --zip-file fileb://function.zip \
    --timeout 30 \
    --region $REGION 2>/dev/null || \
  aws lambda update-function-code \
    --function-name $name \
    --zip-file fileb://function.zip \
    --region $REGION
  echo "Done: $name"
done
```

### 5b. Deploy investigate lambda (needs bundled deps):
```bash
cd /tmp/tt/lambdas/investigate

# Bundle with dependencies
pip3 install boto3 -t package/ -q
cp lambda_function.py package/
cd package && zip -r ../function.zip . -q && cd ..

aws lambda create-function \
  --function-name investigate \
  --runtime python3.12 \
  --role $ROLE_ARN \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://function.zip \
  --timeout 90 \
  --region $REGION 2>/dev/null || \
aws lambda update-function-code \
  --function-name investigate \
  --zip-file fileb://function.zip \
  --region $REGION

echo "investigate deployed!"
```

### 5c. Set environment variables on lambdas:
```bash
# Update all lambdas with region
for fn in scan_vendors investigate_cluster compute_risk save_report investigate; do
  aws lambda update-function-configuration \
    --function-name $fn \
    --environment Variables="{DYNAMODB_REGION=us-east-1,AWS_DEFAULT_REGION=us-east-1}" \
    --region $REGION 2>/dev/null
  echo "Env set: $fn"
done
```

> ⚠️ **No invoke_agent Lambda needed** — Bedrock is not available in Learner Labs.
> The frontend AI Agent will use **mock mode** automatically.

---

## Phase 6 — API Gateway (10 min)

### 6a. investigate API (REST):
```bash
API_ID=$(aws apigateway create-rest-api \
  --name "tender-trace-api" \
  --region $REGION \
  --query "id" --output text)

ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --region $REGION \
  --query "items[0].id" --output text)

RES_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part investigate \
  --region $REGION \
  --query "id" --output text)

LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT}:function:investigate"

aws apigateway put-method --rest-api-id $API_ID \
  --resource-id $RES_ID --http-method GET \
  --authorization-type NONE --region $REGION

aws apigateway put-method-response --rest-api-id $API_ID \
  --resource-id $RES_ID --http-method GET \
  --status-code 200 \
  --response-parameters '{"method.response.header.Access-Control-Allow-Origin":false}' \
  --region $REGION

aws apigateway put-integration --rest-api-id $API_ID \
  --resource-id $RES_ID --http-method GET --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" \
  --region $REGION

aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region $REGION

aws lambda add-permission \
  --function-name investigate \
  --statement-id apigateway-get \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --region $REGION

INVESTIGATE_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod/investigate"
echo "Investigate API: $INVESTIGATE_URL"
```

### 6b. Enable CORS on investigate:
```bash
# OPTIONS method for CORS preflight
aws apigateway put-method --rest-api-id $API_ID \
  --resource-id $RES_ID --http-method OPTIONS \
  --authorization-type NONE --region $REGION

aws apigateway put-integration --rest-api-id $API_ID \
  --resource-id $RES_ID --http-method OPTIONS --type MOCK \
  --request-templates '{"application/json":"{\"statusCode\":200}"}' \
  --region $REGION

aws apigateway put-method-response --rest-api-id $API_ID \
  --resource-id $RES_ID --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Methods":false,"method.response.header.Access-Control-Allow-Origin":false}' \
  --region $REGION

aws apigateway put-integration-response --rest-api-id $API_ID \
  --resource-id $RES_ID --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'"'"'Content-Type'"'"'","method.response.header.Access-Control-Allow-Methods":"'"'"'GET,OPTIONS'"'"'","method.response.header.Access-Control-Allow-Origin":"'"'"'*'"'"'"}' \
  --region $REGION

aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region $REGION

echo "CORS enabled!"
```

**Save this URL:**
```bash
echo "INVESTIGATE_URL=$INVESTIGATE_URL"
```

---

## Phase 7 — Update Frontend API URL (5 min)

```bash
cd /tmp/tt
git config user.email "dhruva8405@gmail.com"
git config user.name "dhruva8405"

REST_API_ID="$API_ID"   # already set from Phase 6

cat > frontend/src/api.js << EOF
const API_BASE = import.meta.env.VITE_API_URL || "https://${REST_API_ID}.execute-api.us-east-1.amazonaws.com/prod";

export async function fetchInvestigation() {
  const r = await fetch(API_BASE + '/investigate');
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

export async function fetchVendorRisk(id) {
  try {
    const r = await fetch(API_BASE + '/vendor?id=' + id);
    if (!r.ok) throw new Error(r.status);
    return r.json();
  } catch { return null; }
}

export async function fetchAgentQuery(q, sid) {
  // Bedrock not available in Learner Labs - frontend uses mock mode
  throw new Error('MOCK_MODE');
}
EOF

git add frontend/src/api.js
git commit -m "deploy: update API URL for Learner Lab (us-east-1)"
git push https://ghp_YOURPAT@github.com/dhruva8405/Tender-Trace.git main
```

---

## Phase 8 — Build & Deploy Frontend to S3 (10 min)

```bash
# Build the React app
cd /tmp/tt/frontend
npm install --legacy-peer-deps
VITE_API_URL="https://${API_ID}.execute-api.us-east-1.amazonaws.com/prod" npm run build

echo "Build complete!"
ls dist/
```

```bash
# Create S3 bucket for static hosting
BUCKET="tender-trace-${ACCOUNT}"
aws s3 mb s3://$BUCKET --region $REGION

# Enable static website hosting
aws s3 website s3://$BUCKET \
  --index-document index.html \
  --error-document index.html

# Disable block public access
aws s3api put-public-access-block \
  --bucket $BUCKET \
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Set bucket policy for public read
aws s3api put-bucket-policy --bucket $BUCKET --policy "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Sid\": \"PublicRead\",
    \"Effect\": \"Allow\",
    \"Principal\": \"*\",
    \"Action\": \"s3:GetObject\",
    \"Resource\": \"arn:aws:s3:::${BUCKET}/*\"
  }]
}"

# Upload build files
aws s3 sync dist/ s3://$BUCKET --delete --region $REGION

SITE_URL="http://${BUCKET}.s3-website-${REGION}.amazonaws.com"
echo ""
echo "========================================"
echo " LIVE SITE: $SITE_URL"
echo "========================================"
```

---

## Phase 9 — Test Everything (5 min)

```bash
# Test investigate API
curl "$INVESTIGATE_URL" | python3 -m json.tool | head -30

# Check DynamoDB
aws dynamodb scan --table-name vendors --region $REGION --select COUNT

# View live site
echo "Open: http://tender-trace-${ACCOUNT}.s3-website-us-east-1.amazonaws.com"
```

---

## Phase 10 — SNS Alerts (Optional — 5 min)

SNS IS available in Learner Labs! Wire real email alerts:

```bash
# Create SNS topic
TOPIC_ARN=$(aws sns create-topic --name TenderTraceAlerts --region $REGION --query TopicArn --output text)
echo "Topic: $TOPIC_ARN"

# Subscribe your email (replace with actual email)
aws sns subscribe \
  --topic-arn $TOPIC_ARN \
  --protocol email \
  --notification-endpoint "YOUR_EMAIL@gmail.com" \
  --region $REGION

echo "Check email and confirm subscription!"

# Test alert
aws sns publish \
  --topic-arn $TOPIC_ARN \
  --subject "TenderTrace ALERT: HIGH Risk Vendor Detected" \
  --message "Vendor C001 (Kanpur MediTech) — Score 90/100. Flags: POLITICAL_LINK, SHELL_COMPANY. Refer to CBI immediately." \
  --region $REGION
```

---

## What Works / What's Mocked

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard + Stats | ✅ Live | Demo data |
| Vendor Scan (20 vendors) | ✅ Live | From DynamoDB |
| India Map | ✅ Live | Demo data |
| Analytics + Charts | ✅ Live | Run Live Scan works |
| CBI Referral Letter | ✅ Live | Prints official PDF |
| Copy Share Link | ✅ Live | URL deep linking |
| Dark/Light Mode | ✅ Live | localStorage |
| Live Fraud Ticker | ✅ Live | Scrolls on all pages |
| Subscribe to Alerts | ✅ Live (wired) | SNS email |
| AI Narration on vendors | ✅ Mocked | Canned but realistic text |
| AI Agent | ✅ Mocked | Impressive canned response |
| Bedrock live | ❌ Not available | Learner Labs restriction |
| Amplify | ❌ Not available | Using S3 instead |

---

## Redeploy Frontend After Changes

```bash
cd /tmp/tt
git pull https://ghp_YOURPAT@github.com/dhruva8405/Tender-Trace.git main
cd frontend
VITE_API_URL="https://${API_ID}.execute-api.us-east-1.amazonaws.com/prod" npm run build
aws s3 sync dist/ s3://tender-trace-${ACCOUNT} --delete
echo "Redeployed!"
```

---

## Gotchas & Learner Lab Specific Issues

| Problem | Solution |
|---------|----------|
| Region is locked | Use `us-east-1` only, NOT `ap-south-1` |
| Can't create IAM roles | Use `LabRole` — it has DynamoDB, Lambda, SNS permissions |
| Amplify not available | Use S3 static website hosting instead |
| Bedrock not available | Mock mode auto-activates in frontend |
| Lambda fails with permissions | Attach `LabRole` (pre-created), not a custom role |
| S3 bucket name taken | Use `tender-trace-${ACCOUNT}` — includes account ID |
| Credits budget | Stop EC2 if any, DynamoDB + Lambda + S3 = ~$0/day |

---

## Time Estimate

| Phase | Time |
|-------|------|
| Setup + DynamoDB | 10 min |
| Upload data | 5 min |
| Lambda deploys | 15 min |
| API Gateway | 10 min |
| S3 frontend deploy | 10 min |
| Testing + fixes | 20 min |
| **Total** | **~70 min** |

---

*Learner Lab Edition — Generated 2026-03-07 | TenderTrace v1.0*
