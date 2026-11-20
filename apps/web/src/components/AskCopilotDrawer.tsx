import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Sparkles, Send, Loader2, Trash2, PenLine, CheckCircle2, Clock } from 'lucide-react';
import type { NatalChart } from '@astro/engine';
import { useReading, type MainTab } from '../context/ReadingContext.tsx';
import { API_BASE_URL } from '../config.ts';

const CONTEXT_SUGGESTIONS: Record<MainTab, string[]> = {
  today: [
    'How should I plan my day given today’s Moon, Hora, and transits?',
    'Is today supportive for important decisions or financial commitments?',
  ],
  kundli: [
    'What are the strongest themes in my Lagna and 10th house?',
    'How do my D1 Rashi and D9 Navamsha placements work together?',
  ],
  timing: [
    'What is my current Vimshottari Mahadasha and Antardasha activating?',
    'How do my current Saturn and Jupiter transits affect my chart?',
  ],
  strengths: [
    'Which planets are strongest in Shadbala and how do my Yogas help?',
    'What does my Atmakaraka reveal about my core life direction?',
  ],
  journal: [
    'How do my recent journal reflections line up with my active Dasha?',
    'What patterns should I watch for during this planetary period?',
  ],
};

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  mode?: string;
  because?: { claim: string; evidenceIds: string[] }[];
  timing?: { windowId: string; startUtc: string; endUtc: string; summary: string }[];
  reflect?: string;
  followUps?: string[];
  error?: boolean;
}

const CHAT_STORAGE_KEY = 'astro_copilot_chat_v2';

interface AskCopilotDrawerProps {
  apiBaseUrl?: string;
  profileId: string | null;
  natalChart: NatalChart;
  shadbala: any;
  ashtakvarga: any;
  dashas: any;
  transits: any;
}

