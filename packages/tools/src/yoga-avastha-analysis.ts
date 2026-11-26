import {
  calculateSunTimes,
  computeChartVaisheshikamsa,
  houseFromSign,
  type ArudhaPadaItem,
  type NatalChart,
  type ShadbalaResult,
  type YogaDetection,
} from '@astro/engine';
import { NATURAL_BENEFICS, NATURAL_MALEFICS, PLANET_IDS, SIGN_IDS, SIGN_LORDS, type PlanetId } from '@astro/facts';
import { getGrahaDrishtiHouses, getRasiDrishtiSigns } from './jyotish-diagnostics.js';

const CLASSICAL_7: PlanetId[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];
const MOVABLE_SIGNS = new Set([0, 3, 6, 9]);
const FIXED_SIGNS = new Set([1, 4, 7, 10]);
const DUAL_SIGNS = new Set([2, 5, 8, 11]);
const WATER_SIGNS = new Set([3, 7, 11]);
const KENDRAS = new Set([1, 4, 7, 10]);
const TRIKONAS = new Set([1, 5, 9]);
const PANAPHARAS = new Set([2, 5, 8, 11]);
const APOKLIMAS = new Set([3, 6, 9, 12]);

export interface GradedYogaSummary {
  id: string;
  name: string;
  category: string;
  baseStrength: string;
  grade: 'S-Tier (Exceptional)' | 'A-Tier (Strong)' | 'B-Tier (Moderate)' | 'C-Tier (Softened)';
  leaderPlanet: string;
  dasavargaBestTier: string;
  orbNote: string;
  alA7Harmony: boolean;
  summary: string;
}

export interface ExtendedClassicalYoga {
  id: string;
  name: string;
  category: 'naabhasa' | 'raja_sambandha' | 'spiritual' | 'raja';
  planets: PlanetId[];
  lifelong: boolean;
  summary: string;
}

export interface ExtendedPlanetAvastha {
  planet: PlanetId;
  lajjitadi: string[];
  sayanaadiIndex: number;
  sayanaadiName: string;
  sayanaadiMeaning: string;
  specialOverride?: string;
}

export interface TripodAndDrekkanaNote {
  mdFromSun: number;
  adFromMoon?: number;
  pdFromLagna?: number;
  mdDrekkanaTiming: 'early third (0-10°)' | 'middle third (10-20°)' | 'final third (20-30°)';
  summary: string;
}

function angularOrb(deg1: number, deg2: number): number {
  const diff = Math.abs(deg1 - deg2);
  return Math.min(diff, 30 - diff);
}

/**
 * 4-Factor Yoga Magnitude Grading (PVR Ch. 11.7.2 & Ch. 15.2):
 * 1. Orb tightness (<= 6°), 2. Combustion/debilitation check,
 * 3. Dasavarga Amsabala tier, 4. AL-A7 non-6/8/2/12 amplifier + Shadbala group leader.
 */
