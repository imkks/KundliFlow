import {
  calculateVargaSign,
  houseFromSign,
  type NatalChart,
  type TransitOverview,
} from '@astro/engine';
import { NATURAL_BENEFICS, PLANET_IDS, SIGN_IDS, SIGN_LORDS, type PlanetId } from '@astro/facts';

// ============================================================================
// 1. SARVATOBHADRA CHAKRA (SBC 9x9 Grid — 28 Nakshatras incl. Abhijit, PVR Ch. 26.8)
// ============================================================================

export const SBC_28_NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu',
  'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra',
  'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Moola', 'Purva Ashadha', 'Uttara Ashadha',
  'Abhijit', 'Shravana', 'Dhanishtha', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
] as const;

export type TithiGroup = 'Nanda' | 'Bhadra' | 'Jaya' | 'Rikta' | 'Poorna';

// Exact 9x9 grid coordinates for the 28 outer-border Nakshatras (PVR Fig. 3)
const SBC_NAK_COORDS: Record<number, [number, number]> = {
  // North edge (row 0, cols 1..7): Krittika(2)..Ashlesha(8)
  2: [0, 1], 3: [0, 2], 4: [0, 3], 5: [0, 4], 6: [0, 5], 7: [0, 6], 8: [0, 7],
  // East edge (col 8, rows 1..7): Magha(9)..Vishakha(15)
  9: [1, 8], 10: [2, 8], 11: [3, 8], 12: [4, 8], 13: [5, 8], 14: [6, 8], 15: [7, 8],
  // South edge (row 8, cols 7..1): Anuradha(16)..Shravana(22)
  16: [8, 7], 17: [8, 6], 18: [8, 5], 19: [8, 4], 20: [8, 3], 21: [8, 2], 22: [8, 1],
  // West edge (col 0, rows 7..1): Dhanishtha(23)..Bharani(1)
  23: [7, 0], 24: [6, 0], 25: [5, 0], 26: [4, 0], 27: [3, 0], 0: [2, 0], 1: [1, 0],
};

// Center 5 Tithi group squares (PVR Fig. 3)
const SBC_TITHI_COORDS: Record<TithiGroup, [number, number]> = {
  Nanda: [3, 4],
  Bhadra: [4, 5],
  Jaya: [5, 4],
  Rikta: [4, 3],
  Poorna: [4, 4],
};

// Inner Rasi ring coordinates (PVR Fig. 3: 0=Ar .. 11=Pi)
const SBC_RASI_COORDS: Record<number, [number, number]> = {
  0: [2, 3], 1: [2, 4], 2: [2, 5],
  3: [3, 6], 4: [4, 6], 5: [5, 6],
  6: [6, 5], 7: [6, 4], 8: [6, 3],
  9: [5, 2], 10: [4, 2], 11: [3, 2],
};

/**
 * Maps a sidereal longitude (0..360°) to its 28-Nakshatra SBC index (0..27, with Abhijit = 21).
 */
export function getSbc28NakshatraIndex(lon: number): number {
  const norm = ((lon % 360) + 360) % 360;
  // Abhijit spans last pada of Uttara Ashadha (276°40' to 280°53'20" ~ 276.6667..280.8889)
  if (norm >= 276 + 40 / 60 && norm < 280 + 53 / 60 + 20 / 3600) {
    return 21; // Abhijit
  }
  const idx27 = Math.floor(norm / (360 / 27));
  return idx27 <= 20 ? idx27 : idx27 + 1;
}

/**
 * Computes Special Tithi group (Nanda/Bhadra/Jaya/Rikta/Poorna) for any house multiplier h
 * (h=1 Janma, h=2 Dhana, h=7 Vivaha, h=10 Karma — PVR Ch. 26.8).
 */
