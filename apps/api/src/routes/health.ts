import type { AppRouter } from '../router/router.js';
import type { ServerContext } from '../types.js';

export function registerHealthRoutes(router: AppRouter, ctx: ServerContext) {
  router.get('/health', (c) => {
    c.json({
      ok: true,
      service: 'myastro-api',
      architecture: 'approach2-static-bundle-daily-delta',
      levels: [1, 2, 3],
      rulesCount: ctx.rules.length,
      topicsCount: ctx.kb.topics.length,
      profilesCount: ctx.appDb.listProfiles().length,
    });
  });
}
