import React, { useState } from 'react';
import type { DashaNode, VimshottariDashaTree } from '@astro/engine';
import { ChevronRight, ChevronDown, Calendar } from 'lucide-react';

interface VimshottariExplorerProps {
  dashas: VimshottariDashaTree;
}

export const VimshottariExplorer: React.FC<VimshottariExplorerProps> = ({ dashas }) => {
  const [expandedMaha, setExpandedMaha] = useState<string | null>(dashas.periods[0]?.lord || null);
  const [expandedAntar, setExpandedAntar] = useState<string | null>(null);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={15} /> Vimshottari Dasha Explorer
        </h3>
        <span className="gold-badge" style={{ fontSize: 10 }}>
          Bal: {dashas.balance.formattedBalance}
        </span>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
        Click any Mahadasha or Antardasha to expand sub-periods down to Pratyantar level.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dashas.periods.map((maha) => {
          const isMahaOpen = expandedMaha === maha.lord;
          const lordName = maha.lord.toUpperCase();

          return (
            <div
              key={maha.lord}
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                overflow: 'hidden',
                background: isMahaOpen ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
              }}
            >
              {/* Mahadasha Row */}
              <div
                onClick={() => setExpandedMaha(isMahaOpen ? null : maha.lord)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  background: isMahaOpen ? 'rgba(227, 173, 70, 0.08)' : 'var(--surface-alt)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isMahaOpen ? <ChevronDown size={14} color="var(--gold)" /> : <ChevronRight size={14} />}
                  <span style={{ fontWeight: 700, fontSize: 13, color: isMahaOpen ? 'var(--gold)' : 'var(--text-main)' }}>
                    {lordName} MAHADASHA
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {maha.startDateIso} → {maha.endDateIso}
                </span>
              </div>

              {/* Antardasha Rows */}
              {isMahaOpen && maha.subPeriods && (
                <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border-subtle)' }}>
                  {maha.subPeriods.map((antar) => {
                    const antarKey = `${maha.lord}-${antar.lord}`;
                    const isAntarOpen = expandedAntar === antarKey;

                    return (
                      <div key={antar.lord} style={{ paddingLeft: 12, borderLeft: '2px solid var(--border)' }}>
                        <div
                          onClick={() => setExpandedAntar(isAntarOpen ? null : antarKey)}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            fontSize: 12,
                            padding: '3px 0',
                          }}
                        >
                          <span style={{ color: isAntarOpen ? 'var(--teal)' : 'var(--text-main)', fontWeight: 600 }}>
                            {antar.lord.toUpperCase()} Antar
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                            {antar.startDateIso} → {antar.endDateIso}
                          </span>
                        </div>

                        {/* Pratyantardasha Rows */}
                        {isAntarOpen && antar.subPeriods && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 3, marginTop: 6, paddingLeft: 12, borderLeft: '1px dashed var(--border-subtle)' }}>
                            {antar.subPeriods.map((prat) => (
                              <div key={prat.lord} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                                <span>{prat.lord} Pratyantar</span>
                                <span>{prat.startDateIso} → {prat.endDateIso}</span>
                              </div>
                            ))}
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