export function computeSpecialTithi(sunLon: number, moonLon: number, houseMultiplier: number): {
  tithiNumber: number;
  group: TithiGroup;
} {
  const diff = (((moonLon - sunLon) % 360) + 360) % 360;
  const scaled = (diff * houseMultiplier) % 360;
  const tithiNumber = Math.floor(scaled / 12) + 1; // 1..30
  const mod5 = ((tithiNumber - 1) % 5);
  const groups: TithiGroup[] = ['Nanda', 'Bhadra', 'Jaya', 'Rikta', 'Poorna'];
  return { tithiNumber, group: groups[mod5]! };
}

/**
 * Traces the 3 SBC Vedha lines (1 straight orthogonal + 2 diagonals) from a border Nakshatra cell.
 */
function traceSbcVedhaCells(nak28Idx: number): Set<string> {
  const start = SBC_NAK_COORDS[nak28Idx];
  if (!start) return new Set();
  const [r0, c0] = start;
  const visited = new Set<string>();

  // Determine inward orthogonal + 2 diagonal directions based on border edge
  const dirs: Array<[number, number]> =
    r0 === 0
      ? [[1, 0], [1, -1], [1, 1]] // North edge -> South, SW, SE
      : r0 === 8
      ? [[-1, 0], [-1, -1], [-1, 1]] // South edge -> North, NW, NE
      : c0 === 0
      ? [[0, 1], [-1, 1], [1, 1]] // West edge -> East, NE, SE
      : [[0, -1], [-1, -1], [1, -1]]; // East edge -> West, NW, SW

  for (const [dr, dc] of dirs) {
    let r = r0 + dr;
    let c = c0 + dc;
    while (r >= 0 && r <= 8 && c >= 0 && c <= 8) {
      visited.add(`${r},${c}`);
      r += dr;
      c += dc;
    }
  }
  return visited;
}

export interface SbcVedhaHit {
  planet: PlanetId;
  nature: 'benefic' | 'malefic';
  transitNakshatra: string;
  hits: string[];
}

export interface MurthiEntry {
  planet: PlanetId;
  houseFromNatalMoon: number;
  murthi: 'Swarna (Gold)' | 'Rajata (Silver)' | 'Taamra (Copper)' | 'Loha (Iron)';
  quality: 'highly_favorable' | 'favorable' | 'unfavorable' | 'highly_unfavorable';
}

export interface SbcAndMurthiReport {
  specialTithis: {
    janma: { tithiNumber: number; group: TithiGroup };
    dhana: { tithiNumber: number; group: TithiGroup };
    vivaha: { tithiNumber: number; group: TithiGroup };
    karma: { tithiNumber: number; group: TithiGroup };
  };
  vedhaHits: SbcVedhaHit[];
  murthis: MurthiEntry[];
  netSummary: string;
}

/**
 * Evaluates Sarvatobhadra Chakra 3-line Vedha on natal Janma/Karma/Abhisheka/Manasa stars,
 * Lagna/Moon Rasis, and Special Tithis, plus Transit Murthis (PVR Ch. 26.2 & 26.8).
 */
