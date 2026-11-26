import {
  calculateVargaSign,
  type NatalChart,
  type TajakaEntryChartResult,
  type VargaType,
  type VarshaphalResult,
} from '@astro/engine';
import { SIGN_IDS, SIGN_LORDS, type PlanetId } from '@astro/facts';
import {
  buildChartSignState,
  buildNarayanaSequence,
  computeRasiDasaDuration,
  resolveStrongerCoLord,
  resolveStrongerRasi,
} from './rasi-dashas-and-longevity.js';

function isoDateFromMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

// Speed order slowest -> fastest (PVR Ch. 29 / R-15)
const SPEED_ORDER: PlanetId[] = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];

// Deeptamsa aspect orbs in degrees (PVR Ch. 28.2)
const DEEPTAMSA_ORB: Record<PlanetId, number> = {
  sun: 15,
  moon: 12,
  mars: 8,
  mercury: 7,
  jupiter: 9,
  venus: 7,
  saturn: 9,
  rahu: 8,
  ketu: 8,
};

// Tajaka Aspect types by whole-sign distance (1..12)
type TajakaAspectKind = 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';

function getTajakaAspect(signA: number, signB: number): { kind: TajakaAspectKind; nature: 'benefic' | 'malefic' } | null {
  const dist = ((signB - signA + 12) % 12) + 1;
  if (dist === 1) return { kind: 'conjunction', nature: 'malefic' };
  if (dist === 5 || dist === 9) return { kind: 'trine', nature: 'benefic' };
  if (dist === 3 || dist === 11) return { kind: 'sextile', nature: 'benefic' };
  if (dist === 4 || dist === 10) return { kind: 'square', nature: 'malefic' };
  if (dist === 7) return { kind: 'opposition', nature: 'malefic' };
  return null;
}

export interface TajakaYogaEntry {
  id: string;
  type: 'ithasala_poorna' | 'ithasala_vartamana' | 'ithasala_bhavishya' | 'eesarpha' | 'kamboola' | 'manahoo' | 'ishkavala' | 'induvara';
  planets: PlanetId[];
  aspect?: TajakaAspectKind;
  orbDeg?: number;
  summary: string;
}

export interface PatyayiniPeriod {
  planet: string; // 'lagna' or PlanetId
  krisamsaDeg: number;
  patyamsaDeg: number;
  days: number;
  startIso: string;
  endIso: string;
}

export interface MuddaPeriod {
  lord: PlanetId;
  days: number;
  startIso: string;
  endIso: string;
}

export interface PanchaVargeeyaItem {
  planet: PlanetId;
  kshetra: number;
  uchcha: number;
  hadda: number;
  haddaLord: PlanetId;
  drekkana: number;
  navamsa: number;
  pvb: number;
  band: 'weak' | 'ordinary' | 'strong' | 'very_strong' | 'extraordinary';
  dvb: number; // Dwadasa Vargeeya Bala across D1..D12 (-12..+12)
}

export interface VarshaNarayanaPeriod {
  signIndex: number;
  sign: string;
  compressedYears: number;
  days: number;
  startIso: string;
  endIso: string;
  cycle: 1 | 2;
}

export interface TajakaExtendedAnalysis {
  yogas: TajakaYogaEntry[];
  sahamConfirmations: Array<{
    sahamId: string;
    sahamName: string;
    sahamLord: PlanetId;
    lagnaLord: PlanetId;
    status: 'confirmed_ithasala' | 'separating_eesarpha' | 'no_aspect';
    summary: string;
  }>;
  pvb: Record<string, PanchaVargeeyaItem>;
  pvbVarsheshwara: {
    lord: PlanetId;
    pvb: number;
    aspectToLagna: string;
    reason: string;
  };
  patyayini: PatyayiniPeriod[];
  mudda: MuddaPeriod[];
  varshaNarayana: {
    varga: VargaType;
    munthaSign: string;
    seedSign: string;
    periods: VarshaNarayanaPeriod[];
  };
}

export interface TajakaEntryExtendedAnalysis {
  yogas: TajakaYogaEntry[];
  sahamConfirmations: TajakaExtendedAnalysis['sahamConfirmations'];
  pvb: Record<string, PanchaVargeeyaItem>;
  pvbPeriodLord: {
    lord: PlanetId;
    pvb: number;
    aspectToLagna: string;
    reason: string;
  };
  patyayini: PatyayiniPeriod[];
}

/**
 * Evaluates Tajaka Ithasala (Poorna/Vartamana/Bhavishya), Eesarpha, Kamboola, Manahoo,
 * Ishkavala, Induvara, and Saham-Lagna Lord confirmations per PVR Ch. 29 (R-15).
 */
