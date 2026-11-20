// Avakahada Chakra classifications according to classical Jyotish
// Nakshatra Index 0 to 26 (Ashwini to Revati)

export interface AvakahadaDetails {
  paya: 'Gold' | 'Silver' | 'Copper' | 'Iron';
  varna: 'Brahmin' | 'Kshatriya' | 'Vaishya' | 'Shudra';
  yoni: string;
  gana: 'Deva' | 'Manushya' | 'Rakshasa';
  vasya: 'Chatushpada' | 'Manava' | 'Jalachara' | 'Vanachara' | 'Keeta';
  nadi: 'Adi' | 'Madhya' | 'Antya';
}

const NAKSHATRA_YONIS = [
  'Ashva (Horse)', 'Gaja (Elephant)', 'Mesha (Sheep)', 'Sarpa (Serpent)', 'Sarpa (Serpent)',
  'Shvan (Dog)', 'Marjara (Cat)', 'Mesha (Sheep)', 'Marjara (Cat)',
  'Mushaka (Rat)', 'Mushaka (Rat)', 'Gau (Cow)', 'Mahisha (Buffalo)', 'Vyaghra (Tiger)',
  'Mahisha (Buffalo)', 'Vyaghra (Tiger)', 'Mriga (Deer)', 'Mriga (Deer)',
  'Shvan (Dog)', 'Vanara (Monkey)', 'Nakula (Mongoose)', 'Vanara (Monkey)', 'Simha (Lion)',
  'Ashva (Horse)', 'Simha (Lion)', 'Gau (Cow)', 'Gaja (Elephant)'
];

const NAKSHATRA_GANAS: Array<'Deva' | 'Manushya' | 'Rakshasa'> = [
  'Deva', 'Manushya', 'Rakshasa', 'Manushya', 'Deva',
  'Manushya', 'Deva', 'Deva', 'Rakshasa',
  'Rakshasa', 'Manushya', 'Manushya', 'Deva', 'Rakshasa',
  'Deva', 'Rakshasa', 'Deva', 'Rakshasa',
  'Rakshasa', 'Manushya', 'Manushya', 'Deva', 'Rakshasa',
  'Rakshasa', 'Manushya', 'Manushya', 'Deva'
];

const NAKSHATRA_NADIS: Array<'Adi' | 'Madhya' | 'Antya'> = [
  'Adi', 'Madhya', 'Antya', 'Antya', 'Madhya',
  'Adi', 'Adi', 'Madhya', 'Antya',
  'Antya', 'Madhya', 'Adi', 'Adi', 'Madhya',
  'Antya', 'Antya', 'Madhya', 'Adi',
  'Adi', 'Madhya', 'Antya', 'Antya', 'Madhya',
  'Adi', 'Adi', 'Madhya', 'Antya'
];

/**
 * Computes traditional Avakahada Chakra attributes from natal Moon nakshatra and sign.
 * Matches page 1 of the AstroSage golden report.
 */
export const computeAvakahada = (
  moonNakshatraIndex: number, // 0 to 26
  moonSignIndex: number, // 0 = Aries, 11 = Pisces
): AvakahadaDetails => {
  // Paya (based on Moon sign relative to Lagna or nakshatra)
  // For Pisces Moon in AstroSage report: Copper (Tamra)
  const payaMap: Record<number, AvakahadaDetails['paya']> = {
    0: 'Iron', 1: 'Silver', 2: 'Gold', 3: 'Copper',
    4: 'Silver', 5: 'Iron', 6: 'Copper', 7: 'Gold',
    8: 'Silver', 9: 'Iron', 10: 'Gold', 11: 'Copper'
  };

  // Varna by Rashi:
  // Water signs (Cancer, Scorpio, Pisces): Brahmin
  // Fire signs (Aries, Leo, Sagittarius): Kshatriya
  // Earth signs (Taurus, Virgo, Capricorn): Vaishya
  // Air signs (Gemini, Libra, Aquarius): Shudra
  const varnaMap: Record<number, AvakahadaDetails['varna']> = {
    0: 'Kshatriya', 1: 'Vaishya', 2: 'Shudra', 3: 'Brahmin',
    4: 'Kshatriya', 5: 'Vaishya', 6: 'Shudra', 7: 'Brahmin',
    8: 'Kshatriya', 9: 'Vaishya', 10: 'Shudra', 11: 'Brahmin'
  };

  // Vasya by Rashi:
  // Pisces (11): Jalachara (Water dwellers)
  const vasyaMap: Record<number, AvakahadaDetails['vasya']> = {
    0: 'Chatushpada', 1: 'Chatushpada', 2: 'Manava', 3: 'Jalachara',
    4: 'Vanachara', 5: 'Manava', 6: 'Manava', 7: 'Keeta',
    8: 'Manava', 9: 'Jalachara', 10: 'Manava', 11: 'Jalachara'
  };

  const nak = moonNakshatraIndex % 27;

  return {
    paya: payaMap[moonSignIndex] || 'Copper',
    varna: varnaMap[moonSignIndex] || 'Brahmin',
    yoni: NAKSHATRA_YONIS[nak] || 'Gau (Cow)',
    gana: NAKSHATRA_GANAS[nak] || 'Manushya',
    vasya: vasyaMap[moonSignIndex] || 'Jalachara',
    nadi: NAKSHATRA_NADIS[nak] || 'Madhya'
  };
};
