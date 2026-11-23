import type { NatalChart, VedicGraha } from '../natal/types.js';
import { houseFromSign } from '../natal/positions.js';

export interface SudarshanaHouseInfo {
  house: number; // 1 to 12
  lagnaSign: number; // 0 to 11
  chandraSign: number; // 0 to 11
  suryaSign: number; // 0 to 11
  planetsFromLagna: VedicGraha[];
  planetsFromMoon: VedicGraha[];
  planetsFromSun: VedicGraha[];
}

export interface SudarshanaDashaPeriod {
  level: 'MD' | 'AD' | 'PD';
  house: number; // 1 to 12 from Lagna
  durationDescription: string;
  isFavorable: boolean;
  score: number;
  factors: string[];
}

export interface SudarshanaChakraResult {
  rings: {
    innerLagna: number; // sign index 0 to 11
    middleChandra: number;
    outerSurya: number;
  };
  houses: SudarshanaHouseInfo[];
  currentDasha: {
    ageInYears: number;
    mahadashaHouse: number; // 1 to 12
    antardashaHouse: number; // 1 to 12
    pratyantardashaHouse: number; // 1 to 12
    summary: string;
    evaluation: {
      fromLagna: SudarshanaDashaPeriod;
      fromMoon: SudarshanaDashaPeriod;
      fromSun: SudarshanaDashaPeriod;
      netFavorability: 'highly_favorable' | 'favorable' | 'mixed' | 'unfavorable';
    };
  };
}

const BENEFICS = new Set<VedicGraha>(['jupiter', 'venus', 'mercury', 'moon']);
const MALEFICS = new Set<VedicGraha>(['sun', 'mars', 'saturn', 'rahu', 'ketu']);

function evaluateHouseFromReference(
  targetHouse: number,
  refSignIndex: number,
  grahas: NatalChart['grahas'],
): SudarshanaDashaPeriod {
  let score = 0;
  const factors: string[] = [];

  for (const [name, g] of Object.entries(grahas)) {
    const p = name as VedicGraha;
    if (!g) continue;
    const h = houseFromSign(g.signIndex, refSignIndex);
    // Relative house from the active Dasha house
    const relHouse = ((h - targetHouse + 12) % 12) + 1;

    if (BENEFICS.has(p)) {
      if ([1, 4, 5, 7, 8, 9, 10].includes(relHouse)) {
        score += 2;
        factors.push(`Benefic ${p.toUpperCase()} in House ${relHouse} from Dasha Lagna (favorable)`);
      } else if ([2, 12].includes(relHouse)) {
        score -= 1;
        factors.push(`Benefic ${p.toUpperCase()} in House ${relHouse} from Dasha Lagna (hindered)`);
      }
    } else if (MALEFICS.has(p)) {
      if ([3, 6, 11].includes(relHouse)) {
        score += 2;
        factors.push(`Malefic ${p.toUpperCase()} in Upachaya House ${relHouse} from Dasha Lagna (favorable)`);
      } else {
        score -= 2;
        factors.push(`Malefic ${p.toUpperCase()} in House ${relHouse} from Dasha Lagna (challenging)`);
      }
    }
  }

  return {
    level: 'MD',
    house: targetHouse,
    durationDescription: '1 Year',
    isFavorable: score > 0,
    score,
    factors,
  };
}

/**
 * Computes Sudarshana Chakra concentric 3-ring layout and evaluates
 * Sudarshana Chakra Dasha (12-year cycle) per BPHS Ch. 74 & Dr. K.S. Charak.
 */
export function computeSudarshanaChakra(
  natal: NatalChart,
  targetAgeInYears: number,
): SudarshanaChakraResult {
  const lagnaSign = natal.lagna?.signIndex ?? 0;
  const chandraSign = natal.grahas.moon.signIndex;
  const suryaSign = natal.grahas.sun.signIndex;

  const houses: SudarshanaHouseInfo[] = [];

  for (let h = 1; h <= 12; h++) {
    const hLagnaSign = (lagnaSign + h - 1) % 12;
    const hChandraSign = (chandraSign + h - 1) % 12;
    const hSuryaSign = (suryaSign + h - 1) % 12;

    const pLagna: VedicGraha[] = [];
    const pMoon: VedicGraha[] = [];
    const pSun: VedicGraha[] = [];

    for (const [name, g] of Object.entries(natal.grahas)) {
      const p = name as VedicGraha;
      if (!g) continue;
      if (g.signIndex === hLagnaSign) pLagna.push(p);
      if (g.signIndex === hChandraSign) pMoon.push(p);
      if (g.signIndex === hSuryaSign) pSun.push(p);
    }

    houses.push({
      house: h,
      lagnaSign: hLagnaSign,
      chandraSign: hChandraSign,
      suryaSign: hSuryaSign,
      planetsFromLagna: pLagna,
      planetsFromMoon: pMoon,
      planetsFromSun: pSun,
    });
  }

  const completedYears = Math.max(0, Math.floor(targetAgeInYears));
  const mdHouse = (completedYears % 12) + 1;

  const fractionalYear = targetAgeInYears - completedYears;
  const adHouse = ((mdHouse - 1 + Math.floor(fractionalYear * 12)) % 12) + 1;

  const fractionalMonth = (fractionalYear * 12) - Math.floor(fractionalYear * 12);
  const pdHouse = ((adHouse - 1 + Math.floor(fractionalMonth * 12)) % 12) + 1;

  const evalLagna = evaluateHouseFromReference(mdHouse, lagnaSign, natal.grahas);
  const evalMoon = evaluateHouseFromReference(mdHouse, chandraSign, natal.grahas);
  const evalSun = evaluateHouseFromReference(mdHouse, suryaSign, natal.grahas);

  const totalScore = evalLagna.score + evalMoon.score + evalSun.score;
  let netFavorability: SudarshanaChakraResult['currentDasha']['evaluation']['netFavorability'] = 'mixed';
  if (totalScore >= 5) netFavorability = 'highly_favorable';
  else if (totalScore > 0) netFavorability = 'favorable';
  else if (totalScore < -3) netFavorability = 'unfavorable';

  return {
    rings: {
      innerLagna: lagnaSign,
      middleChandra: chandraSign,
      outerSurya: suryaSign,
    },
    houses,
    currentDasha: {
      ageInYears: targetAgeInYears,
      mahadashaHouse: mdHouse,
      antardashaHouse: adHouse,
      pratyantardashaHouse: pdHouse,
      summary: `At age ${targetAgeInYears.toFixed(1)}, Sudarshana Chakra Dasha activates House ${mdHouse} (Antardasha House ${adHouse}).`,
      evaluation: {
        fromLagna: evalLagna,
        fromMoon: evalMoon,
        fromSun: evalSun,
        netFavorability,
      },
    },
  };
}
