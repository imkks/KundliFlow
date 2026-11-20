import { describe, it, expect, beforeAll } from 'vitest';
import {
  angleDiff,
  computeArudhaPadas,
  computeAshtakoota,
  computePositions,
  computeUpagrahas,
  computeVarshaphal,
  loadEphemeris,
  resolveBirthTime,
  type EphemerisProvider,
} from '../src/index.js';

describe('AstroSage Extra Engines: Upagrahas, Arudha Padas, Varshaphal, Ashtakoota', () => {
  let eph: EphemerisProvider;

  beforeAll(async () => {
    eph = await loadEphemeris('swisseph');
  });

  it('computes all 7 Upagrahas, 12 Arudha Padas, 2026 Varshaphal, and 36-pt Ashtakoota', () => {
    const res = resolveBirthTime({
      date: '1998-09-07',
      time: '23:20:34',
      tzId: 'Asia/Kolkata',
      placeName: 'Jamshedpur',
      lat: 22.8,
      lon: 86.166667,
      timeCertainty: 'exact',
    });
    if (!res.success) throw new Error(res.message);

    const natal = computePositions(
      eph,
      res.resolved,
      { name: 'Jamshedpur', lat: 22.8, lon: 86.166667 },
      { ayanamsa: 'lahiri', nodeType: 'mean' },
    );

    // 1. Upagrahas
    const upagrahas = computeUpagrahas(natal);
    expect(upagrahas).toHaveLength(7);
    expect(upagrahas.map((u) => u.id)).toContain('dhuma');
    expect(upagrahas.map((u) => u.id)).toContain('gulika');

    // 2. Arudha Padas (AL .. UL)
    const arudhas = computeArudhaPadas(natal);
    expect(arudhas).toHaveLength(12);
    expect(arudhas[0]?.code).toBe('AL');
    expect(arudhas[11]?.code).toBe('UL');

    // 3. Varshaphal 2026
    const varsha = computeVarshaphal(eph, natal, 2026);
    expect(varsha.targetYear).toBe(2026);
    expect(varsha.completedAge).toBe(28);
    expect(Math.abs(angleDiff(varsha.annualChart.grahas.sun.lon, natal.grahas.sun.lon))).toBeLessThan(0.01);

    // 4. Ashtakoota
    const match = computeAshtakoota(
      { moonSignIndex: natal.grahas.moon.signIndex, moonNakshatraIndex: natal.grahas.moon.nakshatraIndex },
      { moonSignIndex: 1, moonNakshatraIndex: 3 }, // Taurus / Rohini
    );
    expect(match.maxPoints).toBe(36);
    expect(match.kootas).toHaveLength(8);
    expect(match.totalPoints).toBeGreaterThanOrEqual(0);
    expect(match.totalPoints).toBeLessThanOrEqual(36);
  });
});
