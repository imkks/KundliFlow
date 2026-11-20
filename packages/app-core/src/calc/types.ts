import type {
  NatalChart,
  NatalDigest,
  DayView,
  MonthView,
  YearView,
  HourScore,
  BirthInput,
  NatalSettings,
} from '@astro/engine';

export interface CalcEnvelope<T> {
  meta: {
    engineVersion: string;
    computedAt: string;
  };
  data: T;
}

export interface CalcProvider {
  computeNatal(birth: BirthInput, settings: NatalSettings): Promise<CalcEnvelope<{ chart: NatalChart; digest: NatalDigest }>>;
  buildDay(digest: NatalDigest, dateStr: string, tzId?: string): Promise<CalcEnvelope<DayView>>;
  buildMonth(digest: NatalDigest, year: number, month: number, tzId?: string): Promise<CalcEnvelope<MonthView>>;
  buildYear(digest: NatalDigest, year: number, tzId?: string): Promise<CalcEnvelope<YearView>>;
}
