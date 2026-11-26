import { AGENT_SKILLS, AGENT_SKILL_MAP } from './registry.js';
import type { AgentSkill, SkillId, SkillRouteMatch, SkillTimescale } from './types.js';

const MICRO_TIME_RE =
  /\b(today|tomorrow|tonight|this afternoon|this morning|right now|this week|muhurta|rahu kalam|panchang|auspicious time|good day|bad day|on \d{4}-\d{2}-\d{2})\b/i;
const ANNUAL_TIME_RE =
  /\b(this year|next year|year ahead|202\d|upcoming|next 12|varshaphal|solar return|when will|which month|which year|timing|dasha)\b/i;

const TOPIC_TO_SKILL: Record<string, SkillId> = {
  career: 'career_vocation',
  relationships: 'marriage_relationships',
  money: 'wealth_finances',
  self_personality: 'personality_strengths',
  home_family: 'home_family_property',
  children_progeny: 'children_progeny',
  education: 'education_intellect',
  travel_relocation: 'travel_relocation',
  spirituality: 'spirituality_dharma',
  disputes_litigation: 'disputes_obstacles',
  health_routine: 'health_vitality',
  longevity_vulnerability: 'longevity_vulnerability',
  year_ahead: 'year_ahead_timing',
  decision_timing: 'year_ahead_timing',
};

/**
 * Deterministic Intent + Timescale Skill Router (Deep Agent Routing Layer).
 * Selects 1 primary skill + up to 1 secondary overlay skill (e.g. remedies or timing)
 * so only the exact relevant domain playbook is loaded into the LLM context.
 */
export function routeSkills(
  question: string,
  routedTopicId: string,
  riskClass: string,
): SkillRouteMatch {
  const q = question.trim();

  // 1. Score explicit skill keyword triggers
  const scored: Array<{ skill: AgentSkill; hits: number }> = [];
  for (const skill of AGENT_SKILLS) {
    let hits = 0;
    for (const re of skill.triggerPatterns) {
      if (re.test(q)) hits += 1;
    }
    if (hits > 0) scored.push({ skill, hits });
  }
  scored.sort((a, b) => b.hits - a.hits);

  const isMicro = MICRO_TIME_RE.test(q);
  const isAnnual = ANNUAL_TIME_RE.test(q);
  const hasRemedyTrigger = AGENT_SKILL_MAP.get('remedies_guidance')!.triggerPatterns.some((r) => r.test(q));
  const hasRectifyTrigger = AGENT_SKILL_MAP.get('birthtime_sensitivity')!.triggerPatterns.some((r) => r.test(q));
  const hasPoliticalTrigger = AGENT_SKILL_MAP.get('political_public_life')!.triggerPatterns.some((r) => r.test(q));
  const hasPsyTrigger = AGENT_SKILL_MAP.get('astro_psychology_counseling')!.triggerPatterns.some((r) => r.test(q));

  let primarySkill: AgentSkill | undefined;
  let matchedBy: SkillRouteMatch['matchedBy'] = 'topic_map';

  // High-priority specialized overrides
  if (riskClass === 'health_non_diagnostic') {
    primarySkill = AGENT_SKILL_MAP.get('health_vitality')!;
    matchedBy = 'keyword_override';
  } else if (hasRectifyTrigger) {
    primarySkill = AGENT_SKILL_MAP.get('birthtime_sensitivity')!;
    matchedBy = 'keyword_override';
  } else if (hasPoliticalTrigger) {
    primarySkill = AGENT_SKILL_MAP.get('political_public_life')!;
    matchedBy = 'keyword_override';
  } else if (hasPsyTrigger) {
    primarySkill = AGENT_SKILL_MAP.get('astro_psychology_counseling')!;
    matchedBy = 'keyword_override';
  } else if (isMicro) {
    primarySkill = AGENT_SKILL_MAP.get('daily_muhurta_transits')!;
    matchedBy = 'keyword_override';
  } else if (hasRemedyTrigger && scored.length === 1) {
    primarySkill = AGENT_SKILL_MAP.get('remedies_guidance')!;
    matchedBy = 'keyword_override';
  } else if (TOPIC_TO_SKILL[routedTopicId] && routedTopicId !== 'year_ahead') {
    primarySkill = AGENT_SKILL_MAP.get(TOPIC_TO_SKILL[routedTopicId]!)!;
    matchedBy = 'topic_map';
  } else if (scored.length > 0) {
    primarySkill = scored[0]!.skill;
    matchedBy = 'keyword_override';
  } else if (TOPIC_TO_SKILL[routedTopicId]) {
    primarySkill = AGENT_SKILL_MAP.get(TOPIC_TO_SKILL[routedTopicId]!)!;
    matchedBy = 'topic_map';
  } else {
    primarySkill = AGENT_SKILL_MAP.get('personality_strengths')!;
    matchedBy = 'default';
  }

  // 2. Select up to 1 secondary overlay skill (e.g. career + remedies, or marriage + annual timing)
  const secondarySkills: AgentSkill[] = [];
  if (hasRemedyTrigger && primarySkill.id !== 'remedies_guidance') {
    secondarySkills.push(AGENT_SKILL_MAP.get('remedies_guidance')!);
  } else if (
    isAnnual &&
    primarySkill.id !== 'year_ahead_timing' &&
    primarySkill.id !== 'daily_muhurta_transits'
  ) {
    secondarySkills.push(AGENT_SKILL_MAP.get('year_ahead_timing')!);
  } else if (scored.length > 1) {
    const alt = scored.find((s) => s.skill.id !== primarySkill!.id);
    if (alt) secondarySkills.push(alt.skill);
  }

  // 3. Determine effective timescale (PVR Ch. 33 Timescale Matching)
  let timescale: SkillTimescale = primarySkill.timescale;
  if (isMicro) timescale = 'micro_daily';
  else if (isAnnual || riskClass === 'timing') timescale = 'annual_window';
  else if (timescale === 'adaptive') timescale = 'macro_natal';

  return {
    primarySkill,
    secondarySkills: secondarySkills.slice(0, 1),
    timescale,
    matchedBy,
  };
}

