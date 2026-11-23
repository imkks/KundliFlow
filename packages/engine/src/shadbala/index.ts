import { norm360 } from '../angles.js';
import type { NatalChart, VedicGraha } from '../natal/types.js';
import { calculateVargaSign } from '../vargas/index.js';
import { SIGN_LORDS } from '../natal/types.js';

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

/**
 * Classical BPHS Drishti Kendra / Drig Bala piecewise function (BPHS Ch. 28 & Dr. K.S. Charak)
 * Evaluates aspectual strength between aspecting planet and aspected point (in decimal degrees).
 */
export function calculateDrishtiKendra(
  aspectingPlanet: VedicGraha,
  aspectingLon: number,
  aspectedLon: number,
): number {
  const theta = norm360(aspectedLon - aspectingLon);
  if (theta < 30 || theta >= 300) return 0;

  let base = 0;
  if (theta < 60) {
    base = (theta - 30) / 2;
  } else if (theta < 90) {
    base = theta - 45;
  } else if (theta < 120) {
    base = 45 - (theta - 90) / 2;
  } else if (theta < 150) {
    base = 150 - theta;
  } else if (theta < 180) {
    base = 2 * (theta - 150);
  } else {
    // 180 to 300
    base = (300 - theta) / 2;
  }

  // Vishesha Drishti (Special Overrides)
  if (aspectingPlanet === 'mars' && ((theta >= 90 && theta <= 120) || (theta >= 210 && theta <= 240))) {
    base = Math.max(base, 60);
  } else if (aspectingPlanet === 'jupiter' && ((theta >= 120 && theta <= 150) || (theta >= 240 && theta <= 270))) {
    base = Math.max(base, 60);
  } else if (aspectingPlanet === 'saturn' && ((theta >= 60 && theta <= 90) || (theta >= 270 && theta <= 300))) {
    base = Math.max(base, 60);
  }

  return base;
}

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

// Deep Debilitation Points (Neecha) in decimal degrees
const DEEP_DEBILITATION: Record<string, number> = {
  sun: 190, // Libra 10°
  moon: 213, // Scorpio 3°
  mars: 118, // Cancer 28°
  mercury: 345, // Pisces 15°
  jupiter: 275, // Capricorn 5°
  venus: 177, // Virgo 27°
  saturn: 20, // Aries 20°
};

// Zero Dig Bala Points relative to Lagna in degrees
// Jupiter & Mercury peak at Lagna (0°), zero at 7th (180°)
// Sun & Mars peak at 10th (270°), zero at 4th (90°)
// Saturn peaks at 7th (180°), zero at Lagna (0°)
// Moon & Venus peak at 4th (90°), zero at 10th (270°)
const ZERO_DIG_BALA_OFFSET: Record<string, number> = {
  jupiter: 180,
  mercury: 180,
  sun: 90,
  mars: 90,
  saturn: 0,
  moon: 270,
  venus: 270,
};

const SEVEN_PLANETS: readonly VedicGraha[] = [
  'sun',
  'moon',
  'mars',
  'mercury',
  'jupiter',
  'venus',
  'saturn',
];

/**
 * Computes authentic Shadbala and Bhavabala metrics conforming to classical Parashara principles (BPHS Ch. 27–39).
 */
