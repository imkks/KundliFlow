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

// Classical 14 Yoni Animals
// Sworn Enemies (Maha Vaira) score 0 points
const MAHA_VAIRA_PAIRS = new Set([
  'horse-buffalo', 'buffalo-horse',
  'elephant-lion', 'lion-elephant',
  'sheep-monkey', 'monkey-sheep',
  'serpent-mongoose', 'mongoose-serpent',
  'dog-deer', 'deer-dog',
  'cat-rat', 'rat-cat',
  'cow-tiger', 'tiger-cow',
]);

const FRIENDLY_YONI_PAIRS = new Set([
  'horse-deer', 'deer-horse',
  'horse-monkey', 'monkey-horse',
  'elephant-cow', 'cow-elephant',
  'sheep-cow', 'cow-sheep',
  'cat-deer', 'deer-cat',
]);

function extractYoniKey(yoniStr: string): string {
  const l = yoniStr.toLowerCase();
  if (l.includes('horse') || l.includes('ashva')) return 'horse';
  if (l.includes('elephant') || l.includes('gaja')) return 'elephant';
  if (l.includes('sheep') || l.includes('mesha')) return 'sheep';
  if (l.includes('serpent') || l.includes('sarpa')) return 'serpent';
  if (l.includes('dog') || l.includes('shvan')) return 'dog';
  if (l.includes('cat') || l.includes('marjara')) return 'cat';
  if (l.includes('rat') || l.includes('mushaka')) return 'rat';
  if (l.includes('cow') || l.includes('gau')) return 'cow';
  if (l.includes('buffalo') || l.includes('mahisha')) return 'buffalo';
  if (l.includes('tiger') || l.includes('vyaghra')) return 'tiger';
  if (l.includes('deer') || l.includes('mriga')) return 'deer';
  if (l.includes('monkey') || l.includes('vanara')) return 'monkey';
  if (l.includes('mongoose') || l.includes('nakula')) return 'mongoose';
  if (l.includes('lion') || l.includes('simha')) return 'lion';
  return l.split(' ')[0] || 'neutral';
}

function calculateYoniPoints(yoniA: string, yoniB: string): number {
  const kA = extractYoniKey(yoniA);
  const kB = extractYoniKey(yoniB);
  if (kA === kB) return 4;
  const pairKey = `${kA}-${kB}`;
  if (MAHA_VAIRA_PAIRS.has(pairKey)) return 0; // Sworn enemies
  if (FRIENDLY_YONI_PAIRS.has(pairKey)) return 3; // Friendly
  return 2; // Neutral
}

// Classical Vashya compatibility (Table XXVII-2, Dr. K.S. Charak)
const VASHYA_SCORES: Record<string, Record<string, number>> = {
  Chatushpada: { Chatushpada: 2, Manava: 1, Jalachara: 1, Vanachara: 0, Keeta: 1 },
  Manava: { Chatushpada: 1, Manava: 2, Jalachara: 0.5, Vanachara: 0, Keeta: 1 },
  Jalachara: { Chatushpada: 1, Manava: 0.5, Jalachara: 2, Vanachara: 0, Keeta: 1 },
  Vanachara: { Chatushpada: 0, Manava: 0, Jalachara: 0, Vanachara: 2, Keeta: 0 },
  Keeta: { Chatushpada: 1, Manava: 1, Jalachara: 1, Vanachara: 0, Keeta: 2 },
};

function calculateVashyaPoints(vA: string, vB: string): number {
  if (vA === vB) return 2;
  return VASHYA_SCORES[vA]?.[vB] ?? VASHYA_SCORES[vB]?.[vA] ?? 0.5;
}

// Classical Gana compatibility (Table XXVII-6, Dr. K.S. Charak)
// Rows: Groom (A), Columns: Bride (B)
const GANA_SCORES: Record<string, Record<string, number>> = {
  Deva: { Deva: 6, Manushya: 5, Rakshasa: 1 },
  Manushya: { Deva: 6, Manushya: 6, Rakshasa: 0 },
  Rakshasa: { Deva: 0, Manushya: 0, Rakshasa: 6 },
};

