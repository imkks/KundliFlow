import { SIGN_LORDS, type NatalChart, type VedicGraha } from './types.js';

export interface YogaDetection {
  id: string;
  name: string;
  category: 'raja' | 'dhana' | 'mahapurusha' | 'auspicious' | 'dosha' | 'neutral';
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

  // 2. Gaja-Kesari Yoga (Jupiter in Kendra 1, 4, 7, 10 from Moon OR Lagna)
  const jupFromMoon = houseFrom(jupiter.signIndex, moon.signIndex);
  const jupFromLagna = hasLagna ? houseOf(jupiter) : 0;
  const isGajaFromMoon = KENDRAS.includes(jupFromMoon);
  const isGajaFromLagna = hasLagna && KENDRAS.includes(jupFromLagna);
  const isGajakesari = isGajaFromMoon || isGajaFromLagna;
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
      ? isGajaFromMoon
        ? `Jupiter (${cap(jupiter.sign)}, House ${houseOf(jupiter)}) sits in House ${jupFromMoon} (Kendra) from Natal Moon (${cap(moon.sign)}).`
        : `Jupiter (${cap(jupiter.sign)}) sits in House ${jupFromLagna} (Kendra from Lagna).`
      : `Jupiter sits in House ${jupFromMoon} from Moon and House ${jupFromLagna} from Lagna (requires angular 1st, 4th, 7th, or 10th).`,
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
    // Lagna (1) is both a Kendra and a Trikona; evaluate Kendras [1, 4, 7, 10] with Trikonas [1, 5, 9]
    const kendraLords = [1, 4, 7, 10].map((h) => ({ h, lord: lordOfHouse(h) }));
    const trikonaLords = [1, 5, 9].map((h) => ({ h, lord: lordOfHouse(h) }));
    const rajaPairs: string[] = [];
    const rajaPlanets = new Set<string>();

