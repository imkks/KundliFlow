import type { SqliteDb } from './types.js';

export interface HourlyScoreRecord {
  profileId: string;
  hourUtc: string; // "YYYY-MM-DDTHH:00:00Z"
  score: number;
  band: string;
  factorsJson: string;
  text: string;
  scoringVersion: string;
}

export class HourlyScoreRepository {
  constructor(private db: SqliteDb) {}

  saveBatch(scores: HourlyScoreRecord[]): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO hourly_score (
        profile_id, hour_utc, score, band, factors_json, text, scoring_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const s of scores) {
      stmt.run(
        s.profileId,
        s.hourUtc,
        s.score,
        s.band,
        s.factorsJson,
        s.text,
        s.scoringVersion,
      );
    }
  }

  getHour(profileId: string, hourUtc: string): HourlyScoreRecord | null {
    const stmt = this.db.prepare(`
      SELECT * FROM hourly_score WHERE profile_id = ? AND hour_utc = ?
    `);
    const row = stmt.get(profileId, hourUtc) as any;
    if (!row) return null;
    return {
      profileId: row.profile_id,
      hourUtc: row.hour_utc,
      score: row.score,
      band: row.band,
      factorsJson: row.factors_json,
      text: row.text,
      scoringVersion: row.scoring_version,
    };
  }

  getRange(profileId: string, fromHourUtc: string, toHourUtc: string): HourlyScoreRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM hourly_score 
      WHERE profile_id = ? AND hour_utc >= ? AND hour_utc <= ?
      ORDER BY hour_utc ASC
    `);
    const rows = stmt.all(profileId, fromHourUtc, toHourUtc) as any[];
    return rows.map((row) => ({
      profileId: row.profile_id,
      hourUtc: row.hour_utc,
      score: row.score,
      band: row.band,
      factorsJson: row.factors_json,
      text: row.text,
      scoringVersion: row.scoring_version,
    }));
  }
}
