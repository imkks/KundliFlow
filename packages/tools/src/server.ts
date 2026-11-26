import {
  HOUSE_DEFAULT_THEMES,
  PLANET_IDS,
  SIGN_IDS,
  SIGN_LORDS,
  type ChartWorkspace,
  type HouseNumber,
  type PlanetId,
} from '@astro/facts';
import { VARGA_TYPES, type VargaType } from '@astro/engine';
import type { KbSearchFilters, KnowledgeBase, TopicMap } from '@astro/kb';
import type { EngineSession } from './engine-session.js';
import {
  analyzeDashaAngularRelation,
  assessVargaCuspSensitivity,
  computeArgalaForSign,
  computeRuleSafeRemedies,
  detectParivartanaExchanges,
  detectYogadas,
  getBadhakaInfo,
  getFunctionalRolesForLagna,
  getGrahaDrishtiHouses,
} from './jyotish-diagnostics.js';
import { computeTajakaEntryAnalysis, computeTajakaExtended } from './tajaka-analysis.js';
import { computeAdvancedTajakaAudit } from './tajaka-advanced.js';
import { computeVargaArudhaReport } from './arudha-extended.js';
import {
  computeDivisionalAshtakvarga,
  computeDivisionalTransits,
  computeLattaKicks,
  computeShodhyaPindaTriggers,
  evaluateSignThirdTiming,
} from './transit-av-analysis.js';
import {
  computeExtendedAvasthas,
  detectExtendedClassicalYogas,
  evaluateRathTripodAndDrekkana,
  gradeDetectedYogas,
} from './yoga-avastha-analysis.js';
import {
  computeDrigdasa,
  computeLongevityAndShoola,
  computeNarayanaDasa,
  computeSudasa,
} from './rasi-dashas-and-longevity.js';
import {
  computeAshtottariDasa,
  computeKalachakraDasa,
} from './kalachakra-ashtottari.js';
import {
  computeFamilyMemberVargas,
  computeSbcAndMurthis,
} from './sbc-and-family.js';
import {
  analyzeEducationStream,
  analyzeKnRaoDashaQuirks,
  analyzePoliticalCareer,
  diagnoseAstroPsychology,
  getTransitEffectiveHousesWithRetro,
  runKnRaoChecklists,
} from './kn-rao-analysis.js';
import {
  capWords,
  estimateTokens,
  type LedgerEntry,
  type TimingWindow,
  type ToolItem,
  type ToolResult,
  type ToolServerOptions,
} from './types.js';
import { listVfsPath, readVfsPath } from './vfs.js';

export interface FindFilters {
  theme?: string;
  planet?: string;
  house?: number;
  polarity?: string;
  min_strength?: number;
}

export class ToolServer {
  private stepsLeft: number;
  private tokensLeft: number;
  private ledger: LedgerEntry[] = [];
  private activeTopic: TopicMap | null = null;
  private visitedPaths = new Set<string>();
  private scannedWindows: TimingWindow[] = [];
  private observedIds = new Set<string>();
  private observedTexts: string[] = [];
  private finished = false;

  constructor(
    private readonly ws: ChartWorkspace,
    private readonly kb: KnowledgeBase,
    options: ToolServerOptions = {},
    private readonly engineSession?: EngineSession,
  ) {
    this.stepsLeft = options.maxSteps ?? 12;
    this.tokensLeft = options.maxTokens ?? 9000;
  }

  seedObservedEvidence(ids: string[], texts: string[] = []) {
    for (const id of ids) this.observedIds.add(id);
    for (const t of texts) this.observedTexts.push(t);
  }

  getObservedEvidence(): { ids: Set<string>; corpus: string } {
    return {
      ids: new Set(this.observedIds),
      corpus: this.observedTexts.join(' ').toLowerCase(),
    };
  }

  private recordObserved(items: ToolItem[]) {
    for (const it of items) {
      this.observedIds.add(it.id);
      this.observedTexts.push(it.text);
      if (it.evidence) {
        for (const eid of it.evidence) this.observedIds.add(eid);
      }
    }
  }

  private consumeBudget(items: ToolItem[]): ToolResult['budget'] {
    this.recordObserved(items);
    this.stepsLeft = Math.max(0, this.stepsLeft - 1);
    const spent = items.reduce((sum, it) => sum + it.tokens, 0);
    this.tokensLeft = Math.max(0, this.tokensLeft - spent);
    return { stepsLeft: this.stepsLeft, tokensLeft: this.tokensLeft };
  }

  private paginate(allItems: ToolItem[], limit: number = 8, cursor?: string): ToolResult {
    if (this.stepsLeft <= 0 || this.tokensLeft <= 0) {
      return {
        items: [],
        budget: { stepsLeft: this.stepsLeft, tokensLeft: this.tokensLeft },
      };
    }

    const cappedLimit = Math.min(20, Math.max(1, limit));
    const offset = cursor ? Math.max(0, Number(cursor) || 0) : 0;
    const slice = allItems.slice(offset, offset + cappedLimit);
    const remaining = Math.max(0, allItems.length - (offset + slice.length));
    const budget = this.consumeBudget(slice);

    return {
      items: slice,
      ...(remaining > 0 ? { more: { cursor: String(offset + slice.length), remaining } } : {}),
      budget,
    };
  }

  ls(path: string): ToolResult {
    const items = listVfsPath(path, this.ws, this.kb);
    return this.paginate(items, 20);
  }

  read(path: string, depth: number = 2, limit: number = 8, cursor?: string): ToolResult {
    const cleanPath = path.split('?')[0]!;
    this.visitedPaths.add(cleanPath);
    this.visitedPaths.add(path);
    const items = readVfsPath(path, this.ws, this.kb, depth);
    return this.paginate(items, limit, cursor);
  }

  find(text: string, scope: 'findings' | 'facts' | 'all' = 'all', filters: FindFilters = {}): ToolResult {
    const results: ToolItem[] = [];
    const q = text.trim().toLowerCase();

    if (scope === 'findings' || scope === 'all') {
      const clauses: string[] = ['1=1'];
      const params: any[] = [];
      if (filters.theme) {
        clauses.push('theme = ?');
        params.push(filters.theme);
      }
      if (filters.polarity) {
        clauses.push('polarity = ?');
        params.push(filters.polarity);
      }
      if (filters.min_strength !== undefined) {
        clauses.push('strength >= ?');
        params.push(filters.min_strength);
      }
      if (filters.house !== undefined) {
        clauses.push('subject = ?');
        params.push(`house${filters.house}`);
      }
      if (filters.planet) {
        clauses.push('(evidence_json LIKE ? OR subject = ?)');
        params.push(`%${filters.planet}%`, filters.planet);
      }
      const rows = this.ws.db
        .prepare(`SELECT * FROM finding WHERE ${clauses.join(' AND ')} ORDER BY strength DESC LIMIT 30`)
        .all(...params) as any[];

      for (const r of rows) {
        if (!q || r.rendered.toLowerCase().includes(q) || r.rule_id.toLowerCase().includes(q)) {
          const capped = capWords(r.rendered, 42);
          results.push({
            id: r.id,
            kind: 'finding',
            text: capped,
            polarity: r.polarity,
            strength: r.strength,
            evidence: JSON.parse(r.evidence_json),
            tokens: estimateTokens(capped),
          });
        }
      }
    }

    if (scope === 'facts' || scope === 'all') {
      for (const f of this.ws.factSet.facts) {
        if (filters.planet && f.subject !== filters.planet && f.args.planet !== filters.planet) continue;
        if (filters.house !== undefined && f.houseFrom.lagna !== filters.house) continue;
        const raw = `${f.id} (${f.type}): ${JSON.stringify(f.args)} value=${f.value}`;
        if (!q || raw.toLowerCase().includes(q)) {
          const capped = capWords(raw, 42);
          results.push({
            id: f.id,
            kind: 'fact',
            text: capped,
            evidence: [f.id],
            tokens: estimateTokens(capped),
          });
        }
      }
    }

    return this.paginate(results, 8);
  }

  follow(id: string, rel?: string, depth: number = 1): ToolResult {
    const visited = new Set<string>([id]);
    let frontier = [id];
    const items: ToolItem[] = [];

    for (let d = 0; d < Math.min(2, depth); d++) {
      const nextFrontier: string[] = [];
      for (const nodeId of frontier) {
        const sql = rel
          ? 'SELECT * FROM edge WHERE (src = ? OR dst = ?) AND rel = ?'
          : 'SELECT * FROM edge WHERE (src = ? OR dst = ?)';
        const rows = (
          rel
            ? this.ws.db.prepare(sql).all(nodeId, nodeId, rel)
            : this.ws.db.prepare(sql).all(nodeId, nodeId)
        ) as { src: string; dst: string; rel: string }[];

        for (const row of rows) {
          const neighbor = row.src === nodeId ? row.dst : row.src;
          if (visited.has(neighbor)) continue;
          visited.add(neighbor);
          nextFrontier.push(neighbor);

          const fact = this.ws.getFact(neighbor);
          if (fact) {
            const text = capWords(`[${row.rel}] ${fact.id}: ${JSON.stringify(fact.args)} value=${fact.value}`, 42);
            items.push({
              id: fact.id,
              kind: fact.type,
              text,
              evidence: [fact.id],
              tokens: estimateTokens(text),
            });
          } else {
            const text = capWords(`[${row.rel}] -> ${neighbor}`, 42);
            items.push({
              id: neighbor,
              kind: 'node',
              text,
              tokens: estimateTokens(text),
            });
          }
        }
      }
      frontier = nextFrontier;
    }

    return this.paginate(items, 8);
  }

  search_knowledge(query: string, filters: KbSearchFilters = {}, k: number = 5): ToolResult {
    const rows = this.kb.searchKnowledge(query, filters, Math.min(10, k));
    const items: ToolItem[] = rows.map((r) => {
      const text = capWords(r.text, 42);
      return {
        id: r.id,
        kind: r.type,
        text,
        tokens: estimateTokens(text),
      };
    });
    return this.paginate(items, k);
  }

  topic_plan(topicOrQuestion: string): ToolResult {
    const topic = this.kb.matchTopic(topicOrQuestion);
    this.activeTopic = topic;
    const items: ToolItem[] = topic.checklist.map((c) => {
      const text = capWords(`Checklist [w=${c.weight}]: ${c.path} (topic: ${topic.id})`, 42);
      return {
        id: `plan.${topic.id}.${c.path}`,
        kind: 'checklist',
        text,
        strength: c.weight * 20,
        tokens: estimateTokens(text),
      };
    });
    return this.paginate(items, 12);
  }

