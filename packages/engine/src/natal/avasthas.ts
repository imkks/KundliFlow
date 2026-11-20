/**
 * Classical Planetary Avasthas Engine
 *
 * Implements:
 * 1. Baladi Avasthas (5-fold age state across 30 degrees based on odd/even signs)
 * 2. Jagratadi Avasthas (Awake, Dreaming, Sleeping states)
 * 3. Deeptadi Avasthas (9-fold psychological/potency states)
 *
 * Conforms to classical Brihat Parashara Hora Shastra rules (verified against AstroSage golden report).
 */

import type { GrahaDetail, Dignity } from './types.js';

export type BaladiAvastha = 'Bala' | 'Kumar' | 'Yuva' | 'Vradha' | 'Mrita';
export type JagratadiAvastha = 'Jaagrat' | 'Swapna' | 'Susupta';
export type DeeptadiAvastha =
  | 'Deepta'
  | 'Swatha'
  | 'Muditha'
  | 'Shant'
  | 'Deena'
  | 'Dukhita'
  | 'Khal'
  | 'Vikala';

export interface GrahaAvasthas {
  graha: string;
  baladi: BaladiAvastha;
  jagrat: JagratadiAvastha;
  deeptadi: DeeptadiAvastha;
  baladiDescription: string;
  jagratDescription: string;
  deeptadiDescription: string;
}

/**
 * Computes Baladi Avastha (Bala, Kumar, Yuva, Vradha, Mrita)
 */
export function computeBaladiAvastha(degInSign: number, signIndex: number): BaladiAvastha {
  const isOddSign = signIndex % 2 === 0; // Aries = 0 (odd sign), Taurus = 1 (even sign)
  const deg = Math.max(0, Math.min(29.99999, degInSign));

  if (isOddSign) {
    if (deg < 6) return 'Bala';
    if (deg < 12) return 'Kumar';
    if (deg < 18) return 'Yuva';
    if (deg < 24) return 'Vradha';
    return 'Mrita';
  } else {
    // Even sign is inverted
    if (deg < 6) return 'Mrita';
    if (deg < 12) return 'Vradha';
    if (deg < 18) return 'Yuva';
    if (deg < 24) return 'Kumar';
    return 'Bala';
  }
}

/**
 * Computes Jagratadi Avastha (Jaagrat, Swapna, Susupta)
 */
export function computeJagratadiAvastha(dignity: Dignity | undefined): JagratadiAvastha {
  switch (dignity) {
    case 'exalted':
    case 'moolatrikona':
    case 'own':
      return 'Jaagrat'; // Awake (100% capacity)
    case 'great_friend':
    case 'friend':
    case 'neutral':
      return 'Swapna'; // Dreaming (50% capacity)
    case 'enemy':
    case 'great_enemy':
    case 'debilitated':
    default:
      return 'Susupta'; // Sleeping (dormant / minimal capacity)
  }
}

/**
 * Computes Deeptadi Avastha (Deepta, Swastha, Muditha, Shant, Deena, Dukhita, Khal, Vikala)
 */
export function computeDeeptadiAvastha(
  dignity: Dignity | undefined,
  isCombust: boolean,
): DeeptadiAvastha {
  if (isCombust) return 'Vikala';

  switch (dignity) {
    case 'exalted':
      return 'Deepta'; // Radiant
    case 'moolatrikona':
    case 'own':
      return 'Swatha'; // Self-reliant / at ease
    case 'great_friend':
      return 'Muditha'; // Delighted
    case 'friend':
      return 'Shant'; // Peaceful
    case 'neutral':
      return 'Deena'; // Neutral / humble
    case 'enemy':
      return 'Dukhita'; // Agitated
    case 'great_enemy':
    case 'debilitated':
      return 'Khal'; // Base / distressed
    default:
      return 'Swatha';
  }
}

const BALADI_DESCRIPTIONS: Record<BaladiAvastha, string> = {
  Bala: 'Infant state (25% potency) — gentle, initiating, budding manifestation.',
  Kumar: 'Youth state (50% potency) — vigorous, active, rapid learning and development.',
  Yuva: 'Adolescent/Prime state (100% potency) — peak vigor, full manifest power, mature fruition.',
  Vradha: 'Advanced age state (20% potency) — seasoned, experienced, contemplative, low physical drive.',
  Mrita: 'Dormant state (minimal external force) — results transfer primarily through dispositor and vargas.',
};

const JAGRAT_DESCRIPTIONS: Record<JagratadiAvastha, string> = {
  Jaagrat: 'Awake (Full alertness) — planet acts directly and decisively in the native’s daily consciousness.',
  Swapna: 'Dreaming (Semi-conscious) — planet operates through intuition, aspirations, and subtle prompts.',
  Susupta: 'Sleeping (Deep dormant) — planetary gifts remain unmanifest until awakened by appropriate dasha.',
};

const DEEPTADI_DESCRIPTIONS: Record<DeeptadiAvastha, string> = {
  Deepta: 'Radiant (Exalted) — bestows sovereign respect, brilliance, high authority, and effortless grace.',
  Swatha: 'Self-seated (Own domain) — gives contentment, security, solid foundation, and self-confidence.',
  Muditha: 'Delighted (Great Friend) — joyful, harmonious social assistance, high goodwill, and good fortune.',
  Shant: 'Peaceful (Friend) — gentle, constructive development, steady composure, and friendly patronage.',
  Deena: 'Humble (Neutral) — modest output requiring continuous human effort and disciplined application.',
  Dukhita: 'Agitated (Enemy) — creates friction, restlessness, and challenges that force adaptive growth.',
  Khal: 'Distressed (Debilitated) — severe tests requiring conscious remedies, ego surrender, and inner humility.',
  Vikala: 'Afflicted (Combust) — inner brilliance masked by solar intensity; spiritualization of material desires.',
};

/**
 * Computes all three classical avastha tiers for all 7 classical grahas
 */
export function computePlanetaryAvasthas(
  grahas: Record<string, GrahaDetail>,
): Record<string, GrahaAvasthas> {
  const result: Record<string, GrahaAvasthas> = {};
  const planetKeys = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];

  for (const id of planetKeys) {
    const g = grahas[id];
    if (!g) continue;

    const baladi = computeBaladiAvastha(g.degInSign, g.signIndex);
    const jagrat = computeJagratadiAvastha(g.dignity);
    const deeptadi = computeDeeptadiAvastha(g.dignity, !!g.combust);

    result[id] = {
      graha: id,
      baladi,
      jagrat,
      deeptadi,
      baladiDescription: BALADI_DESCRIPTIONS[baladi],
      jagratDescription: JAGRAT_DESCRIPTIONS[jagrat],
      deeptadiDescription: DEEPTADI_DESCRIPTIONS[deeptadi],
    };
  }

  return result;
}
