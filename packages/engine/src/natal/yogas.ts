import { SIGN_LORDS, type NatalChart, type VedicGraha } from './types.js';

export interface YogaDetection {
  id: string;
  name: string;
  category: 'raja' | 'dhana' | 'mahapurusha' | 'auspicious' | 'dosha';
  presence: boolean;
  strength: 'strong' | 'moderate' | 'mild' | 'cancelled' | 'absent';
  planets: string[];
  planetsInvolved?: string[];
  type?: string;
  description: string;
  effect: string;
  cancellationNote?: string;
}

export type DetectedYoga = YogaDetection;

const KENDRAS = [1, 4, 7, 10];
const TRIKONAS = [1, 5, 9];
const DUSTHANAS = [6, 8, 12];
const KUJA_HOUSES = [1, 2, 4, 7, 8, 12];

function houseFrom(targetSign: number, baseSign: number): number {
  return ((targetSign - baseSign + 12) % 12) + 1;
}

function angularSep(lon1: number, lon2: number): number {
  const diff = Math.abs(((lon1 - lon2 + 360) % 360));
  return Math.min(diff, 360 - diff);
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Detects classical Parashara Yogas and Doshas from a natal chart using real
 * house-from-Lagna, house-from-Moon, sign lordships, and classical cancellations.
 */
export const detectYogasAndDoshas = (chart: NatalChart): YogaDetection[] => {
  const yogas: YogaDetection[] = [];

  const sun = chart.grahas.sun;
  const moon = chart.grahas.moon;
  const mars = chart.grahas.mars;
  const mercury = chart.grahas.mercury;
  const jupiter = chart.grahas.jupiter;
  const venus = chart.grahas.venus;
  const saturn = chart.grahas.saturn;
  const rahu = chart.grahas.rahu;
  const ketu = chart.grahas.ketu;

  const hasLagna = chart.lagna !== null && chart.lagna !== undefined;
  const lagnaSign = chart.lagna?.signIndex ?? moon.signIndex;

  const houseOf = (g: { signIndex: number; houseFromLagna?: number }) =>
    g.houseFromLagna ?? houseFrom(g.signIndex, lagnaSign);

  const lordOfHouse = (h: number): VedicGraha => SIGN_LORDS[(lagnaSign + h - 1) % 12]!;

  // 1. Budha-Aditya Yoga (Sun + Mercury in same sign)
  const isBudhaditya = sun.signIndex === mercury.signIndex;
  const sunMercSep = angularSep(sun.lon, mercury.lon);
  const mercCombust = isBudhaditya && sunMercSep < 3; // Deep combustion weakens Budha-Aditya
  const sunHouse = houseOf(sun);
  yogas.push({
    id: 'budhaditya',
    name: 'Budha-Aditya Yoga',
    category: 'auspicious',
    presence: isBudhaditya,
    strength: !isBudhaditya ? 'absent' : mercCombust ? 'mild' : KENDRAS.includes(sunHouse) || TRIKONAS.includes(sunHouse) ? 'strong' : 'moderate',
    planets: ['sun', 'mercury'],
    description: isBudhaditya
      ? `Sun and Mercury conjunct in ${cap(sun.sign)} (House ${sunHouse}, separation ${sunMercSep.toFixed(1)}°)${mercCombust ? ' — tight combustion softens expression.' : '.'}`
      : `Sun (${cap(sun.sign)}) and Mercury (${cap(mercury.sign)}) occupy different signs.`,
    effect: isBudhaditya
      ? 'Confers sharp analytical intellect, articulate communication, administrative skill, and recognition through knowledge.'
      : 'Sun and Mercury operate independently across separate life areas.',
  });

  // 2. Gaja-Kesari Yoga (Jupiter in Kendra 1, 4, 7, 10 from Moon)
  const jupFromMoon = houseFrom(jupiter.signIndex, moon.signIndex);
  const isGajakesari = KENDRAS.includes(jupFromMoon);
  const jupStrong = jupiter.dignity === 'exalted' || jupiter.dignity === 'own' || jupiter.dignity === 'moolatrikona';
  const jupDebil = jupiter.dignity === 'debilitated';
  yogas.push({
    id: 'gajakesari',
    name: 'Gaja-Kesari Yoga',
    category: 'raja',
    presence: isGajakesari,
    strength: !isGajakesari ? 'absent' : jupStrong ? 'strong' : jupDebil ? 'mild' : 'moderate',
    planets: ['jupiter', 'moon'],
    description: isGajakesari
      ? `Jupiter (${cap(jupiter.sign)}, House ${houseOf(jupiter)}) sits in House ${jupFromMoon} (Kendra) from Natal Moon (${cap(moon.sign)}).`
      : `Jupiter sits in House ${jupFromMoon} from Moon (requires angular 1st, 4th, 7th, or 10th).`,
    effect: isGajakesari
      ? 'Bestows sound judgment, enduring reputation, generosity, mentorship capacity, and resilient recovery from setbacks.'
      : 'Jupiter and Moon influence different angles of the chart.',
  });

  // 3. Pancha Mahapurusha Yogas (Mars, Mercury, Jupiter, Venus, Saturn in Kendra from Lagna in Own/Exalted sign)
  const mahapurushaDefs: Array<{
    id: string;
    name: string;
    graha: VedicGraha;
    signs: string[];
    effect: string;
  }> = [
    {
      id: 'hamsa',
      name: 'Hamsa Mahapurusha Yoga',
      graha: 'jupiter',
      signs: ['cancer', 'sagittarius', 'pisces'],
      effect: 'Conveys wisdom, ethical leadership, teaching grace, spiritual depth, and respected counsel.',
    },
    {
      id: 'malavya',
      name: 'Malavya Mahapurusha Yoga',
      graha: 'venus',
      signs: ['taurus', 'libra', 'pisces'],
      effect: 'Grants refined aesthetics, charm, material comfort, artistic talent, and harmonious partnerships.',
    },
    {
      id: 'ruchaka',
      name: 'Ruchaka Mahapurusha Yoga',
      graha: 'mars',
      signs: ['aries', 'scorpio', 'capricorn'],
      effect: 'Bestows courage, executive command, physical stamina, decisive action, and competitive mastery.',
    },
    {
      id: 'bhadra',
      name: 'Bhadra Mahapurusha Yoga',
      graha: 'mercury',
      signs: ['gemini', 'virgo'],
      effect: 'Confers eloquence, commercial acumen, systems thinking, and lasting intellectual authority.',
    },
    {
      id: 'shasha',
      name: 'Shasha Mahapurusha Yoga',
      graha: 'saturn',
      signs: ['capricorn', 'aquarius', 'libra'],
      effect: 'Builds disciplined institutional leadership, endurance, structural power, and late-blooming authority.',
    },
  ];

  for (const mp of mahapurushaDefs) {
    const g = chart.grahas[mp.graha];
    const h = houseOf(g);
    const inStrongSign = mp.signs.includes(g.sign);
    const isPresent = hasLagna && inStrongSign && KENDRAS.includes(h);
    // Always include Hamsa (for baseline visibility), and include other Mahapurusha yogas when present
    if (isPresent || mp.id === 'hamsa') {
      yogas.push({
        id: mp.id,
        name: mp.name,
        category: 'mahapurusha',
        presence: isPresent,
        strength: isPresent ? (g.dignity === 'exalted' ? 'strong' : 'moderate') : 'absent',
        planets: [mp.graha],
        description: isPresent
          ? `${cap(mp.graha)} is in its ${g.dignity} sign (${cap(g.sign)}) in angular Kendra House ${h} from Lagna.`
          : `${cap(mp.graha)} is in ${cap(g.sign)} (House ${h}), not in own/exalted sign in a Kendra (1, 4, 7, 10).`,
        effect: mp.effect,
      });
    }
  }

  // 4. Real Dhana Yoga (Wealth lords: 2nd, 5th, 9th, 11th + Lagna lord connections)
  if (hasLagna) {
    const l1 = lordOfHouse(1);
    const l2 = lordOfHouse(2);
    const l5 = lordOfHouse(5);
    const l9 = lordOfHouse(9);
    const l11 = lordOfHouse(11);
    const wealthHouses = [2, 5, 9, 11];
    const wealthLords = Array.from(new Set([l2, l5, l9, l11]));
    const connections: string[] = [];
    const involved = new Set<string>();

    // Check conjunctions among wealth lords & lagna lord
    const checkList = Array.from(new Set([l1, l2, l5, l9, l11]));
    for (let i = 0; i < checkList.length; i++) {
      for (let j = i + 1; j < checkList.length; j++) {
        const pA = checkList[i]!;
        const pB = checkList[j]!;
        if (chart.grahas[pA].signIndex === chart.grahas[pB].signIndex) {
          const h = houseOf(chart.grahas[pA]);
          connections.push(`${cap(pA)} + ${cap(pB)} conjunct in H${h} (${cap(chart.grahas[pA].sign)})`);
          involved.add(pA);
          involved.add(pB);
        }
      }
    }

    // Check wealth lords placed in own or another wealth house (2, 5, 9, 11)
    for (const h of wealthHouses) {
      const lord = lordOfHouse(h);
      const placedH = houseOf(chart.grahas[lord]);
      if (wealthHouses.includes(placedH)) {
        connections.push(`H${h} lord ${cap(lord)} placed in H${placedH} (${cap(chart.grahas[lord].sign)})`);
        involved.add(lord);
      }
    }

    const isDhana = connections.length > 0;
    yogas.push({
      id: 'dhana_yoga',
      name: 'Dhana Yoga (Prosperity Combination)',
      category: 'dhana',
      presence: isDhana,
      strength: !isDhana ? 'absent' : connections.length >= 2 ? 'strong' : 'moderate',
      planets: Array.from(involved),
      description: isDhana
        ? connections.slice(0, 2).join('; ') + '.'
        : `Wealth house lords (${wealthLords.map(cap).join(', ')}) do not form a direct conjunction or wealth-house placement.`,
      effect: isDhana
        ? 'Supports wealth accumulation, steady resource generation, and compounding financial resilience during activating Dashas.'
        : 'Financial growth develops steadily through effort and career houses rather than a single shortcut yoga.',
    });
  }

  // 5. Raja Yoga (Kendra lord + Trikona lord conjunction or mutual exchange)
  if (hasLagna) {
    const kendraLords = [4, 7, 10].map((h) => ({ h, lord: lordOfHouse(h) }));
    const trikonaLords = [1, 5, 9].map((h) => ({ h, lord: lordOfHouse(h) }));
    const rajaPairs: string[] = [];
    const rajaPlanets = new Set<string>();

    for (const k of kendraLords) {
      for (const t of trikonaLords) {
        if (k.lord === t.lord) {
          // True Yogakaraka rules a Kendra (4/7/10) AND a pure Trikona (5/9)
          if (t.h === 5 || t.h === 9) {
            rajaPairs.push(`${cap(k.lord)} is Yogakaraka (rules H${k.h} & H${t.h}), placed in H${houseOf(chart.grahas[k.lord])}`);
            rajaPlanets.add(k.lord);
          }
        } else if (chart.grahas[k.lord].signIndex === chart.grahas[t.lord].signIndex) {
          const h = houseOf(chart.grahas[k.lord]);
          rajaPairs.push(`H${k.h} lord ${cap(k.lord)} + H${t.h} lord ${cap(t.lord)} conjunct in H${h}`);
          rajaPlanets.add(k.lord);
          rajaPlanets.add(t.lord);
        } else if (houseOf(chart.grahas[k.lord]) === t.h && houseOf(chart.grahas[t.lord]) === k.h) {
          rajaPairs.push(`Parivartana exchange between H${k.h} lord ${cap(k.lord)} & H${t.h} lord ${cap(t.lord)}`);
          rajaPlanets.add(k.lord);
          rajaPlanets.add(t.lord);
        }
      }
    }

    if (rajaPairs.length > 0) {
      yogas.push({
        id: 'raja_yoga',
        name: 'Parashara Raja Yoga',
        category: 'raja',
        presence: true,
        strength: rajaPairs.length >= 2 ? 'strong' : 'moderate',
        planets: Array.from(rajaPlanets),
        description: rajaPairs.slice(0, 2).join('; ') + '.',
        effect: 'Combines angular action (Kendra) with dharmic fortune (Trikona), elevating status, leadership, and career visibility.',
      });
    }
  }

  // 6. Viparita Raja Yoga (6th, 8th, or 12th lord in 6th, 8th, or 12th)
  if (hasLagna) {
    const vryHits: string[] = [];
    const vryPlanets = new Set<string>();
    for (const dh of DUSTHANAS) {
      const lord = lordOfHouse(dh);
      const placed = houseOf(chart.grahas[lord]);
      if (DUSTHANAS.includes(placed)) {
        const subName = dh === 6 ? 'Harsha' : dh === 8 ? 'Sarala' : 'Vimala';
        vryHits.push(`${subName} (H${dh} lord ${cap(lord)} in H${placed})`);
        vryPlanets.add(lord);
      }
    }
    if (vryHits.length > 0) {
      yogas.push({
        id: 'viparita_raja',
        name: 'Viparita Raja Yoga',
        category: 'raja',
        presence: true,
        strength: vryHits.length >= 2 ? 'strong' : 'moderate',
        planets: Array.from(vryPlanets),
        description: vryHits.join('; ') + '.',
        effect: 'Turns adversity, restructuring, or unexpected turns into sudden breakthroughs and resilient independence.',
      });
    }
  }

  // =========================================================================
  // CLASSICAL DOSHAS (With Real Calculations & Cancellations)
  // =========================================================================

  // 7. Kuja Dosha (Manglik Analysis — Lagna & Moon + Classical Cancellations)
  const marsHouseLagna = houseOf(mars);
  const marsHouseMoon = houseFrom(mars.signIndex, moon.signIndex);
  const lagnaKuja = hasLagna && KUJA_HOUSES.includes(marsHouseLagna);
  const moonKuja = KUJA_HOUSES.includes(marsHouseMoon);
  const rawKuja = lagnaKuja || moonKuja;

  const kujaCancellations: string[] = [];
  if (rawKuja) {
    if (mars.sign === 'aries' || mars.sign === 'scorpio') {
      kujaCancellations.push(`Mars is in own sign (${cap(mars.sign)})`);
    }
    if (mars.sign === 'capricorn') {
      kujaCancellations.push('Mars is exalted in Capricorn');
    }
    if (mars.sign === 'leo' || mars.sign === 'aquarius') {
      kujaCancellations.push(`Mars in ${cap(mars.sign)} traditionally neutralizes Kuja Dosha`);
    }
    const jupFromMars = houseFrom(mars.signIndex, jupiter.signIndex);
    if ([1, 5, 7, 9].includes(jupFromMars)) {
      kujaCancellations.push(jupFromMars === 1 ? 'Jupiter conjunct Mars provides protective grace' : `Jupiter aspects Mars (${jupFromMars}th aspect)`);
    }
    // House-specific sign exemptions (BPHS / Muhurta Chintamani)
    if (
      (marsHouseLagna === 2 && (mars.sign === 'gemini' || mars.sign === 'virgo')) ||
      (marsHouseLagna === 4 && (mars.sign === 'aries' || mars.sign === 'scorpio')) ||
      (marsHouseLagna === 7 && (mars.sign === 'cancer' || mars.sign === 'capricorn')) ||
      (marsHouseLagna === 8 && (mars.sign === 'sagittarius' || mars.sign === 'pisces')) ||
      (marsHouseLagna === 12 && (mars.sign === 'taurus' || mars.sign === 'libra'))
    ) {
      kujaCancellations.push(`Classical sign exemption for Mars in H${marsHouseLagna} (${cap(mars.sign)})`);
    }
  }

  const isKujaCancelled = rawKuja && kujaCancellations.length > 0;
  // Classical presence: true if Lagna or Moon Kuja is active and not fully cancelled
  const hasKujaDosha = rawKuja && !isKujaCancelled;
  const kujaBasis =
    lagnaKuja && moonKuja
      ? `both Lagna (H${marsHouseLagna}) and Moon (H${marsHouseMoon})`
      : lagnaKuja
      ? `Lagna (H${marsHouseLagna})`
      : `Moon (H${marsHouseMoon})`;

  yogas.push({
    id: 'kuja_dosha',
    name: 'Kuja Dosha (Manglik Analysis)',
    category: 'dosha',
    presence: hasKujaDosha,
    strength: !rawKuja
      ? 'absent'
      : isKujaCancelled
      ? 'cancelled'
      : lagnaKuja && moonKuja
      ? 'strong'
      : lagnaKuja
      ? 'moderate'
      : 'mild',
    planets: ['mars'],
    description: !rawKuja
      ? `Mars is in House ${marsHouseLagna} from Lagna (${cap(mars.sign)}) and House ${marsHouseMoon} from Moon — outside Kuja Dosha houses (1, 2, 4, 7, 8, 12).`
      : isKujaCancelled
      ? `Mars triggers Kuja placement from ${kujaBasis}, but Dosha is neutralized: ${kujaCancellations.join('; ')}.`
      : `Mars is placed in Kuja Dosha position from ${kujaBasis} in ${cap(mars.sign)}.`,
    effect: hasKujaDosha
      ? 'Indicates intense passion, directness, and strong independence in relationships; thrives with conscious communication and compatible partnership pacing.'
      : isKujaCancelled
      ? 'Kuja Dosha is classically cancelled (Bhanga) — Mars channels its energy into protective drive and ambition without marital affliction.'
      : `No Kuja Dosha present. Mars in House ${marsHouseLagna} operates constructively without relationship friction.`,
    ...(isKujaCancelled ? { cancellationNote: kujaCancellations.join('; ') } : {}),
  });

  // 8. Kaal Sarp / Kaal Amrit Yoga (All 7 classical planets inside one Rahu–Ketu hemisphere)
  const rahuLon = rahu.lon;
  const ketuLon = ketu.lon;
  const planets7 = [sun, moon, mars, mercury, jupiter, venus, saturn];
  const rahuToKetu = planets7.every((p) => {
    const diff = (p.lon - rahuLon + 360) % 360;
    return diff <= 180;
  });
  const ketuToRahu = planets7.every((p) => {
    const diff = (p.lon - ketuLon + 360) % 360;
    return diff <= 180;
  });
  const isKaalSarp = rahuToKetu || ketuToRahu;
  const ksType = rahuToKetu ? 'Kaal Amrit (Ketu-leading)' : 'Kaal Sarp (Rahu-leading)';

  yogas.push({
    id: 'kaal_sarp',
    name: isKaalSarp ? `${ksType} Yoga` : 'Kaal Sarp Dosha Check',
    category: 'dosha',
    presence: isKaalSarp,
    strength: isKaalSarp ? 'strong' : 'absent',
    planets: ['rahu', 'ketu'],
    description: isKaalSarp
      ? `All 7 classical planets lie within one nodal arc between Rahu (${cap(rahu.sign)}, H${houseOf(rahu)}) and Ketu (${cap(ketu.sign)}, H${houseOf(ketu)}).`
      : `Planets span both sides of the Rahu (${cap(rahu.sign)}) – Ketu (${cap(ketu.sign)}) axis — no nodal hem-in.`,
    effect: isKaalSarp
      ? 'Concentrates karmic drive intensely, often producing early-life testing that converts into focused breakthroughs and mastery in maturity.'
      : 'No Kaal Sarp Dosha present; planetary energies distribute across both hemispheres freely.',
  });

  // 9. Kemadruma Dosha (No planet other than Sun/Rahu/Ketu in 2nd or 12th from Moon + Kendra cancellation)
  const moonNeighbors = [mars, mercury, jupiter, venus, saturn].filter((p) => {
    const hFromMoon = houseFrom(p.signIndex, moon.signIndex);
    return hFromMoon === 2 || hFromMoon === 12;
  });
  const moonConjunct = [sun, mars, mercury, jupiter, venus, saturn].filter(
    (p) => p.signIndex === moon.signIndex,
  );
  const rawKemadruma = moonNeighbors.length === 0 && moonConjunct.length === 0;
  const kendraFromMoon = [mars, mercury, jupiter, venus, saturn].filter((p) =>
    KENDRAS.includes(houseFrom(p.signIndex, moon.signIndex)),
  );
  const kendraFromLagna = hasLagna
    ? [mars, mercury, jupiter, venus, saturn].filter((p) => KENDRAS.includes(houseOf(p)))
    : [];
  const isKemadrumaCancelled = rawKemadruma && (kendraFromMoon.length > 0 || kendraFromLagna.length > 0);
  const hasKemadruma = rawKemadruma && !isKemadrumaCancelled;

  yogas.push({
    id: 'kemadruma',
    name: 'Kemadruma Dosha (Moon Support Check)',
    category: 'dosha',
    presence: hasKemadruma,
    strength: !rawKemadruma ? 'absent' : isKemadrumaCancelled ? 'cancelled' : 'moderate',
    planets: ['moon'],
    description: !rawKemadruma
      ? `Natal Moon (${cap(moon.sign)}) is flanked or joined by planets (${[...moonNeighbors, ...moonConjunct].length} supporting body/bodies).`
      : isKemadrumaCancelled
      ? `2nd and 12th houses from Moon are empty, but Kemadruma is cancelled by planets in angular Kendras (Kemadruma Bhanga).`
      : `2nd and 12th houses from Natal Moon (${cap(moon.sign)}) have no planets, and no Kendra support cancels it.`,
    effect: hasKemadruma
      ? 'Creates periods of self-reliance and emotional solitude; structured routines, trusted community, and grounding practices build steady inner security.'
      : isKemadrumaCancelled
      ? 'Kemadruma is classically cancelled (Bhanga) — independent spirit is backed by strong structural support in Kendras.'
      : 'No Kemadruma Dosha present; Moon receives natural flanking or conjunction support.',
    ...(isKemadrumaCancelled ? { cancellationNote: 'Planets in angular Kendras cancel Kemadruma (Bhanga)' } : {}),
  });

  // 10. Grahan (Eclipse) Dosha (Sun or Moon conjunct Rahu or Ketu in same sign)
  const sunNodeConj = sun.signIndex === rahu.signIndex || sun.signIndex === ketu.signIndex;
  const moonNodeConj = moon.signIndex === rahu.signIndex || moon.signIndex === ketu.signIndex;
  const hasGrahan = sunNodeConj || moonNodeConj;
  const grahanParts: string[] = [];
  const grahanPlanets: string[] = [];
  if (sunNodeConj) {
    const node = sun.signIndex === rahu.signIndex ? 'Rahu' : 'Ketu';
    const sep = angularSep(sun.lon, node === 'Rahu' ? rahu.lon : ketu.lon);
    grahanParts.push(`Surya Grahan: Sun + ${node} in ${cap(sun.sign)} (H${houseOf(sun)}, ${sep.toFixed(1)}° apart)`);
    grahanPlanets.push('sun', node.toLowerCase());
  }
  if (moonNodeConj) {
    const node = moon.signIndex === rahu.signIndex ? 'Rahu' : 'Ketu';
    const sep = angularSep(moon.lon, node === 'Rahu' ? rahu.lon : ketu.lon);
    grahanParts.push(`Chandra Grahan: Moon + ${node} in ${cap(moon.sign)} (H${houseOf(moon)}, ${sep.toFixed(1)}° apart)`);
    grahanPlanets.push('moon', node.toLowerCase());
  }

  yogas.push({
    id: 'grahan_dosha',
    name: 'Grahan Dosha (Solar / Lunar Eclipse)',
    category: 'dosha',
    presence: hasGrahan,
    strength: !hasGrahan ? 'absent' : grahanParts.length >= 2 ? 'strong' : 'moderate',
    planets: hasGrahan ? Array.from(new Set(grahanPlanets)) : ['sun', 'moon', 'rahu', 'ketu'],
    description: hasGrahan
      ? grahanParts.join('; ') + '.'
      : 'Neither Sun nor Moon is conjunct Rahu or Ketu in the same sign.',
    effect: hasGrahan
      ? 'Amplifies unconventional ambition, deep intuition, or restless mental cycles; mindfulness and clear boundaries channel this intensity constructively.'
      : 'No Grahan Dosha present; luminaries shine clearly without nodal eclipse.',
  });

  return yogas;
};
