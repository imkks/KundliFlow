import {
  calculateVargaSign,
  houseFromSign,
  NAKSHATRAS,
  type NatalChart,
} from '@astro/engine';
import { PLANET_IDS, SIGN_IDS, SIGN_LORDS, type PlanetId } from '@astro/facts';
import {
  analyzeDashaAngularRelation,
  getFunctionalRolesForLagna,
  getGrahaDrishtiHouses,
} from './jyotish-diagnostics.js';

const VIM_NAK_LORDS: PlanetId[] = [
  'ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury',
];

// Table 19A: Difficult Vimshottari MDs (3rd, 5th, 7th Star Lords from Birth MD)
const DIFFICULT_MD_BY_BIRTH_MD: Record<PlanetId, PlanetId[]> = {
  ketu: ['sun', 'mars', 'jupiter'],
  venus: ['moon', 'rahu', 'saturn'],
  sun: ['mars', 'jupiter', 'mercury'],
  moon: ['rahu', 'saturn', 'ketu'],
  mars: ['jupiter', 'mercury', 'venus'],
  rahu: ['saturn', 'ketu', 'sun'],
  jupiter: ['mercury', 'venus', 'moon'],
  saturn: ['ketu', 'sun', 'mars'],
  mercury: ['venus', 'moon', 'rahu'],
};

// Table 19B: Lagna-Specific Madhya Parashari Special Remarks (0=Aries .. 11=Pisces)
const TABLE_19B_REMARKS: Record<number, string> = {
  0: 'Aries Lagna: Jupiter+Saturn together weaken Jupiter’s beneficence; Venus in 4th flips double-maraka into strong benefic.',
  1: 'Taurus Lagna: Saturn alone is primary Raja Yoga giver; Moon, Jupiter & Venus act as functional malefics.',
  2: 'Gemini Lagna: Jupiter+Saturn together weaken Jupiter; Venus is the primary functional benefic.',
  3: 'Cancer Lagna: Mars is the supreme Yogakaraka (5th+10th lord); Moon & Jupiter strongly support.',
  4: 'Leo Lagna: Jupiter+Venus does NOT produce Raja Yoga by itself; Mars (4th+9th) is supreme Yogakaraka.',
  5: 'Virgo Lagna: Venus despite owning 2nd (Maraka) does not act as a killer; Mercury+Venus drive Raja Yoga.',
  6: 'Libra Lagna: Moon+Mercury (10th+9th) produce strong Raja Yoga; Saturn is Yogakaraka; exalted Mars in 4th flips Maraka to benefic.',
  7: 'Scorpio Lagna: Jupiter (2nd+5th) does NOT become a Maraka; Moon+Jupiter drive primary fortune.',
  8: 'Sagittarius Lagna: Venus (6th+11th) is the most troublesome planet; Sun+Mars drive core Raja Yoga.',
  9: 'Capricorn Lagna: Venus (5th+10th) is the supreme Yogakaraka; Mercury & Saturn support.',
  10: 'Aquarius Lagna: Venus (4th+9th) is the best Yogakaraka planet; Saturn supports as Lagna lord.',
  11: 'Pisces Lagna: Mars (2nd+9th), unless afflicted, is NOT a killer; Moon+Mars produce primary Raja Yoga.',
};

const EXALT_SIGN: Record<PlanetId, number> = {
  sun: 0, moon: 1, mars: 9, mercury: 5, jupiter: 3, venus: 11, saturn: 6, rahu: 1, ketu: 7,
};
const DEBIL_SIGN: Record<PlanetId, number> = {
  sun: 6, moon: 7, mars: 3, mercury: 11, jupiter: 9, venus: 5, saturn: 0, rahu: 7, ketu: 1,
};

export interface KnRaoDashaQuirkReport {
  mdLord: PlanetId;
  adLord?: PlanetId;
  isDifficultMdStar: boolean;
  birthLagnaVargaScore: number; // 0..4 (D9, D3, D12, D30 landing in D1 1/4/5/9)
  d1AndD9Both68: boolean;
  flags: string[];
}

