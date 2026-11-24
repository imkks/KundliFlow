import React, { useMemo, useState } from 'react';
import { X, Calculator, CheckCircle2, ShieldAlert, Clock } from 'lucide-react';
import {
  degToDms,
  computeSpecialNakshatras,
  computeFullNavataraTable,
  evaluateTransitNavatara,
  evaluateKakshyaTransits,
  checkTransitVedha,
  type NatalChart,
  type ShadbalaResult,
  type AshtakvargaResult,
  type DayView,
  type VedicGraha,
  type VedhaCheckResult,
} from '@astro/engine';
import { useReading, type QuantMatrixTabId } from '../context/ReadingContext.tsx';
import { ShadbalaTable } from './ShadbalaTable.tsx';
import { AshtakvargaTable } from './AshtakvargaTable.tsx';
import { FriendshipMatrix } from './FriendshipMatrix.tsx';

interface QuantMatrixModalProps {
  natalChart: NatalChart;
  charaKarakas: Record<string, string>;
  shadbala: ShadbalaResult | null;
  ashtakvarga: AshtakvargaResult | null;
  sevenPlanetSigns: any;
  dayView: DayView | null;
  currentTransits: any;
}

const TABS: Array<{ id: QuantMatrixTabId; label: string }> = [
  { id: 'degrees', label: 'Degrees & Vargas (D1–D60)' },
  { id: 'shadbala', label: 'Shadbala & Bhavabala' },
  { id: 'ashtakvarga', label: 'Ashtakvarga & Maitri' },
  { id: 'radars', label: 'Kakshya · Vedha · Navatara' },
  { id: 'horas', label: '24 Horas, Panchang & Ghatak' },
];

