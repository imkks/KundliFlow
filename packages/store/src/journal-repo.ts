import type { SqliteDb } from './types.js';

export interface SkySnapshotRecord {
  id: string;
  profileId: string;
  atUtc: string;
  engineVersion: string;
  scoringVersion: string;
  band: string;
  score: number;
  json: string; // JSON with transit Moon, Tara, Hora, Dasha, factors, etc.
}

export interface JournalEntryRecord {
  id: string;
  profileId: string;
  atUtc: string;
  mood: number;
  energy: number;
  body: string | null;
  kind: 'checkin' | 'event' | 'reflection';
  snapshotId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface JournalEntryWithSnapshot extends JournalEntryRecord {
  snapshot?: SkySnapshotRecord | null;
  tags: string[];
}

export interface CreateJournalEntryInput {
  id: string;
  profileId: string;
  atUtc: string;
  mood: number;
  energy: number;
  body?: string;
  kind: 'checkin' | 'event' | 'reflection';
  snapshot: SkySnapshotRecord;
  tags?: string[];
}

export class JournalRepository {
  constructor(private db: SqliteDb) {}

  saveEntry(input: CreateJournalEntryInput): void {
    const nowIso = new Date().toISOString();

    // 1. Save sky snapshot
    const snapStmt = this.db.prepare(`
      INSERT OR REPLACE INTO sky_snapshot (
        id, profile_id, at_utc, engine_version, scoring_version, band, score, json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    snapStmt.run(
      input.snapshot.id,
      input.snapshot.profileId,
      input.snapshot.atUtc,
      input.snapshot.engineVersion,
      input.snapshot.scoringVersion,
      input.snapshot.band,
      input.snapshot.score,
      input.snapshot.json,
    );

    // 2. Save journal entry
    const entryStmt = this.db.prepare(`
      INSERT OR REPLACE INTO journal_entry (
        id, profile_id, at_utc, mood, energy, body, kind, snapshot_id, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
    `);
    entryStmt.run(
      input.id,
      input.profileId,
      input.atUtc,
      input.mood,
      input.energy,
      input.body ?? null,
      input.kind,
      input.snapshot.id,
      nowIso,
      nowIso,
    );

    // 3. Save tags
    if (input.tags && input.tags.length > 0) {
      const tagStmt = this.db.prepare(`
        INSERT OR IGNORE INTO tag (id, label) VALUES (?, ?)
      `);
      const linkStmt = this.db.prepare(`
        INSERT OR IGNORE INTO entry_tag (entry_id, tag_id) VALUES (?, ?)
      `);

      for (const t of input.tags) {
        const cleanTag = t.trim().toLowerCase().replace(/^#/, '');
        if (!cleanTag) continue;
        const tagId = 'tag_' + cleanTag;
        tagStmt.run(tagId, cleanTag);
        linkStmt.run(input.id, tagId);
      }
    }
  }

  getEntries(
    profileId: string,
    filter?: { tag?: string; mood?: number; band?: string; limit?: number },
  ): JournalEntryWithSnapshot[] {
    let sql = `
      SELECT 
        e.id as e_id, e.profile_id as e_profile_id, e.at_utc as e_at_utc,
        e.mood as e_mood, e.energy as e_energy, e.body as e_body,
        e.kind as e_kind, e.snapshot_id as e_snapshot_id,
        e.created_at as e_created_at, e.updated_at as e_updated_at,
        e.deleted_at as e_deleted_at,
        s.id as s_id, s.profile_id as s_profile_id, s.at_utc as s_at_utc,
        s.engine_version as s_engine_version, s.scoring_version as s_scoring_version,
        s.band as s_band, s.score as s_score, s.json as s_json
      FROM journal_entry e
      LEFT JOIN sky_snapshot s ON e.snapshot_id = s.id
      WHERE e.profile_id = ? AND e.deleted_at IS NULL
    `;
    const params: unknown[] = [profileId];

    if (filter?.mood !== undefined) {
      sql += ` AND e.mood = ?`;
      params.push(filter.mood);
    }
    if (filter?.band) {
      sql += ` AND s.band = ?`;
      params.push(filter.band);
    }

    sql += ` ORDER BY e.at_utc DESC`;

    if (filter?.limit) {
      sql += ` LIMIT ?`;
      params.push(filter.limit);
    }

    const rows = this.db.prepare(sql).all(...params) as any[];

    // Fetch tags for these entries
    const tagQuery = this.db.prepare(`
      SELECT et.entry_id, t.label 
      FROM entry_tag et
      JOIN tag t ON et.tag_id = t.id
      WHERE et.entry_id = ?
    `);

    const result: JournalEntryWithSnapshot[] = [];

    for (const r of rows) {
      const tagRows = tagQuery.all(r.e_id) as any[];
      const tags = tagRows.map((tr) => tr.label);

      if (filter?.tag && !tags.includes(filter.tag.toLowerCase().replace(/^#/, ''))) {
        continue;
      }

      let snapshot: SkySnapshotRecord | null = null;
      if (r.s_id) {
        snapshot = {
          id: r.s_id,
          profileId: r.s_profile_id,
          atUtc: r.s_at_utc,
          engineVersion: r.s_engine_version,
          scoringVersion: r.s_scoring_version,
          band: r.s_band,
          score: r.s_score,
          json: r.s_json,
        };
      }

      result.push({
        id: r.e_id,
        profileId: r.e_profile_id,
        atUtc: r.e_at_utc,
        mood: r.e_mood,
        energy: r.e_energy,
        body: r.e_body,
        kind: r.e_kind,
        snapshotId: r.e_snapshot_id,
        createdAt: r.e_created_at,
        updatedAt: r.e_updated_at,
        deletedAt: r.e_deleted_at,
        snapshot,
        tags,
      });
    }

    return result;
  }

  deleteEntry(id: string, hard = false): void {
    if (hard) {
      this.db.prepare(`DELETE FROM entry_tag WHERE entry_id = ?`).run(id);
      this.db.prepare(`DELETE FROM journal_entry WHERE id = ?`).run(id);
    } else {
      const now = new Date().toISOString();
      this.db.prepare(`UPDATE journal_entry SET deleted_at = ? WHERE id = ?`).run(now, id);
    }
  }

  getAllTags(): string[] {
    const rows = this.db.prepare(`SELECT label FROM tag ORDER BY label ASC`).all() as any[];
    return rows.map((r) => r.label);
  }
}