export interface KnRaoChecklistReport {
  d1ExaltD9Debil: PlanetId[];
  d1DebilD9Strong: PlanetId[];
  drekkana22Lord: PlanetId;
  drekkana22Sign: string;
  vainashika23Star: string;
  vainashika23Lord: PlanetId;
  leoPlanets: PlanetId[];
  sagittariusPlanets: PlanetId[];
  beneficSignCount: number;
  maleficSignCount: number;
  lagnaRemark: string;
  marakaHierarchy: Array<{ level: number; label: string; planets: PlanetId[] }>;
  yamaOverride: string | null;
}

export interface EducationStreamReport {
  house5FromLagna: { sign: string; lord: PlanetId; lordHouse: number; lordNakshatraLord: PlanetId; occupants: PlanetId[] };
  house5FromMercury: { sign: string; lord: PlanetId; lordHouse: number; occupants: PlanetId[] };
  dominantPlanets: Array<{ planet: PlanetId; weight: number }>;
  suggestedStreams: string[];
  summary: string;
}

export interface PoliticalCareerReport {
  score: number; // 0..7
  indicators: string[];
  leaning: 'Executive / Mass Mandate (PM-type Saturn emphasis)' | 'Dignified / Institutional Head (President-type Jupiter emphasis)' | 'Balanced Public / Advisory Leadership';
  publicEntryTrigger: string;
  summary: string;
}

export interface AstroPsychologyReport {
  activeMdLord: PlanetId | null;
  activeAdLord: PlanetId | null;
  signals: string[];
  counselingLevers: string[];
  summary: string;
}

/**
 * K.N. Rao Retrograde Double Transit Extension (PDF p. 115, 145):
 * When transiting Saturn or Jupiter is retrograde, it casts Graha Drishti BOTH from its
 * current house AND from the previous sign/house.
 */
export function getTransitEffectiveHousesWithRetro(
  planet: 'jupiter' | 'saturn',
  currentHouse: number,
  isRetrograde: boolean,
): number[] {
  const houses = new Set<number>(getGrahaDrishtiHouses(planet, currentHouse));
  if (isRetrograde) {
    const prevHouse = ((currentHouse - 2 + 12) % 12) + 1;
    for (const h of getGrahaDrishtiHouses(planet, prevHouse)) houses.add(h);
  }
  return Array.from(houses);
}

/**
 * Birth-Lagna Overlay on Vargas (Madhya Parashari Ch. XIV, PDF p. 71–72):
 * Counts how many of D9, D3, D12, D30 place the planet into fixed D1 houses 1, 4, 5, or 9.
 */
export function computeBirthLagnaVargaOverlayScore(natal: NatalChart, planet: PlanetId): number {
  const d1Lagna = natal.lagna?.signIndex ?? 0;
  const g = natal.grahas[planet];
  if (!g) return 0;
  const goodHouses = new Set([1, 4, 5, 9]);
  let hits = 0;
  for (const v of ['D9', 'D3', 'D12', 'D30'] as const) {
    const vSign = calculateVargaSign(g.lon, v);
    const hFromD1 = houseFromSign(vSign, d1Lagna);
    if (goodHouses.has(hFromD1)) hits++;
  }
  return hits;
}

/**
 * Evaluates Laghu & Madhya Parashari Vimshottari Dasha Subtleties (K.N. Rao r_19 Sec. 2.2 & Table 19A).
 */
