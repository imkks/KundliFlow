import {
  calculateKpPlacement,
  calculateVargaSign,
  computeAshtakvarga,
  computeArudhaPadas,
  computeCharaDashas,
  computeCharaKarakas,
  computePanchadhaFriendship,
  computeFavourableAndGhatak,
  computePanchang,
  computePlanetaryAvasthas,
  computeShadbala,
  computeSripatiChalit,
  computeUpagrahas,
  computeVarshaphal,
  computeYoginiDashas,
  detectYogasAndDoshas,
  KARAKA_NAMES,
  type EphemerisProvider,
  type NatalChart,
  type SevenGraha,
} from '@astro/engine';
import { PLANET_IDS, SIGN_IDS } from '@astro/facts';

const YOGA_MEANINGS: Record<string, string> = {
  gajakesari: 'Moon–Jupiter alignment in mutual angles brings wisdom, public goodwill, resilient optimism, and steady mentorship support.',
  budhaditya: 'Sun–Mercury conjunction sharpens analytical speech, intellect, writing, and administrative or commercial acumen.',
  hamsa: 'Jupiter strong in a Kendra fosters ethical leadership, higher learning, advisory stature, and protective grace.',
  malavya: 'Venus strong in a Kendra enhances aesthetic sensibility, diplomacy, relational warmth, and material comfort.',
  ruchaka: 'Mars strong in a Kendra confers decisive courage, physical stamina, and execution power under pressure.',
  bhadra: 'Mercury strong in a Kendra amplifies eloquence, strategic thinking, adaptability, and business intelligence.',
  shasha: 'Saturn strong in a Kendra grants long-term discipline, institutional authority, patience, and enduring career foundations.',
  neecha_bhanga: 'Debilitation cancellation turns an initial area of self-doubt or struggle into a late-blooming strength through persistence.',
  vipareeta: 'Difficult-house lords turning resilient convert crises, competition, or sudden upheaval into unexpected breakthroughs.',
  mangal_dosha: 'Mars in sensitive relationship houses heightens passion, independence, and directness; conscious pacing and mutual respect keep harmony.',
  kaal_sarp: 'All planets hemmed between Rahu and Ketu create an intense, all-or-nothing karmic focus that rewards disciplined routines.',
  kemadruma: 'Moon without flanking planets can bring moments of emotional solitude or self-reliance; grounding habits and Kendra support stabilize it.',
  guru_chandal: 'Jupiter–Rahu association blends traditional wisdom with unconventional questioning—great for innovation when grounded.',
  grahan: 'Luminaries close to Rahu/Ketu heighten sensitivity and deep introspection; avoid impulsive decisions during eclipse windows.',
  chandra_mangala: 'Moon–Mars conjunction activates acute financial ambition, energetic commercial initiative, resource generation, and fearless competitive drive.',
  amala: 'Natural benefic (Jupiter, Venus, or Mercury) unblemished in the 10th house confers an immaculate professional reputation, ethical public legacy, and enduring goodwill.',
  sunapha: 'Planets other than Sun in the 2nd house from Moon indicate self-earned wealth, intelligent resource management, and reputable social standing.',
  anapha: 'Planets other than Sun in the 12th house from Moon bestow contentment, refined manners, good physical health, and enjoyment of quiet comforts.',
  durudhara: 'Planets on both sides (2nd and 12th) of Moon provide balanced material security, faithful allies, comfortable conveyances, and steady life flow.',
  vesi: 'Planets other than Moon in the 2nd house from Sun impart dignified speech, steady perseverance, moral conviction, and comfortable assets.',
  vosi: 'Planets other than Moon in the 12th house from Sun confer charitable generosity, sharp intellect, worldly renown, and high learning.',
  ubhayachari: 'Planets on both sides (2nd and 12th) of Sun ensure high social status, eloquence, well-proportioned physique, and diplomatic capability.',
  harsha: '6th lord occupying a Dusthana (Harsha Vipareeta Yoga) conquers formidable adversaries, protects physical vitality, and yields triumph through resilience.',
  sarala: '8th lord occupying a Dusthana (Sarala Vipareeta Yoga) confers exceptional longevity, fearless composure in crises, investigative intellect, and unexpected wealth.',
  vimala: '12th lord occupying a Dusthana (Vimala Vipareeta Yoga) dissolves liabilities and enemies, fostering independent frugality, spiritual detachment, and noble character.',
  dharma_karmadhipati: 'Mutual association of the 9th (Dharma) and 10th (Karma) lords creates the premier Parashari Raja Yoga, conferring high executive authority, state honors, and ethical leadership.',
  lakshmi: '9th lord strong in Kendra or Trikona confers Lakshmi Yoga, bestowing noble grace, high scholastic attainment, aristocratic comfort, and enduring wealth.',
  kahala: '4th and 9th lords in mutual Kendras produce Kahala Yoga, giving resolute administrative command, organizational leadership, and unyielding stamina in undertakings.',
  parivartana: 'Mutual exchange of house signs between two lords creates intimate lifelong synergy between their respective life domains.',
  shankha: 'Lords of 5th and 6th in mutual Kendras with Lagna lord strong confers sharp philosophical insight, humanitarian service, and high learning.',
  vasumati: 'Benefics in Upachaya houses (3, 6, 10, 11) from Lagna or Moon confer unshakeable independence and steady accumulation of wealth.',
  pushkala: 'Moon sign lord strong with Lagna lord in Kendra confers magnetic public recognition, aristocratic speech, and influential mentorship.',
  chamara: 'Exalted or Kendra Lagna lord aspected by Jupiter confers royal dignity, eloquence, philosophical scholarship, and enduring fame.',
  bheri: 'Planets in Lagna, 2nd, 7th, and 12th or Jupiter/Venus in Kendras with 9th lord strong bestow durable prosperity, noble family ties, and joyful disposition.',
  arishta_bhanga: 'Benefic planetary placements (such as strong Jupiter in Lagna or Full Moon in Kendra) nullify childhood afflictions, ensuring long life and vitality.',
  durudhara_yoga: 'Planets flanking both 2nd and 12th from Moon bestow material abundance, trustworthy allies, comfortable vehicles, and generous renown.',
  sunapha_yoga: 'Planets in 2nd house from Moon indicate self-earned wealth, sharp commercial intelligence, and reputable social standing.',
  anapha_yoga: 'Planets in 12th house from Moon bestow physical health, polite disposition, self-respect, and spiritual contentment.',
  kemadruma_yoga: 'Moon without flanking planets tests early self-reliance; classical cancellations convert this solitude into formidable leadership.',
  ubhayachari_yoga: 'Planets flanking both 2nd and 12th from Sun confer distinguished public stature, eloquence, and balanced executive judgment.',
  vesi_yoga: 'Planets in 2nd house from Sun impart dignified speech, steady perseverance, moral conviction, and comfortable assets.',
  vosi_yoga: 'Planets in 12th house from Sun confer broad charitable vision, sharp intellect, worldly renown, and contemplative depth.',
  sankhya_vallaki: 'Nabhasa Vallaki (Veena) Yoga: All 7 classical planets spread across 7 signs bestow refined musical, artistic, and literary talents.',
  sankhya_dama: 'Nabhasa Dama Yoga: All 7 classical planets spread across 6 signs grant generous philanthropy, public welfare leadership, and affluent ease.',
  sankhya_pasha: 'Nabhasa Pasha Yoga: All 7 classical planets spread across 5 signs impart skilled management of complex organizations and households.',
  sankhya_kedara: 'Nabhasa Kedara Yoga: All 7 classical planets spread across 4 signs bestow steady agricultural, land, or estate prosperity.',
  sankhya_shoola: 'Nabhasa Shoola Yoga: All 7 classical planets spread across 3 signs confer tenacious courage, strategic grit, and competitive victory.',
  sankhya_yuga: 'Nabhasa Yuga Yoga: All 7 classical planets concentrated in 2 signs inspire independent pioneering thought and non-conformist paths.',
  sankhya_gola: 'Nabhasa Gola Yoga: All 7 classical planets in 1 sign grant intense laser-focused concentration and reclusive inner power.',
  nabhasa_rajju: 'Nabhasa Rajju Yoga: All 7 planets in movable signs make one dynamic, adventurous, fond of foreign travel, and constantly enterprising.',
  nabhasa_musala: 'Nabhasa Musala Yoga: All 7 planets in fixed signs confer unshakeable resolve, enduring family loyalty, and steady wealth accumulation.',
  nabhasa_nala: 'Nabhasa Nala Yoga: All 7 planets in dual signs bestow multifaceted learning, versatile communication, and high intellectual agility.',
  nabhasa_kamala: 'Nabhasa Kamala Yoga: All 4 angular Kendras occupied by classical planets confer monumental fame, spotless character, and kingly fortune.',
  nabhasa_shringataka: 'Nabhasa Shringataka Yoga: All 7 planets in trinal houses (1, 5, 9) bring supreme good fortune, scholarly distinction, and victorious courage.',
};

