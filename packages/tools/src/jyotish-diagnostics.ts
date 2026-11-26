import {
  NATURAL_BENEFICS,
  NATURAL_MALEFICS,
  PLANET_IDS,
  SIGN_IDS,
  SIGN_LORDS,
  type ChartWorkspace,
  type PlanetId,
} from '@astro/facts';
import type { NatalChart, SpecialLagnaPosition } from '@astro/engine';

export type FunctionalRole = 'yogakaraka' | 'functional_benefic' | 'functional_neutral' | 'functional_malefic';

export interface PlanetFunctionalProfile {
  planet: PlanetId;
  role: FunctionalRole;
  isMaraka: boolean;
  isBadhaka: boolean;
  ownedHouses: number[];
}

export interface BadhakaInfo {
  modality: 'movable' | 'fixed' | 'dual';
  badhakaHouse: number;
  badhakaSignIndex: number;
  badhakaSign: string;
  badhakaLord: PlanetId;
  coLord?: PlanetId;
}

export interface ParivartanaExchange {
  planetA: PlanetId;
  planetB: PlanetId;
  houseA: number;
  houseB: number;
  category: 'maha' | 'dainya' | 'khala';
  meaning: string;
}

export interface YogadaEntry {
  planet: PlanetId;
  links: Array<'HL' | 'GL'>;
  kind: 'wealth_yogada' | 'power_yogada' | 'maha_yogada';
  reason: string;
}

export interface DashaAxisRelation {
  distanceFromMd: number; // 1..12
  distanceFromAd: number; // 1..12
  axisLabel: string;
  category: 'conjunction' | 'trine' | 'quadrant' | 'upachaya' | 'shadashtaka' | 'dwirdwadasa';
  harmony: 'harmonious' | 'dynamic' | 'challenging';
  summary: string;
}

export interface SignArgalaIntervention {
  relativePosition: '2nd' | '4th' | '11th' | '5th' | '3rd_special';
  argalaSign: string;
  argalaHouseFromLagna: number;
  planets: PlanetId[];
  nature: 'subha' | 'paapa' | 'mixed';
  obstructingSign: string;
  obstructingPlanets: PlanetId[];
  isObstructed: boolean;
  meaning: string;
}

export interface SignArgalaReport {
  targetLabel: string;
  targetSign: string;
  targetSignIndex: number;
  ketuReversed: boolean;
  interventions: SignArgalaIntervention[];
  rasiDrishtiSigns: string[];
  rasiDrishtiPlanets: Array<{ planet: PlanetId; sign: string }>;
}

export interface VargaCuspSensitivity {
  isRoundedBirthTime: boolean;
  birthTimeLabel: string;
  lagnaDegInSign: number;
  borderlineVargas: Array<{
    varga: 'D9' | 'D10' | 'D24';
    distanceToCuspDeg: number;
    approxMinutesToFlip: number;
  }>;
  advisory: string;
}

export interface SafeRemedyRecommendation {
  gemstoneCandidates: Array<{
    planet: PlanetId;
    role: FunctionalRole;
    gemstone: string;
    metal: string;
    finger: string;
    reason: string;
  }>;
  excludedGemstonePlanets: Array<{
    planet: PlanetId;
    reason: string;
  }>;
  fastingGuidance: {
    marriage?: { pada: 'UL'; sign: string; lord: PlanetId; weekday: string };
    career?: { pada: 'A10'; sign: string; lord: PlanetId; weekday: string };
  };
  ishtaDevata?: {
    akPlanet: string;
    karakamsaSign: string;
    twelfthFromAkSign: string;
    guidingPlanet: PlanetId;
    deities: string;
  };
  charityActions: Array<{
    planet: PlanetId;
    weekday: string;
    action: string;
    deities: string;
  }>;
}

// PVR Narasimha Rao Table 30: Functional Nature per Lagna (0=Aries .. 11=Pisces)
interface LagnaTableEntry {
  yogakaraka: PlanetId[];
  benefic: PlanetId[];
  neutral: PlanetId[];
  malefic: PlanetId[];
}

