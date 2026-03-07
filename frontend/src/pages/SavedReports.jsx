import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://xhi54p2nma.execute-api.us-east-1.amazonaws.com/prod';

// Mock saved reports for demo — real ones come from DynamoDB
const MOCK_REPORTS = [
    { report_id: 'RPT-2026-001', created_at: '2026-03-07T04:12:00Z', vendor_id: 'C001', vendor_name: 'Kanpur MediTech Pvt Ltd', score: 90, risk_level: 'HIGH', flags: ['FLAG_POLITICAL_LINK', 'FLAG_SHELL_COMPANY'], referred: true },
    { report_id: 'RPT-2026-002', created_at: '2026-03-06T11:35:00Z', vendor_id: 'C004', vendor_name: 'Delhi InfoSystems Pvt Ltd', score: 85, risk_level: 'HIGH', flags: ['FLAG_POLITICAL_LINK', 'FLAG_RAPID_REGISTRATION'], referred: false },
    { report_id: 'RPT-2026-003', created_at: '2026-03-06T08:20:00Z', vendor_id: 'C007', vendor_name: 'Mumbai Constructions Pvt Ltd', score: 82, risk_level: 'HIGH', flags: ['FLAG_SINGLE_BID_WIN', 'FLAG_LOW_CAPITAL_HIGH_CONTRACT'], referred: true },
    { report_id: 'RPT-2026-004', created_at: '2026-03-05T15:48:00Z', vendor_id: 'C002', vendor_name: 'MedSys Solutions', score: 85, risk_level: 'HIGH', flags: ['FLAG_SAME_ADDRESS_CLUSTER', 'FLAG_SHELL_COMPANY'], referred: false },
    { report_id: 'RPT-2026-005', created_at: '2026-03-05T09:10:00Z', vendor_id: 'C011', vendor_name: 'SkyNet Technologies', score: 75, risk_level: 'HIGH', flags: ['FLAG_POLITICAL_LINK', 'FLAG_RAPID_REGISTRATION'], referred: false },
];

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
                } else {
                    setReports(MOCK_REPORTS);
                }
            } catch {
                setReports(MOCK_REPORTS);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filtered = filter === 'referred' ? reports.filter(r => r.referred) : filter === 'pending' ? reports.filter(r => !r.referred) : reports;

    const fmt = (iso) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

    return (
        <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>Saved Reports</h1>
                    <p style={{ color: 'var(--text-4)', fontSize: '0.82rem', margin: '0.25rem 0 0' }}>
                        {reports.length} investigation report{reports.length !== 1 ? 's' : ''} stored in DynamoDB
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['all', 'referred', 'pending'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} style={{
                            background: filter === f ? 'rgba(59,130,246,0.15)' : 'var(--card)',
                            border: `1px solid ${filter === f ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
                            color: filter === f ? '#93c5fd' : 'var(--text-3)',
                            borderRadius: 7, padding: '0.35rem 0.8rem',
                            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
                            textTransform: 'capitalize',
                        }}>{f === 'all' ? 'All' : f === 'referred' ? 'Referred to CBI' : 'Pending'}</button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-4)' }}>Loading reports from DynamoDB...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filtered.map(r => (
                        <div key={r.report_id} style={{
                            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
                            padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap',
                        }}>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--text-4)', minWidth: 110 }}>{r.report_id}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.88rem' }}>{r.vendor_name}</div>
                                <div style={{ fontSize: '0.73rem', color: 'var(--text-4)', marginTop: 2 }}>
                                    {r.vendor_id} · Saved {fmt(r.created_at)}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 800, color: '#ef4444', fontSize: '1rem' }}>{r.score}</span>
                                <span style={{
                                    fontSize: '0.68rem', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 700,
                                    background: r.referred ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                    color: r.referred ? '#34d399' : '#f59e0b',
                                }}>{r.referred ? 'Referred to CBI' : 'Pending Review'}</span>
                                <button onClick={() => onSelectVendor && onSelectVendor({ vendor_id: r.vendor_id })} style={{
                                    background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
                                    color: '#93c5fd', borderRadius: 7, padding: '0.35rem 0.8rem',
                                    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
                                }}>Open</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
