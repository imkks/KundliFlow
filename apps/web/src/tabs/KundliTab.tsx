import React, { useState, useMemo, useEffect } from 'react';
import {
  HelpCircle,
  PenLine,
  Clock,
  BookOpen,
  Sparkles,
  Flame,
  Zap,
  GitBranch,
  Layers,
  Table2,
  X,
  Compass,
} from 'lucide-react';
import {
  computeMutualAspects,
  computeVedicAspects,
  degToDms,
  VARGA_TYPES,
  VARGA_LABELS,
  type NatalChart,
  type VargaType,
  type AvakahadaDetails,
  type ChalitChart,
} from '@astro/engine';
import { NorthIndianChart, type ChartPlacement } from '../components/NorthIndianChart.tsx';
import { SouthIndianChart } from '../components/SouthIndianChart.tsx';
import { useReading, LIFE_TOPICS, type LifeTopicId } from '../context/ReadingContext.tsx';

interface KundliTabProps {
  profileId?: string | null;
  natalChart: NatalChart;
  currentTransits: any;
  chalit: ChalitChart | null;
  panchang: any;
  avakahada: AvakahadaDetails | null;
  birthDate: string;
  birthTime: string;
  tzId: string;
  chartStyle: 'north' | 'south';
  onChartStyleChange: (s: 'north' | 'south') => void;
  chartPerspective: 'lagna' | 'chandra';
  onPerspectiveChange: (p: 'lagna' | 'chandra') => void;
  selectedVarga: VargaType;
  onVargaChange: (v: VargaType) => void;
  d1Placements: ChartPlacement[];
  vargaPlacements: ChartPlacement[];
  vargaLagnaSignIndex: number;
  charaKarakas: Record<string, string>;
}

const HOUSE_SHORT_LABELS: Record<number, string> = {
  1: 'Self',
  2: 'Wealth',
  3: 'Skills',
  4: 'Home',
  5: 'Creative',
  6: 'Work',
  7: 'Love',
  8: 'Change',
  9: 'Luck',
  10: 'Career',
  11: 'Gains',
  12: 'Rest',
};

