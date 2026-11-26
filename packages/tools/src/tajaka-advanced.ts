import { calculateVargaSign, computeAnnualSahams, type NatalChart, type VarshaphalResult } from '@astro/engine';
import { PLANET_IDS, SIGN_IDS, SIGN_LORDS, type PlanetId } from '@astro/facts';
import {
  getHaddaLord,
  type PanchaVargeeyaItem,
  type TajakaYogaEntry,
} from './tajaka-analysis.js';

const CLASSICAL_7: PlanetId[] = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];
const NATURAL_MALEFICS = new Set<PlanetId>(['saturn', 'mars', 'rahu', 'ketu', 'sun']);
const NATURAL_BENEFICS = new Set<PlanetId>(['jupiter', 'venus', 'mercury', 'moon']);
const DUSTHANAS = new Set([6, 8, 12]);
const KENDRA_TRIKONA = new Set([1, 4, 5, 7, 9, 10]);

const EXALT_SIGN_7: Record<string, number> = {
  sun: 0, moon: 1, mars: 9, mercury: 5, jupiter: 3, venus: 11, saturn: 6,
};
const DEBIL_SIGN_7: Record<string, number> = {
  sun: 6, moon: 7, mars: 3, mercury: 11, jupiter: 9, venus: 5, saturn: 0,
};
const DEEP_DEBIL_LON: Record<string, number> = {
  sun: 190, moon: 213, mars: 118, mercury: 345, jupiter: 275, venus: 177, saturn: 20,
};
const DEEPTAMSA_ORB: Record<string, number> = {
  sun: 15, moon: 12, mars: 8, mercury: 7, jupiter: 9, venus: 7, saturn: 9,
};

// Table 20B: Tajaka Sequential Drekkana Lords (Chaldean sequence across 36 drekkanas)
const CHALDEAN_7: PlanetId[] = ['mars', 'sun', 'venus', 'mercury', 'moon', 'saturn', 'jupiter'];

export function getTajakaSequentialDrekkanaLord(signIndex: number, degInSign: number): PlanetId {
  const d = Math.min(2, Math.floor(degInSign / 10));
  return CHALDEAN_7[(signIndex * 3 + d) % 7]!;
}

// Tri-Pataki 3x3 Flag Grid Vedha Map (house 1..12 from Annual Lagna -> 3 Vedha houses: 1 straight + 2 diagonals)
// Verified against J.L. Nehru 1946-47 (R-20 Sec. 6): H10->H1; H2 & H8 -> H9.
const TRI_PATAKI_VEDHA_HOUSES: Record<number, [number, number, number]> = {
  1: [4, 7, 10],
  2: [3, 6, 9],
  3: [2, 8, 11],
  4: [1, 7, 10],
  5: [6, 9, 12],
  6: [2, 5, 11],
  7: [1, 4, 10],
  8: [3, 9, 12],
  9: [2, 5, 8],
  10: [1, 4, 7],
  11: [3, 6, 12],
  12: [5, 8, 11],
};

// Table 20A: Tri-Pataki Chakra — Vedha on Moon Effects (M.S. Mehta Ch. X, p. 184-185)
const TRI_PATAKI_MOON_VEDHA_EFFECTS: Record<PlanetId, { tone: 'benefic' | 'malefic' | 'mixed'; effect: string }> = {
  sun: { tone: 'malefic', effect: 'Lack of confidence, ill fame, eye strain, trouble to father, disappointments' },
  moon: { tone: 'benefic', effect: 'Self-resonance, heightened emotional visibility' },
  mars: { tone: 'malefic', effect: 'Quarrels, strife, accidents, fear of enemies/weapons, blood/heat issues' },
  mercury: { tone: 'mixed', effect: 'Mental tension/worries, over-analysis, petty friction with rivals' },
  jupiter: { tone: 'benefic', effect: 'Generosity, social uplift, dharmic merit, children, promotion in service' },
  venus: { tone: 'benefic', effect: 'Artistic refinement, comforts, vitality, wealth, fame, defeat of rivals' },
  saturn: { tone: 'malefic', effect: 'Diseases, delays/scarcity, separation, windy ailments, restriction' },
  rahu: { tone: 'malefic', effect: 'Suffering, reputational strain, difficult/unusual ailments' },
  ketu: { tone: 'malefic', effect: 'Instability, psychic distress, wandering, gastric trouble, sorrow' },
};

function isoDateFromMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function houseDist(fromSign: number, toSign: number): number {
  return ((toSign - fromSign + 12) % 12) + 1;
}

function tajakaAspectKind(signA: number, signB: number): { kind: string; nature: 'benefic' | 'malefic' } | null {
  const d = houseDist(signA, signB);
  if (d === 1) return { kind: 'conjunction', nature: 'malefic' };
  if (d === 5 || d === 9) return { kind: 'trine', nature: 'benefic' };
  if (d === 3 || d === 11) return { kind: 'sextile', nature: 'benefic' };
  if (d === 4 || d === 10) return { kind: 'square', nature: 'malefic' };
  if (d === 7) return { kind: 'opposition', nature: 'malefic' };
  return null;
}

// --- 1. Tri-Pataki Chakra Engine (R-20 Sec. 2.1 + Table 20A) ---

export interface TriPatakiProjection {
  planet: PlanetId;
  birthSign: string;
  projectedSignIndex: number;
  projectedSign: string;
  houseFromAnnualLagna: number;
  modulusUsed: string;
}

export interface TriPatakiVedhaHit {
  planet: PlanetId;
  fromSign: string;
  fromHouse: number;
  tone: 'benefic' | 'malefic' | 'mixed';
  effect: string;
}

export interface TriPatakiResult {
  runningYear: number;
  annualLagnaSign: string;
  projections: TriPatakiProjection[];
  lagnaVedha: TriPatakiVedhaHit[];
  moonHouseInTriPataki: number;
  moonSignInTriPataki: string;
  moonVedha: TriPatakiVedhaHit[];
  summary: string;
}

