import { HOUSE_DEFAULT_THEMES, PLANET_IDS, type ChartWorkspace, type HouseNumber } from '@astro/facts';
import type { KnowledgeBase } from '@astro/kb';
import { capWords, estimateTokens, type ToolItem } from './types.js';

function makeItem(
  id: string,
  kind: string,
  rawText: string,
  extra?: { polarity?: string; strength?: number; evidence?: string[] },
): ToolItem {
  const text = capWords(rawText, 42);
  return {
    id,
    kind,
    text,
    ...(extra?.polarity ? { polarity: extra.polarity } : {}),
    ...(extra?.strength !== undefined ? { strength: extra.strength } : {}),
    ...(extra?.evidence ? { evidence: extra.evidence } : {}),
    tokens: estimateTokens(text),
  };
}

function parseQuery(rawPath: string): { path: string; query: URLSearchParams } {
  const [p, q] = rawPath.split('?');
  return {
    path: (p || '/').replace(/\/+$/, '') || '/',
    query: new URLSearchParams(q || ''),
  };
}

export function listVfsPath(
  rawPath: string,
  ws: ChartWorkspace,
  kb: KnowledgeBase,
): ToolItem[] {
  const { path } = parseQuery(rawPath);

  if (path === '/') {
    return [
      makeItem('/overview', 'dir', 'Chart summary: Lagna, Moon, current dashas, available topics.'),
      makeItem('/topics', 'dir', `Topic maps (${kb.topics.length} available).`),
      makeItem('/houses', 'dir', '12 houses with signs, lords, occupants, and findings.'),
      makeItem('/planets', 'dir', '9 grahas with placements, dignities, and findings.'),
      makeItem('/periods', 'dir', 'Vimshottari dasha periods and current activations.'),
      makeItem('/transits', 'dir', 'Current planetary transits and Ashtakvarga bindus.'),
      makeItem('/strength', 'dir', 'Shadbala, Bhava Bala, and SAV bindu tables.'),
    ];
  }

  if (path === '/topics') {
    return kb.topics.map((t) =>
      makeItem(`/topics/${t.id}`, 'topic', `${t.id}: ${t.description}`),
    );
  }

  if (path === '/houses') {
    const items: ToolItem[] = [];
    for (let h = 1; h <= 12; h++) {
      const lord = ws.getFact(`lord.house${h}`);
      const count = (
        ws.db.prepare('SELECT COUNT(*) as c FROM finding WHERE subject = ?').get(`house${h}`) as { c: number }
      ).c;
      items.push(
        makeItem(
          `/houses/${h}`,
          'house',
          `House ${h} (${lord?.args.sign ?? '—'}): lord ${lord?.value ?? '—'} in H${lord?.args.placedHouseLagna ?? '—'}; ${count} findings.`,
        ),
      );
    }
    return items;
  }

  if (path === '/planets') {
    return PLANET_IDS.map((p) => {
      const pl = ws.getFact(`placement.${p}`);
      const dig = ws.getFact(`dignity.${p}`);
      return makeItem(
        `/planets/${p}`,
        'planet',
        `${p}: H${pl?.args.house ?? '?'} in ${pl?.args.sign ?? '?'} (${dig?.value ?? 'neutral'}).`,
      );
    });
  }

  return readVfsPath(rawPath, ws, kb, 1);
}

