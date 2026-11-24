import fs from 'node:fs';
import Database from 'better-sqlite3';
import { load as parseYaml } from 'js-yaml';
import {
  ConceptsFileSchema,
  TopicsFileSchema,
  type KbItem,
  type TopicMap,
} from './schema.js';

export const KB_SCHEMA = `
CREATE TABLE IF NOT EXISTS kb_item (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  text TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'en',
  planets TEXT,
  houses TEXT,
  signs TEXT,
  themes TEXT,
  polarity TEXT,
  school TEXT,
  source TEXT,
  reviewed INTEGER NOT NULL DEFAULT 0,
  version TEXT NOT NULL
);
CREATE VIRTUAL TABLE IF NOT EXISTS kb_fts USING fts5(
  id UNINDEXED,
  text,
  themes,
  planets,
  houses,
  content='kb_item',
  content_rowid='rowid'
);
CREATE TRIGGER IF NOT EXISTS kb_item_ai AFTER INSERT ON kb_item BEGIN
  INSERT INTO kb_fts(rowid, id, text, themes, planets, houses)
  VALUES (new.rowid, new.id, new.text, coalesce(new.themes,''), coalesce(new.planets,''), coalesce(new.houses,''));
END;
CREATE TABLE IF NOT EXISTS kb_embedding (
  item_id TEXT PRIMARY KEY REFERENCES kb_item(id),
  model TEXT NOT NULL,
  vec BLOB NOT NULL
);
CREATE TABLE IF NOT EXISTS topic_map (
  id TEXT PRIMARY KEY,
  json TEXT NOT NULL,
  reviewed INTEGER NOT NULL DEFAULT 1,
  version TEXT NOT NULL
);
`;

export interface KbSearchFilters {
  type?: string;
  planet?: string;
  house?: number;
  theme?: string;
}

export interface KnowledgeBase {
  db: Database.Database;
  topics: TopicMap[];
  ingestConceptsFile(filePath: string): number;
  ingestTopicsFile(filePath: string): number;
  ingestItems(items: KbItem[]): number;
  searchKnowledge(query: string, filters?: KbSearchFilters, k?: number): KbItem[];
  getTopic(id: string): TopicMap | null;
  matchTopic(topicOrQuestion: string): TopicMap;
  close(): void;
}

const SYNONYM_MAP: Record<string, string[]> = {
  sukha: ['4th', 'house4', 'home', 'mother', 'peace', 'property'],
  home: ['4th', 'sukha', 'mother', 'property', 'domestic'],
  karma: ['10th', 'house10', 'career', 'profession', 'status'],
  career: ['10th', 'karma', 'd10', 'dashamsha', 'profession', 'work'],
  kalatra: ['7th', 'house7', 'marriage', 'spouse', 'partnership'],
  marriage: ['7th', 'kalatra', 'venus', 'd9', 'navamsha', 'spouse'],
  dhana: ['2nd', 'house2', '11th', 'wealth', 'money', 'finance'],
  wealth: ['2nd', '11th', 'dhana', 'labha', 'money'],
  surya: ['sun', 'atma'],
  chandra: ['moon', 'manas'],
  mangala: ['mars', 'kuja'],
  budha: ['mercury'],
  guru: ['jupiter', 'brihaspati'],
  shukra: ['venus'],
  shani: ['saturn', 'sade_sati'],
  lagna: ['1st', 'ascendant', 'tanu'],
  moksha: ['12th', 'vyaya', 'ketu', 'spirituality'],
};

function expandQueryTokens(rawQuery: string): string[] {
  const baseTokens = rawQuery
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);

  const expanded = new Set<string>(baseTokens);
  for (const tok of baseTokens) {
    const syns = SYNONYM_MAP[tok];
    if (syns) {
      for (const s of syns) expanded.add(s);
    }
  }
  return Array.from(expanded);
}

const TOPIC_KEYWORDS: Record<string, string[]> = {
  home_family: ['home', 'house', 'family', 'mother', 'property', 'real estate', 'peace', 'living', 'domestic'],
  career: ['career', 'job', 'work', 'profession', 'promotion', 'boss', 'business', 'status', 'office'],
  money: ['money', 'wealth', 'income', 'salary', 'finance', 'saving', 'rich', 'debt', 'cash'],
  relationships: ['marriage', 'partner', 'spouse', 'love', 'relationship', 'wife', 'husband', 'dating'],
  education: ['study', 'education', 'exam', 'college', 'degree', 'learn', 'school'],
  children_progeny: ['child', 'children', 'progeny', 'kids', 'son', 'daughter', 'baby', 'conception', 'pregnancy'],
  travel_relocation: ['travel', 'relocat', 'foreign', 'abroad', 'visa', 'settle abroad', 'moving country', 'journey', 'immigration'],
  disputes_litigation: ['dispute', 'litigation', 'court', 'lawsuit', 'legal', 'enemy', 'enemies', 'conflict', 'adversary'],
  health_routine: ['health', 'sick', 'ill', 'disease', 'routine', 'stress', 'fitness', 'sleep', 'body'],
  self_personality: ['self', 'personality', 'who am i', 'nature', 'temperament', 'strength', 'weakness'],
  year_ahead: ['year', '2026', '2027', 'ahead', 'upcoming', 'forecast', 'next 12'],
  decision_timing: ['when', 'timing', 'should i', 'best time', 'decide', 'switch', 'move'],
  spirituality: ['spirit', 'meditation', 'dharma', 'purpose', 'karma', 'moksha', 'soul'],
};