export const KundliTab: React.FC<KundliTabProps> = ({
  natalChart,
  chartStyle,
  onChartStyleChange,
  chartPerspective,
  onPerspectiveChange,
  selectedVarga,
  onVargaChange,
  d1Placements,
  vargaPlacements,
  vargaLagnaSignIndex,
  charaKarakas,
}) => {
  const [teachStep, setTeachStep] = useState<number | null>(null);
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [inspectorMode, setInspectorMode] = useState<'houses' | 'planets'>('houses');
  const [overviewModalTab, setOverviewModalTab] = useState<null | 'summary' | 'elements' | 'conditions'>(null);
  const [showAllFindings, setShowAllFindings] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [guidedShowVarga, setGuidedShowVarga] = useState(false);

  const {
    isGuided,
    isQuant,
    reading,
    readingLoading,
    selectedHouse,
    setSelectedHouse,
    selectedPlanet,
    setSelectedPlanet,
    activeTopic,
    setActiveTopic,
    openAskDrawer,
    setActiveTab,
    openPatternDecoder,
    openQuantMatrix,
    openChartSystems,
  } = useReading();

  const overview = reading?.overview;
  const showTechnical = isQuant || showTechDetails;
  const onVargaChangeRef = React.useRef(onVargaChange);
  onVargaChangeRef.current = onVargaChange;

  useEffect(() => {
    if (!activeTopic) return;
    const meta = LIFE_TOPICS.find((t) => t.id === activeTopic);
    if (meta) {
      onVargaChangeRef.current(meta.varga);
    }
  }, [activeTopic]);

  const polarityLabel = (p: string) =>
    p === 'supportive' ? '✓ Supportive' : p === 'challenging' ? '⚠ Growth Area' : '• Balanced';

  const applyLifeTopic = (topicId: LifeTopicId) => {
    const meta = LIFE_TOPICS.find((t) => t.id === topicId);
    if (!meta) return;
    setActiveTopic(topicId);
    setSelectedHouse(meta.house);
    setInspectorMode('houses');
    setShowAllFindings(false);
    onVargaChange(meta.varga);
  };

  const renderFindingList = (items: any[]) => {
    const defaultCount = isGuided ? 2 : isQuant ? items.length : 3;
    const visible = showAllFindings ? items : items.slice(0, defaultCount);
    const remaining = items.length - visible.length;
    return (
      <>
        {visible.map((f: any) => {
          const isWhyOpen = expandedRuleId === f.id;
          return (
            <div key={f.id} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: f.polarity === 'supportive' ? 'var(--teal)' : f.polarity === 'challenging' ? 'var(--amber)' : 'var(--gold)' }}>
                  {polarityLabel(f.polarity)}
                  {showTechnical ? ` • Strength ${f.strength}/100` : ''}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {!isGuided && (
                    <button
                      type="button"
                      onClick={() => setExpandedRuleId(isWhyOpen ? null : f.id)}
                      style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 600 }}
                    >
                      {isWhyOpen ? 'Hide Why ▴' : 'Why? ▾'}
                    </button>
                  )}
                  {showTechnical && (
                    <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{f.ruleId}</span>
                  )}
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--text-main)' }}>{f.text}</p>
              {isWhyOpen && (
                <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 6, background: 'rgba(95, 194, 179, 0.08)', border: '1px solid rgba(95, 194, 179, 0.25)', fontSize: 11.5, color: 'var(--text-muted)' }}>
                  <div>
                    <strong style={{ color: 'var(--teal)' }}>1. Chart Fact: </strong>
                    {(f.evidenceChips ?? []).map((c: any) => c.label).join(' • ') || 'Chart placement'}
                  </div>
                  <div style={{ marginTop: 2 }}>
                    <strong style={{ color: 'var(--gold)' }}>2. Principle: </strong>
                    <span style={{ fontFamily: 'monospace' }}>{f.ruleId}</span> ({f.tier} tier, strength {f.strength}/100)
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => setShowAllFindings(true)}
            className="btn btn-outline"
            style={{ alignSelf: 'flex-start', fontSize: 11.5 }}
          >
            Show {remaining} more note{remaining > 1 ? 's' : ''}
          </button>
        )}
      </>
    );
  };

  const houses = reading?.houses ?? [];
  const planets = reading?.planets ?? [];
  const activeHouse = houses.find((h: any) => h.house === selectedHouse) ?? houses[0];
  const activePlanet = planets.find((p: any) => p.planet === selectedPlanet) ?? planets[0];

  const chartMakeup = useMemo(() => {
    const vedicKeys = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'] as const;
    const elems = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
    const mods = { Movable: 0, Fixed: 0, Dual: 0 };
    const elemNames = ['Fire', 'Earth', 'Air', 'Water'] as const;
    const modNames = ['Movable', 'Fixed', 'Dual'] as const;

    const signIndices: number[] = [];
    if (natalChart.lagna) signIndices.push(natalChart.lagna.signIndex);
    for (const k of vedicKeys) {
      const g = natalChart.grahas[k];
      if (g) signIndices.push(g.signIndex);
    }
    for (const s of signIndices) {
      elems[elemNames[s % 4]!] += 1;
      mods[modNames[s % 3]!] += 1;
    }

    const total = Math.max(1, signIndices.length);
    const dominantElem = Object.entries(elems).sort((a, b) => b[1] - a[1])[0]![0];
    const dominantMod = Object.entries(mods).sort((a, b) => b[1] - a[1])[0]![0];

    const sunLon = natalChart.grahas.sun.lon;
    const retro: string[] = [];
    const combust: string[] = [];
    const exaltedOwn: string[] = [];
    const debilitated: string[] = [];
    for (const k of vedicKeys) {
      const g = natalChart.grahas[k];
      if (!g) continue;
      if (g.retrograde && k !== 'rahu' && k !== 'ketu') retro.push(k);
      if (g.dignity === 'exalted' || g.dignity === 'own') exaltedOwn.push(`${k} (${g.dignity})`);
      if (g.dignity === 'debilitated') debilitated.push(k);
      if (k !== 'sun' && k !== 'rahu' && k !== 'ketu') {
        const diff = Math.abs(g.lon - sunLon);
        const sep = Math.min(diff, 360 - diff);
        if (sep <= 10) combust.push(`${k} (${sep.toFixed(1)}°)`);
      }
    }

    const vargottama = (reading?.specials?.vargas ?? [])
      .filter((v: any) => v.vargottama)
      .map((v: any) => v.planet);

    const vedicAspects = computeVedicAspects(natalChart.grahas);
    const aspects = (vedicAspects.length > 0 ? vedicAspects : computeMutualAspects(natalChart.grahas)).slice(0, 8);

    return { elems, mods, total, dominantElem, dominantMod, retro, combust, exaltedOwn, debilitated, vargottama, aspects };
  }, [natalChart, reading]);

  const showSecondaryVarga = !isGuided || guidedShowVarga;
  const activeTopicMeta = activeTopic ? LIFE_TOPICS.find((t) => t.id === activeTopic) ?? null : null;
  const currentDasha = reading?.dashas?.[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 1. Flagship Kundli Hero Signature Banner */}
      <div className="kundli-hero" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Compass size={20} style={{ color: 'var(--gold)' }} />
              <h1 className="serif-title" style={{ margin: 0, fontSize: 20, color: 'var(--gold)' }}>
                Your Vedic Kundli
              </h1>
              {natalChart.ayanamsa?.id && (
                <span className={natalChart.ayanamsa.id === 'lahiri' ? 'teal-badge' : 'amber-badge'} style={{ fontSize: 10.5, textTransform: 'uppercase' }}>
                  {natalChart.ayanamsa.id.replace('_', ' ')} Ayanamsa
                </span>
              )}
              {currentDasha?.lord && (
                <span className="gold-badge" style={{ fontSize: 10.5, textTransform: 'capitalize' }}>
                  Mahadasha: {currentDasha.lord}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              <span>
                Ascendant:{' '}
                <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>
                  {natalChart.lagna ? `${natalChart.lagna.sign} ${degToDms(natalChart.lagna.degInSign).slice(0, 6)}` : 'Moon Ref'}
                </strong>
              </span>
              <span>•</span>
              <span>
                Moon (Rashi):{' '}
                <strong style={{ color: 'var(--teal)', textTransform: 'capitalize' }}>
                  {natalChart.grahas.moon.sign} ({natalChart.grahas.moon.nakshatra.replace(/_/g, ' ')})
                </strong>
              </span>
              <span>•</span>
              <span>
                Sun:{' '}
                <strong style={{ color: 'var(--gold)', textTransform: 'capitalize' }}>
                  {natalChart.grahas.sun.sign} (H{natalChart.grahas.sun.houses?.houseFromLagna ?? 1})
                </strong>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
            {!isQuant && (
              <button
                type="button"
                onClick={() => setTeachStep((s) => (s ? null : 1))}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  background: teachStep ? 'var(--gold)' : 'rgba(227, 173, 70, 0.16)',
                  color: teachStep ? '#15132b' : 'var(--gold)',
                  border: '1px solid rgba(227, 173, 70, 0.45)',
                }}
              >
                🎓 {teachStep ? 'Close Tour' : 'Teach Me'}
              </button>
            )}
            {overview && (
              <button
                type="button"
                onClick={() => setOverviewModalTab('summary')}
                className="btn btn-outline"
                style={{ fontSize: 11.5 }}
              >
                <Sparkles size={13} style={{ color: 'var(--gold)' }} /> 60s Summary
              </button>
            )}
            {!isGuided && (
              <button
                type="button"
                onClick={() => setOverviewModalTab('elements')}
                className="btn btn-outline"
                style={{ fontSize: 11.5 }}
              >
                <Flame size={13} style={{ color: 'var(--amber)' }} /> Elements &amp; Aspects
              </button>
            )}
            <button
              type="button"
              onClick={() => openQuantMatrix('degrees')}
              className="btn btn-outline"
              style={{ fontSize: 11.5 }}
            >
              <Table2 size={13} style={{ color: 'var(--teal)' }} /> Degrees &amp; Vargas
            </button>
            <button
              type="button"
              onClick={() => openChartSystems('dual')}
              className="btn btn-outline"
              style={{ fontSize: 11.5 }}
            >
              <Layers size={13} style={{ color: 'var(--gold)' }} /> More Systems
            </button>
          </div>
        </div>

        {isQuant && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 8, borderTop: '1px solid rgba(227, 173, 70, 0.2)' }}>
            {(
              [
                { id: 'dual', label: 'Dual Transit' },
                { id: 'bhavas', label: 'Bhava Chalit' },
                { id: 'kp', label: 'KP Sub-Lords' },
                { id: 'varshaphal', label: 'Varshaphal & Arudhas' },
                { id: 'birth', label: 'Birth Panchang' },
              ] as const
            ).map((sys) => (
              <button
                key={sys.id}
                type="button"
                onClick={() => openChartSystems(sys.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 7,
                  fontSize: 11.5,
                  fontWeight: 600,
                  background: 'rgba(95, 194, 179, 0.14)',
                  color: 'var(--teal)',
                  border: '1px solid rgba(95, 194, 179, 0.32)',
                }}
              >
                {sys.label} ↗
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Highlighted Life Topics Focus Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Explore by Life Topic — Click a domain to spotlight its house &amp; divisional chart
          </span>
          {activeTopic && (
            <button
              type="button"
              onClick={() => setActiveTopic(null)}
              style={{ fontSize: 11.5, color: 'var(--text-muted)', textDecoration: 'underline' }}
            >
              Clear focus
            </button>
          )}
        </div>

        <div className="topic-focus-grid">
          {LIFE_TOPICS.map((t) => {
            const isTopicActive = activeTopic === t.id;
            const hData = houses.find((h: any) => h.house === t.house);
            const toneColor =
              hData?.tone === 'Mostly supportive'
                ? 'var(--teal)'
                : hData?.tone === 'Needs attention'
                ? 'var(--amber)'
                : 'var(--gold)';
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => applyLifeTopic(t.id)}
                className={`topic-focus-card ${isTopicActive ? 'is-active' : ''}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 6,
                      background: isTopicActive ? 'var(--gold)' : 'var(--surface-alt)',
                      color: isTopicActive ? '#15132b' : 'var(--gold)',
                    }}
                  >
                    {t.id === 'year' ? 'Annual' : `H${t.house} · ${t.varga}`}
                  </span>
                </div>
                <strong style={{ fontSize: 13, color: isTopicActive ? 'var(--gold)' : 'var(--text-main)' }}>
                  {t.label}
                </strong>
                <div style={{ fontSize: 11, color: hData ? toneColor : 'var(--text-muted)', fontWeight: hData ? 600 : 400 }}>
                  {hData
                    ? `${hData.sign.toUpperCase()} • ${
                        hData.tone === 'Mostly supportive' ? '✓ Supportive' : hData.tone === 'Needs attention' ? '⚠ Care' : '• Balanced'
                      }`
                    : t.tagline}
                </div>
              </button>
            );
          })}
        </div>

        {activeTopicMeta && activeHouse && (
          <div
            className="card"
            style={{
              padding: '11px 14px',
              background: 'rgba(95, 194, 179, 0.08)',
              border: '1px solid rgba(95, 194, 179, 0.38)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div style={{ flex: '1 1 320px', fontSize: 12.5, lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--teal)' }}>
                {activeTopicMeta.icon} Focused on {activeTopicMeta.label} (House {activeHouse.house} · {activeHouse.sign.toUpperCase()}):
              </strong>{' '}
              <span style={{ color: 'var(--text-main)' }}>
                {activeHouse.bottomLine || activeTopicMeta.tagline}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {activeTopicMeta.id === 'year' && (
                <button
                  type="button"
                  onClick={() => openChartSystems('varshaphal')}
                  className="btn btn-outline"
                  style={{ fontSize: 11.5, borderColor: 'rgba(227, 173, 70, 0.45)', color: 'var(--gold)' }}
                >
                  Open Varshaphal &amp; Sahams ↗
                </button>
              )}
              <button
                type="button"
                onClick={() => openPatternDecoder({ kind: 'house', house: activeHouse.house })}
                className="btn btn-outline"
                style={{ fontSize: 11.5 }}
              >
                <GitBranch size={12} style={{ color: 'var(--gold)' }} /> Trace Pattern
              </button>
              <button
                type="button"
                onClick={() => openAskDrawer(activeTopicMeta.askPrompt)}
                className="btn btn-primary"
                style={{ fontSize: 11.5 }}
              >
                <Sparkles size={12} /> Ask AI
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive 6-Step Teach Me Guided Tour */}
      {teachStep !== null && (() => {
        const goToStep = (step: number) => {
          setTeachStep(step);
          if (step === 1) { setSelectedHouse(1); setInspectorMode('houses'); }
          if (step === 2) { setSelectedHouse(10); setInspectorMode('houses'); }
          if (step === 3) { onVargaChange('D9'); setGuidedShowVarga(true); }
          if (step === 4) { setInspectorMode('planets'); setSelectedPlanet('moon'); }
          if (step === 5) { setOverviewModalTab('summary'); }
          if (step === 6) { setOverviewModalTab('conditions'); }
        };
        const lessons = [
          {
            title: 'Your Big 3 — Ascendant, Moon & Sun',
            body: (
              <>
                The top center diamond (<strong>House 1</strong>, <strong style={{ color: 'var(--gold)' }}>{natalChart.lagna?.sign.toUpperCase()}</strong>) is your <em>Lagna (Rising Sign)</em> — your outer path and personality style. Your <strong>Moon</strong> in <strong style={{ color: 'var(--teal)' }}>{natalChart.grahas.moon.sign.toUpperCase()} ({natalChart.grahas.moon.nakshatra})</strong> shows your emotional core, while your <strong>Sun</strong> in <strong style={{ color: 'var(--gold)' }}>{natalChart.grahas.sun.sign.toUpperCase()}</strong> reflects inner purpose.
              </>
            ),
            ask: 'Explain my Ascendant, Moon sign, and Sun sign together in simple everyday language.',
          },
          {
            title: 'Click Any House & Follow the Dashed Lord Line',
            body: (
              <>
                Every region on your chart rules a life area (like <strong>House 10 = Career</strong>, highlighted now). Click any house — it turns gold, and a <strong>dashed teal line</strong> points to where its <strong>House Lord</strong> sits, showing where that theme expresses in real life.
              </>
            ),
            ask: 'Explain how my 10th house and its house lord shape my career in plain English.',
          },
          {
            title: 'D1 Birth Chart (The Tree) vs. D9 Navamsha (The Fruit)',
            body: (
              <>
                Your main chart (<strong>D1</strong>) shows outer circumstances; <strong>D9 Navamsha</strong> reveals inner maturity, long-term stamina, and partnerships. Planets marked <strong>★ Vargottama</strong> occupy the same sign in both charts.
              </>
            ),
            ask: 'Compare my D1 birth chart and D9 Navamsha in simple terms.',
          },
          {
            title: 'Planetary Strength & Retrograde (ᴿ)',
            body: (
              <>
                Click any planet abbreviation on the chart (or switch to <strong>Planets</strong> in the inspector). <strong>Retrograde (ᴿ)</strong> planets work inwardly — making you rethink and master that area on your own terms.
              </>
            ),
            ask: 'Which planets are strongest in my chart and how do my retrograde placements feel in daily life?',
          },
          {
            title: 'Dashas — Why Timing Changes Everything',
            body: (
              <>
                Your birth chart is the map, and <strong>Dashas (Life Chapters)</strong> are the spotlight showing which planets are active right now.
              </>
            ),
            ask: 'What is my current Mahadasha and Antardasha activating in my life right now?',
          },
          {
            title: 'Yogas, Doshas & Free Will',
            body: (
              <>
                <strong>Yogas</strong> are supportive planetary teamwork patterns; <strong>Doshas</strong> highlight areas asking for awareness (many are cancelled by <em>Bhanga</em>). Use the <strong>Trace Pattern</strong> button anytime to see the exact chain.
              </>
            ),
            ask: 'Summarize my active Yogas and Doshas calmly in plain English.',
          },
        ];
        const cur = lessons[teachStep - 1] ?? lessons[0]!;
        return (
          <div className="card" style={{ background: 'rgba(95, 194, 179, 0.06)', border: '1px solid rgba(95, 194, 179, 0.35)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <strong style={{ fontSize: 13.5, color: 'var(--teal)' }}>
                🎓 Lesson {teachStep} of {lessons.length} — {cur.title}
              </strong>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {lessons.map((_, idx) => {
                  const s = idx + 1;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => goToStep(s)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        background: teachStep === s ? 'var(--teal)' : 'var(--surface-alt)',
                        color: teachStep === s ? '#15132b' : 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-main)' }}>
              {cur.body}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <button
                type="button"
                onClick={() => openAskDrawer(cur.ask)}
                style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)' }}
              >
                ✨ Ask AI about this lesson →
              </button>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  disabled={teachStep <= 1}
                  onClick={() => goToStep(Math.max(1, teachStep - 1))}
                  className="btn btn-outline"
                  style={{ fontSize: 11.5, opacity: teachStep <= 1 ? 0.45 : 1 }}
                >
                  ← Prev
                </button>
                {teachStep < lessons.length ? (
                  <button
                    type="button"
                    onClick={() => goToStep(teachStep + 1)}
                    className="btn btn-primary"
                    style={{ fontSize: 11.5 }}
                  >
                    Next Lesson →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTeachStep(null)}
                    className="btn btn-primary"
                    style={{ fontSize: 11.5 }}
                  >
                    ✓ Finish Tour
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 2. Master-Detail Canvas: Charts on Left, Sticky Inspector on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16, alignItems: 'start' }}>
        {/* Left Column: Highlighted Primary Kundli Stage + Optional Varga Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="kundli-stage">
            {/* Spatially co-located Chart Style / Ref / Varga Controls */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid rgba(227, 173, 70, 0.18)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span className="gold-badge" style={{ fontSize: 11 }}>
                  {inspectorMode === 'houses'
                    ? `Focusing H${selectedHouse}${HOUSE_SHORT_LABELS[selectedHouse] ? ` · ${HOUSE_SHORT_LABELS[selectedHouse]}` : ''}`
                    : `Focusing ${selectedPlanet.toUpperCase()}`}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', background: 'var(--surface-alt)', borderRadius: 6, padding: 2, border: '1px solid var(--border-subtle)' }}>
                  {(['north', 'south'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => onChartStyleChange(st)}
                      style={{
                        padding: '3px 9px',
                        fontSize: 11,
                        borderRadius: 4,
                        background: chartStyle === st ? 'var(--gold)' : 'transparent',
                        color: chartStyle === st ? '#15132b' : 'var(--text-main)',
                        fontWeight: chartStyle === st ? 700 : 400,
                      }}
                    >
                      {st === 'north' ? 'North' : 'South'}
                    </button>
                  ))}
                </div>

                {!isGuided && (
                  <div style={{ display: 'flex', background: 'var(--surface-alt)', borderRadius: 6, padding: 2, border: '1px solid var(--border-subtle)' }}>
                    {(['lagna', 'chandra'] as const).map((ref) => (
                      <button
                        key={ref}
                        type="button"
                        onClick={() => onPerspectiveChange(ref)}
                        style={{
                          padding: '3px 9px',
                          fontSize: 11,
                          borderRadius: 4,
                          background: chartPerspective === ref ? 'var(--gold)' : 'transparent',
                          color: chartPerspective === ref ? '#15132b' : 'var(--text-main)',
                          fontWeight: chartPerspective === ref ? 700 : 400,
                        }}
                      >
                        {ref === 'lagna' ? 'Lagna' : 'Moon'}
                      </button>
                    ))}
                  </div>
                )}

                {!isGuided && (
                  <select
                    aria-label="Select divisional Varga chart"
                    value={selectedVarga}
                    onChange={(e) => onVargaChange(e.target.value as VargaType)}
                    style={{
                      background: 'var(--surface-alt)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '4px 8px',
                      fontSize: 11,
                    }}
                  >
                    {VARGA_TYPES.map((v) => (
                      <option key={v} value={v}>
                        {VARGA_LABELS[v]}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 8, textAlign: 'center' }}>
              Click or tab to any House or Planet abbreviation to inspect • Dashed line traces House → Lord
            </div>

            {chartStyle === 'north' ? (
              <NorthIndianChart
                lagnaSignIndex={chartPerspective === 'chandra' ? natalChart.grahas.moon.signIndex : (natalChart.lagna?.signIndex ?? 0)}
                placements={d1Placements}
                title={chartPerspective === 'chandra' ? 'Chandra Kundli (Moon Chart)' : 'D1 Rashi Chart (Birth Kundli)'}
                selectedHouse={inspectorMode === 'houses' ? selectedHouse : undefined}
                highlightHouse={inspectorMode === 'houses' ? activeHouse?.lordPlacedHouse : undefined}
                selectedPlanet={inspectorMode === 'planets' ? selectedPlanet : undefined}
                maxWidth={410}
                onSelectHouse={(h) => {
                  setSelectedHouse(h);
                  setInspectorMode('houses');
                  setShowAllFindings(false);
                }}
                onSelectPlanet={(p) => {
                  setSelectedPlanet(p);
                  setInspectorMode('planets');
                  setShowAllFindings(false);
                }}
              />
            ) : (
              <SouthIndianChart
                lagnaSignIndex={chartPerspective === 'chandra' ? natalChart.grahas.moon.signIndex : (natalChart.lagna?.signIndex ?? 0)}
                placements={d1Placements}
                title={chartPerspective === 'chandra' ? 'Chandra Kundli (Moon Chart)' : 'D1 Rashi Chart (Birth Kundli)'}
                selectedHouse={inspectorMode === 'houses' ? selectedHouse : undefined}
                highlightHouse={inspectorMode === 'houses' ? activeHouse?.lordPlacedHouse : undefined}
                selectedPlanet={inspectorMode === 'planets' ? selectedPlanet : undefined}
                maxWidth={410}
                onSelectHouse={(h) => {
                  setSelectedHouse(h);
                  setInspectorMode('houses');
                  setShowAllFindings(false);
                }}
                onSelectPlanet={(p) => {
                  setSelectedPlanet(p);
                  setInspectorMode('planets');
                  setShowAllFindings(false);
                }}
              />
            )}
          </div>

          {isGuided && !guidedShowVarga ? (
            <button
              type="button"
              onClick={() => setGuidedShowVarga(true)}
              className="btn btn-outline"
              style={{ width: '100%', padding: '10px 14px', fontSize: 12 }}
            >
              + Show D9 Navamsha (Inner Maturity &amp; Relationships Chart)
            </button>
          ) : showSecondaryVarga && (
            <div className="card">
              {chartStyle === 'north' ? (
                <NorthIndianChart
                  lagnaSignIndex={vargaLagnaSignIndex}
                  placements={vargaPlacements}
                  title={`${selectedVarga} Chart (${selectedVarga === 'D9' ? 'Navamsha' : selectedVarga})`}
                  selectedHouse={inspectorMode === 'houses' ? selectedHouse : undefined}
                  selectedPlanet={inspectorMode === 'planets' ? selectedPlanet : undefined}
                  onSelectHouse={(h) => {
                    setSelectedHouse(h);
                    setInspectorMode('houses');
                    setShowAllFindings(false);
                  }}
                  onSelectPlanet={(p) => {
                    setSelectedPlanet(p);
                    setInspectorMode('planets');
                    setShowAllFindings(false);
                  }}
                />
              ) : (
                <SouthIndianChart
                  lagnaSignIndex={vargaLagnaSignIndex}
                  placements={vargaPlacements}
                  title={`${selectedVarga} Chart (${selectedVarga === 'D9' ? 'Navamsha' : selectedVarga})`}
                  selectedHouse={inspectorMode === 'houses' ? selectedHouse : undefined}
                  selectedPlanet={inspectorMode === 'planets' ? selectedPlanet : undefined}
                  onSelectHouse={(h) => {
                    setSelectedHouse(h);
                    setInspectorMode('houses');
                    setShowAllFindings(false);
                  }}
                  onSelectPlanet={(p) => {
                    setSelectedPlanet(p);
                    setInspectorMode('planets');
                    setShowAllFindings(false);
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Right Column: Sticky Chart Inspector */}
        <div className="card" style={{ position: 'sticky', top: 74, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BookOpen size={16} style={{ color: 'var(--gold)' }} />
              <strong style={{ fontSize: 15, color: 'var(--gold)' }}>Chart Inspector</strong>
            </div>

            <div style={{ display: 'flex', background: 'var(--surface-alt)', borderRadius: 8, padding: 2, border: '1px solid var(--border-subtle)' }}>
              {(['houses', 'planets'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setInspectorMode(m)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11.5,
                    fontWeight: 700,
                    borderRadius: 6,
                    background: inspectorMode === m ? 'var(--teal)' : 'transparent',
                    color: inspectorMode === m ? '#15132b' : 'var(--text-muted)',
                  }}
                >
                  {m === 'houses' ? 'Houses (12)' : 'Planets (9)'}
                </button>
              ))}
            </div>
          </div>

          {readingLoading && (
            <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
              Loading chart interpretations…
            </div>
          )}

          {!readingLoading && inspectorMode === 'houses' && houses.length > 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 5 }}>
                {houses.map((h: any) => (
                  <button
                    key={h.house}
                    type="button"
                    onClick={() => {
                      setSelectedHouse(h.house);
                      setShowAllFindings(false);
                    }}
                    style={{
                      padding: '6px 7px',
                      borderRadius: 8,
                      textAlign: 'left',
                      background: selectedHouse === h.house ? 'rgba(227, 173, 70, 0.2)' : 'var(--surface-alt)',
                      border: selectedHouse === h.house ? '1px solid var(--gold)' : '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-main)' }}>
                      {isGuided ? `H${h.house} ${HOUSE_SHORT_LABELS[h.house] ?? ''}` : `H${h.house} • ${h.sign.slice(0, 3).toUpperCase()}`}
                    </div>
                    <div style={{ fontSize: 10, color: h.tone === 'Mostly supportive' ? 'var(--teal)' : h.tone === 'Needs attention' ? 'var(--amber)' : 'var(--gold)' }}>
                      {h.tone === 'Mostly supportive' ? '✓ Supportive' : h.tone === 'Needs attention' ? '⚠ Care' : '• Balanced'}
                    </div>
                  </button>
                ))}
              </div>

              {activeHouse && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--gold)' }}>
                      House {activeHouse.house} • {activeHouse.lifeArea ?? activeHouse.sign.toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      {!isGuided && (
                        <button
                          type="button"
                          onClick={() => openPatternDecoder({ kind: 'house', house: activeHouse.house })}
                          className="btn btn-outline"
                          style={{ fontSize: 11, borderColor: 'rgba(227, 173, 70, 0.45)', color: 'var(--gold)' }}
                        >
                          <GitBranch size={12} /> Trace Pattern
                        </button>
                      )}
                      {isQuant && (
                        <button
                          type="button"
                          onClick={() => setShowTechDetails((v) => !v)}
                          className="btn btn-outline"
                          style={{ fontSize: 11 }}
                        >
                          {showTechDetails ? 'Hide IDs' : 'Rule IDs'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openAskDrawer(`What does my House ${activeHouse.house} (${activeHouse.lifeArea ?? activeHouse.themes[0]?.replace(/_/g, ' ')}) show?`)}
                        className="btn btn-outline"
                        style={{ fontSize: 11 }}
                      >
                        <HelpCircle size={12} /> Ask AI
                      </button>
                    </div>
                  </div>

                  {/* House Telemetry Strip (Explorer & Quant) */}
                  {!isGuided && (() => {
                    const occupants = (['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'] as const)
                      .filter((k) => {
                        const gr = natalChart.grahas[k];
                        const hLagna = gr?.houses?.houseFromLagna ?? (gr as any)?.houseFromLagna;
                        return hLagna === activeHouse.house;
                      });
                    return (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))',
                          gap: 6,
                          padding: 9,
                          borderRadius: 8,
                          background: 'var(--surface-alt)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: 11.5,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Rashi Sign</div>
                          <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{activeHouse.sign}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>House Lord</div>
                          <div style={{ fontWeight: 700, textTransform: 'capitalize', color: 'var(--gold)' }}>
                            {activeHouse.lord} → H{activeHouse.lordPlacedHouse}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Occupants</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                            {occupants.length > 0 ? (
                              occupants.map((occ) => (
                                <button
                                  key={occ}
                                  type="button"
                                  onClick={() => {
                                    setSelectedPlanet(occ);
                                    setInspectorMode('planets');
                                    setShowAllFindings(false);
                                  }}
                                  style={{
                                    padding: '2px 7px',
                                    borderRadius: 5,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    textTransform: 'capitalize',
                                    background: 'rgba(95, 194, 179, 0.16)',
                                    color: 'var(--teal)',
                                    border: '1px solid rgba(95, 194, 179, 0.3)',
                                  }}
                                >
                                  {occ}
                                </button>
                              ))
                            ) : (
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Empty (lord rules)</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Overall Tone</div>
                          <div
                            style={{
                              fontWeight: 700,
                              color:
                                activeHouse.tone === 'Mostly supportive'
                                  ? 'var(--teal)'
                                  : activeHouse.tone === 'Needs attention'
                                  ? 'var(--amber)'
                                  : 'var(--gold)',
                            }}
                          >
                            {activeHouse.tone}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {activeHouse.bottomLine && (
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(95, 194, 179, 0.08)', border: '1px solid rgba(95, 194, 179, 0.25)', fontSize: 13, lineHeight: 1.6 }}>
                      <strong style={{ color: 'var(--teal)' }}>Bottom Line: </strong>
                      {activeHouse.bottomLine}
                    </div>
                  )}

                  {activeHouse.activeDashaNote && (
                    <div>
                      <span className="teal-badge" style={{ fontSize: 11 }}>
                        <Clock size={11} /> {activeHouse.activeDashaNote}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
                    {Array.isArray(activeHouse.strengths) && activeHouse.strengths.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase' }}>
                          What Works in Your Favor
                        </div>
                        {renderFindingList(activeHouse.strengths)}
                      </div>
                    )}
                    {Array.isArray(activeHouse.cautions) && activeHouse.cautions.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase' }}>
                          What Needs Care
                        </div>
                        {renderFindingList(activeHouse.cautions)}
                      </div>
                    )}
                    {!activeHouse.strengths && !activeHouse.cautions && renderFindingList(activeHouse.findings)}
                  </div>

                  <div style={{ padding: 10, borderRadius: 8, background: 'rgba(227, 173, 70, 0.08)', border: '1px solid rgba(227, 173, 70, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 12 }}>
                      <strong style={{ color: 'var(--gold)' }}>Reflect: </strong>
                      {activeHouse.reflectionPrompt}
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('journal')}
                      className="btn btn-outline"
                      style={{ fontSize: 11, whiteSpace: 'nowrap' }}
                    >
                      <PenLine size={11} /> Timeline
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {!readingLoading && inspectorMode === 'planets' && planets.length > 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 5 }}>
                {planets.map((p: any) => (
                  <button
                    key={p.planet}
                    type="button"
                    onClick={() => { setSelectedPlanet(p.planet); setShowAllFindings(false); }}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 8,
                      textAlign: 'left',
                      background: selectedPlanet === p.planet ? 'rgba(95, 194, 179, 0.18)' : 'var(--surface-alt)',
                      border: selectedPlanet === p.planet ? '1px solid var(--teal)' : '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-main)' }}>
                      {p.planet}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      H{p.house} • {p.dignity}
                    </div>
                  </button>
                ))}
              </div>

              {activePlanet && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--teal)', textTransform: 'capitalize' }}>
                      {activePlanet.planet} in {activePlanet.sign} (House {activePlanet.house})
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {!isGuided && (
                        <button
                          type="button"
                          onClick={() => openPatternDecoder({ kind: 'planet', planet: activePlanet.planet })}
                          className="btn btn-outline"
                          style={{ fontSize: 11, borderColor: 'rgba(227, 173, 70, 0.45)', color: 'var(--gold)' }}
                        >
                          <GitBranch size={12} /> Trace Pattern
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openAskDrawer(`How is ${activePlanet.planet} functioning in my chart?`)}
                        className="btn btn-outline"
                        style={{ fontSize: 11 }}
                      >
                        <HelpCircle size={12} /> Ask AI
                      </button>
                    </div>
                  </div>

                  {!isGuided && (() => {
                    const g = (natalChart.grahas as any)[activePlanet.planet];
                    const vargaEntry = (reading?.specials?.vargas ?? []).find((v: any) => v.planet === activePlanet.planet);
                    const karakaCode = charaKarakas?.[activePlanet.planet];
                    const sunLon = natalChart.grahas.sun.lon;
                    const sep = g && activePlanet.planet !== 'sun' && activePlanet.planet !== 'rahu' && activePlanet.planet !== 'ketu'
                      ? Math.min(Math.abs(g.lon - sunLon), 360 - Math.abs(g.lon - sunLon))
                      : null;
                    const isCombust = sep !== null && sep <= 10;
                    return (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))',
                          gap: 6,
                          padding: 9,
                          borderRadius: 8,
                          background: 'var(--surface-alt)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: 11.5,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Degree &amp; Star</div>
                          <div style={{ fontWeight: 700 }}>{g ? degToDms(g.degInSign) : '—'}</div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{activePlanet.nakshatra}{g?.pada ? ` (P${g.pada})` : ''}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Dignity &amp; Motion</div>
                          <div style={{ fontWeight: 700, textTransform: 'capitalize', color: activePlanet.dignity === 'exalted' || activePlanet.dignity === 'own' ? 'var(--teal)' : activePlanet.dignity === 'debilitated' ? 'var(--amber)' : 'var(--gold)' }}>
                            {activePlanet.dignity}
                          </div>
                          <div style={{ fontSize: 10.5, color: g?.retrograde || isCombust ? 'var(--amber)' : 'var(--text-muted)' }}>
                            {g?.retrograde ? '↺ Retrograde' : 'Direct'}{isCombust ? ` • Combust (${sep!.toFixed(1)}°)` : ''}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Houses Owned</div>
                          <div style={{ fontWeight: 700, color: 'var(--gold)' }}>
                            {activePlanet.ownedHouses?.length ? activePlanet.ownedHouses.map((h: number) => `H${h}`).join(', ') : 'Node / None'}
                          </div>
                          {karakaCode && <div style={{ fontSize: 10.5, color: 'var(--teal)', fontWeight: 700 }}>Jaimini: {karakaCode}</div>}
                        </div>
                        <div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Navamsha (D9)</div>
                          <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{vargaEntry?.d9 ?? '—'}</div>
                          <div style={{ fontSize: 10.5, color: vargaEntry?.vargottama ? 'var(--gold)' : 'var(--text-muted)' }}>
                            {vargaEntry?.vargottama ? '★ Vargottama' : vargaEntry?.d10 ? `D10: ${vargaEntry.d10}` : 'Divisional check'}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {activePlanet.bottomLine && (
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(95, 194, 179, 0.08)', border: '1px solid rgba(95, 194, 179, 0.25)', fontSize: 13, lineHeight: 1.6 }}>
                      <strong style={{ color: 'var(--teal)' }}>Bottom Line: </strong>
                      {activePlanet.bottomLine}
                    </div>
                  )}

                  {!isGuided && activePlanet.vargaNote && (
                    <div style={{ fontSize: 12, color: 'var(--teal)' }}>✦ {activePlanet.vargaNote}</div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
                    {Array.isArray(activePlanet.strengths) && activePlanet.strengths.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase' }}>
                          What Works in Your Favor
                        </div>
                        {renderFindingList(activePlanet.strengths)}
                      </div>
                    )}
                    {Array.isArray(activePlanet.cautions) && activePlanet.cautions.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase' }}>
                          What Needs Care
                        </div>
                        {renderFindingList(activePlanet.cautions)}
                      </div>
                    )}
                    {!activePlanet.strengths && !activePlanet.cautions && renderFindingList(activePlanet.findings)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 3. Quant Inline Planetary Positions Table (Expert direct access; Explorers can click Degrees & Vargas modal anytime) */}
      {isQuant && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <span className="serif-title" style={{ fontSize: 14, color: 'var(--gold)' }}>
              Planetary Positions &amp; Degrees (Nirayana)
            </span>
            <button type="button" onClick={() => openQuantMatrix('degrees')} className="btn btn-outline" style={{ fontSize: 11.5 }}>
              Open Full D1–D60 Matrix ↗
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '7px 6px' }}>Graha</th>
                  <th style={{ padding: '7px 6px' }}>Dir/Ret</th>
                  <th style={{ padding: '7px 6px' }}>Rashi</th>
                  <th style={{ padding: '7px 6px' }}>Degrees</th>
                  <th style={{ padding: '7px 6px' }}>Nakshatra</th>
                  <th style={{ padding: '7px 6px' }}>Pada</th>
                  <th style={{ padding: '7px 6px' }}>House</th>
                  <th style={{ padding: '7px 6px' }}>Dignity</th>
                  <th style={{ padding: '7px 6px' }}>Karaka</th>
                </tr>
              </thead>
              <tbody>
                {natalChart.lagna && (
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(227, 173, 70, 0.05)' }}>
                    <td style={{ padding: '7px 6px', fontWeight: 700, color: 'var(--gold)' }}>Ascendant</td>
                    <td style={{ padding: '7px 6px', color: 'var(--text-muted)' }}>—</td>
                    <td style={{ padding: '7px 6px', textTransform: 'capitalize' }}>{natalChart.lagna.sign}</td>
                    <td style={{ padding: '7px 6px', color: 'var(--gold)', fontWeight: 600 }}>{degToDms(natalChart.lagna.degInSign)}</td>
                    <td style={{ padding: '7px 6px' }}>{natalChart.lagna.nakshatra}</td>
                    <td style={{ padding: '7px 6px' }}>{natalChart.lagna.pada}</td>
                    <td style={{ padding: '7px 6px', fontWeight: 600 }}>1</td>
                    <td style={{ padding: '7px 6px', color: 'var(--teal)' }}>Lagna</td>
                    <td style={{ padding: '7px 6px', color: 'var(--text-muted)' }}>—</td>
                  </tr>
                )}
                {Object.entries(natalChart.grahas).map(([key, g]: [string, any]) => {
                  const isSelected = selectedPlanet === key;
                  const dignityColor =
                    g.dignity === 'exalted' || g.dignity === 'own'
                      ? 'var(--teal)'
                      : g.dignity === 'debilitated'
                      ? 'var(--amber)'
                      : 'inherit';
                  return (
                    <tr
                      key={key}
                      onClick={() => {
                        setSelectedPlanet(key);
                        setInspectorMode('planets');
                      }}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(95, 194, 179, 0.08)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '7px 6px', fontWeight: 600, textTransform: 'capitalize', color: isSelected ? 'var(--teal)' : 'inherit' }}>
                        {g.name}
                      </td>
                      <td style={{ padding: '7px 6px' }}>
                        {g.retrograde ? <span style={{ color: 'var(--amber)', fontWeight: 700 }}>[R]</span> : <span style={{ color: 'var(--text-muted)' }}>Dir</span>}
                      </td>
                      <td style={{ padding: '7px 6px', textTransform: 'capitalize' }}>{g.sign}</td>
                      <td style={{ padding: '7px 6px', fontWeight: 600 }}>{degToDms(g.degInSign)}</td>
                      <td style={{ padding: '7px 6px' }}>{g.nakshatra}</td>
                      <td style={{ padding: '7px 6px' }}>{g.pada}</td>
                      <td style={{ padding: '7px 6px', fontWeight: 600 }}>{g.houses?.houseFromLagna ?? g.houseFromLagna ?? 1}</td>
                      <td style={{ padding: '7px 6px', color: dignityColor, textTransform: 'capitalize' }}>{g.dignity || 'Neutral'}</td>
                      <td style={{ padding: '7px 6px', fontWeight: 700, color: 'var(--gold)' }}>{charaKarakas[key] || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clean Modal for 60-Second Summary, Elements & Conditions (Prevents Layout Jump!) */}
      {overviewModalTab && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chart Overview and Makeup"
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOverviewModalTab(null);
          }}
        >
          <div className="modal-panel" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {overview && (
                  <button
                    type="button"
                    onClick={() => setOverviewModalTab('summary')}
                    style={{
                      padding: '5px 11px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      background: overviewModalTab === 'summary' ? 'var(--gold)' : 'var(--surface-alt)',
                      color: overviewModalTab === 'summary' ? '#15132b' : 'var(--text-main)',
                    }}
                  >
                    ✨ 60s Summary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOverviewModalTab('elements')}
                  style={{
                    padding: '5px 11px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    background: overviewModalTab === 'elements' ? 'var(--gold)' : 'var(--surface-alt)',
                    color: overviewModalTab === 'elements' ? '#15132b' : 'var(--text-main)',
                  }}
                >
                  🔥 Elements ({chartMakeup.dominantElem})
                </button>
                <button
                  type="button"
                  onClick={() => setOverviewModalTab('conditions')}
                  style={{
                    padding: '5px 11px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    background: overviewModalTab === 'conditions' ? 'var(--gold)' : 'var(--surface-alt)',
                    color: overviewModalTab === 'conditions' ? '#15132b' : 'var(--text-main)',
                  }}
                >
                  ⚡ Conditions &amp; Aspects
                </button>
              </div>
              <button type="button" onClick={() => setOverviewModalTab(null)} aria-label="Close modal" style={{ color: 'var(--text-muted)', padding: 6 }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {overviewModalTab === 'summary' && overview && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, fontSize: 13, lineHeight: 1.6 }}>
                  <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-alt)' }}>
                    <strong style={{ color: 'var(--teal)', display: 'block', marginBottom: 4 }}>Core Nature</strong>
                    {overview.coreNature}
                  </div>
                  <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-alt)' }}>
                    <strong style={{ color: 'var(--teal)', display: 'block', marginBottom: 4 }}>Soul &amp; Career</strong>
                    {overview.soulAndCareer}
                  </div>
                  <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-alt)' }}>
                    <strong style={{ color: 'var(--gold)', display: 'block', marginBottom: 4 }}>Current Chapter</strong>
                    {overview.currentChapter}
                  </div>
                  <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-alt)' }}>
                    <strong style={{ color: 'var(--gold)', display: 'block', marginBottom: 4 }}>Key Drivers</strong>
                    {overview.topStrengthAndWatch}
                  </div>
                </div>
              )}

              {overviewModalTab === 'elements' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(Object.entries(chartMakeup.elems) as [string, number][]).map(([name, count]) => {
                      const pct = Math.round((count / chartMakeup.total) * 100);
                      const barColor =
                        name === 'Fire' ? 'var(--amber)' : name === 'Earth' ? 'var(--gold)' : name === 'Air' ? 'var(--teal)' : '#7aa2f7';
                      return (
                        <div key={name} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 64px', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                          <span style={{ fontWeight: 600 }}>{name}</span>
                          <div style={{ height: 9, borderRadius: 6, background: 'var(--surface-alt)', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 6 }} />
                          </div>
                          <span style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'right' }}>{count} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(Object.entries(chartMakeup.mods) as [string, number][]).map(([name, count]) => (
                      <span key={name} className="gold-badge" style={{ fontSize: 11 }}>{name}: {count}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                    <strong style={{ color: 'var(--teal)' }}>Plain English:</strong> Dominant <strong style={{ color: 'var(--text-main)' }}>{chartMakeup.dominantElem}</strong> energy drives your natural instinct, while <strong style={{ color: 'var(--text-main)' }}>{chartMakeup.dominantMod}</strong> shows how you initiate and sustain change.
                  </div>
                </div>
              )}

              {overviewModalTab === 'conditions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 11.5 }}>
                    {chartMakeup.exaltedOwn.length > 0 && (
                      <span className="teal-badge" style={{ textTransform: 'capitalize' }}>★ Strong: {chartMakeup.exaltedOwn.join(', ')}</span>
                    )}
                    {chartMakeup.vargottama.length > 0 && (
                      <span className="gold-badge" style={{ textTransform: 'capitalize' }}>★ Vargottama: {chartMakeup.vargottama.join(', ')}</span>
                    )}
                    {chartMakeup.retro.length > 0 && (
                      <span className="amber-badge" style={{ textTransform: 'capitalize' }}>↺ Retrograde: {chartMakeup.retro.join(', ')}</span>
                    )}
                    {chartMakeup.combust.length > 0 && (
                      <span className="amber-badge" style={{ textTransform: 'capitalize' }}>☀ Combust: {chartMakeup.combust.join(', ')}</span>
                    )}
                    {chartMakeup.debilitated.length > 0 && (
                      <span className="amber-badge" style={{ textTransform: 'capitalize' }}>⚠ Growth: {chartMakeup.debilitated.join(', ')}</span>
                    )}
                  </div>
                  {chartMakeup.aspects.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        <Zap size={12} style={{ verticalAlign: 'middle', color: 'var(--teal)' }} /> Vedic Planetary Aspects (Drishti)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6 }}>
                        {chartMakeup.aspects.map((a: any, idx: number) => (
                          <div key={idx} style={{ padding: '7px 10px', borderRadius: 8, background: 'var(--surface-alt)', fontSize: 12 }}>
                            <strong style={{ color: 'var(--teal)', textTransform: 'capitalize' }}>{a.from ?? a.body1}</strong> →{' '}
                            <strong style={{ color: 'var(--gold)', textTransform: 'capitalize' }}>{a.to ?? a.body2}</strong>{' '}
                            <span style={{ color: 'var(--text-muted)' }}>({a.type ?? a.aspect?.name})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
