import { useState } from 'react';
import { DEMO_VENDORS } from '../data';

const RISK_COLOR = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981' };
const RISK_BG = { HIGH: 'rgba(239,68,68,0.08)', MEDIUM: 'rgba(245,158,11,0.08)', LOW: 'rgba(16,185,129,0.08)' };

function ScoreBar({ a, b }) {
    const max = 100;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0.25rem 0' }}>
            <div style={{ flex: 1, height: 6, background: 'var(--border-2)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${a}%`, background: RISK_COLOR[a >= 70 ? 'HIGH' : a >= 40 ? 'MEDIUM' : 'LOW'], borderRadius: 999 }} />
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', width: 24, textAlign: 'right' }}>{a}</span>
            <span style={{ color: 'var(--text-4)', fontSize: '0.72rem' }}>vs</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', width: 24 }}>{b}</span>
            <div style={{ flex: 1, height: 6, background: 'var(--border-2)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${b}%`, background: RISK_COLOR[b >= 70 ? 'HIGH' : b >= 40 ? 'MEDIUM' : 'LOW'], borderRadius: 999 }} />
            </div>
        </div>
    );
}

function VendorPicker({ label, selected, onSelect }) {
    const [q, setQ] = useState('');
    const results = DEMO_VENDORS.filter(v =>
        v.vendor_name.toLowerCase().includes(q.toLowerCase()) || v.vendor_id.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 6);

    return (
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '0.5rem' }}>{label}</div>
            {selected ? (
                <div style={{ background: 'var(--card)', border: `1px solid ${RISK_COLOR[selected.risk_level]}44`, borderRadius: 10, padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-1)' }}>{selected.vendor_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-4)', margin: '0.2rem 0' }}>{selected.vendor_id} · {selected.state}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, color: RISK_COLOR[selected.risk_level], fontSize: '1.1rem' }}>{selected.score}</span>
                        <span style={{ fontSize: '0.72rem', color: RISK_COLOR[selected.risk_level], background: RISK_BG[selected.risk_level], padding: '0.2rem 0.5rem', borderRadius: 4 }}>{selected.risk_level}</span>
                        <button onClick={() => onSelect(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', fontSize: '0.78rem' }}>Change</button>
                    </div>
                </div>
            ) : (
                <div>
                    <input
                        value={q} onChange={e => setQ(e.target.value)}
                        placeholder="Search vendor name or ID..."
                        style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.6rem 0.9rem', color: 'var(--text-1)', fontSize: '0.85rem', fontFamily: 'var(--font)', boxSizing: 'border-box', outline: 'none' }}
                    />
                    {q && (
                        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, marginTop: 4, overflow: 'hidden' }}>
                            {results.map(v => (
                                <div key={v.vendor_id} onClick={() => { onSelect(v); setQ(''); }} style={{
                                    padding: '0.6rem 0.9rem', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center',
                                    borderBottom: '1px solid var(--border)', fontSize: '0.82rem',
                                }} onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <span style={{ color: RISK_COLOR[v.risk_level], fontWeight: 800, minWidth: 28 }}>{v.score}</span>
                                    <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{v.vendor_name}</span>
                                    <span style={{ color: 'var(--text-4)', marginLeft: 'auto' }}>{v.vendor_id}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Compare() {
    const [vendorA, setVendorA] = useState(null);
    const [vendorB, setVendorB] = useState(null);

    const FIELDS = vendorA && vendorB ? [
        { label: 'Risk Score', a: vendorA.score, b: vendorB.score, isScore: true },
        { label: 'Contract Total', a: '₹' + (vendorA.contract_total / 10000000).toFixed(2) + ' Cr', b: '₹' + (vendorB.contract_total / 10000000).toFixed(2) + ' Cr' },
        { label: 'Paid-up Capital', a: '₹' + (vendorA.paid_up_capital / 100000).toFixed(1) + 'L', b: '₹' + (vendorB.paid_up_capital / 100000).toFixed(1) + 'L' },
        { label: 'State', a: vendorA.state, b: vendorB.state },
        { label: 'Ministry', a: vendorA.ministry, b: vendorB.ministry },
        { label: 'Registered', a: vendorA.registration_date, b: vendorB.registration_date },
        { label: 'Risk Level', a: vendorA.risk_level, b: vendorB.risk_level },
        { label: 'Flag Count', a: vendorA.flags.length, b: vendorB.flags.length },
    ] : [];

    return (
        <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)', margin: '0 0 0.5rem' }}>Vendor Comparison</h1>
            <p style={{ color: 'var(--text-4)', fontSize: '0.82rem', margin: '0 0 1.5rem' }}>Select two vendors to compare their risk profiles side by side</p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <VendorPicker label="Vendor A" selected={vendorA} onSelect={setVendorA} />
                <div style={{ display: 'flex', alignItems: 'center', paddingTop: 28, color: 'var(--text-4)', fontWeight: 700 }}>vs</div>
                <VendorPicker label="Vendor B" selected={vendorB} onSelect={setVendorB} />
            </div>

            {vendorA && vendorB && (
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                    {/* Score bar */}
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>Risk Score Comparison</div>
                        <ScoreBar a={vendorA.score} b={vendorB.score} />
                    </div>

                    {/* Field rows */}
                    {FIELDS.slice(1).map(({ label, a, b }) => (
                        <div key={label} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr', padding: '0.7rem 1.25rem', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                            <div style={{ color: a !== b && label !== 'State' && label !== 'Ministry' && label !== 'Registered' ? (a > b ? '#10b981' : '#ef4444') : 'var(--text-2)', fontWeight: 600, fontSize: '0.85rem' }}>{a}</div>
                            <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                            <div style={{ textAlign: 'right', color: a !== b && label !== 'State' && label !== 'Ministry' && label !== 'Registered' ? (b > a ? '#10b981' : '#ef4444') : 'var(--text-2)', fontWeight: 600, fontSize: '0.85rem' }}>{b}</div>
                        </div>
                    ))}

                    {/* Flags */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr', padding: '0.75rem 1.25rem', alignItems: 'start' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                            {vendorA.flags.map(f => <span key={f} style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 4 }}>{f.replace('FLAG_', '')}</span>)}
                        </div>
                        <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', paddingTop: 4 }}>Flags</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', justifyContent: 'flex-end' }}>
                            {vendorB.flags.map(f => <span key={f} style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 4 }}>{f.replace('FLAG_', '')}</span>)}
                        </div>
                    </div>

                    {/* Verdict */}
                    <div style={{ padding: '1rem 1.25rem', background: 'rgba(15,23,42,0.5)', fontSize: '0.82rem', color: 'var(--text-3)' }}>
                        {vendorA.score > vendorB.score
                            ? <><strong style={{ color: '#ef4444' }}>{vendorA.vendor_name}</strong> is higher risk (+{vendorA.score - vendorB.score} pts). {vendorA.flags.length > vendorB.flags.length ? `It has ${vendorA.flags.length - vendorB.flags.length} more red flag(s).` : ''}</>
                            : vendorB.score > vendorA.score
                                ? <><strong style={{ color: '#ef4444' }}>{vendorB.vendor_name}</strong> is higher risk (+{vendorB.score - vendorA.score} pts). {vendorB.flags.length > vendorA.flags.length ? `It has ${vendorB.flags.length - vendorA.flags.length} more red flag(s).` : ''}</>
                                : <>Both vendors have equal risk scores. Review individual flags for differentiation.</>
                        }
                    </div>
                </div>
            )}
        </div>
    );
}