const YOGINI_THEMES: Record<string, { lord: string; theme: string }> = {
  Mangala: { lord: 'Moon', theme: 'Emotional renewal, peace of mind, supportive domestic flow, and gentle beginnings.' },
  Pingala: { lord: 'Sun', theme: 'Visibility, willpower, vitality, and heightened sensitivity to authority or ego friction.' },
  Dhanya: { lord: 'Jupiter', theme: 'Expansion, learning, financial steadiness, mentorship, and auspicious growth.' },
  Bhramari: { lord: 'Mars', theme: 'Restless drive, travel or relocation energy, and decisive action that needs calm pacing.' },
  Bhadrika: { lord: 'Mercury', theme: 'Skill building, communication, friendships, trade, and intellectual clarity.' },
  Ulka: { lord: 'Saturn', theme: 'Karmic accountability, heavy responsibilities, endurance, and pruning what no longer serves.' },
  Siddha: { lord: 'Venus', theme: 'Creative fulfillment, relationship harmony, comforts, and recognition of past effort.' },
  Sankata: { lord: 'Rahu', theme: 'Sudden pivots, intense ambition, unconventional turns, and breakthrough resilience.' },
};

const TARA_NAMES = [
  'Janma (Birth — self-focus, pace gently)',
  'Sampat (Wealth — supportive for gains & flow)',
  'Vipat (Friction — double-check plans & travel)',
  'Kshema (Well-being — steady, nourishing, calm)',
  'Pratyak (Obstacles — avoid unnecessary confrontations)',
  'Sadhaka (Achievement — strong for execution & skill)',
  'Vadha (Strain — rest, avoid high-stakes risks)',
  'Mitra (Friendly — cooperative & social ease)',
  'Ati-Mitra (Very Friendly — auspicious & uplifting)',
];

