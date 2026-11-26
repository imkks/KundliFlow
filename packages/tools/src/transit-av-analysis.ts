import {
  computeAshtakvarga,
  computeShodhyaPinda,
  performEkadhipatyaShodhana,
  performTrikonaShodhana,
  NAKSHATRAS,
  type AshtakvargaResult,
  type NatalChart,
  type TransitOverview,
} from '@astro/engine';
import { SIGN_IDS, type PlanetId } from '@astro/facts';

export interface DivisionalAshtakvargaSummary {
  varga: string;
  lagnaSign: string;
  lagnaSignIndex: number;
  houseSav: Array<{ house: number; sign: string; bindus: number; rating: 'strong' | 'average' | 'weak' }>;
  strongHouses: number[];
  weakHouses: number[];
  raw: AshtakvargaResult;
}

export interface ShodhyaPindaTrigger {
  id: string;
  planet: PlanetId;
  domain: string;
  houseFromPlanet: number;
  bavBindus: number;
  shodhyaPinda: number;
  triggerNakshatraIndex: number; // 0..26
  triggerNakshatra: string;
  trineNakshatras: string[];
  triggerSignIndex: number; // 0..11
  triggerSign: string;
  activeTransitHits: string[];
}

export interface DivisionalTransitHit {
  planet: PlanetId;
  transitSign: string;
  houseInVarga: number;
  retrograde: boolean;
  signThirdPhase: string;
}

export interface LattaKickHit {
  id: string;
  planet: PlanetId;
  direction: 'forward' | 'backward';
  offset: number;
  transitNakshatra: string;
  kickedNakshatra: string;
  hitsJanmaStar: boolean;
  hitsLagnaStar: boolean;
  summary: string;
}

/**
 * Computes Ashtakavarga (BAV & SAV) inside any Divisional Chart (PVR Ch. 12.5 / R-10).
 */
export function computeDivisionalAshtakvarga(vargaChart: {
  varga: string;
  lagnaSign: string;
  lagnaSignIndex: number;
  placements: Array<{ planet: PlanetId; signIndex: number }>;
}): DivisionalAshtakvargaSummary {
  const getIdx = (p: PlanetId) => vargaChart.placements.find((x) => x.planet === p)?.signIndex ?? 0;
  const av = computeAshtakvarga({
    sun: getIdx('sun'),
    moon: getIdx('moon'),
    mars: getIdx('mars'),
    mercury: getIdx('mercury'),
    jupiter: getIdx('jupiter'),
    venus: getIdx('venus'),
    saturn: getIdx('saturn'),
    lagna: vargaChart.lagnaSignIndex,
  });

  const houseSav: DivisionalAshtakvargaSummary['houseSav'] = [];
  const strongHouses: number[] = [];
  const weakHouses: number[] = [];

  for (let h = 1; h <= 12; h++) {
    const sIdx = (vargaChart.lagnaSignIndex + h - 1) % 12;
    const bindus = av.sarva[sIdx] ?? 28;
    const rating: 'strong' | 'average' | 'weak' = bindus >= 30 ? 'strong' : bindus < 25 ? 'weak' : 'average';
    if (rating === 'strong') strongHouses.push(h);
    if (rating === 'weak') weakHouses.push(h);
    houseSav.push({ house: h, sign: SIGN_IDS[sIdx]!, bindus, rating });
  }

  return {
    varga: vargaChart.varga,
    lagnaSign: vargaChart.lagnaSign,
    lagnaSignIndex: vargaChart.lagnaSignIndex,
    houseSav,
    strongHouses,
    weakHouses,
    raw: av,
  };
}

// PVR Table 61: Shodhya Pinda Primary Timing Domains
const SHODHYA_DOMAINS: Array<{ key: string; planet: PlanetId; houseFromPlanet: number; domain: string }> = [
  { key: 'father', planet: 'sun', houseFromPlanet: 9, domain: 'Father & authority' },
  { key: 'mother', planet: 'moon', houseFromPlanet: 4, domain: 'Mother & emotional base' },
  { key: 'siblings', planet: 'mars', houseFromPlanet: 3, domain: 'Siblings & initiative' },
  { key: 'profession', planet: 'mercury', houseFromPlanet: 10, domain: 'Profession & career' },
  { key: 'children', planet: 'jupiter', houseFromPlanet: 5, domain: 'Children & creativity' },
  { key: 'marriage', planet: 'venus', houseFromPlanet: 7, domain: 'Marriage & partnerships' },
  { key: 'longevity', planet: 'saturn', houseFromPlanet: 8, domain: 'Vitality & longevity' },
  { key: 'litigation', planet: 'saturn', houseFromPlanet: 6, domain: 'Litigation & disputes' },
];