export function computeSbcAndMurthis(
  natal: NatalChart,
  transits?: TransitOverview | null,
): SbcAndMurthiReport {
  const sunLon = natal.grahas.sun.lon;
  const moonLon = natal.grahas.moon.lon;
  const specialTithis = {
    janma: computeSpecialTithi(sunLon, moonLon, 1),
    dhana: computeSpecialTithi(sunLon, moonLon, 2),
    vivaha: computeSpecialTithi(sunLon, moonLon, 7),
    karma: computeSpecialTithi(sunLon, moonLon, 10),
  };

  // Key natal target cells on the 9x9 SBC grid
  const janma28 = getSbc28NakshatraIndex(moonLon);
  const karma28 = (janma28 + 9) % 28;
  const abhisheka28 = (janma28 + 12) % 28;
  const manasa28 = (janma28 + 24) % 28;
  const lagnaSignIdx = natal.lagna?.signIndex ?? 0;
  const moonSignIdx = natal.grahas.moon.signIndex;

  const targetPoints: Array<{ label: string; coord: [number, number] }> = [
    { label: `Janma Star (${SBC_28_NAKSHATRAS[janma28]})`, coord: SBC_NAK_COORDS[janma28]! },
    { label: `Karma Star (${SBC_28_NAKSHATRAS[karma28]})`, coord: SBC_NAK_COORDS[karma28]! },
    { label: `Abhisheka Star (${SBC_28_NAKSHATRAS[abhisheka28]})`, coord: SBC_NAK_COORDS[abhisheka28]! },
    { label: `Manasa Star (${SBC_28_NAKSHATRAS[manasa28]})`, coord: SBC_NAK_COORDS[manasa28]! },
    { label: `Lagna Rasi (${SIGN_IDS[lagnaSignIdx]})`, coord: SBC_RASI_COORDS[lagnaSignIdx]! },
    { label: `Moon Rasi (${SIGN_IDS[moonSignIdx]})`, coord: SBC_RASI_COORDS[moonSignIdx]! },
    { label: `Janma Tithi (${specialTithis.janma.group})`, coord: SBC_TITHI_COORDS[specialTithis.janma.group] },
    { label: `Karma Tithi (${specialTithis.karma.group})`, coord: SBC_TITHI_COORDS[specialTithis.karma.group] },
    { label: `Dhana Tithi (${specialTithis.dhana.group})`, coord: SBC_TITHI_COORDS[specialTithis.dhana.group] },
  ];

  const vedhaHits: SbcVedhaHit[] = [];
  const murthis: MurthiEntry[] = [];
  let beneficHits = 0;
  let maleficHits = 0;

  if (transits) {
    // Transit Moon house from Natal Moon gives the active Murthi quality
    const trMoonHouseFromNatalMoon = transits.transits.moon?.houseFromMoon ?? 1;
    const murthiFromHouse = (h: number): Pick<MurthiEntry, 'murthi' | 'quality'> => {
      if ([1, 6, 11].includes(h)) return { murthi: 'Swarna (Gold)', quality: 'highly_favorable' };
      if ([2, 5, 9].includes(h)) return { murthi: 'Rajata (Silver)', quality: 'favorable' };
      if ([3, 7, 10].includes(h)) return { murthi: 'Taamra (Copper)', quality: 'unfavorable' };
      return { murthi: 'Loha (Iron)', quality: 'highly_unfavorable' };
    };

    for (const p of PLANET_IDS) {
      const t = transits.transits[p];
      if (!t) continue;
      const lon = t.lon ?? t.signIndex * 30 + 15;
      const t28 = getSbc28NakshatraIndex(lon);
      const rayCells = traceSbcVedhaCells(t28);
      const matched = targetPoints
        .filter((tp) => rayCells.has(`${tp.coord[0]},${tp.coord[1]}`))
        .map((tp) => tp.label);

      const isBenefic = (NATURAL_BENEFICS as readonly string[]).includes(p);
      if (matched.length > 0) {
        if (isBenefic) beneficHits += matched.length;
        else maleficHits += matched.length;
        vedhaHits.push({
          planet: p,
          nature: isBenefic ? 'benefic' : 'malefic',
          transitNakshatra: SBC_28_NAKSHATRAS[t28]!,
          hits: matched,
        });
      }

      if (['jupiter', 'saturn', 'rahu', 'ketu', 'mars'].includes(p)) {
        const mInfo = murthiFromHouse(trMoonHouseFromNatalMoon);
        murthis.push({
          planet: p,
          houseFromNatalMoon: trMoonHouseFromNatalMoon,
          ...mInfo,
        });
      }
    }
  }

  const netSummary =
    vedhaHits.length === 0
      ? 'No direct SBC Vedha hits on core natal stars/tithis right now.'
      : `SBC Vedha Balance: ${beneficHits} benefic hit(s) vs ${maleficHits} malefic hit(s) across natal stars, Rasis & Special Tithis.`;

  return { specialTithis, vedhaHits, murthis, netSummary };
}

