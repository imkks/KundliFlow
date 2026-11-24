import React from 'react';
import type { ChartPlacement } from './NorthIndianChart.tsx';

interface SouthIndianChartProps {
  lagnaSignIndex: number; // 0 = Aries .. 11 = Pisces
  placements: ChartPlacement[];
  title?: string;
  selectedHouse?: number;
  highlightHouse?: number;
  selectedPlanet?: string;
  maxWidth?: number;
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
 * Signs have fixed positions; Lagna (Asc) is explicitly marked in the rising sign.
 */
export const SouthIndianChart: React.FC<SouthIndianChartProps> = ({
  lagnaSignIndex,
  placements,
  title,
  selectedHouse,
  highlightHouse,
  selectedPlanet,
  maxWidth = 360,
  onSelectHouse,
  onSelectPlanet,
}) => {
  const signItemsMap = new Map<number, ChartPlacement['items']>();
  for (const p of placements) {
    signItemsMap.set(p.signIndex, p.items);
  }

  const signCells: Array<{ signIdx: number; row: number; col: number }> = [
    { signIdx: 11, row: 0, col: 0 },
    { signIdx: 0, row: 0, col: 1 },
    { signIdx: 1, row: 0, col: 2 },
    { signIdx: 2, row: 0, col: 3 },
    { signIdx: 3, row: 1, col: 3 },
    { signIdx: 4, row: 2, col: 3 },
    { signIdx: 5, row: 3, col: 3 },
    { signIdx: 6, row: 3, col: 2 },
    { signIdx: 7, row: 3, col: 1 },
    { signIdx: 8, row: 3, col: 0 },
    { signIdx: 9, row: 2, col: 0 },
    { signIdx: 10, row: 1, col: 0 },
  ];

  const cellSize = 90;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {title && <h4 className="serif-title" style={{ fontSize: 13.5, marginBottom: 8, color: 'var(--gold)' }}>{title}</h4>}
      <svg viewBox="0 0 360 360" className="chart-svg" style={{ maxWidth, width: '100%' }} role="img" aria-label={title || 'South Indian Kundli Chart'}>
        <rect width="360" height="360" fill="var(--surface-alt)" stroke="var(--gold)" strokeWidth="1.8" />
        <rect x="90" y="90" width="180" height="180" fill="var(--bg-ink)" stroke="var(--gold)" strokeWidth="1.4" />

        <line x1="90" y1="0" x2="90" y2="360" stroke="var(--gold)" strokeWidth="1" opacity="0.8" />
        <line x1="180" y1="0" x2="180" y2="90" stroke="var(--gold)" strokeWidth="1" opacity="0.8" />
        <line x1="180" y1="270" x2="180" y2="360" stroke="var(--gold)" strokeWidth="1" opacity="0.8" />
        <line x1="270" y1="0" x2="270" y2="360" stroke="var(--gold)" strokeWidth="1" opacity="0.8" />

        <line x1="0" y1="90" x2="360" y2="90" stroke="var(--gold)" strokeWidth="1" opacity="0.8" />
        <line x1="0" y1="180" x2="90" y2="180" stroke="var(--gold)" strokeWidth="1" opacity="0.8" />
        <line x1="270" y1="180" x2="360" y2="180" stroke="var(--gold)" strokeWidth="1" opacity="0.8" />
        <line x1="0" y1="270" x2="360" y2="270" stroke="var(--gold)" strokeWidth="1" opacity="0.8" />

        <text x="180" y="175" fill="var(--gold)" fontSize="13" fontWeight="700" textAnchor="middle" className="serif-title">
          {title ? title.split(' ')[0] : 'SOUTH'}
        </text>
        <text x="180" y="195" fill="var(--text-muted)" fontSize="10" textAnchor="middle">
          Fixed Signs · ᴿ = Rx
        </text>

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
              <rect
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                className="svg-focusable"
                role={onSelectHouse ? 'button' : undefined}
                tabIndex={onSelectHouse ? 0 : undefined}
                aria-label={`House ${houseNum}, Sign ${c.signIdx + 1}`}
                fill={
                  isSelected
                    ? 'rgba(227, 173, 70, 0.2)'
                    : isLinked
                    ? 'rgba(95, 194, 179, 0.14)'
                    : 'transparent'
                }
                style={{ cursor: onSelectHouse ? 'pointer' : 'default' }}
                onClick={() => onSelectHouse?.(houseNum)}
                onKeyDown={(e) => {
                  if (onSelectHouse && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelectHouse(houseNum);
                  }
                }}
              />

              {isLagna && (
                <line x1={x} y1={y} x2={x + 20} y2={y} stroke="var(--teal)" strokeWidth="3" pointerEvents="none" />
              )}

              <text
                x={x + 7}
                y={y + 16}
                fill={isSelected ? 'var(--gold)' : 'var(--teal)'}
                fontSize="9.5"
                fontWeight="700"
                pointerEvents="none"
              >
                {c.signIdx + 1} (H{houseNum})
              </text>

              {isLagna && (
                <text x={x + cellSize - 6} y={y + 16} fill="var(--gold)" fontSize="9" fontWeight="bold" textAnchor="end" pointerEvents="none">
                  ASC
                </text>
              )}

              {items.length > 0 && (
                <text x={x + cellSize / 2} y={y + 44} fill="var(--text-main)" fontSize="10.5" textAnchor="middle">
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
                            : item.isRetrograde
                            ? 'var(--amber)'
                            : 'var(--text-main)'
                        }
                        fontWeight={item.isLagna || isSelectedPlanet ? '700' : '600'}
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
                        {idx > 0 && idx % 2 === 0 ? <tspan x={x + cellSize / 2} dy="14" /> : idx > 0 ? ' ' : ''}
                        {item.label}
                        {item.isRetrograde ? 'ᴿ' : ''}
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
