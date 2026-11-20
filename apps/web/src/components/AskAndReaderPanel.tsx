import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Bot,
  Send,
  Sparkles,
  Clock,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  PenLine,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import type { NatalChart } from '@astro/engine';

interface EvidenceChip {
  id: string;
  label: string;
  kind: string;
}

interface RenderedFinding {
  id: string;
  ruleId: string;
  tier: string;
  theme: string;
  polarity: string;
  strength: number;
  text: string;
  evidenceChips: EvidenceChip[];
}

interface HouseReading {
  house: number;
  sign: string;
  lord: string;
  lordPlacedHouse: number;
  themes: string[];
  tone: 'Mostly supportive' | 'Mixed' | 'Needs attention' | 'Quiet';
  activeDashaNote?: string;
  findings: RenderedFinding[];
  reflectionPrompt: string;
  evidenceChips: EvidenceChip[];
}

interface PlanetReading {
  planet: string;
  sign: string;
  house: number;
  dignity: string;
  nakshatra: string;
  ownedHouses: number[];
  findings: RenderedFinding[];
  karakatwas: string[];
  evidenceChips: EvidenceChip[];
}

interface AskResponsePayload {
  mode: 'level3_verified' | 'level2_fallback' | 'conversational' | 'conceptual';
  trace: string[];
  observedEvidenceIds?: string[];
  response: {
    responseType?: string;
    answer: string;
    because: { claim: string; evidenceIds: string[] }[];
    timing: { windowId: string; startUtc: string; endUtc: string; summary: string }[];
    uncertainty: string;
    reflect: string;
    followUps: string[];
  };
}

interface QaHistoryItem {
  id: string;
  question: string;
  timestamp: string;
  result: AskResponsePayload;
}

interface AskAndReaderPanelProps {
  mode: 'reader' | 'ask';
  apiBaseUrl?: string;
  profileId?: string | null;
  natalChart: NatalChart;
  shadbala: any;
  ashtakvarga: any;
  dashas: any;
  transits: any;
  avasthas?: any;
  activeDomainTab?: 'kundli' | 'dashas' | 'panchang' | 'insights' | 'journal' | 'transits';
  compact?: boolean;
  initialQuestion?: string;
  onJumpToAsk?: (prefill: string) => void;
  onOpenJournalPrompt?: (prompt: string) => void;
}

const QA_STORAGE_KEY = 'astro_qa_history_v1';

const SAMPLE_QUESTIONS = [
  'How is my home life likely to go this year?',
  'What does my chart say about my career direction?',
  'Which themes are most active in my current Dasha period?',
  'What should I keep in mind for relationships?',
];

