import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  Crown,
  Sparkles,
  GitBranch,
  ShieldCheck,
  Table2,
  BookOpen,
  Bot,
} from 'lucide-react';
import {
  computeChartVaisheshikamsa,
  degToDms,
  type NatalChart,
  type AvakahadaDetails,
  type ShadbalaResult,
  type AshtakvargaResult,
} from '@astro/engine';
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

type PowerSubMode = 'yogas' | 'power' | 'soul';

export const StrengthsTab: React.FC<StrengthsTabProps> = ({
  natalChart,
  shadbala,
  ashtakvarga,
  sevenPlanetSigns,
  onOpenLlmDossier,
}) => {
  const [subMode, setSubMode] = useState<PowerSubMode>('yogas');

  const {
    reading,
    isGuided,
    isQuant,
    openAskDrawer,
    openPatternDecoder,
    openQuantMatrix,
    openChartSystems,
    openGlossaryModal,
    setDoshaAuditOpen,
  } = useReading();

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
      {/* Sub-mode Switcher + Modal/Tool Actions */}
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
              { id: 'yogas', label: `Yogas & Patterns (${activeYogas.length + activeDoshas.length})` },
              { id: 'power', label: 'Planetary Power (Shadbala & SAV)' },
              { id: 'soul', label: 'Soul Drivers & Harmonics' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSubMode(m.id)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                borderRadius: 7,
                fontWeight: subMode === m.id ? 700 : 500,
                background: subMode === m.id ? 'var(--gold)' : 'transparent',
                color: subMode === m.id ? '#15132b' : 'var(--text-main)',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => openGlossaryModal({ category: 'insights' })}
            className="btn btn-outline"
            style={{ fontSize: 12 }}
          >
            <BookOpen size={13} style={{ color: 'var(--gold)' }} /> Plain Guide
          </button>
          <button
            type="button"
            onClick={onOpenLlmDossier}
            className="btn btn-outline"
            style={{ fontSize: 12 }}
          >
            <Bot size={13} style={{ color: 'var(--teal)' }} /> AI Dossier
          </button>
          <button
            type="button"
            onClick={() => openAskDrawer('Which planets are strongest in Shadbala and how do my Yogas help?')}
            className="btn btn-outline"
            style={{ fontSize: 12 }}
          >
            <HelpCircle size={13} /> Ask AI
          </button>
        </div>
      </div>

      {/* 1. YOGAS & PATTERNS */}
      {subMode === 'yogas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Active Yogas */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0 }}>
                ✦ Active Auspicious Yogas ({activeYogas.length})
              </h3>
              {(cancelledDoshas.length > 0 || clearedDoshas.length > 0) && (
                <button
                  type="button"
                  onClick={() => setDoshaAuditOpen(true)}
                  className="btn btn-outline"
                  style={{ fontSize: 11.5, borderColor: 'rgba(95, 194, 179, 0.4)', color: 'var(--teal)' }}
                >
                  <ShieldCheck size={13} /> Dosha Audit ({cancelledDoshas.length} Cancelled · {clearedDoshas.length} Absent)
                </button>
              )}
            </div>

            {activeYogas.length === 0 ? (
              <div style={{ padding: 14, borderRadius: 10, background: 'var(--surface-alt)', fontSize: 12.5, color: 'var(--text-muted)' }}>
                Your strength flows evenly across houses rather than concentrating in single named yogas. Check Planetary Power to inspect individual house leaders.
              </div>
            ) : (
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
                        <strong style={{ fontSize: 13.5, color: 'var(--teal)' }}>✓ {y.name}</strong>
                        <span className="gold-badge" style={{ fontSize: 10.5, textTransform: 'capitalize' }}>
                          {y.strength}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 4, borderRadius: 3, background: 'var(--surface)', overflow: 'hidden' }}>
                          <div style={{ width: `${strengthPct}%`, height: '100%', background: 'var(--teal)' }} />
                        </div>
                        {!isGuided && <span style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{y.category}</span>}
                      </div>

                      {Array.isArray(y.planets) && y.planets.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {y.planets.map((pl: string) => (
                            <span
                              key={pl}
                              style={{
                                fontSize: 10.5,
                                padding: '2px 7px',
                                borderRadius: 4,
                                background: 'var(--surface)',
                                border: '1px solid var(--border-subtle)',
                                textTransform: 'capitalize',
                              }}
                            >
                              {pl}
                            </span>
                          ))}
                        </div>
                      )}

                      {!isGuided && (
                        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45, color: 'var(--text-muted)' }}>{y.description}</p>
                      )}
                      <div style={{ fontSize: 12.5, color: 'var(--text-main)', lineHeight: 1.5 }}>
                        <strong style={{ color: 'var(--gold)' }}>Meaning: </strong>
                        {y.plainMeaning ?? y.effect}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 4 }}>
                        {!isGuided ? (
                          <button
                            type="button"
                            onClick={() => openPatternDecoder({ kind: 'yoga', yoga: y })}
                            style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <GitBranch size={12} /> Trace Pattern
                          </button>
                        ) : <span />}
                        <button
                          type="button"
                          onClick={() => openAskDrawer(`How and when does my ${y.name} activate in my chart?`)}
                          style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)' }}
                        >
                          Ask AI →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Doshas / Intensity Patterns */}
          {activeDoshas.length > 0 && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, border: '1px solid rgba(217, 119, 54, 0.45)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--amber)', margin: 0 }}>
                  ⚠ {isGuided ? 'Growth & Intensity Patterns' : 'Active Doshas Requiring Awareness'} ({activeDoshas.length})
                </h3>
                <span className="amber-badge" style={{ fontSize: 10.5 }}>Awareness &amp; Balance</span>
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
                      <strong style={{ fontSize: 13.5, color: 'var(--amber)' }}>⚠ {y.name}</strong>
                      <span className="amber-badge" style={{ fontSize: 10.5, textTransform: 'capitalize' }}>
                        {y.strength}
                      </span>
                    </div>
                    {!isGuided && <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45, color: 'var(--text-muted)' }}>{y.description}</p>}
                    <div style={{ fontSize: 12.5, color: 'var(--text-main)', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--gold)' }}>Guidance: </strong>
                      {y.plainMeaning ?? y.effect}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 4 }}>
                      {!isGuided ? (
                        <button
                          type="button"
                          onClick={() => openPatternDecoder({ kind: 'yoga', yoga: y })}
                          style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <GitBranch size={12} /> Trace Pattern
                        </button>
                      ) : <span />}
                      <button
                        type="button"
                        onClick={() => openAskDrawer(`How should I navigate or balance my ${y.name} practically?`)}
                        style={{ fontSize: 11, fontWeight: 600, color: 'var(--amber)' }}
                      >
                        Ask AI how to balance →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PLANETARY POWER (SHADBALA + SAV + MODAL QUANT TABLES) */}
      {subMode === 'power' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {strengthsSummary && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0 }}>
                  <GlossaryTerm term="Shadbala">Shadbala</GlossaryTerm> Planetary Horsepower
                </h3>
                <button type="button" onClick={() => openQuantMatrix('shadbala')} className="btn btn-outline" style={{ fontSize: 11.5 }}>
                  <Table2 size={13} style={{ color: 'var(--gold)' }} /> Virupas &amp; Bhavabala Table ↗
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                {strengthsSummary.planets.map((p: any) => {
                  const g = (natalChart.grahas as any)[p.planet];
                  const houseLagna = g?.houses?.houseFromLagna ?? g?.houseFromLagna;
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

                      <div style={{ position: 'relative', height: 6, borderRadius: 4, background: 'var(--surface)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: barColor }} />
                        <div
                          title="1.0x Required Strength Minimum"
                          style={{ position: 'absolute', left: `${thresholdPct}%`, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.65)' }}
                        />
                      </div>

                      {g && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {g.sign}{houseLagna ? ` (H${houseLagna})` : ''} • {degToDms(g.degInSign)} • {g.dignity}
                        </div>
                      )}

                      {!isGuided && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, fontSize: 10.5 }}>
                          <span className="gold-badge" style={{ fontSize: 10.5 }}>Age: {p.baladi}</span>
                          <span className="teal-badge" style={{ fontSize: 10.5 }}>Mood: {p.deeptadi}</span>
                        </div>
                      )}
                      <div style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--text-main)' }}>{p.plainSummary}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {strengthsSummary && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0 }}>
                  <GlossaryTerm term="SAV">Sarvashtakavarga (SAV)</GlossaryTerm> 12-Sign Support (28 = Avg)
                </h3>
                <button type="button" onClick={() => openQuantMatrix('ashtakvarga')} className="btn btn-outline" style={{ fontSize: 11.5 }}>
                  <Table2 size={13} style={{ color: 'var(--teal)' }} /> BAV/SAV, Prastara &amp; Maitri ↗
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8 }}>
                {strengthsSummary.savTopSigns.map((s: any, idx: number) => {
                  const pct = Math.min(100, Math.round((s.bindus / 42) * 100));
                  const color = s.bindus >= 30 ? 'var(--teal)' : s.bindus <= 22 ? 'var(--amber)' : 'var(--gold)';
                  return (
                    <div key={s.sign} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--surface-alt)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <strong style={{ textTransform: 'capitalize' }}>#{idx + 1} {s.sign}</strong>
                        <span style={{ fontWeight: 700, color }}>{s.bindus} bindus</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 4, background: 'var(--surface)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quant Inline Full Tables */}
          {isQuant && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {shadbala && <ShadbalaTable shadbala={shadbala} />}
              {ashtakvarga && natalChart.lagna && (
                <AshtakvargaTable ashtakvarga={ashtakvarga} lagnaSignIndex={natalChart.lagna.signIndex} />
              )}
              <FriendshipMatrix planetSigns={sevenPlanetSigns} />
            </div>
          )}
        </div>
      )}

      {/* 3. SOUL DRIVERS & HARMONICS */}
      {subMode === 'soul' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {specialsSummary && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0 }}>
                  Jaimini <GlossaryTerm term="Chara Karaka">Chara Karakas</GlossaryTerm> (Soul &amp; Life Drivers)
                </h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => openQuantMatrix('degrees')} className="btn btn-outline" style={{ fontSize: 11.5 }}>
                    Full D1–D60 Matrix ↗
                  </button>
                  <button type="button" onClick={() => openChartSystems('varshaphal')} className="btn btn-outline" style={{ fontSize: 11.5 }}>
                    Arudha Padas &amp; Upagrahas ↗
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                {specialsSummary.karakas.map((k: any) => {
                  const g = (natalChart.grahas as any)[String(k.graha).toLowerCase()];
                  const hLagna = g?.houses?.houseFromLagna ?? g?.houseFromLagna;
                  return (
                    <div key={k.code} style={{ padding: 11, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: 'var(--teal)' }}>
                          {k.code} • {k.graha.toUpperCase()}
                        </span>
                        {g && <span className="gold-badge" style={{ fontSize: 10.5 }}>{degToDms(g.degInSign)}</span>}
                      </div>
                      {g && (
                        <div style={{ fontSize: 11.5, color: 'var(--gold)', textTransform: 'capitalize' }}>
                          {g.sign}{hLagna ? ` (H${hLagna})` : ''} • {g.nakshatra}
                        </div>
                      )}
                      <div style={{ fontSize: 12, marginTop: 2, lineHeight: 1.45, color: 'var(--text-main)' }}>{k.meaning}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vaisheshikamsa */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Crown size={16} style={{ color: 'var(--gold)' }} />
                Vaisheshikamsa (10-Varga Dignity)
              </h3>
              <span className="teal-badge" style={{ fontSize: 11 }}>Parashara Dasavarga</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10 }}>
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
                      <span style={{ fontWeight: 700, textTransform: 'capitalize', fontSize: 13 }}>{key}</span>
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
                      <div style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 600 }}>✦ Vargottama (D1 = D9)</div>
                    )}
                    {item.summary && (
                      <div style={{ fontSize: 11.5, color: 'var(--text-main)', marginTop: 2, lineHeight: 1.4 }}>{item.summary}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pushkara Healing Degrees */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} style={{ color: 'var(--amber)' }} />
                Pushkara Navamsha &amp; Pushkara Bhaga (Regenerative Degrees)
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10 }}>
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
                      <span style={{ fontWeight: 700, textTransform: 'capitalize', fontSize: 13 }}>{key}</span>
                      {isSpecial ? (
                        <span className={p.isPushkaraBhaga ? 'gold-badge' : 'teal-badge'} style={{ fontSize: 10.5 }}>
                          {p.isPushkaraBhaga ? 'Pushkara Bhaga' : 'Pushkara Navamsha'}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Standard</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      D9: {p.navamshaSign} (Lord {p.navamshaLord}) • {p.degInSign.toFixed(2)}°
                    </div>
                    <div style={{ fontSize: 11.5, color: isSpecial ? 'var(--text-main)' : 'var(--text-muted)', lineHeight: 1.4 }}>
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
