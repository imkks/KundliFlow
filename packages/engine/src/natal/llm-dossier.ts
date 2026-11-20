/**
 * Prompt-Ready LLM Context Dossier Engine
 *
 * Compiles 100% of the mathematically computed Vedic astrological data
 * into a dense, token-optimized, zero-hallucination prompt context
 * for Large Language Models (Gemini, Claude, GPT) to synthesize.
 */

import { SIGNS, degToDms } from '../angles.js';
import type { NatalChart, AvakahadaDetails } from './types.js';
import type { VimshottariDashaTree } from '../dasha/vimshottari.js';
import type { AshtakvargaResult } from '../ashtakvarga/index.js';
import type { ShadbalaResult } from '../shadbala/index.js';
import type { ChalitChart } from '../chalit/index.js';
import type { DetectedYoga } from './yogas.js';
import type { CharaKaraka } from './karakas.js';
import type { GrahaAvasthas } from './avasthas.js';
import type { FavourableAndGhatakResult } from './ghatak.js';
import type { DetectedAspect } from './aspects.js';
import type { BhavaAnalysis } from './bhavas.js';

export interface LlmDossierInput {
  userName: string;
  birthDate: string;
  birthTime: string;
  cityName: string;
  lat: number;
  lon: number;
  tzId: string;
  ayanamsa: string;
  timeCertainty: string;
  natalChart: NatalChart;
  panchang?: any;
  avakahada?: AvakahadaDetails | null;
  dashas?: VimshottariDashaTree | null;
  ashtakvarga?: AshtakvargaResult | null;
  shadbala?: ShadbalaResult | null;
  chalit?: ChalitChart | null;
  yogas?: DetectedYoga[];
  karakas?: Record<string, CharaKaraka>;
  avasthas?: Record<string, GrahaAvasthas>;
  ghatak?: FavourableAndGhatakResult | null;
  aspects?: DetectedAspect[];
  bhavas?: BhavaAnalysis[];
}

export interface LlmDossierOutput {
  generatedAt: string;
  tokenEstimate: number;
  markdownPrompt: string;
  structuredJson: Record<string, any>;
}

