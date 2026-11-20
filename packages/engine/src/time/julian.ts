/**
 * Julian Day helpers (pure, no clock reads).
 * Source: Meeus, Astronomical Algorithms, 2nd ed., ch. 7 (Gregorian calendar only).
 */

export const J2000 = 2451545.0;
const UNIX_EPOCH_JD = 2440587.5;

/** Julian Day (UT) for a Gregorian calendar date/time in UTC. */
export const julianDayUt = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): number => {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  const dayFrac = (hour + minute / 60 + second / 3600) / 24;
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + dayFrac + b - 1524.5;
};

/** Julian Day (UT) from an ISO-8601 instant string, e.g. "1998-09-07T17:50:34Z". */
export const julianDayFromIso = (iso: string): number => {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) throw new Error(`INVALID_INPUT: not an ISO instant: ${iso}`);
  return ms / 86_400_000 + UNIX_EPOCH_JD;
};

export const jdToUnixMs = (jd: number): number => (jd - UNIX_EPOCH_JD) * 86_400_000;

/** Julian centuries since J2000 (UT-based; adequate for the low-precision fallbacks). */
export const centuriesSinceJ2000 = (jd: number): number => (jd - J2000) / 36525;
