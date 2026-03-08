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
import Tenders from './pages/Tenders';
import CommandPalette from './components/CommandPalette';
import { DEMO_VENDORS } from './data';

const TICKER_ITEMS = DEMO_VENDORS
  .filter(v => v.risk_level === 'HIGH' || v.flags.length > 1)
  .map(v => `${v.risk_level}: ${v.vendor_name} (${v.vendor_id}) — Score ${v.score}/100 — ${v.flags[0]?.replace('FLAG_', '') || 'FLAGGED'} — \u20b9${(v.contract_total / 100000).toFixed(1)}L at risk`);

function FraudTicker() {
  const ref = useRef(null);
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let x = 0;
    const animate = () => { x -= 0.5; if (Math.abs(x) >= el.scrollWidth / 2) x = 0; el.style.transform = `translateX(${x}px)`; requestAnimationFrame(animate); };
    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div style={{ background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.15)', overflow: 'hidden', padding: '5px 0', whiteSpace: 'nowrap', userSelect: 'none' }}>
      <div ref={ref} style={{ display: 'inline-flex', gap: '4rem', willChange: 'transform' }}>
        {items.map((item, i) => (
          <span key={i} style={{ fontSize: '0.7rem', color: '#ef4444', fontFamily: 'var(--mono)' }}>
            <span style={{ color: '#f59e0b', fontWeight: 700, marginRight: '0.5rem' }}>ALERT</span>{item}
          </span>
        ))}
      </div>
    </div>
  );
}

const NOTIFS = [
  { id: 1, level: 'HIGH', time: '2m ago', msg: 'C001 Kanpur MediTech won new ₹68L GeM contract — already flagged HIGH risk' },
  { id: 2, level: 'HIGH', time: '14m ago', msg: 'New cluster detected: C004, C011, C019 share same registered agent in Delhi' },
  { id: 3, level: 'MEDIUM', time: '1h ago', msg: 'Tip submitted for Ministry of Public Works — vendor C016 suspected bid rigging' },
];

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(false);
  const unread = read ? 0 : NOTIFS.length;

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (!e.target.closest('#notif-panel')) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div style={{ position: 'relative' }} id="notif-panel">
      <button onClick={() => { setOpen(o => !o); setRead(true); }} style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 7,
        padding: '0.25rem 0.6rem', color: 'var(--text-3)', fontSize: '0.85rem',
        cursor: 'pointer', position: 'relative', lineHeight: 1.4,
      }}>
        {unread > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: 'white', borderRadius: 999, fontSize: '0.58rem', fontWeight: 900, minWidth: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>{unread}</span>
        )}
        Alerts
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 320, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', zIndex: 999, overflow: 'hidden' }}>
          <div style={{ padding: '0.65rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-1)' }}>Recent Alerts</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-4)' }}>via Amazon SNS</span>
          </div>
          {NOTIFS.map((n, i) => (
            <div key={n.id} style={{ padding: '0.75rem 1rem', borderBottom: i < NOTIFS.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: n.level === 'HIGH' ? '#ef4444' : '#f59e0b', marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-2)', margin: '0 0 0.2rem', lineHeight: 1.5 }}>{n.msg}</p>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-4)' }}>{n.time}</span>
              </div>
            </div>
          ))}
          <div style={{ padding: '0.5rem 1rem', background: 'rgba(15,23,42,0.5)', fontSize: '0.68rem', color: 'var(--text-4)', textAlign: 'center' }}>
            Subscribe on Dashboard for real-time email alerts
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sidebar items (secondary pages) ────────────────────────────────
const SIDEBAR_ITEMS = [
  { id: 'tenders', label: 'Tenders', icon: '\u25c8', desc: 'Sanctioned / Ongoing / Pending / Upcoming' },
  { id: 'graph', label: 'Cluster Graph', icon: '\u25c9', desc: 'Visual fraud network' },
  { id: 'map', label: 'India Map', icon: '\u25ce', desc: 'State heatmap' },
  { id: 'watchlist', label: 'Watchlist', icon: '\u229e', desc: 'Saved vendors', badge: true },
  { id: 'compare', label: 'Compare', icon: '\u25f1', desc: 'Side-by-side' },
  { id: 'reports', label: 'Reports', icon: '\u25c6', desc: 'Saved investigations' },
  { id: 'tip', label: 'Submit Tip', icon: '\u25a4', desc: 'Anonymous report' },
  { id: 'audit', label: 'Audit Trail', icon: '\u25e7', desc: 'Activity log' },
  { id: 'pipeline', label: 'How It Works', icon: '\u25a3', desc: 'Methodology' },
];

// ── Top nav items (primary pages) ────────────────────────────────
const TOP_NAV = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'search', label: 'Vendor Scan' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'agent', label: 'AI Agent' },
];

