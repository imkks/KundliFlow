import {
  SCORING_CONFIG,
  FRIENDSHIP_TABLE,
  TEMPLATE_CARDS,
  SAFETY_CONFIG,
  type ScoringConfig,
  type TemplateCard,
} from '@astro/content';
import { norm360, nakshatraOf } from '../angles.js';
import type { VedicGraha } from '../natal/types.js';

export type Band = 'flowing' | 'steady' | 'go_gently';

export interface ScoreFactor {
  id: string; // e.g. "chandra_bala", "tara_bala", "sav_moon_sign", "hora", "dasha_hora", "window"
  name: string;
  value: number; // signed integer
  templateKey: string;
  summary: string;
}

export interface HourScore {
  score: number; // -7 to +7
  band: Band;
  bandLabel: string;
  horaRuler?: VedicGraha;
  factors: ScoreFactor[];
  text: string;
  scoringVersion: string;
}

export interface ScoreContext {
  instantUtc: string; // ISO 8601
  hourUtc: string; // "YYYY-MM-DDTHH:00:00Z"
  transitMoonLon: number; // sidereal decimal degrees
  transitMoonNakshatraIndex: number;
  natalMoonSignIndex: number;
  natalMoonNakshatraIndex: number;
  natalLagnaLord: VedicGraha;
  natalSarvaAshtakvarga: number[]; // 12 values
  currentHoraLord: VedicGraha;
  runningMahadashaLord: VedicGraha;
  runningAntardashaLord?: VedicGraha;
  activeInauspiciousWindow?: string | null; // e.g. "Rahu Kalam"
}

export const TARA_NAMES = [
  'Janma',
  'Sampat',
  'Vipat',
  'Kshema',
  'Pratyari',
  'Sadhana',
  'Naidhana',
  'Mitra',
  'Parama Mitra',
] as const;

/**
 * Deterministic hash of string to pick template variant
 */
export const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/**
 * Check if text contains any forbidden words (spec §7.1, §9.2)
 */
export const checkBannedWords = (text: string): { hasBanned: boolean; found: string[] } => {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const word of SAFETY_CONFIG.banned_words) {
    // Regex for word boundary
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lower)) {
      found.push(word);
    }
  }
  return { hasBanned: found.length > 0, found };
};

/**
 * Scores a single hour based on the 6 tradition-based heuristics (spec §4.2).
 */
