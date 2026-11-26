import { DateTime } from 'luxon';
import { angleDiff, norm360, SIGNS } from '../angles.js';
import type { EphemerisProvider } from '../ephemeris/types.js';
import { computePositions, houseFromSign, type NatalChart } from './positions.js';
import { SIGN_LORDS, type GrahaDetail } from './types.js';
import { computeAnnualSahams, type SahamResult } from './sahams.js';

const WEEKDAY_LORDS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];

export interface Panchadhikari {
  munthaLord: string;
  janmaLagnesha: string;
  varshaLagnesha: string;
  triRasheesha: string;
  dinaRatriPati: string;
}

export interface VarshaphalResult {
  targetYear: number;
  completedAge: number;
  varshaPraveshUtc: string;
  varshaPraveshLocal: string;
  varshaLagnaSign: string;
  varshaLagnaSignIndex: number;
  munthaSign: string;
  munthaSignIndex: number;
  munthaHouseInVarsha: number;
  munthaLord: string;
  varaPati: string; // Weekday lord of solar return
  annualChart: NatalChart;
  panchadhikari: Panchadhikari;
  varsheshwara: string;
  varsheshwaraReason: string;
  harshaBala: Record<string, number>;
  isDayReturn: boolean;
  sahams: Record<string, SahamResult>;
  sahamsList: SahamResult[];
}

// PVR Table 73 / Classical Tajika Triraasi Lords (Day / Night)
const TRI_RASHEESHA_DAY: Record<number, string> = {
  0: 'sun',     // Ar
  1: 'venus',   // Ta
  2: 'saturn',  // Ge
  3: 'venus',   // Cn
  4: 'jupiter', // Le
  5: 'moon',    // Vi
  6: 'mercury', // Li
  7: 'mars',    // Sc
  8: 'saturn',  // Sg
  9: 'mars',    // Cp
  10: 'jupiter',// Aq
  11: 'moon',   // Pi
};

const TRI_RASHEESHA_NIGHT: Record<number, string> = {
  0: 'jupiter', // Ar
  1: 'moon',    // Ta
  2: 'mercury', // Ge
  3: 'mars',    // Cn
  4: 'sun',     // Le
  5: 'venus',   // Vi
  6: 'saturn',  // Li
  7: 'venus',   // Sc
  8: 'saturn',  // Sg
  9: 'mars',    // Cp
  10: 'jupiter',// Aq
  11: 'moon',   // Pi
};

// Joy of House placement for Harsha Bala (Factor 1)
const HARSHA_HOUSES: Record<string, number> = {
  sun: 9,
  moon: 3,
  mars: 6,
  mercury: 1,
  jupiter: 11,
  venus: 5,
  saturn: 12,
};

/**
 * Computes 4-factor Tajika Harsha Bala (0 to 20 points)
 */
function computeHarshaBala(chart: NatalChart, isDay: boolean): Record<string, number> {
  const result: Record<string, number> = {};
  const lagnaIdx = chart.lagna?.signIndex ?? 0;

  for (const p of ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn']) {
    const g = (chart.grahas as Record<string, GrahaDetail>)[p];
    if (!g) {
      result[p] = 5;
      continue;
    }
    let pts = 0;
    const h = houseFromSign(g.signIndex, lagnaIdx);

    // Factor 1: Sthana Bala (Joy of House) = 5 pts
    if (h === HARSHA_HOUSES[p]) pts += 5;

    // Factor 2: Sva-Kshetra (Own sign or Exaltation) = 5 pts
    const isOwn = SIGN_LORDS[g.signIndex] === p;
    const isExalted =
      (p === 'sun' && g.signIndex === 0) ||
      (p === 'moon' && g.signIndex === 1) ||
      (p === 'mars' && g.signIndex === 9) ||
      (p === 'mercury' && g.signIndex === 5) ||
      (p === 'jupiter' && g.signIndex === 3) ||
      (p === 'venus' && g.signIndex === 11) ||
      (p === 'saturn' && g.signIndex === 6);
    if (isOwn || isExalted) pts += 5;

    // Factor 3: Stri-Purusha (Masculine in masculine sign / feminine in feminine sign) = 5 pts
    const isOddSign = g.signIndex % 2 === 0;
    const isMasculine = p === 'sun' || p === 'mars' || p === 'jupiter';
    if ((isMasculine && isOddSign) || (!isMasculine && !isOddSign)) pts += 5;

    // Factor 4: Dina-Ratri Bala = 5 pts
    if (isDay) {
      if (p === 'sun' || p === 'jupiter' || p === 'saturn' || p === 'mercury') pts += 5;
    } else {
      if (p === 'moon' || p === 'mars' || p === 'venus' || p === 'mercury') pts += 5;
    }

    result[p] = pts;
  }

  return result;
}

