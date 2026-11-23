import * as Astronomy from 'astronomy-engine';
import { norm360, angleDiff } from '../../angles.js';
import { jdToUnixMs } from '../../time/julian.js';
import {
  AYANAMSA_ANCHORS,
  ascendantFromArmc,
  meanAyanamsa,
  meanNodeLongitude,
} from '../fallbacks/index.js';
import {
  UnsupportedSettingError,
  type BodyId,
  type BodyState,
  type EphemerisProvider,
} from '../types.js';

/**
 * astronomy-engine adapter (MIT). Roughly 1 arcminute class accuracy.
 * Missing natively: ayanamsa, lunar nodes, ascendant -> provided by pure-TS fallbacks.
 * Not supported: true node, ayanamsas other than Lahiri.
 */

const BODY_MAP: Record<BodyId, Astronomy.Body> = {
  sun: Astronomy.Body.Sun,
  moon: Astronomy.Body.Moon,
  mars: Astronomy.Body.Mars,
  mercury: Astronomy.Body.Mercury,
  jupiter: Astronomy.Body.Jupiter,
  venus: Astronomy.Body.Venus,
  saturn: Astronomy.Body.Saturn,
  uranus: Astronomy.Body.Uranus,
  neptune: Astronomy.Body.Neptune,
  pluto: Astronomy.Body.Pluto,
};

const SPEED_STEP_DAYS = 1 / 24;

const timeOf = (jdUt: number) => Astronomy.MakeTime(new Date(jdToUnixMs(jdUt)));

/** Apparent geocentric true-ecliptic-of-date longitude and latitude. */
const eclipticOfDate = (body: Astronomy.Body, jdUt: number): { lon: number; lat: number } => {
  const vec = Astronomy.GeoVector(body, timeOf(jdUt), true);
  const ecl = Astronomy.Ecliptic(vec);
  return { lon: norm360(ecl.elon), lat: ecl.elat };
};

const withSpeed = (fn: (jd: number) => { lon: number; lat: number }, jdUt: number): BodyState => {
  const now = fn(jdUt);
  const before = fn(jdUt - SPEED_STEP_DAYS);
  const after = fn(jdUt + SPEED_STEP_DAYS);
  return { ...now, speed: angleDiff(after.lon, before.lon) / (2 * SPEED_STEP_DAYS) };
};

const dpsiDeg = (jdUt: number): number => Astronomy.e_tilt(timeOf(jdUt)).dpsi / 3600;

export const createAstronomyEngineProvider = async (): Promise<EphemerisProvider> => ({
  id: 'astronomy-engine',
  version: 'astronomy-engine@2.1.19',
  capabilities: {
    trueNode: false,
    ayanamsas: ['lahiri', 'raman', 'kp_old', 'kp_new', 'yukteshwar'],
    outerPlanets: true,
  },

  bodies(jdUt, ids) {
    const out = {} as Record<BodyId, BodyState>;
    for (const id of ids) out[id] = withSpeed((jd) => eclipticOfDate(BODY_MAP[id], jd), jdUt);
    return out;
  },

  meanNode(jdUt) {
    // Mean node is on the mean equinox of date; add nutation to match apparent longitudes.
    return withSpeed((jd) => ({ lon: norm360(meanNodeLongitude(jd) + dpsiDeg(jd)), lat: 0 }), jdUt);
  },

  trueNode() {
    throw new UnsupportedSettingError('astronomy-engine', 'true node');
  },

  ayanamsa(jdUt, kind) {
    const anchor = AYANAMSA_ANCHORS[kind as keyof typeof AYANAMSA_ANCHORS];
    if (!anchor) throw new UnsupportedSettingError('astronomy-engine', `ayanamsa "${kind}"`);
    return meanAyanamsa(jdUt, anchor) + dpsiDeg(jdUt);
  },

  angles(jdUt, lat, lon) {
    const t = timeOf(jdUt);
    const tilt = Astronomy.e_tilt(t);
    const armc = norm360(Astronomy.SiderealTime(t) * 15 + lon);
    const { asc, mc } = ascendantFromArmc(armc, tilt.tobl, lat);
    return { ascTropical: asc, mcTropical: mc, armc, obliquityTrue: tilt.tobl, obliquityMean: tilt.mobl };
  },
});
