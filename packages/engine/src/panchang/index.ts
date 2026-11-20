import { norm360 } from '../angles.js';

export const TITHI_NAMES = [
  'Pratipada', 'Dvitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dvadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
  'Pratipada', 'Dvitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dvadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya',
] as const;

export type Paksha = 'Shukla' | 'Krishna';

export interface TithiInfo {
  index: number; // 1 to 30
  name: string;
  paksha: Paksha;
  pakshaTithiIndex: number; // 1 to 15
  elapsedFraction: number; // 0..1
}

export const YOGA_NAMES = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana',
  'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda',
  'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
  'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva',
  'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma',
  'Indra', 'Vaidhriti',
] as const;

export interface YogaInfo {
  index: number; // 1 to 27
  name: string;
  elapsedFraction: number; // 0..1
}

export const MOVABLE_KARANAS = [
  'Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti',
] as const;

export const FIXED_KARANAS = [
  'Shakuni', 'Chatushpada', 'Naga', 'Kimstughna',
] as const;

export interface KaranaInfo {
  index: number; // 1 to 60
  name: string;
  isVishtiBhadra: boolean;
}

export interface PanchangResult {
  tithi: TithiInfo;
  yoga: YogaInfo;
  karana: KaranaInfo;
  wara: {
    index: number; // 0 = Sunday, 1 = Monday, ...
    name: string;
    lord: string;
  };
}

const WARA_NAMES = [
  { name: 'Sunday', lord: 'sun' },
  { name: 'Monday', lord: 'moon' },
  { name: 'Tuesday', lord: 'mars' },
  { name: 'Wednesday', lord: 'mercury' },
  { name: 'Thursday', lord: 'jupiter' },
  { name: 'Friday', lord: 'venus' },
  { name: 'Saturday', lord: 'saturn' },
] as const;

/**
 * Computes Panchang limbs from sidereal or tropical Sun & Moon positions.
 * Note: relative angles (Moon - Sun, Moon + Sun) give identical results
 * whether sidereal or tropical, because ayanamsa cancels out for difference.
 */
export const computePanchang = (
  sunLon: number,
  moonLon: number,
  dayOfWeekIndex: number, // 0 = Sunday..6 = Saturday
): PanchangResult => {
  // 1. Tithi: floor(((Moon - Sun) mod 360) / 12) + 1
  const diff = norm360(moonLon - sunLon);
  const tithiIndex = Math.floor(diff / 12) + 1; // 1 to 30
  const tithiElapsed = (diff % 12) / 12;
  const paksha: Paksha = tithiIndex <= 15 ? 'Shukla' : 'Krishna';
  const pakshaTithiIndex = tithiIndex <= 15 ? tithiIndex : tithiIndex - 15;
  const tithiName = TITHI_NAMES[tithiIndex - 1]!;

  // 2. Yoga: floor(((Sun + Moon) mod 360) / (360/27)) + 1
  const sum = norm360(sunLon + moonLon);
  const yogaSpan = 360 / 27; // 13.333333...°
  const yogaIndex = Math.floor(sum / yogaSpan) + 1; // 1 to 27
  const yogaElapsed = (sum % yogaSpan) / yogaSpan;
  const yogaName = YOGA_NAMES[yogaIndex - 1]!;

  // 3. Karana: half-tithi index from floor(((Moon - Sun) mod 360) / 6)
  // Index 0: Kimstughna (second half of 30th tithi / Amavasya)
  // Indices 1 to 56: 8 cycles of 7 movable karanas (Bava .. Vishti)
  // Index 57: Shakuni (second half of Krishna Chaturdashi, 29th)
  // Index 58: Chatushpada (first half of Amavasya, 30th)
  // Index 59: Naga (second half of Amavasya, 30th)
  const karanaHalfTithi = Math.floor(diff / 6); // 0 to 59
  let karanaName: string;

  if (karanaHalfTithi === 0) {
    karanaName = 'Kimstughna';
  } else if (karanaHalfTithi >= 1 && karanaHalfTithi <= 56) {
    karanaName = MOVABLE_KARANAS[(karanaHalfTithi - 1) % 7]!;
  } else if (karanaHalfTithi === 57) {
    karanaName = 'Shakuni';
  } else if (karanaHalfTithi === 58) {
    karanaName = 'Chatushpada';
  } else {
    karanaName = 'Naga';
  }

  const isVishtiBhadra = karanaName === 'Vishti';

  // 4. Vara
  const wara = WARA_NAMES[dayOfWeekIndex % 7]!;

  return {
    tithi: {
      index: tithiIndex,
      name: tithiName,
      paksha,
      pakshaTithiIndex,
      elapsedFraction: tithiElapsed,
    },
    yoga: {
      index: yogaIndex,
      name: yogaName,
      elapsedFraction: yogaElapsed,
    },
    karana: {
      index: karanaHalfTithi, // 0 to 59
      name: karanaName,
      isVishtiBhadra,
    },
    wara: {
      index: dayOfWeekIndex % 7,
      name: wara.name,
      lord: wara.lord,
    },
  };
};
