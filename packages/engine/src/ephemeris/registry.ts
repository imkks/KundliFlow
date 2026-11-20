import { DEFAULT_EPHEMERIS } from './config.js';
import type { EphemerisProvider, ProviderId, ProviderInitOptions } from './types.js';

type Factory = (opts: ProviderInitOptions) => Promise<EphemerisProvider>;

/**
 * Lazy registry: only the selected adapter is imported, so bundlers split the others out.
 */
const FACTORIES: Record<ProviderId, Factory> = {
  swisseph: async (opts) => (await import('./adapters/swisseph.js')).createSwissephProvider(opts),
  'astronomy-engine': async () =>
    (await import('./adapters/astronomy-engine.js')).createAstronomyEngineProvider(),
};

export const PROVIDER_IDS = Object.keys(FACTORIES) as ProviderId[];

const isProviderId = (v: unknown): v is ProviderId =>
  typeof v === 'string' && (PROVIDER_IDS as string[]).includes(v);

/** Resolve which provider to use: explicit arg > VITE_EPHEMERIS env > config default. */
export const resolveProviderId = (explicit?: string): ProviderId => {
  if (explicit !== undefined) {
    if (!isProviderId(explicit)) throw new Error(`INVALID_INPUT: unknown ephemeris "${explicit}"`);
    return explicit;
  }
  const env = (import.meta as { env?: Record<string, string | undefined> }).env?.['VITE_EPHEMERIS'];
  return isProviderId(env) ? env : DEFAULT_EPHEMERIS;
};

const cache = new Map<ProviderId, Promise<EphemerisProvider>>();

export const loadEphemeris = (id?: string, opts: ProviderInitOptions = {}): Promise<EphemerisProvider> => {
  const pid = resolveProviderId(id);
  let p = cache.get(pid);
  if (!p) {
    p = FACTORIES[pid](opts);
    cache.set(pid, p);
    p.catch(() => cache.delete(pid));
  }
  return p;
};
