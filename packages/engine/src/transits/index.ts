import { norm360, signOf, nakshatraOf } from '../angles.js';
import type { EphemerisProvider } from '../ephemeris/types.js';
import type { VedicGraha } from '../natal/types.js';
import { houseFromSign } from '../natal/positions.js';
import { checkTransitVedha, type VedhaCheckResult } from './vedha.js';

export interface SadeSatiStatus {
  isActive: boolean;
  phase: 'rising' | 'peak' | 'setting' | 'none'; // 12th, 1st, or 2nd from natal Moon
  houseFromMoon: number; // 1-12
  isAshtamaShani: boolean; // 8th from Moon
  isKantakaShani: boolean; // 4th, 7th, or 10th from Moon
}

export interface TransitPlanet {
  graha: VedicGraha;
  sign: string;
  signIndex: number;
  degInSign: number;
  speed: number;
  retrograde: boolean;
  houseFromLagna: number;
  houseFromMoon: number;
  ashtakvargaBindus: number; // Bindus in current sign from natal Bhinna table
  lon?: number;
  nakshatra?: string;
  nakshatraIndex?: number;
  pada?: 1 | 2 | 3 | 4;
  vedha?: VedhaCheckResult;
  kakshya?: KakshyaTransitEvaluation;
}

export interface TransitOverview {
  jdUt: number;
  ayanamsa: number;
  sadeSati: SadeSatiStatus;
  jupiterHouseFromMoon: number;
  rahuKetuAxis: {
    rahuHouseFromMoon: number;
    ketuHouseFromMoon: number;
  };
  transits: Record<VedicGraha, TransitPlanet>;
  vedha?: Record<VedicGraha, VedhaCheckResult>;
  kakshya?: {
    evaluations: KakshyaTransitEvaluation[];
    beneficCount: number;
    totalPlanets: number;
  };
}

const TRANSIT_GRAHAS: readonly VedicGraha[] = [
  'sun',
  'moon',
  'mars',
  'mercury',
  'jupiter',
  'venus',
  'saturn',
  'rahu',
  'ketu',
];

/**
 * Computes live planetary transits (Gochar) and evaluates Sade Sati,
 * Kantaka Shani, Ashtama Shani, and Ashtakvarga transit strength.
 */
export const computeTransits = (
  eph: EphemerisProvider,
  jdUt: number,
  natalLagnaSignIndex: number,
  natalMoonSignIndex: number,
  natalBhinnaAshtakvarga?: Record<string, number[]>, // 12 values per planet
  natalPrastaraAshtakvarga?: Record<string, { rows: Record<string, number[]> }>,
): TransitOverview => {
  const ay = eph.ayanamsa(jdUt, 'lahiri');
  const seven = eph.bodies(jdUt, [
    'sun',
    'moon',
    'mars',
    'mercury',
    'jupiter',
    'venus',
    'saturn',
  ]);
  const node = eph.meanNode(jdUt);

  const transits = {} as Record<VedicGraha, TransitPlanet>;

  const addPlanet = (
    graha: VedicGraha,
    tropLon: number,
    speed: number,
    forceRetro = false,
  ) => {
    const sidLon = norm360(tropLon - ay);
    const s = signOf(sidLon);
    const nak = nakshatraOf(sidLon);
    const hLagna = houseFromSign(s.signIndex, natalLagnaSignIndex);
    const hMoon = houseFromSign(s.signIndex, natalMoonSignIndex);
    const bindus = natalBhinnaAshtakvarga?.[graha]?.[s.signIndex] ?? 0;

    transits[graha] = {
      graha,
      sign: s.sign,
      signIndex: s.signIndex,
      degInSign: s.degInSign,
      speed,
      retrograde: forceRetro || speed < 0,
      houseFromLagna: hLagna,
      houseFromMoon: hMoon,
      ashtakvargaBindus: bindus,
      lon: sidLon,
      nakshatra: nak.nakshatra,
      nakshatraIndex: nak.nakshatraIndex,
      pada: nak.pada,
    };
  };

  for (const g of ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'] as const) {
    const b = seven[g];
    addPlanet(g, b.lon, b.speed);
  }

  addPlanet('rahu', node.lon, node.speed, true);
  addPlanet('ketu', norm360(node.lon + 180), node.speed, true);

  // Sade Sati analysis for Saturn
  const saturnHouseFromMoon = transits.saturn.houseFromMoon;
  let isActiveSadeSati = false;
  let phase: SadeSatiStatus['phase'] = 'none';

  if (saturnHouseFromMoon === 12) {
    isActiveSadeSati = true;
    phase = 'rising'; // 1st cycle / rising phase
  } else if (saturnHouseFromMoon === 1) {
    isActiveSadeSati = true;
    phase = 'peak'; // 2nd cycle / core peak
  } else if (saturnHouseFromMoon === 2) {
    isActiveSadeSati = true;
    phase = 'setting'; // 3rd cycle / setting phase
  }

  const isAshtamaShani = saturnHouseFromMoon === 8;
  const isKantakaShani = [4, 7, 10].includes(saturnHouseFromMoon);

  // Classical Gochara Vedha check with Father-Son exemptions
  const allTransitHousesFromMoon = {} as Record<VedicGraha, number>;
  for (const g of TRANSIT_GRAHAS) {
    allTransitHousesFromMoon[g] = transits[g].houseFromMoon;
  }

  const vedhaMap = {} as Record<VedicGraha, VedhaCheckResult>;
  for (const g of TRANSIT_GRAHAS) {
    const v = checkTransitVedha(g, transits[g].houseFromMoon, allTransitHousesFromMoon);
    vedhaMap[g] = v;
    transits[g].vedha = v;
  }

  // Kakshya transit evaluation if Prastara Ashtakavarga table is provided
  let kakshyaSummary: { evaluations: KakshyaTransitEvaluation[]; beneficCount: number; totalPlanets: number } | undefined;
  if (natalPrastaraAshtakvarga) {
    const lons: Record<string, number> = {};
    for (const g of ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn']) {
      if (transits[g as VedicGraha]?.lon !== undefined) {
        lons[g] = transits[g as VedicGraha].lon!;
      }
    }
    const res = evaluateKakshyaTransits(lons, natalPrastaraAshtakvarga);
    kakshyaSummary = res;
    for (const ev of res.evaluations) {
      if (transits[ev.planet as VedicGraha]) {
        transits[ev.planet as VedicGraha].kakshya = ev;
      }
    }
  }

  return {
    jdUt,
    ayanamsa: ay,
    sadeSati: {
      isActive: isActiveSadeSati,
      phase,
      houseFromMoon: saturnHouseFromMoon,
      isAshtamaShani,
      isKantakaShani,
    },
    jupiterHouseFromMoon: transits.jupiter.houseFromMoon,
    rahuKetuAxis: {
      rahuHouseFromMoon: transits.rahu.houseFromMoon,
      ketuHouseFromMoon: transits.ketu.houseFromMoon,
    },
    transits,
    vedha: vedhaMap,
    ...(kakshyaSummary ? { kakshya: kakshyaSummary } : {}),
  };
};

