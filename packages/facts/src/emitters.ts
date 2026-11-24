import {
  angleDiff,
  calculateVargaSign,
  houseFromSign,
  computeArudhaPadas,
  computeCharaKarakas,
  computeSpecialLagnas,
  computeUpagrahas,
  computeChartVaisheshikamsa,
  computeSpecialNakshatras,
  evaluateNavatara,
  evaluateTransitNavatara,
  evaluateKakshyaTransits,
  checkTransitVedha,
  computeAnnualSahams,
  type GrahaDetail,
  type DashaNode,
  type VedicGraha,
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
  let charaKarakas: Record<string, string> = {};
  if (natal.grahas) {
    try {
      charaKarakas = computeCharaKarakas(natal);
    } catch {
      // gracefully skip if partial mock
    }
  }

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
    const charaRole = charaKarakas[planet] ?? '';

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
        charaKaraka: charaRole,
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
            args: { from: fromPlanet, to: toPlanet, planet1: fromPlanet, planet2: toPlanet, offset, targetHouse },
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

  // 7. Transits (current Gochar planets)
  if (transits?.transits) {
    const refIso = options?.referenceDateIso ?? new Date().toISOString();
    const allTransitHouses = {} as Record<VedicGraha, number>;
    for (const [p, tr] of Object.entries(transits.transits) as [VedicGraha, any][]) {
      if (tr?.houseFromMoon !== undefined) {
        allTransitHouses[p] = tr.houseFromMoon;
      }
    }

    for (const planet of PLANET_IDS) {
      const tr = transits.transits[planet];
      if (!tr) continue;
      const signId = SIGN_IDS[tr.signIndex]!;

      const vedha = tr.vedha ?? checkTransitVedha(planet, tr.houseFromMoon, allTransitHouses);

      let kakshya = tr.kakshya;
      if (!kakshya && ashtakvarga?.prastara) {
        const pLon = tr.lon ?? (tr.signIndex * 30 + (tr.degInSign ?? 0));
        const kRes = evaluateKakshyaTransits({ [planet]: pLon }, ashtakvarga.prastara);
        kakshya = kRes.evaluations[0];
      }

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
          ...(vedha ? { vedhaStatus: vedha.netStatus, isObstructed: vedha.isObstructed } : {}),
          ...(kakshya ? { kakshyaLord: kakshya.kakshyaLord, kakshyaBenefic: kakshya.isBenefic } : {}),
        },
        value: tr.houseFromLagna,
        houseFrom: { lagna: tr.houseFromLagna, moon: tr.houseFromMoon },
        sourceModule: 'transits',
      });

      if (vedha) {
        facts.push({
          id: `vedha.${planet}`,
          type: 'vedha',
          subject: planet,
          args: {
            planet,
            transitHouseFromMoon: vedha.transitHouseFromMoon,
            isFavourableHouse: vedha.isFavourableHouse,
            obstructingHouse: vedha.obstructingHouse ?? 0,
            obstructingPlanets: vedha.obstructingPlanets.join(','),
            isObstructed: vedha.isObstructed,
            netStatus: vedha.netStatus,
            explanation: vedha.explanation,
          },
          value: vedha.isObstructed ? 0 : 1,
          houseFrom: { lagna: tr.houseFromLagna, moon: tr.houseFromMoon },
          sourceModule: 'transits.vedha',
        });
        edges.push({ src: `vedha.${planet}`, dst: `transit.${planet}`, rel: 'evidence_of' });
      }

      if (kakshya) {
        facts.push({
          id: `kakshya.${planet}`,
          type: 'kakshya',
          subject: planet,
          args: {
            planet,
            kakshyaIndex: kakshya.kakshyaIndex,
            kakshyaLord: kakshya.kakshyaLord,
            isBenefic: kakshya.isBenefic,
            bindu: kakshya.bindu,
            signIndex: kakshya.signIndex,
            degInSign: kakshya.degInSign,
            arcStartDeg: kakshya.arcStartDeg,
            arcEndDeg: kakshya.arcEndDeg,
            explanation: kakshya.explanation,
          },
          value: kakshya.isBenefic ? 1 : 0,
          houseFrom: { lagna: tr.houseFromLagna, moon: tr.houseFromMoon },
          sourceModule: 'transits.kakshya',
        });
        edges.push({ src: `kakshya.${planet}`, dst: `transit.${planet}`, rel: 'evidence_of' });
      }

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

  // 8. Chara Karakas (AK, AmK, BK, MK, PK, GK, DK)
  if (natal.grahas) {
    try {
      for (const [planet, role] of Object.entries(charaKarakas)) {
        const g = natal.grahas[planet as PlanetId];
        const hLagna = g?.houses.houseFromLagna ?? 1;
        const hMoon = g?.houses.houseFromMoon ?? 1;
        const signId = g ? SIGN_IDS[g.signIndex]! : 'aries';
        const roleLower = role.toLowerCase();
        facts.push({
          id: `karaka.${roleLower}`,
          type: 'karaka',
          subject: planet,
          args: { karaka: role, planet, house: hLagna, sign: signId },
          value: planet,
          houseFrom: { lagna: hLagna, moon: hMoon },
          sourceModule: 'natal.karakas',
        });
        edges.push({ src: `placement.${planet}`, dst: `karaka.${roleLower}`, rel: 'karaka_of' });
      }
    } catch {
      // gracefully skip if partial mock
    }
  }

  // 9. Arudha Padas (AL, A2..A11, UL)
  if (natal.lagna && natal.grahas) {
    try {
      const arudhas = computeArudhaPadas(natal);
      for (const ar of arudhas) {
        const codeLower = ar.code.toLowerCase();
        facts.push({
          id: `arudha.${codeLower}`,
          type: 'arudha',
          subject: ar.code,
          args: {
            code: ar.code,
            house: ar.house,
            name: ar.name,
            sign: ar.sign,
            signIndex: ar.signIndex,
            houseFromLagna: ar.houseFromLagna,
            lord: ar.lord,
            exceptionApplied: ar.exceptionApplied,
          },
          value: ar.houseFromLagna,
          houseFrom: { lagna: ar.houseFromLagna, moon: houseFromSign(ar.signIndex, moonSignIndex) },
          sourceModule: 'natal.arudha',
        });
        edges.push({ src: `house${ar.house}`, dst: `arudha.${codeLower}`, rel: 'arudha_of' });
      }
    } catch {
      // gracefully skip if partial mock
    }
  }

  // 10. Special Lagnas (BL, HL, GL, SL, Indu, Pranapada)
  if (natal.lagna && natal.grahas && natal.time && natal.place) {
    try {
      const specialLagnas = computeSpecialLagnas(natal);
      for (const sl of specialLagnas) {
        facts.push({
          id: `special_lagna.${sl.id}`,
          type: 'special_lagna',
          subject: sl.id,
          args: {
            id: sl.id,
            code: sl.code,
            name: sl.name,
            sign: sl.sign,
            signIndex: sl.signIndex,
            degInSign: sl.degInSign,
            houseFromLagna: sl.houseFromLagna,
            houseFromMoon: sl.houseFromMoon,
            nakshatra: sl.nakshatra,
            signification: sl.signification,
          },
          value: sl.houseFromLagna,
          houseFrom: { lagna: sl.houseFromLagna, moon: sl.houseFromMoon },
          sourceModule: 'natal.special_lagnas',
        });
        edges.push({ src: `special_lagna.${sl.id}`, dst: `house${sl.houseFromLagna}`, rel: 'in_house' });
      }
    } catch {
      // gracefully skip if partial mock
    }
  }

  // 11. Upagrahas (Dhuma, Vyatipata, Parivesha, Indrachapa, Upaketu, Gulika, Mandi)
  if (natal.grahas && natal.time && natal.place) {
    try {
      const upagrahas = computeUpagrahas(natal);
      for (const u of upagrahas) {
        facts.push({
          id: `upagraha.${u.id}`,
          type: 'upagraha',
          subject: u.id,
          args: {
            id: u.id,
            name: u.name,
            sign: u.sign,
            signIndex: u.signIndex,
            degInSign: u.degInSign,
            houseFromLagna: u.houseFromLagna,
            nakshatra: u.nakshatra,
            formula: u.formula,
          },
          value: u.houseFromLagna,
          houseFrom: { lagna: u.houseFromLagna, moon: houseFromSign(u.signIndex, moonSignIndex) },
          sourceModule: 'natal.upagrahas',
        });
        edges.push({ src: `upagraha.${u.id}`, dst: `house${u.houseFromLagna}`, rel: 'in_house' });
      }
    } catch {
      // gracefully skip if partial mock
    }
  }

  // 12. Vaisheshikamsa (Dasavarga Amsabala) & Pushkara Navamsha
  if (natal.grahas) {
    try {
      const amsabala = computeChartVaisheshikamsa(natal);
      for (const [graha, res] of Object.entries(amsabala)) {
        const isLagna = graha === 'lagna';
        const hLagna = isLagna ? 1 : natal.grahas[graha as PlanetId]?.houses.houseFromLagna ?? 1;
        const sIndex = isLagna ? natal.lagna?.signIndex ?? 0 : natal.grahas[graha as PlanetId]?.signIndex ?? 0;
        const hMoon = houseFromSign(sIndex, moonSignIndex);

        if (res.tier) {
          facts.push({
            id: `vaisheshikamsa.${graha}`,
            type: 'vaisheshikamsa',
            subject: graha,
            args: {
              graha,
              tier: res.tier,
              tierName: res.tierName,
              vargaCount: res.vargaCount,
              vargottama: res.vargottama,
              dignifiedVargas: res.dignifiedVargas.join(','),
            },
            value: res.vargaCount,
            houseFrom: { lagna: hLagna, moon: hMoon },
            sourceModule: 'vargas.amsabala',
          });
          edges.push({ src: `vaisheshikamsa.${graha}`, dst: isLagna ? 'house1' : `placement.${graha}`, rel: 'evidence_of' });
        }

        if (res.pushkara.isPushkaraNavamsha || res.pushkara.isPushkaraBhaga) {
          facts.push({
            id: `pushkara.${graha}`,
            type: 'pushkara',
            subject: graha,
            args: {
              graha,
              isPushkaraNavamsha: res.pushkara.isPushkaraNavamsha,
              isPushkaraBhaga: res.pushkara.isPushkaraBhaga,
              navamshaSign: res.pushkara.navamshaSign,
              navamshaLord: res.pushkara.navamshaLord,
              pushkaraBhagaDeg: res.pushkara.pushkaraBhagaDeg,
              description: res.pushkara.description,
            },
            value: res.pushkara.isPushkaraBhaga ? 2 : 1,
            houseFrom: { lagna: hLagna, moon: hMoon },
            sourceModule: 'vargas.amsabala',
          });
          edges.push({ src: `pushkara.${graha}`, dst: isLagna ? 'house1' : `placement.${graha}`, rel: 'evidence_of' });
        }
      }
    } catch {
      // gracefully skip if partial mock
    }
  }

  // 13. Navatara (9 Taras) & 11 Special Life-Department Nakshatras
  if (natal.grahas?.moon) {
    try {
      const moonNakIndex = natal.grahas.moon.nakshatraIndex;
      const occupants: Array<{ graha: string; nakshatraIndex: number }> = [];

      for (const [gid, g] of Object.entries(natal.grahas)) {
        if (g && typeof g.nakshatraIndex === 'number') {
          occupants.push({ graha: gid, nakshatraIndex: g.nakshatraIndex });

          const nav = evaluateNavatara(moonNakIndex, g.nakshatraIndex);
          facts.push({
            id: `navatara.${gid}`,
            type: 'navatara',
            subject: gid,
            args: {
              graha: gid,
              tara: nav.tara,
              taraLabel: nav.taraLabel,
              englishLabel: nav.englishLabel,
              category: nav.category,
              paryaya: nav.paryaya,
              offset: nav.offset,
              isFavorable: nav.isFavorable,
            },
            value: nav.taraNumber,
            houseFrom: { lagna: g.houses.houseFromLagna, moon: g.houses.houseFromMoon },
            sourceModule: 'natal.navatara',
          });
          edges.push({ src: `navatara.${gid}`, dst: `placement.${gid}`, rel: 'evidence_of' });
        }
      }

      const specialNakshatras = computeSpecialNakshatras(moonNakIndex, occupants);
      for (const spec of specialNakshatras) {
        facts.push({
          id: `special_nakshatra.${spec.def.key}`,
          type: 'special_nakshatra',
          subject: spec.def.key,
          args: {
            key: spec.def.key,
            name: spec.def.name,
            sanskritName: spec.def.sanskritName,
            domain: spec.def.domain,
            nakshatra: spec.nakshatra,
            nakshatraIndex: spec.nakshatraIndex,
            tara: spec.navatara.tara,
            significance: spec.def.significance,
            occupants: spec.occupyingGrahas.join(','),
          },
          value: spec.def.offset,
          houseFrom: { lagna: 1, moon: 1 },
          sourceModule: 'natal.navatara',
        });

        for (const occ of spec.occupyingGrahas) {
          edges.push({
            src: `special_nakshatra.${spec.def.key}`,
            dst: `placement.${occ}`,
            rel: 'evidence_of',
          });
        }
      }
    } catch {
      // gracefully skip if partial mock
    }
  }

  // 14. Tajika Sahams (36 Sensitive Life Points)
  if (natal.lagna && natal.grahas?.sun && natal.grahas?.moon) {
    try {
      const sunH = houseFromSign(natal.grahas.sun.signIndex, lagnaSignIndex);
      const isDayNatal = sunH >= 7 && sunH <= 12;
      const { sahamsList } = computeAnnualSahams(natal, isDayNatal);

      for (const saham of sahamsList) {
        facts.push({
          id: `saham.${saham.id}`,
          type: 'saham',
          subject: saham.id,
          args: {
            id: saham.id,
            name: saham.name,
            sanskritName: saham.sanskritName,
            meaning: saham.meaning,
            category: saham.category,
            sign: saham.sign,
            signIndex: saham.signIndex,
            degreeInSign: saham.degreeInSign,
            formatted: saham.formatted,
            house: saham.houseFromLagna,
            lord: saham.lord,
            arcRuleApplied: saham.arcRuleApplied,
            isKendraOrTrikona: saham.isKendraOrTrikona,
            fructification: saham.fructification,
            assessment: saham.assessment,
          },
          value: saham.lon,
          houseFrom: { lagna: saham.houseFromLagna, moon: houseFromSign(saham.signIndex, moonSignIndex) },
          sourceModule: 'natal.sahams',
        });

        edges.push({
          src: `saham.${saham.id}`,
          dst: `placement.${saham.lord}`,
          rel: 'lord_of',
        });
        edges.push({
          src: `saham.${saham.id}`,
          dst: `house.${saham.houseFromLagna}`,
          rel: 'in_house',
        });
      }

      // If annual varshaphal is provided, also emit varsha sahams
      if (input.varshaphal?.sahamsList) {
        for (const vs of input.varshaphal.sahamsList) {
          facts.push({
            id: `saham.varsha.${vs.id}`,
            type: 'saham',
            subject: `varsha.${vs.id}`,
            args: {
              id: vs.id,
              name: vs.name,
              sanskritName: vs.sanskritName,
              meaning: vs.meaning,
              category: vs.category,
              sign: vs.sign,
              signIndex: vs.signIndex,
              degreeInSign: vs.degreeInSign,
              formatted: vs.formatted,
              house: vs.houseFromLagna,
              lord: vs.lord,
              lordHarshaBala: vs.lordHarshaBala ?? 0,
              arcRuleApplied: vs.arcRuleApplied,
              isKendraOrTrikona: vs.isKendraOrTrikona,
              fructification: vs.fructification,
              assessment: vs.assessment,
            },
            value: vs.lon,
            houseFrom: {
              lagna: vs.houseFromLagna,
              moon: houseFromSign(vs.signIndex, input.varshaphal.annualChart.grahas.moon?.signIndex ?? 0),
            },
            sourceModule: 'varshaphal.sahams',
          });
        }
      }
    } catch {
      // gracefully skip if partial mock
    }
  }

  return { facts, edges, periods, transitWindows };
}
