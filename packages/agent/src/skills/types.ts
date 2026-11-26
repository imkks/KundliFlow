export type SkillTimescale = 'micro_daily' | 'annual_window' | 'macro_natal' | 'adaptive';

export type SkillId =
  | 'career_vocation'
  | 'marriage_relationships'
  | 'wealth_finances'
  | 'personality_strengths'
  | 'home_family_property'
  | 'children_progeny'
  | 'education_intellect'
  | 'travel_relocation'
  | 'spirituality_dharma'
  | 'disputes_obstacles'
  | 'health_vitality'
  | 'longevity_vulnerability'
  | 'daily_muhurta_transits'
  | 'year_ahead_timing'
  | 'remedies_guidance'
  | 'birthtime_sensitivity'
  | 'political_public_life'
  | 'astro_psychology_counseling';

export interface AgentSkill {
  id: SkillId;
  title: string;
  /** Compact 1-line summary shown in the base system prompt catalog. */
  catalogSummary: string;
  /** Topic IDs from topics.yaml that map to this skill. */
  topicIds: string[];
  /** Explicit keyword triggers (for secondary/overlay skill matching or overrides). */
  triggerPatterns: RegExp[];
  timescale: SkillTimescale;
  primaryVargas: string[];
  primaryHouses: number[];
  keyArudhas: string[];
  keyKarakas: string[];
  /** Minimal parallel tool calls recommended for Round 1. */
  recommendedTools: string[];
  /** Step-by-step deterministic analysis protocol distilled from kb/r_01..r_18. */
  protocolSteps: string[];
  /** 3-Plane (Reality vs Perception vs Psychology) disconnect diagnostic. */
  disconnectCheck: string;
  /** Classical pitfalls & guardrails to avoid. */
  pitfalls: string[];
  /** Compact few-shot synthesis pattern distilled from PVR Part 6 / r_18. */
  reasoningPattern: string;
}

export interface SkillRouteMatch {
  primarySkill: AgentSkill;
  secondarySkills: AgentSkill[];
  timescale: SkillTimescale;
  matchedBy: 'keyword_override' | 'topic_map' | 'default';
}
