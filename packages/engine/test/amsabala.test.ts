import { describe, it, expect } from 'vitest';
import {
  evaluatePushkara,
  evaluateVaisheshikamsa,
  computeChartVaisheshikamsa,
  PUSHKARA_BHAGA_DEGREES,
  type NatalChart,
} from '../src/index.js';

describe('Vaisheshikamsa, Dasavarga Amsabala & Pushkara Navamsha Suite', () => {
  it('correctly identifies Pushkara Navamsha across all four elements (Fire, Earth, Air, Water)', () => {
    // 1. Fire Sign (Aries = sign 0):
    // 7th Navamsha: 20° to 23°20' (e.g. 21° Aries = lon 21)
    const pFire7 = evaluatePushkara(21.0);
    expect(pFire7.isPushkaraNavamsha).toBe(true);
    expect(pFire7.navamshaSign).toBe('libra');
    expect(pFire7.isPushkaraBhaga).toBe(true); // 21° is PB for Aries

    // 9th Navamsha: 26°40' to 30° (e.g. 28° Aries = lon 28)
    const pFire9 = evaluatePushkara(28.0);
    expect(pFire9.isPushkaraNavamsha).toBe(true);
    expect(pFire9.navamshaSign).toBe('sagittarius');
    expect(pFire9.isPushkaraBhaga).toBe(false);

    // Non-pushkara in Aries: 5° Aries
    const pFireNorm = evaluatePushkara(5.0);
    expect(pFireNorm.isPushkaraNavamsha).toBe(false);

    // 2. Earth Sign (Taurus = sign 1, lon 30 to 60):
    // 3rd Navamsha: 6°40' to 10°00' (lon 30 + 8 = 38)
    const pEarth3 = evaluatePushkara(38.0);
    expect(pEarth3.isPushkaraNavamsha).toBe(true);
    expect(pEarth3.navamshaSign).toBe('pisces');

    // 5th Navamsha: 13°20' to 16°40' (lon 30 + 14 = 44)
    const pEarth5 = evaluatePushkara(44.0);
    expect(pEarth5.isPushkaraNavamsha).toBe(true);
    expect(pEarth5.navamshaSign).toBe('taurus');
    expect(pEarth5.isPushkaraBhaga).toBe(true); // 14° is PB for Taurus

    // 3. Air Sign (Gemini = sign 2, lon 60 to 90):
    // 6th Navamsha: 16°40' to 20°00' (lon 60 + 18 = 78)
    const pAir6 = evaluatePushkara(78.0);
    expect(pAir6.isPushkaraNavamsha).toBe(true);
    expect(pAir6.navamshaSign).toBe('pisces');
    expect(pAir6.isPushkaraBhaga).toBe(true); // 18° is PB for Gemini

    // 8th Navamsha: 23°20' to 26°40' (lon 60 + 25 = 85)
    const pAir8 = evaluatePushkara(85.0);
    expect(pAir8.isPushkaraNavamsha).toBe(true);
    expect(pAir8.navamshaSign).toBe('taurus');

    // 4. Water Sign (Cancer = sign 3, lon 90 to 120):
    // 1st Navamsha: 0° to 3°20' (lon 90 + 2 = 92)
    const pWater1 = evaluatePushkara(92.0);
    expect(pWater1.isPushkaraNavamsha).toBe(true);
    expect(pWater1.navamshaSign).toBe('cancer');

    // 3rd Navamsha: 6°40' to 10°00' (lon 90 + 8 = 98)
    const pWater3 = evaluatePushkara(98.0);
    expect(pWater3.isPushkaraNavamsha).toBe(true);
    expect(pWater3.navamshaSign).toBe('virgo');
    expect(pWater3.isPushkaraBhaga).toBe(true); // 8° is PB for Cancer
  });

  it('evaluates Pushkara Bhaga degrees for all 12 signs', () => {
    PUSHKARA_BHAGA_DEGREES.forEach((deg, signIndex) => {
      const lon = signIndex * 30 + deg;
      const res = evaluatePushkara(lon);
      expect(res.isPushkaraBhaga).toBe(true);
      expect(res.pushkaraBhagaDeg).toBe(deg);
    });
  });

  it('evaluates Vargottama and Vaisheshikamsa dignity tiers in Dasavarga', () => {
    // Sun in Aries 10° (Exalted in D1): lon = 10
    // In D1: Aries (exalted)
    // In D9: Aries (0°-3°20'), Taurus (3°20'-6°40'), Gemini (6°40'-10°00')
    // At exactly 10.01°: Cancer
    // Let's test a planet at 1° Aries (0 to 3°20' of movable sign is Vargottama):
    const sunVargottama = evaluateVaisheshikamsa('sun', 1.5);
    expect(sunVargottama.vargottama).toBe(true);
    expect(sunVargottama.dignifiedVargas).toContain('D1');
    expect(sunVargottama.dignifiedVargas).toContain('D9');
    expect(sunVargottama.vargaCount).toBeGreaterThanOrEqual(2);
    expect(sunVargottama.tier).toBeDefined();

    // Jupiter in Cancer 1° (Cancer is movable, so 1st navamsha is Cancer -> exalted in D1 and D9, Vargottama):
    const jupExaltVargottama = evaluateVaisheshikamsa('jupiter', 91.0);
    expect(jupExaltVargottama.vargottama).toBe(true);
    expect(jupExaltVargottama.dignifiedVargas).toContain('D1');
    expect(jupExaltVargottama.dignifiedVargas).toContain('D9');
    expect(jupExaltVargottama.vargaCount).toBeGreaterThanOrEqual(2);
  });

  it('computes full chart Vaisheshikamsa without error', () => {
    const dummyChart = {
      time: { birthLocal: '1998-09-07T23:20:34', tzId: 'Asia/Kolkata', resolvedUtcIso: '1998-09-07T17:50:34Z', jdUt: 2451064.24, timeCertainty: 'exact' },
      place: { name: 'Jamshedpur', lat: 22.8, lon: 86.17 },
      ayanamsa: { id: 'lahiri' as const, value: 23.83 },
      lagna: { lon: 45.0, sign: 'taurus', signIndex: 1, degInSign: 15.0, nakshatra: 'Rohini', nakshatraIndex: 3, pada: 2, tropicalLon: 68.83, elapsedInNakshatra: 0.5 },
      grahas: {
        sun: { lon: 141.2, sign: 'leo', signIndex: 4, degInSign: 21.2, nakshatra: 'Purva Phalguni', nakshatraIndex: 10, pada: 3, speed: 0.98, retrograde: false, tropicalLon: 165.03, elapsedInNakshatra: 0.6, houses: { houseFromLagna: 4, houseFromMoon: 6 } },
        moon: { lon: 338.5, sign: 'pisces', signIndex: 11, degInSign: 8.5, nakshatra: 'Uttara Bhadrapada', nakshatraIndex: 25, pada: 2, speed: 13.2, retrograde: false, tropicalLon: 2.33, elapsedInNakshatra: 0.4, houses: { houseFromLagna: 11, houseFromMoon: 1 } },
        mars: { lon: 105.0, sign: 'cancer', signIndex: 3, degInSign: 15.0, nakshatra: 'Pushya', nakshatraIndex: 7, pada: 4, speed: 0.6, retrograde: false, tropicalLon: 128.83, elapsedInNakshatra: 0.8, houses: { houseFromLagna: 3, houseFromMoon: 5 } },
        mercury: { lon: 155.0, sign: 'virgo', signIndex: 5, degInSign: 5.0, nakshatra: 'Uttara Phalguni', nakshatraIndex: 11, pada: 3, speed: 1.2, retrograde: false, tropicalLon: 178.83, elapsedInNakshatra: 0.3, houses: { houseFromLagna: 5, houseFromMoon: 7 } },
        jupiter: { lon: 330.0, sign: 'pisces', signIndex: 11, degInSign: 0.0, nakshatra: 'Purva Bhadrapada', nakshatraIndex: 24, pada: 4, speed: -0.05, retrograde: true, tropicalLon: 353.83, elapsedInNakshatra: 0.9, houses: { houseFromLagna: 11, houseFromMoon: 1 } },
        venus: { lon: 130.0, sign: 'leo', signIndex: 4, degInSign: 10.0, nakshatra: 'Magha', nakshatraIndex: 9, pada: 3, speed: 1.1, retrograde: false, tropicalLon: 153.83, elapsedInNakshatra: 0.7, houses: { houseFromLagna: 4, houseFromMoon: 6 } },
        saturn: { lon: 25.0, sign: 'aries', signIndex: 0, degInSign: 25.0, nakshatra: 'Bharani', nakshatraIndex: 1, pada: 4, speed: -0.03, retrograde: true, tropicalLon: 48.83, elapsedInNakshatra: 0.9, houses: { houseFromLagna: 12, houseFromMoon: 2 } },
        rahu: { lon: 132.0, sign: 'leo', signIndex: 4, degInSign: 12.0, nakshatra: 'Magha', nakshatraIndex: 9, pada: 4, speed: -0.05, retrograde: true, tropicalLon: 155.83, elapsedInNakshatra: 0.8, houses: { houseFromLagna: 4, houseFromMoon: 6 } },
        ketu: { lon: 312.0, sign: 'aquarius', signIndex: 10, degInSign: 12.0, nakshatra: 'Shatabhisha', nakshatraIndex: 23, pada: 2, speed: -0.05, retrograde: true, tropicalLon: 335.83, elapsedInNakshatra: 0.4, houses: { houseFromLagna: 10, houseFromMoon: 12 } },
      },
      bhavas: [],
    } as unknown as NatalChart;

    const results = computeChartVaisheshikamsa(dummyChart);
    expect(results.sun).toBeDefined();
    expect(results.moon).toBeDefined();
    expect(results.lagna).toBeDefined();

    // Mercury in Virgo 5° is exalted in D1 and in its own sign
    expect(results.mercury.dignifiedVargas).toContain('D1');

    // Check pushkara and tier formatting
    expect(results.sun.pushkara.description).toBeDefined();
  });
});
