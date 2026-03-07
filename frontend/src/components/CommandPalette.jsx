import { useState, useEffect, useRef } from 'react';
import { DEMO_VENDORS } from '../data';

const PAGES = [
    { id: 'dashboard', label: 'Dashboard', desc: 'Overview and live feed' },
    { id: 'search', label: 'Vendor Scan', desc: 'Deep-dive individual vendor report' },
    { id: 'analytics', label: 'Analytics', desc: 'Charts, distributions, ministry analysis' },
    { id: 'graph', label: 'Cluster Graph', desc: 'Visual fraud network map' },
    { id: 'agent', label: 'AI Agent', desc: 'Autonomous investigation agent' },
    { id: 'map', label: 'India Map', desc: 'State-wise fraud heatmap' },
    { id: 'watchlist', label: 'Watchlist', desc: 'Saved vendors for monitoring' },
    { id: 'compare', label: 'Compare', desc: 'Side-by-side vendor comparison' },
    { id: 'reports', label: 'Saved Reports', desc: 'Previous investigation reports' },
    { id: 'tip', label: 'Submit Tip', desc: 'Whistleblower anonymous tip' },
    { id: 'pipeline', label: 'How It Works', desc: 'Architecture and methodology' },
];

export default function CommandPalette({ open, onClose, onNavigate }) {
    const [q, setQ] = useState('');
    const inputRef = useRef(null);
    const [selected, setSelected] = useState(0);

    const vendorResults = DEMO_VENDORS.filter(v =>
        v.vendor_name.toLowerCase().includes(q.toLowerCase()) ||
        v.vendor_id.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 4);

    const pageResults = PAGES.filter(p =>
        p.label.toLowerCase().includes(q.toLowerCase()) ||
        p.desc.toLowerCase().includes(q.toLowerCase())
    );

    const all = [
        ...pageResults.map(p => ({ type: 'page', ...p })),
        ...vendorResults.map(v => ({ type: 'vendor', id: 'search', label: v.vendor_name, desc: `${v.vendor_id} · Score ${v.score} · ${v.risk_level}`, vendor: v })),
    ];

    useEffect(() => {
        if (open) { setQ(''); setSelected(0); setTimeout(() => inputRef.current?.focus(), 50); }
    }, [open]);

    useEffect(() => { setSelected(0); }, [q]);

    const handleKey = (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, all.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
        if (e.key === 'Enter' && all[selected]) pick(all[selected]);
        if (e.key === 'Escape') onClose();
    };

    const pick = (item) => {
        if (item.type === 'vendor') onNavigate('search', item.vendor);
        else onNavigate(item.id);
        onClose();
    };

    if (!open) return null;

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh', backdropFilter: 'blur(4px)' }}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                    <input
                        ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={handleKey}
                        placeholder="Search pages or vendors..."
                        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-1)', fontSize: '0.95rem', fontFamily: 'var(--font)' }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-4)', background: 'var(--border)', padding: '0.2rem 0.4rem', borderRadius: 4 }}>ESC</span>
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {all.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-4)', fontSize: '0.85rem' }}>No results for "{q}"</div>
                    )}
                    {all.map((item, i) => (
                        <div key={i} onClick={() => pick(item)}
                            style={{ padding: '0.7rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', background: i === selected ? 'rgba(59,130,246,0.08)' : 'transparent', borderLeft: i === selected ? '2px solid #3b82f6' : '2px solid transparent' }}
                            onMouseEnter={() => setSelected(i)}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: item.type === 'vendor' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: item.type === 'vendor' ? '#ef4444' : '#3b82f6', flexShrink: 0 }}>
                                {item.type === 'vendor' ? (item.vendor?.score || '?') : item.label.slice(0, 2)}
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>{item.desc}</div>
                            </div>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-4)', background: 'var(--border)', padding: '0.15rem 0.4rem', borderRadius: 4, flexShrink: 0 }}>
                                {item.type === 'vendor' ? 'VENDOR' : 'PAGE'}
                            </span>
                        </div>
                    ))}
                </div>
                <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem', fontSize: '0.68rem', color: 'var(--text-4)' }}>
                    <span>↑↓ Navigate</span><span>↵ Open</span><span>ESC Dismiss</span>
                    <span style={{ marginLeft: 'auto' }}>Ctrl+K to open</span>
                </div>
            </div>
        </div>
    );
}
