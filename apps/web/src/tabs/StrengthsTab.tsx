import React, { useState, useMemo } from 'react';
import { HelpCircle, ChevronDown, ChevronRight, Crown, Sparkles } from 'lucide-react';
import {
  computeCharaKarakas,
  computeChartVaisheshikamsa,
  degToDms,
  type NatalChart,
  type AvakahadaDetails,
  type ShadbalaResult,
  type AshtakvargaResult,
} from '@astro/engine';
import { InterpretationsGuide } from '../components/InterpretationsGuide.tsx';
import { ShadbalaTable } from '../components/ShadbalaTable.tsx';
import { AshtakvargaTable } from '../components/AshtakvargaTable.tsx';
import { FriendshipMatrix } from '../components/FriendshipMatrix.tsx';
import { useReading } from '../context/ReadingContext.tsx';
import { GlossaryTerm } from '../components/GlossaryTerm.tsx';

interface StrengthsTabProps {
  natalChart: NatalChart;
  avakahada: AvakahadaDetails | null;
  shadbala: ShadbalaResult | null;
  ashtakvarga: AshtakvargaResult | null;
  sevenPlanetSigns: any;
  serverLevel1?: any;
  onOpenLlmDossier: () => void;
}

type StrengthsSubMode = 'yogas' | 'shadbala' | 'ashtakvarga' | 'karakas' | 'vargas';