const FUNCTIONAL_ROLE_TABLE: Record<number, LagnaTableEntry> = {
  0: { yogakaraka: [], benefic: ['sun', 'mars', 'jupiter'], neutral: [], malefic: ['mercury', 'venus', 'saturn'] }, // Aries
  1: { yogakaraka: ['saturn'], benefic: ['sun', 'mercury', 'saturn'], neutral: ['mars'], malefic: ['moon', 'jupiter', 'venus'] }, // Taurus
  2: { yogakaraka: [], benefic: ['venus'], neutral: ['moon', 'mercury', 'saturn'], malefic: ['sun', 'mars', 'jupiter'] }, // Gemini
  3: { yogakaraka: ['mars'], benefic: ['moon', 'mars', 'jupiter'], neutral: ['sun', 'saturn'], malefic: ['mercury', 'venus'] }, // Cancer
  4: { yogakaraka: ['mars'], benefic: ['sun', 'mars', 'jupiter'], neutral: ['moon'], malefic: ['mercury', 'venus', 'saturn'] }, // Leo
  5: { yogakaraka: [], benefic: ['mercury', 'venus'], neutral: ['sun', 'saturn'], malefic: ['moon', 'mars', 'jupiter'] }, // Virgo
  6: { yogakaraka: ['saturn'], benefic: ['mercury', 'venus', 'saturn'], neutral: [], malefic: ['sun', 'mars', 'jupiter'] }, // Libra
  7: { yogakaraka: [], benefic: ['moon', 'jupiter'], neutral: ['sun', 'mars'], malefic: ['mercury', 'venus', 'saturn'] }, // Scorpio
  8: { yogakaraka: [], benefic: ['sun', 'mars'], neutral: ['moon', 'mercury', 'jupiter'], malefic: ['venus', 'saturn'] }, // Sagittarius
  9: { yogakaraka: ['venus'], benefic: ['venus', 'mercury', 'saturn'], neutral: ['sun'], malefic: ['mars', 'jupiter'] }, // Capricorn
  10: { yogakaraka: ['venus'], benefic: ['venus', 'saturn'], neutral: ['sun', 'mercury'], malefic: ['moon', 'mars', 'jupiter'] }, // Aquarius
  11: { yogakaraka: [], benefic: ['moon', 'mars'], neutral: ['jupiter'], malefic: ['sun', 'mercury', 'venus', 'saturn'] }, // Pisces
};

const MOVABLE_SIGNS = new Set([0, 3, 6, 9]);
const FIXED_SIGNS = new Set([1, 4, 7, 10]);

export const PLANET_REMEDY_TABLE: Record<
  PlanetId,
  {
    gemstone: string;
    metal: string;
    finger: string;
    weekday: string;
    deities: string;
    charityAction: string;
  }
> = {
  sun: {
    gemstone: 'Ruby',
    metal: 'Gold',
    finger: 'Ring finger',
    weekday: 'Sunday',
    deities: 'Shiva, Rama, Surya',
    charityAction: 'Offer gratitude at sunrise, practice disciplined leadership, or donate wheat/support community temples',
  },
  moon: {
    gemstone: 'Natural White Pearl',
    metal: 'Silver or Gold',
    finger: 'Little or Ring finger',
    weekday: 'Monday',
    deities: 'Gauri, Lalita, Saraswati, Krishna',
    charityAction: 'Support music/arts, nurture emotional calm, or donate rice/milk to those in need',
  },
  mars: {
    gemstone: 'Red Coral',
    metal: 'Copper or Gold',
    finger: 'Ring finger',
    weekday: 'Tuesday',
    deities: 'Hanuman, Kartikeya (Subrahmanya), Narasimha',
    charityAction: 'Channel drive through physical exercise/athletics or donate red lentils (toor/masoor daal)',
  },
  mercury: {
    gemstone: 'Emerald',
    metal: 'Silver or Gold',
    finger: 'Little finger',
    weekday: 'Wednesday',
    deities: 'Vishnu, Narayana',
    charityAction: 'Support students/educators, practice mindful speech, or donate green moong daal/books',
  },
  jupiter: {
    gemstone: 'Yellow Sapphire',
    metal: 'Gold',
    finger: 'Index finger',
    weekday: 'Thursday',
    deities: 'Vishnu, Hayagreeva, Dattatreya, Dakshinamurti',
    charityAction: 'Respect mentors/teachers, share wisdom generously, or donate chickpeas/educational supplies',
  },
  venus: {
    gemstone: 'Diamond or White Sapphire',
    metal: 'Silver or Platinum',
    finger: 'Little or Middle finger',
    weekday: 'Friday',
    deities: 'Lakshmi, Parvati',
    charityAction: 'Cultivate harmony and appreciation for artists/crafts, or donate white grains/sweets',
  },
  saturn: {
    gemstone: 'Blue Sapphire',
    metal: 'Silver or Iron',
    finger: 'Middle finger',
    weekday: 'Saturday',
    deities: 'Vishnu, Hanuman, Brahma',
    charityAction: 'Serve workers/elders with patience and humility, or donate black sesame seeds/blankets',
  },
  rahu: {
    gemstone: 'Hessonite (Gomedh)',
    metal: 'Silver',
    finger: 'Middle finger',
    weekday: 'Saturday',
    deities: 'Durga, Narasimha',
    charityAction: 'Practice grounded routines, support research/outreach, or donate black gram (urad daal)',
  },
  ketu: {
    gemstone: "Cat's Eye",
    metal: 'Silver',
    finger: 'Little or Ring finger',
    weekday: 'Tuesday',
    deities: 'Ganesha',
    charityAction: 'Practice quiet meditation/breathwork, simplify attachments, or support animal shelters',
  },
};

