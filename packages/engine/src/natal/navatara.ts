import { NAKSHATRAS, type Nakshatra } from '../angles.js';
import type { VedicGraha } from './types.js';

/**
 * 9 Tara classification according to classical Parasari principles
 * (PVR Rao, Vedic Astrology: An Integrated Approach, Ch. 26.4.2; Charak Ch. XXIX).
 */
export const NAVATARA_KEYS = [
  'janma',
  'sampat',
  'vipat',
  'kshema',
  'pratyak',
  'sadhana',
  'naidhana',
  'mitra',
  'parama_mitra',
] as const;

export type TaraName = (typeof NAVATARA_KEYS)[number];

export interface TaraMeta {
  sanskrit: string;
  english: string;
  category: 'auspicious' | 'inauspicious' | 'mixed';
  meaning: string;
}

export const TARA_LABELS: Record<TaraName, TaraMeta> = {
  janma: {
    sanskrit: 'Janma',
    english: 'Birth / Vitality',
    category: 'mixed',
    meaning: 'Physical body, general health, life force, and identity. Demands self-care and mindful effort.',
  },
  sampat: {
    sanskrit: 'Sampat',
    english: 'Wealth & Prosperity',
    category: 'auspicious',
    meaning: 'Material gains, prosperity, financial fruition, and good fortune.',
  },
  vipat: {
    sanskrit: 'Vipat',
    english: 'Danger & Misfortune',
    category: 'inauspicious',
    meaning: 'Friction, setbacks, hazards, sudden accidents, or financial losses.',
  },
  kshema: {
    sanskrit: 'Kshema',
    english: 'Well-being & Security',
    category: 'auspicious',
    meaning: 'Safety, comfort, peace of mind, protection, and preservation of gains.',
  },
  pratyak: {
    sanskrit: 'Pratyak',
    english: 'Obstacles & Opposition',
    category: 'inauspicious',
    meaning: 'Adversaries, unexpected delays, conflicting energies, and hurdles in initiatives.',
  },
  sadhana: {
    sanskrit: 'Sadhana',
    english: 'Achievement & Fulfillment',
    category: 'auspicious',
    meaning: 'Success in pursuits, spiritual/professional practice, manifestation of efforts, and mastery.',
  },
  naidhana: {
    sanskrit: 'Naidhana / Vadha',
    english: 'Destruction & Crisis',
    category: 'inauspicious',
    meaning: 'Severe acute distress, collapse, mortality issues, and critical transitions. Highly inauspicious.',
  },
  mitra: {
    sanskrit: 'Mitra',
    english: 'Friendship & Support',
    category: 'auspicious',
    meaning: 'Beneficial allies, cordial cooperation, helpful contacts, and friendly progress.',
  },
  parama_mitra: {
    sanskrit: 'Parama Mitra',
    english: 'Supreme Ally & Great Favor',
    category: 'auspicious',
    meaning: 'Highest assistance, deep patronage, enduring victory, and ease in complex situations.',
  },
};

export type Paryaya = 'prathama' | 'dwitiya' | 'tritiya';

export interface NavataraResult {
  targetNakshatraIndex: number;
  targetNakshatra: Nakshatra;
  offset: number; // 1-27 counted from natal Moon nakshatra inclusive
  taraNumber: number; // 1-9
  tara: TaraName;
  taraLabel: string;
  englishLabel: string;
  category: 'auspicious' | 'inauspicious' | 'mixed';
  paryayaNumber: 1 | 2 | 3;
  paryaya: Paryaya;
  isFavorable: boolean;
  meaning: string;
}

/**
 * 11 Special Life-Department Nakshatras (PVR Rao Table 64 & Section 26.4.2).
 * Counted from Janma Nakshatra (Moon's natal star) as 1:
 * - 1st: Janma (Self, physical vitality)
 * - 4th: Jaati (Community, caste/circle, kinship)
 * - 7th: Naidhana (Death, crisis, vulnerability)
 * - 10th: Karma (Career, profession, workplace action)
 * - 12th: Desha (Territory, country of residence, foreign travel)
 * - 13th: Abhisheka / Rajya (Coronation, power, honors, executive status)
 * - 16th: Sanghatika (Alliances, coalitions, partnership bonds)
 * - 18th: Samudayika (Collective masses, crowd, public standing)
 * - 19th: Aadhana (Conception, family root, lineage foundation)
 * - 22nd: Vainashika / Vinasha (Ruin, disruptive downfall, sudden stress)
 * - 25th: Manasa (Mental state, emotional stability, psychology)
 */
