import { useState } from 'react';

const STEPS = [
    {
        icon: 'DB',
        num: '01',
        title: 'Data Ingestion',
        subtitle: 'Collect from 3 government sources',
        color: '#3b82f6',
        desc: 'TenderTrace pulls data from MCA21 (company registrations), MyNeta / ECI (politician declarations), and the GeM portal (government contracts). This gives us the raw picture of every vendor bidding for public money.',
        points: ['MCA21 — company directors, paid-up capital, registration date', 'ECI affidavits — politicians and their family members', 'GeM portal — contract values, ministry, bid type'],
    },
    {
        icon: 'AI',
        num: '02',
        title: 'Rules',
        subtitle: 'Automated rule engine scores every vendor',
        color: '#8b5cf6',
        desc: 'Each vendor is scored 0–100 using 5 rules that look for classic signs of fraudulent procurement. The rules are inspired by CAG audit patterns and CBI complaint filings.',
        points: [
            'Shared Address — multiple companies at the same PIN code',
            'Director Overlap — one person controls many visible companies',
            'Political Link — director is a politician\'s family member (via ECI)',
            'Capital Mismatch — low capital winning high-value contracts',
            'Single Bid Win — contract won with no competition',
        ],
    },
    {
        icon: 'CLU',
        num: '03',
        title: 'Cluster Detection',
        subtitle: 'Find networks, not just individuals',
        color: '#f59e0b',
        desc: 'Fraud is rarely done alone. TenderTrace groups vendors into clusters when they share addresses, directors, or registration patterns — surfacing organized fraud rings, not just lone bad actors.',
        points: ['Kanpur Medical Syndicate — 4 vendors, 1 address, 1 director', 'Delhi IT Shell Network — registered within 47 days', 'Mumbai Infrastructure Ring — 100% single-bid PWD wins'],
    },
    {
        icon: 'GEN',
        num: '04',
        title: 'AI Investigation Brief',
        subtitle: 'Amazon Bedrock generates the narrative',
        color: '#10b981',
        desc: 'Once clusters are identified, an Amazon Bedrock agent (Claude 3 Haiku) writes a structured investigation report citing relevant IPC sections, contract values, and recommended next steps — ready for a CBI officer to act on.',
        points: ['Natural language fraud summary per vendor', 'Relevant IPC/PMLA sections cited automatically', 'Recommended action: Monitor / Freeze / Refer to CBI'],
    },
    {
        icon: 'ACT',
        num: '05',
        title: 'Action & Export',
        subtitle: 'One-click CBI referral letter',
        color: '#ef4444',
        desc: 'Officers can export a print-ready CBI referral letter with all findings pre-filled, set up real-time email alerts via SNS for new contracts from flagged vendors, or share a deep-link URL with colleagues.',
        points: ['Official PDF referral letter (print-ready)', 'Email alert via Amazon SNS when flagged vendor wins new contract', 'Shareable deep-link URL to any vendor report'],
    },
];

const ARCH = [
    { icon: 'S3', label: 'React Frontend', sub: 'Hosted on S3' },
    { icon: 'GW', label: 'API Gateway', sub: 'REST API' },
    { icon: 'λ', label: 'Lambda', sub: 'Python 3.12' },
    { icon: 'DB', label: 'DynamoDB', sub: '20 vendors' },
    { icon: 'AI', label: 'Bedrock', sub: 'Claude 3 Haiku' },
    { icon: 'SNS', label: 'SNS', sub: 'Email alerts' },
];

const WHY = [
    { stat: '₹47.3 Cr', label: 'Fraud exposure detected in demo dataset', color: '#ef4444' },
    { stat: '40%', label: 'Vendors flagged HIGH risk (8 of 20)', color: '#f59e0b' },
    { stat: '3', label: 'Fraud clusters identified automatically', color: '#8b5cf6' },
    { stat: '< 30s', label: 'Full investigation time per vendor', color: '#10b981' },
];

