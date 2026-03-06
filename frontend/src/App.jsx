import { useState, useEffect, useRef } from 'react';
import './index.css';
import Dashboard from './pages/Dashboard';
import VendorSearch from './pages/VendorSearch';
import GraphView from './pages/GraphView';
import Analytics from './pages/Analytics';
import Pipeline from './pages/Pipeline';
import AgentChat from './pages/AgentChat';
import IndiaMap from './pages/IndiaMap';
import { DEMO_VENDORS } from './data';

// ── Live Fraud Ticker ──────────────────────────────────────────────
const TICKER_ITEMS = DEMO_VENDORS
  .filter(v => v.risk_level === 'HIGH' || v.flags.length > 1)
  .map(v => `${v.risk_level}: ${v.vendor_name} (${v.vendor_id}) — Score ${v.score}/100 — ${v.flags[0]?.replace('FLAG_', '') || 'FLAGGED'} — ₹${(v.contract_total / 100000).toFixed(1)}L at risk`);

function FraudTicker() {
  const ref = useRef(null);
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let x = 0;
    const speed = 0.5;
    const animate = () => {
      x -= speed;
      if (Math.abs(x) >= el.scrollWidth / 2) x = 0;
      el.style.transform = `translateX(${x}px)`;
      requestAnimationFrame(animate);
    };
    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div style={{
      background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.15)',
      overflow: 'hidden', padding: '6px 0', whiteSpace: 'nowrap', userSelect: 'none',
    }}>
      <div ref={ref} style={{ display: 'inline-flex', gap: '4rem', willChange: 'transform' }}>
        {items.map((item, i) => (
          <span key={i} style={{ fontSize: '0.72rem', color: '#ef4444', fontFamily: 'var(--mono)', letterSpacing: '0.02em' }}>
            <span style={{ color: '#f59e0b', fontWeight: 700, marginRight: '0.5rem' }}>ALERT</span>{item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [selectedVendor, setSelectedVendor] = useState(null);

  const NAV = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'search', label: 'Vendor Scan' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'graph', label: 'Cluster Graph' },
    { id: 'agent', label: 'AI Agent' },
    { id: 'map', label: 'India Map' },
    { id: 'pipeline', label: 'How It Works' },
  ];

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-logo">
          <span className="logo-icon">T</span>
          <span>Tender<span className="logo-accent">Trace</span></span>
          <div className="logo-dot" title="System active" />
        </div>
        <div className="nav-center">
          {NAV.map(({ id, label }) => (
            <button key={id} className={`nav-btn ${page === id ? 'active' : ''}`} onClick={() => setPage(id)}>
              {label}
            </button>
          ))}
        </div>
        <div className="nav-right">
          <div className="live-pill" title="Connected: Lambda · DynamoDB · S3 · Bedrock · API Gateway"><div className="pulse" />Live · AWS</div>
        </div>
      </nav>
      <FraudTicker />
      <main className="page">
        {page === 'dashboard' && <Dashboard onSelectVendor={(v) => { setSelectedVendor(v); setPage('search'); }} />}
        {page === 'search' && <VendorSearch preselected={selectedVendor} />}
        {page === 'analytics' && <Analytics />}
        {page === 'graph' && <GraphView />}
        {page === 'agent' && <AgentChat />}
        {page === 'map' && <IndiaMap />}
        {page === 'pipeline' && <Pipeline />}
      </main>

      <footer>
        <span>Tender Trace &copy; 2026 &middot; Built on AWS &middot; AI ASCEND Hackathon</span>
        <div className="footer-stack">
          {['Amazon S3', 'AWS Lambda', 'Amazon DynamoDB', 'Bedrock Agents', 'API Gateway', 'AWS Amplify', 'MCA21', 'MyNeta'].map(t => (
            <span key={t} className="footer-chip">{t}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}