export function getBadhakaInfo(signIndex: number): BadhakaInfo {
  const s = ((signIndex % 12) + 12) % 12;
  const modality: BadhakaInfo['modality'] = MOVABLE_SIGNS.has(s)
    ? 'movable'
    : FIXED_SIGNS.has(s)
    ? 'fixed'
    : 'dual';
  const badhakaHouse = modality === 'movable' ? 11 : modality === 'fixed' ? 9 : 7;
  const badhakaSignIndex = (s + badhakaHouse - 1) % 12;
  const badhakaLord = SIGN_LORDS[badhakaSignIndex]!;
  const coLord: PlanetId | undefined =
    badhakaSignIndex === 7 ? 'ketu' : badhakaSignIndex === 10 ? 'rahu' : undefined;

  return {
    modality,
    badhakaHouse,
    badhakaSignIndex,
    badhakaSign: SIGN_IDS[badhakaSignIndex]!,
    badhakaLord,
    ...(coLord ? { coLord } : {}),
  };
}

export function getFunctionalRolesForLagna(
  lagnaSignIndex: number,
  isWaxingMoon: boolean = true,
): PlanetFunctionalProfile[] {
  const s = ((lagnaSignIndex % 12) + 12) % 12;
  const entry = FUNCTIONAL_ROLE_TABLE[s]!;
  const badhaka = getBadhakaInfo(s);
  const lord2 = SIGN_LORDS[(s + 1) % 12]!;
  const lord7 = SIGN_LORDS[(s + 6) % 12]!;

  const ownedMap = new Map<PlanetId, number[]>();
  for (const p of PLANET_IDS) ownedMap.set(p, []);
  for (let h = 1; h <= 12; h++) {
    const signIdx = (s + h - 1) % 12;
    const lord = SIGN_LORDS[signIdx]!;
    ownedMap.get(lord)!.push(h);
    // Co-lordship metadata per PVR R-01/R-07
    if (signIdx === 7) ownedMap.get('ketu')!.push(h);
    if (signIdx === 10) ownedMap.get('rahu')!.push(h);
  }

  return PLANET_IDS.map((planet) => {
    let role: FunctionalRole = 'functional_neutral';
    if (planet === 'moon' && (s === 0 || s === 6 || s === 9)) {
      // PVR Table 30 footnote: Movable Lagnas (Ar, Li, Cp) — Moon owns a Kendra
      role = isWaxingMoon ? 'functional_malefic' : 'functional_neutral';
    } else if (entry.yogakaraka.includes(planet)) {
      role = 'yogakaraka';
    } else if (entry.benefic.includes(planet)) {
      role = 'functional_benefic';
    } else if (entry.malefic.includes(planet)) {
      role = 'functional_malefic';
    } else if (entry.neutral.includes(planet)) {
      role = 'functional_neutral';
    } else {
      // Rahu & Ketu behave like their dispositor/co-lordship context; mark neutral by default
      role = 'functional_neutral';
    }

    const isMaraka = planet === lord2 || planet === lord7;
    const isBadhaka = planet === badhaka.badhakaLord || planet === badhaka.coLord;

    return {
      planet,
      role,
      isMaraka,
      isBadhaka,
      ownedHouses: ownedMap.get(planet) ?? [],
    };
  });
}

