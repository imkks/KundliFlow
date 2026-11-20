import { norm360, signOf } from '../angles.js';
import type { EphemerisProvider } from '../ephemeris/types.js';
import type { VedicGraha } from '../natal/types.js';
import { houseFromSign } from '../natal/positions.js';

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
  };
};