export function computeTajakaYogasForChart(
  chart: NatalChart,
  lagnaIdx: number,
  sahamsList?: Array<{ id: string; name: string; lord: string }>,
): {
  yogas: TajakaYogaEntry[];
  sahamConfirmations: TajakaExtendedAnalysis['sahamConfirmations'];
} {
  const yogas: TajakaYogaEntry[] = [];

  // 1. Ishkavala (all 7 planets in Kendras/Panapharas) vs Induvara (all in Apoklimas)
  const houses = SPEED_ORDER.map((p) => ((chart.grahas[p].signIndex - lagnaIdx + 12) % 12) + 1);
  if (houses.every((h) => ![3, 6, 9, 12].includes(h))) {
    yogas.push({
      id: 'tajaka.ishkavala',
      type: 'ishkavala',
      planets: [...SPEED_ORDER],
      summary: 'Ishkavala Yoga: all 7 planets occupy Kendras/Panapharas (Apoklimas empty) — strong momentum & prosperity.',
    });
  } else if (houses.every((h) => [3, 6, 9, 12].includes(h))) {
    yogas.push({
      id: 'tajaka.induvara',
      type: 'induvara',
      planets: [...SPEED_ORDER],
      summary: 'Induvara Yoga: all 7 planets occupy Apoklimas (3,6,9,12) — period requires patience and careful pacing.',
    });
  }

  // Pairwise Ithasala / Eesarpha matrix (slowerIdx < fasterIdx)
  const ithasalaPairs: Array<{ slower: PlanetId; faster: PlanetId; aspect: TajakaAspectKind; orb: number; subType: 'ithasala_poorna' | 'ithasala_vartamana' | 'ithasala_bhavishya' }> = [];
  const pairRelation = new Map<string, 'ithasala' | 'eesarpha'>();

  for (let i = 0; i < SPEED_ORDER.length; i++) {
    for (let j = i + 1; j < SPEED_ORDER.length; j++) {
      const slower = SPEED_ORDER[i]!;
      const faster = SPEED_ORDER[j]!;
      const gS = chart.grahas[slower];
      const gF = chart.grahas[faster];
      const asp = getTajakaAspect(gS.signIndex, gF.signIndex);
      if (!asp) continue;

      const avgOrb = (DEEPTAMSA_ORB[slower] + DEEPTAMSA_ORB[faster]) / 2;
      const degDiff = gS.degInSign - gF.degInSign;
      const absDiff = Math.abs(degDiff);

      // Retrograde exception (PVR Ch. 29.2.3)
      const isApplying = gF.retrograde ? degDiff < 0 : degDiff > 0;
      const key = [slower, faster].sort().join('-');

      if (isApplying && absDiff <= avgOrb + 1) {
        const subType: 'ithasala_poorna' | 'ithasala_vartamana' | 'ithasala_bhavishya' =
          absDiff <= 1 ? 'ithasala_poorna' : absDiff <= avgOrb ? 'ithasala_vartamana' : 'ithasala_bhavishya';
        ithasalaPairs.push({ slower, faster, aspect: asp.kind, orb: absDiff, subType });
        pairRelation.set(key, 'ithasala');

        const label =
          subType === 'ithasala_poorna'
            ? 'Poorna Ithasala (exact <=1° peak fulfillment)'
            : subType === 'ithasala_vartamana'
            ? 'Vartamana Ithasala (active applying fulfillment)'
            : 'Bhavishya Ithasala (approaching fulfillment)';
        yogas.push({
          id: `tajaka.ithasala.${faster}.${slower}`,
          type: subType,
          planets: [faster, slower],
          aspect: asp.kind,
          orbDeg: Number(absDiff.toFixed(2)),
          summary: `${label}: ${faster} (${gF.degInSign.toFixed(1)}°${gF.retrograde ? 'R' : ''}) -> ${slower} (${gS.degInSign.toFixed(1)}°) via ${asp.kind} (orb ${absDiff.toFixed(1)}°).`,
        });
      } else if (!isApplying && absDiff <= avgOrb) {
        pairRelation.set(key, 'eesarpha');
        yogas.push({
          id: `tajaka.eesarpha.${faster}.${slower}`,
          type: 'eesarpha',
          planets: [faster, slower],
          aspect: asp.kind,
          orbDeg: Number(absDiff.toFixed(2)),
          summary: `Eesarpha (separating aspect): ${faster} moves away from ${slower} via ${asp.kind} (orb ${absDiff.toFixed(1)}°) — momentum already passed.`,
        });
      }
    }
  }

  for (const ip of ithasalaPairs) {
    if (ip.faster !== 'moon' && ip.slower !== 'moon') {
      const k1 = ['moon', ip.faster].sort().join('-');
      const k2 = ['moon', ip.slower].sort().join('-');
      if (pairRelation.get(k1) === 'ithasala' || pairRelation.get(k2) === 'ithasala') {
        yogas.push({
          id: `tajaka.kamboola.${ip.faster}.${ip.slower}`,
          type: 'kamboola',
          planets: ['moon', ip.faster, ip.slower],
          summary: `Kamboola Yoga: Moon links into the ${ip.faster}-${ip.slower} Ithasala, amplifying material and emotional fruition.`,
        });
      }
    }

    for (const blocker of ['mars', 'saturn'] as const) {
      if (blocker === ip.faster || blocker === ip.slower) continue;
      const gB = chart.grahas[blocker];
      const gF = chart.grahas[ip.faster];
      if (gB.signIndex === gF.signIndex && Math.abs(gB.degInSign - gF.degInSign) <= DEEPTAMSA_ORB[blocker]) {
        yogas.push({
          id: `tajaka.manahoo.${blocker}.${ip.faster}.${ip.slower}`,
          type: 'manahoo',
          planets: [blocker, ip.faster, ip.slower],
          summary: `Manahoo Cancellation: ${blocker} closely conjoins ${ip.faster}, introducing sudden friction/delay into the ${ip.faster}-${ip.slower} Ithasala.`,
        });
      }
    }
  }

  const varshaLagnaLord = SIGN_LORDS[lagnaIdx]!;
  const prioritySahamIds = ['punya', 'karma', 'rajya', 'artha', 'vivaha', 'putra', 'vidya', 'paradesa'];
  const sahamConfirmations: TajakaExtendedAnalysis['sahamConfirmations'] = [];

  for (const sid of prioritySahamIds) {
    const saham = sahamsList?.find((s) => s.id === sid);
    if (!saham) continue;
    const sLord = saham.lord.toLowerCase() as PlanetId;
    if (sLord === varshaLagnaLord) {
      sahamConfirmations.push({
        sahamId: sid,
        sahamName: saham.name,
        sahamLord: sLord,
        lagnaLord: varshaLagnaLord,
        status: 'confirmed_ithasala',
        summary: `${saham.name} Saham lord IS Lagna lord (${varshaLagnaLord}) — direct self-driven activation.`,
      });
      continue;
    }
    const key = [varshaLagnaLord, sLord].sort().join('-');
    const rel = pairRelation.get(key);
    if (rel === 'ithasala') {
      sahamConfirmations.push({
        sahamId: sid,
        sahamName: saham.name,
        sahamLord: sLord,
        lagnaLord: varshaLagnaLord,
        status: 'confirmed_ithasala',
        summary: `${saham.name} Saham lord (${sLord}) forms Ithasala with Lagna lord (${varshaLagnaLord}) — strong fulfillment signal.`,
      });
    } else if (rel === 'eesarpha') {
      sahamConfirmations.push({
        sahamId: sid,
        sahamName: saham.name,
        sahamLord: sLord,
        lagnaLord: varshaLagnaLord,
        status: 'separating_eesarpha',
        summary: `${saham.name} Saham lord (${sLord}) is separating (Eesarpha) from Lagna lord (${varshaLagnaLord}) — weaker delivery.`,
      });
    }
  }

  return { yogas, sahamConfirmations };
}

