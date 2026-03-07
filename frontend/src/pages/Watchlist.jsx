import { useState, useEffect } from 'react';
import { DEMO_VENDORS, FLAG_META } from '../data';

// ── Watchlist hook (shared localStorage) ─────────────────────────────
export function useWatchlist() {
    const [list, setList] = useState(() => {
        try { return JSON.parse(localStorage.getItem('tt-watchlist') || '[]'); } catch { return []; }
    });
    const toggle = (id) => setList(prev => {
        const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
        localStorage.setItem('tt-watchlist', JSON.stringify(next));
        return next;
    });
    const has = (id) => list.includes(id);
    return { list, toggle, has, count: list.length };
}

export default function Watchlist({ onSelectVendor }) {
    const { list, toggle } = useWatchlist();
    const vendors = DEMO_VENDORS.filter(v => list.includes(v.vendor_id));

    const exportCSV = () => {
        const headers = ['ID', 'Name', 'State', 'Ministry', 'Score', 'Risk', 'Contract Total', 'Flags'];
        const rows = vendors.map(v => [
            v.vendor_id, v.vendor_name, v.state, v.ministry,
            v.score, v.risk_level,
            '₹' + (v.contract_total / 10000000).toFixed(2) + ' Cr',
            v.flags.join(' | ')
        ]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'watchlist.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>
                        Watchlist
                    </h1>
                    <p style={{ color: 'var(--text-4)', fontSize: '0.82rem', margin: '0.25rem 0 0' }}>
                        {vendors.length} vendor{vendors.length !== 1 ? 's' : ''} saved for monitoring
                    </p>
                </div>
                {vendors.length > 0 && (
                    <button onClick={exportCSV} style={{
                        background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                        color: '#34d399', borderRadius: 8, padding: '0.5rem 1.25rem',
                        fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font)',
                    }}>
                        Export CSV
                    </button>
                )}
            </div>

            {vendors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-4)' }}>[ ]</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-2)', marginBottom: '0.5rem' }}>No vendors on watchlist</div>
                    <p style={{ color: 'var(--text-4)', fontSize: '0.82rem' }}>Open any vendor in the Vendor Scan page and click "Add to Watchlist"</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {vendors.map(v => (
                        <div key={v.vendor_id} style={{
                            background: 'var(--card)', border: `1px solid ${v.risk_level === 'HIGH' ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`,
                            borderRadius: 12, padding: '1rem 1.25rem',
                            display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
                        }}>
                            <div style={{
                                minWidth: 48, height: 48, borderRadius: 10,
                                background: v.risk_level === 'HIGH' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 900, fontSize: '0.9rem',
                                color: v.risk_level === 'HIGH' ? '#ef4444' : '#f59e0b',
                            }}>{v.score}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.9rem' }}>{v.vendor_name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-4)', marginTop: 2 }}>{v.vendor_id} · {v.state} · {v.ministry}</div>
                                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                                    {v.flags.slice(0, 3).map(f => (
                                        <span key={f} style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 4, fontWeight: 600 }}>
                                            {f.replace('FLAG_', '')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => onSelectVendor && onSelectVendor(v)} style={{
                                    background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
                                    color: '#93c5fd', borderRadius: 7, padding: '0.4rem 0.9rem',
                                    fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
                                }}>View Report</button>
                                <button onClick={() => toggle(v.vendor_id)} style={{
                                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                                    color: '#ef4444', borderRadius: 7, padding: '0.4rem 0.9rem',
                                    fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
                                }}>Remove</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
