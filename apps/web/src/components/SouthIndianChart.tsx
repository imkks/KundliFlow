import React from 'react';
import type { ChartPlacement } from './NorthIndianChart.tsx';

interface SouthIndianChartProps {
  lagnaSignIndex: number; // 0 = Aries .. 11 = Pisces
  placements: ChartPlacement[];
  title?: string;
  selectedHouse?: number;
  highlightHouse?: number;
  selectedPlanet?: string;
  onSelectHouse?: (house: number) => void;
  onSelectPlanet?: (planet: string) => void;
}

const LABEL_TO_PLANET: Record<string, string> = {
  Su: 'sun',
  Mo: 'moon',
  Ma: 'mars',
  Me: 'mercury',
  Ju: 'jupiter',
  Ve: 'venus',
  Sa: 'saturn',
  Ra: 'rahu',
  Ke: 'ketu',
};

/**
 * Classical South Indian style Kundli chart.
 * Signs have fixed positions (Pisces is top-left, Aries is 2nd box, etc. moving clockwise);
 * Lagna (Asc) is explicitly written in the box representing the rising sign.
 */
export const SouthIndianChart: React.FC<SouthIndianChartProps> = ({
  lagnaSignIndex,
  placements,
  title,
  selectedHouse,
  highlightHouse,
  selectedPlanet,
  onSelectHouse,
  onSelectPlanet,
}) => {
  const signItemsMap = new Map<number, ChartPlacement['items']>();
  for (const p of placements) {
    signItemsMap.set(p.signIndex, p.items);
  }

  // 12 Zodiac signs in South Indian 4x4 perimeter grid (fixed signs):
  // Row 0: Pisces (11), Aries (0), Taurus (1), Gemini (2)
  // Row 1: Aquarius (10), [CENTER], [CENTER], Cancer (3)
  // Row 2: Capricorn (9), [CENTER], [CENTER], Leo (4)
  // Row 3: Sagittarius (8), Scorpio (7), Libra (6), Virgo (5)
  const signCells: Array<{ signIdx: number; row: number; col: number }> = [
    { signIdx: 11, row: 0, col: 0 },
    { signIdx: 0,  row: 0, col: 1 },
    { signIdx: 1,  row: 0, col: 2 },
    { signIdx: 2,  row: 0, col: 3 },
    { signIdx: 3,  row: 1, col: 3 },
    { signIdx: 4,  row: 2, col: 3 },
    { signIdx: 5,  row: 3, col: 3 },
    { signIdx: 6,  row: 3, col: 2 },
    { signIdx: 7,  row: 3, col: 1 },
    { signIdx: 8,  row: 3, col: 0 },
    { signIdx: 9,  row: 2, col: 0 },
    { signIdx: 10, row: 1, col: 0 },
  ];

  const cellSize = 90; // 4x4 = 360x360 total size

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {title && <h4 className="serif-title" style={{ fontSize: 13, marginBottom: 8, color: 'var(--gold)' }}>{title}</h4>}
      <svg viewBox="0 0 360 360" className="chart-svg" style={{ maxWidth: 360, width: '100%' }}>
        {/* Background & Outer border */}
        <rect width="360" height="360" fill="var(--surface-alt)" stroke="var(--gold)" strokeWidth="1.8" />

        {/* Center Box cutout */}
        <rect x="90" y="90" width="180" height="180" fill="var(--bg-ink)" stroke="var(--gold)" strokeWidth="1.4" />

        {/* Outer 4x4 Grid lines */}
        <line x1="90" y1="0" x2="90" y2="360" stroke="var(--gold)" strokeWidth="1" opacity="0.8" />
        <line x1="180" y1="0" x2="180" y2="90" stroke="var(--gold)" strokeWidth="1" opacity="0.8" />
        <line x1="180" y1="270" x2="180" y2="360" stroke="var(--gold)" strokeWidth="1" opacity="0.8" />
        <line x1="270" y1="0" x2="270" y2="360" stroke="var(--gold)" strokeWidth="1" opacity="0.8" />

        <line x1="0" y1="90" x2="360" y2="90" stroke="var(--gold)" strokeWidth="1" opacity="0.8" />
        <line x1="0" y1="180" x2="90" y2="180" stroke="var(--gold)" strokeWidth="1" opacity="0.8" />
        <line x1="270" y1="180" x2="360" y2="180" stroke="var(--gold)" strokeWidth="1" opacity="0.8" />
        <line x1="0" y1="270" x2="360" y2="270" stroke="var(--gold)" strokeWidth="1" opacity="0.8" />

        {/* Center Title */}
        <text x="180" y="175" fill="var(--gold)" fontSize="13" fontWeight="700" textAnchor="middle" className="serif-title">
          {title ? title.split(' ')[0] : 'SOUTH'}
        </text>
        <text x="180" y="195" fill="var(--text-muted)" fontSize="10" textAnchor="middle">
          Fixed Signs
        </text>

        {/* Sign Cells */}
        {signCells.map((c) => {
          const x = c.col * cellSize;
          const y = c.row * cellSize;
          const isLagna = c.signIdx === lagnaSignIndex;
          const houseNum = ((c.signIdx - lagnaSignIndex + 12) % 12) + 1;
          const isSelected = selectedHouse === houseNum;
          const isLinked = highlightHouse === houseNum && !isSelected;
          const items = signItemsMap.get(c.signIdx) || [];

          return (
            <g key={c.signIdx}>
              {/* Clickable cell background */}
              <rect
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                fill={
                  isSelected
                    ? 'rgba(227, 173, 70, 0.18)'
                    : isLinked
                    ? 'rgba(95, 194, 179, 0.14)'
                    : 'transparent'
                }
                style={{ cursor: onSelectHouse ? 'pointer' : 'default' }}
                onClick={() => onSelectHouse?.(houseNum)}
              />

              {/* Highlight lagna cell */}
              {isLagna && (
                <line x1={x} y1={y} x2={x + 20} y2={y} stroke="var(--teal)" strokeWidth="3" pointerEvents="none" />
              )}

              {/* Sign & House label */}
              <text
                x={x + 8}
                y={y + 16}
                fill={isSelected ? 'var(--gold)' : 'var(--teal)'}
                fontSize="9"
                fontWeight="700"
                pointerEvents="none"
              >
                {c.signIdx + 1} (H{houseNum})
              </text>

              {/* Lagna marker */}
              {isLagna && (
                <text x={x + cellSize - 8} y={y + 16} fill="var(--gold)" fontSize="9" fontWeight="bold" textAnchor="end" pointerEvents="none">
                  ASC
                </text>
              )}

              {/* Grahas */}
              {items.length > 0 && (
                <text x={x + cellSize / 2} y={y + 50} fill="var(--text-main)" fontSize="10" textAnchor="middle">
                  {items.map((item, idx) => {
                    const planetId = LABEL_TO_PLANET[item.label];
                    const isSelectedPlanet = Boolean(planetId && selectedPlanet === planetId);
                    return (
                      <tspan
                        key={idx}
                        fill={
                          item.isLagna
                            ? 'var(--gold)'
                            : isSelectedPlanet
                            ? 'var(--teal)'
                            : 'var(--text-main)'
                        }
                        fontWeight={item.isLagna || isSelectedPlanet ? '700' : '500'}
                        style={{
                          cursor: planetId && onSelectPlanet ? 'pointer' : 'default',
                          textDecoration: isSelectedPlanet ? 'underline' : 'none',
                        }}
                        onClick={(e) => {
                          if (planetId && onSelectPlanet) {
                            e.stopPropagation();
                            onSelectPlanet(planetId);
                          }
                        }}
                      >
                        {idx > 0 && idx % 2 === 0 ? <tspan x={x + cellSize / 2} dy="13" /> : idx > 0 ? ' ' : ''}
                        {item.label}
                        {item.isRetrograde ? '°' : ''}
                      </tspan>
                    );
                  })}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
