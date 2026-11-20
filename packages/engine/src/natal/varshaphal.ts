import { DateTime } from 'luxon';
import { angleDiff, norm360, SIGNS } from '../angles.js';
import type { EphemerisProvider } from '../ephemeris/types.js';
import { computePositions, houseFromSign, type NatalChart } from './positions.js';

const SIGN_LORDS = [
  'mars', 'venus', 'mercury', 'moon', 'sun', 'mercury',
  'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter',
];

const WEEKDAY_LORDS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];

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
    munthaLord: SIGN_LORDS[munthaSignIndex]!,
    varaPati: WEEKDAY_LORDS[dow]!,
    annualChart,
  };
}
