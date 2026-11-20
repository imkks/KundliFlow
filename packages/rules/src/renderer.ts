import {
  HOUSE_DEFAULT_THEMES,
  PLANET_KARAKATWAS,
  type ChartWorkspace,
  type Fact,
  type HouseNumber,
  type PlanetId,
} from '@astro/facts';
import { aggregateByHouse } from './aggregator.js';
import type { Finding, NetToneLabel, Polarity } from './schema.js';

export type DetailLevel = 'simple' | 'standard' | 'detailed';

export interface EvidenceChip {
  id: string;
  label: string;
  kind: 'fact' | 'finding' | 'period' | 'transit';
}

export interface RenderedFinding {
  id: string;
  ruleId: string;
  tier: 'curated' | 'composed' | 'fallback';
  theme: string;
  polarity: Polarity;
  strength: number;
  text: string;
  schoolNote?: string;
  evidenceChips: EvidenceChip[];
}

export interface HouseReading {
  house: number;
  lifeArea: string;
  sign: string;
  lord: string;
  lordPlacedHouse: number;
  themes: readonly string[];
  tone: NetToneLabel;
  bottomLine: string;
  netBalance?: string;
  activeDashaNote?: string;
  findings: RenderedFinding[];
  strengths: RenderedFinding[];
  cautions: RenderedFinding[];
  reflectionPrompt: string;
  evidenceChips: EvidenceChip[];
}

export interface PlanetReading {
  planet: PlanetId;
  sign: string;
  house: number;
  dignity: string;
  nakshatra: string;
  ownedHouses: number[];
  bottomLine: string;
  netBalance?: string;
  findings: RenderedFinding[];
  strengths: RenderedFinding[];
  cautions: RenderedFinding[];
  karakatwas: readonly string[];
  evidenceChips: EvidenceChip[];
}

const HOUSE_LIFE_AREAS: Record<number, string> = {
  1: 'Self, Vitality & Path',
  2: 'Money, Speech & Family',
  3: 'Courage, Skills & Siblings',
  4: 'Home, Peace & Roots',
  5: 'Creativity, Learning & Joy',
  6: 'Work, Health & Obstacles',
  7: 'Partnerships & Commitments',
  8: 'Depth, Change & Shared Resources',
  9: 'Wisdom, Luck & Dharma',
  10: 'Career, Purpose & Reputation',
  11: 'Gains, Networks & Ambitions',
  12: 'Rest, Solitude & Release',
};

function buildNetBalanceNote(strengthsCount: number, cautionsCount: number): string | undefined {
  if (strengthsCount > 0 && cautionsCount > 0) {
    return 'This area carries both supportive tailwinds and friction points—lean on the strengths below to pace through the challenges steadily.';
  }
  return undefined;
}

export interface PeriodReading {
  periodId: string;
  level: 1 | 2 | 3;
  lord: string;
  startUtc: string;
  endUtc: string;
  ownedHouses: number[];
  placedHouse: number;
  activatedThemes: string[];
  findings: RenderedFinding[];
  summary: string;
  evidenceChips: EvidenceChip[];
}

function factToChip(f: Fact): EvidenceChip {
  if (f.type === 'placement') {
    return { id: f.id, label: `${f.subject} in H${f.args.house} (${f.args.sign})`, kind: 'fact' };
  }
  if (f.type === 'lordship') {
    return { id: f.id, label: `H${f.args.house} lord ${f.value} in H${f.args.placedHouseLagna}`, kind: 'fact' };
  }
  if (f.type === 'conjunction') {
    return { id: f.id, label: `${f.args.planet1}-${f.args.planet2} (${f.args.orb}°)`, kind: 'fact' };
  }
  if (f.type === 'dignity') {
    return { id: f.id, label: `${f.subject}: ${f.value}`, kind: 'fact' };
  }
  return { id: f.id, label: f.id, kind: 'fact' };
}

function capSentences(text: string, maxSentences: number): string {
  const parts = text.match(/[^.!?]+[.!?]+/g);
  if (!parts) return text;
  return parts.slice(0, maxSentences).join(' ').trim();
}

function buildComposedModifierNote(f: Finding, factById: Map<string, Fact>): string {
  const notes: string[] = [];
  for (const eid of f.evidence) {
    const fact = factById.get(eid);
    if (!fact) continue;
    const planet = String(fact.args.planet ?? fact.subject ?? '');
    if (fact.type === 'placement') {
      if (fact.args.retrograde === true) notes.push(`${planet} is retrograde, deepening internal reflection.`);
      const comb = factById.get(`combust.${planet}`);
      if (comb?.value === true) notes.push(`${planet} is combust near the Sun, turning its expression inward.`);
      const d9 = factById.get(`varga.d9.${planet}`);
      if (d9?.args.vargottama === true) notes.push(`${planet} is Vargottama in D9, reinforcing lasting results.`);
      break;
    }
  }
  return notes[0] ?? '';
}

