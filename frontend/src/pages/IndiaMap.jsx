import { useState } from 'react';
import { DEMO_VENDORS } from '../data';

// State-level aggregation from vendor data
const STATE_DATA = (() => {
    const raw = {
        'Uttar Pradesh': { fraudScore: 91, vendors: 8, contracts: 4.2, city: 'Kanpur', flags: ['Shell companies', 'Political links', 'Shared directors'] },
        'Bihar': { fraudScore: 74, vendors: 4, contracts: 1.8, city: 'Patna', flags: ['New companies', 'Capital mismatch'] },
        'Maharashtra': { fraudScore: 58, vendors: 6, contracts: 3.1, city: 'Mumbai', flags: ['Shared addresses'] },
        'Rajasthan': { fraudScore: 63, vendors: 5, contracts: 2.4, city: 'Jaipur', flags: ['Shared directors'] },
        'Madhya Pradesh': { fraudScore: 70, vendors: 3, contracts: 1.6, city: 'Bhopal', flags: ['Political links', 'New companies'] },
        'Gujarat': { fraudScore: 42, vendors: 7, contracts: 5.3, city: 'Ahmdbd', flags: ['Capital mismatch'] },
        'West Bengal': { fraudScore: 55, vendors: 4, contracts: 2.0, city: 'Kolkata', flags: ['Shared addresses'] },
        'Karnataka': { fraudScore: 31, vendors: 9, contracts: 7.2, city: 'Bengaluru', flags: [] },
        'Tamil Nadu': { fraudScore: 28, vendors: 8, contracts: 6.1, city: 'Chennai', flags: [] },
        'Telangana': { fraudScore: 22, vendors: 6, contracts: 4.8, city: 'Hyd', flags: [] },
        'Andhra Pradesh': { fraudScore: 35, vendors: 5, contracts: 3.3, city: 'Vizag', flags: ['New companies'] },
        'Odisha': { fraudScore: 48, vendors: 3, contracts: 1.4, city: 'BBSR', flags: ['Capital mismatch'] },
        'Jharkhand': { fraudScore: 67, vendors: 2, contracts: 0.9, city: 'Ranchi', flags: ['Shared addresses', 'New companies'] },
        'Punjab': { fraudScore: 39, vendors: 4, contracts: 2.2, city: 'Chd', flags: [] },
        'Haryana': { fraudScore: 45, vendors: 3, contracts: 1.7, city: 'Gurgaon', flags: ['Capital mismatch'] },
        'Delhi': { fraudScore: 51, vendors: 11, contracts: 9.4, city: 'Delhi', flags: ['Shared directors'] },
        'Kerala': { fraudScore: 18, vendors: 7, contracts: 5.6, city: 'TVM', flags: [] },
        'Assam': { fraudScore: 44, vendors: 3, contracts: 1.2, city: 'Guwahati', flags: ['New companies'] },
        'Chhattisgarh': { fraudScore: 56, vendors: 2, contracts: 0.8, city: 'Raipur', flags: ['Shared addresses'] },
        'Himachal Pradesh': { fraudScore: 27, vendors: 2, contracts: 1.0, city: 'Shimla', flags: [] },
    };
    return Object.entries(raw).map(([state, d]) => ({ state, ...d })).sort((a, b) => b.fraudScore - a.fraudScore);
})();

const scoreColor = (s) => {
    if (s >= 70) return { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.4)', text: '#ef4444', label: 'HIGH' };
    if (s >= 45) return { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.35)', text: '#f59e0b', label: 'MEDIUM' };
    return { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.3)', text: '#10b981', label: 'LOW' };
};

const INR_CR = (n) => `₹${n.toFixed(1)} Cr`;

const SUMMARY = {
    high: STATE_DATA.filter(s => s.fraudScore >= 70).length,
    medium: STATE_DATA.filter(s => s.fraudScore >= 45 && s.fraudScore < 70).length,
    low: STATE_DATA.filter(s => s.fraudScore < 45).length,
    totalContracts: STATE_DATA.reduce((s, d) => s + d.contracts, 0),
};