  window_scan(theme: string, fromIso?: string, toIso?: string): ToolResult {
    const from = fromIso ?? new Date().toISOString().slice(0, 10);
    const toDate = new Date(Date.now() + 365 * 86400 * 1000).toISOString().slice(0, 10);
    const to = toIso ?? toDate;

    // Identify target houses for the theme or topic
    const targetHouses = new Set<number>();
    if (this.activeTopic && (this.activeTopic.themes.includes(theme) || this.activeTopic.id === theme)) {
      this.activeTopic.timing.activate_houses.forEach((h) => targetHouses.add(h));
    } else {
      for (let h = 1; h <= 12; h++) {
        const hThemes = HOUSE_DEFAULT_THEMES[h as HouseNumber] ?? [];
        if ((hThemes as readonly string[]).includes(theme)) targetHouses.add(h);
      }
    }
    if (targetHouses.size === 0) targetHouses.add(1);

    const periodRows = this.ws.db
      .prepare('SELECT * FROM period WHERE level >= 2 AND end_utc >= ? AND start_utc <= ? ORDER BY start_utc ASC LIMIT 30')
      .all(from, to) as any[];

    const yoginiPeriods = this.engineSession ? this.engineSession.getYogini().periods : [];
    const charaPeriods = this.engineSession ? this.engineSession.getChara().periods : [];
    const jupTr = this.ws.getFact('transit.jupiter');
    const satTr = this.ws.getFact('transit.saturn');

    // Classical Double Transit Law + K.N. Rao Retrograde Extension & SAV Gate (r_19 Sec. 2.1):
    // Jupiter (1,5,7,9) AND Saturn (1,3,7,10) simultaneously aspect or occupy any target house OR its lord;
    // when retrograde, planet ALSO acts & aspects from the previous sign. SAV < 25 gates/dampens delivery.
    const targetAndLordHouses = new Set<number>(targetHouses);
    for (const h of targetHouses) {
      const lordFact = this.ws.getFact(`lord.house${h}`);
      const placedH = Number(lordFact?.args.placedHouseLagna ?? 0);
      if (placedH >= 1 && placedH <= 12) targetAndLordHouses.add(placedH);
    }
    const jupRetro = Boolean(jupTr?.args.retrograde);
    const satRetro = Boolean(satTr?.args.retrograde);
    const jupHits = jupTr
      ? getTransitEffectiveHousesWithRetro('jupiter', Number(jupTr.args.houseFromLagna ?? 1), jupRetro).some((h) =>
          targetAndLordHouses.has(h),
        )
      : false;
    const satHits = satTr
      ? getTransitEffectiveHousesWithRetro('saturn', Number(satTr.args.houseFromLagna ?? 1), satRetro).some((h) =>
          targetAndLordHouses.has(h),
        )
      : false;
    const jupSav = jupTr ? Number(jupTr.args.bindus ?? 28) : 28;
    const satSav = satTr ? Number(satTr.args.bindus ?? 28) : 28;
    const lowSavGateBlocked = jupSav < 25 || satSav < 25;
    const doubleTransitActive = jupHits && satHits && !lowSavGateBlocked;

    const currentMaha = this.ws.getFact('dasha.current.maha');
    const currentMahaLord = currentMaha ? String(currentMaha.value).toLowerCase() : null;
    const currentMahaHouse = currentMahaLord
      ? Number(this.ws.getFact(`placement.${currentMahaLord}`)?.args.house ?? 0)
      : 0;

    const windows: TimingWindow[] = [];

    for (const p of periodRows) {
      const lord = String(p.lord);
      const pl = this.ws.getFact(`placement.${lord}`);
      const placedHouse = Number(pl?.args.house ?? 1);
      const ownedHouses = String(pl?.args.ownedHouses ?? '')
        .split(',')
        .map(Number)
        .filter(Boolean);

      const activated = Array.from(new Set([placedHouse, ...ownedHouses])).filter((h) => targetHouses.has(h));
      const tr = this.ws.getFact(`transit.${lord}`);
      const trHouse = tr ? Number(tr.args.houseFromLagna ?? 0) : 0;
      const trBindus = tr ? Number(tr.args.bindus ?? 28) : 28;

      let score = activated.length * 25;
      if (targetHouses.has(trHouse)) score += 15;
      if (trBindus >= 30) score += 10;
      if (p.level === 2) score += 5;
      if (doubleTransitActive) score += 12;

      // MD-AD Angular Resonance (Sambandha: 5/9 harmony vs 6/8 Shadashtaka / 2/12 drain)
      const axis =
        p.level === 2 && currentMahaHouse >= 1
          ? analyzeDashaAngularRelation(currentMahaHouse, placedHouse)
          : null;
      if (axis?.harmony === 'harmonious') score += 8;
      if (axis?.harmony === 'challenging') score -= 6;

      // Multi-dasha convergence check (Yogini + Chara)
      const pStart = String(p.start_utc).slice(0, 10);
      const pEnd = String(p.end_utc).slice(0, 10);
      const yogMatch = yoginiPeriods.find(
        (y) => y.endDateIso >= pStart && y.startDateIso <= pEnd && y.lord === lord,
      );
      const charaMatch = charaPeriods.find(
        (c) => c.endDateIso >= pStart && c.startDateIso <= pEnd && SIGN_LORDS[c.signIndex] === lord,
      );
      if (yogMatch) score += 12;
      if (charaMatch) score += 12;

      const convNotes: string[] = [];
      if (yogMatch) convNotes.push(`Yogini=${yogMatch.name}`);
      if (charaMatch) convNotes.push(`Chara=${charaMatch.sign}`);
      if (doubleTransitActive) convNotes.push('DoubleTransit(Jup+Sat Drishti)');
      if (axis) convNotes.push(`MD-AD ${axis.axisLabel}(${axis.category})`);

      const reason = `L${p.level} ${lord} (${pStart}..${pEnd}) activates H[${activated.join(',') || 'none'}]${
        tr ? `, transit H${trHouse} (${trBindus} bindus)` : ''
      }${convNotes.length > 0 ? ` [${convNotes.join(', ')}]` : ''}`;

      windows.push({
        id: p.id,
        startUtc: p.start_utc,
        endUtc: p.end_utc,
        lord,
        level: p.level,
        score,
        activatedHouses: activated,
        reason,
      });
    }

    windows.sort((a, b) => b.score - a.score);
    this.scannedWindows = windows.slice(0, 5);

    const items: ToolItem[] = this.scannedWindows.map((w) => {
      const text = capWords(w.reason, 42);
      return {
        id: w.id,
        kind: 'timing_window',
        text,
        strength: Math.min(100, w.score),
        evidence: [w.id],
        tokens: estimateTokens(text),
      };
    });

    return this.paginate(items, 8);
  }

  ledger_add(claim: string, evidenceIds: string[], confidence: number = 0.85): ToolResult {
    // Only accept evidence IDs that actually exist in chart.db or scanned windows
    const validIds = evidenceIds.filter((eid) => {
      if (this.ws.getFact(eid)) return true;
      const fRow = this.ws.db.prepare('SELECT id FROM finding WHERE id = ? OR rule_id = ?').get(eid, eid);
      if (fRow) return true;
      const pRow = this.ws.db.prepare('SELECT id FROM period WHERE id = ?').get(eid);
      if (pRow) return true;
      if (this.scannedWindows.some((w) => w.id === eid)) return true;
      return false;
    });

    const entry: LedgerEntry = {
      id: `ledger.${this.ledger.length + 1}`,
      claim,
      evidenceIds: validIds,
      confidence,
    };
    this.ledger.push(entry);

    const text = capWords(`Recorded ${entry.id} with ${validIds.length}/${evidenceIds.length} valid evidence IDs.`, 42);
    const items: ToolItem[] = [{ id: entry.id, kind: 'ledger', text, evidence: validIds, tokens: estimateTokens(text) }];
    const budget = this.consumeBudget(items);
    return { items, budget };
  }

  ledger_status(): ToolResult {
    const checklist = this.activeTopic?.checklist ?? [];
    const covered: string[] = [];
    const uncovered: string[] = [];

    for (const item of checklist) {
      const base = item.path.split('?')[0]!;
      if (this.visitedPaths.has(item.path) || this.visitedPaths.has(base)) {
        covered.push(item.path);
      } else {
        uncovered.push(item.path);
      }
    }

    const text = capWords(
      `Ledger entries: ${this.ledger.length}. Covered (${covered.length}/${checklist.length}): ${covered.join(', ') || 'none'}. Uncovered: ${uncovered.join(', ') || 'none'}.`,
      42,
    );
    const items: ToolItem[] = [{ id: 'ledger.status', kind: 'status', text, tokens: estimateTokens(text) }];
    const budget = this.consumeBudget(items);
    return { items, budget };
  }

  finish(): ToolResult {
    this.finished = true;
    const text = `Exploration finished with ${this.ledger.length} claims and ${this.scannedWindows.length} timing windows.`;
    return {
      items: [{ id: 'finish', kind: 'status', text, tokens: estimateTokens(text) }],
      budget: { stepsLeft: this.stepsLeft, tokensLeft: this.tokensLeft },
    };
  }

  getLedger(): LedgerEntry[] {
    return [...this.ledger];
  }

  getScannedWindows(): TimingWindow[] {
    return [...this.scannedWindows];
  }

  getUncoveredChecklist(): string[] {
    if (!this.activeTopic) return [];
    return this.activeTopic.checklist
      .map((c) => c.path)
      .filter((p) => !this.visitedPaths.has(p) && !this.visitedPaths.has(p.split('?')[0]!));
  }

  getActiveTopic(): TopicMap | null {
    return this.activeTopic;
  }

  isFinished(): boolean {
    return this.finished;
  }

  // --- DeepAgent Full Engine & Composite Synthesis Tools ---

  inspect_varga(varga: string, planet?: string): ToolResult {
    if (!this.engineSession) {
      return this.read(`/vargas/${varga.toLowerCase()}/${planet ? `planets/${planet}` : 'houses/1'}`);
    }
    const vType = varga.toUpperCase() as VargaType;
    const chart = this.engineSession.getVargaChart(vType);
    const list = planet ? chart.placements.filter((p) => p.planet === planet.toLowerCase()) : chart.placements;
    const items: ToolItem[] = list.map((p) => {
      const id = `varga.${vType.toLowerCase()}.${p.planet}`;
      const text = capWords(
        `${vType} (Lagna ${chart.lagnaSign}): ${p.planet} in ${p.sign} (H${p.house})${p.vargottama ? ' [Vargottama]' : ''}.`,
        42,
      );
      return { id, kind: 'varga', text, evidence: [id], tokens: estimateTokens(text) };
    });
    return this.paginate(items, 12);
  }

  inspect_kp_chalit(target?: string): ToolResult {
    if (!this.engineSession) {
      return this.paginate([], 8);
    }
    const items: ToolItem[] = [];
    const kp = this.engineSession.getKpPlacements();
    const chalit = this.engineSession.getChalit();
    const targets = target ? [target.toLowerCase()] : ['lagna', ...PLANET_IDS];

    for (const key of targets) {
      const k = kp[key];
      if (!k) continue;
      const id = `kp.${key}`;
      const text = capWords(
        `KP ${key}: StarLord=${k.starLord}, SubLord=${k.subLord}, SubSub=${k.subSubLord}.`,
        42,
      );
      items.push({ id, kind: 'kp', text, evidence: [id], tokens: estimateTokens(text) });
    }
    if (!target && chalit?.bhavas?.length) {
      const b1 = chalit.bhavas[0]!;
      items.push({
        id: 'chalit.bhavas',
        kind: 'chalit',
        text: capWords(
          `Sripati Chalit H1 Madhya=${b1.midBhavaDeg.toFixed(1)}° (${b1.sign}), Begin=${b1.bhavaBeginDeg.toFixed(1)}°.`,
          42,
        ),
        evidence: ['chalit.bhavas'],
        tokens: 18,
      });
    }
    return this.paginate(items, 12);
  }

  inspect_strengths(
    kind:
      | 'shadbala'
      | 'bhavabala'
      | 'ashtakvarga'
      | 'avasthas'
      | 'friendship'
      | 'vaisheshikamsa'
      | 'pushkara'
      | 'navatara'
      | 'special_nakshatras'
      | 'kakshya'
      | 'vedha',
    target?: string,
  ): ToolResult {
    const items: ToolItem[] = [];
    const tLower = target?.toLowerCase();

    if (kind === 'vaisheshikamsa') {
      const facts = this.ws.factSet.facts.filter((f) => f.type === 'vaisheshikamsa');
      const list = tLower ? facts.filter((f) => f.subject === tLower || f.args.graha === tLower) : facts;
      for (const f of list) {
        const text = capWords(
          `${String(f.args.graha).toUpperCase()}: ${f.args.tierName} (${f.args.vargaCount}/10 Vargas: ${f.args.dignifiedVargas})${f.args.vargottama ? ' [Vargottama]' : ''}.`,
          42,
        );
        items.push({ id: f.id, kind: 'strength', text, evidence: [f.id], tokens: estimateTokens(text) });
      }
      return this.paginate(items, 12);
    }

    if (kind === 'pushkara') {
      const facts = this.ws.factSet.facts.filter((f) => f.type === 'pushkara');
      const list = tLower ? facts.filter((f) => f.subject === tLower || f.args.graha === tLower) : facts;
      for (const f of list) {
        const text = capWords(
          `${String(f.args.graha).toUpperCase()}: ${f.args.description}.`,
          42,
        );
        items.push({ id: f.id, kind: 'strength', text, evidence: [f.id], tokens: estimateTokens(text) });
      }
      return this.paginate(items, 12);
    }

    if (kind === 'navatara') {
      const facts = this.ws.factSet.facts.filter((f) => f.type === 'navatara');
      const list = tLower ? facts.filter((f) => f.subject === tLower || f.args.graha === tLower) : facts;
      for (const f of list) {
        const text = capWords(
          `${String(f.subject).toUpperCase()}: ${f.args.taraLabel} Tara (${f.args.englishLabel}) in ${f.args.paryaya} cycle — ${f.args.category}.`,
          42,
        );
        items.push({ id: f.id, kind: 'strength', text, evidence: [f.id], tokens: estimateTokens(text) });
      }
      return this.paginate(items, 12);
    }

    if (kind === 'special_nakshatras') {
      const facts = this.ws.factSet.facts.filter((f) => f.type === 'special_nakshatra');
      const list = tLower ? facts.filter((f) => f.subject === tLower || f.args.key === tLower) : facts;
      for (const f of list) {
        const occ = f.args.occupants ? ` [Occupied by: ${f.args.occupants}]` : '';
        const text = capWords(
          `${f.args.name} (${f.args.sanskritName}): ${String(f.args.nakshatra).toUpperCase()} (#${f.value} from Janma) — ${f.args.domain}${occ}.`,
          42,
        );
        items.push({ id: f.id, kind: 'strength', text, evidence: [f.id], tokens: estimateTokens(text) });
      }
      return this.paginate(items, 12);
    }

    if (kind === 'kakshya') {
      const facts = this.ws.factSet.facts.filter((f) => f.type === 'kakshya');
      const list = tLower ? facts.filter((f) => f.subject === tLower || f.args.planet === tLower) : facts;
      for (const f of list) {
        const text = capWords(String(f.args.explanation ?? `${f.subject} Kakshya`), 42);
        items.push({ id: f.id, kind: 'strength', text, evidence: [f.id], tokens: estimateTokens(text) });
      }
      return this.paginate(items, 12);
    }

    if (kind === 'vedha') {
      const facts = this.ws.factSet.facts.filter((f) => f.type === 'vedha');
      const list = tLower ? facts.filter((f) => f.subject === tLower || f.args.planet === tLower) : facts;
      for (const f of list) {
        const text = capWords(String(f.args.explanation ?? `${f.subject} Vedha`), 42);
        items.push({ id: f.id, kind: 'strength', text, evidence: [f.id], tokens: estimateTokens(text) });
      }
      return this.paginate(items, 12);
    }

    if (!this.engineSession) {
      return this.read(kind === 'bhavabala' || kind === 'ashtakvarga' ? '/strength/houses' : '/strength/planets');
    }

    if (kind === 'shadbala') {
      const sb = this.engineSession.getShadbala();
      for (const [p, s] of Object.entries(sb.planets)) {
        if (tLower && p !== tLower) continue;
        const id = `strength.${p}`;
        const subBreakdown = tLower
          ? ` [Sthana=${s.sthanaBala.toFixed(0)}, Dig=${s.digBala.toFixed(0)}, Kala=${s.kalaBala.toFixed(0)}, Chesta=${s.chestaBala.toFixed(0)}, Naisargika=${s.naisargikaBala.toFixed(0)}, Drik=${s.drikBala.toFixed(0)}]`
          : '';
        const text = capWords(
          `Shadbala ${p}: ${s.shadbalaInRupas.toFixed(2)}/${s.minimumRequirement} Rupas (ratio ${s.strengthRatio.toFixed(2)}, rank #${s.rank})${subBreakdown}.`,
          42,
        );
        items.push({ id, kind: 'strength', text, evidence: [id], tokens: estimateTokens(text) });
      }
    } else if (kind === 'bhavabala') {
      const sb = this.engineSession.getShadbala();
      for (const b of sb.bhavas) {
        if (tLower && `house${b.house}` !== tLower && String(b.house) !== tLower) continue;
        const id = `strength.house${b.house}`;
        const text = capWords(
          `BhavaBala H${b.house}: ${b.bhavInRupas.toFixed(2)} Rupas (rank #${b.rank}).`,
          42,
        );
        items.push({ id, kind: 'strength', text, evidence: [id], tokens: estimateTokens(text) });
      }
    } else if (kind === 'ashtakvarga') {
      const av = this.engineSession.getAshtakvarga();
      if (tLower && av.bhinna[tLower as keyof typeof av.bhinna]) {
        const bav = av.bhinna[tLower as keyof typeof av.bhinna];
        bav.forEach((bindus, idx) => {
          const sign = SIGN_IDS[idx]!;
          const id = `bav.${tLower}.${sign}`;
          const text = capWords(`BAV ${tLower} in ${sign}: ${bindus}/8 bindus.`, 42);
          items.push({ id, kind: 'ashtakvarga', text, evidence: [id], tokens: estimateTokens(text) });
        });
      } else {
        av.sarva.forEach((bindus, idx) => {
          const sign = SIGN_IDS[idx]!;
          if (tLower && sign !== tLower) return;
          const id = `sav.${sign}`;
          const text = capWords(`SAV ${sign}: ${bindus} bindus (avg 28; >=30 strong, <=22 weak).`, 42);
          items.push({ id, kind: 'ashtakvarga', text, evidence: [id], tokens: estimateTokens(text) });
        });
      }
    } else if (kind === 'avasthas') {
      const avas = this.engineSession.getAvasthas();
      const extAvas = computeExtendedAvasthas(this.engineSession.natal);
      const extMap = new Map(extAvas.map((e) => [e.planet, e]));
      for (const [p, a] of Object.entries(avas)) {
        if (tLower && p !== tLower) continue;
        const ext = extMap.get(p as PlanetId);
        const laj = ext?.lajjitadi.length ? `, Lajjitadi=[${ext.lajjitadi.join('; ')}]` : '';
        const say = ext ? `, Sayanaadi=${ext.sayanaadiName} (${ext.sayanaadiMeaning})` : '';
        const ov = ext?.specialOverride ? ` [${ext.specialOverride}]` : '';
        const id = `avastha.${p}`;
        const text = capWords(
          `Avastha ${p}: Baladi=${a.baladi}, Jagrat=${a.jagrat}, Deeptadi=${a.deeptadi}${say}${laj}${ov}.`,
          56,
        );
        items.push({ id, kind: 'avastha', text, evidence: [id], tokens: estimateTokens(text) });
      }
    } else if (kind === 'friendship') {
      const fr = this.engineSession.getFriendships();
      for (const [p, row] of Object.entries(fr)) {
        if (tLower && p !== tLower) continue;
        const id = `friendship.${p}`;
        const summary = Object.entries(row)
          .map(([other, rel]) => `${other}:${rel}`)
          .join(', ');
        const text = capWords(`Pancha-Mitra ${p}: ${summary}.`, 42);
        items.push({ id, kind: 'friendship', text, evidence: [id], tokens: estimateTokens(text) });
      }
    }
    return this.paginate(items, 12);
  }

