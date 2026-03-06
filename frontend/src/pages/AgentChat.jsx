import { useState, useRef, useEffect } from 'react';
import { fetchAgentQuery } from '../api.js';


const QUICK_QUERIES = [
    'Run a full fraud investigation on all procurement data',
    'Which vendors should be referred to CBI immediately?',
    'Investigate the Kanpur Medical cluster deeply',
    'Which ministry has the most captured procurement?',
    'Find all companies linked to BJP politicians',
    'What is the total estimated financial fraud amount?',
];

const TRACE_ICONS = {
    reasoning: '·',
    tool_call: '·',
    observation: '·',
};

const TRACE_COLORS = {
    reasoning: { bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.2)', label: '#3b82f6' },
    tool_call: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', label: '#f59e0b' },
    observation: { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)', label: '#10b981' },
};

function TraceStep({ step, idx }) {
    const [open, setOpen] = useState(idx < 3); // first 3 open by default
    const c = TRACE_COLORS[step.type] || TRACE_COLORS.reasoning;
    const icon = TRACE_ICONS[step.type] || '•';

    let label = step.type;
    let preview = step.text || '';
    if (step.type === 'tool_call') {
        label = `Tool: ${step.action_group || step.function || 'unknown'}`;
        preview = step.parameters?.map(p => `${p.name}=${p.value}`).join(', ') || '';
    }

    return (
        <div style={{
            marginBottom: '0.5rem',
            border: `1px solid ${c.border}`,
            background: c.bg,
            borderRadius: 8,
            overflow: 'hidden',
        }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: 'var(--text-2)', fontFamily: 'var(--font)',
                }}
            >
                <span style={{ fontSize: '0.85rem' }}>{icon}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: c.label, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                {!open && preview && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                        — {preview.slice(0, 80)}{preview.length > 80 ? '…' : ''}
                    </span>
                )}
                <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-4)' }}>{open ? '▲' : '▼'}</span>
            </button>
            {open && (
                <div style={{ padding: '0 0.75rem 0.75rem', fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.6, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {step.type === 'tool_call'
                        ? JSON.stringify({ function: step.function, parameters: step.parameters }, null, 2)
                        : (step.text || '').slice(0, 2000)}
                </div>
            )}
        </div>
    );
}

function Message({ msg }) {
    if (msg.role === 'user') {
        return (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <div style={{
                    maxWidth: '70%', padding: '0.75rem 1rem',
                    background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                    borderRadius: '16px 16px 4px 16px',
                    fontSize: '0.875rem', color: '#fff', lineHeight: 1.6,
                }}>
                    {msg.content}
                </div>
            </div>
        );
    }

    if (msg.role === 'assistant') {
        return (
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 800, color: '#fff',
                }}>AI</div>
                <div style={{ flex: 1 }}>
                    {/* Trace steps */}
                    {msg.trace_steps?.length > 0 && (
                        <div style={{ marginBottom: '0.75rem' }}>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>
                                Agent Reasoning — {msg.trace_steps.length} steps
                            </div>
                            {msg.trace_steps.map((step, i) => (
                                <TraceStep key={i} step={step} idx={i} />
                            ))}
                        </div>
                    )}
                    {/* Final response */}
                    {msg.content && (
                        <div style={{
                            padding: '0.875rem 1rem',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px 16px 16px 16px',
                            fontSize: '0.875rem', color: 'var(--text-1)', lineHeight: 1.75,
                            whiteSpace: 'pre-wrap',
                        }}>
                            {msg.content}
                        </div>
                    )}
                    {msg.error && (
                        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#ef4444', fontSize: '0.8rem' }}>
                            ⚠️ {msg.error}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (msg.role === 'loading') {
        return (
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>AI</div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 150, 300].map(delay => (
                        <div key={delay} style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: '#3b82f6',
                            animation: `pulse 1.2s ease-in-out ${delay}ms infinite`,
                        }} />
                    ))}
                    <span style={{ marginLeft: 8, fontSize: '0.78rem', color: 'var(--text-4)' }}>Agent investigating…</span>
                </div>
            </div>
        );
    }
    return null;
}

