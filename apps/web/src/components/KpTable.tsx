import React, { useMemo } from 'react';
import {
  calculateKpPlacement,
  degToDms,
  VEDIC_GRAHAS,
  type NatalChart,
  type KpPlacement,
  type VedicGraha,
} from '@astro/engine';

interface KpTableProps {
  natal: NatalChart;
}

const SHORT_PLANET: Record<string, string> = {
  sun: 'SUN',
  moon: 'MON',
  mars: 'MAR',
  mercury: 'MER',
  jupiter: 'JUP',
  venus: 'VEN',
  saturn: 'SAT',
  rahu: 'RAH',
  ketu: 'KET',
};

export const KpTable: React.FC<KpTableProps> = ({ natal }) => {
  const { planetRows, cusps, houseSignificators, planetSignifications } = useMemo(() => {
    const lagnaLon = natal.lagna?.lon ?? 0;
    const lagnaSignIndex = natal.lagna?.signIndex ?? 0;

    const rows: Array<{ id: string; name: string; house: number; kp: KpPlacement }> = [];
    const planetStarLord: Record<string, VedicGraha> = {};
    const occupantsByHouse: Record<number, VedicGraha[]> = {};
    for (let h = 1; h <= 12; h++) occupantsByHouse[h] = [];

    for (const gId of VEDIC_GRAHAS) {
      const g = natal.grahas[gId];
      if (!g) continue;
      const kp = calculateKpPlacement(g.lon);
      const house = g.houses?.houseFromLagna ?? (((g.signIndex - lagnaSignIndex + 12) % 12) + 1);
      planetStarLord[gId] = kp.starLord;
      occupantsByHouse[house]?.push(gId);
      rows.push({ id: gId, name: g.name, house, kp });
    }

    if (natal.lagna) {
      rows.unshift({
        id: 'ascendant',
        name: 'Ascendant',
        house: 1,
        kp: calculateKpPlacement(natal.lagna.lon),
      });
    }

    const cuspList: Array<{ cusp: number; deg: number; kp: KpPlacement }> = [];
    for (let c = 1; c <= 12; c++) {
      const cuspLon = (lagnaLon + (c - 1) * 30) % 360;
      cuspList.push({
        cusp: c,
        deg: cuspLon,
        kp: calculateKpPlacement(cuspLon),
      });
    }

    // Classical 4-tier KP House Significators computed dynamically from active NatalChart:
    // A: Planets in the star of occupants of house H
    // B: Occupants of house H
    // C: Planets in the star of lord of house H
    // D: Lord of house H
    const planetToHouses: Record<string, number[]> = {};
    for (const gId of VEDIC_GRAHAS) planetToHouses[gId] = [];

    const hSigList = cuspList.map((c) => {
      const occ = occupantsByHouse[c.cusp] ?? [];
      const houseLord = c.kp.rashiLord as VedicGraha;
      const orderedSet = new Set<VedicGraha>();

      // Tier A: in star of occupants
      for (const p of VEDIC_GRAHAS) {
        if (occ.includes(planetStarLord[p]!)) orderedSet.add(p);
      }
      // Tier B: occupants
      for (const p of occ) orderedSet.add(p);
      // Tier C: in star of house lord
      for (const p of VEDIC_GRAHAS) {
        if (planetStarLord[p] === houseLord) orderedSet.add(p);
      }
      // Tier D: house lord
      orderedSet.add(houseLord);

      const planetsArr = Array.from(orderedSet);
      for (const p of planetsArr) {
        planetToHouses[p]?.push(c.cusp);
      }
      return {
        house: c.cusp,
        planets: planetsArr.map((p) => SHORT_PLANET[p] ?? p.toUpperCase()).join(', '),
      };
    });

    const pSigList = VEDIC_GRAHAS.map((gId) => ({
      planet: gId.charAt(0).toUpperCase() + gId.slice(1),
      houses: (planetToHouses[gId] ?? []).join(', ') || '—',
    }));

    return {
      planetRows: rows,
      cusps: cuspList,
      houseSignificators: hSigList,
      planetSignifications: pSigList,
    };
  }, [natal]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KP Planetary Details Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)' }}>
            KP System &amp; Nakshatra Nadi (Sub-Lord Details)
          </h3>
          <span className="gold-badge" style={{ fontSize: 10.5 }}>
            KP Sub-Lords &amp; Significators
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textAlign: 'left' }}>
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
          12 House Cuspal Positions &amp; Sub-Lords
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textAlign: 'left' }}>
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

      {/* Dynamic KP Significators */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div className="card">
          <h3 className="serif-title" style={{ fontSize: 13.5, color: 'var(--gold)', marginBottom: 10 }}>
            Significators of Houses (4-Tier)
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textAlign: 'left' }}>
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

        <div className="card">
          <h3 className="serif-title" style={{ fontSize: 13.5, color: 'var(--gold)', marginBottom: 10 }}>
            Planet Significations
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textAlign: 'left' }}>
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
