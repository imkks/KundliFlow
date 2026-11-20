import type { ConditionNode, Rule } from './schema.js';

export interface LintIssue {
  level: 'error' | 'warning';
  code: string;
  ruleIds: string[];
  message: string;
}

const BANNED_PHRASES = [
  '100% certain',
  'guaranteed',
  'will definitely',
  'inevitable',
  'destined to die',
  'cursed',
  'doomed',
];

function canonicalConditionKey(node: ConditionNode): string {
  if ('all' in node) {
    return `all(${node.all.map(canonicalConditionKey).sort().join('&')})`;
  }
  if ('any' in node) {
    return `any(${node.any.map(canonicalConditionKey).sort().join('|')})`;
  }
  if ('not' in node) {
    return `not(${canonicalConditionKey(node.not)})`;
  }
  const entries = Object.entries(node)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`);
  return entries.join(',');
}

/**
 * Checks a set of rules for:
 * 1. Contradictions: identical kind + identical primary condition with opposite polarity (supportive vs challenging)
 *    without a separating modifier or predicate.
 * 2. Tone & quality: banned certainty language, missing source, empty statement, > 4 sentences.
 */
export function lintRules(rules: Rule[]): LintIssue[] {
  const issues: LintIssue[] = [];

  // 1. Contradiction check
  const byCondition = new Map<string, Rule[]>();
  for (const rule of rules) {
    const sig = `${rule.kind}::${canonicalConditionKey(rule.when)}`;
    const arr = byCondition.get(sig) ?? [];
    arr.push(rule);
    byCondition.set(sig, arr);
  }

  for (const [, group] of byCondition.entries()) {
    if (group.length < 2) continue;
    const supportive = group.filter((r) => r.effect.polarity === 'supportive');
    const challenging = group.filter((r) => r.effect.polarity === 'challenging');
    if (supportive.length > 0 && challenging.length > 0) {
      issues.push({
        level: 'error',
        code: 'CONTRADICTORY_RULES',
        ruleIds: [...supportive.map((r) => r.id), ...challenging.map((r) => r.id)],
        message: `Rules have identical conditions (${group[0]!.kind}) with opposite polarities (supportive vs challenging) and no separating predicate.`,
      });
    }
  }

  // 2. Tone & metadata check
  for (const rule of rules) {
    const stmt = rule.effect.statement.trim();
    if (!stmt) {
      issues.push({
        level: 'error',
        code: 'EMPTY_STATEMENT',
        ruleIds: [rule.id],
        message: `Rule ${rule.id} has an empty statement.`,
      });
    }

    if (!rule.source.trim()) {
      issues.push({
        level: 'error',
        code: 'MISSING_SOURCE',
        ruleIds: [rule.id],
        message: `Rule ${rule.id} is missing a source citation.`,
      });
    }

    const lower = stmt.toLowerCase();
    for (const banned of BANNED_PHRASES) {
      if (lower.includes(banned)) {
        issues.push({
          level: 'error',
          code: 'BANNED_TONE_PHRASE',
          ruleIds: [rule.id],
          message: `Rule ${rule.id} contains banned certainty/fatalistic phrase "${banned}". Use hedged traditional phrasing.`,
        });
      }
    }

    const sentences = stmt.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length > 4) {
      issues.push({
        level: 'warning',
        code: 'STATEMENT_TOO_LONG',
        ruleIds: [rule.id],
        message: `Rule ${rule.id} has ${sentences.length} sentences (max 4 recommended).`,
      });
    }
  }

  return issues;
}
