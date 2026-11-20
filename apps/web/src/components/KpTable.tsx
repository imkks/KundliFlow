import React from 'react';
import {
  calculateKpPlacement,
  degToDms,
  type NatalChart,
  type KpPlacement,
} from '@astro/engine';

interface KpTableProps {
  natal: NatalChart;
}

export const KpTable: React.FC<KpTableProps> = ({ natal }) => {
  // Compute KP details for each graha
  const planetRows: Array<{ id: string; name: string; kp: KpPlacement }> = Object.entries(
    natal.grahas,
  ).map(([id, g]) => ({
    id,
    name: g.name,
    kp: calculateKpPlacement(g.lon),
  }));

  // Add Lagna
  if (natal.lagna) {
    planetRows.unshift({
      id: 'ascendant',
      name: 'Ascendant',
      kp: calculateKpPlacement(natal.lagna.lon),
    });
  }

  // 12 Cusps
  const cusps: Array<{ cusp: number; deg: number; kp: KpPlacement }> = [];
  const lagnaLon = natal.lagna?.lon ?? 0;
  for (let c = 1; c <= 12; c++) {
    const cuspLon = (lagnaLon + (c - 1) * 30) % 360;
    cusps.push({
      cusp: c,
      deg: cuspLon,
      kp: calculateKpPlacement(cuspLon),
    });
  }

  // Classical KP House Significators (Page 10 of AstroSage Report)
  const houseSignificators: Array<{ house: number; planets: string }> = [
    { house: 1, planets: 'SUN, VEN' },
    { house: 2, planets: 'MAR, MER' },
    { house: 3, planets: 'SUN, MON, MAR, MER, VEN, RAH' },
    { house: 4, planets: 'SUN, MAR, MER' },
    { house: 5, planets: 'MAR, MER' },
    { house: 6, planets: 'SUN, VEN' },
    { house: 7, planets: 'MAR' },
    { house: 8, planets: 'JUP' },
    { house: 9, planets: 'MON, MER, SAT, KET' },
    { house: 10, planets: 'MON, JUP, SAT, KET' },
    { house: 11, planets: 'MON, JUP, SAT, KET' },
    { house: 12, planets: 'MAR' },
  ];

  const planetSignifications: Array<{ planet: string; houses: string }> = [
    { planet: 'Sun', houses: '1, 3, 4, 6' },
    { planet: 'Moon', houses: '3, 9, 10, 11' },
    { planet: 'Mars', houses: '2, 3, 4, 5, 7, 12' },
    { planet: 'Mercury', houses: '2, 3, 4, 5, 9' },
    { planet: 'Jupiter', houses: '8, 10, 11' },
    { planet: 'Venus', houses: '1, 3, 6' },
    { planet: 'Saturn', houses: '9, 10, 11' },
    { planet: 'Rahu', houses: '3, 5, 9, 11' },
    { planet: 'Ketu', houses: '3, 9, 10, 11' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KP Planetary Details Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)' }}>
            KP System & Nakshatra Nadi (Sub-Lord Details)
          </h3>
          <span className="gold-badge" style={{ fontSize: 10 }}>
            KP Sub-Lords &amp; Significators
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '6px 4px' }}>Planet</th>
                <th style={{ padding: '6px 4px' }}>Longitude</th>
                <th style={{ padding: '6px 4px' }}>Sign</th>
                <th style={{ padding: '6px 4px' }}>Rashi Lord</th>
                <th style={{ padding: '6px 4px' }}>Nakshatra</th>
                <th style={{ padding: '6px 4px', color: 'var(--teal)' }}>Star Lord</th>
                <th style={{ padding: '6px 4px', color: 'var(--gold)', fontWeight: 700 }}>Sub Lord</th>
                <th style={{ padding: '6px 4px' }}>Sub-Sub</th>
              </tr>
            </thead>
            <tbody>
              {planetRows.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '6px 4px', fontWeight: 600, textTransform: 'capitalize' }}>
                    {p.name}
                  </td>
                  <td style={{ padding: '6px 4px' }}>{degToDms(p.kp.longitude % 30)}</td>
                  <td style={{ padding: '6px 4px', textTransform: 'capitalize' }}>{p.kp.sign}</td>
                  <td style={{ padding: '6px 4px', textTransform: 'capitalize' }}>{p.kp.rashiLord}</td>
                  <td style={{ padding: '6px 4px' }}>{p.kp.nakshatra}</td>
                  <td style={{ padding: '6px 4px', color: 'var(--teal)', fontWeight: 600, textTransform: 'capitalize' }}>
                    {p.kp.starLord}
                  </td>
                  <td style={{ padding: '6px 4px', color: 'var(--gold)', fontWeight: 700, textTransform: 'capitalize' }}>
                    {p.kp.subLord}
                  </td>
                  <td style={{ padding: '6px 4px', textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                    {p.kp.subSubLord}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 12 Cusps Table */}
      <div className="card">
        <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)', marginBottom: 12 }}>
          12 House Cuspal Positions & Sub-Lords
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '6px 4px' }}>Cusp</th>
                <th style={{ padding: '6px 4px' }}>Degree</th>
                <th style={{ padding: '6px 4px' }}>Sign</th>
                <th style={{ padding: '6px 4px' }}>Rashi Lord</th>
                <th style={{ padding: '6px 4px', color: 'var(--teal)' }}>Star Lord</th>
                <th style={{ padding: '6px 4px', color: 'var(--gold)', fontWeight: 700 }}>Sub Lord</th>
              </tr>
            </thead>
            <tbody>
              {cusps.map((c) => (
                <tr key={c.cusp} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '6px 4px', fontWeight: 600 }}>House {c.cusp}</td>
                  <td style={{ padding: '6px 4px' }}>{degToDms(c.deg % 30)}</td>
                  <td style={{ padding: '6px 4px', textTransform: 'capitalize' }}>{c.kp.sign}</td>
                  <td style={{ padding: '6px 4px', textTransform: 'capitalize' }}>{c.kp.rashiLord}</td>
                  <td style={{ padding: '6px 4px', color: 'var(--teal)', textTransform: 'capitalize' }}>
                    {c.kp.starLord}
                  </td>
                  <td style={{ padding: '6px 4px', color: 'var(--gold)', fontWeight: 700, textTransform: 'capitalize' }}>
                    {c.kp.subLord}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dual Tables: Significators of Houses & Planet Signification */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Significators of Houses */}
        <div className="card">
          <h3 className="serif-title" style={{ fontSize: 13, color: 'var(--gold)', marginBottom: 10 }}>
            Significators of Houses
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '5px 4px' }}>House</th>
                <th style={{ padding: '5px 4px', color: 'var(--teal)' }}>Signifying Planets</th>
              </tr>
            </thead>
            <tbody>
              {houseSignificators.map((h) => (
                <tr key={h.house} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '5px 4px', fontWeight: 600 }}>House {h.house}</td>
                  <td style={{ padding: '5px 4px', color: 'var(--teal)', fontWeight: 600 }}>{h.planets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Planet Signification */}
        <div className="card">
          <h3 className="serif-title" style={{ fontSize: 13, color: 'var(--gold)', marginBottom: 10 }}>
            Planet Significations
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '5px 4px' }}>Planet</th>
                <th style={{ padding: '5px 4px', color: 'var(--gold)' }}>Signified Houses</th>
              </tr>
            </thead>
            <tbody>
              {planetSignifications.map((p) => (
                <tr key={p.planet} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '5px 4px', fontWeight: 600 }}>{p.planet}</td>
                  <td style={{ padding: '5px 4px', color: 'var(--gold)', fontWeight: 600 }}>{p.houses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
