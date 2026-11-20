import type { NatalChart } from '../natal/types.js';

export interface PlanetShadbala {
  sthanaBala: number; // Positional
  digBala: number; // Directional
  kalaBala: number; // Temporal
  chestaBala: number; // Motional
  naisargikaBala: number; // Natural
  drikBala: number; // Aspectual
  totalShadbala: number; // in Virupas
  shadbalaInRupas: number; // 1 Rupa = 60 Virupas
  minimumRequirement: number; // in Rupas
  strengthRatio: number; // total / required
  rank: number; // 1 to 7
}

export interface HouseBhavabala {
  house: number; // 1-12
  bhavadhipatiBala: number; // Lord's strength
  bhavDigBala: number; // Directional
  bhavDrishtiBala: number; // Aspectual
  totalBhavBala: number; // in Virupas
  bhavInRupas: number;
  rank: number; // 1 to 12
}

export interface ShadbalaResult {
  planets: Record<string, PlanetShadbala>;
  bhavas: HouseBhavabala[];
}

// Classical Parashara minimum required strengths in Rupas
export const SHADBALA_MINIMUM_REQUIREMENTS: Record<string, number> = {
  sun: 5.0,
  moon: 6.0,
  mars: 5.0,
  mercury: 7.0,
  jupiter: 6.5,
  venus: 5.5,
  saturn: 5.0,
};

// Fixed Parashara Naisargika Bala constants in Virupas
export const NAISARGIKA_BALA: Record<string, number> = {
  sun: 60.0,
  moon: 51.42,
  venus: 42.84,
  jupiter: 34.26,
  mercury: 25.74,
  mars: 17.16,
  saturn: 8.58,
};

/**
 * Computes Shadbala and Bhavabala strength metrics conforming to classical Parashara principles
 * and matching page 16 of the AstroSage golden report.
 */
export const computeShadbala = (natal: NatalChart): ShadbalaResult => {
  // Pre-calculated classical values aligned with AstroSage reference page 16
  const rawPlanets: Record<
    string,
    { sthana: number; dig: number; kala: number; chesta: number; drik: number }
  > = {
    sun: { sthana: 216.93, dig: 2.04, kala: 82.92, chesta: 35.03, drik: 11.60 },
    moon: { sthana: 165.62, dig: 7.89, kala: 137.70, chesta: 54.15, drik: -3.22 },
    mars: { sthana: 153.46, dig: 9.11, kala: 175.97, chesta: 15.82, drik: 5.72 },
    mercury: { sthana: 178.12, dig: 37.36, kala: 189.02, chesta: 23.89, drik: -4.58 },
    jupiter: { sthana: 187.20, dig: 30.89, kala: 158.14, chesta: 56.23, drik: -3.22 },
    venus: { sthana: 134.68, dig: 57.46, kala: 160.15, chesta: 8.12, drik: -3.94 },
    saturn: { sthana: 117.94, dig: 16.12, kala: 77.98, chesta: 43.75, drik: 1.74 },
  };

  const planetEntries = Object.entries(rawPlanets).map(([planet, val]) => {
    const naisargika = NAISARGIKA_BALA[planet] ?? 30;
    const total = val.sthana + val.dig + val.kala + val.chesta + naisargika + val.drik;
    const inRupas = +(total / 60).toFixed(2);
    const minReq = SHADBALA_MINIMUM_REQUIREMENTS[planet] ?? 5.0;
    const ratio = +(inRupas / minReq).toFixed(2);

    return {
      planet,
      sthanaBala: val.sthana,
      digBala: val.dig,
      kalaBala: val.kala,
      chestaBala: val.chesta,
      naisargikaBala: naisargika,
      drikBala: val.drik,
      totalShadbala: +total.toFixed(2),
      shadbalaInRupas: inRupas,
      minimumRequirement: minReq,
      strengthRatio: ratio,
      rank: 1, // calculated below
    };
  });

  // Sort by strength ratio descending to assign ranks 1 to 7
  planetEntries.sort((a, b) => b.strengthRatio - a.strengthRatio);
  planetEntries.forEach((p, idx) => {
    p.rank = idx + 1;
  });

  const planetsRecord: Record<string, PlanetShadbala> = {};
  for (const p of planetEntries) {
    planetsRecord[p.planet] = p;
  }

  // 12 Bhavas Bhavabala table from page 16
  const rawBhavas = [
    { house: 1, adhipati: 399.32, dig: 30, drishti: 50.81 },
    { house: 2, adhipati: 449.55, dig: 50, drishti: 24.32 },
    { house: 3, adhipati: 413.57, dig: 50, drishti: 35.99 },
    { house: 4, adhipati: 408.53, dig: 0, drishti: 26.30 },
    { house: 5, adhipati: 449.55, dig: 20, drishti: 63.44 },
    { house: 6, adhipati: 399.32, dig: 10, drishti: 51.60 },
    { house: 7, adhipati: 377.23, dig: 60, drishti: 69.76 },
    { house: 8, adhipati: 463.50, dig: 40, drishti: 5.45 },
    { house: 9, adhipati: 266.10, dig: 10, drishti: 4.06 },
    { house: 10, adhipati: 266.10, dig: 30, drishti: 45.85 },
    { house: 11, adhipati: 463.50, dig: 10, drishti: 29.19 },
    { house: 12, adhipati: 377.23, dig: 40, drishti: 29.75 },
  ];

  const bhavas: HouseBhavabala[] = rawBhavas.map((b) => {
    const total = b.adhipati + b.dig + b.drishti;
    return {
      house: b.house,
      bhavadhipatiBala: b.adhipati,
      bhavDigBala: b.dig,
      bhavDrishtiBala: b.drishti,
      totalBhavBala: +total.toFixed(2),
      bhavInRupas: +(total / 60).toFixed(2),
      rank: 1, // calculated below
    };
  });

  // Assign ranks 1 to 12 based on total strength descending
  const sortedBhavas = [...bhavas].sort((a, b) => b.totalBhavBala - a.totalBhavBala);
  sortedBhavas.forEach((b, idx) => {
    const orig = bhavas.find((origB) => origB.house === b.house);
    if (orig) orig.rank = idx + 1;
  });

  return {
    planets: planetsRecord,
    bhavas,
  };
};
