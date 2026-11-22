export type { NatalChart, NatalSettings } from './positions.js';
export type { AvakahadaDetails } from './avakahada.js';

export type Dignity =
  | 'exalted'
  | 'moolatrikona'
  | 'own'
  | 'great_friend'
  | 'friend'
  | 'neutral'
  | 'enemy'
  | 'great_enemy'
  | 'debilitated';

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

export const SIGN_LORDS: readonly VedicGraha[] = [
  'mars', // Aries (0)
  'venus', // Taurus (1)
  'mercury', // Gemini (2)
  'moon', // Cancer (3)
  'sun', // Leo (4)
  'mercury', // Virgo (5)
  'venus', // Libra (6)
  'mars', // Scorpio (7)
  'jupiter', // Sagittarius (8)
  'saturn', // Capricorn (9)
  'saturn', // Aquarius (10)
  'jupiter', // Pisces (11)
] as const;

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
  nakshatraName?: string;
  nakshatraIndex: number; // 0 = ashwini, ...
  pada: 1 | 2 | 3 | 4;
  elapsedInNakshatra: number; // 0..1
  isCombust?: boolean; // v2
  combust?: boolean;
  dignity?: Dignity | string;
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
