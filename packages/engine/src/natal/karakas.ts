import type { GrahaDetail, VedicGraha } from './types.js';

export type CharaKaraka = 'AK' | 'AmK' | 'BK' | 'MK' | 'PK' | 'GK' | 'DK';

export const KARAKA_NAMES: Record<CharaKaraka, string> = {
  AK: 'Atmakaraka (Soul)',
  AmK: 'Amatyakaraka (Career/Mind)',
  BK: 'Bhratrukaraka (Siblings/Guru)',
  MK: 'Matrukaraka (Mother/Nurture)',
  PK: 'Putrakaraka (Children/Creativity)',
  GK: 'Gnatikaraka (Relatives/Obstacles)',
  DK: 'Darakaraka (Spouse/Partnership)',
};

const SEVEN_PLANETS: readonly VedicGraha[] = [
  'sun',
  'moon',
  'mars',
  'mercury',
  'jupiter',
  'venus',
  'saturn',
];

const KARAKA_ORDER: readonly CharaKaraka[] = ['AK', 'AmK', 'BK', 'MK', 'PK', 'GK', 'DK'];

/**
 * Computes Jaimini 7 Chara Karakas based on planetary degrees in sign.
 * Planets with highest degree in sign down to lowest degree in sign.
 */
export const computeCharaKarakas = (
  grahasOrChart: Record<string, GrahaDetail> | { grahas: Record<string, GrahaDetail> },
): Record<string, CharaKaraka> => {
  const grahas: Record<string, GrahaDetail> =
    'grahas' in grahasOrChart ? (grahasOrChart as any).grahas : (grahasOrChart as any);
  const planetDegs = SEVEN_PLANETS.map((id) => {
    const g = grahas[id];
    return {
      id,
      degInSign: g ? g.degInSign : 0,
    };
  });

  // Sort descending by degree in sign
  planetDegs.sort((a, b) => b.degInSign - a.degInSign);

  const result: Record<string, CharaKaraka> = {};
  for (let i = 0; i < planetDegs.length; i++) {
    const p = planetDegs[i]!;
    const karaka = KARAKA_ORDER[i]!;
    result[p.id] = karaka;
  }

  return result;
};