  inspect_natal_lore(
    kind:
      | 'yogas'
      | 'doshas'
      | 'aspects'
      | 'karakas'
      | 'avakahada'
      | 'ghatak'
      | 'upagrahas'
      | 'arudha'
      | 'sahams'
      | 'special_lagnas',
  ): ToolResult {
    if (!this.engineSession) return this.paginate([], 8);
    const items: ToolItem[] = [];

    if (kind === 'yogas' || kind === 'doshas') {
      const all = this.engineSession.getYogas();
      if (kind === 'doshas') {
        for (const y of all.filter((x) => x.category === 'dosha')) {
          const id = `yoga.${y.id}`;
          const text = capWords(`${y.name} (${y.category}, ${y.strength}): ${y.description}`, 42);
          items.push({ id, kind: y.category, text, evidence: [id], tokens: estimateTokens(text) });
        }
      } else {
        // 4-Factor Graded Yogas (PVR Ch. 11.7.2) + Extended Classical Yogas (Naabhasa, Tapaswi, Raja Sambandha, Kalpadruma)
        const graded = gradeDetectedYogas(
          this.engineSession.natal,
          all,
          this.engineSession.getShadbala(),
          this.engineSession.getArudhaPadas(),
        );
        for (const g of graded) {
          const text = capWords(g.summary, 48);
          items.push({ id: g.id, kind: g.category, text, evidence: [g.id], tokens: estimateTokens(text) });
        }
        const extended = detectExtendedClassicalYogas(
          this.engineSession.natal,
          this.engineSession.getKarakas(),
          this.engineSession.getVargaChart('D9').placements,
        );
        for (const ex of extended) {
          const text = capWords(ex.summary, 48);
          items.push({ id: ex.id, kind: ex.category, text, evidence: [ex.id], tokens: estimateTokens(text) });
        }
        // Fallback if no present yogas were graded
        if (items.length === 0) {
          for (const y of all.filter((x) => x.category !== 'dosha').slice(0, 6)) {
            const id = `yoga.${y.id}`;
            const text = capWords(`${y.name} (${y.category}, ${y.strength}): ${y.description}`, 42);
            items.push({ id, kind: y.category, text, evidence: [id], tokens: estimateTokens(text) });
          }
        }
      }
    } else if (kind === 'karakas') {
      for (const k of this.engineSession.getKarakas()) {
        const id = `karaka.${k.karaka.toLowerCase()}`;
        const text = capWords(`${k.karaka} (${k.role}): ${k.graha} at ${k.degInSign.toFixed(2)}° in ${k.sign}.`, 42);
        items.push({ id, kind: 'karaka', text, evidence: [id], tokens: estimateTokens(text) });
      }
    } else if (kind === 'aspects') {
      for (const a of this.engineSession.getMutualAspects().slice(0, 12)) {
        const id = `aspect.${a.body1}.${a.body2}`;
        const text = capWords(
          `${a.body1}-${a.body2} ${a.aspect.name} (orb ${a.diffFromExact.toFixed(1)}°): ${a.aspect.nature}.`,
          42,
        );
        items.push({ id, kind: 'aspect', text, evidence: [id], tokens: estimateTokens(text) });
      }
    } else if (kind === 'avakahada') {
      const av = this.engineSession.getAvakahada();
      const text = capWords(
        `Avakahada: Varna=${av.varna}, Vashya=${av.vasya}, Yoni=${av.yoni}, Gana=${av.gana}, Nadi=${av.nadi}, Paya=${av.paya}.`,
        42,
      );
      items.push({ id: 'avakahada', kind: 'avakahada', text, evidence: ['avakahada'], tokens: estimateTokens(text) });
    } else if (kind === 'ghatak') {
      const gh = this.engineSession.getGhatak();
      items.push({
        id: 'ghatak.favourable',
        kind: 'ghatak',
        text: capWords(
          `Favourable: LuckyNum=${gh.favourable.luckyNumber}, GoodNums=[${gh.favourable.goodNumbers.join(',')}], LuckyDays=[${gh.favourable.luckyDays.join(',')}], GoodPlanets=[${gh.favourable.goodPlanets.join(',')}], Stone=${gh.favourable.luckyStone}, Metal=${gh.favourable.luckyMetal}.`,
          42,
        ),
        evidence: ['ghatak.favourable'],
        tokens: 28,
      });
      items.push({
        id: 'ghatak.avoid',
        kind: 'ghatak',
        text: capWords(
          `Ghatak (Friction): Day=${gh.ghatak.badDay}, Rashi=${gh.ghatak.badRasi}, Nakshatra=${gh.ghatak.badNakshatra}, Tithi=${gh.ghatak.badTithi}, Lagna=${gh.ghatak.badLagna}, EvilNums=[${gh.favourable.evilNumbers.join(',')}].`,
          42,
        ),
        evidence: ['ghatak.avoid'],
        tokens: 26,
      });
    } else if (kind === 'upagrahas') {
      for (const u of this.engineSession.getUpagrahas()) {
        const id = `upagraha.${u.id}`;
        const text = capWords(
          `Upagraha ${u.name}: ${u.sign} ${u.degInSign}° (H${u.houseFromLagna}, ${u.nakshatra}).`,
          42,
        );
        items.push({ id, kind: 'upagraha', text, evidence: [id], tokens: estimateTokens(text) });
      }
    } else if (kind === 'arudha') {
      for (const a of this.engineSession.getArudhaPadas()) {
        const id = `arudha.${a.code.toLowerCase()}`;
        const text = capWords(
          `${a.code} (${a.name}): ${a.sign} (H${a.houseFromLagna} from Lagna, lord ${a.lord}${a.exceptionApplied ? ', 1/7 exception' : ''}).`,
          42,
        );
        items.push({ id, kind: 'arudha', text, evidence: [id], tokens: estimateTokens(text) });
      }
    } else if (kind === 'sahams') {
      const sahamsList = this.engineSession.getSahams().sahamsList;
      for (const s of sahamsList) {
        const id = `saham.${s.id}`;
        const text = capWords(
          `${s.name} Saham (${s.sanskritName}) at ${s.formatted} in H${s.houseFromLagna}: Lord ${s.lord.toUpperCase()} [${s.category}, ${s.fructification} fructification]. ${s.assessment}.`,
          42,
        );
        items.push({ id, kind: 'saham', text, evidence: [id], tokens: estimateTokens(text) });
      }
    } else if (kind === 'special_lagnas') {
      for (const sl of this.engineSession.getSpecialLagnas()) {
        const id = `special_lagna.${sl.id}`;
        const text = capWords(
          `${sl.code} (${sl.name}): ${sl.sign} ${sl.degInSign.toFixed(1)}° (H${sl.houseFromLagna} Lagna, H${sl.houseFromMoon} Moon) — ${sl.signification}.`,
          42,
        );
        items.push({ id, kind: 'special_lagna', text, evidence: [id], tokens: estimateTokens(text) });
      }
    }
    return this.paginate(items, 12);
  }

  inspect_arudhas(target?: string, varga?: string, includeGrahaArudhas?: boolean): ToolResult {
    const items: ToolItem[] = [];
    const requestedVarga = (varga ?? 'D1').toUpperCase();
    const vType: VargaType = (VARGA_TYPES as readonly string[]).includes(requestedVarga)
      ? (requestedVarga as VargaType)
      : 'D1';

    if (this.engineSession) {
      const wantGraha =
        includeGrahaArudhas ??
        (target ? (PLANET_IDS as readonly string[]).includes(target.toLowerCase()) : vType !== 'D1');
      const report = computeVargaArudhaReport(this.engineSession.natal, vType, wantGraha);
      const tLow = target?.toLowerCase().trim();
      const vPrefix = vType === 'D1' ? '' : `${vType.toLowerCase()}.`;

      const matchingBhavas = tLow
        ? report.bhavaArudhas.filter(
            (a) => a.code.toLowerCase() === tLow || `h${a.house}` === tLow,
          )
        : report.bhavaArudhas;

      for (const a of matchingBhavas) {
        const id = `arudha.${vPrefix}${a.code.toLowerCase()}`;
        const occStr = a.occupants.length ? ` [occ: ${a.occupants.join(', ')}]` : '';
        const text = capWords(
          `${vType} ${a.code} (${a.name}): in ${a.arudhaSign} (H${a.houseFromVargaLagna} from ${vType} Lagna ${report.vargaLagnaSign}), lord ${a.lord}${occStr}${a.exceptionApplied ? ' [1st/7th exception]' : ''}.`,
          46,
        );
        items.push({ id, kind: 'arudha', text, evidence: [id], tokens: estimateTokens(text) });
      }

      // AL & UL strategic diagnostics when inspecting general chart or specifically AL/UL
      if (!tLow || tLow === 'al') {
        const al = report.alAnalysis;
        const id = `arudha.${vPrefix}al.diagnostics`;
        const text = capWords(
          `${vType} AL (${al.alSign}): 11th gains (${al.gainsFromAL11.sign}: ${al.gainsFromAL11.occupants.join(',') || 'empty'}) vs 12th loss (${al.lossFromAL12.sign}: ${al.lossFromAL12.occupants.join(',') || 'empty'}). ${al.thirdAndSixthFromAL.materialRiseSignal}`,
          52,
        );
        items.push({ id, kind: 'arudha', text, evidence: [id], tokens: estimateTokens(text) });
      }
      if (!tLow || tLow === 'ul') {
        const ul = report.ulAnalysis;
        const id = `arudha.${vPrefix}ul.diagnostics`;
        const text = capWords(
          `${vType} UL (${ul.ulSign}): 2nd sustenance (${ul.sustenance2ndFromUL.sign}, lord ${ul.sustenance2ndFromUL.lord}, occ ${ul.sustenance2ndFromUL.occupants.join(',') || 'none'}), 8th longevity (${ul.longevity8thFromUL.sign}, lord ${ul.longevity8thFromUL.lord}). ${ul.alUlNote}`,
          54,
        );
        items.push({ id, kind: 'arudha', text, evidence: [id], tokens: estimateTokens(text) });
      }

      // Graha Arudhas (subjective feeling/perception plane per PVR Ch. 9.4)
      if (report.grahaArudhas?.length) {
        const matchingGrahas = tLow
          ? report.grahaArudhas.filter((g) => g.planet === tLow)
          : report.grahaArudhas;
        for (const ga of matchingGrahas) {
          const id = `graha_arudha.${vType.toLowerCase()}.${ga.planet}`;
          const text = capWords(
            `${vType} Graha Arudha ${ga.planet}: in ${ga.arudhaSign} (H${ga.houseFromVargaLagna} from ${vType} Lagna; own sign ${ga.chosenOwnSign}${ga.exceptionApplied ? ', 1st/7th exception' : ''}) — ${ga.perceptionDomain}.`,
            48,
          );
          items.push({ id, kind: 'arudha', text, evidence: [id], tokens: estimateTokens(text) });
        }
      }
    } else {
      const facts = this.ws.factSet.facts.filter((f) => f.type === 'arudha');
      const list = target
        ? facts.filter((f) => f.id === `arudha.${target.toLowerCase()}` || String(f.args.code).toLowerCase() === target.toLowerCase())
        : facts;
      for (const f of list) {
        const text = capWords(
          `${f.args.code} (${f.args.name}): in ${f.args.sign} (H${f.args.houseFromLagna} from Lagna), lord ${f.args.lord}${f.args.exceptionApplied ? ' [1st/7th exception applied]' : ''}.`,
          42,
        );
        items.push({ id: f.id, kind: 'arudha', text, evidence: [f.id], tokens: estimateTokens(text) });
      }
    }
    return this.paginate(items, 16);
  }

