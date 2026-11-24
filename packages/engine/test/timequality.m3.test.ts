import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadEphemeris,
  resolveBirthTime,
  computePositions,
  computeAshtakvarga,
  calculateSunTimes,
  computeDayHoras,
  computeInauspiciousWindows,
  computeTransits,
  EXPECTED_PLANET_TOTALS,
  EXPECTED_SARVA_TOTAL,
  type Contributor,
  type BirthInput,
} from '../src/index.js';
import birthFixture from '../../../fixtures/sample-1998-09-07-jamshedpur/birth.json' assert { type: 'json' };
import ashtakvargaFixture from '../../../fixtures/sample-1998-09-07-jamshedpur/ashtakvarga.json' assert { type: 'json' };
import panchangFixture from '../../../fixtures/sample-1998-09-07-jamshedpur/panchang.json' assert { type: 'json' };

describe('M3 Time Quality, Ashtakvarga & Transits Suite', () => {
  const birthInput: BirthInput = {
    date: '1998-09-07',
    time: '23:20:34',
    tzId: 'Asia/Kolkata',
    placeName: 'Jamshedpur',
    lat: 22.8,
    lon: 86.16666666666667,
    timeCertainty: 'exact',
  };

  let natal: ReturnType<typeof computePositions>;

  beforeAll(async () => {
    const eph = await loadEphemeris('swisseph');
    const timeRes = resolveBirthTime(birthInput);
    if (!timeRes.success) throw new Error('Time resolution failed');

    natal = computePositions(
      eph,
      timeRes.resolved,
      { name: 'Jamshedpur', lat: 22.8, lon: 86.16666666666667 },
      { ayanamsa: 'lahiri', nodeType: 'mean' },
    );
  });

  describe('1. Ashtakvarga (BAV, SAV, Prastara & Invariants)', () => {
    it('verifies exact match with AstroSage golden report tables and Brihat Parashara invariants', () => {
      // Map natal sign positions (0=Aries, 1=Taurus, ...)
      const signPositions: Record<Contributor, number> = {
        sun: natal.grahas.sun.signIndex,
        moon: natal.grahas.moon.signIndex,
        mars: natal.grahas.mars.signIndex,
        mercury: natal.grahas.mercury.signIndex,
        jupiter: natal.grahas.jupiter.signIndex,
        venus: natal.grahas.venus.signIndex,
        saturn: natal.grahas.saturn.signIndex,
        lagna: natal.lagna!.signIndex,
      };

      const av = computeAshtakvarga(signPositions);

      // Invariant 1: Sarva total must ALWAYS be 337
      expect(av.sarvaTotal).toBe(EXPECTED_SARVA_TOTAL);

      // Invariant 2: Per planet totals must match classical constants
      for (const [p, expTot] of Object.entries(EXPECTED_PLANET_TOTALS)) {
        expect(av.planetTotals[p as keyof typeof EXPECTED_PLANET_TOTALS]).toBe(expTot);
      }

      // Check Sarva Ashtakvarga sign by sign against AstroSage report:
      // Aries to Pisces: [26, 33, 33, 26, 31, 19, 30, 20, 28, 37, 28, 26]
      expect(av.sarva).toEqual(ashtakvargaFixture.sarva);

      // Check Bhinna Ashtakvarga for all 7 planets against AstroSage fixture
      for (const [planet, expectedSignArray] of Object.entries(ashtakvargaFixture.bhinna)) {
        expect(av.bhinna[planet as keyof typeof ashtakvargaFixture.bhinna]).toEqual(
          expectedSignArray,
        );
      }

      // Check Prastarashtakvarga for Sun
      // In PDF report p. 18, Sun Prastara totals per sign match Sun BAV: [5, 5, 2, 6, 5, 1, 4, 3, 3, 6, 5, 3]
      const sunPrastara = av.prastara.sun;
      expect(sunPrastara.totals).toEqual(ashtakvargaFixture.bhinna.sun);
      expect(sunPrastara.totalSum).toBe(48);

      // Verify BPHS Trikona Shodhana on Sun BAV
      expect(av.trikonaShodhita?.sun).toEqual([2, 4, 0, 3, 2, 0, 2, 0, 0, 5, 3, 0]);

      // Verify Ekadhipatya Shodhana and Shodhita Pindas are computed
      expect(av.ekadhipatyaShodhita?.sun).toBeDefined();
      expect(av.pindas?.sun?.shodhitaPinda).toBeGreaterThan(0);
      expect(av.pindas?.jupiter?.shodhitaPinda).toBeGreaterThan(0);
    });
  });

  describe('2. Sunrise & Sunset Calculations', () => {
    it('computes sunrise, sunset, and day duration within 1 minute tolerance of reference', () => {
      const sunTimes = calculateSunTimes(
        birthInput.date,
        birthInput.lat,
        birthInput.lon,
        birthInput.tzId,
      );

      // Reference values from AstroSage report p. 1:
      // Sunrise: 05:29:25
      // Sunset: 17:57:31
      // Day Duration: 12:28:05
      const parseSeconds = (t: string) => {
        const [h = 0, m = 0, s = 0] = t.split(':').map(Number);
        return h * 3600 + m * 60 + s;
      };

      const actRiseSec = parseSeconds(sunTimes.sunriseTime);
      const expRiseSec = parseSeconds(panchangFixture.sunrise);
      expect(Math.abs(actRiseSec - expRiseSec)).toBeLessThanOrEqual(60); // < 1 minute

      const actSetSec = parseSeconds(sunTimes.sunsetTime);
      const expSetSec = parseSeconds(panchangFixture.sunset);
      expect(Math.abs(actSetSec - expSetSec)).toBeLessThanOrEqual(60);

      const actDurSec = parseSeconds(sunTimes.dayDurationFormatted);
      const expDurSec = parseSeconds(panchangFixture.dayDuration);
      expect(Math.abs(actDurSec - expDurSec)).toBeLessThanOrEqual(60);
    });
  });

  describe('3. Horas & Inauspicious Windows', () => {
    it('computes 24 horas starting with weekday lord', () => {
      const sunTimes = calculateSunTimes(
        birthInput.date,
        birthInput.lat,
        birthInput.lon,
        birthInput.tzId,
      );
      // Next day sunrise for night horas
      const nextSunTimes = calculateSunTimes(
        '1998-09-08',
        birthInput.lat,
        birthInput.lon,
        birthInput.tzId,
      );

      const horas = computeDayHoras(
        1, // Monday
        sunTimes.sunriseIso,
        sunTimes.sunsetIso,
        nextSunTimes.sunriseIso,
      );

      expect(horas.length).toBe(24);
      // 1st hora of Monday must be Moon
      expect(horas[0]!.lord).toBe('moon');
      expect(horas[0]!.isDayHora).toBe(true);

      // 13th hora is 1st hora of night (sunset)
      expect(horas[12]!.isDayHora).toBe(false);
    });

    it('computes Rahu Kalam, Yamaganda, and Gulika segments for Monday', () => {
      const sunTimes = calculateSunTimes(
        birthInput.date,
        birthInput.lat,
        birthInput.lon,
        birthInput.tzId,
      );

      const windows = computeInauspiciousWindows(
        1, // Monday
        sunTimes.sunriseIso,
        sunTimes.sunsetIso,
      );

      // On Monday: Rahu Kalam is part 2 (approx 07:00 - 08:30)
      expect(windows.rahuKalam.name).toBe('Rahu Kalam');
      expect(windows.yamaganda.name).toBe('Yamaganda');
      expect(windows.gulika.name).toBe('Gulika');

      // Start time of Rahu Kalam should be > Sunrise and < Sunset
      expect(new Date(windows.rahuKalam.startIso).getTime()).toBeGreaterThan(
        new Date(sunTimes.sunriseIso).getTime(),
      );
      expect(new Date(windows.rahuKalam.endIso).getTime()).toBeLessThan(
        new Date(sunTimes.sunsetIso).getTime(),
      );
    });
  });

  describe('4. Transits (Gochar & Sade Sati)', () => {
    it('evaluates transit houses from natal Lagna & Moon, and flags Sade Sati', async () => {
      const eph = await loadEphemeris('swisseph');
      // Compute transits for birth instant as a baseline test
      const av = computeAshtakvarga({
        sun: natal.grahas.sun.signIndex,
        moon: natal.grahas.moon.signIndex,
        mars: natal.grahas.mars.signIndex,
        mercury: natal.grahas.mercury.signIndex,
        jupiter: natal.grahas.jupiter.signIndex,
        venus: natal.grahas.venus.signIndex,
        saturn: natal.grahas.saturn.signIndex,
        lagna: natal.lagna!.signIndex,
      });

      const transits = computeTransits(
        eph,
        natal.time.julianDayUt,
        natal.lagna!.signIndex, // Taurus (1)
        natal.grahas.moon.signIndex, // Pisces (11)
        av.bhinna,
        av.prastara,
      );

      // At birth instant:
      // Saturn is in Aries (0).
      // Natal Moon is in Pisces (11).
      // Aries is 2nd house from Pisces -> Setting phase of Sade Sati!
      expect(transits.sadeSati.isActive).toBe(true);
      expect(transits.sadeSati.phase).toBe('setting');
      expect(transits.sadeSati.houseFromMoon).toBe(2);

      // Jupiter is in Pisces (11). Natal Moon is in Pisces (11) -> 1st house from Moon
      expect(transits.jupiterHouseFromMoon).toBe(1);

      // Ashtakvarga bindus in transit sign for Saturn in Aries:
      // Aries is sign index 0. BAV for Saturn in Aries is 2 bindus.
      expect(transits.transits.saturn.ashtakvargaBindus).toBe(2);

      // Gochara Vedha check is computed for all 9 planets
      expect(transits.vedha).toBeDefined();
      expect(transits.vedha?.saturn).toBeDefined();
      expect(transits.transits.saturn.vedha).toBeDefined();

      // Kakshya transit evaluation is computed when Prastara is passed
      expect(transits.kakshya).toBeDefined();
      expect(transits.kakshya?.evaluations.length).toBe(7);
      expect(transits.transits.saturn.kakshya).toBeDefined();
      expect(transits.transits.saturn.kakshya?.kakshyaIndex).toBeGreaterThanOrEqual(1);
      expect(transits.transits.saturn.kakshya?.kakshyaIndex).toBeLessThanOrEqual(8);
    });
  });
});