export function generateLlmDossier(input: LlmDossierInput): LlmDossierOutput {
  const {
    userName,
    birthDate,
    birthTime,
    cityName,
    lat,
    lon,
    tzId,
    ayanamsa,
    timeCertainty,
    natalChart,
    panchang,
    avakahada,
    dashas,
    ashtakvarga,
    shadbala,
    yogas = [],
    karakas = {},
    avasthas = {},
    ghatak,
    aspects = [],
    bhavas = [],
  } = input;

  const formatSign = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

  const lagnaStr = natalChart.lagna
    ? `${formatSign(SIGNS[natalChart.lagna.signIndex] || natalChart.lagna.sign)} (${(natalChart.lagna.lon % 30).toFixed(2)}°)`
    : 'Unknown / Chandra Kundli';

  // 1. Build Structured JSON
  const structuredJson: Record<string, any> = {
    meta: {
      nativeName: userName,
      birthDate,
      birthTime,
      cityName,
      coordinates: `${lat.toFixed(4)}N, ${lon.toFixed(4)}E`,
      timezone: tzId,
      ayanamsa,
      timeCertainty,
      lagna: lagnaStr,
      generatedAt: new Date().toISOString(),
    },
    panchang: panchang
      ? {
          vara: panchang.vara || panchang.wara?.name,
          tithi: panchang.tithi?.name,
          nakshatra: panchang.nakshatra?.name,
          pada: panchang.nakshatra?.pada,
          yoga: panchang.yoga?.name,
          karana: panchang.karana?.name,
        }
      : null,
    avakahada: avakahada || null,
    grahas: Object.entries(natalChart.grahas).map(([id, g]) => {
      const av = avasthas[id];
      const karaka = karakas[id];
      const sbPlanet = shadbala?.planets.find((p) => p.graha === id);
      return {
        id,
        sign: formatSign(SIGNS[g.signIndex] || g.sign),
        degInSign: `${Math.floor(g.degInSign)}° ${Math.floor((g.degInSign % 1) * 60)}'`,
        nakshatra: g.nakshatraName,
        pada: g.pada,
        dignity: g.dignity,
        isRetrograde: !!g.retrograde,
        isCombust: !!g.combust,
        charaKaraka: karaka || null,
        baladiAvastha: av?.baladi || null,
        jagratadiAvastha: av?.jagrat || null,
        deeptadiAvastha: av?.deeptadi || null,
        shadbalaRupas: sbPlanet ? sbPlanet.shadbalaInRupas.toFixed(2) : null,
        shadbalaRank: sbPlanet ? sbPlanet.relativeRank : null,
      };
    }),
    bhavas: bhavas.map((b: any) => ({
      house: b.houseNumber ?? b.house,
      sign: b.signName ?? b.sign,
      lord: b.lord,
      lordHouse: b.lordHouse,
      occupants: b.occupants ?? (b.natalOccupants ? b.natalOccupants.map((o: any) => o.graha) : []),
      aspectingGrahas: b.aspectingGrahas ?? (b.aspectingPlanets ? b.aspectingPlanets.map((a: any) => a.graha) : []),
      savBindus: b.savBindus,
      bhavabalaRank: b.bhavabalaRank ?? null,
      reading: b.reading,
    })),
    yogas: yogas.map((y) => ({
      name: y.name,
      nature: y.type,
      description: y.description,
      planets: y.planetsInvolved,
    })),
    dashaLifeline: dashas
      ? (dashas.periods || []).slice(0, 9).map((p) => ({
          lord: p.lord,
          start: p.startDateIso,
          end: p.endDateIso,
          durationYears: Math.round((p.durationDays / 365.25) * 10) / 10,
        }))
      : [],
    ashtakvarga: ashtakvarga
      ? {
          sarvaTotal: ashtakvarga.totalScore,
          sarvaBySign: SIGNS.map((s, i) => ({ sign: s, bindus: ashtakvarga.sarva[i] })),
        }
      : null,
    favourableAndGhatak: ghatak || null,
    aspects: aspects.slice(0, 15).map((a) => a.formatted),
  };

  // 2. Build Dense Markdown Prompt
  const lines: string[] = [
    `# SYSTEM INSTRUCTION FOR LLM ASTROLOGER`,
    `You are an expert Vedic Astrologer (Jyotishi) trained in Parashari, Jaimini, and KP systems.`,
    `Below is the complete, mathematically pre-computed natal chart dossier computed via Swiss Ephemeris WASM.`,
    `Every planetary degree, dignity, avastha, house cusp, dasha date, and yoga is ground-truth fact.`,
    `Do NOT recalculate or hallucinate celestial coordinates. Synthesize these deterministic facts into clear, deep, compassionate, and actionable life guidance.`,
    ``,
    `---`,
    `## 1. NATIVE & BIRTH METADATA`,
    `- **Native Name**: ${userName || 'Anonymous'}`,
    `- **Date & Time**: ${birthDate} at ${birthTime} (${tzId}) • Certainty: ${timeCertainty}`,
    `- **Place**: ${cityName} (${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E)`,
    `- **Ayanamsa**: ${ayanamsa} • **Lagna (Ascendant)**: ${lagnaStr}`,
  ];

  if (panchang) {
    lines.push(
      `- **Panchang**: Vara: ${panchang.vara || panchang.wara?.name || '—'} | Tithi: ${panchang.tithi?.name || '—'} | Nakshatra: ${panchang.nakshatra?.name || '—'} (Pada ${panchang.nakshatra?.pada || 1}) | Yoga: ${panchang.yoga?.name || '—'} | Karana: ${panchang.karana?.name || '—'}`
    );
  }

  if (avakahada) {
    lines.push(
      `- **Avakahada Blueprint**: Varna: ${avakahada.varna} | Yoni: ${avakahada.yoni} | Gana: ${avakahada.gana} | Nadi: ${avakahada.nadi} | Paya: ${avakahada.paya}`
    );
  }

  lines.push(
    ``,
    `---`,
    `## 2. PLANETARY POSITIONS, DIGNITIES & AVASTHAS`,
    `| Graha | Sign | Degree | Nakshatra (Pada) | Dignity | Baladi | Jagrat | Deeptadi | Karaka | Shadbala |`,
    `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |`
  );

  for (const [id, g] of Object.entries(natalChart.grahas)) {
    const av = avasthas[id];
    const karaka = karakas[id] || '—';
    const sb = shadbala?.planets.find((p) => p.graha === id);
    const sbStr = sb ? `${sb.shadbalaInRupas.toFixed(1)}R (#${sb.relativeRank})` : '—';
    const mot = g.retrograde ? ' (R)' : g.combust ? ' (C)' : '';

    lines.push(
      `| ${id.toUpperCase()}${mot} | ${formatSign(SIGNS[g.signIndex] || g.sign)} | ${Math.floor(g.degInSign)}°${Math.floor((g.degInSign % 1) * 60)}' | ${g.nakshatraName} (${g.pada}) | ${g.dignity?.replace('_', ' ') || 'neutral'} | ${av?.baladi || '—'} | ${av?.jagrat || '—'} | ${av?.deeptadi || '—'} | ${karaka} | ${sbStr} |`
    );
  }

  lines.push(
    ``,
    `---`,
    `## 3. 12 BHAVAS (HOUSES) STRUCTURAL MAPPING`,
    `| House | Sign | Lord | Lord Placed | Residents | Aspects | SAV Bindus | Bhavabala Rank |`,
    `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |`
  );

  for (const b of bhavas as any[]) {
    const houseNum = b.houseNumber ?? b.house;
    const signName = b.signName ?? b.sign;
    const occs = b.occupants ?? (b.natalOccupants ? b.natalOccupants.map((o: any) => o.graha) : []);
    const asps = b.aspectingGrahas ?? (b.aspectingPlanets ? b.aspectingPlanets.map((a: any) => a.graha) : []);
    const res = occs.length > 0 ? occs.join(', ').toUpperCase() : 'None';
    const asp = asps.length > 0 ? asps.join(', ').toUpperCase() : 'None';
    const rankStr = b.bhavabalaRank ? `#${b.bhavabalaRank}` : '—';
    lines.push(
      `| House ${houseNum} | ${signName} | ${b.lord.toUpperCase()} | House ${b.lordHouse} | ${res} | ${asp} | ${b.savBindus} | ${rankStr} |`
    );
  }

  if (yogas.length > 0) {
    lines.push(
      ``,
      `---`,
      `## 4. DETECTED CLASSICAL YOGAS & DOSHAS`
    );
    for (const y of yogas) {
      lines.push(
        `- **${y.name}** (${y.type.toUpperCase()}): ${y.description} (Involving: ${y.planetsInvolved.join(', ').toUpperCase()})`
      );
    }
  }

  if (dashas && (dashas.periods || []).length > 0) {
    lines.push(
      ``,
      `---`,
      `## 5. VIMSHOTTARI DASHA TIMELINE (120-YEAR LIFELINE)`
    );
    for (const p of (dashas.periods || []).slice(0, 9)) {
      const s = p.startDateIso ? p.startDateIso.slice(0, 10) : '—';
      const e = p.endDateIso ? p.endDateIso.slice(0, 10) : '—';
      const dur = Math.round((p.durationDays / 365.25) * 10) / 10;
      lines.push(`- **${p.lord.toUpperCase()} Mahadasha** (${dur} yrs): ${s} to ${e}`);
    }
  }

  if (ghatak) {
    lines.push(
      ``,
      `---`,
      `## 6. PERSONAL AUSPICIOUS & GHATAK (MALEFIC) RHYTHMS`,
      `- **Favourable Factors**: Lucky Number: ${ghatak.favourable.luckyNumber} | Good Numbers: ${ghatak.favourable.goodNumbers.join(', ')} | Lucky Days: ${ghatak.favourable.luckyDays.join(', ')} | Good Planets: ${ghatak.favourable.goodPlanets.join(', ')} | Lucky Gem: ${ghatak.favourable.luckyStone} | Lucky Metal: ${ghatak.favourable.luckyMetal}`,
      `- **Ghatak (Avoid for Crucial Initiations)**: Bad Day: ${ghatak.ghatak.badDay} | Bad Rashi: ${ghatak.ghatak.badRasi} | Bad Lagna: ${ghatak.ghatak.badLagna} | Bad Nakshatra: ${ghatak.ghatak.badNakshatra} | Bad Tithi: ${ghatak.ghatak.badTithi} | Bad Planets: ${ghatak.ghatak.badPlanets.join(', ')}`
    );
  }

  if (aspects.length > 0) {
    lines.push(
      ``,
      `---`,
      `## 7. SIGNIFICANT MUTUAL PLANETARY ASPECTS`,
      aspects.slice(0, 12).map((a) => `- ${a.formatted}`).join('\n')
    );
  }

  lines.push(
    ``,
    `---`,
    `## 8. REQUESTED SYNTHESIS OUTLINE FOR LLM`,
    `Please provide a coherent, personalized, structured astrological reading covering:`,
    `1. **Core Personality & Psychological Architecture** (Synthesizing Lagna, Lagna Lord dignity/avastha, Moon Nakshatra, and Sun).`,
    `2. **Career, Vocation & Social Status** (Synthesizing 10th & 11th bhavas, Amatyakaraka, and current running Dasha period).`,
    `3. **Relationships & Marriage** (Synthesizing 7th bhava, Venus, Darakaraka, and Kuja Dosha assessment).`,
    `4. **Current Astrological Weather & Tactical Advice** (Active Mahadasha/Antardasha combined with current transit themes).`,
    `5. **Practical Remedies & Lifestyle Harmonization** (Favourable stones, metals, and mind-alignment practices).`
  );

  const markdownPrompt = lines.join('\n');
  // Approximate tokens ~ 4 chars per token
  const tokenEstimate = Math.round(markdownPrompt.length / 4);

  return {
    generatedAt: new Date().toISOString(),
    tokenEstimate,
    markdownPrompt,
    structuredJson,
  };
}