// ============================================================================
// 2. FAMILY MEMBER VARGA DERIVATION (PVR Ch. 13.4.2 / R-05)
// ============================================================================

export interface FamilyMemberIndicator {
  id: string;
  member: string;
  varga: 'D12' | 'D3' | 'D7' | 'D9';
  houseInVarga: number;
  houseSign: string;
  significatorLord: PlanetId;
  lordSignInVarga: string;
  lordHouseInVarga: number;
  summary: string;
}

/**
 * Derives specific family member Lagnas/lords across Vargas per PVR Ch. 13.4.2:
 * - D12: Father (9th lord), Mother (4th lord)
 * - D3: Younger siblings (3rd, 5th) & Elder siblings (11th, 9th) — odd forward / even backward
 * - D7: Children (5th, 7th, 9th) — odd forward / even backward
 * - D9: Spouse (7th lord)
 */
export function computeFamilyMemberVargas(natal: NatalChart): FamilyMemberIndicator[] {
  const buildVarga = (varga: 'D12' | 'D3' | 'D7' | 'D9') => {
    const lagnaSign = natal.lagna ? calculateVargaSign(natal.lagna.lon, varga) : 0;
    const planetSign = {} as Record<PlanetId, number>;
    for (const p of PLANET_IDS) {
      planetSign[p] = calculateVargaSign(natal.grahas[p].lon, varga);
    }
    return { lagnaSign, planetSign };
  };

  const makeEntry = (
    id: string,
    member: string,
    varga: 'D12' | 'D3' | 'D7' | 'D9',
    vData: { lagnaSign: number; planetSign: Record<PlanetId, number> },
    houseOffset: number,
    reverseIfEven: boolean,
  ): FamilyMemberIndicator => {
    const isOddLagna = vData.lagnaSign % 2 === 0; // 0=Ar(odd), 1=Ta(even)
    const dir = reverseIfEven && !isOddLagna ? -1 : 1;
    const targetSign = (((vData.lagnaSign + (houseOffset - 1) * dir) % 12) + 12) % 12;
    const lord = SIGN_LORDS[targetSign]!;
    const lordSignIdx = vData.planetSign[lord];
    const lordHouse = houseFromSign(lordSignIdx, vData.lagnaSign);
    const actualHouse = houseFromSign(targetSign, vData.lagnaSign);

    return {
      id: `family.${id}`,
      member,
      varga,
      houseInVarga: actualHouse,
      houseSign: SIGN_IDS[targetSign]!,
      significatorLord: lord,
      lordSignInVarga: SIGN_IDS[lordSignIdx]!,
      lordHouseInVarga: lordHouse,
      summary: `${member} (${varga}, ${reverseIfEven ? (isOddLagna ? 'odd-forward' : 'even-backward') : 'zodiacal'}): H${actualHouse} (${SIGN_IDS[targetSign]}) -> lord ${lord} in ${SIGN_IDS[lordSignIdx]} (H${lordHouse} in ${varga}).`,
    };
  };

  const d12 = buildVarga('D12');
  const d3 = buildVarga('D3');
  const d7 = buildVarga('D7');
  const d9 = buildVarga('D9');

  return [
    makeEntry('father', 'Father', 'D12', d12, 9, false),
    makeEntry('mother', 'Mother', 'D12', d12, 4, false),
    makeEntry('elder_sibling_1', '1st Elder Sibling', 'D3', d3, 11, true),
    makeEntry('younger_sibling_1', '1st Younger Sibling', 'D3', d3, 3, true),
    makeEntry('child_1', '1st Child', 'D7', d7, 5, true),
    makeEntry('child_2', '2nd Child', 'D7', d7, 7, true),
    makeEntry('spouse', 'Spouse', 'D9', d9, 7, false),
  ];
}
