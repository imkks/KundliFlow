import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Sparkles,
  Send,
  Loader2,
  Trash2,
  PenLine,
  CheckCircle2,
  Clock,
  Target,
  RefreshCw,
} from 'lucide-react';
import type { NatalChart } from '@astro/engine';
import { useReading, type MainTab } from '../context/ReadingContext.tsx';
import { API_BASE_URL } from '../config.ts';
import { authHeaders } from '../services/apiClient.ts';

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

const LIFE_EVENT_TOPICS = [
  { id: 'career', label: 'Career / Job' },
  { id: 'relationship', label: 'Love / Marriage' },
  { id: 'money', label: 'Money / Wealth' },
  { id: 'move', label: 'Relocation / Home' },
  { id: 'growth', label: 'Tough Phase / Turning Point' },
] as const;

const LIFE_EVENT_WINDOWS = [
  { id: 'past', label: 'Past Event' },
  { id: 'now', label: 'Right Now' },
  { id: 'next_year', label: 'Next 12 Months' },
] as const;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  retryQuestion?: string;
  mode?: string;
  because?: { claim: string; evidenceIds: string[] }[];
  timing?: { windowId: string; startUtc: string; endUtc: string; summary: string }[];
  reflect?: string;
  followUps?: string[];
  steps?: string[];
  error?: boolean;
}

const CHAT_STORAGE_PREFIX = 'astro_copilot_chat_v2_';

interface AskCopilotDrawerProps {
  apiBaseUrl?: string;
  profileId: string | null;
  profileName?: string;
  natalChart: NatalChart;
  shadbala: any;
  ashtakvarga: any;
  dashas: any;
  transits: any;
  onOpenDossier?: () => void;
}

