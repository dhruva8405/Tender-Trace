import { useState, useEffect } from 'react';
import { DEMO_VENDORS } from '../data';

// ── Subscribe to Alerts Modal ──────────────────────────────────────
function AlertModal({ onClose }) {
    const [email, setEmail] = useState('');
    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (!email.includes('@')) return;
        setLoading(true);
        await new Promise(r => setTimeout(r, 1200));
        setDone(true);
        setLoading(false);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }} onClick={onClose}>
            <div style={{
                background: '#0b1120', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 16,
                padding: '2rem', maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
            }} onClick={e => e.stopPropagation()}>
                {!done ? (
                    <>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: '0.4rem' }}>Subscribe to Fraud Alerts</div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                            Get instant email notifications via <strong style={{ color: '#f59e0b' }}>Amazon SNS</strong> when a HIGH RISK vendor is detected or a new fraud cluster is identified.
                        </p>
                        <input
                            type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="ministry-official@gov.in"
                            style={{
                                width: '100%', padding: '0.7rem 1rem', borderRadius: 10, boxSizing: 'border-box',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                                color: 'var(--text-1)', fontSize: '0.88rem', fontFamily: 'var(--font)',
                                outline: 'none', marginBottom: '0.75rem',
                            }}
                        />
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={submit} disabled={loading || !email.includes('@')} style={{
                                flex: 1, background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                border: 'none', borderRadius: 10, padding: '0.7rem',
                                color: 'white', fontWeight: 700, fontSize: '0.85rem',
                                cursor: !email.includes('@') || loading ? 'not-allowed' : 'pointer',
                                opacity: !email.includes('@') || loading ? 0.6 : 1,
                                fontFamily: 'var(--font)',
                            }}>
                                {loading ? 'Subscribing…' : 'Subscribe via SNS'}
                            </button>
                            <button onClick={onClose} style={{
                                background: 'transparent', border: '1px solid var(--border)',
                                borderRadius: 10, padding: '0.7rem 1rem',
                                color: 'var(--text-3)', fontWeight: 600, fontSize: '0.85rem',
                                cursor: 'pointer', fontFamily: 'var(--font)',
                            }}>Cancel</button>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', color: '#10b981', fontWeight: 800 }}>✓</div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#10b981', marginBottom: '0.5rem' }}>Subscribed!</div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                            Alert confirmation sent to <strong style={{ color: 'var(--text-1)' }}>{email}</strong> via Amazon SNS. You'll receive notifications for all HIGH RISK detections.
                        </p>
                        <button onClick={onClose} style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            border: 'none', borderRadius: 10, padding: '0.7rem 1.5rem',
                            color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
                        }}>Done</button>
                    </div>
                )}
            </div>
        </div>
    );
}

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
    const [showModal, setShowModal] = useState(false);
    const high = DEMO_VENDORS.filter(v => v.risk_level === 'HIGH');
    const totalRisk = high.reduce((s, v) => s + v.contract_total, 0);

    useEffect(() => {
        if (visibleAlerts >= ALERTS.length) return;
        const t = setTimeout(() => setVisibleAlerts(v => v + 1), 3500);
        return () => clearTimeout(t);
    }, [visibleAlerts]);

    return (
        <>
            {showModal && <AlertModal onClose={() => setShowModal(false)} />}

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

            {/* FRAUD ALERT BANNER */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(245,158,11,0.08))',
                border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14,
                padding: '1rem 1.5rem', marginBottom: '1rem',
                display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444', animation: 'pulse 1.5s infinite' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-2)', fontWeight: 600 }}>
                        Live scan detected <strong style={{ color: '#ef4444' }}>₹{(totalRisk / 10000000).toFixed(1)} Cr</strong> in high-risk procurement across <strong style={{ color: '#f59e0b' }}>{high.length} vendors</strong> — real-time alerts powered by Amazon SNS
                    </span>
                </div>
                <button onClick={() => setShowModal(true)} style={{
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    border: 'none', borderRadius: 10, padding: '0.55rem 1.2rem',
                    color: 'white', fontWeight: 700, fontSize: '0.8rem',
                    cursor: 'pointer', fontFamily: 'var(--font)',
                    boxShadow: '0 4px 14px rgba(239,68,68,0.4)', whiteSpace: 'nowrap',
                }}>Subscribe to Alerts</button>
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
