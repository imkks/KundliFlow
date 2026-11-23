import {
  SwissEphemeris,
  Planet,
  LunarPoint,
  SiderealMode,
  HouseSystem,
  CalculationFlag,
} from '@swisseph/browser';
import { norm360 } from '../../angles.js';
import {
  UnsupportedSettingError,
  type AyanamsaId,
  type BodyId,
  type BodyState,
  type ChartAngles,
  type EphemerisProvider,
  type ProviderInitOptions,
} from '../types.js';

/**
 * Swiss Ephemeris (WASM, built-in Moshier model; no data files needed).
 * License: AGPL-3.0 (see docs/DECISIONS.md D5).
 */

const FLAGS = CalculationFlag.MoshierEphemeris | CalculationFlag.Speed;

const BODY_MAP: Record<BodyId, number> = {
  sun: Planet.Sun,
  moon: Planet.Moon,
  mars: Planet.Mars,
  mercury: Planet.Mercury,
  jupiter: Planet.Jupiter,
  venus: Planet.Venus,
  saturn: Planet.Saturn,
  uranus: Planet.Uranus,
  neptune: Planet.Neptune,
  pluto: Planet.Pluto,
};

/**
 * Ayanamsa id -> Swiss Ephemeris sidereal mode.
 * kp_new is intentionally absent until its definition is pinned down against the
 * AstroSage "K.P. New" value (23°44'53" on 1998-09-07). See docs/TEST_PLAN.md.
 */
const SIDM: Partial<Record<AyanamsaId, number>> = {
  lahiri: SiderealMode.Lahiri,
  kp_old: SiderealMode.Krishnamurti,
  kp_new: SiderealMode.Krishnamurti,
  raman: SiderealMode.Raman,
  yukteshwar: SiderealMode.Yukteshwar,
};

const SUPPORTED_AYANAMSAS = Object.keys(SIDM) as AyanamsaId[];

// Enable loading local swisseph.wasm in Node.js where globalThis.fetch('file://...') is unsupported natively
if (typeof process !== 'undefined' && process.versions?.node && typeof globalThis.fetch === 'function') {
  const origFetch = globalThis.fetch;
  // @ts-ignore
  if (!globalThis.__swisseph_node_fetch_patched) {
    // @ts-ignore
    globalThis.__swisseph_node_fetch_patched = true;
    globalThis.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as any)?.url;
      if (url && typeof url === 'string' && url.startsWith('file:')) {
        const fsMod = 'node:fs/promises';
        const { readFile } = await import(/* @vite-ignore */ fsMod);
        const fileBytes = await readFile(new URL(url));
        return new Response(fileBytes, {
          headers: { 'content-type': 'application/wasm' },
        });
      }
      return origFetch(input, init);
    };
  }
}

export const createSwissephProvider = async (
  opts: ProviderInitOptions = {},
): Promise<EphemerisProvider> => {
  const swe = new SwissEphemeris();
  await swe.init(opts.wasmUrl);
  const libVersion = swe.version();

  const state = (jd: number, body: number): BodyState => {
    const p = swe.calculatePosition(jd, body, FLAGS);
    return { lon: norm360(p.longitude), lat: p.latitude, speed: p.longitudeSpeed };
  };

  // The WASM module holds a global sidereal mode; remember it to avoid redundant calls.
  let currentSidm: number | undefined;

  return {
    id: 'swisseph',
    version: `swisseph-wasm@${libVersion}+moshier`,
    capabilities: { trueNode: true, ayanamsas: SUPPORTED_AYANAMSAS, outerPlanets: true },

    bodies(jdUt, ids) {
      const out = {} as Record<BodyId, BodyState>;
      for (const id of ids) out[id] = state(jdUt, BODY_MAP[id]);
      return out;
    },

    meanNode: (jdUt) => state(jdUt, LunarPoint.MeanNode),
    trueNode: (jdUt) => state(jdUt, LunarPoint.TrueNode),

    ayanamsa(jdUt, kind) {
      const mode = SIDM[kind];
      if (mode === undefined) throw new UnsupportedSettingError('swisseph', `ayanamsa "${kind}"`);
      if (currentSidm !== mode) {
        swe.setSiderealMode(mode);
        currentSidm = mode;
      }
      // Ex variant with default flags applies nutation -> "true" ayanamsa,
      // consistent with apparent tropical longitudes.
      return swe.getAyanamsaExUt(jdUt, CalculationFlag.MoshierEphemeris);
    },

    angles(jdUt, lat, lon): ChartAngles {
      const h = swe.calculateHouses(jdUt, lat, lon, HouseSystem.WholeSign);
      const nut = swe.calculatePosition(jdUt, Planet.EclipticNutation, CalculationFlag.MoshierEphemeris);
      return {
        ascTropical: norm360(h.ascendant),
        mcTropical: norm360(h.mc),
        armc: norm360(h.armc),
        obliquityTrue: nut.longitude,
        obliquityMean: nut.latitude,
      };
    },
  };
};
