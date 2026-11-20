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

export interface AshtakvargaResult {
  bhinna: Record<AshtakvargaPlanet, number[]>; // 12 numbers per planet (Aries..Pisces)
  planetTotals: Record<AshtakvargaPlanet, number>;
  sarva: number[]; // 12 numbers (Aries..Pisces)
  sarvaTotal: number; // Invariant: must equal 337
  prastara: Record<AshtakvargaPlanet, PrastaraTable>;
}

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

  return {
    bhinna,
    planetTotals,
    sarva,
    sarvaTotal,
    prastara,
  };
};
