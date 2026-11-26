import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  calculateVargaSign,
  computeArudhaPadas,
  computeAshtakvarga,
  computeAvakahada,
  computeBhavaAnalysis,
  computeCharaDashas,
  computeCharaKarakas,
  computeFavourableAndGhatak,
  computeMutualAspects,
  computePanchang,
  computePlanetaryAvasthas,
  computePositions,
  computeShadbala,
  computeSripatiChalit,
  computeTransits,
  computeUpagrahas,
  computeVimshottariDashas,
  computeYoginiDashas,
  detectYogasAndDoshas,
  julianDayUt,
  loadEphemeris,
  resolveBirthTime,
  VARGA_TYPES,
} from '@astro/engine';
import { buildChartWorkspace, PLANET_IDS } from '@astro/facts';
import { buildLevel2Extras } from './level2Extras.js';
import {
  evaluateRules,
  loadAllRulesFromDir,
  loadStrengthConfig,
  renderHouse,
  renderPeriod,
  renderPlanet,
  type DetailLevel,
} from '@astro/rules';
import { createKnowledgeBase } from '@astro/kb';
import {
  createAnthropicCompatibleLlmClient,
  createOpenAiCompatibleLlmClient,
  type LlmClient,
} from '@astro/agent';
import { createAppDatabase } from './db.js';
import { AppRouter } from './router/router.js';
import type { ServerContext } from './types.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerProfileRoutes } from './routes/profiles.js';
import { registerReadingRoutes } from './routes/reading.js';
import { registerChatRoutes } from './routes/chat.js';
import { registerJournalRoutes } from './routes/journal.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../../..');
const DB_PATH = process.env.DB_PATH || path.join(ROOT_DIR, 'data/myastro.db');
const STRENGTH_PATH = path.join(ROOT_DIR, 'packages/content/strength.yaml');
const RULES_DIR = path.join(ROOT_DIR, 'packages/content/rules');
const TOPICS_PATH = path.join(ROOT_DIR, 'packages/content/topics/topics.yaml');
const CONCEPTS_PATH = path.join(ROOT_DIR, 'packages/content/kb/concepts.yaml');
const LORE_PATH = path.join(ROOT_DIR, 'packages/content/kb/jyotish_lore.yaml');
const NAKSHATRAS_PATH = path.join(ROOT_DIR, 'packages/content/kb/nakshatras.yaml');
const PRINCIPLES_PATH = path.join(ROOT_DIR, 'packages/content/kb/yogas_and_principles.yaml');
const MEDICAL_PATH = path.join(ROOT_DIR, 'packages/content/kb/medical_astrology.yaml');
const MUHURTA_KB_PATH = path.join(ROOT_DIR, 'packages/content/kb/muhurta_principles.yaml');
const KN_RAO_KB_PATH = path.join(ROOT_DIR, 'packages/content/kb/kn_rao_principles.yaml');
const TAJAKA_ADV_KB_PATH = path.join(ROOT_DIR, 'packages/content/kb/tajaka_advanced_principles.yaml');

function canAccessProfile(profile: { userId?: string | null } | null, authUser: { sub: string } | null): boolean {
  if (!profile) return false;
  if (!profile.userId) return true; // unowned local profile
  return Boolean(authUser && authUser.sub === profile.userId);
}

