import {
  loadEphemeris,
  computePositions,
  resolveBirthTime,
  angleDiff,
  type AyanamsaId,
} from '@astro/engine';
import type { AppRouter } from '../router/router.js';
import type { ServerContext } from '../types.js';

export function registerHealthRoutes(router: AppRouter, ctx: ServerContext) {
  router.get('/health', async (c) => {
    const defaultEph = await ctx.getServerEphemeris();
    c.json({
      ok: true,
      service: 'myastro-api',
      architecture: 'approach2-static-bundle-daily-delta',
      levels: [1, 2, 3],
      rulesCount: ctx.rules.length,
      topicsCount: ctx.kb.topics.length,
      profilesCount: ctx.appDb.listProfiles().length,
      ephemeris: {
        activeProvider: defaultEph.id,
        version: defaultEph.version,
        capabilities: defaultEph.capabilities,
      },
    });
  });

  router.get('/api/diagnostics/compare', async (c) => {
    try {
      const q = c.query;
      const date = String(q.date || '1998-09-07');
      const time = String(q.time || '23:30:00');
      const tzId = String(q.tzId || 'Asia/Kolkata');
      const lat = Number(q.lat ?? 22.8046);
      const lon = Number(q.lon ?? 86.2029);
      const ayanamsa = (String(q.ayanamsa || 'lahiri') as AyanamsaId);

      const timeRes = resolveBirthTime({
        date,
        time,
        tzId,
        placeName: 'Diagnostics',
        lat,
        lon,
        timeCertainty: 'exact',
      });
      if (!timeRes.success) {
        c.error(timeRes.message, 400);
        return;
      }

      // 1. Run Swiss Ephemeris
      const t0Swiss = performance.now();
      const ephSwiss = await loadEphemeris('swisseph');
      const chartSwiss = computePositions(
        ephSwiss,
        timeRes.resolved,
        { lat, lon },
        { ayanamsa, nodeType: 'mean' },
      );
      const durationSwissMs = Number((performance.now() - t0Swiss).toFixed(2));

      // 2. Run Astronomy Engine
      const t0Astro = performance.now();
      const ephAstro = await loadEphemeris('astronomy-engine');
      const chartAstro = computePositions(
        ephAstro,
        timeRes.resolved,
        { lat, lon },
        { ayanamsa, nodeType: 'mean' },
      );
      const durationAstroMs = Number((performance.now() - t0Astro).toFixed(2));

      // 3. Compute Delta Analysis
      const lagnaDiffDeg = Math.abs(angleDiff(chartSwiss.lagna?.lon ?? 0, chartAstro.lagna?.lon ?? 0));
      const lagnaDiffArcsec = Number((lagnaDiffDeg * 3600).toFixed(1));
      const lagnaSignMatch = chartSwiss.lagna?.sign === chartAstro.lagna?.sign;

      const planetDeltasArcsec: Record<string, number> = {};
      let maxDeltaArcsec = 0;

      for (const [planet, dataSwiss] of Object.entries(chartSwiss.grahas)) {
        const dataAstro = chartAstro.grahas[planet as keyof typeof chartAstro.grahas];
        if (dataAstro) {
          const diffDeg = Math.abs(angleDiff(dataSwiss.lon, dataAstro.lon));
          const diffArcsec = Number((diffDeg * 3600).toFixed(1));
          planetDeltasArcsec[planet] = diffArcsec;
          if (diffArcsec > maxDeltaArcsec) maxDeltaArcsec = diffArcsec;
        }
      }

      c.json({
        ok: true,
        input: { date, time, tzId, lat, lon, ayanamsa },
        benchmark: {
          swissephDurationMs: durationSwissMs,
          astronomyEngineDurationMs: durationAstroMs,
          swissephVersion: ephSwiss.version,
          astronomyEngineVersion: ephAstro.version,
        },
        comparison: {
          lagnaSignMatch,
          lagna: {
            swisseph: `${chartSwiss.lagna?.sign} at ${chartSwiss.lagna?.degInSign.toFixed(3)}° (Lon: ${chartSwiss.lagna?.lon.toFixed(3)}°)`,
            astronomyEngine: `${chartAstro.lagna?.sign} at ${chartAstro.lagna?.degInSign.toFixed(3)}° (Lon: ${chartAstro.lagna?.lon.toFixed(3)}°)`,
            diffArcseconds: lagnaDiffArcsec,
          },
          maxPlanetDeltaArcseconds: maxDeltaArcsec,
          planetDeltasArcseconds: planetDeltasArcsec,
        },
      });
    } catch (err: any) {
      console.error('[Diagnostic Compare Error]:', err);
      c.error(err?.message || 'Comparison failed', 500);
    }
  });
}
