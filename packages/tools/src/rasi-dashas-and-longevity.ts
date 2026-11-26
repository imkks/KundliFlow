import {
  calculateVargaSign,
  computeThreePairLongevity,
  type ArudhaPadaItem,
  type NatalChart,
  type SpecialLagnaPosition,
  type VargaType,
} from '@astro/engine';
import { PLANET_IDS, SIGN_IDS, SIGN_LORDS, type PlanetId } from '@astro/facts';
import { getRasiDrishtiSigns } from './jyotish-diagnostics.js';

const SOLAR_YEAR_MS = 365.2425 * 86400 * 1000;

function isoDateFromMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function birthStartMs(natal: NatalChart): number {
  const parsed = Date.parse(natal.time.birthUtc || natal.time.birthLocal);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

const ODD_FOOTED = new Set([0, 1, 2, 6, 7, 8]); // Ar, Ta, Ge, Li, Sc, Sg
const MOVABLE = new Set([0, 3, 6, 9]);
const FIXED = new Set([1, 4, 7, 10]);
const DUAL = new Set([2, 5, 8, 11]);

// Exaltation & debilitation signs (0..11) including Rahu/Ketu (PVR Table 6)
const EXALT_SIGN: Record<PlanetId, number> = {
  sun: 0, moon: 1, mars: 9, mercury: 5, jupiter: 3, venus: 11, saturn: 6, rahu: 1, ketu: 7,
};
const DEBIL_SIGN: Record<PlanetId, number> = {
  sun: 6, moon: 7, mars: 3, mercury: 11, jupiter: 9, venus: 5, saturn: 0, rahu: 7, ketu: 1,
};

// PVR Table 32: Eighth Sign for Rudra, Three Pairs & Ayur Dasas
const TABLE_32_EIGHTH: number[] = [7, 2, 9, 8, 3, 10, 1, 8, 3, 2, 9, 4];

export interface ChartSignState {
  lagnaSignIndex: number;
  planetSigns: Record<PlanetId, number>;
  planetDegs: Record<PlanetId, number>;
}

export interface RasiDashaPeriod {
  signIndex: number;
  sign: string;
  years: number;
  startIso: string;
  endIso: string;
  antardasas?: Array<{ signIndex: number; sign: string; startIso: string; endIso: string }>;
  note?: string;
}

export interface RasiDashaResult {
  system: 'narayana' | 'sudasa' | 'drigdasa' | 'shoola';
  varga: string;
  seedSign: string;
  periods: RasiDashaPeriod[];
}

export interface LongevityAndShoolaReport {
  threePairs: ReturnType<typeof computeThreePairLongevity>;
  rudra: PlanetId;
  rudraSign: string;
  trishoolaSigns: string[];
  maheswara: PlanetId;
  shoolaDasa: RasiDashaResult;
  vulnerabilityWindows: Array<{
    sign: string;
    startIso: string;
    endIso: string;
    reason: string;
    protectedBy: string[];
  }>;
}

export function buildChartSignState(natal: NatalChart, varga: VargaType = 'D1'): ChartSignState {
  const lagnaSignIndex = natal.lagna
    ? varga === 'D1'
      ? natal.lagna.signIndex
      : calculateVargaSign(natal.lagna.lon, varga)
    : 0;
  const planetSigns = {} as Record<PlanetId, number>;
  const planetDegs = {} as Record<PlanetId, number>;
  for (const p of PLANET_IDS) {
    const g = natal.grahas[p];
    planetSigns[p] = varga === 'D1' ? g.signIndex : calculateVargaSign(g.lon, varga);
    planetDegs[p] = g.degInSign;
  }
  return { lagnaSignIndex, planetSigns, planetDegs };
}

function modalityRank(signIdx: number): number {
  if (DUAL.has(signIdx)) return 3;
  if (FIXED.has(signIdx)) return 2;
  return 1;
}

function planetAdvancement(p: PlanetId, deg: number): number {
  return p === 'rahu' || p === 'ketu' ? 30 - deg : deg;
}

function occupantsInSign(state: ChartSignState, signIdx: number): PlanetId[] {
  return PLANET_IDS.filter((p) => state.planetSigns[p] === signIdx);
}

/**
 * PVR 15.5.1 Stronger Co-Lord Tie-Breaker (Scorpio: Mars vs Ketu; Aquarius: Saturn vs Rahu).
 */
export function resolveStrongerCoLord(
  state: ChartSignState,
  signIndex: number,
  forDasa: boolean = true,
): PlanetId {
  if (signIndex !== 7 && signIndex !== 10) return SIGN_LORDS[signIndex]!;
  const [pA, pB]: [PlanetId, PlanetId] = signIndex === 7 ? ['mars', 'ketu'] : ['saturn', 'rahu'];
  const sA = state.planetSigns[pA];
  const sB = state.planetSigns[pB];

  // Step 0: If one sits in the sign itself and the other doesn't, pick the OTHER
  if (sA === signIndex && sB !== signIndex) return pB;
  if (sB === signIndex && sA !== signIndex) return pA;

  // Step 1: Conjoined with more planets
  const conjA = occupantsInSign(state, sA).length - 1;
  const conjB = occupantsInSign(state, sB).length - 1;
  if (conjA !== conjB) return conjA > conjB ? pA : pB;

  // Step 2: More of {Jupiter, Mercury, own dispositor} conjoining or Rasi-aspecting
  const influenceCount = (p: PlanetId, s: number): number => {
    const disp = SIGN_LORDS[s]!;
    const refs = Array.from(new Set<PlanetId>(['jupiter', 'mercury', disp]));
    const rasiAsp = getRasiDrishtiSigns(s);
    let cnt = 0;
    for (const ref of refs) {
      if (ref === p) continue;
      const rs = state.planetSigns[ref];
      if (rs === s || rasiAsp.includes(rs)) cnt++;
    }
    return cnt;
  };
  const infA = influenceCount(pA, sA);
  const infB = influenceCount(pB, sB);
  if (infA !== infB) return infA > infB ? pA : pB;

  // Step 3: Exalted wins
  const exA = EXALT_SIGN[pA] === sA ? 1 : 0;
  const exB = EXALT_SIGN[pB] === sB ? 1 : 0;
  if (exA !== exB) return exA > exB ? pA : pB;

  // Step 4: Dual > Fixed > Movable
  const mA = modalityRank(sA);
  const mB = modalityRank(sB);
  if (mA !== mB) return mA > mB ? pA : pB;

  // Step 5a/5b: Longer Dasa duration (for Dasas) or higher degree advancement
  if (forDasa) {
    const dA = computeRasiDasaDuration(state, signIndex, pA);
    const dB = computeRasiDasaDuration(state, signIndex, pB);
    if (dA !== dB) return dA > dB ? pA : pB;
  }
  return planetAdvancement(pA, state.planetDegs[pA]) >= planetAdvancement(pB, state.planetDegs[pB]) ? pA : pB;
}

/**
 * PVR 15.5.2 Stronger Rasi Tie-Breaker (between any two signs, e.g. Lagna vs 7th).
 */
export function resolveStrongerRasi(state: ChartSignState, signA: number, signB: number): number {
  const occA = occupantsInSign(state, signA);
  const occB = occupantsInSign(state, signB);
  // Step 1: More planets
  if (occA.length !== occB.length) return occA.length > occB.length ? signA : signB;

  // Step 2: More of {Jupiter, Mercury, Lord(s)} occupying or Rasi-aspecting
  const rasiInfluence = (s: number): number => {
    const lords: PlanetId[] = s === 7 ? ['mars', 'ketu'] : s === 10 ? ['saturn', 'rahu'] : [SIGN_LORDS[s]!];
    const refs = Array.from(new Set<PlanetId>(['jupiter', 'mercury', ...lords]));
    const asp = getRasiDrishtiSigns(s);
    let cnt = 0;
    for (const ref of refs) {
      const rs = state.planetSigns[ref];
      if (rs === s || asp.includes(rs)) cnt++;
    }
    return cnt;
  };
  const iA = rasiInfluence(signA);
  const iB = rasiInfluence(signB);
  if (iA !== iB) return iA > iB ? signA : signB;

  // Step 3: Contains an exalted planet
  const exA = occA.some((p) => EXALT_SIGN[p] === signA) ? 1 : 0;
  const exB = occB.some((p) => EXALT_SIGN[p] === signB) ? 1 : 0;
  if (exA !== exB) return exA > exB ? signA : signB;

  // Step 4: Lord in opposite oddity sign
  const lordA = resolveStrongerCoLord(state, signA, true);
  const lordB = resolveStrongerCoLord(state, signB, true);
  const oppA = (signA % 2) !== (state.planetSigns[lordA] % 2) ? 1 : 0;
  const oppB = (signB % 2) !== (state.planetSigns[lordB] % 2) ? 1 : 0;
  if (oppA !== oppB) return oppA > oppB ? signA : signB;

  // Step 5: Dual > Fixed > Movable
  const mA = modalityRank(signA);
  const mB = modalityRank(signB);
  if (mA !== mB) return mA > mB ? signA : signB;

  // Step 6: Lord's degree advancement
  return planetAdvancement(lordA, state.planetDegs[lordA]) >= planetAdvancement(lordB, state.planetDegs[lordB])
    ? signA
    : signB;
}

/**
 * Shared Rasi Dasa Duration Formula (PVR Ch. 18.2 / R-12).
 */
export function computeRasiDasaDuration(
  state: ChartSignState,
  signIdx: number,
  explicitLord?: PlanetId,
): number {
  const lord = explicitLord ?? resolveStrongerCoLord(state, signIdx, false);
  const lordSign = state.planetSigns[lord];
  if (lordSign === signIdx) return 12;

  const isOddFooted = ODD_FOOTED.has(signIdx);
  const count = isOddFooted
    ? ((lordSign - signIdx + 12) % 12) + 1
    : ((signIdx - lordSign + 12) % 12) + 1;

  let years = count - 1;
  if (EXALT_SIGN[lord] === lordSign) years += 1;
  else if (DEBIL_SIGN[lord] === lordSign) years = Math.max(0, years - 1);

  return Math.min(12, Math.max(0, years));
}

export function buildNarayanaSequence(state: ChartSignState, seedSign: number): number[] {
  const occ = occupantsInSign(state, seedSign);
  const hasSaturn = occ.includes('saturn');
  const hasKetu = occ.includes('ketu');

  // Saturn exception: regular +1 forward regardless of modality/9th house
  if (hasSaturn) {
    return Array.from({ length: 12 }, (_, i) => (seedSign + i) % 12);
  }

  const ninthFromSeed = (seedSign + 8) % 12;
  let forward = ODD_FOOTED.has(ninthFromSeed);
  if (hasKetu) forward = !forward;
  const dir = forward ? 1 : -1;

  if (MOVABLE.has(seedSign)) {
    return Array.from({ length: 12 }, (_, i) => (((seedSign + i * dir) % 12) + 12) % 12);
  }
  if (FIXED.has(seedSign)) {
    // Shiva progression: every 6th sign (+5 or -5 step)
    const step = forward ? 5 : 7;
    return Array.from({ length: 12 }, (_, i) => (seedSign + i * step) % 12);
  }
  // Dual (Vishnu trinal progression): 1,5,9; 10,2,6; 7,11,3; 4,8,12 (in chosen direction)
  const offsets = [0, 4, 8, 9, 1, 5, 6, 10, 2, 3, 7, 11];
  return offsets.map((off) => (((seedSign + off * dir) % 12) + 12) % 12);
}

function buildNarayanaAntardasas(
  state: ChartSignState,
  dasaSign: number,
  startMs: number,
  years: number,
): RasiDashaPeriod['antardasas'] {
  if (years <= 0) return [];
  const seventh = (dasaSign + 6) % 12;
  const adSeed = resolveStrongerRasi(state, dasaSign, seventh);
  const adSeedLord = resolveStrongerCoLord(state, adSeed, true);
  const startSign = state.planetSigns[adSeedLord];
  const adSeedOcc = occupantsInSign(state, adSeed);

  let forward = startSign % 2 === 0; // Odd sign (0=Aries, 2=Ge...) -> forward; Even sign -> backward
  if (adSeedOcc.includes('saturn')) forward = true;
  else if (adSeedOcc.includes('ketu')) forward = !forward;
  const dir = forward ? 1 : -1;

  const adMs = (years * SOLAR_YEAR_MS) / 12;
  const out: NonNullable<RasiDashaPeriod['antardasas']> = [];
  let curMs = startMs;
  for (let i = 0; i < 12; i++) {
    const sIdx = (((startSign + i * dir) % 12) + 12) % 12;
    const endMs = curMs + Math.round(adMs);
    out.push({
      signIndex: sIdx,
      sign: SIGN_IDS[sIdx]!,
      startIso: isoDateFromMs(curMs),
      endIso: isoDateFromMs(endMs),
    });
    curMs = endMs;
  }
  return out;
}

/**
 * Computes D1 or Varga Narayana Dasa (PVR Ch. 18 / R-12).
 */
export function computeNarayanaDasa(natal: NatalChart, varga: VargaType = 'D1'): RasiDashaResult {
  const state = buildChartSignState(natal, varga);
  let virtualLagna = state.lagnaSignIndex;

  if (varga !== 'D1') {
    const n = Number(varga.replace(/\D/g, '')) || 1;
    const seedHouse = ((n - 1) % 12) + 1;
    const d1Lagna = natal.lagna?.signIndex ?? 0;
    const d1SeedSign = (d1Lagna + seedHouse - 1) % 12;
    const d1State = buildChartSignState(natal, 'D1');
    const seedLord = resolveStrongerCoLord(d1State, d1SeedSign, true);
    virtualLagna = state.planetSigns[seedLord];
  }

  const seedSign = resolveStrongerRasi(state, virtualLagna, (virtualLagna + 6) % 12);
  const seq = buildNarayanaSequence(state, seedSign);
  const cycle1Durations = seq.map((s) => computeRasiDasaDuration(state, s));

  let cursorMs = birthStartMs(natal);
  const periods: RasiDashaPeriod[] = [];

  // Cycle 1 + Cycle 2 (up to 120 years)
  let totalYears = 0;
  for (let cycle = 1; cycle <= 2; cycle++) {
    for (let i = 0; i < seq.length; i++) {
      if (totalYears >= 120) break;
      const sIdx = seq[i]!;
      const rawYrs = cycle === 1 ? cycle1Durations[i]! : 12 - cycle1Durations[i]!;
      if (rawYrs <= 0) continue;
      const endMs = cursorMs + Math.round(rawYrs * SOLAR_YEAR_MS);
      periods.push({
        signIndex: sIdx,
        sign: SIGN_IDS[sIdx]!,
        years: rawYrs,
        startIso: isoDateFromMs(cursorMs),
        endIso: isoDateFromMs(endMs),
        antardasas: buildNarayanaAntardasas(state, sIdx, cursorMs, rawYrs),
      });
      cursorMs = endMs;
      totalYears += rawYrs;
    }
  }

  return {
    system: 'narayana',
    varga,
    seedSign: SIGN_IDS[seedSign]!,
    periods,
  };
}

/**
 * Computes Sudasa (Sree Lagna Kendradi Rasi Dasa — PVR Ch. 20 / R-12) for wealth & status.
 */
export function computeSudasa(
  natal: NatalChart,
  specialLagnas: SpecialLagnaPosition[],
): RasiDashaResult {
  const state = buildChartSignState(natal, 'D1');
  const sl = specialLagnas.find((s) => s.code === 'SL');
  const slSign = sl?.signIndex ?? state.lagnaSignIndex;
  const slDeg = sl?.degInSign ?? 0;

  let forward = slSign % 2 === 0; // Odd sign (0=Ar, 2=Ge...) -> forward
  if (occupantsInSign(state, slSign).includes('ketu')) forward = !forward;
  const dir = forward ? 1 : -1;

  // Kendras (0,3,6,9) -> Panapharas (1,4,7,10) -> Apoklimas (2,5,8,11)
  const offsets = [0, 3, 6, 9, 1, 4, 7, 10, 2, 5, 8, 11];
  const seq = offsets.map((off) => (((slSign + off * dir) % 12) + 12) % 12);
  const firstRemFraction = Math.max(0.01, (30 - slDeg) / 30);

  let cursorMs = birthStartMs(natal);
  const periods: RasiDashaPeriod[] = [];
  const cycle1Base = seq.map((s) => computeRasiDasaDuration(state, s));

  for (let cycle = 1; cycle <= 2; cycle++) {
    for (let i = 0; i < seq.length; i++) {
      const sIdx = seq[i]!;
      const fullYrs = cycle === 1 ? cycle1Base[i]! : 12 - cycle1Base[i]!;
      if (fullYrs <= 0) continue;
      const yrs = cycle === 1 && i === 0 ? Number((fullYrs * firstRemFraction).toFixed(2)) : fullYrs;
      const endMs = cursorMs + Math.round(yrs * SOLAR_YEAR_MS);
      periods.push({
        signIndex: sIdx,
        sign: SIGN_IDS[sIdx]!,
        years: yrs,
        startIso: isoDateFromMs(cursorMs),
        endIso: isoDateFromMs(endMs),
      });
      cursorMs = endMs;
    }
  }

  return {
    system: 'sudasa',
    varga: 'D1',
    seedSign: SIGN_IDS[slSign]!,
    periods,
  };
}

/**
 * Computes Drigdasa (Vision Dasa for spirituality/awakening — PVR Ch. 21 / R-12).
 */
export function computeDrigdasa(natal: NatalChart): RasiDashaResult {
  const state = buildChartSignState(natal, 'D1');
  const lagna = state.lagnaSignIndex;

  const groupFromHouse = (houseNum: number): number[] => {
    const startSign = (lagna + houseNum - 1) % 12;
    const forward = ODD_FOOTED.has(startSign);
    const asp = getRasiDrishtiSigns(startSign);
    asp.sort((a, b) => {
      const da = forward ? (a - startSign + 12) % 12 : (startSign - a + 12) % 12;
      const db = forward ? (b - startSign + 12) % 12 : (startSign - b + 12) % 12;
      return da - db;
    });
    return [startSign, ...asp];
  };

  const seq = [...groupFromHouse(9), ...groupFromHouse(10), ...groupFromHouse(11)];
  let cursorMs = birthStartMs(natal);
  const periods: RasiDashaPeriod[] = [];

  for (const sIdx of seq) {
    const yrs = computeRasiDasaDuration(state, sIdx);
    if (yrs <= 0) continue;
    const endMs = cursorMs + Math.round(yrs * SOLAR_YEAR_MS);
    periods.push({
      signIndex: sIdx,
      sign: SIGN_IDS[sIdx]!,
      years: yrs,
      startIso: isoDateFromMs(cursorMs),
      endIso: isoDateFromMs(endMs),
    });
    cursorMs = endMs;
  }

  return {
    system: 'drigdasa',
    varga: 'D1',
    seedSign: SIGN_IDS[seq[0]!]!,
    periods,
  };
}

/**
 * Computes classical Longevity & Vulnerability Analysis (PVR Ch. 14 & 23 / R-13):
 * - Three-Pair Longevity Category (Alpayu / Madhyayu / Poornayu)
 * - Rudra (stronger Table 32 8th lord) & Trishoola Rasis (1, 5, 9 from Rudra)
 * - Maheswara (8th lord from AK with own/exalt & node substitutions)
 * - Shoola Dasa (9 yrs/sign forward from stronger of 1st & 7th) with AL vulnerability & AK/Jupiter shield checks.
 */
export function computeLongevityAndShoola(
  natal: NatalChart,
  arudhas: ArudhaPadaItem[],
  karakas: Array<{ karaka: string; graha: string }>,
): LongevityAndShoolaReport {
  const state = buildChartSignState(natal, 'D1');
  const threePairs = computeThreePairLongevity(natal);
  const lagna = state.lagnaSignIndex;
  const seventh = (lagna + 6) % 12;

  // Table 32 8th signs (if Saturn in Lagna, normal zodiacal 8th per PVR Ex. 86)
  const satInLagna = state.planetSigns.saturn === lagna;
  const eigthFrom1 = satInLagna ? (lagna + 7) % 12 : TABLE_32_EIGHTH[lagna]!;
  const eigthFrom7 = satInLagna ? (seventh + 7) % 12 : TABLE_32_EIGHTH[seventh]!;
  const l8From1 = resolveStrongerCoLord(state, eigthFrom1, false);
  const l8From7 = resolveStrongerCoLord(state, eigthFrom7, false);

  // Stronger of the two = Rudra (with afflicted-weaker exception)
  const scoreRudra = (p: PlanetId): number => {
    const s = state.planetSigns[p];
    let sc = (occupantsInSign(state, s).length - 1) * 10;
    if (EXALT_SIGN[p] === s || SIGN_LORDS[s] === p) sc += 5;
    sc += planetAdvancement(p, state.planetDegs[p]) / 30;
    return sc;
  };
  const s1 = scoreRudra(l8From1);
  const s7 = scoreRudra(l8From7);
  let rudra = s1 >= s7 ? l8From1 : l8From7;
  const weaker = rudra === l8From1 ? l8From7 : l8From1;
  const weakerG = natal.grahas[weaker];
  const weakerConjMalefics = occupantsInSign(state, state.planetSigns[weaker]).some(
    (o) => o !== weaker && ['mars', 'saturn', 'rahu', 'ketu'].includes(o),
  );
  if ((weakerG.dignity === 'debilitated' || weakerG.dignity === 'enemy') && weakerConjMalefics) {
    rudra = weaker;
  }

  const rudraSignIdx = state.planetSigns[rudra];
  const trishoolaIdxs = [rudraSignIdx, (rudraSignIdx + 4) % 12, (rudraSignIdx + 8) % 12];

  // Maheswara: 8th lord from AK (with PVR Ch. 14.3 exceptions)
  const akPlanet = (karakas.find((k) => k.karaka === 'AK')?.graha.toLowerCase() ?? 'sun') as PlanetId;
  const akSign = state.planetSigns[akPlanet];
  const akOcc = occupantsInSign(state, akSign);
  const eighthFromAkSign = (akSign + 7) % 12;
  const eighthOcc = occupantsInSign(state, eighthFromAkSign);
  const nodeHit =
    akOcc.includes('rahu') || akOcc.includes('ketu') || eighthOcc.includes('rahu') || eighthOcc.includes('ketu');
  const mahSign = nodeHit ? (akSign + 5) % 12 : eighthFromAkSign;
  let maheswara = resolveStrongerCoLord(state, mahSign, false);
  const mahG = natal.grahas[maheswara];
  if (mahG.dignity === 'own' || mahG.dignity === 'exalted') {
    const sM = state.planetSigns[maheswara];
    const opt8 = resolveStrongerCoLord(state, (sM + 7) % 12, false);
    const opt12 = resolveStrongerCoLord(state, (sM + 11) % 12, false);
    maheswara = scoreRudra(opt8) >= scoreRudra(opt12) ? opt8 : opt12;
  }
  if (maheswara === 'rahu') maheswara = 'mercury';
  else if (maheswara === 'ketu') maheswara = 'jupiter';

  // Shoola Dasa: 9 yrs/sign forward from stronger of 1st & 7th
  const shoolaSeed = resolveStrongerRasi(state, lagna, seventh);
  let cursorMs = birthStartMs(natal);
  const al = arudhas.find((a) => a.code === 'AL');
  const alSignIdx = al ? SIGN_IDS.indexOf(al.sign.toLowerCase() as any) : lagna;
  const alTriggers = new Set<number>([
    alSignIdx,
    (alSignIdx + 4) % 12,
    (alSignIdx + 8) % 12,
    (alSignIdx + 2) % 12, // 3rd from AL
    TABLE_32_EIGHTH[alSignIdx]!, // Table 32 8th from AL
  ]);

  const jupSign = state.planetSigns.jupiter;
  const periods: RasiDashaPeriod[] = [];
  const vulnerabilityWindows: LongevityAndShoolaReport['vulnerabilityWindows'] = [];

  for (let i = 0; i < 12; i++) {
    const sIdx = (shoolaSeed + i) % 12;
    const endMs = cursorMs + Math.round(9 * SOLAR_YEAR_MS);
    const startIso = isoDateFromMs(cursorMs);
    const endIso = isoDateFromMs(endMs);
    const isAlTrigger = alTriggers.has(sIdx);
    const isTrishoola = trishoolaIdxs.includes(sIdx);

    // Protection check: AK or Jupiter occupying or Rasi-aspecting the sign (unless Rudra)
    const rasiAsp = getRasiDrishtiSigns(sIdx);
    const protectedBy: string[] = [];
    if (akPlanet !== rudra && (akSign === sIdx || rasiAsp.includes(akSign))) {
      protectedBy.push(`AK (${akPlanet})`);
    }
    if (rudra !== 'jupiter' && (jupSign === sIdx || rasiAsp.includes(jupSign))) {
      protectedBy.push('Jupiter');
    }

    const noteParts: string[] = [];
    if (isTrishoola) noteParts.push('Trishoola Rasi');
    if (isAlTrigger) noteParts.push('AL vulnerability trigger');
    if (protectedBy.length > 0) noteParts.push(`Protected by ${protectedBy.join(' & ')}`);

    periods.push({
      signIndex: sIdx,
      sign: SIGN_IDS[sIdx]!,
      years: 9,
      startIso,
      endIso,
      ...(noteParts.length ? { note: noteParts.join('; ') } : {}),
    });

    if (isTrishoola || isAlTrigger) {
      vulnerabilityWindows.push({
        sign: SIGN_IDS[sIdx]!,
        startIso,
        endIso,
        reason: [isTrishoola ? 'Trishoola trine from Rudra' : null, isAlTrigger ? 'AL trine/3rd/8th trigger' : null]
          .filter(Boolean)
          .join(' + '),
        protectedBy,
      });
    }

    cursorMs = endMs;
  }

  return {
    threePairs,
    rudra,
    rudraSign: SIGN_IDS[rudraSignIdx]!,
    trishoolaSigns: trishoolaIdxs.map((idx) => SIGN_IDS[idx]!),
    maheswara,
    shoolaDasa: {
      system: 'shoola',
      varga: 'D1',
      seedSign: SIGN_IDS[shoolaSeed]!,
      periods,
    },
    vulnerabilityWindows,
  };
}
