import data from './data.json' assert { type: 'json' };

export interface ScoringConfig {
  version: string;
  bands: {
    flowing: { minScore: number; label: string; color: string };
    steady: { minScore: number; label: string; color: string };
    go_gently: { minScore: number; label: string; color: string };
  };
  weights: Record<string, any>;
}

export interface TemplateCard {
  id: string;
  when: {
    factor: string;
    gte?: number;
    lte?: number;
    eq?: number;
  };
  variants: string[];
  factors: string[];
}

export interface SafetyConfig {
  banned_words: string[];
}

export const SCORING_CONFIG: ScoringConfig = data.scoring as ScoringConfig;
export const TEMPLATE_CARDS: TemplateCard[] = data.cards as TemplateCard[];
export const FRIENDSHIP_TABLE: Record<string, Record<string, 'friend' | 'neutral' | 'enemy'>> =
  data.friendship as any;
export const SAFETY_CONFIG: SafetyConfig = data.safety as SafetyConfig;
