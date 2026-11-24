import { z } from 'zod';

export const PolaritySchema = z.enum(['supportive', 'mixed', 'challenging', 'neutral']);
export type Polarity = z.infer<typeof PolaritySchema>;

export const RuleKindSchema = z.enum([
  'planet_in_house',
  'lord_in_house',
  'dignity',
  'conjunction',
  'aspect',
  'yoga',
  'dasha',
  'arudha',
  'argala',
  'karaka',
  'special_lagna',
  'vaisheshikamsa',
  'pushkara',
  'navatara',
  'special_nakshatra',
  'kakshya',
  'vedha',
  'saham',
]);
export type RuleKind = z.infer<typeof RuleKindSchema>;

export const FactPredicateSchema = z.object({
  fact: z.string(),
  planet: z.string().optional(),
  planet1: z.string().optional(),
  planet2: z.string().optional(),
  house: z.number().int().min(1).max(12).optional(),
  placedHouseLagna: z.number().int().min(1).max(12).optional(),
  sign: z.string().optional(),
  with: z.array(z.string()).optional(),
  state: z.array(z.string()).optional(),
  orb_lte: z.number().optional(),
  strength_gte: z.number().optional(),
  from_lagna: z.number().int().min(1).max(12).optional(),
  from_moon: z.number().int().min(1).max(12).optional(),
  same_house: z.boolean().optional(),
  same_sign: z.boolean().optional(),
  lord_of: z.number().int().min(1).max(12).optional(),
  subject_from: z.enum(['lord']).optional(),
  code: z.string().optional(),
  karaka: z.string().optional(),
  rel_house: z.number().int().min(1).max(12).optional(),
  tier: z.string().optional(),
  vargottama: z.boolean().optional(),
  pushkara_navamsha: z.boolean().optional(),
  pushkara_bhaga: z.boolean().optional(),
  tara: z.string().optional(),
  special_nakshatra: z.string().optional(),
  paryaya: z.string().optional(),
  is_benefic: z.boolean().optional(),
  kakshya_lord: z.string().optional(),
  is_obstructed: z.boolean().optional(),
  vedha_status: z.string().optional(),
  saham_id: z.string().optional(),
  saham_category: z.string().optional(),
  fructification: z.string().optional(),
});
export type FactPredicate = z.infer<typeof FactPredicateSchema>;

export type ConditionNode =
  | { all: ConditionNode[] }
  | { any: ConditionNode[] }
  | { not: ConditionNode }
  | FactPredicate;

export const ConditionNodeSchema: z.ZodType<ConditionNode> = z.lazy(() =>
  z.union([
    z.object({ all: z.array(ConditionNodeSchema) }),
    z.object({ any: z.array(ConditionNodeSchema) }),
    z.object({ not: ConditionNodeSchema }),
    FactPredicateSchema,
  ]),
);

export const RuleModifierSchema = z.object({
  when: ConditionNodeSchema,
  strength: z.number(),
  phrase: z.string().optional(),
});
export type RuleModifier = z.infer<typeof RuleModifierSchema>;

export const RuleSchema = z.object({
  id: z.string(),
  kind: RuleKindSchema,
  school: z.string().default('parashari'),
  source: z.string(),
  reviewed: z.boolean(),
  when: ConditionNodeSchema,
  effect: z.object({
    theme: z.string(),
    polarity: PolaritySchema,
    base_strength: z.number().min(0).max(100),
    statement: z.string(),
    modifiers: z.array(RuleModifierSchema).optional(),
  }),
});
export type Rule = z.infer<typeof RuleSchema>;

export const RuleFileSchema = z.object({
  version: z.string(),
  rules: z.array(RuleSchema),
});
export type RuleFile = z.infer<typeof RuleFileSchema>;

export const StrengthConfigSchema = z.object({
  version: z.string(),
  modifiers: z.object({
    exalted_or_own: z.number(),
    debilitated: z.number(),
    shadbala_above_1: z.number(),
    shadbala_below_1: z.number(),
    sav_bindus_30_plus: z.number(),
    sav_bindus_22_or_less: z.number(),
    benefic_aspect_each: z.number(),
    benefic_aspect_cap: z.number(),
    malefic_aspect_each: z.number(),
    malefic_aspect_cap: z.number(),
    combust: z.number(),
    functional_benefic: z.number(),
    functional_malefic: z.number(),
    tight_conjunction_emphasis: z.number(),
  }),
});
export type StrengthConfig = z.infer<typeof StrengthConfigSchema>;

export interface Finding {
  id: string;
  ruleId: string;
  subject: string; // e.g. 'house4', 'rahu', 'sun'
  house: number | null; // primary house 1..12 if house-scoped
  theme: string;
  polarity: Polarity;
  strength: number; // 0..100
  confidence: number; // 0..1
  school: string;
  evidence: string[]; // Fact IDs
  textKey: string;
  rendered: string;
  phrases: string[];
  contentVersion: string;
}

export type NetToneLabel = 'Mostly supportive' | 'Mixed' | 'Needs attention' | 'Quiet';

export interface HouseReadingSummary {
  house: number;
  tone: NetToneLabel;
  netScore: number;
  findings: Finding[];
  supportiveTop: Finding[];
  challengingTop: Finding[];
}
