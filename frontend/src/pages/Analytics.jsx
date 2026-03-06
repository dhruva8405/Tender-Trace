import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
} from 'recharts';
import { DEMO_VENDORS, FLAG_META } from '../data';

const API_BASE = import.meta.env.VITE_API_URL || 'https://tl2knu64ja.execute-api.ap-south-1.amazonaws.com/prod';

// ─── Derived analytics (20 vendors, 3 clusters) ────────────────────
const STATE_DATA = [
    { state: 'Uttar Pradesh', high: 6, medium: 0, low: 0, total: 32000000 },
    { state: 'Rajasthan', high: 4, medium: 0, low: 0, total: 22500000 },
    { state: 'Tamil Nadu', high: 3, medium: 1, low: 0, total: 26500000 },
    { state: 'Delhi', high: 0, medium: 0, low: 1, total: 15000000 },
    { state: 'Maharashtra', high: 0, medium: 0, low: 2, total: 34000000 },
    { state: 'Karnataka', high: 0, medium: 0, low: 1, total: 45000000 },
    { state: 'Telangana', high: 0, medium: 0, low: 1, total: 38000000 },
    { state: 'West Bengal', high: 0, medium: 0, low: 1, total: 9500000 },
];

const MINISTRY_DATA = [
    { ministry: 'Health & Family Welfare', flagged: 6, clean: 2, value: 54000000 },
    { ministry: 'Public Works', flagged: 4, clean: 0, value: 22500000 },
    { ministry: 'Electronics & IT', flagged: 3, clean: 2, value: 71500000 },
    { ministry: 'Pharmaceuticals', flagged: 0, clean: 2, value: 53000000 },
    { ministry: 'Agriculture', flagged: 0, clean: 1, value: 12000000 },
    { ministry: 'Textiles', flagged: 0, clean: 1, value: 9500000 },
];

const TIMELINE_DATA = [
    { date: 'Jan 2022', registrations: 1, contracts: 0 },
    { date: 'Feb 2022', registrations: 1, contracts: 0 },
    { date: 'Mar 2022', registrations: 1, contracts: 1 },
    { date: 'Apr 2022', registrations: 1, contracts: 1 },
    { date: 'May 2022', registrations: 1, contracts: 1 },
    { date: 'Jun 2022', registrations: 2, contracts: 2 },
    { date: 'Jul 2022', registrations: 2, contracts: 2 },
    { date: 'Aug 2022', registrations: 1, contracts: 2 },
    { date: 'Sep 2022', registrations: 0, contracts: 1 },
    { date: 'Oct 2022', registrations: 0, contracts: 1 },
    { date: 'Jan 2023', registrations: 2, contracts: 0 },
    { date: 'Feb 2023', registrations: 1, contracts: 0 },
    { date: 'Mar 2023', registrations: 0, contracts: 2 },
    { date: 'Apr 2023', registrations: 0, contracts: 1 },
];

const FLAG_DIST = Object.entries(FLAG_META).map(([key, meta]) => ({
    name: meta.label,
    value: DEMO_VENDORS.filter(v => v.flags?.includes(key)).length,
    weight: meta.weight,
}));

const RISK_DIST = [
    { name: 'HIGH', value: 13, color: '#ef4444' },
    { name: 'MEDIUM', value: 0, color: '#f59e0b' },
    { name: 'LOW', value: 7, color: '#10b981' },
];

const SCAN_RESULTS = {
    clustersFound: 3,
    vendorsAtRisk: 13,
    totalFlagged: 52,
    estimatedLoss: 77000000,
};

const INR_CR = (n) => '₹' + (n / 10000000).toFixed(2) + ' Cr';

// ─── Custom tooltip ────────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#0d1422', border: '1px solid #1a2540', borderRadius: 8, padding: '0.6rem 0.9rem', fontSize: '0.78rem' }}>
            <div style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ color: p.color || '#f1f5f9', fontWeight: 600 }}>
                    {p.name}: {typeof p.value === 'number' && p.value > 1000 ? INR_CR(p.value) : p.value}
                </div>
            ))}
        </div>
    );
};

