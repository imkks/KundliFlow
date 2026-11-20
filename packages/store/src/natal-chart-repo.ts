import type { SqliteDb } from './types.js';

export interface NatalChartRecord {
  profileId: string;
  engineVersion: string;
  settingsHash: string;
  digestJson: string;
  json: string;
  computedAt: string;
}

export class NatalChartRepository {
  constructor(private db: SqliteDb) {}

  save(chart: NatalChartRecord): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO natal_chart (
        profile_id, engine_version, settings_hash, digest_json, json, computed_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      chart.profileId,
      chart.engineVersion,
      chart.settingsHash,
      chart.digestJson,
      chart.json,
      chart.computedAt,
    );
  }

  get(profileId: string): NatalChartRecord | null {
    const stmt = this.db.prepare(`SELECT * FROM natal_chart WHERE profile_id = ?`);
    const row = stmt.get(profileId) as any;
    if (!row) return null;
    return {
      profileId: row.profile_id,
      engineVersion: row.engine_version,
      settingsHash: row.settings_hash,
      digestJson: row.digest_json,
      json: row.json,
      computedAt: row.computed_at,
    };
  }
}
