import * as Astronomy from 'astronomy-engine';
import { DateTime } from 'luxon';

export interface SunTimes {
  sunriseIso: string;
  sunsetIso: string;
  sunriseTime: string; // "HH:mm:ss"
  sunsetTime: string; // "HH:mm:ss"
  dayDurationHours: number;
  dayDurationFormatted: string; // "HH:mm:ss"
  sunriseJdUt: number;
  sunsetJdUt: number;
}

/**
 * Calculates accurate Sunrise and Sunset for a given date, geographic location and timezone.
 * Uses standard standard atmospheric refraction and solar upper limb model.
 * @param dateStr "YYYY-MM-DD"
 * @param lat Decimal latitude (North positive)
 * @param lon Decimal longitude (East positive)
 * @param tzId IANA timezone string e.g. "Asia/Kolkata"
 */
export const calculateSunTimes = (
  dateStr: string,
  lat: number,
  lon: number,
  tzId: string,
): SunTimes => {
  // Observer at sea level
  const observer = new Astronomy.Observer(lat, lon, 0);

  // Reference midnight local time
  const localMidnight = DateTime.fromISO(`${dateStr}T00:00:00`, { zone: tzId });
  const utcDate = localMidnight.toJSDate();

  // Search forward for sunrise (+1 = rise)
  const riseTime = Astronomy.SearchRiseSet(
    Astronomy.Body.Sun,
    observer,
    +1,
    utcDate,
    1, // Search within 1 day
  );

  // Search forward for sunset from sunrise (-1 = set)
  const setTime = Astronomy.SearchRiseSet(
    Astronomy.Body.Sun,
    observer,
    -1,
    riseTime ? riseTime.date : utcDate,
    1,
  );

  if (!riseTime || !setTime) {
    throw new Error(`Unable to determine sunrise/sunset for date ${dateStr} at lat ${lat}`);
  }

  const riseDt = DateTime.fromJSDate(riseTime.date).setZone(tzId);
  const setDt = DateTime.fromJSDate(setTime.date).setZone(tzId);

  const durationMillis = setDt.diff(riseDt).as('milliseconds');
  const durationHours = durationMillis / (1000 * 60 * 60);

  const durSecTotal = Math.round(durationMillis / 1000);
  const durH = Math.floor(durSecTotal / 3600);
  const durM = Math.floor((durSecTotal % 3600) / 60);
  const durS = durSecTotal % 60;
  const dayDurationFormatted = `${String(durH).padStart(2, '0')}:${String(durM).padStart(2, '0')}:${String(durS).padStart(2, '0')}`;

  return {
    sunriseIso: riseDt.toISO()!,
    sunsetIso: setDt.toISO()!,
    sunriseTime: riseDt.toFormat('HH:mm:ss'),
    sunsetTime: setDt.toFormat('HH:mm:ss'),
    dayDurationHours: durationHours,
    dayDurationFormatted,
    sunriseJdUt: riseTime.tt + 2451545.0, // convert J2000 AstroTime to JD
    sunsetJdUt: setTime.tt + 2451545.0,
  };
};
