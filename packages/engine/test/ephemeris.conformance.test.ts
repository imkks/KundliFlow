import { describe, it, expect, beforeAll } from 'vitest';
import { loadEphemeris, siderealSnapshot, PROVIDER_IDS, type ProviderId } from '../src/index.js';
import birthFixture from '../../../fixtures/sample-1998-09-07-jamshedpur/birth.json' assert { type: 'json' };
import lahiriFixture from '../../../fixtures/sample-1998-09-07-jamshedpur/positions.lahiri.json' assert { type: 'json' };

const JD = birthFixture.astronomy.julianDayUt;
const PLACE = birthFixture.profile.place;

describe('M0 Ephemeris Conformance Suite', () => {
  for (const providerId of PROVIDER_IDS) {
    describe(`Provider: ${providerId}`, () => {
      let eph: Awaited<ReturnType<typeof loadEphemeris>>;

      beforeAll(async () => {
        eph = await loadEphemeris(providerId);
      });

      it('initializes and reports version and capabilities', () => {
        expect(eph.id).toBe(providerId);
        expect(eph.version).toBeTruthy();
        expect(eph.capabilities.ayanamsas).toContain('lahiri');
      });

      it('computes Lahiri ayanamsa within tolerance of AstroSage reference', () => {
        const ay = eph.ayanamsa(JD, 'lahiri');
        const expectedAy = 23 + 50 / 60 + 17 / 3600; // 23°50'17"
        const diffArcsec = Math.abs(ay - expectedAy) * 3600;

        // Swiss Ephemeris agrees to within a few arcseconds with Lahiri (true/mean nutation difference ~2-5")
        // astronomy-engine fallback agrees to within ~10 arcseconds
        expect(diffArcsec).toBeLessThan(15);
      });

      it('computes Sun and Moon sidereal positions conforming to golden report', () => {
        const snap = siderealSnapshot(eph, JD, {
          ayanamsa: 'lahiri',
          nodeType: 'mean',
          place: { lat: PLACE.lat, lon: PLACE.lon },
        });

        const sunExpected = lahiriFixture.positions.sun.absoluteDegree;
        const moonExpected = lahiriFixture.positions.moon.absoluteDegree;

        const sunDiffArcsec = Math.abs(snap.grahas.sun.lon - sunExpected) * 3600;
        const moonDiffArcsec = Math.abs(snap.grahas.moon.lon - moonExpected) * 3600;

        // Sun sign and nakshatra must match exactly
        expect(snap.grahas.sun.sign).toBe('leo');
        expect(snap.grahas.sun.nakshatra).toBe('purva_phalguni');
        expect(snap.grahas.sun.pada).toBe(3);

        // Moon sign and nakshatra must match exactly
        expect(snap.grahas.moon.sign).toBe('pisces');
        expect(snap.grahas.moon.nakshatra).toBe('uttara_bhadrapada');
        expect(snap.grahas.moon.pada).toBe(2);

        // Precision check:
        // Sun within 1 arcminute (60") for both
        expect(sunDiffArcsec).toBeLessThan(60);
        // Moon within 1 arcminute (60") for swisseph, and within 2 arcminutes for astronomy-engine
        const moonMaxTol = providerId === 'swisseph' ? 60 : 120;
        expect(moonDiffArcsec).toBeLessThan(moonMaxTol);
      });

      it('computes Lagna (Ascendant) conforming to golden report', () => {
        const snap = siderealSnapshot(eph, JD, {
          ayanamsa: 'lahiri',
          nodeType: 'mean',
          place: { lat: PLACE.lat, lon: PLACE.lon },
        });

        expect(snap.lagna).not.toBeNull();
        if (snap.lagna) {
          expect(snap.lagna.sign).toBe('taurus');
          expect(snap.lagna.nakshatra).toBe('mrigashira');
          expect(snap.lagna.pada).toBe(2);

          const ascExpected = lahiriFixture.positions.ascendant.absoluteDegree;
          const ascDiffArcsec = Math.abs(snap.lagna.lon - ascExpected) * 3600;
          // Ascendant within 2 arcminutes (120")
          expect(ascDiffArcsec).toBeLessThan(120);
        }
      });
    });
  }
});
