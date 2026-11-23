import { DateTime } from 'luxon';
import { angleDiff, norm360, SIGNS } from '../angles.js';
import type { EphemerisProvider } from '../ephemeris/types.js';
import { computePositions, houseFromSign, type NatalChart } from './positions.js';
import { SIGN_LORDS, type GrahaDetail } from './types.js';

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
}

// Tajika Tri-Rasheesha (Triplicity Rulers) for Day / Night
// Fire: Sun (day) / Jupiter (night)
// Earth: Venus (day) / Moon (night)
// Air: Saturn (day) / Mercury (night)
// Water: Venus (day) / Mars (night)
const TRI_RASHEESHA_DAY: Record<number, string> = {
  0: 'sun', 4: 'sun', 8: 'sun', // Fire
  1: 'venus', 5: 'venus', 9: 'venus', // Earth
  2: 'saturn', 6: 'saturn', 10: 'saturn', // Air
  3: 'venus', 7: 'venus', 11: 'venus', // Water
};

const TRI_RASHEESHA_NIGHT: Record<number, string> = {
  0: 'jupiter', 4: 'jupiter', 8: 'jupiter',
  1: 'moon', 5: 'moon', 9: 'moon',
  2: 'mercury', 6: 'mercury', 10: 'mercury',
  3: 'mars', 7: 'mars', 11: 'mars',
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
  };
}