export function gradeDetectedYogas(
  natal: NatalChart,
  yogas: YogaDetection[],
  shadbala: ShadbalaResult,
  arudhas: ArudhaPadaItem[],
): GradedYogaSummary[] {
  const amsa = computeChartVaisheshikamsa(natal);
  const amsaMap = new Map(
    Object.entries(amsa).map(([k, v]) => [k.toLowerCase(), v]),
  );

  const al = arudhas.find((a) => a.code === 'AL');
  const a7 = arudhas.find((a) => a.code === 'A7');
  let alA7Harmony = true;
  if (al && a7) {
    const alIdx = SIGN_IDS.indexOf(al.sign.toLowerCase() as any);
    const a7Idx = SIGN_IDS.indexOf(a7.sign.toLowerCase() as any);
    if (alIdx >= 0 && a7Idx >= 0) {
      const dist = ((a7Idx - alIdx + 12) % 12) + 1;
      if ([2, 6, 8, 12].includes(dist)) alA7Harmony = false;
    }
  }

  return yogas
    .filter((y) => y.presence && y.category !== 'dosha')
    .map((y) => {
      const plist = (y.planets ?? y.planetsInvolved ?? []).map((p) => p.toLowerCase()) as PlanetId[];

      // Shadbala leader (PVR Ch. 15.2: highest Shadbala delivers the Yoga on behalf of the group)
      let leader = plist[0] ?? 'sun';
      let bestSb = -1;
      for (const p of plist) {
        const sb = shadbala.planets[p as keyof typeof shadbala.planets];
        if (sb && sb.strengthRatio > bestSb) {
          bestSb = sb.strengthRatio;
          leader = p;
        }
      }

      // Dasavarga Amsabala best tier among participating planets
      let bestCount = 0;
      let bestTier = 'Ordinary (<2/10)';
      let hasWeakState = false;
      for (const p of plist) {
        const a = amsaMap.get(p);
        if (a && a.vargaCount > bestCount) {
          bestCount = a.vargaCount;
          bestTier = `${a.tierName} (${a.vargaCount}/10)`;
        }
        const g = natal.grahas[p];
        if (g && (g.dignity === 'debilitated' || g.isCombust)) hasWeakState = true;
      }

      // Orb check for 2+ planets
      let orbNote = 'single-planet placement';
      let tightOrb = false;
      if (plist.length >= 2) {
        const g1 = natal.grahas[plist[0]!];
        const g2 = natal.grahas[plist[1]!];
        if (g1 && g2) {
          const orb = angularOrb(g1.degInSign, g2.degInSign);
          tightOrb = orb <= 6;
          orbNote = `degree orb ${orb.toFixed(1)}°${tightOrb ? ' (tight <=6° peak)' : ' (wide >6°)'}`;
        }
      }

      let points = 0;
      if (y.strength === 'strong') points += 2;
      else if (y.strength === 'moderate') points += 1;
      if (bestCount >= 4) points += 3;
      else if (bestCount >= 2) points += 2;
      if (tightOrb) points += 1;
      if (alA7Harmony) points += 1;
      if (hasWeakState) points -= 2;

      const grade: GradedYogaSummary['grade'] =
        points >= 6
          ? 'S-Tier (Exceptional)'
          : points >= 4
          ? 'A-Tier (Strong)'
          : points >= 2
          ? 'B-Tier (Moderate)'
          : 'C-Tier (Softened)';

      return {
        id: `yoga.grade.${y.id}`,
        name: y.name,
        category: y.category,
        baseStrength: y.strength,
        grade,
        leaderPlanet: leader,
        dasavargaBestTier: bestTier,
        orbNote,
        alA7Harmony,
        summary: `${y.name} [${grade}]: Leader=${leader} (Shadbala), Amsabala=${bestTier}, ${orbNote}${
          hasWeakState ? ', combustion/debilitation softens delivery' : ''
        }${!alA7Harmony ? ', AL-A7 friction tempers outward rise' : ''}.`,
      };
    });
}

/**
 * Detects key classical Yogas not covered by yogas.ts:
 * - 32 Naabhasa Yogas (Aashraya, Dala, core Aakriti, Sankhya with Charak Ch. XX precedence)
 * - Tapaswi Yoga (Saturn + Ketu + Venus mutual link — PVR Ch. 13.5)
 * - Raja Sambandha Yogas (AK/AmK & 10th lord — PVR Ch. 11.8)
 * - Kalpadruma Yoga (PVR Chart 9)
 */