export default function IndiaMap() {
    const [selected, setSelected] = useState(null);
    const [filter, setFilter] = useState('all');

    const filtered = filter === 'all' ? STATE_DATA
        : filter === 'high' ? STATE_DATA.filter(s => s.fraudScore >= 70)
            : filter === 'medium' ? STATE_DATA.filter(s => s.fraudScore >= 45 && s.fraudScore < 70)
                : STATE_DATA.filter(s => s.fraudScore < 45);

    const s = selected ? STATE_DATA.find(d => d.state === selected) : null;

    return (
        <>
            <div className="ph">
                <h1 className="ph-title">India Fraud Heatmap</h1>
                <p className="ph-sub">
                    State-wise procurement fraud risk scores across <strong>{STATE_DATA.length} states</strong> — based on vendor registration patterns, political links, and contract anomalies
                </p>
            </div>

            {/* Summary strip */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[
                    { label: 'HIGH RISK States', val: SUMMARY.high, col: '#ef4444' },
                    { label: 'MEDIUM RISK States', val: SUMMARY.medium, col: '#f59e0b' },
                    { label: 'LOW RISK States', val: SUMMARY.low, col: '#10b981' },
                    { label: 'Total Contracts Tracked', val: INR_CR(SUMMARY.totalContracts), col: 'var(--text-2)' },
                ].map(({ label, val, col }) => (
                    <div key={label} className="stat-card" style={{ flex: '1 1 160px', minWidth: 140 }}>
                        <div className="stat-label">{label}</div>
                        <div className="stat-value" style={{ fontSize: '1.6rem', color: col }}>{val}</div>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {['all', 'high', 'medium', 'low'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                        padding: '0.35rem 1rem', borderRadius: 20, fontSize: '0.75rem',
                        border: `1px solid ${filter === f ? '#3b82f6' : 'var(--border)'}`,
                        background: filter === f ? 'rgba(59,130,246,0.15)' : 'var(--bg-card)',
                        color: filter === f ? '#3b82f6' : 'var(--text-3)',
                        cursor: 'pointer', fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize',
                    }}>{f === 'all' ? `All States (${STATE_DATA.length})` : f + ' Risk'}</button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 320px' : '1fr', gap: '1rem' }}>
                {/* State Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    {filtered.map(d => {
                        const c = scoreColor(d.fraudScore);
                        const isSelected = selected === d.state;
                        return (
                            <div key={d.state} onClick={() => setSelected(isSelected ? null : d.state)}
                                style={{
                                    background: isSelected ? c.bg : 'var(--bg-card)',
                                    border: `1px solid ${isSelected ? c.border : 'var(--border)'}`,
                                    borderRadius: 12, padding: '1rem',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    boxShadow: isSelected ? `0 0 16px ${c.text}33` : 'none',
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = c.border}
                                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)'; }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-1)' }}>{d.state}</div>
                                    <span style={{
                                        fontSize: '0.6rem', fontWeight: 800, padding: '2px 7px',
                                        borderRadius: 99, background: c.bg, color: c.text, border: `1px solid ${c.border}`,
                                    }}>{c.label}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                    <div style={{ flex: 1, height: 5, background: 'var(--border-2)', borderRadius: 99, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${d.fraudScore}%`, background: c.text, borderRadius: 99, boxShadow: `0 0 6px ${c.text}` }} />
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: c.text, fontFamily: 'var(--mono)', minWidth: 28 }}>{d.fraudScore}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-4)' }}>
                                    <span>{d.vendors} vendors</span>
                                    <span>{INR_CR(d.contracts)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Detail Panel */}
                {s && (() => {
                    const c = scoreColor(s.fraudScore);
                    return (
                        <div className="card" style={{ position: 'sticky', top: 80, height: 'fit-content', borderColor: c.border }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div className="card-title" style={{ margin: 0 }}>{s.state}</div>
                                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                            </div>
                            <div style={{ fontSize: '3rem', fontWeight: 900, color: c.text, textAlign: 'center', margin: '1rem 0', fontFamily: 'var(--mono)', textShadow: `0 0 20px ${c.text}66` }}>
                                {s.fraudScore}<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-4)' }}>/100</span>
                            </div>
                            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '4px 12px', borderRadius: 99, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{c.label} RISK</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.82rem' }}>
                                {[
                                    ['City', s.city],
                                    ['Vendors Tracked', s.vendors],
                                    ['Contract Value', INR_CR(s.contracts)],
                                ].map(([k, v]) => (
                                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ color: 'var(--text-4)' }}>{k}</span>
                                        <span style={{ fontWeight: 600, color: 'var(--text-2)', fontFamily: 'var(--mono)' }}>{v}</span>
                                    </div>
                                ))}
                            </div>
                            {s.flags.length > 0 && (
                                <div style={{ marginTop: '1rem' }}>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Active Flags</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        {s.flags.map(f => (
                                            <div key={f} style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#ef4444' }}>
                                                {f}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {s.flags.length === 0 && (
                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, color: '#10b981', fontSize: '0.8rem', textAlign: 'center' }}>
                                    No active fraud flags
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>

            {/* Legend */}
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', padding: '1rem', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Legend</span>
                {[['HIGH', '70–100', '#ef4444'], ['MEDIUM', '45–69', '#f59e0b'], ['LOW', '0–44', '#10b981']].map(([l, r, c]) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: c, boxShadow: `0 0 6px ${c}` }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{l}: score {r}</span>
                    </div>
                ))}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-4)', marginLeft: 'auto' }}>Click any state card for details</span>
            </div>
        </>
    );
}
