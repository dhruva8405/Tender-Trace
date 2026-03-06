import { useState, useEffect } from 'react';
import { DEMO_VENDORS, FLAG_META, DEMO_NARRATIONS, fetchVendorRisk } from '../data';

const INR = (n) => '₹' + Number(n).toLocaleString('en-IN');
const scoreColor = (s) => s >= 70 ? '#ef4444' : s >= 40 ? '#f59e0b' : '#10b981';
const ALL_FLAGS = Object.keys(FLAG_META);

// ── Animated score ring ────────────────────────────────────────────
function ScoreRing({ score }) {
    const [displayed, setDisplayed] = useState(0);
    const r = 66;
    const circ = 2 * Math.PI * r;
    const color = scoreColor(score);

    useEffect(() => {
        let start = null;
        const step = (ts) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / 1000, 1);
            setDisplayed(Math.round((1 - Math.pow(1 - p, 3)) * score));
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [score]);

    const fill = (displayed / 100) * circ;
    return (
        <div style={{ width: 160, height: 160, position: 'relative', flexShrink: 0 }}>
            <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
                <circle cx="80" cy="80" r={r} fill="none" stroke="var(--border-2)" strokeWidth="10" />
                <circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="14"
                    strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
                    style={{ filter: `blur(6px)`, opacity: 0.35 }} />
                <circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="10"
                    strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color }}>{displayed}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>/ 100</div>
                <div style={{ fontSize: '0.65rem', marginTop: 3, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color }}>
                    {score >= 70 ? 'HIGH RISK' : score >= 40 ? 'MED RISK' : 'LOW RISK'}
                </div>
            </div>
        </div>
    );
}

