import { z } from 'zod';

export const ChecklistItemSchema = z.object({
  path: z.string(),
  weight: z.number().int().min(1).max(5),
});
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

export const TopicMapSchema = z.object({
  id: z.string(),
  description: z.string(),
  themes: z.array(z.string()),
  houses: z.array(z.number().int().min(1).max(12)),
  karakas: z.array(z.string()),
  vargas: z.array(z.string()),
  checklist: z.array(ChecklistItemSchema),
  timing: z.object({
    activate_houses: z.array(z.number().int().min(1).max(12)),
  }),
  sensitive: z.boolean().default(false),
});
export type TopicMap = z.infer<typeof TopicMapSchema>;

export const TopicsFileSchema = z.object({
  version: z.string(),
  topics: z.array(TopicMapSchema),
});

export const KbItemSchema = z.object({
  id: z.string(),
  type: z.enum([
    'rule_statement',
    'concept_note',
    'classical_ref',
    'topic_map',
    'exemplar_plan',
    'glossary',
  ]),
  text: z.string(),
  lang: z.string().default('en'),
  planets: z.string().optional(),
  houses: z.string().optional(),
  signs: z.string().optional(),
  themes: z.string().optional(),
  polarity: z.string().optional(),
  school: z.string().optional(),
  source: z.string().optional(),
  reviewed: z.number().int().min(0).max(1).default(0),
  version: z.string().default('1.0.0'),
});
export type KbItem = z.infer<typeof KbItemSchema>;

export const ConceptsFileSchema = z.object({
  version: z.string(),
  items: z.array(KbItemSchema),
});
