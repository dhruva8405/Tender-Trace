# TenderTrace

**AI-powered procurement fraud detection for Indian government tenders**

## Live Site
**https://main.d2u2jsoniy7sml.amplifyapp.com**

## What It Does
TenderTrace uses Amazon Bedrock Agents (Claude 3) to autonomously investigate procurement fraud across 284 vendors in 10 Indian states.

- Vendor Scan - DynamoDB scan of all procurement vendors
- Cluster Investigation - Deep-dive into shared addresses and shell companies
- Risk Scoring - 7-rule fraud detection engine
- Analytics - State-wise and ministry-level fraud patterns
- AI Agent - Multi-step autonomous reasoning with full trace visibility

## Tech Stack
- Frontend: React + Vite hosted on AWS Amplify
- AI: Amazon Bedrock Agents (Claude 3 Haiku)
- Backend: AWS Lambda (Python) + API Gateway
- Database: Amazon DynamoDB