// ── Refer to Vigilance Modal ───────────────────────────────────────
function VigilanceModal({ vendor, onClose }) {
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const submit = () => {
        setLoading(true);
        setTimeout(() => { setLoading(false); setSubmitted(true); }, 1800);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1rem',
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-card-2)', border: '1px solid var(--border-2)',
                borderRadius: 16, padding: '2rem', maxWidth: 520, width: '100%',
                boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
            }} onClick={e => e.stopPropagation()}>
                {!submitted ? (
                    <>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                            Refer to Vigilance Unit
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                            This will generate a formal investigation referral for <strong style={{ color: 'var(--text-1)' }}>{vendor?.vendor_name}</strong> and forward it to the concerned ministry's vigilance officer.
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
                            {[
                                { field: 'Vendor', value: vendor?.vendor_name },
                                { field: 'Vendor ID', value: vendor?.vendor_id },
                                { field: 'Risk Score', value: `${vendor?.score}/100 (${vendor?.risk_level})` },
                                { field: 'Flags', value: vendor?.flags?.join(', ') || 'None' },
                                { field: 'Referring To', value: 'Ministry of H&FW — Central Vigilance Unit' },
                                { field: 'Reference No', value: `NYN-2022-${vendor?.vendor_id}-${Date.now().toString().slice(-4)}` },
                            ].map(({ field, value }) => (
                                <div key={field} style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-4)', minWidth: 100, flexShrink: 0 }}>{field}</span>
                                    <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{value}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={submit} disabled={loading} style={{
                                flex: 1, background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                border: 'none', borderRadius: 10, padding: '0.8rem',
                                color: 'white', fontWeight: 700, fontSize: '0.875rem',
                                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font)',
                                boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
                            }}>
                                {loading ? 'Submitting…' : 'File Referral'}
                            </button>
                            <button onClick={onClose} style={{
                                background: 'var(--bg-card)', border: '1px solid var(--border-2)',
                                borderRadius: 10, padding: '0.8rem 1.25rem',
                                color: 'var(--text-3)', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'var(--font)',
                            }}>
                                Cancel
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', color: '#34d399', fontSize: '1.25rem', fontWeight: 800 }}>OK</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                            Referral Filed Successfully
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                            <span style={{ fontFamily: 'var(--mono)', color: '#34d399' }}>NYN-REF-{Date.now().toString().slice(-6)}</span> has been forwarded to the
                            Ministry of Health & Family Welfare vigilance unit and the UP Vigilance Establishment.
                        </div>
                        <button onClick={onClose} style={{
                            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                            borderRadius: 10, padding: '0.7rem 1.5rem',
                            color: '#34d399', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
                        }}>
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Export report as JSON file ─────────────────────────────────────
function exportReport(result) {
    const report = {
        generated_by: 'Tender Trace v1.0 – AI ASCEND 2026',
        generated_at: new Date().toISOString(),
        vendor: {
            id: result.vendor_id,
            name: result.vendor_name,
            address: result.address,
            registration_date: result.registration_date,
            paid_up_capital: result.paid_up_capital,
            state: result.state,
            ministry: result.ministry,
        },
        risk_assessment: {
            score: result.score,
            risk_level: result.risk_level,
            flags: result.flags,
            contract_total_inr: result.contract_total,
        },
        ai_narration: result.narration,
        data_sources: ['MCA21 Company Registry', 'MyNeta ECI Affidavits', 'Government e-Marketplace (GeM)'],
        recommended_action: result.score >= 70
            ? 'Refer to Ministry Vigilance Unit for manual investigation'
            : 'Monitor — no immediate action required',
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tender Trace_Report_${result.vendor_id}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// ── Main component ─────────────────────────────────────────────────
export default function VendorSearch({ preselected }) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [vigilanceOpen, setVigilanceOpen] = useState(false);
    const [exportFlash, setExportFlash] = useState(false);

    useEffect(() => {
        if (preselected) {
            setQuery(preselected.vendor_name);
            setResult({ ...preselected, narration: DEMO_NARRATIONS[preselected.vendor_id] || DEMO_NARRATIONS.DEFAULT });
        }
    }, [preselected]);

    const handleInput = (val) => {
        setQuery(val);
        setSuggestions(val.length > 1
            ? DEMO_VENDORS.filter(v => v.vendor_name.toLowerCase().includes(val.toLowerCase())).slice(0, 5)
            : []);
    };

    const search = async (override) => {
        const q = override || query;
        if (!q.trim()) return;
        setLoading(true); setError(''); setSuggestions([]);
        try {
            const data = await fetchVendorRisk(q.trim());
            if (data.error) { setError(data.error); setResult(null); }
            else setResult(data);
        } catch { setError('Scan failed — try again.'); }
        finally { setLoading(false); }
    };

    const pick = (v) => {
        setQuery(v.vendor_name); setSuggestions([]);
        setResult({ ...v, narration: DEMO_NARRATIONS[v.vendor_id] || DEMO_NARRATIONS.DEFAULT });
    };

    const handleExport = () => {
        exportReport(result);
        setExportFlash(true);
        setTimeout(() => setExportFlash(false), 2000);
    };

    const riskLevel = result ? (result.score >= 70 ? 'HIGH' : result.score >= 40 ? 'MEDIUM' : 'LOW') : null;
    const riskColor = riskLevel === 'HIGH' ? 'var(--red)' : riskLevel === 'MEDIUM' ? 'var(--amber)' : 'var(--green)';

    return (
        <>
            {vigilanceOpen && result && (
                <VigilanceModal vendor={result} onClose={() => setVigilanceOpen(false)} />
            )}

            <div className="ph">
                <h1 className="ph-title">Vendor Risk Scanner</h1>
                <p className="ph-sub">Search any vendor by company name or ID to see their full AI-generated risk report</p>
            </div>

            {/* ── SEARCH ─────────────────────────────── */}
            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                <div className="search-wrap">
                    <div className="search-icon-wrap">&#x2315;</div>
                    <input className="search-input" value={query}
                        onChange={e => handleInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && search()}
                        placeholder="e.g. Kanpur MediTech or C001…" />
                    <button className="btn-scan" onClick={() => search()} disabled={loading}>
                        {loading ? 'Scanning…' : 'Scan Vendor'}
                    </button>
                </div>
                {suggestions.length > 0 && (
                    <div className="dropdown" style={{ left: 0, right: 150 }}>
                        {suggestions.map(v => (
                            <div key={v.vendor_id} className="dropdown-item" onClick={() => pick(v)}>
                                <span>{v.vendor_name}</span>
                                <span className={`badge ${v.risk_level.toLowerCase()}`}>{v.score}/100</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="quick-pills">
                <span className="quick-label">Quick scan:</span>
                {DEMO_VENDORS.slice(0, 6).map(v => (
                    <button key={v.vendor_id} className="pill" onClick={() => pick(v)}>{v.vendor_id}</button>
                ))}
            </div>

            {error && (
                <div style={{ padding: '1rem 1.25rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius)', color: 'var(--red-soft)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    {error}
                </div>
            )}

            {/* ── RISK REPORT ─────────────────────────── */}
            {result && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Header card */}
                    <div className="card" style={{ borderColor: riskColor + '30', boxShadow: `0 0 40px ${riskColor}06` }}>
                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            <ScoreRing score={result.score} />
                            <div style={{ flex: 1, minWidth: 220 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{result.vendor_name}</h2>
                                    <span className={`badge ${riskLevel?.toLowerCase()}`}>{riskLevel} RISK</span>
                                </div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--text-4)', marginBottom: '1rem' }}>
                                    Vendor ID: {result.vendor_id}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 1.5rem', fontSize: '0.82rem' }}>
                                    {[
                                        ['Registered Office', result.address],
                                        ['Incorporation Date', result.registration_date],
                                        ['Paid-up Capital', '₹' + Number(result.paid_up_capital).toLocaleString('en-IN')],
                                        ['Contract Total', INR(result.contract_total)],
                                        ['State', result.state],
                                        ['Ministry', result.ministry],
                                    ].map(([k, v]) => (
                                        <>
                                            <div key={'k' + k} style={{ color: 'var(--text-4)' }}>{k}</div>
                                            <div key={'v' + k} style={{ color: 'var(--text-1)', fontWeight: 500 }}>{v}</div>
                                        </>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                            {result.risk_level === 'HIGH' && (
                                <button onClick={() => setVigilanceOpen(true)} style={{
                                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                    border: 'none', borderRadius: 10, padding: '0.65rem 1.25rem',
                                    color: 'white', fontWeight: 700, fontSize: '0.85rem',
                                    cursor: 'pointer', fontFamily: 'var(--font)',
                                    boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                }}>
                                    Refer to Vigilance Unit
                                </button>
                            )}
                            <button onClick={handleExport} style={{
                                background: exportFlash ? 'rgba(16,185,129,0.15)' : 'var(--bg-card-2)',
                                border: `1px solid ${exportFlash ? 'rgba(16,185,129,0.4)' : 'var(--border-2)'}`,
                                borderRadius: 10, padding: '0.65rem 1.25rem',
                                color: exportFlash ? '#34d399' : 'var(--text-2)',
                                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--font)',
                                display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s',
                            }}>
                                {exportFlash ? 'Downloaded' : 'Export Report (JSON)'}
                            </button>
                            <button onClick={() => {
                                const url = `mailto:vigilance@health.gov.in?subject=Tender Trace Alert: ${result.vendor_name}&body=Vendor ${result.vendor_id} has been flagged with score ${result.score}/100. Flags: ${result.flags?.join(', ')}. Please initiate investigation.`;
                                window.open(url);
                            }} style={{
                                background: 'var(--bg-card-2)', border: '1px solid var(--border-2)',
                                borderRadius: 10, padding: '0.65rem 1.25rem',
                                color: 'var(--text-2)', fontWeight: 600, fontSize: '0.85rem',
                                cursor: 'pointer', fontFamily: 'var(--font)',
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                            }}>
                                Email Alert
                            </button>
                        </div>
                    </div>

                    {/* Flags */}
                    <div className="card">
                        <div className="card-title">Red Flag Analysis — 5 Rules</div>
                        <div className="flag-grid">
                            {ALL_FLAGS.map(flag => {
                                const hit = result.flags?.includes(flag);
                                const meta = FLAG_META[flag];
                                return (
                                    <div key={flag} className={`flag-row ${hit ? 'triggered' : 'clear'}`}>
                                        <div className="flag-icon-wrap">{hit ? '!' : '✓'}</div>
                                        <div className="flag-body">
                                            <div className="flag-name-row">
                                                <span className="flag-name">{meta.label}</span>
                                                <span className="flag-weight">+{meta.weight} pts</span>
                                            </div>
                                            <div className="flag-desc">{meta.description}</div>
                                        </div>
                                        {hit && (
                                            <div style={{
                                                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                                                padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.68rem',
                                                color: 'var(--red-soft)', fontWeight: 700, fontFamily: 'var(--mono)', flexShrink: 0,
                                            }}>TRIGGERED</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bedrock narration */}
                    <div className="narration-card">
                        <div className="narration-header">
                            <div className="ai-chip">Bedrock &middot; Claude 3 Haiku</div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-4)' }}>AI-generated plain English summary</span>
                        </div>
                        <p className="narration-text">{result.narration}</p>
                    </div>

                    {/* Recommendations */}
                    {result.score >= 70 && (
                        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)' }}>
                            <div className="card-title">Recommended Actions</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {[
                                    { num: '01', action: 'Physical verification of registered office at 14-A Civil Lines, Kanpur' },
                                    { num: '02', action: 'Audit of all contracts awarded to this vendor — check delivery and quality reports' },
                                    { num: '03', action: 'Cross-reference director DINs with ECI politician affidavit database' },
                                    { num: '04', action: 'File referral with Ministry of H&FW Central Vigilance Unit' },
                                    { num: '05', action: 'Freeze vendor from receiving further contracts pending enquiry' },
                                ].map(({ num, action }) => (
                                    <div key={action} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '0.83rem', color: 'var(--text-2)', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <span style={{ flexShrink: 0, fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-4)', minWidth: 24 }}>{num}</span>
                                        <span>{action}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!result && !error && (
                <div className="empty-state">
                    <div className="e-icon" style={{ fontSize: '2rem', color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>[ ]</div>
                    <p>Enter a company name or vendor ID above to see their Tender Trace risk report, AI narration, and flag breakdown</p>
                </div>
            )}
        </>
    );
}
