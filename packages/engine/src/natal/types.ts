export const ALL_GRAHAS = [
  'sun',
  'moon',
  'mars',
  'mercury',
  'jupiter',
  'venus',
  'saturn',
  'rahu',
  'ketu',
  'uranus',
  'neptune',
  'pluto',
] as const;

export type GrahaName = (typeof ALL_GRAHAS)[number];

export const VEDIC_GRAHAS = [
  'sun',
  'moon',
  'mars',
  'mercury',
  'jupiter',
  'venus',
  'saturn',
  'rahu',
  'ketu',
] as const;

export type VedicGraha = (typeof VEDIC_GRAHAS)[number];

export interface HouseInfo {
  houseFromLagna: number; // 1-12
  houseFromMoon: number; // 1-12
}

export interface GrahaDetail {
  id: GrahaName;
  name: string;
  lon: number; // sidereal decimal degrees [0, 360)
  tropicalLon: number;
  lat: number;
  speed: number;
  retrograde: boolean;
  sign: string;
  signIndex: number; // 0 = aries, 1 = taurus, ...
  degInSign: number;
  nakshatra: string;
  nakshatraIndex: number; // 0 = ashwini, ...
  pada: 1 | 2 | 3 | 4;
  elapsedInNakshatra: number; // 0..1
  isCombust?: boolean; // v2
  houses: HouseInfo;
}

export interface LagnaDetail {
  lon: number;
  tropicalLon: number;
  sign: string;
  signIndex: number;
  degInSign: number;
  nakshatra: string;
  nakshatraIndex: number;
  pada: 1 | 2 | 3 | 4;
  elapsedInNakshatra: number;
}
