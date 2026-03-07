import { useState, useMemo } from 'react';
import ReactFlow, {
    MiniMap, Controls, Background,
    useNodesState, useEdgesState,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

// ─── ALL 3 CLUSTERS ────────────────────────────────────────────────────────
const CLUSTERS = {
    kanpur: {
        id: 'kanpur',
        name: 'Kanpur Medical',
        subtitle: 'UP Health Ministry · 6 vendors · ₹32L at risk',
        threat: 'CRITICAL',
        avgScore: 80,
        state: 'Uttar Pradesh',
        ministry: 'Health & Family Welfare',
        stats: [
            { label: 'Avg Risk Score', value: '80/100', color: '#ef4444' },
            { label: 'Contracts Value', value: '₹32L', color: '#f59e0b' },
            { label: 'Shared Directors', value: '2', color: '#f59e0b' },
            { label: 'Political Links', value: '1 MLA', color: '#ef4444' },
            { label: 'Vendors at Address', value: '6', color: '#8b5cf6' },
            { label: 'Incorporation Window', value: '8 months', color: '#3b82f6' },
        ],
        raw: [
            { id: 'C001', label: 'Kanpur MediTech\nPvt Ltd', score: 90, type: 'company' },
            { id: 'C002', label: 'UP Surgical\nSupplies Pvt Ltd', score: 95, type: 'company' },
            { id: 'C003', label: 'NorthMed\nEquipments', score: 75, type: 'company' },
            { id: 'C004', label: 'BharatCare\nInstruments', score: 80, type: 'company' },
            { id: 'C005', label: 'MedServ\nIndia', score: 75, type: 'company' },
            { id: 'C006', label: 'HealthFirst\nSolutions', score: 70, type: 'company' },
            { id: 'KD001', label: 'Rajesh Kumar Verma\nDIN: 00112233', type: 'director' },
            { id: 'KD002', label: 'Sunita Agarwal\nDIN: 00445566', type: 'director' },
            { id: 'KP001', label: 'MLA Mahendra Verma\nSP · Kanpur Cantonment', type: 'politician' },
            { id: 'KADDR', label: '14-A Civil Lines\nKanpur UP 208001', type: 'address' },
        ],
        positions: {
            C001: { x: 80, y: 40 }, C002: { x: 340, y: 40 }, C003: { x: 600, y: 40 },
            C004: { x: 80, y: 400 }, C005: { x: 340, y: 400 }, C006: { x: 600, y: 400 },
            KD001: { x: 200, y: 220 }, KD002: { x: 420, y: 220 },
            KP001: { x: 660, y: 220 }, KADDR: { x: -80, y: 220 },
        },
        edges: [
            ['C001', 'KD001', 'Director', '#f59e0b'], ['C002', 'KD001', 'Director', '#f59e0b'], ['C004', 'KD001', 'Director', '#f59e0b'],
            ['C002', 'KD002', 'Director', '#f59e0b'], ['C003', 'KD002', 'Director', '#f59e0b'],
            ['C005', 'KD002', 'Director', '#f59e0b'], ['C006', 'KD002', 'Director', '#f59e0b'],
            ...['C001', 'C002', 'C003', 'C004', 'C005', 'C006'].map(id => [id, 'KADDR', 'Registered at', '#8b5cf6', false, false]),
            ['KD002', 'KP001', 'Spouse of MLA', '#ef4444', true, true],
        ],
        explanation: 'Six vendors registered at the same Kanpur address all won UP Health contracts in 2022. Director Sunita Agarwal is the declared spouse of MLA Mahendra Verma (SP). Director Rajesh Verma sits on 3 competing boards — textbook bid-rigging. 6 contracts in 8 months indicate bid splitting to evade procurement thresholds.',
    },

    jaipur: {
        id: 'jaipur',
        name: 'Jaipur Infra',
        subtitle: 'Rajasthan PWD · 4 vendors · ₹22.5L at risk',
        threat: 'CRITICAL',
        avgScore: 85,
        state: 'Rajasthan',
        ministry: 'Public Works',
        stats: [
            { label: 'Avg Risk Score', value: '85/100', color: '#ef4444' },
            { label: 'Contracts Value', value: '₹22.5L', color: '#f59e0b' },
            { label: 'Shared Directors', value: '3', color: '#f59e0b' },
            { label: 'Political Links', value: '1 MLA', color: '#ef4444' },
            { label: 'Vendors at Address', value: '4', color: '#8b5cf6' },
            { label: 'Incorporation Window', value: '50 days', color: '#ef4444' },
        ],
        raw: [
            { id: 'C009', label: 'Jaipur Infra\nBuild Pvt Ltd', score: 92, type: 'company' },
            { id: 'C010', label: 'Rajasthan\nRoads Pvt Ltd', score: 85, type: 'company' },
            { id: 'C011', label: 'Desert\nConstruction Co', score: 80, type: 'company' },
            { id: 'C012', label: 'Pink City\nContractors', score: 85, type: 'company' },
            { id: 'JD001', label: 'Anand Gupta\nDIN: 01122334', type: 'director' },
            { id: 'JD002', label: 'Rohit Joshi\nDIN: 01778890', type: 'director' },
            { id: 'JD003', label: 'Kavita Sharma\nDIN: 01445567', type: 'director' },
            { id: 'JP001', label: 'MLA Devendra Rathore\nBJP · Jaipur Rural', type: 'politician' },
            { id: 'JADDR', label: '88-C MI Road\nJaipur RJ 302001', type: 'address' },
        ],
        positions: {
            C009: { x: 60, y: 40 }, C010: { x: 300, y: 40 }, C011: { x: 540, y: 40 }, C012: { x: 780, y: 40 },
            JD001: { x: 140, y: 240 }, JD002: { x: 380, y: 240 }, JD003: { x: 620, y: 240 },
            JP001: { x: 750, y: 400 }, JADDR: { x: -80, y: 240 },
        },
        edges: [
            ['C009', 'JD001', 'Director', '#f59e0b'], ['C010', 'JD001', 'Director', '#f59e0b'], ['C011', 'JD001', 'Director', '#f59e0b'],
            ['C010', 'JD002', 'Director', '#f59e0b'], ['C011', 'JD002', 'Director', '#f59e0b'], ['C012', 'JD002', 'Director', '#f59e0b'],
            ['C009', 'JD003', 'Director', '#f59e0b'], ['C012', 'JD003', 'Director', '#f59e0b'],
            ...['C009', 'C010', 'C011', 'C012'].map(id => [id, 'JADDR', 'Registered at', '#8b5cf6', false, false]),
            ['JD001', 'JP001', 'Son of MLA', '#ef4444', true, true],
            ['JD002', 'JP001', 'Nephew of MLA', '#ef4444', true, true],
        ],
        explanation: 'Four infrastructure vendors registered within 50 days at the same Jaipur address. All won Rajasthan PWD contracts within 90 days of incorporation (FLAG_NEW_COMPANY). Anand Gupta is the son of BJP MLA Devendra Rathore; Rohit Joshi is his nephew — both declared in ECI affidavits. Capital mismatch: ₹2L average capital vs ₹55L contracts.',
    },

    chennai: {
        id: 'chennai',
        name: 'Chennai IT',
        subtitle: 'TN e-Gov Ministry · 3 vendors · ₹8.5L at risk',
        threat: 'HIGH',
        avgScore: 83,
        state: 'Tamil Nadu',
        ministry: 'Electronics & IT',
        stats: [
            { label: 'Avg Risk Score', value: '83/100', color: '#ef4444' },
            { label: 'Contracts Value', value: '₹8.5L', color: '#f59e0b' },
            { label: 'Shared Directors', value: '2', color: '#f59e0b' },
            { label: 'Political Links', value: '1 MLA', color: '#ef4444' },
            { label: 'Vendors at Address', value: '3', color: '#8b5cf6' },
            { label: 'Incorporation Window', value: '36 days', color: '#ef4444' },
        ],
        raw: [
            { id: 'C014', label: 'TN Data\nSystems Pvt Ltd', score: 88, type: 'company' },
            { id: 'C015', label: 'SouthTech\nAnalytics Pvt Ltd', score: 83, type: 'company' },
            { id: 'C016', label: 'Madurai\nSoftware Hub', score: 78, type: 'company' },
            { id: 'CD001', label: 'Meena Krishnan\nDIN: 02112234', type: 'director' },
            { id: 'CD002', label: 'Arjun Nair\nDIN: 02334456', type: 'director' },
            { id: 'CP001', label: 'MLA Selvam Murugan\nDMK · Chennai South', type: 'politician' },
            { id: 'CADDR', label: '12-D Anna Salai\nChennai TN 600002', type: 'address' },
        ],
        positions: {
            C014: { x: 80, y: 40 }, C015: { x: 340, y: 40 }, C016: { x: 600, y: 40 },
            CD001: { x: 200, y: 240 }, CD002: { x: 430, y: 240 },
            CP001: { x: 650, y: 400 }, CADDR: { x: -80, y: 240 },
        },
        edges: [
            ['C014', 'CD001', 'Director', '#f59e0b'], ['C015', 'CD001', 'Director', '#f59e0b'], ['C016', 'CD001', 'Director', '#f59e0b'],
            ['C014', 'CD002', 'Director', '#f59e0b'], ['C015', 'CD002', 'Director', '#f59e0b'],
            ...['C014', 'C015', 'C016'].map(id => [id, 'CADDR', 'Registered at', '#8b5cf6', false, false]),
            ['CD001', 'CP001', 'Spouse of MLA', '#ef4444', true, true],
        ],
        explanation: 'Three IT vendors incorporated within 36 days (Jan–Feb 2023) at the same Anna Salai address won TN e-Gov contracts by March 2023. Director Meena Krishnan is the declared spouse of DMK MLA Selvam Murugan (Chennai South). Average capital ₹1.6L vs ₹8.5L contracts — 5.3× mismatch. Contracts were split to stay under single-procurement limits.',
    },
};

const TYPE_STYLE = {
    company: { border: '#3b82f6', bg: 'rgba(15,30,60,0.95)', typeLabel: 'Vendor' },
    director: { border: '#f59e0b', bg: 'rgba(30,20,5,0.95)', typeLabel: 'Director' },
    politician: { border: '#ef4444', bg: 'rgba(30,8,8,0.95)', typeLabel: 'Politician' },
    address: { border: '#8b5cf6', bg: 'rgba(15,8,30,0.95)', typeLabel: 'Address' },
};

function buildGraph(cluster) {
    const nodes = cluster.raw.map(n => {
        const s = TYPE_STYLE[n.type];
        return {
            id: n.id,
            position: cluster.positions[n.id] || { x: 0, y: 0 },
            data: {
                label: (
                    <div style={{ textAlign: 'center', padding: '6px 4px', minWidth: 130 }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: s.border, marginBottom: 3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.typeLabel}</div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'pre-line', lineHeight: 1.4 }}>{n.label}</div>
                        {n.score && (
                            <div style={{ marginTop: 5, fontSize: '0.67rem', color: '#ef4444', fontWeight: 800, fontFamily: 'monospace', background: 'rgba(239,68,68,0.1)', padding: '1px 5px', borderRadius: 4, display: 'inline-block' }}>
                                {n.score}/100 {n.score >= 70 ? 'HIGH' : 'MED'}
                            </div>
                        )}
                    </div>
                ),
            },
            style: {
                background: s.bg,
                border: `1.5px solid ${s.border}`,
                borderRadius: 12,
                boxShadow: `0 0 18px ${s.border}22`,
            },
        };
    });

    const edges = cluster.edges.map(([src, tgt, label, color, dashed = false, animated = true]) => ({
        id: `${src}-${tgt}`,
        source: src, target: tgt, label, animated,
        type: 'smoothstep',
        style: { stroke: color, strokeWidth: 1.5, ...(dashed ? { strokeDasharray: '5 3' } : {}) },
        markerEnd: { type: MarkerType.ArrowClosed, width: 13, height: 13, color },
        labelStyle: { fill: color, fontSize: 9, fontWeight: 700 },
        labelBgStyle: { fill: '#070b16', fillOpacity: 0.9 },
    }));

    return { nodes, edges };
}