export const StrengthsTab: React.FC<StrengthsTabProps> = ({
  natalChart,
  avakahada,
  shadbala,
  ashtakvarga,
  sevenPlanetSigns,
  serverLevel1,
  onOpenLlmDossier,
}) => {
  const [subMode, setSubMode] = useState<StrengthsSubMode>('yogas');
  const [showRawShadbala, setShowRawShadbala] = useState(false);
  const [showFullReference, setShowFullReference] = useState(false);
  const { reading, openAskDrawer } = useReading();

  const yogasReadings = reading?.yogas ?? [];
  const activeYogas = yogasReadings.filter((y: any) => y.presence !== false && y.category !== 'dosha');
  const activeDoshas = yogasReadings.filter((y: any) => y.presence !== false && y.category === 'dosha' && y.strength !== 'cancelled');
  const cancelledDoshas = yogasReadings.filter((y: any) => y.category === 'dosha' && (y.strength === 'cancelled' || y.cancellationNote));
  const clearedDoshas = yogasReadings.filter((y: any) => y.category === 'dosha' && y.presence === false);
  const strengthsSummary = reading?.strengths;
  const specialsSummary = reading?.specials;

  const vaisheshikamsaData = useMemo(() => {
    try {
      return computeChartVaisheshikamsa(natalChart);
    } catch {
      return {};
    }
  }, [natalChart]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Sub-mode Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
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
              { id: 'yogas', label: `Yogas & Doshas (${activeYogas.length + activeDoshas.length} Active)` },
              { id: 'shadbala', label: 'Shadbala & Avasthas' },
              { id: 'ashtakvarga', label: 'Ashtakvarga & Friendship' },
              { id: 'karakas', label: 'Karakas & Arudhas' },
              { id: 'vargas', label: 'Vaisheshikamsa & Pushkara' },
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
        </div>

        <button
          onClick={() => openAskDrawer('Which planets are strongest in Shadbala and how do my Yogas help?')}
          className="btn btn-outline"
          style={{ fontSize: 12 }}
        >
          <HelpCircle size={13} /> Ask AI about Strengths
        </button>
      </div>

      {/* 1. YOGAS & DOSHAS */}
      {subMode === 'yogas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Section 1: Active Auspicious Yogas */}
          {activeYogas.length > 0 && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0 }}>
                  ✦ Active Auspicious Yogas in Your Chart ({activeYogas.length})
                </h3>
                <span className="gold-badge" style={{ fontSize: 10.5 }}>
                  Verified Formation in Rashi (D1)
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 10 }}>
                {activeYogas.map((y: any) => {
                  const strengthKey = String(y.strength ?? 'moderate').toLowerCase();
                  const strengthPct = strengthKey.includes('strong') || strengthKey.includes('high') ? 92 : strengthKey.includes('mild') || strengthKey.includes('low') ? 40 : 68;
                  return (
                    <div
                      key={y.id}
                      style={{
                        padding: 13,
                        borderRadius: 10,
                        background: 'var(--surface-alt)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 7,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                        <strong style={{ fontSize: 13.5, color: 'var(--teal)' }}>
                          ✓ {y.name}
                        </strong>
                        <span className="gold-badge" style={{ fontSize: 10, textTransform: 'capitalize' }}>
                          {y.category} • {y.strength}
                        </span>
                      </div>

                      {/* Strength Meter Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 4, borderRadius: 3, background: 'var(--surface)', overflow: 'hidden' }}>
                          <div style={{ width: `${strengthPct}%`, height: '100%', background: 'var(--teal)', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {y.strength}
                        </span>
                      </div>

                      {Array.isArray(y.planets) && y.planets.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {y.planets.map((pl: string) => (
                            <span
                              key={pl}
                              style={{
                                fontSize: 10,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: 'var(--surface)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-main)',
                                textTransform: 'capitalize',
                              }}
                            >
                              {pl}
                            </span>
                          ))}
                        </div>
                      )}

                      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45, color: 'var(--text-muted)' }}>{y.description}</p>
                      <div style={{ fontSize: 12, color: 'var(--text-main)', lineHeight: 1.45 }}>
                        <strong style={{ color: 'var(--gold)' }}>Meaning: </strong>
                        {y.plainMeaning ?? y.effect}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: 2 }}>
                        <button
                          onClick={() => openAskDrawer(`How and when does my ${y.name} activate in my chart?`)}
                          style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 10.5, fontWeight: 600, color: 'var(--teal)', cursor: 'pointer' }}
                        >
                          Ask AI how to activate →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Active Doshas Needing Care */}
          {activeDoshas.length > 0 && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, border: '1px solid rgba(217, 119, 54, 0.45)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--amber)', margin: 0 }}>
                  ⚠ Active Doshas Requiring Awareness ({activeDoshas.length})
                </h3>
                <span className="amber-badge" style={{ fontSize: 10.5 }}>
                  Active Planetary Tension
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 10 }}>
                {activeDoshas.map((y: any) => (
                  <div
                    key={y.id}
                    style={{
                      padding: 13,
                      borderRadius: 10,
                      background: 'var(--surface-alt)',
                      border: '1px solid rgba(217, 119, 54, 0.45)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 7,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                      <strong style={{ fontSize: 13.5, color: 'var(--amber)' }}>
                        ⚠ {y.name}
                      </strong>
                      <span className="amber-badge" style={{ fontSize: 10, textTransform: 'capitalize' }}>
                        Dosha • {y.strength}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45, color: 'var(--text-muted)' }}>{y.description}</p>
                    <div style={{ fontSize: 12, color: 'var(--text-main)', lineHeight: 1.45 }}>
                      <strong style={{ color: 'var(--gold)' }}>Guidance: </strong>
                      {y.plainMeaning ?? y.effect}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: 2 }}>
                      <button
                        onClick={() => openAskDrawer(`How should I navigate or balance my ${y.name} practically?`)}
                        style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 10.5, fontWeight: 600, color: 'var(--amber)', cursor: 'pointer' }}
                      >
                        Ask AI how to balance →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Classically Cancelled Doshas (Bhanga) */}
          {cancelledDoshas.length > 0 && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--teal)', margin: 0 }}>
                  ✓ Classical Cancellations (Bhanga into Raja Yoga) ({cancelledDoshas.length})
                </h3>
                <span className="teal-badge" style={{ fontSize: 10.5 }}>
                  Dosha Neutralized by Parashari Shield
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
                {cancelledDoshas.map((y: any) => (
                  <div
                    key={y.id}
                    style={{
                      padding: 11,
                      borderRadius: 8,
                      background: 'var(--surface-alt)',
                      border: '1px solid rgba(95, 194, 179, 0.35)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      fontSize: 11.5,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                      <strong style={{ color: 'var(--teal)' }}>✓ {y.name}</strong>
                      <span className="teal-badge" style={{ fontSize: 9.5 }}>
                        Bhanga (Cancelled)
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>{y.description}</div>
                    {y.cancellationNote && (
                      <div style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 600 }}>
                        Cancellation: {y.cancellationNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Verified Absent Doshas (Clean Bill of Health) */}
          {clearedDoshas.length > 0 && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--text-main)', margin: 0 }}>
                  ✓ Verified Absent Doshas — Clean Bill of Astrological Health ({clearedDoshas.length})
                </h3>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Rigorous classical checks confirmed absent in your chart
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                {clearedDoshas.map((y: any) => (
                  <div
                    key={y.id}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      fontSize: 11.5,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                      <strong style={{ color: 'var(--text-main)' }}>{y.name}</strong>
                      <span className="teal-badge" style={{ fontSize: 9.5 }}>
                        ✓ Cleared / Absent
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>{y.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {avakahada && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <button
                  onClick={() => setShowFullReference((v) => !v)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    color: 'var(--gold)',
                  }}
                >
                  <span className="serif-title" style={{ fontSize: 14 }}>
                    Deep Classical Reference Guide (Avakahada, Aspects &amp; Full Blueprint)
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    {showFullReference ? 'Hide' : 'Expand'}
                    {showFullReference ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </span>
                </button>
                <button onClick={onOpenLlmDossier} className="btn btn-outline" style={{ fontSize: 11.5 }}>
                  Export Full AI Dossier
                </button>
              </div>
              {showFullReference && (
                <div style={{ marginTop: 14 }}>
                  <InterpretationsGuide
                    natalChart={natalChart}
                    avakahada={avakahada}
                    karakas={serverLevel1?.karakas ?? computeCharaKarakas(natalChart.grahas)}
                    serverLevel1={serverLevel1}
                    onOpenLlmDossier={onOpenLlmDossier}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. SHADBALA & AVASTHAS */}
      {subMode === 'shadbala' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {strengthsSummary && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0 }}>
                <GlossaryTerm term="Shadbala">Shadbala</GlossaryTerm> Horsepower &amp; Planetary Avasthas (Level 2)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                {strengthsSummary.planets.map((p: any) => {
                  const g = (natalChart.grahas as any)[p.planet];
                  const ratioNum = Number(p.ratio ?? 0);
                  const pct = Math.min(100, Math.round((ratioNum / 1.6) * 100));
                  const thresholdPct = Math.round((1.0 / 1.6) * 100);
                  const barColor = ratioNum >= 1.15 ? 'var(--teal)' : ratioNum >= 1.0 ? 'var(--gold)' : 'var(--amber)';
                  return (
                    <div
                      key={p.planet}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        background: 'var(--surface-alt)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 13 }}>
                        <span style={{ textTransform: 'capitalize', color: 'var(--teal)' }}>
                          {p.planet} <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 11 }}>(Rank #{p.rank})</span>
                        </span>
                        <span style={{ color: barColor }}>
                          {ratioNum >= 1 ? '✓' : '⚠'} {p.ratio}x ({p.rupas}R)
                        </span>
                      </div>

                      {/* Shadbala Ratio Gauge with 1.0x threshold */}
                      <div style={{ position: 'relative', height: 6, borderRadius: 4, background: 'var(--surface)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 4 }} />
                        <div
                          title="1.0x Required Strength Minimum"
                          style={{
                            position: 'absolute',
                            left: `${thresholdPct}%`,
                            top: 0,
                            bottom: 0,
                            width: 2,
                            background: 'rgba(255,255,255,0.65)',
                          }}
                        />
                      </div>

                      {g && (
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {g.sign} (H{g.houseFromLagna}) • {degToDms(g.degInSign)} • {g.dignity}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, fontSize: 10.5 }}>
                        <span className="gold-badge" style={{ fontSize: 10 }}>Age: {p.baladi}</span>
                        <span className="teal-badge" style={{ fontSize: 10 }}>Mood: {p.deeptadi}</span>
                      </div>
                      <div style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--text-main)' }}>{p.plainSummary}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {shadbala && (
            <div className="card">
              <button
                onClick={() => setShowRawShadbala((v) => !v)}
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
                <span className="serif-title" style={{ fontSize: 14 }}>Full Shadbala &amp; Bhavabala Calculation Table</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {showRawShadbala ? 'Hide calculation' : 'Show calculation'}
                  {showRawShadbala ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </span>
              </button>
              {showRawShadbala && (
                <div style={{ marginTop: 12 }}>
                  <ShadbalaTable shadbala={shadbala} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. ASHTAKVARGA & FRIENDSHIP */}
      {subMode === 'ashtakvarga' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {strengthsSummary && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0 }}>
                <GlossaryTerm term="SAV">Sarvashtakavarga (SAV)</GlossaryTerm> 12-House Strength Leaderboard (28 = Average)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                {strengthsSummary.savTopSigns.map((s: any, idx: number) => {
                  const pct = Math.min(100, Math.round((s.bindus / 42) * 100));
                  const color = s.bindus >= 30 ? 'var(--teal)' : s.bindus <= 22 ? 'var(--amber)' : 'var(--gold)';
                  return (
                    <div key={s.sign} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--surface-alt)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <strong style={{ textTransform: 'capitalize', color: 'var(--text-main)' }}>
                          #{idx + 1} {s.sign}
                        </strong>
                        <span style={{ fontWeight: 700, color }}>{s.bindus} bindus</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 4, background: 'var(--surface)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {ashtakvarga && natalChart.lagna && (
            <AshtakvargaTable ashtakvarga={ashtakvarga} lagnaSignIndex={natalChart.lagna.signIndex} />
          )}

          <FriendshipMatrix planetSigns={sevenPlanetSigns} />
        </div>
      )}

      {/* 4. KARAKAS, VARGAS & GUARDRAILS */}
      {subMode === 'karakas' && specialsSummary && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: '0 0 10px 0' }}>
              Jaimini <GlossaryTerm term="Chara Karaka">Chara Karakas</GlossaryTerm> (Soul &amp; Life Drivers)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
              {specialsSummary.karakas.map((k: any) => {
                const g = (natalChart.grahas as any)[String(k.graha).toLowerCase()];
                return (
                  <div key={k.code} style={{ padding: 11, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: 'var(--teal)' }}>
                        {k.code} • {k.graha.toUpperCase()}
                      </span>
                      {g && (
                        <span className="gold-badge" style={{ fontSize: 10 }}>
                          {degToDms(g.degInSign)}
                        </span>
                      )}
                    </div>
                    {g && (
                      <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'capitalize' }}>
                        {g.sign} (H{g.houseFromLagna}) • {g.nakshatra}
                      </div>
                    )}
                    <div style={{ fontSize: 11.5, marginTop: 2, lineHeight: 1.45, color: 'var(--text-main)' }}>{k.meaning}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {Array.isArray(specialsSummary.arudhas) && specialsSummary.arudhas.length > 0 && (
            <div className="card">
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: '0 0 10px 0' }}>
                Arudha Padas (How the World Sees You)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                {specialsSummary.arudhas.map((a: any) => {
                  const roleLabel =
                    a.code === 'AL'
                      ? 'Public Image & Status'
                      : a.code === 'UL'
                      ? 'Marriage & Committed Bond'
                      : a.code === 'A7'
                      ? 'Business & Partnerships'
                      : a.code === 'A10'
                      ? 'Career Reputation'
                      : a.name ?? a.code;
                  return (
                    <div key={a.code} style={{ padding: 10, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', fontSize: 12 }}>
                      <div style={{ fontWeight: 700, color: 'var(--teal)' }}>
                        {a.code} • {roleLabel}
                      </div>
                      <div style={{ fontSize: 12, marginTop: 4, textTransform: 'capitalize', color: 'var(--gold)', fontWeight: 600 }}>
                        {a.sign} (House {a.houseFromLagna})
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: '0 0 10px 0' }}>
              Divisional Charts (D1–D60) &amp; <GlossaryTerm term="Vargottama" />
            </h3>
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

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0 }}>
              Favourable Amplifiers &amp; Ghatak Caution Guardrails
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              <div style={{ padding: 12, borderRadius: 10, background: 'rgba(95, 194, 179, 0.08)', border: '1px solid rgba(95, 194, 179, 0.28)', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase' }}>
                  ✓ Favourable Amplifiers
                </div>
                <div><strong>Lucky Number:</strong> {specialsSummary.ghatak.luckyNumber}</div>
                <div><strong>Supportive Days:</strong> {(specialsSummary.ghatak.luckyDays ?? []).join(', ')}</div>
                <div><strong>Gemstone Resonance:</strong> {specialsSummary.ghatak.luckyStone}</div>
                {specialsSummary.ghatak.luckyMetal && (
                  <div><strong>Supportive Metal:</strong> {specialsSummary.ghatak.luckyMetal}</div>
                )}
                {Array.isArray(specialsSummary.ghatak.goodPlanets) && specialsSummary.ghatak.goodPlanets.length > 0 && (
                  <div><strong>Friendly Planets:</strong> {specialsSummary.ghatak.goodPlanets.join(', ')}</div>
                )}
              </div>

              <div style={{ padding: 12, borderRadius: 10, background: 'rgba(217, 119, 54, 0.08)', border: '1px solid rgba(217, 119, 54, 0.28)', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase' }}>
                  ⚠ Ghatak Guardrails (Avoid Major Launches)
                </div>
                <div><strong>Ghatak Day:</strong> {specialsSummary.ghatak.badDay}</div>
                <div><strong>Ghatak Rashi (Moon Sign):</strong> {specialsSummary.ghatak.badRasi}</div>
                <div><strong>Ghatak Tithi:</strong> {specialsSummary.ghatak.badTithi}</div>
                {specialsSummary.ghatak.badNakshatra && (
                  <div><strong>Ghatak Nakshatra:</strong> {specialsSummary.ghatak.badNakshatra}</div>
                )}
                {specialsSummary.ghatak.badLagna && (
                  <div><strong>Ghatak Lagna:</strong> {specialsSummary.ghatak.badLagna}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. VAISHESHIKAMSA & PUSHKARA GRACE */}
      {subMode === 'vargas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Card 1: Vaisheshikamsa (10-Varga Dignity Leaderboard) */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Crown size={16} style={{ color: 'var(--gold)' }} />
                Vaisheshikamsa (10-Varga Royal Dignity Leaderboard)
              </h3>
              <span className="teal-badge" style={{ fontSize: 11 }}>Parashara Dasavarga • PVR Rao Ch. 6</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              A planet's true capacity to manifest lasting status, wealth, and authority is evaluated across the 10 divisional charts (<strong>D1, D2, D3, D7, D9, D10, D12, D16, D30, D60</strong>). Count of own, exalted, or moolatrikona signs determines its classical Vaisheshikamsa rank (Parijata to Sreedhama).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
              {Object.entries(vaisheshikamsaData).map(([key, item]) => {
                const isHigh = item.vargaCount >= 4;
                const isMid = item.vargaCount >= 2;
                return (
                  <div
                    key={key}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      background: 'var(--surface-alt)',
                      border: isHigh ? '1px solid var(--gold)' : isMid ? '1px solid var(--teal)' : '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-main)', fontSize: 13 }}>
                        {key}
                      </span>
                      {item.tierName && (
                        <span className={isHigh ? 'gold-badge' : isMid ? 'teal-badge' : 'badge'} style={{ fontSize: 10.5 }}>
                          {item.tierName}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Dignified in {item.vargaCount}/10 Vargas {item.dignifiedVargas.length ? `(${item.dignifiedVargas.join(', ')})` : ''}
                    </div>
                    {item.vargottama && (
                      <div style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 600 }}>
                        ✦ Vargottama (same sign in D1 &amp; D9)
                      </div>
                    )}
                    {item.summary && (
                      <div style={{ fontSize: 11.5, color: 'var(--text-main)', marginTop: 2, lineHeight: 1.35 }}>
                        {item.summary}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Pushkara Navamsha & Pushkara Bhaga (Nectar of Recovery) */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} style={{ color: 'var(--amber)' }} />
                Pushkara Navamsha &amp; Pushkara Bhaga (The Healing Degrees)
              </h3>
              <span className="gold-badge" style={{ fontSize: 11 }}>Jataka Parijata • Dr. K.S. Charak</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              The 24 Pushkara Navamshas and exact Pushkara Bhagas in the zodiac are governed exclusively by natural benefics (Moon, Mercury, Venus, Jupiter). Any planet situated here gains extraordinary regenerative healing (Amrita) and resilience, turning even debilitated or stressed placements into sources of turnaround.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
              {Object.entries(vaisheshikamsaData).map(([key, item]) => {
                const p = item.pushkara;
                const isSpecial = p.isPushkaraNavamsha || p.isPushkaraBhaga;
                return (
                  <div
                    key={key}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      background: 'var(--surface-alt)',
                      border: p.isPushkaraBhaga ? '1px solid var(--gold)' : p.isPushkaraNavamsha ? '1px solid var(--teal)' : '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-main)', fontSize: 13 }}>
                        {key}
                      </span>
                      {isSpecial ? (
                        <span className={p.isPushkaraBhaga ? 'gold-badge' : 'teal-badge'} style={{ fontSize: 10.5 }}>
                          {p.isPushkaraBhaga ? 'Pushkara Bhaga' : 'Pushkara Navamsha'}
                        </span>
                      ) : (
                        <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Standard</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      D9 Navamsha: {p.navamshaSign} (Lord {p.navamshaLord}) • {p.degInSign.toFixed(2)}°
                    </div>
                    <div style={{ fontSize: 11.5, color: isSpecial ? 'var(--text-main)' : 'var(--text-muted)', lineHeight: 1.35 }}>
                      {p.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
