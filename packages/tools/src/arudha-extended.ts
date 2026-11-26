import type { NatalChart, VargaType } from '@astro/engine';
import { PLANET_IDS, SIGN_IDS, SIGN_LORDS, type PlanetId } from '@astro/facts';
import {
  buildChartSignState,
  resolveStrongerCoLord,
  resolveStrongerRasi,
  type ChartSignState,
} from './rasi-dashas-and-longevity.js';

const NATURAL_BENEFICS = new Set<PlanetId>(['jupiter', 'venus', 'mercury', 'moon']);
const NATURAL_MALEFICS = new Set<PlanetId>(['saturn', 'mars', 'rahu', 'ketu', 'sun']);

const GRAHA_OWN_SIGNS: Record<PlanetId, number[]> = {
  sun: [4],        // Leo
  moon: [3],       // Cancer
  mars: [0, 7],    // Aries, Scorpio
  mercury: [2, 5], // Gemini, Virgo
  jupiter: [8, 11],// Sagittarius, Pisces
  venus: [1, 6],   // Taurus, Libra
  saturn: [9, 10], // Capricorn, Aquarius
  rahu: [10],      // Aquarius (co-lord)
  ketu: [7],       // Scorpio (co-lord)
};

const BHAVA_ARUDHA_LABELS: Record<number, { code: string; name: string }> = {
  1: { code: 'AL', name: 'Arudha Lagna (Public Image & Maya)' },
  2: { code: 'A2', name: 'Dhana Pada (Visible Resources & Family)' },
  3: { code: 'A3', name: 'Vikrama Pada (Courage, Arms & Initiative)' },
  4: { code: 'A4', name: 'Matri/Vahana Pada (Property, Home & Comforts)' },
  5: { code: 'A5', name: 'Mantra Pada (Recognition, Following & Scholarship)' },
  6: { code: 'A6', name: 'Roga/Shatru Pada (Litigation, Illness & Competition)' },
  7: { code: 'A7', name: 'Dara Pada (Partnerships & Business Associates)' },
  8: { code: 'A8', name: 'Mrityu Pada (Sudden Shocks, Debt & Research)' },
  9: { code: 'A9', name: 'Bhagya Pada (Mentors, Fortune & Pilgrimage)' },
  10: { code: 'A10', name: 'Karma/Rajya Pada (Workplace & Professional Footprint)' },
  11: { code: 'A11', name: 'Labha Pada (Tangible Gains & Networks)' },
  12: { code: 'UL', name: 'Upapada Lagna (Marriage Manifestation & Spouse)' },
};

const GRAHA_PERCEPTION_DOMAINS: Record<PlanetId, string> = {
  sun: 'Subjective sense of authority, ego, father & vitality',
  moon: 'Subjective emotional peace, mother & mental nourishment',
  mars: 'Subjective drive, courage, siblings & conflict',
  mercury: 'Subjective intellect, learning, speech & commerce',
  jupiter: 'Subjective wisdom, luck, children & mentors',
  venus: 'Subjective love, luxury, spouse & creative pleasure',
  saturn: 'Subjective duty, endurance, delays & discipline',
  rahu: 'Subjective ambition, obsession & unconventional breakthroughs',
  ketu: 'Subjective detachment, intuition & past-life roots',
};

export interface VargaBhavaArudhaItem {
  house: number;
  code: string;
  name: string;
  houseSignIndex: number;
  houseSign: string;
  lord: PlanetId;
  lordSignIndex: number;
  lordSign: string;
  arudhaSignIndex: number;
  arudhaSign: string;
  houseFromVargaLagna: number;
  exceptionApplied: boolean;
  occupants: PlanetId[];
}

export interface GrahaArudhaItem {
  planet: PlanetId;
  planetSignIndex: number;
  planetSign: string;
  chosenOwnSignIndex: number;
  chosenOwnSign: string;
  arudhaSignIndex: number;
  arudhaSign: string;
  houseFromVargaLagna: number;
  exceptionApplied: boolean;
  perceptionDomain: string;
}

export interface VargaArudhaReport {
  varga: VargaType;
  vargaLagnaSign: string;
  bhavaArudhas: VargaBhavaArudhaItem[];
  grahaArudhas?: GrahaArudhaItem[];
  alAnalysis: {
    alSign: string;
    alHouseFromLagna: number;
    gainsFromAL11: { sign: string; occupants: PlanetId[] };
    lossFromAL12: { sign: string; occupants: PlanetId[] };
    thirdAndSixthFromAL: {
      thirdSign: string;
      thirdOccupants: PlanetId[];
      sixthSign: string;
      sixthOccupants: PlanetId[];
      materialRiseSignal: string;
    };
    seventhFromAL: { sign: string; occupants: PlanetId[] };
  };
  ulAnalysis: {
    ulSign: string;
    ulHouseFromLagna: number;
    sustenance2ndFromUL: { sign: string; lord: PlanetId; occupants: PlanetId[] };
    opposition7thFromUL: { sign: string; occupants: PlanetId[] };
    longevity8thFromUL: { sign: string; lord: PlanetId; occupants: PlanetId[] };
    alUlRelationHouse: number;
    alUlNote: string;
  };
}

