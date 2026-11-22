import {
  buildDay,
  calculateKpPlacement,
  calculateVargaSign,
  computeAshtakoota,
  computeAshtakvarga,
  computeArudhaPadas,
  computeAvakahada,
  computeBhavaAnalysis,
  computeCharaDashas,
  computeCharaKarakas,
  computeFavourableAndGhatak,
  computeMutualAspects,
  computePanchadhaFriendship,
  computePanchang,
  computePlanetaryAvasthas,
  computeShadbala,
  computeSripatiChalit,
  computeTransits,
  computeUpagrahas,
  computeVarshaphal,
  computeVimshottariDashas,
  computeYoginiDashas,
  createNatalDigest,
  detectYogasAndDoshas,
  houseFromSign,
  KARAKA_NAMES,
  loadEphemeris,
  type ArudhaPadaItem,
  type AshtakootaResult,
  type AshtakvargaResult,
  type AvakahadaDetails,
  type ChalitChart,
  type CharaDashaTree,
  type CharaKaraka,
  type DayView,
  type DetectedAspect,
  type EphemerisProvider,
  type FavourableAndGhatakResult,
  type GrahaAvasthas,
  type HouseDossier,
  type NatalChart,
  type PanchangResult,
  type ShadbalaResult,
  type TransitOverview,
  type UpagrahaPosition,
  type VargaType,
  type VarshaphalResult,
  type VimshottariDashaTree,
  type YogaDetection,
  type YoginiDashaTree,
} from '@astro/engine';
import { PLANET_IDS, SIGN_IDS, type PlanetId } from '@astro/facts';

export interface CharaKarakaEntry {
  karaka: CharaKaraka;
  role: string;
  graha: string;
  degInSign: number;
  sign: string;
}

export interface JournalContextEntry {
  id: string;
  entryDate: string;
  note: string;
  energy: number;
  focus: number;
  mood: number;
  skySnapshot?: {
    horaRuler?: string;
    moonSign?: string;
    moonNakshatra?: string;
    band?: string;
    score?: number;
  };
}

export interface EngineSessionInput {
  natal: NatalChart;
  shadbala?: ShadbalaResult | null;
  ashtakvarga?: AshtakvargaResult | null;
  dashas?: VimshottariDashaTree | null;
  transits?: TransitOverview | null;
  avasthas?: Record<string, GrahaAvasthas> | null;
  journalEntries?: JournalContextEntry[];
}

/**
 * Lazy, memoized engine wrapper over a NatalChart.
 * Computes any Level 1 engine module on demand in < 2 ms without bloating initial payloads.
 */
export class EngineSession {
  readonly natal: NatalChart;
  private _shadbala: ShadbalaResult | null;
  private _ashtakvarga: AshtakvargaResult | null;
  private _vimshottari: VimshottariDashaTree | null;
  private _yogini: YoginiDashaTree | null = null;
  private _chara: CharaDashaTree | null = null;
  private _transits: TransitOverview | null;
  private _avasthas: Record<string, GrahaAvasthas> | null;
  private _chalit: ChalitChart | null = null;
  private _yogas: YogaDetection[] | null = null;
  private _karakas: CharaKarakaEntry[] | null = null;
  private _avakahada: AvakahadaDetails | null = null;
  private _ghatak: FavourableAndGhatakResult | null = null;
  private _aspects: DetectedAspect[] | null = null;
  private _panchang: PanchangResult | null = null;
  private _bhavas: HouseDossier[] | null = null;
  private _upagrahas: UpagrahaPosition[] | null = null;
  private _arudhas: ArudhaPadaItem[] | null = null;
  private _varshaphalCache = new Map<number, VarshaphalResult>();
  private _muhurtaCache = new Map<string, DayView>();
  private _eph: EphemerisProvider | null = null;
  private _journalEntries: JournalContextEntry[];

  constructor(input: EngineSessionInput) {
    this.natal = input.natal;
    this._shadbala = input.shadbala ?? null;
    this._ashtakvarga = input.ashtakvarga ?? null;
    this._vimshottari = input.dashas ?? null;
    this._transits = input.transits ?? null;
    this._avasthas = input.avasthas ?? null;
    this._journalEntries = input.journalEntries ?? [];
  }