export function createKnowledgeBase(dbPath: string = ':memory:'): KnowledgeBase {
  const db = new Database(dbPath);
  db.exec(KB_SCHEMA);

  const topicsCache: TopicMap[] = [];

  const insertItem = db.prepare(`
    INSERT OR REPLACE INTO kb_item
      (id, type, text, lang, planets, houses, signs, themes, polarity, school, source, reviewed, version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTopic = db.prepare(`
    INSERT OR REPLACE INTO topic_map (id, json, reviewed, version)
    VALUES (?, ?, 1, ?)
  `);

  const ingestItems = (items: KbItem[]): number => {
    const tx = db.transaction(() => {
      for (const item of items) {
        insertItem.run(
          item.id,
          item.type,
          item.text,
          item.lang,
          item.planets ?? null,
          item.houses ?? null,
          item.signs ?? null,
          item.themes ?? null,
          item.polarity ?? null,
          item.school ?? null,
          item.source ?? null,
          item.reviewed,
          item.version,
        );
      }
    });
    tx();
    return items.length;
  };

  const ingestConceptsFile = (filePath: string): number => {
    const raw = parseYaml(fs.readFileSync(filePath, 'utf8'));
    const parsed = ConceptsFileSchema.parse(raw);
    return ingestItems(
      parsed.items.map((it) => ({ ...it, version: it.version || parsed.version })),
    );
  };

  const ingestTopicsFile = (filePath: string): number => {
    const raw = parseYaml(fs.readFileSync(filePath, 'utf8'));
    const parsed = TopicsFileSchema.parse(raw);
    const tx = db.transaction(() => {
      for (const t of parsed.topics) {
        insertTopic.run(t.id, JSON.stringify(t), parsed.version);
        const idx = topicsCache.findIndex((x) => x.id === t.id);
        if (idx >= 0) topicsCache[idx] = t;
        else topicsCache.push(t);
      }
    });
    tx();
    return parsed.topics.length;
  };

  const searchKnowledge = (query: string, filters: KbSearchFilters = {}, k: number = 5): KbItem[] => {
    const clauses: string[] = ['k.reviewed = 1'];
    const params: any[] = [];

    if (filters.type) {
      clauses.push('k.type = ?');
      params.push(filters.type);
    }
    if (filters.planet) {
      clauses.push('k.planets LIKE ?');
      params.push(`%${filters.planet}%`);
    }
    if (filters.house !== undefined) {
      clauses.push('(k.houses = ? OR k.houses LIKE ? OR k.houses LIKE ? OR k.houses LIKE ?)');
      const h = String(filters.house);
      params.push(h, `${h},%`, `%,${h}`, `%,${h},%`);
    }
    if (filters.theme) {
      clauses.push('k.themes LIKE ?');
      params.push(`%${filters.theme}%`);
    }

    const tokens = expandQueryTokens(query);
    if (tokens.length > 0) {
      const ftsTokens = tokens.map((w) => `"${w}"`).join(' OR ');
      const sql = `
        SELECT k.*, bm25(kb_fts) AS rank_score
        FROM kb_fts f
        JOIN kb_item k ON k.id = f.id
        WHERE kb_fts MATCH ? AND ${clauses.join(' AND ')}
        ORDER BY rank_score ASC
        LIMIT ?
      `;
      try {
        const rows = db.prepare(sql).all(ftsTokens, ...params, k) as KbItem[];
        if (rows.length > 0) return rows;
      } catch {
        // fallback to metadata query if FTS syntax edge case
      }
    }

    const sql = `SELECT k.* FROM kb_item k WHERE ${clauses.join(' AND ')} LIMIT ?`;
    return db.prepare(sql).all(...params, k) as KbItem[];
  };

  const getTopic = (id: string): TopicMap | null => {
    const cached = topicsCache.find((t) => t.id === id);
    if (cached) return cached;
    const row = db.prepare('SELECT json FROM topic_map WHERE id = ? AND reviewed = 1').get(id) as
      | { json: string }
      | undefined;
    return row ? (JSON.parse(row.json) as TopicMap) : null;
  };

  const matchTopic = (topicOrQuestion: string): TopicMap => {
    const exact = getTopic(topicOrQuestion.trim().toLowerCase());
    if (exact) return exact;

    const q = topicOrQuestion.toLowerCase();
    let bestId = 'year_ahead';
    let bestScore = 0;

    for (const [tid, kws] of Object.entries(TOPIC_KEYWORDS)) {
      let score = 0;
      for (const kw of kws) {
        if (q.includes(kw)) score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        bestId = tid;
      }
    }

    return getTopic(bestId) ?? topicsCache[0]!;
  };

  return {
    db,
    topics: topicsCache,
    ingestConceptsFile,
    ingestTopicsFile,
    ingestItems,
    searchKnowledge,
    getTopic,
    matchTopic,
    close: () => db.close(),
  };
}
