import React, { useState } from 'react';
import {
  Compass,
  Layers,
  Sparkles,
  Info,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { NatalChart, VedicGraha } from '@astro/engine';
import type { TransitOverview } from '@astro/engine';
import { SIGNS } from '@astro/engine';

interface DualKundliChartProps {
  natalChart: NatalChart;
  transits?: TransitOverview;
  onSelectHouse?: (houseNumber: number) => void;
  selectedHouse?: number;
  defaultChartStyle?: 'north' | 'south';
}

const GRAHA_ABBR: Record<string, string> = {
  sun: 'Su',
  moon: 'Mo',
  mars: 'Ma',
  mercury: 'Me',
  jupiter: 'Ju',
  venus: 'Ve',
  saturn: 'Sa',
  rahu: 'Ra',
  ketu: 'Ke',
  uranus: 'Ur',
  neptune: 'Ne',
  pluto: 'Pl',
};

// North Indian diamond diamond center coordinates for houses 1 to 12
const NORTH_HOUSE_POSITIONS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 130 },
  2: { x: 100, y: 65 },
  3: { x: 65, y: 100 },
  4: { x: 130, y: 200 },
  5: { x: 65, y: 300 },
  6: { x: 100, y: 335 },
  7: { x: 200, y: 270 },
  8: { x: 300, y: 335 },
  9: { x: 335, y: 300 },
  10: { x: 270, y: 200 },
  11: { x: 335, y: 100 },
  12: { x: 300, y: 65 },
};

