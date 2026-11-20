import React, { useState } from 'react';
import type { AshtakvargaResult, AshtakvargaPlanet, Contributor } from '@astro/engine';

interface AshtakvargaTableProps {
  ashtakvarga: AshtakvargaResult;
  lagnaSignIndex?: number;
}

const SIGN_NAMES_SHORT = ['Ar', 'Ta', 'Ge', 'Ca', 'Le', 'Vi', 'Li', 'Sc', 'Sa', 'Cp', 'Aq', 'Pi'];
const PLANETS: AshtakvargaPlanet[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];
const CONTRIBUTORS: Contributor[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'lagna'];

export const AshtakvargaTable: React.FC<AshtakvargaTableProps> = ({ ashtakvarga, lagnaSignIndex = 1 }) => {
  const [viewMode, setViewMode] = useState<'bav_sav' | 'sav_chart' | 'prastara'>('bav_sav');
  const [selectedPlanet, setSelectedPlanet] = useState<AshtakvargaPlanet>('sun');

  const prastaraTable = ashtakvarga.prastara?.[selectedPlanet];

  // North Indian layout house coordinates for SAV Chart
  const houseCoords = [
    { numX: 180, numY: 80, textX: 180, textY: 105 },  // H1
    { numX: 95,  numY: 40, textX: 95,  textY: 65 },   // H2
    { numX: 40,  numY: 95, textX: 45,  textY: 125 },  // H3
    { numX: 90,  numY: 175, textX: 90, textY: 205 },  // H4
    { numX: 40,  numY: 265, textX: 45, textY: 295 },  // H5
    { numX: 95,  numY: 335, textX: 95, textY: 360 },  // H6
    { numX: 180, numY: 265, textX: 180, textY: 295 }, // H7
    { numX: 265, numY: 335, textX: 265, textY: 360 }, // H8
    { numX: 320, numY: 265, textX: 315, textY: 295 }, // H9
    { numX: 270, numY: 175, textX: 270, textY: 205 }, // H10
    { numX: 320, numY: 95, textX: 315, textY: 125 },  // H11
    { numX: 265, numY: 40, textX: 265, textY: 65 },   // H12
  ];

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)' }}>
            {viewMode === 'bav_sav'
              ? 'Sarva & Bhinna Ashtakvarga (BAV/SAV)'
              : viewMode === 'sav_chart'
              ? 'Sarva Ashtakvarga (SAV) House Chart'
              : `Prastharashtakvarga — ${selectedPlanet.toUpperCase()}`}
          </h3>
          <span className="teal-badge" style={{ fontSize: 11 }}>
            Total Bindus: {ashtakvarga.sarvaTotal} / 337
          </span>
        </div>

        {/* View Switcher */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-alt)', padding: 2, borderRadius: 6 }}>
          <button
            onClick={() => setViewMode('bav_sav')}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              borderRadius: 4,
              background: viewMode === 'bav_sav' ? 'var(--gold)' : 'transparent',
              color: viewMode === 'bav_sav' ? '#15132b' : 'var(--text-muted)',
              fontWeight: viewMode === 'bav_sav' ? 600 : 400,
            }}
          >
            BAV / SAV
          </button>
          <button
            onClick={() => setViewMode('sav_chart')}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              borderRadius: 4,
              background: viewMode === 'sav_chart' ? 'var(--gold)' : 'transparent',
              color: viewMode === 'sav_chart' ? '#15132b' : 'var(--text-muted)',
              fontWeight: viewMode === 'sav_chart' ? 600 : 400,
            }}
          >
            SAV Chart
          </button>
          <button
            onClick={() => setViewMode('prastara')}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              borderRadius: 4,
              background: viewMode === 'prastara' ? 'var(--gold)' : 'transparent',
              color: viewMode === 'prastara' ? '#15132b' : 'var(--text-muted)',
              fontWeight: viewMode === 'prastara' ? 600 : 400,
            }}
          >
            Prastara (8 Rows)
          </button>
        </div>
      </div>

      {viewMode === 'prastara' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Select Planet:</span>
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
            {PLANETS.map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPlanet(p)}
                style={{
                  padding: '3px 8px',
                  fontSize: 11,
                  borderRadius: 4,
                  textTransform: 'capitalize',
                  background: selectedPlanet === p ? 'var(--teal)' : 'var(--surface-alt)',
                  color: selectedPlanet === p ? '#15132b' : 'var(--text-main)',
                  fontWeight: selectedPlanet === p ? 700 : 400,
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'bav_sav' ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'center' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '6px 4px', textAlign: 'left', color: 'var(--text-muted)' }}>Graha</th>
              {SIGN_NAMES_SHORT.map((s) => (
                <th key={s} style={{ padding: '6px 2px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {s}
                </th>
              ))}
              <th style={{ padding: '6px 4px', color: 'var(--gold)', fontWeight: 700 }}>Tot</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(ashtakvarga.bhinna).map(([planet, row]) => (
              <tr key={planet} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '6px 4px', textAlign: 'left', fontWeight: 600, textTransform: 'capitalize' }}>
                  {planet}
                </td>
                {row.map((val, i) => (
                  <td key={i} style={{ padding: '6px 2px', color: val >= 5 ? 'var(--teal)' : val <= 2 ? 'var(--amber)' : 'inherit' }}>
                    {val}
                  </td>
                ))}
                <td style={{ padding: '6px 4px', fontWeight: 700, color: 'var(--gold)' }}>
                  {ashtakvarga.planetTotals[planet as keyof typeof ashtakvarga.planetTotals]}
                </td>
              </tr>
            ))}
            {/* Sarva Ashtakvarga Row */}
            <tr style={{ borderTop: '2px solid var(--gold)', fontWeight: 700, background: 'rgba(227, 173, 70, 0.08)' }}>
              <td style={{ padding: '8px 4px', textAlign: 'left', color: 'var(--gold)' }}>
                SARVA
              </td>
              {ashtakvarga.sarva.map((val, i) => (
                <td key={i} style={{ padding: '8px 2px', color: val >= 30 ? 'var(--teal)' : val <= 24 ? 'var(--amber)' : 'inherit' }}>
                  {val}
                </td>
              ))}
              <td style={{ padding: '8px 4px', color: 'var(--gold)' }}>
                {ashtakvarga.sarvaTotal}
              </td>
            </tr>
          </tbody>
        </table>
      ) : viewMode === 'sav_chart' ? (
        /* SAV Kundli Chart */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
            Points ≥ 28 are strong (Teal); points ≤ 25 need care (Amber).
          </p>
          <svg viewBox="0 0 360 360" style={{ maxWidth: 320, width: '100%' }}>
            <rect width="360" height="360" fill="var(--surface-alt)" stroke="var(--gold)" strokeWidth="1.8" />
            <line x1="0" y1="0" x2="360" y2="360" stroke="var(--gold)" strokeWidth="1.2" opacity="0.9" />
            <line x1="360" y1="0" x2="0" y2="360" stroke="var(--gold)" strokeWidth="1.2" opacity="0.9" />
            <polygon points="180,0 360,180 180,360 0,180" fill="none" stroke="var(--gold)" strokeWidth="1.4" />

            {houseCoords.map((h, i) => {
              const signIdx = (lagnaSignIndex + i) % 12;
              const signNum = signIdx + 1;
              const points = ashtakvarga.sarva[signIdx] ?? 0;
              const isStrong = points >= 28;

              return (
                <g key={i}>
                  <text x={h.numX} y={h.numY} fill="var(--teal)" fontSize="10" fontWeight="700" textAnchor="middle">
                    H{i + 1} ({signNum})
                  </text>
                  <text
                    x={h.textX}
                    y={h.textY}
                    fill={isStrong ? 'var(--gold)' : 'var(--amber)'}
                    fontSize="16"
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    {points}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        /* Prastharashtakvarga 8-row table */
        prastaraTable && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'center' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '6px 4px', textAlign: 'left', color: 'var(--text-muted)' }}>From</th>
                {SIGN_NAMES_SHORT.map((s) => (
                  <th key={s} style={{ padding: '6px 2px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {s}
                  </th>
                ))}
                <th style={{ padding: '6px 4px', color: 'var(--gold)', fontWeight: 700 }}>Tot</th>
              </tr>
            </thead>
            <tbody>
              {CONTRIBUTORS.map((ref) => {
                const row = prastaraTable.rows[ref] || [];
                const rowTotal = row.reduce((a, b) => a + b, 0);
                return (
                  <tr key={ref} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '5px 4px', textAlign: 'left', fontWeight: 600, textTransform: 'capitalize' }}>
                      {ref}
                    </td>
                    {row.map((val, i) => (
                      <td
                        key={i}
                        style={{
                          padding: '5px 2px',
                          color: val === 1 ? 'var(--teal)' : 'var(--text-muted)',
                          fontWeight: val === 1 ? 700 : 400,
                        }}
                      >
                        {val}
                      </td>
                    ))}
                    <td style={{ padding: '5px 4px', fontWeight: 700, color: 'var(--gold)' }}>
                      {rowTotal}
                    </td>
                  </tr>
                );
              })}
              {/* Prastara Column Totals */}
              <tr style={{ borderTop: '2px solid var(--teal)', fontWeight: 700, background: 'rgba(95, 194, 179, 0.08)' }}>
                <td style={{ padding: '6px 4px', textAlign: 'left', color: 'var(--teal)' }}>
                  TOTAL
                </td>
                {prastaraTable.totals.map((val, i) => (
                  <td key={i} style={{ padding: '6px 2px', color: 'var(--teal)' }}>
                    {val}
                  </td>
                ))}
                <td style={{ padding: '6px 4px', color: 'var(--gold)' }}>
                  {prastaraTable.totalSum}
                </td>
              </tr>
            </tbody>
          </table>
        )
      )}
    </div>
  );
};