/**
 * Exact Jaimini Rasi Drishti (PVR Fig. 2 / R-07):
 * - Movable aspects all non-adjacent Fixed signs.
 * - Fixed aspects all non-adjacent Movable signs.
 * - Dual aspects all other Dual signs.
 */
export function getRasiDrishtiSigns(signIndex: number): number[] {
  const s = ((signIndex % 12) + 12) % 12;
  if (MOVABLE_SIGNS.has(s)) {
    const adjacentFixed = (s + 1) % 12;
    return [1, 4, 7, 10].filter((idx) => idx !== adjacentFixed);
  }
  if (FIXED_SIGNS.has(s)) {
    const adjacentMovable = (s + 11) % 12;
    return [0, 3, 6, 9].filter((idx) => idx !== adjacentMovable);
  }
  // Dual sign: Ge(2), Vi(5), Sg(8), Pi(11)
  return [2, 5, 8, 11].filter((idx) => idx !== s);
}

/**
 * Parashari Graha Drishti houses from a planet's occupied house (1..12).
 * Includes house 1 (occupation) plus 7th for all, plus special aspects for Mars (4,8), Jupiter (5,9), Saturn (3,10).
 */
export function getGrahaDrishtiHouses(planet: string, occupiedHouse: number): number[] {
  const p = planet.toLowerCase();
  const offsets = [1, 7];
  if (p === 'mars') offsets.push(4, 8);
  else if (p === 'jupiter') offsets.push(5, 9);
  else if (p === 'saturn') offsets.push(3, 10);
  else if (p === 'rahu' || p === 'ketu') offsets.push(5, 9);

  return Array.from(new Set(offsets.map((off) => ((occupiedHouse - 1 + off - 1) % 12) + 1)));
}

/**
 * Computes the angular resonance (Sambandha) between a Mahadasha lord and Antardasa lord
 * based on their natal houses (1..12).
 */
export function analyzeDashaAngularRelation(mdHouse: number, adHouse: number): DashaAxisRelation {
  const distFromMd = ((adHouse - mdHouse + 12) % 12) + 1;
  const distFromAd = ((mdHouse - adHouse + 12) % 12) + 1;
  const pair = [Math.min(distFromMd, distFromAd), Math.max(distFromMd, distFromAd)];
  const axisLabel = `${pair[0]}/${pair[1]}`;

  if (distFromMd === 1) {
    return {
      distanceFromMd: 1,
      distanceFromAd: 1,
      axisLabel: '1/1',
      category: 'conjunction',
      harmony: 'dynamic',
      summary: 'Co-present (1/1): tightly fused agendas; intense activation of shared house themes',
    };
  }
  if (distFromMd === 5 || distFromMd === 9) {
    return {
      distanceFromMd: distFromMd,
      distanceFromAd: distFromAd,
      axisLabel: '5/9',
      category: 'trine',
      harmony: 'harmonious',
      summary: 'Trinal harmony (5/9): natural alignment, supportive flow, and smooth execution',
    };
  }
  if (distFromMd === 4 || distFromMd === 7 || distFromMd === 10) {
    return {
      distanceFromMd: distFromMd,
      distanceFromAd: distFromAd,
      axisLabel,
      category: 'quadrant',
      harmony: 'dynamic',
      summary: `Quadrant axis (${axisLabel}): active engagement, tangible milestones, and constructive momentum`,
    };
  }
  if (distFromMd === 3 || distFromMd === 11) {
    return {
      distanceFromMd: distFromMd,
      distanceFromAd: distFromAd,
      axisLabel: '3/11',
      category: 'upachaya',
      harmony: 'harmonious',
      summary: 'Upachaya growth axis (3/11): effort pays off through initiative, allies, and gradual gains',
    };
  }
  if (distFromMd === 6 || distFromMd === 8) {
    return {
      distanceFromMd: distFromMd,
      distanceFromAd: distFromAd,
      axisLabel: '6/8',
      category: 'shadashtaka',
      harmony: 'challenging',
      summary: 'Shadashtaka axis (6/8): friction, recalibration, or structural course-correction between chapter and sub-chapter',
    };
  }
  return {
    distanceFromMd: distFromMd,
    distanceFromAd: distFromAd,
    axisLabel: '2/12',
    category: 'dwirdwadasa',
    harmony: 'challenging',
    summary: 'Dwirdwadasa axis (2/12): asymmetric expenditure, detachment, or behind-the-scenes restructuring',
  };
}