export default function Pipeline() {
    const [open, setOpen] = useState(0);

    return (
        <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 999, padding: '0.4rem 1.2rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 700, letterSpacing: '0.08em' }}>HOW IT WORKS</span>
                </div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-1)', margin: '0 0 0.75rem' }}>
                    From Government Data to CBI Referral
                </h1>
                <p style={{ color: 'var(--text-3)', fontSize: '1rem', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
                    TenderTrace automates what used to take a CAG auditor months — identifying fraudulent procurement patterns across thousands of vendors in under 30 seconds.
                </p>
            </div>

            {/* Impact stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '3rem' }}>
                {WHY.map(({ stat, label, color }) => (
                    <div key={stat} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color }}>{stat}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', marginTop: 4, lineHeight: 1.4 }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Steps accordion */}
            <div style={{ marginBottom: '3rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '1rem' }}>
                    The 5-Stage Pipeline
                </div>
                {STEPS.map((s, i) => (
                    <div
                        key={i}
                        onClick={() => setOpen(open === i ? -1 : i)}
                        style={{
                            marginBottom: '0.75rem',
                            background: 'var(--card)',
                            border: `1px solid ${open === i ? s.color + '55' : 'var(--border)'}`,
                            borderRadius: 12,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s',
                        }}
                    >
                        {/* Header row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
                            <div style={{ fontSize: '1.5rem', minWidth: 36, textAlign: 'center' }}>{s.icon}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: '0.68rem', color: s.color, fontWeight: 800, fontFamily: 'var(--mono)', letterSpacing: '0.06em' }}>STAGE {s.num}</span>
                                </div>
                                <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.95rem' }}>{s.title}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-4)', marginTop: 1 }}>{s.subtitle}</div>
                            </div>
                            <div style={{ color: 'var(--text-4)', fontSize: '1rem', transition: 'transform 0.2s', transform: open === i ? 'rotate(180deg)' : 'none' }}>▾</div>
                        </div>

                        {/* Expanded content */}
                        {open === i && (
                            <div style={{ padding: '0 1.25rem 1.25rem', borderTop: `1px solid ${s.color}22` }}>
                                <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', lineHeight: 1.75, margin: '0.75rem 0 1rem' }}>
                                    {s.desc}
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {s.points.map((p, j) => (
                                        <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.82rem', color: 'var(--text-3)' }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, marginTop: 6, flexShrink: 0 }} />
                                            {p}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* AWS Architecture */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '1rem' }}>
                    AWS Architecture
                </div>
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {ARCH.map((a, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: a.icon === 'λ' ? '1.2rem' : '1.4rem', fontWeight: 800, color: '#3b82f6', margin: '0 auto 0.4rem' }}>
                                        {a.icon}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-2)' }}>{a.label}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-4)' }}>{a.sub}</div>
                                </div>
                                {i < ARCH.length - 1 && (
                                    <div style={{ color: 'var(--text-4)', fontSize: '1.2rem', marginBottom: 16, flexShrink: 0 }}>→</div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
                        <strong style={{ color: '#34d399' }}>100% serverless</strong> — no servers to manage, auto-scales to handle any load, costs near-zero when idle. Built entirely on AWS Academy Learner Lab with CLI-only deployment.
                    </div>
                </div>
            </div>

            {/* Who uses this */}
            <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(59,130,246,0.05))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '1.5rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                    Who is this for?
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
                    {[
                        { role: 'Vigilance Officers', desc: 'Get structured referral letters in one click instead of writing them manually' },
                        { role: 'CAG Auditors', desc: 'Surface patterns across thousands of contracts that would take months to find manually' },
                        { role: 'Ministry Officials', desc: 'Screen vendors before contract awards and flag high-risk bids automatically' },
                    ].map(({ role, desc }) => (
                        <div key={role} style={{ background: 'rgba(15,23,42,0.5)', borderRadius: 8, padding: '0.875rem' }}>
                            <div style={{ fontWeight: 700, color: '#818cf8', fontSize: '0.82rem', marginBottom: '0.4rem' }}>{role}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.5 }}>{desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
