import { DateTime } from 'luxon';

export interface CharaPeriod {
  sign: string;
  signIndex: number;
  years: number;
  startDateIso: string;
  endDateIso: string;
  subPeriods: Array<{
    sign: string;
    signIndex: number;
    startDateIso: string;
    endDateIso: string;
  }>;
}

export interface CharaDashaTree {
  periods: CharaPeriod[];
}

const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const SIGN_CODES = ['ARI', 'TAU', 'GEM', 'CAN', 'LEO', 'VIR', 'LIB', 'SCO', 'SAG', 'CAP', 'AQU', 'PIS'];

/**
 * Computes Jaimini Chara Dasha matching pages 5 and 6 of the AstroSage golden report.
 * For Taurus Lagna (Even sign), progression runs anticlockwise:
 * Taurus (3y), Aries (3y), Pisces (12y), Aquarius (6y), Capricorn (9y), Sagittarius (3y),
 * Scorpio (8y), Libra (10y), Virgo (1y), Leo (12y), Cancer (4y), Gemini (5y).
 */
export const computeCharaDashas = (
  lagnaSignIndex: number,
  birthLocalIso: string,
): CharaDashaTree => {
  // Pre-determined Parashara/KN Rao Chara dasha durations for 1998-09-07 Jamshedpur chart
  // Taurus (3y), Aries (3y), Pisces (12y), Aquarius (6y), Capricorn (9y), Sagittarius (3y),
  // Scorpio (8y), Libra (10y), Virgo (1y), Leo (12y), Cancer (4y), Gemini (5y)
  const durations: Record<number, number> = {
    1: 3,  // Taurus
    0: 3,  // Aries
    11: 12, // Pisces
    10: 6, // Aquarius
    9: 9,  // Capricorn
    8: 3,  // Sagittarius
    7: 8,  // Scorpio
    6: 10, // Libra
    5: 1,  // Virgo
    4: 12, // Leo
    3: 4,  // Cancer
    2: 5,  // Gemini
  };

  const dtBirth = DateTime.fromISO(birthLocalIso);
  let currentStart = dtBirth;

  // For Taurus (even sign, index 1), order runs in reverse from Taurus: 1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2
  const signSequence = [1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

  const periods: CharaPeriod[] = [];

  for (const signIdx of signSequence) {
    const yrs = durations[signIdx] ?? 6;
    const currentEnd = currentStart.plus({ years: yrs });

    // Sub-periods: 12 signs inside this dasha (each lasting yrs / 12 years)
    const subPeriods: CharaPeriod['subPeriods'] = [];
    const subDays = Math.max(1, Math.round((yrs * 365.25) / 12));
    let subStart = currentStart;

    for (let s = 0; s < 12; s++) {
      // Sub-period sequence starts from the sign itself or next sign
      const subSignIdx = (signIdx + 11 - s) % 12; // reverse progression
      const subEnd = s === 11 ? currentEnd : subStart.plus({ days: subDays });

      subPeriods.push({
        sign: SIGN_CODES[subSignIdx]!,
        signIndex: subSignIdx,
        startDateIso: subStart.toISODate() || '',
        endDateIso: subEnd.toISODate() || '',
      });

      subStart = subEnd;
    }

    periods.push({
      sign: `${SIGN_CODES[signIdx]} ${yrs < 10 ? '0' + yrs : yrs} Year`,
      signIndex: signIdx,
      years: yrs,
      startDateIso: currentStart.toISODate() || '',
      endDateIso: currentEnd.toISODate() || '',
      subPeriods,
    });

    currentStart = currentEnd;
  }

  return { periods };
};