export const AskCopilotDrawer: React.FC<AskCopilotDrawerProps> = ({
  apiBaseUrl = API_BASE_URL,
  profileId,
  natalChart,
  shadbala,
  ashtakvarga,
  dashas,
  transits,
}) => {
  const { askOpen, setAskOpen, askPrefill, activeTab, setActiveTab } = useReading();
  const [input, setInput] = useState('');
  const [deepMode, setDeepMode] = useState(false);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (askPrefill) setInput(askPrefill);
  }, [askPrefill]);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      // ignore
    }
  }, [messages]);

  useEffect(() => {
    if (askOpen) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    }
  }, [askOpen, messages.length, sending]);

  const sendQuestion = async (rawQ?: string) => {
    const q = (rawQ ?? input).trim();
    if (!q || sending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          profileId
            ? { profileId, question: q, deepMode }
            : { natal: natalChart, shadbala, ashtakvarga, dashas, transits, question: q, deepMode },
        ),
      });
      if (!res.ok) throw new Error(`API HTTP ${res.status}`);
      const data = await res.json();
      const resp = data.response ?? {};
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: resp.answer || 'No response received.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: data.mode,
        because: resp.because,
        timing: resp.timing,
        reflect: resp.reflect,
        followUps: resp.followUps,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: `Could not reach MyAstro AI (${err?.message ?? 'offline'}). Make sure @astro/api is running on localhost:8787.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          error: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (!askOpen) return null;

  const suggestions = CONTEXT_SUGGESTIONS[activeTab] ?? CONTEXT_SUGGESTIONS.kundli;

  return (
    <div
      role="dialog"
      aria-label="Ask AI Copilot"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2400,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(10, 9, 22, 0.65)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={() => setAskOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(520px, 100vw)',
          height: '100vh',
          background: '#141129',
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-14px 0 44px rgba(0,0,0,0.6)',
        }}
      >
        {/* Sticky Top Header */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(32, 29, 64, 0.9)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'rgba(95, 194, 179, 0.16)',
                border: '1px solid var(--teal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={18} style={{ color: 'var(--teal)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text-main)' }}>
                Jyotish AI Copilot
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Verified chart tools • Viewing <strong style={{ color: 'var(--gold)', textTransform: 'capitalize' }}>{activeTab}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => setDeepMode((d) => !d)}
              title="Enable deeper multi-step reasoning"
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                background: deepMode ? 'rgba(227, 173, 70, 0.2)' : 'var(--surface-alt)',
                color: deepMode ? 'var(--gold)' : 'var(--text-muted)',
                border: deepMode ? '1px solid var(--gold)' : '1px solid var(--border-subtle)',
              }}
            >
              {deepMode ? '✦ Deep' : 'Fast'}
            </button>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                title="Clear chat history"
                style={{
                  padding: '6px',
                  borderRadius: 6,
                  background: 'var(--surface-alt)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <Trash2 size={13} />
              </button>
            )}
            <button
              onClick={() => setAskOpen(false)}
              aria-label="Close AI Copilot"
              style={{
                padding: '6px',
                borderRadius: 6,
                background: 'var(--surface-alt)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable Chat Thread */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <div style={{ padding: 14, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border-subtle)', fontSize: 13, lineHeight: 1.6, color: 'var(--text-main)' }}>
                <strong style={{ color: 'var(--gold)' }}>Namaste!</strong> Ask anything about your chart, Dashas, transits, career, relationships, or journal reflections. Every answer is checked against your real Swiss Ephemeris calculations.
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Suggested for {activeTab}:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {suggestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendQuestion(q)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'rgba(95, 194, 179, 0.08)',
                      border: '1px solid rgba(95, 194, 179, 0.25)',
                      color: 'var(--text-main)',
                      fontSize: 12.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Sparkles size={13} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 6,
              }}
            >
              <div
                style={{
                  maxWidth: '90%',
                  padding: '11px 14px',
                  borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background:
                    m.role === 'user'
                      ? 'linear-gradient(135deg, rgba(95, 194, 179, 0.25), rgba(95, 194, 179, 0.14))'
                      : m.error
                      ? 'rgba(217, 119, 54, 0.15)'
                      : 'var(--surface)',
                  border:
                    m.role === 'user'
                      ? '1px solid rgba(95, 194, 179, 0.45)'
                      : m.error
                      ? '1px solid var(--amber)'
                      : '1px solid var(--border-subtle)',
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: 'var(--text-main)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {m.role === 'assistant' && m.mode && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: 'var(--teal)', fontWeight: 700 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={11} /> {m.mode.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{m.timestamp}</span>
                  </div>
                )}

                <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>

                {m.because && m.because.length > 0 && (
                  <div style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--surface-alt)', fontSize: 11.5, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 10.5, textTransform: 'uppercase' }}>
                      Chart Evidence
                    </div>
                    {m.because.slice(0, 3).map((b, idx) => (
                      <div key={idx} style={{ color: 'var(--text-muted)', lineHeight: 1.45 }}>
                        • {b.claim}
                      </div>
                    ))}
                  </div>
                )}

                {m.timing && m.timing.length > 0 && (
                  <div style={{ fontSize: 11.5, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={12} /> {m.timing[0]!.summary}
                  </div>
                )}

                {m.reflect && (
                  <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(227, 173, 70, 0.08)', border: '1px solid rgba(227, 173, 70, 0.25)', fontSize: 11.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span><strong style={{ color: 'var(--gold)' }}>Reflect:</strong> {m.reflect}</span>
                    <button
                      onClick={() => { setAskOpen(false); setActiveTab('journal'); }}
                      className="btn btn-outline"
                      style={{ fontSize: 10.5, padding: '3px 8px', whiteSpace: 'nowrap' }}
                    >
                      <PenLine size={11} /> Log
                    </button>
                  </div>
                )}
              </div>

              {m.followUps && m.followUps.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: '92%' }}>
                  {m.followUps.slice(0, 3).map((fq) => (
                    <button
                      key={fq}
                      onClick={() => sendQuestion(fq)}
                      style={{
                        fontSize: 11,
                        padding: '4px 9px',
                        borderRadius: 12,
                        background: 'var(--surface-alt)',
                        border: '1px solid var(--border)',
                        color: 'var(--gold)',
                        cursor: 'pointer',
                      }}
                    >
                      {fq}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border-subtle)', fontSize: 12.5, color: 'var(--teal)', alignSelf: 'flex-start' }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Reading your chart &amp; verifying placements…
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Sticky Bottom Chat Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuestion();
          }}
          style={{
            padding: '12px 14px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(32, 29, 64, 0.95)',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about career, marriage, Dashas, transits…"
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 10,
              background: 'var(--surface-alt)',
              border: '1px solid var(--border)',
              color: 'var(--text-main)',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="btn btn-primary"
            style={{ padding: '10px 14px', opacity: sending || !input.trim() ? 0.5 : 1 }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};