export function computeTajakaYogas(varshaphal: VarshaphalResult): {
  yogas: TajakaYogaEntry[];
  sahamConfirmations: TajakaExtendedAnalysis['sahamConfirmations'];
} {
  return computeTajakaYogasForChart(
    varshaphal.annualChart,
    varshaphal.varshaLagnaSignIndex,
    varshaphal.sahamsList,
  );
}

export function computePatyayiniForWindow(
  chart: NatalChart,
  startUtc: string,
  windowDays: number,
): PatyayiniPeriod[] {
  const entries: Array<{ planet: string; deg: number }> = [
    { planet: 'lagna', deg: chart.lagna?.degInSign ?? 0 },
    ...SPEED_ORDER.map((p) => ({ planet: p, deg: chart.grahas[p].degInSign })),
  ];
  entries.sort((a, b) => a.deg - b.deg);

  const maxDeg = entries[entries.length - 1]?.deg || 30;
  let cursorMs = Date.parse(startUtc);
  const periods: PatyayiniPeriod[] = [];

  for (let i = 0; i < entries.length; i++) {
    const cur = entries[i]!;
    const prevDeg = i === 0 ? 0 : entries[i - 1]!.deg;
    const patyamsa = Math.max(0, cur.deg - prevDeg);
    const days = maxDeg > 0 ? (patyamsa / maxDeg) * windowDays : 0;
    const endMs = cursorMs + Math.round(days * 86400 * 1000);
    periods.push({
      planet: cur.planet,
      krisamsaDeg: Number(cur.deg.toFixed(2)),
      patyamsaDeg: Number(patyamsa.toFixed(2)),
      days: Number(days.toFixed(2)),
      startIso: isoDateFromMs(cursorMs),
      endIso: isoDateFromMs(endMs),
    });
    cursorMs = endMs;
  }

  return periods;
}

