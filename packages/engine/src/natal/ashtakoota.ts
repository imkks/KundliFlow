import { computeAvakahada, type AvakahadaDetails } from './avakahada.js';
import { SIGN_LORDS } from './types.js';

export interface AshtakootaKoota {
  name: string;
  maxPoints: number;
  points: number;
  note: string;
}

export interface AshtakootaResult {
  totalPoints: number;
  maxPoints: 36;
  verdict: 'Excellent' | 'Good' | 'Average' | 'Low';
  kootas: AshtakootaKoota[];
  nativeA: AvakahadaDetails;
  nativeB: AvakahadaDetails;
}

const VARNA_ORDER: Record<string, number> = {
  Brahmin: 4,
  Kshatriya: 3,
  Vaishya: 2,
  Shudra: 1,
};

const NATURAL_FRIENDS: Record<string, { friends: string[]; enemies: string[] }> = {
  sun: { friends: ['moon', 'mars', 'jupiter'], enemies: ['venus', 'saturn'] },
  moon: { friends: ['sun', 'mercury'], enemies: [] },
  mars: { friends: ['sun', 'moon', 'jupiter'], enemies: ['mercury'] },
  mercury: { friends: ['sun', 'venus'], enemies: ['moon'] },
  jupiter: { friends: ['sun', 'moon', 'mars'], enemies: ['mercury', 'venus'] },
  venus: { friends: ['mercury', 'saturn'], enemies: ['sun', 'moon'] },
  saturn: { friends: ['mercury', 'venus'], enemies: ['sun', 'moon', 'mars'] },
};

/**
 * Computes classical 36-point Ashtakoota (Gun Milan) compatibility between two Moon signs & nakshatras.
 */
export function computeAshtakoota(
  a: { moonSignIndex: number; moonNakshatraIndex: number; pada?: number },
  b: { moonSignIndex: number; moonNakshatraIndex: number; pada?: number },
): AshtakootaResult {
  const avA = computeAvakahada(a.moonNakshatraIndex, a.moonSignIndex);
  const avB = computeAvakahada(b.moonNakshatraIndex, b.moonSignIndex);

  // 1. Varna (1 pt)
  const varnaPts = (VARNA_ORDER[avA.varna] ?? 1) >= (VARNA_ORDER[avB.varna] ?? 1) ? 1 : 0;

  // 2. Vashya (2 pts)
  const vashyaPts = avA.vasya === avB.vasya ? 2 : 1;

  // 3. Tara (3 pts): count from A to B and B to A mod 9
  const distAB = ((b.moonNakshatraIndex - a.moonNakshatraIndex + 27) % 27) % 9;
  const distBA = ((a.moonNakshatraIndex - b.moonNakshatraIndex + 27) % 27) % 9;
  const badTaras = new Set([2, 4, 6]); // 0-indexed: 3rd (Vipat), 5th (Pratyak), 7th (Naidhana)
  const aOk = !badTaras.has(distAB);
  const bOk = !badTaras.has(distBA);
  const taraPts = aOk && bOk ? 3 : aOk || bOk ? 1.5 : 0;

  // 4. Yoni (4 pts)
  const yoniPts = avA.yoni === avB.yoni ? 4 : 2;

  // 5. Graha Maitri (5 pts)
  const lordA = SIGN_LORDS[((a.moonSignIndex % 12) + 12) % 12]!;
  const lordB = SIGN_LORDS[((b.moonSignIndex % 12) + 12) % 12]!;
  let maitriPts = 3;
  if (lordA === lordB) {
    maitriPts = 5;
  } else {
    const aLikesB = NATURAL_FRIENDS[lordA]?.friends.includes(lordB)
      ? 1
      : NATURAL_FRIENDS[lordA]?.enemies.includes(lordB)
      ? -1
      : 0;
    const bLikesA = NATURAL_FRIENDS[lordB]?.friends.includes(lordA)
      ? 1
      : NATURAL_FRIENDS[lordB]?.enemies.includes(lordA)
      ? -1
      : 0;
    if (aLikesB === 1 && bLikesA === 1) maitriPts = 5;
    else if ((aLikesB === 1 && bLikesA === 0) || (bLikesA === 1 && aLikesB === 0)) maitriPts = 4;
    else if (aLikesB === 0 && bLikesA === 0) maitriPts = 3;
    else if (aLikesB === -1 && bLikesA === -1) maitriPts = 0;
    else maitriPts = 1;
  }

  // 6. Gana (6 pts)
  let ganaPts = 0;
  if (avA.gana === avB.gana) ganaPts = 6;
  else if (
    (avA.gana === 'Deva' && avB.gana === 'Manushya') ||
    (avA.gana === 'Manushya' && avB.gana === 'Deva')
  ) {
    ganaPts = 5;
  } else if (avA.gana === 'Rakshasa' || avB.gana === 'Rakshasa') {
    ganaPts = 1;
  }

  // 7. Bhakoot (7 pts)
  const signDist = ((b.moonSignIndex - a.moonSignIndex + 12) % 12) + 1; // 1..12
  const doshaDists = new Set([2, 12, 5, 9, 6, 8]);
  const bhakootPts = doshaDists.has(signDist) && lordA !== lordB ? 0 : 7;

  // 8. Nadi (8 pts)
  const nadiPts = avA.nadi !== avB.nadi ? 8 : 0;

  const kootas: AshtakootaKoota[] = [
    { name: 'Varna', maxPoints: 1, points: varnaPts, note: `${avA.varna} / ${avB.varna}` },
    { name: 'Vashya', maxPoints: 2, points: vashyaPts, note: `${avA.vashya} / ${avB.vashya}` },
    { name: 'Tara', maxPoints: 3, points: taraPts, note: 'Lunar star rhythm' },
    { name: 'Yoni', maxPoints: 4, points: yoniPts, note: `${avA.yoni} / ${avB.yoni}` },
    { name: 'Graha Maitri', maxPoints: 5, points: maitriPts, note: `${lordA} / ${lordB}` },
    { name: 'Gana', maxPoints: 6, points: ganaPts, note: `${avA.gana} / ${avB.gana}` },
    { name: 'Bhakoot', maxPoints: 7, points: bhakootPts, note: `Rashi distance ${signDist}` },
    { name: 'Nadi', maxPoints: 8, points: nadiPts, note: `${avA.nadi} / ${avB.nadi}` },
  ];

  const totalPoints = kootas.reduce((s, k) => s + k.points, 0);
  const verdict =
    totalPoints >= 28 ? 'Excellent' : totalPoints >= 21 ? 'Good' : totalPoints >= 18 ? 'Average' : 'Low';

  return {
    totalPoints,
    maxPoints: 36,
    verdict,
    kootas,
    nativeA: avA,
    nativeB: avB,
  };
}
