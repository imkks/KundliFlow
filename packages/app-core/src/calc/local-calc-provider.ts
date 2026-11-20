import {
  loadEphemeris,
  resolveBirthTime,
  computePositions,
  createNatalDigest,
  buildDay,
  buildMonth,
  buildYear,
  type BirthInput,
  type NatalSettings,
  type EphemerisProvider,
} from '@astro/engine';
import type { CalcProvider, CalcEnvelope } from './types.js';

/**
 * In-process or Worker Calculation Provider.
 * Satisfies the CalcProvider contract purely client-side without any HTTP network calls.
 */
export class LocalCalcProvider implements CalcProvider {
  private ephPromise: Promise<EphemerisProvider>;

  constructor(providerId?: string) {
    this.ephPromise = loadEphemeris(providerId);
  }

  async computeNatal(
    birth: BirthInput,
    settings: NatalSettings,
  ): Promise<CalcEnvelope<{ chart: any; digest: any }>> {
    const eph = await this.ephPromise;
    const timeRes = resolveBirthTime(birth);
    if (!timeRes.success) {
      throw new Error(`Time resolution failed: ${timeRes.message}`);
    }

    const chart = computePositions(
      eph,
      timeRes.resolved,
      { name: birth.placeName, lat: birth.lat, lon: birth.lon },
      settings,
    );
    const digest = createNatalDigest(chart);

    return {
      meta: {
        engineVersion: chart.engineVersion,
        computedAt: new Date().toISOString(),
      },
      data: { chart, digest },
    };
  }

  async buildDay(digest: any, dateStr: string, tzId = 'Asia/Kolkata'): Promise<CalcEnvelope<any>> {
    const eph = await this.ephPromise;
    const day = buildDay(eph, digest, dateStr, tzId);
    return {
      meta: {
        engineVersion: eph.version,
        computedAt: new Date().toISOString(),
      },
      data: day,
    };
  }

  async buildMonth(digest: any, year: number, month: number, tzId = 'Asia/Kolkata'): Promise<CalcEnvelope<any>> {
    const eph = await this.ephPromise;
    const mv = buildMonth(eph, digest, year, month, tzId);
    return {
      meta: {
        engineVersion: eph.version,
        computedAt: new Date().toISOString(),
      },
      data: mv,
    };
  }

  async buildYear(digest: any, year: number, tzId = 'Asia/Kolkata'): Promise<CalcEnvelope<any>> {
    const eph = await this.ephPromise;
    const yv = buildYear(eph, digest, year, tzId);
    return {
      meta: {
        engineVersion: eph.version,
        computedAt: new Date().toISOString(),
      },
      data: yv,
    };
  }
}

let activeCalcProvider: CalcProvider = new LocalCalcProvider();

export const getCalcProvider = (): CalcProvider => activeCalcProvider;

export const setCalcProvider = (provider: CalcProvider): void => {
  activeCalcProvider = provider;
};
