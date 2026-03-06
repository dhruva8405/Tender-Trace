import { useState, useEffect } from 'react';
import { DEMO_VENDORS } from '../data';

const INR = (n) => '₹' + (n / 100000).toFixed(1) + 'L';
const scoreColor = (s) => s >= 70 ? 'var(--red)' : s >= 40 ? 'var(--amber)' : 'var(--green)';

// Animated counter
function useCountUp(target, duration = 1200) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        let start = null;
        const step = (ts) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setVal(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [target, duration]);
    return val;
}

function AnimatedNum({ value }) {
    const v = useCountUp(value);
    return <span className="count-anim">{v}</span>;
}

const ALERTS = [
    { level: 'high', text: <><strong>FLAG_POLITICAL_LINK</strong> — Sunita Agarwal (Director, C002–C006) identified as spouse of MLA Mahendra Verma (SP, Kanpur Cantonment)</>, time: '00:03' },
    { level: 'high', text: <><strong>FLAG_SHARED_ADDRESS</strong> — 6 vendors at 14-A Civil Lines, Kanpur share one registered address. Cluster risk elevated.</>, time: '00:07' },
    { level: 'high', text: <><strong>FLAG_SHARED_DIRECTOR</strong> — Rajesh Kumar Verma sits on boards of C001, C002, C004. Coordinated bid-rigging pattern detected.</>, time: '00:12' },
    { level: 'high', text: <><strong>FLAG_NEW_COMPANY</strong> — Kanpur MediTech Pvt Ltd registered 67 days before ₹68L contract award. Shell company threshold exceeded.</>, time: '00:18' },
    { level: 'medium', text: <><strong>CLUSTER ALERT</strong> — 6-vendor Kanpur cluster scored average 76.5/100. Recommend referral to Ministry of Health vigilance unit.</>, time: '00:24' },
];

const FLAG_BARS = [
    { label: 'Shared Address', count: 6, color: 'var(--red)' },
    { label: 'Political Link', count: 5, color: 'var(--red)' },
    { label: 'Shared Director', count: 4, color: 'var(--amber)' },
    { label: 'New Company', count: 1, color: 'var(--amber)' },
    { label: 'Capital Mismatch', count: 0, color: 'var(--text-4)' },
];