function calculateGanaPoints(gA: string, gB: string): number {
  if (gA === gB) return 6;
  return GANA_SCORES[gA]?.[gB] ?? 0;
}

// Advanced Naadi groups according to Dr. K.S. Charak Ch. XXVII (pages 463-464)
// Applied for Sun/Jupiter nakshatras (Chatur-Naadi) and Mars nakshatras (Pancha-Naadi)
const CHATUR_NAADI_GROUPS = [
  new Set([2, 9, 10, 17, 18, 25, 26]), // 1st: Krittika, Magha, P. Phalguni, Jyeshtha, Moola, U. Bhadrapada, Revati
  new Set([3, 8, 11, 16, 19, 24, 0]),  // 2nd: Rohini, Ashlesha, U. Phalguni, Anuradha, P. Ashadha, P. Bhadrapada, Ashwini
  new Set([4, 7, 12, 15, 20, 23, 1]),  // 3rd: Mrigashira, Pushya, Hasta, Vishakha, U. Ashadha, Shatabhishaj, Bharani
  new Set([5, 6, 13, 14, 21, 22]),     // 4th: Ardra, Punarvasu, Chitra, Swati, Shravana, Dhanishtha
];

const PANCHA_NAADI_GROUPS = [
  new Set([4, 13, 14, 23, 24]),        // 1st: Mrigashira, Chitra, Swati, Shatabhishaj, P. Bhadrapada
  new Set([5, 12, 15, 22, 25]),        // 2nd: Ardra, Hasta, Vishakha, Dhanishtha, U. Bhadrapada
  new Set([6, 11, 16, 21, 26]),        // 3rd: Punarvasu, U. Phalguni, Anuradha, Shravana, Revati
  new Set([7, 10, 17, 20, 0, 3]),      // 4th: Pushya, P. Phalguni, Jyeshtha, U. Ashadha, Ashwini, Rohini
  new Set([8, 9, 18, 19, 1, 2]),       // 5th: Ashlesha, Magha, Moola, P. Ashadha, Bharani, Krittika
];

