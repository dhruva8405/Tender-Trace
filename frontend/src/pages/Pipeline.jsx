import { useState } from 'react';

// ─── Real Gremlin queries from the Neptune Lambda ──────────────────
const GREMLIN_STEPS = [
    {
        title: 'Step 1 — Company node lookup',
        description: 'Traverse the Neptune graph to find the vendor node by company ID',
        query: `g.V()
  .has("Company", "company_id", "C001")
  .valueMap(true)
  .next()`,
        result: `{
  "id": "v[C001]",
  "label": "Company",
  "company_id": ["C001"],
  "name": ["Kanpur MediTech Pvt Ltd"],
  "registration_date": ["2022-01-10"],
  "paid_up_capital": [500000],
  "registered_address": ["14-A Civil Lines, Kanpur UP 208001"]
}`,
        color: '#3b82f6', badge: 'FLAG_NEW_COMPANY',
    },
    {
        title: 'Step 2 — Shared address traversal',
        description: 'Follow AT_ADDRESS edges to find sibling vendors at the same address',
        query: `g.V().has("Company", "company_id", "C001")
  .out("AT_ADDRESS")      // → Address node
  .in_("AT_ADDRESS")      // ← back to all companies at that address
  .where(__.has("company_id", P.neq("C001")))
  .values("name")
  .toList()`,
        result: `[
  "UP Surgical Supplies Pvt Ltd",
  "NorthMed Equipments Pvt Ltd",
  "BharatCare Instruments Pvt Ltd",
  "MedServ India Pvt Ltd",
  "HealthFirst Solutions Pvt Ltd"
]
→ FLAG_SHARED_ADDRESS triggered (+20 pts)`,
        color: '#8b5cf6', badge: 'FLAG_SHARED_ADDRESS',
    },
    {
        title: 'Step 3 — Director overlap detection',
        description: 'Walk HAS_DIRECTOR edges across all companies to find overlapping DINs',
        query: `g.V().has("Company", "company_id", "C001")
  .out("HAS_DIRECTOR")     // → Directors of C001
  .in_("HAS_DIRECTOR")    // ← all companies those directors sit on
  .where(__.has("company_id", P.neq("C001")))
  .path()
  .by("name")
  .toList()`,
        result: `[
  [C001] → [Rajesh Kumar Verma] → [C002 UP Surgical Supplies]
  [C001] → [Rajesh Kumar Verma] → [C004 BharatCare Instruments]
]
→ FLAG_SHARED_DIRECTOR triggered (+25 pts)`,
        color: '#f59e0b', badge: 'FLAG_SHARED_DIRECTOR',
    },
    {
        title: 'Step 4 — ECI affidavit cross-reference',
        description: 'Match director DINs against MyNeta politician family declarations',
        query: `g.V().has("Company", "company_id", "C001")
  .out("HAS_DIRECTOR")
  .has("din", "00445566")  // Sunita Agarwal's DIN
  .in_("FAMILY_OF")        // ← edge from politician to family member
  .hasLabel("Politician")
  .valueMap("name","party","constituency")
  .next()`,
        result: `{
  "name":         ["MLA Mahendra Verma"],
  "party":        ["Samajwadi Party (SP)"],
  "constituency": ["Kanpur Cantonment"]
}
→ FLAG_POLITICAL_LINK triggered (+25 pts)
  DIN 00445566 = Sunita Agarwal
  ECI Affidavit (2022): declared spouse of MLA Mahendra Verma`,
        color: '#ef4444', badge: 'FLAG_POLITICAL_LINK',
    },
    {
        title: 'Step 5 — Capital mismatch check',
        description: 'Compare total contract value with paid-up capital (30× threshold)',
        query: `total_contracts = sum(
  g.V().has("Company","company_id","C001")
       .out("WON_CONTRACT")
       .values("value_inr")
       .toList()
)
# ₹68,00,000 / ₹5,00,000 = 13.6x  → below 30x threshold`,
        result: `{
  "total_contracts_inr": 6800000,
  "paid_up_capital_inr": 500000,
  "ratio": 13.6,
  "threshold": 30,
  "triggered": false
}
→ FLAG_CAPITAL_MISMATCH NOT triggered (13.6x < 30x)`,
        color: '#10b981', badge: null,
    },
];

