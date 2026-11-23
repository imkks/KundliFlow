import { norm360, signOf, nakshatraOf } from '../angles.js';
import type { NatalChart } from './types.js';
import { houseFromSign } from './positions.js';
import { calculateSunTimes } from '../timequality/suntimes.js';
import { DateTime } from 'luxon';

export interface UpagrahaPosition {
  id: 'dhuma' | 'vyatipata' | 'parivesha' | 'indrachapa' | 'upaketu' | 'gulika' | 'mandi' | 'pranapada';
  name: string;
  lon: number;
  sign: string;
  signIndex: number;
  degInSign: number;
  houseFromLagna: number;
  nakshatra: string;
  formula: string;
}

// Parashari weekday 1/8th slot (1-indexed out of 8) for Saturn's portion (Gulika) during day / night
const GULIKA_DAY_PART = [7, 6, 5, 4, 3, 2, 1];   // Sun=7, Mon=6, Tue=5, Wed=4, Thu=3, Fri=2, Sat=1
const GULIKA_NIGHT_PART = [3, 2, 1, 7, 6, 5, 4]; // Sun=3, Mon=2, Tue=1, Wed=7, Thu=6, Fri=5, Sat=4

/**
 * Computes the 5 Solar Aprakasha Upagrahas (Dhuma, Vyatipata, Parivesha, Indrachapa, Upaketu)
 * and authentic Gulika / Mandi longitudes from true sunrise/sunset and Saturn's portion.
 */
export function computeUpagrahas(chart: NatalChart): UpagrahaPosition[] {
  const sunLon = chart.grahas.sun.lon;
  const lagnaSignIndex = chart.lagna?.signIndex ?? 0;

  const dhuma = norm360(sunLon + 133 + 20 / 60);
  const vyatipata = norm360(360 - dhuma);
  const parivesha = norm360(vyatipata + 180);
  const indrachapa = norm360(360 - parivesha);
  const upaketu = norm360(indrachapa + 16 + 40 / 60);

  // Compute Gulika & Mandi using true local sunrise/sunset and Saturn's 1/8th portion
  const dateStr = chart.time.birthLocal.slice(0, 10);
  const sunTimes = calculateSunTimes(dateStr, chart.place.lat, chart.place.lon, chart.time.tzId);

  const birthDt = DateTime.fromISO(chart.time.birthLocal, { zone: chart.time.tzId });
  const sunriseDt = DateTime.fromISO(sunTimes.sunriseIso);
  const sunsetDt = DateTime.fromISO(sunTimes.sunsetIso);

  const isBeforeSunrise = birthDt < sunriseDt;
  const isDay = !isBeforeSunrise && birthDt < sunsetDt;

  // Vedic day of week (Vara) is reckoned strictly from sunrise to sunrise
  let dow = birthDt.weekday % 7; // Luxon 7=Sun -> 0
  if (isBeforeSunrise) {
    dow = (dow - 1 + 7) % 7; // Previous day if born before sunrise
  }

  const part = isDay ? GULIKA_DAY_PART[dow]! : GULIKA_NIGHT_PART[dow]!;

  // Dinamana (day length) / Ratrimana (night length)
  let partDurationMinutes = 90;
  let elapsedMinutesToSaturnStart = 0;
  let elapsedMinutesToSaturnMid = 0;

  if (isDay) {
    const dinamanaMinutes = sunsetDt.diff(sunriseDt, 'minutes').minutes || 720;
    partDurationMinutes = dinamanaMinutes / 8;
    elapsedMinutesToSaturnStart = (part - 1) * partDurationMinutes;
    elapsedMinutesToSaturnMid = (part - 0.5) * partDurationMinutes;
  } else {
    // Night portion: if born before sunrise, night began at previous sunset (~18:00)
    const ratrimanaMinutes = 1440 - (sunsetDt.diff(sunriseDt, 'minutes').minutes || 720);
    partDurationMinutes = ratrimanaMinutes / 8;
    elapsedMinutesToSaturnStart = (part - 1) * partDurationMinutes;
    elapsedMinutesToSaturnMid = (part - 0.5) * partDurationMinutes;
  }

  // Ascendant at sunrise is Sun's longitude; earth rotates 360° in 1440 minutes (0.25°/min)
  // At diurnal birth, Gulika = Ascendant at start of Saturn's portion from sunrise
  // At nocturnal birth, Gulika = Ascendant at start of Saturn's portion from sunset (Sun + 180°)
  const baseAscendantAtSegmentStart = isDay ? sunLon : norm360(sunLon + 180);
  const gulikaLon = norm360(baseAscendantAtSegmentStart + elapsedMinutesToSaturnStart * 0.25);
  const mandiLon = norm360(baseAscendantAtSegmentStart + elapsedMinutesToSaturnMid * 0.25);

  const rawList: Array<{ id: UpagrahaPosition['id']; name: string; lon: number; formula: string }> = [
    { id: 'dhuma', name: 'Dhuma', lon: dhuma, formula: 'Sun + 133°20\'' },
    { id: 'vyatipata', name: 'Vyatipata', lon: vyatipata, formula: '360° - Dhuma' },
    { id: 'parivesha', name: 'Parivesha', lon: parivesha, formula: 'Vyatipata + 180°' },
    { id: 'indrachapa', name: 'Indrachapa (Kodanda)', lon: indrachapa, formula: '360° - Parivesha' },
    { id: 'upaketu', name: 'Upaketu', lon: upaketu, formula: 'Indrachapa + 16°40\'' },
    { id: 'gulika', name: 'Gulika', lon: gulikaLon, formula: `Weekday #${dow} ${isDay ? 'day' : 'night'} part ${part}/8` },
    { id: 'mandi', name: 'Mandi', lon: mandiLon, formula: 'Saturnian sub-point' },
  ];

  return rawList.map((item) => {
    const s = signOf(item.lon);
    const nak = nakshatraOf(item.lon);
    return {
      id: item.id,
      name: item.name,
      lon: Number(item.lon.toFixed(4)),
      sign: s.sign,
      signIndex: s.signIndex,
      degInSign: Number(s.degInSign.toFixed(2)),
      houseFromLagna: houseFromSign(s.signIndex, lagnaSignIndex),
      nakshatra: nak.nakshatra,
      formula: item.formula,
    };
  });
}