export const QuantMatrixModal: React.FC<QuantMatrixModalProps> = ({
  natalChart,
  charaKarakas,
  shadbala,
  ashtakvarga,
  sevenPlanetSigns,
  dayView,
}) => {
  const {
    quantMatrixTab,
    openQuantMatrix,
    closeQuantMatrix,
    reading,
    selectedPlanet,
    setSelectedPlanet,
    setActiveTab,
  } = useReading();
  const [show27Wheel, setShow27Wheel] = useState(false);

  const transitPlanets = reading?.transits?.planets ?? [];

  const kakshyaData = useMemo(() => {
    if (!transitPlanets.length || !ashtakvarga?.prastara) return null;
    const lons: Record<string, number> = {};
    for (const tp of transitPlanets) {
      if (tp.degInSign !== undefined && tp.signIndex !== undefined) {
        lons[tp.planet] = tp.signIndex * 30 + tp.degInSign;
      } else if (tp.lon !== undefined) {
        lons[tp.planet] = tp.lon;
      }
    }
    return evaluateKakshyaTransits(lons, ashtakvarga.prastara);
  }, [transitPlanets, ashtakvarga]);

  const vedhaData = useMemo(() => {
    if (!transitPlanets.length) return null;
    const allHouses = {} as Record<VedicGraha, number>;
    for (const tp of transitPlanets) {
      if (tp.houseFromMoon !== undefined) {
        allHouses[tp.planet as VedicGraha] = tp.houseFromMoon;
      }
    }
    const results: Record<string, VedhaCheckResult> = {};
    for (const tp of transitPlanets) {
      if (tp.houseFromMoon !== undefined) {
        results[tp.planet] = checkTransitVedha(tp.planet as VedicGraha, tp.houseFromMoon, allHouses);
      }
    }
    return results;
  }, [transitPlanets]);

  const navataraData = useMemo(() => {
    const moonNakIndex = natalChart.grahas.moon?.nakshatraIndex ?? 0;
    const lagnaNakIndex = natalChart.lagna?.nakshatraIndex;
    const natalOccupants = (natalChart.grahasList ?? []).map((g) => ({
      graha: g.id,
      nakshatraIndex: g.nakshatraIndex,
    }));
    const transitOccupants: Array<{ graha: string; nakshatraIndex: number }> = [];
    const transitMap: Partial<Record<VedicGraha, { nakshatraIndex: number }>> = {};
    for (const tp of transitPlanets) {
      let nIdx = tp.nakshatraIndex;
      if (typeof nIdx !== 'number' && tp.signIndex !== undefined && tp.degInSign !== undefined) {
        nIdx = Math.floor((tp.signIndex * 30 + tp.degInSign) / (360 / 27));
      }
      if (typeof nIdx === 'number') {
        transitOccupants.push({ graha: tp.planet, nakshatraIndex: nIdx });
        transitMap[tp.planet as VedicGraha] = { nakshatraIndex: nIdx };
      }
    }
    return {
      specials: computeSpecialNakshatras(moonNakIndex, natalOccupants),
      transitEval: evaluateTransitNavatara({
        natalMoonNakshatraIndex: moonNakIndex,
        natalLagnaNakshatraIndex: lagnaNakIndex,
        transitGrahas: transitMap,
      }),
      fullTable: computeFullNavataraTable(moonNakIndex),
      transitOccupants,
    };
  }, [natalChart, transitPlanets]);

  if (!quantMatrixTab) return null;

  const vargasSummary = reading?.specials?.vargas ?? [];
  const ghatak = reading?.specials?.ghatak;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quant Calculation Matrix"
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeQuantMatrix();
      }}
    >
      <div className="modal-panel" style={{ maxWidth: 1060 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, borderRadius: 10, background: 'rgba(227, 173, 70, 0.14)', color: 'var(--gold)' }}>
              <Calculator size={19} />
            </div>
            <div>
              <h2 className="serif-title" style={{ margin: 0, fontSize: 17, color: 'var(--gold)' }}>
                Quant Calculation Workbench
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Full Nirayana degrees, Virupa strengths, Ashtakvarga Prastara, Kakshya, Vedha, Navatara &amp; 24 Horas.
              </p>
            </div>
          </div>
          <button type="button" onClick={closeQuantMatrix} aria-label="Close Calculation Matrix" style={{ color: 'var(--text-muted)', padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Bar */}
        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-alt)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TABS.map((t) => {
            const active = quantMatrixTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => openQuantMatrix(t.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  background: active ? 'var(--gold)' : 'var(--surface)',
                  color: active ? '#15132b' : 'var(--text-main)',
                  border: active ? '1px solid var(--gold)' : '1px solid var(--border-subtle)',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="modal-body">
          {quantMatrixTab === 'degrees' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card">
                <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)', margin: '0 0 10px 0' }}>
                  Nirayana Planetary Positions &amp; Longitudes (Click row to inspect)
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '8px 6px' }}>Graha</th>
                        <th style={{ padding: '8px 6px' }}>Motion</th>
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
                              setActiveTab('kundli');
                              closeQuantMatrix();
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
                              {g.retrograde ? <span style={{ color: 'var(--amber)', fontWeight: 700 }}>[R]</span> : <span style={{ color: 'var(--text-muted)' }}>Dir</span>}
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
              </div>

              {vargasSummary.length > 0 && (
                <div className="card">
                  <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)', margin: '0 0 10px 0' }}>
                    Divisional Varga Sign Grid (D1–D60)
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '6px' }}>Planet</th>
                          <th style={{ padding: '6px' }}>D1</th>
                          <th style={{ padding: '6px' }}>D2</th>
                          <th style={{ padding: '6px' }}>D4</th>
                          <th style={{ padding: '6px' }}>D7</th>
                          <th style={{ padding: '6px' }}>D9</th>
                          <th style={{ padding: '6px' }}>D10</th>
                          <th style={{ padding: '6px' }}>D12</th>
                          <th style={{ padding: '6px' }}>D24</th>
                          <th style={{ padding: '6px' }}>D60</th>
                          <th style={{ padding: '6px' }}>Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vargasSummary.map((v: any) => (
                          <tr key={v.planet} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '6px', fontWeight: 700, textTransform: 'capitalize', color: 'var(--teal)' }}>{v.planet}</td>
                            <td style={{ padding: '6px', textTransform: 'capitalize' }}>{v.d1 ?? '—'}</td>
                            <td style={{ padding: '6px', textTransform: 'capitalize' }}>{v.d2 ?? '—'}</td>
                            <td style={{ padding: '6px', textTransform: 'capitalize' }}>{v.d4 ?? '—'}</td>
                            <td style={{ padding: '6px', textTransform: 'capitalize' }}>{v.d7 ?? '—'}</td>
                            <td style={{ padding: '6px', textTransform: 'capitalize', fontWeight: 600, color: 'var(--gold)' }}>{v.d9 ?? '—'}</td>
                            <td style={{ padding: '6px', textTransform: 'capitalize' }}>{v.d10 ?? '—'}</td>
                            <td style={{ padding: '6px', textTransform: 'capitalize' }}>{v.d12 ?? '—'}</td>
                            <td style={{ padding: '6px', textTransform: 'capitalize' }}>{v.d24 ?? '—'}</td>
                            <td style={{ padding: '6px', textTransform: 'capitalize' }}>{v.d60 ?? '—'}</td>
                            <td style={{ padding: '6px', color: 'var(--gold)' }}>{v.vargottama ? '★ Vargottama' : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {quantMatrixTab === 'shadbala' && (
            shadbala ? (
              <ShadbalaTable shadbala={shadbala} />
            ) : (
              <div className="card" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Shadbala data unavailable in current view.
              </div>
            )
          )}

          {quantMatrixTab === 'ashtakvarga' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {ashtakvarga && natalChart.lagna && (
                <AshtakvargaTable ashtakvarga={ashtakvarga} lagnaSignIndex={natalChart.lagna.signIndex} />
              )}
              <FriendshipMatrix planetSigns={sevenPlanetSigns} />
            </div>
          )}

          {quantMatrixTab === 'radars' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {kakshyaData && (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0 }}>
                      Kakshya Precision (3°45' Subdivisions) &amp; Gochara Vedha
                    </h3>
                    <span className="teal-badge" style={{ fontSize: 11 }}>
                      Daily Kakshya Score: {kakshyaData.beneficCount}/7 Benefic
                    </span>
                  </div>
                  <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--surface-alt)', fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                    <span>Sun &amp; Saturn do NOT obstruct each other; Moon &amp; Mercury do NOT obstruct each other (Father–Son exemption).</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 8 }}>
                    {kakshyaData.evaluations.map((ev) => {
                      const v = vedhaData?.[ev.planet];
                      return (
                        <div key={ev.planet} style={{ padding: 10, borderRadius: 9, background: 'var(--surface-alt)', border: ev.isBenefic ? '1px solid rgba(95, 194, 179, 0.4)' : '1px solid var(--border-subtle)', fontSize: 11.5, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ textTransform: 'capitalize', color: 'var(--text-main)' }}>{ev.planet} ({ev.degInSign.toFixed(1)}°)</strong>
                            <span className={ev.isBenefic ? 'teal-badge' : 'amber-badge'} style={{ fontSize: 10 }}>{ev.isBenefic ? '1 Bindu ✓' : '0 Bindus'}</span>
                          </div>
                          <div style={{ color: 'var(--text-muted)' }}>
                            Kakshya {ev.kakshyaIndex}/8 ({ev.arcStartDeg}°–{ev.arcEndDeg}°) • Ruler: <strong style={{ color: 'var(--gold)', textTransform: 'capitalize' }}>{ev.kakshyaLord}</strong>
                          </div>
                          {v && (
                            <div style={{ color: v.isFavourableHouse ? (v.isObstructed ? '#f87171' : 'var(--teal)') : 'var(--text-muted)' }}>
                              {v.isFavourableHouse
                                ? v.isObstructed
                                  ? `⚠ Vedha by ${v.obstructingPlanets.join(', ').toUpperCase()} in H${v.obstructingHouse}`
                                  : `✓ Unobstructed H${v.transitHouseFromMoon}`
                                : `Transit H${v.transitHouseFromMoon}`}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0 }}>
                    Navatara (9-Tara) &amp; 11 Special Life Stars
                  </h3>
                  <button type="button" onClick={() => setShow27Wheel((v) => !v)} className="btn btn-outline" style={{ fontSize: 11.5 }}>
                    {show27Wheel ? 'Hide 27-Star Table' : 'View Full 27-Star Table'}
                  </button>
                </div>

                {navataraData.transitEval.lattaAfflictions.length > 0 && (
                  <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldAlert size={15} />
                    <span>
                      <strong>Active Latta:</strong>{' '}
                      {navataraData.transitEval.lattaAfflictions
                        .map((l) => `${String(l.graha).toUpperCase()} strikes ${String(l.kickedNakshatra).toUpperCase()}`)
                        .join(' • ')}
                    </span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(205px, 1fr))', gap: 8 }}>
                  {navataraData.specials.map((s) => {
                    const transitHits = navataraData.transitOccupants
                      .filter((to) => to.nakshatraIndex === s.nakshatraIndex)
                      .map((to) => to.graha);
                    return (
                      <div key={s.def.key} style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)', border: transitHits.length ? '1px solid var(--gold)' : '1px solid var(--border-subtle)', fontSize: 11.5 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: 'var(--text-main)' }}>{s.def.name.split(' ')[0]} (#{s.def.offset})</strong>
                          <span className="gold-badge" style={{ fontSize: 9.5, padding: '1px 6px' }}>{s.def.sanskritName}</span>
                        </div>
                        <div style={{ color: 'var(--gold)', fontWeight: 600, marginTop: 3, textTransform: 'uppercase', fontSize: 11 }}>
                          {String(s.nakshatra).replace('_', ' ')} · {s.navatara.taraLabel}
                        </div>
                        <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{s.def.domain}</div>
                        {transitHits.length > 0 && (
                          <div style={{ marginTop: 4, color: 'var(--teal)', fontWeight: 700, fontSize: 10.5 }}>
                            Transit: {transitHits.map((g) => g.toUpperCase()).join(', ')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {show27Wheel && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                    {navataraData.fullTable.map((item) => (
                      <div key={item.targetNakshatraIndex} style={{ padding: '6px 8px', borderRadius: 6, background: 'var(--surface-alt)', fontSize: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ textTransform: 'capitalize' }}>#{item.offset} {String(item.targetNakshatra).replace('_', ' ')}</span>
                        <span className={item.isFavorable ? 'teal-badge' : item.category === 'mixed' ? 'gold-badge' : 'amber-badge'} style={{ fontSize: 10 }}>
                          {item.taraLabel}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {quantMatrixTab === 'horas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {dayView?.horas && (
                <div className="card">
                  <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={15} /> 24 Unequal Day &amp; Night Planetary Horas
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 8 }}>
                    {dayView.horas.map((h: any) => (
                      <div key={h.index} style={{ background: 'var(--surface-alt)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)', fontSize: 11.5 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-muted)' }}>
                          <span>#{h.index} {h.isDayHora ? 'Day' : 'Night'}</span>
                          <strong style={{ color: 'var(--gold)', textTransform: 'capitalize' }}>{h.lord}</strong>
                        </div>
                        <div style={{ fontWeight: 700, marginTop: 2 }}>
                          {h.startFormatted || h.startIso?.slice(11, 16) || '—'} – {h.endFormatted || h.endIso?.slice(11, 16) || '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dayView?.panchang && (
                <div className="card">
                  <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: '0 0 10px 0' }}>
                    Today&apos;s Full Panchang Breakdown
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, fontSize: 12 }}>
                    <div style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Vara (Weekday)</div>
                      <strong style={{ color: 'var(--gold)' }}>{dayView.panchang.wara.name} ({dayView.panchang.wara.lord.toUpperCase()})</strong>
                    </div>
                    <div style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Tithi</div>
                      <strong>{dayView.panchang.tithi.paksha} {dayView.panchang.tithi.name}</strong>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(dayView.panchang.tithi.elapsedFraction * 100).toFixed(1)}% elapsed</div>
                    </div>
                    <div style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Yoga</div>
                      <strong style={{ color: 'var(--teal)' }}>{dayView.panchang.yoga.name}</strong>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(dayView.panchang.yoga.elapsedFraction * 100).toFixed(1)}% elapsed</div>
                    </div>
                    <div style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Karana</div>
                      <strong>{dayView.panchang.karana.name}</strong>
                      <div style={{ fontSize: 11, color: dayView.panchang.karana.isVishtiBhadra ? 'var(--amber)' : 'var(--teal)' }}>
                        {dayView.panchang.karana.isVishtiBhadra ? '⚠ Vishti Bhadra caution' : '✓ Clear'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {ghatak && (
                <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, fontSize: 12 }}>
                  <div style={{ padding: 12, borderRadius: 10, background: 'rgba(95, 194, 179, 0.08)', border: '1px solid rgba(95, 194, 179, 0.28)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--teal)', marginBottom: 6 }}>✓ Favourable Personal Amplifiers</div>
                    <div><strong>Lucky Number:</strong> {ghatak.luckyNumber}</div>
                    <div><strong>Supportive Days:</strong> {(ghatak.luckyDays ?? []).join(', ')}</div>
                    <div><strong>Gemstone:</strong> {ghatak.luckyStone}</div>
                    {ghatak.luckyMetal && <div><strong>Metal:</strong> {ghatak.luckyMetal}</div>}
                  </div>
                  <div style={{ padding: 12, borderRadius: 10, background: 'rgba(217, 119, 54, 0.08)', border: '1px solid rgba(217, 119, 54, 0.28)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--amber)', marginBottom: 6 }}>⚠ Ghatak Caution Guardrails</div>
                    <div><strong>Ghatak Day:</strong> {ghatak.badDay}</div>
                    <div><strong>Ghatak Rashi:</strong> {ghatak.badRasi}</div>
                    <div><strong>Ghatak Tithi:</strong> {ghatak.badTithi}</div>
                    {ghatak.badNakshatra && <div><strong>Ghatak Nakshatra:</strong> {ghatak.badNakshatra}</div>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