/**
 * Computes Patyayini Dasa for a Tajaka Solar Return year (PVR Ch. 30.1).
 */
export function computePatyayiniDasa(varshaphal: VarshaphalResult): PatyayiniPeriod[] {
  return computePatyayiniForWindow(varshaphal.annualChart, varshaphal.varshaPraveshUtc, 365.2425);
}

const VIM_ORDER: Array<{ lord: PlanetId; years: number }> = [
  { lord: 'ketu', years: 7 },
  { lord: 'venus', years: 20 },
  { lord: 'sun', years: 6 },
  { lord: 'moon', years: 10 },
  { lord: 'mars', years: 7 },
  { lord: 'rahu', years: 18 },
  { lord: 'jupiter', years: 16 },
  { lord: 'saturn', years: 19 },
  { lord: 'mercury', years: 17 },
];

/**
 * Computes Mudda Dasa (Varsha Vimshottari compressed to 1 solar year — PVR Ch. 30.2).
 * Start planet advances by completedAge steps from birth Vimshottari lord; balance uses natal Moon's remaining nakshatra fraction.
 */
export function computeMuddaDasa(natal: NatalChart, varshaphal: VarshaphalResult): MuddaPeriod[] {
  const birthNakIdx = natal.grahas.moon.nakshatraIndex; // 0..26
  const birthVimIdx = birthNakIdx % 9;
  const startIdx = (birthVimIdx + varshaphal.completedAge) % 9;
  const remFraction = Math.max(0, Math.min(1, 1 - natal.grahas.moon.elapsedInNakshatra));
  const yearDays = 365.2425;

  let cursorMs = Date.parse(varshaphal.varshaPraveshUtc);
  const periods: MuddaPeriod[] = [];

  for (let step = 0; step < 9; step++) {
    const entry = VIM_ORDER[(startIdx + step) % 9]!;
    const fullDays = (entry.years / 120) * yearDays;
    const days = step === 0 ? fullDays * remFraction : fullDays;
    const endMs = cursorMs + Math.round(days * 86400 * 1000);
    periods.push({
      lord: entry.lord,
      days: Number(days.toFixed(1)),
      startIso: isoDateFromMs(cursorMs),
      endIso: isoDateFromMs(endMs),
    });
    cursorMs = endMs;
  }

  // Remaining elapsed portion of the first planet closes the year
  const tailEntry = VIM_ORDER[startIdx]!;
  const tailDays = ((tailEntry.years / 120) * yearDays) * (1 - remFraction);
  if (tailDays >= 0.5) {
    const endMs = cursorMs + Math.round(tailDays * 86400 * 1000);
    periods.push({
      lord: tailEntry.lord,
      days: Number(tailDays.toFixed(1)),
      startIso: isoDateFromMs(cursorMs),
      endIso: isoDateFromMs(endMs),
    });
  }

  return periods;
}