export function analyzeKnRaoDashaQuirks(
  natal: NatalChart,
  mdLord: PlanetId,
  adLord?: PlanetId,
): KnRaoDashaQuirkReport {
  const lagnaIdx = natal.lagna?.signIndex ?? 0;
  const moonLon = ((natal.grahas.moon.lon % 360) + 360) % 360;
  const sunLon = ((natal.grahas.sun.lon % 360) + 360) % 360;
  const isWaxing = ((moonLon - sunLon + 360) % 360) < 180;
  const roles = getFunctionalRolesForLagna(lagnaIdx, isWaxing);
  const roleOf = (p: PlanetId) => roles.find((r) => r.planet === p);

  const birthMdLord = VIM_NAK_LORDS[natal.grahas.moon.nakshatraIndex % 9]!;
  const difficultMds = DIFFICULT_MD_BY_BIRTH_MD[birthMdLord] ?? [];
  const isDifficultMdStar = difficultMds.includes(mdLord);

  const flags: string[] = [];
  if (isDifficultMdStar) {
    flags.push(`Table 19A Difficult MD (3rd/5th/7th star from birth ${birthMdLord} MD — extra tests)`);
  }

  let d1AndD9Both68 = false;
  const targetForOverlay = adLord ?? mdLord;
  const birthLagnaVargaScore = computeBirthLagnaVargaOverlayScore(natal, targetForOverlay);

  if (adLord) {
    if (mdLord === adLord) {
      flags.push('Own-AD non-delivery rule (full primary results typically wait for associated ADs)');
    }
    const mdRole = roleOf(mdLord);
    const adRole = roleOf(adLord);
    if (mdRole?.role === 'functional_malefic' && adRole?.role === 'yogakaraka') {
      flags.push('Madhya Parashari Enigmatic Exception: Yogakaraka AD inside Malefic MD can be unexpectedly harsh unless linked');
    }
    if (mdRole?.role === 'yogakaraka' && adRole?.isMaraka) {
      flags.push('Yogakaraka MD Shield: Maraka AD does not extinguish the primary Raja Yoga trend');
    }
    if ((mdLord === 'saturn' && adLord === 'saturn') || (mdLord === 'venus' && adLord === 'venus')) {
      flags.push(
        mdLord === 'saturn'
          ? 'Saturn-Venus Quirk: Saturn-Saturn tends to mirror Saturn-Venus results'
          : 'Saturn-Venus Quirk: Venus-Venus tends to mirror Venus-Saturn results',
      );
    }
    if ((mdLord === 'rahu' && adLord === 'venus') || (mdLord === 'venus' && adLord === 'rahu')) {
      flags.push('Rahu-Venus Extreme Polarity: capable of dramatic rise or abrupt turbulence; verify Varga & transits');
    }

    // Check mutual 6/8 in BOTH D1 and D9 (K.N. Rao Astro-Psychology Red Flag, PDF p. 171-177)
    const mdH1 = houseFromSign(natal.grahas[mdLord].signIndex, lagnaIdx);
    const adH1 = houseFromSign(natal.grahas[adLord].signIndex, lagnaIdx);
    const relD1 = analyzeDashaAngularRelation(mdH1, adH1);

    const d9Lagna = natal.lagna ? calculateVargaSign(natal.lagna.lon, 'D9') : 0;
    const mdD9H = houseFromSign(calculateVargaSign(natal.grahas[mdLord].lon, 'D9'), d9Lagna);
    const adD9H = houseFromSign(calculateVargaSign(natal.grahas[adLord].lon, 'D9'), d9Lagna);
    const relD9 = analyzeDashaAngularRelation(mdD9H, adD9H);

    if (relD1.category === 'shadashtaka' && relD9.category === 'shadashtaka') {
      d1AndD9Both68 = true;
      flags.push('CRITICAL D1+D9 Double 6/8 Axis: acute friction or sudden relationship/role rupture risk');
    }

    if (birthLagnaVargaScore >= 3) {
      flags.push(`Strong Birth-Lagna Varga Overlay (${birthLagnaVargaScore}/4 of D9/D3/D12/D30 in D1 1/4/5/9)`);
    }
  }

  return {
    mdLord,
    ...(adLord ? { adLord } : {}),
    isDifficultMdStar,
    birthLagnaVargaScore,
    d1AndD9Both68,
    flags,
  };
}

/**
 * Runs K.N. Rao's Standardized Checklists I–III & 10-Level Maraka Hierarchy (PDF p. 46–47, 82–86).
 */
