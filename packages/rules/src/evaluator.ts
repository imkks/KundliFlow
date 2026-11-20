import fs from 'node:fs';
import { load as parseYaml } from 'js-yaml';
import { NATURAL_BENEFICS, NATURAL_MALEFICS, type ChartWorkspace, type Fact } from '@astro/facts';
import {
  RuleFileSchema,
  StrengthConfigSchema,
  type ConditionNode,
  type FactPredicate,
  type Finding,
  type Rule,
  type StrengthConfig,
} from './schema.js';

export const DEFAULT_STRENGTH_CONFIG: StrengthConfig = {
  version: '1.0.0',
  modifiers: {
    exalted_or_own: 15,
    debilitated: -15,
    shadbala_above_1: 10,
    shadbala_below_1: -10,
    sav_bindus_30_plus: 5,
    sav_bindus_22_or_less: -5,
    benefic_aspect_each: 5,
    benefic_aspect_cap: 10,
    malefic_aspect_each: -5,
    malefic_aspect_cap: -10,
    combust: -10,
    functional_benefic: 10,
    functional_malefic: -10,
    tight_conjunction_emphasis: 5,
  },
};

export function loadStrengthConfig(filePath: string): StrengthConfig {
  const raw = parseYaml(fs.readFileSync(filePath, 'utf8'));
  return StrengthConfigSchema.parse(raw);
}

export function loadRuleFile(filePath: string): { version: string; rules: Rule[] } {
  const raw = parseYaml(fs.readFileSync(filePath, 'utf8'));
  return RuleFileSchema.parse(raw);
}

export function loadAllRulesFromDir(dirPath: string): { version: string; rules: Rule[] } {
  const files = fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .sort((a, b) => (a === 'sample_rules.yaml' ? 1 : b === 'sample_rules.yaml' ? -1 : a.localeCompare(b)));

  const byId = new Map<string, Rule>();
  let version = '1.0.0';
  for (const file of files) {
    const parsed = loadRuleFile(`${dirPath}/${file}`);
    version = parsed.version;
    for (const r of parsed.rules) {
      byId.set(r.id, r);
    }
  }
  return { version, rules: Array.from(byId.values()) };
}

interface EvalContext {
  factsByType: Map<string, Fact[]>;
  factById: Map<string, Fact>;
  evidence: Set<string>;
  resolvedLord?: string;
}

function matchPredicate(pred: FactPredicate, ctx: EvalContext): boolean {
  const candidates = ctx.factsByType.get(pred.fact) ?? [];
  const matched: Fact[] = [];

  for (const f of candidates) {
    // Handle subject_from: 'lord'
    const targetPlanet = pred.subject_from === 'lord' ? ctx.resolvedLord : pred.planet;
    if (targetPlanet && f.args.planet !== targetPlanet && f.subject !== targetPlanet) continue;

    if (pred.house !== undefined) {
      const h = f.args.house ?? f.houseFrom.lagna;
      if (h !== pred.house) continue;
    }
    if (pred.placedHouseLagna !== undefined && f.args.placedHouseLagna !== pred.placedHouseLagna) {
      continue;
    }
    if (pred.from_lagna !== undefined && f.houseFrom.lagna !== pred.from_lagna) continue;
    if (pred.from_moon !== undefined && f.houseFrom.moon !== pred.from_moon) continue;
    if (pred.sign && f.args.sign !== pred.sign) continue;

    if (pred.planet1 && pred.planet2) {
      const pairMatch =
        (f.args.planet1 === pred.planet1 && f.args.planet2 === pred.planet2) ||
        (f.args.planet1 === pred.planet2 && f.args.planet2 === pred.planet1);
      if (!pairMatch) continue;
    } else if (pred.with && pred.fact === 'conjunction') {
      const p1 = String(f.args.planet1 ?? '');
      const p2 = String(f.args.planet2 ?? '');
      const anchor = targetPlanet;
      if (anchor) {
        const other = p1 === anchor ? p2 : p2 === anchor ? p1 : null;
        if (!other || !pred.with.includes(other)) continue;
      } else if (!pred.with.includes(p1) && !pred.with.includes(p2)) {
        continue;
      }
    }

    if (pred.state) {
      const stateVal = String(f.args.state ?? f.value ?? '');
      if (!pred.state.includes(stateVal)) continue;
    }

    if (pred.orb_lte !== undefined) {
      const orb = Number(f.args.orb ?? f.value ?? 999);
      if (orb > pred.orb_lte) continue;
    }

    if (pred.strength_gte !== undefined) {
      const strVal = Number(f.args.ratio ?? f.value ?? 0);
      if (strVal < pred.strength_gte) continue;
    }

    if (pred.lord_of !== undefined) {
      const lordFact = ctx.factById.get(`lord.house${pred.lord_of}`);
      if (!lordFact || lordFact.value !== f.subject) continue;
    }

    matched.push(f);
  }

  if (matched.length === 0) return false;

  for (const m of matched) {
    ctx.evidence.add(m.id);
    if (m.type === 'lordship' && typeof m.value === 'string') {
      ctx.resolvedLord = m.value;
    }
  }
  return true;
}