const LEGEND = [
    { color: '#3b82f6', label: 'Vendor Company' },
    { color: '#f59e0b', label: 'Director' },
    { color: '#ef4444', label: 'Politician' },
    { color: '#8b5cf6', label: 'Shared Address' },
];

function ClusterGraph({ cluster }) {
    const { nodes: rawNodes, edges: rawEdges } = useMemo(() => buildGraph(cluster), [cluster]);
    const [n, , onNC] = useNodesState(rawNodes);
    const [eg, , onEC] = useEdgesState(rawEdges);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
                {cluster.stats.map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'var(--bg-card)', border: `1px solid ${color}25`, borderTop: `2px solid ${color}`, borderRadius: 10, padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>{label}</div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {LEGEND.map(({ color, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-3)' }}>
                        <div style={{ width: 9, height: 9, borderRadius: 2, background: color, boxShadow: `0 0 5px ${color}` }} />
                        {label}
                    </div>
                ))}
                <div style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-4)' }}>Drag · Scroll to zoom · Animated = active fraud links</div>
            </div>

            {/* Graph */}
            <div className="graph-wrap">
                <ReactFlow nodes={n} edges={eg} onNodesChange={onNC} onEdgesChange={onEC}
                    fitView fitViewOptions={{ padding: 0.15 }} attributionPosition="bottom-left">
                    <Background color="#1a2540" gap={28} size={1} variant="dots" />
                    <Controls style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border-2)', borderRadius: 8, overflow: 'hidden' }} />
                    <MiniMap
                        nodeColor={nd => nd.style?.border?.includes('#3b82f6') ? '#3b82f6' : nd.style?.border?.includes('#f59e0b') ? '#f59e0b' : nd.style?.border?.includes('#ef4444') ? '#ef4444' : '#8b5cf6'}
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-2)', borderRadius: 8 }}
                    />
                </ReactFlow>
            </div>

            {/* Explanation */}
            <div className="card" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
                <div className="card-title" style={{ marginBottom: '0.5rem' }}>AI Finding</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', lineHeight: 1.75, margin: 0 }}>{cluster.explanation}</p>
                <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, fontSize: '0.78rem', color: '#ef4444', fontWeight: 600 }}>
                    Source: Amazon DynamoDB (tender-trace-companies, tender-trace-edges, tender-trace-directors, tender-trace-politicians)
                </div>
            </div>
        </div>
    );
}

