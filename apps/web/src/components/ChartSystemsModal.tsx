import React from 'react';
import { X, Compass, Layers, Calendar, Clock, Sparkles } from 'lucide-react';
import {
  type NatalChart,
  type ChalitChart,
  type AvakahadaDetails,
} from '@astro/engine';
import { useReading, type ChartSystemTabId } from '../context/ReadingContext.tsx';
import { DualKundliChart } from './DualKundliChart.tsx';
import { BhavaDossierExplorer } from './BhavaDossierExplorer.tsx';
import { ChalitTable } from './ChalitTable.tsx';
import { KpTable } from './KpTable.tsx';
import { SpecialLagnasAndVarshaphal } from './SpecialLagnasAndVarshaphal.tsx';
import { GlossaryTerm } from './GlossaryTerm.tsx';

interface ChartSystemsModalProps {
  profileId: string | null;
  natalChart: NatalChart;
  currentTransits: any;
  chalit: ChalitChart | null;
  panchang: any;
  avakahada: AvakahadaDetails | null;
  birthDate: string;
  birthTime: string;
  tzId: string;
  chartStyle: 'north' | 'south';
}

const SYSTEM_TABS: Array<{ id: ChartSystemTabId; label: string }> = [
  { id: 'dual', label: 'Dual Transit Overlay' },
  { id: 'bhavas', label: 'Bhava Chalit' },
  { id: 'kp', label: 'KP System' },
  { id: 'varshaphal', label: 'Varshaphal, Arudhas & Sahams' },
  { id: 'birth', label: 'Birth Panchang & Avakahada' },
];

export const ChartSystemsModal: React.FC<ChartSystemsModalProps> = ({
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
}) => {
  const {
    chartSystemsTab,
    openChartSystems,
    closeChartSystems,
    selectedHouse,
    setSelectedHouse,
    reading,
    openAskDrawer,
  } = useReading();

  if (!chartSystemsTab) return null;

  const chalitShifts = reading?.kundliExtras?.chalitShifts ?? [];
  const kpCusps = reading?.kundliExtras?.kpCusps ?? [];
  const varshaphalL2 = reading?.kundliExtras?.varshaphal;
  const upagrahas = reading?.specials?.upagrahas ?? [];
  const arudhas = reading?.specials?.arudhas ?? [];
  const panchangL2 = reading?.panchang;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Advanced Chart Systems"
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeChartSystems();
      }}
    >
      <div className="modal-panel" style={{ maxWidth: 1020 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, borderRadius: 10, background: 'rgba(95, 194, 179, 0.14)', color: 'var(--teal)' }}>
              <Layers size={19} />
            </div>
            <div>
              <h2 className="serif-title" style={{ margin: 0, fontSize: 17, color: 'var(--gold)' }}>
                Advanced Chart Systems &amp; Birth Profile
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Dual Gochar overlay, Sripati Bhava Chalit, KP Sub-Lords, Tajika Varshaphal, Arudhas &amp; Birth Panchang.
              </p>
            </div>
          </div>
          <button type="button" onClick={closeChartSystems} aria-label="Close Chart Systems" style={{ color: 'var(--text-muted)', padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Strip */}
        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-alt)', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SYSTEM_TABS.map((t) => {
              const active = chartSystemsTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => openChartSystems(t.id)}
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
          <button
            type="button"
            onClick={() => {
              closeChartSystems();
              openAskDrawer(`Explain what my ${SYSTEM_TABS.find((t) => t.id === chartSystemsTab)?.label} reveals right now.`);
            }}
            className="btn btn-outline"
            style={{ fontSize: 11.5 }}
          >
            <Sparkles size={13} style={{ color: 'var(--teal)' }} /> Ask AI
          </button>
        </div>

        <div className="modal-body">
          {chartSystemsTab === 'dual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <DualKundliChart
                natalChart={natalChart}
                transits={currentTransits}
                selectedHouse={selectedHouse}
                onSelectHouse={setSelectedHouse}
                defaultChartStyle={chartStyle}
              />
              <BhavaDossierExplorer
                natalChart={natalChart}
                transits={currentTransits}
                selectedHouse={selectedHouse}
                onSelectHouse={setSelectedHouse}
              />
            </div>
          )}

          {chartSystemsTab === 'bhavas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card">
                <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: '0 0 8px 0' }}>
                  Bhava Chalit House Shifts
                </h3>
                {chalitShifts.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                    No planets shift house between D1 Rashi and Sripati Chalit — your sign placements align cleanly with cusp houses.
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
            </div>
          )}

          {chartSystemsTab === 'kp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {kpCusps.length > 0 && (
                <div className="card">
                  <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: '0 0 10px 0' }}>
                    KP Key Cusp <GlossaryTerm term="SubLord">Sub-Lords</GlossaryTerm>
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

          {chartSystemsTab === 'varshaphal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {varshaphalL2 && (
                <div className="card">
                  <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={15} /> Annual Varshaphal ({varshaphalL2.targetYear} • Age {varshaphalL2.completedAge})
                  </h3>
                  <p style={{ fontSize: 12.5, lineHeight: 1.5, margin: '0 0 8px 0' }}>{varshaphalL2.plainSummary}</p>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    Varsha Lagna: {varshaphalL2.varshaLagnaSign} • <GlossaryTerm term="Muntha" />: {varshaphalL2.munthaSign} (H{varshaphalL2.munthaHouseInVarsha}) • Year Weekday Lord: {varshaphalL2.varaPati}
                  </div>
                </div>
              )}

              {arudhas.length > 0 && (
                <div className="card">
                  <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: '0 0 10px 0' }}>
                    Arudha Padas (How the World Sees You)
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 8 }}>
                    {arudhas.map((a: any) => (
                      <div key={a.code} style={{ padding: 10, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', fontSize: 12 }}>
                        <div style={{ fontWeight: 700, color: 'var(--teal)' }}>
                          {a.code} • {a.name ?? a.code}
                        </div>
                        <div style={{ fontSize: 12, marginTop: 4, textTransform: 'capitalize', color: 'var(--gold)', fontWeight: 600 }}>
                          {a.sign} (House {a.houseFromLagna})
                        </div>
                      </div>
                    ))}
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

          {chartSystemsTab === 'birth' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {panchangL2 && (
                <div className="card">
                  <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Compass size={15} /> Birth Temperament &amp; Panchang Summary
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
                    {[
                      { label: 'Paya (Pedestal)', val: avakahada.paya, color: 'var(--gold)' },
                      { label: 'Varna', val: avakahada.varna, color: 'var(--teal)' },
                      { label: 'Yoni', val: avakahada.yoni, color: 'var(--text-main)' },
                      { label: 'Gana', val: avakahada.gana, color: 'var(--text-main)' },
                      { label: 'Vasya', val: avakahada.vasya, color: 'var(--teal)' },
                      { label: 'Nadi', val: avakahada.nadi, color: 'var(--gold)' },
                    ].map((cell) => (
                      <div key={cell.label} style={{ background: 'var(--surface-alt)', padding: 12, borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cell.label}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: cell.color, marginTop: 2 }}>{cell.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {panchang && (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={15} /> Panchang at Birth ({birthDate} {birthTime} {tzId})
                    </h3>
                    <span className="teal-badge" style={{ fontSize: 10.5 }}>5 Limbs of Time</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
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
      </div>
    </div>
  );
};
