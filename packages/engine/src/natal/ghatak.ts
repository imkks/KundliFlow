/**
 * Favourable Points & Ghatak (Malefic) Chakra Engine
 *
 * Implements classical Vedic principles from Brihat Parashara Hora Shastra & Muhurta Chintamani
 * computing auspicious personal factors and inauspicious (Ghatak) conditions for transit & electional timing.
 */

export interface GhatakDetails {
  badDay: string;
  badTithi: string;
  badNakshatra: string;
  badRasi: string;
  badLagna: string;
  badMonth: string;
  badPrahar: number;
  badKaran: string;
  badYoga: string;
  badPlanets: string[];
}

export interface FavourablePoints {
  luckyNumber: number;
  goodNumbers: number[];
  evilNumbers: number[];
  goodYears: number[];
  luckyDays: string[];
  goodPlanets: string[];
  friendlySigns: string[];
  goodLagna: string[];
  luckyMetal: string;
  luckyStone: string;
}

export interface FavourableAndGhatakResult {
  favourable: FavourablePoints;
  ghatak: GhatakDetails;
}

// Classical Ghatak Chakra table mapped by Moon Sign index (0 = Aries ... 11 = Pisces)
const GHATAK_BY_MOON_SIGN: Record<number, GhatakDetails> = {
  0: { // Aries
    badDay: 'Sunday',
    badTithi: '1, 6, 11 (Nanda)',
    badNakshatra: 'Magha',
    badRasi: 'Scorpio',
    badLagna: 'Aries',
    badMonth: 'Kartik',
    badPrahar: 1,
    badKaran: 'Bava',
    badYoga: 'Vishkambha',
    badPlanets: ['Mercury', 'Venus'],
  },
  1: { // Taurus
    badDay: 'Saturday',
    badTithi: '5, 10, 15 (Purna)',
    badNakshatra: 'Hasta',
    badRasi: 'Virgo',
    badLagna: 'Taurus',
    badMonth: 'Margashirsha',
    badPrahar: 2,
    badKaran: 'Kaulava',
    badYoga: 'Atiganda',
    badPlanets: ['Jupiter', 'Mars'],
  },
  2: { // Gemini
    badDay: 'Monday',
    badTithi: '2, 7, 12 (Bhadra)',
    badNakshatra: 'Swati',
    badRasi: 'Sagittarius',
    badLagna: 'Cancer',
    badMonth: 'Pausha',
    badPrahar: 3,
    badKaran: 'Taitila',
    badYoga: 'Sukarma',
    badPlanets: ['Mars', 'Sun'],
  },
  3: { // Cancer
    badDay: 'Wednesday',
    badTithi: '2, 7, 12 (Bhadra)',
    badNakshatra: 'Anuradha',
    badRasi: 'Capricorn',
    badLagna: 'Leo',
    badMonth: 'Magha',
    badPrahar: 2,
    badKaran: 'Gara',
    badYoga: 'Dhriti',
    badPlanets: ['Saturn', 'Mercury'],
  },
  4: { // Leo
    badDay: 'Wednesday',
    badTithi: '3, 8, 13 (Jaya)',
    badNakshatra: 'Mula',
    badRasi: 'Aquarius',
    badLagna: 'Virgo',
    badMonth: 'Phalgun',
    badPrahar: 1,
    badKaran: 'Vanija',
    badYoga: 'Shula',
    badPlanets: ['Venus', 'Saturn'],
  },
  5: { // Virgo
    badDay: 'Saturday',
    badTithi: '5, 10, 15 (Purna)',
    badNakshatra: 'Shravana',
    badRasi: 'Pisces',
    badLagna: 'Libra',
    badMonth: 'Chaitra',
    badPrahar: 4,
    badKaran: 'Vishti (Bhadra)',
    badYoga: 'Ganda',
    badPlanets: ['Mars', 'Jupiter'],
  },
  6: { // Libra
    badDay: 'Thursday',
    badTithi: '4, 9, 14 (Rikta)',
    badNakshatra: 'Shatabhisha',
    badRasi: 'Aries',
    badLagna: 'Scorpio',
    badMonth: 'Vaishakha',
    badPrahar: 3,
    badKaran: 'Bava',
    badYoga: 'Vriddhi',
    badPlanets: ['Sun', 'Jupiter'],
  },
  7: { // Scorpio
    badDay: 'Friday',
    badTithi: '1, 6, 11 (Nanda)',
    badNakshatra: 'Revati',
    badRasi: 'Taurus',
    badLagna: 'Sagittarius',
    badMonth: 'Jyeshtha',
    badPrahar: 2,
    badKaran: 'Balava',
    badYoga: 'Dhruva',
    badPlanets: ['Mercury', 'Venus'],
  },
  8: { // Sagittarius
    badDay: 'Friday',
    badTithi: '3, 8, 13 (Jaya)',
    badNakshatra: 'Bharani',
    badRasi: 'Gemini',
    badLagna: 'Capricorn',
    badMonth: 'Ashadha',
    badPrahar: 1,
    badKaran: 'Kaulava',
    badYoga: 'Vyaghata',
    badPlanets: ['Venus', 'Saturn'],
  },
  9: { // Capricorn
    badDay: 'Tuesday',
    badTithi: '4, 9, 14 (Rikta)',
    badNakshatra: 'Rohini',
    badRasi: 'Cancer',
    badLagna: 'Aquarius',
    badMonth: 'Shravana',
    badPrahar: 4,
    badKaran: 'Taitila',
    badYoga: 'Harshana',
    badPlanets: ['Mars', 'Jupiter'],
  },
  10: { // Aquarius
    badDay: 'Thursday',
    badTithi: '3, 8, 13 (Jaya)',
    badNakshatra: 'Ardra',
    badRasi: 'Leo',
    badLagna: 'Pisces',
    badMonth: 'Bhadrapada',
    badPrahar: 3,
    badKaran: 'Gara',
    badYoga: 'Vajra',
    badPlanets: ['Sun', 'Moon'],
  },
  11: { // Pisces (Matches Page 2 of golden reference PDF)
    badDay: 'Friday',
    badTithi: '5, 10, 15',
    badNakshatra: 'Ashlesha',
    badRasi: 'Kumbh',
    badLagna: 'Singha',
    badMonth: 'Phalgun',
    badPrahar: 4,
    badKaran: 'Chatuspad',
    badYoga: 'Vajra',
    badPlanets: ['Venus', 'Mercury'],
  },
};