/**
 * Computes Shodhya Pinda transit trigger Nakshatras & Rasis (PVR Ch. 25.6 / R-14).
 */
export function computeShodhyaPindaTriggers(
  natal: NatalChart,
  av: AshtakvargaResult,
  transits?: TransitOverview | null,
): ShodhyaPindaTrigger[] {
  const planetSigns: Record<string, number> = {
    sun: natal.grahas.sun.signIndex,
    moon: natal.grahas.moon.signIndex,
    mars: natal.grahas.mars.signIndex,
    mercury: natal.grahas.mercury.signIndex,
    jupiter: natal.grahas.jupiter.signIndex,
    venus: natal.grahas.venus.signIndex,
    saturn: natal.grahas.saturn.signIndex,
  };

  const occupiedSigns = Array.from(new Set<number>(Object.values(planetSigns)));
  const pindaCache = new Map<PlanetId, number>();

  const getPinda = (p: PlanetId): number => {
    const cached = pindaCache.get(p);
    if (cached !== undefined) return cached;
    const bav = av.bhinna[p as keyof typeof av.bhinna];
    if (!bav) return 0;
    const tri = performTrikonaShodhana(bav);
    const eka = performEkadhipatyaShodhana(tri, occupiedSigns);
    const res = computeShodhyaPinda(eka, planetSigns);
    pindaCache.set(p, res.shodhyaPinda);
    return res.shodhyaPinda;
  };

  const jupTr = transits?.transits.jupiter;
  const satTr = transits?.transits.saturn;
  const jupLon = jupTr ? (jupTr.lon ?? jupTr.signIndex * 30 + 15) : -1;
  const satLon = satTr ? (satTr.lon ?? satTr.signIndex * 30 + 15) : -1;
  const jupNakIdx = jupTr ? Math.floor((((jupLon % 360) + 360) % 360) / (360 / 27)) : -1;
  const satNakIdx = satTr ? Math.floor((((satLon % 360) + 360) % 360) / (360 / 27)) : -1;

  return SHODHYA_DOMAINS.map((d) => {
    const pSign = natal.grahas[d.planet].signIndex;
    const targetHouseSign = (pSign + d.houseFromPlanet - 1) % 12;
    const bav = av.bhinna[d.planet as keyof typeof av.bhinna];
    const bavBindus = bav ? (bav[targetHouseSign] ?? 0) : 0;
    const shodhyaPinda = getPinda(d.planet);
    const product = bavBindus * shodhyaPinda;

    // 1-indexed mod 27 (0 -> 27 Revati) and mod 12 (0 -> 12 Pisces)
    const nak1 = product % 27 === 0 ? 27 : product % 27;
    const sign1 = product % 12 === 0 ? 12 : product % 12;
    const nakIdx = nak1 - 1;
    const signIdx = sign1 - 1;
    const trineIdxs = [nakIdx, (nakIdx + 9) % 27, (nakIdx + 18) % 27];

    const activeTransitHits: string[] = [];
    if (jupTr && (trineIdxs.includes(jupNakIdx) || jupTr.signIndex === signIdx)) {
      activeTransitHits.push(`Jupiter transit activates ${d.domain} trigger (favorable delivery)`);
    }
    if (satTr && (trineIdxs.includes(satNakIdx) || satTr.signIndex === signIdx)) {
      activeTransitHits.push(`Saturn transit activates ${d.domain} trigger (test/pressure)`);
    }

    return {
      id: `shodhya.${d.key}`,
      planet: d.planet,
      domain: d.domain,
      houseFromPlanet: d.houseFromPlanet,
      bavBindus,
      shodhyaPinda,
      triggerNakshatraIndex: nakIdx,
      triggerNakshatra: NAKSHATRAS[nakIdx] ?? `Nakshatra ${nak1}`,
      trineNakshatras: trineIdxs.map((i) => NAKSHATRAS[i] ?? `N${i + 1}`),
      triggerSignIndex: signIdx,
      triggerSign: SIGN_IDS[signIdx]!,
      activeTransitHits,
    };
  });
}

/**
 * Charak Ch. XXIX Sign-Third Transit Timing:
 * Sun/Mars peak in 0-10°, Jupiter/Venus in 10-20°, Moon/Saturn in 20-30°, Mercury throughout.
 */