function occupantsIn(state: ChartSignState, signIdx: number): PlanetId[] {
  return PLANET_IDS.filter((p) => state.planetSigns[p] === signIdx);
}

/**
 * Computes all 12 Bhava Arudhas (AL, A2..A11, UL) from any ChartSignState
 * using PVR Ch. 9.3 rules: dual-lordship via 15.5.1 stronger co-lord, and
 * 1st/7th exception shifting to 10th from raw pada (i.e. 10th or 4th from house).
 */
export function computeBhavaArudhasFromState(state: ChartSignState): VargaBhavaArudhaItem[] {
  const results: VargaBhavaArudhaItem[] = [];

  for (let h = 1; h <= 12; h++) {
    const houseSignIndex = (state.lagnaSignIndex + h - 1) % 12;
    const lord = resolveStrongerCoLord(state, houseSignIndex, false);
    const lordSignIndex = state.planetSigns[lord];

    const dist = ((lordSignIndex - houseSignIndex + 12) % 12) + 1;
    let arudhaSignIndex = (lordSignIndex + dist - 1) % 12;
    let exceptionApplied = false;

    if (arudhaSignIndex === houseSignIndex || arudhaSignIndex === (houseSignIndex + 6) % 12) {
      arudhaSignIndex = (arudhaSignIndex + 9) % 12;
      exceptionApplied = true;
    }

    const meta = BHAVA_ARUDHA_LABELS[h]!;
    results.push({
      house: h,
      code: meta.code,
      name: meta.name,
      houseSignIndex,
      houseSign: SIGN_IDS[houseSignIndex]!,
      lord,
      lordSignIndex,
      lordSign: SIGN_IDS[lordSignIndex]!,
      arudhaSignIndex,
      arudhaSign: SIGN_IDS[arudhaSignIndex]!,
      houseFromVargaLagna: ((arudhaSignIndex - state.lagnaSignIndex + 12) % 12) + 1,
      exceptionApplied,
      occupants: occupantsIn(state, arudhaSignIndex),
    });
  }

  return results;
}

/**
 * Computes all 9 Graha Arudhas (Sun..Ketu) from any ChartSignState per PVR Ch. 9.4:
 * - Dual-sign planets pick stronger own sign via 15.5.2 tie-breaker.
 * - Rahu uses Aquarius (10), Ketu uses Scorpio (7) -> Rahu and Ketu always share one Graha Arudha.
 * - Count zodiacally from planet sign to own sign, repeat same count; 1st/7th exception shifts to 10th.
 */
export function computeGrahaArudhasFromState(state: ChartSignState): GrahaArudhaItem[] {
  const results: GrahaArudhaItem[] = [];

  for (const planet of PLANET_IDS) {
    const planetSignIndex = state.planetSigns[planet];
    const ownSigns = GRAHA_OWN_SIGNS[planet];
    const chosenOwnSignIndex =
      ownSigns.length === 1
        ? ownSigns[0]!
        : resolveStrongerRasi(state, ownSigns[0]!, ownSigns[1]!);

    const dist = ((chosenOwnSignIndex - planetSignIndex + 12) % 12) + 1;
    let arudhaSignIndex = (chosenOwnSignIndex + dist - 1) % 12;
    let exceptionApplied = false;

    if (arudhaSignIndex === planetSignIndex || arudhaSignIndex === (planetSignIndex + 6) % 12) {
      arudhaSignIndex = (arudhaSignIndex + 9) % 12;
      exceptionApplied = true;
    }

    results.push({
      planet,
      planetSignIndex,
      planetSign: SIGN_IDS[planetSignIndex]!,
      chosenOwnSignIndex,
      chosenOwnSign: SIGN_IDS[chosenOwnSignIndex]!,
      arudhaSignIndex,
      arudhaSign: SIGN_IDS[arudhaSignIndex]!,
      houseFromVargaLagna: ((arudhaSignIndex - state.lagnaSignIndex + 12) % 12) + 1,
      exceptionApplied,
      perceptionDomain: GRAHA_PERCEPTION_DOMAINS[planet],
    });
  }

  return results;
}

/**
 * Full Varga Arudha & Graha Arudha report for any divisional chart (D1, D9, D10, D16, D24, etc.).
 */