export function detectExtendedClassicalYogas(
  natal: NatalChart,
  karakas: Array<{ karaka: string; graha: string }>,
  d9Placements: Array<{ planet: PlanetId; signIndex: number }>,
): ExtendedClassicalYoga[] {
  const found: ExtendedClassicalYoga[] = [];
  const lagnaIdx = natal.lagna?.signIndex ?? 0;

  const signOf = (p: PlanetId) => natal.grahas[p].signIndex;
  const houseOf = (p: PlanetId) => houseFromSign(signOf(p), lagnaIdx);

  // --- 1. Naabhasa Yogas (7 classical planets ONLY; active across ALL Dashas) ---
  const signs7 = CLASSICAL_7.map((p) => signOf(p));
  const houses7 = CLASSICAL_7.map((p) => houseOf(p));
  const uniqueSigns = new Set(signs7);
  const uniqueHouses = new Set(houses7);

  let hasAakritiOrDala = false;

  // Dala (2): Maalaa (3 Kendras occupied only by benefics) / Sarpa (3 Kendras only by malefics)
  const kendraOccupied = [1, 4, 7, 10].filter((h) => uniqueHouses.has(h));
  if (kendraOccupied.length === 3 && houses7.every((h) => KENDRAS.has(h))) {
    // Check if non-kendra empty & nature of occupants
    const onlyBenefics = CLASSICAL_7.every((p) => (NATURAL_BENEFICS as readonly string[]).includes(p));
    if (!onlyBenefics) {
      // Standard Dala checks whether 3 Kendras are occupied strictly by benefics or strictly by malefics
      const beneficsInKendras = ['jupiter', 'venus', 'mercury', 'moon'].filter((p) => KENDRAS.has(houseOf(p as PlanetId)));
      const maleficsInKendras = ['sun', 'mars', 'saturn'].filter((p) => KENDRAS.has(houseOf(p as PlanetId)));
      if (beneficsInKendras.length >= 3 && maleficsInKendras.length === 0) {
        hasAakritiOrDala = true;
        found.push({
          id: 'yoga.naabhasa.maalaa',
          name: 'Maalaa Naabhasa Yoga',
          category: 'naabhasa',
          planets: ['jupiter', 'venus', 'mercury'],
          lifelong: true,
          summary: 'Maalaa Yoga (Dala Naabhasa): 3 Kendras occupied purely by natural benefics — lifelong comfort, charm, and ease.',
        });
      } else if (maleficsInKendras.length === 3 && beneficsInKendras.length === 0) {
        hasAakritiOrDala = true;
        found.push({
          id: 'yoga.naabhasa.sarpa',
          name: 'Sarpa Naabhasa Yoga',
          category: 'naabhasa',
          planets: ['sun', 'mars', 'saturn'],
          lifelong: true,
          summary: 'Sarpa Yoga (Dala Naabhasa): 3 Kendras occupied purely by natural malefics — intense karmic grit requiring conscious self-reliance.',
        });
      }
    }
  }

  // Core Aakriti patterns
  if (houses7.every((h) => KENDRAS.has(h)) && kendraOccupied.length === 4) {
    hasAakritiOrDala = true;
    found.push({
      id: 'yoga.naabhasa.kamala',
      name: 'Kamala Naabhasa Yoga',
      category: 'naabhasa',
      planets: [...CLASSICAL_7],
      lifelong: true,
      summary: 'Kamala Yoga (Aakriti Naabhasa): all 7 planets fill all 4 Kendras — enduring fame, leadership, and strong foundation.',
    });
  } else if (houses7.every((h) => PANAPHARAS.has(h)) || houses7.every((h) => APOKLIMAS.has(h))) {
    hasAakritiOrDala = true;
    found.push({
      id: 'yoga.naabhasa.vaapi',
      name: 'Vaapi Naabhasa Yoga',
      category: 'naabhasa',
      planets: [...CLASSICAL_7],
      lifelong: true,
      summary: 'Vaapi Yoga (Aakriti Naabhasa): all 7 planets sit solely in Panapharas or Apoklimas — steady wealth accumulation and lasting comfort.',
    });
  } else if (houses7.every((h) => TRIKONAS.has(h))) {
    hasAakritiOrDala = true;
    found.push({
      id: 'yoga.naabhasa.sringaataka',
      name: 'Sringaataka Naabhasa Yoga',
      category: 'naabhasa',
      planets: [...CLASSICAL_7],
      lifelong: true,
      summary: 'Sringaataka Yoga (Aakriti Naabhasa): all 7 planets occupy Trines (1,5,9) — dharmic fortune, courage, and focus.',
    });
  } else if (houses7.every((h) => h % 2 === 1) && uniqueHouses.size >= 5) {
    hasAakritiOrDala = true;
    found.push({
      id: 'yoga.naabhasa.chakra',
      name: 'Chakra Naabhasa Yoga',
      category: 'naabhasa',
      planets: [...CLASSICAL_7],
      lifelong: true,
      summary: 'Chakra Yoga (Aakriti Naabhasa): all 7 planets occupy odd houses (1,3,5,7,9,11) — commanding stature and wide influence.',
    });
  } else if (houses7.every((h) => h % 2 === 0) && uniqueHouses.size >= 5) {
    hasAakritiOrDala = true;
    found.push({
      id: 'yoga.naabhasa.samudra',
      name: 'Samudra Naabhasa Yoga',
      category: 'naabhasa',
      planets: [...CLASSICAL_7],
      lifelong: true,
      summary: 'Samudra Yoga (Aakriti Naabhasa): all 7 planets occupy even houses (2,4,6,8,10,12) — deep resources, stability, and prosperity.',
    });
  }

  // Aashraya (3) if not overridden by Aakriti (and Gola overrides Aashraya)
  let hasAashraya = false;
  if (!hasAakritiOrDala && uniqueSigns.size > 1) {
    if (signs7.every((s) => MOVABLE_SIGNS.has(s))) {
      hasAashraya = true;
      found.push({
        id: 'yoga.naabhasa.rajju',
        name: 'Rajju Naabhasa Yoga',
        category: 'naabhasa',
        planets: [...CLASSICAL_7],
        lifelong: true,
        summary: 'Rajju Yoga (Aashraya Naabhasa): all 7 planets in Movable signs — love of travel, foreign fortunes, and restless ambition.',
      });
    } else if (signs7.every((s) => FIXED_SIGNS.has(s))) {
      hasAashraya = true;
      found.push({
        id: 'yoga.naabhasa.musala',
        name: 'Musala Naabhasa Yoga',
        category: 'naabhasa',
        planets: [...CLASSICAL_7],
        lifelong: true,
        summary: 'Musala Yoga (Aashraya Naabhasa): all 7 planets in Fixed signs — steadfast determination, honor, and durable wealth.',
      });
    } else if (signs7.every((s) => DUAL_SIGNS.has(s))) {
      hasAashraya = true;
      found.push({
        id: 'yoga.naabhasa.nala',
        name: 'Nala Naabhasa Yoga',
        category: 'naabhasa',
        planets: [...CLASSICAL_7],
        lifelong: true,
        summary: 'Nala Yoga (Aashraya Naabhasa): all 7 planets in Dual signs — versatility, cleverness, and multi-skill accumulation.',
      });
    }
  }

  // Sankhya (7 — fallback when no Aakriti/Aashraya, or Gola always applies)
  if (!hasAakritiOrDala && (!hasAashraya || uniqueSigns.size === 1)) {
    const sankhyaMap: Record<number, { id: string; name: string; meaning: string }> = {
      7: { id: 'veenaa', name: 'Veenaa (Vallaki) Yoga', meaning: 'all 7 planets spread across 7 signs — artistic taste, versatility, and social grace.' },
      6: { id: 'daama', name: 'Daama Yoga', meaning: '7 planets across 6 signs — generous, resourceful, and supportive of others.' },
      5: { id: 'paasa', name: 'Paasa Yoga', meaning: '7 planets across 5 signs — capable organizer with strong ties and obligations.' },
      4: { id: 'kedaara', name: 'Kedaara Yoga', meaning: '7 planets across 4 signs — grounded, helpful, and prosperous through steady cultivation.' },
      3: { id: 'soola', name: 'Soola Yoga', meaning: '7 planets across 3 signs — sharp focus, valorous drive, and intense breakthroughs.' },
      2: { id: 'yuga', name: 'Yuga Yoga', meaning: '7 planets in 2 signs — unconventional path requiring careful balance.' },
      1: { id: 'gola', name: 'Gola Yoga', meaning: 'all 7 planets concentrated in 1 sign — extreme single-house intensity and lifelong focus.' },
    };
    const sk = sankhyaMap[uniqueSigns.size];
    if (sk) {
      found.push({
        id: `yoga.naabhasa.${sk.id}`,
        name: sk.name,
        category: 'naabhasa',
        planets: [...CLASSICAL_7],
        lifelong: true,
        summary: `${sk.name} (Sankhya Naabhasa, active lifelong): ${sk.meaning}`,
      });
    }
  }

  // --- 2. Tapaswi Yoga (Saturn + Ketu + Venus linked by conjunction or Rasi/Graha aspect — PVR Ch. 13.5) ---
  const linksPair = (p1: PlanetId, p2: PlanetId): boolean => {
    const s1 = signOf(p1);
    const s2 = signOf(p2);
    if (s1 === s2) return true;
    if (getRasiDrishtiSigns(s1).includes(s2)) return true;
    const h1 = houseOf(p1);
    const h2 = houseOf(p2);
    return getGrahaDrishtiHouses(p1, h1).includes(h2) || getGrahaDrishtiHouses(p2, h2).includes(h1);
  };
  if (linksPair('saturn', 'ketu') && linksPair('saturn', 'venus') && linksPair('ketu', 'venus')) {
    found.push({
      id: 'yoga.tapaswi',
      name: 'Tapaswi Yoga',
      category: 'spiritual',
      planets: ['saturn', 'ketu', 'venus'],
      lifelong: false,
      summary: 'Tapaswi Yoga (Saturn-Ketu-Venus triad linked): confers single-minded devotion, deep research discipline, or austere mastery.',
    });
  }

  // --- 3. Raja Sambandha Yogas (AK + AmK / 10th Lord + AmK — PVR Ch. 11.8) ---
  const akEntry = karakas.find((k) => k.karaka === 'AK');
  const amkEntry = karakas.find((k) => k.karaka === 'AmK');
  const ak = akEntry?.graha.toLowerCase() as PlanetId | undefined;
  const amk = amkEntry?.graha.toLowerCase() as PlanetId | undefined;
  const lord10 = SIGN_LORDS[(lagnaIdx + 9) % 12]!;

  if (ak && amk && linksPair(ak, amk)) {
    found.push({
      id: 'yoga.raja_sambandha.ak_amk',
      name: 'AK-AmK Raja Sambandha Yoga',
      category: 'raja_sambandha',
      planets: [ak, amk],
      lifelong: false,
      summary: `Jaimini Raja Sambandha: Atmakaraka (${ak}) connects with Amatyakaraka (${amk}) — aligns soul purpose with executive authority and prominent mentors.`,
    });
  }
  if (amk && amk !== lord10 && linksPair(amk, lord10)) {
    found.push({
      id: 'yoga.raja_sambandha.amk_l10',
      name: 'AmK-10th Lord Career Raja Yoga',
      category: 'raja_sambandha',
      planets: [amk, lord10],
      lifelong: false,
      summary: `Career Raja Sambandha: Amatyakaraka (${amk}) links with 10th lord (${lord10}) — high professional visibility and access to decision-makers.`,
    });
  }

  // --- 4. Kalpadruma Yoga (PVR Chart 9: L1 -> Disp(L1) -> Disp2(D1) -> Disp2(D9) all in Kendra/Trikona/Exalt) ---
  const l1 = SIGN_LORDS[lagnaIdx]!;
  const disp1 = SIGN_LORDS[signOf(l1)]!;
  const disp2 = SIGN_LORDS[signOf(disp1)]!;
  const disp1D9Sign = d9Placements.find((p) => p.planet === disp1)?.signIndex;
  const disp2D9 = disp1D9Sign !== undefined ? SIGN_LORDS[disp1D9Sign]! : null;
  const qualifiesKalpa = (p: PlanetId) => {
    const h = houseOf(p);
    const d = natal.grahas[p].dignity;
    return KENDRAS.has(h) || TRIKONAS.has(h) || d === 'exalted';
  };
  if (disp2D9 && qualifiesKalpa(l1) && qualifiesKalpa(disp1) && qualifiesKalpa(disp2) && qualifiesKalpa(disp2D9)) {
    found.push({
      id: 'yoga.kalpadruma',
      name: 'Kalpadruma (Paarijaata) Yoga',
      category: 'raja',
      planets: Array.from(new Set([l1, disp1, disp2, disp2D9])),
      lifelong: false,
      summary: `Kalpadruma Yoga: Lagna lord (${l1}) and its D1/D9 dispositor chain (${disp1}, ${disp2}, ${disp2D9}) all occupy Kendras, Trines, or Exaltation — principled, enduring rise.`,
    });
  }

  return found;
}

