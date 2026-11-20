import { nakshatraOf, norm360, signOf, type NakshatraPosition, type SignPosition } from './angles.js';
import type { AyanamsaId, BodyId, EphemerisProvider } from './ephemeris/types.js';

/**
 * Minimal sidereal snapshot used by M0 conformance tests. M1 extends this into computeNatal.
 */

export const GRAHAS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'] as const;
export type Graha = (typeof GRAHAS)[number];

export interface GrahaPosition extends SignPosition, NakshatraPosition {
  lon: number; // sidereal
  speed: number;
  retrograde: boolean;
}

export interface SiderealSnapshot {
  provider: string;
  jdUt: number;
  ayanamsaId: AyanamsaId;
  ayanamsa: number;
  grahas: Record<Graha, GrahaPosition>;
  lagna: (SignPosition & NakshatraPosition & { lon: number }) | null;
}

export interface SnapshotOptions {
  ayanamsa: AyanamsaId;
  nodeType: 'mean' | 'true';
  /** Omit for Moon-only views (unknown birth time). */
  place?: { lat: number; lon: number };
}

const SEVEN: readonly BodyId[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];

export const siderealSnapshot = (eph: EphemerisProvider, jdUt: number, o: SnapshotOptions): SiderealSnapshot => {
  const ay = eph.ayanamsa(jdUt, o.ayanamsa);
  const trop = eph.bodies(jdUt, SEVEN);
  const node = o.nodeType === 'true' ? eph.trueNode(jdUt) : eph.meanNode(jdUt);

  const pos = (tropLon: number, speed: number, forceRetro = false): GrahaPosition => {
    const lon = norm360(tropLon - ay);
    return { lon, speed, retrograde: forceRetro || speed < 0, ...signOf(lon), ...nakshatraOf(lon) };
  };

  const grahas = {} as Record<Graha, GrahaPosition>;
  for (const id of SEVEN) {
    const b = trop[id];
    grahas[id as Graha] = pos(b.lon, b.speed);
  }
  // Mean-node convention: Rahu and Ketu are always shown retrograde (spec 3.2).
  grahas.rahu = pos(node.lon, node.speed, true);
  grahas.ketu = pos(node.lon + 180, node.speed, true);

  let lagna: SiderealSnapshot['lagna'] = null;
  if (o.place) {
    const a = eph.angles(jdUt, o.place.lat, o.place.lon);
    const lon = norm360(a.ascTropical - ay);
    lagna = { lon, ...signOf(lon), ...nakshatraOf(lon) };
  }

  return { provider: eph.version, jdUt, ayanamsaId: o.ayanamsa, ayanamsa: ay, grahas, lagna };
};
