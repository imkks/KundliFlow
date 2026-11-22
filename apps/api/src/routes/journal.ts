import type { AppRouter } from '../router/router.js';
import type { ServerContext } from '../types.js';

export function registerJournalRoutes(router: AppRouter, ctx: ServerContext) {
  const { appDb } = ctx;

  // --- Two-Way Delta Sync (Journal Entries + Past Life Events) ---
  router.post('/api/sync', (c) => {
    try {
      const body = c.body;
      const profileId = String(body.profileId || '');
      if (!profileId) {
        c.error('profileId is required', 400);
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
          userId: c.authUser?.sub ?? null,
          title: String(ev.title || ''),
          eventDate: String(ev.eventDate || ev.date || ''),
          category: String(ev.category || 'career'),
          updatedAt: ev.updatedAt ?? new Date().toISOString(),
          deleted: Boolean(ev.deleted),
        });
      }

      const serverTime = new Date().toISOString();
      c.json({
        serverTime,
        journalEntries: appDb.getJournalEntriesSince(profileId, lastSyncedAt),
        lifeEvents: appDb.getLifeEventsSince(profileId, lastSyncedAt),
      });
    } catch (err: any) {
      c.error(err?.message ?? 'Sync failed', 400);
    }
  });

  // --- Get Journal Entries ---
  router.get('/api/journal/:profileId', (c) => {
    const profileId = c.params.profileId;
    c.json({ entries: appDb.getJournalEntries(profileId) });
  });

  // --- Create Journal Entry ---
  router.post('/api/journal', (c) => {
    try {
      const body = c.body;
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
      c.json({ ok: true, entry });
    } catch (err: any) {
      c.error(err?.message ?? 'Failed to save journal entry', 400);
    }
  });
}
