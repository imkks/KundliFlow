import { norm360, signOf, nakshatraOf } from '../angles.js';
import type { EphemerisProvider, AyanamsaId, BodyId } from '../ephemeris/types.js';
import type { ResolvedTime } from '../time/resolve.js';
import type { GrahaDetail, GrahaName, LagnaDetail, VedicGraha } from './types.js';

export interface NatalSettings {
  ayanamsa: AyanamsaId;
  nodeType: 'mean' | 'true';
  includeOuterPlanets?: boolean;
}

export interface NatalChart {
  engineVersion: string;
  ayanamsa: {
    id: AyanamsaId;
    value: number; // decimal degrees
  };
  time: ResolvedTime;
  place: {
    name?: string | undefined;
    lat: number;
    lon: number;
  };
  lagna: LagnaDetail | null;
  mc?: LagnaDetail | null;
  grahas: Record<GrahaName, GrahaDetail>;
  grahasList: GrahaDetail[];
}

const PRIMARY_BODIES: readonly BodyId[] = [
  'sun',
  'moon',
  'mars',
  'mercury',
  'jupiter',
  'venus',
  'saturn',
];

const OUTER_BODIES: readonly BodyId[] = ['uranus', 'neptune', 'pluto'];

/**
 * Whole sign house calculation:
 * House index (1-12) from reference sign index (0-11).
 */
export const houseFromSign = (targetSignIndex: number, refSignIndex: number): number => {
  return ((targetSignIndex - refSignIndex + 12) % 12) + 1;
};

/**
 * Pure function to compute natal chart positions for all planets, nodes, and ascendant.
 */
export const computePositions = (
  eph: EphemerisProvider,
  time: ResolvedTime,
  place: { name?: string | undefined; lat: number; lon: number },
  settings: NatalSettings,
): NatalChart => {
  const jd = time.julianDayUt;
  const normalizedAy = (settings.ayanamsa as string) === 'krishnamurti' ? 'kp_old' : settings.ayanamsa;
  const ay = eph.ayanamsa(jd, normalizedAy as AyanamsaId);

  // 1. Chart Angles / Lagna & MC
  let lagna: LagnaDetail | null = null;
  let mc: LagnaDetail | null = null;
  let lagnaSignIndex = 0;

  if (time.timeCertainty !== 'unknown') {
    const angles = eph.angles(jd, place.lat, place.lon);
    const sidLagna = norm360(angles.ascTropical - ay);
    const s = signOf(sidLagna);
    const n = nakshatraOf(sidLagna);
    lagnaSignIndex = s.signIndex;

    lagna = {
      lon: sidLagna,
      tropicalLon: angles.ascTropical,
      sign: s.sign,
      signIndex: s.signIndex,
      degInSign: s.degInSign,
      nakshatra: n.nakshatra,
      nakshatraIndex: n.nakshatraIndex,
      pada: n.pada,
      elapsedInNakshatra: n.elapsed,
    };

    const sidMc = norm360(angles.mcTropical - ay);
    const sMc = signOf(sidMc);
    const nMc = nakshatraOf(sidMc);
    mc = {
      lon: sidMc,
      tropicalLon: angles.mcTropical,
      sign: sMc.sign,
      signIndex: sMc.signIndex,
      degInSign: sMc.degInSign,
      nakshatra: nMc.nakshatra,
      nakshatraIndex: nMc.nakshatraIndex,
      pada: nMc.pada,
      elapsedInNakshatra: nMc.elapsed,
    };
  }

  // 2. Celestial bodies
  const bodyIds = settings.includeOuterPlanets
    ? [...PRIMARY_BODIES, ...OUTER_BODIES]
    : [...PRIMARY_BODIES];

  const tropBodies = eph.bodies(jd, bodyIds);

  // 3. Moon position needed first to calculate House from Moon
  const tropMoon = tropBodies['moon']!;
  const sidMoonLon = norm360(tropMoon.lon - ay);
  const moonSignIndex = signOf(sidMoonLon).signIndex;

  // 4. Lunar Nodes (Rahu & Ketu)
  const nodeState =
    settings.nodeType === 'true' && eph.capabilities.trueNode
      ? eph.trueNode(jd)
      : eph.meanNode(jd);

  // 5. Build grahas map
  const grahas = {} as Record<GrahaName, GrahaDetail>;

  const formatGraha = (
    id: GrahaName,
    name: string,
    tropLon: number,
    lat: number,
    speed: number,
    forceRetro = false,
  ): GrahaDetail => {
    const sidLon = norm360(tropLon - ay);
    const s = signOf(sidLon);
    const n = nakshatraOf(sidLon);
    const retrograde = forceRetro || speed < 0;

    const houseFromLagna = lagna ? houseFromSign(s.signIndex, lagnaSignIndex) : 1;
    const houseFromMoon = houseFromSign(s.signIndex, moonSignIndex);

    return {
      id,
      name,
      lon: sidLon,
      tropicalLon: tropLon,
      lat,
      speed,
      retrograde,
      sign: s.sign,
      signIndex: s.signIndex,
      degInSign: s.degInSign,
      nakshatra: n.nakshatra,
      nakshatraIndex: n.nakshatraIndex,
      pada: n.pada,
      elapsedInNakshatra: n.elapsed,
      houses: {
        houseFromLagna,
        houseFromMoon,
      },
    };
  };

  for (const bId of PRIMARY_BODIES) {
    const b = tropBodies[bId]!;
    grahas[bId] = formatGraha(
      bId,
      bId.charAt(0).toUpperCase() + bId.slice(1),
      b.lon,
      b.lat,
      b.speed,
    );
  }

  // Rahu & Ketu (always retrograde in mean node convention)
  grahas['rahu'] = formatGraha('rahu', 'Rahu', nodeState.lon, nodeState.lat, nodeState.speed, true);
  grahas['ketu'] = formatGraha(
    'ketu',
    'Ketu',
    norm360(nodeState.lon + 180),
    -nodeState.lat,
    nodeState.speed,
    true,
  );

  // Outer planets (optional)
  if (settings.includeOuterPlanets) {
    for (const outId of OUTER_BODIES) {
      const b = tropBodies[outId];
      if (b) {
        grahas[outId] = formatGraha(
          outId,
          outId.charAt(0).toUpperCase() + outId.slice(1),
          b.lon,
          b.lat,
          b.speed,
        );
      }
    }
  }

  const grahasList = Object.values(grahas);

  return {
    engineVersion: eph.version,
    ayanamsa: {
      id: settings.ayanamsa,
      value: ay,
    },
    time,
    place,
    lagna,
    mc,
    grahas,
    grahasList,
  };
};
