import { API_BASE_URL } from '../config.ts';
import type { UserProfileInput } from '../components/OnboardingModal.tsx';

const BUNDLE_CACHE_KEY = 'astro_bundle_cache_v1';
const TODAY_CACHE_KEY = 'astro_today_cache_v1';
const LAST_SYNC_KEY = 'astro_last_sync_iso_v1';

export interface StaticBundleResponse {
  profile: any;
  bundleVersion: number;
  computedAt: string;
  level1Static: any;
  level2Static: any;
}

export interface TodayPayloadResponse {
  date: string;
  tzId: string;
  dayView: any;
  transits: any;
  monthPeakSummary?: {
    peakDays: Array<{ date: string; dayScore: number; dayBand: string }>;
    cautionDays: Array<{ date: string; dayScore: number; dayBand: string }>;
    ingressCount: number;
  };
  activeDashas: any[];
  extendedDashas: any;
}

function profileSignature(p: UserProfileInput): string {
  return `${p.name}|${p.birthDate}|${p.birthTime}|${p.cityName}|${p.lat}|${p.lon}|${p.tzId}|${p.ayanamsa}`;
}

export async function fetchOrCreateStaticBundle(
  profile: UserProfileInput,
): Promise<{ profileId: string; bundle: StaticBundleResponse }> {
  const sig = profileSignature(profile);
  let cached: { sig: string; profileId: string; etag?: string; bundle: StaticBundleResponse } | null = null;
  try {
    const raw = localStorage.getItem(BUNDLE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.sig === sig && parsed?.profileId && parsed?.bundle) {
        cached = parsed;
      }
    }
  } catch {
    // ignore storage errors
  }

  // 1. If we already have a cached bundle for this exact birth profile, revalidate with ETag (304 = 0 bytes!)
  if (cached) {
    try {
      const headers: Record<string, string> = {};
      if (cached.etag) headers['If-None-Match'] = cached.etag;
      const res = await fetch(`${API_BASE_URL}/api/profiles/${encodeURIComponent(cached.profileId)}/bundle`, {
        headers,
      });
      if (res.status === 304) {
        return { profileId: cached.profileId, bundle: cached.bundle };
      }
      if (res.ok) {
        const bundle = (await res.json()) as StaticBundleResponse;
        const etag = res.headers.get('etag') ?? undefined;
        try {
          localStorage.setItem(
            BUNDLE_CACHE_KEY,
            JSON.stringify({ sig, profileId: cached.profileId, etag, bundle }),
          );
        } catch {
          // ignore
        }
        return { profileId: cached.profileId, bundle };
      }
    } catch {
      // Server unreachable: return locally cached static bundle immediately!
      return { profileId: cached.profileId, bundle: cached.bundle };
    }
  }

  // 2. Otherwise compute ONCE on server by sending only birth details (~250 bytes)
  const createRes = await fetch(`${API_BASE_URL}/api/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: profile.name,
      birthDate: profile.birthDate,
      birthTime: profile.birthTime,
      tzId: profile.tzId,
      cityName: profile.cityName,
      lat: profile.lat,
      lon: profile.lon,
      timeCertainty: profile.timeCertainty,
      ayanamsa: profile.ayanamsa,
      isActive: true,
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Server profile creation failed (HTTP ${createRes.status})`);
  }

  const created = await createRes.json();
  const profileId: string = created.profile.id;
  const bundle: StaticBundleResponse = {
    profile: created.profile,
    bundleVersion: created.profile.bundleVersion ?? 1,
    computedAt: new Date().toISOString(),
    level1Static: created.dashboard.level1,
    level2Static: created.dashboard.level2,
  };
  const etag = `"bundle-${profileId}-v${bundle.bundleVersion}"`;

  try {
    localStorage.setItem(BUNDLE_CACHE_KEY, JSON.stringify({ sig, profileId, etag, bundle }));
    localStorage.setItem('astro_backend_profile_id_v1', profileId);
  } catch {
    // ignore
  }

  return { profileId, bundle };
}

export async function fetchTodaySky(
  profileId: string,
  dateStr: string,
  tzId: string,
  lat?: number,
  lon?: number,
): Promise<TodayPayloadResponse> {
  const latStr = typeof lat === 'number' ? lat.toFixed(4) : '';
  const lonStr = typeof lon === 'number' ? lon.toFixed(4) : '';
  const cacheKey = `${profileId}|${dateStr}|${tzId}|${latStr}|${lonStr}`;
  try {
    const raw = localStorage.getItem(TODAY_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.cacheKey === cacheKey && parsed?.data) {
        return parsed.data as TodayPayloadResponse;
      }
    }
  } catch {
    // ignore
  }

  const params = new URLSearchParams({ date: dateStr, tzId });
  if (typeof lat === 'number' && Number.isFinite(lat)) params.set('lat', String(lat));
  if (typeof lon === 'number' && Number.isFinite(lon)) params.set('lon', String(lon));

  const res = await fetch(
    `${API_BASE_URL}/api/profiles/${encodeURIComponent(profileId)}/today?${params.toString()}`,
  );
  if (!res.ok) {
    throw new Error(`Daily sky fetch failed (HTTP ${res.status})`);
  }
  const data = (await res.json()) as TodayPayloadResponse;
  try {
    localStorage.setItem(TODAY_CACHE_KEY, JSON.stringify({ cacheKey, data }));
  } catch {
    // ignore
  }
  return data;
}

export async function syncDeltaWithServer(profileId: string): Promise<{
  journalEntries: any[];
  lifeEvents: any[];
} | null> {
  try {
    const lastSyncedAt = localStorage.getItem(LAST_SYNC_KEY) ?? undefined;
    const rawJournals = localStorage.getItem('astro_journal_entries_v1');
    const rawEvents = localStorage.getItem('astro_life_events_v1');
    const localJournals = rawJournals ? JSON.parse(rawJournals) : [];
    const localEvents = rawEvents ? JSON.parse(rawEvents) : [];

    const res = await fetch(`${API_BASE_URL}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId,
        lastSyncedAt,
        journalEntries: Array.isArray(localJournals) ? localJournals : [],
        lifeEvents: Array.isArray(localEvents) ? localEvents : [],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.serverTime) {
      localStorage.setItem(LAST_SYNC_KEY, data.serverTime);
    }
    return {
      journalEntries: Array.isArray(data.journalEntries) ? data.journalEntries : [],
      lifeEvents: Array.isArray(data.lifeEvents) ? data.lifeEvents : [],
    };
  } catch {
    return null;
  }
}
