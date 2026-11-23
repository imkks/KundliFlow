import { SIGN_LORDS, type NatalChart, type VedicGraha } from '../natal/types.js';
import type { ShadbalaResult } from './index.js';

export interface BhavaBalaDetail {
  house: number;
  sign: string;
  signIndex: number;
  lord: VedicGraha;
  adhipatiBala: number; // Shashtyamshas (lord's Shadbala)
  digBala: number;      // Shashtyamshas (directional potency of the sign)
  drishtiBala: number;  // Shashtyamshas (net benefic vs malefic aspect strength)
  totalShashtyamshas: number;
  totalRupas: number;
  rank: number;
  relativeStrength: 'strong' | 'moderate' | 'weak';
}

export interface BhavaBalaResult {
  bhavas: BhavaBalaDetail[];
  strongestHouse: number;
  weakestHouse: number;
}

/**
 * Calculates Bhava Bala (House Strength) per Dr. K.S. Charak Elements of Vedic Astrology (Ch. XIII).
 * Combines Bhava Adhipati Bala, Bhava Dig Bala, and Bhava Drishti Bala.
 */
export function computeBhavaBala(
  natal: NatalChart,
  shadbala: ShadbalaResult,
): BhavaBalaResult {
  const lagnaSignIndex = natal.lagna?.signIndex ?? 0;
  const details: Omit<BhavaBalaDetail, 'rank' | 'relativeStrength'>[] = [];

  const benefics = new Set<VedicGraha>(['jupiter', 'venus', 'mercury', 'moon']);
  const malefics = new Set<VedicGraha>(['sun', 'mars', 'saturn', 'rahu', 'ketu']);

  for (let h = 1; h <= 12; h++) {
    const signIndex = (lagnaSignIndex + h - 1) % 12;
    const lord = SIGN_LORDS[signIndex]!;
    const lordBala = shadbala.planets[lord as keyof typeof shadbala.planets];
    const adhipatiBala = lordBala ? lordBala.totalShadbala : 350;

    // 1. Bhava Dig Bala
    // Peak houses: Biped signs -> H1; Water signs -> H4; Insect signs -> H7; Quadruped signs -> H10
    let peakHouse = 1;
    if ([3, 11].includes(signIndex)) {
      peakHouse = 4; // Water: Cancer, Pisces
    } else if (signIndex === 7) {
      peakHouse = 7; // Insect: Scorpio
    } else if ([0, 1, 4].includes(signIndex)) {
      peakHouse = 10; // Quadruped: Aries, Taurus, Leo
    } else {
      peakHouse = 1; // Biped: Gemini, Virgo, Libra, Sagittarius, Capricorn, Aquarius
    }

    const houseDiff = Math.abs(h - peakHouse);
    const angDist = Math.min(houseDiff, 12 - houseDiff);
    // 60 Shashtyamshas at peak, scaling down to 0 at opposite (6 houses away)
    const digBala = Math.max(0, Math.round(60 * (1 - angDist / 6)));

    // 2. Bhava Drishti Bala (Aspects on Bhava Center)
    let drishtiBala = 0;
    for (const [pName, pDetail] of Object.entries(natal.grahas)) {
      const g = pName as VedicGraha;
      const hFromPlanet = ((signIndex - pDetail.signIndex + 12) % 12) + 1;

      let aspectPower = 0;
      if (hFromPlanet === 7) aspectPower = 60; // 7th direct aspect
      else if (g === 'mars' && (hFromPlanet === 4 || hFromPlanet === 8)) aspectPower = 45;
      else if (g === 'jupiter' && (hFromPlanet === 5 || hFromPlanet === 9)) aspectPower = 45;
      else if (g === 'saturn' && (hFromPlanet === 3 || hFromPlanet === 10)) aspectPower = 45;

      if (aspectPower > 0) {
        if (benefics.has(g)) drishtiBala += aspectPower * 0.5;
        if (malefics.has(g)) drishtiBala -= aspectPower * 0.35;
      }
    }
    drishtiBala = Math.round(drishtiBala);

    const totalShashtyamshas = adhipatiBala + digBala + drishtiBala;
    const totalRupas = Number((totalShashtyamshas / 60).toFixed(2));

    const signNames = [
      'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
      'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
    ];

    details.push({
      house: h,
      sign: signNames[signIndex]!,
      signIndex,
      lord,
      adhipatiBala,
      digBala,
      drishtiBala,
      totalShashtyamshas,
      totalRupas,
    });
  }

  // Sort and assign ranks
  const sorted = [...details].sort((a, b) => b.totalShashtyamshas - a.totalShashtyamshas);
  const rankMap = new Map<number, number>();
  sorted.forEach((d, i) => rankMap.set(d.house, i + 1));

  const bhavas: BhavaBalaDetail[] = details.map((d) => {
    const rank = rankMap.get(d.house) ?? 6;
    const relativeStrength: BhavaBalaDetail['relativeStrength'] =
      rank <= 4 ? 'strong' : rank <= 8 ? 'moderate' : 'weak';
    return {
      ...d,
      rank,
      relativeStrength,
    };
  });

  return {
    bhavas,
    strongestHouse: sorted[0]!.house,
    weakestHouse: sorted[sorted.length - 1]!.house,
  };
}
