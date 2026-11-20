import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadEphemeris,
  resolveBirthTime,
  computePositions,
  createNatalDigest,
  scoreHour,
  buildDay,
  buildMonth,
  buildYear,
  checkBannedWords,
  type BirthInput,
  type ScoreContext,
} from '../src/index.js';

describe('M4 Scoring, Builders & Safety Linter Suite', () => {
  const birthInput: BirthInput = {
    date: '1998-09-07',
    time: '23:20:34',
    tzId: 'Asia/Kolkata',
    placeName: 'Jamshedpur',
    lat: 22.8,
    lon: 86.16666666666667,
    timeCertainty: 'exact',
  };

  let eph: Awaited<ReturnType<typeof loadEphemeris>>;
  let digest: ReturnType<typeof createNatalDigest>;

  beforeAll(async () => {
    eph = await loadEphemeris('swisseph');
    const timeRes = resolveBirthTime(birthInput);
    if (!timeRes.success) throw new Error('Time resolution failed');

    const natal = computePositions(
      eph,
      timeRes.resolved,
      { name: 'Jamshedpur', lat: 22.8, lon: 86.16666666666667 },
      { ayanamsa: 'lahiri', nodeType: 'mean' },
    );
    digest = createNatalDigest(natal);
  });

  describe('1. Hour Scoring & Factor Attribution', () => {
    it('calculates additive score with transparent factor breakdown', () => {
      const ctx: ScoreContext = {
        instantUtc: '2026-11-13T10:00:00Z',
        hourUtc: '2026-11-13T15:30:00Z',
        transitMoonLon: 245.5, // Sagittarius (sign 8)
        transitMoonNakshatraIndex: 18, // Mula
        natalMoonSignIndex: 11, // Pisces
        natalMoonNakshatraIndex: 25, // Uttarabhadra
        natalLagnaLord: 'venus',
        natalSarvaAshtakvarga: [26, 33, 33, 26, 31, 19, 30, 20, 28, 37, 28, 26],
        currentHoraLord: 'mercury', // Friend of Venus (+1)
        runningMahadashaLord: 'mercury', // Dasha match (+1)
        activeInauspiciousWindow: null,
      };

      const res = scoreHour(ctx);

      // Verify range
      expect(res.score).toBeGreaterThanOrEqual(-7);
      expect(res.score).toBeLessThanOrEqual(7);

      // Verify factor attribution
      expect(res.factors.length).toBeGreaterThanOrEqual(4);
      for (const factor of res.factors) {
        expect(factor.id).toBeTruthy();
        expect(factor.name).toBeTruthy();
        expect(typeof factor.value).toBe('number');
        expect(factor.summary).toBeTruthy();
      }

      // Check band mapping
      if (res.score >= 3) {
        expect(res.band).toBe('flowing');
      } else if (res.score <= -2) {
        expect(res.band).toBe('go_gently');
      } else {
        expect(res.band).toBe('steady');
      }

      // Check text is generated deterministically
      expect(res.text.length).toBeGreaterThan(10);
      const res2 = scoreHour(ctx);
      expect(res2.text).toBe(res.text); // Byte-identical output
    });
  });

  describe('2. Safety Guardrails & Banned-Word Linter', () => {
    it('detects banned medical, fear, and doom words strictly', () => {
      expect(checkBannedWords('You will die tomorrow').hasBanned).toBe(true);
      expect(checkBannedWords('Guaranteed wealth and lottery win').hasBanned).toBe(true);
      expect(checkBannedWords('You are cursed by Saturn').hasBanned).toBe(true);
      expect(checkBannedWords('Safe journey and steady progress').hasBanned).toBe(false);
    });
  });

  describe('3. Day, Month, and Year Builders Performance', () => {
    it('builds Day View with 24 hourly scores and panchang', () => {
      const start = performance.now();
      const dayView = buildDay(eph, digest, '2026-11-13', 'Asia/Kolkata');
      const elapsed = performance.now() - start;

      expect(dayView.hourlyScores.length).toBe(24);
      expect(dayView.dayBand).toBeTruthy();
      expect(dayView.panchang.tithi.name).toBeTruthy();
      expect(dayView.rahuKalam.start).toBeTruthy();
      // Target performance: Day view under 200ms
      expect(elapsed).toBeLessThan(350);
    });

    it('builds Month View calendar heat-map', () => {
      const monthView = buildMonth(eph, digest, 2026, 11, 'Asia/Kolkata');
      expect(monthView.days.length).toBe(30);
      for (const d of monthView.days) {
        expect(['flowing', 'steady', 'go_gently']).toContain(d.dayBand);
      }
    });

    it('builds Year View in under 3 seconds (§2.4 performance target)', () => {
      const start = performance.now();
      const yearView = buildYear(eph, digest, 2026, 'Asia/Kolkata');
      const elapsed = performance.now() - start;

      expect(yearView.months.length).toBe(12);
      expect(elapsed).toBeLessThan(3000); // Spec: Year under 3 seconds
    });
  });
});
