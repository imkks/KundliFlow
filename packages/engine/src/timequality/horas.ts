import { DateTime } from 'luxon';
import type { VedicGraha } from '../natal/types.js';

// Order of Hora lords (descending planetary speed/Chaldean order):
// Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon
export const HORA_LORDS_ORDER: readonly VedicGraha[] = [
  'saturn',
  'jupiter',
  'mars',
  'sun',
  'venus',
  'mercury',
  'moon',
] as const;

export const WEEKDAY_LORDS: readonly VedicGraha[] = [
  'sun', // 0 = Sunday
  'moon', // 1 = Monday
  'mars', // 2 = Tuesday
  'mercury', // 3 = Wednesday
  'jupiter', // 4 = Thursday
  'venus', // 5 = Friday
  'saturn', // 6 = Saturday
] as const;

// 8 parts of day (from Sunrise to Sunset) for Inauspicious Windows (spec §4.2)
// Values are 1-based index (1 to 8)
export const INAUSPICIOUS_PARTS: Record<
  number,
  { rahuKalam: number; yamaganda: number; gulika: number }
> = {
  0: { rahuKalam: 8, yamaganda: 5, gulika: 7 }, // Sunday
  1: { rahuKalam: 2, yamaganda: 4, gulika: 6 }, // Monday
  2: { rahuKalam: 7, yamaganda: 3, gulika: 5 }, // Tuesday
  3: { rahuKalam: 5, yamaganda: 2, gulika: 4 }, // Wednesday
  4: { rahuKalam: 6, yamaganda: 1, gulika: 3 }, // Thursday
  5: { rahuKalam: 4, yamaganda: 7, gulika: 2 }, // Friday
  6: { rahuKalam: 3, yamaganda: 6, gulika: 1 }, // Saturday
};

export interface TimeWindow {
  name: string;
  startIso: string;
  endIso: string;
  startFormatted: string; // "HH:mm"
  endFormatted: string; // "HH:mm"
}

export interface InauspiciousWindows {
  rahuKalam: TimeWindow;
  yamaganda: TimeWindow;
  gulika: TimeWindow;
}

export interface HoraInfo {
  index: number; // 1 to 24 (1-12 day, 13-24 night)
  lord: VedicGraha;
  isDayHora: boolean;
  startIso: string;
  endIso: string;
  startFormatted: string;
  endFormatted: string;
}

/**
 * Computes all 24 Horas for a day (12 between Sunrise and Sunset, 12 from Sunset to next Sunrise).
 * The 1st Hora of the day is ruled by the weekday lord.
 */
export const computeDayHoras = (
  dayOfWeekIndex: number, // 0 = Sunday .. 6 = Saturday
  sunriseIso: string,
  sunsetIso: string,
  nextSunriseIso: string,
): HoraInfo[] => {
  const rise = DateTime.fromISO(sunriseIso, { setZone: true });
  const set = DateTime.fromISO(sunsetIso, { setZone: true });
  const nextRise = DateTime.fromISO(nextSunriseIso, { setZone: true });

  const daySpan = set.diff(rise, 'milliseconds').milliseconds;
  const nightSpan = nextRise.diff(set, 'milliseconds').milliseconds;

  const dayHoraSpan = daySpan / 12;
  const nightHoraSpan = nightSpan / 12;

  const firstLord = WEEKDAY_LORDS[dayOfWeekIndex % 7]!;
  const firstLordIdx = HORA_LORDS_ORDER.indexOf(firstLord);

  const horas: HoraInfo[] = [];

  // Day horas (1-12)
  for (let i = 0; i < 12; i++) {
    const lord = HORA_LORDS_ORDER[(firstLordIdx + i) % 7]!;
    const start = rise.plus({ milliseconds: i * dayHoraSpan });
    const end = rise.plus({ milliseconds: (i + 1) * dayHoraSpan });
    horas.push({
      index: i + 1,
      lord,
      isDayHora: true,
      startIso: start.toISO()!,
      endIso: end.toISO()!,
      startFormatted: start.toFormat('HH:mm'),
      endFormatted: end.toFormat('HH:mm'),
    });
  }

  // Night horas (13-24)
  for (let i = 0; i < 12; i++) {
    const lord = HORA_LORDS_ORDER[(firstLordIdx + 12 + i) % 7]!;
    const start = set.plus({ milliseconds: i * nightHoraSpan });
    const end = set.plus({ milliseconds: (i + 1) * nightHoraSpan });
    horas.push({
      index: 13 + i,
      lord,
      isDayHora: false,
      startIso: start.toISO()!,
      endIso: end.toISO()!,
      startFormatted: start.toFormat('HH:mm'),
      endFormatted: end.toFormat('HH:mm'),
    });
  }

  return horas;
};

/**
 * Computes Inauspicious Windows (Rahu Kalam, Yamaganda, Gulika) by dividing
 * the interval between Sunrise and Sunset into 8 equal segments.
 */
export const computeInauspiciousWindows = (
  dayOfWeekIndex: number,
  sunriseIso: string,
  sunsetIso: string,
): InauspiciousWindows => {
  const rise = DateTime.fromISO(sunriseIso, { setZone: true });
  const set = DateTime.fromISO(sunsetIso, { setZone: true });
  const daySpan = set.diff(rise, 'milliseconds').milliseconds;
  const segmentSpan = daySpan / 8;

  const parts = INAUSPICIOUS_PARTS[dayOfWeekIndex % 7]!;

  const getWindow = (name: string, partNum: number): TimeWindow => {
    const start = rise.plus({ milliseconds: (partNum - 1) * segmentSpan });
    const end = rise.plus({ milliseconds: partNum * segmentSpan });
    return {
      name,
      startIso: start.toISO()!,
      endIso: end.toISO()!,
      startFormatted: start.toFormat('HH:mm'),
      endFormatted: end.toFormat('HH:mm'),
    };
  };

  return {
    rahuKalam: getWindow('Rahu Kalam', parts.rahuKalam),
    yamaganda: getWindow('Yamaganda', parts.yamaganda),
    gulika: getWindow('Gulika', parts.gulika),
  };
};
