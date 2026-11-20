import type { NatalChart, VedicGraha } from './types.js';
import type { TransitOverview } from '../transits/index.js';
import { SIGNS, type Sign } from '../angles.js';

export const SIGN_RULERS: Record<number, VedicGraha> = {
  0: 'mars', // Aries
  1: 'venus', // Taurus
  2: 'mercury', // Gemini
  3: 'moon', // Cancer
  4: 'sun', // Leo
  5: 'mercury', // Virgo
  6: 'venus', // Libra
  7: 'mars', // Scorpio
  8: 'jupiter', // Sagittarius
  9: 'saturn', // Capricorn
  10: 'saturn', // Aquarius
  11: 'jupiter', // Pisces
};

export interface HouseDossier {
  houseNumber: number; // 1 to 12
  sanskritName: string; // Tanu, Dhana, Sahaja, etc.
  domainTitle: string; // Self & Identity, Wealth & Family, etc.
  keyThemes: string[];
  signIndex: number;
  signName: string;
  lord: VedicGraha;
  lordHouse: number;
  lordSign: string;
  natalOccupants: Array<{ graha: VedicGraha; degInSign: number; retrograde: boolean }>;
  transitingOccupants: Array<{ graha: VedicGraha; degInSign: number; retrograde: boolean }>;
  aspectingPlanets: Array<{ graha: VedicGraha; aspectType: string }>;
  savBindus: number;
  strengthRating: 'high' | 'moderate' | 'requires_effort';
  reading: string;
}

const BHAVA_METADATA: Record<
  number,
  { sanskritName: string; domainTitle: string; keyThemes: string[] }
> = {
  1: {
    sanskritName: 'Tanu Bhava (Lagna)',
    domainTitle: 'Self, Vitality & Physical Constitution',
    keyThemes: ['Core Identity', 'Physical Vitality', 'Temperament', 'Appearance', 'Self-Direction'],
  },
  2: {
    sanskritName: 'Dhana Bhava',
    domainTitle: 'Wealth, Liquid Assets & Family Heritage',
    keyThemes: ['Accumulated Assets', 'Speech & Voice', 'Lineage & Family', 'Food Habits', 'Values'],
  },
  3: {
    sanskritName: 'Sahaja Bhava',
    domainTitle: 'Courage, Siblings & Directed Initiative',
    keyThemes: ['Initiative & Will', 'Younger Siblings', 'Writing & Hands', 'Short Journeys', 'Skill Acquisition'],
  },
  4: {
    sanskritName: 'Sukha Bhava',
    domainTitle: 'Inner Peace, Mother, Home & Foundations',
    keyThemes: ['Heart & Peace of Mind', 'Maternal Bond', 'Home & Real Estate', 'Vehicles', 'Formal Roots'],
  },
  5: {
    sanskritName: 'Putra Bhava',
    domainTitle: 'Creative Intelligence, Discernment & Purva Punya',
    keyThemes: ['Intuitive Genius', 'Past-Life Merit', 'Offspring & Legacy', 'Speculation', 'Mantra & Wisdom'],
  },
  6: {
    sanskritName: 'Ari / Ripu Bhava',
    domainTitle: 'Daily Discipline, Overcoming Obstacles & Healing',
    keyThemes: ['Overcoming Competitors', 'Problem Solving', 'Immunity & Health Habits', 'Service & Routine', 'Debts'],
  },
  7: {
    sanskritName: 'Yuvati / Jaya Bhava',
    domainTitle: 'Partnerships, Marriage & Public Interaction',
    keyThemes: ['Spouse & Lifelong Union', 'Business Contracts', 'Public Trade', 'Foreign Exchanges', 'Complementary Mirror'],
  },
  8: {
    sanskritName: 'Randhra Bhava',
    domainTitle: 'Transformation, Longevity & Esoteric Research',
    keyThemes: ['Deep Transformation', 'Hidden Truths & Occult', 'Sudden Events', 'Inheritance', 'Psychological Depth'],
  },
  9: {
    sanskritName: 'Dharma Bhava',
    domainTitle: 'Higher Wisdom, Fortune & Spiritual Guidance',
    keyThemes: ['Life Philosophy (Dharma)', 'Mentors & Guru', 'Father Figure', 'Long-Distance Travel', 'Higher Truths'],
  },
  10: {
    sanskritName: 'Karma Bhava',
    domainTitle: 'Vocation, Status, Authority & Public Impact',
    keyThemes: ['Career Legacy', 'Social Reputation', 'Leadership & Executive Power', 'Public Duty', 'Mastery'],
  },
  11: {
    sanskritName: 'Labha Bhava',
    domainTitle: 'Gains, Aspirations & Soul Community',
    keyThemes: ['Major Life Goals', 'Professional Networks', 'Elder Siblings', 'Multiple Income Streams', 'Social Impact'],
  },
  12: {
    sanskritName: 'Vyaya Bhava',
    domainTitle: 'Solitude, Liberation, Subconscious & Distant Lands',
    keyThemes: ['Spiritual Liberation (Moksha)', 'Subconscious Processing & Sleep', 'Distant Foreign Lands', 'Charity', 'Sacred Solitude'],
  },
};

/**
 * Calculates complete Bhava Dossier for all 12 houses.
 */