export const scoreHour = (
  ctx: ScoreContext,
  cfg: ScoringConfig = SCORING_CONFIG,
): HourScore => {
  const factors: ScoreFactor[] = [];
  let totalScore = 0;

  // 1. Chandra Bala: Transit Moon's house counted from natal Moon sign (1-12)
  const transitMoonSignIndex = Math.floor(norm360(ctx.transitMoonLon) / 30);
  const moonHouseFromMoon = ((transitMoonSignIndex - ctx.natalMoonSignIndex + 12) % 12) + 1;

  let chandraVal = 0;
  if ([1, 3, 6, 7, 10, 11].includes(moonHouseFromMoon)) {
    chandraVal = 2;
  } else if (moonHouseFromMoon === 8) {
    chandraVal = -2;
  } else {
    chandraVal = -1;
  }
  totalScore += chandraVal;
  factors.push({
    id: 'chandra_bala',
    name: 'Chandra Bala',
    value: chandraVal,
    templateKey:
      chandraVal >= 2
        ? 'chandra_bala.good'
        : chandraVal <= -2
          ? 'chandra_bala.chandrashtama'
          : 'chandra_bala.neutral',
    summary: `Moon in house ${moonHouseFromMoon} from natal Moon (${chandraVal > 0 ? '+' : ''}${chandraVal})`,
  });

  // 2. Tara Bala: Count from natal nakshatra to current Moon nakshatra mod 9 (inclusive, 1..9)
  // Spec formula: ((cur - natal + 27) mod 27) mod 9 + 1
  const taraIndex = (((ctx.transitMoonNakshatraIndex - ctx.natalMoonNakshatraIndex + 27) % 27) % 9) + 1;
  const taraName = TARA_NAMES[taraIndex - 1]!;

  let taraVal = 0;
  if ([2, 4, 6, 8, 9].includes(taraIndex)) {
    taraVal = 2;
  } else if ([3, 5, 7].includes(taraIndex)) {
    taraVal = -2;
  } else {
    taraVal = 0;
  }
  totalScore += taraVal;
  factors.push({
    id: 'tara_bala',
    name: 'Tara Bala',
    value: taraVal,
    templateKey: taraVal >= 2 ? 'tara_bala.benefic' : taraVal <= -2 ? 'tara_bala.malefic' : 'tara_bala.neutral',
    summary: `Tara ${taraIndex} (${taraName}) (${taraVal > 0 ? '+' : ''}${taraVal})`,
  });

  // 3. SAV Moon Sign: Sarva Ashtakvarga points in sign occupied by transit Moon
  const savBindus = ctx.natalSarvaAshtakvarga[transitMoonSignIndex] ?? 28;
  let savVal = 0;
  if (savBindus >= 30) {
    savVal = 1;
  } else if (savBindus <= 24) {
    savVal = -1;
  } else {
    savVal = 0;
  }
  totalScore += savVal;
  factors.push({
    id: 'sav_moon_sign',
    name: 'Ashtakvarga Moon Strength',
    value: savVal,
    templateKey: savVal >= 1 ? 'sav_moon_sign.high' : savVal <= -1 ? 'sav_moon_sign.low' : 'sav_moon_sign.neutral',
    summary: `${savBindus} Sarva bindus in Moon sign (${savVal > 0 ? '+' : ''}${savVal})`,
  });

  // 4. Hora Lord vs Natal Lagna Lord Natural Friendship
  const relation =
    ctx.currentHoraLord === ctx.natalLagnaLord
      ? 'friend'
      : (FRIENDSHIP_TABLE[ctx.natalLagnaLord]?.[ctx.currentHoraLord] ?? 'neutral');

  let horaVal = 0;
  if (relation === 'friend') horaVal = 1;
  else if (relation === 'enemy') horaVal = -1;
  else horaVal = 0;

  totalScore += horaVal;
  factors.push({
    id: 'hora',
    name: 'Hora Alignment',
    value: horaVal,
    templateKey: horaVal >= 1 ? 'hora.favorable' : 'hora.neutral',
    summary: `${ctx.currentHoraLord} hora vs Lagna lord ${ctx.natalLagnaLord} (${relation}) (${horaVal > 0 ? '+' : ''}${horaVal})`,
  });

  // 5. Dasha Hora Resonance: Hora lord equals running Mahadasha or Antardasha lord
  const isDashaMatch =
    ctx.currentHoraLord === ctx.runningMahadashaLord ||
    (ctx.runningAntardashaLord && ctx.currentHoraLord === ctx.runningAntardashaLord);

  const dashaHoraVal = isDashaMatch ? 1 : 0;
  totalScore += dashaHoraVal;
  if (dashaHoraVal > 0) {
    factors.push({
      id: 'dasha_hora',
      name: 'Dasha-Hora Harmony',
      value: dashaHoraVal,
      templateKey: 'dasha_hora.active',
      summary: `Hora lord ${ctx.currentHoraLord} matches active dasha lord (+1)`,
    });
  }

  // 6. Inauspicious Windows (Rahu Kalam, Yamaganda, Gulika)
  const windowVal = ctx.activeInauspiciousWindow ? -1 : 0;
  totalScore += windowVal;
  if (windowVal < 0) {
    factors.push({
      id: 'window',
      name: 'Inauspicious Window',
      value: windowVal,
      templateKey: 'inauspicious_window.active',
      summary: `${ctx.activeInauspiciousWindow} active (-1)`,
    });
  }

  // Determine Band
  let band: Band = 'steady';
  let bandLabel = cfg.bands.steady.label;

  if (totalScore >= cfg.bands.flowing.minScore) {
    band = 'flowing';
    bandLabel = cfg.bands.flowing.label;
  } else if (totalScore <= -2) {
    band = 'go_gently';
    bandLabel = cfg.bands.go_gently.label;
  }

  // Build Text from Template Cards
  const textParts: string[] = [];
  const slots: Record<string, string | number> = {
    moon_house_from_moon: moonHouseFromMoon,
    tara_index: taraIndex,
    tara_name: taraName,
    bindus: savBindus,
    hora_lord: ctx.currentHoraLord.charAt(0).toUpperCase() + ctx.currentHoraLord.slice(1),
    lagna_lord: ctx.natalLagnaLord.charAt(0).toUpperCase() + ctx.natalLagnaLord.slice(1),
    window_name: ctx.activeInauspiciousWindow || '',
  };

  for (const factor of factors) {
    const card = TEMPLATE_CARDS.find((c: TemplateCard) => c.id === factor.templateKey);
    if (card && card.variants.length > 0) {
      // Deterministic selection based on hour instant + template id
      const hash = hashString(`${ctx.hourUtc}_${card.id}`);
      const variant = card.variants[hash % card.variants.length]!;

      // Interpolate slots {{slot_name}}
      let interpolated = variant;
      for (const [k, v] of Object.entries(slots)) {
        interpolated = interpolated.replaceAll(`{{${k}}}`, String(v));
      }
      textParts.push(interpolated);
    }
  }

  const combinedText = textParts.slice(0, 2).join(' ');

  // Safety check: ensure no banned words
  const safety = checkBannedWords(combinedText);
  if (safety.hasBanned) {
    throw new Error(`CRITICAL_SAFETY_VIOLATION: Generated text contains banned words: ${safety.found.join(', ')}`);
  }

  return {
    score: totalScore,
    band,
    bandLabel,
    horaRuler: ctx.currentHoraLord,
    factors,
    text: combinedText,
    scoringVersion: cfg.version,
  };
};