export function computeVargaArudhaReport(
  natal: NatalChart,
  varga: VargaType = 'D1',
  includeGrahaArudhas: boolean = true,
): VargaArudhaReport {
  const state = buildChartSignState(natal, varga);
  const bhavaArudhas = computeBhavaArudhasFromState(state);
  const grahaArudhas = includeGrahaArudhas ? computeGrahaArudhasFromState(state) : undefined;

  const al = bhavaArudhas[0]!;
  const ul = bhavaArudhas[11]!;

  const sign11FromAL = (al.arudhaSignIndex + 10) % 12;
  const sign12FromAL = (al.arudhaSignIndex + 11) % 12;
  const sign3FromAL = (al.arudhaSignIndex + 2) % 12;
  const sign6FromAL = (al.arudhaSignIndex + 5) % 12;
  const sign7FromAL = (al.arudhaSignIndex + 6) % 12;

  const occ3 = occupantsIn(state, sign3FromAL);
  const occ6 = occupantsIn(state, sign6FromAL);
  const occ36 = [...occ3, ...occ6];
  const mal36 = occ36.filter((p) => NATURAL_MALEFICS.has(p));
  const ben36 = occ36.filter((p) => NATURAL_BENEFICS.has(p));

  let materialRiseSignal = 'Neutral 3rd/6th from AL (unoccupied)';
  if (mal36.length > 0 && ben36.length === 0) {
    materialRiseSignal = `Strong material competitiveness & status rise: natural malefic(s) (${mal36.join(', ')}) in 3rd/6th from AL.`;
  } else if (ben36.length > 0 && mal36.length === 0) {
    materialRiseSignal = `Peaceful, detached or spiritual temperament: natural benefic(s) (${ben36.join(', ')}) in 3rd/6th from AL.`;
  } else if (mal36.length > 0 && ben36.length > 0) {
    materialRiseSignal = `Mixed 3rd/6th from AL: malefics (${mal36.join(', ')}) drive material ambition while benefics (${ben36.join(', ')}) soften ruthless edge.`;
  }

  const sign2FromUL = (ul.arudhaSignIndex + 1) % 12;
  const sign7FromUL = (ul.arudhaSignIndex + 6) % 12;
  const sign8FromUL = (ul.arudhaSignIndex + 7) % 12;

  const alUlRelationHouse = ((ul.arudhaSignIndex - al.arudhaSignIndex + 12) % 12) + 1;
  const harmoniousRel = [1, 3, 4, 5, 7, 9, 10, 11].includes(alUlRelationHouse);
  const alUlNote = harmoniousRel
    ? `UL is in the ${alUlRelationHouse}th from AL (harmonious public-image alignment with spouse/partnership).`
    : `UL is in the ${alUlRelationHouse}th from AL (2/12 or 6/8 axis — requires conscious effort to bridge public image and marital harmony).`;

  return {
    varga,
    vargaLagnaSign: SIGN_IDS[state.lagnaSignIndex]!,
    bhavaArudhas,
    grahaArudhas,
    alAnalysis: {
      alSign: al.arudhaSign,
      alHouseFromLagna: al.houseFromVargaLagna,
      gainsFromAL11: { sign: SIGN_IDS[sign11FromAL]!, occupants: occupantsIn(state, sign11FromAL) },
      lossFromAL12: { sign: SIGN_IDS[sign12FromAL]!, occupants: occupantsIn(state, sign12FromAL) },
      thirdAndSixthFromAL: {
        thirdSign: SIGN_IDS[sign3FromAL]!,
        thirdOccupants: occ3,
        sixthSign: SIGN_IDS[sign6FromAL]!,
        sixthOccupants: occ6,
        materialRiseSignal,
      },
      seventhFromAL: { sign: SIGN_IDS[sign7FromAL]!, occupants: occupantsIn(state, sign7FromAL) },
    },
    ulAnalysis: {
      ulSign: ul.arudhaSign,
      ulHouseFromLagna: ul.houseFromVargaLagna,
      sustenance2ndFromUL: {
        sign: SIGN_IDS[sign2FromUL]!,
        lord: SIGN_LORDS[sign2FromUL]!,
        occupants: occupantsIn(state, sign2FromUL),
      },
      opposition7thFromUL: {
        sign: SIGN_IDS[sign7FromUL]!,
        occupants: occupantsIn(state, sign7FromUL),
      },
      longevity8thFromUL: {
        sign: SIGN_IDS[sign8FromUL]!,
        lord: SIGN_LORDS[sign8FromUL]!,
        occupants: occupantsIn(state, sign8FromUL),
      },
      alUlRelationHouse,
      alUlNote,
    },
  };
}
