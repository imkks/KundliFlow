import { centuriesSinceJ2000 } from '../../time/julian.js';

/**
 * Pure-TS fallbacks for providers that lack a capability.
 */

/**
 * General precession in longitude p_A, arcseconds, from J2000.
 * Source: Capitaine, Wallace & Chapront (2003), IAU 2006 precession, A&A 412, 567, eq. 39.
 */
export const generalPrecessionArcsec = (T: number): number =>
  5028.796195 * T +
  1.1054348 * T ** 2 +
  0.00007964 * T ** 3 -
  0.000023857 * T ** 4 -
  0.0000000383 * T ** 5;

/**
 * Mean ayanamsa anchors (value at epoch t0, degrees), as defined in Swiss Ephemeris 2.10
 * (sweph.h / swephlib.c ayanamsa table, SE_SIDM_LAHIRI: t0 = 1956-09-22, value
 * 23.250182778 - 0.004658035).
 * Only Lahiri is provided; other systems need a provider that supports them.
 */
export const AYANAMSA_ANCHORS = {
  lahiri: { t0Jd: 2435553.5, valueDeg: 23.250182778 - 0.004658035 },
  raman: { t0Jd: 2451545.0, valueDeg: 22.410754763 },
  kp_old: { t0Jd: 2451545.0, valueDeg: 23.760203763 },
  kp_new: { t0Jd: 2451545.0, valueDeg: 23.760203763 },
  yukteshwar: { t0Jd: 2451545.0, valueDeg: 22.478766750 },
} as const;

/** Mean ayanamsa (no nutation), degrees. */
export const meanAyanamsa = (jdUt: number, anchor: { t0Jd: number; valueDeg: number }): number =>
  anchor.valueDeg +
  (generalPrecessionArcsec(centuriesSinceJ2000(jdUt)) - generalPrecessionArcsec(centuriesSinceJ2000(anchor.t0Jd))) /
    3600;

/**
 * Mean longitude of the Moon's ascending node, mean equinox of date, degrees.
 * Source: Meeus, Astronomical Algorithms 2nd ed., eq. 47.7.
 */
export const meanNodeLongitude = (jdUt: number): number => {
  const T = centuriesSinceJ2000(jdUt);
  return 125.0445479 - 1934.1362891 * T + 0.0020754 * T ** 2 + T ** 3 / 467441 - T ** 4 / 60616000;
};

/** Ascendant and MC from ARMC, obliquity and latitude (all degrees). Meeus ch. 13 / standard spherical trig. */
export const ascendantFromArmc = (armcDeg: number, oblDeg: number, latDeg: number): { asc: number; mc: number } => {
  const r = Math.PI / 180;
  const armc = armcDeg * r;
  const eps = oblDeg * r;
  const phi = latDeg * r;
  const asc = Math.atan2(Math.cos(armc), -(Math.sin(armc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)));
  const mc = Math.atan2(Math.sin(armc), Math.cos(armc) * Math.cos(eps));
  const n = (x: number) => ((x / r) % 360 + 360) % 360;
  return { asc: n(asc), mc: n(mc) };
};
