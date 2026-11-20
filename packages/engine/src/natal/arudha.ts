import { SIGNS } from '../angles.js';
import type { NatalChart } from './types.js';
import { houseFromSign } from './positions.js';

export interface ArudhaPadaItem {
  code: string; // AL, A2..A11, UL (A12)
  house: number; // 1..12
  name: string;
  lord: string;
  signIndex: number;
  sign: string;
  houseFromLagna: number;
  exceptionApplied: boolean;
}

const SIGN_PRIMARY_LORDS = [
  'mars', 'venus', 'mercury', 'moon', 'sun', 'mercury',
  'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter',
];

const PADA_NAMES: Record<number, string> = {
  1: 'Arudha Lagna (AL — Public Image)',
  2: 'Dhana Pada (A2 — Resources)',
  3: 'Vikrama Pada (A3 — Courage/Siblings)',
  4: 'Matri/Sukha Pada (A4 — Home/Vehicles)',
  5: 'Mantra Pada (A5 — Intellect/Children)',
  6: 'Roga/Shatru Pada (A6 — Obstacles/Service)',
  7: 'Dara Pada (A7 — Partnerships)',
  8: 'Mrityu Pada (A8 — Transformation)',
  9: 'Bhagya Pada (A9 — Fortune/Dharma)',
  10: 'Karma/Rajya Pada (A10 — Career/Status)',
  11: 'Labha Pada (A11 — Gains/Networks)',
  12: 'Upapada Lagna (UL — Marriage/Spouse)',
};

/**
 * Computes all 12 Jaimini Arudha Padas (AL, A2..A11, UL) with the classical 1st/7th exception.
 */
export function computeArudhaPadas(chart: NatalChart): ArudhaPadaItem[] {
  const lagnaSignIndex = chart.lagna?.signIndex ?? 0;
  const results: ArudhaPadaItem[] = [];

  for (let h = 1; h <= 12; h++) {
    const houseSignIdx = (lagnaSignIndex + h - 1) % 12;
    const lord = SIGN_PRIMARY_LORDS[houseSignIdx]!;
    const lordDetail = chart.grahas[lord as keyof typeof chart.grahas];
    const lordSignIdx = lordDetail?.signIndex ?? houseSignIdx;

    // Distance from house sign to lord sign (0..11)
    const dist = (lordSignIdx - houseSignIdx + 12) % 12;
    let padaSignIdx = (lordSignIdx + dist) % 12;
    let exceptionApplied = false;

    // Classical Jaimini exception: Arudha cannot fall in the 1st (dist 0) or 7th (dist 6) from the house
    const relFromHouse = (padaSignIdx - houseSignIdx + 12) % 12;
    if (relFromHouse === 0 || relFromHouse === 6) {
      padaSignIdx = (padaSignIdx + 9) % 12; // 10th sign from the computed pada (10th/4th from house)
      exceptionApplied = true;
    }

    results.push({
      code: h === 1 ? 'AL' : h === 12 ? 'UL' : `A${h}`,
      house: h,
      name: PADA_NAMES[h]!,
      lord,
      signIndex: padaSignIdx,
      sign: SIGNS[padaSignIdx]!,
      houseFromLagna: houseFromSign(padaSignIdx, lagnaSignIndex),
      exceptionApplied,
    });
  }

  return results;
}