/**
 * Computes Tajika Varshaphal (Solar Return) for a target calendar year:
 * finds the exact UTC instant when transiting sidereal Sun equals natal Sun's longitude,
 * builds the Varshaphal chart, Muntha, and Vara Pati.
 */
export function computeVarshaphal(
  eph: EphemerisProvider,
  natal: NatalChart,
  targetYear: number,
): VarshaphalResult {
  const natalSunLon = natal.grahas.sun.lon;
  const birthDt = DateTime.fromISO(natal.time.birthUtc, { zone: 'utc' });
  const completedAge = Math.max(0, targetYear - birthDt.year);

  // Initial guess: natal birthday in targetYear
  let jd = natal.time.julianDayUt + completedAge * 365.25636;

  // Secant/Newton refinement to < 0.0001° (~3 seconds precision)
  for (let iter = 0; iter < 12; iter++) {
    const ay = eph.ayanamsa(jd, natal.ayanamsa.id);
    const sunTrop = eph.bodies(jd, ['sun']).sun.lon;
    const sunSid = norm360(sunTrop - ay);
    const err = angleDiff(sunSid, natalSunLon); // signed [-180, 180]
    if (Math.abs(err) < 0.0001) break;
    // Sun moves ~0.9856 deg/day
    jd -= err / 0.9856;
  }

  // Convert JD back to UTC ISO (JD 2440587.5 = Unix epoch 1970-01-01T00:00:00Z)
  const unixMs = (jd - 2440587.5) * 86400 * 1000;
  const praveshUtc = DateTime.fromMillis(unixMs, { zone: 'utc' });
  const praveshLocal = praveshUtc.setZone(natal.time.tzId);

  const annualChart = computePositions(
    eph,
    {
      ...natal.time,
      birthUtc: praveshUtc.toISO()!,
      birthLocal: praveshLocal.toISO({ includeOffset: false })!,
      julianDayUt: jd,
    },
    natal.place,
    { ayanamsa: natal.ayanamsa.id, nodeType: 'mean' },
  );

  const natalLagnaIdx = natal.lagna?.signIndex ?? 0;
  const munthaSignIndex = (natalLagnaIdx + completedAge) % 12;
  const varshaLagnaIdx = annualChart.lagna?.signIndex ?? natalLagnaIdx;
  const dow = praveshLocal.weekday % 7; // luxon 7=Sun -> 0

  // Determine diurnal vs nocturnal return
  const sunHouseInVarsha = houseFromSign(annualChart.grahas.sun.signIndex, varshaLagnaIdx);
  const isDayReturn = sunHouseInVarsha >= 7 && sunHouseInVarsha <= 12;

  // Compute Panchadhikari (5 Office-Bearers)
  const munthaLord = SIGN_LORDS[munthaSignIndex]!;
  const janmaLagnesha = SIGN_LORDS[natalLagnaIdx]!;
  const varshaLagnesha = SIGN_LORDS[varshaLagnaIdx]!;
  const triRasheesha = isDayReturn
    ? TRI_RASHEESHA_DAY[varshaLagnaIdx]!
    : TRI_RASHEESHA_NIGHT[varshaLagnaIdx]!;
  const dinaRatriPati = isDayReturn
    ? SIGN_LORDS[annualChart.grahas.sun.signIndex]!
    : SIGN_LORDS[annualChart.grahas.moon.signIndex]!;

  const panchadhikari: Panchadhikari = {
    munthaLord,
    janmaLagnesha,
    varshaLagnesha,
    triRasheesha,
    dinaRatriPati,
  };

  // Compute Harsha Bala
  const harshaBala = computeHarshaBala(annualChart, isDayReturn);

  // Determine Varsheshwara (Lord of the Year)
  // Candidate must aspect Varsha Lagna in Tajika scheme (1, 3, 4, 5, 7, 9, 10, 11)
  const candidatePriority = [munthaLord, varshaLagnesha, janmaLagnesha, triRasheesha, dinaRatriPati];
  const uniqueCandidates = Array.from(new Set(candidatePriority));

  const aspectingCandidates = uniqueCandidates.filter((cand) => {
    const cg = (annualChart.grahas as Record<string, GrahaDetail>)[cand];
    if (!cg) return false;
    const h = houseFromSign(cg.signIndex, varshaLagnaIdx);
    return [1, 3, 4, 5, 7, 9, 10, 11].includes(h);
  });

  const eligiblePool = aspectingCandidates.length > 0 ? aspectingCandidates : uniqueCandidates;
  let varsheshwara = eligiblePool[0]!;
  let maxScore = -1;
  let reason = '';

  for (const cand of eligiblePool) {
    const score = harshaBala[cand] ?? 0;
    if (score > maxScore) {
      maxScore = score;
      varsheshwara = cand;
      const isAspecting = aspectingCandidates.includes(cand);
      reason = `${cand.toUpperCase()} has highest Harsha Bala (${score}/20 pts)${isAspecting ? ' and directly aspects Varsha Lagna' : ''}`;
    }
  }

  return {
    targetYear,
    completedAge,
    varshaPraveshUtc: praveshUtc.toISO()!,
    varshaPraveshLocal: praveshLocal.toISO()!,
    varshaLagnaSign: SIGNS[varshaLagnaIdx]!,
    varshaLagnaSignIndex: varshaLagnaIdx,
    munthaSign: SIGNS[munthaSignIndex]!,
    munthaSignIndex,
    munthaHouseInVarsha: houseFromSign(munthaSignIndex, varshaLagnaIdx),
    munthaLord,
    varaPati: WEEKDAY_LORDS[dow]!,
    annualChart,
    panchadhikari,
    varsheshwara,
    varsheshwaraReason: reason,
    harshaBala,
    isDayReturn,
    ...computeAnnualSahams(annualChart, isDayReturn, harshaBala),
  };
}

