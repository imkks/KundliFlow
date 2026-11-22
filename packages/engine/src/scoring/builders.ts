import { DateTime } from 'luxon';
import type { EphemerisProvider } from '../ephemeris/types.js';
import type { NatalDigest } from '../natal/digest.js';
import { SIGN_LORDS, type VedicGraha } from '../natal/types.js';
import { scoreHour, type HourScore, type Band } from './index.js';
import { calculateSunTimes } from '../timequality/suntimes.js';
import { computeDayHoras, computeInauspiciousWindows, type HoraInfo, type InauspiciousWindows } from '../timequality/horas.js';
import { norm360, nakshatraOf } from '../angles.js';
import { julianDayUt } from '../time/julian.js';
import { computePanchang, type PanchangResult } from '../panchang/index.js';

export interface MergedWindow {
  band: Band;
  bandLabel: string;
  startHour: string; // "HH:mm"
  endHour: string; // "HH:mm"
  avgScore: number;
}

export interface DayView {
  date: string; // "YYYY-MM-DD"
  dayBand: Band;
  dayBandLabel: string;
  wakingMeanScore: number;
  hourlyScores: HourScore[];
  flowingWindows: MergedWindow[];
  goGentlyWindows: MergedWindow[];
  panchang: PanchangResult;
  rahuKalam: { start: string; end: string };
  horas?: HoraInfo[];
  inauspicious?: InauspiciousWindows;
}

export interface MonthDaySummary {
  date: string;
  dayBand: Band;
  dayScore: number;
}

export interface MonthView {
  year: number;
  month: number;
  days: MonthDaySummary[];
  ingressEvents: Array<{ date: string; description: string }>;
}

export interface YearMonthSummary {
  year: number;
  month: number;
  meanScore: number;
  dominantBand: Band;
}

export interface YearView {
  year: number;
  months: YearMonthSummary[];
  slowTransits: Array<{ planet: string; sign: string; houseFromLagna: number; houseFromMoon: number }>;
}

export interface ScoringOptions {
  runningMahadashaLord?: VedicGraha;
  runningAntardashaLord?: VedicGraha;
  natalSarvaAshtakvarga?: number[];
}

const DEFAULT_SAV_FALLBACK = [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28];

function mergeHourWindows(hourlyScores: HourScore[], targetBand: Band): MergedWindow[] {
  const windows: MergedWindow[] = [];
  let startH: number | null = null;
  let sum = 0;
  let count = 0;
  let label = '';

  const flush = (endH: number) => {
    if (startH !== null && count > 0) {
      windows.push({
        band: targetBand,
        bandLabel: label,
        startHour: `${String(startH).padStart(2, '0')}:00`,
        endHour: `${String(endH).padStart(2, '0')}:00`,
        avgScore: Number((sum / count).toFixed(1)),
      });
    }
    startH = null;
    sum = 0;
    count = 0;
  };

  for (let h = 6; h <= 22; h++) {
    const hs = hourlyScores[h];
    if (hs && hs.band === targetBand) {
      if (startH === null) {
        startH = h;
        label = hs.bandLabel;
      }
      sum += hs.score;
      count++;
    } else {
      flush(h);
    }
  }
  flush(23);
  return windows;
}

/**
 * Builds the 24-hour Day View with merged windows, panchang, and day band (§4.3).
 */