/**
 * Compact 1-line catalog embedded in the core system prompt so the agent can call
 * `load_skill(skillId)` on demand for compound or follow-up pivots.
 */
export function renderSkillCatalog(): string {
  return AGENT_SKILLS.map((s) => `- ${s.id}: ${s.catalogSummary}`).join('\n');
}

/**
 * Renders full playbook instructions for a single skill (used both by auto-routing
 * and by the `load_skill` tool).
 */
export function renderSkillPlaybook(skill: AgentSkill): string {
  return [
    `### Skill: ${skill.title} (${skill.id})`,
    `- Scope: Vargas [${skill.primaryVargas.join(', ')}] | Houses [${skill.primaryHouses.join(', ')}]${
      skill.keyArudhas.length ? ` | Arudhas [${skill.keyArudhas.join(', ')}]` : ''
    }${skill.keyKarakas.length ? ` | Karakas [${skill.keyKarakas.join(', ')}]` : ''}`,
    `- Recommended Minimal Tools: ${skill.recommendedTools.join(' + ')}`,
    `- Analysis Protocol:`,
    ...skill.protocolSteps.map((step, i) => `  ${i + 1}. ${step}`),
    `- 3-Plane Disconnect Check: ${skill.disconnectCheck}`,
    `- Pitfalls & Guardrails: ${skill.pitfalls.join(' ')}`,
    `- Synthesis Pattern: ${skill.reasoningPattern}`,
  ].join('\n');
}

/**
 * Builds the turn-specific Active Skill Briefing injected into the system prompt
 * for the current user request (progressive disclosure).
 */
export function renderActiveSkillBriefing(match: SkillRouteMatch, timeframe: { from: string; to: string }): string {
  const timescaleGuidance =
    match.timescale === 'micro_daily'
      ? 'MICRO/DAILY TIMESCALE: Match day/hour questions to Muhurta, Panchang, Navatara, Kakshya, Vedha, and Ghatak — NEVER blame a multi-year Mahadasha for a single day.'
      : match.timescale === 'annual_window'
      ? `ANNUAL/TIMING TIMESCALE (${timeframe.from}..${timeframe.to}): Follow the 4-Tier Timing Funnel (Natal Promise -> MD-AD axis & Sudarshana -> Double Transit & SAV -> Varshaphal/window_scan).`
      : 'MACRO/NATAL TIMESCALE: Establish D1 + Varga promise, Functional Roles, Shadbala leadership, and 3-Plane Reality vs Perception before layering active Dasha context.';

  const parts: string[] = [
    '## Active Routed Skill Briefing (Auto-Loaded for This Query)',
    `- Effective Timescale: ${timescaleGuidance}`,
    renderSkillPlaybook(match.primarySkill),
  ];

  for (const sec of match.secondarySkills) {
    parts.push(`### Secondary Overlay Skill: ${sec.title} (${sec.id})`);
    parts.push(`- Overlay Tools: ${sec.recommendedTools.join(' + ')}`);
    parts.push(`- Key Rules: ${sec.protocolSteps.slice(0, 2).join(' ')}`);
    parts.push(`- Guardrails: ${sec.pitfalls.join(' ')}`);
  }

  return parts.join('\n\n');
}