export function readVfsPath(
  rawPath: string,
  ws: ChartWorkspace,
  kb: KnowledgeBase,
  depth: number = 2,
): ToolItem[] {
  const { path, query } = parseQuery(rawPath);

  if (path === '/overview') {
    const moon = ws.getFact('placement.moon');
    const h1 = ws.getFact('lord.house1');
    const maha = ws.getFact('dasha.current.maha');
    const antar = ws.getFact('dasha.current.antar');
    const praty = ws.getFact('dasha.current.pratyantar');

    const items: ToolItem[] = [
      makeItem(
        'overview.natal',
        'overview',
        `Lagna ${h1?.args.sign ?? 'unknown'} (lord ${h1?.value ?? '?'} in H${h1?.args.placedHouseLagna ?? '?'}). Moon in ${moon?.args.sign ?? '?'} (${moon?.args.nakshatra ?? '?'}, H${moon?.args.house ?? '?'}).`,
      ),
      makeItem(
        'overview.periods',
        'overview',
        `Running Vimshottari: Mahadasha ${maha?.value ?? '?'} (to ${String(maha?.args.endUtc ?? '').slice(0, 10)}), Antardasha ${antar?.value ?? '?'} (to ${String(antar?.args.endUtc ?? '').slice(0, 10)}), Pratyantar ${praty?.value ?? '?'}.`,
      ),
      makeItem(
        'overview.topics',
        'overview',
        `Available topics: ${kb.topics.map((t) => t.id).join(', ')}.`,
      ),
    ];
    return items;
  }

  if (path.startsWith('/topics/')) {
    const tid = path.slice('/topics/'.length);
    const topic = kb.getTopic(tid);
    if (!topic) return [];
    return [
      makeItem(
        `topic.${topic.id}`,
        'topic_map',
        `${topic.id}: ${topic.description} Houses: ${topic.houses.join(', ')}. Checklist: ${topic.checklist.map((c) => c.path).join(', ')}.`,
      ),
    ];
  }

  // /houses/:n, /houses/:n/findings, /houses/:n/lord
  const houseMatch = path.match(/^\/houses\/(\d+)(?:\/(findings|lord))?$/);
  if (houseMatch) {
    const h = Number(houseMatch[1]);
    const sub = houseMatch[2];
    if (h < 1 || h > 12) return [];

    const lordFact = ws.getFact(`lord.house${h}`);
    const strengthFact = ws.getFact(`strength.house${h}`);

    if (sub === 'lord') {
      if (!lordFact) return [];
      const lordName = String(lordFact.value);
      const lordPl = ws.getFact(`placement.${lordName}`);
      const lordDig = ws.getFact(`dignity.${lordName}`);
      return [
        makeItem(
          lordFact.id,
          'lordship',
          `House ${h} (${lordFact.args.sign}) lord is ${lordName}, placed in H${lordFact.args.placedHouseLagna} (${lordFact.args.placedSign}, dignity ${lordDig?.value ?? 'neutral'}, retro ${lordPl?.args.retrograde ?? false}).`,
          { evidence: [lordFact.id, ...(lordDig ? [lordDig.id] : [])] },
        ),
      ];
    }

    const findingsRows = ws.db
      .prepare('SELECT * FROM finding WHERE subject = ? ORDER BY strength DESC')
      .all(`house${h}`) as any[];

    if (sub === 'findings') {
      return findingsRows.map((r) =>
        makeItem(r.id, 'finding', r.rendered, {
          polarity: r.polarity,
          strength: r.strength,
          evidence: JSON.parse(r.evidence_json),
        }),
      );
    }

    // House summary + top findings
    const occupants = ws.factSet.facts
      .filter((f) => f.type === 'placement' && f.args.house === h)
      .map((f) => f.subject);
    const aspects = ws.factSet.facts
      .filter((f) => f.type === 'aspect' && f.subject === `house${h}`)
      .map((f) => String(f.args.from));
    const themes = HOUSE_DEFAULT_THEMES[h as HouseNumber] ?? [];

    const items: ToolItem[] = [
      makeItem(
        `house.${h}.summary`,
        'house',
        `House ${h} (${lordFact?.args.sign ?? '?'}), themes: ${themes.join(', ')}; lord ${lordFact?.value ?? '?'} in H${lordFact?.args.placedHouseLagna ?? '?'}; occupants: ${occupants.join(', ') || 'none'}; aspected by: ${aspects.join(', ') || 'none'}; SAV bindus: ${strengthFact?.args.savBindus ?? '?'}.`,
        { evidence: lordFact ? [lordFact.id] : [] },
      ),
    ];

    if (depth >= 2) {
      for (const r of findingsRows) {
        items.push(
          makeItem(r.id, 'finding', r.rendered, {
            polarity: r.polarity,
            strength: r.strength,
            evidence: JSON.parse(r.evidence_json),
          }),
        );
      }
    }
    return items;
  }

  // /planets/:p or /planets/:p/findings
  const planetMatch = path.match(/^\/planets\/([a-z]+)(?:\/(findings))?$/);
  if (planetMatch) {
    const p = planetMatch[1]!;
    const sub = planetMatch[2];
    const pl = ws.getFact(`placement.${p}`);
    if (!pl) return [];
    const dig = ws.getFact(`dignity.${p}`);
    const nak = ws.getFact(`nakshatra.${p}`);
    const comb = ws.getFact(`combust.${p}`);
    const sb = ws.getFact(`strength.${p}`);

    const findingsRows = ws.db
      .prepare('SELECT * FROM finding WHERE evidence_json LIKE ? OR subject = ? ORDER BY strength DESC')
      .all(`%${p}%`, p) as any[];

    if (sub === 'findings') {
      return findingsRows.map((r) =>
        makeItem(r.id, 'finding', r.rendered, {
          polarity: r.polarity,
          strength: r.strength,
          evidence: JSON.parse(r.evidence_json),
        }),
      );
    }

    const items: ToolItem[] = [
      makeItem(
        pl.id,
        'planet',
        `${p} in ${pl.args.sign} (${pl.args.degInSign}°), H${pl.args.house} from Lagna, H${pl.args.houseFromMoon} from Moon; dignity ${dig?.value ?? 'neutral'}; nakshatra ${nak?.value ?? '?'}; owned H[${pl.args.ownedHouses || 'none'}]; retro=${pl.args.retrograde}; combust=${comb?.value ?? false}${sb ? `; shadbala=${sb.value}` : ''}.`,
        { evidence: [pl.id, ...(dig ? [dig.id] : []), ...(nak ? [nak.id] : [])] },
      ),
    ];

    if (depth >= 2) {
      for (const r of findingsRows) {
        items.push(
          makeItem(r.id, 'finding', r.rendered, {
            polarity: r.polarity,
            strength: r.strength,
            evidence: JSON.parse(r.evidence_json),
          }),
        );
      }
    }
    return items;
  }

  // /findings/:id
  if (path.startsWith('/findings/')) {
    const fid = path.slice('/findings/'.length);
    const row = ws.db.prepare('SELECT * FROM finding WHERE id = ? OR rule_id = ?').get(fid, fid) as any;
    if (!row) return [];
    return [
      makeItem(row.id, 'finding', row.rendered, {
        polarity: row.polarity,
        strength: row.strength,
        evidence: JSON.parse(row.evidence_json),
      }),
    ];
  }

  // /facts/:id
  if (path.startsWith('/facts/')) {
    const fid = path.slice('/facts/'.length);
    const f = ws.getFact(fid);
    if (!f) return [];
    return [
      makeItem(f.id, 'fact', `${f.id} (${f.type}): ${JSON.stringify(f.args)} value=${f.value}`, {
        evidence: [f.id],
      }),
    ];
  }

  // /periods/current or /periods
  if (path === '/periods/current') {
    const items: ToolItem[] = [];
    for (const lvl of ['maha', 'antar', 'pratyantar']) {
      const f = ws.getFact(`dasha.current.${lvl}`);
      if (f) {
        items.push(
          makeItem(
            f.id,
            'dasha',
            `Current ${lvl}: ${f.value} (${String(f.args.startUtc).slice(0, 10)} to ${String(f.args.endUtc).slice(0, 10)}); owns H[${f.args.ownedHouses || 'none'}], placed in H${f.args.placedHouse}.`,
            { evidence: [f.id] },
          ),
        );
      }
    }
    return items;
  }

  if (path === '/periods') {
    const from = query.get('from') || '1900-01-01';
    const to = query.get('to') || '2150-01-01';
    const rows = ws.db
      .prepare('SELECT * FROM period WHERE level <= 2 AND end_utc >= ? AND start_utc <= ? ORDER BY start_utc ASC LIMIT 20')
      .all(from, to) as any[];
    return rows.map((r) =>
      makeItem(
        r.id,
        'period',
        `L${r.level} ${r.lord}: ${String(r.start_utc).slice(0, 10)} to ${String(r.end_utc).slice(0, 10)}.`,
      ),
    );
  }

  // /transits/now
  if (path === '/transits/now') {
    const planetsParam = query.get('planets')?.split(',').map((s) => s.trim()).filter(Boolean);
    const rows = ws.db.prepare('SELECT * FROM transit_window').all() as any[];
    return rows
      .filter((r) => !planetsParam || planetsParam.includes(r.planet))
      .map((r) =>
        makeItem(
          `transit.${r.planet}`,
          'transit',
          `Transit ${r.planet} in ${r.sign}: H${r.h_lagna} from Lagna, H${r.h_moon} from Moon (SAV/BAV bindus: ${r.bindus ?? '?'}).`,
          { evidence: [`transit.${r.planet}`] },
        ),
      );
  }

  // /vargas/:v/planets/:p or /vargas/:v/houses/:n
  const vargaPlanetMatch = path.match(/^\/vargas\/(d\d+)\/planets\/([a-z]+)$/i);
  if (vargaPlanetMatch) {
    const v = vargaPlanetMatch[1]!.toLowerCase();
    const p = vargaPlanetMatch[2]!;
    const f = ws.getFact(`varga.${v}.${p}`);
    if (!f) return [];
    return [
      makeItem(f.id, 'varga', `${p} in ${v.toUpperCase()}: ${f.value}${f.args.vargottama ? ' (Vargottama)' : ''}.`, {
        evidence: [f.id],
      }),
    ];
  }

  const vargaHouseMatch = path.match(/^\/vargas\/(d\d+)\/houses\/(\d+)$/i);
  if (vargaHouseMatch) {
    const v = vargaHouseMatch[1]!.toLowerCase();
    const h = Number(vargaHouseMatch[2]);
    const h1 = ws.getFact('lord.house1');
    const signIndexOffset = (h - 1) % 12;
    const vFacts = ws.factSet.facts.filter((f) => f.id.startsWith(`varga.${v}.`));
    return [
      makeItem(
        `varga.${v}.house${h}`,
        'varga',
        `${v.toUpperCase()} House ${h} placements (Lagna sign ${h1?.args.sign ?? '?'} +${signIndexOffset}): ${vFacts.map((f) => `${f.subject}=${f.value}`).join(', ')}.`,
      ),
    ];
  }

  // /strength/planets and /strength/houses
  if (path === '/strength/planets') {
    return ws.factSet.facts
      .filter((f) => f.type === 'strength' && !f.id.startsWith('strength.house'))
      .map((f) =>
        makeItem(f.id, 'strength', `${f.subject}: Shadbala ratio ${f.args.ratio} (${f.args.rupas} Rupas, rank #${f.args.rank}).`, {
          evidence: [f.id],
        }),
      );
  }

  if (path === '/strength/houses') {
    return ws.factSet.facts
      .filter((f) => f.id.startsWith('strength.house'))
      .map((f) =>
        makeItem(f.id, 'strength', `House ${f.args.house} (${f.args.sign}): SAV ${f.args.savBindus} bindus, BhavaBala ${f.args.bhavaRupas} Rupas (rank #${f.args.bhavaRank}).`, {
          evidence: [f.id],
        }),
      );
  }

  return [];
}
