import type { SqliteDb } from './types.js';

export interface ProfileRecord {
  id: string;
  name?: string | undefined;
  birthUtc: string;
  birthLocal: string;
  tzId: string;
  lat: number;
  lon: number;
  placeName?: string | undefined;
  timeCertainty: 'exact' | 'approx' | 'unknown';
  createdAt: string;
}

export class ProfileRepository {
  constructor(private db: SqliteDb) {}

  save(profile: ProfileRecord): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO profile (
        id, name, birth_utc, birth_local, tz_id, lat, lon, place_name, time_certainty, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      profile.id,
      profile.name ?? null,
      profile.birthUtc,
      profile.birthLocal,
      profile.tzId,
      profile.lat,
      profile.lon,
      profile.placeName ?? null,
      profile.timeCertainty,
      profile.createdAt,
    );
  }

  get(id: string): ProfileRecord | null {
    const stmt = this.db.prepare(`SELECT * FROM profile WHERE id = ?`);
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name ?? undefined,
      birthUtc: row.birth_utc,
      birthLocal: row.birth_local,
      tzId: row.tz_id,
      lat: row.lat,
      lon: row.lon,
      placeName: row.place_name ?? undefined,
      timeCertainty: row.time_certainty,
      createdAt: row.created_at,
    };
  }

  getFirst(): ProfileRecord | null {
    const stmt = this.db.prepare(`SELECT * FROM profile LIMIT 1`);
    const row = stmt.get() as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name ?? undefined,
      birthUtc: row.birth_utc,
      birthLocal: row.birth_local,
      tzId: row.tz_id,
      lat: row.lat,
      lon: row.lon,
      placeName: row.place_name ?? undefined,
      timeCertainty: row.time_certainty,
      createdAt: row.created_at,
    };
  }
}