export function createApiServer() {
  const appDb = createAppDatabase(DB_PATH);
  const strengthConfig = loadStrengthConfig(STRENGTH_PATH);
  const { rules, version } = loadAllRulesFromDir(RULES_DIR);

  const kb = createKnowledgeBase(':memory:');
  kb.ingestTopicsFile(TOPICS_PATH);
  kb.ingestConceptsFile(CONCEPTS_PATH);
  kb.ingestConceptsFile(LORE_PATH);
  kb.ingestConceptsFile(NAKSHATRAS_PATH);
  kb.ingestConceptsFile(PRINCIPLES_PATH);
  kb.ingestConceptsFile(MEDICAL_PATH);
  kb.ingestConceptsFile(MUHURTA_KB_PATH);
  kb.ingestConceptsFile(KN_RAO_KB_PATH);
  kb.ingestConceptsFile(TAJAKA_ADV_KB_PATH);

  const defaultProvider = (process.env.EPHEMERIS_PROVIDER || 'swisseph') as any;
  const serverEphMap = new Map<string, any>();

  const getServerEphemeris = async (requestedProvider?: string) => {
    const pid = requestedProvider || defaultProvider;
    let eph = serverEphMap.get(pid);
    if (!eph) {
      try {
        eph = await loadEphemeris(pid);
        serverEphMap.set(pid, eph);
        console.log(`[API Ephemeris] Initialized primary provider: ${eph.id} (${eph.version})`);
      } catch (err: any) {
        console.warn(`[API Ephemeris] Failed to initialize ${pid}: ${err?.message}. Falling back to astronomy-engine.`);
        eph = await loadEphemeris('astronomy-engine');
        serverEphMap.set(pid, eph);
      }
    }
    return eph;
  };

  const getLlmClient = (): LlmClient => {
    const anthropicToken = process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY;
    const anthropicUrl = process.env.ANTHROPIC_BASE_URL;
    if (anthropicToken && anthropicUrl) {
      return createAnthropicCompatibleLlmClient({
        baseUrl: anthropicUrl,
        authToken: anthropicToken,
        model: process.env.ANTHROPIC_MODEL || 'deepseek-flash',
      });
    }

    const apiKey = process.env.LLM_API_KEY;
    if (!apiKey) {
      return {
        async runAgentTurn() {
          throw new Error('No LLM credentials configured (set ANTHROPIC_AUTH_TOKEN + ANTHROPIC_BASE_URL or LLM_API_KEY)');
        },
      };
    }
    return createOpenAiCompatibleLlmClient({
      baseUrl: process.env.LLM_BASE_URL ?? 'https://api.openai.com/v1',
      apiKey,
      model: process.env.LLM_MODEL ?? 'gpt-4o-mini',
    });
  };

  const aggregateLevel1And2 = async (profile: any, providedLevel1?: any) => {
    let level1 = providedLevel1;

    if (!level1?.natal) {
      const eph = await getServerEphemeris();
      const timeRes = resolveBirthTime({
        date: profile.birthDate,
        time: profile.birthTime,
        tzId: profile.tzId,
        placeName: profile.cityName,
        lat: Number(profile.lat),
        lon: Number(profile.lon),
        timeCertainty: profile.timeCertainty ?? 'exact',
      });
      if (!timeRes.success) throw new Error(timeRes.message);

      const natal = computePositions(
        eph,
        timeRes.resolved,
        { name: profile.cityName, lat: Number(profile.lat), lon: Number(profile.lon) },
        { ayanamsa: profile.ayanamsa ?? 'lahiri', nodeType: 'mean' },
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
      const m = natal.grahas.moon;
      const dashas = computeVimshottariDashas(m.nakshatraIndex, m.elapsedInNakshatra, timeRes.resolved.birthLocal, 3);
      const yogini = computeYoginiDashas(m.nakshatraIndex, m.elapsedInNakshatra, timeRes.resolved.birthLocal);
      const chara = computeCharaDashas(natal.lagna?.signIndex ?? 0, timeRes.resolved.birthLocal, natal.grahas);
      const chalit = natal.lagna
        ? computeSripatiChalit(natal.lagna.lon, natal.mc?.lon ?? (natal.lagna.lon + 270) % 360)
        : null;
      const now = new Date();
      const nowJd = julianDayUt(
        now.getUTCFullYear(),
        now.getUTCMonth() + 1,
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds(),
      );
      const transits = computeTransits(
        eph,
        nowJd,
        natal.lagna?.signIndex ?? 0,
        m.signIndex,
        ashtakvarga.bhinna,
        ashtakvarga.prastara,
      );
      const avakahada = computeAvakahada(m.nakshatraIndex, m.signIndex);
      const localDow = new Date(`${profile.birthDate}T12:00:00Z`).getUTCDay();
      const panchang = computePanchang(natal.grahas.sun.lon, m.lon, Number.isFinite(localDow) ? localDow : 0);
      const yogas = detectYogasAndDoshas(natal);
      const karakas = computeCharaKarakas(natal.grahas);
      const ghatak = computeFavourableAndGhatak(m.signIndex, Number(timeRes.resolved.birthLocal.slice(0, 4)) || undefined);
      const aspects = computeMutualAspects(natal.grahas);
      const avasthas = computePlanetaryAvasthas(natal.grahas);
      const bhavas = computeBhavaAnalysis(natal, transits, ashtakvarga.sarva);
      const arudhas = computeArudhaPadas(natal);
      const upagrahas = computeUpagrahas(natal);

      // Precompute all harmonic divisional charts (D1..D60) on server once
      const vargas: Record<string, { lagnaSignIndex: number; grahas: Record<string, number> }> = {};
      for (const v of VARGA_TYPES) {
        const vLagna = natal.lagna ? calculateVargaSign(natal.lagna.lon, v) : 0;
        const vGrahas: Record<string, number> = {};
        for (const [id, g] of Object.entries(natal.grahas)) {
          vGrahas[id] = calculateVargaSign(g.lon, v);
        }
        vargas[v] = { lagnaSignIndex: vLagna, grahas: vGrahas };
      }

      level1 = {
        natal,
        vargas,
        panchang,
        shadbala,
        ashtakvarga,
        dashas,
        yogini,
        chara,
        chalit,
        transits,
        avakahada,
        yogas,
        karakas,
        ghatak,
        aspects,
        avasthas,
        bhavas,
        arudhas,
        upagrahas,
      };
    } else if (!level1.transits && level1.natal) {
      const eph = await getServerEphemeris();
      const av = level1.ashtakvarga ?? computeAshtakvarga({
        sun: level1.natal.grahas.sun.signIndex,
        moon: level1.natal.grahas.moon.signIndex,
        mars: level1.natal.grahas.mars.signIndex,
        mercury: level1.natal.grahas.mercury.signIndex,
        jupiter: level1.natal.grahas.jupiter.signIndex,
        venus: level1.natal.grahas.venus.signIndex,
        saturn: level1.natal.grahas.saturn.signIndex,
        lagna: level1.natal.lagna?.signIndex ?? 0,
      });
      const now = new Date();
      const nowJd = julianDayUt(
        now.getUTCFullYear(),
        now.getUTCMonth() + 1,
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds(),
      );
      level1.transits = computeTransits(
        eph,
        nowJd,
        level1.natal.lagna?.signIndex ?? 0,
        level1.natal.grahas.moon.signIndex,
        av.bhinna,
        av.prastara,
      );
    }

    const ws = buildChartWorkspace({
      natal: level1.natal,
      shadbala: level1.shadbala ?? null,
      ashtakvarga: level1.ashtakvarga ?? null,
      dashas: level1.dashas ?? null,
      transits: level1.transits ?? null,
      avasthas: level1.avasthas ?? null,
    });

    try {
      const findings = evaluateRules(ws, rules, {
        strengthConfig,
        contentVersion: version,
        persistToDb: true,
      });

      const ephForExtras = await getServerEphemeris().catch(() => null);
      const extras = buildLevel2Extras(level1, ephForExtras);

      const buildDetail = (lvl: DetailLevel) => {
        const dashaReadings = ['maha', 'antar', 'pratyantar']
          .map((k) => ws.getFact(`dasha.current.${k}`))
          .filter(Boolean)
          .map((f) => {
            const pRow = ws.db
              .prepare('SELECT id FROM period WHERE lord = ? AND start_utc = ?')
              .get(String(f!.value), String(f!.args.startUtc)) as { id: string } | undefined;
            return pRow ? renderPeriod(pRow.id, ws, findings, lvl) : null;
          })
          .filter(Boolean);

        const tr = level1.transits;

        return {
          overview: extras.overview,
          houses: Array.from({ length: 12 }, (_, idx) => renderHouse(idx + 1, ws, findings, lvl)),
          planets: PLANET_IDS.map((p) => renderPlanet(p, ws, findings, lvl)),
          dashas: dashaReadings,
          transits: {
            sadeSati: tr?.sadeSati ?? null,
            planets: extras.transitReadings,
          },
          yogas: extras.yogas,
          strengths: extras.strengths,
          specials: extras.specials,
          panchang: extras.panchangReadings,
          extendedDashas: extras.extendedDashas,
          kundliExtras: extras.kundliExtras,
        };
      };

      const level2 = {
        findingsCount: findings.length,
        simple: buildDetail('simple'),
        standard: buildDetail('standard'),
        detailed: buildDetail('detailed'),
      };

      return { level1, level2 };
    } finally {
      ws.close();
    }
  };

  const context: ServerContext = {
    appDb,
    getServerEphemeris,
    rules,
    rulesVersion: version,
    strengthConfig,
    kb,
    getLlmClient,
    aggregateLevel1And2,
    canAccessProfile,
  };

  const router = new AppRouter();

  registerHealthRoutes(router, context);
  registerAuthRoutes(router, context);
  registerProfileRoutes(router, context);
  registerReadingRoutes(router, context);
  registerChatRoutes(router, context);
  registerJournalRoutes(router, context);

  return http.createServer(router.handle);
}

export function startServer(port = Number(process.env.PORT || 3001), dbPath = DB_PATH) {
  const server = createApiServer();
  server.listen(port, () => {
    console.log(`[MyAstro API] running on http://localhost:${port} (db: ${dbPath})`);
  });
  return server;
}