/**
 * Detects Parivartana (mutual sign exchange) between any two of the 7 classical grahas.
 */
export function detectParivartanaExchanges(ws: ChartWorkspace): ParivartanaExchange[] {
  const classical: PlanetId[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];
  const placements = new Map<PlanetId, { signIndex: number; house: number }>();

  for (const p of classical) {
    const f = ws.getFact(`placement.${p}`);
    if (!f) continue;
    placements.set(p, {
      signIndex: Number(f.args.signIndex ?? 0),
      house: Number(f.args.house ?? 1),
    });
  }

  const seen = new Set<string>();
  const exchanges: ParivartanaExchange[] = [];
  const dusthanas = new Set([6, 8, 12]);

  for (const a of classical) {
    const plA = placements.get(a);
    if (!plA) continue;
    const lordOfASign = SIGN_LORDS[plA.signIndex]!;
    if (lordOfASign === a) continue;
    const plB = placements.get(lordOfASign);
    if (!plB) continue;
    const lordOfBSign = SIGN_LORDS[plB.signIndex]!;
    if (lordOfBSign !== a) continue;

    const key = [a, lordOfASign].sort().join('-');
    if (seen.has(key)) continue;
    seen.add(key);

    const hasDusthana = dusthanas.has(plA.house) || dusthanas.has(plB.house);
    const hasThird = plA.house === 3 || plB.house === 3;
    const category: ParivartanaExchange['category'] = hasDusthana ? 'dainya' : hasThird ? 'khala' : 'maha';
    const meaning =
      category === 'maha'
        ? 'Maha Parivartana (prosperous mutual exchange): both planets deeply reinforce each other as if in own signs'
        : category === 'dainya'
        ? 'Dainya Parivartana (dusthana exchange): intertwines growth with hurdles requiring resilience and discipline'
        : 'Khala Parivartana (3rd-house exchange): alternating effort and fluctuating breakthroughs';

    exchanges.push({
      planetA: a,
      planetB: lordOfASign,
      houseA: plA.house,
      houseB: plB.house,
      category,
      meaning,
    });
  }

  return exchanges;
}

/**
 * Detects Yogada planets (PVR Ch. 13.2 / R-07):
 * A planet linking Lagna AND Hora Lagna (HL -> wealth) or Lagna AND Ghati Lagna (GL -> power/rank)
 * by ownership, occupation, or Rasi Drishti.
 */
export function detectYogadas(
  ws: ChartWorkspace,
  specialLagnas: SpecialLagnaPosition[],
): YogadaEntry[] {
  const h1 = ws.getFact('lord.house1');
  if (!h1) return [];
  const lagnaSignIndex = SIGN_IDS.indexOf(String(h1.args.sign) as any);
  if (lagnaSignIndex < 0) return [];

  const hl = specialLagnas.find((s) => s.code === 'HL');
  const gl = specialLagnas.find((s) => s.code === 'GL');
  if (!hl && !gl) return [];

  const linksSign = (planet: PlanetId, targetSign: number): boolean => {
    const pl = ws.getFact(`placement.${planet}`);
    if (!pl) return false;
    const pSign = Number(pl.args.signIndex ?? -1);
    if (pSign === targetSign) return true;
    if (SIGN_LORDS[targetSign] === planet) return true;
    if (getRasiDrishtiSigns(pSign).includes(targetSign)) return true;
    return false;
  };

  const results: YogadaEntry[] = [];
  for (const p of PLANET_IDS) {
    if (!linksSign(p, lagnaSignIndex)) continue;
    const links: Array<'HL' | 'GL'> = [];
    if (hl && linksSign(p, hl.signIndex)) links.push('HL');
    if (gl && linksSign(p, gl.signIndex)) links.push('GL');
    if (links.length === 0) continue;

    const kind: YogadaEntry['kind'] =
      links.length === 2 ? 'maha_yogada' : links[0] === 'HL' ? 'wealth_yogada' : 'power_yogada';
    const reason =
      kind === 'maha_yogada'
        ? 'Links Lagna with both Hora Lagna (wealth) and Ghati Lagna (authority)'
        : kind === 'wealth_yogada'
        ? 'Links Lagna with Hora Lagna (financial capacity)'
        : 'Links Lagna with Ghati Lagna (recognition & rank)';

    results.push({ planet: p, links, kind, reason });
  }

  return results;
}

