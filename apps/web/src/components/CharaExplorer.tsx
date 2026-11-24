import React, { useState, useMemo } from 'react';
import type { CharaDashaTree } from '@astro/engine';
import { Calendar, ChevronDown, ChevronRight } from 'lucide-react';

interface CharaExplorerProps {
  chara: CharaDashaTree;
}

export const CharaExplorer: React.FC<CharaExplorerProps> = ({ chara }) => {
  const todayIso = new Date().toISOString().slice(0, 10);

  const currentIdx = useMemo(() => {
    const idx = chara.periods.findIndex((p) => todayIso >= p.startDateIso && todayIso < p.endDateIso);
    return idx >= 0 ? idx : 0;
  }, [chara, todayIso]);

  const [expandedIdx, setExpandedIdx] = useState<number | null>(currentIdx);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
          <Calendar size={15} /> Jaimini Chara Dasha Explorer
        </h3>
        <span className="gold-badge" style={{ fontSize: 10.5 }}>
          Rashi Progression • Jaimini Sign Dashas
        </span>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
        Your currently active sign chapter is expanded automatically.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {chara.periods.map((period, idx) => {
          const isOpen = expandedIdx === idx;
          const isCurrent = todayIso >= period.startDateIso && todayIso < period.endDateIso;

          return (
            <div
              key={`${period.sign}-${idx}`}
              style={{
                border: isCurrent ? '1px solid rgba(95, 194, 179, 0.5)' : '1px solid var(--border-subtle)',
                borderRadius: 8,
                overflow: 'hidden',
                background: isOpen ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
              }}
            >
              <button
                type="button"
                onClick={() => setExpandedIdx(isOpen ? null : idx)}
                aria-expanded={isOpen}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: isCurrent ? 'rgba(95, 194, 179, 0.12)' : isOpen ? 'rgba(227, 173, 70, 0.1)' : 'var(--surface-alt)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isOpen ? <ChevronDown size={14} color="var(--gold)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: isCurrent ? 'var(--teal)' : isOpen ? 'var(--gold)' : 'var(--text-main)' }}>
                      {period.sign}
                    </span>
                    {isCurrent && (
                      <span className="teal-badge" style={{ fontSize: 10, padding: '1px 7px', marginLeft: 8 }}>● NOW</span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                      Duration: {period.years} Yrs
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                  {period.startDateIso} — {period.endDateIso}
                </div>
              </button>

              {isOpen && (
                <div style={{ padding: '8px 12px 12px 24px', display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(0,0,0,0.15)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6 }}>
                    {period.subPeriods.map((sub, sIdx) => {
                      const isCurSub = todayIso >= sub.startDateIso && todayIso < sub.endDateIso;
                      return (
                        <div
                          key={sIdx}
                          style={{
                            background: 'var(--surface)',
                            padding: '6px 10px',
                            borderRadius: 6,
                            fontSize: 11.5,
                            border: isCurSub ? '1px solid var(--teal)' : '1px solid var(--border-subtle)',
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: isCurSub ? 'var(--gold)' : 'var(--teal)' }}>
                            {sub.sign} {isCurSub ? '●' : ''}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>{sub.startDateIso}</span>
                        </div>
                      );
                    })}
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