export function computeTriPatakiFromSigns(
  birthPlanetSigns: Record<PlanetId, number>,
  annualLagnaSignIndex: number,
  completedAge: number,
): TriPatakiResult {
  const runningYear = Math.max(1, completedAge + 1);
  const projections: TriPatakiProjection[] = [];

  for (const p of PLANET_IDS) {
    const birthSignIdx = birthPlanetSigns[p];
    let step: number;
    let reverse = false;
    let modLabel: string;

    if (p === 'moon') {
      step = runningYear % 9 || 9;
      modLabel = `Y mod 9 = ${step} (fwd)`;
    } else if (p === 'mars') {
      step = runningYear % 6 || 6;
      modLabel = `Y mod 6 = ${step} (fwd)`;
    } else if (p === 'rahu' || p === 'ketu') {
      step = runningYear % 6 || 6;
      reverse = true;
      modLabel = `Y mod 6 = ${step} (rev)`;
    } else {
      step = runningYear % 4 || 4;
      modLabel = `Y mod 4 = ${step} (fwd)`;
    }

    // Inclusive counting: step 1 stays in birthSignIdx; step k shifts by (k - 1)
    const offset = step - 1;
    const projectedSignIndex = reverse
      ? (((birthSignIdx - offset) % 12) + 12) % 12
      : (birthSignIdx + offset) % 12;
    const h = houseDist(annualLagnaSignIndex, projectedSignIndex);

    projections.push({
      planet: p,
      birthSign: SIGN_IDS[birthSignIdx]!,
      projectedSignIndex,
      projectedSign: SIGN_IDS[projectedSignIndex]!,
      houseFromAnnualLagna: h,
      modulusUsed: modLabel,
    });
  }

  const byHouse = new Map<number, TriPatakiProjection[]>();
  for (const pr of projections) {
    const list = byHouse.get(pr.houseFromAnnualLagna) ?? [];
    list.push(pr);
    byHouse.set(pr.houseFromAnnualLagna, list);
  }

  const lagnaVedhaHouses = TRI_PATAKI_VEDHA_HOUSES[1]!;
  const lagnaVedha: TriPatakiVedhaHit[] = [];
  for (const vh of lagnaVedhaHouses) {
    for (const pr of byHouse.get(vh) ?? []) {
      const meta = TRI_PATAKI_MOON_VEDHA_EFFECTS[pr.planet];
      lagnaVedha.push({
        planet: pr.planet,
        fromSign: pr.projectedSign,
        fromHouse: vh,
        tone: meta.tone,
        effect: `${pr.planet} pierces Annual Lagna from H${vh} (${pr.projectedSign})`,
      });
    }
  }

  const moonProj = projections.find((p) => p.planet === 'moon')!;
  const moonVedhaHouses = TRI_PATAKI_VEDHA_HOUSES[moonProj.houseFromAnnualLagna]!;
  const moonVedha: TriPatakiVedhaHit[] = [];
  for (const vh of moonVedhaHouses) {
    for (const pr of byHouse.get(vh) ?? []) {
      if (pr.planet === 'moon') continue;
      const meta = TRI_PATAKI_MOON_VEDHA_EFFECTS[pr.planet];
      moonVedha.push({
        planet: pr.planet,
        fromSign: pr.projectedSign,
        fromHouse: vh,
        tone: meta.tone,
        effect: meta.effect,
      });
    }
  }

  const lagnaDesc = lagnaVedha.length
    ? lagnaVedha.map((v) => `${v.planet}(${v.tone})`).join(', ')
    : 'unobstructed';
  const moonDesc = moonVedha.length
    ? moonVedha.map((v) => `${v.planet}(${v.tone})`).join(', ')
    : 'unobstructed';

  return {
    runningYear,
    annualLagnaSign: SIGN_IDS[annualLagnaSignIndex]!,
    projections,
    lagnaVedha,
    moonHouseInTriPataki: moonProj.houseFromAnnualLagna,
    moonSignInTriPataki: moonProj.projectedSign,
    moonVedha,
    summary: `Tri-Pataki (Running Yr ${runningYear}, Lagna ${SIGN_IDS[annualLagnaSignIndex]}): Lagna Vedha=[${lagnaDesc}]; Moon in ${moonProj.projectedSign} (H${moonProj.houseFromAnnualLagna}) Vedha=[${moonDesc}].`,
  };
}

export function computeTriPatakiChakra(natal: NatalChart, varshaphal: VarshaphalResult): TriPatakiResult {
  const birthSigns = {} as Record<PlanetId, number>;
  for (const p of PLANET_IDS) {
    birthSigns[p] = natal.grahas[p].signIndex;
  }
  return computeTriPatakiFromSigns(birthSigns, varshaphal.varshaLagnaSignIndex, varshaphal.completedAge);
}

// --- 2. Annual Yogini Dasa (360-Day Cycle — R-20 Sec. 2.5) ---

const ANNUAL_YOGINI_SEQ: Array<{ name: string; lord: PlanetId; solarDays: number }> = [
  { name: 'Mangala', lord: 'moon', solarDays: 10 },
  { name: 'Pingala', lord: 'sun', solarDays: 20 },
  { name: 'Dhanya', lord: 'jupiter', solarDays: 30 },
  { name: 'Bhramari', lord: 'mars', solarDays: 40 },
  { name: 'Bhadrika', lord: 'mercury', solarDays: 50 },
  { name: 'Ulka', lord: 'saturn', solarDays: 60 },
  { name: 'Siddha', lord: 'venus', solarDays: 70 },
  { name: 'Sankata', lord: 'rahu', solarDays: 80 },
];

export interface AnnualYoginiPeriod {
  yogini: string;
  lord: PlanetId;
  days: number;
  startIso: string;
  endIso: string;
}

export function computeAnnualYoginiDasa(natal: NatalChart, varshaphal: VarshaphalResult): AnnualYoginiPeriod[] {
  const birthNak1To27 = natal.grahas.moon.nakshatraIndex + 1; // 1..27
  const rawIdx = (varshaphal.completedAge + birthNak1To27 + 3) % 8;
  const startIdx = rawIdx === 0 ? 7 : rawIdx - 1; // 0..7
  const remFraction = Math.max(0, Math.min(1, 1 - natal.grahas.moon.elapsedInNakshatra));
  const scale = 365.2425 / 360;

  let cursorMs = Date.parse(varshaphal.varshaPraveshUtc);
  const periods: AnnualYoginiPeriod[] = [];

  for (let step = 0; step < 8; step++) {
    const entry = ANNUAL_YOGINI_SEQ[(startIdx + step) % 8]!;
    const fullDays = entry.solarDays * scale;
    const days = step === 0 ? fullDays * remFraction : fullDays;
    const endMs = cursorMs + Math.round(days * 86400 * 1000);
    periods.push({
      yogini: entry.name,
      lord: entry.lord,
      days: Number(days.toFixed(1)),
      startIso: isoDateFromMs(cursorMs),
      endIso: isoDateFromMs(endMs),
    });
    cursorMs = endMs;
  }

  // Remaining elapsed portion of starting Yogini closes the solar year
  const tail = ANNUAL_YOGINI_SEQ[startIdx]!;
  const tailDays = tail.solarDays * scale * (1 - remFraction);
  if (tailDays >= 0.5) {
    const endMs = cursorMs + Math.round(tailDays * 86400 * 1000);
    periods.push({
      yogini: tail.name,
      lord: tail.lord,
      days: Number(tailDays.toFixed(1)),
      startIso: isoDateFromMs(cursorMs),
      endIso: isoDateFromMs(endMs),
    });
  }

  return periods;
}

// --- 3. Neelakantha / M.S. Mehta 4-Tier Aspect-Based PVB & Moon-Disqualified Varsheshwara (R-20 Sec. 2.3-2.4) ---