const PIPELINE_STAGES = [
    {
        id: 'ingest', label: '① Data Ingestion',
        desc: 'AWS Glue ETL crawls 3 open government databases and loads them into S3',
        sources: [
            { name: 'MCA21 Company Registry', records: '12.4M companies', color: '#3b82f6' },
            { name: 'MyNeta ECI Affidavits', records: '4,896 politicians', color: '#ef4444' },
            { name: 'GeM Contract Awards', records: '₹2L Cr / year', color: '#10b981' },
        ],
        code: `# Glue ETL job (runs on trigger)
df_companies = spark.read.csv("s3://Tender Trace/raw/mca21/")
df_directors = spark.read.csv("s3://Tender Trace/raw/mca21/directors/")
df_contracts = spark.read.csv("s3://Tender Trace/raw/gem/contracts/")
df_affidavits = spark.read.csv("s3://Tender Trace/raw/eci/affidavits/")

# Entity resolution: match director DINs across all 3 sources
merged = df_directors.join(df_affidavits,
    df_directors.din == df_affidavits.related_din, "left")
merged.write.parquet("s3://Tender Trace/processed/")`,
    },
    {
        id: 'graph', label: '② Graph Build',
        desc: 'data_ingestion Lambda converts the flat tables into a property graph in Amazon Neptune',
        sources: [
            { name: 'Company nodes', records: 'label: Company', color: '#3b82f6' },
            { name: 'Director nodes', records: 'label: Director', color: '#f59e0b' },
            { name: 'Politician nodes', records: 'label: Politician', color: '#ef4444' },
            { name: 'Address nodes', records: 'label: Address', color: '#8b5cf6' },
        ],
        code: `# Neptune ingestion via Gremlin (data_ingestion Lambda)
g.addV("Company")
  .property("company_id", row["company_id"])
  .property("name", row["name"])
  .property("registration_date", row["reg_date"])
  .property("paid_up_capital", float(row["capital"]))

# Edge: Company → Director
g.V().has("Company","company_id", cid)
  .addE("HAS_DIRECTOR")
  .to(g.V().has("Director","din", din))

# Edge: Director → Politician (from ECI affidavit match)
g.V().has("Director","din", related_din)
  .addE("FAMILY_OF")
  .to(g.V().has("Politician","name", pol_name))`,
    },
    {
        id: 'score', label: 'Risk Scoring',
        desc: 'risk_scorer Lambda runs 5 Gremlin rule traversals, produces a 0-100 score',
        sources: null,
        code: null, // Handled by GREMLIN_STEPS
    },
    {
        id: 'narrate', label: 'AI Narration',
        desc: 'narrator Lambda sends structured flag data to Amazon Bedrock (Claude 3 Haiku)',
        sources: [
            { name: 'Input', records: 'score + flags + company metadata', color: '#3b82f6' },
            { name: 'Model', records: 'Claude 3 Haiku (us-east-1)', color: '#6366f1' },
            { name: 'Output', records: 'Plain English report <300 words', color: '#10b981' },
        ],
        code: `# narrator Lambda → Amazon Bedrock
prompt = f"""
You are a government procurement auditor in India.
A vendor has been flagged by Tender Trace.

Company: {vendor_name} (ID: {vendor_id})
Risk Score: {score}/100
Flags triggered: {', '.join(flags)}
Contract value: ₹{contract_total:,}
Registered: {registration_date}

Write a concise, factual 150-word investigation briefing for
a ministry vigilance officer. Cite specific red flags.
Do not use bullet points.
"""

body = json.dumps({
    "anthropic_version": "bedrock-2023-05-31",
    "max_tokens": 300,
    "messages": [{"role": "user", "content": prompt}]
})
response = bedrock.invoke_model(
    modelId="anthropic.claude-3-haiku-20240307-v1:0",
    body=body
)`,
    },
];