export const buildDay = (
  eph: EphemerisProvider,
  digest: NatalDigest,
  dateStr: string,
  tzId = 'Asia/Kolkata',
  options?: ScoringOptions,
): DayView => {
  const sunTimes = calculateSunTimes(dateStr, digest.lat, digest.lon, tzId);
  const nextDateStr = DateTime.fromISO(dateStr).plus({ days: 1 }).toISODate()!;
  const nextSunTimes = calculateSunTimes(nextDateStr, digest.lat, digest.lon, tzId);

  const localDt = DateTime.fromISO(`${dateStr}T12:00:00`, { zone: tzId });
  const dayOfWeek = localDt.weekday === 7 ? 0 : localDt.weekday; // 0 = Sunday

  const horas = computeDayHoras(
    dayOfWeek,
    sunTimes.sunriseIso,
    sunTimes.sunsetIso,
    nextSunTimes.sunriseIso,
  );
  const inauspicious = computeInauspiciousWindows(dayOfWeek, sunTimes.sunriseIso, sunTimes.sunsetIso);

  const lagnaLord: VedicGraha = digest.lagna ? SIGN_LORDS[digest.lagna.signIndex]! : 'venus';
  const runningMahaLord: VedicGraha = options?.runningMahadashaLord ?? lagnaLord;
  const natalSav =
    options?.natalSarvaAshtakvarga && options.natalSarvaAshtakvarga.length === 12
      ? options.natalSarvaAshtakvarga
      : DEFAULT_SAV_FALLBACK;

  const hourlyScores: HourScore[] = [];
  let wakingScoreSum = 0;
  let wakingHourCount = 0;

  for (let h = 0; h < 24; h++) {
    const curHourDt = DateTime.fromISO(`${dateStr}T${String(h).padStart(2, '0')}:00:00`, { zone: tzId });
    const utcDt = curHourDt.toUTC();
    const jd = julianDayUt(utcDt.year, utcDt.month, utcDt.day, utcDt.hour, 0, 0);

    const bodies = eph.bodies(jd, ['sun', 'moon']);
    const ay = eph.ayanamsa(jd, 'lahiri');
    const sidMoon = norm360(bodies.moon.lon - ay);
    const moonNak = nakshatraOf(sidMoon);

    // Identify active hora lord
    const curTimeMs = curHourDt.toMillis();
    const activeHora = horas.find((hr) => {
      const s = DateTime.fromISO(hr.startIso).toMillis();
      const e = DateTime.fromISO(hr.endIso).toMillis();
      return curTimeMs >= s && curTimeMs < e;
    }) || horas[0]!;

    // Check if within Rahu Kalam, Yamaganda or Gulika
    let activeWindow: string | null = null;
    const rkStart = DateTime.fromISO(inauspicious.rahuKalam.startIso).toMillis();
    const rkEnd = DateTime.fromISO(inauspicious.rahuKalam.endIso).toMillis();
    if (curTimeMs >= rkStart && curTimeMs < rkEnd) {
      activeWindow = 'Rahu Kalam';
    }

    const hScore = scoreHour({
      instantUtc: utcDt.toISO()!,
      hourUtc: `${curHourDt.toFormat('yyyy-MM-ddTHH:00:00')}Z`,
      transitMoonLon: sidMoon,
      transitMoonNakshatraIndex: moonNak.nakshatraIndex,
      natalMoonSignIndex: digest.moon.signIndex,
      natalMoonNakshatraIndex: digest.moon.nakshatraIndex,
      natalLagnaLord: lagnaLord,
      natalSarvaAshtakvarga: natalSav,
      currentHoraLord: activeHora.lord,
      runningMahadashaLord: runningMahaLord,
      ...(options?.runningAntardashaLord ? { runningAntardashaLord: options.runningAntardashaLord } : {}),
      activeInauspiciousWindow: activeWindow,
    });

    hourlyScores.push(hScore);

    // Waking hours (06:00 to 22:00)
    if (h >= 6 && h <= 22) {
      wakingScoreSum += hScore.score;
      wakingHourCount++;
    }
  }

  const wakingMean = wakingHourCount > 0 ? wakingScoreSum / wakingHourCount : 0;
  let dayBand: Band = 'steady';
  if (wakingMean >= 3) dayBand = 'flowing';
  else if (wakingMean <= -2) dayBand = 'go_gently';

  // Panchang at sunrise
  const riseUtc = DateTime.fromISO(sunTimes.sunriseIso).toUTC();
  const riseJd = julianDayUt(riseUtc.year, riseUtc.month, riseUtc.day, riseUtc.hour, riseUtc.minute, riseUtc.second);
  const riseBodies = eph.bodies(riseJd, ['sun', 'moon']);
  const riseAy = eph.ayanamsa(riseJd, 'lahiri');
  const panchang = computePanchang(
    norm360(riseBodies.sun.lon - riseAy),
    norm360(riseBodies.moon.lon - riseAy),
    dayOfWeek,
  );

  return {
    date: dateStr,
    dayBand,
    dayBandLabel: dayBand === 'flowing' ? 'Flowing' : dayBand === 'go_gently' ? 'Go gently' : 'Steady',
    wakingMeanScore: wakingMean,
    hourlyScores,
    flowingWindows: mergeHourWindows(hourlyScores, 'flowing'),
    goGentlyWindows: mergeHourWindows(hourlyScores, 'go_gently'),
    panchang,
    rahuKalam: {
      start: inauspicious.rahuKalam.startFormatted,
      end: inauspicious.rahuKalam.endFormatted,
    },
    horas,
    inauspicious,
  };
};