export default function App() {
  const [page, setPage] = useState(() => new URLSearchParams(window.location.search).get('page') || 'dashboard');
  const [selectedVendor, setSelectedVendor] = useState(() => {
    const vid = new URLSearchParams(window.location.search).get('vendor');
    return vid ? DEMO_VENDORS.find(v => v.vendor_id === vid) || null : null;
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('tt-theme') || 'dark');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { count: watchCount } = useWatchlist();

  useEffect(() => { document.body.classList.toggle('light', theme === 'light'); localStorage.setItem('tt-theme', theme); }, [theme]);
  useEffect(() => { if (selectedVendor) setPage('search'); }, []);
  useEffect(() => {
    const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(o => !o); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const navigate = (newPage, vendor = null) => {
    setPage(newPage); if (vendor) setSelectedVendor(vendor);
    const p = new URLSearchParams(); p.set('page', newPage);
    if (vendor) p.set('vendor', vendor.vendor_id);
    window.history.pushState({}, '', `?${p.toString()}`);
  };

  const isSidebarPage = SIDEBAR_ITEMS.some(s => s.id === page);

  return (
    <div className="app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onNavigate={navigate} />

      {/* ── Top Navbar ─────────────────────────────────────────────── */}
      <nav style={{
        display: 'flex', alignItems: 'center', height: 52,
        background: 'var(--bg-nav)', borderBottom: '1px solid var(--border)',
        padding: '0 1.25rem', gap: '0.5rem', position: 'sticky', top: 0, zIndex: 100, flexShrink: 0,
      }}>
        {/* Sidebar toggle */}
        <button onClick={() => setSidebarOpen(o => !o)} style={{
          background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer',
          fontSize: '1rem', padding: '0.3rem', lineHeight: 1, flexShrink: 0,
        }} title="Toggle sidebar">
          {sidebarOpen ? '◧' : '◨'}
        </button>

        {/* Logo */}
        <div onClick={() => navigate('dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginRight: '1rem', flexShrink: 0 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem', color: 'white' }}>T</div>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-1)' }}>Tender<span style={{ color: '#3b82f6' }}>Trace</span></span>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
        </div>

        {/* Primary nav */}
        <div style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
          {TOP_NAV.map(({ id, label }) => (
            <button key={id} onClick={() => navigate(id)} style={{
              background: page === id ? 'rgba(59,130,246,0.12)' : 'none',
              border: page === id ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
              borderRadius: 8, padding: '0.3rem 0.85rem',
              color: page === id ? '#93c5fd' : 'var(--text-3)',
              fontSize: '0.82rem', fontWeight: page === id ? 700 : 500,
              cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <NotificationBell />
          <button onClick={() => setCmdOpen(true)} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 7,
            padding: '0.25rem 0.6rem', color: 'var(--text-4)', fontSize: '0.7rem',
            cursor: 'pointer', fontFamily: 'var(--mono)', letterSpacing: '0.04em',
          }}>⌘K</button>
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 7,
            padding: '0.25rem 0.65rem', color: 'var(--text-3)', fontSize: '0.75rem',
            cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600,
          }}>{theme === 'dark' ? 'Light' : 'Dark'}</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 999, padding: '0.2rem 0.65rem', fontSize: '0.7rem', color: '#34d399', fontWeight: 700 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />
            Live · AWS
          </div>
        </div>
      </nav>

      <FraudTicker />

      {/* ── Body: Sidebar + Main ────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* Sidebar */}
        {sidebarOpen && (
          <aside style={{
            width: 210, flexShrink: 0, background: 'var(--bg-sidebar, var(--bg-nav))',
            borderRight: '1px solid var(--border)', padding: '1rem 0.75rem',
            display: 'flex', flexDirection: 'column', gap: '0.25rem',
            position: 'sticky', top: 82, height: 'calc(100vh - 82px)', overflowY: 'auto',
          }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.4rem' }}>Tools</div>
            {SIDEBAR_ITEMS.map(({ id, label, icon, desc, badge }) => (
              <button key={id} onClick={() => navigate(id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                background: page === id ? 'rgba(59,130,246,0.1)' : 'none',
                border: page === id ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
                borderRadius: 9, padding: '0.55rem 0.65rem', cursor: 'pointer',
                fontFamily: 'var(--font)', textAlign: 'left', transition: 'all 0.15s',
                position: 'relative',
              }}
                onMouseEnter={e => { if (page !== id) e.currentTarget.style.background = 'var(--hover, rgba(255,255,255,0.04))'; }}
                onMouseLeave={e => { if (page !== id) e.currentTarget.style.background = 'none'; }}
              >
                <span style={{ fontSize: '0.9rem', opacity: 0.7, width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: page === id ? 700 : 500, color: page === id ? '#93c5fd' : 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-4)', marginTop: 1 }}>{desc}</div>
                </div>
                {badge && watchCount > 0 && (
                  <span style={{ background: '#ef4444', color: 'white', borderRadius: 999, fontSize: '0.58rem', fontWeight: 900, minWidth: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', flexShrink: 0 }}>{watchCount}</span>
                )}
              </button>
            ))}

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontSize: '0.65rem', color: 'var(--text-4)', lineHeight: 1.6, padding: '0.75rem 0.5rem 0' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-3)' }}>Stack</div>
              {['S3', 'Lambda', 'DynamoDB', 'API Gateway', 'SNS'].map(s => (
                <div key={s}>{s}</div>
              ))}
            </div>
          </aside>
        )}

        {/* Main content */}
        <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          {page === 'dashboard' && <Dashboard onSelectVendor={(v) => navigate('search', v)} />}
          {page === 'search' && <VendorSearch preselected={selectedVendor} onNavigate={navigate} />}
          {page === 'analytics' && <Analytics />}
          {page === 'agent' && <AgentChat />}
          {page === 'tenders' && <Tenders onSelectVendor={(v) => navigate('search', v)} />}
          {page === 'graph' && <GraphView />}
          {page === 'map' && <IndiaMap />}
          {page === 'watchlist' && <Watchlist onSelectVendor={(v) => navigate('search', v)} />}
          {page === 'compare' && <Compare />}
          {page === 'reports' && <SavedReports onSelectVendor={(v) => navigate('search', v)} />}
          {page === 'tip' && <WhistleblowerTip />}
          {page === 'audit' && <AuditTrail />}
          {page === 'pipeline' && <Pipeline />}
        </main>
      </div>
    </div>
  );
}