export function runKnRaoChecklists(natal: NatalChart): KnRaoChecklistReport {
  const lagnaIdx = natal.lagna?.signIndex ?? 0;
  const hOf = (p: PlanetId) => houseFromSign(natal.grahas[p].signIndex, lagnaIdx);
  const lOf = (h: number): PlanetId => SIGN_LORDS[(lagnaIdx + h - 1) % 12]!;

  const d1ExaltD9Debil: PlanetId[] = [];
  const d1DebilD9Strong: PlanetId[] = [];
  const leoPlanets: PlanetId[] = [];
  const sagittariusPlanets: PlanetId[] = [];
  let beneficSignCount = 0;
  let maleficSignCount = 0;
  const beneficSignRulers = new Set<PlanetId>(['jupiter', 'venus', 'mercury', 'moon']);

  for (const p of PLANET_IDS) {
    const g = natal.grahas[p];
    if (g.signIndex === 4) leoPlanets.push(p);
    if (g.signIndex === 8) sagittariusPlanets.push(p);
    if (beneficSignRulers.has(SIGN_LORDS[g.signIndex]!)) beneficSignCount++;
    else maleficSignCount++;

    if (p === 'rahu' || p === 'ketu') continue;
    const d9Sign = calculateVargaSign(g.lon, 'D9');
    const isD1Exalt = EXALT_SIGN[p] === g.signIndex;
    const isD1Debil = DEBIL_SIGN[p] === g.signIndex;
    const isD9Debil = DEBIL_SIGN[p] === d9Sign;
    const isD9Strong = EXALT_SIGN[p] === d9Sign || SIGN_LORDS[d9Sign] === p;

    if (isD1Exalt && isD9Debil) d1ExaltD9Debil.push(p);
    if (isD1Debil && isD9Strong) d1DebilD9Strong.push(p);
  }

  // 22nd Drekkana shortcut (Lagna degree placed in 8th house)
  const lagnaDeg = natal.lagna?.degInSign ?? ((natal.lagna?.lon ?? 0) % 30);
  const drekPart = lagnaDeg < 10 ? 0 : lagnaDeg < 20 ? 4 : 8;
  const drek22SignIdx = ((lagnaIdx + 7) % 12 + drekPart) % 12;
  const drekkana22Lord = SIGN_LORDS[drek22SignIdx]!;

  // 23rd (Vainashika) Nakshatra from Moon
  const vainashikaIdx = (natal.grahas.moon.nakshatraIndex + 22) % 27;
  const vainashika23Star = NAKSHATRAS[vainashikaIdx] ?? `Nakshatra ${vainashikaIdx + 1}`;
  const vainashika23Lord = VIM_NAK_LORDS[vainashikaIdx % 9]!;

  // 10-Level Descending Maraka Hierarchy (Laghu Parashari Ch. VI, PDF p. 46-47)
  const l2 = lOf(2);
  const l7 = lOf(7);
  const l12 = lOf(12);
  const l8 = lOf(8);
  const occIn = (h: number) => PLANET_IDS.filter((p) => hOf(p) === h);
  const conjWith = (target: PlanetId) =>
    PLANET_IDS.filter((p) => p !== target && natal.grahas[p].signIndex === natal.grahas[target].signIndex);

  const marakaHierarchy: KnRaoChecklistReport['marakaHierarchy'] = [
    { level: 1, label: '2nd Lord', planets: [l2] },
    { level: 2, label: '7th Lord', planets: [l7] },
    { level: 3, label: '2nd Occupants', planets: occIn(2) },
    { level: 4, label: '2nd Lord Associates', planets: conjWith(l2) },
    { level: 5, label: '7th Occupants', planets: occIn(7) },
    { level: 6, label: '7th Lord Associates', planets: conjWith(l7) },
    { level: 7, label: '12th Lord & Occupants', planets: Array.from(new Set([l12, ...occIn(12)])) },
    { level: 9, label: '8th Lord & Occupants', planets: Array.from(new Set([l8, ...occIn(8)])) },
    { level: 10, label: '3rd/6th/11th Lords', planets: Array.from(new Set([lOf(3), lOf(6), lOf(11)])) },
  ].filter((m) => m.planets.length > 0);

  // Saturn/Rahu Yama Override
  const satOwned = [3, 6, 8, 11, 12].filter((h) => lOf(h) === 'saturn');
  const satLinksMaraka =
    hOf('saturn') === 2 || hOf('saturn') === 7 || conjWith(l2).includes('saturn') || conjWith(l7).includes('saturn');
  const yamaOverride =
    satOwned.length > 0 && satLinksMaraka
      ? `Saturn (owns H${satOwned.join(',H')}) associates with Maraka -> takes primary Yama override role.`
      : null;

  return {
    d1ExaltD9Debil,
    d1DebilD9Strong,
    drekkana22Lord,
    drekkana22Sign: SIGN_IDS[drek22SignIdx]!,
    vainashika23Star,
    vainashika23Lord,
    leoPlanets,
    sagittariusPlanets,
    beneficSignCount,
    maleficSignCount,
    lagnaRemark: TABLE_19B_REMARKS[lagnaIdx] ?? '',
    marakaHierarchy,
    yamaOverride,
  };
}