/**
 * Computes Parashari Argala & Virodhargala + Jaimini Rasi Drishti on ANY sign
 * (works for houses 1..12, planets like Saturn, or Arudha Padas like AL, A10, UL).
 */
export function computeArgalaForSign(
  ws: ChartWorkspace,
  targetSignIndex: number,
  targetLabel: string,
): SignArgalaReport {
  const s = ((targetSignIndex % 12) + 12) % 12;
  const h1 = ws.getFact('lord.house1');
  const lagnaSignIndex = Math.max(0, SIGN_IDS.indexOf(String(h1?.args.sign ?? 'aries') as any));

  const signOccupants: Record<number, PlanetId[]> = {};
  for (let i = 0; i < 12; i++) signOccupants[i] = [];

  for (const p of PLANET_IDS) {
    const f = ws.getFact(`placement.${p}`);
    if (!f) continue;
    const pSign = Number(f.args.signIndex ?? -1);
    if (pSign >= 0 && pSign < 12) signOccupants[pSign]!.push(p);
  }

  const ketuReversed = (signOccupants[s] ?? []).includes('ketu');
  const direction = ketuReversed ? -1 : 1;

  const offsetSign = (offset: number): number => (((s + (offset - 1) * direction) % 12) + 12) % 12;
  const houseOfSign = (signIdx: number): number => ((signIdx - lagnaSignIndex + 12) % 12) + 1;

  const pairs: Array<[number, number, '2nd' | '4th' | '11th' | '5th', string]> = [
    [2, 12, '2nd', 'sustenance & resources'],
    [4, 10, '4th', 'emotional drive & foundation'],
    [11, 3, '11th', 'catalyst & allies/gains'],
    [5, 9, '5th', 'intellect & creative backing'],
  ];

  const interventions: SignArgalaIntervention[] = [];
  for (const [argOff, obsOff, label, theme] of pairs) {
    const aSign = offsetSign(argOff);
    const oSign = offsetSign(obsOff);
    const aPlanets = signOccupants[aSign] ?? [];
    const oPlanets = signOccupants[oSign] ?? [];
    if (aPlanets.length === 0) continue;

    const isObstructed = oPlanets.length >= aPlanets.length;
    const hasBenefics = aPlanets.some((p) => (NATURAL_BENEFICS as readonly string[]).includes(p));
    const hasMalefics = aPlanets.some((p) => (NATURAL_MALEFICS as readonly string[]).includes(p));
    const nature: SignArgalaIntervention['nature'] =
      hasBenefics && !hasMalefics ? 'subha' : hasMalefics && !hasBenefics ? 'paapa' : 'mixed';

    const meaning = isObstructed
      ? `${label} Argala (${theme}) from ${aPlanets.join(', ')} in ${SIGN_IDS[aSign]} is obstructed by ${oPlanets.join(', ')} in ${SIGN_IDS[oSign]}.`
      : `Unobstructed ${nature} ${label} Argala (${theme}) from ${aPlanets.join(', ')} in ${SIGN_IDS[aSign]} (H${houseOfSign(aSign)}) decisively shapes ${targetLabel}.`;

    interventions.push({
      relativePosition: label,
      argalaSign: SIGN_IDS[aSign]!,
      argalaHouseFromLagna: houseOfSign(aSign),
      planets: aPlanets,
      nature,
      obstructingSign: SIGN_IDS[oSign]!,
      obstructingPlanets: oPlanets,
      isObstructed,
      meaning,
    });
  }

  // Classical 3rd-house multiple-malefics exception (PVR Ch. 10.3)
  const s3 = offsetSign(3);
  const maleficsIn3 = (signOccupants[s3] ?? []).filter((p) => (NATURAL_MALEFICS as readonly string[]).includes(p));
  if (maleficsIn3.length >= 2) {
    const s11 = offsetSign(11);
    const obsPlanets = signOccupants[s11] ?? [];
    const isObstructed = obsPlanets.length >= maleficsIn3.length;
    interventions.push({
      relativePosition: '3rd_special',
      argalaSign: SIGN_IDS[s3]!,
      argalaHouseFromLagna: houseOfSign(s3),
      planets: maleficsIn3,
      nature: 'paapa',
      obstructingSign: SIGN_IDS[s11]!,
      obstructingPlanets: obsPlanets,
      isObstructed,
      meaning: isObstructed
        ? `Special 3rd-house courage Argala from ${maleficsIn3.join(', ')} is countered by ${obsPlanets.join(', ')}.`
        : `Special 3rd-house Argala from multiple malefics (${maleficsIn3.join(', ')}) injects fierce initiative into ${targetLabel}.`,
    });
  }

  const rasiDrishtiSignIdxs = getRasiDrishtiSigns(s);
  const rasiDrishtiPlanets: Array<{ planet: PlanetId; sign: string }> = [];
  for (const rIdx of rasiDrishtiSignIdxs) {
    for (const p of signOccupants[rIdx] ?? []) {
      rasiDrishtiPlanets.push({ planet: p, sign: SIGN_IDS[rIdx]! });
    }
  }

  return {
    targetLabel,
    targetSign: SIGN_IDS[s]!,
    targetSignIndex: s,
    ketuReversed,
    interventions,
    rasiDrishtiSigns: rasiDrishtiSignIdxs.map((idx) => SIGN_IDS[idx]!),
    rasiDrishtiPlanets,
  };
}

