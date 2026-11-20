import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Award,
  ShieldCheck,
  ShieldAlert,
  Compass,
  Star,
  ChevronDown,
  ChevronRight,
  Heart,
  Feather,
  Lightbulb,
  CheckCircle2,
  Bot,
  Zap,
  Eye,
  Activity,
  Layers,
} from 'lucide-react';
import {
  detectYogasAndDoshas,
  getAvakahadaInterpretation,
  getPlanetaryInsights,
  getKarakasInsights,
  computePlanetaryAvasthas,
  computeFavourableAndGhatak,
  computeMutualAspects,
  SIGNS,
  type NatalChart,
  type AvakahadaDetails,
  type CharaKaraka,
  type YogaDetection,
} from '@astro/engine';

interface InterpretationsGuideProps {
  natalChart: NatalChart;
  avakahada: AvakahadaDetails;
  karakas: Record<string, CharaKaraka>;
  onOpenLlmDossier?: () => void;
}

type GuideFilter = 'all' | 'yogas' | 'avakahada' | 'planets' | 'karakas' | 'avasthas' | 'ghatak' | 'aspects';

export const InterpretationsGuide: React.FC<InterpretationsGuideProps> = ({
  natalChart,
  avakahada,
  karakas,
  onOpenLlmDossier,
}) => {
  const [filter, setFilter] = useState<GuideFilter>('all');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    yogas: true,
    avakahada: true,
    planets: true,
    karakas: true,
    avasthas: true,
    ghatak: true,
    aspects: true,
  });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const yogas: YogaDetection[] = detectYogasAndDoshas(natalChart);
  const avkInterpretation = getAvakahadaInterpretation(avakahada);
  const planetaryInsights = getPlanetaryInsights(natalChart);
  const karakaInsights = getKarakasInsights(karakas);
  const avasthas = computePlanetaryAvasthas(natalChart.grahas);
  const ghatak = computeFavourableAndGhatak(natalChart.grahas.moon.signIndex);
  const aspects = computeMutualAspects(natalChart.grahas);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header and Filter Pills */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 className="serif-title" style={{ fontSize: 18, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={20} /> Astrological Explanations & Blueprint
              </h2>
              {onOpenLlmDossier && (
                <button
                  onClick={onOpenLlmDossier}
                  style={{
                    background: 'var(--teal)',
                    color: '#15132b',
                    fontWeight: 700,
                    fontSize: 11,
                    borderRadius: 6,
                    padding: '4px 8px',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                  }}
                  title="Generate a clean, token-optimized context dossier for LLMs"
                >
                  <Bot size={13} /> LLM Context Export
                </button>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Classical synthesis of Parashara Yogas, Avakahada, Planetary Avasthas, Ghatak timing, and Jaimini Karakas.
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Insights' },
              { id: 'yogas', label: 'Yogas & Doshas' },
              { id: 'avasthas', label: 'Planetary Avasthas' },
              { id: 'ghatak', label: 'Favourable & Ghatak' },
              { id: 'aspects', label: 'Mutual Aspects' },
              { id: 'avakahada', label: 'Avakahada Blueprint' },
              { id: 'planets', label: 'Planets & Houses' },
              { id: 'karakas', label: 'Jaimini Karakas' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as GuideFilter)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  border: '1px solid var(--border)',
                  background: filter === f.id ? 'var(--gold)' : 'var(--surface-alt)',
                  color: filter === f.id ? '#15132b' : 'var(--text-main)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 1: YOGAS & DOSHAS */}
      {(filter === 'all' || filter === 'yogas') && (
        <div className="card">
          <div
            onClick={() => toggleSection('yogas')}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              paddingBottom: expandedSections.yogas ? 12 : 0,
              borderBottom: expandedSections.yogas ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={18} style={{ color: 'var(--gold)' }} />
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--text-main)' }}>
                Yogas & Doshas Analysis
              </h3>
              <span className="gold-badge" style={{ fontSize: 10 }}>
                {yogas.filter((y) => y.presence).length} Detected
              </span>
            </div>
            {expandedSections.yogas ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>

          {expandedSections.yogas && (
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
              {yogas.map((yoga) => {
                const isDosha = yoga.category === 'dosha';
                const isFavorable = yoga.presence && !isDosha;
                const isClean = !yoga.presence && isDosha;

                return (
                  <div
                    key={yoga.id}
                    style={{
                      background: 'var(--surface-alt)',
                      padding: 14,
                      borderRadius: 10,
                      border: `1px solid ${
                        isFavorable
                          ? 'rgba(227, 173, 70, 0.4)'
                          : isClean
                          ? 'rgba(95, 194, 179, 0.4)'
                          : 'rgba(217, 119, 54, 0.4)'
                      }`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
                          {yoga.name}
                        </div>
                        <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginTop: 2 }}>
                          {yoga.category} category
                        </div>
                      </div>

                      {yoga.presence ? (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 12,
                            background: isDosha ? 'rgba(217, 119, 54, 0.15)' : 'rgba(227, 173, 70, 0.15)',
                            color: isDosha ? 'var(--amber)' : 'var(--gold)',
                            border: `1px solid ${isDosha ? 'var(--amber)' : 'var(--gold)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {isDosha ? <ShieldAlert size={11} /> : <Sparkles size={11} />}
                          Active
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 12,
                            background: 'rgba(95, 194, 179, 0.15)',
                            color: 'var(--teal)',
                            border: '1px solid var(--teal)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <ShieldCheck size={11} />
                          Absent (Clean)
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      <strong>Planetary Geometry:</strong> {yoga.description}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-main)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '8px 10px',
                        borderRadius: 6,
                        borderLeft: `3px solid ${isFavorable ? 'var(--gold)' : isClean ? 'var(--teal)' : 'var(--amber)'}`,
                        lineHeight: 1.4,
                      }}
                    >
                      {yoga.effect}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 1B: PLANETARY AVASTHAS */}
      {(filter === 'all' || filter === 'avasthas') && (
        <div className="card">
          <div
            onClick={() => toggleSection('avasthas')}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              paddingBottom: expandedSections.avasthas ? 12 : 0,
              borderBottom: expandedSections.avasthas ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={18} style={{ color: 'var(--teal)' }} />
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--text-main)' }}>
                Planetary Avasthas (Ages & Consciousness States)
              </h3>
              <span className="teal-badge" style={{ fontSize: 10 }}>
                Brihat Parashara System
              </span>
            </div>
            {expandedSections.avasthas ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>

          {expandedSections.avasthas && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Avasthas measure the developmental maturity (<strong>Baladi</strong>), wakefulness (<strong>Jagratadi</strong>), and psychological satisfaction (<strong>Deeptadi</strong>) of each planet, determining whether its promise manifests with ease or requires awakening.
              </p>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                      <th style={{ padding: '8px 10px' }}>Graha</th>
                      <th style={{ padding: '8px 10px' }}>Sign (Deg)</th>
                      <th style={{ padding: '8px 10px' }}>Baladi Avastha</th>
                      <th style={{ padding: '8px 10px' }}>Jagratadi Avastha</th>
                      <th style={{ padding: '8px 10px' }}>Deeptadi Avastha</th>
                      <th style={{ padding: '8px 10px' }}>Manifestation Capacity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(avasthas).map(([id, av]) => {
                      const g = natalChart.grahas[id];
                      if (!g) return null;
                      return (
                        <tr key={id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 700, textTransform: 'capitalize', color: 'var(--gold)' }}>
                            {id} {g.retrograde ? '(R)' : ''}
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            {SIGNS[g.signIndex]} ({g.degInSign.toFixed(1)}°)
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ fontWeight: 600, color: av.baladi === 'Yuva' ? 'var(--teal)' : av.baladi === 'Kumar' ? 'var(--gold)' : 'var(--text-muted)' }}>
                              {av.baladi}
                            </span>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{av.baladiDescription.split(' — ')[0]}</div>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ fontWeight: 600, color: av.jagrat === 'Jaagrat' ? 'var(--teal)' : av.jagrat === 'Swapna' ? 'var(--gold)' : 'var(--amber)' }}>
                              {av.jagrat}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ fontWeight: 600, color: av.deeptadi === 'Deepta' || av.deeptadi === 'Swatha' ? 'var(--teal)' : av.deeptadi === 'Muditha' || av.deeptadi === 'Shant' ? 'var(--gold)' : 'var(--amber)' }}>
                              {av.deeptadi}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', fontSize: 11, color: 'var(--text-muted)' }}>
                            {av.deeptadiDescription.split(' — ')[0]}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 1C: FAVOURABLE POINTS & GHATAK (MALEFIC) CHAKRA */}
      {(filter === 'all' || filter === 'ghatak') && (
        <div className="card">
          <div
            onClick={() => toggleSection('ghatak')}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              paddingBottom: expandedSections.ghatak ? 12 : 0,
              borderBottom: expandedSections.ghatak ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={18} style={{ color: 'var(--amber)' }} />
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--text-main)' }}>
                Favourable Points & Ghatak (Malefic) Chakra
              </h3>
              <span className="amber-badge" style={{ fontSize: 10 }}>
                Muhurta & Personal Harmonization
              </span>
            </div>
            {expandedSections.ghatak ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>

          {expandedSections.ghatak && (
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
              {/* Favourable Points */}
              <div style={{ background: 'var(--surface-alt)', padding: 14, borderRadius: 10, border: '1px solid rgba(95, 194, 179, 0.4)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <ShieldCheck size={16} /> Favourable Personal Points
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}>Lucky Number</span>
                    <strong style={{ color: 'var(--teal)', fontSize: 14 }}>{ghatak.favourable.luckyNumber}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}>Good Numbers</span>
                    <strong>{ghatak.favourable.goodNumbers.join(', ')}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}>Lucky Days</span>
                    <strong>{ghatak.favourable.luckyDays.join(', ')}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}>Good Planets</span>
                    <strong style={{ color: 'var(--gold)' }}>{ghatak.favourable.goodPlanets.join(', ')}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}>Friendly Signs</span>
                    <strong>{ghatak.favourable.friendlySigns.join(', ')}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}>Harmonious Lagna</span>
                    <strong>{ghatak.favourable.goodLagna.join(', ')}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}>Lucky Metal</span>
                    <strong>{ghatak.favourable.luckyMetal}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}>Lucky Gemstone</span>
                    <strong style={{ color: 'var(--gold)' }}>{ghatak.favourable.luckyStone}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}>Favourable Life Years</span>
                    <span style={{ fontFamily: 'monospace' }}>{ghatak.favourable.goodYears.join(', ')}th years</span>
                  </div>
                </div>
              </div>

              {/* Ghatak Chakra */}
              <div style={{ background: 'var(--surface-alt)', padding: 14, borderRadius: 10, border: '1px solid rgba(217, 119, 54, 0.4)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <ShieldAlert size={16} /> Ghatak Elements (Avoid for Critical Initiations)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}>Ghatak Day (Bad Vara)</span>
                    <strong style={{ color: 'var(--amber)' }}>{ghatak.ghatak.badDay}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}>Ghatak Rashi</span>
                    <strong style={{ color: 'var(--amber)' }}>{ghatak.ghatak.badRasi}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}>Ghatak Lagna</span>
                    <strong>{ghatak.ghatak.badLagna}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}>Ghatak Nakshatra</span>
                    <strong>{ghatak.ghatak.badNakshatra}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}>Ghatak Tithis</span>
                    <strong>{ghatak.ghatak.badTithi}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}>Ghatak Prahar</span>
                    <strong>Prahar {ghatak.ghatak.badPrahar}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}>Ghatak Karan</span>
                    <strong>{ghatak.ghatak.badKaran}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}>Ghatak Yoga</span>
                    <strong>{ghatak.ghatak.badYoga}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}>Adverse Planets for Transit Timing</span>
                    <span style={{ color: 'var(--amber)', fontWeight: 600 }}>{ghatak.ghatak.badPlanets.join(', ')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 1D: MUTUAL PLANETARY ASPECTS */}
      {(filter === 'all' || filter === 'aspects') && (
        <div className="card">
          <div
            onClick={() => toggleSection('aspects')}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              paddingBottom: expandedSections.aspects ? 12 : 0,
              borderBottom: expandedSections.aspects ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Eye size={18} style={{ color: 'var(--gold)' }} />
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--text-main)' }}>
                Mutual Planetary Aspects Matrix
              </h3>
              <span className="gold-badge" style={{ fontSize: 10 }}>
                {aspects.length} Aspects Active
              </span>
            </div>
            {expandedSections.aspects ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>

          {expandedSections.aspects && (
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
              {aspects.map((a, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--surface-alt)',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)' }}>
                      {a.formatted}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      {a.aspect.name} ({a.aspect.angle}°) • Exact Angle: {a.exactAngle}°
                    </div>
                  </div>
                  <span
                    className={
                      a.aspect.weight >= 10
                        ? 'gold-badge'
                        : a.aspect.weight >= 3
                        ? 'teal-badge'
                        : 'amber-badge'
                    }
                    style={{ fontSize: 9 }}
                  >
                    Wt: {a.aspect.weight}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: AVAKAHADA TEMPERAMENT */}
      {(filter === 'all' || filter === 'avakahada') && (
        <div className="card">
          <div
            onClick={() => toggleSection('avakahada')}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              paddingBottom: expandedSections.avakahada ? 12 : 0,
              borderBottom: expandedSections.avakahada ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Compass size={18} style={{ color: 'var(--teal)' }} />
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--text-main)' }}>
                {avkInterpretation.title}
              </h3>
              <span className="teal-badge" style={{ fontSize: 10 }}>
                {avkInterpretation.badge}
              </span>
            </div>
            {expandedSections.avakahada ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>

          {expandedSections.avakahada && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {avkInterpretation.summary}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                {avkInterpretation.bullets.map((bullet, idx) => {
                  const [title, desc] = bullet.split(': ');
                  return (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--surface-alt)',
                        padding: 12,
                        borderRadius: 8,
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle2 size={13} style={{ color: 'var(--teal)' }} />
                        {title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: PLANETARY SIGN & HOUSE PLACEMENTS */}
      {(filter === 'all' || filter === 'planets') && (
        <div className="card">
          <div
            onClick={() => toggleSection('planets')}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              paddingBottom: expandedSections.planets ? 12 : 0,
              borderBottom: expandedSections.planets ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Star size={18} style={{ color: 'var(--gold)' }} />
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--text-main)' }}>
                {planetaryInsights.title}
              </h3>
              <span className="gold-badge" style={{ fontSize: 10 }}>
                {planetaryInsights.badge}
              </span>
            </div>
            {expandedSections.planets ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>

          {expandedSections.planets && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {planetaryInsights.summary}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {planetaryInsights.bullets.map((b, idx) => {
                  const parts = b.split(': ');
                  const header = parts[0];
                  const body = parts.slice(1).join(': ');
                  return (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--surface-alt)',
                        padding: '10px 14px',
                        borderRadius: 8,
                        borderLeft: '3px solid var(--gold)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                        {header}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {body}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: JAIMINI CHARA KARAKAS */}
      {(filter === 'all' || filter === 'karakas') && (
        <div className="card">
          <div
            onClick={() => toggleSection('karakas')}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              paddingBottom: expandedSections.karakas ? 12 : 0,
              borderBottom: expandedSections.karakas ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Feather size={18} style={{ color: 'var(--teal)' }} />
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--text-main)' }}>
                {karakaInsights.title}
              </h3>
              <span className="teal-badge" style={{ fontSize: 10 }}>
                {karakaInsights.badge}
              </span>
            </div>
            {expandedSections.karakas ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>

          {expandedSections.karakas && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {karakaInsights.summary}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 10 }}>
                {karakaInsights.bullets.map((k, idx) => {
                  const [title, desc] = k.split(': ');
                  return (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--surface-alt)',
                        padding: 12,
                        borderRadius: 8,
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Star size={12} style={{ color: 'var(--gold)' }} />
                        {title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 5: ETHICAL GUIDANCE & REFLECTION */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(227, 173, 70, 0.05), rgba(95, 194, 179, 0.05))', border: '1px solid rgba(227, 173, 70, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Lightbulb size={18} style={{ color: 'var(--gold)' }} />
          <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)' }}>
            Parashara & Jaimini Guiding Principles
          </h3>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8 }}>
          Vedic astrology views the natal horoscope as a map of latent psychological predispositions (Sanskars) and time-bound energetic seasons (Dashas). Yogas and planetary placements describe potentials rather than deterministic fates:
        </p>
        <ul style={{ fontSize: 12, color: 'var(--text-main)', paddingLeft: 18, lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <li><strong>Budha-Aditya & Hamsa:</strong> Harness analytical intellect and ethical mentorship to lead collaborative initiatives.</li>
          <li><strong>Gaja-Kesari Yoga:</strong> Deepen wisdom through sustained reading, meditation, and benevolent social contributions.</li>
          <li><strong>Kaal Sarp Alignment:</strong> Channel intense focus toward inner transformation, spiritual equanimity, and authentic self-mastery.</li>
        </ul>
      </div>
    </div>
  );
};