export const KAKSHYA_LORDS = [
  'saturn',
  'jupiter',
  'mars',
  'sun',
  'venus',
  'mercury',
  'moon',
  'lagna',
] as const;

export type KakshyaLord = (typeof KAKSHYA_LORDS)[number];

export interface KakshyaTransitEvaluation {
  planet: string;
  signIndex: number;
  degInSign: number;
  arcStartDeg: number;
  arcEndDeg: number;
  kakshyaIndex: number; // 1 to 8
  kakshyaLord: KakshyaLord;
  isBenefic: boolean;
  bindu: 0 | 1;
  explanation: string;
}

/**
 * Evaluates daily transit through Ashtakavarga Kakshyas (3°45' sub-divisions) per classical Parashara principles.
 * Each sign is divided into 8 Kakshyas ruled in astronomical order:
 * Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon, Lagna.
 * If the Kakshya lord contributes a bindu in that sign in the planet's Prastaraka, the transit is benefic.
 */
export function evaluateKakshyaTransits(
  transitPositions: Record<string, number>,
  prastara?: Record<string, { rows: Record<string, number[]> }>,
): {
  evaluations: KakshyaTransitEvaluation[];
  beneficCount: number;
  totalPlanets: number;
} {
  const evaluations: KakshyaTransitEvaluation[] = [];
  let beneficCount = 0;
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  for (const planet of ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn']) {
    const lon = transitPositions[planet];
    if (lon === undefined) continue;

    const normLon = norm360(lon);
    const signIndex = Math.floor(normLon / 30);
    const degInSign = normLon % 30;
    const kIndex = Math.min(7, Math.floor(degInSign / 3.75)); // 0 to 7
    const kakshyaLord = KAKSHYA_LORDS[kIndex]!;
    const arcStartDeg = Number((kIndex * 3.75).toFixed(2));
    const arcEndDeg = Number(((kIndex + 1) * 3.75).toFixed(2));

    let isBenefic = false;
    if (prastara && prastara[planet]?.rows?.[kakshyaLord]) {
      const row = prastara[planet]!.rows[kakshyaLord]!;
      isBenefic = (row[signIndex] ?? 0) === 1;
    }

    if (isBenefic) beneficCount++;
    const bindu: 0 | 1 = isBenefic ? 1 : 0;
    const explanation = isBenefic
      ? `${cap(planet)} transits Kakshya ${kIndex + 1}/8 (${kakshyaLord.toUpperCase()}, ${arcStartDeg}°–${arcEndDeg}°) with a benefic bindu (1) — unobstructed fruition.`
      : `${cap(planet)} transits Kakshya ${kIndex + 1}/8 (${kakshyaLord.toUpperCase()}, ${arcStartDeg}°–${arcEndDeg}°) with 0 bindus — temporary friction or lack of permission.`;

    evaluations.push({
      planet,
      signIndex,
      degInSign,
      arcStartDeg,
      arcEndDeg,
      kakshyaIndex: kIndex + 1,
      kakshyaLord,
      isBenefic,
      bindu,
      explanation,
    });
  }

  return {
    evaluations,
    beneficCount,
    totalPlanets: evaluations.length,
  };
}

export * from './vedha.js';

