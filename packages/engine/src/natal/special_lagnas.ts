import { norm360, signOf, nakshatraOf, SIGNS } from '../angles.js';
import type { NatalChart } from './types.js';
import { houseFromSign } from './positions.js';
import { calculateSunTimes } from '../timequality/suntimes.js';
import { computePranapada } from './upagrahas.js';
import { DateTime } from 'luxon';

export interface SpecialLagnaPosition {
  id: 'bl' | 'hl' | 'gl' | 'sl' | 'indu' | 'pranapada';
  code: 'BL' | 'HL' | 'GL' | 'SL' | 'IL' | 'PP';
  name: string;
  lon: number;
  sign: string;
  signIndex: number;
  degInSign: number;
  houseFromLagna: number;
  houseFromMoon: number;
  nakshatra: string;
  signification: string;
}

// Classical Ray (Kala) values for Indu Lagna (Dr. K.S. Charak Ch. XXI & BPHS)
const INDU_RAYS: Record<string, number> = {
  sun: 30,
  moon: 16,
  mars: 6,
  mercury: 8,
  jupiter: 10,
  venus: 12,
  saturn: 1,
};

const SIGN_PRIMARY_LORDS = [
  'mars', 'venus', 'mercury', 'moon', 'sun', 'mercury',
  'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter',
];

/**
 * Computes all classical Special Lagnas per PVR Narasimha Rao (Ch. 5) and Dr. K.S. Charak (Ch. XI & XXI):
 * - Bhava Lagna (BL): 1 sign / 2 hours (0.25°/min)
 * - Hora Lagna (HL): 1 sign / 1 hour (0.5°/min) — Wealth & Finances
 * - Ghati Lagna (GL): 1 sign / 24 mins (1.25°/min) — Power, Authority & Rank
 * - Sree Lagna (SL): Moon Nakshatra fraction × 360° from natal Lagna — Prosperity & Marriage Fortune
 * - Indu Lagna (IL): 9th lord rays from Lagna & Moon — Special Wealth Reservoir
 * - Pranapada (PP): Life-breath ascendant from Ishta Palas
 */
export function computeSpecialLagnas(chart: NatalChart): SpecialLagnaPosition[] {
  const lagnaSignIndex = chart.lagna?.signIndex ?? 0;
  const lagnaLon = chart.lagna?.lon ?? 0;
  const sunLon = chart.grahas.sun.lon;
  const moonLon = chart.grahas.moon.lon;
  const moonSignIndex = chart.grahas.moon.signIndex;

  // Determine local sunrise time for elapsed minutes calculation
  const dateStr = chart.time.birthLocal.slice(0, 10);
  const sunTimes = calculateSunTimes(dateStr, chart.place.lat, chart.place.lon, chart.time.tzId);

  const birthDt = DateTime.fromISO(chart.time.birthLocal, { zone: chart.time.tzId });
  let sunriseDt = DateTime.fromISO(sunTimes.sunriseIso);

  // If born before sunrise, elapsed time is measured from previous day's sunrise
  if (birthDt < sunriseDt) {
    const prevDate = birthDt.minus({ days: 1 }).toISODate()!;
    const prevSunTimes = calculateSunTimes(prevDate, chart.place.lat, chart.place.lon, chart.time.tzId);
    sunriseDt = DateTime.fromISO(prevSunTimes.sunriseIso);
  }

  const elapsedMinutes = Math.max(0, birthDt.diff(sunriseDt, 'minutes').minutes);
  const elapsedHours = elapsedMinutes / 60;

  // Approximate Sun longitude at sunrise (Sun moves ~0.9856° per day = ~0.041°/hour)
  const sunAtSunrise = norm360(sunLon - elapsedHours * (0.9856 / 24));

  // 1. Bhava Lagna (BL): 15°/hour = 0.25°/minute
  const blLon = norm360(sunAtSunrise + elapsedMinutes * 0.25);

  // 2. Hora Lagna (HL): 30°/hour = 0.5°/minute (Wealth)
  const hlLon = norm360(sunAtSunrise + elapsedMinutes * 0.5);

  // 3. Ghati Lagna (GL): 75°/hour = 1.25°/minute (Power & Fame)
  const glLon = norm360(sunAtSunrise + elapsedMinutes * 1.25);

  // 4. Sree Lagna (SL): Lagna + (fraction of Moon's Nakshatra traversed * 360°)
  const moonMinutes = moonLon * 60;
  const nakFraction = (moonMinutes % 800) / 800; // 800 minutes = 13°20'
  const slLon = norm360(lagnaLon + nakFraction * 360);

  // 5. Indu Lagna (IL): Rays of 9th lord from Lagna + Rays of 9th lord from Moon
  const lord9FromLagna = SIGN_PRIMARY_LORDS[(lagnaSignIndex + 8) % 12]!;
  const lord9FromMoon = SIGN_PRIMARY_LORDS[(moonSignIndex + 8) % 12]!;
  const raysLagna = INDU_RAYS[lord9FromLagna] ?? 0;
  const raysMoon = INDU_RAYS[lord9FromMoon] ?? 0;
  const totalRays = raysLagna + raysMoon;
  const remainder = totalRays % 12 === 0 ? 12 : totalRays % 12;
  const induSignIndex = (moonSignIndex + remainder - 1) % 12;
  const induLon = norm360(induSignIndex * 30 + (moonLon % 30));

  // 6. Pranapada (PP): Life-breath ascendant
  const pp = computePranapada(chart);

  const rawList: Array<{
    id: SpecialLagnaPosition['id'];
    code: SpecialLagnaPosition['code'];
    name: string;
    lon: number;
    signification: string;
  }> = [
    {
      id: 'bl',
      code: 'BL',
      name: 'Bhava Lagna',
      lon: blLon,
      signification: 'Pertains to physical body and basic vitality rhythms',
    },
    {
      id: 'hl',
      code: 'HL',
      name: 'Hora Lagna',
      lon: hlLon,
      signification: 'Pertains to wealth, financial resources, and commercial prosperity',
    },
    {
      id: 'gl',
      code: 'GL',
      name: 'Ghati Lagna',
      lon: glLon,
      signification: 'Pertains to authority, power, career rank, and public eminence',
    },
    {
      id: 'sl',
      code: 'SL',
      name: 'Sree Lagna',
      lon: slLon,
      signification: 'Lakshmi Sthana: pertains to prosperity, auspicious blessings, and marital fortune',
    },
    {
      id: 'indu',
      code: 'IL',
      name: 'Indu Lagna',
      lon: induLon,
      signification: 'Special wealth and financial reservoir point (Charak Ch. XXI)',
    },
    {
      id: 'pranapada',
      code: 'PP',
      name: 'Pranapada Lagna',
      lon: pp.lon,
      signification: 'Life-breath indicator and birthtime rectification anchor (Charak Ch. XI)',
    },
  ];

  return rawList.map((item) => {
    const s = signOf(item.lon);
    const nak = nakshatraOf(item.lon);
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      lon: Number(item.lon.toFixed(4)),
      sign: s.sign,
      signIndex: s.signIndex,
      degInSign: Number(s.degInSign.toFixed(2)),
      houseFromLagna: houseFromSign(s.signIndex, lagnaSignIndex),
      houseFromMoon: houseFromSign(s.signIndex, moonSignIndex),
      nakshatra: nak.nakshatra,
      signification: item.signification,
    };
  });
}
