export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS profile (
  id TEXT PRIMARY KEY,
  name TEXT,
  birth_utc TEXT NOT NULL,
  birth_local TEXT NOT NULL,
  tz_id TEXT NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  place_name TEXT,
  time_certainty TEXT NOT NULL CHECK (time_certainty IN ('exact','approx','unknown')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  profile_id TEXT PRIMARY KEY REFERENCES profile(id),
  json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS natal_chart (
  profile_id TEXT PRIMARY KEY REFERENCES profile(id),
  engine_version TEXT NOT NULL,
  settings_hash TEXT NOT NULL,
  digest_json TEXT NOT NULL,
  json TEXT NOT NULL,
  computed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sky_snapshot (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profile(id),
  at_utc TEXT NOT NULL,
  engine_version TEXT NOT NULL,
  scoring_version TEXT NOT NULL,
  band TEXT NOT NULL,
  score INTEGER NOT NULL,
  json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS journal_entry (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profile(id),
  at_utc TEXT NOT NULL,
  mood INTEGER CHECK (mood BETWEEN 1 AND 5),
  energy INTEGER CHECK (energy BETWEEN 1 AND 5),
  body TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('checkin','event','reflection')),
  snapshot_id TEXT REFERENCES sky_snapshot(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS tag (
  id TEXT PRIMARY KEY,
  label TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS entry_tag (
  entry_id TEXT REFERENCES journal_entry(id),
  tag_id TEXT REFERENCES tag(id),
  PRIMARY KEY (entry_id, tag_id)
);

CREATE TABLE IF NOT EXISTS hourly_score (
  profile_id TEXT NOT NULL REFERENCES profile(id),
  hour_utc TEXT NOT NULL,
  score INTEGER NOT NULL,
  band TEXT NOT NULL,
  factors_json TEXT NOT NULL,
  text TEXT NOT NULL,
  scoring_version TEXT NOT NULL,
  PRIMARY KEY (profile_id, hour_utc)
);

CREATE TABLE IF NOT EXISTS calc_cache (
  key TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  valid_from TEXT,
  valid_until TEXT NOT NULL,
  engine_version TEXT NOT NULL,
  scoring_version TEXT NOT NULL,
  content_version TEXT NOT NULL,
  json TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  stale INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  op TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_retry_at TEXT
);

CREATE TABLE IF NOT EXISTS kv_meta (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_entry_time ON journal_entry(profile_id, at_utc);
CREATE INDEX IF NOT EXISTS idx_snapshot_time ON sky_snapshot(profile_id, at_utc);
CREATE INDEX IF NOT EXISTS idx_hourly_time ON hourly_score(profile_id, hour_utc);
`;
