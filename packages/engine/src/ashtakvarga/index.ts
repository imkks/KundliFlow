export const ASHTAKVARGA_PLANETS = [
  'sun',
  'moon',
  'mars',
  'mercury',
  'jupiter',
  'venus',
  'saturn',
] as const;

export type AshtakvargaPlanet = (typeof ASHTAKVARGA_PLANETS)[number];

// Standard expected totals according to Brihat Parashara Hora Shastra
export const EXPECTED_PLANET_TOTALS: Record<AshtakvargaPlanet, number> = {
  sun: 48,
  moon: 49,
  mars: 39,
  mercury: 54,
  jupiter: 56,
  venus: 52,
  saturn: 39,
};

export const EXPECTED_SARVA_TOTAL = 337;

export type Contributor = AshtakvargaPlanet | 'lagna';

export const CONTRIBUTORS: readonly Contributor[] = [
  'sun',
  'moon',
  'mars',
  'mercury',
  'jupiter',
  'venus',
  'saturn',
  'lagna',
] as const;

/**
 * Classical Parashara Ashtakvarga Bindu rules.
 * For each planet P, we list the houses (1-12) from each of the 8 reference points
 * (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Lagna) where a bindu (point 1) is contributed.
 * Source: Brihat Parashara Hora Shastra, Ashtakvarga chapters.
 */
export const PARASHARA_RULES: Record<
  AshtakvargaPlanet,
  Record<Contributor, readonly number[]>
