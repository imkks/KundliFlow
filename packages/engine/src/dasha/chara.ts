import { DateTime } from 'luxon';
import type { NatalChart, VedicGraha } from '../natal/types.js';

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

const SIGN_CODES = ['ARI', 'TAU', 'GEM', 'CAN', 'LEO', 'VIR', 'LIB', 'SCO', 'SAG', 'CAP', 'AQU', 'PIS'];

// Direct (Savya) signs vs Indirect (Apasavya) signs per K.N. Rao / Parashara Chara Dasha
const DIRECT_SIGNS = new Set([0, 1, 2, 6, 7, 8]); // Ari, Tau, Gem, Lib, Sco, Sag

const PRIMARY_LORD: Record<number, VedicGraha> = {
  0: 'mars',
  1: 'venus',
  2: 'mercury',
  3: 'moon',
  4: 'sun',
  5: 'mercury',
  6: 'venus',
  7: 'mars',
  8: 'jupiter',
  9: 'saturn',
  10: 'saturn',
  11: 'jupiter',
};

/**
 * Resolves the stronger lord for dual-lord signs (Scorpio: Mars/Ketu, Aquarius: Saturn/Rahu)
 * using K.N. Rao Jaimini strength rules:
 * 1. If one lord is in its own sign and the other is not, the one outside own sign takes precedence for counting
 *    (if both in own sign, 12 years).
 * 2. Planet conjunct more planets is stronger.
 * 3. Higher degree in sign breaks ties.
 */
function resolveSignLord(signIdx: number, grahas: NatalChart['grahas']): VedicGraha {
  if (signIdx !== 7 && signIdx !== 10) {
    return PRIMARY_LORD[signIdx]!;
  }
  const lordA: VedicGraha = signIdx === 7 ? 'mars' : 'saturn';
  const lordB: VedicGraha = signIdx === 7 ? 'ketu' : 'rahu';
  const gA = grahas[lordA];
  const gB = grahas[lordB];
  if (!gA || !gB) return lordA;

  // Count planetary companions in same sign (excluding self)
  const all9: VedicGraha[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
  const compA = all9.filter((k) => k !== lordA && grahas[k]?.signIndex === gA.signIndex).length;
  const compB = all9.filter((k) => k !== lordB && grahas[k]?.signIndex === gB.signIndex).length;
  if (compA !== compB) return compA > compB ? lordA : lordB;

  return gA.degInSign >= gB.degInSign ? lordA : lordB;
}

/**
 * Computes sign duration in years (1..12) per K.N. Rao / Parashara Chara Dasha:
 * - Direct signs (Ari, Tau, Gem, Lib, Sco, Sag): count forward from sign to lord, minus 1.
 * - Indirect signs (Can, Leo, Vir, Cap, Aqu, Pis): count backward from sign to lord, minus 1.
 * - Lord in own sign => 12 years.
 */
function computeSignDuration(signIdx: number, grahas?: NatalChart['grahas']): number {
  if (!grahas) return 6; // Neutral fallback if grahas omitted
  const lord = resolveSignLord(signIdx, grahas);
  const lordPos = grahas[lord];
  if (!lordPos) return 6;

  if (lordPos.signIndex === signIdx) return 12;

  const dist = DIRECT_SIGNS.has(signIdx)
    ? (lordPos.signIndex - signIdx + 12) % 12
    : (signIdx - lordPos.signIndex + 12) % 12;

  return dist === 0 ? 12 : dist;
}

/**
 * Computes Jaimini Chara Dasha (K.N. Rao / Parashara standard) dynamically for any Lagna and chart.
 * - Progression direction is determined by the 9th sign from Lagna:
 *   Direct (forward) if 9th sign is in {Ari, Tau, Gem, Lib, Sco, Sag}, Reverse otherwise.
 * - Each Mahadasha sign duration is computed dynamically from its lord's placement.
 */
export const computeCharaDashas = (
  lagnaSignIndex: number,
  birthLocalIso: string,
  grahas?: NatalChart['grahas'],
): CharaDashaTree => {
  const normLagna = ((lagnaSignIndex % 12) + 12) % 12;
  const ninthSign = (normLagna + 8) % 12;
  const isDirectProgression = DIRECT_SIGNS.has(ninthSign);

  const signSequence: number[] = [];
  for (let i = 0; i < 12; i++) {
    signSequence.push(isDirectProgression ? (normLagna + i) % 12 : (normLagna - i + 12) % 12);
  }

  const dtBirth = DateTime.fromISO(birthLocalIso);
  let currentStart = dtBirth;
  const periods: CharaPeriod[] = [];

  for (const signIdx of signSequence) {
    const yrs = computeSignDuration(signIdx, grahas);
    const currentEnd = currentStart.plus({ years: yrs });

    // Sub-periods: 12 signs inside this Mahadasha (each lasting yrs / 12 years)
    const subPeriods: CharaPeriod['subPeriods'] = [];
    const subDays = Math.max(1, Math.round((yrs * 365.25) / 12));
    let subStart = currentStart;
    const isSubDirect = DIRECT_SIGNS.has(signIdx);

    for (let s = 0; s < 12; s++) {
      const subSignIdx = isSubDirect ? (signIdx + 1 + s) % 12 : (signIdx + 11 - s) % 12;
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
