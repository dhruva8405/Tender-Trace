import { useState } from 'react';
import './index.css';
import Dashboard from './pages/Dashboard';
import VendorSearch from './pages/VendorSearch';
import GraphView from './pages/GraphView';
import Analytics from './pages/Analytics';
import Pipeline from './pages/Pipeline';
import AgentChat from './pages/AgentChat';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [selectedVendor, setSelectedVendor] = useState(null);

  const NAV = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'search', label: 'Vendor Scan' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'graph', label: 'Cluster Graph' },
    { id: 'agent', label: 'AI Agent' },
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

      <main className="page">
        {page === 'dashboard' && <Dashboard onSelectVendor={(v) => { setSelectedVendor(v); setPage('search'); }} />}
        {page === 'search' && <VendorSearch preselected={selectedVendor} />}
        {page === 'analytics' && <Analytics />}
        {page === 'graph' && <GraphView />}
        {page === 'agent' && <AgentChat />}
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