export default function GraphView() {
    const [activeCluster, setActiveCluster] = useState('kanpur');
    const cluster = CLUSTERS[activeCluster];

    return (
        <>
            <div className="ph">
                <h1 className="ph-title">Fraud Cluster Graph</h1>
                <p className="ph-sub">
                    Interactive relationship maps — showing vendor networks, shared directors, political links, and address clusters
                    stored in <strong>Amazon DynamoDB</strong> as adjacency lists
                </p>
            </div>

            {/* Cluster Tabs */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {Object.values(CLUSTERS).map(c => (
                    <button
                        key={c.id}
                        onClick={() => setActiveCluster(c.id)}
                        style={{
                            padding: '0.65rem 1.2rem',
                            borderRadius: 10,
                            border: activeCluster === c.id ? `1.5px solid #ef4444` : '1.5px solid var(--border)',
                            background: activeCluster === c.id ? 'rgba(239,68,68,0.1)' : 'var(--bg-card)',
                            color: activeCluster === c.id ? '#ef4444' : 'var(--text-3)',
                            fontWeight: 700, fontSize: '0.85rem',
                            cursor: 'pointer', fontFamily: 'var(--font)',
                            transition: 'all 0.2s',
                        }}
                    >
                        {c.name}
                        <span style={{
                            marginLeft: '0.5rem', fontSize: '0.65rem', padding: '0.15rem 0.4rem',
                            background: c.threat === 'CRITICAL' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                            color: c.threat === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                            borderRadius: 4, fontWeight: 800,
                        }}>
                            {c.threat}
                        </span>
                    </button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-4)' }}>
                    <span style={{ padding: '0.3rem 0.6rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 6, color: '#34d399', fontWeight: 600 }}>
                        ● {Object.keys(CLUSTERS).length} clusters detected
                    </span>
                </div>
            </div>

            {/* Cluster subtitle */}
            <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-1)' }}>{cluster.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{cluster.subtitle}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', marginLeft: 'auto' }}>
                    Ministry: {cluster.ministry} &nbsp;·&nbsp; State: {cluster.state}
                </div>
            </div>

            <ClusterGraph key={activeCluster} cluster={cluster} />
        </>
    );
}