export const AskAndReaderPanel: React.FC<AskAndReaderPanelProps> = ({
  mode,
  apiBaseUrl = 'http://localhost:8787',
  profileId,
  natalChart,
  shadbala,
  ashtakvarga,
  dashas,
  transits,
  avasthas,
  activeDomainTab,
  compact = false,
  initialQuestion = '',
  onJumpToAsk,
  onOpenJournalPrompt,
}) => {
  // Level 2 Reader state
  const [detailLevel, setDetailLevel] = useState<'simple' | 'standard' | 'detailed'>('standard');
  const [readerSection, setReaderSection] = useState<
    'houses' | 'planets' | 'dashas' | 'panchang' | 'kundli' | 'yogas' | 'strengths' | 'specials'
  >('houses');
  const [houses, setHouses] = useState<HouseReading[]>([]);
  const [planets, setPlanets] = useState<PlanetReading[]>([]);
  const [dashaReadings, setDashaReadings] = useState<any[]>([]);
  const [transitSummary, setTransitSummary] = useState<any>(null);
  const [panchangSummary, setPanchangSummary] = useState<any>(null);
  const [extendedDashas, setExtendedDashas] = useState<any>(null);
  const [kundliExtras, setKundliExtras] = useState<any>(null);
  const [yogasReadings, setYogasReadings] = useState<any[]>([]);
  const [strengthsSummary, setStrengthsSummary] = useState<any>(null);
  const [specialsSummary, setSpecialsSummary] = useState<any>(null);
  const [selectedHouse, setSelectedHouse] = useState<number>(4);
  const [selectedPlanet, setSelectedPlanet] = useState<string>('sun');
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerError, setReaderError] = useState<string | null>(null);

  // Level 3 Ask state
  const [question, setQuestion] = useState(initialQuestion);
  const [deepMode, setDeepMode] = useState(false);
  const [asking, setAsking] = useState(false);
  const [liveTrace, setLiveTrace] = useState<string[]>([]);
  const [inspectedEvidence, setInspectedEvidence] = useState<{ id: string; detail: any } | null>(null);
  const [qaHistory, setQaHistory] = useState<QaHistoryItem[]>(() => {
    try {
      const raw = localStorage.getItem(QA_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (initialQuestion) setQuestion(initialQuestion);
  }, [initialQuestion]);

  useEffect(() => {
    if (!activeDomainTab) return;
    if (activeDomainTab === 'kundli') setReaderSection('houses');
    else if (activeDomainTab === 'dashas' || activeDomainTab === 'transits') setReaderSection('dashas');
    else if (activeDomainTab === 'panchang') setReaderSection('panchang');
    else if (activeDomainTab === 'insights') setReaderSection('yogas');
  }, [activeDomainTab]);

  useEffect(() => {
    try {
      localStorage.setItem(QA_STORAGE_KEY, JSON.stringify(qaHistory.slice(0, 20)));
    } catch {
      // ignore storage quota errors
    }
  }, [qaHistory]);

  // Load Level 2 Readings when in Reader mode
  useEffect(() => {
    if (mode !== 'reader' || !natalChart) return;
    let cancelled = false;
    setReaderLoading(true);
    setReaderError(null);

    fetch(`${apiBaseUrl}/api/reading`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        profileId
          ? { profileId, level: detailLevel }
          : {
              natal: natalChart,
              shadbala,
              ashtakvarga,
              dashas,
              transits,
              avasthas,
              level: detailLevel,
            },
      ),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`API HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!cancelled && Array.isArray(data.houses)) {
          setHouses(data.houses);
          if (Array.isArray(data.planets)) setPlanets(data.planets);
          if (Array.isArray(data.dashas)) setDashaReadings(data.dashas);
          if (data.transits) setTransitSummary(data.transits);
          if (data.panchang) setPanchangSummary(data.panchang);
          if (data.extendedDashas) setExtendedDashas(data.extendedDashas);
          if (data.kundliExtras) setKundliExtras(data.kundliExtras);
          if (Array.isArray(data.yogas)) setYogasReadings(data.yogas);
          if (data.strengths) setStrengthsSummary(data.strengths);
          if (data.specials) setSpecialsSummary(data.specials);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setReaderError(
            `API server (${apiBaseUrl}) not reachable (${err.message}). Start @astro/api to load full Level 2 rule readings.`,
          );
        }
      })
      .finally(() => {
        if (!cancelled) setReaderLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, detailLevel, profileId, natalChart, apiBaseUrl]);

  const handleInspectEvidence = async (factId: string) => {
    if (!profileId) return;
    try {
      const r = await fetch(`${apiBaseUrl}/api/facts/${encodeURIComponent(profileId)}/${encodeURIComponent(factId)}`);
      if (r.ok) {
        const detail = await r.json();
        setInspectedEvidence({ id: factId, detail });
      }
    } catch {
      // ignore
    }
  };

  const handleAsk = async (qOverride?: string) => {
    const q = (qOverride ?? question).trim();
    if (!q || asking) return;
    setAsking(true);
    setLiveTrace(['Connecting to DeepAgent + SQLite engine…']);

    try {
      const res = await fetch(`${apiBaseUrl}/api/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(
          profileId
            ? { profileId, question: q, deep: deepMode }
            : {
                question: q,
                natal: natalChart,
                shadbala,
                ashtakvarga,
                dashas,
                transits,
                avasthas,
                deep: deepMode,
              },
        ),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Server returned ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalResult: AskResponsePayload | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const evBlock of events) {
          const lines = evBlock.split('\n');
          let evName = 'message';
          let dataLine = '';
          for (const line of lines) {
            if (line.startsWith('event:')) evName = line.slice(6).trim();
            if (line.startsWith('data:')) dataLine += line.slice(5).trim();
          }
          if (!dataLine) continue;
          const parsed = JSON.parse(dataLine);
          if (evName === 'result') {
            finalResult = parsed as AskResponsePayload;
          } else if (parsed.message) {
            setLiveTrace((prev) => [...prev, parsed.message]);
          }
        }
      }

      if (finalResult) {
        setQaHistory((prev) => [
          {
            id: `qa_${Date.now()}`,
            question: q,
            timestamp: new Date().toISOString(),
            result: finalResult!,
          },
          ...prev,
        ]);
        setQuestion('');
      }
    } catch (err: any) {
      setLiveTrace((prev) => [
        ...prev,
        `Could not reach ${apiBaseUrl} (${err?.message ?? 'network error'}). Ensure @astro/api is running.`,
      ]);
    } finally {
      setAsking(false);
    }
  };

  if (mode === 'reader') {
    const activeHouse = houses.find((h) => h.house === selectedHouse) ?? houses[0];
    const toneColor = (tone: string) =>
      tone === 'Mostly supportive'
        ? 'var(--teal)'
        : tone === 'Needs attention'
        ? 'var(--amber)'
        : 'var(--gold)';

    const akKaraka = specialsSummary?.karakas?.find((k: any) => k.code === 'AK');
    const activeDasha = dashaReadings?.[0];
    const sadeSati = transitSummary?.sadeSati;
    const todayMoon = panchangSummary?.todayMoon;

    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Header + Reading Depth Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: compact ? 16 : 18, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={18} style={{ color: 'var(--gold)' }} />
              Plain-English Chart Reader (Level 2)
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, marginBottom: 0 }}>
              Rule-engine explanations synced to your active section, with evidence chips and reflection prompts.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-alt)', padding: 3, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', paddingLeft: 6, textTransform: 'uppercase' }}>
              Depth:
            </span>
            {(['simple', 'standard', 'detailed'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setDetailLevel(lvl)}
                style={{
                  padding: '4px 11px',
                  borderRadius: 7,
                  fontSize: 11.5,
                  fontWeight: 700,
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  background: detailLevel === lvl ? 'var(--gold)' : 'transparent',
                  color: detailLevel === lvl ? '#15132b' : 'var(--text-muted)',
                  border: 'none',
                }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* At-a-Glance Summary Strip */}
        {!readerLoading && houses.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
              gap: 8,
              padding: 10,
              borderRadius: 10,
              background: 'rgba(212, 175, 55, 0.05)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
            }}
          >
            <div style={{ fontSize: 11.5 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Active Dasha</div>
              <div style={{ fontWeight: 700, color: 'var(--gold)', marginTop: 2, textTransform: 'capitalize' }}>
                {activeDasha ? `${activeDasha.lord} Mahadasha` : '—'}
                {extendedDashas?.yogini ? ` • ${extendedDashas.yogini.maha}` : ''}
              </div>
            </div>
            <div style={{ fontSize: 11.5 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Soul Significator (AK)</div>
              <div style={{ fontWeight: 700, color: 'var(--teal)', marginTop: 2, textTransform: 'uppercase' }}>
                {akKaraka ? akKaraka.graha : '—'}
              </div>
            </div>
            <div style={{ fontSize: 11.5 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Sade Sati Status</div>
              <div style={{ fontWeight: 700, color: sadeSati?.isActive ? 'var(--amber)' : 'var(--teal)', marginTop: 2 }}>
                {sadeSati ? (sadeSati.isActive ? `Active (${sadeSati.phase})` : 'Inactive') : '—'}
              </div>
            </div>
            <div style={{ fontSize: 11.5 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Today&apos;s Moon (Tara)</div>
              <div style={{ fontWeight: 700, color: todayMoon?.taraSupportive === false ? 'var(--amber)' : 'var(--teal)', marginTop: 2 }}>
                {todayMoon?.taraName ? todayMoon.taraName.split(' (')[0] : '—'}
              </div>
            </div>
          </div>
        )}

        {/* Grouped Reader Section Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {(
            [
              {
                group: 'Core',
                items: [
                  { id: 'houses', label: 'Houses (12)' },
                  { id: 'planets', label: 'Planets (9)' },
                  { id: 'kundli', label: 'Chalit, KP & Varshaphal' },
                ],
              },
              {
                group: 'Timing',
                items: [
                  { id: 'dashas', label: 'Dashas & Gochar' },
                  { id: 'panchang', label: 'Panchang & Today' },
                ],
              },
              {
                group: 'Profile',
                items: [
                  { id: 'yogas', label: `Yogas (${yogasReadings.length})` },
                  { id: 'strengths', label: 'Strengths & SAV' },
                  { id: 'specials', label: 'Vargas, Karakas & Arudhas' },
                ],
              },
            ] as const
          ).map((grp) => (
            <div
              key={grp.group}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 6px',
                borderRadius: 10,
                background: 'var(--surface-alt)',
                border: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 4px' }}>
                {grp.group}
              </span>
              {grp.items.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setReaderSection(sec.id)}
                  style={{
                    padding: '4px 9px',
                    borderRadius: 7,
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: readerSection === sec.id ? 'var(--teal)' : 'transparent',
                    color: readerSection === sec.id ? '#15132b' : 'var(--text-muted)',
                    border: 'none',
                  }}
                >
                  {sec.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {readerError && (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: 'rgba(217, 119, 54, 0.12)',
              border: '1px solid var(--amber)',
              fontSize: 12,
              color: 'var(--text-main)',
            }}
          >
            {readerError}
          </div>
        )}

        {readerLoading && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Evaluating rules against chart.db…
          </div>
        )}

        {!readerLoading && readerSection === 'houses' && houses.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) 1fr', gap: 14, alignItems: 'start' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
              {houses.map((h) => (
                <button
                  key={h.house}
                  onClick={() => setSelectedHouse(h.house)}
                  style={{
                    padding: '8px 9px',
                    borderRadius: 10,
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: selectedHouse === h.house ? 'rgba(227, 173, 70, 0.18)' : 'var(--surface-alt)',
                    border: selectedHouse === h.house ? '1px solid var(--gold)' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)' }}>
                    H{h.house} • {h.sign.slice(0, 3).toUpperCase()}
                  </span>
                  <span style={{ fontSize: 10, color: toneColor(h.tone), fontWeight: 600 }}>{h.tone}</span>
                </button>
              ))}
            </div>

            {activeHouse && (
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, color: 'var(--gold)' }}>
                      House {activeHouse.house} • {activeHouse.sign.toUpperCase()} (Lord {activeHouse.lord} in H{activeHouse.lordPlacedHouse})
                    </h3>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Themes: {activeHouse.themes.map((t) => t.replace(/_/g, ' ')).join(', ')}
                    </span>
                    {activeHouse.activeDashaNote && (
                      <div style={{ marginTop: 4 }}>
                        <span className="teal-badge" style={{ fontSize: 10 }}>
                          <Clock size={10} /> {activeHouse.activeDashaNote}
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="gold-badge">{activeHouse.tone}</span>
                    {onJumpToAsk && (
                      <button
                        onClick={() =>
                          onJumpToAsk(`What does my House ${activeHouse.house} (${activeHouse.themes[0]?.replace(/_/g, ' ')}) show?`)
                        }
                        className="btn btn-outline"
                        style={{ fontSize: 11 }}
                      >
                        <HelpCircle size={13} /> Ask about this
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {activeHouse.findings.map((f) => (
                    <div
                      key={f.id}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        background: 'var(--surface)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ fontWeight: 700, color: toneColor(f.polarity === 'supportive' ? 'Mostly supportive' : f.polarity === 'challenging' ? 'Needs attention' : 'Mixed') }}>
                          {f.polarity.toUpperCase()} • Strength {f.strength}/100 ({f.tier})
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{f.ruleId}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>{f.text}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {f.evidenceChips.map((c) => (
                          <span
                            key={c.id}
                            style={{
                              fontSize: 10,
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: 'rgba(95, 194, 179, 0.1)',
                              border: '1px solid rgba(95, 194, 179, 0.3)',
                              color: 'var(--teal)',
                            }}
                          >
                            {c.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: 'rgba(227, 173, 70, 0.08)',
                    border: '1px solid rgba(227, 173, 70, 0.25)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: 12 }}>
                    <strong style={{ color: 'var(--gold)' }}>Reflect: </strong>
                    {activeHouse.reflectionPrompt}
                  </div>
                  {onOpenJournalPrompt && (
                    <button
                      onClick={() => onOpenJournalPrompt(activeHouse.reflectionPrompt)}
                      className="btn btn-outline"
                      style={{ whiteSpace: 'nowrap', fontSize: 11 }}
                    >
                      <PenLine size={12} /> Journal
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {!readerLoading && readerSection === 'planets' && planets.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 250px) 1fr', gap: 14, alignItems: 'start' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
              {planets.map((p) => (
                <button
                  key={p.planet}
                  onClick={() => setSelectedPlanet(p.planet)}
                  style={{
                    padding: '8px 9px',
                    borderRadius: 10,
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: selectedPlanet === p.planet ? 'rgba(95, 194, 179, 0.18)' : 'var(--surface-alt)',
                    border: selectedPlanet === p.planet ? '1px solid var(--teal)' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-main)' }}>
                    {p.planet}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    H{p.house} • {p.dignity}
                  </span>
                </button>
              ))}
            </div>
            {(() => {
              const ap = planets.find((p) => p.planet === selectedPlanet) ?? planets[0];
              if (!ap) return null;
              return (
                <div
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, color: 'var(--teal)', textTransform: 'capitalize' }}>
                        {ap.planet} in {ap.sign} (H{ap.house}, {ap.dignity})
                      </h3>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Nakshatra: {ap.nakshatra} • Owns H[{ap.ownedHouses.join(', ') || 'none'}] • Karakas: {ap.karakatwas.slice(0, 3).join(', ')}
                      </span>
                    </div>
                    {onJumpToAsk && (
                      <button
                        onClick={() => onJumpToAsk(`How is ${ap.planet} functioning in my chart?`)}
                        className="btn btn-outline"
                        style={{ fontSize: 11 }}
                      >
                        <HelpCircle size={13} /> Ask about {ap.planet}
                      </button>
                    )}
                  </div>
                  {ap.findings.map((f) => (
                    <div
                      key={f.id}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        background: 'var(--surface)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ fontWeight: 700, color: 'var(--gold)' }}>
                          {f.polarity.toUpperCase()} • Strength {f.strength}/100 ({f.tier})
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{f.ruleId}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>{f.text}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {!readerLoading && readerSection === 'dashas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: 'var(--gold)' }}>Active Vimshottari Dasha Periods</h3>
              {dashaReadings.map((dr: any) => (
                <div
                  key={dr.periodId}
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 14, textTransform: 'capitalize', color: 'var(--teal)' }}>
                      Level {dr.level} • {dr.lord}
                    </strong>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {String(dr.startUtc).slice(0, 10)} → {String(dr.endUtc).slice(0, 10)}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{dr.summary}</p>
                  {dr.findings?.slice(0, 2).map((f: any) => (
                    <div key={f.id} style={{ fontSize: 12, color: 'var(--text-muted)', paddingLeft: 8, borderLeft: '2px solid var(--gold)' }}>
                      {f.text}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {transitSummary && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: 15, color: 'var(--gold)' }}>Current Gochar &amp; Sade Sati</h3>
                  {transitSummary.sadeSati && (
                    <span className={transitSummary.sadeSati.isActive ? 'amber-badge' : 'teal-badge'} style={{ fontSize: 11 }}>
                      Sade Sati: {transitSummary.sadeSati.isActive ? `Active (${transitSummary.sadeSati.phase})` : 'Inactive'}
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                  {(transitSummary.planets ?? []).map((tp: any) => (
                    <div
                      key={tp.planet}
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        background: 'var(--surface-alt)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-main)' }}>
                          {tp.planet} {tp.retrograde ? '(R)' : ''} → {tp.sign}
                        </span>
                        <span
                          className={tp.bavQuality === 'supportive' ? 'teal-badge' : tp.bavQuality === 'cautious' ? 'amber-badge' : 'gold-badge'}
                          style={{ fontSize: 10 }}
                        >
                          BAV {tp.bindus}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        H{tp.houseFromLagna} Lagna • H{tp.houseFromMoon} Moon
                      </div>
                      {tp.plainMeaning && (
                        <div style={{ fontSize: 11.5, color: 'var(--text-main)', lineHeight: 1.4 }}>
                          {tp.plainMeaning}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {extendedDashas && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                {extendedDashas.yogini && (
                  <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border)', fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>
                      Yogini Dasha: {extendedDashas.yogini.maha} ({extendedDashas.yogini.mahaLord})
                      {extendedDashas.yogini.antar ? ` / ${extendedDashas.yogini.antar}` : ''}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Ends {extendedDashas.yogini.mahaEnd}
                    </div>
                    <div style={{ lineHeight: 1.45 }}>{extendedDashas.yogini.plainSummary}</div>
                  </div>
                )}
                {extendedDashas.chara && (
                  <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border)', fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: 'var(--teal)', marginBottom: 4 }}>
                      Jaimini Chara Dasha: {extendedDashas.chara.mahaSign} (H{extendedDashas.chara.mahaHouse})
                      {extendedDashas.chara.antarSign ? ` / ${extendedDashas.chara.antarSign}` : ''}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Ends {extendedDashas.chara.mahaEnd}
                    </div>
                    <div style={{ lineHeight: 1.45 }}>{extendedDashas.chara.plainSummary}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!readerLoading && readerSection === 'panchang' && panchangSummary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: 14, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: 15, color: 'var(--gold)' }}>Natal Panchang</h3>
              <div style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 8 }}>{panchangSummary.natal.plainSummary}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11.5 }}>
                <span className="gold-badge">Tithi: {panchangSummary.natal.tithi}</span>
                <span className="teal-badge">Yoga: {panchangSummary.natal.yoga}</span>
                <span className="gold-badge">Karana: {panchangSummary.natal.karana}</span>
                <span className="teal-badge">Vara: {panchangSummary.natal.vara}</span>
              </div>
            </div>

            {panchangSummary.avakahada && (
              <div style={{ padding: 14, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 15, color: 'var(--gold)' }}>Avakahada &amp; Temperament</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11.5, marginBottom: 8 }}>
                  <span className="teal-badge">Gana: {panchangSummary.avakahada.gana}</span>
                  <span className="gold-badge">Nadi: {panchangSummary.avakahada.nadi}</span>
                  <span className="teal-badge">Yoni: {panchangSummary.avakahada.yoni}</span>
                  <span className="gold-badge">Varna: {panchangSummary.avakahada.varna}</span>
                  <span className="teal-badge">Tatva: {panchangSummary.avakahada.tatva}</span>
                  <span className="gold-badge">Paya: {panchangSummary.avakahada.paya}</span>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-main)' }}>
                  <div>{panchangSummary.avakahada.ganaMeaning}</div>
                  <div style={{ marginTop: 4 }}>{panchangSummary.avakahada.nadiMeaning}</div>
                </div>
              </div>
            )}

            {panchangSummary.todayMoon && (
              <div style={{ padding: 14, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 15, color: 'var(--gold)' }}>Today&apos;s Tarabala &amp; Chandrabala</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12 }}>
                  <span className={panchangSummary.todayMoon.chandraBalaSupportive ? 'teal-badge' : 'amber-badge'}>
                    Chandrabala: Moon in {panchangSummary.todayMoon.sign} (H{panchangSummary.todayMoon.houseFromMoon} from Natal Moon)
                  </span>
                  <span className={panchangSummary.todayMoon.taraSupportive ? 'teal-badge' : 'amber-badge'}>
                    Tarabala: {panchangSummary.todayMoon.taraName}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {!readerLoading && readerSection === 'kundli' && kundliExtras && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {kundliExtras.varshaphal && (
              <div style={{ padding: 14, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: 15, color: 'var(--gold)' }}>
                  Annual Varshaphal ({kundliExtras.varshaphal.targetYear} • Age {kundliExtras.varshaphal.completedAge})
                </h3>
                <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>{kundliExtras.varshaphal.plainSummary}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>
                  Varsha Lagna: {kundliExtras.varshaphal.varshaLagnaSign} • Muntha: {kundliExtras.varshaphal.munthaSign} (H{kundliExtras.varshaphal.munthaHouseInVarsha}) • Year Weekday Lord: {kundliExtras.varshaphal.varaPati}
                </div>
              </div>
            )}

            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 15, color: 'var(--gold)' }}>Bhava Chalit House Shifts</h3>
              {kundliExtras.chalitShifts.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No planets shift house between D1 Rashi and Sripati Chalit.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {kundliExtras.chalitShifts.map((cs: any) => (
                    <div key={cs.planet} style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', fontSize: 12 }}>
                      <strong style={{ color: 'var(--teal)', textTransform: 'uppercase' }}>{cs.planet}</strong>: H{cs.rashiHouse} → H{cs.chalitHouse} — {cs.plainMeaning}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 15, color: 'var(--gold)' }}>KP Key Cusp Sub-Lords</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
                {kundliExtras.kpCusps.map((kc: any) => (
                  <div key={kc.house} style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: 'var(--teal)', marginBottom: 4 }}>
                      House {kc.house} ({kc.sign}) • Sub-Lord: {kc.subLord.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 11.5, lineHeight: 1.45 }}>{kc.plainMeaning}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!readerLoading && readerSection === 'yogas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 15, color: 'var(--gold)' }}>Detected Yogas &amp; Doshas (Plain English)</h3>
            {yogasReadings.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No major classical yogas/doshas flagged in this filter.</div>
            ) : (
              yogasReadings.map((y: any) => (
                <div
                  key={y.id}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: 'var(--surface-alt)',
                    border: y.category === 'dosha' ? '1px solid var(--amber)' : '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 14, color: y.category === 'dosha' ? 'var(--amber)' : 'var(--teal)' }}>
                      {y.name}
                    </strong>
                    <span className="gold-badge" style={{ fontSize: 10 }}>
                      {y.category} • {y.strength}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5 }}>{y.description}</p>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--gold)' }}>What it means: </strong>
                    {y.plainMeaning}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!readerLoading && readerSection === 'strengths' && strengthsSummary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, color: 'var(--gold)' }}>Shadbala Horsepower &amp; Planetary Avasthas</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10 }}>
              {strengthsSummary.planets.map((p: any) => (
                <div
                  key={p.planet}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 13 }}>
                    <span style={{ textTransform: 'capitalize', color: 'var(--teal)' }}>{p.planet} (Rank #{p.rank})</span>
                    <span style={{ color: p.ratio >= 1 ? 'var(--teal)' : 'var(--amber)' }}>{p.ratio}x ({p.rupas}R)</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gold)' }}>
                    Baladi: {p.baladi} • Deeptadi: {p.deeptadi}
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--text-main)' }}>{p.plainSummary}</div>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: 13, color: 'var(--gold)' }}>Ashtakvarga (SAV) Sign Support (28 = Average)</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {strengthsSummary.savTopSigns.map((s: any) => (
                  <span
                    key={s.sign}
                    className={s.bindus >= 30 ? 'teal-badge' : s.bindus <= 22 ? 'amber-badge' : 'gold-badge'}
                    style={{ fontSize: 11, textTransform: 'capitalize' }}
                  >
                    {s.sign}: {s.bindus}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {!readerLoading && readerSection === 'specials' && specialsSummary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 15, color: 'var(--gold)' }}>Jaimini Chara Karakas (Soul &amp; Life Drivers)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 8 }}>
                {specialsSummary.karakas.map((k: any) => (
                  <div
                    key={k.code}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 12,
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--teal)' }}>
                      {k.code} • {k.graha.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 11.5, marginTop: 4, lineHeight: 1.45 }}>{k.meaning}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 15, color: 'var(--gold)' }}>Divisional Charts (D1, D2, D4, D7, D9, D10, D12, D24, D60)</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {specialsSummary.vargas.map((v: any) => (
                  <div
                    key={v.planet}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'var(--surface-alt)',
                      border: v.vargottama ? '1px solid var(--gold)' : '1px solid var(--border-subtle)',
                      fontSize: 11.5,
                    }}
                  >
                    <strong style={{ textTransform: 'capitalize', color: 'var(--teal)' }}>{v.planet}</strong>: D1 {v.d1} • D9 {v.d9} • D10 {v.d10}
                    {v.d2 ? ` • D2 ${v.d2} • D4 ${v.d4} • D7 ${v.d7} • D12 ${v.d12} • D24 ${v.d24} • D60 ${v.d60}` : ''}
                    {v.vargottama ? ' ★ Vargottama' : ''}
                  </div>
                ))}
              </div>
            </div>

            {Array.isArray(specialsSummary.upagrahas) && specialsSummary.upagrahas.length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 15, color: 'var(--gold)' }}>Upagrahas (Sub-Planets)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                  {specialsSummary.upagrahas.map((u: any) => (
                    <div
                      key={u.id}
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        background: 'var(--surface-alt)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: 12,
                      }}
                    >
                      <div style={{ fontWeight: 700, color: 'var(--teal)' }}>
                        {u.name} • {u.sign} (H{u.houseFromLagna})
                      </div>
                      <div style={{ fontSize: 11.5, marginTop: 4, lineHeight: 1.45 }}>{u.meaning}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', fontSize: 12 }}>
              <strong style={{ color: 'var(--gold)' }}>Favourable &amp; Ghatak Guardrails: </strong>
              Lucky #{specialsSummary.ghatak.luckyNumber} • Lucky Days: {specialsSummary.ghatak.luckyDays.join(', ')} • Stone: {specialsSummary.ghatak.luckyStone}.{' '}
              <span style={{ color: 'var(--amber)' }}>
                Avoid major launches on Ghatak Day ({specialsSummary.ghatak.badDay}), Rashi ({specialsSummary.ghatak.badRasi}), or Tithi ({specialsSummary.ghatak.badTithi}).
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // LEVEL 3: ASK MODE
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bot size={18} style={{ color: 'var(--teal)' }} />
            Level 3: Ask Your Chart (Verified Agentic Q&amp;A)
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Navigates chart.db via VFS tools, builds an evidence ledger, and verifies every citation in code.
          </p>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={deepMode} onChange={(e) => setDeepMode(e.target.checked)} />
          Deep scan (16 steps)
        </label>
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        style={{ display: 'flex', gap: 8 }}
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about home, career, current dasha, relationships, or timing..."
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 10,
            background: 'var(--bg-ink)',
            border: '1px solid var(--border)',
            color: 'var(--text-main)',
            fontSize: 13,
          }}
        />
        <button
          type="submit"
          disabled={asking || !question.trim()}
          className="btn btn-primary"
          style={{ padding: '10px 16px' }}
        >
          {asking ? <Loader2 size={15} /> : <Send size={15} />}
          {asking ? 'Analyzing…' : 'Ask'}
        </button>
      </form>

      {/* Sample Questions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {SAMPLE_QUESTIONS.map((sq) => (
          <button
            key={sq}
            onClick={() => handleAsk(sq)}
            style={{
              fontSize: 11,
              padding: '4px 10px',
              borderRadius: 14,
              background: 'var(--surface-alt)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Live Trace */}
      {liveTrace.length > 0 && (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: 'rgba(21, 19, 43, 0.7)',
            border: '1px solid var(--border-subtle)',
            fontSize: 11,
            fontFamily: 'monospace',
            color: 'var(--teal)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {liveTrace.map((line, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ChevronRight size={12} /> {line}
            </div>
          ))}
        </div>
      )}

      {/* Q&A History (Stored locally on device) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {qaHistory.map((item) => {
          const { result } = item;
          const r = result.response;
          return (
            <div
              key={item.id}
              style={{
                padding: 16,
                borderRadius: 12,
                background: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <strong style={{ fontSize: 14, color: 'var(--gold)' }}>{item.question}</strong>
                <span
                  className={result.mode === 'level3_verified' ? 'teal-badge' : 'amber-badge'}
                  style={{ fontSize: 10 }}
                >
                  {result.mode === 'level3_verified' ? (
                    <>
                      <CheckCircle2 size={11} /> Verified L3
                    </>
                  ) : result.mode === 'level2_fallback' ? (
                    <>
                      <AlertTriangle size={11} /> L2 Fallback
                    </>
                  ) : (
                    'Policy Boundary'
                  )}
                </span>
              </div>

              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6 }}>{r.answer}</p>

              {/* Evidence */}
              {r.because.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                    EVIDENCE LEDGER
                  </span>
                  {r.because.map((b, idx) => (
                    <div key={idx} style={{ fontSize: 12, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                      <span>• {b.claim}</span>
                      {b.evidenceIds.map((eid) => (
                        <button
                          key={eid}
                          onClick={() => handleInspectEvidence(eid)}
                          title="Click to inspect underlying chart.db fact/finding"
                          style={{
                            fontSize: 10,
                            padding: '2px 8px',
                            borderRadius: 10,
                            background: 'rgba(95, 194, 179, 0.12)',
                            border: '1px solid rgba(95, 194, 179, 0.35)',
                            color: 'var(--teal)',
                            fontFamily: 'monospace',
                            cursor: profileId ? 'pointer' : 'default',
                          }}
                        >
                          {eid}
                        </button>
                      ))}
                    </div>
                  ))}
                  {inspectedEvidence && (
                    <div
                      style={{
                        marginTop: 6,
                        padding: 10,
                        borderRadius: 8,
                        background: 'var(--bg-ink)',
                        border: '1px solid var(--teal)',
                        fontSize: 11,
                        fontFamily: 'monospace',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <strong style={{ color: 'var(--teal)' }}>Evidence: {inspectedEvidence.id}</strong>
                        <button onClick={() => setInspectedEvidence(null)} style={{ color: 'var(--text-muted)' }}>
                          Close
                        </button>
                      </div>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-main)' }}>
                        {JSON.stringify(inspectedEvidence.detail, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Timing Windows */}
              {r.timing.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                    TIMING WINDOWS (DETERMINISTIC)
                  </span>
                  {r.timing.map((tw) => (
                    <div key={tw.windowId} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={12} style={{ color: 'var(--gold)' }} />
                      <span>
                        <strong>{tw.startUtc.slice(0, 10)} → {tw.endUtc.slice(0, 10)}:</strong> {tw.summary}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {r.uncertainty && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Note: {r.uncertainty}
                </div>
              )}

              {r.followUps.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {r.followUps.map((fu) => (
                    <button
                      key={fu}
                      onClick={() => handleAsk(fu)}
                      style={{
                        fontSize: 11,
                        padding: '3px 9px',
                        borderRadius: 12,
                        background: 'var(--surface)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--teal)',
                      }}
                    >
                      <Sparkles size={10} style={{ marginRight: 4 }} />
                      {fu}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
