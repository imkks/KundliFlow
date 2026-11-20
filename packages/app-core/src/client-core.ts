import {
  ProfileRepository,
  NatalChartRepository,
  HourlyScoreRepository,
  JournalRepository,
  type SqliteDb,
  type HourlyScoreRecord,
  type JournalEntryWithSnapshot,
  type SkySnapshotRecord,
} from '@astro/store';
import type { BirthInput, NatalSettings } from '@astro/engine';
import { getCalcProvider } from './calc/local-calc-provider.js';

export interface OnboardingParams {
  id: string;
  name?: string;
  birth: BirthInput;
  settings: NatalSettings;
}

export interface NowViewData {
  profile: {
    name?: string | undefined;
    placeName?: string | undefined;
  };
  hourScore: {
    score: number;
    band: string;
    bandLabel: string;
    text: string;
    factors: Array<{ id: string; name: string; value: number; summary: string }>;
  };
  nextFlowingWindow?: string | undefined;
  panchangSummary?: string | undefined;
}

/**
 * High-level coordinator following spec §12.1 rules:
 * UI never calls calculation or network directly; it always reads through use-cases & repositories.
 */
export class ClientCore {
  private profileRepo: ProfileRepository;
  private natalRepo: NatalChartRepository;
  private hourlyRepo: HourlyScoreRepository;
  private journalRepo: JournalRepository;

  constructor(private db: SqliteDb) {
    this.profileRepo = new ProfileRepository(db);
    this.natalRepo = new NatalChartRepository(db);
    this.hourlyRepo = new HourlyScoreRepository(db);
    this.journalRepo = new JournalRepository(db);
  }

  /**
   * Onboarding use case:
   * 1. Calls calcProvider to compute natal chart and digest
   * 2. Persists profile, settings and chart to local SQLite
   * 3. Prefetches day bundle and writes hourly scores into local SQLite
   */
  async onboard(params: OnboardingParams): Promise<void> {
    const calc = getCalcProvider();
    const env = await calc.computeNatal(params.birth, params.settings);
    const { chart, digest } = env.data;

    // 1. Save profile
    this.profileRepo.save({
      id: params.id,
      name: params.name,
      birthUtc: chart.time.birthUtc,
      birthLocal: chart.time.birthLocal,
      tzId: params.birth.tzId,
      lat: params.birth.lat,
      lon: params.birth.lon,
      placeName: params.birth.placeName,
      timeCertainty: params.birth.timeCertainty,
      createdAt: new Date().toISOString(),
    });

    // 2. Save chart & digest
    this.natalRepo.save({
      profileId: params.id,
      engineVersion: env.meta.engineVersion,
      settingsHash: 'default_lahiri',
      digestJson: JSON.stringify(digest),
      json: JSON.stringify(chart),
      computedAt: env.meta.computedAt,
    });

    // 3. Prefetch day view & store hourly scores locally
    const todayStr = params.birth.date;
    const dayEnv = await calc.buildDay(digest, todayStr, params.birth.tzId);
    const dayData = dayEnv.data;

    const hourlyRecords: HourlyScoreRecord[] = dayData.hourlyScores.map((hs: any, idx: number) => {
      const hourUtc = `${todayStr}T${String(idx).padStart(2, '0')}:00:00Z`;
      return {
        profileId: params.id,
        hourUtc,
        score: hs.score,
        band: hs.band,
        factorsJson: JSON.stringify(hs.factors),
        text: hs.text,
        scoringVersion: hs.scoringVersion,
      };
    });

    this.hourlyRepo.saveBatch(hourlyRecords);
  }

  /**
   * Reads Now Screen data completely offline from SQLite database.
   */
  getNowView(profileId: string, currentHourUtc: string): NowViewData | null {
    const profile = this.profileRepo.get(profileId);
    if (!profile) return null;

    const hourRecord = this.hourlyRepo.getHour(profileId, currentHourUtc);
    if (!hourRecord) return null;

    const factors = JSON.parse(hourRecord.factorsJson);

    return {
      profile: {
        name: profile.name,
        placeName: profile.placeName,
      },
      hourScore: {
        score: hourRecord.score,
        band: hourRecord.band,
        bandLabel: hourRecord.band === 'flowing' ? 'Flowing' : hourRecord.band === 'go_gently' ? 'Go gently' : 'Steady',
        text: hourRecord.text,
        factors,
      },
    };
  }

  /**
   * Logs a new journal entry with an immutable sky snapshot.
   */
  logEntry(params: {
    profileId: string;
    mood: number;
    energy: number;
    body?: string;
    kind: 'checkin' | 'event' | 'reflection';
    tags?: string[];
    atUtc?: string;
    skyDetails?: {
      moonSign?: string;
      moonNakshatra?: string;
      horaRuler?: string;
      dasha?: string;
      score?: number;
      band?: string;
      factors?: Array<{ description: string; points: number }>;
    };
  }): JournalEntryWithSnapshot {
    const atUtc = params.atUtc || new Date().toISOString();
    const entryId = 'entry_' + Math.random().toString(36).substring(2, 11);
    const snapId = 'snap_' + Math.random().toString(36).substring(2, 11);

    // Look up covering hour if available
    const hourUtc = atUtc.slice(0, 13) + ':00:00Z';
    const hourRecord = this.hourlyRepo.getHour(params.profileId, hourUtc);

    const score = params.skyDetails?.score ?? hourRecord?.score ?? 0;
    const band = params.skyDetails?.band ?? hourRecord?.band ?? 'steady';

    const snapshotPayload = {
      transitMoon: {
        sign: params.skyDetails?.moonSign ?? 'pisces',
        nakshatra: params.skyDetails?.moonNakshatra ?? 'uttarabhadra',
      },
      horaRuler: params.skyDetails?.horaRuler ?? 'sun',
      dasha: params.skyDetails?.dasha ?? 'rahu-saturn',
      score,
      band,
      factors: params.skyDetails?.factors ?? (hourRecord ? JSON.parse(hourRecord.factorsJson) : []),
    };

    const snapshot: SkySnapshotRecord = {
      id: snapId,
      profileId: params.profileId,
      atUtc,
      engineVersion: '1.0.0',
      scoringVersion: 's1',
      band,
      score,
      json: JSON.stringify(snapshotPayload),
    };

    this.journalRepo.saveEntry({
      id: entryId,
      profileId: params.profileId,
      atUtc,
      mood: params.mood,
      energy: params.energy,
      body: params.body,
      kind: params.kind,
      snapshot,
      tags: params.tags,
    });

    const entries = this.journalRepo.getEntries(params.profileId, { limit: 1 });
    return entries[0]!;
  }

  getJournalEntries(
    profileId: string,
    filter?: { tag?: string; mood?: number; band?: string; limit?: number },
  ): JournalEntryWithSnapshot[] {
    return this.journalRepo.getEntries(profileId, filter);
  }

  deleteJournalEntry(id: string, hard = false): void {
    this.journalRepo.deleteEntry(id, hard);
  }

  getJournalTags(): string[] {
    return this.journalRepo.getAllTags();
  }
}
