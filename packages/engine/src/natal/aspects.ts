/**
 * Mutual Planetary Aspects & Vedic Drishti Engine
 *
 * Computes exact angular separations, aspect types, orbs, and weights
 * between celestial bodies conforming to both Western Ptolemaic aspects
 * and Classical Parashari Graha Drishti standards.
 */

import { angleDiff, norm360 } from '../angles.js';
import type { GrahaDetail } from './types.js';

export interface AspectDefinition {
  name: string;
  abbr: string;
  angle: number;
  orb: number;
  weight: number;
  nature: string;
}

export const MAJOR_ASPECTS: AspectDefinition[] = [
  { name: 'Conjunction', abbr: 'CONJ', angle: 0, orb: 10, weight: 10, nature: 'Neutral/Variable' },
  { name: 'Opposition', abbr: 'OPPN', angle: 180, orb: 10, weight: 10, nature: 'Challenging' },
  { name: 'Trine', abbr: 'TRIN', angle: 120, orb: 6, weight: 3, nature: 'Harmonious' },
  { name: 'Square', abbr: 'SQUR', angle: 90, orb: 6, weight: 3, nature: 'Dynamic/Tension' },
  { name: 'Sextile', abbr: 'SEXT', angle: 60, orb: 6, weight: 3, nature: 'Supportive' },
  { name: 'Semi-Square', abbr: 'SSQU', angle: 45, orb: 1.5, weight: 1, nature: 'Minor Friction' },
  { name: 'Quincunx', abbr: 'QCUN', angle: 150, orb: 1.5, weight: 1, nature: 'Adjustment' },
];

export interface DetectedAspect {
  body1: string;
  body2: string;
  aspect: AspectDefinition;
  /** Actual shortest angular separation between bodies in degrees [0, 180] */
  separation: number;
  /** Backward-compatible alias for separation */
  exactAngle: number;
  /** Absolute deviation from nominal aspect angle in degrees */
  diffFromExact: number;
  /** Alias for diffFromExact */
  orb: number;
  /** Whether the aspect is applying (becoming more exact) or separating */
  isApplying: boolean;
  formatted: string;

  // Direct UI compatibility aliases
  from: string;
  to: string;
  type: string;
}

/**
 * Computes mutual Ptolemaic aspects between celestial bodies.
 *
 * Automatically filters out the false astronomical Rahu-Ketu nodal opposition
 * and accurately calculates applying vs. separating aspects using planet velocities.
 */
export function computeMutualAspects(
  grahas: Record<string, GrahaDetail>,
): DetectedAspect[] {
  const bodies = Object.keys(grahas);
  const detected: DetectedAspect[] = [];

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const b1 = bodies[i]!;
      const b2 = bodies[j]!;

      // Filter out Rahu-Ketu mutual opposition: they form a fixed 180° nodal axis
      if (
        (b1 === 'rahu' && b2 === 'ketu') ||
        (b1 === 'ketu' && b2 === 'rahu')
      ) {
        continue;
      }

      const g1 = grahas[b1];
      const g2 = grahas[b2];
      if (!g1 || !g2) continue;

      const sep = Math.abs(angleDiff(g1.lon, g2.lon));

      for (const asp of MAJOR_ASPECTS) {
        const diff = Math.abs(sep - asp.angle);
        if (diff <= asp.orb) {
          // Calculate applying vs separating using planetary speeds if available
          const s1 = g1.speed ?? 0;
          const s2 = g2.speed ?? 0;
          const dt = 0.01; // small forward time delta (~14.4 mins)
          const nextSep = Math.abs(angleDiff(g1.lon + s1 * dt, g2.lon + s2 * dt));
          const nextDiff = Math.abs(nextSep - asp.angle);
          const isApplying = nextDiff < diff;

          const roundedSep = Math.round(sep * 100) / 100;
          const roundedDiff = Math.round(diff * 100) / 100;

          detected.push({
            body1: b1,
            body2: b2,
            aspect: asp,
            separation: roundedSep,
            exactAngle: roundedSep,
            diffFromExact: roundedDiff,
            orb: roundedDiff,
            isApplying,
            formatted: `${b1.toUpperCase()} ${asp.abbr} ${b2.toUpperCase()} (${diff.toFixed(2)}° orb${isApplying ? ', app' : ', sep'})`,
            from: b1,
            to: b2,
            type: asp.name,
          });
          break;
        }
      }
    }
  }

  return detected;
}

export interface VedicAspect {
  from: string;
  to: string;
  aspectType: string;
  offset: number; // e.g. 4, 7, 8
  nominalAngle: number; // e.g. 90, 180, 210
  forwardSeparation: number; // forward degrees [0, 360)
  orb: number; // degree difference from nominal aspect angle
  isApplying: boolean;
  formatted: string;

  // Interoperability aliases
  body1: string;
  body2: string;
  type: string;
  exactAngle: number;
  diffFromExact: number;
}