// PVR Table 72: Hadda Lords (exact degree spans per sign, vedic_astro_textbook.pdf p. 378)
const HADDA_TABLE_72: Array<Array<{ maxDeg: number; lord: PlanetId }>> = [
  // 0 Aries
  [{ maxDeg: 6, lord: 'jupiter' }, { maxDeg: 12, lord: 'venus' }, { maxDeg: 20, lord: 'mercury' }, { maxDeg: 25, lord: 'mars' }, { maxDeg: 30, lord: 'saturn' }],
  // 1 Taurus
  [{ maxDeg: 8, lord: 'venus' }, { maxDeg: 14, lord: 'mercury' }, { maxDeg: 22, lord: 'jupiter' }, { maxDeg: 27, lord: 'saturn' }, { maxDeg: 30, lord: 'mars' }],
  // 2 Gemini
  [{ maxDeg: 6, lord: 'mercury' }, { maxDeg: 12, lord: 'venus' }, { maxDeg: 17, lord: 'jupiter' }, { maxDeg: 24, lord: 'mars' }, { maxDeg: 30, lord: 'saturn' }],
  // 3 Cancer
  [{ maxDeg: 7, lord: 'mars' }, { maxDeg: 13, lord: 'venus' }, { maxDeg: 19, lord: 'mercury' }, { maxDeg: 26, lord: 'jupiter' }, { maxDeg: 30, lord: 'saturn' }],
  // 4 Leo
  [{ maxDeg: 6, lord: 'jupiter' }, { maxDeg: 11, lord: 'venus' }, { maxDeg: 18, lord: 'saturn' }, { maxDeg: 24, lord: 'mercury' }, { maxDeg: 30, lord: 'mars' }],
  // 5 Virgo
  [{ maxDeg: 7, lord: 'mercury' }, { maxDeg: 17, lord: 'venus' }, { maxDeg: 21, lord: 'jupiter' }, { maxDeg: 28, lord: 'mars' }, { maxDeg: 30, lord: 'saturn' }],
  // 6 Libra
  [{ maxDeg: 6, lord: 'saturn' }, { maxDeg: 14, lord: 'mercury' }, { maxDeg: 21, lord: 'jupiter' }, { maxDeg: 28, lord: 'venus' }, { maxDeg: 30, lord: 'mars' }],
  // 7 Scorpio
  [{ maxDeg: 7, lord: 'mars' }, { maxDeg: 11, lord: 'venus' }, { maxDeg: 19, lord: 'mercury' }, { maxDeg: 24, lord: 'jupiter' }, { maxDeg: 30, lord: 'saturn' }],
  // 8 Sagittarius
  [{ maxDeg: 12, lord: 'jupiter' }, { maxDeg: 17, lord: 'venus' }, { maxDeg: 21, lord: 'mercury' }, { maxDeg: 26, lord: 'mars' }, { maxDeg: 30, lord: 'saturn' }],
  // 9 Capricorn
  [{ maxDeg: 7, lord: 'mercury' }, { maxDeg: 14, lord: 'jupiter' }, { maxDeg: 22, lord: 'venus' }, { maxDeg: 26, lord: 'saturn' }, { maxDeg: 30, lord: 'mars' }],
  // 10 Aquarius
  [{ maxDeg: 7, lord: 'mercury' }, { maxDeg: 13, lord: 'venus' }, { maxDeg: 20, lord: 'jupiter' }, { maxDeg: 25, lord: 'mars' }, { maxDeg: 30, lord: 'saturn' }],
  // 11 Pisces
  [{ maxDeg: 12, lord: 'venus' }, { maxDeg: 16, lord: 'jupiter' }, { maxDeg: 19, lord: 'mercury' }, { maxDeg: 28, lord: 'mars' }, { maxDeg: 30, lord: 'saturn' }],
];

// Deep debilitation longitudes (180° opposite deep exaltation, PVR Ch. 28.4.2)
const DEEP_DEBIL_LON: Record<string, number> = {
  sun: 190,     // 10° Libra
  moon: 213,    // 3° Scorpio
  mars: 118,    // 28° Cancer
  mercury: 345, // 15° Pisces
  jupiter: 275, // 5° Capricorn
  venus: 177,   // 27° Virgo
  saturn: 20,   // 20° Aries
};

const EXALT_SIGN_7: Record<string, number> = {
  sun: 0, moon: 1, mars: 9, mercury: 5, jupiter: 3, venus: 11, saturn: 6,
};
const DEBIL_SIGN_7: Record<string, number> = {
  sun: 6, moon: 7, mars: 3, mercury: 11, jupiter: 9, venus: 5, saturn: 0,
};

// Natural planetary relationships (Parashara / Tajaka)
const NATURAL_FRIENDS: Record<string, Set<PlanetId>> = {
  sun: new Set(['moon', 'mars', 'jupiter']),
  moon: new Set(['sun', 'mercury']),
  mars: new Set(['sun', 'moon', 'jupiter']),
  mercury: new Set(['sun', 'venus']),
  jupiter: new Set(['sun', 'moon', 'mars']),
  venus: new Set(['mercury', 'saturn']),
  saturn: new Set(['mercury', 'venus']),
};
const NATURAL_ENEMIES: Record<string, Set<PlanetId>> = {
  sun: new Set(['venus', 'saturn']),
  moon: new Set([]),
  mars: new Set(['mercury']),
  mercury: new Set(['moon']),
  jupiter: new Set(['mercury', 'venus']),
  venus: new Set(['sun', 'moon']),
  saturn: new Set(['sun', 'moon', 'mars']),
};

