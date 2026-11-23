import { norm360, signOf } from '../angles.js';

export interface ChalitBhava {
  bhava: number; // 1 to 12
  house: number; // alias for bhava (1 to 12)
  sign: string;
  signIndex: number;
  bhavaBeginDeg: number;
  startLon: number; // alias for bhavaBeginDeg
  midBhavaDeg: number;
  bhavaEndDeg: number;
  endLon: number; // alias for bhavaEndDeg
}

export interface ChalitChart {
  bhavas: ChalitBhava[];
}

/**
 * Computes Sripati Bhava Chalit chart (Bhava Madhya and Bhava Begin).
 * Lagna serves as the midpoint of the 1st house (Bhava Madhya 1).
 * Midheaven (MC) serves as the midpoint of the 10th house (Bhava Madhya 10).
 * Midpoints between successive Bhava Madhyas mark the beginning and end of each Bhava.
 */
export const computeSripatiChalit = (
  lagnaSiderealDeg: number,
  mcSiderealDeg: number = norm360(lagnaSiderealDeg + 270),
): ChalitChart => {
  const madhyas = new Array<number>(12);

  // 1st house midpoint = Lagna
  madhyas[0] = norm360(lagnaSiderealDeg);
  // 10th house midpoint = MC
  madhyas[9] = norm360(mcSiderealDeg);
  // 7th house midpoint = Lagna + 180
  madhyas[6] = norm360(lagnaSiderealDeg + 180);
  // 4th house midpoint = MC + 180
  madhyas[3] = norm360(mcSiderealDeg + 180);

  // Distance from 10th to 1st (quadrant 4)
  const dist10To1 = norm360(madhyas[0] - madhyas[9]);
  const spanQuadrant4 = dist10To1 / 3;
  madhyas[10] = norm360(madhyas[9] + spanQuadrant4);
  madhyas[11] = norm360(madhyas[9] + 2 * spanQuadrant4);

  // Distance from 1st to 4th (quadrant 1)
  const dist1To4 = norm360(madhyas[3] - madhyas[0]);
  const spanQuadrant1 = dist1To4 / 3;
  madhyas[1] = norm360(madhyas[0] + spanQuadrant1);
  madhyas[2] = norm360(madhyas[0] + 2 * spanQuadrant1);

  // Opposite houses (5, 6, 8, 9)
  madhyas[4] = norm360(madhyas[10] + 180);
  madhyas[5] = norm360(madhyas[11] + 180);
  madhyas[7] = norm360(madhyas[1] + 180);
  madhyas[8] = norm360(madhyas[2] + 180);

  // Bhava Begins and Ends
  const bhavas: ChalitBhava[] = [];

  for (let i = 0; i < 12; i++) {
    const prevIdx = (i + 11) % 12;
    const nextIdx = (i + 1) % 12;
    const prevMadhya = madhyas[prevIdx]!;
    const curMadhya = madhyas[i]!;
    const nextMadhya = madhyas[nextIdx]!;

    const prevSpan = norm360(curMadhya - prevMadhya);
    const bhavaBeginDeg = norm360(prevMadhya + prevSpan / 2);

    const nextSpan = norm360(nextMadhya - curMadhya);
    const bhavaEndDeg = norm360(curMadhya + nextSpan / 2);

    const s = signOf(curMadhya);

    bhavas.push({
      bhava: i + 1,
      house: i + 1,
      sign: s.sign,
      signIndex: s.signIndex,
      bhavaBeginDeg,
      startLon: bhavaBeginDeg,
      midBhavaDeg: curMadhya,
      bhavaEndDeg,
      endLon: bhavaEndDeg,
    });
  }

  return { bhavas };
};

/**
 * Determines which Chalit house a given sidereal longitude falls in.
 */
export const getChalitHouse = (planetLon: number, chalit: ChalitChart): number => {
  const normLon = norm360(planetLon);
  for (const b of chalit.bhavas) {
    const s = b.startLon;
    const e = b.endLon;
    const inside = s <= e ? normLon >= s && normLon < e : normLon >= s || normLon < e;
    if (inside) return b.house;
  }
  return 1;
};
