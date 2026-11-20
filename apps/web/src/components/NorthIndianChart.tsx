import React from 'react';
import { SIGNS, type Sign } from '@astro/engine';

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
  onSelectHouse,
  onSelectPlanet,
}) => {
  // Map sign index to placed items
  const signItemsMap = new Map<number, ChartPlacement['items']>();
  for (const p of placements) {
    signItemsMap.set(p.signIndex, p.items);
  }

  // 12 Houses in standard North Indian layout coordinates:
  // House 1: Top diamond (center 180, 90)
  // House 2: Top-left triangle (center 90, 45)
  // House 3: Left-top triangle (center 45, 90)
  // House 4: Left diamond (center 90, 180)
  // House 5: Left-bottom triangle (center 45, 270)
  // House 6: Bottom-left triangle (center 90, 315)
  // House 7: Bottom diamond (center 180, 270)
  // House 8: Bottom-right triangle (center 270, 315)
  // House 9: Right-bottom triangle (center 315, 270)
  // House 10: Right diamond (center 270, 180)
  // House 11: Right-top triangle (center 315, 90)
  // House 12: Top-right triangle (center 270, 45)
  const houseCoords = [
    { numX: 180, numY: 65, textX: 180, textY: 95 },   // H1
    { numX: 95,  numY: 30, textX: 95,  textY: 50 },   // H2
    { numX: 30,  numY: 95, textX: 45,  textY: 120 },  // H3
    { numX: 85,  numY: 165, textX: 85, textY: 195 },  // H4
    { numX: 30,  numY: 265, textX: 45, textY: 290 },  // H5
    { numX: 95,  numY: 335, textX: 95, textY: 355 },  // H6
    { numX: 180, numY: 255, textX: 180, textY: 285 }, // H7
    { numX: 265, numY: 335, textX: 265, textY: 355 }, // H8
    { numX: 330, numY: 265, textX: 315, textY: 290 }, // H9
    { numX: 275, numY: 165, textX: 275, textY: 195 }, // H10
    { numX: 330, numY: 95, textX: 315, textY: 120 },  // H11
    { numX: 265, numY: 30, textX: 265, textY: 50 },   // H12
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {title && <h4 className="serif-title" style={{ fontSize: 13, marginBottom: 8, color: 'var(--gold)' }}>{title}</h4>}
      <svg viewBox="0 0 360 360" className="chart-svg" style={{ maxWidth: 360, width: '100%' }}>
        {/* Outer Box */}
        <rect width="360" height="360" fill="var(--surface-alt)" stroke="var(--gold)" strokeWidth="1.8" />

        {/* Clickable House Polygons */}
        {HOUSE_POLYGONS.map((pts, i) => {
          const hNum = i + 1;
          const isSelected = selectedHouse === hNum;
          const isLinked = highlightHouse === hNum && !isSelected;
          return (
            <polygon
              key={`poly-${hNum}`}
              points={pts}
              fill={
                isSelected
                  ? 'rgba(227, 173, 70, 0.18)'
                  : isLinked
                  ? 'rgba(95, 194, 179, 0.14)'
                  : 'transparent'
              }
              style={{ cursor: onSelectHouse ? 'pointer' : 'default' }}
              onClick={() => onSelectHouse?.(hNum)}
            />
          );
        })}

        {/* Diagonals */}
        <line x1="0" y1="0" x2="360" y2="360" stroke="var(--gold)" strokeWidth="1.2" opacity="0.9" pointerEvents="none" />
        <line x1="360" y1="0" x2="0" y2="360" stroke="var(--gold)" strokeWidth="1.2" opacity="0.9" pointerEvents="none" />
        {/* Inner Diamond */}
        <polygon points="180,0 360,180 180,360 0,180" fill="none" stroke="var(--gold)" strokeWidth="1.4" pointerEvents="none" />

        {/* Dashed House -> Lord Placement Connector */}
        {selectedHouse && highlightHouse && selectedHouse !== highlightHouse && (
          <line
            x1={houseCoords[selectedHouse - 1]?.textX ?? 180}
            y1={houseCoords[selectedHouse - 1]?.textY ?? 95}
            x2={houseCoords[highlightHouse - 1]?.textX ?? 180}
            y2={houseCoords[highlightHouse - 1]?.textY ?? 95}
            stroke="var(--teal)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.7"
            pointerEvents="none"
          />
        )}

        {/* 12 Houses content */}
        {houseCoords.map((h, i) => {
          const hNum = i + 1;
          const signIdx = (lagnaSignIndex + i) % 12;
          const signNumber = signIdx + 1; // 1 = Aries .. 12 = Pisces
          const items = signItemsMap.get(signIdx) || [];

          return (
            <g key={i}>
              {/* Sign Number */}
              <text
                x={h.numX}
                y={h.numY}
                fill={selectedHouse === hNum ? 'var(--gold)' : 'var(--teal)'}
                fontSize="11"
                fontWeight="700"
                textAnchor="middle"
                style={{ cursor: onSelectHouse ? 'pointer' : 'default' }}
                onClick={() => onSelectHouse?.(hNum)}
              >
                {signNumber}
              </text>

              {/* Grahas in this House / Sign */}
              {items.length > 0 && (
                <text
                  x={h.textX}
                  y={h.textY}
                  fill="var(--text-main)"
                  fontSize="10"
                  fontWeight="500"
                  textAnchor="middle"
                >
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
                        {idx > 0 ? ' ' : ''}
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
