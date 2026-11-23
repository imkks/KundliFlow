import type { VedicGraha } from '../natal/types.js';

export interface VedhaRule {
  favourableHouses: number[];
  vedhaPairs: Record<number, number>; // favourableHouse -> obstructingHouse
}

/**
 * Classical Gochara Vedha table per Dr. K.S. Charak Elements of Vedic Astrology (Ch. XXIX).
 * When a planet transits a favorable house from natal Moon, a planet posited in the
 * corresponding Vedha house obstructs its benefic expression.
 */
export const VEDHA_TABLE: Record<VedicGraha, VedhaRule> = {
  sun: {
    favourableHouses: [3, 6, 10, 11],
    vedhaPairs: { 3: 9, 6: 12, 10: 4, 11: 5 },
  },
  moon: {
    favourableHouses: [1, 3, 6, 7, 10, 11],
    vedhaPairs: { 1: 5, 3: 9, 6: 12, 7: 2, 10: 4, 11: 8 },
  },
  mars: {
    favourableHouses: [3, 6, 11],
    vedhaPairs: { 3: 12, 6: 9, 11: 5 },
  },
  mercury: {
    favourableHouses: [2, 4, 6, 8, 10, 11],
    vedhaPairs: { 2: 5, 4: 3, 6: 9, 8: 1, 10: 8, 11: 12 },
  },
  jupiter: {
    favourableHouses: [2, 5, 7, 9, 11],
    vedhaPairs: { 2: 12, 5: 4, 7: 3, 9: 10, 11: 8 },
  },
  venus: {
    favourableHouses: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    vedhaPairs: { 1: 8, 2: 7, 3: 1, 4: 10, 5: 9, 8: 5, 9: 11, 11: 6, 12: 3 },
  },
  saturn: {
    favourableHouses: [3, 6, 11],
    vedhaPairs: { 3: 12, 6: 9, 11: 5 },
  },
  rahu: {
    favourableHouses: [3, 6, 11],
    vedhaPairs: { 3: 12, 6: 9, 11: 5 },
  },
  ketu: {
    favourableHouses: [3, 6, 11],
    vedhaPairs: { 3: 12, 6: 9, 11: 5 },
  },
};

export interface VedhaCheckResult {
  graha: VedicGraha;
  transitHouseFromMoon: number;
  isFavourableHouse: boolean;
  obstructingHouse: number | null;
  obstructingPlanets: VedicGraha[];
  isObstructed: boolean;
  netStatus: 'favourable_unobstructed' | 'favourable_obstructed' | 'adverse';
  explanation: string;
}

/**
 * Checks whether a given planet's transit from natal Moon is obstructed by Vedha.
 * Accounts for classical father-son exemptions:
 * - Sun and Saturn do not cause Vedha to each other.
 * - Moon and Mercury do not cause Vedha to each other.
 */
export function checkTransitVedha(
  graha: VedicGraha,
  transitHouseFromMoon: number,
  allTransitHousesFromMoon: Record<VedicGraha, number>,
): VedhaCheckResult {
  const rule = VEDHA_TABLE[graha];
  const isFavourable = rule.favourableHouses.includes(transitHouseFromMoon);
  const vedhaHouse = isFavourable ? rule.vedhaPairs[transitHouseFromMoon] ?? null : null;

  const obstructingPlanets: VedicGraha[] = [];

  if (isFavourable && vedhaHouse !== null) {
    for (const [otherGrahaStr, hFromMoon] of Object.entries(allTransitHousesFromMoon)) {
      const otherGraha = otherGrahaStr as VedicGraha;
      if (otherGraha === graha) continue;

      if (hFromMoon === vedhaHouse) {
        // Classical Father-Son exemptions
        const isSunSaturn = (graha === 'sun' && otherGraha === 'saturn') || (graha === 'saturn' && otherGraha === 'sun');
        const isMoonMercury = (graha === 'moon' && otherGraha === 'mercury') || (graha === 'mercury' && otherGraha === 'moon');

        if (!isSunSaturn && !isMoonMercury) {
          obstructingPlanets.push(otherGraha);
        }
      }
    }
  }

  const isObstructed = obstructingPlanets.length > 0;
  const netStatus: VedhaCheckResult['netStatus'] = !isFavourable
    ? 'adverse'
    : isObstructed
    ? 'favourable_obstructed'
    : 'favourable_unobstructed';

  let explanation = '';
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  if (!isFavourable) {
    explanation = `${cap(graha)} transits House ${transitHouseFromMoon} from Moon, which is a naturally challenging transit position.`;
  } else if (isObstructed) {
    explanation = `${cap(graha)} transits benefic House ${transitHouseFromMoon} from Moon, but is obstructed (Vedha) by ${obstructingPlanets.map(cap).join(', ')} in House ${vedhaHouse}.`;
  } else {
    explanation = `${cap(graha)} transits benefic House ${transitHouseFromMoon} from Moon with clean unobstructed flow (Vedha House ${vedhaHouse} is vacant).`;
  }

  return {
    graha,
    transitHouseFromMoon,
    isFavourableHouse: isFavourable,
    obstructingHouse: vedhaHouse,
    obstructingPlanets,
    isObstructed,
    netStatus,
    explanation,
  };
}
