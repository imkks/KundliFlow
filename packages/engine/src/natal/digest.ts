import type { NatalChart } from './positions.js';

export interface GrahaDigest {
  signIndex: number;
  sign: string;
  houseFromLagna: number;
  houseFromMoon: number;
  nakshatraIndex: number;
  pada: number;
  retrograde: boolean;
}

export interface NatalDigest {
  engineVersion: string;
  ayanamsa: string;
  lagna: {
    signIndex: number;
    sign: string;
    nakshatraIndex: number;
    pada: number;
  } | null;
  moon: {
    signIndex: number;
    sign: string;
    nakshatraIndex: number;
    pada: number;
  };
  grahas: Record<string, GrahaDigest>;
  birthUtc: string;
  birthLocal: string;
  placeName?: string | undefined;
  lat: number;
  lon: number;
}

/**
 * Creates a compact JSON digest of the natal chart (~2 KB) as specified in §12.3.
 * Used for hourly scoring without requiring recomputation of planetary positions.
 */
export const createNatalDigest = (chart: NatalChart): NatalDigest => {
  const grahas: Record<string, GrahaDigest> = {};

  for (const [id, g] of Object.entries(chart.grahas)) {
    grahas[id] = {
      signIndex: g.signIndex,
      sign: g.sign,
      houseFromLagna: g.houses.houseFromLagna,
      houseFromMoon: g.houses.houseFromMoon,
      nakshatraIndex: g.nakshatraIndex,
      pada: g.pada,
      retrograde: g.retrograde,
    };
  }

  const moon = chart.grahas.moon;

  return {
    engineVersion: chart.engineVersion,
    ayanamsa: chart.ayanamsa.id,
    lagna: chart.lagna
      ? {
          signIndex: chart.lagna.signIndex,
          sign: chart.lagna.sign,
          nakshatraIndex: chart.lagna.nakshatraIndex,
          pada: chart.lagna.pada,
        }
      : null,
    moon: {
      signIndex: moon.signIndex,
      sign: moon.sign,
      nakshatraIndex: moon.nakshatraIndex,
      pada: moon.pada,
    },
    grahas,
    birthUtc: chart.time.birthUtc,
    birthLocal: chart.time.birthLocal,
    placeName: chart.place.name,
    lat: chart.place.lat,
    lon: chart.place.lon,
  };
};