export interface SpecialNakshatraDef {
  key: string;
  name: string;
  sanskritName: string;
  offset: number; // 1..27 inclusive
  domain: string;
  description: string;
  significance: 'vital' | 'auspicious' | 'inauspicious' | 'neutral';
}

export const SPECIAL_NAKSHATRA_DEFS: readonly SpecialNakshatraDef[] = [
  {
    key: 'janma',
    name: 'Janma Nakshatra',
    sanskritName: 'Janma',
    offset: 1,
    domain: 'Self & Vitality',
    description: 'Physical body, general health, life force, and core vitality.',
    significance: 'vital',
  },
  {
    key: 'jaati',
    name: 'Jaati Nakshatra',
    sanskritName: 'Jaati',
    offset: 4,
    domain: 'Community & Peers',
    description: 'Kinship, peer circle, social standing, and community relations.',
    significance: 'neutral',
  },
  {
    key: 'naidhana',
    name: 'Naidhana Nakshatra',
    sanskritName: 'Naidhana / Vadha',
    offset: 7,
    domain: 'Crisis & Vulnerability',
    description: 'Critical transitions, health hazards, acute stress, and severe vulnerabilities.',
    significance: 'inauspicious',
  },
  {
    key: 'karma',
    name: 'Karma Nakshatra',
    sanskritName: 'Karma',
    offset: 10,
    domain: 'Career & Action',
    description: 'Professional enterprise, executive execution, occupation, and public deeds.',
    significance: 'vital',
  },
  {
    key: 'desha',
    name: 'Desha Nakshatra',
    sanskritName: 'Desha',
    offset: 12,
    domain: 'Territory & Relocation',
    description: 'Country of residence, foreign travel, territory, and homeland alignment.',
    significance: 'neutral',
  },
  {
    key: 'abhisheka',
    name: 'Abhisheka / Rajya Nakshatra',
    sanskritName: 'Abhisheka',
    offset: 13,
    domain: 'Power & Coronation',
    description: 'Executive authority, promotions, authority, leadership status, and pinnacle honors.',
    significance: 'auspicious',
  },
  {
    key: 'sanghatika',
    name: 'Sanghatika Nakshatra',
    sanskritName: 'Sanghatika',
    offset: 16,
    domain: 'Alliances & Coalitions',
    description: 'Strategic partnerships, joint ventures, close associations, and group covenants.',
    significance: 'neutral',
  },
  {
    key: 'samudayika',
    name: 'Samudayika Nakshatra',
    sanskritName: 'Samudayika',
    offset: 18,
    domain: 'Collective Public Sphere',
    description: 'Crowd resonance, public reputation, mass interaction, and collective affairs.',
    significance: 'neutral',
  },
  {
    key: 'aadhana',
    name: 'Aadhana Nakshatra',
    sanskritName: 'Aadhana',
    offset: 19,
    domain: 'Family Root & Conception',
    description: 'Origin seed, foundational stability, family well-being, and ancestry root.',
    significance: 'vital',
  },
  {
    key: 'vainashika',
    name: 'Vainashika Nakshatra',
    sanskritName: 'Vainashika / Vinasha',
    offset: 22,
    domain: 'Ruin & Breakdown',
    description: 'Stress triggers, sudden setbacks, disruptive downfall, and severe friction.',
    significance: 'inauspicious',
  },
  {
    key: 'manasa',
    name: 'Manasa Nakshatra',
    sanskritName: 'Manasa',
    offset: 25,
    domain: 'Mind & Mental Composure',
    description: 'Inner psychological tranquility, mental peace, mood balance, and anxieties.',
    significance: 'vital',
  },
];

export interface SpecialNakshatraResult {
  def: SpecialNakshatraDef;
  nakshatraIndex: number;
  nakshatra: Nakshatra;
  navatara: NavataraResult;
  occupyingGrahas: string[]; // Planets situated in this star (natal or transit)
}

/**
 * Latta (Planetary Kick - PVR Rao Ch. 26.7).
 * Purolatta (Forward from transiting planet's Nakshatra, inclusive):
 * - Sun: 12th
 * - Mars: 3rd
 * - Jupiter: 6th
 * - Saturn: 8th
 *
 * Prishtha Latta (Backward from transiting planet's Nakshatra, inclusive):
 * - Moon: 22nd
 * - Mercury: 7th
 * - Venus: 5th
 * - Rahu: 9th
 */
export const LATTA_FORWARD_STEPS: Partial<Record<VedicGraha, number>> = {
  sun: 12,
  mars: 3,
  jupiter: 6,
  saturn: 8,
};