export default function AgentChat() {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: `👋 **TenderTrace AI Agent** is ready.\n\nI can autonomously investigate procurement fraud across 284 vendors in 10 Indian states. I use Amazon Bedrock (Claude) + DynamoDB to reason through the evidence step-by-step — you'll see my full reasoning trace.\n\nTry one of the quick queries below, or ask me anything about the procurement data.`,
            trace_steps: [],
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId] = useState(() => crypto.randomUUID());
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function sendMessage(query) {
        const q = (query || input).trim();
        if (!q || loading) return;
        setInput('');
        setMessages(m => [...m, { role: 'user', content: q }, { role: 'loading' }]);
        setLoading(true);

        try {
            const data = await fetchAgentQuery(q, sessionId);
            setMessages(m => [
                ...m.filter(x => x.role !== 'loading'),
                {
                    role: 'assistant',
                    content: data.response || JSON.stringify(data, null, 2),
                    trace_steps: data.trace_steps || [],
                    error: null,
                }
            ]);
        } catch (err) {
            setMessages(m => [
                ...m.filter(x => x.role !== 'loading'),
                { role: 'assistant', content: '', error: `Network error: ${err.message}. Is the /agent API Gateway route configured?` }
            ]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <style>{`
                @keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
            `}</style>

            <div className="ph">
                <h1 className="ph-title">AI Investigation Agent</h1>
                <p className="ph-sub">
                    Powered by <strong>Amazon Bedrock Agents (Claude 3)</strong> · Multi-step autonomous reasoning · Full trace visibility
                </p>
            </div>

            {/* Quick queries */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {QUICK_QUERIES.map(q => (
                    <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        disabled={loading}
                        style={{
                            padding: '0.4rem 0.8rem', borderRadius: 20,
                            border: '1px solid var(--border)', background: 'var(--bg-card)',
                            color: 'var(--text-3)', fontSize: '0.72rem', cursor: 'pointer',
                            fontFamily: 'var(--font)', transition: 'all 0.2s',
                            opacity: loading ? 0.5 : 1,
                        }}
                        onMouseEnter={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.color = '#3b82f6'; }}
                        onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-3)'; }}
                    >
                        {q}
                    </button>
                ))}
            </div>

            {/* Chat window */}
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                display: 'flex', flexDirection: 'column',
                height: '60vh', minHeight: 400,
            }}>
                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
                    {messages.map((msg, i) => <Message key={i} msg={msg} />)}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div style={{
                    borderTop: '1px solid var(--border)',
                    padding: '0.875rem 1rem',
                    display: 'flex', gap: '0.75rem', alignItems: 'flex-end',
                }}>
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        placeholder="Ask the agent anything… (Enter to send, Shift+Enter for newline)"
                        disabled={loading}
                        rows={1}
                        style={{
                            flex: 1, resize: 'none', padding: '0.6rem 0.875rem',
                            borderRadius: 10, border: '1px solid var(--border)',
                            background: 'var(--bg-card-2)', color: 'var(--text-1)',
                            fontFamily: 'var(--font)', fontSize: '0.875rem',
                            outline: 'none', lineHeight: 1.5,
                        }}
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={loading || !input.trim()}
                        style={{
                            padding: '0.6rem 1.25rem', borderRadius: 10,
                            border: 'none', cursor: 'pointer',
                            background: loading || !input.trim() ? 'var(--bg-card-2)' : 'linear-gradient(135deg, #2563eb, #06b6d4)',
                            color: loading || !input.trim() ? 'var(--text-4)' : '#fff',
                            fontWeight: 700, fontSize: '0.875rem', fontFamily: 'var(--font)',
                            transition: 'all 0.2s',
                        }}
                    >
                        {loading ? '…' : 'Send'}
                    </button>
                </div>
            </div>

            {/* Info card */}
            <div className="card" style={{ marginTop: '1rem', borderColor: 'rgba(37,99,235,0.2)' }}>
                <div className="card-title" style={{ marginBottom: '0.4rem' }}>How the Agent Works</div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-2)', lineHeight: 1.7, margin: 0 }}>
                    This is a <strong>real Amazon Bedrock Agent</strong> — not a chatbot. It autonomously decides which tools to call:
                    <strong> scan_vendors</strong> (DynamoDB scan) → <strong>investigate_cluster</strong> (deep-dive shared addresses) →
                    <strong> compute_risk</strong> (7-rule scoring) → <strong>save_report</strong> (persist findings).
                    Each step is shown in the reasoning trace above the response.
                    You can ask follow-up questions in the same session — the agent remembers context.
                </p>
            </div>
        </>
    );
}
