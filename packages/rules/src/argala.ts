import { NATURAL_BENEFICS, NATURAL_MALEFICS, type ChartWorkspace, type Fact } from '@astro/facts';

export interface ArgalaIntervention {
  argalaHouse: number;
  relativePosition: '2nd' | '4th' | '11th' | '5th' | '3rd_special';
  planets: string[];
  hasBenefics: boolean;
  hasMalefics: boolean;
  obstructingHouse: number;
  obstructingPlanets: string[];
  isObstructed: boolean;
  explanation: string;
}

export interface HouseArgalaSummary {
  house: number;
  interventions: ArgalaIntervention[];
  hasBeneficArgala: boolean;
  hasMaleficArgala: boolean;
  summaryNote: string;
}

/**
 * Computes Parashari Argala (decisive intervention) & Virodhargala (obstruction)
 * for a specific house per PVR Narasimha Rao (Ch. 10.3) & Dr. K.S. Charak (Ch. XIX).
 */
export function computeHouseArgala(ws: ChartWorkspace, house: number): HouseArgalaSummary {
  // Check if Ketu occupies the target house (reverses counting direction)
  const ketuPlacement = ws.getFact('placement.ketu');
  const ketuInTarget = ketuPlacement && Number(ketuPlacement.args.house) === house;
  const direction = ketuInTarget ? -1 : 1;

  // Find all planets in each house (1..12)
  const houseOccupants: Record<number, string[]> = {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [],
    7: [], 8: [], 9: [], 10: [], 11: [], 12: [],
  };

  for (const f of ws.factSet.facts) {
    if (f.type === 'placement' && typeof f.args.house === 'number') {
      const h = f.args.house;
      const planet = String(f.args.planet || f.subject);
      if (houseOccupants[h] && !houseOccupants[h].includes(planet)) {
        houseOccupants[h].push(planet);
      }
    }
  }

  const offsetToHouse = (offset: number): number => {
    // offset is 1-indexed relative distance (e.g. 2, 4, 11, 5)
    const raw = house + (offset - 1) * direction;
    const normalized = ((raw - 1) % 12 + 12) % 12 + 1;
    return normalized;
  };

  const interventions: ArgalaIntervention[] = [];

  // Pair definitions: [ArgalaOffset, VirodhargalaOffset, Label]
  const pairs: Array<[number, number, '2nd' | '4th' | '11th' | '5th']> = [
    [2, 12, '2nd'],   // 2nd (resources/sustenance) <-> 12th
    [4, 10, '4th'],   // 4th (emotional drive/comfort) <-> 10th
    [11, 3, '11th'],  // 11th (gains/allies) <-> 3rd
    [5, 9, '5th'],    // 5th (intellect/past credit) <-> 9th (secondary)
  ];

  for (const [argOffset, obsOffset, label] of pairs) {
    const aHouse = offsetToHouse(argOffset);
    const oHouse = offsetToHouse(obsOffset);

    const aPlanets = houseOccupants[aHouse] ?? [];
    const oPlanets = houseOccupants[oHouse] ?? [];

    if (aPlanets.length === 0) continue;

    // Dominance rule: Argala is obstructed if obstructing house has >= planets
    const isObstructed = oPlanets.length >= aPlanets.length;

    const hasBenefics = aPlanets.some((p) => NATURAL_BENEFICS.includes(p as any));
    const hasMalefics = aPlanets.some((p) => NATURAL_MALEFICS.includes(p as any));

    let natureText = hasBenefics && !hasMalefics ? 'Subha (benefic)' : hasMalefics && !hasBenefics ? 'Paapa (challenging)' : 'Mixed';
    let explanation = `${natureText} Argala from ${aPlanets.join(', ').toUpperCase()} in H${aHouse} (${label} from H${house})`;

    if (isObstructed) {
      explanation += ` is obstructed by ${oPlanets.join(', ').toUpperCase()} in H${oHouse}.`;
    } else {
      explanation += ` operates unobstructed, decisively influencing this house.`;
    }

    interventions.push({
      argalaHouse: aHouse,
      relativePosition: label,
      planets: aPlanets,
      hasBenefics,
      hasMalefics,
      obstructingHouse: oHouse,
      obstructingPlanets: oPlanets,
      isObstructed,
      explanation,
    });
  }

  // Classical 3rd-house Malefics Exception:
  // If multiple natural malefics sit in the 3rd house from target, they cast an Argala of initiative/courage rather than obstruction
  const h3 = offsetToHouse(3);
  const p3 = houseOccupants[h3] ?? [];
  const maleficsIn3 = p3.filter((p) => NATURAL_MALEFICS.includes(p as any));
  if (maleficsIn3.length >= 2) {
    const h11 = offsetToHouse(11);
    const obsPlanets = houseOccupants[h11] ?? [];
    const isObstructed = obsPlanets.length >= maleficsIn3.length;
    interventions.push({
      argalaHouse: h3,
      relativePosition: '3rd_special',
      planets: maleficsIn3,
      hasBenefics: false,
      hasMalefics: true,
      obstructingHouse: h11,
      obstructingPlanets: obsPlanets,
      isObstructed,
      explanation: `Special 3rd-house Malefic Argala: Multiple malefics (${maleficsIn3.join(', ').toUpperCase()}) in H${h3} confer bold initiative and tenacity to House ${house}.`,
    });
  }

  const unobstructed = interventions.filter((i) => !i.isObstructed);
  const hasBeneficArgala = unobstructed.some((i) => i.hasBenefics && !i.hasMalefics);
  const hasMaleficArgala = unobstructed.some((i) => i.hasMalefics && !i.hasBenefics);

  let summaryNote = '';
  if (unobstructed.length > 0) {
    const top = unobstructed[0]!;
    summaryNote = top.explanation;
  } else if (interventions.length > 0) {
    summaryNote = interventions[0]!.explanation;
  } else {
    summaryNote = `No direct planetary Argala intervening on House ${house}; operates primarily through its own lord and occupants.`;
  }

  return {
    house,
    interventions,
    hasBeneficArgala,
    hasMaleficArgala,
    summaryNote,
  };
}

/**
 * Computes Argala summaries for all 12 houses.
 */
export function computeAllHouseArgalas(ws: ChartWorkspace): Record<number, HouseArgalaSummary> {
  const result: Record<number, HouseArgalaSummary> = {};
  for (let h = 1; h <= 12; h++) {
    result[h] = computeHouseArgala(ws, h);
  }
  return result;
}
