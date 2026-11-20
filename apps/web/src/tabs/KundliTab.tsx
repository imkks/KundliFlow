import React, { useState, useMemo } from 'react';
import { HelpCircle, PenLine, ChevronDown, ChevronRight, Clock, BookOpen, Sparkles, Flame, Zap } from 'lucide-react';
import {
  computeMutualAspects,
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
import { DualKundliChart } from '../components/DualKundliChart.tsx';
import { BhavaDossierExplorer } from '../components/BhavaDossierExplorer.tsx';
import { ChalitTable } from '../components/ChalitTable.tsx';
import { KpTable } from '../components/KpTable.tsx';
import { SpecialLagnasAndVarshaphal } from '../components/SpecialLagnasAndVarshaphal.tsx';
import { useReading } from '../context/ReadingContext.tsx';
import { GlossaryTerm } from '../components/GlossaryTerm.tsx';

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

type KundliSubMode = 'charts' | 'dual' | 'bhavas' | 'kp' | 'varshaphal' | 'birth';

export const KundliTab: React.FC<KundliTabProps> = ({
  profileId,
  natalChart,
  currentTransits,
  chalit,
  panchang,
  avakahada,
  birthDate,
  birthTime,
  tzId,
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
  const [subMode, setSubMode] = useState<KundliSubMode>('charts');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [teachStep, setTeachStep] = useState<number | null>(null);
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [inspectorMode, setInspectorMode] = useState<'houses' | 'planets'>('houses');
  const [showPositionsTable, setShowPositionsTable] = useState(false);
  const [showAllFindings, setShowAllFindings] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);

  const {
    depth,
    reading,
    readingLoading,
    selectedHouse,
    setSelectedHouse,
    selectedPlanet,
    setSelectedPlanet,
    openAskDrawer,
    setActiveTab,
  } = useReading();

  const overview = reading?.overview;
  const showTechnical = depth === 'detailed' || showTechDetails;

  const polarityLabel = (p: string) =>
    p === 'supportive' ? '✓ Strong Support' : p === 'challenging' ? '⚠ Growth Area' : '• Balanced';

  const applyLifeTopic = (topicId: string) => {
    setActiveTopic(topicId);
    if (topicId === 'career') {
      setSubMode('charts');
      setSelectedHouse(10);
      setInspectorMode('houses');
      onVargaChange('D10');
    } else if (topicId === 'love') {
      setSubMode('charts');
      setSelectedHouse(7);
      setInspectorMode('houses');
      onVargaChange('D9');
    } else if (topicId === 'wealth') {
      setSubMode('charts');
      setSelectedHouse(2);
      setInspectorMode('houses');
      onVargaChange('D2');
    } else if (topicId === 'health') {
      setSubMode('charts');
      setSelectedHouse(4);
      setInspectorMode('houses');
      onVargaChange('D9');
    } else if (topicId === 'year') {
      setShowAdvanced(true);
      setSubMode('varshaphal');
    }
  };

  const renderFindingList = (items: any[]) => {
    const visible = showAllFindings ? items : items.slice(0, 3);
    const remaining = items.length - visible.length;
    return (
      <>
        {visible.map((f: any) => {
          const isWhyOpen = expandedRuleId === f.id;
          return (
            <div key={f.id} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: f.polarity === 'supportive' ? 'var(--teal)' : f.polarity === 'challenging' ? 'var(--amber)' : 'var(--gold)' }}>
                  {polarityLabel(f.polarity)}
                  {showTechnical ? ` • Strength ${f.strength}/100` : ''}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => setExpandedRuleId(isWhyOpen ? null : f.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      fontSize: 10.5,
                      color: 'var(--teal)',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {isWhyOpen ? 'Hide Why ▴' : 'Why? ▾'}
                  </button>
                  {showTechnical && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{f.ruleId}</span>
                  )}
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-main)' }}>{f.text}</p>
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
            onClick={() => setShowAllFindings(true)}
            style={{
              alignSelf: 'flex-start',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              color: 'var(--teal)',
              cursor: 'pointer',
            }}
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

  const chalitShifts = reading?.kundliExtras?.chalitShifts ?? [];
  const kpCusps = reading?.kundliExtras?.kpCusps ?? [];
  const varshaphalL2 = reading?.kundliExtras?.varshaphal;
  const upagrahas = reading?.specials?.upagrahas ?? [];
  const panchangL2 = reading?.panchang;

  // Elemental & Modality Balance + Special Natal Conditions
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

    const aspects = computeMutualAspects(natalChart.grahas).slice(0, 6);

    return { elems, mods, total, dominantElem, dominantMod, retro, combust, exaltedOwn, debilitated, vargottama, aspects };
  }, [natalChart, reading]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Life Topics Quick-Jump Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Explore by Life Topic:
        </span>
        {(
          [
            { id: 'career', label: '💼 Career & Calling' },
            { id: 'love', label: '💞 Love & Marriage' },
            { id: 'wealth', label: '💰 Wealth & Assets' },
            { id: 'health', label: '🌿 Health & Peace' },
            { id: 'year', label: '🗓 My Year Ahead' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => applyLifeTopic(t.id)}
            style={{
              padding: '5px 11px',
              borderRadius: 16,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTopic === t.id ? 'rgba(95, 194, 179, 0.2)' : 'var(--surface-alt)',
              color: activeTopic === t.id ? 'var(--teal)' : 'var(--text-main)',
              border: activeTopic === t.id ? '1px solid var(--teal)' : '1px solid var(--border-subtle)',
            }}
          >
            {t.label}
          </button>
        ))}

        <button
          onClick={() => setTeachStep((s) => (s ? null : 1))}
          style={{
            marginLeft: 'auto',
            padding: '5px 11px',
            borderRadius: 16,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            background: teachStep ? 'var(--gold)' : 'rgba(212, 175, 55, 0.12)',
            color: teachStep ? '#15132b' : 'var(--gold)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
          }}
        >
          🎓 {teachStep ? 'Close Guide' : 'Teach Me on My Chart'}
        </button>
      </div>

      {/* Interactive Teach Me Guided Tour */}
      {teachStep !== null && (
        <div className="card" style={{ background: 'rgba(95, 194, 179, 0.06)', border: '1px solid rgba(95, 194, 179, 0.3)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <strong style={{ fontSize: 13.5, color: 'var(--teal)' }}>
              🎓 Guided Lesson {teachStep} of 3 — Learning Jyotish Using Your Chart
            </strong>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 3].map((step) => (
                <button
                  key={step}
                  onClick={() => {
                    setTeachStep(step);
                    setSubMode('charts');
                    if (step === 1) { setSelectedHouse(1); setInspectorMode('houses'); }
                    if (step === 2) { setSelectedHouse(10); setInspectorMode('houses'); }
                    if (step === 3) { onVargaChange('D9'); }
                  }}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: teachStep === step ? 'var(--teal)' : 'var(--surface-alt)',
                    color: teachStep === step ? '#15132b' : 'var(--text-main)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  Step {step}
                </button>
              ))}
            </div>
          </div>

          {teachStep === 1 && (
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6 }}>
              <strong>1. Your Big 3 (Boat, Mind, Current):</strong> In your chart, the top diamond (<strong>House 1</strong>, <strong style={{ color: 'var(--gold)' }}>{natalChart.lagna?.sign.toUpperCase()}</strong>) is your <em>Lagna</em> — your vehicle &amp; physical path. Your <strong>Moon</strong> in <strong style={{ color: 'var(--teal)' }}>{natalChart.grahas.moon.sign.toUpperCase()} ({natalChart.grahas.moon.nakshatra})</strong> shows your emotional instinct and natural temperament.
            </p>
          )}
          {teachStep === 2 && (
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6 }}>
              <strong>2. Click Any House &amp; Watch the Dashed Line:</strong> Click any house polygon inside the chart SVG (like <strong>House 10 Career</strong>). The house turns gold, and a dashed teal line points to where its <strong>House Lord</strong> sits — showing <em>where</em> that area of life expresses itself.
            </p>
          )}
          {teachStep === 3 && (
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6 }}>
              <strong>3. D1 (The Tree) vs D9 Navamsha (The Fruit):</strong> The first chart (D1) shows raw potential and outer circumstances. The second chart (<strong>D9 Navamsha</strong>) reveals inner maturity, long-term stamina, and partnerships over time. Any planet marked ★ <em>Vargottama</em> sits in the exact same sign in both.
            </p>
          )}
        </div>
      )}

      {/* Essentials vs Advanced Sub-mode Switcher */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            display: 'flex',
            gap: 6,
            background: 'var(--surface-alt)',
            padding: 4,
            borderRadius: 10,
            border: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
          }}
        >
          {(
            [
              { id: 'charts', label: 'Charts & Inspector' },
              { id: 'birth', label: 'Birth Profile (Panchang)' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setSubMode(m.id)}
              style={{
                padding: '5px 12px',
                fontSize: 12,
                borderRadius: 7,
                fontWeight: subMode === m.id ? 700 : 500,
                background: subMode === m.id ? 'var(--gold)' : 'transparent',
                color: subMode === m.id ? '#15132b' : 'var(--text-main)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {m.label}
            </button>
          ))}

          <button
            onClick={() => setShowAdvanced((v) => !v)}
            style={{
              padding: '5px 12px',
              fontSize: 12,
              borderRadius: 7,
              fontWeight: 600,
              background: showAdvanced || ['dual', 'bhavas', 'kp', 'varshaphal'].includes(subMode) ? 'rgba(95, 194, 179, 0.16)' : 'transparent',
              color: showAdvanced || ['dual', 'bhavas', 'kp', 'varshaphal'].includes(subMode) ? 'var(--teal)' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Advanced Systems {showAdvanced ? '▴' : '▾'}
          </button>
        </div>

        {(showAdvanced || ['dual', 'bhavas', 'kp', 'varshaphal'].includes(subMode)) && (
          <div
            style={{
              display: 'flex',
              gap: 6,
              background: 'var(--surface-alt)',
              padding: 4,
              borderRadius: 10,
              border: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
            }}
          >
            {(
              [
                { id: 'dual', label: 'Dual Transit Overlay' },
                { id: 'bhavas', label: 'Bhava Chalit' },
                { id: 'kp', label: 'KP System' },
                { id: 'varshaphal', label: 'Varshaphal & Arudhas' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setSubMode(m.id)}
                style={{
                  padding: '5px 12px',
                  fontSize: 12,
                  borderRadius: 7,
                  fontWeight: subMode === m.id ? 700 : 500,
                  background: subMode === m.id ? 'var(--teal)' : 'transparent',
                  color: subMode === m.id ? '#15132b' : 'var(--text-main)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 1. CHARTS & STICKY LEVEL 2 INSPECTOR */}
      {subMode === 'charts' && (
        <>
          {/* Your Chart in 60 Seconds */}
          {overview && (
            <div
              className="card"
              style={{
                padding: '12px 16px',
                background: 'rgba(212, 175, 55, 0.05)',
                border: '1px solid rgba(212, 175, 55, 0.22)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>
                <Sparkles size={14} /> Your Chart in 60 Seconds
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, fontSize: 12.5, lineHeight: 1.55 }}>
                <div><strong style={{ color: 'var(--teal)' }}>Core Nature:</strong> {overview.coreNature}</div>
                <div><strong style={{ color: 'var(--teal)' }}>Soul &amp; Career:</strong> {overview.soulAndCareer}</div>
                <div><strong style={{ color: 'var(--gold)' }}>Current Chapter:</strong> {overview.currentChapter}</div>
                <div><strong style={{ color: 'var(--gold)' }}>Key Drivers:</strong> {overview.topStrengthAndWatch}</div>
              </div>
            </div>
          )}

          {/* Chart Controls Bar */}
          <div
            className="card"
            style={{
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Style:</span>
              <div style={{ display: 'flex', background: 'var(--surface-alt)', borderRadius: 6, padding: 2, border: '1px solid var(--border-subtle)' }}>
                {(['north', 'south'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => onChartStyleChange(st)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      borderRadius: 4,
                      cursor: 'pointer',
                      border: 'none',
                      background: chartStyle === st ? 'var(--gold)' : 'transparent',
                      color: chartStyle === st ? '#15132b' : 'var(--text-main)',
                      fontWeight: chartStyle === st ? 600 : 400,
                    }}
                  >
                    {st === 'north' ? 'North (Diamond)' : 'South (Grid)'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Chart Ref:</span>
              <div style={{ display: 'flex', background: 'var(--surface-alt)', borderRadius: 6, padding: 2, border: '1px solid var(--border-subtle)' }}>
                {(['lagna', 'chandra'] as const).map((ref) => (
                  <button
                    key={ref}
                    onClick={() => onPerspectiveChange(ref)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      borderRadius: 4,
                      cursor: 'pointer',
                      border: 'none',
                      background: chartPerspective === ref ? 'var(--gold)' : 'transparent',
                      color: chartPerspective === ref ? '#15132b' : 'var(--text-main)',
                      fontWeight: chartPerspective === ref ? 600 : 400,
                    }}
                  >
                    {ref === 'lagna' ? 'Lagna (Asc)' : 'Moon (Chandra)'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Divisional Varga:</span>
              <select
                value={selectedVarga}
                onChange={(e) => onVargaChange(e.target.value as VargaType)}
                style={{
                  background: 'var(--surface-alt)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: 12,
                }}
              >
                {VARGA_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {VARGA_LABELS[v]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Master-Detail: Charts on Left, Level 2 Inspector on Right */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, alignItems: 'start' }}>
            {/* Left Column: D1 + Varga Charts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card">
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textAlign: 'center' }}>
                  Click any House diamond or Planet abbreviation to inspect
                </div>
                {chartStyle === 'north' ? (
                  <NorthIndianChart
                    lagnaSignIndex={chartPerspective === 'chandra' ? natalChart.grahas.moon.signIndex : (natalChart.lagna?.signIndex ?? 0)}
                    placements={d1Placements}
                    title={chartPerspective === 'chandra' ? 'Chandra Kundli (Moon Chart)' : 'D1 Rashi Chart (Birth Horoscope)'}
                    selectedHouse={inspectorMode === 'houses' ? selectedHouse : undefined}
                    highlightHouse={inspectorMode === 'houses' ? activeHouse?.lordPlacedHouse : undefined}
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
                    lagnaSignIndex={chartPerspective === 'chandra' ? natalChart.grahas.moon.signIndex : (natalChart.lagna?.signIndex ?? 0)}
                    placements={d1Placements}
                    title={chartPerspective === 'chandra' ? 'Chandra Kundli (Moon Chart)' : 'D1 Rashi Chart (Birth Horoscope)'}
                    selectedHouse={inspectorMode === 'houses' ? selectedHouse : undefined}
                    highlightHouse={inspectorMode === 'houses' ? activeHouse?.lordPlacedHouse : undefined}
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
            </div>

            {/* Right Column: Sticky Level 2 Inspector */}
            <div className="card" style={{ position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BookOpen size={16} style={{ color: 'var(--gold)' }} />
                  <strong style={{ fontSize: 15, color: 'var(--gold)' }}>Chart Inspector (Level 2)</strong>
                </div>

                <div style={{ display: 'flex', background: 'var(--surface-alt)', borderRadius: 8, padding: 2, border: '1px solid var(--border-subtle)' }}>
                  {(['houses', 'planets'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setInspectorMode(m)}
                      style={{
                        padding: '4px 10px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        borderRadius: 6,
                        border: 'none',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
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
                  Loading Level 2 readings…
                </div>
              )}

              {!readingLoading && inspectorMode === 'houses' && houses.length > 0 && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 5 }}>
                    {houses.map((h: any) => (
                      <button
                        key={h.house}
                        onClick={() => setSelectedHouse(h.house)}
                        style={{
                          padding: '6px 7px',
                          borderRadius: 8,
                          textAlign: 'left',
                          cursor: 'pointer',
                          background: selectedHouse === h.house ? 'rgba(227, 173, 70, 0.2)' : 'var(--surface-alt)',
                          border: selectedHouse === h.house ? '1px solid var(--gold)' : '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-main)' }}>
                          H{h.house} • {h.sign.slice(0, 3).toUpperCase()}
                        </div>
                        <div style={{ fontSize: 9.5, color: h.tone === 'Mostly supportive' ? 'var(--teal)' : h.tone === 'Needs attention' ? 'var(--amber)' : 'var(--gold)' }}>
                          {h.tone === 'Mostly supportive' ? '✓ Supportive' : h.tone === 'Needs attention' ? '⚠ Watch' : h.tone}
                        </div>
                      </button>
                    ))}
                  </div>

                  {activeHouse && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--gold)' }}>
                            House {activeHouse.house} • {activeHouse.lifeArea ?? activeHouse.sign.toUpperCase()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {depth !== 'detailed' && (
                            <button
                              onClick={() => setShowTechDetails((v) => !v)}
                              style={{
                                background: 'transparent',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 6,
                                padding: '3px 8px',
                                fontSize: 10.5,
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                              }}
                            >
                              {showTechDetails ? 'Hide details' : 'Show evidence IDs'}
                            </button>
                          )}
                          <button
                            onClick={() => openAskDrawer(`What does my House ${activeHouse.house} (${activeHouse.lifeArea ?? activeHouse.themes[0]?.replace(/_/g, ' ')}) show?`)}
                            className="btn btn-outline"
                            style={{ fontSize: 11 }}
                          >
                            <HelpCircle size={12} /> Ask AI
                          </button>
                        </div>
                      </div>

                      {/* House Telemetry Strip */}
                      {(() => {
                        const occupants = (['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'] as const)
                          .filter((k) => natalChart.grahas[k]?.houseFromLagna === activeHouse.house);
                        return (
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                              gap: 6,
                              padding: 9,
                              borderRadius: 8,
                              background: 'var(--surface-alt)',
                              border: '1px solid var(--border-subtle)',
                              fontSize: 11.5,
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Rashi Sign</div>
                              <div style={{ fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-main)' }}>
                                {activeHouse.sign}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>House Lord</div>
                              <div style={{ fontWeight: 700, textTransform: 'capitalize', color: 'var(--gold)' }}>
                                {activeHouse.lord} → H{activeHouse.lordPlacedHouse}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Occupants</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                                {occupants.length > 0 ? (
                                  occupants.map((occ) => (
                                    <button
                                      key={occ}
                                      onClick={() => {
                                        setSelectedPlanet(occ);
                                        setInspectorMode('planets');
                                        setShowAllFindings(false);
                                      }}
                                      style={{
                                        padding: '1px 6px',
                                        borderRadius: 5,
                                        fontSize: 10.5,
                                        fontWeight: 700,
                                        textTransform: 'capitalize',
                                        background: 'rgba(95, 194, 179, 0.16)',
                                        color: 'var(--teal)',
                                        border: '1px solid rgba(95, 194, 179, 0.3)',
                                        cursor: 'pointer',
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
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Overall Tone</div>
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
                          <span className="teal-badge" style={{ fontSize: 10.5 }}>
                            <Clock size={10} /> {activeHouse.activeDashaNote}
                          </span>
                        </div>
                      )}

                      {activeHouse.netBalance && (
                        <div style={{ fontSize: 12, color: 'var(--gold)', fontStyle: 'italic', lineHeight: 1.5 }}>
                          {activeHouse.netBalance}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto' }}>
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
                          onClick={() => setActiveTab('journal')}
                          className="btn btn-outline"
                          style={{ fontSize: 11, whiteSpace: 'nowrap' }}
                        >
                          <PenLine size={11} /> Journal
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
                        onClick={() => { setSelectedPlanet(p.planet); setShowAllFindings(false); }}
                        style={{
                          padding: '6px 8px',
                          borderRadius: 8,
                          textAlign: 'left',
                          cursor: 'pointer',
                          background: selectedPlanet === p.planet ? 'rgba(95, 194, 179, 0.18)' : 'var(--surface-alt)',
                          border: selectedPlanet === p.planet ? '1px solid var(--teal)' : '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-main)' }}>
                          {p.planet}
                        </div>
                        <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>
                          H{p.house} • {p.dignity}
                        </div>
                      </button>
                    ))}
                  </div>

                  {activePlanet && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--teal)', textTransform: 'capitalize' }}>
                            {activePlanet.planet} in {activePlanet.sign} (House {activePlanet.house})
                          </div>
                        </div>
                        <button
                          onClick={() => openAskDrawer(`How is ${activePlanet.planet} functioning in my chart?`)}
                          className="btn btn-outline"
                          style={{ fontSize: 11 }}
                        >
                          <HelpCircle size={12} /> Ask AI
                        </button>
                      </div>

                      {/* Planet Telemetry Grid */}
                      {(() => {
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
                              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                              gap: 6,
                              padding: 9,
                              borderRadius: 8,
                              background: 'var(--surface-alt)',
                              border: '1px solid var(--border-subtle)',
                              fontSize: 11.5,
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Degree &amp; Star</div>
                              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                {g ? degToDms(g.degInSign) : '—'}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                {activePlanet.nakshatra}{g?.pada ? ` (P${g.pada})` : ''}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Dignity &amp; Motion</div>
                              <div style={{ fontWeight: 700, textTransform: 'capitalize', color: activePlanet.dignity === 'exalted' || activePlanet.dignity === 'own' ? 'var(--teal)' : activePlanet.dignity === 'debilitated' ? 'var(--amber)' : 'var(--gold)' }}>
                                {activePlanet.dignity}
                              </div>
                              <div style={{ fontSize: 10, color: g?.retrograde || isCombust ? 'var(--amber)' : 'var(--text-muted)' }}>
                                {g?.retrograde ? '↺ Retrograde' : 'Direct'}{isCombust ? ` • Combust (${sep!.toFixed(1)}°)` : ''}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Houses Owned</div>
                              <div style={{ fontWeight: 700, color: 'var(--gold)' }}>
                                {activePlanet.ownedHouses?.length ? activePlanet.ownedHouses.map((h: number) => `H${h}`).join(', ') : 'Node / None'}
                              </div>
                              {karakaCode && (
                                <div style={{ fontSize: 10, color: 'var(--teal)', fontWeight: 700 }}>
                                  Jaimini: {karakaCode}
                                </div>
                              )}
                            </div>
                            <div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Navamsha (D9)</div>
                              <div style={{ fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-main)' }}>
                                {vargaEntry?.d9 ?? '—'}
                              </div>
                              <div style={{ fontSize: 10, color: vargaEntry?.vargottama ? 'var(--gold)' : 'var(--text-muted)' }}>
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

                      {activePlanet.netBalance && (
                        <div style={{ fontSize: 12, color: 'var(--gold)', fontStyle: 'italic', lineHeight: 1.5 }}>
                          {activePlanet.netBalance}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto' }}>
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

              {!readingLoading && houses.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Click any row in the planetary positions table below to inspect placements.
                </div>
              )}
            </div>
          </div>

          {/* Elemental Balance & Special Natal Conditions Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {/* Elemental & Modality Balance */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Flame size={15} /> Elemental &amp; Modality Balance
                </h3>
                <span className="teal-badge" style={{ fontSize: 10 }}>
                  {chartMakeup.dominantElem} • {chartMakeup.dominantMod}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(Object.entries(chartMakeup.elems) as [string, number][]).map(([name, count]) => {
                  const pct = Math.round((count / chartMakeup.total) * 100);
                  const barColor =
                    name === 'Fire' ? 'var(--amber)' : name === 'Earth' ? 'var(--gold)' : name === 'Air' ? 'var(--teal)' : '#7aa2f7';
                  return (
                    <div key={name} style={{ display: 'grid', gridTemplateColumns: '55px 1fr 48px', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{name}</span>
                      <div style={{ height: 8, borderRadius: 6, background: 'var(--surface-alt)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 6 }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
                {(Object.entries(chartMakeup.mods) as [string, number][]).map(([name, count]) => (
                  <span key={name} className="gold-badge" style={{ fontSize: 10.5 }}>
                    {name}: {count}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Dominant <strong style={{ color: 'var(--text-main)' }}>{chartMakeup.dominantElem}</strong> &amp;{' '}
                <strong style={{ color: 'var(--text-main)' }}>{chartMakeup.dominantMod}</strong> energy shapes how you initiate, sustain, and adapt to life changes.
              </div>
            </div>

            {/* Special Natal Conditions & Mutual Aspects */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={15} style={{ color: 'var(--teal)' }} /> Special Natal Conditions &amp; Aspects
              </h3>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 11 }}>
                {chartMakeup.exaltedOwn.length > 0 && (
                  <span className="teal-badge" style={{ textTransform: 'capitalize' }}>
                    ★ Strong: {chartMakeup.exaltedOwn.join(', ')}
                  </span>
                )}
                {chartMakeup.vargottama.length > 0 && (
                  <span className="gold-badge" style={{ textTransform: 'capitalize' }}>
                    ★ Vargottama: {chartMakeup.vargottama.join(', ')}
                  </span>
                )}
                {chartMakeup.retro.length > 0 && (
                  <span className="amber-badge" style={{ textTransform: 'capitalize' }}>
                    ↺ Retrograde: {chartMakeup.retro.join(', ')}
                  </span>
                )}
                {chartMakeup.combust.length > 0 && (
                  <span className="amber-badge" style={{ textTransform: 'capitalize' }}>
                    ☀ Combust: {chartMakeup.combust.join(', ')}
                  </span>
                )}
                {chartMakeup.debilitated.length > 0 && (
                  <span className="amber-badge" style={{ textTransform: 'capitalize' }}>
                    ⚠ Debilitated: {chartMakeup.debilitated.join(', ')}
                  </span>
                )}
              </div>

              {chartMakeup.aspects.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Key Planetary Aspects (Drishti)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 6 }}>
                    {chartMakeup.aspects.map((a: any, idx: number) => (
                      <div key={idx} style={{ padding: '6px 9px', borderRadius: 7, background: 'var(--surface-alt)', fontSize: 11.5 }}>
                        <strong style={{ color: 'var(--teal)', textTransform: 'capitalize' }}>{a.from}</strong> →{' '}
                        <strong style={{ color: 'var(--gold)', textTransform: 'capitalize' }}>{a.to}</strong>{' '}
                        <span style={{ color: 'var(--text-muted)' }}>({a.type})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Collapsible Planetary Positions Table ("Show calculation") */}
          <div className="card">
            <button
              onClick={() => setShowPositionsTable((v) => !v)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                padding: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                color: 'var(--gold)',
              }}
            >
              <span className="serif-title" style={{ fontSize: 14 }}>
                Planetary Positions &amp; Degrees (Nirayana)
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {showPositionsTable ? 'Hide table' : 'Show calculation table'}
                {showPositionsTable ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </span>
            </button>

            {showPositionsTable && (
              <div style={{ overflowX: 'auto', marginTop: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px 6px' }}>Graha</th>
                      <th style={{ padding: '8px 6px' }}>Dir/Ret</th>
                      <th style={{ padding: '8px 6px' }}>Rashi</th>
                      <th style={{ padding: '8px 6px' }}>Degrees</th>
                      <th style={{ padding: '8px 6px' }}>Nakshatra</th>
                      <th style={{ padding: '8px 6px' }}>Pada</th>
                      <th style={{ padding: '8px 6px' }}>House</th>
                      <th style={{ padding: '8px 6px' }}>Dignity</th>
                      <th style={{ padding: '8px 6px' }}>Karaka</th>
                    </tr>
                  </thead>
                  <tbody>
                    {natalChart.lagna && (
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(227, 173, 70, 0.05)' }}>
                        <td style={{ padding: '8px 6px', fontWeight: 700, color: 'var(--gold)' }}>Ascendant</td>
                        <td style={{ padding: '8px 6px', color: 'var(--text-muted)' }}>—</td>
                        <td style={{ padding: '8px 6px', textTransform: 'capitalize' }}>{natalChart.lagna.sign}</td>
                        <td style={{ padding: '8px 6px', color: 'var(--gold)', fontWeight: 600 }}>{degToDms(natalChart.lagna.degInSign)}</td>
                        <td style={{ padding: '8px 6px' }}>{natalChart.lagna.nakshatra}</td>
                        <td style={{ padding: '8px 6px' }}>{natalChart.lagna.pada}</td>
                        <td style={{ padding: '8px 6px', fontWeight: 600 }}>1</td>
                        <td style={{ padding: '8px 6px', color: 'var(--teal)' }}>Lagna</td>
                        <td style={{ padding: '8px 6px', color: 'var(--text-muted)' }}>—</td>
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
                          <td style={{ padding: '8px 6px', fontWeight: 600, textTransform: 'capitalize', color: isSelected ? 'var(--teal)' : 'inherit' }}>
                            {g.name}
                          </td>
                          <td style={{ padding: '8px 6px' }}>
                            {g.retrograde ? <span style={{ color: 'var(--amber)', fontWeight: 700, fontSize: 11 }}>[R]</span> : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Dir</span>}
                          </td>
                          <td style={{ padding: '8px 6px', textTransform: 'capitalize' }}>{g.sign}</td>
                          <td style={{ padding: '8px 6px', fontWeight: 600 }}>{degToDms(g.degInSign)}</td>
                          <td style={{ padding: '8px 6px' }}>{g.nakshatra}</td>
                          <td style={{ padding: '8px 6px' }}>{g.pada}</td>
                          <td style={{ padding: '8px 6px', fontWeight: 600 }}>{g.houses?.houseFromLagna ?? g.houseFromLagna ?? 1}</td>
                          <td style={{ padding: '8px 6px', color: dignityColor, textTransform: 'capitalize' }}>{g.dignity || 'Neutral'}</td>
                          <td style={{ padding: '8px 6px', fontWeight: 700, color: 'var(--gold)' }}>{charaKarakas[key] || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* 2. DUAL TRANSIT OVERLAY */}
      {subMode === 'dual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <DualKundliChart
            natalChart={natalChart}
            transits={currentTransits}
            selectedHouse={selectedHouse}
            onSelectHouse={setSelectedHouse}
          />
          <BhavaDossierExplorer
            natalChart={natalChart}
            transits={currentTransits}
            selectedHouse={selectedHouse}
            onSelectHouse={setSelectedHouse}
          />
        </div>
      )}

      {/* 3. BHAVA CHALIT */}
      {subMode === 'bhavas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: '0 0 8px 0' }}>
              Bhava Chalit House Shifts (Level 2)
            </h3>
            {chalitShifts.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                No planets shift house between D1 Rashi and Sripati Chalit — your sign placements match your cusp houses cleanly.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {chalitShifts.map((cs: any) => (
                  <div key={cs.planet} style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', fontSize: 12 }}>
                    <strong style={{ color: 'var(--teal)', textTransform: 'uppercase' }}>{cs.planet}</strong>: H{cs.rashiHouse} → H{cs.chalitHouse} — {cs.plainMeaning}
                  </div>
                ))}
              </div>
            )}
          </div>
          {chalit && <ChalitTable chalit={chalit} />}
          <BhavaDossierExplorer
            natalChart={natalChart}
            transits={currentTransits}
            selectedHouse={selectedHouse}
            onSelectHouse={setSelectedHouse}
          />
        </div>
      )}

      {/* 4. KP SYSTEM */}
      {subMode === 'kp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {kpCusps.length > 0 && (
            <div className="card">
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: '0 0 10px 0' }}>
                KP Key Cusp <GlossaryTerm term="SubLord">Sub-Lords</GlossaryTerm> (Level 2)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
                {kpCusps.map((kc: any) => (
                  <div key={kc.house} style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: 'var(--teal)', marginBottom: 4 }}>
                      House {kc.house} ({kc.sign}) • Sub-Lord: {kc.subLord.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 11.5, lineHeight: 1.45 }}>{kc.plainMeaning}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <KpTable natal={natalChart} />
        </div>
      )}

      {/* 5. VARSHAPHAL, ARUDHAS & UPAGRAHAS */}
      {subMode === 'varshaphal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {varshaphalL2 && (
            <div className="card">
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: '0 0 6px 0' }}>
                Annual Varshaphal ({varshaphalL2.targetYear} • Age {varshaphalL2.completedAge})
              </h3>
              <p style={{ fontSize: 12.5, lineHeight: 1.5, margin: '0 0 8px 0' }}>{varshaphalL2.plainSummary}</p>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                Varsha Lagna: {varshaphalL2.varshaLagnaSign} • <GlossaryTerm term="Muntha" />: {varshaphalL2.munthaSign} (H{varshaphalL2.munthaHouseInVarsha}) • Year Weekday Lord: {varshaphalL2.varaPati}
              </div>
            </div>
          )}

          {upagrahas.length > 0 && (
            <div className="card">
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: '0 0 10px 0' }}>
                Upagrahas (Sub-Planets)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                {upagrahas.map((u: any) => (
                  <div key={u.id} style={{ padding: 10, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: 'var(--teal)' }}>
                      {u.name} • {u.sign} (H{u.houseFromLagna})
                    </div>
                    <div style={{ fontSize: 11.5, marginTop: 4, lineHeight: 1.45 }}>{u.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <SpecialLagnasAndVarshaphal profileId={profileId} natalChart={natalChart} />
        </div>
      )}

      {/* 6. BIRTH PROFILE (PANCHANG & AVAKAHADA — REAL COMPUTED VALUES) */}
      {subMode === 'birth' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {panchangL2 && (
            <div className="card">
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: '0 0 6px 0' }}>
                Birth Temperament &amp; Panchang Summary (Level 2)
              </h3>
              <p style={{ fontSize: 12.5, lineHeight: 1.5, margin: '0 0 8px 0' }}>{panchangL2.natal.plainSummary}</p>
              {panchangL2.avakahada && (
                <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-muted)' }}>
                  <div>{panchangL2.avakahada.ganaMeaning}</div>
                  <div style={{ marginTop: 4 }}>{panchangL2.avakahada.nadiMeaning}</div>
                </div>
              )}
            </div>
          )}

          {avakahada && (
            <div className="card">
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: '0 0 12px 0' }}>
                Avakahada Chakra (Natal Moon Alignment)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div style={{ background: 'var(--surface-alt)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Paya (Pedestal)</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)', marginTop: 2 }}>{avakahada.paya}</div>
                </div>
                <div style={{ background: 'var(--surface-alt)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Varna</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--teal)', marginTop: 2 }}>{avakahada.varna}</div>
                </div>
                <div style={{ background: 'var(--surface-alt)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Yoni</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>{avakahada.yoni}</div>
                </div>
                <div style={{ background: 'var(--surface-alt)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Gana</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>{avakahada.gana}</div>
                </div>
                <div style={{ background: 'var(--surface-alt)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Vasya</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--teal)', marginTop: 2 }}>{avakahada.vasya}</div>
                </div>
                <div style={{ background: 'var(--surface-alt)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Nadi</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)', marginTop: 2 }}>{avakahada.nadi}</div>
                </div>
              </div>
            </div>
          )}

          {panchang && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0 }}>
                  Panchang at Birth ({birthDate} {birthTime} {tzId})
                </h3>
                <span className="teal-badge" style={{ fontSize: 10 }}>5 Limbs of Time</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div style={{ background: 'var(--surface-alt)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tithi (Lunar Day)</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>
                    {panchang.tithi.paksha} {panchang.tithi.name} (#{panchang.tithi.index})
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {(panchang.tithi.elapsedFraction * 100).toFixed(1)}% elapsed
                  </div>
                </div>
                <div style={{ background: 'var(--surface-alt)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Yoga (Luni-Solar Arc)</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', marginTop: 2 }}>
                    {panchang.yoga.name} (#{panchang.yoga.index})
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {(panchang.yoga.elapsedFraction * 100).toFixed(1)}% elapsed
                  </div>
                </div>
                <div style={{ background: 'var(--surface-alt)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Karana (Half Tithi)</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>
                    {panchang.karana.name}
                  </div>
                </div>
                <div style={{ background: 'var(--surface-alt)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Vara (Weekday)</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--teal)', marginTop: 2 }}>
                    {panchang.wara.name} (Lord: {panchang.wara.lord.toUpperCase()})
                  </div>
                </div>
                <div style={{ background: 'var(--surface-alt)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Julian Day (UT)</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gold)', marginTop: 2 }}>
                    JD {natalChart.time.julianDayUt.toFixed(5)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Swiss Ephemeris
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
