import { useState, useEffect, useRef } from 'react';
import './index.css';
import Dashboard from './pages/Dashboard';
import VendorSearch from './pages/VendorSearch';
import GraphView from './pages/GraphView';
import Analytics from './pages/Analytics';
import Pipeline from './pages/Pipeline';
import AgentChat from './pages/AgentChat';
import IndiaMap from './pages/IndiaMap';
import Watchlist, { useWatchlist } from './pages/Watchlist';
import Compare from './pages/Compare';
import SavedReports from './pages/SavedReports';
import WhistleblowerTip from './pages/WhistleblowerTip';
import AuditTrail from './pages/AuditTrail';
import CommandPalette from './components/CommandPalette';
import { DEMO_VENDORS } from './data';

// ── Live Fraud Ticker ──────────────────────────────────────────────
const TICKER_ITEMS = DEMO_VENDORS
  .filter(v => v.risk_level === 'HIGH' || v.flags.length > 1)
  .map(v => `${v.risk_level}: ${v.vendor_name} (${v.vendor_id}) — Score ${v.score}/100 — ${v.flags[0]?.replace('FLAG_', '') || 'FLAGGED'} — \u20b9${(v.contract_total / 100000).toFixed(1)}L at risk`);

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
  const [page, setPage] = useState(() => {
    const p = new URLSearchParams(window.location.search).get('page');
    return p || 'dashboard';
  });
  const [selectedVendor, setSelectedVendor] = useState(() => {
    const vid = new URLSearchParams(window.location.search).get('vendor');
    if (vid) return DEMO_VENDORS.find(v => v.vendor_id === vid) || null;
    return null;
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('tt-theme') || 'dark');
  const [cmdOpen, setCmdOpen] = useState(false);
  const { count: watchCount } = useWatchlist();

  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
    localStorage.setItem('tt-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (selectedVendor) setPage('search');
  }, []);

  // Ctrl+K to open command palette
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const navigate = (newPage, vendor = null) => {
    setPage(newPage);
    if (vendor) setSelectedVendor(vendor);
    const params = new URLSearchParams();
    params.set('page', newPage);
    if (vendor) params.set('vendor', vendor.vendor_id);
    window.history.pushState({}, '', `?${params.toString()}`);
  };

  const NAV = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'search', label: 'Vendor Scan' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'graph', label: 'Cluster Graph' },
    { id: 'agent', label: 'AI Agent' },
    { id: 'map', label: 'India Map' },
    { id: 'watchlist', label: 'Watchlist', badge: watchCount > 0 ? watchCount : null },
    { id: 'compare', label: 'Compare' },
    { id: 'reports', label: 'Reports' },
    { id: 'tip', label: 'Submit Tip' },
    { id: 'audit', label: 'Audit Trail' },
    { id: 'pipeline', label: 'How It Works' },
  ];

  return (
    <div className="app">
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onNavigate={navigate} />
      <nav className="navbar">
        <div className="navbar-logo">
          <span className="logo-icon">T</span>
          <span>Tender<span className="logo-accent">Trace</span></span>
          <div className="logo-dot" title="System active" />
        </div>
        <div className="nav-center">
          {NAV.map(({ id, label, badge }) => (
            <button key={id} className={`nav-btn ${page === id ? 'active' : ''}`} onClick={() => navigate(id)} style={{ position: 'relative' }}>
              {label}
              {badge && (
                <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: 'white', borderRadius: 999, fontSize: '0.6rem', fontWeight: 900, minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="nav-right">
          <button onClick={() => setCmdOpen(true)} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '0.3rem 0.75rem',
            color: 'var(--text-4)', fontSize: '0.72rem', cursor: 'pointer',
            fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 6,
          }} title="Open command palette (Ctrl+K)">
            <span>Ctrl K</span>
          </button>
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '0.3rem 0.75rem',
            color: 'var(--text-3)', fontSize: '0.78rem', cursor: 'pointer',
            fontFamily: 'var(--font)', fontWeight: 600,
          }} title="Toggle dark/light mode">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <div className="live-pill" title="Connected: Lambda · DynamoDB · S3 · API Gateway"><div className="pulse" />Live · AWS</div>
        </div>
      </nav>
      <FraudTicker />
      <main className="page">
        {page === 'dashboard' && <Dashboard onSelectVendor={(v) => navigate('search', v)} />}
        {page === 'search' && <VendorSearch preselected={selectedVendor} onNavigate={navigate} />}
        {page === 'analytics' && <Analytics />}
        {page === 'graph' && <GraphView />}
        {page === 'agent' && <AgentChat />}
        {page === 'map' && <IndiaMap />}
        {page === 'watchlist' && <Watchlist onSelectVendor={(v) => navigate('search', v)} />}
        {page === 'compare' && <Compare />}
        {page === 'reports' && <SavedReports onSelectVendor={(v) => navigate('search', v)} />}
        {page === 'tip' && <WhistleblowerTip />}
        {page === 'audit' && <AuditTrail />}
        {page === 'pipeline' && <Pipeline />}
      </main>
      <footer>
        <span>Tender Trace &copy; 2026 &middot; Built on AWS &middot; AI ASCEND Hackathon</span>
        <div className="footer-stack">
          {['Amazon S3', 'AWS Lambda', 'Amazon DynamoDB', 'API Gateway', 'Amazon SNS', 'MCA21', 'MyNeta', 'GeM Portal'].map(t => (
            <span key={t} className="footer-chip">{t}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}
