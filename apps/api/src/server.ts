import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildDay,
  buildMonth,
  buildYear,
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
  computeVarshaphal,
  computeVimshottariDashas,
  computeYoginiDashas,
  createNatalDigest,
  detectYogasAndDoshas,
  julianDayUt,
  loadEphemeris,
  resolveBirthTime,
} from '@astro/engine';
import { buildChartWorkspace, PLANET_IDS, type ChartWorkspaceInput } from '@astro/facts';
import { buildLevel2Extras } from './level2Extras.js';
import { extractAuthUser, signJwt, verifyGoogleIdToken } from './auth.js';
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
import { EngineSession } from '@astro/tools';
import {
  createAnthropicCompatibleLlmClient,
  createOpenAiCompatibleLlmClient,
  runAgentQuery,
  type LlmClient,
} from '@astro/agent';
import { createAppDatabase } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../../..');
const DB_PATH = path.join(ROOT_DIR, 'data/myastro.db');
const STRENGTH_PATH = path.join(ROOT_DIR, 'packages/content/strength.yaml');
const RULES_DIR = path.join(ROOT_DIR, 'packages/content/rules');
const TOPICS_PATH = path.join(ROOT_DIR, 'packages/content/topics/topics.yaml');
const CONCEPTS_PATH = path.join(ROOT_DIR, 'packages/content/kb/concepts.yaml');
const LORE_PATH = path.join(ROOT_DIR, 'packages/content/kb/jyotish_lore.yaml');
const NAKSHATRAS_PATH = path.join(ROOT_DIR, 'packages/content/kb/nakshatras.yaml');
const PRINCIPLES_PATH = path.join(ROOT_DIR, 'packages/content/kb/yogas_and_principles.yaml');

function readJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(JSON.stringify(body));
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

  let serverEph: any = null;
  const getServerEphemeris = async () => {
    if (!serverEph) serverEph = await loadEphemeris('astronomy-engine');
    return serverEph;
  };

  const getLlmClient = (): LlmClient => {
    const anthropicToken = process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY;
    const anthropicUrl = process.env.ANTHROPIC_BASE_URL;
    if (anthropicToken && anthropicUrl) {
      return createAnthropicCompatibleLlmClient({
        baseUrl: anthropicUrl,
        authToken: anthropicToken,
        model: process.env.ANTHROPIC_MODEL || 'deepseek-chat',
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
      const chara = computeCharaDashas(natal.lagna?.signIndex ?? 0, timeRes.resolved.birthLocal);
      const chalit = natal.lagna ? computeSripatiChalit(natal.lagna.lon, (natal.lagna.lon + 270) % 360) : null;
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

      level1 = {
        natal,
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

  return http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, If-None-Match',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      });
      res.end();
      return;
    }

    const authUser = extractAuthUser(req);
    const rawUrl = req.url ?? '/';
    const [pathname, queryStr] = rawUrl.split('?');
    const queryParams = new URLSearchParams(queryStr ?? '');
    const url = pathname || '/';

    if (req.method === 'GET' && url === '/health') {
      sendJson(res, 200, {
        ok: true,
        service: 'myastro-api',
        architecture: 'approach2-static-bundle-daily-delta',
        levels: [1, 2, 3],
        rulesCount: rules.length,
        topicsCount: kb.topics.length,
        profilesCount: appDb.listProfiles().length,
      });
      return;
    }

    // --- Google OAuth 2.0 Sign-In ---
    if (req.method === 'POST' && url === '/api/auth/google') {
      try {
        const body = await readJsonBody(req);
        let identity: { googleSub: string; email: string; name: string; picture?: string };
        if (body.idToken) {
          identity = await verifyGoogleIdToken(String(body.idToken));
        } else if (process.env.ALLOW_DEV_AUTH === 'true' && body.devEmail) {
          identity = {
            googleSub: `dev_${String(body.devEmail).replace(/[^a-z0-9]/gi, '_')}`,
            email: String(body.devEmail),
            name: String(body.devName || 'Dev User'),
          };
        } else {
          sendJson(res, 400, { error: 'Missing Google idToken' });
          return;
        }
        const user = appDb.upsertUser(identity);
        const token = signJwt({ sub: user.id, email: user.email, name: user.name });
        const profiles = appDb.listProfilesForUser(user.id);
        sendJson(res, 200, { token, user, profiles });
      } catch (err: any) {
        sendJson(res, 401, { error: err?.message ?? 'Google authentication failed' });
      }
      return;
    }

    // --- Profiles & Aggregated Snapshots ---
    if (req.method === 'GET' && url === '/api/profiles') {
      const profiles = authUser ? appDb.listProfilesForUser(authUser.sub) : appDb.listProfiles();
      sendJson(res, 200, { profiles });
      return;
    }

    if (req.method === 'POST' && url === '/api/profiles') {
      try {
        const body = await readJsonBody(req);
        const id =
          body.id ||
          `${String(body.name || 'native').toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${body.birthDate}_${String(body.birthTime).replace(/:/g, '')}`;

        const profile = {
          id,
          userId: authUser?.sub ?? null,
          name: String(body.name || 'Native'),
          birthDate: String(body.birthDate),
          birthTime: String(body.birthTime),
          tzId: String(body.tzId || 'UTC'),
          cityName: String(body.cityName || 'Unknown'),
          lat: Number(body.lat),
          lon: Number(body.lon),
          timeCertainty: String(body.timeCertainty || 'exact'),
          ayanamsa: String(body.ayanamsa || 'lahiri'),
          isActive: body.isActive ?? true,
        };

        appDb.upsertProfile(profile);
        const { level1, level2 } = await aggregateLevel1And2(profile, body.level1);
        appDb.saveSnapshot(id, level1, level2);

        sendJson(res, 200, {
          profile: appDb.getProfile(id),
          dashboard: { level1, level2 },
        });
      } catch (err: any) {
        console.error('[POST /api/profiles] error:', err);
        sendJson(res, 400, { error: err?.message ?? 'Failed to save profile' });
      }
      return;
    }

    // --- Static Natal Bundle (1-Time Pull with ETag / 304 Support for Web & Android) ---
    const bundleMatch = url.match(/^\/api\/profiles\/([^/]+)\/bundle$/);
    if (req.method === 'GET' && bundleMatch) {
      const profileId = decodeURIComponent(bundleMatch[1]!);
      const profile = appDb.getProfile(profileId);
      if (!profile) {
        sendJson(res, 404, { error: 'Profile not found' });
        return;
      }
      const etag = `"bundle-${profile.id}-v${profile.bundleVersion ?? 1}"`;
      if (req.headers['if-none-match'] === etag) {
        res.writeHead(304, {
          'Access-Control-Allow-Origin': '*',
          ETag: etag,
          'Cache-Control': 'private, max-age=86400',
        });
        res.end();
        return;
      }
      let snap = appDb.getSnapshot(profileId);
      if (!snap) {
        const agg = await aggregateLevel1And2(profile);
        appDb.saveSnapshot(profileId, agg.level1, agg.level2);
        snap = appDb.getSnapshot(profileId);
      }
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        ETag: etag,
        'Cache-Control': 'private, max-age=86400',
      });
      res.end(
        JSON.stringify({
          profile,
          bundleVersion: profile.bundleVersion ?? 1,
          computedAt: snap!.computedAt,
          level1Static: snap!.level1,
          level2Static: snap!.level2,
        }),
      );
      return;
    }

    // --- Lightweight Daily Sky Payload (~4 KB, fetched once per day on Web & Android) ---
    const todayMatch = url.match(/^\/api\/profiles\/([^/]+)\/today$/);
    if (req.method === 'GET' && todayMatch) {
      try {
        const profileId = decodeURIComponent(todayMatch[1]!);
        const profile = appDb.getProfile(profileId);
        if (!profile) {
          sendJson(res, 404, { error: 'Profile not found' });
          return;
        }
        let snap = appDb.getSnapshot(profileId);
        if (!snap) {
          const agg = await aggregateLevel1And2(profile);
          appDb.saveSnapshot(profileId, agg.level1, agg.level2);
          snap = appDb.getSnapshot(profileId);
        }
        const dateStr = queryParams.get('date') || new Date().toISOString().slice(0, 10);
        const tz = queryParams.get('tzId') || profile.tzId || 'Asia/Kolkata';
        const qLat = queryParams.get('lat');
        const qLon = queryParams.get('lon');
        const eph = await getServerEphemeris();
        const baseDigest = createNatalDigest(snap!.level1.natal);
        const digest = {
          ...baseDigest,
          ...(qLat !== null && Number.isFinite(Number(qLat)) ? { lat: Number(qLat) } : {}),
          ...(qLon !== null && Number.isFinite(Number(qLon)) ? { lon: Number(qLon) } : {}),
        };
        const activeDashasList = snap!.level2?.standard?.dashas ?? [];
        const scoringOpts = {
          ...(activeDashasList[0]?.lord ? { runningMahadashaLord: activeDashasList[0].lord } : {}),
          ...(activeDashasList[1]?.lord ? { runningAntardashaLord: activeDashasList[1].lord } : {}),
          ...(Array.isArray(snap!.level1.ashtakvarga?.sarva) ? { natalSarvaAshtakvarga: snap!.level1.ashtakvarga.sarva } : {}),
        };
        const dayView = buildDay(eph, digest, dateStr, tz, scoringOpts);
        const dt = new Date(`${dateStr}T12:00:00Z`);
        const jd = julianDayUt(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate(), 12, 0, 0);
        const transits = computeTransits(
          eph,
          jd,
          snap!.level1.natal.lagna?.signIndex ?? 0,
          snap!.level1.natal.grahas.moon.signIndex,
          snap!.level1.ashtakvarga?.bhinna,
        );
        const mv = buildMonth(eph, digest, dt.getUTCFullYear(), dt.getUTCMonth() + 1, tz, scoringOpts);
        const peakDays = [...mv.days].sort((a, b) => b.dayScore - a.dayScore).slice(0, 3);
        const cautionDays = [...mv.days].sort((a, b) => a.dayScore - b.dayScore).slice(0, 3);

        sendJson(res, 200, {
          date: dateStr,
          tzId: tz,
          dayView,
          transits,
          monthPeakSummary: {
            peakDays,
            cautionDays,
            ingressCount: mv.ingressEvents?.length ?? 0,
          },
          activeDashas: activeDashasList,
          extendedDashas: snap!.level2?.standard?.extendedDashas ?? null,
        });
      } catch (err: any) {
        sendJson(res, 400, { error: err?.message ?? 'Failed to compute daily payload' });
      }
      return;
    }

    // --- Server-Side Month/Year Calendar & Date Transits ---
    const calMatch = url.match(/^\/api\/profiles\/([^/]+)\/calendar$/);
    if (req.method === 'GET' && calMatch) {
      try {
        const profileId = decodeURIComponent(calMatch[1]!);
        const profile = appDb.getProfile(profileId);
        if (!profile) {
          sendJson(res, 404, { error: 'Profile not found' });
          return;
        }
        let snap = appDb.getSnapshot(profileId);
        if (!snap) {
          const agg = await aggregateLevel1And2(profile);
          appDb.saveSnapshot(profileId, agg.level1, agg.level2);
          snap = appDb.getSnapshot(profileId);
        }
        const now = new Date();
        const year = Number(queryParams.get('year')) || now.getFullYear();
        const month = Number(queryParams.get('month')) || now.getMonth() + 1;
        const selectedDate = queryParams.get('date') || `${year}-${String(month).padStart(2, '0')}-15`;
        const tz = queryParams.get('tzId') || profile.tzId || 'Asia/Kolkata';

        const eph = await getServerEphemeris();
        const digest = createNatalDigest(snap!.level1.natal);
        const activeDashasList = snap!.level2?.standard?.dashas ?? [];
        const scoringOpts = {
          ...(activeDashasList[0]?.lord ? { runningMahadashaLord: activeDashasList[0].lord } : {}),
          ...(activeDashasList[1]?.lord ? { runningAntardashaLord: activeDashasList[1].lord } : {}),
          ...(Array.isArray(snap!.level1.ashtakvarga?.sarva) ? { natalSarvaAshtakvarga: snap!.level1.ashtakvarga.sarva } : {}),
        };
        const monthData = buildMonth(eph, digest, year, month, tz, scoringOpts);
        const yearData = buildYear(eph, digest, year, tz, scoringOpts);
        const dt = new Date(`${selectedDate}T12:00:00Z`);
        const jd = julianDayUt(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate(), 12, 0, 0);
        const transits = computeTransits(
          eph,
          jd,
          snap!.level1.natal.lagna?.signIndex ?? 0,
          snap!.level1.natal.grahas.moon.signIndex,
          snap!.level1.ashtakvarga?.bhinna,
        );
        sendJson(res, 200, { year, month, selectedDate, monthData, yearData, transits });
      } catch (err: any) {
        sendJson(res, 400, { error: err?.message ?? 'Failed to compute calendar' });
      }
      return;
    }

    // --- Server-Side Varshaphal, Arudha Padas & Upagrahas ---
    const varshaMatch = url.match(/^\/api\/profiles\/([^/]+)\/varshaphal$/);
    if (req.method === 'GET' && varshaMatch) {
      try {
        const profileId = decodeURIComponent(varshaMatch[1]!);
        const profile = appDb.getProfile(profileId);
        if (!profile) {
          sendJson(res, 404, { error: 'Profile not found' });
          return;
        }
        let snap = appDb.getSnapshot(profileId);
        if (!snap) {
          const agg = await aggregateLevel1And2(profile);
          appDb.saveSnapshot(profileId, agg.level1, agg.level2);
          snap = appDb.getSnapshot(profileId);
        }
        const targetYear = Number(queryParams.get('year')) || new Date().getUTCFullYear();
        const eph = await getServerEphemeris();
        const natal = snap!.level1.natal;
        const varshaphal = computeVarshaphal(eph, natal, targetYear);
        const arudhas = computeArudhaPadas(natal);
        const upagrahas = computeUpagrahas(natal);
        sendJson(res, 200, { targetYear, varshaphal, arudhas, upagrahas });
      } catch (err: any) {
        sendJson(res, 400, { error: err?.message ?? 'Failed to compute varshaphal' });
      }
      return;
    }

    // --- Two-Way Delta Sync (Journal Entries + Past Life Events) ---
    if (req.method === 'POST' && url === '/api/sync') {
      try {
        const body = await readJsonBody(req);
        const profileId = String(body.profileId || '');
        if (!profileId) {
          sendJson(res, 400, { error: 'profileId is required' });
          return;
        }
        const lastSyncedAt = body.lastSyncedAt ? String(body.lastSyncedAt) : undefined;
        const incomingJournals = Array.isArray(body.journalEntries) ? body.journalEntries : [];
        const incomingEvents = Array.isArray(body.lifeEvents) ? body.lifeEvents : [];

        for (const je of incomingJournals) {
          if (!je?.id) continue;
          appDb.saveJournalEntry({
            id: String(je.id),
            profileId,
            entryDate: String(je.entryDate || je.atUtc?.slice(0, 10) || new Date().toISOString().slice(0, 10)),
            note: String(je.note ?? je.body ?? ''),
            energy: Number(je.energy ?? 3),
            focus: Number(je.focus ?? je.energy ?? 3),
            mood: Number(je.mood ?? 3),
            skySnapshot: je.skySnapshot ?? je.snapshot,
            createdAt: je.createdAt ?? je.atUtc,
            updatedAt: je.updatedAt ?? new Date().toISOString(),
            deleted: Boolean(je.deleted),
          });
        }

        for (const ev of incomingEvents) {
          if (!ev?.id) continue;
          appDb.upsertLifeEvent({
            id: String(ev.id),
            profileId,
            userId: authUser?.sub ?? null,
            title: String(ev.title || ''),
            eventDate: String(ev.eventDate || ev.date || ''),
            category: String(ev.category || 'career'),
            updatedAt: ev.updatedAt ?? new Date().toISOString(),
            deleted: Boolean(ev.deleted),
          });
        }

        const serverTime = new Date().toISOString();
        sendJson(res, 200, {
          serverTime,
          journalEntries: appDb.getJournalEntriesSince(profileId, lastSyncedAt),
          lifeEvents: appDb.getLifeEventsSince(profileId, lastSyncedAt),
        });
      } catch (err: any) {
        sendJson(res, 400, { error: err?.message ?? 'Sync failed' });
      }
      return;
    }

    const dashMatch = url.match(/^\/api\/profiles\/([^/]+)\/dashboard$/);
    if (req.method === 'GET' && dashMatch) {
      const profileId = decodeURIComponent(dashMatch[1]!);
      const profile = appDb.getProfile(profileId);
      if (!profile) {
        sendJson(res, 404, { error: 'Profile not found' });
        return;
      }
      let snap = appDb.getSnapshot(profileId);
      if (!snap) {
        const agg = await aggregateLevel1And2(profile);
        appDb.saveSnapshot(profileId, agg.level1, agg.level2);
        snap = appDb.getSnapshot(profileId);
      }
      sendJson(res, 200, { profile, ...snap });
      return;
    }

    // --- Clickable Evidence Chip Inspector ---
    const factMatch = url.match(/^\/api\/facts\/([^/]+)\/(.+)$/);
    if (req.method === 'GET' && factMatch) {
      const profileId = decodeURIComponent(factMatch[1]!);
      const factId = decodeURIComponent(factMatch[2]!);
      const snap = appDb.getSnapshot(profileId);
      if (!snap) {
        sendJson(res, 404, { error: 'Profile snapshot not found' });
        return;
      }
      const ws = buildChartWorkspace({
        natal: snap.level1.natal,
        shadbala: snap.level1.shadbala ?? null,
        ashtakvarga: snap.level1.ashtakvarga ?? null,
        dashas: snap.level1.dashas ?? null,
        transits: snap.level1.transits ?? null,
        avasthas: snap.level1.avasthas ?? null,
      });
      try {
        const findings = evaluateRules(ws, rules, { strengthConfig, contentVersion: version, persistToDb: true });
        const fact = ws.getFact(factId);
        const finding = findings.find((f) => f.id === factId || f.ruleId === factId);
        sendJson(res, 200, { factId, fact, finding });
      } finally {
        ws.close();
      }
      return;
    }

    // --- Level 2 Reading endpoint (compatible with inline or profileId) ---
    if (req.method === 'POST' && url === '/api/reading') {
      try {
        const body = await readJsonBody(req);
        const level: DetailLevel = body.level ?? 'standard';
        if (body.profileId) {
          const snap = appDb.getSnapshot(String(body.profileId));
          if (snap?.level2?.[level]) {
            sendJson(res, 200, { cached: true, ...snap.level2[level], findingsCount: snap.level2.findingsCount });
            return;
          }
        }
        const input: ChartWorkspaceInput = {
          natal: body.natal,
          shadbala: body.shadbala ?? null,
          ashtakvarga: body.ashtakvarga ?? null,
          dashas: body.dashas ?? null,
          transits: body.transits ?? null,
          avasthas: body.avasthas ?? null,
        };
        const ws = buildChartWorkspace(input);
        try {
          const findings = evaluateRules(ws, rules, { strengthConfig, contentVersion: version, persistToDb: true });
          const houses = Array.from({ length: 12 }, (_, idx) => renderHouse(idx + 1, ws, findings, level));
          const planets = PLANET_IDS.map((p) => renderPlanet(p, ws, findings, level));
          sendJson(res, 200, { buildMs: ws.buildMs, houses, planets, findingsCount: findings.length });
        } finally {
          ws.close();
        }
      } catch (err: any) {
        sendJson(res, 400, { error: err?.message ?? 'Invalid reading request' });
      }
      return;
    }

    // --- Q&A History ---
    const convMatch = url.match(/^\/api\/conversations\/([^/]+)$/);
    if (req.method === 'GET' && convMatch) {
      const profileId = decodeURIComponent(convMatch[1]!);
      sendJson(res, 200, { messages: appDb.getQaMessages(profileId) });
      return;
    }

    // --- Level 3 DeepAgent Ask Endpoint ---
    if (req.method === 'POST' && url === '/api/ask') {
      const wantsSse = (req.headers.accept ?? '').includes('text/event-stream');
      try {
        const body = await readJsonBody(req);
        const question = String(body.question ?? '').trim();
        if (!question) {
          sendJson(res, 400, { error: 'Question is required' });
          return;
        }

        const profileId = body.profileId ? String(body.profileId) : null;
        const snap = profileId ? appDb.getSnapshot(profileId) : null;

        const level1Data = snap?.level1 ?? {
          natal: body.natal,
          shadbala: body.shadbala ?? null,
          ashtakvarga: body.ashtakvarga ?? null,
          dashas: body.dashas ?? null,
          transits: body.transits ?? null,
          avasthas: body.avasthas ?? null,
        };

        if (!level1Data?.natal) {
          sendJson(res, 400, { error: 'Missing chart data (pass profileId or natal)' });
          return;
        }

        const history = profileId
          ? appDb.getQaMessages(profileId, 12).map((m) => ({
              role: m.role,
              content: m.content,
              evidenceIds: m.evidenceIds,
            }))
          : [];

        const ws = buildChartWorkspace({
          natal: level1Data.natal,
          shadbala: level1Data.shadbala ?? null,
          ashtakvarga: level1Data.ashtakvarga ?? null,
          dashas: level1Data.dashas ?? null,
          transits: level1Data.transits ?? null,
          avasthas: level1Data.avasthas ?? null,
        });

        const journalEntries = profileId ? appDb.getJournalEntries(profileId) : [];

        const engineSession = new EngineSession({
          natal: level1Data.natal,
          shadbala: level1Data.shadbala ?? null,
          ashtakvarga: level1Data.ashtakvarga ?? null,
          dashas: level1Data.dashas ?? null,
          transits: level1Data.transits ?? null,
          avasthas: level1Data.avasthas ?? null,
          journalEntries,
        });

        try {
          const findings = evaluateRules(ws, rules, {
            strengthConfig,
            contentVersion: version,
            persistToDb: true,
          });

          if (wantsSse) {
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
              'Access-Control-Allow-Origin': '*',
            });
          }

          const result = await runAgentQuery({
            question,
            history,
            ws,
            kb,
            findings,
            llm: getLlmClient(),
            engineSession,
            deep: Boolean(body.deep),
            onTrace: (ev) => {
              if (wantsSse) {
                res.write(`event: ${ev.type}\ndata: ${JSON.stringify(ev)}\n\n`);
              }
            },
          });

          if (profileId) {
            appDb.appendQaMessage({
              id: `msg_u_${Date.now()}`,
              profileId,
              role: 'user',
              content: question,
              evidenceIds: [],
            });
            appDb.appendQaMessage({
              id: `msg_a_${Date.now() + 1}`,
              profileId,
              role: 'assistant',
              content: result.response.answer,
              responseType: result.response.responseType,
              evidenceIds: result.observedEvidenceIds,
              structured: result,
            });
          }

          if (wantsSse) {
            res.write(`event: result\ndata: ${JSON.stringify(result)}\n\n`);
            res.end();
          } else {
            sendJson(res, 200, result);
          }
        } finally {
          ws.close();
        }
      } catch (err: any) {
        if (!res.headersSent) {
          sendJson(res, 500, { error: err?.message ?? 'Ask query failed' });
        } else {
          res.write(`event: error\ndata: ${JSON.stringify({ error: err?.message ?? 'Error' })}\n\n`);
          res.end();
        }
      }
      return;
    }

    // --- Journal Endpoints ---
    const journalMatch = url.match(/^\/api\/journal\/([^/]+)$/);
    if (req.method === 'GET' && journalMatch) {
      const profileId = decodeURIComponent(journalMatch[1]!);
      sendJson(res, 200, { entries: appDb.getJournalEntries(profileId) });
      return;
    }

    if (req.method === 'POST' && url === '/api/journal') {
      try {
        const body = await readJsonBody(req);
        const entry = {
          id: String(body.id || `j_${Date.now()}`),
          profileId: String(body.profileId),
          entryDate: String(body.entryDate || new Date().toISOString().slice(0, 10)),
          note: String(body.note || ''),
          energy: Number(body.energy ?? 3),
          focus: Number(body.focus ?? 3),
          mood: Number(body.mood ?? 3),
          skySnapshot: body.skySnapshot ?? null,
        };
        appDb.saveJournalEntry(entry);
        sendJson(res, 200, { ok: true, entry });
      } catch (err: any) {
        sendJson(res, 400, { error: err?.message ?? 'Failed to save journal entry' });
      }
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  });
}