/**
 * Assesses Varga sign-cusp proximity & rounded birth-time risk (PVR Ch. 32 / R-16).
 */
export function assessVargaCuspSensitivity(natal: NatalChart): VargaCuspSensitivity {
  const lagnaDeg = natal.lagna?.degInSign ?? 0;
  const timeMatch = natal.time.birthLocal.match(/T(\d{2}):(\d{2})(?::(\d{2}))?/);
  const hh = timeMatch ? Number(timeMatch[1]) : 0;
  const mm = timeMatch ? Number(timeMatch[2]) : 0;
  const ss = timeMatch && timeMatch[3] ? Number(timeMatch[3]) : 0;
  const birthTimeLabel = timeMatch ? `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}` : natal.time.birthLocal;
  const isRoundedBirthTime = ss === 0 && (mm % 15 === 0 || mm % 10 === 0);

  const checks: Array<{ varga: 'D9' | 'D10' | 'D24'; spanDeg: number; thresholdDeg: number }> = [
    { varga: 'D9', spanDeg: 30 / 9, thresholdDeg: 0.45 },
    { varga: 'D10', spanDeg: 3.0, thresholdDeg: 0.4 },
    { varga: 'D24', spanDeg: 1.25, thresholdDeg: 0.25 },
  ];

  const borderlineVargas: VargaCuspSensitivity['borderlineVargas'] = [];
  for (const c of checks) {
    const posInCell = lagnaDeg % c.spanDeg;
    const dist = Math.min(posInCell, c.spanDeg - posInCell);
    if (dist <= c.thresholdDeg) {
      borderlineVargas.push({
        varga: c.varga,
        distanceToCuspDeg: Number(dist.toFixed(2)),
        approxMinutesToFlip: Number((dist * 4).toFixed(1)), // Lagna moves ~1 deg per 4 min
      });
    }
  }

  let advisory = 'Birth Lagna is comfortably inside D9/D10/D24 sign boundaries.';
  if (borderlineVargas.length > 0) {
    const list = borderlineVargas
      .map((b) => `${b.varga} (~${b.approxMinutesToFlip} min from sign change)`)
      .join(', ');
    advisory = `Borderline Varga cusp detected for ${list}${
      isRoundedBirthTime ? ` with rounded birth time (${birthTimeLabel})` : ''
    }. Verify key life events before relying on fine divisional Ascendant placements.`;
  } else if (isRoundedBirthTime) {
    advisory = `Birth time (${birthTimeLabel}) appears rounded; D1/D9/D10 Lagna look stable, but high Vargas (D24/D60) and Ghati Lagna remain sensitive to 2-5 min shifts.`;
  }

  return {
    isRoundedBirthTime,
    birthTimeLabel,
    lagnaDegInSign: Number(lagnaDeg.toFixed(2)),
    borderlineVargas,
    advisory,
  };
}

/**
 * Rule-safe classical remedial synthesis per PVR Ch. 34 & Ch. 37 (R-17):
 * - Gemstones ONLY for Yogakarakas or Functional Benefics (never Functional Malefics or active Marakas).
 * - Weekday fasting tied to UL lord (marriage) and A10 lord (career).
 * - Ishta Devata from 12th house from Atmakaraka in D9.
 */
