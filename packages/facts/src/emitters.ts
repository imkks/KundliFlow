import {
  angleDiff,
  calculateVargaSign,
  houseFromSign,
  type GrahaDetail,
  type DashaNode,
} from '@astro/engine';
import {
  PLANET_IDS,
  SIGN_IDS,
  SIGN_LORDS,
  EXALTATION_SIGNS,
  DEBILITATION_SIGNS,
  OWN_SIGNS,
  MOOLTRIKONA,
  COMBUSTION_ORBS,
  NAKSHATRA_LORDS,
  NATURAL_FRIENDS,
  NATURAL_BENEFICS,
  NATURAL_MALEFICS,
  normalizeNakshatraId,
  type PlanetId,
  type DignityState,
} from './vocab.js';
import type {
  Fact,
  Edge,
  PeriodRow,
  TransitWindowRow,
  ChartWorkspaceInput,
  ChartFactSet,
} from './types.js';

function getDignity(planet: PlanetId, g: GrahaDetail): DignityState {
  if (EXALTATION_SIGNS[planet] === g.signIndex) return 'exalted';
  if (DEBILITATION_SIGNS[planet] === g.signIndex) return 'debilitated';
  const mool = MOOLTRIKONA[planet];
  if (mool && mool.signIndex === g.signIndex && g.degInSign >= mool.minDeg && g.degInSign < mool.maxDeg) {
    return 'mooltrikona';
  }
  if (OWN_SIGNS[planet].includes(g.signIndex)) return 'own';

  const signLord = SIGN_LORDS[g.signIndex]!;
  if (signLord === planet) return 'own';
  const rel = NATURAL_FRIENDS[planet];
  if (rel.friends.includes(signLord)) return 'friendly';
  if (rel.enemies.includes(signLord)) return 'enemy';
  return 'neutral';
}

function getFunctionalRole(planet: PlanetId, ownedHouses: number[]): 'benefic' | 'malefic' | 'neutral' {
  if (planet === 'rahu' || planet === 'ketu') return 'neutral';
  const hasTrikona = ownedHouses.some((h) => h === 1 || h === 5 || h === 9);
  const hasDusthana = ownedHouses.some((h) => h === 6 || h === 8 || h === 12);
  const hasMarakaOr3 = ownedHouses.some((h) => h === 3 || h === 11);
  if (hasTrikona && !hasDusthana) return 'benefic';
  if (hasDusthana && !hasTrikona) return 'malefic';
  if (hasMarakaOr3 && !hasTrikona) return 'malefic';
  return NATURAL_BENEFICS.includes(planet) ? 'benefic' : 'neutral';
}

function getAspectOffsets(planet: PlanetId, rahuKetuAspects: boolean): number[] {
  const offsets = [7];
  if (planet === 'mars') offsets.push(4, 8);
  else if (planet === 'jupiter') offsets.push(5, 9);
  else if (planet === 'saturn') offsets.push(3, 10);
  else if ((planet === 'rahu' || planet === 'ketu') && rahuKetuAspects) offsets.push(5, 9);
  return offsets;
}

/**
 * Emits all canonical Facts, Edges, Periods, and TransitWindows from Level 1 engine outputs.
 */