/**
 * Computes Pranapada Lagna per BPHS Ch. 3, Verses 70–73 & Dr. K.S. Charak:
 * 1. Convert Ishta-Kaala (time elapsed since local sunrise) into Palas (1 Pala = 24 seconds).
 * 2. theta = (Palas * 2)° mod 360°.
 * 3. Offset based on Sun's Rashi modality:
 *    - Movable (Chara): Sun + theta
 *    - Fixed (Sthira): Sun + theta + 240° (9th from Sun)
 *    - Dual (Dwiswabhava): Sun + theta + 120° (5th from Sun)
 */
export function computePranapada(chart: NatalChart): UpagrahaPosition {
  const sunLon = chart.grahas.sun.lon;
  const lagnaSignIndex = chart.lagna?.signIndex ?? 0;

  const dateStr = chart.time.birthLocal.slice(0, 10);
  const sunTimes = calculateSunTimes(dateStr, chart.place.lat, chart.place.lon, chart.time.tzId);

  const birthDt = DateTime.fromISO(chart.time.birthLocal, { zone: chart.time.tzId });
  let sunriseDt = DateTime.fromISO(sunTimes.sunriseIso);

  // If born before sunrise, Ishta-Kaala is measured from the previous day's sunrise
  if (birthDt < sunriseDt) {
    const prevDate = birthDt.minus({ days: 1 }).toISODate()!;
    const prevSunTimes = calculateSunTimes(prevDate, chart.place.lat, chart.place.lon, chart.time.tzId);
    sunriseDt = DateTime.fromISO(prevSunTimes.sunriseIso);
  }

  const elapsedSeconds = Math.max(0, birthDt.diff(sunriseDt, 'seconds').seconds);
  const ishtaPalas = elapsedSeconds / 24; // 1 Pala = 24 seconds
  const thetaPP = norm360(ishtaPalas * 2);

  // Sun sign modality: Movable=0,3,6,9; Fixed=1,4,7,10; Dual=2,5,8,11
  const sunSignModality = chart.grahas.sun.signIndex % 3;
  let offset = 0;
  if (sunSignModality === 1) {
    offset = 240; // Fixed: 9th from Sun
  } else if (sunSignModality === 2) {
    offset = 120; // Dual: 5th from Sun
  }

  const ppLon = norm360(sunLon + thetaPP + offset);
  const s = signOf(ppLon);
  const nak = nakshatraOf(ppLon);

  return {
    id: 'pranapada',
    name: 'Pranapada',
    lon: Number(ppLon.toFixed(4)),
    sign: s.sign,
    signIndex: s.signIndex,
    degInSign: Number(s.degInSign.toFixed(2)),
    houseFromLagna: houseFromSign(s.signIndex, lagnaSignIndex),
    nakshatra: nak.nakshatra,
    formula: `Sun + (IshtaPalas * 2)° + ${offset}° (${sunSignModality === 0 ? 'Movable' : sunSignModality === 1 ? 'Fixed' : 'Dual'})`,
  };
}