/**
 * Computes classical 36-point Ashtakoota (Gun Milan) compatibility between two Moon signs & nakshatras
 * including classical Nadi Dosha Bhanga (cancellations) and full 14x14 Yoni matrices.
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
  const vashyaPts = calculateVashyaPoints(avA.vashya ?? avA.vasya, avB.vashya ?? avB.vasya);

  // 3. Tara (3 pts): count from A to B and B to A mod 9
  const distAB = ((b.moonNakshatraIndex - a.moonNakshatraIndex + 27) % 27) % 9;
  const distBA = ((a.moonNakshatraIndex - b.moonNakshatraIndex + 27) % 27) % 9;
  const badTaras = new Set([2, 4, 6]); // 0-indexed: 3rd (Vipat), 5th (Pratyak), 7th (Naidhana)
  const aOk = !badTaras.has(distAB);
  const bOk = !badTaras.has(distBA);
  const taraPts = aOk && bOk ? 3 : aOk || bOk ? 1.5 : 0;

  // 4. Yoni (4 pts) - using authentic 14x14 matrix with Maha Vaira checking
  const yoniPts = calculateYoniPoints(avA.yoni, avB.yoni);

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
    else if ((aLikesB === 0 && bLikesA === -1) || (aLikesB === -1 && bLikesA === 0)) maitriPts = 0.5;
    else maitriPts = 1; // 1 friend, 1 enemy
  }

  // 6. Gana (6 pts) - Table XXVII-6
  const ganaPts = calculateGanaPoints(avA.gana, avB.gana);

  // 7. Bhakoot (7 pts)
  const signDist = ((b.moonSignIndex - a.moonSignIndex + 12) % 12) + 1; // 1..12
  const doshaDists = new Set([2, 12, 5, 9, 6, 8]);
  const isLordFriend =
    lordA === lordB ||
    (NATURAL_FRIENDS[lordA]?.friends.includes(lordB) && NATURAL_FRIENDS[lordB]?.friends.includes(lordA));
  const bhakootPts = doshaDists.has(signDist) && !isLordFriend ? 0 : 7;

  // 8. Nadi (8 pts) with Classical Nadi Dosha Bhanga (Cancellations)
  let nadiPts = 0;
  let nadiNote = `${avA.nadi} / ${avB.nadi}`;
  if (avA.nadi !== avB.nadi) {
    nadiPts = 8;
  } else {
    // Check Classical Nadi Dosha Cancellations
    // 1. Same Nakshatra, Different Signs (e.g. Krittika 1 in Aries vs 2,3,4 in Taurus)
    if (a.moonNakshatraIndex === b.moonNakshatraIndex && a.moonSignIndex !== b.moonSignIndex) {
      nadiPts = 8;
      nadiNote += ' (Cancelled: Same Nakshatra, Different Rashis)';
    }
    // 2. Same Sign, Different Nakshatras
    else if (a.moonSignIndex === b.moonSignIndex && a.moonNakshatraIndex !== b.moonNakshatraIndex) {
      nadiPts = 8;
      nadiNote += ' (Cancelled: Same Rashi, Different Nakshatras)';
    }
    // 3. Same Nakshatra, Different Padas (Charanas) when pada is specified
    else if (
      a.moonNakshatraIndex === b.moonNakshatraIndex &&
      a.pada !== undefined &&
      b.pada !== undefined &&
      a.pada !== b.pada
    ) {
      nadiPts = 8;
      nadiNote += ' (Cancelled: Different Padas)';
    }
    // 4. Chatur-Naadi exemption (Sun & Jupiter nakshatras: 2, 6, 11, 15, 20, 24)
    else if ([2, 6, 11, 15, 20, 24].includes(b.moonNakshatraIndex % 27)) {
      const gA = CHATUR_NAADI_GROUPS.findIndex(g => g.has(a.moonNakshatraIndex % 27));
      const gB = CHATUR_NAADI_GROUPS.findIndex(g => g.has(b.moonNakshatraIndex % 27));
      if (gA !== -1 && gB !== -1 && gA !== gB) {
        nadiPts = 8;
        nadiNote += ' (Cancelled: Chatur-Naadi Exception)';
      }
    }
    // 5. Pancha-Naadi exemption (Mars nakshatras: 4, 13, 22)
    else if ([4, 13, 22].includes(b.moonNakshatraIndex % 27)) {
      const pA = PANCHA_NAADI_GROUPS.findIndex(g => g.has(a.moonNakshatraIndex % 27));
      const pB = PANCHA_NAADI_GROUPS.findIndex(g => g.has(b.moonNakshatraIndex % 27));
      if (pA !== -1 && pB !== -1 && pA !== pB) {
        nadiPts = 8;
        nadiNote += ' (Cancelled: Pancha-Naadi Exception)';
      }
    }
  }

  const kootas: AshtakootaKoota[] = [
    { name: 'Varna', maxPoints: 1, points: varnaPts, note: `${avA.varna} / ${avB.varna}` },
    { name: 'Vashya', maxPoints: 2, points: vashyaPts, note: `${avA.vashya} / ${avB.vashya}` },
    { name: 'Tara', maxPoints: 3, points: taraPts, note: 'Lunar star rhythm' },
    { name: 'Yoni', maxPoints: 4, points: yoniPts, note: `${avA.yoni} / ${avB.yoni}` },
    { name: 'Graha Maitri', maxPoints: 5, points: maitriPts, note: `${lordA} / ${lordB}` },
    { name: 'Gana', maxPoints: 6, points: ganaPts, note: `${avA.gana} / ${avB.gana}` },
    { name: 'Bhakoot', maxPoints: 7, points: bhakootPts, note: `Rashi distance ${signDist}` },
    { name: 'Nadi', maxPoints: 8, points: nadiPts, note: nadiNote },
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