export const DualKundliChart: React.FC<DualKundliChartProps> = ({
  natalChart,
  transits,
  onSelectHouse,
  selectedHouse = 1,
  defaultChartStyle = 'north',
}) => {
  const [chartStyle, setChartStyle] = useState<'north' | 'south'>(defaultChartStyle);
  const [displayMode, setDisplayMode] = useState<'dual' | 'natal' | 'transit'>('dual');

  React.useEffect(() => {
    setChartStyle(defaultChartStyle);
  }, [defaultChartStyle]);

  const lagnaSignIndex = natalChart.lagna?.signIndex ?? 1;

  // Group planets by house (1 to 12)
  const housePlacements: Record<
    number,
    {
      signIndex: number;
      signName: string;
      natal: Array<{ label: string; deg: number; retro: boolean }>;
      transit: Array<{ label: string; deg: number; retro: boolean }>;
    }
  > = {};

  for (let h = 1; h <= 12; h++) {
    const sIndex = (lagnaSignIndex + h - 1) % 12;
    housePlacements[h] = {
      signIndex: sIndex,
      signName: SIGNS[sIndex]!,
      natal: [],
      transit: [],
    };
  }

  // Populate natal grahas
  const primaryGrahas = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'] as const;
  for (const g of primaryGrahas) {
    const d = natalChart.grahas[g];
    if (d) {
      const h = ((d.signIndex - lagnaSignIndex + 12) % 12) + 1;
      housePlacements[h]?.natal.push({
        label: GRAHA_ABBR[g] || g.slice(0, 2),
        deg: Math.floor(d.degInSign),
        retro: d.retrograde,
      });
    }
  }

  // Populate transit grahas
  if (transits) {
    for (const g of primaryGrahas) {
      const tp = transits.transits[g];
      if (tp) {
        const h = ((tp.signIndex - lagnaSignIndex + 12) % 12) + 1;
        housePlacements[h]?.transit.push({
          label: GRAHA_ABBR[g] || g.slice(0, 2),
          deg: Math.floor(tp.degInSign),
          retro: tp.retrograde,
        });
      }
    }
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Chart Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 className="serif-title" style={{ fontSize: 16, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Compass size={18} /> Dual Kundli: Live Gochar Transits Over Natal Promise
          </h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Gold = Your Natal Birth Blueprint • Cyan/Teal = Live Transiting Grahas Right Now
          </p>
        </div>

        {/* View toggles */}
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Display Mode */}
          <div style={{ display: 'flex', background: 'var(--surface-alt)', padding: 2, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
            {(['dual', 'natal', 'transit'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setDisplayMode(m)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  border: 'none',
                  textTransform: 'capitalize',
                  background: displayMode === m ? 'var(--gold)' : 'transparent',
                  color: displayMode === m ? '#15132b' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                {m === 'dual' ? 'Dual Overlay' : m}
              </button>
            ))}
          </div>

          {/* Style Mode */}
          <div style={{ display: 'flex', background: 'var(--surface-alt)', padding: 2, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
            {(['north', 'south'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setChartStyle(s)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  border: 'none',
                  textTransform: 'capitalize',
                  background: chartStyle === s ? 'var(--teal)' : 'transparent',
                  color: chartStyle === s ? '#15132b' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                {s} Indian
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px 0' }}>
        {chartStyle === 'north' ? (
          <svg viewBox="0 0 400 400" style={{ width: '100%', maxWidth: 440, height: 'auto', background: '#110f22', borderRadius: 12, border: '1px solid var(--border)' }}>
            {/* Outer Boundary */}
            <rect x="10" y="10" width="380" height="380" fill="none" stroke="var(--gold)" strokeWidth="1.5" />

            {/* Inner Diagonal Lines */}
            <line x1="10" y1="10" x2="390" y2="390" stroke="var(--gold)" strokeWidth="1" strokeOpacity="0.7" />
            <line x1="390" y1="10" x2="10" y2="390" stroke="var(--gold)" strokeWidth="1" strokeOpacity="0.7" />

            {/* Diamond Lines */}
            <polygon points="200,10 390,200 200,390 10,200" fill="none" stroke="var(--gold)" strokeWidth="1" strokeOpacity="0.7" />

            {/* House Interactive Zones & Content */}
            {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const).map((h) => {
              const pos = NORTH_HOUSE_POSITIONS[h]!;
              const hp = housePlacements[h]!;
              const isSelected = selectedHouse === h;

              return (
                <g
                  key={h}
                  onClick={() => onSelectHouse?.(h)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Selection Indicator Ring */}
                  {isSelected && (
                    <circle cx={pos.x} cy={pos.y} r="26" fill="rgba(227, 173, 70, 0.2)" stroke="var(--gold)" strokeWidth="1" strokeDasharray="3,3" />
                  )}

                  {/* Sign Number */}
                  <text
                    x={pos.x}
                    y={pos.y - 14}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    fill="rgba(255, 255, 255, 0.45)"
                  >
                    H{h} ({hp.signIndex + 1})
                  </text>

                  {/* Natal Planets (Gold) */}
                  {(displayMode === 'dual' || displayMode === 'natal') && (
                    <text x={pos.x} y={pos.y} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--gold)">
                      {hp.natal.map((p) => `${p.label}${p.retro ? '®' : ''}`).join(' ')}
                    </text>
                  )}

                  {/* Transit Planets (Teal) */}
                  {(displayMode === 'dual' || displayMode === 'transit') && hp.transit.length > 0 && (
                    <text
                      x={pos.x}
                      y={pos.y + 13}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="700"
                      fill="var(--teal)"
                    >
                      {hp.transit.map((p) => `·${p.label}${p.retro ? '®' : ''}`).join(' ')}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        ) : (
          /* South Indian 4x4 Grid */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 95px)',
              gridTemplateRows: 'repeat(4, 95px)',
              gap: 2,
              background: 'var(--border)',
              padding: 2,
              borderRadius: 10,
              maxWidth: 390,
            }}
          >
            {/* South Indian 12 Signs in Fixed Clockwise Order:
                Pisces (11), Aries (0), Taurus (1), Gemini (2)
                Aquarius (10), Center, Center, Cancer (3)
                Capricorn (9), Center, Center, Leo (4)
                Sagittarius (8), Scorpio (7), Libra (6), Virgo (5)
            */}
            {[11, 0, 1, 2, 10, -1, -2, 3, 9, -3, -4, 4, 8, 7, 6, 5].map((sIndex, idx) => {
              if (sIndex < 0) {
                if (idx === 5) {
                  return (
                    <div
                      key={idx}
                      style={{
                        gridColumn: 'span 2',
                        gridRow: 'span 2',
                        background: '#110f22',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        color: 'var(--gold)',
                        fontWeight: 700,
                        textAlign: 'center',
                        padding: 8,
                      }}
                    >
                      <Sparkles size={18} style={{ color: 'var(--gold)', marginBottom: 4 }} />
                      <div>DUAL KUNDLI</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>South Indian Style</div>
                    </div>
                  );
                }
                return null;
              }

              // Find which house this sign is
              const h = ((sIndex - lagnaSignIndex + 12) % 12) + 1;
              const hp = housePlacements[h]!;
              const isSelected = selectedHouse === h;
              const isLagna = sIndex === lagnaSignIndex;

              return (
                <div
                  key={idx}
                  onClick={() => onSelectHouse?.(h)}
                  style={{
                    background: isSelected
                      ? 'rgba(227, 173, 70, 0.25)'
                      : '#110f22',
                    border: isSelected ? '1px solid var(--gold)' : '1px solid transparent',
                    borderRadius: 4,
                    padding: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 9 }}>
                    <span style={{ fontWeight: isLagna ? 800 : 500, color: isLagna ? 'var(--gold)' : 'inherit' }}>
                      {SIGNS[sIndex]?.slice(0, 3).toUpperCase()} {isLagna && '(ASC)'}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>H{h}</span>
                  </div>

                  {/* Natal Planets */}
                  {(displayMode === 'dual' || displayMode === 'natal') && (
                    <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 10, textAlign: 'center' }}>
                      {hp.natal.map((p) => `${p.label}${p.retro ? '®' : ''}`).join(' ')}
                    </div>
                  )}

                  {/* Transit Planets */}
                  {(displayMode === 'dual' || displayMode === 'transit') && hp.transit.length > 0 && (
                    <div style={{ fontWeight: 700, color: 'var(--teal)', fontSize: 9, textAlign: 'center' }}>
                      {hp.transit.map((p) => `·${p.label}${p.retro ? '®' : ''}`).join(' ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Hint */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
        <span>Tip: Click on any house to open its detailed Life Domain dossier below</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--gold)', fontWeight: 700 }}>● Natal Planet</span>
          <span style={{ color: 'var(--teal)', fontWeight: 700 }}>● Live Transit (Gochar)</span>
        </span>
      </div>
    </div>
  );
};