const UPAGRAHA_MEANINGS: Record<string, string> = {
  gulika: 'Son of Saturn; marks the nexus of karmic responsibility, chronic labor, and areas where patience builds unshakable discipline.',
  mandi: 'Subtle sensitive point related to Gulika; requires disciplined lifestyle habits, mental grounding, and structured boundary management.',
  yamakantaka: 'Son of Jupiter; highly auspicious invisible point that confers divine protection, mental clarity, and success in learning or enterprise.',
  ardhaprahara: 'Son of Mercury; subtle point of commercial acumen, witty intellect, and skillful trade or mediation.',
  kaala: 'Son of Sun; marker of authority, time discipline, and moments when decisive executive responsibility is demanded.',
  mrityu: 'Son of Mars; indicates fiery points of sudden physical energy, requiring conscious patience against impulsiveness.',
  dhuma: 'Smoky upstream point from Sun; reveals areas where attachment causes confusion until spiritual surrender reveals clarity.',
  dhooma: 'Smoky upstream point from Sun; reveals areas where attachment causes confusion until spiritual surrender reveals clarity.',
  vyatipata: 'Violent atmospheric inversion point; marks unexpected life reversals that catalyze rapid psychological maturation.',
  parivesha: 'Solar halo boundary; forms a protective aura around reputation, shelters personal assets, and shields against scandal.',
  indrachapa: 'Celestial rainbow point; inspires high ethical aspiration, ideological vision, and reaching beyond conventional horizons.',
  upaketu: 'Smoky tail of Ketu; triggers sudden flashes of intuitive detachment, spiritual insight, and unexpected turning points.',
  pranapada: 'Vital breath point (Lagna Ayurdaya indicator); determines physiological vitality, breath rhythm, and alignment of the physical vehicle with the soul.',
};

const GANA_MEANINGS: Record<string, string> = {
  Deva: 'Deva Gana leans toward harmony, idealism, diplomacy, and sensitivity to coarse environments.',
  Manushya: 'Manushya Gana balances practicality, ambition, and human-centered adaptability.',
  Rakshasa: 'Rakshasa Gana brings fierce independence, sharp intuition, and resilience under pressure.',
};

