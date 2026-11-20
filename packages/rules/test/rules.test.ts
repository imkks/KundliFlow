import path from 'node:path';
import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadEphemeris,
  resolveBirthTime,
  computePositions,
  computeShadbala,
  computeAshtakvarga,
  computeVimshottariDashas,
  type EphemerisProvider,
} from '@astro/engine';
import { buildChartWorkspace } from '@astro/facts';
import {
  loadRuleFile,
  loadAllRulesFromDir,
  loadStrengthConfig,
  evaluateRules,
  aggregateByHouse,
  lintRules,
  renderHouse,
  renderPlanet,
} from '../src/index.js';

const ROOT_DIR = path.resolve(__dirname, '../../..');
const STRENGTH_PATH = path.join(ROOT_DIR, 'packages/content/strength.yaml');
const RULES_DIR = path.join(ROOT_DIR, 'packages/content/rules');
const SAMPLE_RULES_PATH = path.join(ROOT_DIR, 'packages/content/rules/sample_rules.yaml');

describe('L2-M2: packages/rules evaluator, strength model & linter', () => {
  let eph: EphemerisProvider;

  beforeAll(async () => {
    eph = await loadEphemeris('swisseph');
  });

  it('evaluates 20 sample rules on the sample chart, persists findings to chart.db, and aggregates 4th house as Mixed', () => {
    const strengthConfig = loadStrengthConfig(STRENGTH_PATH);
    const { version, rules } = loadRuleFile(SAMPLE_RULES_PATH);
    expect(rules.length).toBe(20);

    const res = resolveBirthTime({
      date: '1998-09-07',
      time: '23:20:34',
      tzId: 'Asia/Kolkata',
      placeName: 'Jamshedpur',
      lat: 22.8,
      lon: 86.166667,
      timeCertainty: 'exact',
    });
    if (!res.success) throw new Error(res.message);

    const natal = computePositions(
      eph,
      res.resolved,
      { name: 'Jamshedpur', lat: 22.8, lon: 86.166667 },
      { ayanamsa: 'lahiri', nodeType: 'mean' },
    );
    const shadbala = computeShadbala(natal);
    const ashtakvarga = computeAshtakvarga({
      sun: natal.grahas.sun.signIndex,
      moon: natal.grahas.moon.signIndex,
      mars: natal.grahas.mars.signIndex,
      mercury: natal.grahas.mercury.signIndex,
      jupiter: natal.grahas.jupiter.signIndex,
      venus: natal.grahas.venus.signIndex,
      saturn: natal.grahas.saturn.signIndex,
      lagna: natal.lagna?.signIndex ?? 0,
    });
    const dashas = computeVimshottariDashas(
      natal.grahas.moon.nakshatraIndex,
      natal.grahas.moon.elapsedInNakshatra,
      res.resolved.birthLocal,
      2,
    );

    const ws = buildChartWorkspace({
      natal,
      shadbala,
      ashtakvarga,
      dashas,
      options: { referenceDateIso: '2026-11-18T00:00:00Z' },
    });

    try {
      const findings = evaluateRules(ws, rules, {
        strengthConfig,
        contentVersion: version,
        persistToDb: true,
      });

      expect(findings.length).toBeGreaterThan(5);

      const pihRahu4 = findings.find((f) => f.ruleId === 'pih.rahu.4');
      const lord4in4 = findings.find((f) => f.ruleId === 'lord.4.in.4');
      const conjVenusRahu4 = findings.find((f) => f.ruleId === 'conj.venus.rahu.4');

      expect(pihRahu4).toBeDefined();
      expect(pihRahu4?.polarity).toBe('challenging');
      expect(pihRahu4?.strength).toBeGreaterThanOrEqual(50);
      expect(pihRahu4?.evidence).toContain('placement.rahu');

      expect(lord4in4).toBeDefined();
      expect(lord4in4?.polarity).toBe('supportive');
      expect(lord4in4?.strength).toBeGreaterThanOrEqual(50);
      expect(lord4in4?.evidence).toContain('lord.house4');

      expect(conjVenusRahu4).toBeDefined();
      expect(conjVenusRahu4?.polarity).toBe('mixed');
      expect(conjVenusRahu4?.evidence).toContain('conj.rahu.venus');

      // House 4 aggregation must preserve conflict and label Mixed
      const byHouse = aggregateByHouse(findings);
      const h4 = byHouse[4]!;
      expect(h4.tone).toBe('Mixed');
      expect(h4.supportiveTop.length).toBeGreaterThan(0);
      expect(h4.challengingTop.length).toBeGreaterThan(0);

      // Persisted in chart.db
      const dbCount = (ws.db.prepare('SELECT COUNT(*) as c FROM finding').get() as { c: number }).c;
      const edgeCount = (
        ws.db.prepare("SELECT COUNT(*) as c FROM edge WHERE rel = 'evidence_of'").get() as { c: number }
      ).c;
      expect(dbCount).toBe(findings.length);
      expect(edgeCount).toBeGreaterThanOrEqual(findings.length);

      // L2-M3 Renderer checks: every house must return at least 1 finding (curated or fallback)
      for (let h = 1; h <= 12; h++) {
        const hr = renderHouse(h, ws, findings, 'standard');
        expect(hr.findings.length).toBeGreaterThan(0);
        expect(hr.reflectionPrompt.length).toBeGreaterThan(10);
      }
      const h4Read = renderHouse(4, ws, findings, 'standard');
      expect(h4Read.tone).toBe('Mixed');
      expect(h4Read.evidenceChips.length).toBeGreaterThan(0);

      const rahuRead = renderPlanet('rahu', ws, findings, 'standard');
      expect(rahuRead.house).toBe(4);
      expect(rahuRead.findings.length).toBeGreaterThan(0);
    } finally {
      ws.close();
    }
  });

  it('passes contradiction and tone linter on sample_rules.yaml and catches intentional violations', () => {
    const { rules } = loadRuleFile(SAMPLE_RULES_PATH);
    const cleanIssues = lintRules(rules);
    expect(cleanIssues.filter((i) => i.level === 'error')).toHaveLength(0);

    // Intentional contradiction + banned phrase
    const badRules = [
      ...rules.slice(0, 1),
      {
        ...rules[0]!,
        id: 'pih.rahu.4.contradict',
        effect: {
          ...rules[0]!.effect,
          polarity: 'supportive' as const,
          statement: 'This is guaranteed to bring wealth.',
        },
      },
    ];
    const issues = lintRules(badRules);
    expect(issues.some((i) => i.code === 'CONTRADICTORY_RULES')).toBe(true);
    expect(issues.some((i) => i.code === 'BANNED_TONE_PHRASE')).toBe(true);
  });

  it('loads all 250+ rules from packages/content/rules and passes linter with 0 errors', () => {
    const { rules } = loadAllRulesFromDir(RULES_DIR);
    expect(rules.length).toBeGreaterThanOrEqual(250);
    const issues = lintRules(rules);
    expect(issues.filter((i) => i.level === 'error')).toHaveLength(0);
  });
});