    for (const k of kendraLords) {
      for (const t of trikonaLords) {
        if (k.h === t.h) continue; // Same house (1 with 1)
        if (k.lord === t.lord) {
          // True Yogakaraka rules a Kendra (1/4/7/10) AND a pure Trikona (5/9)
          if ((k.h === 4 || k.h === 7 || k.h === 10) && (t.h === 5 || t.h === 9)) {
            const key = `${k.lord}-yogakaraka`;
            if (!rajaPlanets.has(key)) {
              rajaPairs.push(`${cap(k.lord)} is Yogakaraka (rules H${k.h} & H${t.h}), placed in H${houseOf(chart.grahas[k.lord])}`);
              rajaPlanets.add(key);
              rajaPlanets.add(k.lord);
            }
          }
        } else if (chart.grahas[k.lord].signIndex === chart.grahas[t.lord].signIndex) {
          const h = houseOf(chart.grahas[k.lord]);
          const pairKey = [k.lord, t.lord].sort().join('-') + `-conj-${h}`;
          if (!rajaPlanets.has(pairKey)) {
            rajaPairs.push(`H${k.h} lord ${cap(k.lord)} + H${t.h} lord ${cap(t.lord)} conjunct in H${h}`);
            rajaPlanets.add(pairKey);
            rajaPlanets.add(k.lord);
            rajaPlanets.add(t.lord);
          }
        } else if (houseOf(chart.grahas[k.lord]) === t.h && houseOf(chart.grahas[t.lord]) === k.h) {
          const pairKey = [k.lord, t.lord].sort().join('-') + '-parivartana';
          if (!rajaPlanets.has(pairKey)) {
            rajaPairs.push(`Parivartana exchange between H${k.h} lord ${cap(k.lord)} & H${t.h} lord ${cap(t.lord)}`);
            rajaPlanets.add(pairKey);
            rajaPlanets.add(k.lord);
            rajaPlanets.add(t.lord);
          }
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

  // 8. Kaal Sarp / Kaal Amrit Yoga (Comprehensive 12-Type & Partial/Bhanga Algorithm)
  const rahuLon = rahu.lon;
  const ketuLon = ketu.lon;
  const planets7 = [sun, moon, mars, mercury, jupiter, venus, saturn];

  // Helper to calculate angular distance along zodiac from base to lon [0, 360)
  const normArc = (deg: number, base: number) => ((deg - base + 360) % 360);

  // In Vedic astrology:
  // Arc 1: Rahu -> Ketu (direct zodiacal order from Rahu to Ketu, span <= 180°) -> Savya Kaal Sarp
  // Arc 2: Ketu -> Rahu (direct zodiacal order from Ketu to Rahu, span <= 180°) -> Apasavya / Kaal Amrit
  const inRahuToKetu = (lon: number) => normArc(lon, rahuLon) <= 180;
  const inKetuToRahu = (lon: number) => normArc(lon, ketuLon) <= 180;

  const countInRahuToKetu = planets7.filter((p) => inRahuToKetu(p.lon)).length;
  const countInKetuToRahu = planets7.filter((p) => inKetuToRahu(p.lon)).length;

  const isFullSavya = countInRahuToKetu === 7;
  const isFullApasavya = countInKetuToRahu === 7;
  const isFullKaalSarp = isFullSavya || isFullApasavya;

  // Partial / Khanda / Anshik Kaal Sarp: 6 planets inside one arc, exactly 1 outside
  const isPartialSavya = countInRahuToKetu === 6;
  const isPartialApasavya = countInKetuToRahu === 6;
  const isPartialKaalSarp = !isFullKaalSarp && (isPartialSavya || isPartialApasavya);

  const outsidePlanet = isPartialKaalSarp
    ? planets7.find((p) => (isPartialSavya ? !inRahuToKetu(p.lon) : !inKetuToRahu(p.lon)))
    : null;

  const isSavya = isFullSavya || isPartialSavya;
  const directionName = isSavya ? 'Savya (Rahu-leading)' : 'Apasavya (Ketu-leading / Kaal Amrit)';

  // 12 Classical Varieties based on Rahu's house from Lagna
  const rahuHouse = hasLagna ? houseOf(rahu) : ((rahu.signIndex - lagnaSign + 12) % 12) + 1;
  const kaalSarpTypes: Record<number, { name: string; focus: string }> = {
    1: { name: 'Anant Kaal Sarp', focus: '1st/7th axis: self-identity, health, and relationship equilibrium' },
    2: { name: 'Kulik Kaal Sarp', focus: '2nd/8th axis: family finances, speech patterns, and sudden transformations' },
    3: { name: 'Vasuki Kaal Sarp', focus: '3rd/9th axis: personal initiative, siblings, and higher philosophical fortune' },
    4: { name: 'Shankhapal Kaal Sarp', focus: '4th/10th axis: domestic peace, maternal bonds, and public career status' },
    5: { name: 'Padma Kaal Sarp', focus: '5th/11th axis: intellect, progeny, creative works, and large aspirations' },
    6: { name: 'Mahapadma Kaal Sarp', focus: '6th/12th axis: conquering competition, acute health routines, and spiritual release' },
    7: { name: 'Takshak Kaal Sarp', focus: '7th/1st axis: public alliances, business partnerships, and marital harmony' },
    8: { name: 'Karkotak Kaal Sarp', focus: '8th/2nd axis: occult research, inheritance, and psychological transformation' },
    9: { name: 'Shankhachood Kaal Sarp', focus: '9th/3rd axis: dharma, mentor relationships, and moral courage' },
    10: { name: 'Ghatak Kaal Sarp', focus: '10th/4th axis: administrative authority, career prominence, and legacy' },
    11: { name: 'Vishdhar Kaal Sarp', focus: '11th/5th axis: professional networks, elder siblings, and speculative gains' },
    12: { name: 'Sheshnag Kaal Sarp', focus: '12th/6th axis: foreign affairs, solitude, spiritual liberation, and secret matters' },
  };

  const currentType = kaalSarpTypes[rahuHouse] ?? { name: 'Kaal Sarp', focus: 'Nodal karmic axis' };

  // Classical Kaal Sarp Bhanga (Cancellations & Mitigations)
  const jupKendra = hasLagna && KENDRAS.includes(houseOf(jupiter));
  const venKendra = hasLagna && KENDRAS.includes(houseOf(venus));
  const lagnaOutsideNodalArc = hasLagna && (isSavya ? !inRahuToKetu(chart.lagna!.lon) : !inKetuToRahu(chart.lagna!.lon));
  const rahuDignity = ['taurus', 'gemini'].includes(rahu.sign);

  const ksCancellations: string[] = [];
  if (jupKendra) ksCancellations.push('Jupiter in angular Kendra shields the chart');
  if (venKendra) ksCancellations.push('Venus in angular Kendra provides benefic sanctuary');
  if (lagnaOutsideNodalArc) ksCancellations.push('Ascendant degree lies outside the nodal arc (soul self is free)');
  if (rahuDignity) ksCancellations.push(`Rahu sits in favorable sign dignity (${cap(rahu.sign)})`);

  const hasKsBhanga = (isFullKaalSarp || isPartialKaalSarp) && ksCancellations.length > 0;
  const ksPresence = isFullKaalSarp || isPartialKaalSarp;

  const ksDisplayName = isFullKaalSarp
    ? `${currentType.name} Yoga (${directionName})`
    : isPartialKaalSarp
    ? `Partial (Anshik) ${currentType.name} Yoga`
    : 'Kaal Sarp Dosha Check';

  yogas.push({
    id: 'kaal_sarp',
    name: ksDisplayName,
    category: 'dosha',
    presence: ksPresence,
    strength: !ksPresence ? 'absent' : hasKsBhanga ? 'cancelled' : isFullKaalSarp ? 'strong' : 'moderate',
    planets: ['rahu', 'ketu'],
    cancellationNote: hasKsBhanga ? `Kaal Sarp is mitigated into a protective catalyst: ${ksCancellations.join('; ')}.` : undefined,
    description: isFullKaalSarp
      ? `All 7 classical planets lie strictly within one nodal hemisphere between Rahu (${cap(rahu.sign)}, House ${rahuHouse}) and Ketu (${cap(ketu.sign)}, House ${houseOf(ketu)}). Focus area: ${currentType.focus}.${hasKsBhanga ? ` Mitigated by: ${ksCancellations.join('; ')}.` : ''}`
      : isPartialKaalSarp
      ? `6 of 7 classical planets lie inside the nodal arc; ${cap(outsidePlanet?.id ?? 'one planet')} sits outside, creating Partial (Anshik) Kaal Sarp. Focus area: ${currentType.focus}.${hasKsBhanga ? ` Mitigated by: ${ksCancellations.join('; ')}.` : ''}`
      : `Planets span both hemispheres across the Rahu (${cap(rahu.sign)}) – Ketu (${cap(ketu.sign)}) axis (${countInRahuToKetu} in Rahu arc, ${countInKetuToRahu} in Ketu arc) — no nodal hem-in.`,
    effect: !ksPresence
      ? 'No Kaal Sarp Dosha present; planetary energies distribute across both hemispheres freely without nodal restriction.'
      : hasKsBhanga
      ? 'Converts initial nodal tension into exceptional drive, relentless perseverance, and breakthrough success (Kaal Sarp Bhanga Raja Yoga).'
      : isFullKaalSarp
      ? 'Concentrates karmic lessons intensely into specific life domains; structured discipline, ethical conduct, and patience turn early-life friction into late mastery.'
      : 'Partial nodal concentration prompts focused effort in key houses while the free planet provides an escape valve and balancing outlet.',
  });

  // 9. Kemadruma Dosha (No planet other than Sun/Rahu/Ketu in 2nd or 12th from Moon + Kendra cancellation)
  const moonNeighbors = [mars, mercury, jupiter, venus, saturn].filter((p) => {
    const hFromMoon = houseFrom(p.signIndex, moon.signIndex);
    return hFromMoon === 2 || hFromMoon === 12;
  });
  // Note: Classical Parashari (BPHS Ch. 13) states Sun does NOT protect against Kemadruma
  const moonConjunct = [mars, mercury, jupiter, venus, saturn].filter(
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

  // 10. Grahan (Eclipse) Dosha (Sun or Moon conjunct Rahu or Ketu within angular orb)
  const sepSunRahu = angularSep(sun.lon, rahu.lon);
  const sepSunKetu = angularSep(sun.lon, ketu.lon);
  const sepMoonRahu = angularSep(moon.lon, rahu.lon);
  const sepMoonKetu = angularSep(moon.lon, ketu.lon);
  const sunNodeConj =
    (sun.signIndex === rahu.signIndex && sepSunRahu <= 15) ||
    (sun.signIndex === ketu.signIndex && sepSunKetu <= 15) ||
    sepSunRahu <= 12 ||
    sepSunKetu <= 12;
  const moonNodeConj =
    (moon.signIndex === rahu.signIndex && sepMoonRahu <= 15) ||
    (moon.signIndex === ketu.signIndex && sepMoonKetu <= 15) ||
    sepMoonRahu <= 12 ||
    sepMoonKetu <= 12;
  const hasGrahan = sunNodeConj || moonNodeConj;
  const grahanParts: string[] = [];
  const grahanPlanets: string[] = [];
  if (sunNodeConj) {
    const node = sepSunRahu <= sepSunKetu ? 'Rahu' : 'Ketu';
    const sep = Math.min(sepSunRahu, sepSunKetu);
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

  // 11. Guru Chandal Yoga / Dosha (Jupiter conjunct Rahu or Ketu)
  const sepJupRahu = angularSep(jupiter.lon, rahu.lon);
  const sepJupKetu = angularSep(jupiter.lon, ketu.lon);
  const isJupRahu = jupiter.signIndex === rahu.signIndex || sepJupRahu <= 12;
  const isJupKetu = jupiter.signIndex === ketu.signIndex || sepJupKetu <= 12;
  const hasGuruChandal = isJupRahu || isJupKetu;
  const chandalNode = isJupRahu ? 'Rahu' : 'Ketu';
  const chandalSep = isJupRahu ? sepJupRahu : sepJupKetu;
  yogas.push({
    id: 'guru_chandal',
    name: 'Guru Chandal Yoga',
    category: 'dosha',
    presence: hasGuruChandal,
    strength: !hasGuruChandal ? 'absent' : chandalSep <= 5 ? 'strong' : 'moderate',
    planets: hasGuruChandal ? ['jupiter', chandalNode.toLowerCase()] : ['jupiter', 'rahu'],
    description: hasGuruChandal
      ? `Jupiter + ${chandalNode} conjunct in ${cap(jupiter.sign)} (House ${houseOf(jupiter)}, separation ${chandalSep.toFixed(1)}°).`
      : 'Jupiter is free from close conjunction with Rahu or Ketu.',
    effect: hasGuruChandal
      ? 'Blends traditional philosophical wisdom (Jupiter) with unconventional questioning and reformist drive (Rahu/Ketu). Grounded ethical practice turns this combination into innovative thought leadership.'
      : 'No Guru Chandal Yoga present; Jupiter operates with clear traditional wisdom.',
  });

  // 12. Angarak Dosha (Mars conjunct Rahu or Ketu)
  const sepMarsRahu = angularSep(mars.lon, rahu.lon);
  const sepMarsKetu = angularSep(mars.lon, ketu.lon);
  const isMarsRahu = mars.signIndex === rahu.signIndex || sepMarsRahu <= 12;
  const isMarsKetu = mars.signIndex === ketu.signIndex || sepMarsKetu <= 12;
  const hasAngarak = isMarsRahu || isMarsKetu;
  const angarakNode = isMarsRahu ? 'Rahu' : 'Ketu';
  const angarakSep = isMarsRahu ? sepMarsRahu : sepMarsKetu;
  yogas.push({
    id: 'angarak_dosha',
    name: 'Angarak Yoga / Dosha',
    category: 'dosha',
    presence: hasAngarak,
    strength: !hasAngarak ? 'absent' : angarakSep <= 5 ? 'strong' : 'moderate',
    planets: hasAngarak ? ['mars', angarakNode.toLowerCase()] : ['mars', 'rahu'],
    description: hasAngarak
      ? `Mars + ${angarakNode} conjunct in ${cap(mars.sign)} (House ${houseOf(mars)}, separation ${angarakSep.toFixed(1)}°).`
      : 'Mars is free from conjunction with Rahu or Ketu.',
    effect: hasAngarak
      ? 'Fuses Martian courage and technical execution with intense nodal drive. Confers athletic stamina, crisis resilience, and high ambition; conscious pacing prevents hasty or combative reactions.'
      : 'No Angarak Dosha present; Mars directs its action steadily without nodal turbulence.',
  });

  // 13. Vish Yoga / Punarbhoo (Saturn–Moon conjunction or mutual aspect)
  const sepSatMoon = angularSep(saturn.lon, moon.lon);
  const satMoonConj = saturn.signIndex === moon.signIndex || sepSatMoon <= 12;
  const hFromMoonSat = houseFrom(saturn.signIndex, moon.signIndex);
  const satAspectsMoon = [1, 3, 7, 10].includes(hFromMoonSat);
  const hasVishYoga = satMoonConj || satAspectsMoon;
  yogas.push({
    id: 'vish_dosha',
    name: 'Vish Yoga / Punarbhoo',
    category: 'dosha',
    presence: hasVishYoga,
    strength: !hasVishYoga ? 'absent' : satMoonConj ? 'strong' : 'moderate',
    planets: ['saturn', 'moon'],
    description: hasVishYoga
      ? satMoonConj
        ? `Saturn and Moon conjunct in ${cap(moon.sign)} (House ${houseOf(moon)}, separation ${sepSatMoon.toFixed(1)}°).`
        : `Saturn in ${cap(saturn.sign)} (House ${hFromMoonSat} from Moon) casts aspect upon natal Moon.`
      : 'Moon is free from conjunction or direct aspect with Saturn.',
    effect: hasVishYoga
      ? 'Brings an introspective, serious, and deeply enduring emotional nature. Imparts mature self-reliance, patience under testing circumstances, and late-blooming inner tranquility.'
      : 'No Vish Yoga present; Moon maintains its natural emotional buoyancy.',
  });

  // 14. Pitra Dosha Check (Sun or 9th lord associated with Rahu/Ketu)
  const l9 = hasLagna ? lordOfHouse(9) : null;
  const l9Graha = l9 ? chart.grahas[l9] : null;
  const l9WithRahuKetu = l9Graha && (l9Graha.signIndex === rahu.signIndex || l9Graha.signIndex === ketu.signIndex);
  const sunWithRahuKetu = sun.signIndex === rahu.signIndex || sun.signIndex === ketu.signIndex;
  const hasPitraDosha = sunWithRahuKetu || Boolean(l9WithRahuKetu);
  yogas.push({
    id: 'pitra_dosha',
    name: 'Pitra Dosha Check',
    category: 'dosha',
    presence: hasPitraDosha,
    strength: !hasPitraDosha ? 'absent' : sunWithRahuKetu && l9WithRahuKetu ? 'strong' : 'moderate',
    planets: hasPitraDosha ? ['sun', 'rahu'] : ['sun'],
    description: hasPitraDosha
      ? sunWithRahuKetu
        ? `Sun (Pitrurkaraka) is joined with ${sun.signIndex === rahu.signIndex ? 'Rahu' : 'Ketu'} in ${cap(sun.sign)}.`
        : `9th house lord ${cap(l9!)} is joined with nodes in ${cap(l9Graha!.sign)}.`
      : 'Sun and 9th house are free from direct nodal conjunction.',
    effect: hasPitraDosha
      ? 'Signals ancestral responsibilities, filial duty, and a strong calling to honor family heritage through righteous conduct, charity, and ethical achievements.'
      : 'No Pitra Dosha present; solar and 9th house lineage flow operates unobstructed.',
  });

  // 15. Neecha Bhanga Raja Yoga (Classical Cancellation of Debilitation)
  type ClassicalSeven = 'sun' | 'moon' | 'mars' | 'mercury' | 'jupiter' | 'venus' | 'saturn';
  const debilitationSigns: Record<ClassicalSeven, number> = {
    sun: 6,      // Libra (Tula)
    moon: 7,     // Scorpio (Vrischika)
    mars: 3,     // Cancer (Karka)
    mercury: 11, // Pisces (Meena)
    jupiter: 9,  // Capricorn (Makara)
    venus: 5,    // Virgo (Kanya)
    saturn: 0,   // Aries (Mesha)
  };
  const exaltationLords: Record<number, VedicGraha> = {
    6: 'saturn',  // Saturn exalted in Libra
    7: 'moon',    // Moon Moolatrikona / Rahu exalted
    3: 'jupiter', // Jupiter exalted in Cancer
    11: 'venus',  // Venus exalted in Pisces
    9: 'mars',    // Mars exalted in Capricorn
    5: 'mercury', // Mercury exalted in Virgo
    0: 'sun',     // Sun exalted in Aries
  };

  const debilPlanets = (['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'] as const)
    .filter((p) => chart.grahas[p].signIndex === debilitationSigns[p]);

  const neechaBhangas: string[] = [];
  const neechaPlanets = new Set<string>();

  for (const dp of debilPlanets) {
    const dGraha = chart.grahas[dp];
    const debSign = debilitationSigns[dp];
    const dispositor = SIGN_LORDS[debSign]!;
    const dispGraha = chart.grahas[dispositor];
    const dispFromLagna = hasLagna ? houseOf(dispGraha) : 0;
    const dispFromMoon = houseFrom(dispGraha.signIndex, moon.signIndex);
    const dpFromLagna = hasLagna ? houseOf(dGraha) : 0;
    const dpFromMoon = houseFrom(dGraha.signIndex, moon.signIndex);
    const exLord = exaltationLords[debSign];
    const exGraha = exLord ? chart.grahas[exLord] : null;
    const exFromLagna = hasLagna && exGraha ? houseOf(exGraha) : 0;
    const exFromMoon = exGraha ? houseFrom(exGraha.signIndex, moon.signIndex) : 0;

    const reasons: string[] = [];
    if (KENDRAS.includes(dispFromLagna)) reasons.push(`dispositor ${cap(dispositor)} in Kendra H${dispFromLagna} from Lagna`);
    else if (KENDRAS.includes(dispFromMoon)) reasons.push(`dispositor ${cap(dispositor)} in Kendra H${dispFromMoon} from Moon`);

    if (exGraha && (KENDRAS.includes(exFromLagna) || KENDRAS.includes(exFromMoon))) {
      reasons.push(`exaltation lord ${cap(exLord!)} in Kendra`);
    }
    if (KENDRAS.includes(dpFromLagna) || KENDRAS.includes(dpFromMoon)) {
      reasons.push(`${cap(dp)} sits in angular Kendra`);
    }

    if (reasons.length > 0) {
      neechaBhangas.push(`${cap(dp)} in ${cap(dGraha.sign)} cancelled (${reasons.join('; ')})`);
      neechaPlanets.add(dp);
      neechaPlanets.add(dispositor);
    }
  }

  const hasNeechaBhanga = neechaBhangas.length > 0;
  yogas.push({
    id: 'neecha_bhanga',
    name: 'Neecha Bhanga Raja Yoga',
    category: 'raja',
    presence: hasNeechaBhanga,
    strength: !hasNeechaBhanga ? 'absent' : 'strong',
    planets: Array.from(neechaPlanets),
    description: hasNeechaBhanga
      ? neechaBhangas.join('; ') + '.'
      : debilPlanets.length > 0
      ? `Debilitated planet (${debilPlanets.map(cap).join(', ')}) lacks classical Kendra cancellation.`
      : 'No debilitated planets requiring cancellation; planetary dignity is stable.',
    effect: hasNeechaBhanga
      ? 'Converts an initial area of vulnerability or struggle into an extraordinary late-blooming strength, conferring remarkable resilience, humility, and eventual leadership.'
      : 'All planets operate through their natural dignity without neecha cancellation dynamics.',
  });

  // 16. Gandanta Dosha Check (Junction of Water & Fire signs)
  const isGandantaLon = (lon: number) => {
    if (lon >= 356.667 || lon <= 3.333) return 'Revati–Ashwini junction (Pisces–Aries)';
    if (lon >= 116.667 && lon <= 123.333) return 'Ashlesha–Magha junction (Cancer–Leo)';
    if (lon >= 236.667 && lon <= 243.333) return 'Jyeshtha–Moola junction (Scorpio–Sagittarius)';
    return null;
  };
  const moonGandanta = isGandantaLon(moon.lon);
  const lagnaGandanta = hasLagna ? isGandantaLon(chart.lagna!.lon) : null;
  const hasGandanta = Boolean(moonGandanta || lagnaGandanta);
  const gandantaDetails = [
    moonGandanta ? `Moon in Nakshatra Gandanta: ${moonGandanta}` : null,
    lagnaGandanta ? `Lagna in Lagna Gandanta: ${lagnaGandanta}` : null,
  ].filter(Boolean).join('; ');

  yogas.push({
    id: 'gandanta_dosha',
    name: 'Gandanta Dosha Check',
    category: 'dosha',
    presence: hasGandanta,
    strength: !hasGandanta ? 'absent' : 'moderate',
    planets: hasGandanta ? ['moon'] : [],
    description: hasGandanta
      ? `${gandantaDetails}.`
      : 'Neither Moon nor Lagna falls in the sensitive Water–Fire junctional sandhis (Ashlesha-Magha, Jyeshtha-Moola, Revati-Ashwini).',
    effect: hasGandanta
      ? 'Marks a sensitive spiritual junction between elemental dissolution and creation. Confers deep psychic sensitivity, spiritual awakening, and intense personal transformation through self-mastery.'
      : 'No Gandanta Dosha present; birth occurs on stable zodiacal ground.',
  });

  // 17. Chandra-Mangala Yoga (Moon and Mars conjunct)
  const isChandraMangala = moon.signIndex === mars.signIndex;
  const chandraMangalaSep = isChandraMangala ? angularSep(moon.lon, mars.lon) : 999;
  yogas.push({
    id: 'chandra_mangala',
    name: 'Chandra-Mangala Yoga',
    category: 'dhana',
    presence: isChandraMangala,
    strength: !isChandraMangala ? 'absent' : chandraMangalaSep <= 6 ? 'strong' : 'moderate',
    planets: ['moon', 'mars'],
    description: isChandraMangala
      ? `Moon and Mars conjunct in ${cap(moon.sign)} (House ${houseOf(moon)}, separation ${chandraMangalaSep.toFixed(1)}°).`
      : `Moon (${cap(moon.sign)}) and Mars (${cap(mars.sign)}) occupy different signs.`,
    effect: isChandraMangala
      ? 'Activates energetic commercial drive, resource acquisition, sharp business intuition, and untiring entrepreneurial stamina.'
      : 'Moon and Mars operate independently in emotional and physical domains.',
  });

  // 18. Amala Yoga (Natural benefic in 10th from Lagna or Moon)
  const naturalBenefics: VedicGraha[] = ['jupiter', 'venus', 'mercury'];
  const amalaFromLagna = hasLagna ? naturalBenefics.filter((b) => houseOf(chart.grahas[b]) === 10) : [];
  const amalaFromMoon = naturalBenefics.filter((b) => houseFrom(chart.grahas[b].signIndex, moon.signIndex) === 10);
  const isAmala = amalaFromLagna.length > 0 || amalaFromMoon.length > 0;
  const amalaPlanets = Array.from(new Set([...amalaFromLagna, ...amalaFromMoon]));
  yogas.push({
    id: 'amala_yoga',
    name: 'Amala Yoga (Unblemished Career Grace)',
    category: 'auspicious',
    presence: isAmala,
    strength: !isAmala ? 'absent' : 'strong',
    planets: amalaPlanets,
    description: isAmala
      ? `Natural benefic (${amalaPlanets.map(cap).join(', ')}) occupies the 10th house of profession and public visibility.`
      : '10th house from Lagna and Moon does not host a natural benefic (Jupiter, Venus, Mercury).',
    effect: isAmala
      ? 'Bestows an unblemished professional reputation, ethical public career, lasting societal goodwill, and philanthropic inclinations.'
      : 'Career authority develops through effort, skill, and executive perseverance.',
  });

  // 19. Kartari Yogas (Lagna flanked by malefics or benefics)
  const maleficsSet = new Set(['sun', 'mars', 'saturn', 'rahu', 'ketu']);
  const beneficsSet = new Set(['jupiter', 'venus', 'mercury']);
  const h2LagnaPlanets = Object.keys(chart.grahas).filter((p) => houseOf(chart.grahas[p as VedicGraha]) === 2);
  const h12LagnaPlanets = Object.keys(chart.grahas).filter((p) => houseOf(chart.grahas[p as VedicGraha]) === 12);
  const isPapaKartariLagna =
    h2LagnaPlanets.length > 0 &&
    h12LagnaPlanets.length > 0 &&
    h2LagnaPlanets.every((p) => maleficsSet.has(p)) &&
    h12LagnaPlanets.every((p) => maleficsSet.has(p));
  const isShubhaKartariLagna =
    h2LagnaPlanets.length > 0 &&
    h12LagnaPlanets.length > 0 &&
    h2LagnaPlanets.some((p) => beneficsSet.has(p)) &&
    h12LagnaPlanets.some((p) => beneficsSet.has(p));

  const hasKartari = isPapaKartariLagna || isShubhaKartariLagna;
  yogas.push({
    id: isPapaKartariLagna ? 'papakartari_yoga' : 'shubhakarari_yoga',
    name: isPapaKartariLagna ? 'Papakartari Yoga (Hemmed by Malefics)' : isShubhaKartariLagna ? 'Shubhakarari Yoga (Hemmed by Benefics)' : 'Kartari Hemming Check',
    category: isPapaKartariLagna ? 'dosha' : 'auspicious',
    presence: hasKartari,
    strength: !hasKartari ? 'absent' : 'moderate',
    planets: isPapaKartariLagna ? [...h2LagnaPlanets, ...h12LagnaPlanets] : isShubhaKartariLagna ? [...h2LagnaPlanets, ...h12LagnaPlanets] : [],
    description: isPapaKartariLagna
      ? `Lagna is flanked by natural malefics in 2nd house (${h2LagnaPlanets.map(cap).join(', ')}) and 12th house (${h12LagnaPlanets.map(cap).join(', ')}).`
      : isShubhaKartariLagna
      ? `Lagna is flanked by natural benefics in 2nd house and 12th house, creating a supportive protective halo.`
      : 'Lagna is not hemmed between purely malefic or benefic flanking positions.',
    effect: isPapaKartariLagna
      ? 'Demands conscious boundary management and mental calmness during stressful periods, as external pressures require extra resilience.'
      : isShubhaKartariLagna
      ? 'Surrounds the physical personality and life trajectory with protective grace, ease of resource flow, and supportive alliances.'
      : 'Planetary energies flank the ascendant without restrictive hemming.',
  });

  // 20. Chandra Yogas: Sunapha, Anapha, Durudhara, Kemadruma (Dr. Charak Ch. XXII)
  const chandraEligible: VedicGraha[] = ['mars', 'mercury', 'jupiter', 'venus', 'saturn'];
  const planetsInH2Moon = chandraEligible.filter((p) => houseFrom(chart.grahas[p].signIndex, moon.signIndex) === 2);
  const planetsInH12Moon = chandraEligible.filter((p) => houseFrom(chart.grahas[p].signIndex, moon.signIndex) === 12);
  const hasH2Moon = planetsInH2Moon.length > 0;
  const hasH12Moon = planetsInH12Moon.length > 0;

  if (hasH2Moon && hasH12Moon) {
    yogas.push({
      id: 'durudhara_yoga',
      name: 'Durudhara Yoga (Flanked Lunar Fortune)',
      category: 'dhana',
      presence: true,
      strength: 'strong',
      planets: ['moon', ...planetsInH2Moon, ...planetsInH12Moon],
      description: `Planets flank natal Moon on both sides: ${planetsInH2Moon.map(cap).join(', ')} in 2nd from Moon, and ${planetsInH12Moon.map(cap).join(', ')} in 12th from Moon.`,
      effect: 'Bestows material prosperity, generous temperament, abundance of comforts, vehicles, and enduring societal renown.',
    });
  } else if (hasH2Moon) {
    yogas.push({
      id: 'sunapha_yoga',
      name: 'Sunapha Yoga (Self-Earned Prosperity)',
      category: 'dhana',
      presence: true,
      strength: 'strong',
      planets: ['moon', ...planetsInH2Moon],
      description: `Planet(s) occupy the 2nd house from Moon (${planetsInH2Moon.map(cap).join(', ')}), with 12th house from Moon vacant of non-solar planets.`,
      effect: 'Confers self-acquired wealth, sharp intelligence, high status, ethical wealth accumulation, and contented domestic life.',
    });
  } else if (hasH12Moon) {
    yogas.push({
      id: 'anapha_yoga',
      name: 'Anapha Yoga (Virtuous Self-Mastery)',
      category: 'auspicious',
      presence: true,
      strength: 'strong',
      planets: ['moon', ...planetsInH12Moon],
      description: `Planet(s) occupy the 12th house from Moon (${planetsInH12Moon.map(cap).join(', ')}), with 2nd house from Moon vacant of non-solar planets.`,
      effect: 'Confers physical vitality, polite and magnetic disposition, self-respect, moral integrity, and peace of mind.',
    });
  } else {
    // Kemadruma Yoga & Cancellation Check
    const kendrasFromMoon = [1, 4, 7, 10];
    const planetsInKendraFromMoon = chandraEligible.filter((p) =>
      kendrasFromMoon.includes(houseFrom(chart.grahas[p].signIndex, moon.signIndex)),
    );
    const planetsInKendraFromLagna = hasLagna
      ? chandraEligible.filter((p) => kendrasFromMoon.includes(houseOf(chart.grahas[p])))
      : [];
    const isMoonConjunctPlanet = chandraEligible.some((p) => chart.grahas[p].signIndex === moon.signIndex);
    const hasKemadrumaBhanga =
      isMoonConjunctPlanet || planetsInKendraFromMoon.length > 0 || planetsInKendraFromLagna.length > 0;

    yogas.push({
      id: 'kemadruma_yoga',
      name: hasKemadrumaBhanga ? 'Kemadruma Bhanga Yoga (Cancelled Lunar Solitude)' : 'Kemadruma Yoga (Lunar Isolation)',
      category: hasKemadrumaBhanga ? 'auspicious' : 'dosha',
      presence: true,
      strength: hasKemadrumaBhanga ? 'cancelled' : 'moderate',
      planets: ['moon'],
      cancellationNote: hasKemadrumaBhanga
        ? `Kemadruma is dissolved because ${
            isMoonConjunctPlanet
              ? 'Moon is conjunct a classical planet'
              : planetsInKendraFromMoon.length > 0
              ? `planets (${planetsInKendraFromMoon.map(cap).join(', ')}) occupy angular Kendras from Moon`
              : 'planets occupy angular Kendras from Lagna'
          }.`
        : undefined,
      description: hasKemadrumaBhanga
        ? `Neither 2nd nor 12th from Moon has planets, but classical cancellation (Kemadruma Bhanga) is fully active.`
        : 'Neither 2nd nor 12th from Moon hosts classical planets, calling for conscious self-reliance and disciplined resource cultivation.',
      effect: hasKemadrumaBhanga
        ? 'Converts initial isolation into formidable inner strength, self-reliance, and eventual rise to high leadership and respected authority.'
        : 'Tests mental fortitude and financial discipline in early life; advises cultivating strong advisory circles and steady routines.',
    });
  }

  // 21. Surya Yogas: Vesi, Vosi, Ubhayachari (Dr. Charak Ch. XXII)
  const suryaEligible: VedicGraha[] = ['mars', 'mercury', 'jupiter', 'venus', 'saturn'];
  const planetsInH2Sun = suryaEligible.filter((p) => houseFrom(chart.grahas[p].signIndex, sun.signIndex) === 2);
  const planetsInH12Sun = suryaEligible.filter((p) => houseFrom(chart.grahas[p].signIndex, sun.signIndex) === 12);
  const hasH2Sun = planetsInH2Sun.length > 0;
  const hasH12Sun = planetsInH12Sun.length > 0;

  if (hasH2Sun && hasH12Sun) {
    yogas.push({
      id: 'ubhayachari_yoga',
      name: 'Ubhayachari Yoga (Radiant Solar Symmetry)',
      category: 'auspicious',
      presence: true,
      strength: 'strong',
      planets: ['sun', ...planetsInH2Sun, ...planetsInH12Sun],
      description: `Planets occupy both the 2nd house (${planetsInH2Sun.map(cap).join(', ')}) and 12th house (${planetsInH12Sun.map(cap).join(', ')}) from natal Sun.`,
      effect: 'Bestows distinguished appearance, balanced executive judgment, persuasive eloquence, and broad public esteem.',
    });
  } else if (hasH2Sun) {
    yogas.push({
      id: 'vesi_yoga',
      name: 'Vesi Yoga (Solar Forefront Potency)',
      category: 'auspicious',
      presence: true,
      strength: 'moderate',
      planets: ['sun', ...planetsInH2Sun],
      description: `Planet(s) occupy the 2nd house from natal Sun (${planetsInH2Sun.map(cap).join(', ')}).`,
      effect: 'Confers steady determination, truthfulness, articulate speech, and progressive achievement of worldly goals.',
    });
  } else if (hasH12Sun) {
    yogas.push({
      id: 'vosi_yoga',
      name: 'Vosi Yoga (Solar Contemplative Depth)',
      category: 'auspicious',
      presence: true,
      strength: 'moderate',
      planets: ['sun', ...planetsInH12Sun],
      description: `Planet(s) occupy the 12th house from natal Sun (${planetsInH12Sun.map(cap).join(', ')}).`,
      effect: 'Confers sharp intellect, photographic memory, broad-minded outlook, and spiritual discernment.',
    });
  }

  // 22. Balarishta & Arishta Bhanga (Dr. Charak Ch. XVI)
  const isMoonDusthana = hasLagna && DUSTHANAS.includes(houseOf(moon));
  const maleficsAfflictingMoon = ['sun', 'mars', 'saturn', 'rahu', 'ketu'].filter((m) => {
    const mGraha = chart.grahas[m as VedicGraha];
    const sep = angularSep(moon.lon, mGraha.lon);
    return sep <= 12 || houseFrom(mGraha.signIndex, moon.signIndex) === 7;
  });
  const hasBalarishtaRisk = isMoonDusthana && maleficsAfflictingMoon.length > 0;

  // Classical Arishta Bhanga (Cancellations)
  const jupInLagna = hasLagna && houseOf(jupiter) === 1;
  const exaltedBeneficInKendra = (['jupiter', 'venus', 'mercury'] as const).some((b) => {
    const bg = chart.grahas[b];
    return hasLagna && KENDRAS.includes(houseOf(bg)) && bg.dignity === 'exalted';
  });
  const beneficInLagna = hasLagna && (houseOf(jupiter) === 1 || houseOf(venus) === 1);
  const hasArishtaBhanga = jupInLagna || exaltedBeneficInKendra || beneficInLagna;

  yogas.push({
    id: 'arishta_bhanga',
    name: hasBalarishtaRisk ? (hasArishtaBhanga ? 'Arishta Bhanga Yoga (Affliction Cancelled)' : 'Balarishta Check') : 'Arishta Bhanga Shield',
    category: hasBalarishtaRisk && !hasArishtaBhanga ? 'dosha' : 'auspicious',
    presence: hasBalarishtaRisk || hasArishtaBhanga,
    strength: hasBalarishtaRisk && !hasArishtaBhanga ? 'moderate' : hasArishtaBhanga ? 'strong' : 'absent',
    planets: ['moon', 'jupiter'],
    cancellationNote: hasBalarishtaRisk && hasArishtaBhanga
      ? 'Early planetary affliction is neutralized by powerful benefic protection in the Ascendant/Kendras.'
      : undefined,
    description: hasBalarishtaRisk
      ? hasArishtaBhanga
        ? `Moon in dusthana H${houseOf(moon)} with malefic aspect is fully shielded by classical Arishta Bhanga (${jupInLagna ? 'Jupiter in Lagna' : 'Benefics in Kendra'}).`
        : `Moon in dusthana H${houseOf(moon)} afflicted by ${maleficsAfflictingMoon.map(cap).join(', ')}.`
      : hasArishtaBhanga
      ? 'Auspicious planetary shield in Ascendant/Kendra grants robust constitutional vitality from early childhood.'
      : 'No adverse Balarishta factors present; vital constitution is stable.',
    effect: hasBalarishtaRisk && !hasArishtaBhanga
      ? 'Advises attentive pediatric care, protective mantras (Maha Mrityunjaya), and balanced vitality management.'
      : 'Bestows constitutional resilience, protective grace against accidents or early ailments, and longevity.',
  });

  // 23. Classical 32 Nabhasa Yogas (Dr. Charak Ch. XX)
  // Uses exclusively the 7 classical planets (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn)
  type ClassicalSevenGraha = 'sun' | 'moon' | 'mars' | 'mercury' | 'jupiter' | 'venus' | 'saturn';
  const sevenGrahas: ClassicalSevenGraha[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];
  const sevenDetails = sevenGrahas.map((p) => chart.grahas[p]);
  const signsOccupied = Array.from(new Set(sevenDetails.map((g) => g.signIndex)));
  const housesOccupied = Array.from(new Set(sevenDetails.map((g) => houseOf(g))));

  // A. Ashraya Yogas (Movable, Fixed, Dual)
  const movableSigns = [0, 3, 6, 9]; // Aries, Cancer, Libra, Capricorn
  const fixedSigns = [1, 4, 7, 10];  // Taurus, Leo, Scorpio, Aquarius
  const dualSigns = [2, 5, 8, 11];   // Gemini, Virgo, Sagittarius, Pisces

  const isRajju = sevenDetails.every((g) => movableSigns.includes(g.signIndex));
  const isMusala = sevenDetails.every((g) => fixedSigns.includes(g.signIndex));
  const isNala = sevenDetails.every((g) => dualSigns.includes(g.signIndex));

  if (isRajju) {
    yogas.push({
      id: 'nabhasa_rajju',
      name: 'Rajju Yoga (Ashraya Nabhasa)',
      category: 'auspicious',
      presence: true,
      strength: 'strong',
      planets: sevenGrahas,
      description: 'All 7 classical planets occupy Chara (Movable) signs (Aries, Cancer, Libra, Capricorn).',
      effect: 'Fond of travel, dynamic, adaptable, ambitious, thriving in foreign environments or ventures on the move.',
    });
  } else if (isMusala) {
    yogas.push({
      id: 'nabhasa_musala',
      name: 'Musala Yoga (Ashraya Nabhasa)',
      category: 'auspicious',
      presence: true,
      strength: 'strong',
      planets: sevenGrahas,
      description: 'All 7 classical planets occupy Sthira (Fixed) signs (Taurus, Leo, Scorpio, Aquarius).',
      effect: 'Steadfast, trustworthy, enduring determination, accumulated wealth, and proud self-reliance.',
    });
  } else if (isNala) {
    yogas.push({
      id: 'nabhasa_nala',
      name: 'Nala Yoga (Ashraya Nabhasa)',
      category: 'auspicious',
      presence: true,
      strength: 'strong',
      planets: sevenGrahas,
      description: 'All 7 classical planets occupy Dvisvabhava (Dual) signs (Gemini, Virgo, Sagittarius, Pisces).',
      effect: 'Versatile, multitalented, analytical, adaptable intellect, and adept in varied intellectual arts.',
    });
  }

  // B. Aakriti Yogas (Geometrical arrangements)
  const kendrasOnly = housesOccupied.every((h) => KENDRAS.includes(h));
  const isKamala = kendrasOnly && KENDRAS.every((k) => housesOccupied.includes(k));
  const isGada = kendrasOnly && (
    (housesOccupied.every((h) => h === 1 || h === 4)) ||
    (housesOccupied.every((h) => h === 4 || h === 7)) ||
    (housesOccupied.every((h) => h === 7 || h === 10)) ||
    (housesOccupied.every((h) => h === 10 || h === 1))
  );
  const isShakataAakriti = kendrasOnly && housesOccupied.every((h) => h === 1 || h === 7);
  const isVihaga = kendrasOnly && housesOccupied.every((h) => h === 4 || h === 10);
  const isShringataka = housesOccupied.every((h) => TRIKONAS.includes(h)) && TRIKONAS.every((t) => housesOccupied.includes(t));
  const isHala = (
    housesOccupied.every((h) => [2, 6, 10].includes(h)) ||
    housesOccupied.every((h) => [3, 7, 11].includes(h)) ||
    housesOccupied.every((h) => [4, 8, 12].includes(h))
  );

  if (isKamala) {
    yogas.push({
      id: 'nabhasa_kamala',
      name: 'Kamala Yoga (Aakriti Nabhasa)',
      category: 'raja',
      presence: true,
      strength: 'strong',
      planets: sevenGrahas,
      description: 'All 7 classical planets are distributed across all four angular Kendras (1st, 4th, 7th, 10th houses).',
      effect: 'Bestows monumental fame, widespread virtue, lasting authority, spotless character, and kingly fortune.',
    });
  } else if (isGada) {
    yogas.push({
      id: 'nabhasa_gada',
      name: 'Gada Yoga (Aakriti Nabhasa)',
      category: 'auspicious',
      presence: true,
      strength: 'moderate',
      planets: sevenGrahas,
      description: 'All 7 classical planets occupy two adjacent Kendras.',
      effect: 'Dedicated to enterprise, perseverant, skilled in finance and commerce, wealth through resolute effort.',
    });
  } else if (isShakataAakriti) {
    yogas.push({
      id: 'nabhasa_shakata',
      name: 'Shakata Yoga (Aakriti Nabhasa)',
      category: 'neutral',
      presence: true,
      strength: 'moderate',
      planets: sevenGrahas,
      description: 'All 7 classical planets are confined strictly to the 1st and 7th houses.',
      effect: 'Cyclical fortune with periodic swings between high effort and achievement; skilled in transit and transport.',
    });
  } else if (isVihaga) {
    yogas.push({
      id: 'nabhasa_vihaga',
      name: 'Vihaga Yoga (Aakriti Nabhasa)',
      category: 'auspicious',
      presence: true,
      strength: 'moderate',
      planets: sevenGrahas,
      description: 'All 7 classical planets occupy exclusively the 4th and 10th houses.',
      effect: 'Nomadic disposition, roaming spirit, ambassadorial skills, communication acumen, and active public life.',
    });
  } else if (isShringataka) {
    yogas.push({
      id: 'nabhasa_shringataka',
      name: 'Shringataka Yoga (Aakriti Nabhasa)',
      category: 'raja',
      presence: true,
      strength: 'strong',
      planets: sevenGrahas,
      description: 'All 7 classical planets occupy the sacred Trikonas (1st, 5th, and 9th houses).',
      effect: 'Blessed with supreme good fortune, scholarly distinction, moral courage, fond of battles and victory.',
    });
  } else if (isHala) {
    yogas.push({
      id: 'nabhasa_hala',
      name: 'Hala Yoga (Aakriti Nabhasa)',
      category: 'auspicious',
      presence: true,
      strength: 'moderate',
      planets: sevenGrahas,
      description: 'All 7 classical planets occupy trines from houses other than the ascendant.',
      effect: 'Grounded work ethic, wealth through agriculture, construction, production, and untiring industry.',
    });
  }

  // C. Sankhya Yogas (Classified by the count of distinct occupied signs)
  const countSigns = signsOccupied.length;
  const sankhyaDefs: Record<number, { id: string; name: string; effect: string }> = {
    7: { id: 'sankhya_vallaki', name: 'Vallaki (Veena) Yoga', effect: 'Connoisseur of fine arts, music, eloquent speech, broad learning, and pleasant company.' },
    6: { id: 'sankhya_dama', name: 'Dama Yoga', effect: 'Generous, philanthropic, helping others, wealthy, and dignified in conduct.' },
    5: { id: 'sankhya_pasha', name: 'Pasha Yoga', effect: 'Skilled administrator, managing large households or organizations, resourceful in complex settings.' },
    4: { id: 'sankhya_kedara', name: 'Kedara Yoga', effect: 'Agricultural wealth, estate owner, practical, charitable, steady pillar of family or community.' },
    3: { id: 'sankhya_shoola', name: 'Shoola Yoga', effect: 'Courageous, tenacious, sharp wit, assertive, thriving in competitive or strategic arenas.' },
    2: { id: 'sankhya_yuga', name: 'Yuga Yoga', effect: 'Unconventional, pioneering thinker, living by independent principles and non-traditional paths.' },
    1: { id: 'sankhya_gola', name: 'Gola Yoga', effect: 'Intense single-point concentration, ascetic or reclusive drive, unconventional life journey.' },
  };

  const sankhya = sankhyaDefs[countSigns];
  if (sankhya) {
    yogas.push({
      id: sankhya.id,
      name: `${sankhya.name} (Sankhya Nabhasa)`,
      category: 'auspicious',
      presence: true,
      strength: countSigns >= 5 ? 'strong' : 'moderate',
      planets: sevenGrahas,
      description: `All 7 classical planets are distributed across ${countSigns} distinct zodiac sign${countSigns > 1 ? 's' : ''}.`,
      effect: sankhya.effect,
    });
  }

  return yogas;
};
