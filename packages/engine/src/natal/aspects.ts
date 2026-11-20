/**
 * Mutual Planetary Aspects Engine
 *
 * Computes exact angular separations, aspect types, orbs, and weights
 * between all celestial bodies conforming to classical standards.
 */

import { angleDiff } from '../angles.js';
import type { GrahaDetail } from './types.js';

export interface AspectDefinition {
  name: string;
  abbr: string;
  angle: number;
  orb: number;
  weight: number;
}

export const MAJOR_ASPECTS: AspectDefinition[] = [
  { name: 'Conjunction', abbr: 'CONJ', angle: 0, orb: 10, weight: 10 },
  { name: 'Opposition', abbr: 'OPPN', angle: 180, orb: 10, weight: 10 },
  { name: 'Trine', abbr: 'TRIN', angle: 120, orb: 6, weight: 3 },
  { name: 'Square', abbr: 'SQUR', angle: 90, orb: 6, weight: 3 },
  { name: 'Sextile', abbr: 'SEXT', angle: 60, orb: 6, weight: 3 },
  { name: 'Semi-Square', abbr: 'SSQU', angle: 45, orb: 1.5, weight: 1 },
  { name: 'Quincunx', abbr: 'QCUN', angle: 150, orb: 1.5, weight: 1 },
];

export interface DetectedAspect {
  body1: string;
  body2: string;
  aspect: AspectDefinition;
  exactAngle: number;
  diffFromExact: number;
  isApplying: boolean;
  formatted: string;
}

/**
 * Computes mutual aspects between all given planetary bodies
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
      const g1 = grahas[b1];
      const g2 = grahas[b2];
      if (!g1 || !g2) continue;

      const sep = Math.abs(angleDiff(g1.lon, g2.lon));

      for (const asp of MAJOR_ASPECTS) {
        const diff = Math.abs(sep - asp.angle);
        if (diff <= asp.orb) {
          detected.push({
            body1: b1,
            body2: b2,
            aspect: asp,
            exactAngle: Math.round(sep * 100) / 100,
            diffFromExact: Math.round(diff * 100) / 100,
            isApplying: true,
            formatted: `${b1.toUpperCase()} ${asp.abbr} ${b2.toUpperCase()} (${diff.toFixed(2)}° orb)`,
          });
          break;
        }
      }
    }
  }

  return detected;
}
