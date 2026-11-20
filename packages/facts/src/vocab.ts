import type { VedicGraha } from '@astro/engine';

export const PLANET_IDS = [
  'sun',
  'moon',
  'mars',
  'mercury',
  'jupiter',
  'venus',
  'saturn',
  'rahu',
  'ketu',
] as const;

export type PlanetId = (typeof PLANET_IDS)[number];

export const SIGN_IDS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
] as const;

export type SignId = (typeof SIGN_IDS)[number];

export const HOUSE_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export type HouseNumber = (typeof HOUSE_IDS)[number];

export const NAKSHATRA_IDS = [
  'ashwini',
  'bharani',
  'krittika',
  'rohini',
  'mrigashira',
  'ardra',
  'punarvasu',
  'pushya',
  'ashlesha',
  'magha',
  'purva_phalguni',
  'uttara_phalguni',
  'hasta',
  'chitra',
  'swati',
  'vishakha',
  'anuradha',
  'jyeshtha',
  'mula',
  'purva_ashadha',
  'uttara_ashadha',
  'shravana',
  'dhanishta',
  'shatabhisha',
  'purva_bhadrapada',
  'uttara_bhadrapada',
  'revati',
] as const;

export type NakshatraId = (typeof NAKSHATRA_IDS)[number];

export const THEME_IDS = [
  'self',
  'money_speech',
  'courage_siblings',
  'home_mother',
  'education_children',
  'health_routine',
  'partnership',
  'transformation_secrets',
  'luck_dharma',
  'career_status',
  'gains_network',
  'losses_retreat',
  'mind_emotion',
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const HOUSE_DEFAULT_THEMES: Record<HouseNumber, readonly ThemeId[]> = {
  1: ['self'],
  2: ['money_speech'],
  3: ['courage_siblings'],
  4: ['home_mother', 'mind_emotion'],
  5: ['education_children'],
  6: ['health_routine'],
  7: ['partnership'],
  8: ['transformation_secrets'],
  9: ['luck_dharma'],
  10: ['career_status'],
  11: ['gains_network'],
  12: ['losses_retreat'],
};

export const PLANET_KARAKATWAS: Record<PlanetId, readonly string[]> = {
  sun: ['authority', 'father', 'vitality', 'soul', 'leadership'],
  moon: ['mind', 'mother', 'emotion', 'fluidity', 'nourishment'],
  mars: ['courage', 'energy', 'siblings', 'property', 'action'],
  mercury: ['intellect', 'speech', 'commerce', 'learning', 'analysis'],
  jupiter: ['wisdom', 'dharma', 'children', 'expansion', 'teachers'],
  venus: ['relationships', 'comfort', 'arts', 'harmony', 'luxury'],
  saturn: ['discipline', 'longevity', 'service', 'karma', 'endurance'],
  rahu: ['ambition', 'unconventional', 'foreign', 'innovation', 'desire'],
  ketu: ['detachment', 'spirituality', 'intuition', 'liberation', 'past_karma'],
};

/** Sign index (0..11) -> Ruling PlanetId */
export const SIGN_LORDS: readonly PlanetId[] = [
  'mars',     // 0: Aries
  'venus',    // 1: Taurus
  'mercury',  // 2: Gemini
  'moon',     // 3: Cancer
  'sun',      // 4: Leo
  'mercury',  // 5: Virgo
  'venus',    // 6: Libra
  'mars',     // 7: Scorpio
  'jupiter',  // 8: Sagittarius
  'saturn',   // 9: Capricorn
  'saturn',   // 10: Aquarius
  'jupiter',  // 11: Pisces
];

export const NATURAL_BENEFICS: readonly PlanetId[] = ['jupiter', 'venus', 'mercury', 'moon'];
export const NATURAL_MALEFICS: readonly PlanetId[] = ['saturn', 'mars', 'sun', 'rahu', 'ketu'];

export type DignityState =
  | 'exalted'
  | 'mooltrikona'
  | 'own'
  | 'friendly'
  | 'neutral'
  | 'enemy'
  | 'debilitated';

/** Exaltation sign index (0..11) */
export const EXALTATION_SIGNS: Record<PlanetId, number> = {
  sun: 0,      // Aries
  moon: 1,     // Taurus
  mars: 9,     // Capricorn
  mercury: 5,  // Virgo
  jupiter: 3,  // Cancer
  venus: 11,   // Pisces
  saturn: 6,   // Libra
  rahu: 1,     // Taurus (Parashari common)
  ketu: 7,     // Scorpio
};

/** Debilitation sign index (0..11) */
export const DEBILITATION_SIGNS: Record<PlanetId, number> = {
  sun: 6,      // Libra
  moon: 7,     // Scorpio
  mars: 3,     // Cancer
  mercury: 11, // Pisces
  jupiter: 9,  // Capricorn
  venus: 5,    // Virgo
  saturn: 0,   // Aries
  rahu: 7,     // Scorpio
  ketu: 1,     // Taurus
};

/** Own signs (0..11) */
export const OWN_SIGNS: Record<PlanetId, readonly number[]> = {
  sun: [4],
  moon: [3],
  mars: [0, 7],
  mercury: [2, 5],
  jupiter: [8, 11],
  venus: [1, 6],
  saturn: [9, 10],
  rahu: [10], // Aquarius (co-lord)
  ketu: [7],  // Scorpio (co-lord)
};

/** Mooltrikona sign & degree range [minDeg, maxDeg) */
export const MOOLTRIKONA: Partial<Record<PlanetId, { signIndex: number; minDeg: number; maxDeg: number }>> = {
  sun: { signIndex: 4, minDeg: 0, maxDeg: 20 },
  moon: { signIndex: 1, minDeg: 3, maxDeg: 30 },
  mars: { signIndex: 0, minDeg: 0, maxDeg: 12 },
  mercury: { signIndex: 5, minDeg: 15, maxDeg: 20 },
  jupiter: { signIndex: 8, minDeg: 0, maxDeg: 10 },
  venus: { signIndex: 6, minDeg: 0, maxDeg: 15 },
  saturn: { signIndex: 10, minDeg: 0, maxDeg: 20 },
};

/** Standard Parashari combustion orbs (degrees from Sun; retrograde slightly tighter for Mercury/Venus) */
export const COMBUSTION_ORBS: Partial<Record<PlanetId, { direct: number; retrograde?: number }>> = {
  moon: { direct: 12 },
  mars: { direct: 17 },
  mercury: { direct: 14, retrograde: 12 },
  jupiter: { direct: 11 },
  venus: { direct: 10, retrograde: 8 },
  saturn: { direct: 15 },
};

/** Nakshatra index (0..26) -> Vimshottari / Nakshatra Lord */
export const NAKSHATRA_LORDS: readonly PlanetId[] = [
  'ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury',
  'ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury',
  'ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury',
];

/** Natural friendship table for the 7 classical grahas */
export const NATURAL_FRIENDS: Record<VedicGraha, { friends: PlanetId[]; enemies: PlanetId[] }> = {
  sun: { friends: ['moon', 'mars', 'jupiter'], enemies: ['venus', 'saturn'] },
  moon: { friends: ['sun', 'mercury'], enemies: [] },
  mars: { friends: ['sun', 'moon', 'jupiter'], enemies: ['mercury'] },
  mercury: { friends: ['sun', 'venus'], enemies: ['moon'] },
  jupiter: { friends: ['sun', 'moon', 'mars'], enemies: ['mercury', 'venus'] },
  venus: { friends: ['mercury', 'saturn'], enemies: ['sun', 'moon'] },
  saturn: { friends: ['mercury', 'venus'], enemies: ['sun', 'moon', 'mars'] },
  rahu: { friends: ['venus', 'saturn', 'mercury'], enemies: ['sun', 'moon', 'mars'] },
  ketu: { friends: ['mars', 'venus', 'saturn'], enemies: ['sun', 'moon'] },
};

export function normalizeNakshatraId(name: string): NakshatraId {
  const slug = name.toLowerCase().replace(/[\s-]+/g, '_');
  if ((NAKSHATRA_IDS as readonly string[]).includes(slug)) {
    return slug as NakshatraId;
  }
  // Common spelling variants
  if (slug === 'mrighasira' || slug === 'mrigasira') return 'mrigashira';
  if (slug === 'purvaphalguni') return 'purva_phalguni';
  if (slug === 'uttaraphalguni') return 'uttara_phalguni';
  if (slug === 'purvashadha') return 'purva_ashadha';
  if (slug === 'uttarashadha') return 'uttara_ashadha';
  if (slug === 'purvabhadrapada') return 'purva_bhadrapada';
  if (slug === 'uttarabhadrapada') return 'uttara_bhadrapada';
  return 'ashwini';
}
