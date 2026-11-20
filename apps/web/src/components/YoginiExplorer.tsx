import React, { useState } from 'react';
import type { YoginiDashaTree } from '@astro/engine';
import { Calendar, ChevronDown, ChevronRight } from 'lucide-react';

interface YoginiExplorerProps {
  yogini: YoginiDashaTree;
}

export const YoginiExplorer: React.FC<YoginiExplorerProps> = ({ yogini }) => {
  const [expandedMaha, setExpandedMaha] = useState<string | null>(yogini.periods[0]?.name || null);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={15} /> Yogini Dasha Explorer (36-Year Cycle)
        </h3>
        <span className="gold-badge" style={{ fontSize: 10 }}>
          Bal: {yogini.startingBalance.name} ({yogini.startingBalance.yearsRemaining.toFixed(2)} Yrs)
        </span>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
        Traditional 8-Goddess Cycle (Mangala, Pingala, Dhanya, Bhramari, Bhadrika, Ulka, Siddha, Sankata).
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {yogini.periods.map((maha, idx) => {
          const isMahaOpen = expandedMaha === maha.name;

          return (
            <div
              key={`${maha.name}-${idx}`}
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                overflow: 'hidden',
                background: isMahaOpen ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
              }}
            >
              {/* Mahadasha Row */}
              <div
                onClick={() => setExpandedMaha(isMahaOpen ? null : maha.name)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  background: isMahaOpen ? 'rgba(227, 173, 70, 0.1)' : 'var(--surface-alt)',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isMahaOpen ? <ChevronDown size={14} color="var(--gold)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: isMahaOpen ? 'var(--gold)' : 'var(--text-main)' }}>
                      {maha.name} ({maha.code})
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                      Lord: {maha.lord.toUpperCase()} • {maha.years} Years
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {maha.startDateIso} — {maha.endDateIso}
                </div>
              </div>

              {/* Sub-Periods (Antardashas) */}
              {isMahaOpen && (
                <div style={{ padding: '8px 12px 12px 32px', display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(0,0,0,0.15)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 6 }}>
                    {maha.subPeriods.map((antar) => (
                      <div
                        key={antar.code}
                        style={{
                          background: 'var(--surface)',
                          padding: '6px 10px',
                          borderRadius: 6,
                          fontSize: 11,
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--teal)' }}>{antar.code}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{antar.startDateIso}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