export default function Dashboard({ onSelectVendor }) {
    const [visibleAlerts, setVisibleAlerts] = useState(3);
    const high = DEMO_VENDORS.filter(v => v.risk_level === 'HIGH');
    const totalRisk = high.reduce((s, v) => s + v.contract_total, 0);

    useEffect(() => {
        if (visibleAlerts >= ALERTS.length) return;
        const t = setTimeout(() => setVisibleAlerts(v => v + 1), 3500);
        return () => clearTimeout(t);
    }, [visibleAlerts]);

    return (
        <>
            {/* HERO */}
            <div className="hero">
                <div className="hero-content">
                    <div className="hero-eyebrow">
                        AI-Powered Fraud Detection &middot; India Public Procurement
                    </div>
                    <h1 className="hero-title">
                        Cross-referencing <span className="hl">3 open databases</span><br />
                        to catch fraud before it disappears.
                    </h1>
                    <p className="hero-sub">
                        Tender Trace maps company registrations, director networks, and politician
                        affidavits to automatically surface suspicious procurement clusters.
                        Amazon Bedrock narrates every finding in plain English.
                    </p>
                    <div className="hero-tags">
                        {['MCA21 Company Registry', 'MyNeta Affidavits', 'GeM Contracts', 'Amazon DynamoDB', 'Bedrock (Claude 3)', 'AWS Lambda', 'Amazon S3'].map(t => (
                            <span key={t} className="hero-tag">{t}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* STAT CARDS */}
            <div className="stat-grid">
                <div className="stat-card blue">
                    <div className="stat-label">Vendors Scanned</div>
                    <div className="stat-value"><AnimatedNum value={DEMO_VENDORS.length} /></div>
                    <div className="stat-sub">UP Medical Equipment 2022</div>
                </div>
                <div className="stat-card red">
                    <div className="stat-label">High Risk Vendors</div>
                    <div className="stat-value glow-red"><AnimatedNum value={high.length} /></div>
                    <div className="stat-trend up">Score 70+</div>
                </div>
                <div className="stat-card amber">
                    <div className="stat-label">Flags Triggered</div>
                    <div className="stat-value glow-amber">
                        <AnimatedNum value={DEMO_VENDORS.reduce((s, v) => s + v.flags.length, 0)} />
                    </div>
                    <div className="stat-sub">Across all vendors</div>
                </div>
                <div className="stat-card red">
                    <div className="stat-label">Contract Value at Risk</div>
                    <div className="stat-value" style={{ fontSize: '1.7rem', color: 'var(--red-soft)' }}>
                        {INR(totalRisk)}
                    </div>
                    <div className="stat-sub">Flagged procurement value</div>
                </div>
            </div>

            {/* FLAGS + LIVE ALERTS */}
            <div className="grid-2" style={{ marginBottom: '1rem' }}>

                <div className="card">
                    <div className="card-title">Flags Triggered Across Dataset</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {FLAG_BARS.map(({ label, count, color }) => (
                            <div key={label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>{label}</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{count}/{DEMO_VENDORS.length} vendors</span>
                                </div>
                                <div style={{ height: 5, background: 'var(--border-2)', borderRadius: 999, overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', borderRadius: 999,
                                        width: `${(count / DEMO_VENDORS.length) * 100}%`,
                                        background: color,
                                        boxShadow: count > 0 ? `0 0 8px ${color}` : 'none',
                                        transition: 'width 1s ease',
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Live Alert Feed</span>
                        <span style={{ color: 'var(--green-soft)', fontSize: '0.68rem', fontFamily: 'var(--mono)' }}>
                            SCANNING
                        </span>
                    </div>
                    <div className="alert-feed">
                        {ALERTS.slice(0, visibleAlerts).map((a, i) => (
                            <div key={i} className="alert-item">
                                <div className={`alert-dot ${a.level}`} />
                                <div className="alert-text" style={{ flex: 1 }}>{a.text}</div>
                                <div className="alert-time">{a.time}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* VENDOR TABLE */}
            <div className="card">
                <div className="card-title">
                    All Vendors &mdash; Click Row to Open Full Risk Report
                </div>
                <div className="vtable-wrap">
                    <table className="vtable">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Company Name</th>
                                <th>Risk Score</th>
                                <th>Level</th>
                                <th>Flags</th>
                                <th>Contract Value</th>
                                <th>State</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DEMO_VENDORS.map(v => (
                                <tr key={v.vendor_id} onClick={() => onSelectVendor(v)}>
                                    <td className="mono" style={{ color: 'var(--text-4)' }}>{v.vendor_id}</td>
                                    <td style={{ fontWeight: 600 }}>{v.vendor_name}</td>
                                    <td>
                                        <div className="sbar-wrap">
                                            <span style={{ fontWeight: 800, color: scoreColor(v.score), minWidth: 28, fontFamily: 'var(--mono)', fontSize: '0.85rem' }}>
                                                {v.score}
                                            </span>
                                            <div className="sbar">
                                                <div className="sbar-fill" style={{
                                                    width: `${v.score}%`,
                                                    background: scoreColor(v.score),
                                                    boxShadow: `0 0 6px ${scoreColor(v.score)}`,
                                                }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className={`badge ${v.risk_level.toLowerCase()}`}>{v.risk_level}</span></td>
                                    <td style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>
                                        {v.flags.length > 0
                                            ? <span style={{ color: 'var(--red-soft)' }}>{v.flags.length} flag{v.flags.length !== 1 ? 's' : ''}</span>
                                            : <span style={{ color: 'var(--green-soft)' }}>Clean</span>}
                                    </td>
                                    <td className="mono" style={{ fontSize: '0.8rem' }}>{INR(v.contract_total)}</td>
                                    <td style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>{v.state}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
