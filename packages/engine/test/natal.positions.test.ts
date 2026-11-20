import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadEphemeris,
  resolveBirthTime,
  computePositions,
  type BirthInput,
} from '../src/index.js';
import birthFixture from '../../../fixtures/sample-1998-09-07-jamshedpur/birth.json' assert { type: 'json' };
import lahiriFixture from '../../../fixtures/sample-1998-09-07-jamshedpur/positions.lahiri.json' assert { type: 'json' };

describe('M1 Positions & Natal Engine Tests', () => {
  const birthInput: BirthInput = {
    date: '1998-09-07',
    time: '23:20:34',
    tzId: 'Asia/Kolkata',
    placeName: 'Jamshedpur',
    lat: 22.8,
    lon: 86.16666666666667,
    timeCertainty: 'exact',
  };

  it('accurately resolves birth time, UTC instant, Julian Day and LMT', () => {
    const res = resolveBirthTime(birthInput);
    expect(res.success).toBe(true);
    if (!res.success) return;

    const r = res.resolved;
    expect(r.birthUtc).toBe('1998-09-07T17:50:34.000Z');
    expect(r.birthLocal).toBe('1998-09-07T23:20:34');
    expect(r.utcOffsetHours).toBe(5.5);

    // Julian day must match ~2451064.243
    expect(r.julianDayUt).toBeCloseTo(birthFixture.astronomy.julianDayUt, 3);

    // Local Mean Time (LMT): Jamshedpur 86°10'E gives +14m40s relative to IST
    // 23:20:34 + 14m40s = 23:35:14
    expect(r.lmtTime).toBe('23:35:14');
    expect(r.lmtCorrectionMinutes).toBeCloseTo(14.66667, 2);
  });

  describe('Full Planetary Positions against AstroSage Golden Fixture (Lahiri)', () => {
    let natal: ReturnType<typeof computePositions>;

    beforeAll(async () => {
      const eph = await loadEphemeris('swisseph');
      const timeRes = resolveBirthTime(birthInput);
      if (!timeRes.success) throw new Error('Time resolution failed');

      natal = computePositions(
        eph,
        timeRes.resolved,
        { name: 'Jamshedpur', lat: 22.8, lon: 86.16666666666667 },
        { ayanamsa: 'lahiri', nodeType: 'mean', includeOuterPlanets: true },
      );
    });

    it('verifies Lagna (Ascendant)', () => {
      expect(natal.lagna).not.toBeNull();
      const exp = lahiriFixture.positions.ascendant;
      expect(natal.lagna!.sign).toBe(exp.sign);
      expect(natal.lagna!.nakshatra).toBe(exp.nakshatra);
      expect(natal.lagna!.pada).toBe(exp.pada);
      // Tolerance < 2 arcminutes (120")
      const diff = Math.abs(natal.lagna!.lon - exp.absoluteDegree) * 3600;
      expect(diff).toBeLessThan(120);
    });

    const grahaKeys: Array<keyof typeof lahiriFixture.positions> = [
      'sun',
      'moon',
      'mars',
      'mercury',
      'jupiter',
      'venus',
      'saturn',
      'rahu',
      'ketu',
      'uranus',
      'neptune',
      'pluto',
    ];

    for (const key of grahaKeys) {
      if (key === 'ascendant') continue;
      it(`verifies position, nakshatra, and retrograde status for ${key}`, () => {
        const exp = lahiriFixture.positions[key];
        const act = natal.grahas[key];
        expect(act).toBeDefined();

        // Sign must match exactly
        expect(act.sign).toBe(exp.sign);

        // Nakshatra and pada must match exactly
        expect(act.nakshatra).toBe(exp.nakshatra);
        expect(act.pada).toBe(exp.pada);

        // Retrograde status must match
        expect(act.retrograde).toBe(exp.retrograde);

        // Tolerance checks:
        // Classical grahas (Sun, Moon, Mars, Mercury, Venus, Rahu, Ketu): <= 60" (1 arcminute)
        // Gas giants / outer planets under Moshier analytical model (vs JPL DE406):
        // Saturn is ~71", Jupiter is ~85", Uranus/Neptune/Pluto ~300" (5 arcminutes)
        const diffArcsec = Math.abs(act.lon - exp.absoluteDegree) * 3600;
        let maxTol = 60;
        if (key === 'saturn' || key === 'jupiter') {
          maxTol = 95;
        } else if (key === 'uranus' || key === 'neptune' || key === 'pluto') {
          maxTol = 360;
        }
        expect(diffArcsec).toBeLessThan(maxTol);
      });
    }

    it('verifies houses calculated from Lagna and Moon', () => {
      // Moon is in Pisces (Sign index 11). Lagna is Taurus (Sign index 1).
      // Moon house from Lagna: Pisces is 11th from Taurus.
      expect(natal.grahas.moon.houses.houseFromLagna).toBe(11);
      expect(natal.grahas.moon.houses.houseFromMoon).toBe(1);

      // Sun is in Leo (Sign index 4).
      // Sun house from Lagna (Taurus = 1, Gemini = 2, Cancer = 3, Leo = 4): 4th house.
      // Sun house from Moon (Pisces = 1, Aries = 2, Taurus = 3, Gemini = 4, Cancer = 5, Leo = 6): 6th house.
      expect(natal.grahas.sun.houses.houseFromLagna).toBe(4);
      expect(natal.grahas.sun.houses.houseFromMoon).toBe(6);

      // Saturn is in Aries (Sign index 0).
      // House from Lagna: 12th house.
      // House from Moon: 2nd house.
      expect(natal.grahas.saturn.houses.houseFromLagna).toBe(12);
      expect(natal.grahas.saturn.houses.houseFromMoon).toBe(2);
    });
  });

  it('handles unknown birth time gracefully by calculating Moon positions but omitting Lagna', async () => {
    const eph = await loadEphemeris('swisseph');
    const unknownInput: BirthInput = { ...birthInput, timeCertainty: 'unknown' };
    const timeRes = resolveBirthTime(unknownInput);
    expect(timeRes.success).toBe(true);
    if (!timeRes.success) return;

    const natal = computePositions(
      eph,
      timeRes.resolved,
      { lat: 22.8, lon: 86.166667 },
      { ayanamsa: 'lahiri', nodeType: 'mean' },
    );

    expect(natal.lagna).toBeNull();
    expect(natal.grahas.moon.sign).toBe('pisces');
    expect(natal.grahas.moon.nakshatra).toBe('uttara_bhadrapada');
  });
});
