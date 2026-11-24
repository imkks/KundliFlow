import React, { useState, useMemo } from 'react';
import type { YoginiDashaTree } from '@astro/engine';
import { Calendar, ChevronDown, ChevronRight } from 'lucide-react';

interface YoginiExplorerProps {
  yogini: YoginiDashaTree;
}

export const YoginiExplorer: React.FC<YoginiExplorerProps> = ({ yogini }) => {
  const todayIso = new Date().toISOString().slice(0, 10);

  const currentIdx = useMemo(() => {
    const idx = yogini.periods.findIndex((p) => todayIso >= p.startDateIso && todayIso < p.endDateIso);
    return idx >= 0 ? idx : 0;
  }, [yogini, todayIso]);

  const [expandedIdx, setExpandedIdx] = useState<number | null>(currentIdx);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
          <Calendar size={15} /> Yogini Dasha Explorer (36-Year Cycle)
        </h3>
        <span className="gold-badge" style={{ fontSize: 10.5 }}>
          Bal: {yogini.startingBalance.name} ({yogini.startingBalance.yearsRemaining.toFixed(2)} Yrs)
        </span>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
        Traditional 8-Archetype Cycle. Current active cycle is expanded automatically.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {yogini.periods.map((maha, idx) => {
          const isMahaOpen = expandedIdx === idx;
          const isCurrent = todayIso >= maha.startDateIso && todayIso < maha.endDateIso;

          return (
            <div
              key={`${maha.name}-${idx}`}
              style={{
                border: isCurrent ? '1px solid rgba(95, 194, 179, 0.5)' : '1px solid var(--border-subtle)',
                borderRadius: 8,
                overflow: 'hidden',
                background: isMahaOpen ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
              }}
            >
              <button
                type="button"
                onClick={() => setExpandedIdx(isMahaOpen ? null : idx)}
                aria-expanded={isMahaOpen}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: isCurrent ? 'rgba(95, 194, 179, 0.12)' : isMahaOpen ? 'rgba(227, 173, 70, 0.1)' : 'var(--surface-alt)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isMahaOpen ? <ChevronDown size={14} color="var(--gold)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: isCurrent ? 'var(--teal)' : isMahaOpen ? 'var(--gold)' : 'var(--text-main)' }}>
                      {maha.name} ({maha.code})
                    </span>
                    {isCurrent && (
                      <span className="teal-badge" style={{ fontSize: 10, padding: '1px 7px', marginLeft: 8 }}>● NOW</span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                      Lord: {maha.lord.toUpperCase()} • {maha.years} Yrs
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                  {maha.startDateIso} — {maha.endDateIso}
                </div>
              </button>

              {isMahaOpen && (
                <div style={{ padding: '8px 12px 12px 24px', display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(0,0,0,0.15)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 6 }}>
                    {maha.subPeriods.map((antar) => {
                      const isCurAntar = todayIso >= antar.startDateIso && todayIso < antar.endDateIso;
                      return (
                        <div
                          key={antar.code}
                          style={{
                            background: 'var(--surface)',
                            padding: '6px 10px',
                            borderRadius: 6,
                            fontSize: 11.5,
                            border: isCurAntar ? '1px solid var(--teal)' : '1px solid var(--border-subtle)',
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: isCurAntar ? 'var(--gold)' : 'var(--teal)' }}>
                            {antar.code} {isCurAntar ? '●' : ''}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>{antar.startDateIso}</span>
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