const DVB_VARGAS: VargaType[] = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12'];

export function getHaddaLord(signIndex: number, degInSign: number): PlanetId {
  const spans = HADDA_TABLE_72[((signIndex % 12) + 12) % 12]!;
  for (const s of spans) {
    if (degInSign < s.maxDeg) return s.lord;
  }
  return spans[spans.length - 1]!.lord;
}

/**
 * Evaluates 5-fold compound relationship between planet and a dispositor/hadda lord
 * in the Tajaka chart and returns the PVB score tier (own = 1.0, friend = 0.5, neutral = 0.375, enemy = 0.25).
 */
function tajakaRelationMultiplier(
  chart: NatalChart,
  planet: PlanetId,
  lord: PlanetId,
): { mult: number; tier: 'own' | 'friend' | 'neutral' | 'enemy' } {
  if (planet === lord) return { mult: 1.0, tier: 'own' };
  const nat = NATURAL_FRIENDS[planet]?.has(lord)
    ? 1
    : NATURAL_ENEMIES[planet]?.has(lord)
    ? -1
    : 0;
  const dist = ((chart.grahas[lord].signIndex - chart.grahas[planet].signIndex + 12) % 12) + 1;
  const temp = [2, 3, 4, 10, 11, 12].includes(dist) ? 1 : -1;
  const sum = nat + temp;
  if (sum >= 1) return { mult: 0.5, tier: 'friend' };
  if (sum === 0) return { mult: 0.375, tier: 'neutral' };
  return { mult: 0.25, tier: 'enemy' };
}

/**
 * Computes Pancha Vargeeya Bala (PVB, PVR Ch. 28.4) and Dwadasa Vargeeya Bala (DVB across D1..D12, Ch. 28.5)
 * for the 7 classical planets in any Tajaka chart (Annual, Monthly, or 60-Hour).
 */
export function computePanchaVargeeyaBala(chart: NatalChart): Record<string, PanchaVargeeyaItem> {
  const out: Record<string, PanchaVargeeyaItem> = {};

  for (const p of SPEED_ORDER) {
    const g = chart.grahas[p];
    const rasiLord = SIGN_LORDS[g.signIndex]!;
    const kshetra = Number((30 * tajakaRelationMultiplier(chart, p, rasiLord).mult).toFixed(2));

    // Uchcha Bala: arc from deep debilitation / 180 * 20
    const debilLon = DEEP_DEBIL_LON[p]!;
    let arc = Math.abs(g.lon - debilLon) % 360;
    if (arc > 180) arc = 360 - arc;
    const uchcha = Number(((arc / 180) * 20).toFixed(2));

    const haddaLord = getHaddaLord(g.signIndex, g.degInSign);
    const hadda = Number((15 * tajakaRelationMultiplier(chart, p, haddaLord).mult).toFixed(2));

    const d3Sign = calculateVargaSign(g.lon, 'D3');
    const drekkana = Number((10 * tajakaRelationMultiplier(chart, p, SIGN_LORDS[d3Sign]!).mult).toFixed(2));

    const d9Sign = calculateVargaSign(g.lon, 'D9');
    const navamsa = Number((5 * tajakaRelationMultiplier(chart, p, SIGN_LORDS[d9Sign]!).mult).toFixed(2));

    const pvb = Number(((kshetra + uchcha + hadda + drekkana + navamsa) / 4).toFixed(2));
    const band: PanchaVargeeyaItem['band'] =
      pvb < 5
        ? 'weak'
        : pvb < 10
        ? 'ordinary'
        : pvb < 15
        ? 'strong'
        : pvb <= 20
        ? 'very_strong'
        : 'extraordinary';

    // Dwadasa Vargeeya Bala (D1..D12)
    let strongCnt = 0;
    let weakCnt = 0;
    for (const v of DVB_VARGAS) {
      const s = v === 'D1' ? g.signIndex : calculateVargaSign(g.lon, v);
      const lord = SIGN_LORDS[s]!;
      if (EXALT_SIGN_7[p] === s || lord === p || NATURAL_FRIENDS[p]?.has(lord)) {
        strongCnt++;
      } else if (DEBIL_SIGN_7[p] === s || NATURAL_ENEMIES[p]?.has(lord)) {
        weakCnt++;
      }
    }

    out[p] = {
      planet: p,
      kshetra,
      uchcha,
      hadda,
      haddaLord,
      drekkana,
      navamsa,
      pvb,
      band,
      dvb: strongCnt - weakCnt,
    };
  }

  return out;
}

