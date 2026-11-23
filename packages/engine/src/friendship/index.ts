import { FRIENDSHIP_TABLE } from '@astro/content';

export type FriendshipRelation =
  | 'great_friend' // Adhi-Mitra (Intimate)
  | 'friend' // Mitra
  | 'neutral' // Sama
  | 'enemy' // Shatru
  | 'bitter_enemy'; // Adhi-Shatru (Bitter)

export const SEVEN_GRAHAS = [
  'sun',
  'moon',
  'mars',
  'mercury',
  'jupiter',
  'venus',
  'saturn',
] as const;

export type SevenGraha = (typeof SEVEN_GRAHAS)[number];

/**
 * Computes Temporal (Tatkalika) friendship between 7 planets based on house distance.
 * Planets in houses 2, 3, 4, 10, 11, and 12 from a planet are its temporary friends.
 * Planets in houses 1, 5, 6, 7, 8, and 9 are its temporary enemies.
 */
export const computeTemporalFriendship = (
  signIndices: Record<SevenGraha, number>,
): Record<SevenGraha, Record<SevenGraha, 'friend' | 'enemy'>> => {
  const result = {} as Record<SevenGraha, Record<SevenGraha, 'friend' | 'enemy'>>;

  for (const p1 of SEVEN_GRAHAS) {
    result[p1] = {} as Record<SevenGraha, 'friend' | 'enemy'>;
    const sign1 = signIndices[p1];

    for (const p2 of SEVEN_GRAHAS) {
      if (p1 === p2) continue;
      const sign2 = signIndices[p2];
      const houseFromP1 = ((sign2 - sign1 + 12) % 12) + 1; // 1 to 12

      // Friendly houses: 2, 3, 4, 10, 11, 12
      const isFriendlyHouse = [2, 3, 4, 10, 11, 12].includes(houseFromP1);
      result[p1][p2] = isFriendlyHouse ? 'friend' : 'enemy';
    }
  }

  return result;
};

/**
 * Computes Five-fold (Panchadha) friendship by compounding Permanent (Naisargika)
 * and Temporal (Tatkalika) relationships.
 * - Friend + Friend = Great Friend (Adhi-Mitra)
 * - Neutral + Friend = Friend (Mitra)
 * - Friend + Enemy = Neutral (Sama)
 * - Neutral + Enemy = Enemy (Shatru)
 * - Enemy + Enemy = Bitter Enemy (Adhi-Shatru)
 */
export const computePanchadhaFriendship = (
  signIndices: Record<SevenGraha, number>,
): Record<SevenGraha, Record<SevenGraha, FriendshipRelation>> => {
  const temporal = computeTemporalFriendship(signIndices);
  const result = {} as Record<SevenGraha, Record<SevenGraha, FriendshipRelation>>;

  for (const p1 of SEVEN_GRAHAS) {
    result[p1] = {} as Record<SevenGraha, FriendshipRelation>;

    for (const p2 of SEVEN_GRAHAS) {
      if (p1 === p2) continue;
      const perm = (FRIENDSHIP_TABLE[p1]?.[p2] || 'neutral') as 'friend' | 'neutral' | 'enemy';
      const temp = temporal[p1][p2];

      if (perm === 'friend' && temp === 'friend') {
        result[p1][p2] = 'great_friend';
      } else if (perm === 'neutral' && temp === 'friend') {
        result[p1][p2] = 'friend';
      } else if ((perm === 'friend' && temp === 'enemy') || (perm === 'enemy' && temp === 'friend')) {
        result[p1][p2] = 'neutral';
      } else if (perm === 'neutral' && temp === 'enemy') {
        result[p1][p2] = 'enemy';
      } else {
        // perm === 'enemy' && temp === 'enemy'
        result[p1][p2] = 'bitter_enemy';
      }
    }
  }

  return result;
};
