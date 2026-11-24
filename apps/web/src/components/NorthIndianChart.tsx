import React from 'react';

export interface ChartPlacement {
  signIndex: number; // 0 = Aries .. 11 = Pisces
  items: Array<{
    label: string;
    isLagna?: boolean;
    isRetrograde?: boolean;
  }>;
}

interface NorthIndianChartProps {
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

const HOUSE_POLYGONS = [
  '180,0 270,90 180,180 90,90',   // H1
  '0,0 180,0 90,90',              // H2
  '0,0 90,90 0,180',              // H3
  '90,90 180,180 90,270 0,180',   // H4
  '0,180 90,270 0,360',           // H5
  '0,360 90,270 180,360',         // H6
  '180,180 270,270 180,360 90,270', // H7
  '180,360 270,270 360,360',      // H8
  '360,360 270,270 360,180',      // H9
  '180,180 270,90 360,180 270,270', // H10
  '360,180 270,90 360,0',         // H11
  '180,0 360,0 270,90',           // H12
];

/**
 * Classical North Indian diamond style Kundli chart.
 * House 1 is always the top central diamond; sign numbers rotate based on Lagna.
 */
export const NorthIndianChart: React.FC<NorthIndianChartProps> = ({
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

  const houseCoords = [
    { numX: 180, numY: 54, textX: 180, textY: 82 },   // H1
    { numX: 90, numY: 22, textX: 90, textY: 42 },     // H2
    { numX: 28, numY: 82, textX: 40, textY: 102 },    // H3
    { numX: 90, numY: 150, textX: 90, textY: 178 },   // H4
    { numX: 28, numY: 254, textX: 40, textY: 274 },   // H5
    { numX: 90, numY: 320, textX: 90, textY: 340 },   // H6
    { numX: 180, numY: 244, textX: 180, textY: 272 }, // H7
    { numX: 270, numY: 320, textX: 270, textY: 340 }, // H8
    { numX: 332, numY: 254, textX: 320, textY: 274 }, // H9
    { numX: 270, numY: 150, textX: 270, textY: 178 }, // H10
    { numX: 332, numY: 82, textX: 320, textY: 102 },  // H11
    { numX: 270, numY: 22, textX: 270, textY: 42 },   // H12
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {title && <h4 className="serif-title" style={{ fontSize: 13.5, marginBottom: 8, color: 'var(--gold)' }}>{title}</h4>}
      <svg viewBox="0 0 360 360" className="chart-svg" style={{ maxWidth, width: '100%' }} role="img" aria-label={title || 'North Indian Kundli Chart'}>
        <rect width="360" height="360" fill="var(--surface-alt)" stroke="var(--gold)" strokeWidth="1.8" />

        {HOUSE_POLYGONS.map((pts, i) => {
          const hNum = i + 1;
          const isSelected = selectedHouse === hNum;
          const isLinked = highlightHouse === hNum && !isSelected;
          return (
            <polygon
              key={`poly-${hNum}`}
              points={pts}
              className="svg-focusable"
              role={onSelectHouse ? 'button' : undefined}
              tabIndex={onSelectHouse ? 0 : undefined}
              aria-label={`House ${hNum}`}
              fill={
                isSelected
                  ? 'rgba(227, 173, 70, 0.2)'
                  : isLinked
                  ? 'rgba(95, 194, 179, 0.14)'
                  : 'transparent'
              }
              style={{ cursor: onSelectHouse ? 'pointer' : 'default' }}
              onClick={() => onSelectHouse?.(hNum)}
              onKeyDown={(e) => {
                if (onSelectHouse && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onSelectHouse(hNum);
                }
              }}
            />
          );
        })}

        <line x1="0" y1="0" x2="360" y2="360" stroke="var(--gold)" strokeWidth="1.2" opacity="0.9" pointerEvents="none" />
        <line x1="360" y1="0" x2="0" y2="360" stroke="var(--gold)" strokeWidth="1.2" opacity="0.9" pointerEvents="none" />
        <polygon points="180,0 360,180 180,360 0,180" fill="none" stroke="var(--gold)" strokeWidth="1.4" pointerEvents="none" />

        {selectedHouse && highlightHouse && selectedHouse !== highlightHouse && (
          <line
            x1={houseCoords[selectedHouse - 1]?.textX ?? 180}
            y1={houseCoords[selectedHouse - 1]?.textY ?? 95}
            x2={houseCoords[highlightHouse - 1]?.textX ?? 180}
            y2={houseCoords[highlightHouse - 1]?.textY ?? 95}
            stroke="var(--teal)"
            strokeWidth="1.6"
            strokeDasharray="4 3"
            opacity="0.75"
            pointerEvents="none"
          />
        )}

        {houseCoords.map((h, i) => {
          const hNum = i + 1;
          const signIdx = (lagnaSignIndex + i) % 12;
          const signNumber = signIdx + 1;
          const items = signItemsMap.get(signIdx) || [];

          return (
            <g key={i}>
              <text
                x={h.numX}
                y={h.numY}
                fill={selectedHouse === hNum ? 'var(--gold)' : 'var(--teal)'}
                fontSize="10.5"
                fontWeight="700"
                textAnchor="middle"
                style={{ cursor: onSelectHouse ? 'pointer' : 'default' }}
                onClick={() => onSelectHouse?.(hNum)}
              >
                {signNumber}
              </text>

              {items.length > 0 && (
                <text
                  x={h.textX}
                  y={h.textY}
                  fill="var(--text-main)"
                  fontSize="10.5"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {items.map((item, idx) => {
                    const planetId = LABEL_TO_PLANET[item.label];
                    const isSelectedPlanet = Boolean(planetId && selectedPlanet === planetId);
                    const shouldBreak = idx > 0 && idx % 2 === 0;
                    return (
                      <tspan
                        key={idx}
                        x={shouldBreak ? h.textX : undefined}
                        dy={shouldBreak ? '13' : undefined}
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
                        {idx > 0 && !shouldBreak ? ' ' : ''}
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
      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
        <span style={{ color: 'var(--amber)', fontWeight: 700 }}>ᴿ</span> = Retrograde • Dashed line = House → Lord placement
      </div>
    </div>
  );
};