const SAYANAADI_TABLE: Array<{ name: string; meaning: string }> = [
  { name: 'Sayana', meaning: 'Lying down / resting' },
  { name: 'Upavesana', meaning: 'Sitting down / settled' },
  { name: 'Netrapaani', meaning: 'Eyes & hands / observant' },
  { name: 'Prakaasana', meaning: 'Shining / radiant' },
  { name: 'Gamana', meaning: 'Moving / active' },
  { name: 'Aagamana', meaning: 'Returning / consolidating' },
  { name: 'Sabhaa', meaning: 'At an assembly / honored' },
  { name: 'Aagama', meaning: 'Acquiring / gaining' },
  { name: 'Bhojana', meaning: 'Eating / consuming' },
  { name: 'Nrityalipsaa', meaning: 'Urge to dance / expressive' },
  { name: 'Kautuka', meaning: 'Eager / delighted' },
  { name: 'Nidraa', meaning: 'Sleeping / quiet' },
];

/**
 * Computes Lajjitadi (6 states) & 12 Sayanaadi Avasthas with PVR p. 213 special house overrides.
 */
export function computeExtendedAvasthas(natal: NatalChart): ExtendedPlanetAvastha[] {
  const lagnaIdx = natal.lagna?.signIndex ?? 0;
  const moonNak1 = natal.grahas.moon.nakshatraIndex + 1; // 1..27
  const lagnaSign1 = lagnaIdx + 1; // 1..12

  // Compute running Ghati G = floor(minutes_since_sunrise / 24) + 1
  let ghati = 1;
  try {
    const dateStr = natal.time.birthLocal.slice(0, 10);
    const sunTimes = calculateSunTimes(dateStr, natal.place.lat, natal.place.lon, natal.time.tzId);
    const birthMs = Date.parse(natal.time.birthUtc || natal.time.birthLocal);
    let sunriseMs = Date.parse(sunTimes.sunriseIso);
    if (Number.isFinite(birthMs) && Number.isFinite(sunriseMs)) {
      if (birthMs < sunriseMs) {
        const prevDate = new Date(sunriseMs - 86400 * 1000).toISOString().slice(0, 10);
        const prevTimes = calculateSunTimes(prevDate, natal.place.lat, natal.place.lon, natal.time.tzId);
        sunriseMs = Date.parse(prevTimes.sunriseIso);
      }
      const mins = Math.max(0, (birthMs - sunriseMs) / 60000);
      ghati = Math.floor(mins / 24) + 1;
    }
  } catch {
    ghati = 1;
  }

  const pIndexMap: Record<PlanetId, number> = {
    sun: 1, moon: 2, mars: 3, mercury: 4, jupiter: 5, venus: 6, saturn: 7, rahu: 8, ketu: 9,
  };

  return PLANET_IDS.map((p) => {
    const g = natal.grahas[p];
    const h = houseFromSign(g.signIndex, lagnaIdx);
    const C = g.nakshatraIndex + 1; // 1..27
    const P = pIndexMap[p];
    const A = Math.min(9, Math.floor(g.degInSign / (30 / 9)) + 1); // 1..9 Navamsa part
    const raw = (C * P * A) + moonNak1 + ghati + lagnaSign1;
    const I = raw % 12 === 0 ? 12 : raw % 12;
    const sayInfo = SAYANAADI_TABLE[I - 1]!;

    // Lajjitadi 6 states
    const lajjitadi: string[] = [];
    const sameSignPlanets = PLANET_IDS.filter((other) => other !== p && natal.grahas[other].signIndex === g.signIndex);
    const hasMaleficConj = sameSignPlanets.some((o) => (NATURAL_MALEFICS as readonly string[]).includes(o));
    const hasBeneficConj = sameSignPlanets.some((o) => (NATURAL_BENEFICS as readonly string[]).includes(o));

    if (g.dignity === 'exalted' || g.dignity === 'moolatrikona') lajjitadi.push('Garvita (proud/capable)');
    if (h === 5 && sameSignPlanets.some((o) => ['sun', 'mars', 'saturn', 'rahu', 'ketu'].includes(o))) {
      lajjitadi.push('Lajjita (ashamed/5th-house malefic pressure)');
    }
    if ((g.dignity === 'enemy' || g.dignity === 'debilitated') && (hasMaleficConj || sameSignPlanets.includes('saturn'))) {
      lajjitadi.push('Kshudhita (hungry/starved of support)');
    }
    if (WATER_SIGNS.has(g.signIndex) && hasMaleficConj && !hasBeneficConj) {
      lajjitadi.push('Trishita (thirsty/restless)');
    }
    if ((g.dignity === 'friend' || g.dignity === 'own') && (sameSignPlanets.includes('jupiter') || hasBeneficConj)) {
      lajjitadi.push('Mudita (delighted/supported)');
    }
    if (p !== 'sun' && sameSignPlanets.includes('sun') && hasMaleficConj) {
      lajjitadi.push('Kshobhita (agitated by Sun + malefics)');
    }

    // Special Sayanaadi House Overrides (PVR p. 213 / Table 36)
    const isNatBenefic = (NATURAL_BENEFICS as readonly string[]).includes(p);
    const isOwnOrExalt = g.dignity === 'own' || g.dignity === 'exalted' || g.dignity === 'moolatrikona';
    let specialOverride: string | undefined;
    if ([4, 10, 11].includes(I) && (isNatBenefic || isOwnOrExalt) && [1, 5, 7, 10].includes(h)) {
      specialOverride = `${sayInfo.name} in H${h} activates a Sayanaadi Raja Yoga (shining/elevating house output)`;
    } else if (I === 9 && !isNatBenefic) {
      specialOverride = `Malefic in Bhojana Avastha (H${h}) can drain or disrupt H${h} affairs unless countered by benefics`;
    } else if ((I === 1 || I === 12) && !isNatBenefic && h === 5) {
      specialOverride = `Malefic resting (${sayInfo.name}) in H5 softens harshness into constructive output`;
    } else if ((I === 1 || I === 12) && !isNatBenefic && h === 8) {
      specialOverride = `Malefic in ${sayInfo.name} in H8 flags sudden vulnerability/caution during its period`;
    } else if (I === 7) {
      specialOverride = `Sabhaa Avastha confers scholarly/assembly honors and public respect`;
    }

    return {
      planet: p,
      lajjitadi,
      sayanaadiIndex: I,
      sayanaadiName: sayInfo.name,
      sayanaadiMeaning: sayInfo.meaning,
      ...(specialOverride ? { specialOverride } : {}),
    };
  });
}

