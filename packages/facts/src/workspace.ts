import Database from 'better-sqlite3';
import { emitChartFacts } from './emitters.js';
import type { ChartFactSet, ChartWorkspaceInput, Fact } from './types.js';

export const CHART_DB_SCHEMA = `
CREATE TABLE IF NOT EXISTS fact (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  subject TEXT NOT NULL,
  args_json TEXT NOT NULL,
  value TEXT,
  h_lagna INTEGER,
  h_moon INTEGER,
  source_module TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS edge (
  src TEXT NOT NULL,
  dst TEXT NOT NULL,
  rel TEXT NOT NULL,
  PRIMARY KEY (src, dst, rel)
);
CREATE TABLE IF NOT EXISTS finding (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  theme TEXT NOT NULL,
  polarity TEXT NOT NULL,
  strength INTEGER NOT NULL,
  confidence REAL,
  school TEXT,
  evidence_json TEXT NOT NULL,
  text_key TEXT NOT NULL,
  rendered TEXT NOT NULL,
  content_version TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS period (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  level INTEGER NOT NULL,
  lord TEXT NOT NULL,
  parent_id TEXT,
  start_utc TEXT NOT NULL,
  end_utc TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS transit_window (
  id TEXT PRIMARY KEY,
  planet TEXT NOT NULL,
  sign TEXT NOT NULL,
  h_lagna INTEGER,
  h_moon INTEGER,
  bindus INTEGER,
  start_utc TEXT NOT NULL,
  end_utc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_finding_theme ON finding(theme, strength DESC);
CREATE INDEX IF NOT EXISTS idx_fact_subject ON fact(subject, type);
`;

export interface ChartWorkspace {
  db: Database.Database;
  factSet: ChartFactSet;
  buildMs: number;
  getFact(id: string): Fact | null;
  getFactsBySubject(subject: string): Fact[];
  close(): void;
}

/**
 * Materializes all facts, edges, periods, and transit windows into an in-memory (or file-backed)
 * SQLite chart.db workspace in a single transaction.
 */
export function buildChartWorkspace(
  input: ChartWorkspaceInput,
  dbPath: string = ':memory:',
): ChartWorkspace {
  const t0 = performance.now();
  const factSet = emitChartFacts(input);
  const db = new Database(dbPath);

  if (dbPath !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }
  db.exec(CHART_DB_SCHEMA);

  const insertFact = db.prepare(`
    INSERT OR REPLACE INTO fact (id, type, subject, args_json, value, h_lagna, h_moon, source_module)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertEdge = db.prepare(`
    INSERT OR REPLACE INTO edge (src, dst, rel)
    VALUES (?, ?, ?)
  `);
  const insertPeriod = db.prepare(`
    INSERT OR REPLACE INTO period (id, kind, level, lord, parent_id, start_utc, end_utc)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertTransit = db.prepare(`
    INSERT OR REPLACE INTO transit_window (id, planet, sign, h_lagna, h_moon, bindus, start_utc, end_utc)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const runTx = db.transaction(() => {
    for (const f of factSet.facts) {
      insertFact.run(
        f.id,
        f.type,
        f.subject,
        JSON.stringify(f.args),
        f.value !== undefined ? String(f.value) : null,
        f.houseFrom.lagna,
        f.houseFrom.moon,
        f.sourceModule,
      );
    }
    for (const e of factSet.edges) {
      insertEdge.run(e.src, e.dst, e.rel);
    }
    for (const p of factSet.periods) {
      insertPeriod.run(p.id, p.kind, p.level, p.lord, p.parentId, p.startUtc, p.endUtc);
    }
    for (const tw of factSet.transitWindows) {
      insertTransit.run(tw.id, tw.planet, tw.sign, tw.hLagna, tw.hMoon, tw.bindus, tw.startUtc, tw.endUtc);
    }
  });

  runTx();
  const buildMs = Number((performance.now() - t0).toFixed(2));

  const selectById = db.prepare('SELECT * FROM fact WHERE id = ?');
  const selectBySubject = db.prepare('SELECT * FROM fact WHERE subject = ?');

  const rowToFact = (row: any): Fact => ({
    id: row.id,
    type: row.type,
    subject: row.subject,
    args: JSON.parse(row.args_json),
    value:
      row.value === 'true'
        ? true
        : row.value === 'false'
        ? false
        : row.value !== null && !Number.isNaN(Number(row.value)) && row.value !== ''
        ? Number(row.value)
        : row.value ?? undefined,
    houseFrom: { lagna: row.h_lagna, moon: row.h_moon },
    sourceModule: row.source_module,
  });

  return {
    db,
    factSet,
    buildMs,
    getFact: (id: string) => {
      const row = selectById.get(id);
      return row ? rowToFact(row) : null;
    },
    getFactsBySubject: (subject: string) => {
      const rows = selectBySubject.all(subject);
      return rows.map(rowToFact);
    },
    close: () => db.close(),
  };
}