export const AskCopilotDrawer: React.FC<AskCopilotDrawerProps> = ({
  apiBaseUrl = API_BASE_URL,
  profileId,
  profileName,
  natalChart,
  shadbala,
  ashtakvarga,
  dashas,
  transits,
  onOpenDossier,
}) => {
  const {
    askOpen,
    setAskOpen,
    askPrefill,
    activeTab,
    setActiveTab,
    isGuided,
    isQuant,
    openLifeEventModal,
  } = useReading();

  const [input, setInput] = useState('');
  const [deepMode, setDeepMode] = useState(false);
  const [sending, setSending] = useState(false);
  const [liveSteps, setLiveSteps] = useState<Array<{ id: string; text: string; kind: string }>>([]);
  const [expandedStepsId, setExpandedStepsId] = useState<string | null>(null);
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Guided Life Event Prompt Builder state
  const [builderTopic, setBuilderTopic] = useState<string>('career');
  const [builderWindow, setBuilderWindow] = useState<string>('now');
  const [builderDate, setBuilderDate] = useState<string>('');

  const storageKey = `${CHAT_STORAGE_PREFIX}${profileId ?? 'guest'}`;

  useEffect(() => {
    let cancelled = false;
    let hasLocalMsgs = false;
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed) && parsed.length > 0) {
        hasLocalMsgs = true;
        setMessages(parsed);
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    }

    // Only fetch server conversation history when the drawer is actually opened and local cache is empty
    if (profileId && askOpen && !hasLocalMsgs) {
      fetch(`${apiBaseUrl}/api/conversations/${encodeURIComponent(profileId)}`, {
        headers: authHeaders(),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled || !data || !Array.isArray(data.messages) || data.messages.length === 0) return;
          const serverMsgs: ChatMessage[] = data.messages.map((m: any, idx: number) => ({
            id: m.id ?? `srv-${idx}`,
            role: m.role === 'user' ? 'user' : 'assistant',
            text: m.content ?? '',
            timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          }));
          setMessages(serverMsgs);
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [profileId, apiBaseUrl, storageKey, askOpen]);

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (askPrefill) setInput(askPrefill);
  }, [askPrefill]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-30)));
    } catch {
      // ignore
    }
  }, [messages, storageKey]);

  useEffect(() => {
    if (askOpen) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    }
  }, [askOpen, messages.length, sending]);

  useEffect(() => {
    if (!askOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAskOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [askOpen, setAskOpen]);

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
    setLiveSteps([{ id: 'init', text: 'Connecting to KundliFlow Jyotish engine…', kind: 'trace' }]);

    const collectedToolSteps: string[] = [];

    try {
      const res = await fetch(`${apiBaseUrl}/api/ask`, {
        method: 'POST',
        headers: authHeaders({
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        }),
        body: JSON.stringify(
          profileId
            ? { profileId, question: q, deepMode: deepMode || isQuant, deep: deepMode || isQuant }
            : { natal: natalChart, shadbala, ashtakvarga, dashas, transits, question: q, deepMode: deepMode || isQuant, deep: deepMode || isQuant },
        ),
      });
      if (!res.ok) throw new Error(`API HTTP ${res.status}`);

      let finalData: any = null;
      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvent = 'message';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) {
              currentEvent = 'message';
              continue;
            }
            if (line.startsWith('event:')) {
              currentEvent = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              const jsonStr = line.slice(5).trim();
              try {
                const payload = JSON.parse(jsonStr);
                if (currentEvent === 'result') {
                  finalData = payload;
                } else if (currentEvent === 'error') {
                  throw new Error(payload?.error || 'Stream error');
                } else if (payload?.message) {
                  if (currentEvent === 'tool_call') {
                    collectedToolSteps.push(String(payload.message));
                  }
                  setLiveSteps((prev) => {
                    const filtered = prev.filter((s) => s.id !== 'init');
                    if (filtered.some((s) => s.text === payload.message)) return filtered;
                    return [...filtered, { id: `${Date.now()}-${Math.random()}`, text: String(payload.message), kind: currentEvent }];
                  });
                }
              } catch (parseErr: any) {
                if (currentEvent === 'error') throw parseErr;
              }
            }
          }
        }
      } else {
        finalData = await res.json();
      }

      const data = finalData ?? {};
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
        steps: collectedToolSteps.length > 0 ? collectedToolSteps : undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: `Could not reach MyAstro AI (${err?.message ?? 'offline'}). Make sure @astro/api is running.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          retryQuestion: q,
          error: true,
        },
      ]);
    } finally {
      setSending(false);
      setLiveSteps([]);
    }
  };

  const handleGuidedBuilderAsk = () => {
    const topicLabel = LIFE_EVENT_TOPICS.find((t) => t.id === builderTopic)?.label ?? 'life';
    const windowText =
      builderWindow === 'past'
        ? builderDate
          ? `around ${builderDate}`
          : 'in my past'
        : builderWindow === 'next_year'
        ? 'over the next 12 months'
        : 'right now';
    const toneHint = isGuided
      ? 'Explain in simple everyday language without heavy Sanskrit jargon.'
      : isQuant
      ? 'Cite exact houses, degrees, dashas, and ashtakvarga/shadbala factors.'
      : 'Connect the relevant houses, dashas, and transits clearly.';
    sendQuestion(`What does my chart show for ${topicLabel} ${windowText}? ${toneHint}`);
  };

  if (!askOpen) return null;

  const suggestions = CONTEXT_SUGGESTIONS[activeTab] ?? CONTEXT_SUGGESTIONS.kundli;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ask AI Copilot"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2400,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(10, 9, 22, 0.68)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={() => setAskOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(540px, 100vw)',
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
            padding: '13px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(32, 29, 64, 0.94)',
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
                {profileName ? (
                  <>
                    Chart: <strong style={{ color: 'var(--teal)' }}>{profileName}</strong> •{' '}
                  </>
                ) : null}
                Viewing <strong style={{ color: 'var(--gold)', textTransform: 'capitalize' }}>{activeTab}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={() => {
                setAskOpen(false);
                openLifeEventModal();
              }}
              title="Pick a life event date to analyze"
              style={{
                padding: '5px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                background: 'var(--surface-alt)',
                color: 'var(--teal)',
                border: '1px solid rgba(95, 194, 179, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Target size={12} /> Event Date
            </button>
            <button
              type="button"
              onClick={() => setDeepMode((d) => !d)}
              title="Enable deeper multi-step reasoning"
              style={{
                padding: '5px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                background: deepMode || isQuant ? 'rgba(227, 173, 70, 0.2)' : 'var(--surface-alt)',
                color: deepMode || isQuant ? 'var(--gold)' : 'var(--text-muted)',
                border: deepMode || isQuant ? '1px solid var(--gold)' : '1px solid var(--border-subtle)',
              }}
            >
              {deepMode || isQuant ? '✦ Deep' : 'Fast'}
            </button>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => setMessages([])}
                title="Clear chat history"
                aria-label="Clear chat history"
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
              type="button"
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
              <div style={{ padding: 13, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border-subtle)', fontSize: 13, lineHeight: 1.55, color: 'var(--text-main)' }}>
                <strong style={{ color: 'var(--gold)' }}>Namaste!</strong> Ask about any past or upcoming life event, today&apos;s timing, or chart placement. Every answer is verified against your exact chart calculations.
              </div>

              {/* Guided Life-Event Prompt Builder */}
              <div style={{ padding: 12, borderRadius: 12, background: 'rgba(95, 194, 179, 0.07)', border: '1px solid rgba(95, 194, 179, 0.3)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase' }}>
                  Quick Life-Event Question Builder
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {LIFE_EVENT_TOPICS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setBuilderTopic(t.id)}
                      style={{
                        padding: '4px 9px',
                        borderRadius: 14,
                        fontSize: 11.5,
                        fontWeight: 600,
                        background: builderTopic === t.id ? 'var(--teal)' : 'var(--surface)',
                        color: builderTopic === t.id ? '#15132b' : 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  {LIFE_EVENT_WINDOWS.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setBuilderWindow(w.id)}
                      style={{
                        padding: '4px 9px',
                        borderRadius: 8,
                        fontSize: 11.5,
                        fontWeight: 600,
                        background: builderWindow === w.id ? 'var(--gold)' : 'var(--surface)',
                        color: builderWindow === w.id ? '#15132b' : 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {w.label}
                    </button>
                  ))}
                  {builderWindow === 'past' && (
                    <input
                      type="text"
                      value={builderDate}
                      onChange={(e) => setBuilderDate(e.target.value)}
                      placeholder="Year or YYYY-MM (optional)"
                      style={{
                        flex: '1 1 130px',
                        padding: '4px 8px',
                        borderRadius: 7,
                        fontSize: 11.5,
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-main)',
                      }}
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleGuidedBuilderAsk}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 12.5 }}
                >
                  <Sparkles size={14} /> Ask AI About This
                </button>
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Or try a prompt for {activeTab}:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {suggestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendQuestion(q)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'var(--surface)',
                      border: '1px solid var(--border-subtle)',
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

          {messages.map((m) => {
            const showEvidenceExpanded = !isGuided || expandedEvidenceId === m.id;
            return (
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
                    maxWidth: '92%',
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--teal)', fontWeight: 700 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={11} /> {m.mode.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{m.timestamp}</span>
                    </div>
                  )}

                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>

                  {m.error && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {m.retryQuestion && (
                        <button
                          type="button"
                          onClick={() => sendQuestion(m.retryQuestion)}
                          className="btn btn-outline"
                          style={{ fontSize: 11.5 }}
                        >
                          <RefreshCw size={12} /> Retry Question
                        </button>
                      )}
                      {onOpenDossier && (
                        <button
                          type="button"
                          onClick={() => {
                            setAskOpen(false);
                            onOpenDossier();
                          }}
                          className="btn btn-outline"
                          style={{ fontSize: 11.5 }}
                        >
                          Copy AI Dossier Instead
                        </button>
                      )}
                    </div>
                  )}

                  {m.because && m.because.length > 0 && (
                    isGuided && !showEvidenceExpanded ? (
                      <button
                        type="button"
                        onClick={() => setExpandedEvidenceId(m.id)}
                        style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 600, color: 'var(--gold)' }}
                      >
                        See why in your chart ({m.because.length}) ▾
                      </button>
                    ) : (
                      <div style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--surface-alt)', fontSize: 11.5, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 10.5, textTransform: 'uppercase' }}>
                            Chart Evidence
                          </span>
                          {isGuided && (
                            <button type="button" onClick={() => setExpandedEvidenceId(null)} style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                              Hide ▴
                            </button>
                          )}
                        </div>
                        {m.because.slice(0, isQuant ? 5 : 3).map((b, idx) => (
                          <div key={idx} style={{ color: 'var(--text-muted)', lineHeight: 1.45 }}>
                            • {b.claim}
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {m.timing && m.timing.length > 0 && (
                    <div style={{ fontSize: 11.5, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Clock size={12} /> {m.timing[0]!.summary}
                    </div>
                  )}

                  {m.steps && m.steps.length > 0 && (
                    <div style={{ marginTop: 2 }}>
                      <button
                        type="button"
                        onClick={() => setExpandedStepsId(expandedStepsId === m.id ? null : m.id)}
                        style={{
                          fontSize: 11,
                          color: 'var(--teal)',
                          fontWeight: 600,
                        }}
                      >
                        ✓ Checked {m.steps.length} chart source{m.steps.length === 1 ? '' : 's'} {expandedStepsId === m.id ? '▴' : '▾'}
                      </button>
                      {expandedStepsId === m.id && (
                        <div style={{ marginTop: 5, padding: '6px 9px', borderRadius: 7, background: 'rgba(95, 194, 179, 0.07)', border: '1px solid rgba(95, 194, 179, 0.2)', display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: 'var(--text-muted)' }}>
                          {m.steps.map((st, sIdx) => (
                            <div key={sIdx}>✓ {st}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {m.reflect && (
                    <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(227, 173, 70, 0.08)', border: '1px solid rgba(227, 173, 70, 0.25)', fontSize: 11.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span><strong style={{ color: 'var(--gold)' }}>Reflect:</strong> {m.reflect}</span>
                      <button
                        type="button"
                        onClick={() => { setAskOpen(false); setActiveTab('journal'); }}
                        className="btn btn-outline"
                        style={{ fontSize: 10.5, padding: '4px 8px', whiteSpace: 'nowrap' }}
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
                        type="button"
                        onClick={() => sendQuestion(fq)}
                        style={{
                          fontSize: 11.5,
                          padding: '5px 10px',
                          borderRadius: 12,
                          background: 'var(--surface-alt)',
                          border: '1px solid var(--border)',
                          color: 'var(--gold)',
                          textAlign: 'left',
                        }}
                      >
                        {fq}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {sending && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: '11px 14px',
                borderRadius: 12,
                background: 'var(--surface)',
                border: '1px solid rgba(95, 194, 179, 0.3)',
                fontSize: 12,
                alignSelf: 'flex-start',
                maxWidth: '92%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--teal)', fontWeight: 700, fontSize: 11.5 }}>
                <Loader2 size={13} className="spin" />
                <span>Thinking &amp; checking your chart…</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 4 }}>
                {liveSteps.slice(-6).map((step, idx, arr) => {
                  const isLatest = idx === arr.length - 1;
                  return (
                    <div
                      key={step.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11.5,
                        color: isLatest ? 'var(--text-main)' : 'var(--text-muted)',
                      }}
                    >
                      <span style={{ color: isLatest ? 'var(--gold)' : 'var(--teal)', fontWeight: 700 }}>
                        {isLatest ? '›' : '✓'}
                      </span>
                      <span>{step.text}</span>
                    </div>
                  );
                })}
              </div>
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
            placeholder="Ask about a life event, career, love, dashas…"
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
            aria-label="Send message"
            style={{ padding: '10px 14px', opacity: sending || !input.trim() ? 0.5 : 1 }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};
