import { DateTime } from 'luxon';
import type { VedicGraha } from '../natal/types.js';

export const DASHA_ORDER: readonly VedicGraha[] = [
  'ketu',
  'venus',
  'sun',
  'moon',
  'mars',
  'rahu',
  'jupiter',
  'saturn',
  'mercury',
] as const;

export const DASHA_YEARS: Record<VedicGraha, number> = {
  ketu: 7,
  venus: 20,
  sun: 6,
  moon: 10,
  mars: 7,
  rahu: 18,
  jupiter: 16,
  saturn: 19,
  mercury: 17,
};

export const TOTAL_DASHA_YEARS = 120;

// Nakshatra index (0 to 26) lord mapping
export const NAKSHATRA_LORDS: readonly VedicGraha[] = [
  'ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury', // 0-8
  'ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury', // 9-17
  'ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury', // 18-26
];

export interface DashaNode {
  level: 1 | 2 | 3 | 4; // 1 = Maha, 2 = Antar, 3 = Pratyantar, 4 = Sookshma
  lord: VedicGraha;
  startDateIso: string;
  endDateIso: string;
  durationDays: number;
  subPeriods?: DashaNode[];
}

export interface VimshottariBalance {
  startingLord: VedicGraha;
  balanceFraction: number; // 0..1 remaining
  balanceYears: number;
  formattedBalance: string; // e.g. "Sat 11 Y 5 M 20 D"
}

export interface VimshottariDashaTree {
  yearDays: number; // 365.25 or 360
  balance: VimshottariBalance;
  periods: DashaNode[];
}

/**
 * Vimshottari dasha computation supporting depth 1, 2, 3, or 4.
 * Year length is configurable:
 * - 365.25: standard astronomical Julian year (days based)
 * - 360: Savana year
 * - 'calendar': calendar year/month/day addition matching traditional Indian software (e.g. AstroSage)
 */
export const computeVimshottariDashas = (
  moonNakshatraIndex: number,
  elapsedFraction: number, // 0..1 into the nakshatra
  birthLocalIso: string,
  depth: 1 | 2 | 3 | 4 = 3,
  yearDays: number | 'calendar' = 365.25,
): VimshottariDashaTree => {
  const startingLord = NAKSHATRA_LORDS[moonNakshatraIndex % 27]!;
  const startingLordIndex = DASHA_ORDER.indexOf(startingLord);
  const totalYearsForLord = DASHA_YEARS[startingLord];

  // Fraction remaining at birth
  const remainingFraction = 1 - elapsedFraction;
  const balanceYears = totalYearsForLord * remainingFraction;

  // Breakdown into Years, Months, Days for standard display
  let y = Math.floor(balanceYears);
  const remY = (balanceYears - y) * 12;
  let m = Math.floor(remY);
  let d = Math.round((remY - m) * 30);
  if (d >= 30) {
    d = 0;
    m += 1;
  }
  if (m >= 12) {
    m = 0;
    y += 1;
  }
  const formattedBalance = `${startingLord.slice(0, 3).toUpperCase()} ${y} Y ${m} M ${d} D`;

  const birthDt = DateTime.fromISO(birthLocalIso);

  const buildSubPeriods = (
    parentLord: VedicGraha,
    parentStart: DateTime,
    parentDays: number,
    currentLevel: 2 | 3 | 4,
    targetDepth: 1 | 2 | 3 | 4,
  ): DashaNode[] => {
    if (currentLevel > targetDepth) return [];

    const pLordIdx = DASHA_ORDER.indexOf(parentLord);
    const subNodes: DashaNode[] = [];
    let curStart = parentStart;

    for (let i = 0; i < 9; i++) {
      const childLord = DASHA_ORDER[(pLordIdx + i) % 9]!;
      const childFraction = DASHA_YEARS[childLord] / TOTAL_DASHA_YEARS;
      const childDays = parentDays * childFraction;
      const curEnd = curStart.plus({ days: childDays });

      const node: DashaNode = {
        level: currentLevel,
        lord: childLord,
        startDateIso: curStart.toISODate()!,
        endDateIso: curEnd.toISODate()!,
        durationDays: childDays,
      };

      if (currentLevel < targetDepth) {
        node.subPeriods = buildSubPeriods(
          childLord,
          curStart,
          childDays,
          (currentLevel + 1) as 2 | 3 | 4,
          targetDepth,
        );
      }

      subNodes.push(node);
      curStart = curEnd;
    }

    return subNodes;
  };

  // 1. Build Mahadashas
  const periods: DashaNode[] = [];
  let currentStart: DateTime = birthDt;
  const isCalendar = yearDays === 'calendar';
  const effectiveYearDays = typeof yearDays === 'number' ? yearDays : 365.25;

  for (let i = 0; i < 9; i++) {
    const lord = DASHA_ORDER[(startingLordIndex + i) % 9]!;
    const fullYears = DASHA_YEARS[lord];
    let currentEnd: DateTime;
    let durationDays: number;

    if (i === 0) {
      if (isCalendar) {
        currentEnd = birthDt.plus({ years: y, months: m, days: d });
        durationDays = currentEnd.diff(currentStart, 'days').days;
      } else {
        durationDays = balanceYears * effectiveYearDays;
        currentEnd = currentStart.plus({ days: durationDays });
      }
    } else {
      if (isCalendar) {
        currentEnd = currentStart.plus({ years: fullYears });
        durationDays = currentEnd.diff(currentStart, 'days').days;
      } else {
        durationDays = fullYears * effectiveYearDays;
        currentEnd = currentStart.plus({ days: durationDays });
      }
    }

    const mahaNode: DashaNode = {
      level: 1,
      lord,
      startDateIso: currentStart.toISODate()!,
      endDateIso: currentEnd.toISODate()!,
      durationDays,
    };

    if (depth >= 2) {
      if (i === 0) {
        // First Mahadasha started BEFORE birth; Antardashas run over the FULL
        // Mahadasha duration from trueMahaStart, not compressed into the balance!
        const fullMahaDays = isCalendar
          ? currentEnd.diff(currentEnd.minus({ years: fullYears }), 'days').days
          : fullYears * effectiveYearDays;
        const trueMahaStart = isCalendar
          ? currentEnd.minus({ years: fullYears })
          : currentEnd.minus({ days: fullMahaDays });
        mahaNode.subPeriods = buildSubPeriods(
          lord,
          trueMahaStart,
          fullMahaDays,
          2,
          depth,
        );
      } else {
        mahaNode.subPeriods = buildSubPeriods(
          lord,
          currentStart,
          durationDays,
          2,
          depth,
        );
      }
    }

    periods.push(mahaNode);
    currentStart = currentEnd;
  }

  return {
    yearDays: effectiveYearDays,
    balance: {
      startingLord,
      balanceFraction: remainingFraction,
      balanceYears,
      formattedBalance,
    },
    periods,
  };
};