export interface TajakaEntryChartResult {
  mode: 'monthly' | '60hr';
  label: string;
  targetDateIso: string;
  completedAge: number;
  solarMonthNumber: number; // 1..12
  subPeriodNumber?: number; // 1..12 for 60hr
  targetSunLonDeg: number;
  entryUtc: string;
  entryLocal: string;
  endUtc: string;
  endLocal: string;
  durationDays: number;
  entryLagnaSign: string;
  entryLagnaSignIndex: number;
  munthaSign: string;
  munthaSignIndex: number;
  munthaHouseInChart: number;
  munthaLord: string;
  varaPati: string;
  isDayReturn: boolean;
  entryChart: NatalChart;
  panchadhikari: Panchadhikari & { varsheshwara?: string };
  periodLord: string;
  periodLordReason: string;
  harshaBala: Record<string, number>;
  sahams: Record<string, SahamResult>;
  sahamsList: SahamResult[];
}

function solveSunLongitudeJd(
  eph: EphemerisProvider,
  ayanamsaId: NatalChart['ayanamsa']['id'],
  initialJd: number,
  targetSunLon: number,
): number {
  let jd = initialJd;
  for (let iter = 0; iter < 12; iter++) {
    const ay = eph.ayanamsa(jd, ayanamsaId);
    const sunTrop = eph.bodies(jd, ['sun']).sun.lon;
    const sunSid = norm360(sunTrop - ay);
    const err = angleDiff(sunSid, targetSunLon);
    if (Math.abs(err) < 0.0001) break;
    jd -= err / 0.9856;
  }
  return jd;
}