/**
 * Computes Classical Parashari Graha Drishti (Planetary Aspects)
 *
 * Rules:
 * - All planets cast a full 7th aspect (180° forward, opposite sign).
 * - Mars casts special full aspects on the 4th (90°) and 8th (210°).
 * - Jupiter casts special full aspects on the 5th (120°) and 9th (240°).
 * - Saturn casts special full aspects on the 3rd (60°) and 10th (270°).
 * - Optionally Rahu/Ketu cast 5th and 9th aspects (enabled by default).
 */
export function computeVedicAspects(
  grahas: Record<string, GrahaDetail>,
  options: { includeRahuKetu?: boolean; maxOrb?: number } = {},
): VedicAspect[] {
  const { includeRahuKetu = true, maxOrb = 12 } = options;
  const aspectingPlanets = [
    'sun',
    'moon',
    'mars',
    'mercury',
    'jupiter',
    'venus',
    'saturn',
    ...(includeRahuKetu ? ['rahu', 'ketu'] : []),
  ];

  const aspects: VedicAspect[] = [];

  for (const pFrom of aspectingPlanets) {
    const gFrom = grahas[pFrom];
    if (!gFrom) continue;

    // Determine classical aspect offsets and nominal angles for this planet
    const targetConfigs: Array<{ offset: number; nominalAngle: number; label: string }> = [
      { offset: 7, nominalAngle: 180, label: '7th Aspect (Opposition)' },
    ];

    if (pFrom === 'mars') {
      targetConfigs.push(
        { offset: 4, nominalAngle: 90, label: '4th Aspect (Chaturtha)' },
        { offset: 8, nominalAngle: 210, label: '8th Aspect (Ashtama)' },
      );
    } else if (pFrom === 'jupiter') {
      targetConfigs.push(
        { offset: 5, nominalAngle: 120, label: '5th Aspect (Trikona)' },
        { offset: 9, nominalAngle: 240, label: '9th Aspect (Trikona)' },
      );
    } else if (pFrom === 'saturn') {
      targetConfigs.push(
        { offset: 3, nominalAngle: 60, label: '3rd Aspect (Tritiya)' },
        { offset: 10, nominalAngle: 270, label: '10th Aspect (Dashama)' },
      );
    } else if (pFrom === 'rahu' || pFrom === 'ketu') {
      targetConfigs.push(
        { offset: 5, nominalAngle: 120, label: '5th Aspect (Trikona)' },
        { offset: 9, nominalAngle: 240, label: '9th Aspect (Trikona)' },
      );
    }

    for (const pTo of aspectingPlanets) {
      if (pFrom === pTo) continue;
      // Skip Rahu -> Ketu and Ketu -> Rahu
      if (
        (pFrom === 'rahu' && pTo === 'ketu') ||
        (pFrom === 'ketu' && pTo === 'rahu')
      ) {
        continue;
      }

      const gTo = grahas[pTo];
      if (!gTo) continue;

      // Sign offset counting from fromSign to toSign (1 = same sign, 7 = opposite sign)
      const signOffset = ((gTo.signIndex - gFrom.signIndex + 12) % 12) + 1;
      const forwardSep = norm360(gTo.lon - gFrom.lon);

      for (const cfg of targetConfigs) {
        if (signOffset === cfg.offset) {
          const diff = Math.abs(forwardSep - cfg.nominalAngle);
          // Check if within max orb
          if (diff <= maxOrb) {
            const s1 = gFrom.speed ?? 0;
            const s2 = gTo.speed ?? 0;
            const dt = 0.01;
            const nextSep = norm360((gTo.lon + s2 * dt) - (gFrom.lon + s1 * dt));
            const nextDiff = Math.abs(nextSep - cfg.nominalAngle);
            const isApplying = nextDiff < diff;

            const roundedSep = Math.round(forwardSep * 100) / 100;
            const roundedOrb = Math.round(diff * 100) / 100;

            const ordinal =
              cfg.offset === 3
                ? '3rd'
                : cfg.offset === 1
                ? '1st'
                : cfg.offset === 2
                ? '2nd'
                : `${cfg.offset}th`;

            aspects.push({
              from: pFrom,
              to: pTo,
              aspectType: cfg.label,
              offset: cfg.offset,
              nominalAngle: cfg.nominalAngle,
              forwardSeparation: roundedSep,
              orb: roundedOrb,
              isApplying,
              formatted: `${pFrom.toUpperCase()} → ${pTo.toUpperCase()} (${ordinal}, ${roundedOrb}° orb)`,
              body1: pFrom,
              body2: pTo,
              type: `${ordinal} Aspect`,
              exactAngle: roundedSep,
              diffFromExact: roundedOrb,
            });
          }
        }
      }
    }
  }

  // Sort by tightness of orb
  return aspects.sort((a, b) => a.orb - b.orb);
}