/**
 * Rath's Tripod of Life (PVR Ch. 16.5.3) & Charak's Drekkana Dasha Timing (Ch. XV):
 * - MD judged from Sun (soul/broad theme), AD from Moon (mind), PD from Lagna (physical event).
 * - Planet's Drekkana (0-10° / 10-20° / 20-30°) indicates early / middle / late delivery within its Dasha.
 */
export function evaluateRathTripodAndDrekkana(
  natal: NatalChart,
  mdLord: PlanetId,
  adLord?: PlanetId,
  pdLord?: PlanetId,
): TripodAndDrekkanaNote {
  const mdG = natal.grahas[mdLord];
  const mdFromSun = houseFromSign(mdG.signIndex, natal.grahas.sun.signIndex);
  const mdDrekkanaTiming: TripodAndDrekkanaNote['mdDrekkanaTiming'] =
    mdG.degInSign < 10
      ? 'early third (0-10°)'
      : mdG.degInSign < 20
      ? 'middle third (10-20°)'
      : 'final third (20-30°)';

  const adFromMoon = adLord
    ? houseFromSign(natal.grahas[adLord].signIndex, natal.grahas.moon.signIndex)
    : undefined;
  const pdFromLagna = pdLord
    ? houseFromSign(natal.grahas[pdLord].signIndex, natal.lagna?.signIndex ?? 0)
    : undefined;

  const parts = [`Tripod: MD ${mdLord} is H${mdFromSun} from Sun (delivers strongest in ${mdDrekkanaTiming})`];
  if (adLord && adFromMoon) parts.push(`AD ${adLord} is H${adFromMoon} from Moon`);
  if (pdLord && pdFromLagna) parts.push(`PD ${pdLord} is H${pdFromLagna} from Lagna`);

  return {
    mdFromSun,
    ...(adFromMoon ? { adFromMoon } : {}),
    ...(pdFromLagna ? { pdFromLagna } : {}),
    mdDrekkanaTiming,
    summary: parts.join('; '),
  };
}