/**
 * Computes Tajaka Monthly (Maasa Pravesh, every 30° of Sun motion) or
 * 60-Hour (Shashti-Hora, every 2°30' of Sun motion) entry chart at birthplace coordinates
 * covering targetDateIso (PVR Ch. 27–28 / R-15).
 */
export function computeTajakaEntryChart(
  eph: EphemerisProvider,
  natal: NatalChart,
  mode: 'monthly' | '60hr',
  targetDateIso: string,
  annualVarsheshwara?: string,
): TajakaEntryChartResult {
  const natalSunLon = natal.grahas.sun.lon;
  const parsed = DateTime.fromISO(targetDateIso, { zone: 'utc' });
  const refDt = parsed.isValid
    ? (targetDateIso.length <= 10 ? parsed.plus({ hours: 12 }) : parsed)
    : DateTime.utc();
  const targetJd = refDt.toMillis() / 86400000 + 2440587.5;

  const ayNow = eph.ayanamsa(targetJd, natal.ayanamsa.id);
  const sunNowSid = norm360(eph.bodies(targetJd, ['sun']).sun.lon - ayNow);
  const deltaFromNatalSun = norm360(sunNowSid - natalSunLon);

  const stepDeg = mode === 'monthly' ? 30 : 2.5;
  const stepIndex = Math.floor(deltaFromNatalSun / stepDeg);
  const solarMonthIndex = mode === 'monthly' ? stepIndex % 12 : Math.floor(stepIndex / 12) % 12;
  const subPeriodIndex = mode === '60hr' ? stepIndex % 12 : undefined;

  const targetSunLon = norm360(natalSunLon + stepIndex * stepDeg);
  const nextSunLon = norm360(natalSunLon + (stepIndex + 1) * stepDeg);

  const guessEntryJd = targetJd - (deltaFromNatalSun - stepIndex * stepDeg) / 0.9856;
  const entryJd = solveSunLongitudeJd(eph, natal.ayanamsa.id, guessEntryJd, targetSunLon);
  const nextJd = solveSunLongitudeJd(eph, natal.ayanamsa.id, entryJd + stepDeg / 0.9856, nextSunLon);

  const entryUtc = DateTime.fromMillis((entryJd - 2440587.5) * 86400 * 1000, { zone: 'utc' });
  const entryLocal = entryUtc.setZone(natal.time.tzId);
  const endUtc = DateTime.fromMillis((nextJd - 2440587.5) * 86400 * 1000, { zone: 'utc' });
  const endLocal = endUtc.setZone(natal.time.tzId);
  const durationDays = Number((nextJd - entryJd).toFixed(2));

  const entryChart = computePositions(
    eph,
    {
      ...natal.time,
      birthUtc: entryUtc.toISO()!,
      birthLocal: entryLocal.toISO({ includeOffset: false })!,
      julianDayUt: entryJd,
    },
    natal.place,
    { ayanamsa: natal.ayanamsa.id, nodeType: 'mean' },
  );

  const completedAge = Math.max(0, Math.floor((entryJd - natal.time.julianDayUt) / 365.25636));
  const natalLagnaIdx = natal.lagna?.signIndex ?? 0;
  const annualMunthaIdx = (natalLagnaIdx + completedAge) % 12;
  const monthlyMunthaIdx = (annualMunthaIdx + solarMonthIndex) % 12;
  const munthaSignIndex =
    mode === 'monthly'
      ? monthlyMunthaIdx
      : (monthlyMunthaIdx + (subPeriodIndex ?? 0)) % 12;

  const entryLagnaIdx = entryChart.lagna?.signIndex ?? natalLagnaIdx;
  const dow = entryLocal.weekday % 7;
  const sunHouse = houseFromSign(entryChart.grahas.sun.signIndex, entryLagnaIdx);
  const isDayReturn = sunHouse >= 7 && sunHouse <= 12;

  const munthaLord = SIGN_LORDS[munthaSignIndex]!;
  const janmaLagnesha = SIGN_LORDS[natalLagnaIdx]!;
  const varshaLagnesha = SIGN_LORDS[entryLagnaIdx]!;
  const triRasheesha = isDayReturn
    ? TRI_RASHEESHA_DAY[entryLagnaIdx]!
    : TRI_RASHEESHA_NIGHT[entryLagnaIdx]!;
  const dinaRatriPati = isDayReturn
    ? SIGN_LORDS[entryChart.grahas.sun.signIndex]!
    : SIGN_LORDS[entryChart.grahas.moon.signIndex]!;

  const harshaBala = computeHarshaBala(entryChart, isDayReturn);
  const rawCandidates = [
    munthaLord,
    varshaLagnesha,
    janmaLagnesha,
    triRasheesha,
    dinaRatriPati,
    ...(annualVarsheshwara ? [annualVarsheshwara] : []),
  ];
  const uniqueCandidates = Array.from(new Set(rawCandidates));
  const aspectingCandidates = uniqueCandidates.filter((cand) => {
    const cg = (entryChart.grahas as Record<string, GrahaDetail>)[cand];
    if (!cg) return false;
    const h = houseFromSign(cg.signIndex, entryLagnaIdx);
    return [1, 3, 4, 5, 7, 9, 10, 11].includes(h);
  });
  const eligible = aspectingCandidates.length > 0 ? aspectingCandidates : uniqueCandidates;

  let periodLord = eligible[0]!;
  let maxScore = -1;
  let periodLordReason = '';
  for (const cand of eligible) {
    const score = harshaBala[cand] ?? 0;
    if (score > maxScore) {
      maxScore = score;
      periodLord = cand;
      periodLordReason = `${cand.toUpperCase()} has highest Harsha Bala (${score}/20 pts)${aspectingCandidates.includes(cand) ? ' and aspects Entry Lagna' : ''}`;
    }
  }

  return {
    mode,
    label:
      mode === 'monthly'
        ? `Maasa Pravesh (Solar Month ${solarMonthIndex + 1} of Year ${completedAge + 1})`
        : `Shashti-Hora 60-Hr Chart (Month ${solarMonthIndex + 1}, Sub-period ${(subPeriodIndex ?? 0) + 1})`,
    targetDateIso: refDt.toISO()!.slice(0, 10),
    completedAge,
    solarMonthNumber: solarMonthIndex + 1,
    subPeriodNumber: subPeriodIndex !== undefined ? subPeriodIndex + 1 : undefined,
    targetSunLonDeg: Number(targetSunLon.toFixed(4)),
    entryUtc: entryUtc.toISO()!,
    entryLocal: entryLocal.toISO()!,
    endUtc: endUtc.toISO()!,
    endLocal: endLocal.toISO()!,
    durationDays,
    entryLagnaSign: SIGNS[entryLagnaIdx]!,
    entryLagnaSignIndex: entryLagnaIdx,
    munthaSign: SIGNS[munthaSignIndex]!,
    munthaSignIndex,
    munthaHouseInChart: houseFromSign(munthaSignIndex, entryLagnaIdx),
    munthaLord,
    varaPati: WEEKDAY_LORDS[dow]!,
    isDayReturn,
    entryChart,
    panchadhikari: {
      munthaLord,
      janmaLagnesha,
      varshaLagnesha,
      triRasheesha,
      dinaRatriPati,
      ...(annualVarsheshwara ? { varsheshwara: annualVarsheshwara } : {}),
    },
    periodLord,
    periodLordReason,
    harshaBala,
    ...computeAnnualSahams(entryChart, isDayReturn, harshaBala),
  };
}