const SIGN_NAMES_INGRESS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

/**
 * Builds the Month Calendar Heatmap (§4.4).
 */
export const buildMonth = (
  eph: EphemerisProvider,
  digest: NatalDigest,
  year: number,
  month: number,
  tzId = 'Asia/Kolkata',
  options?: ScoringOptions,
): MonthView => {
  const startDt = DateTime.fromObject({ year, month, day: 1 }, { zone: tzId });
  const daysInMonth = startDt.daysInMonth!;
  const days: MonthDaySummary[] = [];
  const ingressEvents: Array<{ date: string; description: string }> = [];

  const lagnaLord: VedicGraha = digest.lagna ? SIGN_LORDS[digest.lagna.signIndex]! : 'venus';
  const runningMahaLord: VedicGraha = options?.runningMahadashaLord ?? lagnaLord;
  const natalSav =
    options?.natalSarvaAshtakvarga && options.natalSarvaAshtakvarga.length === 12
      ? options.natalSarvaAshtakvarga
      : DEFAULT_SAV_FALLBACK;

  const trackedPlanets = ['sun', 'mars', 'mercury', 'venus', 'jupiter', 'saturn'] as const;
  let prevSigns: Record<string, number> | null = null;

  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = startDt.set({ day: d }).toISODate()!;
    // Sample midday for fast calendar heat-map
    const middayUtc = startDt.set({ day: d, hour: 12 }).toUTC();
    const jd = julianDayUt(middayUtc.year, middayUtc.month, middayUtc.day, 12, 0, 0);
    const bodies = eph.bodies(jd, ['moon', ...trackedPlanets]);
    const ay = eph.ayanamsa(jd, 'lahiri');
    const sidMoon = norm360(bodies.moon.lon - ay);
    const moonNak = nakshatraOf(sidMoon);

    const curSigns: Record<string, number> = {};
    for (const p of trackedPlanets) {
      const sIdx = Math.floor(norm360(bodies[p].lon - ay) / 30) % 12;
      curSigns[p] = sIdx;
      if (prevSigns && prevSigns[p] !== undefined && prevSigns[p] !== sIdx) {
        const label = p.charAt(0).toUpperCase() + p.slice(1);
        ingressEvents.push({
          date: dStr,
          description: `${label} enters ${SIGN_NAMES_INGRESS[sIdx]}`,
        });
      }
    }
    prevSigns = curSigns;

    const hScore = scoreHour({
      instantUtc: middayUtc.toISO()!,
      hourUtc: `${dStr}T12:00:00Z`,
      transitMoonLon: sidMoon,
      transitMoonNakshatraIndex: moonNak.nakshatraIndex,
      natalMoonSignIndex: digest.moon.signIndex,
      natalMoonNakshatraIndex: digest.moon.nakshatraIndex,
      natalLagnaLord: lagnaLord,
      natalSarvaAshtakvarga: natalSav,
      currentHoraLord: 'sun',
      runningMahadashaLord: runningMahaLord,
      ...(options?.runningAntardashaLord ? { runningAntardashaLord: options.runningAntardashaLord } : {}),
    });

    days.push({
      date: dStr,
      dayBand: hScore.band,
      dayScore: hScore.score,
    });
  }

  return {
    year,
    month,
    days,
    ingressEvents,
  };
};

/**
 * Builds the Year Overview Strip (§4.5).
 */
export const buildYear = (
  eph: EphemerisProvider,
  digest: NatalDigest,
  year: number,
  tzId = 'Asia/Kolkata',
  options?: ScoringOptions,
): YearView => {
  const months: YearMonthSummary[] = [];

  for (let m = 1; m <= 12; m++) {
    const mv = buildMonth(eph, digest, year, m, tzId, options);
    const avgScore = mv.days.reduce((acc, d) => acc + d.dayScore, 0) / mv.days.length;
    let dominantBand: Band = 'steady';
    if (avgScore >= 2) dominantBand = 'flowing';
    else if (avgScore <= -1.5) dominantBand = 'go_gently';

    months.push({
      year,
      month: m,
      meanScore: avgScore,
      dominantBand,
    });
  }

  return {
    year,
    months,
    slowTransits: [],
  };
};
