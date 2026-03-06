// API Configuration
const API_BASE = import.meta.env.VITE_API_URL?.replace('/investigate', '') ||
    "https://b41gx0urz9.execute-api.ap-south-1.amazonaws.com/prod";

// Agent runs on HTTP API v2 — separate endpoint set via Amplify env var
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

export async function fetchAgentQuery(query, sessionId) {
    const res = await fetch(API.agent, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, session_id: sessionId }),
    });
    if (!res.ok) throw new Error(`Agent API error: ${res.status}`);
    return res.json();
}