  getJournalEntries(): JournalContextEntry[] {
    return this._journalEntries;
  }

  getShadbala(): ShadbalaResult {
    if (!this._shadbala) this._shadbala = computeShadbala(this.natal);
    return this._shadbala;
  }

  getAshtakvarga(): AshtakvargaResult {
    if (!this._ashtakvarga) {
      this._ashtakvarga = computeAshtakvarga({
        sun: this.natal.grahas.sun.signIndex,
        moon: this.natal.grahas.moon.signIndex,
        mars: this.natal.grahas.mars.signIndex,
        mercury: this.natal.grahas.mercury.signIndex,
        jupiter: this.natal.grahas.jupiter.signIndex,
        venus: this.natal.grahas.venus.signIndex,
        saturn: this.natal.grahas.saturn.signIndex,
        lagna: this.natal.lagna?.signIndex ?? 0,
      });
    }
    return this._ashtakvarga;
  }

  getVimshottari(): VimshottariDashaTree {
    if (!this._vimshottari) {
      const m = this.natal.grahas.moon;
      this._vimshottari = computeVimshottariDashas(
        m.nakshatraIndex,
        m.elapsedInNakshatra,
        this.natal.time.birthLocal,
        3,
      );
    }
    return this._vimshottari;
  }

  getYogini(): YoginiDashaTree {
    if (!this._yogini) {
      const m = this.natal.grahas.moon;
      this._yogini = computeYoginiDashas(
        m.nakshatraIndex,
        m.elapsedInNakshatra,
        this.natal.time.birthLocal,
      );
    }
    return this._yogini;
  }

  getChara(): CharaDashaTree {
    if (!this._chara) {
      this._chara = computeCharaDashas(
        this.natal.lagna?.signIndex ?? 0,
        this.natal.time.birthLocal,
        this.natal.grahas,
      );
    }
    return this._chara;
  }

  getTransits(): TransitOverview | null {
    return this._transits;
  }

  getAvasthas(): Record<string, GrahaAvasthas> {
    if (!this._avasthas) {
      this._avasthas = computePlanetaryAvasthas(this.natal.grahas);
    }
    return this._avasthas;
  }

  getChalit(): ChalitChart | null {
    if (!this._chalit && this.natal.lagna) {
      const lagnaLon = this.natal.lagna.lon;
      const mcLon = (lagnaLon + 270) % 360;
      this._chalit = computeSripatiChalit(lagnaLon, mcLon);
    }
    return this._chalit;
  }

  getKpPlacements() {
    const out: Record<string, ReturnType<typeof calculateKpPlacement>> = {};
    if (this.natal.lagna) {
      out.lagna = calculateKpPlacement(this.natal.lagna.lon);
    }
    for (const p of PLANET_IDS) {
      const g = this.natal.grahas[p];
      if (g) out[p] = calculateKpPlacement(g.lon);
    }
    return out;
  }

  getFriendships() {
    return computePanchadhaFriendship({
      sun: this.natal.grahas.sun.signIndex,
      moon: this.natal.grahas.moon.signIndex,
      mars: this.natal.grahas.mars.signIndex,
      mercury: this.natal.grahas.mercury.signIndex,
      jupiter: this.natal.grahas.jupiter.signIndex,
      venus: this.natal.grahas.venus.signIndex,
      saturn: this.natal.grahas.saturn.signIndex,
    });
  }

  getYogas(): YogaDetection[] {
    if (!this._yogas) this._yogas = detectYogasAndDoshas(this.natal);
    return this._yogas;
  }

  getKarakas(): CharaKarakaEntry[] {
    if (!this._karakas) {
      const map = computeCharaKarakas(this.natal.grahas);
      const order: CharaKaraka[] = ['AK', 'AmK', 'BK', 'MK', 'PK', 'GK', 'DK'];
      const entries: CharaKarakaEntry[] = [];
      for (const [graha, karaka] of Object.entries(map)) {
        const g = this.natal.grahas[graha as PlanetId];
        entries.push({
          karaka,
          role: KARAKA_NAMES[karaka],
          graha,
          degInSign: g?.degInSign ?? 0,
          sign: g ? SIGN_IDS[g.signIndex]! : 'aries',
        });
      }
      entries.sort((a, b) => order.indexOf(a.karaka) - order.indexOf(b.karaka));
      this._karakas = entries;
    }
    return this._karakas;
  }