const NADI_MEANINGS: Record<string, string> = {
  Adi: 'Adi (Vata) constitution: quick mind, creative movement, benefits from warmth and grounding routines.',
  Madhya: 'Madhya (Pitta) constitution: sharp drive, digestive/metabolic fire, benefits from cooling balance.',
  Antya: 'Antya (Kapha) constitution: steady endurance, emotional depth, benefits from regular movement.',
};

const MUNTHA_HOUSE_THEMES: Record<number, string> = {
  1: 'Self-renewal, health focus, and personal initiative take center stage this year.',
  2: 'Finances, family values, and speech/resource consolidation lead the year.',
  3: 'Courage, short journeys, siblings, and self-started skills are highlighted.',
  4: 'Home, property, inner peace, and emotional foundations demand attention.',
  5: 'Creativity, learning, romance, children, and speculative wisdom flourish.',
  6: 'Routine discipline, health care, competition, and clearing debts dominate.',
  7: 'Partnerships, contracts, public dealings, and relationship balance lead.',
  8: 'Deep transformation, research, shared finances, and patience under change.',
  9: 'Higher learning, mentors, long travel, dharma, and fortunate openings.',
  10: 'Career visibility, leadership responsibility, and public achievement peak.',
  11: 'Gains, networks, long-term ambitions, and community support expand.',
  12: 'Rest, foreign/remote links, spiritual reflection, and letting go of clutter.',
};

function yogaPlainMeaning(y: any): string {
  const key = String(y.id || y.name || '').toLowerCase();
  for (const [pattern, text] of Object.entries(YOGA_MEANINGS)) {
    if (key.includes(pattern)) return text;
  }
  return y.category === 'dosha'
    ? `Highlights an area of friction or intensity (${y.name}) that benefits from conscious pacing rather than fear.`
    : `Combination (${y.name}) amplifies natural talent and support when its participating planets run in Dashas.`;
}

function gocharText(planet: string, hMoon: number, bindus: number | undefined, retro: boolean): string {
  const bavLabel =
    bindus === undefined
      ? 'BAV unavailable'
      : bindus >= 5
      ? `strong BAV cushion (${bindus}/8 bindus)`
      : bindus === 4
      ? `balanced BAV (${bindus}/8 bindus)`
      : `lean BAV (${bindus}/8 bindus — pace carefully)`;

  const goodFromMoon =
    (planet === 'sun' && [3, 6, 10, 11].includes(hMoon)) ||
    (planet === 'moon' && [1, 3, 6, 7, 10, 11].includes(hMoon)) ||
    (planet === 'mars' && [3, 6, 11].includes(hMoon)) ||
    (planet === 'mercury' && [2, 4, 6, 8, 10, 11].includes(hMoon)) ||
    (planet === 'jupiter' && [2, 5, 7, 9, 11].includes(hMoon)) ||
    (planet === 'venus' && [1, 2, 3, 4, 5, 8, 9, 11, 12].includes(hMoon)) ||
    (planet === 'saturn' && [3, 6, 11].includes(hMoon)) ||
    ((planet === 'rahu' || planet === 'ketu') && [3, 6, 11].includes(hMoon));

  const tone = goodFromMoon ? 'is traditionally supportive' : 'demands mindful adjustment';
  const retroNote = retro ? ' Retrograde motion internalizes and revisits unfinished themes.' : '';
  return `House ${hMoon} from natal Moon ${tone}, with ${bavLabel}.${retroNote}`;
}