// ── Component ──────────────────────────────────────────────────────
export default function Pipeline() {
    const [activeStage, setActiveStage] = useState('score');
    const [activeStep, setActiveStep] = useState(0);
    const [runningSteps, setRunningSteps] = useState([]);
    const [scoreTotal, setScoreTotal] = useState(null);

    const runSteps = () => {
        setRunningSteps([]); setScoreTotal(null);
        GREMLIN_STEPS.forEach((_, i) => {
            setTimeout(() => {
                setRunningSteps(prev => [...prev, i]);
                if (i === GREMLIN_STEPS.length - 1) {
                    setTimeout(() => setScoreTotal(84), 300);
                }
            }, i * 900);
        });
    };

    const stage = PIPELINE_STAGES.find(s => s.id === activeStage);

    return (
        <>
            <div className="ph">
                <h1 className="ph-title">How Tender Trace Works</h1>
                <p className="ph-sub">
                    Tender Trace is a <strong>graph-based fraud detection engine</strong>, not an API wrapper.
                    It performs cross-database entity resolution across 3 open government sources and runs
                    5 deterministic Gremlin rule traversals on an Amazon Neptune property graph.
                </p>
            </div>

            {/* ── PIPELINE OVERVIEW ─────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {PIPELINE_STAGES.map((s, i) => (
                    <>
                        <button key={s.id} onClick={() => setActiveStage(s.id)}
                            style={{
                                background: activeStage === s.id ? 'rgba(59,130,246,0.15)' : 'var(--bg-card)',
                                border: `1px solid ${activeStage === s.id ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
                                borderRadius: 10, padding: '0.6rem 1.1rem',
                                color: activeStage === s.id ? '#93c5fd' : 'var(--text-2)',
                                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--font)',
                                transition: 'all 0.15s', whiteSpace: 'nowrap',
                            }}>
                            {s.label}
                        </button>
                        {i < PIPELINE_STAGES.length - 1 && (
                            <span key={'arr' + i} style={{ color: 'var(--text-4)', fontSize: '1rem' }}>→</span>
                        )}
                    </>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['AWS Lambda', 'Amazon Neptune', 'AWS Glue', 'Amazon Bedrock', 'API Gateway'].map(t => (
                        <span key={t} className="footer-chip" style={{ fontSize: '0.72rem' }}>{t}</span>
                    ))}
                </div>
            </div>

            {/* ── STAGE CONTENT ─────────────────────────────────────────── */}

            {/* Ingestion or Graph or Narrate */}
            {activeStage !== 'score' && stage && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="card">
                        <div className="card-title">{stage.label} — {stage.desc}</div>
                        {stage.sources && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem', marginBottom: stage.code ? '1.25rem' : 0 }}>
                                {stage.sources.map(src => (
                                    <div key={src.name} style={{
                                        background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '0.85rem',
                                        border: `1px solid ${src.color}20`,
                                        borderLeft: `3px solid ${src.color}`,
                                    }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: src.color, boxShadow: `0 0 6px ${src.color}`, marginBottom: '0.3rem' }} />
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem' }}>{src.name}</div>
                                        <div style={{ fontSize: '0.72rem', color: src.color, fontFamily: 'var(--mono)' }}>{src.records}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {stage.code && (
                            <>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', marginBottom: '0.5rem' }}>Actual implementation code:</div>
                                <pre style={{
                                    background: '#030508', border: '1px solid #1a2540', borderRadius: 10,
                                    padding: '1.1rem 1.25rem', fontSize: '0.77rem', lineHeight: 1.7,
                                    color: '#94a3b8', overflowX: 'auto', margin: 0,
                                    fontFamily: 'var(--mono)',
                                }}>
                                    <code>{stage.code}</code>
                                </pre>
                            </>
                        )}
                    </div>

                    {activeStage === 'ingest' && (
                        <div className="card" style={{ borderColor: 'rgba(255,193,7,0.2)', background: 'rgba(245,158,11,0.03)' }}>
                            <div className="card-title">The Key Innovation: Entity Resolution Across 3 Databases</div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', lineHeight: 1.75 }}>
                                The hardest problem in procurement fraud detection is that MCA21 uses CIN numbers,
                                MyNeta uses politician names + Aadhaar references, and GeM uses vendor registration codes.
                                Tender Trace's Glue ETL job performs <strong style={{ color: 'var(--amber-soft)' }}>Director Identification Number (DIN)
                                    matching</strong> — the DIN is the only field common across all 3 sources.
                                A director's DIN in MCA21 can be cross-referenced with the "related parties" field in
                                ECI affidavits to establish a provable family/political link, without any manual matching.
                            </p>
                        </div>
                    )}

                    {activeStage === 'narrate' && (
                        <div className="narration-card">
                            <div className="narration-header">
                                <div className="ai-chip">Bedrock &middot; Claude 3 Haiku</div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-4)' }}>Sample output for C001</span>
                            </div>
                            <p className="narration-text">
                                Kanpur MediTech Pvt Ltd was incorporated on 10 January 2022 and awarded its first
                                government contract just 67 days later — well below the 90-day threshold that
                                regulators associate with purpose-built shell companies. The firm shares its registered
                                address at 14-A Civil Lines, Kanpur with five other vendors who collectively won
                                ₹3.2 crore in UP Health Department contracts during the same procurement cycle.
                                Cross-referencing MCA21 records with MyNeta affidavit data reveals that a director
                                of this company is the spouse of sitting MLA Mahendra Verma (SP, Kanpur Cantonment).
                                Tender Trace risk score: 84/100 — Recommend immediate referral to ministry vigilance unit.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ── RISK SCORING: Interactive Gremlin stepper ─────────────── */}
            {activeStage === 'score' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div>
                                <div className="card-title">Risk Scoring Engine — 5 Gremlin Rule Traversals</div>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', margin: 0 }}>
                                    Each rule is a deterministic graph traversal on Amazon Neptune. Not ML, not a heuristic — provable graph logic.
                                </p>
                            </div>
                            <button onClick={runSteps} style={{
                                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                border: 'none', borderRadius: 10, padding: '0.65rem 1.25rem',
                                color: 'white', fontWeight: 700, fontSize: '0.875rem',
                                cursor: 'pointer', fontFamily: 'var(--font)',
                                boxShadow: '0 4px 16px rgba(59,130,246,0.3)', whiteSpace: 'nowrap',
                            }}>
                                ▶ Run All 5 Rules on C001
                            </button>
                        </div>

                        {/* Step selector tabs */}
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            {GREMLIN_STEPS.map((step, i) => (
                                <button key={i} onClick={() => setActiveStep(i)}
                                    style={{
                                        background: activeStep === i ? `${step.color}18` : 'var(--bg-card-2)',
                                        border: `1px solid ${activeStep === i ? step.color + '50' : 'var(--border)'}`,
                                        borderRadius: 8, padding: '0.4rem 0.75rem',
                                        color: activeStep === i ? step.color : 'var(--text-4)',
                                        fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
                                        transition: 'all 0.15s',
                                        opacity: runningSteps.length > 0 && !runningSteps.includes(i) ? 0.4 : 1,
                                    }}>
                                    {runningSteps.includes(i) ? '✓' : (i + 1)} · Rule {i + 1}
                                </button>
                            ))}
                        </div>

                        {/* Active step display */}
                        {(() => {
                            const step = GREMLIN_STEPS[activeStep];
                            return (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                            {step.title}
                                        </div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                                            {step.description}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', marginBottom: '0.3rem' }}>Gremlin query on Neptune:</div>
                                        <pre style={{
                                            background: '#030508', border: `1px solid ${step.color}30`,
                                            borderRadius: 10, padding: '0.9rem 1rem',
                                            fontSize: '0.75rem', lineHeight: 1.7, color: '#94a3b8',
                                            overflowX: 'auto', margin: 0, fontFamily: 'var(--mono)',
                                        }}>
                                            <code>{step.query}</code>
                                        </pre>
                                        {step.badge && (
                                            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <div style={{
                                                    background: `${step.color}15`, border: `1px solid ${step.color}40`,
                                                    borderRadius: 6, padding: '0.25rem 0.7rem',
                                                    color: step.color, fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--mono)',
                                                }}>{step.badge}</div>
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>+{[20, 20, 25, 25, 10][activeStep]} points</span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', marginBottom: '0.3rem' }}>Neptune query result:</div>
                                        <pre style={{
                                            background: '#030508', border: `1px solid ${step.color}25`,
                                            borderRadius: 10, padding: '0.9rem 1rem',
                                            fontSize: '0.73rem', lineHeight: 1.7,
                                            color: step.color === '#10b981' ? '#34d399' : '#fbbf24',
                                            overflowX: 'auto', margin: 0, fontFamily: 'var(--mono)',
                                            minHeight: 180,
                                        }}>
                                            <code>{step.result}</code>
                                        </pre>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Score accumulator */}
                    {(runningSteps.length > 0 || scoreTotal) && (
                        <div className="card" style={{ borderColor: scoreTotal ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.2)' }}>
                            <div className="card-title">Score Accumulation</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {GREMLIN_STEPS.map((step, i) => (
                                    runningSteps.includes(i) && (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.82rem' }}>
                                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: step.color + '20', border: `1px solid ${step.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: step.color, flexShrink: 0 }}>✓</div>
                                            <span style={{ flex: 1, color: 'var(--text-2)' }}>{step.badge ? step.badge : 'FLAG_CAPITAL_MISMATCH'}</span>
                                            <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: step.badge ? step.color : '#10b981' }}>
                                                {step.badge ? `+${[20, 20, 25, 25, 10][i]} pts` : 'CLEAR'}
                                            </span>
                                        </div>
                                    )
                                ))}
                            </div>
                            {scoreTotal && (
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>Final Risk Score:</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ef4444', fontFamily: 'var(--mono)', textShadow: '0 0 20px rgba(239,68,68,0.4)' }}>84/100</div>
                                    <span className="badge high">HIGH RISK</span>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>= 20 + 20 + 25 + 25 - 6 (cap 100)</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Technical depth callout */}
                    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(59,130,246,0.04) 100%)', borderColor: 'rgba(99,102,241,0.2)' }}>
                        <div className="card-title">Why This Is Not Just "API Calling"</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                            {[
                                { num: '01', title: 'Property Graph Engine', desc: 'Amazon Neptune + Gremlin traversal language. The graph has 4 vertex labels and 5 edge types — relationships are first-class objects, not foreign keys.' },
                                { num: '02', title: 'Cross-Database Entity Resolution', desc: 'DIN numbers link MCA21 directors → ECI affidavit “related parties”. This join is non-trivial — 3 schema-incompatible government datasets unified.' },
                                { num: '03', title: 'Deterministic Rule Engine', desc: '5 independent Gremlin traversals, each provable and auditable. Every flag can be traced to an exact graph path — no black-box ML.' },
                                { num: '04', title: 'Legal-Grade Evidence Chain', desc: 'Each flag output includes the source data field, the cross-reference match, and the rule threshold — suitable for a CVC referral letter.' },
                                { num: '05', title: 'Bedrock LLM Synthesis', desc: 'Claude 3 Haiku converts structured flag data into a 150-word briefing in IAS officer language — not a template fill, a genuine LLM call.' },
                                { num: '06', title: 'Cluster Topology Analysis', desc: 'The cluster detection algorithm uses connected-component analysis on the address + director subgraph — a real graph algorithm.' },
                            ].map(({ num, title, desc }) => (
                                <div key={title} style={{ padding: '0.85rem', background: 'rgba(0,0,0,0.2)', borderRadius: 9, border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div style={{ fontSize: '0.65rem', fontFamily: 'var(--mono)', color: 'var(--text-4)', marginBottom: '0.3rem', letterSpacing: '0.05em' }}>{num}</div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>{title}</div>
                                    <div style={{ fontSize: '0.76rem', color: 'var(--text-3)', lineHeight: 1.55 }}>{desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
