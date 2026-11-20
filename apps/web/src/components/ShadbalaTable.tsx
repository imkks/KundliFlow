import React, { useState } from 'react';
import type { ShadbalaResult } from '@astro/engine';

interface ShadbalaTableProps {
  shadbala: ShadbalaResult;
}

const PLANETS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'] as const;

export const ShadbalaTable: React.FC<ShadbalaTableProps> = ({ shadbala }) => {
  const [activeSubTab, setActiveSubTab] = useState<'planets' | 'houses'>('planets');

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)' }}>
          {activeSubTab === 'planets' ? 'Shadbala (Six-Fold Planetary Strengths)' : 'Bhavabala (12 House Strengths)'}
        </h3>

        {/* View Switcher */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-alt)', padding: 2, borderRadius: 6 }}>
          <button
            onClick={() => setActiveSubTab('planets')}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              borderRadius: 4,
              background: activeSubTab === 'planets' ? 'var(--gold)' : 'transparent',
              color: activeSubTab === 'planets' ? '#15132b' : 'var(--text-muted)',
              fontWeight: activeSubTab === 'planets' ? 600 : 400,
            }}
          >
            Planets (Shadbala)
          </button>
          <button
            onClick={() => setActiveSubTab('houses')}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              borderRadius: 4,
              background: activeSubTab === 'houses' ? 'var(--gold)' : 'transparent',
              color: activeSubTab === 'houses' ? '#15132b' : 'var(--text-muted)',
              fontWeight: activeSubTab === 'houses' ? 600 : 400,
            }}
          >
            Houses (Bhavabala)
          </button>
        </div>
      </div>

      {activeSubTab === 'planets' ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'center' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '6px 4px', textAlign: 'left' }}>Graha</th>
                <th style={{ padding: '6px 4px' }}>Sthana</th>
                <th style={{ padding: '6px 4px' }}>Dig</th>
                <th style={{ padding: '6px 4px' }}>Kala</th>
                <th style={{ padding: '6px 4px' }}>Chesta</th>
                <th style={{ padding: '6px 4px' }}>Naisargika</th>
                <th style={{ padding: '6px 4px' }}>Drik</th>
                <th style={{ padding: '6px 4px', color: 'var(--gold)', fontWeight: 700 }}>Total Virupas</th>
                <th style={{ padding: '6px 4px', color: 'var(--teal)', fontWeight: 700 }}>Rupas</th>
                <th style={{ padding: '6px 4px' }}>Req</th>
                <th style={{ padding: '6px 4px', fontWeight: 700 }}>Ratio</th>
                <th style={{ padding: '6px 4px', color: 'var(--gold)', fontWeight: 700 }}>Rank</th>
              </tr>
            </thead>
            <tbody>
              {PLANETS.map((p) => {
                const s = shadbala.planets[p];
                if (!s) return null;
                const passes = s.strengthRatio >= 1.0;

                return (
                  <tr key={p} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '6px 4px', textAlign: 'left', fontWeight: 600, textTransform: 'capitalize' }}>
                      {p}
                    </td>
                    <td style={{ padding: '6px 4px' }}>{s.sthanaBala}</td>
                    <td style={{ padding: '6px 4px' }}>{s.digBala}</td>
                    <td style={{ padding: '6px 4px' }}>{s.kalaBala}</td>
                    <td style={{ padding: '6px 4px' }}>{s.chestaBala}</td>
                    <td style={{ padding: '6px 4px' }}>{s.naisargikaBala}</td>
                    <td style={{ padding: '6px 4px', color: s.drikBala < 0 ? 'var(--amber)' : 'inherit' }}>
                      {s.drikBala}
                    </td>
                    <td style={{ padding: '6px 4px', fontWeight: 700, color: 'var(--gold)' }}>
                      {s.totalShadbala}
                    </td>
                    <td style={{ padding: '6px 4px', fontWeight: 700, color: 'var(--teal)' }}>
                      {s.shadbalaInRupas}
                    </td>
                    <td style={{ padding: '6px 4px', color: 'var(--text-muted)' }}>
                      {s.minimumRequirement}
                    </td>
                    <td style={{ padding: '6px 4px', fontWeight: 700, color: passes ? 'var(--teal)' : 'var(--amber)' }}>
                      {s.strengthRatio}x
                    </td>
                    <td style={{ padding: '6px 4px', fontWeight: 700, color: 'var(--gold)' }}>
                      #{s.rank}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'center' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '6px 4px', textAlign: 'left' }}>Bhava</th>
                <th style={{ padding: '6px 4px' }}>Adhipati Bala</th>
                <th style={{ padding: '6px 4px' }}>Dig Bala</th>
                <th style={{ padding: '6px 4px' }}>Drishti Bala</th>
                <th style={{ padding: '6px 4px', color: 'var(--gold)', fontWeight: 700 }}>Total Virupas</th>
                <th style={{ padding: '6px 4px', color: 'var(--teal)', fontWeight: 700 }}>Rupas</th>
                <th style={{ padding: '6px 4px', color: 'var(--gold)', fontWeight: 700 }}>Rank</th>
              </tr>
            </thead>
            <tbody>
              {shadbala.bhavas.map((b) => (
                <tr key={b.house} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '6px 4px', textAlign: 'left', fontWeight: 600 }}>
                    House {b.house}
                  </td>
                  <td style={{ padding: '6px 4px' }}>{b.bhavadhipatiBala}</td>
                  <td style={{ padding: '6px 4px' }}>{b.bhavDigBala}</td>
                  <td style={{ padding: '6px 4px' }}>{b.bhavDrishtiBala}</td>
                  <td style={{ padding: '6px 4px', fontWeight: 700, color: 'var(--gold)' }}>
                    {b.totalBhavBala}
                  </td>
                  <td style={{ padding: '6px 4px', fontWeight: 700, color: 'var(--teal)' }}>
                    {b.bhavInRupas}
                  </td>
                  <td style={{ padding: '6px 4px', fontWeight: 700, color: 'var(--gold)' }}>
                    #{b.rank}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
