import { norm360, SIGNS } from '../angles.js';
import type { NatalChart, GrahaName } from '../natal/types.js';
import { calculateVargaSign, type VargaType } from './index.js';

export const DASAVARGA_TYPES: readonly VargaType[] = [
  'D1',
  'D2',
  'D3',
  'D7',
  'D9',
  'D10',
  'D12',
  'D16',
  'D30',
  'D60',
] as const;

export const PUSHKARA_BHAGA_DEGREES: readonly number[] = [
  21, // Aries
  14, // Taurus
  18, // Gemini
  8,  // Cancer
  21, // Leo
  14, // Virgo
  24, // Libra
  11, // Scorpio
  21, // Sagittarius
  14, // Capricorn
  24, // Aquarius
  9,  // Pisces
];

export interface PushkaraInfo {
  isPushkaraNavamsha: boolean;
  isPushkaraBhaga: boolean;
  navamshaSign: string;
  navamshaSignIndex: number;
  navamshaLord: string;
  pushkaraBhagaDeg: number;
  degInSign: number;
  description: string;
}

export type VaisheshikamsaTier =
  | 'parijata'
  | 'uttama'
  | 'gopura'
  | 'simhasana'
  | 'paravata'
  | 'devaloka'
  | 'brahmaloka'
  | 'airavata'
  | 'sreedhama';

export interface VaisheshikamsaResult {
  graha: string;
  vargaCount: number; // 0 to 10 in Dasavarga
  tier: VaisheshikamsaTier | null;
  tierName: string;
  vargottama: boolean;
  pushkara: PushkaraInfo;
  dignifiedVargas: VargaType[];
  summary: string;
}

const GRAHA_OWN_SIGNS: Record<string, number[]> = {
  sun: [4], // Leo
  moon: [3], // Cancer
  mars: [0, 7], // Aries, Scorpio
  mercury: [2, 5], // Gemini, Virgo
  jupiter: [8, 11], // Sagittarius, Pisces
  venus: [1, 6], // Taurus, Libra
  saturn: [9, 10], // Capricorn, Aquarius
  rahu: [10, 2], // Aquarius, Gemini
  ketu: [7, 8], // Scorpio, Sagittarius
};

const GRAHA_EXALT_SIGNS: Record<string, number> = {
  sun: 0, // Aries
  moon: 1, // Taurus
  mars: 9, // Capricorn
  mercury: 5, // Virgo
  jupiter: 3, // Cancer
  venus: 11, // Pisces
  saturn: 6, // Libra
  rahu: 1, // Taurus
  ketu: 7, // Scorpio
};

const NAVAMSHA_LORDS = [
  'mars',    // Aries
  'venus',   // Taurus
  'mercury', // Gemini
  'moon',    // Cancer
  'sun',     // Leo
  'mercury', // Virgo
  'venus',   // Libra
  'mars',    // Scorpio
  'jupiter', // Sagittarius
  'saturn',  // Capricorn
  'saturn',  // Aquarius
  'jupiter', // Pisces
];

export const VAISHESHIKAMSA_TIER_DETAILS: Record<
  number,
  { tier: VaisheshikamsaTier; name: string; desc: string }
> = {
  2: {
    tier: 'parijata',
    name: 'Parijataamsa (2 Vargas)',
    desc: 'Respectable status, dependable foundation, and auspicious steady progress.',
  },
  3: {
    tier: 'uttama',
    name: 'Uttamaamsa (3 Vargas)',
    desc: 'Distinguished intellect, refined nature, high character, and civic influence.',
  },
  4: {
    tier: 'gopura',
    name: 'Gopuraamsa (4 Vargas)',
    desc: 'Eminent standing, land & property ownership, wealth, and community reverence.',
  },
  5: {
    tier: 'simhasana',
    name: 'Simhasanaamsa (5 Vargas)',
    desc: 'Royal authority, executive power, leadership command, and authoritative status.',
  },
  6: {
    tier: 'paravata',
    name: 'Paravataamsa (6 Vargas)',
    desc: 'Eminent leader or scholar, vast financial treasury, and state-level governance.',
  },
  7: {
    tier: 'devaloka',
    name: 'Devalokaamsa (7 Vargas)',
    desc: 'Nationwide renown, ministerial or monarchial stature, and profound saintly grace.',
  },
  8: {
    tier: 'brahmaloka',
    name: 'Brahmalokaamsa (8 Vargas)',
    desc: 'Supreme spiritual wisdom, historic brilliance, and immortal renown.',
  },
  9: {
    tier: 'airavata',
    name: 'Airavataamsa (9 Vargas)',
    desc: 'Global stature, epoch-making figure, and peerless ruler.',
  },
  10: {
    tier: 'sreedhama',
    name: 'Sreedhamaamsa (10 Vargas)',
    desc: 'Supreme incarnation-level grace, divine protection, and historic destiny.',
  },
};

/**
 * Evaluates whether a celestial longitude falls into a Pushkara Navamsha or Pushkara Bhaga.
 * Classical rules (Dr. K.S. Charak Ch. X, Jataka Parijata):
 * - 24 Pushkara Navamshas across the zodiac, all ruled by natural benefics (Moon, Mercury, Venus, Jupiter).
 * - Imparts regenerative healing (Amrita), resilience, and auspicious fruitfulness even to debilitated grahas.
 */