export interface NeelakanthaPvbItem {
  planet: PlanetId;
  kshetra: number;
  uchcha: number;
  hadda: number;
  drekkana: number;
  drekkanaLord: PlanetId;
  navamsa: number;
  vishwaBala: number; // Total / 4
  band: 'Alpa/Nirbal' | 'Madhya Bali' | 'Poorna Bali' | 'Prakarmi';
}

/**
 * Aspect-based Tajaka friendship (R-20 Sec. 2.4.1):
 * Own = 1.0; 5/9 or 3/11 = Friend (0.75); 2/12 or 6/8 = Neutral (0.50); 1, 4, 7, 10 = Enemy (0.25).
 */
function neelakanthaRelationMult(chart: NatalChart, planet: PlanetId, lord: PlanetId): number {
  if (planet === lord) return 1.0;
  const dist = houseDist(chart.grahas[planet].signIndex, chart.grahas[lord].signIndex);
  if (dist === 5 || dist === 9 || dist === 3 || dist === 11) return 0.75; // Friend
  if (dist === 2 || dist === 12 || dist === 6 || dist === 8) return 0.5; // Neutral
  return 0.25; // Enemy (1, 4, 7, 10)
}

export function computeNeelakanthaPvb(chart: NatalChart): Record<string, NeelakanthaPvbItem> {
  const out: Record<string, NeelakanthaPvbItem> = {};
  for (const p of CLASSICAL_7) {
    const g = chart.grahas[p];
    const kshetra = Number((30 * neelakanthaRelationMult(chart, p, SIGN_LORDS[g.signIndex]!)).toFixed(2));

    let arc = Math.abs(g.lon - DEEP_DEBIL_LON[p]!) % 360;
    if (arc > 180) arc = 360 - arc;
    const uchcha = Number(((arc / 180) * 20).toFixed(2));

    const haddaLord = getHaddaLord(g.signIndex, g.degInSign);
    const hadda = Number((15 * neelakanthaRelationMult(chart, p, haddaLord)).toFixed(2));

    // Table 20B: Tajaka Sequential Drekkana Lord (NOT Parashari D3)
    const drekkanaLord = getTajakaSequentialDrekkanaLord(g.signIndex, g.degInSign);
    const drekkana = Number((10 * neelakanthaRelationMult(chart, p, drekkanaLord)).toFixed(2));

    const d9Sign = calculateVargaSign(g.lon, 'D9');
    const navamsa = Number((5 * neelakanthaRelationMult(chart, p, SIGN_LORDS[d9Sign]!)).toFixed(2));

    const vishwaBala = Number(((kshetra + uchcha + hadda + drekkana + navamsa) / 4).toFixed(2));
    const band: NeelakanthaPvbItem['band'] =
      vishwaBala > 15
        ? 'Prakarmi'
        : vishwaBala >= 10
        ? 'Poorna Bali'
        : vishwaBala >= 5
        ? 'Madhya Bali'
        : 'Alpa/Nirbal';

    out[p] = {
      planet: p,
      kshetra,
      uchcha,
      hadda,
      drekkana,
      drekkanaLord,
      navamsa,
      vishwaBala,
      band,
    };
  }
  return out;
}

export interface NeelakanthaVarsheshwaraResult {
  lord: PlanetId;
  vishwaBala: number;
  moonDisqualified: boolean;
  moonExceptionUsed?: string;
  reason: string;
}

/**
 * Selects Varsheshwara per Tajaka Neelakanthi / M.S. Mehta (R-20 Sec. 2.3):
 * - Highest Vishwa Bala among 5 candidates casting ANY Tajaka aspect on Annual Lagna (not 2/12 or 6/8).
 * - Moon Disqualification Rule: Skip Moon unless:
 *   (1) Cancer Annual Lagna with Moon in Lagna and Moon is strongest of the 5 candidates; OR
 *   (2) Nighttime return where Moon is Trirashi Pati (Ta/Pi), strongest planet in entire chart, and aspects Lagna.
 * - Fallback if no candidate aspects Lagna or all have PVB < 5: Muntha Lord.
 */
