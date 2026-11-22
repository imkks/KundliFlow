import { norm360, signOf, nakshatraOf } from '../angles.js';
import type { NatalChart } from './types.js';
import { houseFromSign } from './positions.js';

export interface UpagrahaPosition {
  id: 'dhuma' | 'vyatipata' | 'parivesha' | 'indrachapa' | 'upaketu' | 'gulika' | 'mandi';
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
 * and approximate Gulika / Mandi longitudes from the natal chart.
 */
export function computeUpagrahas(chart: NatalChart): UpagrahaPosition[] {
  const sunLon = chart.grahas.sun.lon;
  const lagnaSignIndex = chart.lagna?.signIndex ?? 0;

  const dhuma = norm360(sunLon + 133 + 20 / 60);
  const vyatipata = norm360(360 - dhuma);
  const parivesha = norm360(vyatipata + 180);
  const indrachapa = norm360(360 - parivesha);
  const upaketu = norm360(indrachapa + 16 + 40 / 60);

  // Approximate Gulika & Mandi using birth local hour & weekday slot offset from Lagna
  const dow = new Date(chart.time.birthUtc).getUTCDay();
  const localHour = Number(chart.time.birthLocal.slice(11, 13)) || 12;
  const isDay = localHour >= 6 && localHour < 18;
  const part = isDay ? GULIKA_DAY_PART[dow]! : GULIKA_NIGHT_PART[dow]!;
  const lagnaLon = chart.lagna?.lon ?? sunLon;
  // Each 1/8th part of 12h (~1.5h) shifts the rising degree by ~22.5°
  const gulikaLon = norm360(lagnaLon + (part - 4) * 22.5);
  const mandiLon = norm360(gulikaLon - 7.5);

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
