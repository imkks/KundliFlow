import type { AshtakvargaResult, NatalChart } from '@astro/engine';
import { SIGN_IDS, type PlanetId } from '@astro/facts';

const SOLAR_YEAR_MS = 365.2425 * 86400 * 1000;
const SAVANA_YEAR_MS = 360 * 86400 * 1000;

function isoDateFromMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function birthStartMs(natal: NatalChart): number {
  const parsed = Date.parse(natal.time.birthUtc || natal.time.birthLocal);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

// ============================================================================
// 1. KALACHAKRA DASA (PVR Ch. 24, Tables 42–48 & 51)
// ============================================================================

type KcGroup = 'savya1' | 'savya2' | 'apasavya1' | 'apasavya2';

// 0-indexed Nakshatra -> Group (Table 42)
const NAK_TO_KC_GROUP: KcGroup[] = [
  'savya1',    // 0: Ashwini
  'savya2',    // 1: Bharani
  'savya1',    // 2: Krittika
  'apasavya1', // 3: Rohini
  'apasavya2', // 4: Mrigashira
  'apasavya2', // 5: Ardra
  'savya1',    // 6: Punarvasu
  'savya2',    // 7: Pushya
  'savya1',    // 8: Ashlesha
  'apasavya1', // 9: Magha
  'apasavya2', // 10: Purva Phalguni
  'apasavya2', // 11: Uttara Phalguni
  'savya1',    // 12: Hasta
  'savya2',    // 13: Chitra
  'savya1',    // 14: Swati
  'apasavya1', // 15: Vishakha
  'apasavya2', // 16: Anuradha
  'apasavya2', // 17: Jyeshtha
  'savya1',    // 18: Moola
  'savya2',    // 19: Purva Ashadha
  'savya1',    // 20: Uttara Ashadha
  'apasavya1', // 21: Shravana
  'apasavya2', // 22: Dhanishtha
  'apasavya2', // 23: Shatabhisha
  'savya1',    // 24: Purva Bhadrapada
  'savya2',    // 25: Uttara Bhadrapada
  'savya2',    // 26: Revati
];

// Table 48: Kalachakra Rasi Years (0=Ar .. 11=Pi)
const KC_RASI_YEARS: number[] = [7, 16, 9, 21, 5, 9, 16, 7, 10, 4, 4, 10];

// Tables 44–47: 9-sign sequences (0-based sign indices) and Paramayush per (group, pada 1..4)
const KC_SEQUENCES: Record<KcGroup, Array<{ paramayush: number; signs: number[] }>> = {
  savya1: [
    { paramayush: 100, signs: [0, 1, 2, 3, 4, 5, 6, 7, 8] },       // P1
    { paramayush: 85, signs: [9, 10, 11, 7, 6, 5, 3, 4, 2] },      // P2
    { paramayush: 83, signs: [1, 0, 11, 10, 9, 8, 0, 1, 2] },      // P3
    { paramayush: 86, signs: [3, 4, 5, 6, 7, 8, 9, 10, 11] },      // P4
  ],
  savya2: [
    { paramayush: 100, signs: [7, 6, 5, 3, 4, 2, 1, 0, 11] },      // P1
    { paramayush: 85, signs: [10, 9, 8, 0, 1, 2, 3, 4, 5] },       // P2
    { paramayush: 83, signs: [6, 7, 8, 9, 10, 11, 7, 6, 5] },      // P3
    { paramayush: 86, signs: [3, 4, 2, 1, 0, 11, 10, 9, 8] },      // P4
  ],
  apasavya1: [
    { paramayush: 86, signs: [8, 9, 10, 11, 0, 1, 2, 4, 3] },      // P1
    { paramayush: 83, signs: [5, 6, 7, 11, 10, 9, 8, 7, 6] },      // P2
    { paramayush: 85, signs: [5, 4, 3, 2, 1, 0, 8, 9, 10] },       // P3
    { paramayush: 100, signs: [11, 0, 1, 2, 4, 3, 5, 6, 7] },      // P4
  ],
  apasavya2: [
    { paramayush: 86, signs: [11, 10, 9, 8, 7, 6, 5, 4, 3] },      // P1
    { paramayush: 83, signs: [2, 1, 0, 8, 9, 10, 11, 0, 1] },      // P2
    { paramayush: 85, signs: [2, 4, 3, 5, 6, 7, 11, 10, 9] },      // P3
    { paramayush: 100, signs: [8, 7, 6, 5, 4, 3, 2, 1, 0] },       // P4
  ],
};

function detectKalachakraGati(prevSign: number, nextSign: number, isSavya: boolean): string | undefined {
  // Simhaavalokana (Lion's Leap): Sg<->Ar (8<->0) or Pi<->Sc (11<->7)
  if ((prevSign === 8 && nextSign === 0) || (prevSign === 0 && nextSign === 8) || (prevSign === 11 && nextSign === 7) || (prevSign === 7 && nextSign === 11)) {
    return isSavya
      ? 'Simhaavalokana (Lion Leap): bold pivot; caution with travel/vehicles & allies'
      : 'Simhaavalokana (Lion Leap): major shift affecting elders or status';
  }
  // Markati (Monkey's Leap): Cn->Le (3->4) in Savya; Le->Cn (4->3) in Apasavya
  if ((isSavya && prevSign === 3 && nextSign === 4) || (!isSavya && prevSign === 4 && nextSign === 3)) {
    return isSavya
      ? 'Markati (Monkey Leap): sudden backtracking/recalibration in resources or elders'
      : 'Markati (Monkey Leap): emotional/authority recalibration';
  }
  // Mandooki (Frog's Leap): Vi->Cn (5->3) or Le->Ge (4->2) in Savya; Ge->Le (2->4) or Cn->Vi (3->5) in Apasavya
  if (
    (isSavya && ((prevSign === 5 && nextSign === 3) || (prevSign === 4 && nextSign === 2))) ||
    (!isSavya && ((prevSign === 2 && nextSign === 4) || (prevSign === 3 && nextSign === 5)))
  ) {
    return isSavya
      ? 'Mandooki (Frog Leap): sudden jump across sign; watch elders & guard against disputes'
      : 'Mandooki (Frog Leap): sudden shift affecting partnerships, children, or health';
  }
  return undefined;
}

export interface KalachakraPeriod {
  signIndex: number;
  sign: string;
  years: number;
  startIso: string;
  endIso: string;
  savBindus?: number;
  gati?: string;
}

export interface KalachakraResult {
  group: KcGroup;
  isSavya: boolean;
  pada: number;
  paramayush: number;
  dehaSign: string;
  jeevaSign: string;
  birthDasaSign: string;
  birthBalanceYears: number;
  periods: KalachakraPeriod[];
}

/**
 * Computes Kalachakra Dasa per PVR Ch. 24 (Tables 42–48 & 51).
 */
export function computeKalachakraDasa(
  natal: NatalChart,
  ashtakvarga?: AshtakvargaResult | null,
  useSavanaYear: boolean = false,
): KalachakraResult {
  const moonLon = ((natal.grahas.moon.lon % 360) + 360) % 360;
  const nakIdx = Math.floor(moonLon / (360 / 27)); // 0..26
  const posInNakMin = (moonLon * 60) % 800; // 0..800 arc-minutes
  const pada = Math.min(4, Math.floor(posInNakMin / 200) + 1); // 1..4
  const advInPadaMin = posInNakMin % 200; // 0..200
  const elapsedFraction = advInPadaMin / 200;

  const group = NAK_TO_KC_GROUP[nakIdx]!;
  const isSavya = group === 'savya1' || group === 'savya2';
  const curTable = KC_SEQUENCES[group][pada - 1]!;
  const nextGroup: KcGroup =
    pada < 4
      ? group
      : group === 'savya1'
      ? 'savya2'
      : group === 'savya2'
      ? 'savya1'
      : group === 'apasavya1'
      ? 'apasavya2'
      : 'apasavya1';
  const nextPada = pada < 4 ? pada + 1 : 1;
  const nextTable = KC_SEQUENCES[nextGroup][nextPada - 1]!;

  const yearsElapsed = elapsedFraction * curTable.paramayush;
  const extendedSigns = [...curTable.signs, ...nextTable.signs];

  let cum = 0;
  let startIdx = 0;
  let balanceYears = KC_RASI_YEARS[curTable.signs[0]!]!;
  for (let i = 0; i < curTable.signs.length; i++) {
    const dur = KC_RASI_YEARS[curTable.signs[i]!]!;
    if (cum + dur > yearsElapsed) {
      startIdx = i;
      balanceYears = cum + dur - yearsElapsed;
      break;
    }
    cum += dur;
  }

  const dehaSignIdx = isSavya ? curTable.signs[0]! : curTable.signs[8]!;
  const jeevaSignIdx = isSavya ? curTable.signs[8]! : curTable.signs[0]!;

  const yearMs = useSavanaYear ? SAVANA_YEAR_MS : SOLAR_YEAR_MS;
  let cursorMs = birthStartMs(natal);
  const periods: KalachakraPeriod[] = [];

  for (let step = 0; step < 9; step++) {
    const sIdx = extendedSigns[startIdx + step]!;
    const yrs = step === 0 ? Number(balanceYears.toFixed(4)) : KC_RASI_YEARS[sIdx]!;
    const endMs = cursorMs + Math.round(yrs * yearMs);
    const gati =
      step > 0 ? detectKalachakraGati(extendedSigns[startIdx + step - 1]!, sIdx, isSavya) : undefined;
    const savBindus = ashtakvarga?.sarva[sIdx];

    periods.push({
      signIndex: sIdx,
      sign: SIGN_IDS[sIdx]!,
      years: Number(yrs.toFixed(2)),
      startIso: isoDateFromMs(cursorMs),
      endIso: isoDateFromMs(endMs),
      ...(savBindus !== undefined ? { savBindus } : {}),
      ...(gati ? { gati } : {}),
    });
    cursorMs = endMs;
  }

  return {
    group,
    isSavya,
    pada,
    paramayush: curTable.paramayush,
    dehaSign: SIGN_IDS[dehaSignIdx]!,
    jeevaSign: SIGN_IDS[jeevaSignIdx]!,
    birthDasaSign: SIGN_IDS[extendedSigns[startIdx]!]!,
    birthBalanceYears: Number(balanceYears.toFixed(2)),
    periods,
  };
}

// ============================================================================
// 2. ASHTOTTARI DASA (108-Year Cycle — PVR Ch. 17, Table 39)
// ============================================================================

const ASHTOTTARI_ARCS: Array<{
  lord: PlanetId;
  years: number;
  startDeg: number;
  spanDeg: number;
}> = [
  { lord: 'sun', years: 6, startDeg: 66 + 40 / 60, spanDeg: 53 + 20 / 60 },
  { lord: 'moon', years: 15, startDeg: 120, spanDeg: 40 },
  { lord: 'mars', years: 8, startDeg: 160, spanDeg: 53 + 20 / 60 },
  { lord: 'mercury', years: 17, startDeg: 213 + 20 / 60, spanDeg: 40 },
  { lord: 'saturn', years: 10, startDeg: 253 + 20 / 60, spanDeg: 40 },
  { lord: 'jupiter', years: 19, startDeg: 293 + 20 / 60, spanDeg: 40 },
  { lord: 'rahu', years: 12, startDeg: 333 + 20 / 60, spanDeg: 53 + 20 / 60 }, // wraps 333°20' -> 26°40'
  { lord: 'venus', years: 21, startDeg: 26 + 40 / 60, spanDeg: 40 },
];

export interface AshtottariPeriod {
  lord: PlanetId;
  years: number;
  startIso: string;
  endIso: string;
  antardasas: Array<{ lord: PlanetId; startIso: string; endIso: string }>;
}

export interface AshtottariResult {
  birthLord: PlanetId;
  birthBalanceYears: number;
  isApplicableByPaksha: boolean;
  applicabilityNote: string;
  periods: AshtottariPeriod[];
}

/**
 * Computes Ashtottari Dasa (108-year cycle) per PVR Ch. 17, Table 39.
 * Note: Antardasas start from the NEXT planet after MD lord and end with MD lord.
 */
export function computeAshtottariDasa(natal: NatalChart): AshtottariResult {
  const moonLon = ((natal.grahas.moon.lon % 360) + 360) % 360;
  const sunLon = ((natal.grahas.sun.lon % 360) + 360) % 360;
  const isSukla = ((moonLon - sunLon + 360) % 360) < 180;
  const lagnaIdx = natal.lagna?.signIndex ?? 0;
  const sunH = ((natal.grahas.sun.signIndex - lagnaIdx + 12) % 12) + 1;
  const isDayBirth = sunH >= 7 && sunH <= 12;
  const isApplicableByPaksha = (isDayBirth && !isSukla) || (!isDayBirth && isSukla);

  let startArcIdx = 0;
  let remFraction = 1;

  for (let i = 0; i < ASHTOTTARI_ARCS.length; i++) {
    const arc = ASHTOTTARI_ARCS[i]!;
    const dist = (moonLon - arc.startDeg + 360) % 360;
    if (dist < arc.spanDeg) {
      startArcIdx = i;
      remFraction = (arc.spanDeg - dist) / arc.spanDeg;
      break;
    }
  }

  const firstArc = ASHTOTTARI_ARCS[startArcIdx]!;
  const birthBalanceYears = remFraction * firstArc.years;
  let cursorMs = birthStartMs(natal);
  const periods: AshtottariPeriod[] = [];

  for (let step = 0; step < 8; step++) {
    const idx = (startArcIdx + step) % 8;
    const arc = ASHTOTTARI_ARCS[idx]!;
    const yrs = step === 0 ? birthBalanceYears : arc.years;
    const endMs = cursorMs + Math.round(yrs * SOLAR_YEAR_MS);

    // Antardasas: start from NEXT planet after MD lord, ending with MD lord
    const antardasas: AshtottariPeriod['antardasas'] = [];
    let adCursor = cursorMs;
    const fullMdMs = arc.years * SOLAR_YEAR_MS;
    const elapsedBeforeBirthMs = step === 0 ? (1 - remFraction) * fullMdMs : 0;
    let cumAdMs = 0;

    for (let k = 1; k <= 8; k++) {
      const adArc = ASHTOTTARI_ARCS[(idx + k) % 8]!;
      const adDurMs = (arc.years * adArc.years / 108) * SOLAR_YEAR_MS;
      const adEndCum = cumAdMs + adDurMs;
      if (adEndCum > elapsedBeforeBirthMs) {
        const visibleDur = Math.min(adDurMs, adEndCum - elapsedBeforeBirthMs);
        const adEnd = Math.min(endMs, adCursor + Math.round(visibleDur));
        antardasas.push({
          lord: adArc.lord,
          startIso: isoDateFromMs(adCursor),
          endIso: isoDateFromMs(adEnd),
        });
        adCursor = adEnd;
      }
      cumAdMs = adEndCum;
    }

    periods.push({
      lord: arc.lord,
      years: Number(yrs.toFixed(2)),
      startIso: isoDateFromMs(cursorMs),
      endIso: isoDateFromMs(endMs),
      antardasas,
    });
    cursorMs = endMs;
  }

  return {
    birthLord: firstArc.lord,
    birthBalanceYears: Number(birthBalanceYears.toFixed(2)),
    isApplicableByPaksha,
    applicabilityNote: isApplicableByPaksha
      ? `Classical Paksha criterion MET (${isDayBirth ? 'Day' : 'Night'} birth in ${isSukla ? 'Sukla' : 'Krishna'} Paksha)`
      : `Classical Paksha criterion not met (${isDayBirth ? 'Day' : 'Night'} birth in ${isSukla ? 'Sukla' : 'Krishna'} Paksha — treat as secondary to Vimshottari)`,
    periods,
  };
}