export function renderFinding(
  f: Finding,
  level: DetailLevel,
  ws: ChartWorkspace,
): RenderedFinding {
  const factById = new Map(ws.factSet.facts.map((fact) => [fact.id, fact]));
  const chips: EvidenceChip[] = f.evidence.map((eid) => {
    const fact = factById.get(eid);
    return fact ? factToChip(fact) : { id: eid, label: eid, kind: 'fact' };
  });

  const maxSentences = level === 'simple' ? 2 : 3;
  const baseText = level === 'detailed' ? f.rendered : capSentences(f.rendered, maxSentences);
  const modNote = level !== 'simple' ? buildComposedModifierNote(f, factById) : '';
  const text = modNote && !baseText.includes(modNote) ? `${baseText} ${modNote}` : baseText;

  return {
    id: f.id,
    ruleId: f.ruleId,
    tier: modNote ? 'composed' : 'curated',
    theme: f.theme,
    polarity: f.polarity,
    strength: f.strength,
    text,
    schoolNote: f.school !== 'parashari' ? `School: ${f.school}` : undefined,
    evidenceChips: chips,
  };
}

function buildFallbackHouseFinding(house: number, ws: ChartWorkspace): RenderedFinding {
  const hNum = house as HouseNumber;
  const themes = HOUSE_DEFAULT_THEMES[hNum] ?? ['self'];
  const lordFact = ws.getFact(`lord.house${house}`);
  const lord = String(lordFact?.value ?? 'sun');
  const placed = Number(lordFact?.args.placedHouseLagna ?? house);
  const karakas = PLANET_KARAKATWAS[lord as PlanetId]?.slice(0, 3).join(', ') ?? 'core life themes';

  return {
    id: `fallback.house${house}`,
    ruleId: `fallback.house${house}`,
    tier: 'fallback',
    theme: themes[0]!,
    polarity: 'neutral',
    strength: 40,
    text: `House ${house} highlights ${themes.join(' and ').replace(/_/g, ' ')}. Its lord ${lord} sits in house ${placed}, connecting these areas with ${karakas}.`,
    evidenceChips: lordFact ? [factToChip(lordFact)] : [],
  };
}

export function renderHouse(
  house: number,
  ws: ChartWorkspace,
  findings: Finding[],
  level: DetailLevel = 'standard',
): HouseReading {
  const byHouse = aggregateByHouse(findings);
  const summary = byHouse[house]!;
  const lordFact = ws.getFact(`lord.house${house}`);
  const sign = String(lordFact?.args.sign ?? 'aries');
  const lord = String(lordFact?.value ?? 'mars');
  const lordPlacedHouse = Number(lordFact?.args.placedHouseLagna ?? house);
  const themes = HOUSE_DEFAULT_THEMES[house as HouseNumber] ?? ['self'];

  const limit = level === 'simple' ? 6 : level === 'standard' ? 10 : 20;
  let rendered = summary.findings.slice(0, limit).map((f) => renderFinding(f, level, ws));

  // Guarantee zero blank houses via fallback tier
  if (rendered.length === 0) {
    rendered = [buildFallbackHouseFinding(house, ws)];
  }

  const strengths = rendered.filter((r) => r.polarity === 'supportive' || r.polarity === 'neutral');
  const cautions = rendered.filter((r) => r.polarity === 'challenging');
  const lifeArea = HOUSE_LIFE_AREAS[house] ?? `House ${house}`;
  const topLead = capSentences(rendered[0]!.text, 1);
  const bottomLine = `${lifeArea} is guided by ${sign.toUpperCase()} (lord ${lord} in House ${lordPlacedHouse}). ${topLead}`;
  const netBalance = buildNetBalanceNote(
    rendered.filter((r) => r.polarity === 'supportive').length,
    cautions.length,
  );

  const evidenceChips: EvidenceChip[] = [];
  if (lordFact) evidenceChips.push(factToChip(lordFact));
  for (const rf of rendered) {
    for (const c of rf.evidenceChips) {
      if (!evidenceChips.some((e) => e.id === c.id)) evidenceChips.push(c);
    }
  }

  const themeLabel = themes[0]!.replace(/_/g, ' ');
  const reflectionPrompt = `What patterns around ${themeLabel} feel most active in your life right now?`;

  // Check if running Mahadasha or Antardasha activates this house
  const dashaNotes: string[] = [];
  for (const lvl of ['maha', 'antar'] as const) {
    const df = ws.getFact(`dasha.current.${lvl}`);
    if (!df) continue;
    const owned = String(df.args.ownedHouses ?? '').split(',').map(Number);
    const placed = Number(df.args.placedHouse ?? 0);
    if (placed === house || owned.includes(house)) {
      dashaNotes.push(`${String(df.value).toUpperCase()} ${lvl === 'maha' ? 'Mahadasha' : 'Antardasha'}`);
    }
  }
  const activeDashaNote =
    dashaNotes.length > 0 ? `Currently activated by ${dashaNotes.join(' & ')}.` : undefined;

  return {
    house,
    lifeArea,
    sign,
    lord,
    lordPlacedHouse,
    themes,
    tone: summary.tone,
    bottomLine,
    ...(netBalance ? { netBalance } : {}),
    ...(activeDashaNote ? { activeDashaNote } : {}),
    findings: rendered,
    strengths,
    cautions,
    reflectionPrompt,
    evidenceChips,
  };
}

