import { buildChartWorkspace } from '@astro/facts';
import { evaluateRules } from '@astro/rules';
import { EngineSession } from '@astro/tools';
import { runAgentQuery } from '@astro/agent';
import type { AppRouter } from '../router/router.js';
import type { ServerContext } from '../types.js';

export function registerChatRoutes(router: AppRouter, ctx: ServerContext) {
  const { appDb, rules, rulesVersion, strengthConfig, kb, getLlmClient, canAccessProfile } = ctx;

  // --- Q&A History ---
  router.get('/api/conversations/:id', (c) => {
    const profileId = c.params.id;
    const profile = appDb.getProfile(profileId);
    if (profile && !canAccessProfile(profile, c.authUser)) {
      c.error('Forbidden', 403);
      return;
    }
    c.json({ messages: appDb.getQaMessages(profileId) });
  });

  // --- Level 3 DeepAgent Ask Endpoint ---
  router.post('/api/ask', async (c) => {
    const wantsSse = (c.req.headers.accept ?? '').includes('text/event-stream');
    try {
      const body = c.body;
      const question = String(body.question ?? '').trim();
      if (!question) {
        c.error('Question is required', 400);
        return;
      }

      const profileId = body.profileId ? String(body.profileId) : null;
      if (profileId) {
        const prof = appDb.getProfile(profileId);
        if (prof && !canAccessProfile(prof, c.authUser)) {
          c.error('Forbidden: profile belongs to another account', 403);
          return;
        }
      }
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
        c.error('Missing chart data (pass profileId or natal)', 400);
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
          contentVersion: rulesVersion,
          persistToDb: true,
        });

        if (wantsSse) {
          c.res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
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
          deep: Boolean(body.deep ?? body.deepMode),
          onTrace: (ev) => {
            if (wantsSse) {
              c.res.write(`event: ${ev.type}\ndata: ${JSON.stringify(ev)}\n\n`);
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
          c.res.write(`event: result\ndata: ${JSON.stringify(result)}\n\n`);
          c.res.end();
        } else {
          c.json(result);
        }
      } finally {
        ws.close();
      }
    } catch (err: any) {
      if (!c.res.headersSent) {
        c.error(err?.message ?? 'Ask query failed', 500);
      } else {
        c.res.write(`event: error\ndata: ${JSON.stringify({ error: err?.message ?? 'Error' })}\n\n`);
        c.res.end();
      }
    }
  });
}