export function selectNeelakanthaVarsheshwara(
  chart: NatalChart,
  lagnaIdx: number,
  isDayReturn: boolean,
  panchadhikari: {
    dinaRatriPati: string;
    janmaLagnesha: string;
    munthaLord: string;
    varshaLagnesha: string;
    triRasheesha: string;
  },
  neelPvb: Record<string, NeelakanthaPvbItem>,
  yogas: TajakaYogaEntry[],
): NeelakanthaVarsheshwaraResult {
  const candidates = Array.from(
    new Set(
      [
        panchadhikari.dinaRatriPati,
        panchadhikari.janmaLagnesha,
        panchadhikari.munthaLord,
        panchadhikari.varshaLagnesha,
        panchadhikari.triRasheesha,
      ]
        .map((c) => c.toLowerCase() as PlanetId)
        .filter((c) => Boolean(neelPvb[c])),
    ),
  );

  const aspecting = candidates
    .map((p) => {
      const asp = tajakaAspectKind(chart.grahas[p].signIndex, lagnaIdx);
      return asp ? { p, aspect: asp.kind, pvb: neelPvb[p]!.vishwaBala } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.pvb - a.pvb);

  const allSevenSorted = Object.values(neelPvb).sort((a, b) => b.vishwaBala - a.vishwaBala);
  const strongestInChart = allSevenSorted[0]?.planet;

  const moonAllowed = (): string | null => {
    const moonInLagna = chart.grahas.moon.signIndex === lagnaIdx;
    if (lagnaIdx === 3 && moonInLagna && aspecting[0]?.p === 'moon') {
      return 'Exception 1: Cancer rises with Moon in Lagna and strongest of 5 candidates';
    }
    const moonIsTrirashi = panchadhikari.triRasheesha.toLowerCase() === 'moon';
    if (!isDayReturn && moonIsTrirashi && strongestInChart === 'moon' && aspecting.some((a) => a.p === 'moon')) {
      return 'Exception 2: Nighttime return with Moon as Trirashi Pati and strongest planet in chart';
    }
    return null;
  };

  if (aspecting.length === 0 || aspecting.every((a) => a.pvb < 5)) {
    const mLord = (panchadhikari.munthaLord.toLowerCase() as PlanetId) || 'sun';
    return {
      lord: mLord,
      vishwaBala: neelPvb[mLord]?.vishwaBala ?? 0,
      moonDisqualified: false,
      reason: `No office-bearer aspects Annual Lagna with PVB >= 5; Muntha Lord ${mLord.toUpperCase()} assumes Varsheshwara (Neelakantha fallback).`,
    };
  }

  let moonDisqualified = false;
  if (aspecting[0]!.p === 'moon') {
    const ex = moonAllowed();
    if (ex) {
      return {
        lord: 'moon',
        vishwaBala: aspecting[0]!.pvb,
        moonDisqualified: false,
        moonExceptionUsed: ex,
        reason: `MOON selected as Varsheshwara (PVB ${aspecting[0]!.pvb}) via ${ex}.`,
      };
    }
    moonDisqualified = true;
    const nextCandidate = aspecting.find((a) => a.p !== 'moon' && a.pvb >= 5) ?? aspecting.find((a) => a.p !== 'moon');
    if (nextCandidate) {
      return {
        lord: nextCandidate.p,
        vishwaBala: nextCandidate.pvb,
        moonDisqualified: true,
        reason: `Moon disqualified per Neelakantha rule; ${nextCandidate.p.toUpperCase()} selected as next strongest aspecting candidate (${nextCandidate.aspect}, PVB ${nextCandidate.pvb}).`,
      };
    }
    // No other candidate aspects Lagna -> planet in Ithasala with Moon, else Moon's sign lord
    const moonIth = yogas.find(
      (y) => y.type.startsWith('ithasala') && y.planets.includes('moon'),
    );
    const partner = moonIth?.planets.find((p) => p !== 'moon');
    const fallbackLord = partner ?? SIGN_LORDS[chart.grahas.moon.signIndex]!;
    return {
      lord: fallbackLord,
      vishwaBala: neelPvb[fallbackLord]?.vishwaBala ?? 0,
      moonDisqualified: true,
      reason: `Moon disqualified and sole aspecting candidate; defaulted to ${fallbackLord.toUpperCase()} (${partner ? 'Ithasala with Moon' : "Moon's sign lord"}).`,
    };
  }

  const w = aspecting[0]!;
  return {
    lord: w.p,
    vishwaBala: w.pvb,
    moonDisqualified,
    reason: `${w.p.toUpperCase()} leads aspecting candidates (${w.aspect}) with Neelakantha PVB ${w.pvb} (${neelPvb[w.p]!.band}).`,
  };
}

// --- 4. Extended R-20 Yogas (Rashi-Anta Muthasil, 14-Tier Kamboola, Duphalikuttha, Khallasar) & Delivery Gate ---

export interface R20ExtendedYoga {
  id: string;
  name: string;
  tier?: string;
  planets: PlanetId[];
  summary: string;
}

export function computeR20ExtendedYogasAndDelivery(
  chart: NatalChart,
  lagnaIdx: number,
  yearLord: PlanetId,
  yogas: TajakaYogaEntry[],
  neelPvb: Record<string, NeelakanthaPvbItem>,
): {
  r20Yogas: R20ExtendedYoga[];
  deliveryGate: Array<{ planet: PlanetId; status: 'delivers' | 'blocked'; via: string }>;
} {
  const r20Yogas: R20ExtendedYoga[] = [];
  const lagnaLord = SIGN_LORDS[lagnaIdx]!;

  // Helper: dignity score (2 = own/exalt, 1 = own hadda/d3/d9 or neutral, 0 = enemy/debil)
  const dignityTier = (p: PlanetId): number => {
    const g = chart.grahas[p];
    if (SIGN_LORDS[g.signIndex] === p || EXALT_SIGN_7[p] === g.signIndex) return 2;
    if (DEBIL_SIGN_7[p] === g.signIndex) return 0;
    const item = neelPvb[p];
    if (item && item.vishwaBala >= 10) return 1;
    if (getHaddaLord(g.signIndex, g.degInSign) === p) return 1;
    return item && item.vishwaBala >= 5 ? 1 : 0;
  };

  // 1. Rashi-Anta Muthasil (29°-30° faster planet operating from next sign — R-20 Sec. 2.4.4)
  for (let i = 0; i < CLASSICAL_7.length; i++) {
    for (let j = i + 1; j < CLASSICAL_7.length; j++) {
      const slower = CLASSICAL_7[i]!;
      const faster = CLASSICAL_7[j]!;
      const gF = chart.grahas[faster];
      const gS = chart.grahas[slower];
      if (gF.degInSign < 29 || gF.retrograde) continue;
      const nextSign = (gF.signIndex + 1) % 12;
      const asp = tajakaAspectKind(nextSign, gS.signIndex);
      if (!asp) continue;
      const avgOrb = ((DEEPTAMSA_ORB[faster] ?? 8) + (DEEPTAMSA_ORB[slower] ?? 8)) / 2;
      const effGap = (30 - gF.degInSign) + gS.degInSign;
      if (effGap <= avgOrb) {
        r20Yogas.push({
          id: `r20.rashi_anta.${faster}.${slower}`,
          name: 'Rashi-Anta Muthasil',
          planets: [faster, slower],
          summary: `Rashi-Anta Muthasil: ${faster} (${gF.degInSign.toFixed(1)}°) operates from next sign (${SIGN_IDS[nextSign]}) to form ${asp.kind} Ithasala with ${slower} (${gS.degInSign.toFixed(1)}°).`,
        });
      }
    }
  }

  // 2. 14-Tier Graded Kamboola Yoga (R-20 Sec. 2.4.5)
  for (const y of yogas.filter((x) => x.type === 'kamboola')) {
    const [p1, p2] = y.planets.filter((p) => p !== 'moon');
    if (!p1 || !p2) continue;
    const score = dignityTier('moon') + dignityTier(p1) + dignityTier(p2); // 0..6
    const tier =
      score === 6
        ? 'Uttam-o-Uttam (Tier 1 — Peak)'
        : score >= 5
        ? 'Uttam-Madhyam (Tier 2-4 — Strong)'
        : score >= 3
        ? 'Madhyam (Tier 5-10 — Moderate)'
        : score >= 1
        ? 'Adham-Madhyam (Tier 11-13 — Weak)'
        : 'Adham-Adham (Tier 14 — Afflicted)';
    r20Yogas.push({
      id: `r20.kamboola_grade.${p1}.${p2}`,
      name: 'Graded Kamboola Yoga',
      tier,
      planets: ['moon', p1, p2],
      summary: `Graded Kamboola (${tier}): Moon + ${p1} + ${p2} — quality calibrated by own/exalt/Hadda dignity.`,
    });
  }

  // 3. Duphalikuttha (slower exalted/own/strong; faster not exalted/own and not retro/combust) & Khallasar
  const sunLon = chart.grahas.sun.lon;
  const isCombust = (p: PlanetId): boolean => {
    if (p === 'sun') return false;
    let d = Math.abs(chart.grahas[p].lon - sunLon) % 360;
    if (d > 180) d = 360 - d;
    return d <= 8;
  };

  for (const y of yogas.filter((x) => x.type.startsWith('ithasala'))) {
    const [faster, slower] = y.planets;
    if (!faster || !slower) continue;
    if (dignityTier(slower) === 2 && dignityTier(faster) < 2 && !chart.grahas[faster].retrograde && !isCombust(faster)) {
      r20Yogas.push({
        id: `r20.duphalikuttha.${faster}.${slower}`,
        name: 'Duphalikuttha Yoga',
        planets: [faster, slower],
        summary: `Duphalikuttha Yoga: strong slower ${slower} receives applying Ithasala from unimpeded faster ${faster} — tangible ambition fulfillment.`,
      });
    }

    // Khallasar: Lagnesh in Ithasala with another planet while Moon neither conjoins nor aspects either
    if (faster === lagnaLord || slower === lagnaLord) {
      const moonSign = chart.grahas.moon.signIndex;
      const aspF = tajakaAspectKind(moonSign, chart.grahas[faster].signIndex);
      const aspS = tajakaAspectKind(moonSign, chart.grahas[slower].signIndex);
      if (!aspF && !aspS) {
        r20Yogas.push({
          id: `r20.khallasar.${faster}.${slower}`,
          name: 'Khallasar Yoga',
          planets: [faster, slower, 'moon'],
          summary: `Khallasar Check: ${faster}-${slower} Ithasala lacks Moon conjunction/aspect support — slower or subdued external fruition.`,
        });
      }
    }
  }

  // 4. Tajaka Neelakanthi Delivery Gate (R-20 Sec. 2.3 p. 142):
  // Planet delivers promised results if it forms Ithasala with Year Lord or Annual Lagna Lord; Eesarpha blocks delivery.
  const deliveryGate: Array<{ planet: PlanetId; status: 'delivers' | 'blocked'; via: string }> = [];
  for (const p of CLASSICAL_7) {
    if (p === yearLord || p === lagnaLord) continue;
    const ith = yogas.find(
      (y) =>
        y.type.startsWith('ithasala') &&
        y.planets.includes(p) &&
        (y.planets.includes(yearLord) || y.planets.includes(lagnaLord)),
    );
    if (ith) {
      const anchor = ith.planets.includes(yearLord) ? `Varsheshwara (${yearLord})` : `Annual Lagna Lord (${lagnaLord})`;
      deliveryGate.push({ planet: p, status: 'delivers', via: `Ithasala with ${anchor}` });
      continue;
    }
    const ees = yogas.find(
      (y) =>
        y.type === 'eesarpha' &&
        y.planets.includes(p) &&
        (y.planets.includes(yearLord) || y.planets.includes(lagnaLord)),
    );
    if (ees) {
      const anchor = ees.planets.includes(yearLord) ? `Varsheshwara (${yearLord})` : `Annual Lagna Lord (${lagnaLord})`;
      deliveryGate.push({ planet: p, status: 'blocked', via: `Eesarpha (separating) with ${anchor}` });
    }
  }

  return { r20Yogas, deliveryGate };
}

// --- 5. Dwi-Janma Year, Muntha Advanced Rules, Tables 20C/20D/20E & Saham Audit ---

export interface AdvancedAnnualAudit {
  triPataki: TriPatakiResult;
  annualYogini: AnnualYoginiPeriod[];
  neelakanthaPvb: Record<string, NeelakanthaPvbItem>;
  neelakanthaVarsheshwara: NeelakanthaVarsheshwaraResult;
  dualSchoolComparison: {
    converged: boolean;
    pvrLord: PlanetId;
    neelakanthaLord: PlanetId;
    topNonSunPlanetsPvr: string[];
    topNonSunPlanetsNeel: string[];
    summary: string;
  };
  dwiJanma: {
    isDwiJanma: boolean;
    exactDegreeMatch: boolean;
    birthMoonNakRecurrence: boolean;
    protectiveBuffers: string[];
    vulnerableBuffers: string[];
    summary: string;
  };
  munthaAdvanced: {
    rahuAxisStatus: string;
    halfYearBias: string;
    fatalMuntheshWarning: string | null;
  };
  patyayiniLagnaDrekkana: {
    modality: 'Movable' | 'Fixed' | 'Dual';
    drekkana: 1 | 2 | 3;
    verdict: string;
  };
  crisisFlags: string[];
  antidotes: string[];
  annualHouseAndPoliticalSignals: string[];
  sahamAudit: {
    punyaBaseline: string;
    commonLordshipSahams: string[];
    maleficSahamWarnings: string[];
    fructifyingSahams: string[];
  };
  r20Yogas: R20ExtendedYoga[];
  deliveryGate: Array<{ planet: PlanetId; status: 'delivers' | 'blocked'; via: string }>;
}

export function computeAdvancedTajakaAudit(
  natal: NatalChart,
  varshaphal: VarshaphalResult,
  pvrPvb: Record<string, PanchaVargeeyaItem>,
  pvrVarsheshwara: PlanetId,
  yogas: TajakaYogaEntry[],
): AdvancedAnnualAudit {
  const chart = varshaphal.annualChart;
  const aLagna = varshaphal.varshaLagnaSignIndex;
  const bLagna = natal.lagna?.signIndex ?? 0;
  const aLagnaLord = SIGN_LORDS[aLagna]!;
  const bLagnaLord = SIGN_LORDS[bLagna]!;
  const a8Lord = SIGN_LORDS[(aLagna + 7) % 12]!;
  const b8Lord = SIGN_LORDS[(bLagna + 7) % 12]!;
  const mLord = varshaphal.munthaLord.toLowerCase() as PlanetId;

  const triPataki = computeTriPatakiChakra(natal, varshaphal);
  const annualYogini = computeAnnualYoginiDasa(natal, varshaphal);
  const neelakanthaPvb = computeNeelakanthaPvb(chart);
  const neelakanthaVarsheshwara = selectNeelakanthaVarsheshwara(
    chart,
    aLagna,
    varshaphal.isDayReturn,
    varshaphal.panchadhikari,
    neelakanthaPvb,
    yogas,
  );
  const yearLord = neelakanthaVarsheshwara.lord;

  // Dual-school convergence & K.N. Rao Rule #4 (Sun PVB is static year-to-year -> rank the other 6 planets)
  const nonSun6: PlanetId[] = ['moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];
  const topNonSunPvr = [...nonSun6]
    .sort((a, b) => (pvrPvb[b]?.pvb ?? 0) - (pvrPvb[a]?.pvb ?? 0))
    .slice(0, 3)
    .map((p) => `${p}(${pvrPvb[p]?.pvb})`);
  const topNonSunNeel = [...nonSun6]
    .sort((a, b) => (neelakanthaPvb[b]?.vishwaBala ?? 0) - (neelakanthaPvb[a]?.vishwaBala ?? 0))
    .slice(0, 3)
    .map((p) => `${p}(${neelakanthaPvb[p]?.vishwaBala})`);
  const converged = pvrVarsheshwara === yearLord;

  // Dwi-Janma Year (R-20 Sec. 2.2)
  const isDwiJanma = aLagna === bLagna;
  const degDiffLagna = Math.abs((chart.lagna?.degInSign ?? 0) - (natal.lagna?.degInSign ?? 0));
  const exactDegreeMatch = isDwiJanma && degDiffLagna <= 1.5;
  const birthMoonNakRecurrence = chart.grahas.moon.nakshatraIndex === natal.grahas.moon.nakshatraIndex;
  const bufferChecks: Array<{ label: string; planet: PlanetId }> = [
    { label: 'Annual L1', planet: aLagnaLord },
    { label: 'Jupiter', planet: 'jupiter' },
    { label: 'Moon', planet: 'moon' },
    { label: 'Year Lord', planet: yearLord },
    { label: 'Muntha Lord', planet: mLord },
  ];
  const protectiveBuffers: string[] = [];
  const vulnerableBuffers: string[] = [];
  for (const bc of bufferChecks) {
    const h = houseDist(aLagna, chart.grahas[bc.planet].signIndex);
    const strong = (neelakanthaPvb[bc.planet]?.vishwaBala ?? 0) >= 8;
    if (!DUSTHANAS.has(h) && strong) protectiveBuffers.push(`${bc.label} (${bc.planet} in H${h})`);
    else if (DUSTHANAS.has(h)) vulnerableBuffers.push(`${bc.label} (${bc.planet} in Dusthana H${h})`);
  }

  // Muntha Advanced Rules (R-20 Sec. 2.6: Rahu Face/Back/Tail, Half-Year Birth Projection, Fatal Munthesh)
  const munthaSign = varshaphal.munthaSignIndex;
  const rahuG = chart.grahas.rahu;
  const ketuG = chart.grahas.ketu;
  let rahuAxisStatus = 'Muntha free of direct Rahu/Ketu axis';
  if (munthaSign === rahuG.signIndex) {
    // Muntha progresses whole-sign; compare Muntha's natal Lagna degree vs Rahu's retrograde traversal (untraversed = 0..Rahu_deg = Face/Mukha)
    const munthaDeg = natal.lagna?.degInSign ?? 15;
    const inFace = munthaDeg <= rahuG.degInSign;
    rahuAxisStatus = inFace
      ? `Muntha in Rahu's Face/Mukha (untraversed arc ${munthaDeg.toFixed(1)}° <= Rahu ${rahuG.degInSign.toFixed(1)}°) — auspicious/ambitious if benefic-linked.`
      : `Muntha in Rahu's Back (traversed arc ${munthaDeg.toFixed(1)}° > Rahu ${rahuG.degInSign.toFixed(1)}°) — watch for sudden friction/rivals.`;
  } else if (munthaSign === ketuG.signIndex) {
    rahuAxisStatus = 'Muntha conjoins Ketu (Rahu Tail) — detach from rigid expectations; watch for sudden setbacks if malefics aspect.';
  }

  // Half-Year Timing Rule: project Annual Muntha back into Birth Chart
  const birthBeneficsOnMuntha = (['jupiter', 'venus', 'mercury', 'moon'] as PlanetId[]).filter(
    (p) => natal.grahas[p].signIndex === munthaSign || houseDist(natal.grahas[p].signIndex, munthaSign) === 7,
  );
  const annualBeneficsOnMuntha = (['jupiter', 'venus', 'mercury', 'moon'] as PlanetId[]).filter(
    (p) => chart.grahas[p].signIndex === munthaSign || tajakaAspectKind(chart.grahas[p].signIndex, munthaSign)?.nature === 'benefic',
  );
  const halfYearBias =
    birthBeneficsOnMuntha.length > annualBeneficsOnMuntha.length
      ? `Stronger 1st half (Birth Chart benefics ${birthBeneficsOnMuntha.join(', ')} support Muntha sign ${SIGN_IDS[munthaSign]}).`
      : annualBeneficsOnMuntha.length > birthBeneficsOnMuntha.length
      ? `Stronger 2nd half (Annual Chart benefics ${annualBeneficsOnMuntha.join(', ')} support Muntha sign ${SIGN_IDS[munthaSign]}).`
      : 'Balanced first-half vs second-half Muntha support across Birth and Annual charts.';

  const mLordH = houseDist(aLagna, chart.grahas[mLord].signIndex);
  const mLordWith8 =
    chart.grahas[mLord].signIndex === chart.grahas[a8Lord].signIndex ||
    tajakaAspectKind(chart.grahas[mLord].signIndex, chart.grahas[a8Lord].signIndex)?.nature === 'malefic';
  const fatalMuntheshWarning =
    mLord !== a8Lord && mLordWith8 && [1, 6, 8].includes(mLordH)
      ? `Muntha lord (${mLord}) in H${mLordH} has hard contact with Annual 8th lord (${a8Lord}) — health/vulnerability caution.`
      : null;

  // Table 20C: Patyayini Ascendant Dasha Modality × Drekkana Matrix
  const lagnaModIdx = aLagna % 3;
  const modality: 'Movable' | 'Fixed' | 'Dual' = lagnaModIdx === 0 ? 'Movable' : lagnaModIdx === 1 ? 'Fixed' : 'Dual';
  const lagnaDrek = (Math.min(2, Math.floor((chart.lagna?.degInSign ?? 0) / 10)) + 1) as 1 | 2 | 3;
  const matrix20C: Record<'Movable' | 'Fixed' | 'Dual', [string, string, string]> = {
    Movable: ['Good', 'Moderate', 'Worst (caution)'],
    Fixed: ['Undesirable', 'Good', 'Mixed'],
    Dual: ['Inauspicious', 'Medium', 'Good'],
  };
  const patyayiniLagnaDrekkana = {
    modality,
    drekkana: lagnaDrek,
    verdict: `${modality} Lagna in Drekkana ${lagnaDrek} -> ${matrix20C[modality][lagnaDrek - 1]} Lagna-Dasha quality.`,
  };

  // Table 20D: 8 Disease/Crisis Combinations + Imprisonment + 4 Neutralization Antidotes
  const crisisFlags: string[] = [];
  const antidotes: string[] = [];
  const hInAnnual = (p: PlanetId) => houseDist(aLagna, chart.grahas[p].signIndex);
  const bad4812 = new Set([4, 8, 12]);
  const bad46812 = new Set([4, 6, 8, 12]);

  if (bad4812.has(hInAnnual(aLagnaLord)) && bad4812.has(hInAnnual(a8Lord)) && bad4812.has(hInAnnual(mLord))) {
    crisisFlags.push('Table 20D #1: Annual L1 + L8 + Muntha Lord all fall in 4/8/12.');
  }
  if (houseDist(bLagna, aLagna) === 8) {
    crisisFlags.push('Table 20D #3: Annual Lagna equals 8th sign from Birth Lagna — high caution/transformation year.');
  }
  if (chart.grahas[b8Lord].signIndex === aLagna && NATURAL_MALEFICS.has(b8Lord)) {
    crisisFlags.push(`Table 20D #4: Malefic Birth 8th lord (${b8Lord}) occupies Annual Lagna.`);
  }
  if (bad46812.has(hInAnnual(yearLord)) && bad46812.has(hInAnnual(aLagnaLord))) {
    crisisFlags.push(`Table 20D #5: Both Year Lord (${yearLord}) and Annual L1 (${aLagnaLord}) sit in 4/6/8/12.`);
  }
  if (bad46812.has(hInAnnual(bLagnaLord)) && bad46812.has(hInAnnual(aLagnaLord)) && bad46812.has(varshaphal.munthaHouseInVarsha)) {
    crisisFlags.push('Table 20D #6: Birth L1 + Annual L1 + Muntha all placed in 4/6/8/12.');
  }
  let sunMoonArc = Math.abs(chart.grahas.moon.lon - chart.grahas.sun.lon) % 360;
  if (sunMoonArc > 180) sunMoonArc = 360 - sunMoonArc;
  const jupAspectsMoon = tajakaAspectKind(chart.grahas.jupiter.signIndex, chart.grahas.moon.signIndex) !== null;
  if (sunMoonArc <= 15 && bad46812.has(hInAnnual('moon')) && !jupAspectsMoon) {
    crisisFlags.push(`Table 20D #7: Combust Moon (${sunMoonArc.toFixed(1)}° from Sun) in H${hInAnnual('moon')} without Jupiter aspect.`);
  }
  const birth8Sign = (bLagna + 7) % 12;
  if (
    munthaSign === birth8Sign &&
    [4, 6, 7, 8, 12].includes(varshaphal.munthaHouseInVarsha) &&
    tajakaAspectKind(chart.grahas.saturn.signIndex, munthaSign) !== null
  ) {
    crisisFlags.push('Table 20D #8: Muntha falls in Birth 8th sign (4/6/7/8/12 from Annual Lagna) aspected by Saturn.');
  }
  // Imprisonment / confinement indicator: direct planet in 12th + retrograde planet in 2nd
  const hasDirect12 = CLASSICAL_7.some((p) => hInAnnual(p) === 12 && !chart.grahas[p].retrograde);
  const hasRetro2 = CLASSICAL_7.some((p) => hInAnnual(p) === 2 && chart.grahas[p].retrograde);
  if (hasDirect12 && hasRetro2) {
    crisisFlags.push('Table 20D Confinement Flag: Direct planet in Annual 12th paired with Retrograde planet in Annual 2nd.');
  }

  // Neutralization Antidotes (Table 20D)
  if ((neelakanthaPvb[aLagnaLord]?.vishwaBala ?? 0) >= 10 && KENDRA_TRIKONA.has(hInAnnual(aLagnaLord))) {
    antidotes.push(`Antidote #1: Strong Annual L1 (${aLagnaLord}, PVB ${neelakanthaPvb[aLagnaLord]!.vishwaBala}) in Kendra/Trikona H${hInAnnual(aLagnaLord)}.`);
  }
  const jupH = hInAnnual('jupiter');
  const jupAfflicted = (['saturn', 'mars', 'rahu', 'ketu'] as PlanetId[]).some(
    (m) => chart.grahas[m].signIndex === chart.grahas.jupiter.signIndex,
  );
  if (KENDRA_TRIKONA.has(jupH) && !jupAfflicted) {
    antidotes.push(`Antidote #2: Unafflicted Jupiter in Kendra/Trikona (H${jupH}) washes away Moon/Muntha/Lagna afflictions.`);
  }
  const sunFromMuntha = houseDist(munthaSign, chart.grahas.sun.signIndex);
  const marsFromMuntha = houseDist(munthaSign, chart.grahas.mars.signIndex);
  if ([3, 6, 11].includes(sunFromMuntha) && [3, 6, 11].includes(marsFromMuntha)) {
    antidotes.push(`Antidote #3: Sun (H${sunFromMuntha}) & Mars (H${marsFromMuntha}) in 3/6/11 from Muntha neutralize Muntha evils.`);
  }

  // Table 20E & K.N. Rao Ch. XV Annual House & Political Heuristics
  const annualHouseAndPoliticalSignals: string[] = [];
  const sunH = hInAnnual('sun');
  const moonH = hInAnnual('moon');
  const kendras = new Set([1, 4, 7, 10]);
  if (kendras.has(sunH) && kendras.has(moonH)) {
    annualHouseAndPoliticalSignals.push(`High Visibility/Power (K.N. Rao): Both Luminaries (Sun H${sunH}, Moon H${moonH}) occupy Annual Kendras.`);
  } else if (DUSTHANAS.has(sunH) && DUSTHANAS.has(moonH)) {
    annualHouseAndPoliticalSignals.push(`Luminary Strain (K.N. Rao): Both Sun (H${sunH}) & Moon (H${moonH}) occupy Annual Dusthanas.`);
  }

  const l2 = SIGN_LORDS[(aLagna + 1) % 12]!;
  const l7 = SIGN_LORDS[(aLagna + 6) % 12]!;
  const l10 = SIGN_LORDS[(aLagna + 9) % 12]!;
  const hasIthasala = (a: PlanetId, b: PlanetId) =>
    a === b || yogas.some((y) => y.type.startsWith('ithasala') && y.planets.includes(a) && y.planets.includes(b));

  if (hasIthasala(aLagnaLord, l2)) annualHouseAndPoliticalSignals.push(`Wealth (2nd): L1 (${aLagnaLord})–L2 (${l2}) Ithasala supports financial inflow.`);
  if (hasIthasala(aLagnaLord, l7)) annualHouseAndPoliticalSignals.push(`Partnership (7th): L1 (${aLagnaLord})–L7 (${l7}) Ithasala activates marriage/agreements.`);
  if (hasIthasala(aLagnaLord, l10)) annualHouseAndPoliticalSignals.push(`Career Raja Yoga (10th): L1 (${aLagnaLord})–L10 (${l10}) Ithasala boosts authority/status.`);
  if (varshaphal.munthaHouseInVarsha === 10 || aLagna === natal.grahas.sun.signIndex) {
    annualHouseAndPoliticalSignals.push('Promotion Signal (Table 20E): Muntha in 10th or Birth Sun sign rising as Annual Lagna.');
  }
  if (hInAnnual('mars') === 5 && chart.grahas.mars.retrograde) {
    annualHouseAndPoliticalSignals.push('5th House Caution (Table 20E): Retrograde Mars in Annual 5th — caution around children/speculation.');
  }
  if (hInAnnual('mars') === 12) {
    annualHouseAndPoliticalSignals.push('Hidden Rivals / Foreign Intrigues (K.N. Rao Ch. XV): Mars in Annual 12th — watch behind-the-scenes opposition.');
  }
  if ([8, 10].includes(sunH) && hInAnnual('mars') === sunH && hInAnnual('saturn') === sunH) {
    annualHouseAndPoliticalSignals.push(`Vehicular/Physical Caution (Table 20E): Sun + Mars + Saturn cluster in Annual H${sunH}.`);
  }
  // Political Fightback: strong 3rd & 6th (planets with high PVB or benefic/exalted occupants in 3rd/6th)
  const fightback36 = CLASSICAL_7.filter(
    (p) => (hInAnnual(p) === 3 || hInAnnual(p) === 6) && (neelakanthaPvb[p]?.vishwaBala ?? 0) >= 10,
  );
  if (fightback36.length >= 2) {
    annualHouseAndPoliticalSignals.push(
      `Political Fightback / Comeback (K.N. Rao Ch. XV): Strong Annual 3rd/6th (${fightback36.join(', ')}) empowers overcoming opposition.`,
    );
  }
  // Retrograde planets in Annual chart operating from previous sign (K.N. Rao Ch. XV)
  const retroAnnual = (['mars', 'mercury', 'jupiter', 'venus', 'saturn'] as PlanetId[]).filter(
    (p) => chart.grahas[p].retrograde,
  );
  if (retroAnnual.length > 0) {
    annualHouseAndPoliticalSignals.push(
      `Retrograde Annual Overlay (K.N. Rao): ${retroAnnual.map((p) => `${p}(H${hInAnnual(p)} also acts from H${((hInAnnual(p) + 10) % 12) + 1})`).join(', ')}.`,
    );
  }

  // Saham Fructification 6-Condition Gate, Punya Priority, Common Lordship & Malefic Saham Inversion (R-20 Sec. 2.7)
  const maleficSahamIds = new Set(['roga', 'mrityu', 'kali', 'shatru', 'bandhana']);
  const commonLordshipSahams: string[] = [];
  const maleficSahamWarnings: string[] = [];
  const fructifyingSahams: string[] = [];
  const annualPunya = varshaphal.sahamsList?.find((s) => s.id === 'punya');
  const punyaBaseline = annualPunya
    ? `Punya Saham (${annualPunya.formatted}, H${annualPunya.houseFromLagna}, lord ${annualPunya.lord}, PVB ${neelakanthaPvb[annualPunya.lord.toLowerCase()]?.vishwaBala ?? '?'})`
    : 'Punya Saham unavailable';

  const birthSunH = houseDist(bLagna, natal.grahas.sun.signIndex);
  const isBirthDay = birthSunH >= 7 && birthSunH <= 12;
  const birthSahams = computeAnnualSahams(natal, isBirthDay).sahams;
  const priorityCommonIds = new Set(['punya', 'vivaha', 'karma', 'rajya', 'putra', 'vidya', 'artha', 'paradesa']);

  for (const s of varshaphal.sahamsList ?? []) {
    const sLord = s.lord.toLowerCase() as PlanetId;
    const sLordPvb = neelakanthaPvb[sLord]?.vishwaBala ?? 0;
    const sLordH = hInAnnual(sLord);
    const inDusthana = DUSTHANAS.has(s.houseFromLagna) || DUSTHANAS.has(sLordH);
    const contactsLagna = tajakaAspectKind(chart.grahas[sLord]?.signIndex ?? 0, aLagna) !== null;

    if (maleficSahamIds.has(s.id) && sLordPvb >= 10 && contactsLagna) {
      maleficSahamWarnings.push(
        `${s.name} Saham lord (${sLord}) is strong (PVB ${sLordPvb}) — Neelakantha warning: strong malefic Saham intensifies friction.`,
      );
    } else if (!maleficSahamIds.has(s.id) && !inDusthana && sLordPvb >= 10 && contactsLagna) {
      fructifyingSahams.push(`${s.name}(${sLord}, PVB ${sLordPvb})`);
    }

    const birthMatch = birthSahams[s.id];
    if (birthMatch && priorityCommonIds.has(s.id) && birthMatch.lord.toLowerCase() === sLord) {
      commonLordshipSahams.push(`${s.name} (common lord ${sLord} in Birth & Annual charts)`);
    }
  }

  const { r20Yogas, deliveryGate } = computeR20ExtendedYogasAndDelivery(
    chart,
    aLagna,
    yearLord,
    yogas,
    neelakanthaPvb,
  );

  return {
    triPataki,
    annualYogini,
    neelakanthaPvb,
    neelakanthaVarsheshwara,
    dualSchoolComparison: {
      converged,
      pvrLord: pvrVarsheshwara,
      neelakanthaLord: yearLord,
      topNonSunPlanetsPvr: topNonSunPvr,
      topNonSunPlanetsNeel: topNonSunNeel,
      summary: converged
        ? `CONVERGED Varsheshwara = ${yearLord.toUpperCase()} across both PVR (PVB ${pvrPvb[pvrVarsheshwara]?.pvb}) and Neelakantha/Mehta (PVB ${neelakanthaVarsheshwara.vishwaBala}). Non-Sun 6-planet PVB leaders: PVR=[${topNonSunPvr.join(', ')}] vs Neelakantha=[${topNonSunNeel.join(', ')}].`
        : `DIVERGED Varsheshwara: PVR=${pvrVarsheshwara.toUpperCase()} (PVB ${pvrPvb[pvrVarsheshwara]?.pvb}) vs Neelakantha/Mehta=${yearLord.toUpperCase()} (PVB ${neelakanthaVarsheshwara.vishwaBala}${neelakanthaVarsheshwara.moonDisqualified ? ', Moon disqualified' : ''}). Non-Sun 6-planet PVB leaders: PVR=[${topNonSunPvr.join(', ')}] vs Neelakantha=[${topNonSunNeel.join(', ')}].`,
    },
    dwiJanma: {
      isDwiJanma,
      exactDegreeMatch,
      birthMoonNakRecurrence,
      protectiveBuffers,
      vulnerableBuffers,
      summary: isDwiJanma
        ? `DWI-JANMA YEAR ACTIVE (Annual Lagna ${SIGN_IDS[aLagna]} == Birth Lagna${exactDegreeMatch ? ', EXACT degree match' : ''}${birthMoonNakRecurrence ? ', Birth Moon Nakshatra recurs' : ''}). Protective buffers=[${protectiveBuffers.join('; ') || 'none'}]; Vulnerable=[${vulnerableBuffers.join('; ') || 'none'}].`
        : `Not a Dwi-Janma year (Annual Lagna ${SIGN_IDS[aLagna]} vs Birth Lagna ${SIGN_IDS[bLagna]}${birthMoonNakRecurrence ? '; note Birth Moon Nakshatra recurs' : ''}).`,
    },
    munthaAdvanced: {
      rahuAxisStatus,
      halfYearBias,
      fatalMuntheshWarning,
    },
    patyayiniLagnaDrekkana,
    crisisFlags,
    antidotes,
    annualHouseAndPoliticalSignals,
    sahamAudit: {
      punyaBaseline,
      commonLordshipSahams,
      maleficSahamWarnings,
      fructifyingSahams,
    },
    r20Yogas,
    deliveryGate,
  };
}
