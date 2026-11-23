import { describe, it, expect } from 'vitest';
import {
  computeMutualAspects,
  computeVedicAspects,
  MAJOR_ASPECTS,
} from '../src/natal/aspects.js';
import type { GrahaDetail } from '../src/natal/types.js';

function makeMockGraha(id: string, lon: number, speed: number = 1.0): GrahaDetail {
  const signIndex = Math.floor(lon / 30);
  return {
    id: id as any,
    name: id,
    lon,
    tropicalLon: lon + 24,
    lat: 0,
    speed,
    retrograde: speed < 0,
    sign: 'aries',
    signIndex,
    degInSign: lon % 30,
    nakshatra: 'ashwini',
    nakshatraIndex: 0,
    pada: 1,
    elapsedInNakshatra: 0.5,
    houses: { houseFromLagna: signIndex + 1, houseFromMoon: 1 },
  };
}

describe('Mutual Planetary Aspects Engine', () => {
  it('correctly calculates exact separation, orb, and applying status for trine (120°)', () => {
    // Sun at 10° Aries (lon 10), Moon at 12° Leo (lon 132) -> separation 122° (Trine 120° + 2° orb)
    // Sun moving at 1.0°/day, Moon moving faster at 13.0°/day
    // Next dt: separation will increase, so this aspect is separating
    const grahas: Record<string, GrahaDetail> = {
      sun: makeMockGraha('sun', 10, 1.0),
      moon: makeMockGraha('moon', 132, 13.0),
    };

    const aspects = computeMutualAspects(grahas);
    expect(aspects.length).toBe(1);

    const asp = aspects[0]!;
    expect(asp.aspect.name).toBe('Trine');
    expect(asp.separation).toBe(122);
    expect(asp.exactAngle).toBe(122);
    expect(asp.orb).toBe(2);
    expect(asp.diffFromExact).toBe(2);
    expect(asp.isApplying).toBe(false); // Moon is moving away from 120°
    expect(asp.from).toBe('sun');
    expect(asp.to).toBe('moon');
    expect(asp.type).toBe('Trine');
  });

  it('correctly identifies applying aspect when planets are closing in', () => {
    // Mars at 0° Aries (lon 0, speed 0.5°/day)
    // Venus at 88° Gemini (lon 88, speed 1.2°/day) -> separation 88° (Square 90° - 2° orb)
    // Venus is moving faster towards 90° -> applying!
    const grahas: Record<string, GrahaDetail> = {
      mars: makeMockGraha('mars', 0, 0.5),
      venus: makeMockGraha('venus', 88, 1.2),
    };

    const aspects = computeMutualAspects(grahas);
    expect(aspects.length).toBe(1);
    expect(aspects[0]!.aspect.name).toBe('Square');
    expect(aspects[0]!.isApplying).toBe(true);
  });

  it('filters out the false astronomical Rahu-Ketu nodal opposition', () => {
    const grahas: Record<string, GrahaDetail> = {
      rahu: makeMockGraha('rahu', 45, -0.05),
      ketu: makeMockGraha('ketu', 225, -0.05),
    };

    const aspects = computeMutualAspects(grahas);
    expect(aspects.length).toBe(0);
  });
});

describe('Classical Parashari Vedic Graha Drishti Engine', () => {
  it('computes special directional aspects for Mars (4th, 7th, 8th)', () => {
    // Mars at 15° Aries (signIndex 0)
    // Jupiter at 16° Cancer (signIndex 3 -> 4th house from Mars, nominal 90°)
    // Saturn at 14° Scorpio (signIndex 7 -> 8th house from Mars, nominal 210°)
    const grahas: Record<string, GrahaDetail> = {
      mars: makeMockGraha('mars', 15, 0.6),
      jupiter: makeMockGraha('jupiter', 106, 0.1), // 90 + 16 = 106
      saturn: makeMockGraha('saturn', 224, 0.05), // 210 + 14 = 224
    };

    const aspects = computeVedicAspects(grahas);
    
    // Mars should aspect Jupiter with 4th aspect
    const marsJup = aspects.find((a) => a.from === 'mars' && a.to === 'jupiter');
    expect(marsJup).toBeDefined();
    expect(marsJup!.offset).toBe(4);
    expect(marsJup!.nominalAngle).toBe(90);
    expect(marsJup!.orb).toBe(1); // 106 - 15 = 91 -> 91 - 90 = 1°

    // Mars should aspect Saturn with 8th aspect
    const marsSat = aspects.find((a) => a.from === 'mars' && a.to === 'saturn');
    expect(marsSat).toBeDefined();
    expect(marsSat!.offset).toBe(8);
    expect(marsSat!.nominalAngle).toBe(210);

    // Directionality check: Jupiter should NOT aspect Mars with 4th or 8th
    const jupMars = aspects.find((a) => a.from === 'jupiter' && a.to === 'mars');
    expect(jupMars).toBeUndefined();
  });

  it('computes special aspects for Jupiter (5th, 7th, 9th) and Saturn (3rd, 7th, 10th)', () => {
    // Jupiter at 10° Taurus (signIndex 1, lon 40)
    // Moon at 12° Virgo (signIndex 5, lon 162) -> 5th house from Jupiter (nominal 120°)
    // Saturn at 5° Gemini (signIndex 2, lon 65)
    // Sun at 7° Leo (signIndex 4, lon 127) -> 3rd house from Saturn (nominal 60°)
    const grahas: Record<string, GrahaDetail> = {
      jupiter: makeMockGraha('jupiter', 40, 0.1),
      moon: makeMockGraha('moon', 162, 13.0),
      saturn: makeMockGraha('saturn', 65, 0.05),
      sun: makeMockGraha('sun', 127, 1.0),
    };

    const aspects = computeVedicAspects(grahas);

    const jupMoon = aspects.find((a) => a.from === 'jupiter' && a.to === 'moon');
    expect(jupMoon).toBeDefined();
    expect(jupMoon!.offset).toBe(5);
    expect(jupMoon!.type).toBe('5th Aspect');

    const satSun = aspects.find((a) => a.from === 'saturn' && a.to === 'sun');
    expect(satSun).toBeDefined();
    expect(satSun!.offset).toBe(3);
    expect(satSun!.type).toBe('3rd Aspect');
  });

  it('computes 7th direct opposition aspect for any planet', () => {
    const grahas: Record<string, GrahaDetail> = {
      sun: makeMockGraha('sun', 15, 1.0),
      saturn: makeMockGraha('saturn', 196, 0.05),
    };

    const aspects = computeVedicAspects(grahas);
    const sunSat = aspects.find((a) => a.from === 'sun' && a.to === 'saturn');
    expect(sunSat).toBeDefined();
    expect(sunSat!.offset).toBe(7);
    expect(sunSat!.nominalAngle).toBe(180);
    expect(sunSat!.orb).toBe(1);
  });
});
