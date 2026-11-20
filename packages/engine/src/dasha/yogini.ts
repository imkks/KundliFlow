import { DateTime } from 'luxon';

export interface YoginiPeriod {
  name: string;
  code: string;
  lord: string;
  years: number;
}

export const YOGINI_ORDER: readonly YoginiPeriod[] = [
  { name: 'Mangala', code: 'Ma', lord: 'moon', years: 1 },
  { name: 'Pingala', code: 'Pi', lord: 'sun', years: 2 },
  { name: 'Dhanya', code: 'Dh', lord: 'jupiter', years: 3 },
  { name: 'Bhramari', code: 'Br', lord: 'mars', years: 4 },
  { name: 'Bhadrika', code: 'Ba', lord: 'mercury', years: 5 },
  { name: 'Ulka', code: 'Ul', lord: 'saturn', years: 6 },
  { name: 'Siddha', code: 'Si', lord: 'venus', years: 7 },
  { name: 'Sankata', code: 'Sn', lord: 'rahu', years: 8 },
] as const;

export const TOTAL_YOGINI_YEARS = 36;

export interface YoginiAntardasha {
  name: string;
  code: string;
  lord: string;
  startDateIso: string;
  endDateIso: string;
  durationDays: number;
}

export interface YoginiMahadasha {
  name: string;
  code: string;
  lord: string;
  years: number;
  startDateIso: string;
  endDateIso: string;
  durationDays: number;
  subPeriods: YoginiAntardasha[];
}

export interface YoginiDashaTree {
  startingBalance: {
    name: string;
    code: string;
    yearsRemaining: number;
  };
  periods: YoginiMahadasha[];
}

/**
 * Computes Yogini Dasha (36-year cycle) from natal Moon nakshatra and elapsed fraction.
 * Formula for starting Yogini: (NakshatraIndex + 1 + 3) % 8
 * where 1=Mangala, 2=Pingala, 3=Dhanya, 4=Bhramari, 5=Bhadrika, 6=Ulka, 7=Siddha, 0/8=Sankata.
 * Matches page 3 of the AstroSage golden report.
 */
export const computeYoginiDashas = (
  moonNakshatraIndex: number, // 0 = Ashwini .. 25 = Uttarabhadrapada .. 26 = Revati
  elapsedFraction: number, // 0..1 fraction traversed in nakshatra
  birthLocalIso: string,
  totalCycles = 2, // 2 cycles = 72 years
): YoginiDashaTree => {
  // Nakshatra number (1-based): Ashwini = 1, Uttarabhadrapada = 26
  const nakNumber = (moonNakshatraIndex % 27) + 1;
  // (nakNumber + 3) % 8 -> 1=Mangala (idx 0), 2=Pingala (idx 1), ..., 5=Bhadrika (idx 4)
  const startingIdx = ((nakNumber + 3) % 8 || 8) - 1; // 0 to 7
  const startingYogini = YOGINI_ORDER[startingIdx]!;

  const remainingFraction = 1 - elapsedFraction;
  const balanceYears = startingYogini.years * remainingFraction;

  const dtBirth = DateTime.fromISO(birthLocalIso);
  const elapsedYears = startingYogini.years * elapsedFraction;
  // Mahadasha actually started before birth:
  let currentStart = dtBirth.minus({ days: Math.round(elapsedYears * 365.25) });

  const periods: YoginiMahadasha[] = [];

  for (let cycle = 0; cycle < totalCycles; cycle++) {
    for (let i = 0; i < 8; i++) {
      const idx = (startingIdx + (cycle === 0 ? i : cycle * 8 + i)) % 8;
      const y = YOGINI_ORDER[idx]!;
      const mahaDays = Math.round(y.years * 365.25);
      const currentEnd = currentStart.plus({ days: mahaDays });

      // Generate 8 Antardashas
      const subPeriods: YoginiAntardasha[] = [];
      let subStart = currentStart;

      for (let j = 0; j < 8; j++) {
        const subIdx = (idx + j) % 8;
        const subY = YOGINI_ORDER[subIdx]!;
        // Duration = (MahaYears * AntarYears / 36) years
        const antarYears = (y.years * subY.years) / 36;
        const antarDays = Math.max(1, Math.round(antarYears * 365.25));
        const subEnd = j === 7 ? currentEnd : subStart.plus({ days: antarDays });

        subPeriods.push({
          name: `${y.name} - ${subY.name}`,
          code: `${y.code} - ${subY.code}`,
          lord: subY.lord,
          startDateIso: subStart.toISODate() || '',
          endDateIso: subEnd.toISODate() || '',
          durationDays: antarDays,
        });

        subStart = subEnd;
      }

      periods.push({
        name: y.name,
        code: y.code,
        lord: y.lord,
        years: y.years,
        startDateIso: currentStart.toISODate() || '',
        endDateIso: currentEnd.toISODate() || '',
        durationDays: mahaDays,
        subPeriods,
      });

      currentStart = currentEnd;
    }
  }

  return {
    startingBalance: {
      name: startingYogini.name,
      code: startingYogini.code,
      yearsRemaining: balanceYears,
    },
    periods,
  };
};
