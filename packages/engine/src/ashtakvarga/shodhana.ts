import type { VedicGraha } from '../natal/types.js';

export const TRIKONA_GROUPS: [number, number, number][] = [
  [0, 4, 8],  // Aries, Leo, Sagittarius
  [1, 5, 9],  // Taurus, Virgo, Capricorn
  [2, 6, 10], // Gemini, Libra, Aquarius
  [3, 7, 11], // Cancer, Scorpio, Pisces
];

export const DUAL_LORDS: Array<{ planet: VedicGraha; signs: [number, number] }> = [
  { planet: 'mars', signs: [0, 7] },    // Aries & Scorpio
  { planet: 'venus', signs: [1, 6] },   // Taurus & Libra
  { planet: 'mercury', signs: [2, 5] }, // Gemini & Virgo
  { planet: 'jupiter', signs: [8, 11] },// Sagittarius & Pisces
  { planet: 'saturn', signs: [9, 10] }, // Capricorn & Aquarius
];

export const RASHI_MULTIPLIERS = [7, 10, 8, 4, 10, 5, 7, 8, 9, 5, 11, 12];

export const GRAHA_MULTIPLIERS: Record<string, number> = {
  sun: 5,
  moon: 5,
  mars: 8,
  mercury: 5,
  jupiter: 10,
  venus: 7,
  saturn: 5,
};

/**
 * 1. Trikona Shodhana (Trinal Reduction)
 * Reduces dots in the 4 trinal groups according to classical rules from
 * Dr. K.S. Charak Elements of Vedic Astrology (Ch. XXX).
 */
export function performTrikonaShodhana(bav: number[]): number[] {
  const res = [...bav];

  for (const [s1, s2, s3] of TRIKONA_GROUPS) {
    const v1 = res[s1]!;
    const v2 = res[s2]!;
    const v3 = res[s3]!;

    const vals = [v1, v2, v3];
    const nonZero = vals.filter((v) => v > 0);

    if (nonZero.length === 3) {
      const min = Math.min(v1, v2, v3);
      res[s1] = v1 - min;
      res[s2] = v2 - min;
      res[s3] = v3 - min;
    } else if (nonZero.length === 2) {
      // One sign is 0, two have positive dots: subtract the smaller from both
      const min = Math.min(...nonZero);
      if (v1 > 0) res[s1] = v1 - min;
      if (v2 > 0) res[s2] = v2 - min;
      if (v3 > 0) res[s3] = v3 - min;
    }
    // If nonZero.length <= 1, no reduction is made
  }

  return res;
}

/**
 * 2. Ekadhipatya Shodhana (Dual-Lordship Reduction)
 * Applied to the output of Trikona Shodhana for planets owning two signs,
 * factoring in which signs are occupied by planets in the natal chart.
 */
export function performEkadhipatyaShodhana(
  trikonaBav: number[],
  natalOccupiedSignIndices: number[],
): number[] {
  const res = [...trikonaBav];
  const occupiedSet = new Set(natalOccupiedSignIndices);

  for (const { signs } of DUAL_LORDS) {
    const [s1, s2] = signs;
    const d1 = res[s1]!;
    const d2 = res[s2]!;

    if (d1 === 0 || d2 === 0) continue; // If either has 0, no reduction

    const occ1 = occupiedSet.has(s1);
    const occ2 = occupiedSet.has(s2);

    if (occ1 && occ2) {
      // Both occupied: no reduction
      continue;
    }

    if (!occ1 && !occ2) {
      // Both unoccupied
      if (d1 === d2) {
        res[s1] = 0;
        res[s2] = 0;
      } else if (d1 < d2) {
        res[s2] = d1; // reduce larger to equal smaller
      } else {
        res[s1] = d2;
      }
      continue;
    }

    // One occupied, one unoccupied
    const [occSign, unoccSign] = occ1 ? [s1, s2] : [s2, s1];
    const occDots = res[occSign]!;
    const unoccDots = res[unoccSign]!;

    if (unoccDots > occDots) {
      res[unoccSign] = occDots; // reduce excess from unoccupied sign
    } else {
      res[unoccSign] = 0; // eliminate dots from unoccupied sign
    }
  }

  return res;
}

export interface PindaCalculationResult {
  rashiPinda: number;
  grahaPinda: number;
  shodhyaPinda: number;
  reducedBindus: number[];
}

/**
 * 3. Shodhya Pinda (Purified Pinda Multipliers)
 * Calculates Rashi Pinda, Graha Pinda, and total Shodhya Pinda.
 */
export function computeShodhyaPinda(
  reducedBindus: number[],
  planetSignIndices: Record<string, number>,
): PindaCalculationResult {
  // Rashi Pinda: sum(dots * rashi_multiplier)
  let rashiPinda = 0;
  for (let i = 0; i < 12; i++) {
    rashiPinda += (reducedBindus[i] ?? 0) * RASHI_MULTIPLIERS[i]!;
  }

  // Graha Pinda: sum(dots_in_planet_sign * planet_multiplier)
  let grahaPinda = 0;
  for (const [planet, multiplier] of Object.entries(GRAHA_MULTIPLIERS)) {
    const sIdx = planetSignIndices[planet];
    if (sIdx !== undefined && sIdx >= 0 && sIdx < 12) {
      const dotsInSign = reducedBindus[sIdx] ?? 0;
      grahaPinda += dotsInSign * multiplier;
    }
  }

  return {
    rashiPinda,
    grahaPinda,
    shodhyaPinda: rashiPinda + grahaPinda,
    reducedBindus,
  };
}