export function evaluateSignThirdTiming(planet: PlanetId, degInSign: number): string {
  const third = degInSign < 10 ? 1 : degInSign < 20 ? 2 : 3;
  if (planet === 'sun' || planet === 'mars') {
    return third === 1 ? 'Peak delivery (1st third 0-10°)' : `Tapering (third ${third}/3)`;
  }
  if (planet === 'jupiter' || planet === 'venus') {
    return third === 2 ? 'Peak delivery (middle third 10-20°)' : third === 1 ? 'Building (1st third)' : 'Waning (3rd third)';
  }
  if (planet === 'moon' || planet === 'saturn') {
    return third === 3 ? 'Peak delivery (final third 20-30°)' : `Building (third ${third}/3)`;
  }
  return 'Active throughout sign';
}

/**
 * Divisional Transits: Natal Varga x Transit D1 (PVR Ch. 25.4).
 */
export function computeDivisionalTransits(
  vargaChart: { lagnaSignIndex: number },
  transits: TransitOverview,
): DivisionalTransitHit[] {
  const focusPlanets: PlanetId[] = ['jupiter', 'saturn', 'rahu', 'ketu', 'mars', 'sun'];
  const hits: DivisionalTransitHit[] = [];
  for (const p of focusPlanets) {
    const t = transits.transits[p];
    if (!t) continue;
    const lon = t.lon ?? t.signIndex * 30 + 15;
    const degInSign = ((lon % 30) + 30) % 30;
    const houseInVarga = ((t.signIndex - vargaChart.lagnaSignIndex + 12) % 12) + 1;
    hits.push({
      planet: p,
      transitSign: t.sign,
      houseInVarga,
      retrograde: t.retrograde,
      signThirdPhase: evaluateSignThirdTiming(p, degInSign),
    });
  }
  return hits;
}

// PVR Ch. 26.7 Latta rules
const LATTA_RULES: Array<{ planet: PlanetId; direction: 'forward' | 'backward'; offset: number }> = [
  { planet: 'sun', direction: 'forward', offset: 12 },
  { planet: 'mars', direction: 'forward', offset: 3 },
  { planet: 'jupiter', direction: 'forward', offset: 6 },
  { planet: 'saturn', direction: 'forward', offset: 8 },
  { planet: 'moon', direction: 'backward', offset: 22 },
  { planet: 'mercury', direction: 'backward', offset: 7 },
  { planet: 'venus', direction: 'backward', offset: 5 },
  { planet: 'rahu', direction: 'backward', offset: 9 },
];

/**
 * Computes Latta ("Planetary Kick") onto Natal Janma Nakshatra (Moon) & Lagna Nakshatra (PVR Ch. 26.7).
 */
export function computeLattaKicks(natal: NatalChart, transits: TransitOverview): LattaKickHit[] {
  const janmaNak = natal.grahas.moon.nakshatraIndex;
  const lagnaNak = natal.lagna ? Math.floor((((natal.lagna.lon % 360) + 360) % 360) / (360 / 27)) : -1;
  const hits: LattaKickHit[] = [];

  for (const r of LATTA_RULES) {
    const t = transits.transits[r.planet];
    if (!t) continue;
    const lon = t.lon ?? t.signIndex * 30 + 15;
    const tNak = Math.floor((((lon % 360) + 360) % 360) / (360 / 27));
    const kickedIdx =
      r.direction === 'forward'
        ? (tNak + r.offset - 1) % 27
        : (((tNak - (r.offset - 1)) % 27) + 27) % 27;

    const hitsJanmaStar = kickedIdx === janmaNak;
    const hitsLagnaStar = lagnaNak >= 0 && kickedIdx === lagnaNak;
    if (!hitsJanmaStar && !hitsLagnaStar) continue;

    const targetDesc = [hitsJanmaStar ? 'Janma (Moon) star' : null, hitsLagnaStar ? 'Lagna star' : null]
      .filter(Boolean)
      .join(' & ');
    hits.push({
      id: `latta.${r.planet}`,
      planet: r.planet,
      direction: r.direction,
      offset: r.offset,
      transitNakshatra: NAKSHATRAS[tNak] ?? `N${tNak + 1}`,
      kickedNakshatra: NAKSHATRAS[kickedIdx] ?? `N${kickedIdx + 1}`,
      hitsJanmaStar,
      hitsLagnaStar,
      summary: `Latta Kick: Transit ${r.planet} in ${NAKSHATRAS[tNak]} casts ${r.offset}th ${r.direction} Latta onto natal ${targetDesc} (${NAKSHATRAS[kickedIdx]}) — friction/obstruction in ${r.planet}'s house themes.`,
    });
  }

  return hits;
}
