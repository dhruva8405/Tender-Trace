import { useState, useEffect } from 'react';
import { DEMO_VENDORS } from '../data';

const API_BASE = import.meta.env.VITE_API_URL || 'https://xhi54p2nma.execute-api.us-east-1.amazonaws.com/prod';

const RISK_COLOR = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981' };
const RISK_BG = { HIGH: 'rgba(239,68,68,0.1)', MEDIUM: 'rgba(245,158,11,0.1)', LOW: 'rgba(16,185,129,0.1)' };

const FLAG_LABELS = {
    FLAG_SHELL_COMPANY: 'Shell Company',
    FLAG_POLITICAL_LINK: 'Political Link',
    FLAG_SHARED_ADDRESS: 'Shared Address',
    FLAG_SAME_ADDRESS_CLUSTER: 'Address Cluster',
    FLAG_RAPID_REGISTRATION: 'Rapid Registration',
    FLAG_LOW_CAPITAL_HIGH_CONTRACT: 'Capital Mismatch',
    FLAG_SINGLE_BID_WIN: 'Single Bid Win',
    FLAG_SHARED_DIRECTOR: 'Shared Director',
};

const MOCK_REPORTS = [
    {
        report_id: 'RPT-2026-001',
        created_at: '2026-03-07T04:12:00Z',
        vendor_id: 'C001', vendor_name: 'Kanpur MediTech Pvt Ltd',
        state: 'Uttar Pradesh', ministry: 'Health & Family Welfare',
        score: 90, risk_level: 'HIGH',
        contract_total: 14800000, paid_up_capital: 200000,
        flags: ['FLAG_POLITICAL_LINK', 'FLAG_SHELL_COMPANY', 'FLAG_SHARED_ADDRESS'],
        referred: true, referred_to: 'CBI Anti-Corruption Branch',
        narration: 'Director DIN 07234891 maps to spouse of MLA Mahendra Verma (SP, Kanpur). Company registered 38 days before first GeM contract. Paid-up capital of ₹2L vs ₹1.48 Cr in contracts — ratio of 74x.',
    },
    {
        report_id: 'RPT-2026-002',
        created_at: '2026-03-06T11:35:00Z',
        vendor_id: 'C004', vendor_name: 'Delhi InfoSystems Pvt Ltd',
        state: 'Delhi', ministry: 'Electronics & IT',
        score: 85, risk_level: 'HIGH',
        contract_total: 18200000, paid_up_capital: 500000,
        flags: ['FLAG_POLITICAL_LINK', 'FLAG_RAPID_REGISTRATION'],
        referred: false, referred_to: null,
        narration: 'Registered 12 days before filing first GeM bid. Director shares DIN with companies C011 and C019 — forming a shell network in the Delhi IT cluster. Political link confirmed via ECI 2022 affidavit.',
    },
    {
        report_id: 'RPT-2026-003',
        created_at: '2026-03-06T08:20:00Z',
        vendor_id: 'C007', vendor_name: 'Mumbai Constructions Pvt Ltd',
        state: 'Maharashtra', ministry: 'Public Works',
        score: 82, risk_level: 'HIGH',
        contract_total: 43000000, paid_up_capital: 1000000,
        flags: ['FLAG_SINGLE_BID_WIN', 'FLAG_LOW_CAPITAL_HIGH_CONTRACT'],
        referred: true, referred_to: 'Departmental Audit Committee',
        narration: '100% of 8 PWD contracts won through single-bid procurement. Capital-to-contract ratio of 43x. No competitor bids recorded in GeM audit logs for any of the awarded contracts.',
    },
    {
        report_id: 'RPT-2026-004',
        created_at: '2026-03-05T15:48:00Z',
        vendor_id: 'C002', vendor_name: 'MedSys Solutions',
        state: 'Uttar Pradesh', ministry: 'Health & Family Welfare',
        score: 85, risk_level: 'HIGH',
        contract_total: 12000000, paid_up_capital: 300000,
        flags: ['FLAG_SAME_ADDRESS_CLUSTER', 'FLAG_SHELL_COMPANY', 'FLAG_SHARED_DIRECTOR'],
        referred: false, referred_to: null,
        narration: 'Shares registered address at 14-A Civil Lines, Kanpur with 5 other HIGH-risk vendors. Same director (DIN 07234891) across 4 companies in the Kanpur Medical Syndicate cluster.',
    },
    {
        report_id: 'RPT-2026-005',
        created_at: '2026-03-05T09:10:00Z',
        vendor_id: 'C011', vendor_name: 'SkyNet Technologies',
        state: 'Delhi', ministry: 'Electronics & IT',
        score: 75, risk_level: 'HIGH',
        contract_total: 8500000, paid_up_capital: 200000,
        flags: ['FLAG_POLITICAL_LINK', 'FLAG_RAPID_REGISTRATION'],
        referred: false, referred_to: null,
        narration: 'Part of Delhi IT Shell Network. Registered within 47-day window alongside C004 and C019 using same registered agent. Political link to ruling party state committee confirmed.',
    },
];

