import { SIGN_LORDS, type NatalChart, type VedicGraha } from '../natal/types.js';

export type Modality = 'movable' | 'fixed' | 'dual';
export type LongevitySpan = 'alpayu' | 'madhyayu' | 'poornayu';

export interface PairEvaluation {
  pairName: string;
  factor1: { name: string; signIndex: number; modality: Modality };
  factor2: { name: string; signIndex: number; modality: Modality };
  span: LongevitySpan;
}

export interface LongevityResult {
  pairs: PairEvaluation[];
  rawVerdict: LongevitySpan;
  finalVerdict: LongevitySpan;
  estimatedYearsRange: string;
  kakshyaAdjustment: string;
  explanation: string;
}

function getModality(signIndex: number): Modality {
  const rem = signIndex % 3;
  if (rem === 0) return 'movable'; // Aries, Cancer, Libra, Capricorn
  if (rem === 1) return 'fixed';   // Taurus, Leo, Scorpio, Aquarius
  return 'dual';                   // Gemini, Virgo, Sagittarius, Pisces
}

function evaluatePairSpan(m1: Modality, m2: Modality): LongevitySpan {
  if (m1 === 'movable') {
    if (m2 === 'movable') return 'poornayu';
    if (m2 === 'fixed') return 'madhyayu';
    return 'alpayu';
  }
  if (m1 === 'fixed') {
    if (m2 === 'movable') return 'madhyayu';
    if (m2 === 'fixed') return 'alpayu';
    return 'poornayu';
  }
  // m1 === 'dual'
  if (m2 === 'movable') return 'alpayu';
  if (m2 === 'fixed') return 'poornayu';
  return 'madhyayu';
}

/**
 * Calculates Longevity category via the Three-Pair Method per Dr. K.S. Charak
 * Elements of Vedic Astrology (Ch. XXIII: Mathematical Calculation of Longevity).
 */
export function computeThreePairLongevity(natal: NatalChart): LongevityResult {
  const lagnaSign = natal.lagna?.signIndex ?? 0;
  const h8Sign = (lagnaSign + 7) % 12;

  const lagnaLord = SIGN_LORDS[lagnaSign]!;
  const h8Lord = SIGN_LORDS[h8Sign]!;

  const lagnaLordSign = natal.grahas[lagnaLord]?.signIndex ?? lagnaSign;
  const h8LordSign = natal.grahas[h8Lord]?.signIndex ?? h8Sign;

  const moonSign = natal.grahas.moon.signIndex;
  const saturnSign = natal.grahas.saturn.signIndex;

  // Pair 1: Lagna Lord & 8th Lord
  const m1a = getModality(lagnaLordSign);
  const m1b = getModality(h8LordSign);
  const span1 = evaluatePairSpan(m1a, m1b);

  // Pair 2: Moon & Saturn
  const m2a = getModality(moonSign);
  const m2b = getModality(saturnSign);
  const span2 = evaluatePairSpan(m2a, m2b);

  // Pair 3: Lagna & Moon (standard Parashari alternative to Lagna & Hora Lagna)
  const m3a = getModality(lagnaSign);
  const m3b = getModality(moonSign);
  const span3 = evaluatePairSpan(m3a, m3b);

  const pairs: PairEvaluation[] = [
    {
      pairName: 'Lagna Lord & 8th Lord',
      factor1: { name: `Lagna Lord (${lagnaLord})`, signIndex: lagnaLordSign, modality: m1a },
      factor2: { name: `8th Lord (${h8Lord})`, signIndex: h8LordSign, modality: m1b },
      span: span1,
    },
    {
      pairName: 'Moon & Saturn',
      factor1: { name: 'Moon', signIndex: moonSign, modality: m2a },
      factor2: { name: 'Saturn (Ayushkaraka)', signIndex: saturnSign, modality: m2b },
      span: span2,
    },
    {
      pairName: 'Lagna & Moon',
      factor1: { name: 'Lagna (Ascendant)', signIndex: lagnaSign, modality: m3a },
      factor2: { name: 'Moon', signIndex: moonSign, modality: m3b },
      span: span3,
    },
  ];

  // Majority determination
  const counts: Record<LongevitySpan, number> = { alpayu: 0, madhyayu: 0, poornayu: 0 };
  counts[span1]++;
  counts[span2]++;
  counts[span3]++;

  let rawVerdict: LongevitySpan = 'madhyayu';
  if (counts.poornayu >= 2) rawVerdict = 'poornayu';
  else if (counts.alpayu >= 2) rawVerdict = 'alpayu';
  else if (counts.madhyayu >= 2) rawVerdict = 'madhyayu';
  else rawVerdict = span1; // If all 3 disagree, Pair 1 takes precedence

  // Kakshya Vriddhi (Elevation) Check
  // Jupiter in Kendra (1, 4, 7, 10 from Lagna) elevates lifespan bracket
  const jupHouse = natal.grahas.jupiter.houses.houseFromLagna ?? 1;
  const isJupInKendra = [1, 4, 7, 10].includes(jupHouse);
  let finalVerdict: LongevitySpan = rawVerdict;
  let kakshyaAdjustment = 'None';

  if (isJupInKendra) {
    if (rawVerdict === 'alpayu') {
      finalVerdict = 'madhyayu';
      kakshyaAdjustment = 'Elevated from Alpayu to Madhyayu due to protective Jupiter in angular Kendra.';
    } else if (rawVerdict === 'madhyayu') {
      finalVerdict = 'poornayu';
      kakshyaAdjustment = 'Elevated from Madhyayu to Poornayu due to protective Jupiter in angular Kendra.';
    } else {
      kakshyaAdjustment = 'Reinforced Poornayu (Jupiter in Kendra confirms maximal longevity span).';
    }
  }

  const rangeMap: Record<LongevitySpan, string> = {
    alpayu: 'Short lifespan bracket (0 to 32 years)',
    madhyayu: 'Medium lifespan bracket (32 to 70 years)',
    poornayu: 'Full lifespan bracket (70 to 100+ years)',
  };

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const explanation = `The Three-Pair Parashari method yields ${pairs.map((p) => `${p.pairName}: ${cap(p.span)}`).join(', ')}. Raw majority: ${cap(rawVerdict)}. ${kakshyaAdjustment !== 'None' ? kakshyaAdjustment : 'Vitality factors operate in standard equilibrium.'}`;

  return {
    pairs,
    rawVerdict,
    finalVerdict,
    estimatedYearsRange: rangeMap[finalVerdict],
    kakshyaAdjustment,
    explanation,
  };
}
