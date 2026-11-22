/** Angle helpers. Internal unit is float64 degrees (CLAUDE.md rule 7). Format to DMS only at the edge. */

export const norm360 = (deg: number): number => {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
};

/** Signed smallest difference a - b in degrees, in (-180, 180]. */
export const angleDiff = (a: number, b: number): number => {
  const d = norm360(a - b);
  return d > 180 ? d - 360 : d;
};

export const SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;
export type Sign = (typeof SIGNS)[number];

export const NAKSHATRAS = [
  'ashwini', 'bharani', 'krittika', 'rohini', 'mrigashira', 'ardra', 'punarvasu', 'pushya', 'ashlesha',
  'magha', 'purva_phalguni', 'uttara_phalguni', 'hasta', 'chitra', 'swati', 'vishakha', 'anuradha', 'jyeshtha',
  'mula', 'purva_ashadha', 'uttara_ashadha', 'shravana', 'dhanishta', 'shatabhisha', 'purva_bhadrapada',
  'uttara_bhadrapada', 'revati',
] as const;
export type Nakshatra = (typeof NAKSHATRAS)[number];

const NAK_SPAN = 360 / 27;
const PADA_SPAN = NAK_SPAN / 4;

export interface SignPosition {
  signIndex: number; // 0 = Aries
  sign: Sign;
  signName?: string;
  degInSign: number;
}

export const signOf = (lon: number): SignPosition => {
  const l = norm360(lon);
  const signIndex = Math.floor(l / 30);
  const sign = SIGNS[signIndex]!;
  return { signIndex, sign, signName: sign, degInSign: l - signIndex * 30 };
};

export interface NakshatraPosition {
  nakshatraIndex: number; // 0 = Ashwini
  nakshatra: Nakshatra;
  nakshatraName?: string;
  pada: 1 | 2 | 3 | 4;
  /** Fraction of the nakshatra already traversed, 0..1 */
  elapsed: number;
}

export const nakshatraOf = (lon: number): NakshatraPosition => {
  const l = norm360(lon);
  const nakshatraIndex = Math.floor(l / NAK_SPAN);
  const within = l - nakshatraIndex * NAK_SPAN;
  const pada = (Math.floor(within / PADA_SPAN) + 1) as 1 | 2 | 3 | 4;
  const nakshatra = NAKSHATRAS[nakshatraIndex]!;
  return { nakshatraIndex, nakshatra, nakshatraName: nakshatra, pada, elapsed: within / NAK_SPAN };
};

/** Parse "27-40-54", "27°40'54\"", "27.40.54" or [27, 40, 54] into decimal degrees. */
export const dmsToDeg = (input: string | readonly [number, number, number]): number => {
  const parts =
    typeof input === 'string'
      ? input.split(/[^0-9.]+/).filter(Boolean).map(Number)
      : [...input];
  const [d = 0, m = 0, s = 0] = parts;
  return d + m / 60 + s / 3600;
};

/** Format decimal degrees as D°MM'SS" (rounded to the second). */
export const degToDms = (deg: number): string => {
  const sign = deg < 0 ? '-' : '';
  const total = Math.round(Math.abs(deg) * 3600);
  const d = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${sign}${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`;
};