function evalCondition(node: ConditionNode, ctx: EvalContext): boolean {
  if ('all' in node) {
    const localEvidence = new Set<string>();
    const subCtx: EvalContext = { ...ctx, evidence: localEvidence };
    for (const child of node.all) {
      if (!evalCondition(child, subCtx)) return false;
    }
    for (const id of localEvidence) ctx.evidence.add(id);
    if (subCtx.resolvedLord) ctx.resolvedLord = subCtx.resolvedLord;
    return true;
  }
  if ('any' in node) {
    for (const child of node.any) {
      const localEvidence = new Set<string>();
      const subCtx: EvalContext = { ...ctx, evidence: localEvidence };
      if (evalCondition(child, subCtx)) {
        for (const id of localEvidence) ctx.evidence.add(id);
        if (subCtx.resolvedLord) ctx.resolvedLord = subCtx.resolvedLord;
        return true;
      }
    }
    return false;
  }
  if ('not' in node) {
    const subCtx: EvalContext = { ...ctx, evidence: new Set<string>() };
    return !evalCondition(node.not, subCtx);
  }
  return matchPredicate(node, ctx);
}

function inferPrimaryHouse(rule: Rule, evidence: string[], factById: Map<string, Fact>): number | null {
  for (const eid of evidence) {
    const f = factById.get(eid);
    if (!f) continue;
    if (f.type === 'lordship' && typeof f.args.placedHouseLagna === 'number') {
      return f.args.placedHouseLagna;
    }
    if (typeof f.args.house === 'number') return f.args.house;
    if (f.houseFrom?.lagna) return f.houseFrom.lagna;
  }
  const m = rule.id.match(/\.(\d+)$/);
  return m ? Number(m[1]) : null;
}

function inferPrimaryPlanet(evidence: string[], factById: Map<string, Fact>): string | null {
  for (const eid of evidence) {
    const f = factById.get(eid);
    if (!f) continue;
    if (f.type === 'lordship' && typeof f.value === 'string') return f.value;
    if (typeof f.args.planet === 'string') return f.args.planet;
    if (typeof f.args.planet1 === 'string') return f.args.planet1;
  }
  return null;
}

function computeGlobalStrengthDelta(
  planet: string | null,
  house: number | null,
  factsByType: Map<string, Fact[]>,
  factById: Map<string, Fact>,
  cfg: StrengthConfig,
): number {
  let delta = 0;
  const m = cfg.modifiers;

  if (planet) {
    const dig = factById.get(`dignity.${planet}`);
    if (dig) {
      if (dig.value === 'exalted' || dig.value === 'own' || dig.value === 'mooltrikona') {
        delta += m.exalted_or_own;
      } else if (dig.value === 'debilitated') {
        delta += m.debilitated;
      }
    }

    const sb = factById.get(`strength.${planet}`);
    if (sb && typeof sb.value === 'number') {
      delta += sb.value >= 1 ? m.shadbala_above_1 : m.shadbala_below_1;
    }

    const comb = factById.get(`combust.${planet}`);
    if (comb && comb.value === true) {
      delta += m.combust;
    }

    const placement = factById.get(`placement.${planet}`);
    if (placement) {
      if (placement.args.functionalRole === 'benefic') delta += m.functional_benefic;
      else if (placement.args.functionalRole === 'malefic') delta += m.functional_malefic;
    }

    const aspects = factsByType.get('aspect') ?? [];
    let benDelta = 0;
    let malDelta = 0;
    for (const asp of aspects) {
      if (asp.args.to === planet) {
        const from = String(asp.args.from ?? '');
        if ((NATURAL_BENEFICS as readonly string[]).includes(from)) {
          benDelta += m.benefic_aspect_each;
        } else if ((NATURAL_MALEFICS as readonly string[]).includes(from)) {
          malDelta += m.malefic_aspect_each;
        }
      }
    }
    delta += Math.min(m.benefic_aspect_cap, benDelta);
    delta += Math.max(m.malefic_aspect_cap, malDelta);
  }

  if (house !== null) {
    const hs = factById.get(`strength.house${house}`);
    if (hs && typeof hs.args.savBindus === 'number') {
      if (hs.args.savBindus >= 30) delta += m.sav_bindus_30_plus;
      else if (hs.args.savBindus <= 22) delta += m.sav_bindus_22_or_less;
    }
  }

  return delta;
}