export function evaluatePushkara(lon: number): PushkaraInfo {
  const normLon = norm360(lon);
  const signIndex = Math.floor(normLon / 30);
  const degInSign = normLon - signIndex * 30;
  const navamshaIndex = Math.min(8, Math.floor(degInSign / (30 / 9)));
  const d9SignIndex = calculateVargaSign(normLon, 'D9');
  const d9Sign = SIGNS[d9SignIndex]!;
  const d9Lord = NAVAMSHA_LORDS[d9SignIndex]!;

  const triplicity = signIndex % 4; // 0 = Fire, 1 = Earth, 2 = Air, 3 = Water
  let isPushkaraNavamsha = false;

  if (triplicity === 0) {
    // Fire signs: 7th (navamshaIndex 6) and 9th (navamshaIndex 8)
    isPushkaraNavamsha = navamshaIndex === 6 || navamshaIndex === 8;
  } else if (triplicity === 1) {
    // Earth signs: 3rd (navamshaIndex 2) and 5th (navamshaIndex 4)
    isPushkaraNavamsha = navamshaIndex === 2 || navamshaIndex === 4;
  } else if (triplicity === 2) {
    // Air signs: 6th (navamshaIndex 5) and 8th (navamshaIndex 7)
    isPushkaraNavamsha = navamshaIndex === 5 || navamshaIndex === 7;
  } else if (triplicity === 3) {
    // Water signs: 1st (navamshaIndex 0) and 3rd (navamshaIndex 2)
    isPushkaraNavamsha = navamshaIndex === 0 || navamshaIndex === 2;
  }

  const pbDeg = PUSHKARA_BHAGA_DEGREES[signIndex]!;
  const isPushkaraBhaga = Math.abs(degInSign - pbDeg) <= 1.0;

  let description = 'Standard degree';
  if (isPushkaraBhaga && isPushkaraNavamsha) {
    description = `Supreme Pushkara Bhaga (${pbDeg}°) & Pushkara Navamsha in ${d9Sign} (Lord ${d9Lord}) — highest amrita/healing potency`;
  } else if (isPushkaraNavamsha) {
    description = `Pushkara Navamsha in ${d9Sign} (Lord ${d9Lord}) — exceptional resilience & regenerative benefic grace`;
  } else if (isPushkaraBhaga) {
    description = `Pushkara Bhaga degree (${pbDeg}°) — auspicious vital inflection point`;
  }

  return {
    isPushkaraNavamsha,
    isPushkaraBhaga,
    navamshaSign: d9Sign,
    navamshaSignIndex: d9SignIndex,
    navamshaLord: d9Lord,
    pushkaraBhagaDeg: pbDeg,
    degInSign,
    description,
  };
}

/**
 * Computes Vaisheshikamsa (Dasavarga Amsabala), Vargottama, and Pushkara status for a single graha.
 */
export function evaluateVaisheshikamsa(graha: string, lon: number): VaisheshikamsaResult {
  const gLower = graha.toLowerCase();
  const own = GRAHA_OWN_SIGNS[gLower] ?? [];
  const exalt = GRAHA_EXALT_SIGNS[gLower];

  const dignifiedVargas: VargaType[] = [];

  for (const v of DASAVARGA_TYPES) {
    const vSign = calculateVargaSign(lon, v);
    const isOwn = own.includes(vSign);
    const isExalt = exalt !== undefined && vSign === exalt;
    if (isOwn || isExalt) {
      dignifiedVargas.push(v);
    }
  }

  const count = dignifiedVargas.length;
  const tierInfo = VAISHESHIKAMSA_TIER_DETAILS[Math.min(10, Math.max(2, count))] ?? null;
  const tier = count >= 2 && tierInfo ? tierInfo.tier : null;
  const tierName = count >= 2 && tierInfo ? tierInfo.name : count === 1 ? '1 Varga Dignity' : 'Standard Dignity';

  const d1Sign = calculateVargaSign(lon, 'D1');
  const d9Sign = calculateVargaSign(lon, 'D9');
  const vargottama = d1Sign === d9Sign;

  const pushkara = evaluatePushkara(lon);

  const notes: string[] = [];
  if (vargottama) notes.push('Vargottama (same sign in D1 & D9)');
  if (tierInfo && count >= 2) notes.push(tierInfo.name);
  if (pushkara.isPushkaraNavamsha) notes.push('Pushkara Navamsha');
  if (pushkara.isPushkaraBhaga) notes.push(`Pushkara Bhaga (${pushkara.pushkaraBhagaDeg}°)`);

  const summary = notes.length > 0 ? notes.join(' • ') : 'Standard varga placement';

  return {
    graha,
    vargaCount: count,
    tier,
    tierName,
    vargottama,
    pushkara,
    dignifiedVargas,
    summary,
  };
}

/**
 * Computes Vaisheshikamsa, Vargottama, and Pushkara status for all planets in a NatalChart.
 */
export function computeChartVaisheshikamsa(chart: NatalChart): Record<string, VaisheshikamsaResult> {
  const results: Record<string, VaisheshikamsaResult> = {};

  for (const [key, graha] of Object.entries(chart.grahas)) {
    results[key] = evaluateVaisheshikamsa(key, graha.lon);
  }

  if (chart.lagna) {
    results.lagna = evaluateVaisheshikamsa('lagna', chart.lagna.lon);
  }

  return results;
}