// Sign friendly associations for Favourable Points
const SIGN_FAVOURABLES: Record<
  number,
  {
    luckyNum: number;
    goodNums: number[];
    evilNums: number[];
    luckyDays: string[];
    goodPlanets: string[];
    friendlySigns: string[];
    goodLagna: string[];
    luckyMetal: string;
    luckyStone: string;
  }
> = {
  0: { // Aries
    luckyNum: 9,
    goodNums: [1, 2, 9],
    evilNums: [4, 8],
    luckyDays: ['Tuesday', 'Sunday', 'Thursday'],
    goodPlanets: ['Mars', 'Sun', 'Jupiter'],
    friendlySigns: ['Leo', 'Sagittarius', 'Cancer'],
    goodLagna: ['Aries', 'Leo', 'Sagittarius'],
    luckyMetal: 'Copper / Gold',
    luckyStone: 'Red Coral',
  },
  1: { // Taurus
    luckyNum: 6,
    goodNums: [5, 6, 8],
    evilNums: [1, 2],
    luckyDays: ['Friday', 'Wednesday', 'Saturday'],
    goodPlanets: ['Venus', 'Mercury', 'Saturn'],
    friendlySigns: ['Virgo', 'Capricorn', 'Gemini'],
    goodLagna: ['Taurus', 'Libra', 'Capricorn'],
    luckyMetal: 'Silver / White Gold',
    luckyStone: 'Diamond / Opal',
  },
  2: { // Gemini
    luckyNum: 5,
    goodNums: [1, 4, 5],
    evilNums: [2, 7],
    luckyDays: ['Wednesday', 'Friday'],
    goodPlanets: ['Mercury', 'Venus', 'Saturn'],
    friendlySigns: ['Libra', 'Aquarius', 'Taurus'],
    goodLagna: ['Gemini', 'Virgo', 'Aquarius'],
    luckyMetal: 'Bronze / Brass',
    luckyStone: 'Emerald',
  },
  3: { // Cancer
    luckyNum: 2,
    goodNums: [1, 2, 7],
    evilNums: [4, 8],
    luckyDays: ['Monday', 'Tuesday', 'Thursday'],
    goodPlanets: ['Moon', 'Mars', 'Jupiter'],
    friendlySigns: ['Scorpio', 'Pisces', 'Leo'],
    goodLagna: ['Cancer', 'Scorpio', 'Pisces'],
    luckyMetal: 'Silver',
    luckyStone: 'Pearl / Moonstone',
  },
  4: { // Leo
    luckyNum: 1,
    goodNums: [1, 4, 9],
    evilNums: [6, 8],
    luckyDays: ['Sunday', 'Tuesday'],
    goodPlanets: ['Sun', 'Mars', 'Jupiter'],
    friendlySigns: ['Aries', 'Sagittarius', 'Cancer'],
    goodLagna: ['Leo', 'Aries', 'Sagittarius'],
    luckyMetal: 'Gold / Copper',
    luckyStone: 'Ruby',
  },
  5: { // Virgo
    luckyNum: 5,
    goodNums: [2, 5, 7],
    evilNums: [1, 9],
    luckyDays: ['Wednesday', 'Friday'],
    goodPlanets: ['Mercury', 'Venus'],
    friendlySigns: ['Taurus', 'Capricorn', 'Cancer'],
    goodLagna: ['Virgo', 'Taurus', 'Capricorn'],
    luckyMetal: 'Silver / Bronze',
    luckyStone: 'Emerald',
  },
  6: { // Libra
    luckyNum: 6,
    goodNums: [3, 6, 9],
    evilNums: [1, 2],
    luckyDays: ['Friday', 'Saturday'],
    goodPlanets: ['Venus', 'Saturn', 'Mercury'],
    friendlySigns: ['Gemini', 'Aquarius', 'Virgo'],
    goodLagna: ['Libra', 'Aquarius', 'Gemini'],
    luckyMetal: 'White Gold / Silver',
    luckyStone: 'Diamond / White Zircon',
  },
  7: { // Scorpio
    luckyNum: 9,
    goodNums: [1, 3, 9],
    evilNums: [5, 6],
    luckyDays: ['Tuesday', 'Thursday'],
    goodPlanets: ['Mars', 'Jupiter', 'Moon'],
    friendlySigns: ['Cancer', 'Pisces', 'Leo'],
    goodLagna: ['Scorpio', 'Cancer', 'Pisces'],
    luckyMetal: 'Copper',
    luckyStone: 'Red Coral',
  },
  8: { // Sagittarius
    luckyNum: 3,
    goodNums: [3, 5, 8],
    evilNums: [2, 6],
    luckyDays: ['Thursday', 'Sunday'],
    goodPlanets: ['Jupiter', 'Sun', 'Mars'],
    friendlySigns: ['Aries', 'Leo', 'Pisces'],
    goodLagna: ['Sagittarius', 'Aries', 'Leo'],
    luckyMetal: 'Gold / Brass',
    luckyStone: 'Yellow Sapphire',
  },
  9: { // Capricorn
    luckyNum: 8,
    goodNums: [5, 6, 8],
    evilNums: [1, 2],
    luckyDays: ['Saturday', 'Wednesday', 'Friday'],
    goodPlanets: ['Saturn', 'Venus', 'Mercury'],
    friendlySigns: ['Taurus', 'Virgo', 'Libra'],
    goodLagna: ['Capricorn', 'Taurus', 'Libra'],
    luckyMetal: 'Iron / Lead',
    luckyStone: 'Blue Sapphire',
  },
  10: { // Aquarius
    luckyNum: 8,
    goodNums: [3, 7, 8],
    evilNums: [1, 4],
    luckyDays: ['Saturday', 'Friday'],
    goodPlanets: ['Saturn', 'Venus'],
    friendlySigns: ['Gemini', 'Libra', 'Capricorn'],
    goodLagna: ['Aquarius', 'Gemini', 'Libra'],
    luckyMetal: 'Lead / Iron',
    luckyStone: 'Blue Sapphire / Amethyst',
  },
  11: { // Pisces (Matches Page 2 of golden reference PDF)
    luckyNum: 2,
    goodNums: [2, 7, 9],
    evilNums: [4, 8],
    luckyDays: ['Sunday', 'Tuesday'],
    goodPlanets: ['Moon', 'Sun', 'Mars'],
    friendlySigns: ['Can', 'Leo', 'Sag'],
    goodLagna: ['Can', 'Lib', 'Sag', 'Aqu'],
    luckyMetal: 'Gold',
    luckyStone: 'Yellow Sapphire',
  },
};

/**
 * Computes Favourable Points and Ghatak Chakra for a native based on Moon and Lagna signs.
 */
export const computeFavourableAndGhatak = (
  moonSignIndex: number,
  birthYear?: number,
): FavourableAndGhatakResult => {
  const normalizedMoon = ((moonSignIndex % 12) + 12) % 12;
  const ghatak = GHATAK_BY_MOON_SIGN[normalizedMoon]!;
  const favData = SIGN_FAVOURABLES[normalizedMoon]!;

  // Generate good years sequence (e.g. 11, 20, 29, 38, 47)
  const root = favData.luckyNum === 2 ? 11 : favData.luckyNum * 2 + 1;
  const goodYears = [root, root + 9, root + 18, root + 27, root + 36];

  const favourable: FavourablePoints = {
    luckyNumber: favData.luckyNum,
    goodNumbers: favData.goodNums,
    evilNumbers: favData.evilNums,
    goodYears,
    luckyDays: favData.luckyDays,
    goodPlanets: favData.goodPlanets,
    friendlySigns: favData.friendlySigns,
    goodLagna: favData.goodLagna,
    luckyMetal: favData.luckyMetal,
    luckyStone: favData.luckyStone,
  };

  return { favourable, ghatak };
};