function fmt(iso) {
    return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ReportCard({ r, onSelect }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div style={{
            background: 'var(--card)', borderRadius: 14,
            border: `1px solid ${r.referred ? 'rgba(16,185,129,0.2)' : r.risk_level === 'HIGH' ? 'rgba(239,68,68,0.15)' : 'var(--border)'}`,
            overflow: 'hidden', transition: 'border-color 0.2s',
        }}>
            {/* Main row */}
            <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>

                {/* Score bubble */}
                <div style={{
                    width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                    background: RISK_BG[r.risk_level], border: `1px solid ${RISK_COLOR[r.risk_level]}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: '1.1rem', color: RISK_COLOR[r.risk_level],
                }}>{r.score}</div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-1)', fontSize: '0.95rem' }}>{r.vendor_name}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: RISK_COLOR[r.risk_level], background: RISK_BG[r.risk_level], padding: '0.15rem 0.5rem', borderRadius: 4 }}>{r.risk_level}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>
                        {r.vendor_id} · {r.state} · {r.ministry}
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                        {r.flags.map(f => (
                            <span key={f} style={{ fontSize: '0.62rem', padding: '0.15rem 0.45rem', background: 'rgba(239,68,68,0.08)', color: '#ef4444', borderRadius: 4, fontWeight: 700, letterSpacing: '0.02em' }}>
                                {FLAG_LABELS[f] || f.replace('FLAG_', '')}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Right meta */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <span style={{
                        fontSize: '0.68rem', padding: '0.25rem 0.65rem', borderRadius: 20, fontWeight: 700,
                        background: r.referred ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.08)',
                        color: r.referred ? '#34d399' : '#f59e0b',
                        border: `1px solid ${r.referred ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.15)'}`,
                    }}>
                        {r.referred ? 'Referred' : 'Pending Review'}
                    </span>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--text-4)' }}>{r.report_id}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-4)' }}>{fmt(r.created_at)}</div>
                </div>

                {/* Expand chevron */}
                <div style={{ color: 'var(--text-4)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▾</div>
            </div>

            {/* Expanded details */}
            {expanded && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.25rem', background: 'rgba(15,23,42,0.4)' }}>
                    {/* Stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                        {[
                            { label: 'Contract Exposure', value: '\u20b9' + (r.contract_total / 10000000).toFixed(2) + ' Cr', color: '#ef4444' },
                            { label: 'Paid-up Capital', value: '\u20b9' + (r.paid_up_capital / 100000).toFixed(1) + 'L', color: '#f59e0b' },
                            { label: 'Capital Ratio', value: Math.round(r.contract_total / r.paid_up_capital) + 'x', color: '#8b5cf6' },
                        ].map(({ label, value, color }) => (
                            <div key={label} style={{ background: 'var(--card)', borderRadius: 8, padding: '0.65rem 0.85rem', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '0.62rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
                                <div style={{ fontWeight: 800, color, fontSize: '1.05rem' }}>{value}</div>
                            </div>
                        ))}
                    </div>

                    {/* AI narration */}
                    <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#818cf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>AI Investigation Finding</div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', margin: 0, lineHeight: 1.7 }}>{r.narration}</p>
                    </div>

                    {/* Referral info */}
                    {r.referred && r.referred_to && (
                        <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-2)' }}>
                            <strong style={{ color: '#34d399' }}>Referred to:</strong> {r.referred_to}
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <button onClick={() => onSelect && onSelect({ vendor_id: r.vendor_id })} style={{
                            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
                            color: '#93c5fd', borderRadius: 8, padding: '0.45rem 1rem',
                            fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
                        }}>Open Full Report</button>
                        <button onClick={() => {
                            const csv = `Report ID,Vendor,ID,Score,Risk,Flags,Contract,Capital\n"${r.report_id}","${r.vendor_name}","${r.vendor_id}",${r.score},${r.risk_level},"${r.flags.join('|')}",${r.contract_total},${r.paid_up_capital}`;
                            const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv); a.download = `${r.report_id}.csv`; a.click();
                        }} style={{
                            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                            color: '#34d399', borderRadius: 8, padding: '0.45rem 1rem',
                            fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
                        }}>Export CSV</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SavedReports({ onSelectVendor }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(`${API_BASE}/reports`);
                if (res.ok) {
                    const data = await res.json();
                    setReports(data.reports?.length > 0 ? data.reports : MOCK_REPORTS);
                } else { setReports(MOCK_REPORTS); }
            } catch { setReports(MOCK_REPORTS); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const filtered = filter === 'referred' ? reports.filter(r => r.referred)
        : filter === 'pending' ? reports.filter(r => !r.referred) : reports;

    const totalExposure = reports.reduce((s, r) => s + (r.contract_total || 0), 0);
    const referred = reports.filter(r => r.referred).length;

    return (
        <div style={{ padding: '2rem', maxWidth: 920, margin: '0 auto' }}>

            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)', margin: '0 0 0.3rem' }}>Saved Reports</h1>
                <p style={{ color: 'var(--text-4)', fontSize: '0.82rem', margin: 0 }}>
                    Investigation reports saved to DynamoDB — click any report to expand
                </p>
            </div>

            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Reports', value: reports.length, color: '#3b82f6' },
                    { label: 'Referred to CBI', value: referred, color: '#10b981' },
                    { label: 'Pending Review', value: reports.length - referred, color: '#f59e0b' },
                    { label: 'Total Exposure', value: '\u20b9' + (totalExposure / 10000000).toFixed(1) + ' Cr', color: '#ef4444' },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.85rem 1rem' }}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontWeight: 900, color, fontSize: '1.3rem' }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {[
                    { key: 'all', label: `All (${reports.length})` },
                    { key: 'referred', label: `Referred (${referred})` },
                    { key: 'pending', label: `Pending (${reports.length - referred})` },
                ].map(({ key, label }) => (
                    <button key={key} onClick={() => setFilter(key)} style={{
                        background: filter === key ? 'rgba(59,130,246,0.12)' : 'var(--card)',
                        border: `1px solid ${filter === key ? 'rgba(59,130,246,0.35)' : 'var(--border)'}`,
                        color: filter === key ? '#93c5fd' : 'var(--text-3)',
                        borderRadius: 8, padding: '0.4rem 0.9rem',
                        fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
                    }}>{label}</button>
                ))}
            </div>

            {/* Report cards */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-4)', fontSize: '0.875rem' }}>
                    Loading from DynamoDB...
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filtered.map(r => <ReportCard key={r.report_id} r={r} onSelect={onSelectVendor} />)}
                </div>
            )}
        </div>
    );
}