export interface EvaluateRulesOptions {
  strengthConfig?: StrengthConfig;
  contentVersion?: string;
  persistToDb?: boolean;
}

/**
 * Evaluates all rules against a ChartWorkspace, computes strength scores and evidence lists,
 * and optionally persists Findings + evidence_of Edges into chart.db.
 */
export function evaluateRules(
  ws: ChartWorkspace,
  rules: Rule[],
  options: EvaluateRulesOptions = {},
): Finding[] {
  const cfg = options.strengthConfig ?? DEFAULT_STRENGTH_CONFIG;
  const contentVersion = options.contentVersion ?? '0.1.0';
  const persistToDb = options.persistToDb ?? true;

  const factsByType = new Map<string, Fact[]>();
  const factById = new Map<string, Fact>();
  for (const f of ws.factSet.facts) {
    factById.set(f.id, f);
    const arr = factsByType.get(f.type) ?? [];
    arr.push(f);
    factsByType.set(f.type, arr);
  }

  const findings: Finding[] = [];

  for (const rule of rules) {
    const ctx: EvalContext = {
      factsByType,
      factById,
      evidence: new Set<string>(),
    };

    if (!evalCondition(rule.when, ctx)) continue;

    let strength = rule.effect.base_strength;
    const phrases: string[] = [];

    if (rule.effect.modifiers) {
      for (const mod of rule.effect.modifiers) {
        const modCtx: EvalContext = {
          factsByType,
          factById,
          evidence: new Set<string>(),
          resolvedLord: ctx.resolvedLord,
        };
        if (evalCondition(mod.when, modCtx)) {
          strength += mod.strength;
          for (const eid of modCtx.evidence) ctx.evidence.add(eid);
          if (mod.phrase) phrases.push(mod.phrase);
        }
      }
    }

    const evidenceArr = Array.from(ctx.evidence);
    const house = inferPrimaryHouse(rule, evidenceArr, factById);
    const planet = inferPrimaryPlanet(evidenceArr, factById);

    strength += computeGlobalStrengthDelta(planet, house, factsByType, factById, cfg);
    const clampedStrength = Math.max(0, Math.min(100, Math.round(strength)));

    const subject = house !== null ? `house${house}` : planet ?? 'chart';
    const rendered = [rule.effect.statement, ...phrases].join(' ');

    findings.push({
      id: `finding.${rule.id}`,
      ruleId: rule.id,
      subject,
      house,
      theme: rule.effect.theme,
      polarity: rule.effect.polarity,
      strength: clampedStrength,
      confidence: rule.reviewed ? 1.0 : 0.75,
      school: rule.school,
      evidence: evidenceArr,
      textKey: rule.id,
      rendered,
      phrases,
      contentVersion,
    });
  }

  if (persistToDb && findings.length > 0) {
    const insertFinding = ws.db.prepare(`
      INSERT OR REPLACE INTO finding
        (id, rule_id, subject, theme, polarity, strength, confidence, school, evidence_json, text_key, rendered, content_version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertEdge = ws.db.prepare(`
      INSERT OR REPLACE INTO edge (src, dst, rel)
      VALUES (?, ?, 'evidence_of')
    `);

    const tx = ws.db.transaction(() => {
      for (const fn of findings) {
        insertFinding.run(
          fn.id,
          fn.ruleId,
          fn.subject,
          fn.theme,
          fn.polarity,
          fn.strength,
          fn.confidence,
          fn.school,
          JSON.stringify(fn.evidence),
          fn.textKey,
          fn.rendered,
          fn.contentVersion,
        );
        for (const eid of fn.evidence) {
          insertEdge.run(eid, fn.id);
        }
      }
    });
    tx();
  }

  return findings.sort((a, b) => b.strength - a.strength);
}
