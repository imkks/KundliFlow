import React, { useState, useMemo } from 'react';
import type { VimshottariDashaTree } from '@astro/engine';
import { ChevronRight, ChevronDown, Calendar } from 'lucide-react';

interface VimshottariExplorerProps {
  dashas: VimshottariDashaTree;
}

export const VimshottariExplorer: React.FC<VimshottariExplorerProps> = ({ dashas }) => {
  const todayIso = new Date().toISOString().slice(0, 10);

  const { currentMahaLord, currentAntarKey } = useMemo(() => {
    const maha = dashas.periods.find((p) => todayIso >= p.startDateIso && todayIso < p.endDateIso) ?? dashas.periods[0];
    const antar = maha?.subPeriods?.find((a) => todayIso >= a.startDateIso && todayIso < a.endDateIso);
    return {
      currentMahaLord: maha?.lord ?? null,
      currentAntarKey: maha && antar ? `${maha.lord}-${antar.lord}` : null,
    };
  }, [dashas, todayIso]);

  const [expandedMaha, setExpandedMaha] = useState<string | null>(currentMahaLord);
  const [expandedAntar, setExpandedAntar] = useState<string | null>(currentAntarKey);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
          <Calendar size={15} /> Vimshottari Dasha Explorer
        </h3>
        <span className="gold-badge" style={{ fontSize: 10.5 }}>
          Birth Bal: {dashas.balance.formattedBalance}
        </span>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
        Your currently active period is highlighted &amp; expanded. Click any Mahadasha or Antardasha to drill to Pratyantar.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dashas.periods.map((maha) => {
          const isMahaOpen = expandedMaha === maha.lord;
          const isCurrentMaha = todayIso >= maha.startDateIso && todayIso < maha.endDateIso;
          const lordName = maha.lord.toUpperCase();

          return (
            <div
              key={maha.lord}
              style={{
                border: isCurrentMaha ? '1px solid rgba(95, 194, 179, 0.5)' : '1px solid var(--border-subtle)',
                borderRadius: 8,
                overflow: 'hidden',
                background: isMahaOpen ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
              }}
            >
              <button
                type="button"
                onClick={() => setExpandedMaha(isMahaOpen ? null : maha.lord)}
                aria-expanded={isMahaOpen}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: isCurrentMaha ? 'rgba(95, 194, 179, 0.12)' : isMahaOpen ? 'rgba(227, 173, 70, 0.08)' : 'var(--surface-alt)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isMahaOpen ? <ChevronDown size={14} color="var(--gold)" /> : <ChevronRight size={14} />}
                  <span style={{ fontWeight: 700, fontSize: 13, color: isCurrentMaha ? 'var(--teal)' : isMahaOpen ? 'var(--gold)' : 'var(--text-main)' }}>
                    {lordName} MAHADASHA
                  </span>
                  {isCurrentMaha && (
                    <span className="teal-badge" style={{ fontSize: 10, padding: '1px 7px' }}>
                      ● NOW
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {maha.startDateIso} → {maha.endDateIso}
                </span>
              </button>

              {isMahaOpen && maha.subPeriods && (
                <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border-subtle)' }}>
                  {maha.subPeriods.map((antar) => {
                    const antarKey = `${maha.lord}-${antar.lord}`;
                    const isAntarOpen = expandedAntar === antarKey;
                    const isCurrentAntar = todayIso >= antar.startDateIso && todayIso < antar.endDateIso;

                    return (
                      <div key={antar.lord} style={{ paddingLeft: 12, borderLeft: isCurrentAntar ? '2px solid var(--teal)' : '2px solid var(--border)' }}>
                        <button
                          type="button"
                          onClick={() => setExpandedAntar(isAntarOpen ? null : antarKey)}
                          aria-expanded={isAntarOpen}
                          style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: 12,
                            padding: '4px 0',
                          }}
                        >
                          <span style={{ color: isCurrentAntar || isAntarOpen ? 'var(--teal)' : 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{antar.lord.toUpperCase()} Antar</span>
                            {isCurrentAntar && <span style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700 }}>● NOW</span>}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>
                            {antar.startDateIso} → {antar.endDateIso}
                          </span>
                        </button>

                        {isAntarOpen && antar.subPeriods && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 3, marginTop: 6, paddingLeft: 12, borderLeft: '1px dashed var(--border-subtle)' }}>
                            {antar.subPeriods.map((prat) => {
                              const isCurrentPrat = todayIso >= prat.startDateIso && todayIso < prat.endDateIso;
                              return (
                                <div
                                  key={prat.lord}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: 11.5,
                                    color: isCurrentPrat ? 'var(--gold)' : 'var(--text-muted)',
                                    fontWeight: isCurrentPrat ? 700 : 400,
                                  }}
                                >
                                  <span style={{ textTransform: 'capitalize' }}>
                                    {prat.lord} Pratyantar {isCurrentPrat ? '●' : ''}
                                  </span>
                                  <span>{prat.startDateIso} → {prat.endDateIso}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
