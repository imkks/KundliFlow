import type { ProviderId } from './types.js';

/**
 * >>> THE ONE LINE TO CHANGE TO SWITCH EPHEMERIS <<<
 *
 * 'swisseph'          Swiss Ephemeris 2.10 WASM, Moshier model (AGPL-3.0). Default.
 * 'astronomy-engine'  astronomy-engine (MIT). ~1 arcminute class; Lahiri only; mean node only.
 *
 * Can also be overridden at build time with VITE_EPHEMERIS=<id>, or at runtime by
 * passing an id to loadEphemeris(). Any provider must pass the conformance suite.
 */
export const DEFAULT_EPHEMERIS: ProviderId = 'swisseph';
