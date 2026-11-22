import { SIGN_LORDS, type NatalChart, type VedicGraha } from './types.js';
import type { AvakahadaDetails } from './avakahada.js';
import type { CharaKaraka } from './karakas.js';

export interface SectionInterpretation {
  title: string;
  badge: string;
  summary: string;
  bullets: string[];
}

export const getAvakahadaInterpretation = (avk: AvakahadaDetails): SectionInterpretation => {
  return {
    title: 'Avakahada Chakra & Temperamental Blueprint',
    badge: 'Core Archetype',
    summary:
      `The Avakahada Chakra reveals fundamental constitutional temperament, relational compatibility, and innate behavioral rhythm derived from your Moon placement.`,
    bullets: [
      `Varna (${avk.varna}): Indicates your fundamental cognitive and social orientation (${avk.varna === 'Brahmin' ? 'intellectual inquiry, contemplation, and wisdom' : avk.varna === 'Kshatriya' ? 'leadership, protective valor, and governance' : avk.varna === 'Vaishya' ? 'trade, commercial acumen, and networking' : 'diligent execution, craftsmanship, and pragmatic service'}).`,
      `Gana (${avk.gana}): Represents relational empathy (${avk.gana === 'Deva' ? 'elevated idealism, benevolence, and serene harmony' : avk.gana === 'Manushya' ? 'balanced human empathy, community ethics, and pragmatism' : 'bold non-conformity, fierce independence, and tenacity'}).`,
      `Yoni (${avk.yoni}): Reflects instinctive nature and compatibility rhythm, associated with steady stamina, patience, and dependability.`,
      `Paya (${avk.paya}): Signifies foundational career and material stamina (${avk.paya === 'Copper' ? 'auspicious foundations for lasting enterprise' : avk.paya === 'Gold' ? 'noble opportunities with high moral duty' : avk.paya === 'Silver' ? 'fluid adaptability and emotional intelligence' : 'resilience built through overcome challenges'}).`,
      `Nadi (${avk.nadi}): Constitutional Ayurvedic metabolic balance (${avk.nadi === 'Madhya' ? 'Pitta / metabolic and analytical clarity' : avk.nadi === 'Adi' ? 'Vata / creative nervous vitality' : 'Kapha / grounding endurance'}).`,
      `Vasya (${avk.vasya}): Harmonious environmental alignment and subconscious affinity.`,
    ],
  };
};

export const getPlanetaryInsights = (chart: NatalChart): SectionInterpretation => {
  const bullets: string[] = [];
  const lagna = chart.lagna;

  if (lagna) {
    const lagnaLord = SIGN_LORDS[lagna.signIndex];
    bullets.push(
      `Ascendant in ${lagna.sign.toUpperCase()} (Lord: ${lagnaLord ? lagnaLord.toUpperCase() : 'UNKNOWN'}): Endows a ${lagna.sign.toLowerCase()} constitutional focus, shaping your primary interface with the outer world.`,
    );
  }

  const primaryGrahas: VedicGraha[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];

  for (const g of primaryGrahas) {
    const d = chart.grahas[g];
    if (!d) continue;

    const houseStr = d.houses?.houseFromLagna ? `House ${d.houses.houseFromLagna}` : 'Kundli';
    const dignityStr = d.dignity ? ` [${d.dignity}]` : '';
    const retroStr = d.retrograde ? ' [Retrograde]' : '';

    let meaning = '';
    if (g === 'sun') meaning = 'Core identity, vitality, moral dignity, and authority.';
    else if (g === 'moon') meaning = `Contemplative mental rhythm, intuition, and emotional peace (${d.nakshatra} pada ${d.pada}).`;
    else if (g === 'mars') meaning = 'Courage, physical drive, and decisive execution.';
    else if (g === 'mercury') meaning = 'Analytical intellect, articulate communication, and commercial logic.';
    else if (g === 'jupiter') meaning = 'Higher wisdom, ethical expansion, mentorship, and optimistic guidance.';
    else if (g === 'venus') meaning = 'Aesthetics, relational grace, creative expression, and worldly appreciation.';
    else if (g === 'saturn') meaning = 'Karmic discipline, perseverance, structure, and enduring resilience.';
    else if (g === 'rahu') meaning = 'Ambitious worldly experimentation, unconventional drive, and future growth.';
    else if (g === 'ketu') meaning = 'Subconscious detachment, spiritual discernment, and past-life mastery.';

    bullets.push(
      `${g.toUpperCase()} in ${d.sign.toUpperCase()} (${houseStr}${dignityStr}${retroStr}): ${meaning}`,
    );
  }

  return {
    title: 'Key Planetary Sign & House Placements',
    badge: 'Nirayana Astrodynamics',
    summary:
      `Planetary positions calculated via ${chart.ayanamsa.id.toUpperCase()} Ayanamsa, mapping the interplay between conscious drive and karmic predispositions.`,
    bullets,
  };
};

export const getKarakasInsights = (
  karakas: Record<string, CharaKaraka>,
): SectionInterpretation => {
  const karakaRoles: Record<string, string> = {
    AK: 'Atmakaraka (Soul Significator) — Your primary soul journey, core purpose, and spiritual growth.',
    AmK: 'Amatyakaraka (Career & Counsel) — Professional trajectory, problem solving, and vocation.',
    BK: 'Bhratrukaraka (Siblings & Mentors) — Guidance, enduring teachers, and trusted peers.',
    MK: 'Matrukaraka (Mother & Emotional Roots) — Nurturance, emotional foundations, and heart’s peace.',
    PK: 'Putrakaraka (Creativity & Intellect) — Creative expression, intelligence, and legacy.',
    GK: 'Gnatikaraka (Obstacles & Resilience) — Areas of struggle, competition, and transformative learning.',
    DK: 'Darakaraka (Spouse & Partnerships) — Life partners, contractual bonds, and mirror relationships.',
  };

  const bullets: string[] = [];

  for (const [code, role] of Object.entries(karakaRoles)) {
    // Look up which planet holds this Karaka role
    const planet = Object.keys(karakas).find((p) => (karakas[p] as any) === code || p === code);
    if (planet) {
      const assigned = (karakas[planet] as any) === code ? planet : (karakas[code] as any)?.graha ?? planet;
      bullets.push(
        `${role}: Held by ${String(assigned).toUpperCase()}.`,
      );
    }
  }

  return {
    title: 'Jaimini Chara Karakas: Soul & Life Path',
    badge: 'Jaimini Sutras',
    summary:
      'In the Jaimini system, planetary degrees determine soul roles dynamically rather than fixed general significations.',
    bullets,
  };
};
