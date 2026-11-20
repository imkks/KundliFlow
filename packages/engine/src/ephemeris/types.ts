/**
 * EphemerisProvider: the ONLY place astronomy comes from.
 *
 * Adapters stay thin: they return tropical, apparent, geocentric positions of date
 * plus the ayanamsa and the chart angles. Everything astrological (sidereal conversion,
 * houses, nakshatras, panchang, dashas, vargas, scoring) lives in pure engine code.
 *
 * To add a provider: implement this interface in adapters/, register it in registry.ts,
 * and make it pass test/ephemeris.conformance.test.ts.
 */

export const BODY_IDS = [
  'sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn',
  'uranus', 'neptune', 'pluto',
] as const;
export type BodyId = (typeof BODY_IDS)[number];

export const AYANAMSA_IDS = ['lahiri', 'kp_new', 'kp_old', 'raman', 'yukteshwar'] as const;
export type AyanamsaId = (typeof AYANAMSA_IDS)[number];

export type ProviderId = 'swisseph' | 'astronomy-engine';

export interface BodyState {
  /** Tropical apparent ecliptic longitude of date, degrees [0, 360). */
  lon: number;
  /** Ecliptic latitude, degrees. */
  lat: number;
  /** Longitude speed, degrees per day (negative = retrograde). */
  speed: number;
}

export interface ChartAngles {
  /** Tropical ascendant, degrees. */
  ascTropical: number;
  /** Tropical midheaven, degrees. */
  mcTropical: number;
  /** Right ascension of the MC (local apparent sidereal time x 15), degrees. */
  armc: number;
  /** True obliquity of the ecliptic, degrees. */
  obliquityTrue: number;
  /** Mean obliquity of the ecliptic, degrees. */
  obliquityMean: number;
}

export interface ProviderCapabilities {
  trueNode: boolean;
  ayanamsas: readonly AyanamsaId[];
  outerPlanets: boolean;
}

export interface EphemerisProvider {
  readonly id: ProviderId;
  /** Library + model version; recorded in engineVersion of every result. */
  readonly version: string;
  readonly capabilities: ProviderCapabilities;

  bodies(jdUt: number, ids: readonly BodyId[]): Record<BodyId, BodyState>;
  meanNode(jdUt: number): BodyState;
  /** Only when capabilities.trueNode is true. */
  trueNode(jdUt: number): BodyState;
  /** True ayanamsa (includes nutation in longitude), so sidereal = tropical apparent - ayanamsa. */
  ayanamsa(jdUt: number, kind: AyanamsaId): number;
  /** lat: north positive, lon: east positive. */
  angles(jdUt: number, lat: number, lon: number): ChartAngles;
}

export interface ProviderInitOptions {
  /** Override WASM location (swisseph). Useful for workers and tests. */
  wasmUrl?: string;
}

export class UnsupportedSettingError extends Error {
  readonly code = 'UNSUPPORTED_SETTING';
  constructor(provider: ProviderId, what: string) {
    super(`UNSUPPORTED_SETTING: provider "${provider}" does not support ${what}`);
  }
}