  getAvakahada(): AvakahadaDetails {
    if (!this._avakahada) {
      const m = this.natal.grahas.moon;
      this._avakahada = computeAvakahada(m.nakshatraIndex, m.signIndex);
    }
    return this._avakahada;
  }

  getGhatak(): FavourableAndGhatakResult {
    if (!this._ghatak) {
      const m = this.natal.grahas.moon;
      const birthYear = Number(this.natal.time.birthLocal.slice(0, 4)) || undefined;
      this._ghatak = computeFavourableAndGhatak(m.signIndex, birthYear);
    }
    return this._ghatak;
  }

  getMutualAspects(): DetectedAspect[] {
    if (!this._aspects) this._aspects = computeMutualAspects(this.natal.grahas);
    return this._aspects;
  }

  getPanchang(): PanchangResult {
    if (!this._panchang) {
      const sunLon = this.natal.grahas.sun.lon;
      const moonLon = this.natal.grahas.moon.lon;
      const dow = new Date(this.natal.time.birthUtc).getUTCDay();
      this._panchang = computePanchang(sunLon, moonLon, dow);
    }
    return this._panchang;
  }

  getBhavaAnalysis(): HouseDossier[] {
    if (!this._bhavas) {
      const sav = this.getAshtakvarga().sarva;
      this._bhavas = computeBhavaAnalysis(this.natal, this._transits ?? undefined, sav);
    }
    return this._bhavas;
  }

  getUpagrahas(): UpagrahaPosition[] {
    if (!this._upagrahas) this._upagrahas = computeUpagrahas(this.natal);
    return this._upagrahas;
  }

  getArudhaPadas(): ArudhaPadaItem[] {
    if (!this._arudhas) this._arudhas = computeArudhaPadas(this.natal);
    return this._arudhas;
  }

  getAshtakoota(partnerMoonSignIndex: number, partnerMoonNakshatraIndex: number): AshtakootaResult {
    const m = this.natal.grahas.moon;
    return computeAshtakoota(
      { moonSignIndex: m.signIndex, moonNakshatraIndex: m.nakshatraIndex, pada: m.pada },
      { moonSignIndex: partnerMoonSignIndex, moonNakshatraIndex: partnerMoonNakshatraIndex },
    );
  }

  async getVarshaphal(targetYear: number): Promise<VarshaphalResult> {
    const cached = this._varshaphalCache.get(targetYear);
    if (cached) return cached;
    if (!this._eph) this._eph = await loadEphemeris('astronomy-engine');
    const res = computeVarshaphal(this._eph, this.natal, targetYear);
    this._varshaphalCache.set(targetYear, res);
    return res;
  }

  async getMuhurta(dateStr: string): Promise<DayView> {
    const cached = this._muhurtaCache.get(dateStr);
    if (cached) return cached;
    if (!this._eph) this._eph = await loadEphemeris('astronomy-engine');
    const digest = createNatalDigest(this.natal);
    const dayView = buildDay(this._eph, digest, dateStr, this.natal.time.tzId);
    this._muhurtaCache.set(dateStr, dayView);
    return dayView;
  }

  getVargaChart(varga: VargaType) {
    const lagnaSignIndex = this.natal.lagna
      ? calculateVargaSign(this.natal.lagna.lon, varga)
      : 0;
    const placements: Array<{
      planet: PlanetId;
      signIndex: number;
      sign: string;
      house: number;
      vargottama: boolean;
    }> = [];
    for (const p of PLANET_IDS) {
      const g = this.natal.grahas[p];
      if (!g) continue;
      const vSignIdx = calculateVargaSign(g.lon, varga);
      placements.push({
        planet: p,
        signIndex: vSignIdx,
        sign: SIGN_IDS[vSignIdx]!,
        house: houseFromSign(vSignIdx, lagnaSignIndex),
        vargottama: vSignIdx === g.signIndex,
      });
    }
    return {
      varga,
      lagnaSign: SIGN_IDS[lagnaSignIndex]!,
      lagnaSignIndex,
      placements,
    };
  }
}
