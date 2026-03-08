import { useState } from 'react';
import { DEMO_TENDERS, DEMO_VENDORS } from '../data';

const STATUS_META = {
    SANCTIONED: { label: 'Sanctioned', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', desc: 'Approved & awarded' },
    ONGOING: { label: 'Ongoing', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', desc: 'Currently executing' },
    PENDING: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', desc: 'Under review' },
    UPCOMING: { label: 'Upcoming', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', desc: 'Bidding open soon' },
};

const FILTERS = ['ALL', 'SANCTIONED', 'ONGOING', 'PENDING', 'UPCOMING'];

function fmt(val) {
    if (!val) return '—';
    if (val >= 10000000) return '\u20b9' + (val / 10000000).toFixed(1) + ' Cr';
    return '\u20b9' + (val / 100000).toFixed(1) + 'L';
}

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function TenderCard({ t, onSelectVendor }) {
    const [expanded, setExpanded] = useState(false);
    const meta = STATUS_META[t.status];
    const vendor = t.vendor_id ? DEMO_VENDORS.find(v => v.vendor_id === t.vendor_id) : null;

    const dateLabel = t.status === 'SANCTIONED' ? 'Sanctioned'
        : t.status === 'ONGOING' ? 'Started'
            : t.status === 'PENDING' ? 'Submitted'
                : 'Bids Open';
    const dateVal = t.sanctioned_date || t.start_date || t.submitted_date || t.bid_open_date;

    return (
        <div style={{
            background: 'var(--card)', borderRadius: 12,
            border: `1px solid ${t.flagged ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
            overflow: 'hidden',
        }}>
            {/* Header row */}
            <div onClick={() => setExpanded(e => !e)} style={{ padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Status badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 90, height: 34, borderRadius: 8, background: meta.bg, border: `1px solid ${meta.border}`, flexShrink: 0 }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: meta.color, letterSpacing: '0.06em' }}>{meta.label}</span>
                </div>

                {/* Main info */}
                <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.9rem', marginBottom: '0.25rem', lineHeight: 1.3 }}>{t.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>
                        {t.tender_id} &middot; {t.ministry} &middot; {t.state}
                    </div>
                </div>

                {/* Right side */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontWeight: 900, color: t.flagged ? '#ef4444' : 'var(--text-1)', fontSize: '1.05rem' }}>{fmt(t.value)}</span>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-4)' }}>{dateLabel}: {fmtDate(dateVal)}</div>
                    {t.flagged && (
                        <span style={{ fontSize: '0.6rem', padding: '0.15rem 0.45rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 4, fontWeight: 800 }}>FLAGGED VENDOR</span>
                    )}
                </div>
                <div style={{ color: 'var(--text-4)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none', alignSelf: 'center' }}>▾</div>
            </div>

            {/* Expanded detail */}
            {expanded && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.25rem', background: 'rgba(15,23,42,0.4)' }}>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', margin: '0 0 1rem', lineHeight: 1.7 }}>{t.description}</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
                        {[
                            { label: 'Tender Value', val: fmt(t.value) },
                            { label: 'Ministry', val: t.ministry },
                            { label: 'State', val: t.state },
                            t.status === 'ONGOING' && { label: 'End Date', val: fmtDate(t.end_date) },
                            t.status === 'UPCOMING' && { label: 'Bid Closes', val: fmtDate(t.bid_close_date) },
                            t.vendor_id && { label: 'Vendor ID', val: t.vendor_id },
                        ].filter(Boolean).map(({ label, val }) => (
                            <div key={label} style={{ background: 'var(--card)', borderRadius: 8, padding: '0.5rem 0.75rem', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{label}</div>
                                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-1)' }}>{val}</div>
                            </div>
                        ))}
                    </div>

                    {/* Vendor risk for assigned vendors */}
                    {vendor && (
                        <div style={{ background: t.flagged ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)', border: `1px solid ${t.flagged ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}`, borderRadius: 8, padding: '0.65rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', marginBottom: 2 }}>Assigned Vendor</div>
                                <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.85rem' }}>{vendor.vendor_name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', marginTop: 1 }}>Risk Score: {vendor.score}/100 · {vendor.flags.length} flag{vendor.flags.length !== 1 ? 's' : ''}</div>
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: vendor.score >= 70 ? '#ef4444' : vendor.score >= 40 ? '#f59e0b' : '#10b981' }}>{vendor.score}</span>
                            <button onClick={() => onSelectVendor && onSelectVendor(vendor)} style={{
                                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
                                color: '#93c5fd', borderRadius: 7, padding: '0.4rem 0.9rem',
                                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
                            }}>View Risk Report</button>
                        </div>
                    )}

                    {/* Upcoming — no vendor yet */}
                    {t.status === 'UPCOMING' && !t.vendor_id && (
                        <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: '1rem' }}>
                            Tender not yet awarded — Tender Trace will auto-scan vendor on award and flag any risks.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Tenders({ onSelectVendor }) {
    const [filter, setFilter] = useState('ALL');
    const [ministryFilter, setMinistryFilter] = useState('ALL');
    const [search, setSearch] = useState('');

    const ministries = ['ALL', ...new Set(DEMO_TENDERS.map(t => t.ministry))].sort();

    const counts = FILTERS.slice(1).reduce((acc, s) => { acc[s] = DEMO_TENDERS.filter(t => t.status === s).length; return acc; }, {});
    const flaggedCount = DEMO_TENDERS.filter(t => t.flagged).length;
    const totalValue = DEMO_TENDERS.reduce((s, t) => s + (t.value || 0), 0);

    const filtered = DEMO_TENDERS.filter(t => {
        if (filter !== 'ALL' && t.status !== filter) return false;
        if (ministryFilter !== 'ALL' && t.ministry !== ministryFilter) return false;
        if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.tender_id.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    return (
        <div style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)', margin: '0 0 0.25rem' }}>Tender Registry</h1>
                <p style={{ color: 'var(--text-4)', fontSize: '0.82rem', margin: 0 }}>Track sanctioned, ongoing, pending and upcoming government tenders</p>
            </div>

            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '0.65rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Tenders', val: DEMO_TENDERS.length, color: 'var(--text-1)' },
                    { label: 'Sanctioned', val: counts.SANCTIONED, color: '#ef4444' },
                    { label: 'Ongoing', val: counts.ONGOING, color: '#3b82f6' },
                    { label: 'Pending', val: counts.PENDING, color: '#f59e0b' },
                    { label: 'Upcoming', val: counts.UPCOMING, color: '#10b981' },
                ].map(({ label, val, color }) => (
                    <div key={label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.75rem 1rem' }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontWeight: 900, color, fontSize: '1.3rem' }}>{val}</div>
                    </div>
                ))}
            </div>

            {/* Risk alert */}
            {flaggedCount > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '0.75rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>
                        <strong style={{ color: '#ef4444' }}>{flaggedCount} tenders</strong> assigned to HIGH-risk vendors (total exposure: {fmt(DEMO_TENDERS.filter(t => t.flagged).reduce((s, t) => s + (t.value || 0), 0))}) — immediate review recommended
                    </span>
                </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {FILTERS.map(f => (
                        <button key={f} onClick={() => setFilter(f)} style={{
                            background: filter === f ? STATUS_META[f]?.bg || 'rgba(59,130,246,0.12)' : 'var(--card)',
                            border: `1px solid ${filter === f ? STATUS_META[f]?.border || 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
                            color: filter === f ? STATUS_META[f]?.color || '#93c5fd' : 'var(--text-3)',
                            borderRadius: 7, padding: '0.35rem 0.8rem',
                            fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
                        }}>{f === 'ALL' ? `All (${DEMO_TENDERS.length})` : `${STATUS_META[f].label} (${counts[f]})`}</button>
                    ))}
                </div>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or ID..."
                    style={{ marginLeft: 'auto', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 7, padding: '0.35rem 0.75rem', color: 'var(--text-1)', fontSize: '0.78rem', fontFamily: 'var(--font)', outline: 'none', minWidth: 200 }} />
            </div>

            {/* Ministry filter */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {ministries.slice(0, 8).map(m => (
                    <button key={m} onClick={() => setMinistryFilter(m)} style={{
                        background: ministryFilter === m ? 'rgba(99,102,241,0.12)' : 'var(--card)',
                        border: `1px solid ${ministryFilter === m ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
                        color: ministryFilter === m ? '#818cf8' : 'var(--text-4)',
                        borderRadius: 6, padding: '0.2rem 0.65rem',
                        fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
                    }}>{m === 'ALL' ? 'All Ministries' : m}</button>
                ))}
            </div>

            {/* Tender cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-4)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }}>No tenders match the selected filters</div>
                ) : (
                    filtered.map(t => <TenderCard key={t.tender_id} t={t} onSelectVendor={onSelectVendor} />)
                )}
            </div>
        </div>
    );
}