export const computeBhavaAnalysis = (
  chart: NatalChart,
  transits?: TransitOverview,
  savBySign: number[] = [26, 33, 33, 26, 31, 19, 30, 20, 28, 37, 28, 26],
): HouseDossier[] => {
  const lagnaSignIndex = chart.lagna?.signIndex ?? 1; // Default Taurus (1)
  const classicalGrahas: VedicGraha[] = [
    'sun',
    'moon',
    'mars',
    'mercury',
    'jupiter',
    'venus',
    'saturn',
    'rahu',
    'ketu',
  ];

  const dossiers: HouseDossier[] = [];

  for (let h = 1; h <= 12; h++) {
    const signIndex = (lagnaSignIndex + h - 1) % 12;
    const signName = SIGNS[signIndex]!;
    const lord = SIGN_RULERS[signIndex]!;
    const meta = BHAVA_METADATA[h]!;

    // Lord placement
    const lordGraha = chart.grahas[lord];
    const lordHouse = lordGraha?.houses?.houseFromLagna ?? 1;
    const lordSign = lordGraha?.sign ?? signName;

    // Natal occupants in this house
    const natalOccupants: HouseDossier['natalOccupants'] = [];
    for (const g of classicalGrahas) {
      const detail = chart.grahas[g];
      if (detail && detail.signIndex === signIndex) {
        natalOccupants.push({
          graha: g,
          degInSign: detail.degInSign,
          retrograde: detail.retrograde,
        });
      }
    }

    // Transiting occupants in this house
    const transitingOccupants: HouseDossier['transitingOccupants'] = [];
    if (transits && transits.transits) {
      for (const g of classicalGrahas) {
        const tp = transits.transits[g];
        if (tp && tp.signIndex === signIndex) {
          transitingOccupants.push({
            graha: g,
            degInSign: tp.degInSign,
            retrograde: tp.retrograde,
          });
        }
      }
    }

    // Aspecting planets onto this house
    const aspectingPlanets: HouseDossier['aspectingPlanets'] = [];
    for (const g of classicalGrahas) {
      const detail = chart.grahas[g];
      if (!detail) continue;

      const pSign = detail.signIndex;
      // All planets cast 7th aspect (opposite sign, 6 steps away)
      if ((pSign + 6) % 12 === signIndex) {
        aspectingPlanets.push({ graha: g, aspectType: '7th (Direct Full Aspect)' });
      }
      // Special aspects
      if (g === 'mars') {
        if ((pSign + 3) % 12 === signIndex) aspectingPlanets.push({ graha: g, aspectType: '4th (Special Mars Aspect)' });
        if ((pSign + 7) % 12 === signIndex) aspectingPlanets.push({ graha: g, aspectType: '8th (Special Mars Aspect)' });
      }
      if (g === 'jupiter' || g === 'rahu' || g === 'ketu') {
        if ((pSign + 4) % 12 === signIndex) aspectingPlanets.push({ graha: g, aspectType: '5th (Special Trikona Aspect)' });
        if ((pSign + 8) % 12 === signIndex) aspectingPlanets.push({ graha: g, aspectType: '9th (Special Trikona Aspect)' });
      }
      if (g === 'saturn') {
        if ((pSign + 2) % 12 === signIndex) aspectingPlanets.push({ graha: g, aspectType: '3rd (Special Saturn Aspect)' });
        if ((pSign + 9) % 12 === signIndex) aspectingPlanets.push({ graha: g, aspectType: '10th (Special Saturn Aspect)' });
      }
    }

    // Ashtakvarga bindus
    const savBindus = savBySign[signIndex] ?? 28;
    const strengthRating = savBindus >= 30 ? 'high' : savBindus >= 25 ? 'moderate' : 'requires_effort';

    // Synthesized reading
    const reading = generateBhavaReading(h, signName, lord, lordHouse, natalOccupants, aspectingPlanets, savBindus);

    dossiers.push({
      houseNumber: h,
      sanskritName: meta.sanskritName,
      domainTitle: meta.domainTitle,
      keyThemes: meta.keyThemes,
      signIndex,
      signName,
      lord,
      lordHouse,
      lordSign,
      natalOccupants,
      transitingOccupants,
      aspectingPlanets,
      savBindus,
      strengthRating,
      reading,
    });
  }

  return dossiers;
};

/**
 * Generates tailored classical synthesis for each house dynamically for any chart.
 */
function generateBhavaReading(
  house: number,
  sign: string,
  lord: VedicGraha,
  lordHouse: number,
  occupants: HouseDossier['natalOccupants'],
  aspects: HouseDossier['aspectingPlanets'],
  sav: number,
): string {
  const occNames = occupants.map((o) => `${o.graha.toUpperCase()}${o.retrograde ? ' (R)' : ''}`).join(', ');
  const aspNames = aspects.map((a) => `${a.graha.toUpperCase()} (${a.aspectType.split(' ')[0]})`).join(', ');

  const occPart = occupants.length > 0 ? `Occupied directly by ${occNames}. ` : 'No natal planets reside here directly. ';
  const aspPart = aspects.length > 0 ? `Receives energetic aspects from ${aspNames}. ` : 'Receives no major direct angular aspects. ';
  const savPart = sav >= 30 
    ? `With ${sav} Sarva Ashtakvarga bindus, this domain possesses abundant supportive momentum.` 
    : sav >= 25 
    ? `Endowed with ${sav} bindus in Ashtakvarga, providing stable and balanced potential.`
    : `Carries ${sav} bindus in Ashtakvarga, requiring focused attention and methodical cultivation.`;

  return `${sign.toUpperCase()} occupies House ${house}, ruled by ${lord.toUpperCase()} placed in House ${lordHouse}. This directly connects the affairs of this house to the activities and themes of House ${lordHouse}. ${occPart}${aspPart}${savPart}`;
}