/**
 * Selects Varsheshwara (or Lord of the Month) per PVR Ch. 28.6–28.7 using Pancha Vargeeya Bala:
 * 1. Shortlist candidates casting a BENEFIC Tajaka aspect (3/11, 5/9) on Entry Lagna -> highest PVB.
 * 2. Fallback: candidates casting a MALEFIC aspect (1, 4, 7, 10) -> highest PVB.
 * 3. Fallback: Dina/Ratri-Pati (Candidate 1).
 */
export function selectPvbVarsheshwara(
  chart: NatalChart,
  lagnaIdx: number,
  candidates: string[],
  pvbMap: Record<string, PanchaVargeeyaItem>,
): { lord: PlanetId; pvb: number; aspectToLagna: string; reason: string } {
  const counts = new Map<PlanetId, number>();
  const ordered: PlanetId[] = [];
  for (const raw of candidates) {
    const p = raw.toLowerCase() as PlanetId;
    if (!pvbMap[p]) continue;
    counts.set(p, (counts.get(p) ?? 0) + 1);
    if (!ordered.includes(p)) ordered.push(p);
  }

  const beneficPool: Array<{ p: PlanetId; aspect: string; pvb: number; freq: number }> = [];
  const maleficPool: Array<{ p: PlanetId; aspect: string; pvb: number; freq: number }> = [];

  for (const p of ordered) {
    const asp = getTajakaAspect(chart.grahas[p].signIndex, lagnaIdx);
    const pvb = pvbMap[p]?.pvb ?? 0;
    const freq = counts.get(p) ?? 1;
    if (!asp) continue;
    if (asp.nature === 'benefic') {
      beneficPool.push({ p, aspect: asp.kind, pvb, freq });
    } else {
      maleficPool.push({ p, aspect: asp.kind, pvb, freq });
    }
  }

  const sortByPvb = (a: { pvb: number; freq: number }, b: { pvb: number; freq: number }) =>
    b.pvb !== a.pvb ? b.pvb - a.pvb : b.freq - a.freq;

  if (beneficPool.length > 0) {
    beneficPool.sort(sortByPvb);
    const w = beneficPool[0]!;
    return {
      lord: w.p,
      pvb: w.pvb,
      aspectToLagna: `${w.aspect} (benefic)`,
      reason: `${w.p.toUpperCase()} has benefic ${w.aspect} aspect to Lagna with highest PVB (${w.pvb}, ${pvbMap[w.p]!.band}).`,
    };
  }

  if (maleficPool.length > 0) {
    maleficPool.sort(sortByPvb);
    const w = maleficPool[0]!;
    return {
      lord: w.p,
      pvb: w.pvb,
      aspectToLagna: `${w.aspect} (malefic)`,
      reason: `No benefic-aspecting candidate; ${w.p.toUpperCase()} leads malefic-aspecting pool (${w.aspect}) with PVB ${w.pvb}.`,
    };
  }

  const fallback = ordered[0] ?? 'sun';
  return {
    lord: fallback,
    pvb: pvbMap[fallback]?.pvb ?? 0,
    aspectToLagna: 'none',
    reason: `No candidate aspects Lagna; defaulted to ${fallback.toUpperCase()} (PVB ${pvbMap[fallback]?.pvb ?? 0}).`,
  };
}

/**
 * Computes Varsha Narayana Dasa (PVR Ch. 30.4 — "best dasa for Tajaka annual charts"):
 * Compresses 120 years -> 365.2425 days (3.0437 days/yr), replacing Annual Lagna with Muntha
 * as the virtual Lagna in D1 or any domain Varga (D4, D9, D10, D24).
 */
