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
import { EngineSession } from '@astro/tools';
import { MockLlmClient, runAgentQuery } from '../src/index.js';

const ROOT_DIR = path.resolve(__dirname, '../../..');
const STRENGTH_PATH = path.join(ROOT_DIR, 'packages/content/strength.yaml');
const SAMPLE_RULES_PATH = path.join(ROOT_DIR, 'packages/content/rules/sample_rules.yaml');
const TOPICS_PATH = path.join(ROOT_DIR, 'packages/content/topics/topics.yaml');
const CONCEPTS_PATH = path.join(ROOT_DIR, 'packages/content/kb/concepts.yaml');
const LORE_PATH = path.join(ROOT_DIR, 'packages/content/kb/jyotish_lore.yaml');

describe('DA-M4: DeepAgent parallel tool_use, RAG & automatic observed evidence verifier', () => {
  let eph: EphemerisProvider;

  beforeAll(async () => {
    eph = await loadEphemeris('swisseph');
  });

  function setupSampleChart() {
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
    const findings = evaluateRules(ws, rules, { strengthConfig, contentVersion: version, persistToDb: true });

    const kb = createKnowledgeBase(':memory:');
    kb.ingestTopicsFile(TOPICS_PATH);
    kb.ingestConceptsFile(CONCEPTS_PATH);
    kb.ingestConceptsFile(LORE_PATH);

    const engineSession = new EngineSession({ natal, shadbala, ashtakvarga, dashas });
    return { ws, kb, findings, engineSession };
  }

  it('handles conversational greetings naturally with 0 tool calls', async () => {
    const { ws, kb, findings, engineSession } = setupSampleChart();
    try {
      const mock = new MockLlmClient([
        {
          text: JSON.stringify({
            responseType: 'conversational',
            answer: 'Namaste! Ask me anything about your chart, dashas, or Jyotish concepts.',
            because: [],
            timing: [],
            uncertainty: '',
            reflect: 'What area of your chart would you like to explore?',
            followUps: ['How is my 4th house placed?'],
          }),
        },
      ]);

      const result = await runAgentQuery({
        question: 'hi',
        ws,
        kb,
        findings,
        llm: mock,
        engineSession,
      });

      expect(result.mode).toBe('conversational');
      expect(result.observedEvidenceIds).toHaveLength(0);
    } finally {
      kb.close();
      ws.close();
    }
  });

  it('runs parallel multi-engine tool calls and verifies grounded chart_reading', async () => {
    const { ws, kb, findings, engineSession } = setupSampleChart();
    try {
      const mock = new MockLlmClient([
        // Turn 1: parallel tool calls across VFS, Vargas, Sudarshana comparison, and Hybrid RAG
        {
          toolCalls: [
            { id: 'tc1', name: 'read', args: { path: '/houses/4', limit: 20 } },
            { id: 'tc2', name: 'inspect_varga', args: { varga: 'D9' } },
            { id: 'tc3', name: 'compare_perspectives', args: { house: 4 } },
            { id: 'tc4', name: 'search_knowledge', args: { query: 'Sukha Bhava home' } },
          ],
        },
        // Turn 2: grounded final JSON
        {
          text: JSON.stringify({
            responseType: 'chart_reading',
            answer:
              'In Jyotish tradition your 4th house in Leo shows a strong foundation with own-sign Sun, balanced by Rahu close to Venus adding unconventional restlessness.',
            because: [
              {
                claim: 'Own-sign 4th lord Sun supports stability while Rahu adds restlessness.',
                evidenceIds: ['finding.lord.4.in.4', 'finding.pih.rahu.4'],
              },
            ],
            timing: [],
            uncertainty: 'Both supportive and challenging factors are active.',
            reflect: 'Where do you seek calm versus change at home?',
            followUps: ['How does D9 Navamsha modify my 4th house?'],
          }),
        },
      ]);

      const result = await runAgentQuery({
        question: 'How is my home life likely to go?',
        ws,
        kb,
        findings,
        llm: mock,
        engineSession,
      });

      expect(result.mode).toBe('level3_verified');
      expect(result.observedEvidenceIds).toContain('finding.lord.4.in.4');
      expect(result.observedEvidenceIds).toContain('perspective.lagna.h4');
      expect(result.observedEvidenceIds).toContain('varga.d9.sun');
    } finally {
      kb.close();
      ws.close();
    }
  });

  it('catches hallucinated planets and fake IDs and falls back to Level 2', async () => {
    const { ws, kb, findings, engineSession } = setupSampleChart();
    try {
      const badMock = new MockLlmClient([
        { toolCalls: [{ id: 'tc1', name: 'read', args: { path: '/houses/4', limit: 10 } }] },
        {
          text: JSON.stringify({
            responseType: 'chart_reading',
            answer: 'Mars in Capricorn guarantees sudden change on 2027-05-14.',
            because: [{ claim: 'Fake', evidenceIds: ['fake.id.999'] }],
          }),
        },
        {
          text: JSON.stringify({
            responseType: 'chart_reading',
            answer: 'Mars is guaranteed to bring change.',
            because: [{ claim: 'Fake', evidenceIds: ['fake.id.999'] }],
          }),
        },
      ]);

      const result = await runAgentQuery({
        question: 'How is my home life?',
        ws,
        kb,
        findings,
        llm: badMock,
        engineSession,
        deep: false,
      });

      // After maxTurns or retries failing verification, falls back cleanly
      expect(result.mode).toBe('level2_fallback');
      expect(result.verifierErrors?.length).toBeGreaterThan(0);
    } finally {
      kb.close();
      ws.close();
    }
  });

  it('supports inspect_arudhas and inspect_karakas with grounded verification', async () => {
    const { ws, kb, findings, engineSession } = setupSampleChart();
    try {
      const mock = new MockLlmClient([
        {
          toolCalls: [
            { id: 'tc1', name: 'inspect_arudhas', args: { target: 'AL' } },
            { id: 'tc2', name: 'inspect_karakas', args: { target: 'AK' } },
          ],
        },
        {
          text: JSON.stringify({
            responseType: 'chart_reading',
            answer:
              'Your Arudha Lagna (perceived public image) and Atmakaraka (soul purpose significator) show how public perception aligns with your internal karmic direction.',
            because: [
              {
                claim: 'Arudha Lagna shapes public status while Atmakaraka governs soul lessons.',
                evidenceIds: ['arudha.al', 'karaka.ak'],
              },
            ],
            timing: [],
            uncertainty: 'Perception and internal lessons evolve as maturity unfolds.',
            reflect: 'How does your external career reputation match your personal sense of purpose?',
            followUps: ['What does my Amatyakaraka (AmK) say about my career?'],
          }),
        },
      ]);

      const result = await runAgentQuery({
        question: 'What is my public image and soul purpose?',
        ws,
        kb,
        findings,
        llm: mock,
        engineSession,
      });

      expect(result.mode).toBe('level3_verified');
      expect(result.observedEvidenceIds).toContain('arudha.al');
      expect(result.observedEvidenceIds).toContain('karaka.ak');
      expect(result.response.because[0]?.evidenceIds).toEqual(['arudha.al', 'karaka.ak']);
    } finally {
      kb.close();
      ws.close();
    }
  });
});