export function emitChartFacts(input: ChartWorkspaceInput): ChartFactSet {
  const { natal, shadbala, ashtakvarga, dashas, transits, avasthas, options } = input;
  const rahuKetuAspects = options?.rahuKetuAspects ?? true;
  const facts: Fact[] = [];
  const edges: Edge[] = [];
  const periods: PeriodRow[] = [];
  const transitWindows: TransitWindowRow[] = [];

  const lagnaSignIndex = natal.lagna?.signIndex ?? 0;
  const moonDetail = natal.grahas.moon;
  const moonSignIndex = moonDetail?.signIndex ?? 0;

  // Map houses 1..12 -> signIndex, lord, ownedHouses per planet
  const planetOwnedHouses: Record<PlanetId, number[]> = {
    sun: [], moon: [], mars: [], mercury: [], jupiter: [],
    venus: [], saturn: [], rahu: [], ketu: [],
  };

  // 1. House lordships (lord.house1 .. lord.house12)
  if (natal.lagna) {
    for (let h = 1; h <= 12; h++) {
      const signIndex = (lagnaSignIndex + h - 1) % 12;
      const signId = SIGN_IDS[signIndex]!;
      const lord = SIGN_LORDS[signIndex]!;
      planetOwnedHouses[lord].push(h);

      const lordDetail = natal.grahas[lord];
      const lordHouseLagna = lordDetail?.houses.houseFromLagna ?? 1;
      const lordHouseMoon = lordDetail?.houses.houseFromMoon ?? 1;

      const factId = `lord.house${h}`;
      facts.push({
        id: factId,
        type: 'lordship',
        subject: `house${h}`,
        args: {
          house: h,
          sign: signId,
          lord,
          placedHouseLagna: lordHouseLagna,
          placedHouseMoon: lordHouseMoon,
          placedSign: lordDetail ? SIGN_IDS[lordDetail.signIndex]! : signId,
        },
        value: lord,
        houseFrom: { lagna: h, moon: houseFromSign(signIndex, moonSignIndex) },
        sourceModule: 'emitters.lordships',
      });
      edges.push({ src: `placement.${lord}`, dst: `house${h}`, rel: 'lord_of' });
    }
  }

  // 2. Planet placements, dignities, nakshatras, combustion, retrograde, vargas, strengths
  const sunDetail = natal.grahas.sun;

  for (const planet of PLANET_IDS) {
    const g = natal.grahas[planet];
    if (!g) continue;

    const signId = SIGN_IDS[g.signIndex]!;
    const hLagna = g.houses.houseFromLagna;
    const hMoon = g.houses.houseFromMoon;
    const nakId = normalizeNakshatraId(g.nakshatra);
    const nakLord = NAKSHATRA_LORDS[g.nakshatraIndex] ?? 'ketu';
    const owned = planetOwnedHouses[planet];
    const natRole = NATURAL_BENEFICS.includes(planet) ? 'benefic' : NATURAL_MALEFICS.includes(planet) ? 'malefic' : 'neutral';
    const funcRole = getFunctionalRole(planet, owned);

    const placementId = `placement.${planet}`;
    facts.push({
      id: placementId,
      type: 'placement',
      subject: planet,
      args: {
        planet,
        sign: signId,
        signIndex: g.signIndex,
        degInSign: Number(g.degInSign.toFixed(2)),
        house: hLagna,
        houseFromMoon: hMoon,
        nakshatra: nakId,
        pada: g.pada,
        retrograde: g.retrograde,
        naturalRole: natRole,
        functionalRole: funcRole,
        ownedHouses: owned.join(','),
      },
      value: hLagna,
      houseFrom: { lagna: hLagna, moon: hMoon },
      sourceModule: 'natal.positions',
    });
    edges.push({ src: placementId, dst: `house${hLagna}`, rel: 'in_house' });

    // Dignity
    const dignity = getDignity(planet, g);
    facts.push({
      id: `dignity.${planet}`,
      type: 'dignity',
      subject: planet,
      args: { planet, sign: signId, state: dignity },
      value: dignity,
      houseFrom: { lagna: hLagna, moon: hMoon },
      sourceModule: 'emitters.dignity',
    });

    // Nakshatra
    facts.push({
      id: `nakshatra.${planet}`,
      type: 'nakshatra',
      subject: planet,
      args: { planet, nakshatra: nakId, pada: g.pada, lord: nakLord },
      value: nakId,
      houseFrom: { lagna: hLagna, moon: hMoon },
      sourceModule: 'natal.positions',
    });

    // Combustion (classical orbs)
    const combCfg = COMBUSTION_ORBS[planet];
    let isCombust = false;
    let sunDist = 180;
    if (combCfg && sunDetail && planet !== 'sun') {
      sunDist = Math.abs(angleDiff(g.lon, sunDetail.lon));
      const threshold = g.retrograde && combCfg.retrograde ? combCfg.retrograde : combCfg.direct;
      isCombust = sunDist <= threshold;
    }
    facts.push({
      id: `combust.${planet}`,
      type: 'dignity',
      subject: planet,
      args: { planet, orbFromSun: Number(sunDist.toFixed(2)) },
      value: isCombust,
      houseFrom: { lagna: hLagna, moon: hMoon },
      sourceModule: 'emitters.combustion',
    });

    // Varga D9 & D10 + Vargottama
    const d9SignIndex = calculateVargaSign(g.lon, 'D9');
    const d10SignIndex = calculateVargaSign(g.lon, 'D10');
    const isVargottama = d9SignIndex === g.signIndex;

    facts.push({
      id: `varga.d9.${planet}`,
      type: 'varga',
      subject: planet,
      args: { planet, varga: 'D9', sign: SIGN_IDS[d9SignIndex]!, vargottama: isVargottama },
      value: SIGN_IDS[d9SignIndex]!,
      houseFrom: { lagna: hLagna, moon: hMoon },
      sourceModule: 'vargas',
    });
    facts.push({
      id: `varga.d10.${planet}`,
      type: 'varga',
      subject: planet,
      args: { planet, varga: 'D10', sign: SIGN_IDS[d10SignIndex]! },
      value: SIGN_IDS[d10SignIndex]!,
      houseFrom: { lagna: hLagna, moon: hMoon },
      sourceModule: 'vargas',
    });

    // Shadbala
    const sb = shadbala?.planets[planet];
    if (sb) {
      facts.push({
        id: `strength.${planet}`,
        type: 'strength',
        subject: planet,
        args: {
          planet,
          ratio: Number(sb.strengthRatio.toFixed(2)),
          rupas: Number(sb.shadbalaInRupas.toFixed(2)),
          required: sb.minimumRequirement,
          rank: sb.rank,
        },
        value: Number(sb.strengthRatio.toFixed(2)),
        houseFrom: { lagna: hLagna, moon: hMoon },
        sourceModule: 'shadbala',
      });
    }

    // Avasthas
    const av = avasthas?.[planet];
    if (av) {
      facts.push({
        id: `avastha.${planet}`,
        type: 'avastha',
        subject: planet,
        args: {
          planet,
          baladi: av.baladi,
          jagratadi: av.jagrat,
          deeptadi: av.deeptadi,
        },
        value: av.baladi,
        houseFrom: { lagna: hLagna, moon: hMoon },
        sourceModule: 'natal.avasthas',
      });
    }
  }

  // 3. Conjunctions & Planetary War
  const sortedPlanets = [...PLANET_IDS].sort();
  for (let i = 0; i < sortedPlanets.length; i++) {
    for (let j = i + 1; j < sortedPlanets.length; j++) {
      const p1 = sortedPlanets[i]!;
      const p2 = sortedPlanets[j]!;
      const g1 = natal.grahas[p1];
      const g2 = natal.grahas[p2];
      if (!g1 || !g2) continue;

      if (g1.signIndex === g2.signIndex) {
        const orb = Number(Math.abs(angleDiff(g1.lon, g2.lon)).toFixed(2));
        const label = orb <= 3 ? 'tight' : orb <= 10 ? 'same_sign' : 'wide';
        const conjId = `conj.${p1}.${p2}`;
        facts.push({
          id: conjId,
          type: 'conjunction',
          subject: p1,
          args: {
            planet1: p1,
            planet2: p2,
            orb,
            label,
            sign: SIGN_IDS[g1.signIndex]!,
            house: g1.houses.houseFromLagna,
          },
          value: orb,
          houseFrom: { lagna: g1.houses.houseFromLagna, moon: g1.houses.houseFromMoon },
          sourceModule: 'emitters.conjunctions',
        });
        edges.push({ src: `placement.${p1}`, dst: `placement.${p2}`, rel: 'conjunct' });
        edges.push({ src: `placement.${p2}`, dst: `placement.${p1}`, rel: 'conjunct' });

        // Planetary war (Graha Yuddha): classical 5 tara-grahas within 1°
        const warCapable = ['mars', 'mercury', 'jupiter', 'venus', 'saturn'];
        if (warCapable.includes(p1) && warCapable.includes(p2) && orb <= 1.0) {
          facts.push({
            id: `war.${p1}.${p2}`,
            type: 'conjunction',
            subject: p1,
            args: { planet1: p1, planet2: p2, orb },
            value: true,
            houseFrom: { lagna: g1.houses.houseFromLagna, moon: g1.houses.houseFromMoon },
            sourceModule: 'emitters.planetary_war',
          });
        }
      }
    }
  }

  // 4. Parashari Graha Drishti (Aspects)
  for (const fromPlanet of PLANET_IDS) {
    const gFrom = natal.grahas[fromPlanet];
    if (!gFrom) continue;
    const offsets = getAspectOffsets(fromPlanet, rahuKetuAspects);
    for (const offset of offsets) {
      const targetSignIndex = (gFrom.signIndex + offset - 1) % 12;
      const targetHouse = natal.lagna
        ? houseFromSign(targetSignIndex, lagnaSignIndex)
        : houseFromSign(targetSignIndex, moonSignIndex);

      // Aspect onto house
      const hFactId = `aspect.${fromPlanet}.house${targetHouse}`;
      facts.push({
        id: hFactId,
        type: 'aspect',
        subject: `house${targetHouse}`,
        args: { from: fromPlanet, targetHouse, offset },
        value: offset,
        houseFrom: { lagna: targetHouse, moon: houseFromSign(targetSignIndex, moonSignIndex) },
        sourceModule: 'emitters.aspects',
      });
      edges.push({ src: `placement.${fromPlanet}`, dst: `house${targetHouse}`, rel: 'aspects' });

      // Aspect onto planets in target sign
      for (const toPlanet of PLANET_IDS) {
        if (toPlanet === fromPlanet) continue;
        const gTo = natal.grahas[toPlanet];
        if (gTo && gTo.signIndex === targetSignIndex) {
          facts.push({
            id: `aspect.${fromPlanet}.${toPlanet}`,
            type: 'aspect',
            subject: toPlanet,
            args: { from: fromPlanet, to: toPlanet, offset, targetHouse },
            value: offset,
            houseFrom: { lagna: gTo.houses.houseFromLagna, moon: gTo.houses.houseFromMoon },
            sourceModule: 'emitters.aspects',
          });
          edges.push({ src: `placement.${fromPlanet}`, dst: `placement.${toPlanet}`, rel: 'aspects' });
        }
      }
    }
  }

  // 5. House Strengths (Bhavabala + SAV Bindus)
  for (let h = 1; h <= 12; h++) {
    const signIndex = (lagnaSignIndex + h - 1) % 12;
    const savBindus = ashtakvarga?.sarva?.[signIndex] ?? null;
    const bhava = shadbala?.bhavas?.find((b) => b.house === h);
    if (savBindus !== null || bhava) {
      facts.push({
        id: `strength.house${h}`,
        type: 'strength',
        subject: `house${h}`,
        args: {
          house: h,
          sign: SIGN_IDS[signIndex]!,
          savBindus: savBindus ?? 28,
          bhavaRupas: bhava ? Number(bhava.bhavInRupas.toFixed(2)) : 0,
          bhavaRank: bhava?.rank ?? 6,
        },
        value: savBindus ?? (bhava ? Number(bhava.bhavInRupas.toFixed(2)) : 28),
        houseFrom: { lagna: h, moon: houseFromSign(signIndex, moonSignIndex) },
        sourceModule: 'ashtakvarga.shadbala',
      });
    }
  }

  // 6. Periods (Vimshottari Dashas) & current dasha facts
  if (dashas?.periods) {
    const refIso = options?.referenceDateIso ?? new Date().toISOString();
    const walkDashas = (nodes: DashaNode[], parentId: string | null) => {
      for (const node of nodes) {
        if (node.level > 3) continue;
        const pid = `vim.l${node.level}.${node.lord}.${node.startDateIso.slice(0, 10)}`;
        periods.push({
          id: pid,
          kind: 'vimshottari',
          level: node.level as 1 | 2 | 3,
          lord: node.lord,
          parentId,
          startUtc: node.startDateIso,
          endUtc: node.endDateIso,
        });

        if (refIso >= node.startDateIso && refIso <= node.endDateIso) {
          const levelName = node.level === 1 ? 'maha' : node.level === 2 ? 'antar' : 'pratyantar';
          const lordDetail = natal.grahas[node.lord];
          facts.push({
            id: `dasha.current.${levelName}`,
            type: 'dasha',
            subject: node.lord,
            args: {
              level: levelName,
              lord: node.lord,
              startUtc: node.startDateIso,
              endUtc: node.endDateIso,
              ownedHouses: planetOwnedHouses[node.lord].join(','),
              placedHouse: lordDetail?.houses.houseFromLagna ?? 1,
            },
            value: node.lord,
            houseFrom: {
              lagna: lordDetail?.houses.houseFromLagna ?? 1,
              moon: lordDetail?.houses.houseFromMoon ?? 1,
            },
            sourceModule: 'dasha.vimshottari',
          });
        }

        if (node.subPeriods && node.subPeriods.length > 0 && node.level < 3) {
          walkDashas(node.subPeriods, pid);
        }
      }
    };
    walkDashas(dashas.periods, null);
  }

  // 7. Transits (current slow planets)
  if (transits?.transits) {
    const refIso = options?.referenceDateIso ?? new Date().toISOString();
    for (const planet of PLANET_IDS) {
      const tr = transits.transits[planet];
      if (!tr) continue;
      const signId = SIGN_IDS[tr.signIndex]!;
      facts.push({
        id: `transit.${planet}`,
        type: 'transit',
        subject: planet,
        args: {
          planet,
          sign: signId,
          houseFromLagna: tr.houseFromLagna,
          houseFromMoon: tr.houseFromMoon,
          retrograde: tr.retrograde,
          bindus: tr.ashtakvargaBindus,
        },
        value: tr.houseFromLagna,
        houseFrom: { lagna: tr.houseFromLagna, moon: tr.houseFromMoon },
        sourceModule: 'transits',
      });
      transitWindows.push({
        id: `tw.${planet}.${signId}`,
        planet,
        sign: signId,
        hLagna: tr.houseFromLagna,
        hMoon: tr.houseFromMoon,
        bindus: tr.ashtakvargaBindus,
        startUtc: refIso,
        endUtc: refIso,
      });
    }
  }

  return { facts, edges, periods, transitWindows };
}