export function buildLevel2Extras(
  level1: any,
  eph?: EphemerisProvider | null,
) {
  const natal: NatalChart = level1.natal;
  const lagnaIdx = natal.lagna?.signIndex ?? 0;
  const moonIdx = natal.grahas.moon.signIndex;
  const moonNakIdx = natal.grahas.moon.nakshatraIndex;

  // 1. Yogas & Doshas with real presence, strength, planets & cancellation notes
  const yogas = (level1.yogas ?? detectYogasAndDoshas(natal)).map((y: any) => ({
    id: y.id,
    name: y.name,
    category: y.category,
    presence: y.presence ?? true,
    strength: y.strength ?? (y.presence === false ? 'absent' : 'moderate'),
    planets: Array.isArray(y.planets) ? y.planets : [],
    description: y.description,
    plainMeaning: y.effect || yogaPlainMeaning(y),
    ...(y.cancellationNote ? { cancellationNote: y.cancellationNote } : {}),
  }));

  // 2. Strengths, Avasthas, SAV + Panchadha Maitri (Five-Fold Friendship)
  const sb = level1.shadbala ?? computeShadbala(natal);
  const avas = level1.avasthas ?? computePlanetaryAvasthas(natal.grahas);
  const avk =
    level1.ashtakvarga ??
    computeAshtakvarga({
      sun: natal.grahas.sun.signIndex,
      moon: natal.grahas.moon.signIndex,
      mars: natal.grahas.mars.signIndex,
      mercury: natal.grahas.mercury.signIndex,
      jupiter: natal.grahas.jupiter.signIndex,
      venus: natal.grahas.venus.signIndex,
      saturn: natal.grahas.saturn.signIndex,
      lagna: lagnaIdx,
    });
  const friendship = computePanchadhaFriendship({
    sun: natal.grahas.sun.signIndex,
    moon: natal.grahas.moon.signIndex,
    mars: natal.grahas.mars.signIndex,
    mercury: natal.grahas.mercury.signIndex,
    jupiter: natal.grahas.jupiter.signIndex,
    venus: natal.grahas.venus.signIndex,
    saturn: natal.grahas.saturn.signIndex,
  });

  const strengths = {
    planets: Object.entries(sb.planets).map(([p, s]: [string, any]) => {
      const av = avas[p];
      const signLord = natal.grahas[p as SevenGraha]?.signLord as SevenGraha | undefined;
      const rel = signLord && signLord !== p ? friendship[p as SevenGraha]?.[signLord] : 'own_sign';
      return {
        planet: p,
        ratio: Number(s.strengthRatio.toFixed(2)),
        rupas: Number(s.shadbalaInRupas.toFixed(2)),
        rank: s.rank,
        baladi: av?.baladi ?? '—',
        deeptadi: av?.deeptadi ?? '—',
        dispositorRelation: rel ?? 'neutral',
        plainSummary: `${p.toUpperCase()} has ${s.strengthRatio >= 1 ? 'ample' : 'modest'} planetary horsepower (${s.strengthRatio.toFixed(2)}x required)${av ? `, in ${av.baladi}` : ''}${rel && rel !== 'own_sign' ? `, and is ${String(rel).replace('_', ' ')} with its sign lord` : ''}.`,
      };
    }),
    savTopSigns: avk.sarva
      .map((b: number, idx: number) => ({ sign: SIGN_IDS[idx]!, bindus: b }))
      .sort((a: any, b: any) => b.bindus - a.bindus),
  };

  // 3. Specials: Karakas, Extended Vargas (D1..D60), Arudhas, Ghatak, Upagrahas
  const karakaMap = computeCharaKarakas(natal.grahas);
  const arudhas = computeArudhaPadas(natal);
  const gh = level1.ghatak ?? computeFavourableAndGhatak(moonIdx);
  const upagrahas = computeUpagrahas(natal).map((u) => ({
    ...u,
    meaning: UPAGRAHA_MEANINGS[u.id] ?? `${u.name} in House ${u.houseFromLagna} shapes subtle karmic focus.`,
  }));

  const specials = {
    karakas: Object.entries(karakaMap).map(([graha, code]) => ({
      code,
      role: KARAKA_NAMES[code],
      graha,
      meaning:
        code === 'AK'
          ? `${graha.toUpperCase()} is your Atmakaraka (soul significator), pointing to your core life lesson.`
          : code === 'AmK'
          ? `${graha.toUpperCase()} is your Amatyakaraka, guiding career and counsel.`
          : code === 'DK'
          ? `${graha.toUpperCase()} is your Darakaraka, shaping committed partnership dynamics.`
          : `${graha.toUpperCase()} carries ${KARAKA_NAMES[code]} themes.`,
    })),
    vargas: PLANET_IDS.map((p) => {
      const g = natal.grahas[p];
      const d9Idx = calculateVargaSign(g.lon, 'D9');
      return {
        planet: p,
        d1: g.sign,
        d2: SIGN_IDS[calculateVargaSign(g.lon, 'D2')]!,
        d3: SIGN_IDS[calculateVargaSign(g.lon, 'D3')]!,
        d4: SIGN_IDS[calculateVargaSign(g.lon, 'D4')]!,
        d7: SIGN_IDS[calculateVargaSign(g.lon, 'D7')]!,
        d9: SIGN_IDS[d9Idx]!,
        d10: SIGN_IDS[calculateVargaSign(g.lon, 'D10')]!,
        d12: SIGN_IDS[calculateVargaSign(g.lon, 'D12')]!,
        d24: SIGN_IDS[calculateVargaSign(g.lon, 'D24')]!,
        d30: SIGN_IDS[calculateVargaSign(g.lon, 'D30')]!,
        d60: SIGN_IDS[calculateVargaSign(g.lon, 'D60')]!,
        vargottama: d9Idx === g.signIndex,
      };
    }),
    arudhas: arudhas.filter((a) => a.code === 'AL' || a.code === 'UL' || a.code === 'A10' || a.code === 'A7'),
    ghatak: {
      luckyNumber: gh.favourable.luckyNumber,
      luckyDays: gh.favourable.luckyDays,
      luckyStone: gh.favourable.luckyStone,
      luckyMetal: gh.favourable.luckyMetal,
      goodPlanets: gh.favourable.goodPlanets,
      badDay: gh.ghatak.badDay,
      badRasi: gh.ghatak.badRasi,
      badTithi: gh.ghatak.badTithi,
      badNakshatra: gh.ghatak.badNakshatra,
      badLagna: gh.ghatak.badLagna,
    },
    upagrahas,
  };

  // 4. Transits enriched with Gochar + BAV + Tarabala + Chandrabala
  const tr = level1.transits;
  const transitMoon = tr?.transits?.moon;
  const transitMoonLon =
    transitMoon && typeof transitMoon.signIndex === 'number'
      ? (transitMoon.signIndex * 30 + (transitMoon.degInSign ?? 0)) % 360
      : null;
  const transitMoonNak =
    typeof transitMoon?.nakshatraIndex === 'number'
      ? transitMoon.nakshatraIndex
      : transitMoonLon !== null
      ? Math.floor(transitMoonLon / (360 / 27)) % 27
      : 0;
  const taraIdx = ((transitMoonNak - moonNakIdx + 27) % 9);
  const transitReadings = tr
    ? Object.values(tr.transits).map((t: any) => ({
        planet: t.graha,
        sign: t.sign,
        houseFromLagna: t.houseFromLagna,
        houseFromMoon: t.houseFromMoon,
        retrograde: t.retrograde,
        bindus: t.ashtakvargaBindus,
        bavQuality: t.ashtakvargaBindus >= 5 ? 'supportive' : t.ashtakvargaBindus === 4 ? 'neutral' : 'cautious',
        plainMeaning: gocharText(t.graha, t.houseFromMoon, t.ashtakvargaBindus, Boolean(t.retrograde)),
      }))
    : [];

  // 5. Natal Panchang & Avakahada
  const rawDow = natal.time?.birthLocal
    ? new Date(`${String(natal.time.birthLocal).slice(0, 10)}T12:00:00Z`).getUTCDay()
    : new Date(natal.time?.birthUtc ?? Date.now()).getUTCDay();
  const localDow = Number.isFinite(rawDow) ? rawDow : 0;
  const natalPanchang = computePanchang(natal.grahas.sun.lon, natal.grahas.moon.lon, localDow);
  const avkNatal = level1.avakahada;
  const panchangReadings = {
    natal: {
      tithi: `${natalPanchang.tithi.paksha} ${natalPanchang.tithi.name}`,
      yoga: natalPanchang.yoga.name,
      karana: natalPanchang.karana.name,
      vara: natalPanchang.wara.name,
      nakshatra: `${natal.grahas.moon.nakshatra} (Pada ${natal.grahas.moon.pada})`,
      plainSummary: `Born on ${natalPanchang.wara.name} in ${natalPanchang.tithi.paksha} ${natalPanchang.tithi.name} under ${natal.grahas.moon.nakshatra} Pada ${natal.grahas.moon.pada}.`,
    },
    avakahada: avkNatal
      ? {
          gana: avkNatal.gana,
          nadi: avkNatal.nadi,
          yoni: avkNatal.yoni,
          varna: avkNatal.varna,
          tatva: avkNatal.tatva,
          paya: avkNatal.paya,
          ganaMeaning: GANA_MEANINGS[avkNatal.gana] ?? '',
          nadiMeaning: NADI_MEANINGS[avkNatal.nadi] ?? '',
        }
      : null,
    todayMoon: transitMoon
      ? {
          sign: transitMoon.sign,
          houseFromMoon: transitMoon.houseFromMoon,
          chandraBalaSupportive: ![6, 8, 12].includes(transitMoon.houseFromMoon),
          taraName: TARA_NAMES[taraIdx] ?? 'Unknown',
          taraSupportive: ![2, 4, 6].includes(taraIdx),
        }
      : null,
  };

  // 6. Extended Dashas: Yogini & Chara
  const nowDate = new Date().toISOString().slice(0, 10);
  const yoginiRes =
    level1.yogini ?? computeYoginiDashas(moonNakIdx, natal.grahas.moon.elapsedInNakshatra, natal.time.birthLocal);
  const charaRes = level1.chara ?? computeCharaDashas(lagnaIdx, natal.time.birthLocal, natal.grahas);
  const yoginiPeriods = yoginiRes?.periods ?? [];
  const charaPeriods = charaRes?.periods ?? [];
  const activeYoginiMaha = yoginiPeriods.find((m: any) => nowDate >= m.startDateIso && nowDate < m.endDateIso);
  const activeYoginiAntar = activeYoginiMaha?.subPeriods?.find((a: any) => nowDate >= a.startDateIso && nowDate < a.endDateIso);
  const activeCharaMaha = charaPeriods.find((m: any) => nowDate >= m.startDateIso && nowDate < m.endDateIso);
  const activeCharaAntar = activeCharaMaha?.subPeriods?.find((a: any) => nowDate >= a.startDateIso && nowDate < a.endDateIso);

  const extendedDashas = {
    yogini: activeYoginiMaha
      ? {
          maha: activeYoginiMaha.name,
          mahaLord: activeYoginiMaha.lord,
          mahaEnd: activeYoginiMaha.endDateIso.slice(0, 10),
          antar: activeYoginiAntar?.name ?? null,
          antarLord: activeYoginiAntar?.lord ?? null,
          antarEnd: activeYoginiAntar?.endDateIso?.slice(0, 10) ?? null,
          plainSummary: `${activeYoginiMaha.name} (${activeYoginiMaha.lord.toUpperCase()}): ${YOGINI_THEMES[activeYoginiMaha.name]?.theme ?? ''}${activeYoginiAntar ? ` Sub-period ${activeYoginiAntar.name} colors daily pace.` : ''}`,
        }
      : null,
    chara: activeCharaMaha
      ? {
          mahaSign: activeCharaMaha.sign,
          mahaHouse: ((activeCharaMaha.signIndex - lagnaIdx + 12) % 12) + 1,
          mahaEnd: activeCharaMaha.endDateIso.slice(0, 10),
          antarSign: activeCharaAntar?.sign ?? null,
          antarHouse: activeCharaAntar ? ((activeCharaAntar.signIndex - lagnaIdx + 12) % 12) + 1 : null,
          antarEnd: activeCharaAntar?.endDateIso?.slice(0, 10) ?? null,
          plainSummary: `Jaimini Chara Dasha activates ${activeCharaMaha.sign} (your natal House ${((activeCharaMaha.signIndex - lagnaIdx + 12) % 12) + 1})${activeCharaAntar ? `, with ${activeCharaAntar.sign} sub-period focusing House ${((activeCharaAntar.signIndex - lagnaIdx + 12) % 12) + 1}` : ''}.`,
        }
      : null,
  };

  // 7. Kundli Extras: Chalit shifts, KP key cusps, Varshaphal
  const chalit =
    level1.chalit ?? (natal.lagna ? computeSripatiChalit(natal.lagna.lon, natal.mc?.lon ?? (natal.lagna.lon + 270) % 360) : null);
  const chalitShifts = chalit?.bhavas
    ? PLANET_IDS.map((p) => {
        const g = natal.grahas[p];
        const rashiHouse = g.houseFromLagna ?? 1;
        const bhavaObj = chalit.bhavas.find((b: any) => {
          const s = b.startLon;
          const e = b.endLon;
          return s <= e ? g.lon >= s && g.lon < e : g.lon >= s || g.lon < e;
        });
        const chalitHouse = bhavaObj?.house ?? rashiHouse;
        return chalitHouse !== rashiHouse
          ? {
              planet: p,
              rashiHouse,
              chalitHouse,
              plainMeaning: `${p.toUpperCase()} sits in House ${rashiHouse} by sign (D1), but shifts into House ${chalitHouse} in Sripati Chalit, so its practical results express through House ${chalitHouse}.`,
            }
          : null;
      }).filter(Boolean)
    : [];

  const kpCusps = natal.lagna
    ? [1, 2, 6, 7, 10, 11].map((h) => {
        const cuspLon = (natal.lagna!.lon + (h - 1) * 30) % 360;
        const kp = calculateKpPlacement(cuspLon);
        return {
          house: h,
          sign: kp.sign,
          starLord: kp.starLord,
          subLord: kp.subLord,
          plainMeaning: `House ${h} cusp falls in ${kp.sign} (${kp.nakshatra}), with Star Lord ${kp.starLord.toUpperCase()} and Sub-Lord ${kp.subLord.toUpperCase()} acting as final decider for House ${h} matters.`,
        };
      })
    : [];

  let varshaphalSummary: any = null;
  if (eph) {
    try {
      const vp = computeVarshaphal(eph, natal, new Date().getUTCFullYear());
      varshaphalSummary = {
        targetYear: vp.targetYear,
        completedAge: vp.completedAge,
        varshaLagnaSign: vp.varshaLagnaSign,
        munthaSign: vp.munthaSign,
        munthaHouseInVarsha: vp.munthaHouseInVarsha,
        munthaLord: vp.munthaLord,
        varsheshwara: vp.varsheshwara,
        varaPati: vp.varaPati,
        plainSummary: `For age ${vp.completedAge} (${vp.targetYear}), Varsha Lagna rises in ${vp.varshaLagnaSign} with Muntha in ${vp.munthaSign} (Annual House ${vp.munthaHouseInVarsha}): ${MUNTHA_HOUSE_THEMES[vp.munthaHouseInVarsha] ?? ''}`,
        sahams: vp.sahamsList?.slice(0, 10),
      };
    } catch {
      varshaphalSummary = null;
    }
  }

  // 8. "Your Chart in 60 Seconds" Overview
  const lagnaSign = natal.lagna?.sign ?? 'unknown';
  const moonSign = natal.grahas.moon.sign;
  const moonNak = natal.grahas.moon.nakshatra;
  const ak = specials.karakas.find((k: any) => k.code === 'AK');
  const amk = specials.karakas.find((k: any) => k.code === 'AmK');
  const topPlanet = [...strengths.planets].sort((a: any, b: any) => a.rank - b.rank)[0];
  const topYoga = yogas.find((y: any) => y.presence === true && y.category !== 'dosha');
  const topDosha = yogas.find((y: any) => y.presence === true && y.category === 'dosha');

  const overview = {
    coreNature: `Your rising sign is ${lagnaSign.toUpperCase()} with Moon in ${moonSign.toUpperCase()} (${moonNak}), blending practical direction with ${moonNak} emotional instincts.`,
    soulAndCareer: `${ak ? `${ak.graha.toUpperCase()} is your Atmakaraka (core soul lesson)` : ''}${ak && amk ? `, while ${amk.graha.toUpperCase()} serves as Amatyakaraka (career & counsel).` : '.'}`,
    currentChapter: extendedDashas.yogini
      ? `You are currently in ${extendedDashas.yogini.maha} Yogini Dasha (${extendedDashas.yogini.mahaLord.toUpperCase()})${extendedDashas.chara ? ` and ${extendedDashas.chara.mahaSign} Chara Dasha (House ${extendedDashas.chara.mahaHouse})` : ''}.`
      : 'Check the Timing tab for your active Mahadasha and Antardasha themes.',
    topStrengthAndWatch: `${topPlanet ? `Strongest planet: ${topPlanet.planet.toUpperCase()} (${topPlanet.ratio}x required)` : ''}${topYoga ? ` • Key yoga: ${topYoga.name}` : ''}${topDosha ? ` • Watch area: ${topDosha.name}` : ''}.`,
  };

  return {
    overview,
    yogas,
    strengths,
    specials,
    transitReadings,
    panchangReadings,
    extendedDashas,
    kundliExtras: {
      chalitShifts,
      kpCusps,
      varshaphal: varshaphalSummary,
    },
  };
}
