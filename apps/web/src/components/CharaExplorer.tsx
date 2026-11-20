import React, { useState } from 'react';
import type { CharaDashaTree } from '@astro/engine';
import { Calendar, ChevronDown, ChevronRight } from 'lucide-react';

interface CharaExplorerProps {
  chara: CharaDashaTree;
}

export const CharaExplorer: React.FC<CharaExplorerProps> = ({ chara }) => {
  const [expandedSign, setExpandedSign] = useState<string | null>(chara.periods[0]?.sign || null);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={15} /> Jaimini Chara Dasha Explorer
        </h3>
        <span className="gold-badge" style={{ fontSize: 10 }}>
          Rashi Progression • Jaimini Sign Dashas
        </span>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
        Click any sign to expand sub-periods. Progression follows classical Parashara/Jaimini reverse order for even signs.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {chara.periods.map((period, idx) => {
          const isOpen = expandedSign === period.sign;

          return (
            <div
              key={`${period.sign}-${idx}`}
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                overflow: 'hidden',
                background: isOpen ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
              }}
            >
              {/* Mahadasha Row */}
              <div
                onClick={() => setExpandedSign(isOpen ? null : period.sign)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  background: isOpen ? 'rgba(227, 173, 70, 0.1)' : 'var(--surface-alt)',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isOpen ? <ChevronDown size={14} color="var(--gold)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: isOpen ? 'var(--gold)' : 'var(--text-main)' }}>
                      {period.sign}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                      Duration: {period.years} Years
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {period.startDateIso} — {period.endDateIso}
                </div>
              </div>

              {/* Sub-Periods */}
              {isOpen && (
                <div style={{ padding: '8px 12px 12px 32px', display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(0,0,0,0.15)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6 }}>
                    {period.subPeriods.map((sub, sIdx) => (
                      <div
                        key={sIdx}
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
                        <span style={{ fontWeight: 600, color: 'var(--teal)' }}>{sub.sign}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{sub.startDateIso}</span>
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
