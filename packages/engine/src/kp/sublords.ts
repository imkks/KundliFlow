import { norm360, signOf } from '../angles.js';
import type { VedicGraha } from '../natal/types.js';
import { DASHA_ORDER, DASHA_YEARS, TOTAL_DASHA_YEARS, NAKSHATRA_LORDS } from '../dasha/vimshottari.js';

export interface KpPlacement {
  longitude: number;
  sign: string;
  signIndex: number;
  rashiLord: string;
  nakshatra: string;
  nakshatraIndex: number;
  starLord: VedicGraha;
  subLord: VedicGraha;
  subSubLord: VedicGraha;
}

const SIGN_LORDS = [
  'mars', // Aries
  'venus', // Taurus
  'mercury', // Gemini
  'moon', // Cancer
  'sun', // Leo
  'mercury', // Virgo
  'venus', // Libra
  'mars', // Scorpio
  'jupiter', // Sagittarius
  'saturn', // Capricorn
  'saturn', // Aquarius
  'jupiter', // Pisces
];

const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purvaphalguni', 'Uttaraphalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purvaashadha', 'Uttaraashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purvabhadrapada',
  'Uttarabhadrapada', 'Revati',
];

const NAK_SPAN_MINUTES = 800; // 13° 20' = 800 arcminutes

/**
 * Calculates KP Star Lord, Sub Lord, and Sub-Sub Lord according to Krishnamurti Paddhati rules.
 * @param lon Sidereal longitude in decimal degrees [0, 360)
 */
export const calculateKpPlacement = (lon: number): KpPlacement => {
  const norm = norm360(lon);
  const signIdx = Math.floor(norm / 30);
  const nakIdx = Math.floor(norm / (360 / 27));
  const nakStartLon = nakIdx * (360 / 27);
  const arcMinutesInNak = (norm - nakStartLon) * 60; // 0..800 arcminutes

  const starLord = NAKSHATRA_LORDS[nakIdx]!;
  const starLordOrderIdx = DASHA_ORDER.indexOf(starLord);

  // Find Sub Lord
  let subAccum = 0;
  let subLord: VedicGraha = starLord;
  let subLordIndex = starLordOrderIdx;
  let subStartMinutes = 0;
  let subSpanMinutes = 0;

  for (let i = 0; i < 9; i++) {
    const lordIdx = (starLordOrderIdx + i) % 9;
    const lord = DASHA_ORDER[lordIdx]!;
    const years = DASHA_YEARS[lord];
    const span = (years / TOTAL_DASHA_YEARS) * NAK_SPAN_MINUTES;

    if (arcMinutesInNak < subAccum + span || i === 8) {
      subLord = lord;
      subLordIndex = lordIdx;
      subStartMinutes = subAccum;
      subSpanMinutes = span;
      break;
    }
    subAccum += span;
  }

  // Find Sub-Sub Lord
  const arcMinutesInSub = arcMinutesInNak - subStartMinutes;
  let ssAccum = 0;
  let subSubLord: VedicGraha = subLord;

  for (let j = 0; j < 9; j++) {
    const ssLordIdx = (subLordIndex + j) % 9;
    const ssLord = DASHA_ORDER[ssLordIdx]!;
    const years = DASHA_YEARS[ssLord];
    const ssSpan = (years / TOTAL_DASHA_YEARS) * subSpanMinutes;

    if (arcMinutesInSub < ssAccum + ssSpan || j === 8) {
      subSubLord = ssLord;
      break;
    }
    ssAccum += ssSpan;
  }

  const { sign } = signOf(norm);

  return {
    longitude: norm,
    sign,
    signIndex: signIdx,
    rashiLord: SIGN_LORDS[signIdx]!,
    nakshatra: NAKSHATRA_NAMES[nakIdx]!,
    nakshatraIndex: nakIdx,
    starLord,
    subLord,
    subSubLord,
  };
};