> = {
  sun: {
    sun: [1, 2, 4, 7, 8, 9, 10, 11],
    moon: [3, 6, 10, 11],
    mars: [1, 2, 4, 7, 8, 9, 10, 11],
    mercury: [3, 5, 6, 9, 10, 11, 12],
    jupiter: [5, 6, 9, 11],
    venus: [6, 7, 12],
    saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    lagna: [3, 4, 6, 10, 11, 12],
  },
  moon: {
    sun: [3, 6, 7, 8, 10, 11],
    moon: [1, 3, 6, 7, 10, 11],
    mars: [2, 3, 5, 6, 9, 10, 11],
    mercury: [1, 3, 4, 5, 7, 8, 10, 11],
    jupiter: [1, 4, 7, 8, 10, 11, 12],
    venus: [3, 4, 5, 7, 9, 10, 11],
    saturn: [3, 5, 6, 11],
    lagna: [3, 6, 10, 11],
  },
  mars: {
    sun: [3, 5, 6, 10, 11],
    moon: [3, 6, 11],
    mars: [1, 2, 4, 7, 8, 10, 11],
    mercury: [3, 5, 6, 11],
    jupiter: [6, 10, 11, 12],
    venus: [6, 8, 11, 12],
    saturn: [1, 4, 7, 8, 9, 10, 11],
    lagna: [1, 3, 6, 10, 11],
  },
  mercury: {
    sun: [5, 6, 9, 11, 12],
    moon: [2, 4, 6, 8, 10, 11],
    mars: [1, 2, 4, 7, 8, 9, 10, 11],
    mercury: [1, 3, 5, 6, 9, 10, 11, 12],
    jupiter: [6, 8, 11, 12],
    venus: [1, 2, 3, 4, 5, 8, 9, 11],
    saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    lagna: [1, 2, 4, 6, 8, 10, 11],
  },
  jupiter: {
    sun: [1, 2, 3, 4, 7, 8, 9, 10, 11],
    moon: [2, 5, 7, 9, 11],
    mars: [1, 2, 4, 7, 8, 10, 11],
    mercury: [1, 2, 4, 5, 6, 9, 10, 11],
    jupiter: [1, 2, 3, 4, 7, 8, 10, 11],
    venus: [2, 5, 6, 9, 10, 11],
    saturn: [3, 5, 6, 12],
    lagna: [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  venus: {
    sun: [8, 11, 12],
    moon: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    mars: [3, 5, 6, 9, 11, 12],
    mercury: [3, 5, 6, 9, 11],
    jupiter: [5, 8, 9, 10, 11],
    venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    saturn: [3, 4, 5, 8, 9, 10, 11],
    lagna: [1, 2, 3, 4, 5, 8, 9, 11],
  },
  saturn: {
    sun: [1, 2, 4, 7, 8, 10, 11],
    moon: [3, 6, 11],
    mars: [3, 5, 6, 10, 11, 12],
    mercury: [6, 8, 9, 10, 11, 12],
    jupiter: [5, 6, 11, 12],
    venus: [6, 11, 12],
    saturn: [3, 5, 6, 11],
    lagna: [1, 3, 4, 6, 10, 11],
  },
};

export interface PrastaraTable {
  planet: AshtakvargaPlanet;
  rows: Record<Contributor, number[]>; // Array of 12 values (0 or 1 for each sign Aries..Pisces)
  totals: number[]; // 12 sign totals (Bhinna Ashtakvarga for this planet)
  totalSum: number;
}

export interface AshtakvargaPinda {
  rashiPinda: number;
  grahaPinda: number;
  shodhitaPinda: number;
}

export interface AshtakvargaResult {
  bhinna: Record<AshtakvargaPlanet, number[]>; // 12 numbers per planet (Aries..Pisces)
  planetTotals: Record<AshtakvargaPlanet, number>;
  sarva: number[]; // 12 numbers (Aries..Pisces)
  sarvaTotal: number; // Invariant: must equal 337
  prastara: Record<AshtakvargaPlanet, PrastaraTable>;
  trikonaShodhita?: Record<AshtakvargaPlanet, number[]>;
  ekadhipatyaShodhita?: Record<AshtakvargaPlanet, number[]>;
  pindas?: Record<AshtakvargaPlanet, AshtakvargaPinda>;
}

// Classical Trikona groups: Fire, Earth, Air, Water
export const TRIKONA_SIGNS: readonly (readonly [number, number, number])[] = [
  [0, 4, 8], // Aries, Leo, Sagittarius
  [1, 5, 9], // Taurus, Virgo, Capricorn
  [2, 6, 10], // Gemini, Libra, Aquarius
  [3, 7, 11], // Cancer, Scorpio, Pisces
];

// Dual-ownership sign pairs: Mars, Venus, Mercury, Jupiter, Saturn
export const DUAL_OWNERSHIP_PAIRS: readonly (readonly [number, number])[] = [
  [0, 7], // Mars: Aries, Scorpio
  [1, 6], // Venus: Taurus, Libra
  [2, 5], // Mercury: Gemini, Virgo
  [8, 11], // Jupiter: Sagittarius, Pisces
  [9, 10], // Saturn: Capricorn, Aquarius
];

// BPHS Chapter 69 Rashi Gunakara (Aries..Pisces)
export const RASHI_GUNAKARA: readonly number[] = [7, 10, 8, 4, 10, 6, 7, 8, 9, 5, 11, 12];

// BPHS Chapter 69 Graha Gunakara
export const GRAHA_GUNAKARA: Record<AshtakvargaPlanet, number> = {
  sun: 5,
  moon: 5,
  mars: 8,
  mercury: 5,
  jupiter: 10,
  venus: 7,
  saturn: 5,
};

/**
 * Performs Trikona Shodhana (Trinal Reduction) on Bhinna Ashtakvarga tables per BPHS.
 * For each planet, in each of the 4 trines, subtract the minimum bindu count from all 3 signs.
 */
export const computeTrikonaShodhana = (
  bav: Record<AshtakvargaPlanet, number[]>,
): Record<AshtakvargaPlanet, number[]> => {
  const result = {} as Record<AshtakvargaPlanet, number[]>;

  for (const planet of ASHTAKVARGA_PLANETS) {
    const reduced = [...bav[planet]];
    for (const [s1, s2, s3] of TRIKONA_SIGNS) {
      const minVal = Math.min(reduced[s1]!, reduced[s2]!, reduced[s3]!);
      if (minVal > 0) {
        reduced[s1]! -= minVal;
        reduced[s2]! -= minVal;
        reduced[s3]! -= minVal;
      }
    }
    result[planet] = reduced;
  }

  return result;
};

/**
 * Performs Ekadhipatya Shodhana (Dual-Lordship Reduction) on Trikona-reduced tables per BPHS.
 * @param shodhitaBav Bhinna Ashtakvarga after Trikona Shodhana.
 * @param signPositions Natal sign index for each planet (0 = Aries .. 11 = Pisces).
 */
export const computeEkadhipatyaShodhana = (
  shodhitaBav: Record<AshtakvargaPlanet, number[]>,
  signPositions: Record<string, number>,
): Record<AshtakvargaPlanet, number[]> => {
  const result = {} as Record<AshtakvargaPlanet, number[]>;

  // Identify signs occupied by the 7 classical planets
  const occupiedSigns = new Set<number>();
  for (const p of ASHTAKVARGA_PLANETS) {
    const s = signPositions[p];
    if (s !== undefined && s >= 0 && s < 12) {
      occupiedSigns.add(s);
    }
  }

  for (const planet of ASHTAKVARGA_PLANETS) {
    const reduced = [...shodhitaBav[planet]];

    for (const [s1, s2] of DUAL_OWNERSHIP_PAIRS) {
      const b1 = reduced[s1]!;
      const b2 = reduced[s2]!;

      // Exemption: If either sign has 0 bindus, no reduction is done
      if (b1 === 0 || b2 === 0) continue;

      const occ1 = occupiedSigns.has(s1);
      const occ2 = occupiedSigns.has(s2);

      // Scenario A: Both signs occupied -> no reduction
      if (occ1 && occ2) continue;

      // Scenario C: Both signs unoccupied
      if (!occ1 && !occ2) {
        if (b1 === b2) {
          reduced[s1] = 0;
          reduced[s2] = 0;
        } else if (b1 > b2) {
          reduced[s1] = b2;
        } else {
          reduced[s2] = b1;
        }
        continue;
      }

      // Scenario B: One sign occupied, one unoccupied
      if (occ1 && !occ2) {
        // s1 occupied, s2 unoccupied
        if (b1 >= b2) {
          reduced[s2] = 0;
        } else {
          reduced[s2] = b1;
        }
      } else if (!occ1 && occ2) {
        // s1 unoccupied, s2 occupied
        if (b2 >= b1) {
          reduced[s1] = 0;
        } else {
          reduced[s1] = b2;
        }
      }
    }

    result[planet] = reduced;
  }

  return result;
};

/**
 * Computes Rashi Pinda, Graha Pinda, and Shodhya Pinda per BPHS Chapter 69.
 */
export const computeShodhitaPinda = (
  ekadhipatyaBav: Record<AshtakvargaPlanet, number[]>,
  signPositions: Record<string, number>,
): Record<AshtakvargaPlanet, AshtakvargaPinda> => {
  const pindas = {} as Record<AshtakvargaPlanet, AshtakvargaPinda>;

  for (const planet of ASHTAKVARGA_PLANETS) {
    const bindus = ekadhipatyaBav[planet];

    // 1. Rashi Pinda: Sum of (Reduced Bindus in Sign * Sign Multiplier)
    let rashiPinda = 0;
    for (let s = 0; s < 12; s++) {
      rashiPinda += (bindus[s] ?? 0) * (RASHI_GUNAKARA[s] ?? 0);
    }

    // 2. Graha Pinda: For each occupying planet, add (Reduced Bindus of that sign * Planet Multiplier)
    let grahaPinda = 0;
    for (const p of ASHTAKVARGA_PLANETS) {
      const pos = signPositions[p];
      if (pos !== undefined && pos >= 0 && pos < 12) {
        grahaPinda += (bindus[pos] ?? 0) * (GRAHA_GUNAKARA[p] ?? 0);
      }
    }

    pindas[planet] = {
      rashiPinda,
      grahaPinda,
      shodhitaPinda: rashiPinda + grahaPinda,
    };
  }

  return pindas;
};

/**
 * Computes Bhinna Ashtakvarga (BAV), Sarva Ashtakvarga (SAV), and
 * Prastarashtakvarga tables for all 7 planets from natal sign positions.
 * @param signPositions Record mapping Sun..Saturn and Lagna to their sign index (0 = Aries .. 11 = Pisces).
 */
export const computeAshtakvarga = (
  signPositions: Record<Contributor, number>,
): AshtakvargaResult => {
  const bhinna = {} as Record<AshtakvargaPlanet, number[]>;
  const planetTotals = {} as Record<AshtakvargaPlanet, number>;
  const prastara = {} as Record<AshtakvargaPlanet, PrastaraTable>;
  const sarva = new Array<number>(12).fill(0);

  for (const planet of ASHTAKVARGA_PLANETS) {
    const rules = PARASHARA_RULES[planet];
    const rows = {} as Record<Contributor, number[]>;
    const planetSignTotals = new Array<number>(12).fill(0);

    for (const ref of CONTRIBUTORS) {
      const refSign = signPositions[ref];
      const benefics = rules[ref];
      const row = new Array<number>(12).fill(0);

      for (const house of benefics) {
        // House 1 is refSign, House 2 is refSign + 1, etc.
        const targetSign = (refSign + (house - 1)) % 12;
        row[targetSign] = 1;
      }

      rows[ref] = row;
      for (let s = 0; s < 12; s++) {
        planetSignTotals[s] = (planetSignTotals[s] ?? 0) + (row[s] ?? 0);
      }
    }

    bhinna[planet] = planetSignTotals;
    const pTotal = planetSignTotals.reduce((a, b) => a + b, 0);
    planetTotals[planet] = pTotal;

    prastara[planet] = {
      planet,
      rows,
      totals: planetSignTotals,
      totalSum: pTotal,
    };

    for (let s = 0; s < 12; s++) {
      sarva[s] = (sarva[s] ?? 0) + (planetSignTotals[s] ?? 0);
    }
  }

  const sarvaTotal = sarva.reduce((a, b) => a + b, 0);

  // Compute classical Shodhana reductions and Pindas
  const trikonaShodhita = computeTrikonaShodhana(bhinna);
  const ekadhipatyaShodhita = computeEkadhipatyaShodhana(trikonaShodhita, signPositions);
  const pindas = computeShodhitaPinda(ekadhipatyaShodhita, signPositions);

  return {
    bhinna,
    planetTotals,
    sarva,
    sarvaTotal,
    prastara,
    trikonaShodhita,
    ekadhipatyaShodhita,
    pindas,
  };
};

export * from './shodhana.js';