export function computeRuleSafeRemedies(
  lagnaSignIndex: number,
  isWaxingMoon: boolean,
  arudhas: Array<{ code: string; sign: string; lord: string }>,
  karakas: Array<{ karaka: string; graha: string }>,
  d9Placements: Array<{ planet: PlanetId; signIndex: number; sign: string }>,
): SafeRemedyRecommendation {
  const roles = getFunctionalRolesForLagna(lagnaSignIndex, isWaxingMoon);
  const gemstoneCandidates: SafeRemedyRecommendation['gemstoneCandidates'] = [];
  const excludedGemstonePlanets: SafeRemedyRecommendation['excludedGemstonePlanets'] = [];

  for (const r of roles) {
    if (r.planet === 'rahu' || r.planet === 'ketu') continue;
    const info = PLANET_REMEDY_TABLE[r.planet];
    if ((r.role === 'yogakaraka' || r.role === 'functional_benefic') && !r.isMaraka) {
      gemstoneCandidates.push({
        planet: r.planet,
        role: r.role,
        gemstone: info.gemstone,
        metal: info.metal,
        finger: info.finger,
        reason:
          r.role === 'yogakaraka'
            ? `Yogakaraka for ${SIGN_IDS[lagnaSignIndex]} Lagna (owns H${r.ownedHouses.join(', H')})`
            : `Functional benefic for ${SIGN_IDS[lagnaSignIndex]} Lagna (owns H${r.ownedHouses.join(', H')})`,
      });
    } else if (r.role === 'functional_malefic' || r.isMaraka) {
      excludedGemstonePlanets.push({
        planet: r.planet,
        reason: r.isMaraka
          ? `Maraka lord (H${r.ownedHouses.join(', H')}) — avoid strengthening with gemstone`
          : `Functional malefic (H${r.ownedHouses.join(', H')}) — use charity/mantra instead of gemstone`,
      });
    }
  }

  const ul = arudhas.find((a) => a.code.toUpperCase() === 'UL');
  const a10 = arudhas.find((a) => a.code.toUpperCase() === 'A10');
  const fastingGuidance: SafeRemedyRecommendation['fastingGuidance'] = {};
  if (ul && (PLANET_IDS as readonly string[]).includes(ul.lord.toLowerCase())) {
    const lord = ul.lord.toLowerCase() as PlanetId;
    fastingGuidance.marriage = {
      pada: 'UL',
      sign: ul.sign,
      lord,
      weekday: PLANET_REMEDY_TABLE[lord].weekday,
    };
  }
  if (a10 && (PLANET_IDS as readonly string[]).includes(a10.lord.toLowerCase())) {
    const lord = a10.lord.toLowerCase() as PlanetId;
    fastingGuidance.career = {
      pada: 'A10',
      sign: a10.sign,
      lord,
      weekday: PLANET_REMEDY_TABLE[lord].weekday,
    };
  }

  // Ishta Devata: 12th sign from Atmakaraka in D9 (PVR Ch. 34.5)
  let ishtaDevata: SafeRemedyRecommendation['ishtaDevata'];
  const ak = karakas.find((k) => k.karaka === 'AK');
  if (ak) {
    const akD9 = d9Placements.find((p) => p.planet === ak.graha.toLowerCase());
    if (akD9) {
      const twelfthIdx = (akD9.signIndex + 11) % 12;
      const occupantsIn12 = d9Placements.filter((p) => p.signIndex === twelfthIdx);
      const guidingPlanet: PlanetId =
        occupantsIn12.length > 0 ? occupantsIn12[0]!.planet : SIGN_LORDS[twelfthIdx]!;
      ishtaDevata = {
        akPlanet: ak.graha.toLowerCase(),
        karakamsaSign: akD9.sign,
        twelfthFromAkSign: SIGN_IDS[twelfthIdx]!,
        guidingPlanet,
        deities: PLANET_REMEDY_TABLE[guidingPlanet].deities,
      };
    }
  }

  const charityActions = roles
    .filter((r) => r.role === 'yogakaraka' || r.role === 'functional_benefic' || r.isBadhaka)
    .slice(0, 4)
    .map((r) => ({
      planet: r.planet,
      weekday: PLANET_REMEDY_TABLE[r.planet].weekday,
      action: PLANET_REMEDY_TABLE[r.planet].charityAction,
      deities: PLANET_REMEDY_TABLE[r.planet].deities,
    }));

  return {
    gemstoneCandidates,
    excludedGemstonePlanets,
    fastingGuidance,
    ...(ishtaDevata ? { ishtaDevata } : {}),
    charityActions,
  };
}
