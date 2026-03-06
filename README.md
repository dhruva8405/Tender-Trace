# Tender Trace

## 🌐 Live Site
**[https://main.d2u2jsoniy7sml.amplifyapp.com](https://main.d2u2jsoniy7sml.amplifyapp.com)**


> AI-powered procurement fraud detection for Indian government contracts using Amazon Neptune, AWS Bedrock, and deterministic Gremlin graph traversals.

**Hackathon:** AI ASCEND 2026 · AWS & Kyndryl · Saveetha Engineering College  
**Date:** March 7–8, 2026


## What Tender Trace Does

Tender Trace cross-references **three open Indian government databases** — MCA21 (company registrations), MyNeta (politician ECI affidavits), and GeM (government procurement contracts) — and builds a **property graph on Amazon Neptune** to automatically surface suspicious vendor clusters.

Every risk score is produced by **5 deterministic Gremlin rule traversals** — no ML, fully auditable. Amazon Bedrock (Claude 3 Haiku) narrates every finding in plain English for ministry vigilance officers.


## Architecture

```text
MCA21 + MyNeta + GeM
        │
   AWS Glue ETL (DIN entity resolution)
        │
   Amazon S3 (processed Parquet)
        │
  Amazon Neptune (Property Graph)
        │
  risk_scorer Lambda (5 Gremlin rules)
        │
  narrator Lambda (Bedrock · Claude 3 Haiku)
        │
  API Gateway → React Frontend (Amplify)
```


## The 5 Red Flag Rules

| # | Rule | Flag | Weight |
|---|------|------|--------|
| 1 | Company registered < 90 days before first contract | `FLAG_NEW_COMPANY` | +20 |
| 2 | Multiple vendors share one registered address | `FLAG_SHARED_ADDRESS` | +20 |
| 3 | Director sits on boards of multiple competing vendors | `FLAG_SHARED_DIRECTOR` | +25 |
| 4 | Director is a declared family member of a sitting politician | `FLAG_POLITICAL_LINK` | +25 |
| 5 | Contract value > 30× paid-up capital | `FLAG_CAPITAL_MISMATCH` | +10 |

### Score Interpretation

Each rule is evaluated **once per vendor**. Triggered weights are summed to produce a score from 0–100:

| Score | Level | Action |
|-------|-------|--------|
| 0–30 | LOW | No action required |
| 31–60 | MEDIUM | Monitor and flag for periodic review |
| 61–100 | HIGH | Recommend immediate referral to ministry vigilance unit |

**Example:** Vendor C001 triggers `FLAG_NEW_COMPANY` (+20), `FLAG_SHARED_ADDRESS` (+20), `FLAG_SHARED_DIRECTOR` (+25), and `FLAG_POLITICAL_LINK` (+25) = **90/100 → HIGH RISK**.


## Project Structure

```text
├── frontend/            # React + Vite SPA
│   └── src/pages/       # Dashboard, VendorSearch, Analytics, GraphView, Pipeline
├── lambdas/
│   ├── risk_scorer/     # Gremlin rule engine (Neptune)
│   ├── data_ingestion/  # CSV → Neptune graph builder
│   └── narrator/        # Bedrock AI narration
├── glue/                # Glue ETL Spark job (entity resolution)
├── data/                # Demo CSVs (MCA21, MyNeta, GeM)
├── tests/               # Unit tests for all 5 rules
├── run_pipeline.py      # One-click local end-to-end test
└── requirements.txt     # Python dependencies
```


## Running Locally

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Backend (Lambda — local mode)

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run risk scorer in local mode (uses CSV files instead of Neptune)
cd lambdas/risk_scorer
LOCAL_MODE=true python lambda_function.py
```

`LOCAL_MODE=true` makes the Lambda read from `data/*.csv` files instead of querying Amazon Neptune. No AWS credentials needed for local testing.

### Running Tests

```bash
cd tests
python -m pytest test_risk_rules.py -v
```

### Connecting Frontend to Backend

In production, the frontend calls the API Gateway endpoint. For local development, the frontend uses hardcoded demo data (`src/data.js`) — no backend connection required.

Set `VITE_API_URL` in `.env` to point to your deployed API Gateway endpoint for production builds.


## AWS Services Used

- **Amazon Neptune** — Property graph database (Gremlin)
- **Amazon S3** — Raw CSV staging + processed Parquet storage
- **AWS Lambda** — Serverless rule engine + AI narration
- **AWS Glue ETL** — Data ingestion + DIN entity resolution
- **Amazon Bedrock** — Claude 3 Haiku AI narration
- **API Gateway** — REST API for frontend
- **AWS Amplify** — Frontend hosting


## Data Sources / APIs

| Source | Purpose | Link |
|--------|---------|------|
| **MyNeta API** | Politician affidavit data (ECI) — family declarations, assets | [nini1294/myneta_api](https://github.com/nini1294/myneta_api) |
| **MCA21** | Company registry data — directors, DINs, registration dates | [mca.gov.in](https://www.mca.gov.in) |
| **GeM Portal** | Government e-Marketplace contract award data | [gem.gov.in](https://gem.gov.in) |


## Demo Dataset

> **Disclaimer:** The demo dataset is entirely **fictional** and created solely for demonstration purposes. All company names, director names, politician names, addresses, and financial figures are fabricated. Any resemblance to real persons, companies, or events is coincidental.

The demo models a fictional procurement fraud scenario — a cluster of vendors sharing one address, common directors, and a political link — to demonstrate how Tender Trace's graph traversal engine detects coordinated bid-rigging patterns.

Try vendor IDs `C001`–`C008` in the Vendor Scan page to explore different risk profiles.


## License

Built for AI ASCEND 2026. For educational and demonstration purposes.
