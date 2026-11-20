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
import { evaluateRules, loadRuleFile, loadStrengthConfig } from '@astro/rules';
import { createKnowledgeBase } from '@astro/kb';
import { EngineSession } from '../src/engine-session.js';
import { ToolServer } from '../src/server.js';

const ROOT_DIR = path.resolve(__dirname, '../../..');
const STRENGTH_PATH = path.join(ROOT_DIR, 'packages/content/strength.yaml');
const SAMPLE_RULES_PATH = path.join(ROOT_DIR, 'packages/content/rules/sample_rules.yaml');
const TOPICS_PATH = path.join(ROOT_DIR, 'packages/content/topics/topics.yaml');
const CONCEPTS_PATH = path.join(ROOT_DIR, 'packages/content/kb/concepts.yaml');

describe('L3-M2: packages/tools VFS & ToolServer deterministic suite', () => {
  let eph: EphemerisProvider;

  beforeAll(async () => {
    eph = await loadEphemeris('swisseph');
  });

  it('executes the worked home_family trace over chart.db with budget tracking and valid evidence', async () => {
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
    const { rules, version } = loadRuleFile(SAMPLE_RULES_PATH);
    const strengthConfig = loadStrengthConfig(STRENGTH_PATH);
    evaluateRules(ws, rules, { strengthConfig, contentVersion: version, persistToDb: true });

    const kb = createKnowledgeBase(':memory:');
    kb.ingestTopicsFile(TOPICS_PATH);
    kb.ingestConceptsFile(CONCEPTS_PATH);

    const engineSession = new EngineSession({
      natal,
      shadbala,
      ashtakvarga,
      dashas,
      journalEntries: [
        {
          id: 'j1',
          entryDate: '2026-11-18',
          note: 'Focused deeply during Mercury hora.',
          energy: 4,
          focus: 5,
          mood: 4,
          skySnapshot: { horaRuler: 'mercury', moonSign: 'Pisces', band: 'flowing', score: 4 },
        },
      ],
    });
    const server = new ToolServer(ws, kb, { maxSteps: 60, maxTokens: 20000 }, engineSession);

    try {
      // 1. /overview
      const overview = server.read('/overview');
      expect(overview.items.length).toBe(3);
      expect(overview.budget.stepsLeft).toBe(59);

      // Verify all EngineSession & DeepAgent synthesis tools execute without runtime errors
      expect(server.inspect_varga('D9').items.length).toBeGreaterThan(0);
      expect(server.inspect_kp_chalit().items.length).toBeGreaterThan(0);
      for (const sk of ['shadbala', 'bhavabala', 'ashtakvarga', 'avasthas', 'friendship'] as const) {
        expect(server.inspect_strengths(sk).items.length).toBeGreaterThan(0);
      }
      for (const lk of ['yogas', 'aspects', 'karakas', 'avakahada', 'ghatak', 'upagrahas', 'arudha'] as const) {
        expect(server.inspect_natal_lore(lk).items.length).toBeGreaterThan(0);
      }
      for (const dk of ['vimshottari', 'yogini', 'chara'] as const) {
        expect(server.inspect_dashas(dk).items.length).toBeGreaterThan(0);
      }
      expect(server.compare_perspectives(4).items.length).toBe(4);
      expect(server.trace_dispositor_chain('house4').items.length).toBeGreaterThan(0);
      expect(server.inspect_panchang().items.length).toBe(2);
      expect(server.inspect_bhavas(4).items.length).toBe(1);
      expect(server.inspect_strengths('ashtakvarga', 'saturn').items.length).toBe(12);
      expect(server.inspect_ashtakoota(1, 3).items.length).toBe(1);
      expect((await server.inspect_muhurta('2026-11-20')).items.length).toBe(2);
      expect(server.inspect_journal_insights(5).items.length).toBe(2);

      // 2. topic_plan
      const plan = server.topic_plan('How is my home life likely to go this year?');
      expect(server.getActiveTopic()?.id).toBe('home_family');
      expect(plan.items.length).toBeGreaterThan(0);

      // 3. read /houses/4 (page 1 has limit=8 and returns cursor; limit=20 returns all)
      const h4Page1 = server.read('/houses/4', 2, 8);
      expect(h4Page1.more).toBeDefined();
      const h4 = server.read('/houses/4', 2, 20);
      expect(h4.items.some((i) => i.id === 'finding.lord.4.in.4')).toBe(true);
      expect(h4.items.some((i) => i.id === 'finding.pih.rahu.4')).toBe(true);

      // 4. follow conjunctions on placement.rahu
      const conj = server.follow('placement.rahu', 'conjunct');
      expect(conj.items.some((i) => i.id === 'placement.venus')).toBe(true);

      // 5. read /planets/moon & /periods/current
      const moon = server.read('/planets/moon');
      expect(moon.items.length).toBeGreaterThan(0);
      const periods = server.read('/periods/current');
      expect(periods.items.length).toBeGreaterThan(0);

      // 6. window_scan
      const windows = server.window_scan('home_family', '2026-11-18', '2027-11-18');
      expect(windows.items.length).toBeGreaterThan(0);
      expect(server.getScannedWindows().length).toBeGreaterThan(0);

      // 7. search_knowledge
      const kbRes = server.search_knowledge('4th house', { house: 4 }, 3);
      expect(kbRes.items.length).toBeGreaterThan(0);

      // 8. ledger_add rejects fake IDs and keeps valid IDs
      const ledgerRes = server.ledger_add(
        '4th house shows both a strong foundation and Rahu restlessness',
        ['finding.lord.4.in.4', 'finding.pih.rahu.4', 'fake.hallucinated.id'],
        0.9,
      );
      expect(ledgerRes.items[0]?.evidence).toEqual(['finding.lord.4.in.4', 'finding.pih.rahu.4']);

      const status = server.ledger_status();
      expect(status.items[0]?.text).toContain('Ledger entries: 1');

      const done = server.finish();
      expect(server.isFinished()).toBe(true);
      expect(done.budget.tokensLeft).toBeGreaterThan(4000);
    } finally {
      kb.close();
      ws.close();
    }
  });
});
