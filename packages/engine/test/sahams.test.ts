import { describe, it, expect } from 'vitest';
import {
  isPointOnArc,
  computeRawSaham,
  computeAnnualSahams,
  SAHAM_DEFINITIONS,
} from '../src/natal/sahams.js';
import type { NatalChart } from '../src/natal/positions.js';
import type { GrahaDetail } from '../src/natal/types.js';

describe('Tajika Sahams Engine', () => {
  describe('PVR Rao Example 121 (Chart 66) Verification', () => {
    // Birth: Mar 8, 1967. 34th yr Varsha Pravesh = Mar 8, 2000, 4:41:21 AM IST (Night)
    const lagnaLon = 280 + 50 / 60; // 10 Cp 50 = 280°50' (280.8333°)
    const saturnLon = 19 + 10 / 60; // 19 Ar 10 = 19°10' (19.1667°)
    const marsLon = 330 + 24 + 58 / 60; // 24 Pi 58 = 354°58' (354.9667°)
    const moonLon = 330 + 15 + 14 / 60; // 15 Pi 14 = 345°14' (345.2333°)
    const mercLon = 300 + 11 + 28 / 60; // 11 Aq 28 = 311°28' (311.4667°)
    const h2Lon = lagnaLon + 30; // 10 Aq 50 = 310°50'

    it('verifies Artha Saham: 2 Sc 30 without +30° arc rule', () => {
      // Artha = H2 - L2 + Lagna (same day/night)
      // A = H2 (310°50'), B = L2 (19°10'), C = Lagna (280°50')
      const res = computeRawSaham(h2Lon, saturnLon, lagnaLon, false, true);
      expect(res.arcRuleApplied).toBe(false);
      // 212°30' = 2°30' Scorpio
      expect(res.lon).toBeCloseTo(212.5, 2);
    });

    it('verifies Samartha Saham: 5 Pi 02 with +30° arc rule applied', () => {
      // Samartha = Mars - L1 + Lagna. At night: L1 - Mars + Lagna
      // A = Mars (354°58'), B = L1 Saturn (19°10'), C = Lagna (280°50')
      // At night swapped: effectiveA = 19°10', effectiveB = 354°58', C = 280°50'
      // Lagna is NOT between 354°58' and 19°10' -> +30° added!
      const res = computeRawSaham(marsLon, saturnLon, lagnaLon, false, false);
      expect(res.arcRuleApplied).toBe(true);
      // 335°2' = 335.0333° (5°2' Pisces)
      const expectedLon = 330 + 5 + 2 / 60;
      expect(res.lon).toBeCloseTo(expectedLon, 2);
    });

    it('verifies Vanik Saham: 7 Sg 04 without +30° arc rule', () => {
      // Vanik = Moon - Mercury + Lagna. At night: Mercury - Moon + Lagna
      // A = Moon (345°14'), B = Mercury (311°28'), C = Lagna (280°50')
      // At night swapped: effectiveA = 311°28', effectiveB = 345°14', C = 280°50'
      // Lagna IS between 345°14' and 311°28' -> no +30°
      const res = computeRawSaham(moonLon, mercLon, lagnaLon, false, false);
      expect(res.arcRuleApplied).toBe(false);
      // 247°4' = 240 + 7 + 4/60 = 247.0667° (7°4' Sagittarius)
      const expectedLon = 240 + 7 + 4 / 60;
      expect(res.lon).toBeCloseTo(expectedLon, 2);
    });
  });

  describe('Arc Rule Validation', () => {
    it('accurately detects whether C lies on arc from B to A', () => {
      // Arc from 0° to 90° (first quadrant)
      expect(isPointOnArc(90, 0, 45)).toBe(true);
      expect(isPointOnArc(90, 0, 180)).toBe(false);

      // Arc crossing 0°: from 350° to 30° (arc length 40°)
      expect(isPointOnArc(30, 350, 10)).toBe(true);
      expect(isPointOnArc(30, 350, 355)).toBe(true);
      expect(isPointOnArc(30, 350, 100)).toBe(false);
    });
  });

  describe('Full 36 Annual Sahams Computation', () => {
    const mockChart = {
      engineVersion: '1.0.0',
      ayanamsa: { id: 'lahiri', value: 23.85 },
      time: {
        birthUtc: '2025-03-20T12:00:00Z',
        birthLocal: '2025-03-20T17:30:00',
        tzId: 'Asia/Kolkata',
        julianDayUt: 2460755.0,
        timeCertainty: 'exact',
        utcOffsetMinutes: 330,
        utcOffsetHours: 5.5,
        lmtTime: '17:30:00',
        lmtCorrectionMinutes: 0,
      },
      place: { lat: 28.6139, lon: 77.209 },
      lagna: {
        lon: 75.0, // 15° Gemini (Sign index 2)
        sign: 'Gemini',
        signIndex: 2,
        degInSign: 15.0,
      },
      grahas: {
        sun: { name: 'sun', lon: 335.0, sign: 'Pisces', signIndex: 11, degInSign: 5.0, speed: 1 },
        moon: { name: 'moon', lon: 220.0, sign: 'Scorpio', signIndex: 7, degInSign: 10.0, speed: 12 },
        mars: { name: 'mars', lon: 95.0, sign: 'Cancer', signIndex: 3, degInSign: 5.0, speed: 0.6 },
        mercury: { name: 'mercury', lon: 350.0, sign: 'Pisces', signIndex: 11, degInSign: 20.0, speed: 1.2 },
        jupiter: { name: 'jupiter', lon: 45.0, sign: 'Taurus', signIndex: 1, degInSign: 15.0, speed: 0.1 },
        venus: { name: 'venus', lon: 355.0, sign: 'Pisces', signIndex: 11, degInSign: 25.0, speed: 1.1 },
        saturn: { name: 'saturn', lon: 325.0, sign: 'Aquarius', signIndex: 10, degInSign: 25.0, speed: 0.05 },
        rahu: { name: 'rahu', lon: 320.0, sign: 'Aquarius', signIndex: 10, degInSign: 20.0, speed: -0.05 },
        ketu: { name: 'ketu', lon: 140.0, sign: 'Leo', signIndex: 4, degInSign: 20.0, speed: -0.05 },
        uranus: { name: 'uranus', lon: 50.0, sign: 'Taurus', signIndex: 1, degInSign: 20.0, speed: 0.01 },
        neptune: { name: 'neptune', lon: 350.0, sign: 'Pisces', signIndex: 11, degInSign: 20.0, speed: 0.01 },
        pluto: { name: 'pluto', lon: 295.0, sign: 'Capricorn', signIndex: 9, degInSign: 25.0, speed: 0.01 },
      },
      grahasList: [],
    } as unknown as NatalChart;

    const harshaBala = {
      sun: 10,
      moon: 15,
      mars: 5,
      mercury: 15,
      jupiter: 20,
      venus: 10,
      saturn: 5,
    };

    it('computes all 36 Sahams with valid properties', () => {
      const { sahams, sahamsList } = computeAnnualSahams(mockChart, true, harshaBala);

      expect(sahamsList.length).toBe(36);
      expect(Object.keys(sahams).length).toBe(36);

      // Verify essential Sahams exist
      for (const def of SAHAM_DEFINITIONS) {
        const item = sahams[def.id];
        expect(item).toBeDefined();
        expect(item.id).toBe(def.id);
        expect(item.lon).toBeGreaterThanOrEqual(0);
        expect(item.lon).toBeLessThan(360);
        expect(item.houseFromLagna).toBeGreaterThanOrEqual(1);
        expect(item.houseFromLagna).toBeLessThanOrEqual(12);
        expect(['high', 'moderate', 'low']).toContain(item.fructification);
        expect(typeof item.formatted).toBe('string');
        expect(typeof item.assessment).toBe('string');
      }
    });

    it('reverses Punya Saham between day and night returns', () => {
      const dayResult = computeAnnualSahams(mockChart, true, harshaBala);
      const nightResult = computeAnnualSahams(mockChart, false, harshaBala);

      expect(dayResult.sahams.punya.lon).not.toBeCloseTo(nightResult.sahams.punya.lon, 1);
    });

    it('keeps sameDayNight Sahams identical regardless of day or night', () => {
      const dayResult = computeAnnualSahams(mockChart, true, harshaBala);
      const nightResult = computeAnnualSahams(mockChart, false, harshaBala);

      // Artha Saham is same for day & night
      expect(dayResult.sahams.artha.lon).toBeCloseTo(nightResult.sahams.artha.lon, 4);
      // Labha Saham is same for day & night
      expect(dayResult.sahams.labha.lon).toBeCloseTo(nightResult.sahams.labha.lon, 4);
      // Paradesa Saham is same for day & night
      expect(dayResult.sahams.paradesa.lon).toBeCloseTo(nightResult.sahams.paradesa.lon, 4);
    });
  });
});