  inspect_karakas(target?: string): ToolResult {
    const items: ToolItem[] = [];
    if (this.engineSession) {
      const karakas = this.engineSession.getKarakas();
      const list = target
        ? karakas.filter(
            (k) =>
              k.karaka.toLowerCase() === target.toLowerCase() ||
              k.graha.toLowerCase() === target.toLowerCase(),
          )
        : karakas;
      for (const k of list) {
        const id = `karaka.${k.karaka.toLowerCase()}`;
        const text = capWords(`${k.karaka} (${k.role}): ${k.graha} at ${k.degInSign.toFixed(2)}° in ${k.sign}.`, 42);
        items.push({ id, kind: 'karaka', text, evidence: [id], tokens: estimateTokens(text) });
      }
    } else {
      const facts = this.ws.factSet.facts.filter((f) => f.type === 'karaka');
      const list = target
        ? facts.filter(
            (f) =>
              f.id === `karaka.${target.toLowerCase()}` ||
              String(f.args.karaka).toLowerCase() === target.toLowerCase() ||
              String(f.subject).toLowerCase() === target.toLowerCase(),
          )
        : facts;
      for (const f of list) {
        const text = capWords(`${f.args.karaka}: ${f.subject} in ${f.args.sign} (H${f.args.house} from Lagna).`, 42);
        items.push({ id: f.id, kind: 'karaka', text, evidence: [f.id], tokens: estimateTokens(text) });
      }
    }
    return this.paginate(items, 10);
  }

  inspect_dashas(
    system:
      | 'vimshottari'
      | 'yogini'
      | 'chara'
      | 'sudarshana'
      | 'narayana'
      | 'sudasa'
      | 'drigdasa'
      | 'shoola'
      | 'kalachakra'
      | 'ashtottari',
    fromIso?: string,
    toIso?: string,
    varga?: string,
  ): ToolResult {
    if (!this.engineSession) return this.read('/periods/current');
    const from = fromIso ?? '1900-01-01';
    const to = toIso ?? '2150-01-01';
    const items: ToolItem[] = [];

    if (system === 'vimshottari') {
      const tree = this.engineSession.getVimshottari();
      for (const m of tree.periods) {
        if (m.endDateIso < from || m.startDateIso > to) continue;
        const mdLord = m.lord.toLowerCase() as PlanetId;
        const mdHouse = Number(this.ws.getFact(`placement.${mdLord}`)?.args.house ?? 0);
        const tripod = evaluateRathTripodAndDrekkana(this.engineSession.natal, mdLord);
        const mdQuirks = analyzeKnRaoDashaQuirks(this.engineSession.natal, mdLord);
        const mdFlagNote = mdQuirks.isDifficultMdStar ? ' [Table 19A Difficult MD]' : '';
        const mId = `vim.l1.${m.lord}.${m.startDateIso.slice(0, 10)}`;
        const mText = capWords(
          `Vimshottari MD ${m.lord} (H${mdHouse || '?'} Lagna, H${tripod.mdFromSun} Sun, peak ${tripod.mdDrekkanaTiming}): ${m.startDateIso.slice(0, 10)}..${m.endDateIso.slice(0, 10)}${mdFlagNote}.`,
          52,
        );
        items.push({ id: mId, kind: 'dasha', text: mText, evidence: [mId], tokens: estimateTokens(mText) });
        for (const a of m.subPeriods ?? []) {
          if (a.endDateIso < from || a.startDateIso > to) continue;
          const adLord = a.lord.toLowerCase() as PlanetId;
          const adHouse = Number(this.ws.getFact(`placement.${adLord}`)?.args.house ?? 0);
          const axis =
            mdHouse >= 1 && adHouse >= 1 ? analyzeDashaAngularRelation(mdHouse, adHouse) : null;
          const adTripod = evaluateRathTripodAndDrekkana(this.engineSession.natal, mdLord, adLord);
          const adQuirks = analyzeKnRaoDashaQuirks(this.engineSession.natal, mdLord, adLord);
          const extraFlags = adQuirks.flags.filter((f) => !f.startsWith('Table 19A')).slice(0, 2);
          const axisNote = axis
            ? ` [Axis ${axis.axisLabel} ${axis.category}, H${adTripod.adFromMoon} Moon${
                extraFlags.length ? `; ${extraFlags.join('; ')}` : ''
              }]`
            : '';
          const aId = `vim.l2.${a.lord}.${a.startDateIso.slice(0, 10)}`;
          const aText = capWords(
            `Vimshottari ${m.lord}-${a.lord} AD: ${a.startDateIso.slice(0, 10)}..${a.endDateIso.slice(0, 10)}${axisNote}.`,
            56,
          );
          items.push({ id: aId, kind: 'dasha', text: aText, evidence: [aId], tokens: estimateTokens(aText) });
          if (fromIso && toIso) {
            for (const pr of a.subPeriods ?? []) {
              if (pr.endDateIso < from || pr.startDateIso > to) continue;
              const pId = `vim.l3.${pr.lord}.${pr.startDateIso.slice(0, 10)}`;
              const pText = capWords(
                `Vimshottari ${m.lord}-${a.lord}-${pr.lord} PD: ${pr.startDateIso.slice(0, 10)}..${pr.endDateIso.slice(0, 10)}.`,
                42,
              );
              items.push({ id: pId, kind: 'dasha', text: pText, evidence: [pId], tokens: estimateTokens(pText) });
            }
          }
        }
      }
    } else if (system === 'yogini') {
      const tree = this.engineSession.getYogini();
      for (const p of tree.periods) {
        if (p.endDateIso < from || p.startDateIso > to) continue;
        const id = `yogini.${p.name.toLowerCase()}.${p.startDateIso.slice(0, 10)}`;
        const text = capWords(`Yogini ${p.name} (${p.lord}): ${p.startDateIso.slice(0, 10)}..${p.endDateIso.slice(0, 10)}.`, 42);
        items.push({ id, kind: 'dasha', text, evidence: [id], tokens: estimateTokens(text) });
      }
    } else if (system === 'chara') {
      const tree = this.engineSession.getChara();
      for (const p of tree.periods) {
        if (p.endDateIso < from || p.startDateIso > to) continue;
        const id = `chara.${p.sign.toLowerCase()}.${p.startDateIso.slice(0, 10)}`;
        const text = capWords(`Chara Dasha ${p.sign} (${p.years}y): ${p.startDateIso.slice(0, 10)}..${p.endDateIso.slice(0, 10)}.`, 42);
        items.push({ id, kind: 'dasha', text, evidence: [id], tokens: estimateTokens(text) });
      }
    } else if (system === 'sudarshana') {
      const sc = this.engineSession.getSudarshana(fromIso);
      const cur = sc.currentDasha;
      const ev = cur.evaluation;
      items.push({
        id: `sudarshana.year.h${cur.mahadashaHouse}`,
        kind: 'dasha',
        text: capWords(
          `Sudarshana Chakra (Age ${cur.ageInYears.toFixed(1)}): Year H${cur.mahadashaHouse}, Month H${cur.antardashaHouse}, 2.5d H${cur.pratyantardashaHouse}. Net=${ev.netFavorability} (Lagna=${ev.fromLagna.score}, Moon=${ev.fromMoon.score}, Sun=${ev.fromSun.score}).`,
          42,
        ),
        evidence: [`sudarshana.year.h${cur.mahadashaHouse}`],
        tokens: 34,
      });
      if (ev.fromLagna.factors.length > 0) {
        const id = `sudarshana.lagna.h${cur.mahadashaHouse}`;
        items.push({
          id,
          kind: 'dasha',
          text: capWords(`Sudarshana Lagna Ring H${cur.mahadashaHouse}: ${ev.fromLagna.factors.slice(0, 3).join('; ')}.`, 42),
          evidence: [id],
          tokens: 30,
        });
      }
      if (ev.fromMoon.factors.length > 0) {
        const id = `sudarshana.moon.h${cur.mahadashaHouse}`;
        items.push({
          id,
          kind: 'dasha',
          text: capWords(`Sudarshana Moon Ring H${cur.mahadashaHouse}: ${ev.fromMoon.factors.slice(0, 3).join('; ')}.`, 42),
          evidence: [id],
          tokens: 30,
        });
      }
    } else if (system === 'narayana' || system === 'sudasa' || system === 'drigdasa' || system === 'shoola') {
      const vType = ((varga ?? 'D1').toUpperCase() as VargaType);
      const result =
        system === 'narayana'
          ? computeNarayanaDasa(this.engineSession.natal, vType)
          : system === 'sudasa'
          ? computeSudasa(this.engineSession.natal, this.engineSession.getSpecialLagnas())
          : system === 'drigdasa'
          ? computeDrigdasa(this.engineSession.natal)
          : computeLongevityAndShoola(
              this.engineSession.natal,
              this.engineSession.getArudhaPadas(),
              this.engineSession.getKarakas(),
            ).shoolaDasa;

      const filterFrom = fromIso ?? new Date().toISOString().slice(0, 10);
      const matching = result.periods.filter((p) => p.endIso >= filterFrom && p.startIso <= to);
      const list = matching.length > 0 ? matching.slice(0, 8) : result.periods.slice(0, 8);

      for (const p of list) {
        const id = `${system}.${result.varga.toLowerCase()}.${p.sign}.${p.startIso}`;
        const activeAd = p.antardasas?.find((ad) => ad.endIso >= filterFrom && ad.startIso <= to);
        const adNote = activeAd ? ` | AD ${activeAd.sign} (${activeAd.startIso}..${activeAd.endIso})` : '';
        const extra = p.note ? ` [${p.note}]` : '';
        const text = capWords(
          `${system.toUpperCase()} (${result.varga}, seed ${result.seedSign}) ${p.sign} (${p.years}y): ${p.startIso}..${p.endIso}${adNote}${extra}.`,
          48,
        );
        items.push({ id, kind: 'dasha', text, evidence: [id], tokens: estimateTokens(text) });
      }
    } else if (system === 'kalachakra') {
      const kc = computeKalachakraDasa(this.engineSession.natal, this.engineSession.getAshtakvarga());
      items.push({
        id: 'kalachakra.overview',
        kind: 'dasha',
        text: capWords(
          `Kalachakra (${kc.group}, Pada ${kc.pada}, Paramayush ${kc.paramayush}y): Deha=${kc.dehaSign} (body), Jeeva=${kc.jeevaSign} (spirit), Birth=${kc.birthDasaSign} (${kc.birthBalanceYears}y bal).`,
          46,
        ),
        evidence: ['kalachakra.overview'],
        tokens: 34,
      });
      const filterFrom = fromIso ?? '1900-01-01';
      const matching = kc.periods.filter((p) => p.endIso >= filterFrom && p.startIso <= to);
      const list = matching.length > 0 ? matching.slice(0, 8) : kc.periods.slice(0, 8);
      for (const p of list) {
        const id = `kalachakra.${p.sign}.${p.startIso}`;
        const savNote = p.savBindus !== undefined ? ` SAV=${p.savBindus}` : '';
        const gatiNote = p.gati ? ` [${p.gati}]` : '';
        const text = capWords(
          `Kalachakra ${p.sign} (${p.years}y${savNote}): ${p.startIso}..${p.endIso}${gatiNote}.`,
          48,
        );
        items.push({ id, kind: 'dasha', text, evidence: [id], tokens: estimateTokens(text) });
      }
    } else if (system === 'ashtottari') {
      const ash = computeAshtottariDasa(this.engineSession.natal);
      items.push({
        id: 'ashtottari.overview',
        kind: 'dasha',
        text: capWords(
          `Ashtottari (108y): Birth=${ash.birthLord} (${ash.birthBalanceYears}y bal). ${ash.applicabilityNote}.`,
          44,
        ),
        evidence: ['ashtottari.overview'],
        tokens: 30,
      });
      const filterFrom = fromIso ?? new Date().toISOString().slice(0, 10);
      const matching = ash.periods.filter((p) => p.endIso >= filterFrom && p.startIso <= to);
      const list = matching.length > 0 ? matching.slice(0, 6) : ash.periods.slice(0, 6);
      for (const p of list) {
        const id = `ashtottari.${p.lord}.${p.startIso}`;
        const activeAd = p.antardasas.find((ad) => ad.endIso >= filterFrom && ad.startIso <= to);
        const adNote = activeAd ? ` | AD ${activeAd.lord} (${activeAd.startIso}..${activeAd.endIso})` : '';
        const text = capWords(
          `Ashtottari MD ${p.lord} (${p.years}y): ${p.startIso}..${p.endIso}${adNote}.`,
          46,
        );
        items.push({ id, kind: 'dasha', text, evidence: [id], tokens: estimateTokens(text) });
      }
    }
    return this.paginate(items, 12);
  }

