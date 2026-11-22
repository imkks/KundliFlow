import { buildChartWorkspace, PLANET_IDS, type ChartWorkspaceInput } from '@astro/facts';
import {
  evaluateRules,
  renderHouse,
  renderPlanet,
  type DetailLevel,
} from '@astro/rules';
import type { AppRouter } from '../router/router.js';
import type { ServerContext } from '../types.js';

export function registerReadingRoutes(router: AppRouter, ctx: ServerContext) {
  const { appDb, rules, rulesVersion, strengthConfig } = ctx;

  // --- Clickable Evidence Chip Inspector ---
  router.get('/api/facts/:profileId/:factId', (c) => {
    const { profileId, factId } = c.params;
    const snap = appDb.getSnapshot(profileId);
    if (!snap) {
      c.error('Profile snapshot not found', 404);
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
      const findings = evaluateRules(ws, rules, {
        strengthConfig,
        contentVersion: rulesVersion,
        persistToDb: true,
      });
      const fact = ws.getFact(factId);
      const finding = findings.find((f) => f.id === factId || f.ruleId === factId);
      c.json({ factId, fact, finding });
    } finally {
      ws.close();
    }
  });

  // --- Level 2 Reading endpoint ---
  router.post('/api/reading', (c) => {
    try {
      const body = c.body;
      const level: DetailLevel = body.level ?? 'standard';
      if (body.profileId) {
        const snap = appDb.getSnapshot(String(body.profileId));
        if (snap?.level2?.[level]) {
          c.json({ cached: true, ...snap.level2[level], findingsCount: snap.level2.findingsCount });
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
        const findings = evaluateRules(ws, rules, {
          strengthConfig,
          contentVersion: rulesVersion,
          persistToDb: true,
        });
        const houses = Array.from({ length: 12 }, (_, idx) => renderHouse(idx + 1, ws, findings, level));
        const planets = PLANET_IDS.map((p) => renderPlanet(p, ws, findings, level));
        c.json({ buildMs: ws.buildMs, houses, planets, findingsCount: findings.length });
      } finally {
        ws.close();
      }
    } catch (err: any) {
      c.error(err?.message ?? 'Invalid reading request', 400);
    }
  });
}
