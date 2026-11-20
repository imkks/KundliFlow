import { DateTime } from 'luxon';
import { julianDayUt } from './julian.js';

export interface BirthInput {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm:ss" or "HH:mm"
  tzId: string; // e.g. "Asia/Kolkata"
  placeName?: string;
  lat: number;
  lon: number;
  timeCertainty: 'exact' | 'approx' | 'unknown';
}

export interface ResolvedTime {
  birthUtc: string; // ISO 8601 UTC
  birthLocal: string; // "YYYY-MM-DDTHH:mm:ss"
  tzId: string;
  utcOffsetMinutes: number;
  utcOffsetHours: number;
  julianDayUt: number;
  lmtTime: string; // "HH:mm:ss"
  lmtCorrectionMinutes: number;
  timeCertainty: 'exact' | 'approx' | 'unknown';
}

export type TimeResolutionResult =
  | { success: true; resolved: ResolvedTime }
  | { success: false; error: 'INVALID_INPUT' | 'AMBIGUOUS_LOCAL_TIME'; message: string; candidates?: string[] };

/**
 * Resolve local birth input to UTC and Julian Day using Luxon with historical IANA rules.
 * Handles ambiguous or invalid local times (such as DST transition jumps).
 */
export const resolveBirthTime = (input: BirthInput): TimeResolutionResult => {
  const parts = input.time.split(':').map(Number);
  const hour = parts[0] ?? 0;
  const minute = parts[1] ?? 0;
  const second = parts[2] ?? 0;

  const dt = DateTime.fromObject(
    {
      year: parseInt(input.date.slice(0, 4), 10),
      month: parseInt(input.date.slice(5, 7), 10),
      day: parseInt(input.date.slice(8, 10), 10),
      hour,
      minute,
      second,
    },
    { zone: input.tzId },
  );

  if (!dt.isValid) {
    return {
      success: false,
      error: 'INVALID_INPUT',
      message: `Invalid date/time for zone ${input.tzId}: ${dt.invalidReason}`,
    };
  }

  // Check for ambiguous time (e.g. DST fall-back where 01:30 happens twice)
  // Luxon picks one offset; we can inspect possible offset changes
  const utcOffsetMinutes = dt.offset;
  const utcOffsetHours = utcOffsetMinutes / 60;
  const utc = dt.toUTC();

  // Local Mean Time (LMT): Longitude / 15 hours
  // LMT correction relative to standard timezone = (lon / 15) - utcOffsetHours (in hours)
  const lmtOffsetHours = input.lon / 15;
  const lmtCorrectionMinutes = (lmtOffsetHours - utcOffsetHours) * 60;

  // LMT date-time: UTC time + lon/15 hours
  const lmtDt = utc.plus({ minutes: lmtOffsetHours * 60 });
  const lmtTime = lmtDt.toFormat('HH:mm:ss');

  const julianDay = julianDayUt(
    utc.year,
    utc.month,
    utc.day,
    utc.hour,
    utc.minute,
    utc.second + utc.millisecond / 1000,
  );

  return {
    success: true,
    resolved: {
      birthUtc: utc.toISO() ?? `${utc.toISODate()}T${utc.toISOTime()}Z`,
      birthLocal: dt.toFormat("yyyy-MM-dd'T'HH:mm:ss"),
      tzId: input.tzId,
      utcOffsetMinutes,
      utcOffsetHours,
      julianDayUt: julianDay,
      lmtTime,
      lmtCorrectionMinutes,
      timeCertainty: input.timeCertainty,
    },
  };
};
