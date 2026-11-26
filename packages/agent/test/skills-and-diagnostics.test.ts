import path from 'node:path';
import { describe, it, expect, beforeAll } from 'vitest';
import {
  VARGA_TYPES,
  calculateVargaSign,
  loadEphemeris,
  resolveBirthTime,
  computePositions,
  computeShadbala,
  computeAshtakvarga,
  computeVimshottariDashas,
  type EphemerisProvider,
} from '@astro/engine';
import { buildChartWorkspace } from '@astro/facts';
import { evaluateRules, lintRules, loadAllRulesFromDir, loadRuleFile, loadStrengthConfig } from '@astro/rules';
import { createKnowledgeBase } from '@astro/kb';
import {
  EngineSession,
  ToolServer,
  analyzeDashaAngularRelation,
  analyzeKnRaoDashaQuirks,
  computeAnnualYoginiDasa,
  computeAshtottariDasa,
  computeBhavaArudhasFromState,
  computeDivisionalAshtakvarga,
  computeGrahaArudhasFromState,
  computeKalachakraDasa,
  computeNeelakanthaPvb,
  computePanchaVargeeyaBala,
  computePatyayiniDasa,
  computeShodhyaPindaTriggers,
  computeTriPatakiFromSigns,
  computeVarshaNarayanaDasa,
  evaluateSignThirdTiming,
  getBadhakaInfo,
  getFunctionalRolesForLagna,
  getGrahaDrishtiHouses,
  getHaddaLord,
  getRasiDrishtiSigns,
  getSbc28NakshatraIndex,
  getTajakaSequentialDrekkanaLord,
  getTransitEffectiveHousesWithRetro,
  selectNeelakanthaVarsheshwara,
  type ChartSignState,
} from '@astro/tools';
import {
  AGENT_SKILLS,
  routeQuestion,
  routeSkills,
  runAgentQuery,
  type AgentTurnResult,
  type LlmClient,
} from '../src/index.js';

const ROOT_DIR = path.resolve(__dirname, '../../..');
const STRENGTH_PATH = path.join(ROOT_DIR, 'packages/content/strength.yaml');
const SAMPLE_RULES_PATH = path.join(ROOT_DIR, 'packages/content/rules/sample_rules.yaml');
const TOPICS_PATH = path.join(ROOT_DIR, 'packages/content/topics/topics.yaml');
const CONCEPTS_PATH = path.join(ROOT_DIR, 'packages/content/kb/concepts.yaml');
const LORE_PATH = path.join(ROOT_DIR, 'packages/content/kb/jyotish_lore.yaml');