  inspect_transits(): ToolResult {
    const tr = this.engineSession?.getTransits();
    if (!tr) return this.read('/transits/now');
    const items: ToolItem[] = [
      {
        id: 'transit.sadesati',
        kind: 'transit',
        text: capWords(
          `Sade Sati active=${tr.sadeSati.isActive} (phase=${tr.sadeSati.phase}, Saturn H${tr.sadeSati.houseFromMoon} from Moon, Ashtama=${tr.sadeSati.isAshtamaShani}, Kantaka=${tr.sadeSati.isKantakaShani}).`,
          42,
        ),
        evidence: ['transit.sadesati'],
        tokens: 20,
      },
    ];
    for (const [p, t] of Object.entries(tr.transits)) {
      const id = `transit.${p}`;
      const lon = t.lon ?? t.signIndex * 30 + 15;
      const degInSign = ((lon % 30) + 30) % 30;
      const thirdPhase = evaluateSignThirdTiming(p as PlanetId, degInSign);
      const text = capWords(
        `Transit ${p} in ${t.sign}: H${t.houseFromLagna} Lagna, H${t.houseFromMoon} Moon, retro=${t.retrograde}, BAV=${t.ashtakvargaBindus} [${thirdPhase}].`,
        46,
      );
      items.push({ id, kind: 'transit', text, evidence: [id], tokens: estimateTokens(text) });
    }

    // Active Latta Kicks (PVR Ch. 26.7)
    const lattas = computeLattaKicks(this.engineSession!.natal, tr);
    for (const l of lattas) {
      items.push({
        id: l.id,
        kind: 'transit',
        text: capWords(l.summary, 46),
        evidence: [l.id],
        tokens: estimateTokens(l.summary),
      });
    }

    // Active Shodhya Pinda Transit Triggers (PVR Ch. 25.6)
    const triggers = computeShodhyaPindaTriggers(
      this.engineSession!.natal,
      this.engineSession!.getAshtakvarga(),
      tr,
    );
    const activeTriggers = triggers.filter((t) => t.activeTransitHits.length > 0);
    for (const st of activeTriggers.slice(0, 4)) {
      const text = capWords(
        `Shodhya Pinda Trigger (${st.domain}, Pinda=${st.shodhyaPinda}): ${st.triggerNakshatra}/${st.triggerSign} — ${st.activeTransitHits.join('; ')}.`,
        46,
      );
      items.push({ id: st.id, kind: 'transit', text, evidence: [st.id], tokens: estimateTokens(text) });
    }

    return this.paginate(items, 16);
  }

  compare_perspectives(houseNumber: number): ToolResult {
    const h = Math.max(1, Math.min(12, Math.round(houseNumber)));
    const items: ToolItem[] = [];

    // 1. From Lagna
    const hLagna = this.ws.getFact(`lord.house${h}`);
    const lagnaOcc = this.ws.factSet.facts
      .filter((f) => f.type === 'placement' && f.houseFrom.lagna === h)
      .map((f) => `${f.subject}(${f.args.sign})`);
    items.push({
      id: `perspective.lagna.h${h}`,
      kind: 'perspective',
      text: capWords(
        `From Lagna H${h} (${hLagna?.args.sign ?? '?'}): lord ${hLagna?.value ?? '?'} in H${hLagna?.args.placedHouseLagna ?? '?'}; occupants: ${lagnaOcc.join(', ') || 'none'}.`,
        42,
      ),
      evidence: hLagna ? [hLagna.id] : [],
      tokens: 24,
    });

    // 2. From Chandra (Moon)
    const moonOcc = this.ws.factSet.facts
      .filter((f) => f.type === 'placement' && f.houseFrom.moon === h)
      .map((f) => `${f.subject}(${f.args.sign})`);
    const moonPl = this.ws.getFact('placement.moon');
    const moonSignIdx = Number(moonPl?.args.signIndex ?? 0);
    const chandraSignIdx = (moonSignIdx + h - 1) % 12;
    const chandraLord = SIGN_LORDS[chandraSignIdx]!;
    const chandraLordPl = this.ws.getFact(`placement.${chandraLord}`);
    items.push({
      id: `perspective.moon.h${h}`,
      kind: 'perspective',
      text: capWords(
        `From Moon H${h} (${SIGN_IDS[chandraSignIdx]}): lord ${chandraLord} in H${chandraLordPl?.args.houseFromMoon ?? '?'} from Moon; occupants: ${moonOcc.join(', ') || 'none'}.`,
        42,
      ),
      evidence: ['placement.moon', `placement.${chandraLord}`],
      tokens: 24,
    });

    // 3. From Surya (Sun)
    const sunPl = this.ws.getFact('placement.sun');
    const sunSignIdx = Number(sunPl?.args.signIndex ?? 0);
    const suryaSignIdx = (sunSignIdx + h - 1) % 12;
    const suryaLord = SIGN_LORDS[suryaSignIdx]!;
    items.push({
      id: `perspective.sun.h${h}`,
      kind: 'perspective',
      text: capWords(
        `From Sun H${h} (${SIGN_IDS[suryaSignIdx]}): lord ${suryaLord} sits in ${this.ws.getFact(`placement.${suryaLord}`)?.args.sign ?? '?'}.`,
        42,
      ),
      evidence: ['placement.sun', `placement.${suryaLord}`],
      tokens: 18,
    });

    // 4. From Arudha Lagna (AL — Maya / Public Perception Plane)
    const arudhas = this.engineSession ? this.engineSession.getArudhaPadas() : [];
    const alPada = arudhas.find((a) => a.code === 'AL');
    if (alPada) {
      const alSignIdx = SIGN_IDS.indexOf(alPada.sign.toLowerCase() as any);
      if (alSignIdx >= 0) {
        const targetAlSignIdx = (alSignIdx + h - 1) % 12;
        const targetAlLord = SIGN_LORDS[targetAlSignIdx]!;
        const alOcc = this.ws.factSet.facts
          .filter((f) => f.type === 'placement' && Number(f.args.signIndex) === targetAlSignIdx)
          .map((f) => `${f.subject}(${f.args.sign})`);
        items.push({
          id: `perspective.al.h${h}`,
          kind: 'perspective',
          text: capWords(
            `From AL (Perception/Maya) H${h} (${SIGN_IDS[targetAlSignIdx]}): lord ${targetAlLord}; occupants: ${alOcc.join(', ') || 'none'}.`,
            42,
          ),
          evidence: ['arudha.al', `perspective.al.h${h}`],
          tokens: 24,
        });
      }
    }

    // 5. From Paaka Lagna (Sign of Lagna Lord — Physical Delivery Plane)
    const lagnaLord = this.ws.getFact('lord.house1');
    const lagnaLordName = lagnaLord ? String(lagnaLord.value).toLowerCase() : null;
    const lagnaLordPl = lagnaLordName ? this.ws.getFact(`placement.${lagnaLordName}`) : null;
    if (lagnaLordPl) {
      const paakaBaseIdx = Number(lagnaLordPl.args.signIndex ?? 0);
      const targetPaakaIdx = (paakaBaseIdx + h - 1) % 12;
      const paakaOcc = this.ws.factSet.facts
        .filter((f) => f.type === 'placement' && Number(f.args.signIndex) === targetPaakaIdx)
        .map((f) => f.subject);
      items.push({
        id: `perspective.paaka.h${h}`,
        kind: 'perspective',
        text: capWords(
          `From Paaka Lagna (${lagnaLordPl.args.sign}, Lagna lord ${lagnaLordName}) H${h} (${SIGN_IDS[targetPaakaIdx]}): occupants: ${paakaOcc.join(', ') || 'none'}.`,
          42,
        ),
        evidence: [lagnaLordPl.id, `perspective.paaka.h${h}`],
        tokens: 24,
      });
    }

    // 6. Karakamsa (Atmakaraka in D9)
    if (this.engineSession) {
      const ak = this.engineSession.getKarakas()[0];
      if (ak) {
        const d9 = this.engineSession.getVargaChart('D9');
        const akD9 = d9.placements.find((p) => p.planet === ak.graha.toLowerCase());
        items.push({
          id: 'perspective.karakamsa',
          kind: 'perspective',
          text: capWords(
            `Karakamsa: Atmakaraka ${ak.graha} occupies ${akD9?.sign ?? '?'} in D9 (H${akD9?.house ?? '?'} in D9).`,
            42,
          ),
          evidence: ['perspective.karakamsa'],
          tokens: 18,
        });
      }
    }

    return this.paginate(items, 8);
  }

  trace_dispositor_chain(planetOrHouse: string): ToolResult {
    const items: ToolItem[] = [];
    let currentPlanet: PlanetId | null = null;
    const clean = planetOrHouse.toLowerCase().trim();

    if (/^(house)?\d+$/.test(clean)) {
      const h = Number(clean.replace('house', ''));
      const lord = this.ws.getFact(`lord.house${h}`);
      if (lord) {
        currentPlanet = String(lord.value) as PlanetId;
        items.push({
          id: lord.id,
          kind: 'dispositor',
          text: capWords(`Start H${h} (${lord.args.sign}) -> ruled by ${currentPlanet}.`, 42),
          evidence: [lord.id],
          tokens: 14,
        });
      }
    } else if ((PLANET_IDS as readonly string[]).includes(clean)) {
      currentPlanet = clean as PlanetId;
    }

    const visited = new Set<string>();
    while (currentPlanet && !visited.has(currentPlanet)) {
      visited.add(currentPlanet);
      const pl = this.ws.getFact(`placement.${currentPlanet}`);
      const dig = this.ws.getFact(`dignity.${currentPlanet}`);
      if (!pl) break;
      const signIdx = Number(pl.args.signIndex ?? 0);
      const dispositor = SIGN_LORDS[signIdx]!;
      const text = capWords(
        `${currentPlanet} in H${pl.args.house} (${pl.args.sign}, ${dig?.value ?? 'neutral'}) -> dispositor is ${dispositor}${dispositor === currentPlanet ? ' [own sign / final dispositor]' : ''}.`,
        42,
      );
      items.push({ id: pl.id, kind: 'dispositor', text, evidence: [pl.id], tokens: estimateTokens(text) });
      if (dispositor === currentPlanet) break;
      currentPlanet = dispositor;
    }

    return this.paginate(items, 10);
  }

  inspect_panchang(): ToolResult {
    if (!this.engineSession) return this.paginate([], 8);
    const p = this.engineSession.getPanchang();
    const moonNak = this.ws.getFact('nakshatra.moon');
    const items: ToolItem[] = [
      {
        id: 'panchang.tithi_vara',
        kind: 'panchang',
        text: capWords(
          `Birth Panchang: Vara=${p.wara.name} (lord ${p.wara.lord}), Tithi=${p.tithi.paksha} ${p.tithi.name} (#${p.tithi.index}, ${(p.tithi.elapsedFraction * 100).toFixed(0)}% elapsed).`,
          42,
        ),
        evidence: ['panchang.tithi_vara'],
        tokens: 24,
      },
      {
        id: 'panchang.yoga_karana',
        kind: 'panchang',
        text: capWords(
          `Birth Yoga=${p.yoga.name} (#${p.yoga.index}), Karana=${p.karana.name}${p.karana.isVishtiBhadra ? ' (Vishti Bhadra)' : ''}, Moon Nakshatra=${moonNak?.value ?? '?'} Pada ${moonNak?.args.pada ?? '?'}.`,
          42,
        ),
        evidence: ['panchang.yoga_karana'],
        tokens: 24,
      },
    ];
    return this.paginate(items, 8);
  }

  inspect_bhavas(house?: number): ToolResult {
    if (!this.engineSession) return this.paginate([], 8);
    const dossiers = this.engineSession.getBhavaAnalysis();
    const list = house ? dossiers.filter((d) => d.houseNumber === house) : dossiers;
    const items: ToolItem[] = list.map((d) => {
      const id = `bhava.dossier.h${d.houseNumber}`;
      const occ = d.natalOccupants.map((o) => o.graha).join(',') || 'none';
      const asp = d.aspectingPlanets.map((a) => a.graha).join(',') || 'none';
      const text = capWords(
        `H${d.houseNumber} ${d.sanskritName} (${d.signName}, ${d.strengthRating}): Lord ${d.lord} in H${d.lordHouse}; SAV=${d.savBindus}; Occupants=[${occ}]; Aspects=[${asp}]. ${d.reading}`,
        42,
      );
      return { id, kind: 'bhava', text, evidence: [id], tokens: estimateTokens(text) };
    });
    return this.paginate(items, 12);
  }

