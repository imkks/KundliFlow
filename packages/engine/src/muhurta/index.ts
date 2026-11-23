export interface PanchakaResult {
  sum: number;
  remainder: number;
  isShuddha: boolean;
  defectName: 'Mrityu' | 'Agni' | 'Raja' | 'Chora' | 'Roga' | 'Shuddha';
  verdict: 'auspicious' | 'inauspicious';
  description: string;
}

/**
 * Calculates Panchaka Rahita per Dr. K.S. Charak Elements of Vedic Astrology (Ch. XXVI).
 * Sums Tithi (1-30), Vaara (1-7), Nakshatra (1-27), and Lagna (1-12) modulo 9.
 */
export function computePanchakaRahita(
  tithiNum: number,    // 1-30
  vaaraNum: number,    // 1 (Sun) to 7 (Sat)
  nakshatraNum: number,// 1 (Ashwini) to 27 (Revati)
  lagnaNum: number,    // 1 (Aries) to 12 (Pisces)
): PanchakaResult {
  const sum = tithiNum + vaaraNum + nakshatraNum + lagnaNum;
  const rem = sum % 9;

  let defectName: PanchakaResult['defectName'] = 'Shuddha';
  let isShuddha = false;
  let description = '';

  switch (rem) {
    case 1:
      defectName = 'Mrityu';
      description = 'Mrityu Panchaka (danger of accidents, vitality drain, or severe setbacks). Inauspicious for major undertakings.';
      break;
    case 2:
      defectName = 'Agni';
      description = 'Agni Panchaka (hazard of fire, fevers, and conflict). Avoid foundation laying, domestic inaugurations, or surgery.';
      break;
    case 4:
      defectName = 'Raja';
      description = 'Raja Panchaka (conflict with authority, institutional opposition, or legal complications).';
      break;
    case 6:
      defectName = 'Chora';
      description = 'Chora Panchaka (risk of deceit, theft, financial leakage, or unfaithful dealings). Avoid financial ventures.';
      break;
    case 8:
      defectName = 'Roga';
      description = 'Roga Panchaka (prolonged debility, illness, or fatigue). Inauspicious for commencement of healing or travel.';
      break;
    default:
      // 0, 3, 5, 7 are Shuddha
      defectName = 'Shuddha';
      isShuddha = true;
      description = 'Shuddha Panchaka (Panchaka-free). The cosmic window is clean and free from the five classical elemental defects.';
      break;
  }

  return {
    sum,
    remainder: rem,
    isShuddha,
    defectName,
    verdict: isShuddha ? 'auspicious' : 'inauspicious',
    description,
  };
}

export interface SpecialMuhurtaResult {
  sarvarthaSiddhi: boolean;
  amritaSiddhi: boolean;
  guruPushya: boolean;
  raviPushya: boolean;
  activeYogas: string[];
  description: string;
}

/**
 * Checks for classical electional weekday-nakshatra yogas per Dr. K.S. Charak (Ch. XXVI).
 */
export function evaluateSpecialMuhurtas(
  vaaraNum: number,     // 1 (Sun) to 7 (Sat)
  nakshatraNum: number, // 1 (Ashwini) to 27 (Revati)
): SpecialMuhurtaResult {
  // Sarvartha Siddhi combinations (vaara -> set of nakshatras 1..27)
  const sarvarthaTable: Record<number, number[]> = {
    1: [1, 8, 12, 13, 19, 21, 26], // Sun: Ashwini, Pushya, U.Phalguni, Hasta, Moola, U.Ashadha, U.Bhadrapada
    2: [4, 5, 8, 17, 22],          // Mon: Rohini, Mrigashira, Pushya, Anuradha, Shravana
    3: [1, 3],                     // Tue: Ashwini, Krittika
    4: [3, 4, 5, 13, 17],          // Wed: Krittika, Rohini, Mrigashira, Hasta, Anuradha
    5: [7, 8, 17],                 // Thu: Punarvasu, Pushya, Anuradha
    6: [1, 17, 27],                // Fri: Ashwini, Anuradha, Revati
    7: [4, 15, 22],                // Sat: Rohini, Swati, Shravana
  };

  // Amrita Siddhi combinations
  const amritaTable: Record<number, number> = {
    1: 13, // Sun: Hasta
    2: 5,  // Mon: Mrigashira
    3: 1,  // Tue: Ashwini
    4: 17, // Wed: Anuradha
    5: 8,  // Thu: Pushya
    6: 27, // Fri: Revati
    7: 4,  // Sat: Rohini
  };

  const isSarvartha = sarvarthaTable[vaaraNum]?.includes(nakshatraNum) ?? false;
  const isAmrita = amritaTable[vaaraNum] === nakshatraNum;
  const isGuruPushya = vaaraNum === 5 && nakshatraNum === 8;
  const isRaviPushya = vaaraNum === 1 && nakshatraNum === 8;

  const activeYogas: string[] = [];
  if (isGuruPushya) activeYogas.push('Guru Pushya Yoga (Supreme Auspicious Wealth & Learning)');
  if (isRaviPushya) activeYogas.push('Ravi Pushya Yoga (Solar Auspicious Radiance)');
  if (isAmrita) activeYogas.push('Amrita Siddhi Yoga (Nectar of Success)');
  if (isSarvartha) activeYogas.push('Sarvartha Siddhi Yoga (Accomplishment of All Aims)');

  const description = activeYogas.length > 0
    ? activeYogas.join('; ') + '.'
    : 'Standard muhurta conditions apply without special weekday-nakshatra siddhi yogas.';

  return {
    sarvarthaSiddhi: isSarvartha,
    amritaSiddhi: isAmrita,
    guruPushya: isGuruPushya,
    raviPushya: isRaviPushya,
    activeYogas,
    description,
  };
}
