import { DEMO_VENDORS } from '../data';

const STATE_RISK = DEMO_VENDORS.reduce((acc, v) => {
    if (!acc[v.state]) acc[v.state] = { high: 0, total: 0, value: 0 };
    acc[v.state].total++;
    if (v.risk_level === 'HIGH') acc[v.state].high++;
    acc[v.state].value += v.contract_total || 0;
    return acc;
}, {});

const AUDIT_EVENTS = [
    { time: '2026-03-07 10:12', type: 'SCAN', msg: 'Full dataset scan completed — 20 vendors, 8 HIGH risk detected', color: '#3b82f6' },
    { time: '2026-03-07 10:14', type: 'REFER', msg: 'C001 Kanpur MediTech — Referred to CBI Anti-Corruption Branch', color: '#ef4444' },
    { time: '2026-03-07 09:58', type: 'ALERT', msg: 'SNS alert triggered — C004 Delhi InfoSystems new contract detected', color: '#f59e0b' },
    { time: '2026-03-06 16:30', type: 'REPORT', msg: 'Investigation report RPT-2026-003 saved for C007 Mumbai Constructions', color: '#8b5cf6' },
    { time: '2026-03-06 15:45', type: 'REFER', msg: 'C007 Mumbai Constructions — Referred for departmental audit', color: '#ef4444' },
    { time: '2026-03-06 12:10', type: 'SCAN', msg: 'Cluster analysis run — Kanpur Medical Syndicate (4 vendors) identified', color: '#3b82f6' },
    { time: '2026-03-06 09:00', type: 'ALERT', msg: 'Email alert sent to vigilance@moh.gov.in for HIGH risk contract', color: '#f59e0b' },
    { time: '2026-03-05 17:22', type: 'REPORT', msg: 'Investigation report RPT-2026-002 saved for C004 Delhi InfoSystems', color: '#8b5cf6' },
    { time: '2026-03-05 14:15', type: 'TIP', msg: 'Anonymous tip received — Ministry of Public Works, vendor C016', color: '#10b981' },
    { time: '2026-03-05 11:30', type: 'SCAN', msg: 'Initial vendor load — 20 vendors uploaded to DynamoDB', color: '#3b82f6' },
];

const TYPE_LABELS = { SCAN: 'Scan', REFER: 'CBI Referral', ALERT: 'Alert', REPORT: 'Report', TIP: 'Tip' };

export default function AuditTrail() {
    const states = Object.entries(STATE_RISK).sort((a, b) => (b[1].high / b[1].total) - (a[1].high / a[1].total));

    return (
        <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)', margin: '0 0 0.5rem' }}>Audit Trail</h1>
            <p style={{ color: 'var(--text-4)', fontSize: '0.82rem', margin: '0 0 2rem' }}>Live activity log of all investigations, referrals, and alerts across the system</p>

            {/* State Risk Summary */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '0.75rem' }}>State Risk Density</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {states.map(([state, data]) => {
                        const pct = Math.round((data.high / data.total) * 100);
                        const color = pct >= 60 ? '#ef4444' : pct >= 30 ? '#f59e0b' : '#10b981';
                        return (
                            <div key={state} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ minWidth: 130, fontSize: '0.78rem', color: 'var(--text-2)', fontWeight: 600 }}>{state}</div>
                                <div style={{ flex: 1, height: 8, background: 'var(--border-2)', borderRadius: 999, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 0.5s ease' }} />
                                </div>
                                <div style={{ minWidth: 80, fontSize: '0.72rem', color }}>
                                    {data.high}/{data.total} HIGH ({pct}%)
                                </div>
                                <div style={{ minWidth: 90, fontSize: '0.72rem', color: 'var(--text-4)', textAlign: 'right' }}>
                                    {'\u20b9'}{(data.value / 10000000).toFixed(1)} Cr
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Event timeline */}
            <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '0.75rem' }}>System Activity Log</div>
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                    {AUDIT_EVENTS.map((ev, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                            padding: '0.75rem 1.25rem', borderBottom: i < AUDIT_EVENTS.length - 1 ? '1px solid var(--border)' : 'none',
                        }}>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-4)', minWidth: 120, paddingTop: 2 }}>{ev.time}</span>
                            <span style={{
                                fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 800,
                                background: ev.color + '18', color: ev.color,
                                minWidth: 72, textAlign: 'center', letterSpacing: '0.04em', flexShrink: 0,
                            }}>{TYPE_LABELS[ev.type]}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.5 }}>{ev.msg}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