export const LATTA_BACKWARD_STEPS: Partial<Record<VedicGraha, number>> = {
  moon: 22,
  mercury: 7,
  venus: 5,
  rahu: 9,
};

export interface LattaHit {
  graha: VedicGraha;
  sourceNakshatraIndex: number;
  sourceNakshatra: Nakshatra;
  kickedNakshatraIndex: number;
  kickedNakshatra: Nakshatra;
  direction: 'purolatta' | 'prishtha_latta';
  stepCount: number;
  targetsJanmaNakshatra: boolean;
  targetsLagnaNakshatra: boolean;
}

/**
 * Evaluates the 9-Tara relationship between natal Moon's Nakshatra and any target Nakshatra.
 */
export const evaluateNavatara = (
  natalMoonNakshatraIndex: number,
  targetNakshatraIndex: number,
): NavataraResult => {
  const normNatal = ((natalMoonNakshatraIndex % 27) + 27) % 27;
  const normTarget = ((targetNakshatraIndex % 27) + 27) % 27;

  const offset = ((normTarget - normNatal + 27) % 27) + 1; // 1..27 inclusive
  const taraNumber = ((offset - 1) % 9) + 1; // 1..9
  const tara = NAVATARA_KEYS[taraNumber - 1]!;
  const meta = TARA_LABELS[tara];

  const paryayaNumber = (Math.floor((offset - 1) / 9) + 1) as 1 | 2 | 3;
  const paryaya: Paryaya =
    paryayaNumber === 1 ? 'prathama' : paryayaNumber === 2 ? 'dwitiya' : 'tritiya';

  const isFavorable = meta.category === 'auspicious';

  return {
    targetNakshatraIndex: normTarget,
    targetNakshatra: NAKSHATRAS[normTarget]!,
    offset,
    taraNumber,
    tara,
    taraLabel: meta.sanskrit,
    englishLabel: meta.english,
    category: meta.category,
    paryayaNumber,
    paryaya,
    isFavorable,
    meaning: meta.meaning,
  };
};

/**
 * Generates the full 27-Nakshatra Navatara table for a natal Moon star.
 */
export const computeFullNavataraTable = (
  natalMoonNakshatraIndex: number,
): NavataraResult[] => {
  const results: NavataraResult[] = [];
  for (let i = 0; i < 27; i++) {
    results.push(evaluateNavatara(natalMoonNakshatraIndex, i));
  }
  return results;
};

/**
 * Computes the 11 Special Life-Department Nakshatras for a given natal Moon Nakshatra,
 * optionally checking which planets occupy them.
 */
export const computeSpecialNakshatras = (
  natalMoonNakshatraIndex: number,
  occupants?: Array<{ graha: string; nakshatraIndex: number }>,
): SpecialNakshatraResult[] => {
  const normNatal = ((natalMoonNakshatraIndex % 27) + 27) % 27;

  return SPECIAL_NAKSHATRA_DEFS.map((def) => {
    const nakshatraIndex = (normNatal + def.offset - 1) % 27;
    const nakshatra = NAKSHATRAS[nakshatraIndex]!;
    const navatara = evaluateNavatara(normNatal, nakshatraIndex);

    const occupyingGrahas = occupants
      ? occupants
          .filter((o) => ((o.nakshatraIndex % 27) + 27) % 27 === nakshatraIndex)
          .map((o) => o.graha)
      : [];

    return {
      def,
      nakshatraIndex,
      nakshatra,
      navatara,
      occupyingGrahas,
    };
  });
};

/**
 * Evaluates whether a transiting planet casts Latta (Planetary Kick) onto
 * Janma Nakshatra or Lagna Nakshatra.
 */
export const evaluateLattaForGraha = (
  graha: VedicGraha,
  transitNakshatraIndex: number,
  natalMoonNakshatraIndex: number,
  natalLagnaNakshatraIndex?: number,
): LattaHit | null => {
  const normTransit = ((transitNakshatraIndex % 27) + 27) % 27;
  const normMoon = ((natalMoonNakshatraIndex % 27) + 27) % 27;
  const normLagna =
    natalLagnaNakshatraIndex !== undefined
      ? ((natalLagnaNakshatraIndex % 27) + 27) % 27
      : undefined;

  let kickedIndex: number | null = null;
  let direction: 'purolatta' | 'prishtha_latta' = 'purolatta';
  let stepCount = 0;

  if (LATTA_FORWARD_STEPS[graha] !== undefined) {
    stepCount = LATTA_FORWARD_STEPS[graha]!;
    direction = 'purolatta';
    // Forward count inclusive: target = (source + stepCount - 1) % 27
    kickedIndex = (normTransit + stepCount - 1) % 27;
  } else if (LATTA_BACKWARD_STEPS[graha] !== undefined) {
    stepCount = LATTA_BACKWARD_STEPS[graha]!;
    direction = 'prishtha_latta';
    // Backward count inclusive: target = (source - (stepCount - 1) + 54) % 27
    kickedIndex = ((normTransit - (stepCount - 1)) % 27 + 27) % 27;
  } else {
    return null;
  }

  const targetsJanmaNakshatra = kickedIndex === normMoon;
  const targetsLagnaNakshatra = normLagna !== undefined && kickedIndex === normLagna;

  return {
    graha,
    sourceNakshatraIndex: normTransit,
    sourceNakshatra: NAKSHATRAS[normTransit]!,
    kickedNakshatraIndex: kickedIndex,
    kickedNakshatra: NAKSHATRAS[kickedIndex]!,
    direction,
    stepCount,
    targetsJanmaNakshatra,
    targetsLagnaNakshatra,
  };
};