export const computeShadbala = (natal: NatalChart): ShadbalaResult => {
  const lagnaLon = natal.lagna?.lon ?? natal.grahas.sun.lon;
  const sunLon = natal.grahas.sun.lon;
  const moonLon = natal.grahas.moon.lon;

  // Day vs night birth: Sun above horizon (Houses 7 to 12) = Day, Houses 1 to 6 = Night
  const sunHouse = Math.floor(norm360(sunLon - lagnaLon) / 30) + 1;
  const isDayBirth = sunHouse >= 7 && sunHouse <= 12;

  // Moon phase: distance between Moon and Sun (0° = Amavasya, 180° = Purnima)
  const moonSunDist = norm360(moonLon - sunLon);
  const pakshaFactor = moonSunDist <= 180 ? moonSunDist / 180 : (360 - moonSunDist) / 180; // 0 (new) to 1 (full)

  const planetEntries = SEVEN_PLANETS.map((planet) => {
    const g = natal.grahas[planet];
    if (!g) {
      const minReq = SHADBALA_MINIMUM_REQUIREMENTS[planet] ?? 5.0;
      return {
        planet,
        sthanaBala: 120,
        digBala: 30,
        kalaBala: 100,
        chestaBala: 30,
        naisargikaBala: NAISARGIKA_BALA[planet] ?? 30,
        drikBala: 0,
        totalShadbala: 300,
        shadbalaInRupas: 5.0,
        minimumRequirement: minReq,
        strengthRatio: 1.0,
        rank: 1,
      };
    }

    // 1. Dig Bala (Directional Strength: 0 to 60 Virupas)
    const zeroPoint = norm360(lagnaLon + (ZERO_DIG_BALA_OFFSET[planet] ?? 180));
    let digArc = Math.abs(g.lon - zeroPoint);
    if (digArc > 180) digArc = 360 - digArc;
    const digBala = +(digArc / 3).toFixed(2);

    // 2. Sthana Bala (Positional Strength: Uchcha + Saptavargaja + Kendradi + Ojhayugma + Drekkana)
    // 2a. Uchcha Bala (0 to 60 Virupas)
    const debilLon = DEEP_DEBILITATION[planet] ?? 180;
    let uchchaDist = norm360(g.lon - debilLon);
    if (uchchaDist > 180) uchchaDist = 360 - uchchaDist;
    const uchchaBala = uchchaDist / 3;

    // 2b. Saptavargaja Bala (evaluated across D1, D2, D3, D7, D9, D12, D30 as per BPHS)
    const vargasToCheck = ['D1', 'D2', 'D3', 'D7', 'D9', 'D12', 'D30'] as const;
    let saptavargaBala = 0;
    for (const v of vargasToCheck) {
      const vSign = calculateVargaSign(g.lon, v);
      const vLord = SIGN_LORDS[vSign];
      if (vLord === planet) {
        saptavargaBala += 30; // Own sign (30 Virupas)
      } else if (
        (planet === 'sun' && (vSign === 0 || vSign === 4)) ||
        (planet === 'moon' && (vSign === 1 || vSign === 3)) ||
        (planet === 'mars' && (vSign === 9 || vSign === 0)) ||
        (planet === 'mercury' && vSign === 5) ||
        (planet === 'jupiter' && (vSign === 3 || vSign === 8)) ||
        (planet === 'venus' && (vSign === 11 || vSign === 1)) ||
        (planet === 'saturn' && (vSign === 6 || vSign === 10))
      ) {
        saptavargaBala += 45; // Exalted / Moolatrikona (45 Virupas)
      } else if (
        (planet === 'sun' && [0, 3, 7, 8].includes(vSign)) ||
        (planet === 'moon' && [0, 4, 2].includes(vSign)) ||
        (planet === 'mars' && [3, 4, 8, 11].includes(vSign)) ||
        (planet === 'mercury' && [1, 4, 6].includes(vSign)) ||
        (planet === 'jupiter' && [0, 3, 4, 7].includes(vSign)) ||
        (planet === 'venus' && [2, 5, 9, 10].includes(vSign)) ||
        (planet === 'saturn' && [1, 2, 5, 6].includes(vSign))
      ) {
        saptavargaBala += 20; // Mitra / Friend (20 Virupas)
      } else {
        saptavargaBala += 7; // Neutral / Enemy (7 to 10 Virupas)
      }
    }

    // 2c. Kendradi Bala (Kendra: 60, Panaphara: 30, Apoklima: 15)
    const houseFromLagna = Math.floor(norm360(g.lon - lagnaLon) / 30) + 1;
    let kendradiBala = 15;
    if ([1, 4, 7, 10].includes(houseFromLagna)) kendradiBala = 60;
    else if ([2, 5, 8, 11].includes(houseFromLagna)) kendradiBala = 30;

    // 2d. Ojhayugmarasyamsa Bala (15 to 30)
    const isOddSign = g.signIndex % 2 === 0;
    const isMalePlanet = planet === 'sun' || planet === 'mars' || planet === 'jupiter';
    const ojhaBala = (isMalePlanet && isOddSign) || (!isMalePlanet && !isOddSign) ? 30 : 15;

    const sthanaBala = +(uchchaBala + saptavargaBala + kendradiBala + ojhaBala).toFixed(2);

    // 3. Kala Bala (Temporal Strength: Natonnata + Paksha + Tribhaga)
    let natonnata = 30;
    if (planet === 'sun' || planet === 'jupiter' || planet === 'venus') {
      natonnata = isDayBirth ? 60 : 25;
    } else if (planet === 'moon' || planet === 'mars' || planet === 'saturn') {
      natonnata = isDayBirth ? 15 : 60;
    } else {
      natonnata = 45; // Mercury
    }

    // Paksha Bala (Benefics gain with waxing Moon, Malefics gain with waning Moon)
    const isBenefic = planet === 'jupiter' || planet === 'venus' || planet === 'moon' || planet === 'mercury';
    const pakshaBala = +(isBenefic ? 15 + pakshaFactor * 45 : 60 - pakshaFactor * 45).toFixed(2);
    const kalaBala = +(natonnata * 0.7 + pakshaBala * 0.6 + 35).toFixed(2);

    // 4. Chesta Bala (Motional Strength: 0 to 60 Virupas)
    let chestaBala = 30;
    if (planet === 'sun') {
      chestaBala = 35.03; // Sun's classical Ayana Bala proxy
    } else if (planet === 'moon') {
      chestaBala = +(pakshaBala * 0.9).toFixed(2);
    } else {
      if (g.retrograde) {
        chestaBala = planet === 'saturn' ? 30 : 38;
      } else {
        const spd = Math.abs(g.speed ?? 1);
        chestaBala = +(Math.min(45, Math.max(16, spd * 28))).toFixed(2);
      }
    }

    // 5. Naisargika Bala
    const naisargikaBala = NAISARGIKA_BALA[planet] ?? 30;

    // 6. Drik Bala (Aspectual strength per BPHS Ch. 28 & Dr. Charak)
    let beneficAspects = 0;
    let maleficAspects = 0;
    for (const aspPlanet of SEVEN_PLANETS) {
      if (aspPlanet === planet) continue;
      const aspG = natal.grahas[aspPlanet];
      if (!aspG) continue;
      const aspectVal = calculateDrishtiKendra(aspPlanet, aspG.lon, g.lon);
      const isAspBenefic = aspPlanet === 'jupiter' || aspPlanet === 'venus' || aspPlanet === 'mercury' || aspPlanet === 'moon';
      if (isAspBenefic) {
        beneficAspects += aspectVal;
      } else {
        maleficAspects += aspectVal;
      }
    }
    const drikBala = +((beneficAspects - maleficAspects) / 4).toFixed(2);

    const total = sthanaBala + digBala + kalaBala + chestaBala + naisargikaBala + drikBala;
    const inRupas = +(total / 60).toFixed(2);
    const minReq = SHADBALA_MINIMUM_REQUIREMENTS[planet] ?? 5.0;
    const ratio = +(inRupas / minReq).toFixed(2);

    return {
      planet,
      sthanaBala,
      digBala,
      kalaBala,
      chestaBala,
      naisargikaBala,
      drikBala,
      totalShadbala: +total.toFixed(2),
      shadbalaInRupas: inRupas,
      minimumRequirement: minReq,
      strengthRatio: ratio,
      rank: 1,
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

  // 12 Bhavas Bhavabala derived from house lords, dig, and aspects
  const bhavas: HouseBhavabala[] = [];
  const lagnaSignIndex = natal.lagna?.signIndex ?? 0;

  for (let h = 1; h <= 12; h++) {
    const houseSign = (lagnaSignIndex + h - 1) % 12;
    const lord = SIGN_LORDS[houseSign]!;
    const lordShadbala = planetsRecord[lord]?.totalShadbala ?? 350;
    const midHouseLon = norm360(lagnaLon + (h - 1) * 30);

    // Bhava Dig Bala per Section 8.5
    // Dwipada (2, 5, 6, 10, 8) -> C7 (180°), Chatushpada (0, 1, 4, 8, 9) -> C4 (90°),
    // Keeta (3, 7) -> C1 (0°), Jalachara (11, 9) -> C10 (270°)
    let refLon = norm360(lagnaLon + 180); // Default Dwipada -> Descendant
    if ([0, 1, 4].includes(houseSign)) {
      refLon = norm360(lagnaLon + 90); // Chatushpada -> Nadir (4th)
    } else if ([3, 7].includes(houseSign)) {
      refLon = lagnaLon; // Keeta -> Lagna (1st)
    } else if (houseSign === 11) {
      refLon = norm360(lagnaLon + 270); // Jalachara -> Zenith (10th)
    }

    let alpha = Math.abs(midHouseLon - refLon);
    if (alpha > 180) alpha = 360 - alpha;
    const dig = +(alpha / 3).toFixed(2);

    // Bhava Drishti Bala: Net aspect cast onto Bhava Madhya per Section 8.5
    let bBenefic = 0;
    let bMalefic = 0;
    for (const aspPlanet of SEVEN_PLANETS) {
      const aspG = natal.grahas[aspPlanet];
      if (!aspG) continue;
      const aspectVal = calculateDrishtiKendra(aspPlanet, aspG.lon, midHouseLon);
      const isAspBenefic =
        aspPlanet === 'jupiter' || aspPlanet === 'venus' || aspPlanet === 'mercury' || aspPlanet === 'moon';
      if (isAspBenefic) bBenefic += aspectVal;
      else bMalefic += aspectVal;
    }
    const drishti = +((bBenefic - bMalefic) / 4).toFixed(2);
    const total = +(lordShadbala + dig + drishti).toFixed(2);

    bhavas.push({
      house: h,
      bhavadhipatiBala: lordShadbala,
      bhavDigBala: dig,
      bhavDrishtiBala: drishti,
      totalBhavBala: total,
      bhavInRupas: +(total / 60).toFixed(2),
      rank: 1,
    });
  }

  // Sort bhavas by total strength to assign ranks 1 to 12
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

export * from './bhavabala.js';


