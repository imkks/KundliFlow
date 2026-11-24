import {
  HOUSE_DEFAULT_THEMES,
  PLANET_KARAKATWAS,
  type ChartWorkspace,
  type Fact,
  type HouseNumber,
  type PlanetId,
} from '@astro/facts';
import { aggregateByHouse } from './aggregator.js';
import { computeHouseArgala } from './argala.js';
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
  bhavatBhavamNote?: string;
  environmentalSupport?: string;
  doubleTransitNote?: string;
  argalaNote?: string;
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
  vargaNote?: string;
  vaisheshikamsaNote?: string;
  pushkaraNote?: string;
  navataraNote?: string;
  specialNakshatraNote?: string;
  functionalNote?: string;
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
  if (f.type === 'navatara') {
    return { id: f.id, label: `${f.subject} in ${f.args.taraLabel} Tara (${f.args.englishLabel})`, kind: 'fact' };
  }
  if (f.type === 'special_nakshatra') {
    return { id: f.id, label: `${f.args.name} in ${f.args.nakshatra}`, kind: 'fact' };
  }
  if (f.type === 'kakshya') {
    return { id: f.id, label: `${f.subject} Kakshya ${f.args.kakshyaIndex} (${f.args.kakshyaLord}): ${f.args.isBenefic ? '1 bindu ✓' : '0 bindus'}`, kind: 'fact' };
  }
  if (f.type === 'vedha') {
    return { id: f.id, label: `${f.subject} Vedha: ${f.args.netStatus}`, kind: 'fact' };
  }
  if (f.type === 'saham') {
    return { id: f.id, label: `${f.args.name} Saham: ${f.args.formatted} (H${f.args.house})`, kind: 'fact' };
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
      const house = Number(fact.args.house ?? 0);
      // Classical Dig Bala per Dr. K.S. Charak Ch. XIII
      if ((planet === 'jupiter' || planet === 'mercury') && house === 1) {
        notes.push(`${planet.toUpperCase()} holds Dig Bala (directional potency) in the 1st house, maximizing mental and ethical clarity.`);
      } else if ((planet === 'moon' || planet === 'venus') && house === 4) {
        notes.push(`${planet.toUpperCase()} holds Dig Bala in the 4th house, strengthening emotional foundations and domestic comfort.`);
      } else if (planet === 'saturn' && house === 7) {
        notes.push(`SATURN holds Dig Bala in the 7th house, anchoring enduring relationship commitment and public responsibility.`);
      } else if ((planet === 'sun' || planet === 'mars') && house === 10) {
        notes.push(`${planet.toUpperCase()} holds Dig Bala in the 10th house, conferring powerful executive leadership and professional drive.`);
      }

      // Dignity modifiers
      const dig = factById.get(`dignity.${planet}`);
      if (dig?.value === 'exalted') {
        notes.push(`${planet.toUpperCase()} is exalted, expressing its highest constructive potential.`);
      } else if (dig?.value === 'own' || dig?.value === 'mooltrikona') {
        notes.push(`${planet.toUpperCase()} resides in its own sign, operating from steady, self-reliant foundations.`);
      }

      if (fact.args.retrograde === true) notes.push(`${planet} is retrograde, deepening internal reflection and conferring high Cheshta Bala.`);
      const comb = factById.get(`combust.${planet}`);
      if (comb?.value === true) notes.push(`${planet} is combust near the Sun, internalizing its expressive drive.`);
      const d9 = factById.get(`varga.d9.${planet}`);
      if (d9?.args.vargottama === true) notes.push(`${planet} is Vargottama in D9 Navamsha, reinforcing lasting results.`);
      const vk = factById.get(`vaisheshikamsa.${planet}`);
      if (vk?.args.tierName) notes.push(`${planet} attains ${vk.args.tierName} across divisional charts.`);
      const pk = factById.get(`pushkara.${planet}`);
      if (pk) notes.push(`${planet} resides in a Pushkara degree/Navamsha, blessing it with regenerative recovery.`);
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

  // Classical Bhavat Bhavam & Angular placement (from KB R-05 & R-18)
  const lordOffsetFromHouse = ((lordPlacedHouse - house + 12) % 12) + 1;
  let bhavatBhavamNote: string | undefined;
  if (lordOffsetFromHouse === 1) {
    bhavatBhavamNote = `Lord resides in its own house, conferring self-sufficiency and natural endurance to this department.`;
  } else if (lordOffsetFromHouse === 8) {
    bhavatBhavamNote = `Lord sits in the 8th from its own house (Bhavat Bhavam 8th), indicating transformative restructuring or fluctuations.`;
  } else if (lordOffsetFromHouse === 12) {
    bhavatBhavamNote = `Lord sits in the 12th from its own house, indicating expenditure or detachment related to this area.`;
  } else if (lordOffsetFromHouse === 5 || lordOffsetFromHouse === 9) {
    bhavatBhavamNote = `Lord sits in a trine from its own house, creating effortless alignment and creative luck.`;
  } else if (lordOffsetFromHouse === 4 || lordOffsetFromHouse === 7 || lordOffsetFromHouse === 10) {
    bhavatBhavamNote = `Lord sits in a quadrant from its own house, requiring active sustenance and focused initiative.`;
  } else if (lordOffsetFromHouse === 3 || lordOffsetFromHouse === 6 || lordOffsetFromHouse === 11) {
    bhavatBhavamNote = `Lord sits in an Upachaya from its own house, promoting compounding growth and progress through effort over time.`;
  }

  // Environmental Ease / Ashtakavarga Threshold (from KB R-10 & R-18)
  const savFact = ws.getFact(`strength.house${house}`);
  const savBindus = Number(savFact?.args.savBindus ?? 0);
  let environmentalSupport: string | undefined;
  if (savBindus >= 30) {
    environmentalSupport = `High environmental receptivity (${savBindus} SAV points) — events and projects here find smooth natural momentum.`;
  } else if (savBindus > 0 && savBindus <= 25) {
    environmentalSupport = `Demands structured perseverance (${savBindus} SAV points) — lower baseline environmental ease; steady discipline required.`;
  }

  // Double Transit Sanction (from KB R-14 & R-18)
  const satTransit = ws.getFact('transit.saturn');
  const jupTransit = ws.getFact('transit.jupiter');
  let doubleTransitNote: string | undefined;
  if (satTransit && jupTransit) {
    const satH = Number(satTransit.args.houseFromLagna ?? satTransit.value);
    const jupH = Number(jupTransit.args.houseFromLagna ?? jupTransit.value);
    if (satH > 0 && jupH > 0) {
      // Saturn aspects: 1st (conjunction), 3rd, 7th, 10th
      const satAspects = [satH, ((satH + 2 - 1) % 12) + 1, ((satH + 6 - 1) % 12) + 1, ((satH + 9 - 1) % 12) + 1];
      // Jupiter aspects: 1st (conjunction), 5th, 7th, 9th
      const jupAspects = [jupH, ((jupH + 4 - 1) % 12) + 1, ((jupH + 6 - 1) % 12) + 1, ((jupH + 8 - 1) % 12) + 1];
      if (satAspects.includes(house) && jupAspects.includes(house)) {
        doubleTransitNote = `Double Transit Sanction Active: Both transiting Saturn (karma/duty) and Jupiter (grace/growth) currently influence House ${house}, unlocking a prime manifestation window.`;
      }
    }
  }

  // Classical Argala (Decisive Intervention) per KB R-07 & R-18
  const argalaSummary = computeHouseArgala(ws, house);
  const argalaNote = argalaSummary.summaryNote || undefined;

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
    ...(bhavatBhavamNote ? { bhavatBhavamNote } : {}),
    ...(environmentalSupport ? { environmentalSupport } : {}),
    ...(doubleTransitNote ? { doubleTransitNote } : {}),
    ...(argalaNote ? { argalaNote } : {}),
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

  // Varga D9 Navamsha & Functional Role (from KB R-04, R-07, R-18)
  const d9Fact = ws.getFact(`varga.d9.${planet}`);
  const vkFact = ws.getFact(`vaisheshikamsa.${planet}`);
  const pushkaraFact = ws.getFact(`pushkara.${planet}`);

  const isVargottama = d9Fact?.args.vargottama === true || vkFact?.args.vargottama === true;
  const funcRole = placement?.args.functionalRole;

  let vargaNote: string | undefined;
  if (isVargottama) {
    vargaNote = `${planet.toUpperCase()} is Vargottama (same sign in D1 and D9 Navamsha), giving deep-seated stability and enduring results.`;
  }

  let vaisheshikamsaNote: string | undefined;
  if (vkFact) {
    vaisheshikamsaNote = `${planet.toUpperCase()} attains ${vkFact.args.tierName} across the 10 divisional charts (${vkFact.args.dignifiedVargas}), conferring remarkable inner resilience and status.`;
  }

  let pushkaraNote: string | undefined;
  if (pushkaraFact) {
    pushkaraNote = pushkaraFact.args.isPushkaraBhaga
      ? `${planet.toUpperCase()} occupies an exact Pushkara Bhaga degree (${pushkaraFact.args.pushkaraBhagaDeg}°) & Pushkara Navamsha in ${String(pushkaraFact.args.navamshaSign).toUpperCase()} — granting supreme amrita healing and recovery potency.`
      : `${planet.toUpperCase()} occupies a Pushkara Navamsha in ${String(pushkaraFact.args.navamshaSign).toUpperCase()} (lord ${pushkaraFact.args.navamshaLord}) — blessing it with regenerative grace and protective fruitfulness.`;
  }

  // Navatara (9-Tara from natal Moon)
  const navFact = ws.getFact(`navatara.${planet}`);
  let navataraNote: string | undefined;
  if (navFact) {
    const taraLabel = String(navFact.args.taraLabel ?? '');
    const englishLabel = String(navFact.args.englishLabel ?? '');
    const paryaya = String(navFact.args.paryaya ?? '');
    const isFavorable = navFact.args.isFavorable === true;
    navataraNote = `${planet.toUpperCase()} is in ${taraLabel} Tara (${englishLabel}, ${paryaya} cycle from Moon) — conferring ${isFavorable ? 'favorable supportive' : 'karmic friction'} influence.`;
  }

  // Check if planet occupies any of the 11 Special Nakshatras
  let specialNakshatraNote: string | undefined;
  const specialFacts = ws.factSet.facts.filter((f) => f.type === 'special_nakshatra');
  for (const sf of specialFacts) {
    const occupants = String(sf.args.occupants ?? '').split(',').map((s) => s.trim());
    if (occupants.includes(planet)) {
      specialNakshatraNote = `${planet.toUpperCase()} activates the native's ${sf.args.name} (${sf.args.sanskritName}) in ${String(sf.args.nakshatra).toUpperCase()} — governing ${sf.args.domain}.`;
      break;
    }
  }

  let functionalNote: string | undefined;
  if (funcRole === 'benefic') {
    functionalNote = `Acts as a Functional Benefic for this chart due to auspicious house lordship.`;
  } else if (funcRole === 'malefic') {
    functionalNote = `Acts as a Functional Malefic for this chart due to Dusthana/Upachaya lordship; calls for conscious pacing.`;
  }

  return {
    planet,
    sign,
    house,
    dignity,
    nakshatra,
    ownedHouses,
    bottomLine,
    ...(netBalance ? { netBalance } : {}),
    ...(vargaNote ? { vargaNote } : {}),
    ...(vaisheshikamsaNote ? { vaisheshikamsaNote } : {}),
    ...(pushkaraNote ? { pushkaraNote } : {}),
    ...(navataraNote ? { navataraNote } : {}),
    ...(specialNakshatraNote ? { specialNakshatraNote } : {}),
    ...(functionalNote ? { functionalNote } : {}),
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
