import { describe, it, expect, beforeAll } from 'vitest';
import Database from 'better-sqlite3';
import { SCHEMA_SQL } from '@astro/store';
import { ClientCore } from '../src/index.js';

describe('M5 Client Core & Local SQLite Persistence Suite', () => {
  let db: any;
  let core: ClientCore;

  beforeAll(() => {
    // In-memory SQLite simulating browser SQLite WASM
    db = new Database(':memory:');
    db.exec(SCHEMA_SQL);
    core = new ClientCore(db);
  });

  it('completes onboarding, saves natal chart & digest, and prefetches hourly scores into SQLite', async () => {
    await core.onboard({
      id: 'usr_jamshedpur_01',
      name: 'Krishna Kumar Singh',
      birth: {
        date: '1998-09-07',
        time: '23:20:34',
        tzId: 'Asia/Kolkata',
        placeName: 'Jamshedpur',
        lat: 22.8,
        lon: 86.16666666666667,
        timeCertainty: 'exact',
      },
      settings: {
        ayanamsa: 'lahiri',
        nodeType: 'mean',
      },
    });

    // Check DB directly: profile must exist
    const profileRow = db.prepare('SELECT * FROM profile WHERE id = ?').get('usr_jamshedpur_01');
    expect(profileRow).toBeDefined();
    expect(profileRow.place_name).toBe('Jamshedpur');

    // Natal chart must exist with digest_json
    const chartRow = db.prepare('SELECT * FROM natal_chart WHERE profile_id = ?').get('usr_jamshedpur_01');
    expect(chartRow).toBeDefined();
    expect(chartRow.digest_json).toContain('"sign":"pisces"'); // Moon in Pisces

    // Hourly scores table must have 24 hours prefetched
    const scoreCount = db.prepare('SELECT count(*) as count FROM hourly_score WHERE profile_id = ?').get('usr_jamshedpur_01');
    expect(scoreCount.count).toBe(24);
  });

  it('renders Now screen completely offline by reading only from the local database', () => {
    // Read hour 12:00 UTC from local SQLite
    const nowView = core.getNowView('usr_jamshedpur_01', '1998-09-07T12:00:00Z');

    expect(nowView).not.toBeNull();
    if (!nowView) return;

    expect(nowView.profile.name).toBe('Krishna Kumar Singh');
    expect(nowView.profile.placeName).toBe('Jamshedpur');
    expect(typeof nowView.hourScore.score).toBe('number');
    expect(['flowing', 'steady', 'go_gently']).toContain(nowView.hourScore.band);
    expect(nowView.hourScore.text.length).toBeGreaterThan(10);
    expect(nowView.hourScore.factors.length).toBeGreaterThan(0);
  });

  it('returns null gracefully when requesting un-cached hours', () => {
    const unCached = core.getNowView('usr_jamshedpur_01', '2030-01-01T00:00:00Z');
    expect(unCached).toBeNull();
  });

  it('logs a journal entry with an immutable sky snapshot and verifies persistence', () => {
    const entry = core.logEntry({
      profileId: 'usr_jamshedpur_01',
      mood: 4,
      energy: 5,
      kind: 'checkin',
      body: 'Focused deep work session on Vedic engines. Clear mental flow.',
      tags: ['work', 'focus'],
      atUtc: '1998-09-07T12:30:00Z',
    });

    expect(entry.id).toBeDefined();
    expect(entry.mood).toBe(4);
    expect(entry.energy).toBe(5);
    expect(entry.body).toContain('Focused deep work session');
    expect(entry.tags.sort()).toEqual(['focus', 'work']);
    expect(entry.snapshot).toBeDefined();
    expect(entry.snapshot?.score).toBeDefined();
    expect(entry.snapshot?.band).toBeDefined();

    // Verify retrieval
    const allEntries = core.getJournalEntries('usr_jamshedpur_01');
    expect(allEntries.length).toBe(1);
    expect(allEntries[0]!.id).toBe(entry.id);

    // Verify filter by tag
    const workEntries = core.getJournalEntries('usr_jamshedpur_01', { tag: 'work' });
    expect(workEntries.length).toBe(1);
    const familyEntries = core.getJournalEntries('usr_jamshedpur_01', { tag: 'family' });
    expect(familyEntries.length).toBe(0);

    // Verify filter by mood
    const highMood = core.getJournalEntries('usr_jamshedpur_01', { mood: 4 });
    expect(highMood.length).toBe(1);
    const lowMood = core.getJournalEntries('usr_jamshedpur_01', { mood: 1 });
    expect(lowMood.length).toBe(0);

    // Verify soft delete
    core.deleteJournalEntry(entry.id);
    const remaining = core.getJournalEntries('usr_jamshedpur_01');
    expect(remaining.length).toBe(0);
  });
});
