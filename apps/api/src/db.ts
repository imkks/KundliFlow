import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

export interface StoredUser {
  id: string;
  googleSub: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: string;
}

export interface StoredProfile {
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
  createdAt: string;
}

export interface StoredLifeEvent {
  id: string;
  profileId: string;
  userId?: string | null;
  title: string;
  eventDate: string;
  category: string;
  updatedAt: string;
  deleted?: boolean;
}

export interface StoredQaMessage {
  id: string;
  profileId: string;
  role: 'user' | 'assistant';
  content: string;
  responseType?: string;
  evidenceIds: string[];
  structured?: any;
  createdAt: string;
}

export interface StoredJournalEntry {
  id: string;
  profileId: string;
  entryDate: string;
  note: string;
  energy: number;
  focus: number;
  mood: number;
  skySnapshot?: any;
  createdAt: string;
}

const DB_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  google_sub TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  picture TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  bundle_version INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  birth_time TEXT NOT NULL,
  tz_id TEXT NOT NULL,
  city_name TEXT NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  time_certainty TEXT NOT NULL DEFAULT 'exact',
  ayanamsa TEXT NOT NULL DEFAULT 'lahiri',
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chart_snapshots (
  profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  level1_json TEXT NOT NULL,
  level2_json TEXT NOT NULL,
  computed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS qa_messages (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  response_type TEXT,
  evidence_ids_json TEXT NOT NULL DEFAULT '[]',
  structured_json TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_qa_profile_time ON qa_messages(profile_id, created_at ASC);

CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entry_date TEXT NOT NULL,
  note TEXT NOT NULL,
  energy INTEGER NOT NULL,
  focus INTEGER NOT NULL,
  mood INTEGER NOT NULL,
  sky_snapshot_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_journal_profile_date ON journal_entries(profile_id, created_at DESC);

CREATE TABLE IF NOT EXISTS life_events (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id TEXT,
  title TEXT NOT NULL,
  event_date TEXT NOT NULL,
  category TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_events_profile_time ON life_events(profile_id, updated_at DESC);
`;

export function createAppDatabase(dbFilePath: string) {
  const dir = path.dirname(dbFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbFilePath);
  db.pragma('journal_mode = WAL');
  db.exec(DB_SCHEMA);

  // Backwards-compatible column migrations for existing databases
  for (const sql of [
    'ALTER TABLE profiles ADD COLUMN user_id TEXT',
    'ALTER TABLE profiles ADD COLUMN bundle_version INTEGER NOT NULL DEFAULT 1',
    'ALTER TABLE journal_entries ADD COLUMN updated_at TEXT',
    'ALTER TABLE journal_entries ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0',
  ]) {
    try {
      db.exec(sql);
    } catch {
      // column already exists
    }
  }

  const mapProfile = (r: any): StoredProfile => ({
    id: r.id,
    userId: r.user_id ?? null,
    bundleVersion: Number(r.bundle_version ?? 1),
    name: r.name,
    birthDate: r.birth_date,
    birthTime: r.birth_time,
    tzId: r.tz_id,
    cityName: r.city_name,
    lat: r.lat,
    lon: r.lon,
    timeCertainty: r.time_certainty,
    ayanamsa: r.ayanamsa,
    isActive: r.is_active === 1,
    createdAt: r.created_at,
  });

  return {
    db,

    upsertUser(u: { googleSub: string; email: string; name: string; picture?: string }): StoredUser {
      const existing = db.prepare('SELECT * FROM users WHERE google_sub = ?').get(u.googleSub) as any;
      if (existing) {
        db.prepare('UPDATE users SET email = ?, name = ?, picture = ? WHERE id = ?').run(
          u.email,
          u.name,
          u.picture ?? null,
          existing.id,
        );
        return {
          id: existing.id,
          googleSub: existing.google_sub,
          email: u.email,
          name: u.name,
          picture: u.picture,
          createdAt: existing.created_at,
        };
      }
      const id = `usr_${u.googleSub.slice(0, 16)}`;
      const now = new Date().toISOString();
      db.prepare('INSERT INTO users (id, google_sub, email, name, picture, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
        id,
        u.googleSub,
        u.email,
        u.name,
        u.picture ?? null,
        now,
      );
      return { id, googleSub: u.googleSub, email: u.email, name: u.name, picture: u.picture, createdAt: now };
    },

    getUserById(id: string): StoredUser | null {
      const r = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
      if (!r) return null;
      return {
        id: r.id,
        googleSub: r.google_sub,
        email: r.email,
        name: r.name,
        picture: r.picture ?? undefined,
        createdAt: r.created_at,
      };
    },

    listProfiles(): StoredProfile[] {
      const rows = db.prepare('SELECT * FROM profiles ORDER BY is_active DESC, created_at DESC').all() as any[];
      return rows.map(mapProfile);
    },

    listUnownedProfiles(): StoredProfile[] {
      const rows = db
        .prepare('SELECT * FROM profiles WHERE user_id IS NULL ORDER BY is_active DESC, created_at DESC')
        .all() as any[];
      return rows.map(mapProfile);
    },

    listProfilesForUser(userId: string): StoredProfile[] {
      const rows = db
        .prepare('SELECT * FROM profiles WHERE user_id = ? ORDER BY is_active DESC, created_at DESC')
        .all(userId) as any[];
      return rows.map(mapProfile);
    },

    setActiveProfile(profileId: string, userId?: string | null): StoredProfile | null {
      const target = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profileId) as any;
      if (!target) return null;
      const tx = db.transaction(() => {
        if (userId) {
          db.prepare('UPDATE profiles SET is_active = 0 WHERE user_id = ?').run(userId);
        } else {
          db.prepare('UPDATE profiles SET is_active = 0 WHERE user_id IS NULL').run();
        }
        db.prepare('UPDATE profiles SET is_active = 1 WHERE id = ?').run(profileId);
      });
      tx();
      const updated = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profileId) as any;
      return updated ? mapProfile(updated) : null;
    },

    deleteProfile(profileId: string): boolean {
      const tx = db.transaction(() => {
        db.prepare('DELETE FROM chart_snapshots WHERE profile_id = ?').run(profileId);
        db.prepare('DELETE FROM journal_entries WHERE profile_id = ?').run(profileId);
        db.prepare('DELETE FROM qa_messages WHERE profile_id = ?').run(profileId);
        db.prepare('DELETE FROM life_events WHERE profile_id = ?').run(profileId);
        const info = db.prepare('DELETE FROM profiles WHERE id = ?').run(profileId);
        return info.changes > 0;
      });
      return tx();
    },

    getProfile(id: string): StoredProfile | null {
      const r = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as any;
      return r ? mapProfile(r) : null;
    },

    upsertProfile(p: Omit<StoredProfile, 'createdAt'> & { createdAt?: string }) {
      const now = p.createdAt ?? new Date().toISOString();
      const existing = db.prepare('SELECT bundle_version, user_id FROM profiles WHERE id = ?').get(p.id) as any;
      const nextVer = existing ? Number(existing.bundle_version ?? 1) + 1 : 1;
      const ownerId = p.userId ?? existing?.user_id ?? null;
      const tx = db.transaction(() => {
        if (p.isActive) {
          if (ownerId) {
            db.prepare('UPDATE profiles SET is_active = 0 WHERE user_id = ?').run(ownerId);
          } else {
            db.prepare('UPDATE profiles SET is_active = 0 WHERE user_id IS NULL').run();
          }
        }
        db.prepare(`
          INSERT OR REPLACE INTO profiles
            (id, user_id, bundle_version, name, birth_date, birth_time, tz_id, city_name, lat, lon, time_certainty, ayanamsa, is_active, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          p.id,
          ownerId,
          nextVer,
          p.name,
          p.birthDate,
          p.birthTime,
          p.tzId,
          p.cityName,
          p.lat,
          p.lon,
          p.timeCertainty,
          p.ayanamsa,
          p.isActive ? 1 : 0,
          now,
        );
      });
      tx();
    },

    saveSnapshot(profileId: string, level1: unknown, level2: unknown) {
      db.prepare(`
        INSERT OR REPLACE INTO chart_snapshots (profile_id, level1_json, level2_json, computed_at)
        VALUES (?, ?, ?, ?)
      `).run(profileId, JSON.stringify(level1), JSON.stringify(level2), new Date().toISOString());
    },

    getSnapshot(profileId: string): { level1: any; level2: any; computedAt: string } | null {
      const row = db
        .prepare('SELECT level1_json, level2_json, computed_at FROM chart_snapshots WHERE profile_id = ?')
        .get(profileId) as any;
      if (!row) return null;
      return {
        level1: JSON.parse(row.level1_json),
        level2: JSON.parse(row.level2_json),
        computedAt: row.computed_at,
      };
    },

    appendQaMessage(msg: Omit<StoredQaMessage, 'createdAt'> & { createdAt?: string }) {
      db.prepare(`
        INSERT INTO qa_messages (id, profile_id, role, content, response_type, evidence_ids_json, structured_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        msg.id,
        msg.profileId,
        msg.role,
        msg.content,
        msg.responseType ?? null,
        JSON.stringify(msg.evidenceIds ?? []),
        msg.structured ? JSON.stringify(msg.structured) : null,
        msg.createdAt ?? new Date().toISOString(),
      );
    },

    getQaMessages(profileId: string, limit: number = 40): StoredQaMessage[] {
      const rows = db
        .prepare('SELECT * FROM qa_messages WHERE profile_id = ? ORDER BY created_at ASC LIMIT ?')
        .all(profileId, limit) as any[];
      return rows.map((r) => ({
        id: r.id,
        profileId: r.profile_id,
        role: r.role,
        content: r.content,
        responseType: r.response_type ?? undefined,
        evidenceIds: JSON.parse(r.evidence_ids_json || '[]'),
        structured: r.structured_json ? JSON.parse(r.structured_json) : undefined,
        createdAt: r.created_at,
      }));
    },

    saveJournalEntry(entry: Omit<StoredJournalEntry, 'createdAt'> & { createdAt?: string; updatedAt?: string; deleted?: boolean }) {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT OR REPLACE INTO journal_entries (id, profile_id, entry_date, note, energy, focus, mood, sky_snapshot_json, created_at, updated_at, deleted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        entry.id,
        entry.profileId,
        entry.entryDate,
        entry.note,
        entry.energy,
        entry.focus,
        entry.mood,
        entry.skySnapshot ? JSON.stringify(entry.skySnapshot) : null,
        entry.createdAt ?? now,
        entry.updatedAt ?? now,
        entry.deleted ? 1 : 0,
      );
    },

    getJournalEntries(profileId: string): StoredJournalEntry[] {
      const rows = db
        .prepare('SELECT * FROM journal_entries WHERE profile_id = ? AND COALESCE(deleted, 0) = 0 ORDER BY created_at DESC')
        .all(profileId) as any[];
      return rows.map((r) => ({
        id: r.id,
        profileId: r.profile_id,
        entryDate: r.entry_date,
        note: r.note,
        energy: r.energy,
        focus: r.focus,
        mood: r.mood,
        skySnapshot: r.sky_snapshot_json ? JSON.parse(r.sky_snapshot_json) : undefined,
        createdAt: r.created_at,
      }));
    },

    getJournalEntriesSince(profileId: string, sinceIso?: string): any[] {
      const rows = sinceIso
        ? (db
            .prepare('SELECT * FROM journal_entries WHERE profile_id = ? AND COALESCE(updated_at, created_at) > ? ORDER BY created_at DESC')
            .all(profileId, sinceIso) as any[])
        : (db
            .prepare('SELECT * FROM journal_entries WHERE profile_id = ? ORDER BY created_at DESC')
            .all(profileId) as any[]);
      return rows.map((r) => ({
        id: r.id,
        profileId: r.profile_id,
        entryDate: r.entry_date,
        note: r.note,
        energy: r.energy,
        focus: r.focus,
        mood: r.mood,
        skySnapshot: r.sky_snapshot_json ? JSON.parse(r.sky_snapshot_json) : undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at ?? r.created_at,
        deleted: r.deleted === 1,
      }));
    },

    upsertLifeEvent(ev: StoredLifeEvent) {
      db.prepare(`
        INSERT OR REPLACE INTO life_events (id, profile_id, user_id, title, event_date, category, updated_at, deleted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        ev.id,
        ev.profileId,
        ev.userId ?? null,
        ev.title,
        ev.eventDate,
        ev.category,
        ev.updatedAt ?? new Date().toISOString(),
        ev.deleted ? 1 : 0,
      );
    },

    getLifeEventsSince(profileId: string, sinceIso?: string): StoredLifeEvent[] {
      const rows = sinceIso
        ? (db
            .prepare('SELECT * FROM life_events WHERE profile_id = ? AND updated_at > ? ORDER BY event_date DESC')
            .all(profileId, sinceIso) as any[])
        : (db
            .prepare('SELECT * FROM life_events WHERE profile_id = ? AND deleted = 0 ORDER BY event_date DESC')
            .all(profileId) as any[]);
      return rows.map((r) => ({
        id: r.id,
        profileId: r.profile_id,
        userId: r.user_id ?? null,
        title: r.title,
        eventDate: r.event_date,
        category: r.category,
        updatedAt: r.updated_at,
        deleted: r.deleted === 1,
      }));
    },
  };
}
