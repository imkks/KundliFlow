import {
  createNatalDigest,
  buildDay,
  buildMonth,
  buildYear,
  julianDayUt,
  computeTransits,
  computeVarshaphal,
  computeArudhaPadas,
  computeUpagrahas,
} from '@astro/engine';
import type { AppRouter } from '../router/router.js';
import type { ServerContext } from '../types.js';

export function registerProfileRoutes(router: AppRouter, ctx: ServerContext) {
  const { appDb, aggregateLevel1And2, canAccessProfile, getServerEphemeris } = ctx;

  // --- Profiles List ---
  router.get('/api/profiles', (c) => {
    const profiles = c.authUser ? appDb.listProfilesForUser(c.authUser.sub) : appDb.listUnownedProfiles();
    c.json({ profiles });
  });

  // --- Upsert Profile ---
  router.post('/api/profiles', async (c) => {
    try {
      const body = c.body;
      const ownerPrefix = c.authUser ? `${c.authUser.sub}_` : '';
      const id =
        body.id ||
        `${ownerPrefix}${String(body.name || 'native').toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${body.birthDate}_${String(body.birthTime).replace(/:/g, '')}`;

      const existing = appDb.getProfile(id);
      if (existing && !canAccessProfile(existing, c.authUser)) {
        c.error('Forbidden: profile belongs to another account', 403);
        return;
      }

      const profile = {
        id,
        userId: c.authUser?.sub ?? null,
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

      c.json({
        profile: appDb.getProfile(id),
        dashboard: { level1, level2 },
      });
    } catch (err: any) {
      console.error('[POST /api/profiles] error:', err);
      c.error(err?.message ?? 'Failed to save profile', 400);
    }
  });

  // --- Activate Profile ---
  router.post('/api/profiles/:id/activate', (c) => {
    const profileId = c.params.id;
    const profile = appDb.getProfile(profileId);
    if (!profile) {
      c.error('Profile not found', 404);
      return;
    }
    if (!canAccessProfile(profile, c.authUser)) {
      c.error('Forbidden', 403);
      return;
    }
    const updated = appDb.setActiveProfile(profileId, profile.userId ?? null);
    c.json({ ok: true, profile: updated });
  });

  // --- Delete Profile ---
  router.delete('/api/profiles/:id', (c) => {
    const profileId = c.params.id;
    const profile = appDb.getProfile(profileId);
    if (!profile) {
      c.error('Profile not found', 404);
      return;
    }
    if (!canAccessProfile(profile, c.authUser)) {
      c.error('Forbidden', 403);
      return;
    }
    appDb.deleteProfile(profileId);
    const profiles = c.authUser ? appDb.listProfilesForUser(c.authUser.sub) : appDb.listUnownedProfiles();
    c.json({ ok: true, profiles });
  });

  // --- Static Natal Bundle ---
  router.get('/api/profiles/:id/bundle', async (c) => {
    const profileId = c.params.id;
    const profile = appDb.getProfile(profileId);
    if (!profile) {
      c.error('Profile not found', 404);
      return;
    }
    if (!canAccessProfile(profile, c.authUser)) {
      c.error('Forbidden', 403);
      return;
    }
    const etag = `"bundle-${profile.id}-v${profile.bundleVersion ?? 1}"`;
    if (c.req.headers['if-none-match'] === etag) {
      c.res.writeHead(304, {
        'Access-Control-Allow-Origin': '*',
        ETag: etag,
        'Cache-Control': 'private, max-age=86400',
      });
      c.res.end();
      return;
    }
    let snap = appDb.getSnapshot(profileId);
    if (!snap) {
      const agg = await aggregateLevel1And2(profile);
      appDb.saveSnapshot(profileId, agg.level1, agg.level2);
      snap = appDb.getSnapshot(profileId);
    }
    c.res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ETag: etag,
      'Cache-Control': 'private, max-age=86400',
    });
    c.res.end(
      JSON.stringify({
        profile,
        bundleVersion: profile.bundleVersion ?? 1,
        computedAt: snap!.computedAt,
        level1Static: snap!.level1,
        level2Static: snap!.level2,
      }),
    );
  });

  // --- Daily Sky Payload ---
  router.get('/api/profiles/:id/today', async (c) => {
    try {
      const profileId = c.params.id;
      const profile = appDb.getProfile(profileId);
      if (!profile) {
        c.error('Profile not found', 404);
        return;
      }
      if (!canAccessProfile(profile, c.authUser)) {
        c.error('Forbidden', 403);
        return;
      }
      let snap = appDb.getSnapshot(profileId);
      if (!snap) {
        const agg = await aggregateLevel1And2(profile);
        appDb.saveSnapshot(profileId, agg.level1, agg.level2);
        snap = appDb.getSnapshot(profileId);
      }
      const dateStr = c.query.date || new Date().toISOString().slice(0, 10);
      const tz = c.query.tzId || profile.tzId || 'Asia/Kolkata';
      const qLat = c.query.lat;
      const qLon = c.query.lon;
      const latVal = qLat !== undefined && Number.isFinite(Number(qLat)) ? Number(qLat) : profile.lat;
      const lonVal = qLon !== undefined && Number.isFinite(Number(qLon)) ? Number(qLon) : profile.lon;
      const latBucket = Math.round(latVal * 100) / 100;
      const lonBucket = Math.round(lonVal * 100) / 100;

      const cachedDaily = appDb.getDailySky(profileId, dateStr, tz, latBucket, lonBucket);
      if (cachedDaily) {
        c.json(cachedDaily);
        return;
      }

      const eph = await getServerEphemeris();
      const baseDigest = createNatalDigest(snap!.level1.natal);
      const digest = {
        ...baseDigest,
        lat: latVal,
        lon: lonVal,
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
        snap!.level1.ashtakvarga?.prastara,
      );
      const mv = buildMonth(eph, digest, dt.getUTCFullYear(), dt.getUTCMonth() + 1, tz, scoringOpts);
      const peakDays = [...mv.days].sort((a, b) => b.dayScore - a.dayScore).slice(0, 3);
      const cautionDays = [...mv.days].sort((a, b) => a.dayScore - b.dayScore).slice(0, 3);

      const payload = {
        date: dateStr,
        tzId: tz,
        dayView,
        transits,
        monthPeakSummary: {
          peakDays,
          cautionDays,
          ingressCount: mv.ingressEvents?.length ?? 0,
          ingressEvents: mv.ingressEvents ?? [],
        },
        activeDashas: activeDashasList,
        extendedDashas: snap!.level2?.standard?.extendedDashas ?? null,
      };

      appDb.setDailySky(profileId, dateStr, tz, latBucket, lonBucket, payload);
      c.json(payload);
    } catch (err: any) {
      c.error(err?.message ?? 'Failed to compute daily payload', 400);
    }
  });

  // --- Calendar ---
  router.get('/api/profiles/:id/calendar', async (c) => {
    try {
      const profileId = c.params.id;
      const profile = appDb.getProfile(profileId);
      if (!profile) {
        c.error('Profile not found', 404);
        return;
      }
      if (!canAccessProfile(profile, c.authUser)) {
        c.error('Forbidden', 403);
        return;
      }
      let snap = appDb.getSnapshot(profileId);
      if (!snap) {
        const agg = await aggregateLevel1And2(profile);
        appDb.saveSnapshot(profileId, agg.level1, agg.level2);
        snap = appDb.getSnapshot(profileId);
      }
      const now = new Date();
      const year = Number(c.query.year) || now.getFullYear();
      const month = Number(c.query.month) || now.getMonth() + 1;
      const selectedDate = c.query.date || `${year}-${String(month).padStart(2, '0')}-15`;
      const tz = c.query.tzId || profile.tzId || 'Asia/Kolkata';

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
        snap!.level1.ashtakvarga?.prastara,
      );
      c.json({ year, month, selectedDate, monthData, yearData, transits });
    } catch (err: any) {
      c.error(err?.message ?? 'Failed to compute calendar', 400);
    }
  });

  // --- Varshaphal ---
  router.get('/api/profiles/:id/varshaphal', async (c) => {
    try {
      const profileId = c.params.id;
      const profile = appDb.getProfile(profileId);
      if (!profile) {
        c.error('Profile not found', 404);
        return;
      }
      if (!canAccessProfile(profile, c.authUser)) {
        c.error('Forbidden', 403);
        return;
      }
      let snap = appDb.getSnapshot(profileId);
      if (!snap) {
        const agg = await aggregateLevel1And2(profile);
        appDb.saveSnapshot(profileId, agg.level1, agg.level2);
        snap = appDb.getSnapshot(profileId);
      }
      const targetYear = Number(c.query.year) || new Date().getUTCFullYear();
      const eph = await getServerEphemeris();
      const natal = snap!.level1.natal;
      const varshaphal = computeVarshaphal(eph, natal, targetYear);
      const arudhas = computeArudhaPadas(natal);
      const upagrahas = computeUpagrahas(natal);
      c.json({ targetYear, varshaphal, arudhas, upagrahas });
    } catch (err: any) {
      c.error(err?.message ?? 'Failed to compute varshaphal', 400);
    }
  });

  // --- Dashboard Snapshot ---
  router.get('/api/profiles/:id/dashboard', async (c) => {
    const profileId = c.params.id;
    const profile = appDb.getProfile(profileId);
    if (!profile) {
      c.error('Profile not found', 404);
      return;
    }
    if (!canAccessProfile(profile, c.authUser)) {
      c.error('Forbidden', 403);
      return;
    }
    let snap = appDb.getSnapshot(profileId);
    if (!snap) {
      const agg = await aggregateLevel1And2(profile);
      appDb.saveSnapshot(profileId, agg.level1, agg.level2);
      snap = appDb.getSnapshot(profileId);
    }
    c.json({ profile, ...snap });
  });
}