export function computeVarshaNarayanaDasa(
  varshaphal: VarshaphalResult,
  varga: VargaType = 'D1',
): TajakaExtendedAnalysis['varshaNarayana'] {
  const chart = varshaphal.annualChart;
  const state = buildChartSignState(chart, varga);
  let virtualLagna = varshaphal.munthaSignIndex;

  if (varga !== 'D1') {
    const n = Number(varga.replace(/\D/g, '')) || 1;
    const seedHouse = ((n - 1) % 12) + 1;
    const refSignInD1 = (varshaphal.munthaSignIndex + seedHouse - 1) % 12;
    const d1State = buildChartSignState(chart, 'D1');
    const refLord = resolveStrongerCoLord(d1State, refSignInD1, true);
    virtualLagna = state.planetSigns[refLord];
  }

  const seventh = (virtualLagna + 6) % 12;
  const seedSign = resolveStrongerRasi(state, virtualLagna, seventh);
  const seq = buildNarayanaSequence(state, seedSign);

  const totalYearDays = 365.2425;
  const daysPerYear = totalYearDays / 120;
  let cursorMs = Date.parse(varshaphal.varshaPraveshUtc);
  let remainingDays = totalYearDays;
  const periods: VarshaNarayanaPeriod[] = [];

  const cycle1Years: number[] = [];
  for (const sIdx of seq) {
    const yrs = computeRasiDasaDuration(state, sIdx);
    cycle1Years.push(yrs);
    const rawDays = yrs * daysPerYear;
    const days = Math.min(remainingDays, rawDays);
    if (days <= 0.01) continue;
    const endMs = cursorMs + Math.round(days * 86400 * 1000);
    periods.push({
      signIndex: sIdx,
      sign: SIGN_IDS[sIdx]!,
      compressedYears: yrs,
      days: Number(days.toFixed(1)),
      startIso: isoDateFromMs(cursorMs),
      endIso: isoDateFromMs(endMs),
      cycle: 1,
    });
    cursorMs = endMs;
    remainingDays -= days;
    if (remainingDays <= 0.05) break;
  }

  // Cycle 2 finishes the remainder of the 120-year (= 365.2425-day) solar return year
  if (remainingDays > 0.05) {
    for (let i = 0; i < seq.length && remainingDays > 0.05; i++) {
      const sIdx = seq[i]!;
      const remYrs = Math.max(0, 12 - cycle1Years[i]!);
      if (remYrs <= 0) continue;
      const days = Math.min(remainingDays, remYrs * daysPerYear);
      const endMs = cursorMs + Math.round(days * 86400 * 1000);
      periods.push({
        signIndex: sIdx,
        sign: SIGN_IDS[sIdx]!,
        compressedYears: remYrs,
        days: Number(days.toFixed(1)),
        startIso: isoDateFromMs(cursorMs),
        endIso: isoDateFromMs(endMs),
        cycle: 2,
      });
      cursorMs = endMs;
      remainingDays -= days;
    }
  }

  return {
    varga,
    munthaSign: SIGN_IDS[varshaphal.munthaSignIndex]!,
    seedSign: SIGN_IDS[seedSign]!,
    periods,
  };
}

export function computeTajakaExtended(
  natal: NatalChart,
  varshaphal: VarshaphalResult,
  varshaNarayanaVarga: VargaType = 'D1',
): TajakaExtendedAnalysis {
  const { yogas, sahamConfirmations } = computeTajakaYogas(varshaphal);
  const pvb = computePanchaVargeeyaBala(varshaphal.annualChart);
  const p = varshaphal.panchadhikari;
  const pvbVarsheshwara = selectPvbVarsheshwara(
    varshaphal.annualChart,
    varshaphal.varshaLagnaSignIndex,
    [p.dinaRatriPati, p.janmaLagnesha, p.munthaLord, p.varshaLagnesha, p.triRasheesha],
    pvb,
  );
  const patyayini = computePatyayiniDasa(varshaphal);
  const mudda = computeMuddaDasa(natal, varshaphal);
  const varshaNarayana = computeVarshaNarayanaDasa(varshaphal, varshaNarayanaVarga);
  return { yogas, sahamConfirmations, pvb, pvbVarsheshwara, patyayini, mudda, varshaNarayana };
}

/**
 * Full Tajaka extended analysis (Yogas, Sahams, PVB/DVB, PVB-ranked Period Lord, compressed Patyayini)
 * for Monthly (Maasa Pravesh) or 60-Hour (Shashti-Hora) Tajaka entry charts.
 */
export function computeTajakaEntryAnalysis(entry: TajakaEntryChartResult): TajakaEntryExtendedAnalysis {
  const { yogas, sahamConfirmations } = computeTajakaYogasForChart(
    entry.entryChart,
    entry.entryLagnaSignIndex,
    entry.sahamsList,
  );
  const pvb = computePanchaVargeeyaBala(entry.entryChart);
  const p = entry.panchadhikari;
  const candidates = [
    p.dinaRatriPati,
    p.janmaLagnesha,
    p.munthaLord,
    p.varshaLagnesha,
    p.triRasheesha,
    ...(p.varsheshwara ? [p.varsheshwara] : []),
  ];
  const pvbPeriodLord = selectPvbVarsheshwara(entry.entryChart, entry.entryLagnaSignIndex, candidates, pvb);
  const patyayini = computePatyayiniForWindow(entry.entryChart, entry.entryUtc, entry.durationDays);
  return { yogas, sahamConfirmations, pvb, pvbPeriodLord, patyayini };
}