  async inspect_varshaphal(
    year?: number,
    mode: 'annual' | 'monthly' | '60hr' = 'annual',
    targetDate?: string,
    varshaNarayanaVarga?: string,
    school: 'both' | 'pvr' | 'neelakantha' = 'both',
  ): Promise<ToolResult> {
    if (!this.engineSession) return this.paginate([], 8);

    // Monthly (Maasa Pravesh, 30° Sun) or 60-Hour (Shashti-Hora, 2°30' Sun) Tajaka entry charts
    if (mode === 'monthly' || mode === '60hr') {
      const dateStr = targetDate ?? `${year ?? new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
      const entry = await this.engineSession.getTajakaEntryChart(mode, dateStr);
      const ext = computeTajakaEntryAnalysis(entry);
      const pvbSummary = Object.values(ext.pvb)
        .sort((a, b) => b.pvb - a.pvb)
        .map((x) => `${x.planet}=${x.pvb}(${x.band},DVB ${x.dvb >= 0 ? '+' : ''}${x.dvb})`)
        .join(', ');
      const prefix = `tajaka.${mode}.${entry.targetDateIso}`;
      const items: ToolItem[] = [
        {
          id: `${prefix}.overview`,
          kind: 'varshaphal',
          text: capWords(
            `${entry.label}: Entry ${entry.entryLocal.slice(0, 16)} -> ${entry.endLocal.slice(0, 16)} (${entry.durationDays}d), Lagna=${entry.entryLagnaSign}, Muntha=${entry.munthaSign} (H${entry.munthaHouseInChart}, lord ${entry.munthaLord}), PVB Period Lord=${ext.pvbPeriodLord.lord} (${ext.pvbPeriodLord.reason}).`,
            56,
          ),
          evidence: [`${prefix}.overview`],
          tokens: 40,
        },
        {
          id: `${prefix}.pvb`,
          kind: 'varshaphal',
          text: capWords(`Tajaka ${mode} PVB & DVB (D1..D12): ${pvbSummary}.`, 56),
          evidence: [`${prefix}.pvb`],
          tokens: 38,
        },
        ...ext.yogas.slice(0, 5).map((ty) => {
          const id = `${prefix}.${ty.id}`;
          const text = capWords(ty.summary, 46);
          return { id, kind: 'varshaphal', text, evidence: [id], tokens: estimateTokens(text) };
        }),
        ...ext.sahamConfirmations.slice(0, 3).map((sc) => {
          const id = `${prefix}.saham_confirm.${sc.sahamId}`;
          const text = capWords(sc.summary, 46);
          return { id, kind: 'saham', text, evidence: [id], tokens: estimateTokens(text) };
        }),
        {
          id: `${prefix}.patyayini`,
          kind: 'varshaphal',
          text: capWords(
            `${mode} Patyayini Dasa (${entry.durationDays}d): ${ext.patyayini.map((p) => `${p.planet}(${p.days}d: ${p.startIso}..${p.endIso})`).join(', ')}.`,
            58,
          ),
          evidence: [`${prefix}.patyayini`],
          tokens: 42,
        },
      ];
      return this.paginate(items, 14);
    }

    // Annual Solar Return (Varsha Pravesh) — integrates both PVR (R-15) and Neelakantha/Mehta (R-20)
    const y = year ?? new Date().getFullYear();
    const v = await this.engineSession.getVarshaphal(y);
    const reqVarga = (varshaNarayanaVarga ?? 'D1').toUpperCase();
    const vnVarga: VargaType = (VARGA_TYPES as readonly string[]).includes(reqVarga)
      ? (reqVarga as VargaType)
      : 'D1';
    const ext = computeTajakaExtended(this.engineSession.natal, v, vnVarga);
    const adv = computeAdvancedTajakaAudit(
      this.engineSession.natal,
      v,
      ext.pvb,
      ext.pvbVarsheshwara.lord,
      ext.yogas,
    );

    const pvbPvrSummary = Object.values(ext.pvb)
      .sort((a, b) => b.pvb - a.pvb)
      .map((x) => `${x.planet}=${x.pvb}(DVB ${x.dvb >= 0 ? '+' : ''}${x.dvb})`)
      .join(', ');
    const pvbNeelSummary = Object.values(adv.neelakanthaPvb)
      .sort((a, b) => b.vishwaBala - a.vishwaBala)
      .map((x) => `${x.planet}=${x.vishwaBala}(${x.band})`)
      .join(', ');

    const varsheshwaraLine =
      school === 'pvr'
        ? `PVR Varsheshwara=${ext.pvbVarsheshwara.lord} (${ext.pvbVarsheshwara.reason})`
        : school === 'neelakantha'
        ? `Neelakantha Varsheshwara=${adv.neelakanthaVarsheshwara.lord} (${adv.neelakanthaVarsheshwara.reason})`
        : adv.dualSchoolComparison.summary;

    const pvbLine =
      school === 'pvr'
        ? `PVR PVB & D1..D12 DVB: ${pvbPvrSummary}.`
        : school === 'neelakantha'
        ? `Neelakantha 4-Tier PVB (Aspect-based + Seq Drekkana): ${pvbNeelSummary}.`
        : `Dual-School PVB -> PVR(3-tier+DVB): [${pvbPvrSummary}] | Neelakantha(4-tier): [${pvbNeelSummary}]. (Note: Sun PVB is static year-to-year; prioritize other 6 planets.)`;

    const deliverySummary = adv.deliveryGate.length
      ? adv.deliveryGate.map((d) => `${d.planet}:${d.status}(${d.via})`).join('; ')
      : 'No direct Ithasala/Eesarpha delivery gates with Year/Lagna lord.';

    const items: ToolItem[] = [
      {
        id: `varshaphal.${y}.overview`,
        kind: 'varshaphal',
        text: capWords(
          `Varshaphal ${y} (Age ${v.completedAge}, Running Yr ${adv.triPataki.runningYear}): Solar Return ${v.varshaPraveshLocal.slice(0, 16)}, Varsha Lagna=${v.varshaLagnaSign}, Muntha=${v.munthaSign} (H${v.munthaHouseInVarsha}, lord ${v.munthaLord}), VaraPati=${v.varaPati}. ${varsheshwaraLine}`,
          68,
        ),
        evidence: [`varshaphal.${y}.overview`],
        tokens: 48,
      },
      {
        id: `varshaphal.${y}.pvb`,
        kind: 'varshaphal',
        text: capWords(pvbLine, 70),
        evidence: [`varshaphal.${y}.pvb`],
        tokens: 48,
      },
      // R-20 Tri-Pataki Chakra (3x3 Flag Grid Vedha on Annual Lagna & Moon)
      {
        id: `varshaphal.${y}.tri_pataki`,
        kind: 'varshaphal',
        text: capWords(adv.triPataki.summary, 60),
        evidence: [`varshaphal.${y}.tri_pataki`],
        tokens: 42,
      },
      // R-20 Dwi-Janma Year, Muntha Rahu-Axis/Half-Year & Table 20C Patyayini Lagna Drekkana
      {
        id: `varshaphal.${y}.dwi_janma_muntha`,
        kind: 'varshaphal',
        text: capWords(
          `${adv.dwiJanma.summary} ${adv.munthaAdvanced.rahuAxisStatus} ${adv.munthaAdvanced.halfYearBias} ${adv.patyayiniLagnaDrekkana.verdict}${adv.munthaAdvanced.fatalMuntheshWarning ? ` ${adv.munthaAdvanced.fatalMuntheshWarning}` : ''}`,
          72,
        ),
        evidence: [`varshaphal.${y}.dwi_janma_muntha`],
        tokens: 52,
      },
      // R-20 Table 20D Crisis Flags & Neutralization Antidotes + Neelakanthi Delivery Gate
      {
        id: `varshaphal.${y}.crisis_antidotes_delivery`,
        kind: 'varshaphal',
        text: capWords(
          `Annual Crisis Flags: ${adv.crisisFlags.join(' | ') || 'None triggered'}. Antidotes: ${adv.antidotes.join(' | ') || 'Standard natal support'}. Delivery Gate: ${deliverySummary}`,
          72,
        ),
        evidence: [`varshaphal.${y}.crisis_antidotes_delivery`],
        tokens: 52,
      },
      // R-20 Table 20E House & K.N. Rao Ch. XV Political Signals
      ...(adv.annualHouseAndPoliticalSignals.length
        ? [
            {
              id: `varshaphal.${y}.house_political_signals`,
              kind: 'varshaphal' as const,
              text: capWords(`Annual House & Political Signals: ${adv.annualHouseAndPoliticalSignals.slice(0, 5).join(' | ')}`, 68),
              evidence: [`varshaphal.${y}.house_political_signals`],
              tokens: 48,
            },
          ]
        : []),
      // R-20 Saham Priority, Common Lordship & Malefic Saham Inversion Audit
      {
        id: `varshaphal.${y}.saham_audit`,
        kind: 'saham',
        text: capWords(
          `Saham Audit: ${adv.sahamAudit.punyaBaseline}. Common Birth+Annual Lords=[${adv.sahamAudit.commonLordshipSahams.join(', ') || 'none'}]. Strong Fructifying=[${adv.sahamAudit.fructifyingSahams.slice(0, 5).join(', ') || 'none'}].${adv.sahamAudit.maleficSahamWarnings.length ? ` Malefic Warnings: ${adv.sahamAudit.maleficSahamWarnings.join(' | ')}` : ''}`,
          68,
        ),
        evidence: [`varshaphal.${y}.saham_audit`],
        tokens: 48,
      },
      // Varsha Narayana Dasa (Muntha-seeded compressed Narayana Dasa — PVR Ch. 30.4)
      {
        id: `varshaphal.${y}.varsha_narayana.${vnVarga.toLowerCase()}`,
        kind: 'varshaphal',
        text: capWords(
          `Varsha Narayana Dasa ${y} (${vnVarga}, Muntha=${ext.varshaNarayana.munthaSign}, seed=${ext.varshaNarayana.seedSign}): ${ext.varshaNarayana.periods.slice(0, 10).map((p) => `${p.sign}(${p.days}d:${p.startIso}..${p.endIso})`).join(', ')}.`,
          64,
        ),
        evidence: [`varshaphal.${y}.varsha_narayana.${vnVarga.toLowerCase()}`],
        tokens: 46,
      },
      // Annual Yogini Dasa (360-day cycle — R-20 Sec. 2.5)
      {
        id: `varshaphal.${y}.annual_yogini`,
        kind: 'varshaphal',
        text: capWords(
          `Annual Yogini Dasa ${y}: ${adv.annualYogini.map((p) => `${p.yogini}/${p.lord}(${p.startIso}..${p.endIso})`).join(', ')}.`,
          60,
        ),
        evidence: [`varshaphal.${y}.annual_yogini`],
        tokens: 42,
      },
      // Patyayini Annual Dasa windows
      {
        id: `varshaphal.${y}.patyayini`,
        kind: 'varshaphal',
        text: capWords(
          `Patyayini Dasa ${y}: ${ext.patyayini.map((p) => `${p.planet}(${p.startIso}..${p.endIso})`).join(', ')}.`,
          56,
        ),
        evidence: [`varshaphal.${y}.patyayini`],
        tokens: 40,
      },
      // Mudda Annual Dasa windows
      {
        id: `varshaphal.${y}.mudda`,
        kind: 'varshaphal',
        text: capWords(
          `Mudda Dasa ${y}: ${ext.mudda.slice(0, 6).map((m) => `${m.lord}(${m.startIso}..${m.endIso})`).join(', ')}.`,
          52,
        ),
        evidence: [`varshaphal.${y}.mudda`],
        tokens: 36,
      },
      // Tajaka Ithasala / Kamboola / Manahoo + R-20 Graded Kamboola / Rashi-Anta / Duphalikuttha / Khallasar
      ...ext.yogas.slice(0, 4).map((ty) => {
        const id = `varshaphal.${y}.${ty.id}`;
        const text = capWords(ty.summary, 46);
        return { id, kind: 'varshaphal', text, evidence: [id], tokens: estimateTokens(text) };
      }),
      ...adv.r20Yogas.slice(0, 3).map((ry) => {
        const id = `varshaphal.${y}.${ry.id}`;
        const text = capWords(ry.summary, 46);
        return { id, kind: 'varshaphal', text, evidence: [id], tokens: estimateTokens(text) };
      }),
      // Lagna-Lord <-> Saham-Lord Ithasala confirmations
      ...ext.sahamConfirmations.slice(0, 3).map((sc) => {
        const id = `varshaphal.${y}.saham_confirm.${sc.sahamId}`;
        const text = capWords(sc.summary, 46);
        return { id, kind: 'saham', text, evidence: [id], tokens: estimateTokens(text) };
      }),
      ...(v.sahamsList ?? []).slice(0, 4).map((s) => {
        const id = `varshaphal.${y}.saham.${s.id}`;
        const text = capWords(
          `Varshaphal ${y} Saham ${s.name} (${s.sanskritName}) at ${s.formatted} in H${s.houseFromLagna}: Lord ${s.lord.toUpperCase()} (HB ${s.lordHarshaBala ?? 0}/20, ${s.fructification} fructification).`,
          42,
        );
        return { id, kind: 'saham', text, evidence: [id], tokens: estimateTokens(text) };
      }),
    ];
    return this.paginate(items, 24);
  }

  inspect_ashtakoota(partnerMoonSignIndex: number, partnerMoonNakshatraIndex: number): ToolResult {
    if (!this.engineSession) return this.paginate([], 8);
    const res = this.engineSession.getAshtakoota(partnerMoonSignIndex, partnerMoonNakshatraIndex);
    const items: ToolItem[] = [
      {
        id: 'ashtakoota.summary',
        kind: 'ashtakoota',
        text: capWords(
          `Ashtakoota Gun Milan: ${res.totalPoints}/${res.maxPoints} (${res.verdict}). ${res.kootas.map((k) => `${k.name}=${k.points}/${k.maxPoints}`).join(', ')}.`,
          42,
        ),
        evidence: ['ashtakoota.summary'],
        tokens: 30,
      },
    ];
    return this.paginate(items, 8);
  }

  async inspect_muhurta(dateIso?: string): Promise<ToolResult> {
    if (!this.engineSession) return this.paginate([], 8);
    const targetDate = (dateIso ?? new Date().toISOString().slice(0, 10)).slice(0, 10);
    const day = await this.engineSession.getMuhurta(targetDate);
    const ghatak = this.engineSession.getGhatak().ghatak;

    const ghatakWarnings: string[] = [];
    if (day.panchang.wara.name.toLowerCase() === ghatak.badDay.toLowerCase()) {
      ghatakWarnings.push(`Ghatak Weekday (${ghatak.badDay})`);
    }
    if (day.panchang.tithi.name.toLowerCase().includes(ghatak.badTithi.toLowerCase())) {
      ghatakWarnings.push(`Ghatak Tithi (${ghatak.badTithi})`);
    }

    const rahuStr = day.inauspicious?.rahuKalam
      ? `${day.inauspicious.rahuKalam.startFormatted}–${day.inauspicious.rahuKalam.endFormatted}`
      : `${day.rahuKalam.start}–${day.rahuKalam.end}`;
    const abhijitStr = day.inauspicious?.abhijitMuhurta
      ? `${day.inauspicious.abhijitMuhurta.startFormatted}–${day.inauspicious.abhijitMuhurta.endFormatted}`
      : 'midday';

    const items: ToolItem[] = [
      {
        id: `muhurta.${targetDate}.overview`,
        kind: 'muhurta',
        text: capWords(
          `Muhurta ${targetDate}: Overall=${day.dayBandLabel} (score ${day.wakingMeanScore.toFixed(1)}), Vara=${day.panchang.wara.name}, Tithi=${day.panchang.tithi.paksha} ${day.panchang.tithi.name}, Yoga=${day.panchang.yoga.name}, Karana=${day.panchang.karana.name}.`,
          42,
        ),
        evidence: [`muhurta.${targetDate}.overview`],
        tokens: 28,
      },
      {
        id: `muhurta.${targetDate}.windows`,
        kind: 'muhurta',
        text: capWords(
          `Windows ${targetDate}: Abhijit=${abhijitStr}, RahuKalam=${rahuStr}. Flowing=${day.flowingWindows.map((w) => `${w.startHour}-${w.endHour}`).join(', ') || 'none'}${ghatakWarnings.length > 0 ? `. Caution: ${ghatakWarnings.join(', ')}` : '. No Ghatak day/tithi conflict.'}`,
          42,
        ),
        evidence: [`muhurta.${targetDate}.windows`],
        tokens: 30,
      },
    ];
    return this.paginate(items, 8);
  }

  inspect_journal_insights(limit: number = 8): ToolResult {
    if (!this.engineSession) return this.paginate([], 8);
    const entries = this.engineSession.getJournalEntries();
    if (entries.length === 0) {
      return this.paginate(
        [
          {
            id: 'journal.empty',
            kind: 'journal',
            text: 'No personal journal entries logged yet.',
            tokens: 8,
          },
        ],
        4,
      );
    }

    const avgEnergy = (entries.reduce((s, e) => s + e.energy, 0) / entries.length).toFixed(1);
    const avgFocus = (entries.reduce((s, e) => s + e.focus, 0) / entries.length).toFixed(1);
    const avgMood = (entries.reduce((s, e) => s + e.mood, 0) / entries.length).toFixed(1);

    const items: ToolItem[] = [
      {
        id: 'journal.calibration.summary',
        kind: 'journal',
        text: capWords(
          `Personal Journal Summary (${entries.length} logs): avg Energy=${avgEnergy}/5, Focus=${avgFocus}/5, Mood=${avgMood}/5.`,
          42,
        ),
        evidence: ['journal.calibration.summary'],
        tokens: 20,
      },
      ...entries.slice(0, Math.min(10, limit)).map((e) => {
        const id = `journal.entry.${e.id}`;
        const sky = e.skySnapshot
          ? ` [Sky: ${e.skySnapshot.band ?? ''} ${e.skySnapshot.moonSign ?? ''} Hora=${e.skySnapshot.horaRuler ?? ''}]`
          : '';
        const text = capWords(
          `${e.entryDate} (E:${e.energy} F:${e.focus} M:${e.mood})${sky}: "${e.note}"`,
          42,
        );
        return { id, kind: 'journal', text, evidence: [id], tokens: estimateTokens(text) };
      }),
    ];
    return this.paginate(items, 10);
  }

  private isWaxingMoon(): boolean {
    if (this.engineSession) {
      const sunLon = this.engineSession.natal.grahas.sun.lon;
      const moonLon = this.engineSession.natal.grahas.moon.lon;
      const diff = (moonLon - sunLon + 360) % 360;
      return diff < 180;
    }
    return true;
  }

  private getLagnaSignIndex(): number {
    if (this.engineSession?.natal.lagna) return this.engineSession.natal.lagna.signIndex;
    const h1 = this.ws.getFact('lord.house1');
    const idx = SIGN_IDS.indexOf(String(h1?.args.sign ?? 'aries').toLowerCase() as any);
    return idx >= 0 ? idx : 0;
  }

  /**
   * Inspects Lagna-specific Functional Nature (Yogakaraka / FB / FN / FM — PVR Table 30),
   * Baadhaka Sthaana & Lord (Table 31), Yogada links (Lagna + HL/GL), Parivartana exchanges,
   * and Varga cusp / birthtime sensitivity (Ch. 32).
   */
  inspect_functional_roles(planet?: string): ToolResult {
    const lagnaSignIdx = this.getLagnaSignIndex();
    const lagnaSign = SIGN_IDS[lagnaSignIdx]!;
    const roles = getFunctionalRolesForLagna(lagnaSignIdx, this.isWaxingMoon());
    const badhaka = getBadhakaInfo(lagnaSignIdx);
    const items: ToolItem[] = [];
    const filterP = planet?.toLowerCase().trim();

    if (filterP) {
      const found = roles.find((r) => r.planet === filterP);
      if (found) {
        const id = `func.role.${found.planet}`;
        const flags = [
          found.isMaraka ? 'Maraka' : null,
          found.isBadhaka ? 'Baadhaka' : null,
        ].filter(Boolean);
        const text = capWords(
          `${found.planet} for ${lagnaSign} Lagna: ${found.role} (owns H${found.ownedHouses.join(', H') || 'none'})${flags.length ? ` [${flags.join(', ')}]` : ''}.`,
          42,
        );
        items.push({ id, kind: 'functional_role', text, evidence: [id], tokens: estimateTokens(text) });
      }
    } else {
      const yk = roles.filter((r) => r.role === 'yogakaraka').map((r) => r.planet);
      const fb = roles.filter((r) => r.role === 'functional_benefic').map((r) => r.planet);
      const fn = roles.filter((r) => r.role === 'functional_neutral').map((r) => r.planet);
      const fm = roles.filter((r) => r.role === 'functional_malefic').map((r) => r.planet);
      const marakas = roles.filter((r) => r.isMaraka).map((r) => r.planet);

      items.push({
        id: 'func.summary',
        kind: 'functional_role',
        text: capWords(
          `${lagnaSign} Lagna roles: Yogakaraka=[${yk.join(',') || 'none'}], Benefics=[${fb.join(',')}], Neutrals=[${fn.join(',')}], Malefics=[${fm.join(',')}], Marakas=[${marakas.join(',')}].`,
          42,
        ),
        evidence: ['func.summary'],
        tokens: 34,
      });

      items.push({
        id: 'func.badhaka',
        kind: 'functional_role',
        text: capWords(
          `Baadhaka (${badhaka.modality} Lagna): H${badhaka.badhakaHouse} (${badhaka.badhakaSign}), lord ${badhaka.badhakaLord}${badhaka.coLord ? ` (co-lord ${badhaka.coLord})` : ''}.`,
          42,
        ),
        evidence: ['func.badhaka'],
        tokens: 24,
      });

      const exchanges = detectParivartanaExchanges(this.ws);
      for (const ex of exchanges) {
        const id = `func.parivartana.${ex.planetA}.${ex.planetB}`;
        const text = capWords(
          `Parivartana (${ex.category}): ${ex.planetA} (H${ex.houseA}) <-> ${ex.planetB} (H${ex.houseB}). ${ex.meaning}.`,
          42,
        );
        items.push({ id, kind: 'functional_role', text, evidence: [id], tokens: estimateTokens(text) });
      }

      if (this.engineSession) {
        const yogadas = detectYogadas(this.ws, this.engineSession.getSpecialLagnas());
        for (const y of yogadas.slice(0, 4)) {
          const id = `func.yogada.${y.planet}`;
          const text = capWords(`Yogada ${y.planet} (${y.kind}): ${y.reason}.`, 42);
          items.push({ id, kind: 'functional_role', text, evidence: [id], tokens: estimateTokens(text) });
        }

        const cusp = assessVargaCuspSensitivity(this.engineSession.natal);
        items.push({
          id: 'func.cusp_sensitivity',
          kind: 'sensitivity',
          text: capWords(
            `Birthtime Sensitivity (Lagna ${cusp.lagnaDegInSign}°): ${cusp.advisory}`,
            42,
          ),
          evidence: ['func.cusp_sensitivity'],
          tokens: 30,
        });
      }
    }

    return this.paginate(items, 10);
  }

  /**
   * Inspects Parashari Argala (decisive intervention) & Virodhargala (obstruction)
   * plus Jaimini Rasi Drishti for any house (1..12), planet (e.g. "saturn"), or Arudha Pada (e.g. "AL", "A10", "UL").
   */
  inspect_argala(target: string): ToolResult {
    const clean = target.trim().toLowerCase();
    const lagnaSignIdx = this.getLagnaSignIndex();
    let targetSignIdx: number | null = null;
    let targetLabel = target;

    const hMatch = clean.match(/^(?:house|h)?(\d{1,2})$/);
    if (hMatch) {
      const h = Number(hMatch[1]);
      if (h >= 1 && h <= 12) {
        targetSignIdx = (lagnaSignIdx + h - 1) % 12;
        targetLabel = `House ${h}`;
      }
    } else if ((PLANET_IDS as readonly string[]).includes(clean)) {
      const pl = this.ws.getFact(`placement.${clean}`);
      if (pl) {
        targetSignIdx = Number(pl.args.signIndex ?? 0);
        targetLabel = `${clean} (H${pl.args.house})`;
      }
    } else if (this.engineSession) {
      const pada = this.engineSession
        .getArudhaPadas()
        .find((a) => a.code.toLowerCase() === clean);
      if (pada) {
        const idx = SIGN_IDS.indexOf(pada.sign.toLowerCase() as any);
        if (idx >= 0) {
          targetSignIdx = idx;
          targetLabel = `${pada.code} (${pada.name})`;
        }
      }
    }

    if (targetSignIdx === null) {
      return this.paginate(
        [
          {
            id: 'argala.not_found',
            kind: 'argala',
            text: `Could not resolve target "${target}". Pass a house (1-12), planet name (e.g. "saturn"), or Arudha code (AL, A10, UL).`,
            tokens: 18,
          },
        ],
        4,
      );
    }

    const report = computeArgalaForSign(this.ws, targetSignIdx, targetLabel);
    const slug = clean.replace(/[^a-z0-9]/g, '');
    const items: ToolItem[] = [
      {
        id: `argala.${slug}.summary`,
        kind: 'argala',
        text: capWords(
          `Argala & Rasi Drishti on ${report.targetLabel} (${report.targetSign}${report.ketuReversed ? ', Ketu-reversed counting' : ''}): ${report.interventions.filter((i) => !i.isObstructed).length} unobstructed intervention(s); Rasi Drishti planets=[${report.rasiDrishtiPlanets.map((r) => `${r.planet}(${r.sign})`).join(', ') || 'none'}].`,
          42,
        ),
        evidence: [`argala.${slug}.summary`],
        tokens: 34,
      },
    ];

    for (const iv of report.interventions) {
      const id = `argala.${slug}.${iv.relativePosition}`;
      const text = capWords(iv.meaning, 42);
      items.push({ id, kind: 'argala', text, evidence: [id], tokens: estimateTokens(text) });
    }

    return this.paginate(items, 10);
  }

  /**
   * Rule-safe classical remedies per PVR Ch. 34 & Ch. 37:
   * - Gemstones ONLY for Yogakarakas / Functional Benefics (never functional malefics or marakas).
   * - Weekday fasting for UL (marriage) and A10 (career).
   * - Ishta Devata from 12th house from Atmakaraka in D9.
   */
  inspect_remedies(domain?: string): ToolResult {
    const lagnaSignIdx = this.getLagnaSignIndex();
    const arudhas = this.engineSession ? this.engineSession.getArudhaPadas() : [];
    const karakas = this.engineSession ? this.engineSession.getKarakas() : [];
    const d9 = this.engineSession ? this.engineSession.getVargaChart('D9').placements : [];

    const rec = computeRuleSafeRemedies(lagnaSignIdx, this.isWaxingMoon(), arudhas, karakas, d9);
    const items: ToolItem[] = [];

    if (rec.gemstoneCandidates.length > 0) {
      for (const g of rec.gemstoneCandidates.slice(0, 3)) {
        const id = `remedy.gem.${g.planet}`;
        const text = capWords(
          `Eligible gemstone for ${g.planet} (${g.role}): ${g.gemstone} in ${g.metal} (${g.finger}) — ${g.reason}.`,
          42,
        );
        items.push({ id, kind: 'remedy', text, evidence: [id], tokens: estimateTokens(text) });
      }
    }

    if (rec.excludedGemstonePlanets.length > 0) {
      const id = 'remedy.gem.contraindications';
      const list = rec.excludedGemstonePlanets
        .slice(0, 4)
        .map((e) => `${e.planet} (${e.reason.split('—')[0]!.trim()})`)
        .join('; ');
      items.push({
        id,
        kind: 'remedy',
        text: capWords(`Gemstone safety guardrail — avoid gemstones for: ${list}.`, 42),
        evidence: [id],
        tokens: 28,
      });
    }

    const domLower = domain?.toLowerCase() ?? '';
    if (rec.fastingGuidance.marriage && (!domLower || /marr|relat|love|spouse|partner/.test(domLower))) {
      const f = rec.fastingGuidance.marriage;
      const id = 'remedy.fasting.ul';
      items.push({
        id,
        kind: 'remedy',
        text: capWords(
          `Relationship remedy (UL in ${f.sign}, lord ${f.lord}): traditional weekday fasting or mindful charity on ${f.weekday}s.`,
          42,
        ),
        evidence: [id],
        tokens: 26,
      });
    }
    if (rec.fastingGuidance.career && (!domLower || /career|work|job|status|promot/.test(domLower))) {
      const f = rec.fastingGuidance.career;
      const id = 'remedy.fasting.a10';
      items.push({
        id,
        kind: 'remedy',
        text: capWords(
          `Career remedy (A10 in ${f.sign}, lord ${f.lord}): traditional weekday fasting or service on ${f.weekday}s.`,
          42,
        ),
        evidence: [id],
        tokens: 26,
      });
    }

    if (rec.ishtaDevata) {
      const id = 'remedy.ishta_devata';
      items.push({
        id,
        kind: 'remedy',
        text: capWords(
          `Ishta Devata (12th from AK ${rec.ishtaDevata.akPlanet} in D9 ${rec.ishtaDevata.karakamsaSign} -> ${rec.ishtaDevata.twelfthFromAkSign}): guided by ${rec.ishtaDevata.guidingPlanet} (${rec.ishtaDevata.deities}).`,
          42,
        ),
        evidence: [id],
        tokens: 30,
      });
    }

    for (const c of rec.charityActions.slice(0, 2)) {
      const id = `remedy.charity.${c.planet}`;
      items.push({
        id,
        kind: 'remedy',
        text: capWords(
          `Constructive ${c.planet} practice (${c.weekday}s): ${c.action}. Deities/stotras: ${c.deities}.`,
          42,
        ),
        evidence: [id],
        tokens: 28,
      });
    }

    return this.paginate(items, 10);
  }

  /**
   * Composite Divisional Analytics (PVR Ch. 12.5, 18, 25.4):
   * Computes Divisional Ashtakavarga (SAV), Natal Varga x Transit D1 hits, and active Varga Narayana Dasa.
   */
  inspect_varga_analytics(varga: string = 'D10'): ToolResult {
    if (!this.engineSession) return this.paginate([], 8);
    const vType = varga.toUpperCase() as VargaType;
    const vChart = this.engineSession.getVargaChart(vType);
    const items: ToolItem[] = [];

    // 1. Divisional Ashtakavarga SAV
    const divAv = computeDivisionalAshtakvarga(vChart);
    const savList = divAv.houseSav.map((h) => `H${h.house}(${h.sign}):${h.bindus}`).join(', ');
    items.push({
      id: `varga_sav.${vType.toLowerCase()}`,
      kind: 'varga_analytics',
      text: capWords(
        `${vType} Divisional SAV (Lagna ${vChart.lagnaSign}): Strong H[${divAv.strongHouses.join(',') || 'none'}] (>=30), Weak H[${divAv.weakHouses.join(',') || 'none'}] (<25). ${savList}.`,
        56,
      ),
      evidence: [`varga_sav.${vType.toLowerCase()}`],
      tokens: 42,
    });

    // 2. Divisional Transits (Natal Varga x Transit D1)
    const tr = this.engineSession.getTransits();
    if (tr) {
      const dTransits = computeDivisionalTransits(vChart, tr);
      const summary = dTransits
        .map((d) => `${d.planet} in ${vType} H${d.houseInVarga} (${d.transitSign}${d.retrograde ? 'R' : ''})`)
        .join('; ');
      items.push({
        id: `varga_transit.${vType.toLowerCase()}`,
        kind: 'varga_analytics',
        text: capWords(`${vType} Divisional Transits (Natal ${vType} x Transit D1): ${summary}.`, 52),
        evidence: [`varga_transit.${vType.toLowerCase()}`],
        tokens: 38,
      });
    }

    // 3. Active Varga Narayana Dasa
    const nd = computeNarayanaDasa(this.engineSession.natal, vType);
    const today = new Date().toISOString().slice(0, 10);
    const active = nd.periods.find((p) => p.startIso <= today && p.endIso >= today) ?? nd.periods[0];
    if (active) {
      const activeAd = active.antardasas?.find((ad) => ad.startIso <= today && ad.endIso >= today);
      const id = `narayana.${vType.toLowerCase()}.${active.sign}.${active.startIso}`;
      items.push({
        id,
        kind: 'varga_analytics',
        text: capWords(
          `Active ${vType} Narayana Dasa (seed ${nd.seedSign}): MD ${active.sign} (${active.startIso}..${active.endIso})${
            activeAd ? `, AD ${activeAd.sign} (${activeAd.startIso}..${activeAd.endIso})` : ''
          }.`,
          46,
        ),
        evidence: [id],
        tokens: 34,
      });
    }

    return this.paginate(items, 8);
  }

  /**
   * Classical Longevity & Vulnerability Analysis (PVR Ch. 14 & 23 / Charak Ch. XXIII):
   * Three Pairs (Alpayu/Madhyayu/Poornayu), Rudra, Trishoola Rasis, Maheswara, and Shoola Dasa windows with AK/Jupiter shields.
   */
  inspect_longevity(): ToolResult {
    if (!this.engineSession) return this.paginate([], 8);
    const rep = computeLongevityAndShoola(
      this.engineSession.natal,
      this.engineSession.getArudhaPadas(),
      this.engineSession.getKarakas(),
    );
    const items: ToolItem[] = [
      {
        id: 'longevity.three_pairs',
        kind: 'longevity',
        text: capWords(
          `Three-Pair Ayurdaya: ${rep.threePairs.finalVerdict.toUpperCase()} (${rep.threePairs.estimatedYearsRange}). ${rep.threePairs.explanation}`,
          52,
        ),
        evidence: ['longevity.three_pairs'],
        tokens: 38,
      },
      {
        id: 'longevity.rudra_maheswara',
        kind: 'longevity',
        text: capWords(
          `Rudra=${rep.rudra} in ${rep.rudraSign} -> Trishoola Rasis=[${rep.trishoolaSigns.join(', ')}]. Maheswara (8th from AK)=${rep.maheswara}.`,
          44,
        ),
        evidence: ['longevity.rudra_maheswara'],
        tokens: 30,
      },
    ];

    for (const vw of rep.vulnerabilityWindows.slice(0, 5)) {
      const id = `longevity.shoola.${vw.sign}.${vw.startIso}`;
      const shield = vw.protectedBy.length > 0 ? ` [Shielded by ${vw.protectedBy.join(' & ')}]` : ' [Unshielded — exercise caution]';
      items.push({
        id,
        kind: 'longevity',
        text: capWords(
          `Shoola Window ${vw.sign} (${vw.startIso}..${vw.endIso}): ${vw.reason}${shield}.`,
          46,
        ),
        evidence: [id],
        tokens: 32,
      });
    }

    return this.paginate(items, 10);
  }

  /**
   * Sarvatobhadra Chakra (9x9 Grid 3-Line Vedha on natal stars, Rasis & Special Tithis)
   * plus Transit Murthis (Swarna/Rajata/Taamra/Loha — PVR Ch. 26.2 & 26.8).
   */
  inspect_sbc(): ToolResult {
    if (!this.engineSession) return this.paginate([], 8);
    const rep = computeSbcAndMurthis(this.engineSession.natal, this.engineSession.getTransits());
    const st = rep.specialTithis;
    const items: ToolItem[] = [
      {
        id: 'sbc.summary',
        kind: 'sbc',
        text: capWords(
          `${rep.netSummary} Special Tithis: Janma=#${st.janma.tithiNumber}(${st.janma.group}), Karma=#${st.karma.tithiNumber}(${st.karma.group}), Dhana=#${st.dhana.tithiNumber}(${st.dhana.group}), Vivaha=#${st.vivaha.tithiNumber}(${st.vivaha.group}).`,
          54,
        ),
        evidence: ['sbc.summary'],
        tokens: 40,
      },
    ];

    for (const vh of rep.vedhaHits.slice(0, 6)) {
      const id = `sbc.vedha.${vh.planet}`;
      const text = capWords(
        `SBC ${vh.nature.toUpperCase()} Vedha by ${vh.planet} (${vh.transitNakshatra}) -> ${vh.hits.join(', ')}.`,
        48,
      );
      items.push({ id, kind: 'sbc', text, evidence: [id], tokens: estimateTokens(text) });
    }

    if (rep.murthis.length > 0) {
      const m0 = rep.murthis[0]!;
      items.push({
        id: 'sbc.murthi',
        kind: 'sbc',
        text: capWords(
          `Active Transit Murthi (Moon H${m0.houseFromNatalMoon} from natal Moon): ${m0.murthi} (${m0.quality}).`,
          42,
        ),
        evidence: ['sbc.murthi'],
        tokens: 24,
      });
    }

    return this.paginate(items, 10);
  }

  /**
   * Family Member Varga Derivation (PVR Ch. 13.4.2):
   * D12 Parents, D3 Siblings (odd-forward / even-backward), D7 Children (odd-forward / even-backward), D9 Spouse.
   */
  inspect_family_vargas(member?: string): ToolResult {
    if (!this.engineSession) return this.paginate([], 8);
    const all = computeFamilyMemberVargas(this.engineSession.natal);
    const q = member?.toLowerCase().trim();
    const list = q
      ? all.filter((m) => m.id.includes(q) || m.member.toLowerCase().includes(q) || m.varga.toLowerCase() === q)
      : all;
    const items: ToolItem[] = (list.length > 0 ? list : all).map((m) => ({
      id: m.id,
      kind: 'family_varga',
      text: capWords(m.summary, 46),
      evidence: [m.id],
      tokens: estimateTokens(m.summary),
    }));
    return this.paginate(items, 10);
  }

  /**
   * K.N. Rao Empirical Audit (Checklists I–III, 10-Level Maraka Hierarchy, Educational Counseling >80% Formula,
   * 7-Point Political Profile, and Astro-Psychology Blind Diagnosis).
   */
  inspect_kn_rao_audit(
    focus: 'all' | 'checklists' | 'education' | 'politics' | 'psychology' | 'maraka' = 'all',
  ): ToolResult {
    if (!this.engineSession) return this.paginate([], 8);
    const natal = this.engineSession.natal;
    const items: ToolItem[] = [];

    if (focus === 'all' || focus === 'checklists' || focus === 'maraka') {
      const cl = runKnRaoChecklists(natal);
      items.push({
        id: 'kn_rao.checklist.crossovers',
        kind: 'kn_rao_audit',
        text: capWords(
          `Checklist II Crossovers: Exalt-D1/Debil-D9 (red flag)=[${cl.d1ExaltD9Debil.join(',') || 'none'}]; Debil-D1/Strong-D9 (hidden strength)=[${cl.d1DebilD9Strong.join(',') || 'none'}]. Benefic-sign planets=${cl.beneficSignCount}, Malefic-sign=${cl.maleficSignCount}.`,
          52,
        ),
        evidence: ['kn_rao.checklist.crossovers'],
        tokens: 38,
      });

      items.push({
        id: 'kn_rao.checklist.drekkana_vainashika',
        kind: 'kn_rao_audit',
        text: capWords(
          `22nd Drekkana Lord=${cl.drekkana22Lord} (${cl.drekkana22Sign}); 23rd Vainashika Star=${cl.vainashika23Star} (lord ${cl.vainashika23Lord}). Leo(royalty)=[${cl.leoPlanets.join(',') || 'none'}], Sagittarius(seal)=[${cl.sagittariusPlanets.join(',') || 'none'}].`,
          50,
        ),
        evidence: ['kn_rao.checklist.drekkana_vainashika'],
        tokens: 38,
      });

      if (cl.lagnaRemark) {
        items.push({
          id: 'kn_rao.checklist.lagna_remark',
          kind: 'kn_rao_audit',
          text: capWords(`Madhya Parashari Table 19B: ${cl.lagnaRemark}`, 46),
          evidence: ['kn_rao.checklist.lagna_remark'],
          tokens: 30,
        });
      }

      if (focus === 'all' || focus === 'maraka') {
        const topMarakas = cl.marakaHierarchy
          .slice(0, 5)
          .map((m) => `L${m.level} ${m.label}=[${m.planets.join(',')}]`)
          .join('; ');
        items.push({
          id: 'kn_rao.maraka_hierarchy',
          kind: 'kn_rao_audit',
          text: capWords(
            `10-Level Maraka Hierarchy: ${topMarakas}.${cl.yamaOverride ? ` ${cl.yamaOverride}` : ''}`,
            52,
          ),
          evidence: ['kn_rao.maraka_hierarchy'],
          tokens: 38,
        });
      }
    }

    if (focus === 'all' || focus === 'education') {
      const edu = analyzeEducationStream(natal);
      items.push({
        id: 'kn_rao.education_formula',
        kind: 'kn_rao_audit',
        text: capWords(`${edu.summary} Streams: ${edu.suggestedStreams.slice(0, 2).join(' | ')}.`, 56),
        evidence: ['kn_rao.education_formula'],
        tokens: 44,
      });
    }

    if (focus === 'all' || focus === 'politics') {
      const pol = analyzePoliticalCareer(natal);
      items.push({
        id: 'kn_rao.political_profile',
        kind: 'kn_rao_audit',
        text: capWords(`${pol.summary} Entry trigger: ${pol.publicEntryTrigger}`, 56),
        evidence: ['kn_rao.political_profile'],
        tokens: 44,
      });
    }

    if (focus === 'all' || focus === 'psychology') {
      const maha = this.ws.getFact('dasha.current.maha');
      const antar = this.ws.getFact('dasha.current.antar');
      const mdLord = maha ? (String(maha.value).toLowerCase() as PlanetId) : null;
      const adLord = antar ? (String(antar.value).toLowerCase() as PlanetId) : null;
      const psy = diagnoseAstroPsychology(natal, mdLord, adLord);
      items.push({
        id: 'kn_rao.astro_psychology',
        kind: 'kn_rao_audit',
        text: capWords(`${psy.summary} Counseling: ${psy.counselingLevers[0] ?? ''}`, 56),
        evidence: ['kn_rao.astro_psychology'],
        tokens: 42,
      });
    }

    return this.paginate(items, 10);
  }
}
