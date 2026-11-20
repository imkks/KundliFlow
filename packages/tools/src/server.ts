import {
  HOUSE_DEFAULT_THEMES,
  PLANET_IDS,
  SIGN_IDS,
  SIGN_LORDS,
  type ChartWorkspace,
  type HouseNumber,
  type PlanetId,
} from '@astro/facts';
import type { VargaType } from '@astro/engine';
import type { KbSearchFilters, KnowledgeBase, TopicMap } from '@astro/kb';
import type { EngineSession } from './engine-session.js';
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
    const doubleTransitActive =
      jupTr &&
      satTr &&
      targetHouses.has(Number(jupTr.args.houseFromLagna ?? 0)) &&
      targetHouses.has(Number(satTr.args.houseFromLagna ?? 0));

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
      if (doubleTransitActive) score += 10;

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
      if (doubleTransitActive) convNotes.push('DoubleTransit');

      const reason = `L${p.level} ${lord} (${pStart}..${pEnd}) activates H[${activated.join(',') || 'none'}]${
        tr ? `, transit H${trHouse} (${trBindus} bindus)` : ''
      }${convNotes.length > 0 ? ` [Convergence: ${convNotes.join(', ')}]` : ''}`;

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
        `KP ${key}: StarLord=${k.nakshatraLord}, SubLord=${k.subLord}, SubSub=${k.subSubLord}.`,
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
    kind: 'shadbala' | 'bhavabala' | 'ashtakvarga' | 'avasthas' | 'friendship',
    target?: string,
  ): ToolResult {
    if (!this.engineSession) {
      return this.read(kind === 'bhavabala' || kind === 'ashtakvarga' ? '/strength/houses' : '/strength/planets');
    }
    const items: ToolItem[] = [];
    const tLower = target?.toLowerCase();

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
      for (const [p, a] of Object.entries(avas)) {
        if (tLower && p !== tLower) continue;
        const id = `avastha.${p}`;
        const text = capWords(
          `Avastha ${p}: Baladi=${a.baladi}, Jagrat=${a.jagrat}, Deeptadi=${a.deeptadi}.`,
          42,
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
    kind: 'yogas' | 'doshas' | 'aspects' | 'karakas' | 'avakahada' | 'ghatak' | 'upagrahas' | 'arudha',
  ): ToolResult {
    if (!this.engineSession) return this.paginate([], 8);
    const items: ToolItem[] = [];

    if (kind === 'yogas' || kind === 'doshas') {
      const all = this.engineSession.getYogas();
      const filtered = all.filter((y) => (kind === 'doshas' ? y.category === 'dosha' : y.category !== 'dosha'));
      for (const y of filtered) {
        const id = `yoga.${y.id}`;
        const text = capWords(`${y.name} (${y.category}, ${y.strength}): ${y.description}`, 42);
        items.push({ id, kind: y.category, text, evidence: [id], tokens: estimateTokens(text) });
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
        `Avakahada: Varna=${av.varna}, Vashya=${av.vashya}, Yoni=${av.yoni}, Gana=${av.gana}, Nadi=${av.nadi}, Paya=${av.paya}.`,
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
    }
    return this.paginate(items, 12);
  }

  inspect_dashas(system: 'vimshottari' | 'yogini' | 'chara', fromIso?: string, toIso?: string): ToolResult {
    if (!this.engineSession) return this.read('/periods/current');
    const from = fromIso ?? '1900-01-01';
    const to = toIso ?? '2150-01-01';
    const items: ToolItem[] = [];

    if (system === 'vimshottari') {
      const tree = this.engineSession.getVimshottari();
      for (const m of tree.periods) {
        if (m.endDateIso < from || m.startDateIso > to) continue;
        const mId = `vim.l1.${m.lord}.${m.startDateIso.slice(0, 10)}`;
        const mText = capWords(`Vimshottari MD ${m.lord}: ${m.startDateIso.slice(0, 10)}..${m.endDateIso.slice(0, 10)}.`, 42);
        items.push({ id: mId, kind: 'dasha', text: mText, evidence: [mId], tokens: estimateTokens(mText) });
        for (const a of m.subPeriods ?? []) {
          if (a.endDateIso < from || a.startDateIso > to) continue;
          const aId = `vim.l2.${a.lord}.${a.startDateIso.slice(0, 10)}`;
          const aText = capWords(
            `Vimshottari ${m.lord}-${a.lord} AD: ${a.startDateIso.slice(0, 10)}..${a.endDateIso.slice(0, 10)}.`,
            42,
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
      const text = capWords(
        `Transit ${p} in ${t.sign}: H${t.houseFromLagna} Lagna, H${t.houseFromMoon} Moon, retro=${t.retrograde}, BAV=${t.ashtakvargaBindus}.`,
        42,
      );
      items.push({ id, kind: 'transit', text, evidence: [id], tokens: estimateTokens(text) });
    }
    return this.paginate(items, 12);
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

    // 4. Karakamsa (Atmakaraka in D9)
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
          `Birth Panchang: Vara=${p.wara.name} (lord ${p.wara.lord}), Tithi=${p.tithi.paksha} ${p.tithi.name} (#${p.tithi.index}, ${(p.tithi.elapsed * 100).toFixed(0)}% elapsed).`,
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

  async inspect_varshaphal(year?: number): Promise<ToolResult> {
    if (!this.engineSession) return this.paginate([], 8);
    const y = year ?? new Date().getFullYear();
    const v = await this.engineSession.getVarshaphal(y);
    const items: ToolItem[] = [
      {
        id: `varshaphal.${y}.overview`,
        kind: 'varshaphal',
        text: capWords(
          `Varshaphal ${y} (Age ${v.completedAge}): Solar Return ${v.varshaPraveshLocal.slice(0, 16)}, Varsha Lagna=${v.varshaLagnaSign}, Muntha=${v.munthaSign} (H${v.munthaHouseInVarsha}, lord ${v.munthaLord}), VaraPati=${v.varaPati}.`,
          42,
        ),
        evidence: [`varshaphal.${y}.overview`],
        tokens: 30,
      },
      ...PLANET_IDS.map((p) => {
        const g = v.annualChart.grahas[p];
        const id = `varshaphal.${y}.${p}`;
        const text = capWords(
          `Varshaphal ${y} ${p}: ${g.sign} ${g.degInSign.toFixed(1)}° (H${g.houses.houseFromLagna}).`,
          42,
        );
        return { id, kind: 'varshaphal', text, evidence: [id], tokens: estimateTokens(text) };
      }),
    ];
    return this.paginate(items, 12);
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
}