// ─── Scan All component (LIVE API) ─────────────────────────────────
function ScanAllSection() {
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState('');
    const [done, setDone] = useState(false);
    const [error, setError] = useState(null);
    const [liveResult, setLiveResult] = useState(null);

    const PHASES = [
        'Connecting to AWS Lambda…',
        'Scanning DynamoDB tables…',
        'Running 5 red flag rules across all vendors…',
        'Detecting suspicious clusters…',
        'Invoking Amazon Bedrock (Claude 3 Haiku) for AI narration…',
        'Compiling investigation report…',
    ];

    const startScan = async () => {
        setScanning(true); setDone(false); setProgress(0); setError(null); setLiveResult(null);

        // Animate progress phases while API call runs
        let step = 0;
        const interval = setInterval(() => {
            step++;
            setProgress(Math.min(step * 14, 85));
            setPhase(PHASES[Math.min(step - 1, PHASES.length - 1)]);
        }, 700);

        try {
            const res = await fetch(`${API_BASE}/investigate`);
            clearInterval(interval);
            if (!res.ok) throw new Error(`API returned ${res.status}`);
            const data = await res.json();
            setLiveResult(data);
            setProgress(100);
            setPhase('Investigation complete ✓');
            setDone(true);
        } catch (err) {
            clearInterval(interval);
            setError(err.message);
            setPhase('Error — check console');
            setProgress(100);
            setDone(true);
            console.error('Investigation API error:', err);
        } finally {
            setScanning(false);
        }
    };

    const summary = liveResult?.summary || {};
    const brief = liveResult?.ai_investigation_brief || '';
    const clusters = liveResult?.clusters || [];
    const highRisk = liveResult?.high_risk_vendors || [];

    return (
        <div className="card" style={{ marginBottom: '1rem', borderColor: scanning ? 'rgba(59,130,246,0.3)' : done && !error ? 'rgba(16,185,129,0.3)' : error ? 'rgba(239,68,68,0.3)' : 'var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <div className="card-title">AI Investigation Agent — Full Dataset Scan</div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', margin: 0 }}>
                        Scans all vendors, runs 5 rules, detects clusters, generates Bedrock AI investigation brief — <strong>live from AWS</strong>
                    </p>
                </div>
                <button
                    onClick={startScan}
                    disabled={scanning}
                    style={{
                        background: scanning ? 'rgba(59,130,246,0.2)' : done ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                        border: `1px solid ${scanning ? '#3b82f6' : done ? '#10b981' : 'transparent'}`,
                        color: scanning ? '#93c5fd' : done ? '#34d399' : 'white',
                        borderRadius: 10, padding: '0.75rem 1.5rem',
                        fontWeight: 700, fontSize: '0.875rem', cursor: scanning ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font)', whiteSpace: 'nowrap',
                        boxShadow: (!scanning && !done) ? '0 4px 16px rgba(59,130,246,0.3)' : 'none',
                        transition: 'all 0.2s',
                    }}
                >
                    {scanning ? 'Scanning AWS…' : done ? 'Scan Complete — Run Again' : 'Run Live AI Scan'}
                </button>
            </div>

            {(scanning || done) && (
                <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-4)', marginBottom: '0.4rem' }}>
                        <span style={{ color: error ? '#ef4444' : scanning ? '#93c5fd' : '#34d399', fontFamily: 'var(--mono)' }}>{phase}</span>
                        <span>{progress}%</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--border-2)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', borderRadius: 999,
                            width: `${progress}%`,
                            background: error ? '#ef4444' : done ? 'var(--green)' : 'linear-gradient(90deg, #3b82f6, #6366f1)',
                            boxShadow: `0 0 10px ${error ? '#ef4444' : done ? '#10b981' : '#3b82f6'}`,
                            transition: 'width 0.5s ease',
                        }} />
                    </div>
                </div>
            )}

            {error && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#ef4444', fontSize: '0.82rem' }}>
                    API error: {error} — showing demo data below. Check CORS and API Gateway configuration.
                </div>
            )}

            {done && liveResult && (
                <>
                    {/* Summary stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginTop: '1rem' }}>
                        {[
                            { label: 'Vendors Scanned', value: summary.total_vendors || 0, color: '#3b82f6' },
                            { label: 'HIGH Risk', value: summary.high_risk || 0, color: '#ef4444' },
                            { label: 'MEDIUM Risk', value: summary.medium_risk || 0, color: '#f59e0b' },
                            { label: 'Clusters Found', value: summary.clusters_detected || 0, color: '#ef4444' },
                        ].map(({ label, value, color }) => (
                            <div key={label} style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>{label}</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800, color }}>{value}</div>
                            </div>
                        ))}
                    </div>

                    {/* AI Investigation Brief */}
                    {brief && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(59,130,246,0.05))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10 }}>
                            <div style={{ fontSize: '0.72rem', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '0.5rem' }}>
                                🧠 AI Investigation Brief — Amazon Bedrock (Claude 3 Haiku)
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                {brief}
                            </p>
                        </div>
                    )}

                    {/* Cluster details */}
                    {clusters.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '0.5rem' }}>
                                🔗 Suspicious Clusters
                            </div>
                            {clusters.map((c, i) => (
                                <div key={i} style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, marginBottom: '0.5rem' }}>
                                    <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.85rem' }}>
                                        {c.type === 'SHARED_ADDRESS' ? '📍' : '👥'} {c.vendor_count} vendors — {c.type.replace('_', ' ')}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', margin: '0.3rem 0' }}>
                                        {c.address && `Address: ${c.address}`} · Avg Score: {c.avg_score} · Max: {c.max_score}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                                        {c.vendors?.map(v => (
                                            <span key={v.id} style={{
                                                fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: 6,
                                                background: v.risk === 'HIGH' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                                color: v.risk === 'HIGH' ? '#ef4444' : '#f59e0b',
                                                fontWeight: 600,
                                            }}>
                                                {v.id}: {v.name} ({v.score})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Duration */}
                    {liveResult.duration_seconds && (
                        <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>
                            Scan completed in {liveResult.duration_seconds}s · {liveResult.scan_timestamp}
                        </div>
                    )}
                </>
            )}

            {/* Fallback to demo data if API fails */}
            {done && !liveResult && !error && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginTop: '1rem' }}>
                    {[
                        { label: 'Clusters Found', value: SCAN_RESULTS.clustersFound, color: '#ef4444' },
                        { label: 'Vendors Flagged', value: SCAN_RESULTS.vendorsAtRisk, color: '#ef4444' },
                        { label: 'Total Flags', value: SCAN_RESULTS.totalFlagged, color: '#f59e0b' },
                        { label: 'Est. Amount at Risk', value: INR_CR(SCAN_RESULTS.estimatedLoss), color: '#ef4444' },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>{label}</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color }}>{value}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Analytics() {
    const [activeTab, setActiveTab] = useState('overview');

    const TABS = [
        { id: 'overview', label: 'Overview' },
        { id: 'geography', label: 'Geography' },
        { id: 'timeline', label: 'Timeline' },
        { id: 'clusters', label: 'Clusters' },
    ];

    const exportPDF = () => {
        const title = document.title;
        document.title = 'TenderTrace — Fraud Analytics Report — ' + new Date().toLocaleDateString('en-IN');
        window.print();
        document.title = title;
    };

    return (
        <>
            <div className="ph" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="ph-title">Analytics &amp; Intelligence</h1>
                    <p className="ph-sub">Aggregate fraud intelligence across the full dataset — by flag type, geography, ministry, and time</p>
                </div>
                <button onClick={exportPDF} style={{
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    border: 'none', borderRadius: 10, padding: '0.65rem 1.4rem',
                    color: 'white', fontWeight: 700, fontSize: '0.85rem',
                    cursor: 'pointer', fontFamily: 'var(--font)',
                    boxShadow: '0 4px 16px rgba(59,130,246,0.35)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    whiteSpace: 'nowrap', alignSelf: 'flex-start',
                }}>
                    Export PDF
                </button>
            </div>

            {/* Scan All */}
            <ScanAllSection />

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 2, marginBottom: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                        style={{
                            background: activeTab === t.id ? 'rgba(59,130,246,0.15)' : 'none',
                            border: activeTab === t.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                            color: activeTab === t.id ? '#93c5fd' : 'var(--text-3)',
                            borderRadius: 7, padding: '0.45rem 1rem',
                            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                            fontFamily: 'var(--font)', transition: 'all 0.15s',
                        }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
            {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                        {/* Flag frequency bar chart */}
                        <div className="card">
                            <div className="card-title">Flag Frequency Across All Vendors</div>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={FLAG_DIST} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
                                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                                    <Tooltip content={<DarkTooltip />} />
                                    <Bar dataKey="value" name="Vendors" radius={[4, 4, 0, 0]}>
                                        {FLAG_DIST.map((_, i) => (
                                            <Cell key={i} fill={['#ef4444', '#ef4444', '#f59e0b', '#ef4444', '#64748b'][i]}
                                                style={{ filter: 'drop-shadow(0 0 4px currentColor)' }} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Risk distribution pie */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div className="card-title" style={{ width: '100%' }}>Risk Level Distribution</div>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie data={RISK_DIST} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                                        paddingAngle={3} dataKey="value">
                                        {RISK_DIST.map((d, i) => (
                                            <Cell key={i} fill={d.color} style={{ filter: `drop-shadow(0 0 6px ${d.color})` }} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<DarkTooltip />} />
                                    <Legend formatter={(v) => <span style={{ color: 'var(--text-2)', fontSize: '0.78rem' }}>{v}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', textAlign: 'center' }}>
                                <span style={{ color: '#ef4444', fontWeight: 700 }}>75%</span> of scanned vendors fall in the HIGH RISK band
                            </div>
                        </div>
                    </div>

                    {/* Ministry breakdown */}
                    <div className="card">
                        <div className="card-title">Contract Value by Ministry</div>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={MINISTRY_DATA} layout="vertical" margin={{ top: 4, right: 20, left: 80, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" horizontal={false} />
                                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => '₹' + Math.round(v / 100000) + 'L'} />
                                <YAxis type="category" dataKey="ministry" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
                                <Tooltip content={<DarkTooltip />} />
                                <Bar dataKey="value" name="Contract Value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* ── GEOGRAPHY TAB ─────────────────────────────────────────── */}
            {activeTab === 'geography' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="card">
                        <div className="card-title">High Risk Vendors by State</div>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={STATE_DATA} margin={{ top: 4, right: 4, left: -10, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
                                <XAxis dataKey="state" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip content={<DarkTooltip />} />
                                <Bar dataKey="high" name="HIGH risk" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="medium" name="MEDIUM risk" stackId="a" fill="#f59e0b" />
                                <Bar dataKey="low" name="LOW risk" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Legend formatter={(v) => <span style={{ color: 'var(--text-2)', fontSize: '0.78rem' }}>{v}</span>} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* State insight cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                        {STATE_DATA.map(s => (
                            <div key={s.state} className="card" style={{ borderColor: s.high > 0 ? 'rgba(239,68,68,0.2)' : 'var(--border)' }}>
                                <div style={{ fontWeight: 700, marginBottom: '0.4rem' }}>{s.state}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
                                    <div>High risk: <strong style={{ color: 'var(--red-soft)' }}>{s.high}</strong></div>
                                    <div>Low risk: <strong style={{ color: 'var(--green-soft)' }}>{s.low}</strong></div>
                                    <div>Contracts: <strong>{INR_CR(s.total)}</strong></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── TIMELINE TAB ─────────────────────────────────────────── */}
            {activeTab === 'timeline' && (
                <div className="card">
                    <div className="card-title">Company Registrations vs Contract Awards — Kanpur Cluster 2022</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: '1rem', lineHeight: 1.6 }}>
                        This chart shows a <strong style={{ color: 'var(--amber-soft)' }}>classic shell company pattern</strong> — a burst of company incorporations
                        immediately followed by contract awards before the 90-day threshold.
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={TIMELINE_DATA} margin={{ top: 4, right: 4, left: -10, bottom: 4 }}>
                            <defs>
                                <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="conGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
                            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                            <Tooltip content={<DarkTooltip />} />
                            <Legend formatter={(v) => <span style={{ color: 'var(--text-2)', fontSize: '0.78rem' }}>{v}</span>} />
                            <Area type="monotone" dataKey="registrations" name="Company Registrations"
                                stroke="#3b82f6" strokeWidth={2} fill="url(#regGrad)" dot={{ fill: '#3b82f6', r: 4 }} />
                            <Area type="monotone" dataKey="contracts" name="Contract Awards"
                                stroke="#ef4444" strokeWidth={2} fill="url(#conGrad)" dot={{ fill: '#ef4444', r: 4 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* ── CLUSTERS TAB ─────────────────────────────────────────── */}
            {activeTab === 'clusters' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <ClusterDetection />
                </div>
            )}
        </>
    );
}

// ─── Cluster detection ─────────────────────────────────────────────
function ClusterDetection() {
    const [running, setRunning] = useState(false);
    const [steps, setSteps] = useState([]);
    const [found, setFound] = useState(false);

    const ALGO_STEPS = [
        { text: 'Indexing all 8 vendors by registered address…', delay: 500 },
        { text: 'Found 6 vendors sharing address "14-A Civil Lines, Kanpur"', delay: 900 },
        { text: 'Indexing director → company mappings via DIN lookups…', delay: 1400 },
        { text: 'D001 (Rajesh Verma) → C001, C002, C004 · D002 (Sunita Agarwal) → C002, C003, C005, C006', delay: 2000 },
        { text: 'Cross-referencing DINs against MyNeta affidavit declarations…', delay: 2600 },
        { text: 'MATCH: DIN 00445566 — declared spouse in MLA Mahendra Verma\'s ECI affidavit', delay: 3200 },
        { text: 'CLUSTER IDENTIFIED: 6-vendor Kanpur Medical Cluster — avg score 76.5/100', delay: 3800 },
    ];

    const run = () => {
        setRunning(true); setSteps([]); setFound(false);
        ALGO_STEPS.forEach(({ text, delay }) => {
            setTimeout(() => {
                setSteps(prev => [...prev, text]);
                if (delay === 3800) { setFound(true); setRunning(false); }
            }, delay);
        });
    };

    return (
        <>
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                        <div className="card-title">Automatic Cluster Detection Algorithm</div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', margin: 0 }}>
                            Finds groups of vendors connected by shared addresses, directors, or political links
                        </p>
                    </div>
                    <button onClick={run} disabled={running}
                        style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            border: 'none', borderRadius: 10, padding: '0.7rem 1.4rem',
                            color: 'white', fontWeight: 700, fontSize: '0.875rem',
                            cursor: running ? 'not-allowed' : 'pointer', opacity: running ? 0.7 : 1,
                            fontFamily: 'var(--font)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                        }}>
                        {running ? 'Running…' : found ? 'Re-run Detection' : 'Run Detection'}
                    </button>
                </div>

                {/* Terminal-style output */}
                <div style={{
                    background: '#050811', border: '1px solid #1a2540',
                    borderRadius: 10, padding: '1rem 1.25rem', minHeight: 160,
                    fontFamily: 'var(--mono)', fontSize: '0.78rem',
                }}>
                    <div style={{ color: '#475569', marginBottom: '0.5rem' }}>$ Tender Trace cluster-detect --input data/all --threshold 2</div>
                    {steps.map((s, i) => (
                        <div key={i} style={{
                            color: s.startsWith('CLUSTER') ? '#34d399' : s.startsWith('MATCH') ? '#fbbf24' : '#94a3b8',
                            marginBottom: '0.3rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                        }}>
                            <span style={{ color: '#3b82f6', flexShrink: 0 }}>[{String(i + 1).padStart(2, '0')}]</span>
                            <span>{s}</span>
                        </div>
                    ))}
                    {running && <span style={{ color: '#3b82f6' }}>█</span>}
                    {!running && !found && steps.length === 0 && (
                        <div style={{ color: '#334155' }}>Ready. Press "Run Detection" to start.</div>
                    )}
                </div>
            </div>

            {found && (
                <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' }}>
                    <div className="card-title">Detected Cluster: Kanpur Medical Equipment 2022</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                        {[
                            { label: 'Vendors in Cluster', value: '6', color: '#ef4444' },
                            { label: 'Avg Risk Score', value: '76.5/100', color: '#ef4444' },
                            { label: 'Total Value', value: '₹32L', color: '#f59e0b' },
                            { label: 'Shared Directors', value: '2', color: '#f59e0b' },
                            { label: 'Political Links', value: '1 MLA', color: '#ef4444' },
                            { label: 'Shared Address', value: '1', color: '#8b5cf6' },
                        ].map(({ label, value, color }) => (
                            <div key={label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '0.65rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.2rem' }}>{label}</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{value}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', lineHeight: 1.7 }}>
                        <strong style={{ color: 'var(--text-1)' }}>Recommendation:</strong> Refer Cluster #KC-2022-001 to the Ministry of Health & Family Welfare's
                        Central Vigilance Unit and the Uttar Pradesh Vigilance Establishment.
                        Cross-file with ECI for scrutiny of MLA Mahendra Verma's asset declarations and potential conflict-of-interest violation.
                    </div>
                </div>
            )}
        </>
    );
}
