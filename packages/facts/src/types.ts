import type {
  NatalChart,
  ShadbalaResult,
  AshtakvargaResult,
  VimshottariDashaTree,
  TransitOverview,
  GrahaAvasthas,
  VarshaphalResult,
} from '@astro/engine';

export type FactType =
  | 'placement'
  | 'lordship'
  | 'aspect'
  | 'conjunction'
  | 'dignity'
  | 'nakshatra'
  | 'dasha'
  | 'transit'
  | 'varga'
  | 'strength'
  | 'avastha'
  | 'arudha'
  | 'karaka'
  | 'special_lagna'
  | 'upagraha'
  | 'vaisheshikamsa'
  | 'pushkara'
  | 'navatara'
  | 'special_nakshatra'
  | 'kakshya'
  | 'vedha'
  | 'saham';

export type Fact = {
  id: string; // readable and stable, e.g. placement.rahu, conj.rahu.venus, lord.house4
  type: FactType;
  subject: string; // planet, house or sign id
  args: Record<string, string | number | boolean>;
  value?: number | string | boolean;
  houseFrom: { lagna: number; moon: number };
  sourceModule: string; // engine function that produced it
};

export type EdgeRel =
  | 'evidence_of'
  | 'conjunct'
  | 'aspects'
  | 'lord_of'
  | 'in_house'
  | 'arudha_of'
  | 'karaka_of';

export type Edge = {
  src: string;
  dst: string;
  rel: EdgeRel;
};

export type PeriodRow = {
  id: string;
  kind: 'vimshottari';
  level: 1 | 2 | 3; // 1 = Mahadasha, 2 = Antardasha, 3 = Pratyantardasha
  lord: string;
  parentId: string | null;
  startUtc: string;
  endUtc: string;
};

export type TransitWindowRow = {
  id: string;
  planet: string;
  sign: string;
  hLagna: number | null;
  hMoon: number | null;
  bindus: number | null;
  startUtc: string;
  endUtc: string;
};

export interface FactEmitterOptions {
  rahuKetuAspects?: boolean; // school setting: 5th, 7th, 9th aspects for Rahu/Ketu
  referenceDateIso?: string; // ISO date to resolve current running dasha
}

export interface ChartWorkspaceInput {
  natal: NatalChart;
  shadbala?: ShadbalaResult | null;
  ashtakvarga?: AshtakvargaResult | null;
  dashas?: VimshottariDashaTree | null;
  transits?: TransitOverview | null;
  avasthas?: Record<string, GrahaAvasthas> | null;
  varshaphal?: VarshaphalResult | null;
  options?: FactEmitterOptions;
}

export interface ChartFactSet {
  facts: Fact[];
  edges: Edge[];
  periods: PeriodRow[];
  transitWindows: TransitWindowRow[];
}