export function renderPlanet(
  planet: PlanetId,
  ws: ChartWorkspace,
  findings: Finding[],
  level: DetailLevel = 'standard',
): PlanetReading {
  const placement = ws.getFact(`placement.${planet}`);
  const dignityFact = ws.getFact(`dignity.${planet}`);
  const nakFact = ws.getFact(`nakshatra.${planet}`);

  const sign = String(placement?.args.sign ?? 'aries');
  const house = Number(placement?.args.house ?? 1);
  const dignity = String(dignityFact?.value ?? 'neutral');
  const nakshatra = String(nakFact?.value ?? 'ashwini');
  const ownedStr = String(placement?.args.ownedHouses ?? '');
  const ownedHouses = ownedStr ? ownedStr.split(',').map(Number).filter(Boolean) : [];

  const matched = findings
    .filter((f) => f.evidence.some((eid) => eid.includes(planet)) || f.subject === planet)
    .sort((a, b) => b.strength - a.strength);

  const limit = level === 'simple' ? 6 : level === 'standard' ? 10 : 20;
  let rendered = matched.slice(0, limit).map((f) => renderFinding(f, level, ws));

  const karakatwas = PLANET_KARAKATWAS[planet] ?? [];
  if (rendered.length === 0) {
    rendered = [
      {
        id: `fallback.${planet}`,
        ruleId: `fallback.${planet}`,
        tier: 'fallback',
        theme: ownedHouses[0] ? HOUSE_DEFAULT_THEMES[ownedHouses[0] as HouseNumber]?.[0] ?? 'self' : 'self',
        polarity: 'neutral',
        strength: 40,
        text: `${planet} in ${sign} (house ${house}, ${dignity}) expresses ${karakatwas.slice(0, 3).join(', ')} through house ${house} matters.`,
        evidenceChips: placement ? [factToChip(placement)] : [],
      },
    ];
  }

  const strengths = rendered.filter((r) => r.polarity === 'supportive' || r.polarity === 'neutral');
  const cautions = rendered.filter((r) => r.polarity === 'challenging');
  const topLead = capSentences(rendered[0]!.text, 1);
  const bottomLine = `${planet.toUpperCase()} sits in ${sign} (House ${house}, ${dignity} dignity). ${topLead}`;
  const netBalance = buildNetBalanceNote(
    rendered.filter((r) => r.polarity === 'supportive').length,
    cautions.length,
  );

  const evidenceChips: EvidenceChip[] = [];
  if (placement) evidenceChips.push(factToChip(placement));
  if (dignityFact) evidenceChips.push(factToChip(dignityFact));
  if (nakFact) evidenceChips.push(factToChip(nakFact));

  return {
    planet,
    sign,
    house,
    dignity,
    nakshatra,
    ownedHouses,
    bottomLine,
    ...(netBalance ? { netBalance } : {}),
    findings: rendered,
    strengths,
    cautions,
    karakatwas,
    evidenceChips,
  };
}

export function renderPeriod(
  periodId: string,
  ws: ChartWorkspace,
  findings: Finding[],
  level: DetailLevel = 'standard',
): PeriodReading | null {
  const row = ws.db.prepare('SELECT * FROM period WHERE id = ?').get(periodId) as any;
  if (!row) return null;

  const lord = String(row.lord) as PlanetId;
  const placement = ws.getFact(`placement.${lord}`);
  const ownedStr = String(placement?.args.ownedHouses ?? '');
  const ownedHouses = ownedStr ? ownedStr.split(',').map(Number).filter(Boolean) : [];
  const placedHouse = Number(placement?.args.house ?? 1);

  const themeSet = new Set<string>();
  for (const h of [placedHouse, ...ownedHouses]) {
    const t = HOUSE_DEFAULT_THEMES[h as HouseNumber];
    if (t) t.forEach((x) => themeSet.add(x));
  }

  const related = findings
    .filter((f) => f.house === placedHouse || (f.house !== null && ownedHouses.includes(f.house)))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, level === 'simple' ? 2 : 4)
    .map((f) => renderFinding(f, level, ws));

  const activatedThemes = Array.from(themeSet);
  const summary = `Running ${row.lord} period activates house ${placedHouse}${
    ownedHouses.length > 0 ? ` and houses ${ownedHouses.join(', ')}` : ''
  }, emphasizing ${activatedThemes.slice(0, 3).map((t) => t.replace(/_/g, ' ')).join(', ')}.`;

  return {
    periodId: row.id,
    level: row.level,
    lord: row.lord,
    startUtc: row.start_utc,
    endUtc: row.end_utc,
    ownedHouses,
    placedHouse,
    activatedThemes,
    findings: related,
    summary,
    evidenceChips: placement ? [factToChip(placement)] : [],
  };
}
