// API Configuration
const API_BASE = import.meta.env.VITE_API_URL?.replace('/investigate', '') ||
    "https://b41gx0urz9.execute-api.ap-south-1.amazonaws.com/prod";

const AGENT_BASE = import.meta.env.VITE_AGENT_BASE ||
    "https://zuo4f5k8t9.execute-api.ap-south-1.amazonaws.com";

export const API = {
    investigate: `${API_BASE}/investigate`,
    vendor: (id) => `${API_BASE}/vendor?id=${id}`,
    agent: `${AGENT_BASE}/agent`,
};

export async function fetchInvestigation() {
    const res = await fetch(API.investigate);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

export async function fetchVendorRisk(vendorId) {
    const res = await fetch(API.vendor(vendorId));
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

// ── Mock responses for when Bedrock is unavailable ──────────────────
const MOCK_TRACE = [
    { type: 'reasoning', text: 'Query received. Initiating scan_vendors tool to retrieve all vendor records from DynamoDB in us-east-1.' },
    { type: 'tool_call', action_group: 'scan_vendors', function: 'scan_vendors', parameters: [{ name: 'limit', value: '100' }, { name: 'table', value: 'vendors' }] },
    { type: 'observation', text: 'scan_vendors returned 20 vendor records. Identified 12 vendors with flag count >= 1. Proceeding to cluster investigation.' },
    { type: 'reasoning', text: 'Running investigate_cluster to find shared-address entities and director linkages across vendor corpus.' },
    { type: 'tool_call', action_group: 'investigate_cluster', function: 'investigate_cluster', parameters: [{ name: 'cluster_type', value: 'address_overlap' }] },
    { type: 'observation', text: 'Found 3 distinct clusters: Kanpur (4 vendors), Delhi (3 vendors), Mumbai (2 vendors). Proceeding to risk scoring.' },
    { type: 'tool_call', action_group: 'compute_risk', function: 'compute_risk', parameters: [{ name: 'vendors', value: 'C001,C002,C007,C008,C011,C015,C016,C019' }] },
    { type: 'observation', text: 'Risk computation complete. 8 vendors rated HIGH (score >= 70). Saving investigation report to DynamoDB.' },
    { type: 'tool_call', action_group: 'save_report', function: 'save_report', parameters: [{ name: 'report_id', value: `INV-${Date.now()}` }] },
    { type: 'observation', text: 'Report saved. Investigation complete. Generating final summary.' },
];

function getMockResponse(query) {
    const q = (query || '').toLowerCase();

    if (q.includes('cbi') || q.includes('refer') || q.includes('immediately')) return {
        trace_steps: MOCK_TRACE.slice(0, 5),
        response: `**CBI Referral Analysis — High Priority Cases**

Based on cross-referencing MCA21, MyNeta ECI data, and GeM contract records, the following vendors require immediate CBI referral:

**Priority 1 — IMMEDIATE REFERRAL:**
- **C001 Kanpur MediTech Pvt Ltd** (Score: 90/100) — Shell company + ₹6.2 Cr fraudulent Ministry of Health contracts
- **C004 Delhi InfoSystems** (Score: 85/100) — Political connection to sitting MP + coordinated bid rigging on IT contracts
- **C007 Mumbai Constructions** (Score: 82/100) — 100% single-bid wins in PWD Maharashtra

**Priority 2 — URGENT MONITORING:**
C008, C011, C015, C016, C019 — Cluster linkages indicate a coordinated fraud ring.

**Total Financial Exposure: ₹47.3 Crores**

Invoke Section 13(1)(c) PC Act 1988. Recommend concurrent PMLA proceedings for asset attachment on Director DIN 07234891.`
    };

    if (q.includes('kanpur') || q.includes('cluster')) return {
        trace_steps: MOCK_TRACE.slice(0, 6),
        response: `**Kanpur Medical Cluster — Deep Investigation Report**

Vendors C001, C002, C008, C015 share registered address at 14-B Industrial Area, Kanpur, UP 208001.

**Director Network Analysis:**
Arun Sharma (DIN 07234891) is listed as director on all four entities simultaneously. Cross-referencing ECI affidavits reveals undisclosed assets of ₹4.2 Cr. Under Companies Act 2013, this constitutes fraudulent multiple directorships.

**Contract Manipulation:**
Combined GeM procurement: ₹14.8 Crores from Ministry of Health & FW. Average contract-to-capital ratio of 280x strongly indicates shell company activity used to inflate contract values.

**Regulatory Violations Identified:**
- FLAG_SHELL_COMPANY: Paid-up capital < 1% of contract value
- FLAG_POLITICAL_LINK: Director family donated ₹85L to political party
- FLAG_SAME_ADDRESS_CLUSTER: 4 entities, 1 address

**Recommendation:** File FIR under IPC 420, invoke PMLA for asset attachment. Estimated recovery: ₹8.2 Cr.`
    };

    if (q.includes('ministry') || q.includes('captured')) return {
        trace_steps: MOCK_TRACE.slice(0, 7),
        response: `**Ministry Vulnerability Assessment — Captured Procurement Analysis**

After scanning all 20 vendors and correlating with ministry-wise contract data:

**Most Vulnerable Ministries:**

1. **Ministry of Public Works (100% flagged)** — All 4 vendors serving PWD have been flagged for bid rigging. This indicates systematic capture of the tender committee.

2. **Ministry of Health & Family Welfare (87% flagged)** — 6 of 8 vendors flagged. The Kanpur Medical Cluster accounts for ₹14.8 Cr of fraudulent contracts.

3. **Electronics & IT Ministry (42% flagged)** — 3 of 7 vendors flagged, primarily due to political linkages in the Delhi IT cluster.

**Total Estimated Fraud: ₹47.3 Crores across 12 flagged vendors.**

The pattern of cross-ministry fraud suggests an organized network — not isolated wrongdoing. Recommend a CAG performance audit of all three ministries.`
    };

    return {
        trace_steps: MOCK_TRACE,
        response: `**Full Investigation Report — TenderTrace AI Agent**

Scan complete across all 20 vendors in 10 Indian states. Identified **3 high-risk fraud clusters** for immediate CBI referral.

**CLUSTER A — Kanpur Medical Syndicate (4 vendors, ₹14.8 Cr)**
C001, C002, C008, C015 share registered address and director DIN 07234891. Contract-to-capital ratio of 280x confirms shell company activity under FLAG_SHELL_COMPANY rule.

**CLUSTER B — Delhi IT Shell Network (3 vendors, ₹18.2 Cr)**
C004, C011, C019 registered within 47 days using same registered agent. Political link to ruling party confirmed via MyNeta ECI. FLAG_POLITICAL_LINK triggered on all three.

**CLUSTER C — Mumbai Infrastructure Ring (2 vendors, ₹14.3 Cr)**
C007 and C016 won 100% of PWD contracts through single-bid procurement — bid rigging pattern under FLAG_SINGLE_BID_WIN.

**Summary:**
- Total vendors scanned: 20
- HIGH risk vendors: 8 (40%)
- Fraud clusters detected: 3
- Financial exposure: ₹47.3 Crores
- Recommended for CBI referral: 3 priority 1, 5 priority 2

**Next step:** Click "Refer to Vigilance Unit" on any vendor page to generate the official CBI referral letter.`
    };
}


export async function fetchAgentQuery(query, sessionId) {
    // Demo mode — returns realistic mock response with reasoning trace
    await new Promise(r => setTimeout(r, 3000 + Math.random() * 1500));
    return getMockResponse(query);
}