describe('Deep Agent Skills, Routing & Deterministic Jyotish Diagnostics', () => {
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

  it('computes PVR Table 30 functional nature, Table 31 Baadhaka, Drishti & MD-AD axis accurately', () => {
    // Libra Lagna (index 6): Saturn = Yogakaraka, Jupiter = Functional Malefic
    const libraRoles = getFunctionalRolesForLagna(6, true);
    expect(libraRoles.find((r) => r.planet === 'saturn')?.role).toBe('yogakaraka');
    expect(libraRoles.find((r) => r.planet === 'jupiter')?.role).toBe('functional_malefic');
    expect(libraRoles.find((r) => r.planet === 'moon')?.role).toBe('functional_malefic'); // waxing Moon on movable Lagna

    // Waning Moon on Libra Lagna -> functional_neutral
    const libraWaning = getFunctionalRolesForLagna(6, false);
    expect(libraWaning.find((r) => r.planet === 'moon')?.role).toBe('functional_neutral');

    // Baadhaka: Aries (movable) -> 11th Aquarius (Saturn/Rahu); Taurus (fixed) -> 9th Capricorn (Saturn); Gemini (dual) -> 7th Sagittarius (Jupiter)
    expect(getBadhakaInfo(0)).toMatchObject({ modality: 'movable', badhakaHouse: 11, badhakaSign: 'aquarius', badhakaLord: 'saturn', coLord: 'rahu' });
    expect(getBadhakaInfo(1)).toMatchObject({ modality: 'fixed', badhakaHouse: 9, badhakaSign: 'capricorn', badhakaLord: 'saturn' });
    expect(getBadhakaInfo(2)).toMatchObject({ modality: 'dual', badhakaHouse: 7, badhakaSign: 'sagittarius', badhakaLord: 'jupiter' });

    // Rasi Drishti: Aries (0) aspects Leo (4), Scorpio (7), Aquarius (10) (skips adjacent Taurus 1)
    expect(getRasiDrishtiSigns(0)).toEqual([4, 7, 10]);
    // Graha Drishti: Jupiter from H1 aspects H1, H5, H7, H9; Saturn from H1 aspects H1, H3, H7, H10
    expect(getGrahaDrishtiHouses('jupiter', 1).sort((a, b) => a - b)).toEqual([1, 5, 7, 9]);
    expect(getGrahaDrishtiHouses('saturn', 1).sort((a, b) => a - b)).toEqual([1, 3, 7, 10]);

    // MD-AD Angular Resonance
    expect(analyzeDashaAngularRelation(1, 5)).toMatchObject({ axisLabel: '5/9', category: 'trine', harmony: 'harmonious' });
    expect(analyzeDashaAngularRelation(1, 6)).toMatchObject({ axisLabel: '6/8', category: 'shadashtaka', harmony: 'challenging' });
    expect(analyzeDashaAngularRelation(1, 12)).toMatchObject({ axisLabel: '2/12', category: 'dwirdwadasa', harmony: 'challenging' });
  });

  it('routes domain + timescale skills and overlays remedies cleanly', () => {
    expect(AGENT_SKILLS.length).toBeGreaterThanOrEqual(14);

    const careerWithRemedy = routeSkills(
      'How is my career growth looking and what gemstone remedy can help?',
      'career',
      'reflective',
    );
    expect(careerWithRemedy.primarySkill.id).toBe('career_vocation');
    expect(careerWithRemedy.secondarySkills.map((s) => s.id)).toContain('remedies_guidance');

    const dailyQuery = routeSkills('Why did I have a stressful afternoon today?', 'year_ahead', 'timing');
    expect(dailyQuery.primarySkill.id).toBe('daily_muhurta_transits');
    expect(dailyQuery.timescale).toBe('micro_daily');

    const btrQuery = routeSkills('My birth time is approximate around 10:30, is my D10 sensitive?', 'career', 'reflective');
    expect(btrQuery.primarySkill.id).toBe('birthtime_sensitivity');
  });

  it('exposes functional roles, argala, rule-safe remedies, AL/Paaka perspectives, Sudarshana & special lagnas via ToolServer', () => {
    const { ws, kb, engineSession } = setupSampleChart();
    try {
      const server = new ToolServer(ws, kb, { maxSteps: 20, maxTokens: 12000 }, engineSession);

      const funcRes = server.inspect_functional_roles();
      expect(funcRes.items.some((i) => i.id === 'func.summary')).toBe(true);
      expect(funcRes.items.some((i) => i.id === 'func.badhaka')).toBe(true);
      expect(funcRes.items.some((i) => i.id === 'func.cusp_sensitivity')).toBe(true);

      const argalaSat = server.inspect_argala('saturn');
      expect(argalaSat.items.some((i) => i.id === 'argala.saturn.summary')).toBe(true);

      const argalaAl = server.inspect_argala('AL');
      expect(argalaAl.items.some((i) => i.id === 'argala.al.summary')).toBe(true);

      const rem = server.inspect_remedies('career');
      expect(rem.items.some((i) => i.id === 'remedy.gem.contraindications')).toBe(true);
      expect(rem.items.some((i) => i.id === 'remedy.ishta_devata')).toBe(true);

      const persp = server.compare_perspectives(10);
      expect(persp.items.some((i) => i.id === 'perspective.al.h10')).toBe(true);
      expect(persp.items.some((i) => i.id === 'perspective.paaka.h10')).toBe(true);

      const sud = server.inspect_dashas('sudarshana', '2026-11-18');
      expect(sud.items.some((i) => i.id.startsWith('sudarshana.year.'))).toBe(true);

      const sl = server.inspect_natal_lore('special_lagnas');
      expect(sl.items.some((i) => i.id === 'special_lagna.hl')).toBe(true);
      expect(sl.items.some((i) => i.id === 'special_lagna.gl')).toBe(true);
    } finally {
      kb.close();
      ws.close();
    }
  });

  it('injects Active Routed Skill Briefing into system prompt and verifies multi-skill tool calls', async () => {
    const { ws, kb, findings, engineSession } = setupSampleChart();
    try {
      const capturedPrompts: string[] = [];
      let turn = 0;
      const turns: AgentTurnResult[] = [
        {
          toolCalls: [
            { id: 'tc1', name: 'inspect_functional_roles', args: {} },
            { id: 'tc2', name: 'inspect_argala', args: { target: 'saturn' } },
            { id: 'tc3', name: 'load_skill', args: { skillId: 'remedies_guidance' } },
            { id: 'tc4', name: 'inspect_remedies', args: { domain: 'career' } },
          ],
        },
        {
          text: JSON.stringify({
            responseType: 'chart_reading',
            answer:
              'Your career path combines disciplined effort with clear supportive influences around Saturn (your indicator of steady work), and any remedial practice should focus strictly on your rising sign’s functional benefics rather than challenging lords.',
            because: [
              {
                claim: 'Functional roles identify the most supportive planets for your rising sign.',
                evidenceIds: ['func.summary', 'argala.saturn.summary', 'remedy.gem.contraindications'],
              },
            ],
            timing: [],
            uncertainty: 'Keep practical skill-building central alongside traditional weekday practices.',
            reflect: 'Which area of your work currently feels most aligned with your natural strengths?',
            followUps: ['How does my D10 Dashamsha refine my career direction?'],
          }),
        },
      ];

      const capturingLlm: LlmClient = {
        async runAgentTurn(ctx) {
          capturedPrompts.push(ctx.systemPrompt);
          return turns[turn++] ?? turns[turns.length - 1]!;
        },
      };

      const result = await runAgentQuery({
        question: 'How is my career looking?',
        ws,
        kb,
        findings,
        llm: capturingLlm,
        engineSession,
      });

      expect(result.mode).toBe('level3_verified');
      expect(capturedPrompts[0]).toContain('Active Routed Skill Briefing');
      expect(capturedPrompts[0]).toContain('Career, Vocation & Public Status (career_vocation)');
      expect(result.activeSkills).toContain('career_vocation');
      expect(result.activeSkills).toContain('remedies_guidance');
      expect(result.observedEvidenceIds).toContain('func.summary');
      expect(result.observedEvidenceIds).toContain('argala.saturn.summary');
    } finally {
      kb.close();
      ws.close();
    }
  });

  it('computes Tajaka Ithasala/Patyayini/Mudda, Divisional SAV, Shodhya Pinda, Narayana/Sudasa/Drigdasa, Sayanaadi & Longevity', async () => {
    const { ws, kb, engineSession } = setupSampleChart();
    try {
      const server = new ToolServer(ws, kb, { maxSteps: 30, maxTokens: 20000 }, engineSession);

      // 1. Tajaka Varshaphal extended (Ithasala + Patyayini + Mudda)
      const varsha = await server.inspect_varshaphal(2026);
      expect(varsha.items.some((i) => i.id === 'varshaphal.2026.patyayini')).toBe(true);
      expect(varsha.items.some((i) => i.id === 'varshaphal.2026.mudda')).toBe(true);
      const rawV = await engineSession.getVarshaphal(2026);
      const pat = computePatyayiniDasa(rawV);
      const totalPatDays = pat.reduce((acc, p) => acc + p.days, 0);
      expect(totalPatDays).toBeGreaterThan(364);
      expect(totalPatDays).toBeLessThan(367);

      // 2. Divisional SAV + Varga Narayana Dasa via inspect_varga_analytics
      const d10Analytics = server.inspect_varga_analytics('D10');
      expect(d10Analytics.items.some((i) => i.id === 'varga_sav.d10')).toBe(true);
      expect(d10Analytics.items.some((i) => i.id.startsWith('narayana.d10.'))).toBe(true);

      const d9Av = computeDivisionalAshtakvarga(engineSession.getVargaChart('D9'));
      const totalSav = d9Av.houseSav.reduce((s, h) => s + h.bindus, 0);
      expect(totalSav).toBe(337);

      // 3. Shodhya Pinda triggers (all 8 Table 61 domains) + Sign-Third timing
      const triggers = computeShodhyaPindaTriggers(engineSession.natal, engineSession.getAshtakvarga());
      expect(triggers).toHaveLength(8);
      expect(evaluateSignThirdTiming('sun', 4)).toContain('Peak');
      expect(evaluateSignThirdTiming('jupiter', 15)).toContain('Peak');
      expect(evaluateSignThirdTiming('saturn', 25)).toContain('Peak');

      // 4. Rasi Dasha Suite: Narayana (D1 & D9), Sudasa, Drigdasa, Shoola
      expect(server.inspect_dashas('narayana', undefined, undefined, 'D9').items.length).toBeGreaterThan(0);
      expect(server.inspect_dashas('sudasa').items.length).toBeGreaterThan(0);
      expect(server.inspect_dashas('drigdasa').items.length).toBeGreaterThan(0);
      expect(server.inspect_dashas('shoola').items.length).toBeGreaterThan(0);

      // 5. Vimshottari enriched with Rath's Tripod & Drekkana delivery
      const vim = server.inspect_dashas('vimshottari');
      expect(vim.items.some((i) => i.text.includes('Sun, peak'))).toBe(true);

      // 6. Extended Avasthas (Sayanaadi + Lajjitadi) & Graded/Naabhasa Yogas
      const avas = server.inspect_strengths('avasthas');
      expect(avas.items.some((i) => i.text.includes('Sayanaadi='))).toBe(true);
      const yogas = server.inspect_natal_lore('yogas');
      expect(yogas.items.some((i) => i.id.startsWith('yoga.grade.') || i.id.startsWith('yoga.naabhasa.'))).toBe(true);

      // 7. Longevity & Shoola report
      const lon = server.inspect_longevity();
      expect(lon.items.some((i) => i.id === 'longevity.three_pairs')).toBe(true);
      expect(lon.items.some((i) => i.id === 'longevity.rudra_maheswara')).toBe(true);
    } finally {
      kb.close();
      ws.close();
    }
  });

  it('calibrates safety layer: preserves crisis support while allowing classical longevity, medical, and speculative queries', async () => {
    const { ws, kb, findings, engineSession } = setupSampleChart();
    try {
      // Crisis support MUST remain active
      const crisis = routeQuestion('I do not want to live anymore', kb);
      expect(crisis.riskClass).toBe('distress');
      expect(crisis.declineMessage).toBeDefined();

      // Longevity/Shoola is NO LONGER declined — routes to longevity_vulnerability skill
      const lonRoute = routeQuestion('What does my chart indicate for longevity and Shoola vulnerability windows?', kb);
      expect(lonRoute.declineMessage).toBeUndefined();
      expect(lonRoute.topicId).toBe('longevity_vulnerability');
      expect(routeSkills('Check my longevity and Shoola windows', lonRoute.topicId, lonRoute.riskClass).primarySkill.id).toBe(
        'longevity_vulnerability',
      );

      // End-to-end longevity query executes & verifies cleanly
      let turn = 0;
      const llm: LlmClient = {
        async runAgentTurn() {
          if (turn++ === 0) {
            return { toolCalls: [{ id: 'tc1', name: 'inspect_longevity', args: {} }] };
          }
          return {
            text: JSON.stringify({
              responseType: 'chart_reading',
              answer:
                'Your classical Three-Pair Ayurdaya analysis outlines your baseline vitality bracket along with Rudra, Trishoola signs, and Shoola vulnerability windows balanced by protective shields.',
              because: [
                {
                  claim: 'Three-Pair Ayurdaya and Rudra/Shoola factors define classical longevity brackets and caution windows.',
                  evidenceIds: ['longevity.three_pairs', 'longevity.rudra_maheswara'],
                },
              ],
              timing: [],
              uncertainty: 'Longevity brackets reflect classical tendencies rather than fixed dates.',
              reflect: 'What steady health routines help you feel most resilient year-round?',
              followUps: ['Which remedies support vitality in my chart?'],
            }),
          };
        },
      };

      const res = await runAgentQuery({
        question: 'What is my longevity bracket and Shoola vulnerability?',
        ws,
        kb,
        findings,
        llm,
        engineSession,
      });
      expect(res.mode).toBe('level3_verified');
      expect(res.activeSkills).toContain('longevity_vulnerability');
    } finally {
      kb.close();
      ws.close();
    }
  });

  it('verifies Kalachakra (PVR Ex. 95-96), Ashtottari (PVR Ex. 59), SBC 9x9 Vedha & Family Member Vargas', () => {
    const { ws, kb, engineSession } = setupSampleChart();
    try {
      const server = new ToolServer(ws, kb, { maxSteps: 20, maxTokens: 16000 }, engineSession);

      // PVR Ex. 95: Moon at 15 Ta 50 (45.8333°, Rohini P2, Apasavya-1, 83y) -> Sc 4.75y, Jeeva=Vi? Wait: P2 starts Vi..Li -> Jeeva=Vi (1st) or Sc?
      // Exact check for Rohini P2 (45 + 50/60 = 45.83333°): elapsed = 0.75 * 83 = 62.25y -> Vi(9)+Li(16)+Sc(7)+Pi(10)+Aq(4)+Cp(4)+Sg(10)=60 -> 8th sign Sc(7) balance = 67 - 62.25 = 4.75y!
      const mockRohini = {
        ...engineSession.natal,
        grahas: {
          ...engineSession.natal.grahas,
          moon: { ...engineSession.natal.grahas.moon, lon: 45 + 50 / 60 },
        },
      };
      const kc95 = computeKalachakraDasa(mockRohini);
      expect(kc95.group).toBe('apasavya1');
      expect(kc95.pada).toBe(2);
      expect(kc95.paramayush).toBe(83);
      expect(kc95.birthDasaSign).toBe('scorpio');
      expect(kc95.birthBalanceYears).toBeCloseTo(4.75, 1);

      // PVR Ex. 96: Moon at 3 Cn 00 (93.0°, Punarvasu P4, Savya-1, 86y) -> Pi 8.6y, Deha=Cn, Jeeva=Pi
      const mockPunarvasu = {
        ...engineSession.natal,
        grahas: {
          ...engineSession.natal.grahas,
          moon: { ...engineSession.natal.grahas.moon, lon: 93.0 },
        },
      };
      const kc96 = computeKalachakraDasa(mockPunarvasu);
      expect(kc96.birthDasaSign).toBe('pisces');
      expect(kc96.birthBalanceYears).toBeCloseTo(8.6, 1);

      // PVR Ex. 59: Ashtottari — Moon at 24 Le 00 (144°) -> Moon balance = 6.0 years
      const mockAshtottari = {
        ...engineSession.natal,
        grahas: {
          ...engineSession.natal.grahas,
          moon: { ...engineSession.natal.grahas.moon, lon: 144.0 },
        },
      };
      const ash59 = computeAshtottariDasa(mockAshtottari);
      expect(ash59.birthLord).toBe('moon');
      expect(ash59.birthBalanceYears).toBeCloseTo(6.0, 1);
      // Ashtottari AD starts from NEXT planet after MD lord and ends with MD lord itself
      // (For full Mars MD in periods[1]: first AD = Mercury, last AD = Mars)
      expect(ash59.periods[1]?.lord).toBe('mars');
      expect(ash59.periods[1]?.antardasas[0]?.lord).toBe('mercury');
      expect(ash59.periods[1]?.antardasas[ash59.periods[1]!.antardasas.length - 1]?.lord).toBe('mars');

      // SBC Abhijit detection (276°40' - 280°53'20" -> index 21)
      expect(getSbc28NakshatraIndex(278.0)).toBe(21);

      // ToolServer wiring checks
      expect(server.inspect_dashas('kalachakra').items.some((i) => i.id === 'kalachakra.overview')).toBe(true);
      expect(server.inspect_dashas('ashtottari').items.some((i) => i.id === 'ashtottari.overview')).toBe(true);
      expect(server.inspect_sbc().items.some((i) => i.id === 'sbc.summary')).toBe(true);
      const fam = server.inspect_family_vargas();
      expect(fam.items.some((i) => i.id === 'family.father')).toBe(true);
      expect(fam.items.some((i) => i.id === 'family.child_1')).toBe(true);
    } finally {
      kb.close();
      ws.close();
    }
  });

  it('validates K.N. Rao Level 2 rules, kn_rao_principles KB, Retrograde Double Transit, Dasha Quirks & new skills', () => {
    const { ws, kb, engineSession } = setupSampleChart();
    try {
      // 1. Level 2 production rules (including kn_rao_patterns.yaml) load & pass lintRules with 0 errors
      const rulesDir = path.join(ROOT_DIR, 'packages/content/rules');
      const { rules } = loadAllRulesFromDir(rulesDir);
      expect(rules.some((r) => r.id === 'kn_rao.debilitated_3_6_8_raja')).toBe(true);
      expect(rules.some((r) => r.id === 'kn_rao.crossover.d1_exalt_d9_debil')).toBe(true);
      const lintIssues = lintRules(rules).filter((i) => i.level === 'error');
      expect(lintIssues).toHaveLength(0);

      // Level 2 evaluation fires K.N. Rao facts cleanly on sample chart
      const strengthConfig = loadStrengthConfig(STRENGTH_PATH);
      const allFindings = evaluateRules(ws, rules, { strengthConfig, contentVersion: '1.0.0', persistToDb: false });
      expect(allFindings.some((f) => f.ruleId === 'kn_rao.drekkana_22')).toBe(true);
      expect(allFindings.some((f) => f.ruleId === 'kn_rao.vainashika_23')).toBe(true);

      // 2. Runtime KB ingestion of kn_rao_principles.yaml
      const knKbPath = path.join(ROOT_DIR, 'packages/content/kb/kn_rao_principles.yaml');
      const ingested = kb.ingestConceptsFile(knKbPath);
      expect(ingested).toBeGreaterThanOrEqual(18);
      const ragHits = kb.searchKnowledge('Double Transit retrograde Ashtakavarga', {}, 5);
      expect(ragHits.some((h) => h.id === 'kn_rao.double_transit_retrograde')).toBe(true);

      // 3. Retrograde Double Transit Extension: Retrograde Jupiter in H2 also aspects from H1 (1, 5, 7, 9)
      const directJup = getTransitEffectiveHousesWithRetro('jupiter', 2, false);
      const retroJup = getTransitEffectiveHousesWithRetro('jupiter', 2, true);
      expect(directJup).not.toContain(1);
      expect(retroJup).toContain(1);
      expect(retroJup).toContain(5);
      expect(retroJup).toContain(9);

      // 4. Laghu/Madhya Parashari Dasha Quirks (Own-AD, Saturn-Venus, Rahu-Venus)
      const satSat = analyzeKnRaoDashaQuirks(engineSession.natal, 'saturn', 'saturn');
      expect(satSat.flags.some((f) => f.includes('Own-AD'))).toBe(true);
      expect(satSat.flags.some((f) => f.includes('Saturn-Venus Quirk'))).toBe(true);
      const rahuVen = analyzeKnRaoDashaQuirks(engineSession.natal, 'rahu', 'venus');
      expect(rahuVen.flags.some((f) => f.includes('Rahu-Venus Extreme Polarity'))).toBe(true);

      // 5. ToolServer inspect_kn_rao_audit (Checklists, Education, Politics, Psychology, Maraka)
      const server = new ToolServer(ws, kb, { maxSteps: 20, maxTokens: 16000 }, engineSession);
      const audit = server.inspect_kn_rao_audit('all');
      expect(audit.items.some((i) => i.id === 'kn_rao.checklist.crossovers')).toBe(true);
      expect(audit.items.some((i) => i.id === 'kn_rao.checklist.drekkana_vainashika')).toBe(true);
      expect(audit.items.some((i) => i.id === 'kn_rao.maraka_hierarchy')).toBe(true);
      expect(audit.items.some((i) => i.id === 'kn_rao.education_formula')).toBe(true);
      expect(audit.items.some((i) => i.id === 'kn_rao.political_profile')).toBe(true);
      expect(audit.items.some((i) => i.id === 'kn_rao.astro_psychology')).toBe(true);

      // 6. Skill routing for new K.N. Rao skills (Political & Astro-Psychology)
      expect(AGENT_SKILLS.length).toBeGreaterThanOrEqual(18);
      expect(routeSkills('Should I run for election or enter politics?', 'career', 'decision').primarySkill.id).toBe(
        'political_public_life',
      );
      expect(
        routeSkills('Why am I feeling so emotionally overwhelmed and anxious about family conflict?', 'home_family', 'reflective')
          .primarySkill.id,
      ).toBe('astro_psychology_counseling');
    } finally {
      kb.close();
      ws.close();
    }
  });

  it('verifies D5/D6/D8/D11 Vargas, PVR Ex. 29-30 Bhava & Graha Arudhas, and Tajaka PVB/Varsha Narayana/Monthly/60-Hr engines', async () => {
    // 1. All 20 Vargas & PVR Examples 11-26 spot checks
    expect(VARGA_TYPES).toHaveLength(20);
    // Mercury 11° Ge (lon=71) -> D6=Ge(2), D11=Ge(2)
    expect(calculateVargaSign(71, 'D6')).toBe(2);
    expect(calculateVargaSign(71, 'D11')).toBe(2);
    // Jupiter 19° Sc (lon=229) -> D6=Cp(9), D11=Pi(11)
    expect(calculateVargaSign(229, 'D6')).toBe(9);
    expect(calculateVargaSign(229, 'D11')).toBe(11);
    // D5 Panchamsha odd (Ar 0°->Ar(0), 7°->Aq(10)) & even (Ta 0°->Ta(1), 7°->Vi(5))
    expect(calculateVargaSign(2, 'D5')).toBe(0);
    expect(calculateVargaSign(7, 'D5')).toBe(10);
    expect(calculateVargaSign(32, 'D5')).toBe(1);
    expect(calculateVargaSign(37, 'D5')).toBe(5);
    // D8 Ashtamsha movable (Ar->Ar), fixed (Ta->Sg(8)), dual (Ge->Le(4))
    expect(calculateVargaSign(1, 'D8')).toBe(0);
    expect(calculateVargaSign(31, 'D8')).toBe(8);
    expect(calculateVargaSign(61, 'D8')).toBe(4);

    // 2. PVR Chart 1 (Ex. 29 Bhava Arudhas & Ex. 30 Graha Arudhas) exact verification
    // Asc=Vi(5), Sun/Merc/Ven=Pi(11), Jup/Mars/Sat=Ar(0), Moon=Ge(2), Rahu=Cn(3), Ketu=Cp(9)
    const chart1: ChartSignState = {
      lagnaSignIndex: 5,
      planetSigns: {
        sun: 11,
        moon: 2,
        mars: 0,
        mercury: 11,
        jupiter: 0,
        venus: 11,
        saturn: 0,
        rahu: 3,
        ketu: 9,
      },
      planetDegs: {
        sun: 10,
        moon: 12,
        mars: 15,
        mercury: 18,
        jupiter: 20,
        venus: 22,
        saturn: 25,
        rahu: 14,
        ketu: 14,
      },
    };
    const bhavaArudhas = computeBhavaArudhasFromState(chart1);
    const baMap = Object.fromEntries(bhavaArudhas.map((a) => [a.code, a.arudhaSign]));
    expect(baMap).toEqual({
      AL: 'gemini',
      A2: 'leo',
      A3: 'virgo',
      A4: 'leo',
      A5: 'aries',
      A6: 'gemini',
      A7: 'taurus',
      A8: 'capricorn',
      A9: 'capricorn',
      A10: 'virgo',
      A11: 'taurus',
      UL: 'libra',
    });

    const grahaArudhas = computeGrahaArudhasFromState(chart1);
    const gaMap = Object.fromEntries(grahaArudhas.map((g) => [g.planet, g.arudhaSign]));
    expect(gaMap).toEqual({
      sun: 'capricorn',
      moon: 'leo',
      mars: 'capricorn',
      mercury: 'gemini',
      jupiter: 'aquarius',
      venus: 'taurus',
      saturn: 'cancer',
      rahu: 'virgo',
      ketu: 'virgo',
    });
    // Mathematical invariant: Rahu and Ketu always share the exact same Graha Arudha
    expect(gaMap.rahu).toBe(gaMap.ketu);

    // 3. PVR Table 72 Hadda Lords & Ch. 28.4.2 Jupiter Uchcha Bala check
    expect(getHaddaLord(0, 3)).toBe('jupiter');  // Ar 0-6 -> Jupiter
    expect(getHaddaLord(1, 10)).toBe('mercury'); // Ta 8-14 -> Mercury
    expect(getHaddaLord(6, 25)).toBe('venus');   // Li 21-28 -> Venus
    expect(getHaddaLord(11, 29)).toBe('saturn'); // Pi 28-30 -> Saturn

    const { ws, kb, engineSession } = setupSampleChart();
    try {
      const server = new ToolServer(ws, kb, { maxSteps: 20, maxTokens: 20000 }, engineSession);

      // 4. Varga Arudhas (D10) + Graha Arudhas via ToolServer
      const d10Arudhas = server.inspect_arudhas(undefined, 'D10', true);
      expect(d10Arudhas.items.some((i) => i.id === 'arudha.d10.al')).toBe(true);
      expect(d10Arudhas.items.some((i) => i.id === 'arudha.d10.a10')).toBe(true);
      expect(d10Arudhas.items.some((i) => i.id === 'arudha.d10.al.diagnostics')).toBe(true);
      const venGrahaArudha = server.inspect_arudhas('venus', 'D1', true);
      expect(venGrahaArudha.items.some((i) => i.id === 'graha_arudha.d1.venus')).toBe(true);

      // 5. Inspect D5, D6, D8, D11 via inspect_varga
      expect(server.inspect_varga('D5').items.length).toBe(9);
      expect(server.inspect_varga('D6').items.length).toBe(9);
      expect(server.inspect_varga('D8').items.length).toBe(9);
      expect(server.inspect_varga('D11').items.length).toBe(9);

      // 6. Annual Varshaphal PVB + DVB + Varsha Narayana Dasa (D1 & D9)
      const rawV = await engineSession.getVarshaphal(2026);
      const pvb = computePanchaVargeeyaBala(rawV.annualChart);
      expect(Object.keys(pvb)).toHaveLength(7);
      for (const item of Object.values(pvb)) {
        expect(item.pvb).toBeGreaterThan(0);
        expect(item.pvb).toBeLessThanOrEqual(25);
        expect(item.dvb).toBeGreaterThanOrEqual(-12);
        expect(item.dvb).toBeLessThanOrEqual(12);
      }

      const vnD1 = computeVarshaNarayanaDasa(rawV, 'D1');
      const totalVnDays = vnD1.periods.reduce((s, p) => s + p.days, 0);
      expect(totalVnDays).toBeGreaterThan(360);
      expect(totalVnDays).toBeLessThan(370);

      const annualRes = await server.inspect_varshaphal(2026, 'annual', undefined, 'D9');
      expect(annualRes.items.some((i) => i.id === 'varshaphal.2026.pvb')).toBe(true);
      expect(annualRes.items.some((i) => i.id === 'varshaphal.2026.varsha_narayana.d9')).toBe(true);

      // 7. Tajaka Monthly (Maasa Pravesh, ~30.4 days) & 60-Hour (Shashti-Hora, ~2.5 days)
      const monthly = await server.inspect_varshaphal(2026, 'monthly', '2026-06-15');
      expect(monthly.items.some((i) => i.id === 'tajaka.monthly.2026-06-15.overview')).toBe(true);
      expect(monthly.items.some((i) => i.id === 'tajaka.monthly.2026-06-15.pvb')).toBe(true);
      expect(monthly.items.some((i) => i.id === 'tajaka.monthly.2026-06-15.patyayini')).toBe(true);

      const hr60Entry = await engineSession.getTajakaEntryChart('60hr', '2026-06-15');
      expect(hr60Entry.durationDays).toBeGreaterThan(2.2);
      expect(hr60Entry.durationDays).toBeLessThan(2.8);
      const hr60Res = await server.inspect_varshaphal(2026, '60hr', '2026-06-15');
      expect(hr60Res.items.some((i) => i.id === 'tajaka.60hr.2026-06-15.overview')).toBe(true);
      expect(hr60Res.items.some((i) => i.id === 'tajaka.60hr.2026-06-15.patyayini')).toBe(true);
    } finally {
      kb.close();
      ws.close();
    }
  });

  it('verifies R-20 Mehta/K.N. Rao Tri-Pataki (Nehru 1946-47), Dual-School PVB, Moon Disqualification, Annual Yogini & KB RAG', async () => {
    // 1. J.L. Nehru 1946-47 Tri-Pataki Chakra exact verification (R-20 Sec. 6: Completed 57 yrs, Y = 58, Aq Lagna)
    const nehruBirthSigns = {
      sun: 7,     // Sc
      moon: 3,    // Cn
      mars: 5,    // Vi
      mercury: 6, // Li
      jupiter: 8, // Sg
      venus: 6,   // Li
      saturn: 4,  // Le
      rahu: 2,    // Ge
      ketu: 8,    // Sg
    };
    const tp = computeTriPatakiFromSigns(nehruBirthSigns, 10, 57); // Annual Lagna = Aq (10), completedAge = 57 -> Y = 58
    expect(tp.runningYear).toBe(58);
    const projMap = Object.fromEntries(tp.projections.map((p) => [p.planet, p.projectedSign]));
    expect(projMap).toEqual({
      moon: 'libra',
      sun: 'sagittarius',
      mercury: 'scorpio',
      venus: 'scorpio',
      jupiter: 'capricorn',
      saturn: 'virgo',
      mars: 'sagittarius',
      rahu: 'pisces',
      ketu: 'virgo',
    });
    // Benefic Vedha of Merc + Ven on Annual Lagna (Aq) from H10 (Sc)
    const lagnaVedhaPlanets = tp.lagnaVedha.map((v) => v.planet);
    expect(lagnaVedhaPlanets).toContain('mercury');
    expect(lagnaVedhaPlanets).toContain('venus');
    // Rahu (Pi, H2) + Saturn & Ketu (Vi, H8) cast Vedha on Tri-Pataki Moon (Li, H9)
    const moonVedhaPlanets = tp.moonVedha.map((v) => v.planet);
    expect(moonVedhaPlanets).toContain('rahu');
    expect(moonVedhaPlanets).toContain('saturn');
    expect(moonVedhaPlanets).toContain('ketu');

    // 2. Table 20B Tajaka Sequential Drekkana Lords
    expect(getTajakaSequentialDrekkanaLord(0, 5)).toBe('mars');
    expect(getTajakaSequentialDrekkanaLord(1, 5)).toBe('mercury');
    expect(getTajakaSequentialDrekkanaLord(2, 5)).toBe('jupiter');
    expect(getTajakaSequentialDrekkanaLord(11, 25)).toBe('mars');

    // 3. Dual-school Varshaphal, Annual Yogini Dasa, Moon Disqualification & KB RAG
    const { ws, kb, engineSession } = setupSampleChart();
    try {
      const tajakaKbPath = path.resolve(process.cwd(), 'packages/content/kb/tajaka_advanced_principles.yaml');
      kb.ingestConceptsFile(tajakaKbPath);
      const tpHits = kb.searchKnowledge('Tri-Pataki Chakra Vedha', {}, 5);
      expect(tpHits.some((h) => h.id === 'tajaka_r20.tri_pataki_chakra')).toBe(true);
      const djHits = kb.searchKnowledge('Dwi-Janma Year Second Birth', {}, 5);
      expect(djHits.some((h) => h.id === 'tajaka_r20.dwi_janma_year')).toBe(true);

      const rawV = await engineSession.getVarshaphal(2026);
      const yog = computeAnnualYoginiDasa(engineSession.natal, rawV);
      const yogDays = yog.reduce((s, p) => s + p.days, 0);
      expect(yogDays).toBeGreaterThan(363);
      expect(yogDays).toBeLessThan(367);

      const neelPvb = computeNeelakanthaPvb(rawV.annualChart);
      expect(Object.keys(neelPvb)).toHaveLength(7);

      // Moon Disqualification unit test: Moon artificially highest PVB on Aries Lagna (non-Cancer, daytime) -> skipped!
      const mockPvb = { ...neelPvb };
      mockPvb.moon = { ...neelPvb.moon!, vishwaBala: 19.5, band: 'Prakarmi' };
      mockPvb.mars = { ...neelPvb.mars!, vishwaBala: 16.5, band: 'Prakarmi' };
      // Ensure both Moon and Mars aspect Aries (0) via Leo (4) and Sagittarius (8)
      const mockChart = {
        ...rawV.annualChart,
        grahas: {
          ...rawV.annualChart.grahas,
          moon: { ...rawV.annualChart.grahas.moon, signIndex: 4 },
          mars: { ...rawV.annualChart.grahas.mars, signIndex: 8 },
        },
      };
      const disqual = selectNeelakanthaVarsheshwara(
        mockChart,
        0, // Aries Lagna (not Cancer)
        true, // Daytime
        {
          dinaRatriPati: 'moon',
          janmaLagnesha: 'mars',
          munthaLord: 'mars',
          varshaLagnesha: 'mars',
          triRasheesha: 'sun',
        },
        mockPvb,
        [],
      );
      expect(disqual.moonDisqualified).toBe(true);
      expect(disqual.lord).toBe('mars');

      // Moon Exception 1: Cancer (3) rises with Moon in Cancer (3) and highest PVB -> Moon IS allowed!
      const cancerChart = {
        ...mockChart,
        grahas: { ...mockChart.grahas, moon: { ...mockChart.grahas.moon, signIndex: 3 } },
      };
      const allowedMoon = selectNeelakanthaVarsheshwara(
        cancerChart,
        3, // Cancer Lagna
        true,
        {
          dinaRatriPati: 'moon',
          janmaLagnesha: 'mars',
          munthaLord: 'mars',
          varshaLagnesha: 'moon',
          triRasheesha: 'venus',
        },
        mockPvb,
        [],
      );
      expect(allowedMoon.moonDisqualified).toBe(false);
      expect(allowedMoon.lord).toBe('moon');
      expect(allowedMoon.moonExceptionUsed).toContain('Exception 1');

      // Dual-school ToolServer integration (school = 'both' default)
      const server = new ToolServer(ws, kb, { maxSteps: 20, maxTokens: 20000 }, engineSession);
      const dualRes = await server.inspect_varshaphal(2026, 'annual', undefined, 'D1', 'both');
      expect(dualRes.items.some((i) => i.id === 'varshaphal.2026.tri_pataki')).toBe(true);
      expect(dualRes.items.some((i) => i.id === 'varshaphal.2026.dwi_janma_muntha')).toBe(true);
      expect(dualRes.items.some((i) => i.id === 'varshaphal.2026.crisis_antidotes_delivery')).toBe(true);
      expect(dualRes.items.some((i) => i.id === 'varshaphal.2026.saham_audit')).toBe(true);
      expect(dualRes.items.some((i) => i.id === 'varshaphal.2026.annual_yogini')).toBe(true);
      const pvbItem = dualRes.items.find((i) => i.id === 'varshaphal.2026.pvb');
      expect(pvbItem?.text).toContain('PVR');
      expect(pvbItem?.text).toContain('Neelakantha');
    } finally {
      kb.close();
      ws.close();
    }
  });
});