const STREAM_BY_PLANET: Record<PlanetId, string> = {
  sun: 'Administration, Medicine, Leadership, Government/Policy',
  moon: 'Psychology, Healthcare, Hospitality, Humanities, Marine/Logistics',
  mars: 'Engineering, Surgery, Mechanics, Defense, Architecture, Sports Tech',
  mercury: 'Computer Science, Finance, Accounting, Data Analytics, Journalism, Commerce',
  jupiter: 'Law, Teaching, Advisory, Economics, Philosophy, Higher Research',
  venus: 'Design, Media, Arts, Luxury Management, Diplomacy, Biotechnology/Aesthetics',
  saturn: 'Mechanical/Civil/Auto Engineering, Law, Operations, Systems, Public Administration',
  rahu: 'AI/Emerging Tech, Aviation, Foreign Trade, Research, Unconventional Media',
  ketu: 'Mathematics, Coding/Algorithms, Spiritual Studies, Diagnostics, Occult/Pure Research',
};

/**
 * K.N. Rao's >80% Empirical Educational Counseling Formula (PDF p. 162–163, 177):
 * 5th house/lord from Lagna + its Nakshatra lord + 5th house/lord from Mercury.
 */
export function analyzeEducationStream(natal: NatalChart): EducationStreamReport {
  const lagnaIdx = natal.lagna?.signIndex ?? 0;
  const mercSign = natal.grahas.mercury.signIndex;

  const h5LagnaSign = (lagnaIdx + 4) % 12;
  const h5LagnaLord = SIGN_LORDS[h5LagnaSign]!;
  const h5LordDetail = natal.grahas[h5LagnaLord];
  const h5LordNakLord = VIM_NAK_LORDS[h5LordDetail.nakshatraIndex % 9]!;
  const h5LagnaOcc = PLANET_IDS.filter((p) => natal.grahas[p].signIndex === h5LagnaSign);

  const h5MercSign = (mercSign + 4) % 12;
  const h5MercLord = SIGN_LORDS[h5MercSign]!;
  const h5MercOcc = PLANET_IDS.filter((p) => natal.grahas[p].signIndex === h5MercSign);

  const weights = new Map<PlanetId, number>();
  const addW = (p: PlanetId, w: number) => weights.set(p, (weights.get(p) ?? 0) + w);

  addW(h5LagnaLord, 3);
  addW(h5LordNakLord, 2.5);
  for (const p of h5LagnaOcc) addW(p, 2);
  addW(h5MercLord, 2.5);
  for (const p of h5MercOcc) addW(p, 1.5);

  const dominantPlanets = Array.from(weights.entries())
    .map(([planet, weight]) => ({ planet, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4);

  const suggestedStreams = dominantPlanets.slice(0, 3).map((d) => `${d.planet}: ${STREAM_BY_PLANET[d.planet]}`);

  const summary = `K.N. Rao Education Formula: 5th from Lagna=${SIGN_IDS[h5LagnaSign]} (lord ${h5LagnaLord}, Nakshatra lord ${h5LordNakLord}, occ [${h5LagnaOcc.join(',') || 'none'}]); 5th from Mercury=${SIGN_IDS[h5MercSign]} (lord ${h5MercLord}, occ [${h5MercOcc.join(',') || 'none'}]). Top drivers: ${dominantPlanets.map((d) => `${d.planet}(${d.weight})`).join(', ')}.`;

  return {
    house5FromLagna: {
      sign: SIGN_IDS[h5LagnaSign]!,
      lord: h5LagnaLord,
      lordHouse: houseFromSign(h5LordDetail.signIndex, lagnaIdx),
      lordNakshatraLord: h5LordNakLord,
      occupants: h5LagnaOcc,
    },
    house5FromMercury: {
      sign: SIGN_IDS[h5MercSign]!,
      lord: h5MercLord,
      lordHouse: houseFromSign(natal.grahas[h5MercLord].signIndex, lagnaIdx),
      occupants: h5MercOcc,
    },
    dominantPlanets,
    suggestedStreams,
    summary,
  };
}

/**
 * K.N. Rao's 7-Point Political Career & Public Life Profile (PDF p. 97, 178–190).
 */
export function analyzePoliticalCareer(natal: NatalChart): PoliticalCareerReport {
  const lagnaIdx = natal.lagna?.signIndex ?? 0;
  const hOf = (p: PlanetId) => houseFromSign(natal.grahas[p].signIndex, lagnaIdx);
  const lOf = (h: number): PlanetId => SIGN_LORDS[(lagnaIdx + h - 1) % 12]!;

  const indicators: string[] = [];

  // 1. Jupiter-Sun association
  const jupSun = houseFromSign(natal.grahas.sun.signIndex, natal.grahas.jupiter.signIndex);
  if ([1, 5, 7, 9].includes(jupSun)) indicators.push('Jupiter-Sun dignity link (royal prestige)');

  // 2. Gaja-Kesari (Jupiter in Kendra from Moon)
  const jupMoon = houseFromSign(natal.grahas.jupiter.signIndex, natal.grahas.moon.signIndex);
  if ([1, 4, 7, 10].includes(jupMoon)) indicators.push('Gaja-Kesari Yoga (public/popular appeal)');

  // 3. Saturn linked to 10th house / 10th lord
  const satH = hOf('saturn');
  const satHits10 = getGrahaDrishtiHouses('saturn', satH).includes(10) || lOf(10) === 'saturn' || natal.grahas.saturn.signIndex === natal.grahas[lOf(10)].signIndex;
  if (satHits10) indicators.push('Saturn linked to 10th (mass mandate & democratic stamina)');

  // 4. 4th house (Parliament / throne) strong
  const l4 = lOf(4);
  const l4H = hOf(l4);
  if ([1, 4, 5, 9, 10, 11].includes(l4H) || PLANET_IDS.some((p) => hOf(p) === 4 && ['jupiter', 'sun', 'venus', 'saturn'].includes(p))) {
    indicators.push(`4th house (Parliament/seat of power) fortified (lord ${l4} in H${l4H})`);
  }

  // 5. Rahu-Ketu axis on 1/7 or 4/10 or linked to 10th lord
  const rahuH = hOf('rahu');
  if ([1, 4, 7, 10].includes(rahuH) || natal.grahas.rahu.signIndex === natal.grahas[lOf(10)].signIndex) {
    indicators.push(`Rahu-Ketu on angular/career axis (H${rahuH} — strategic political maneuvering)`);
  }

  // 6. 8th house link to 10th (career break into politics)
  const l8 = lOf(8);
  if (hOf(l8) === 10 || hOf(lOf(10)) === 8 || natal.grahas[l8].signIndex === natal.grahas[lOf(10)].signIndex) {
    indicators.push('8th-10th link (pivot/break from conventional career into public life)');
  }

  // 7. Leo (royalty) or Sagittarius (official seal) planets
  const hasSeal = PLANET_IDS.some((p) => natal.grahas[p].signIndex === 4 || natal.grahas[p].signIndex === 8);
  if (hasSeal) indicators.push('Leo (royalty) / Sagittarius (gazetted seal) planetary emphasis');

  const jupH = hOf('jupiter');
  const jupAngular = [1, 4, 7, 9, 10].includes(jupH);
  const leaning: PoliticalCareerReport['leaning'] =
    satHits10 && !jupAngular
      ? 'Executive / Mass Mandate (PM-type Saturn emphasis)'
      : jupAngular && !satHits10
      ? 'Dignified / Institutional Head (President-type Jupiter emphasis)'
      : 'Balanced Public / Advisory Leadership';

  const l7 = lOf(7);
  const publicEntryTrigger = `Watch Pratyantar/Antardasha of 7th lord (${l7}) or Saturn, plus Double Transit on 10th/4th (verify 6/10 non-political life events first).`;

  return {
    score: indicators.length,
    indicators,
    leaning,
    publicEntryTrigger,
    summary: `Political/Public Career Score ${indicators.length}/7 (${leaning}): ${indicators.join('; ') || 'minimal political indicators'}.`,
  };
}

/**
 * K.N. Rao Astro-Psychology Blind Diagnosis (Sec. IV Ch. III, PDF p. 171–177).
 */
export function diagnoseAstroPsychology(
  natal: NatalChart,
  activeMdLord: PlanetId | null,
  activeAdLord: PlanetId | null,
): AstroPsychologyReport {
  const lagnaIdx = natal.lagna?.signIndex ?? 0;
  const hOf = (p: PlanetId) => houseFromSign(natal.grahas[p].signIndex, lagnaIdx);
  const lOf = (h: number): PlanetId => SIGN_LORDS[(lagnaIdx + h - 1) % 12]!;

  const signals: string[] = [];
  const counselingLevers: string[] = [];

  // 1. MD-AD 6/8 in BOTH D1 and D9
  if (activeMdLord && activeAdLord) {
    const quirks = analyzeKnRaoDashaQuirks(natal, activeMdLord, activeAdLord);
    if (quirks.d1AndD9Both68) {
      signals.push(`Active ${activeMdLord}-${activeAdLord} sits in 6/8 in BOTH D1 & D9 — acute relationship/role strain requiring calm conflict de-escalation.`);
    }
    const l6 = lOf(6);
    if (activeAdLord === l6) {
      const l6Asp = getGrahaDrishtiHouses(l6, hOf(l6));
      if (l6Asp.includes(4) || l6Asp.includes(5) || l6Asp.includes(hOf(lOf(4)))) {
        signals.push(`Active 6th lord (${l6}) AD aspects 4th/5th — domestic, property, or family dispute driving mental agitation.`);
      }
    }
  }

  // 2. Moon + Rahu with Mars aspect (domestic tension) vs Jupiter on 10th (external work normalcy)
  const moonSign = natal.grahas.moon.signIndex;
  const moonRahuConj = moonSign === natal.grahas.rahu.signIndex;
  const marsAspMoon = getGrahaDrishtiHouses('mars', hOf('mars')).includes(hOf('moon'));
  if (moonRahuConj || (marsAspMoon && (hOf('moon') === 4 || hOf('rahu') === 4))) {
    signals.push('Moon-Rahu / Mars pressure on emotional axis — heightened domestic reactivity or inner restlessness.');
    const jupAsp10 = getGrahaDrishtiHouses('jupiter', hOf('jupiter')).includes(10);
    if (jupAsp10) {
      counselingLevers.push('Jupiter protects the 10th house: external professional life stays healthy; structured work/independence outside the home is an effective psychological remedy.');
    }
  }

  // 3. Parashari 108-count mantra & grounding anchor
  counselingLevers.push('Parashari mental anchor: consistent 108-count daily mindfulness/mantra (27 Nakshatras x 4 Padas) + service/daan stabilizes volatile periods.');

  const summary =
    signals.length > 0
      ? `Astro-Psychology Signals (${activeMdLord ?? '?'}-${activeAdLord ?? '?'}): ${signals.join(' ')}`
      : `Astro-Psychology Check (${activeMdLord ?? '?'}-${activeAdLord ?? '?'}): No acute D1+D9 6/8 or Moon-Rahu domestic crisis triggers detected; emotional baseline is steady.`;

  return {
    activeMdLord,
    activeAdLord,
    signals,
    counselingLevers,
    summary,
  };
}