export interface TransitNavataraEvaluation {
  natalMoonNakshatraIndex: number;
  natalMoonNakshatra: Nakshatra;
  natalLagnaNakshatraIndex?: number;
  natalLagnaNakshatra?: Nakshatra;
  transitPlanets: Array<{
    graha: VedicGraha;
    nakshatraIndex: number;
    nakshatra: Nakshatra;
    navatara: NavataraResult;
    specialNakshatraMatch?: SpecialNakshatraDef;
    lattaHit?: LattaHit;
  }>;
  lattaAfflictions: LattaHit[];
  specialNakshatraTriggers: Array<{
    graha: VedicGraha;
    specialNakshatra: SpecialNakshatraDef;
    nakshatra: Nakshatra;
  }>;
}

/**
 * Evaluates real-time transits against the native's 9 Taras, 11 Special Nakshatras, and Latta kicks.
 */
export const evaluateTransitNavatara = (params: {
  natalMoonNakshatraIndex: number;
  natalLagnaNakshatraIndex?: number;
  transitGrahas: Partial<Record<VedicGraha, { nakshatraIndex: number }>>;
}): TransitNavataraEvaluation => {
  const { natalMoonNakshatraIndex, natalLagnaNakshatraIndex, transitGrahas } = params;

  const normMoon = ((natalMoonNakshatraIndex % 27) + 27) % 27;
  const normLagna =
    natalLagnaNakshatraIndex !== undefined
      ? ((natalLagnaNakshatraIndex % 27) + 27) % 27
      : undefined;

  const specialDefsByOffset = new Map<number, SpecialNakshatraDef>();
  for (const def of SPECIAL_NAKSHATRA_DEFS) {
    specialDefsByOffset.set(def.offset, def);
  }

  const transitPlanets: TransitNavataraEvaluation['transitPlanets'] = [];
  const lattaAfflictions: LattaHit[] = [];
  const specialNakshatraTriggers: TransitNavataraEvaluation['specialNakshatraTriggers'] = [];

  for (const [grahaKey, detail] of Object.entries(transitGrahas) as [
    VedicGraha,
    { nakshatraIndex: number },
  ][]) {
    if (!detail) continue;
    const nakIndex = ((detail.nakshatraIndex % 27) + 27) % 27;
    const navatara = evaluateNavatara(normMoon, nakIndex);

    // Check special star match
    const specialMatch = specialDefsByOffset.get(navatara.offset);
    if (specialMatch) {
      specialNakshatraTriggers.push({
        graha: grahaKey,
        specialNakshatra: specialMatch,
        nakshatra: NAKSHATRAS[nakIndex]!,
      });
    }

    // Check Latta kick
    const latta = evaluateLattaForGraha(grahaKey, nakIndex, normMoon, normLagna);
    if (latta && (latta.targetsJanmaNakshatra || latta.targetsLagnaNakshatra)) {
      lattaAfflictions.push(latta);
    }

    transitPlanets.push({
      graha: grahaKey,
      nakshatraIndex: nakIndex,
      nakshatra: NAKSHATRAS[nakIndex]!,
      navatara,
      specialNakshatraMatch: specialMatch,
      lattaHit: latta ?? undefined,
    });
  }

  return {
    natalMoonNakshatraIndex: normMoon,
    natalMoonNakshatra: NAKSHATRAS[normMoon]!,
    natalLagnaNakshatraIndex: normLagna,
    natalLagnaNakshatra: normLagna !== undefined ? NAKSHATRAS[normLagna]! : undefined,
    transitPlanets,
    lattaAfflictions,
    specialNakshatraTriggers,
  };
};
