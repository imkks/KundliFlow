import { API_BASE_URL } from '../config.ts';

const AUTH_TOKEN_KEY = 'astro_auth_token_v1';
const BUNDLE_CACHE_PREFIX = 'astro_server_bundle_v2_';
const TODAY_CACHE_KEY = 'astro_server_today_v1';
const LAST_SYNC_KEY = 'astro_last_sync_at_v1';

export interface AuthUser {
  id: string;
  googleSub: string;
  email: string;
  name: string;
  picture?: string;
}

export interface ServerProfileSummary {
  id: string;
  userId?: string | null;
  bundleVersion?: number;
  name: string;
  birthDate: string;
  birthTime: string;
  tzId: string;
  cityName: string;
  lat: number;
  lon: number;
  timeCertainty: string;
  ayanamsa: string;
  isActive: boolean;
  createdAt?: string;
}

export interface StaticBundleResponse {
  profile: ServerProfileSummary;
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

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getAuthToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra ?? {}),
  };
}

export async function loginWithGoogleIdToken(idToken: string): Promise<{
  token: string;
  user: AuthUser;
  profiles: ServerProfileSummary[];
}> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
  } catch (err: any) {
    throw new Error(
      `Cannot connect to API at ${API_BASE_URL}. Check if your backend server and Cloudflare tunnel are active.`,
    );
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error(
      `Backend returned HTTP ${res.status}. If using Cloudflare tunnel, verify the KundliFlow API is running on the target port (e.g. 8787).`,
    );
  }

  if (!res.ok) throw new Error(data?.error || `Google sign-in failed (HTTP ${res.status})`);
  setAuthToken(data.token);
  return data;
}

export async function loginWithDevEmail(devEmail: string, devName: string): Promise<{
  token: string;
  user: AuthUser;
  profiles: ServerProfileSummary[];
}> {
  const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ devEmail, devName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Dev sign-in failed (HTTP ${res.status})`);
  setAuthToken(data.token);
  return data;
}

export async function fetchAuthMe(): Promise<{
  user: AuthUser;
  profiles: ServerProfileSummary[];
} | null> {
  const token = getAuthToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: authHeaders(),
  });
  if (res.status === 401) {
    setAuthToken(null);
    return null;
  }
  if (!res.ok) return null;
  return await res.json();
}

export function logoutAuth() {
  setAuthToken(null);
  try {
    localStorage.removeItem(TODAY_CACHE_KEY);
    localStorage.removeItem('astro_backend_profile_id_v1');
  } catch {
    // ignore
  }
}

export async function activateProfileOnServer(profileId: string): Promise<ServerProfileSummary | null> {
  const res = await fetch(`${API_BASE_URL}/api/profiles/${encodeURIComponent(profileId)}/activate`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.profile ?? null;
}

export async function deleteProfileOnServer(profileId: string): Promise<ServerProfileSummary[]> {
  const res = await fetch(`${API_BASE_URL}/api/profiles/${encodeURIComponent(profileId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Delete failed (HTTP ${res.status})`);
  try {
    localStorage.removeItem(`${BUNDLE_CACHE_PREFIX}${profileId}`);
  } catch {
    // ignore
  }
  return Array.isArray(data.profiles) ? data.profiles : [];
}

/**
 * Fetches an existing profile's static bundle by ID with ETag / 304 local caching.
 */
export async function fetchProfileBundleById(profileId: string): Promise<StaticBundleResponse> {
  const cacheKey = `${BUNDLE_CACHE_PREFIX}${profileId}`;
  let cached: { etag?: string; bundle: StaticBundleResponse } | null = null;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) cached = JSON.parse(raw);
  } catch {
    cached = null;
  }

  const res = await fetch(`${API_BASE_URL}/api/profiles/${encodeURIComponent(profileId)}/bundle`, {
    headers: authHeaders(cached?.etag ? { 'If-None-Match': cached.etag } : undefined),
  });
  if (res.status === 304 && cached?.bundle) {
    return cached.bundle;
  }
  if (!res.ok) {
    throw new Error(`Bundle fetch failed (HTTP ${res.status})`);
  }
  const bundle = (await res.json()) as StaticBundleResponse;
  const etag = res.headers.get('ETag') ?? undefined;
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ etag, bundle }));
    localStorage.setItem('astro_backend_profile_id_v1', profileId);
  } catch {
    // ignore
  }
  return bundle;
}

/**
 * Creates (or updates) a profile on the server (server computes Level 1 + Level 2 once),
 * then caches its static bundle locally keyed by profileId.
 */
export async function fetchOrCreateStaticBundle(profileInput: {
  id?: string;
  name: string;
  birthDate: string;
  birthTime: string;
  cityName: string;
  lat: number;
  lon: number;
  tzId: string;
  timeCertainty: string;
  ayanamsa: string;
}): Promise<{ profileId: string; bundle: StaticBundleResponse }> {
  // If we already have a server profileId, fetch via ETag/304 first!
  if (profileInput.id) {
    try {
      const bundle = await fetchProfileBundleById(profileInput.id);
      return { profileId: profileInput.id, bundle };
    } catch {
      // fall through to POST /api/profiles
    }
  }

  const createRes = await fetch(`${API_BASE_URL}/api/profiles`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      ...(profileInput.id ? { id: profileInput.id } : {}),
      name: profileInput.name,
      birthDate: profileInput.birthDate,
      birthTime: profileInput.birthTime,
      tzId: profileInput.tzId,
      cityName: profileInput.cityName,
      lat: profileInput.lat,
      lon: profileInput.lon,
      timeCertainty: profileInput.timeCertainty,
      ayanamsa: profileInput.ayanamsa,
      isActive: true,
    }),
  });
  if (!createRes.ok) {
    const errBody = await createRes.json().catch(() => ({}));
    throw new Error(errBody?.error || `Server profile calculation failed (HTTP ${createRes.status})`);
  }
  const created = await createRes.json();
  const profileId = String(created.profile.id);
  const bundle: StaticBundleResponse = {
    profile: created.profile,
    bundleVersion: created.profile.bundleVersion ?? 1,
    computedAt: new Date().toISOString(),
    level1Static: created.dashboard?.level1,
    level2Static: created.dashboard?.level2,
  };
  const cacheKey = `${BUNDLE_CACHE_PREFIX}${profileId}`;
  const etag = `"bundle-${profileId}-v${created.profile.bundleVersion ?? 1}"`;
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ etag, bundle }));
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
    { headers: authHeaders() },
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
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        profileId,
        lastSyncedAt,
        push: {
          journalEntries: Array.isArray(localJournals) ? localJournals : [],
          lifeEvents: Array.isArray(localEvents) ? localEvents : [],
        },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.serverTime) {
      localStorage.setItem(LAST_SYNC_KEY, data.serverTime);
    }
    return data?.pull ?? null;
  } catch {
    return null;
  }
}
