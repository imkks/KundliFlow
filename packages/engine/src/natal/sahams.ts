import { norm360, SIGNS } from '../angles.js';
import { houseFromSign, type NatalChart } from './positions.js';
import { SIGN_LORDS, type GrahaDetail } from './types.js';

export interface SahamDefinition {
  id: string;
  name: string;
  sanskritName: string;
  meaning: string;
  category: 'vital' | 'wealth' | 'career' | 'relationship' | 'family' | 'spirituality' | 'adversity';
  sameDayNight?: boolean;
}

export interface SahamResult {
  id: string;
  name: string;
  sanskritName: string;
  meaning: string;
  category: SahamDefinition['category'];
  lon: number;
  sign: string;
  signIndex: number;
  degreeInSign: number;
  formatted: string;
  houseFromLagna: number;
  lord: string;
  lordHarshaBala?: number;
  arcRuleApplied: boolean;
  isKendraOrTrikona: boolean;
  fructification: 'high' | 'moderate' | 'low';
  assessment: string;
}

/**
 * Checks if point C lies on the zodiacal arc starting at B and moving forward to A.
 * If C does NOT lie on the arc from B to A, 30° must be added to (A - B + C) mod 360.
 */
export function isPointOnArc(a: number, b: number, c: number): boolean {
  const arcLength = (a - b + 360) % 360;
  const distC = (c - b + 360) % 360;
  return distC <= arcLength;
}

/**
 * Evaluates raw Saham formula:
 * Day: A - B + C
 * Night: B - A + C (unless sameDayNight is true)
 * If C is not on the arc from the subtracted point to the added point, +30° is added.
 */
export function computeRawSaham(
  termA: number,
  termB: number,
  termC: number,
  isDay: boolean,
  sameDayNight = false,
): { lon: number; arcRuleApplied: boolean } {
  // If night and not sameDayNight, swap A and B
  const effectiveA = !isDay && !sameDayNight ? termB : termA;
  const effectiveB = !isDay && !sameDayNight ? termA : termB;

  const raw = norm360(effectiveA - effectiveB + termC);
  const onArc = isPointOnArc(effectiveA, effectiveB, termC);
  const arcRuleApplied = !onArc;
  const lon = norm360(raw + (arcRuleApplied ? 30 : 0));

  return { lon, arcRuleApplied };
}

/**
 * 36 Classical Tajika Sahams (PVR Rao Table 74 & Dr. K.S. Charak Ch. XXV)
 */
export const SAHAM_DEFINITIONS: readonly SahamDefinition[] = [
  { id: 'punya', name: 'Punya', sanskritName: 'पुण्य सहम', meaning: 'Fortune, spiritual merit and auspicious grace', category: 'vital' },
  { id: 'vidya', name: 'Vidya', sanskritName: 'विद्या सहम', meaning: 'Education, wisdom and intellect', category: 'vital' },
  { id: 'yasas', name: 'Yasas', sanskritName: 'यशस् सहम', meaning: 'Fame, prestige and public acclaim', category: 'career' },
  { id: 'mitra', name: 'Mitra', sanskritName: 'मित्र सहम', meaning: 'Friendship, alliances and social goodwill', category: 'relationship' },
  { id: 'mahatmya', name: 'Mahatmya', sanskritName: 'माहात्म्य सहम', meaning: 'Greatness, nobility and spiritual influence', category: 'vital' },
  { id: 'asha', name: 'Asha', sanskritName: 'आशा सहम', meaning: 'Hopes, desires and ambitions', category: 'vital' },
  { id: 'samartha', name: 'Samartha', sanskritName: 'समर्थ सहम', meaning: 'Enterprise, competence and capability', category: 'career' },
  { id: 'bhratri', name: 'Bhratri', sanskritName: 'भ्रातृ सहम', meaning: 'Brothers, siblings and co-borns', category: 'family', sameDayNight: true },
  { id: 'gaurava', name: 'Gaurava', sanskritName: 'गौरव सहम', meaning: 'Honor, respect and self-esteem', category: 'career' },
  { id: 'pitri', name: 'Pitri', sanskritName: 'पितृ सहम', meaning: 'Father, paternal lineage and ancestry', category: 'family' },
  { id: 'rajya', name: 'Rajya', sanskritName: 'राज्य सहम', meaning: 'Power, kingdom, coronation and authority', category: 'career' },
  { id: 'matri', name: 'Matri', sanskritName: 'मातृ सहम', meaning: 'Mother, maternal nurturing and emotional peace', category: 'family' },
  { id: 'putra', name: 'Putra', sanskritName: 'पुत्र सहम', meaning: 'Children, progeny and creative works', category: 'family' },
  { id: 'jeeva', name: 'Jeeva', sanskritName: 'जीव सहम', meaning: 'Life force, longevity and vitality', category: 'vital' },
  { id: 'karma', name: 'Karma', sanskritName: 'कर्म सहम', meaning: 'Work, occupation, career and duties', category: 'career' },
  { id: 'roga', name: 'Roga', sanskritName: 'रोग सहम', meaning: 'Disease, physical debility and ailments', category: 'adversity' },
  { id: 'kali', name: 'Kali', sanskritName: 'कलि सहम', meaning: 'Disputes, strife, litigation and misfortune', category: 'adversity' },
  { id: 'sastra', name: 'Sastra', sanskritName: 'शास्त्र सहम', meaning: 'Sciences, deep scholarship and scriptures', category: 'spirituality' },
  { id: 'bandhu', name: 'Bandhu', sanskritName: 'बन्धु सहम', meaning: 'Relatives, kinsmen and family support', category: 'family' },
  { id: 'mrityu', name: 'Mrityu', sanskritName: 'मृत्यु सहम', meaning: 'Death, severe danger and mortality', category: 'adversity', sameDayNight: true },
  { id: 'paradesa', name: 'Paradesa', sanskritName: 'परदेश सहम', meaning: 'Foreign travel, residence abroad and journeys', category: 'vital', sameDayNight: true },
  { id: 'artha', name: 'Artha', sanskritName: 'अर्थ सहम', meaning: 'Wealth, finances, money and material prosperity', category: 'wealth', sameDayNight: true },
  { id: 'paradara', name: 'Paradara', sanskritName: 'परदार सहम', meaning: 'Illicit relations or attraction to others', category: 'relationship' },
  { id: 'vanik', name: 'Vanik', sanskritName: 'वणिक् सहम', meaning: 'Commerce, trade, trading ventures and transactions', category: 'wealth' },
  { id: 'karyasiddhi', name: 'Karyasiddhi', sanskritName: 'कार्यसिद्धि सहम', meaning: 'Success in undertakings and realization of plans', category: 'career' },
  { id: 'vivaha', name: 'Vivaha', sanskritName: 'विवाह सहम', meaning: 'Marriage, betrothal and union', category: 'relationship' },
  { id: 'santapa', name: 'Santapa', sanskritName: 'सन्ताप सहम', meaning: 'Sorrow, anguish and grief', category: 'adversity' },
  { id: 'sraddha', name: 'Sraddha', sanskritName: 'श्रद्धा सहम', meaning: 'Faith, sincerity and devotion', category: 'spirituality' },
  { id: 'preeti', name: 'Preeti', sanskritName: 'प्रीति सहम', meaning: 'Love, affection and emotional warmth', category: 'relationship' },
  { id: 'jadya', name: 'Jadya', sanskritName: 'जाड्य सहम', meaning: 'Chronic sickness, lethargy and stupor', category: 'adversity' },
  { id: 'vyapara', name: 'Vyapara', sanskritName: 'व्यापार सहम', meaning: 'Business enterprise and commercial industry', category: 'wealth', sameDayNight: true },
  { id: 'satru', name: 'Satru', sanskritName: 'शत्रु सहम', meaning: 'Enemies, competitors and adversaries', category: 'adversity' },
  { id: 'jalapatana', name: 'Jalapatana', sanskritName: 'जलपतन सहम', meaning: 'Crossing oceans, sea voyages and water voyages', category: 'vital' },
  { id: 'bandhana', name: 'Bandhana', sanskritName: 'बन्धन सहम', meaning: 'Bondage, confinement, captivity and restriction', category: 'adversity' },
  { id: 'apamrityu', name: 'Apamrityu', sanskritName: 'अपमृत्यु सहम', meaning: 'Untimely injury, accident or sudden distress', category: 'adversity' },
  { id: 'labha', name: 'Labha', sanskritName: 'लाभ सहम', meaning: 'Profits, material gains, inflows and returns', category: 'wealth', sameDayNight: true },
];

/**
 * Formats decimal longitude into Sign Deg°Min'
 */
function formatLon(lon: number): { sign: string; signIndex: number; degreeInSign: number; formatted: string } {
  const norm = norm360(lon);
  const signIndex = Math.floor(norm / 30);
  const sign = SIGNS[signIndex]!;
  const degreeInSign = norm % 30;
  const deg = Math.floor(degreeInSign);
  const min = Math.round((degreeInSign - deg) * 60);
  const formatted = `${deg}°${min.toString().padStart(2, '0')}' ${sign}`;
  return { sign, signIndex, degreeInSign, formatted };
}

/**
 * Computes all Tajika Sahams for an annual chart.
 */
export function computeAnnualSahams(
  annualChart: NatalChart,
  isDay: boolean,
  harshaBala?: Record<string, number>,
): { sahams: Record<string, SahamResult>; sahamsList: SahamResult[] } {
  const lagnaLon = annualChart.lagna?.lon ?? 0;
  const lagnaSignIdx = annualChart.lagna?.signIndex ?? Math.floor(lagnaLon / 30);
  const lagnaLord = SIGN_LORDS[lagnaSignIdx]!;

  const grahas = annualChart.grahas as Record<string, GrahaDetail>;
  const getG = (name: string): number => grahas[name]?.lon ?? 0;

  // House cusps in Tajaka equal house system (H_n = Lagna + (n - 1) * 30)
  const getH = (n: number): number => norm360(lagnaLon + (n - 1) * 30);
  const getHLord = (n: number): string => SIGN_LORDS[Math.floor(getH(n) / 30)]!;

  const sunSign = grahas.sun ? grahas.sun.signIndex : 0;
  const sunSignLord = SIGN_LORDS[sunSign]!;
  const sunSignLordLon = getG(sunSignLord);

  const moonSign = grahas.moon ? grahas.moon.signIndex : 0;
  const moonSignLord = SIGN_LORDS[moonSign]!;
  const moonSignLordLon = getG(moonSignLord);

  // Intermediate storage for Sahams needed by other Sahams
  const computedPoints: Record<string, number> = {};
  const results: Record<string, SahamResult> = {};
  const list: SahamResult[] = [];

  const addResult = (
    def: SahamDefinition,
    lon: number,
    arcRuleApplied: boolean,
  ): SahamResult => {
    computedPoints[def.id] = lon;
    const { sign, signIndex, degreeInSign, formatted } = formatLon(lon);
    const houseFromLagna = houseFromSign(signIndex, lagnaSignIdx);
    const lord = SIGN_LORDS[signIndex]!;
    const lordBala = harshaBala ? harshaBala[lord] : undefined;

    const isKendra = [1, 4, 7, 10].includes(houseFromLagna);
    const isTrikona = [5, 9].includes(houseFromLagna);
    const isDusthana = [6, 8, 12].includes(houseFromLagna);
    const isKendraOrTrikona = isKendra || isTrikona;

    let fructification: 'high' | 'moderate' | 'low';
    if (def.category === 'adversity') {
      // For adverse points, dusthana placement or afflicted lord is dangerous; kendra/trikona brings it to prominence
      fructification = isKendraOrTrikona || (lordBala !== undefined && lordBala < 5) ? 'high' : 'low';
    } else {
      if (isKendraOrTrikona && (lordBala === undefined || lordBala >= 10)) {
        fructification = 'high';
      } else if (isDusthana || (lordBala !== undefined && lordBala < 5)) {
        fructification = 'low';
      } else {
        fructification = 'moderate';
      }
    }

    let assessment = `${def.name} Saham in H${houseFromLagna} (${sign})`;
    if (isKendraOrTrikona) assessment += ' in auspicious angle/trine';
    if (arcRuleApplied) assessment += ' (+30° arc rule applied)';
    if (lordBala !== undefined) assessment += `, lord ${lord.toUpperCase()} Harsha Bala: ${lordBala}/20`;

    const res: SahamResult = {
      id: def.id,
      name: def.name,
      sanskritName: def.sanskritName,
      meaning: def.meaning,
      category: def.category,
      lon,
      sign,
      signIndex,
      degreeInSign,
      formatted,
      houseFromLagna,
      lord,
      lordHarshaBala: lordBala,
      arcRuleApplied,
      isKendraOrTrikona,
      fructification,
      assessment,
    };

    results[def.id] = res;
    list.push(res);
    return res;
  };

  // 1. Punya Saham (Day: Moon - Sun + Lagna; Night: Sun - Moon + Lagna)
  const punyaDef = SAHAM_DEFINITIONS.find((d) => d.id === 'punya')!;
  const punyaRaw = computeRawSaham(getG('moon'), getG('sun'), lagnaLon, isDay);
  addResult(punyaDef, punyaRaw.lon, punyaRaw.arcRuleApplied);

  // 2. Vidya Saham (Day: Sun - Moon + Lagna; Night: Moon - Sun + Lagna)
  const vidyaDef = SAHAM_DEFINITIONS.find((d) => d.id === 'vidya')!;
  const vidyaRaw = computeRawSaham(getG('sun'), getG('moon'), lagnaLon, isDay);
  addResult(vidyaDef, vidyaRaw.lon, vidyaRaw.arcRuleApplied);

  // 3. Yasas Saham (Day: Jup - Punya + Lagna; Night: Punya - Jup + Lagna)
  const yasasDef = SAHAM_DEFINITIONS.find((d) => d.id === 'yasas')!;
  const yasasRaw = computeRawSaham(getG('jupiter'), computedPoints.punya!, lagnaLon, isDay);
  addResult(yasasDef, yasasRaw.lon, yasasRaw.arcRuleApplied);

  // 4. Mitra Saham (Day: Jup - Punya + Venus; Night: Punya - Jup + Venus)
  const mitraDef = SAHAM_DEFINITIONS.find((d) => d.id === 'mitra')!;
  const mitraRaw = computeRawSaham(getG('jupiter'), computedPoints.punya!, getG('venus'), isDay);
  addResult(mitraDef, mitraRaw.lon, mitraRaw.arcRuleApplied);

  // 5. Mahatmya Saham (Day: Punya - Mars + Lagna; Night: Mars - Punya + Lagna)
  const mahatmyaDef = SAHAM_DEFINITIONS.find((d) => d.id === 'mahatmya')!;
  const mahatmyaRaw = computeRawSaham(computedPoints.punya!, getG('mars'), lagnaLon, isDay);
  addResult(mahatmyaDef, mahatmyaRaw.lon, mahatmyaRaw.arcRuleApplied);

  // 6. Asha Saham (Day: Sat - Mars + Lagna; Night: Mars - Sat + Lagna)
  const ashaDef = SAHAM_DEFINITIONS.find((d) => d.id === 'asha')!;
  const ashaRaw = computeRawSaham(getG('saturn'), getG('mars'), lagnaLon, isDay);
  addResult(ashaDef, ashaRaw.lon, ashaRaw.arcRuleApplied);

  // 7. Samartha Saham (Day: Mars - LagnaLord + Lagna; if Mars is LagnaLord: Jup - Mars + Lagna)
  // Night: LagnaLord - Mars + Lagna; if Mars is LagnaLord: Mars - Jup + Lagna
  const samarthaDef = SAHAM_DEFINITIONS.find((d) => d.id === 'samartha')!;
  let samarthaA = getG('mars');
  let samarthaB = getG(lagnaLord);
  if (lagnaLord === 'mars') {
    samarthaA = getG('jupiter');
    samarthaB = getG('mars');
  }
  const samarthaRaw = computeRawSaham(samarthaA, samarthaB, lagnaLon, isDay);
  addResult(samarthaDef, samarthaRaw.lon, samarthaRaw.arcRuleApplied);

  // 8. Bhratri Saham (Jup - Sat + Lagna, same day/night)
  const bhratriDef = SAHAM_DEFINITIONS.find((d) => d.id === 'bhratri')!;
  const bhratriRaw = computeRawSaham(getG('jupiter'), getG('saturn'), lagnaLon, isDay, true);
  addResult(bhratriDef, bhratriRaw.lon, bhratriRaw.arcRuleApplied);

  // 9. Gaurava Saham (Day: Jup - Moon + Sun; Night: Moon - Jup + Sun)
  const gauravaDef = SAHAM_DEFINITIONS.find((d) => d.id === 'gaurava')!;
  const gauravaRaw = computeRawSaham(getG('jupiter'), getG('moon'), getG('sun'), isDay);
  addResult(gauravaDef, gauravaRaw.lon, gauravaRaw.arcRuleApplied);

  // 10. Pitri Saham (Day: Sat - Sun + Lagna; Night: Sun - Sat + Lagna)
  const pitriDef = SAHAM_DEFINITIONS.find((d) => d.id === 'pitri')!;
  const pitriRaw = computeRawSaham(getG('saturn'), getG('sun'), lagnaLon, isDay);
  addResult(pitriDef, pitriRaw.lon, pitriRaw.arcRuleApplied);

  // 11. Rajya Saham (Day: Sat - Sun + Lagna; Night: Sun - Sat + Lagna)
  const rajyaDef = SAHAM_DEFINITIONS.find((d) => d.id === 'rajya')!;
  const rajyaRaw = computeRawSaham(getG('saturn'), getG('sun'), lagnaLon, isDay);
  addResult(rajyaDef, rajyaRaw.lon, rajyaRaw.arcRuleApplied);

  // 12. Matri Saham (Day: Moon - Venus + Lagna; Night: Venus - Moon + Lagna)
  const matriDef = SAHAM_DEFINITIONS.find((d) => d.id === 'matri')!;
  const matriRaw = computeRawSaham(getG('moon'), getG('venus'), lagnaLon, isDay);
  addResult(matriDef, matriRaw.lon, matriRaw.arcRuleApplied);

  // 13. Putra Saham (Day: Jup - Moon + Lagna; Night: Moon - Jup + Lagna)
  const putraDef = SAHAM_DEFINITIONS.find((d) => d.id === 'putra')!;
  const putraRaw = computeRawSaham(getG('jupiter'), getG('moon'), lagnaLon, isDay);
  addResult(putraDef, putraRaw.lon, putraRaw.arcRuleApplied);

  // 14. Jeeva Saham (Day: Sat - Jup + Lagna; Night: Jup - Sat + Lagna)
  const jeevaDef = SAHAM_DEFINITIONS.find((d) => d.id === 'jeeva')!;
  const jeevaRaw = computeRawSaham(getG('saturn'), getG('jupiter'), lagnaLon, isDay);
  addResult(jeevaDef, jeevaRaw.lon, jeevaRaw.arcRuleApplied);

  // 15. Karma Saham (Day: Mars - Merc + Lagna; Night: Merc - Mars + Lagna)
  const karmaDef = SAHAM_DEFINITIONS.find((d) => d.id === 'karma')!;
  const karmaRaw = computeRawSaham(getG('mars'), getG('mercury'), lagnaLon, isDay);
  addResult(karmaDef, karmaRaw.lon, karmaRaw.arcRuleApplied);

  // 16. Roga Saham (Day: Lagna - Moon + Lagna; Night: Moon - Lagna + Lagna)
  const rogaDef = SAHAM_DEFINITIONS.find((d) => d.id === 'roga')!;
  const rogaRaw = computeRawSaham(lagnaLon, getG('moon'), lagnaLon, isDay);
  addResult(rogaDef, rogaRaw.lon, rogaRaw.arcRuleApplied);

  // 17. Kali Saham (Day: Jup - Mars + Lagna; Night: Mars - Jup + Lagna)
  const kaliDef = SAHAM_DEFINITIONS.find((d) => d.id === 'kali')!;
  const kaliRaw = computeRawSaham(getG('jupiter'), getG('mars'), lagnaLon, isDay);
  addResult(kaliDef, kaliRaw.lon, kaliRaw.arcRuleApplied);

  // 18. Sastra Saham (Day: Jup - Sat + Mercury; Night: Sat - Jup + Mercury)
  const sastraDef = SAHAM_DEFINITIONS.find((d) => d.id === 'sastra')!;
  const sastraRaw = computeRawSaham(getG('jupiter'), getG('saturn'), getG('mercury'), isDay);
  addResult(sastraDef, sastraRaw.lon, sastraRaw.arcRuleApplied);

  // 19. Bandhu Saham (Day: Merc - Moon + Lagna; Night: Moon - Merc + Lagna)
  const bandhuDef = SAHAM_DEFINITIONS.find((d) => d.id === 'bandhu')!;
  const bandhuRaw = computeRawSaham(getG('mercury'), getG('moon'), lagnaLon, isDay);
  addResult(bandhuDef, bandhuRaw.lon, bandhuRaw.arcRuleApplied);

  // 20. Mrityu Saham (H8 - Moon + Lagna, same day/night)
  const mrityuDef = SAHAM_DEFINITIONS.find((d) => d.id === 'mrityu')!;
  const mrityuRaw = computeRawSaham(getH(8), getG('moon'), lagnaLon, isDay, true);
  addResult(mrityuDef, mrityuRaw.lon, mrityuRaw.arcRuleApplied);

  // 21. Paradesa Saham (H9 - L9 + Lagna, same day/night)
  const paradesaDef = SAHAM_DEFINITIONS.find((d) => d.id === 'paradesa')!;
  const paradesaRaw = computeRawSaham(getH(9), getG(getHLord(9)), lagnaLon, isDay, true);
  addResult(paradesaDef, paradesaRaw.lon, paradesaRaw.arcRuleApplied);

  // 22. Artha Saham (H2 - L2 + Lagna, same day/night)
  const arthaDef = SAHAM_DEFINITIONS.find((d) => d.id === 'artha')!;
  const arthaRaw = computeRawSaham(getH(2), getG(getHLord(2)), lagnaLon, isDay, true);
  addResult(arthaDef, arthaRaw.lon, arthaRaw.arcRuleApplied);

  // 23. Paradara Saham (Day: Venus - Sun + Lagna; Night: Sun - Venus + Lagna)
  const paradaraDef = SAHAM_DEFINITIONS.find((d) => d.id === 'paradara')!;
  const paradaraRaw = computeRawSaham(getG('venus'), getG('sun'), lagnaLon, isDay);
  addResult(paradaraDef, paradaraRaw.lon, paradaraRaw.arcRuleApplied);

  // 24. Vanik Saham (Day: Moon - Merc + Lagna; Night: Merc - Moon + Lagna)
  const vanikDef = SAHAM_DEFINITIONS.find((d) => d.id === 'vanik')!;
  const vanikRaw = computeRawSaham(getG('moon'), getG('mercury'), lagnaLon, isDay);
  addResult(vanikDef, vanikRaw.lon, vanikRaw.arcRuleApplied);

  // 25. Karyasiddhi Saham (Day: Sat - Sun + LordOfSunSign; Night: Sat - Moon + LordOfMoonSign)
  const karyasiddhiDef = SAHAM_DEFINITIONS.find((d) => d.id === 'karyasiddhi')!;
  const karyasiddhiRaw = isDay
    ? computeRawSaham(getG('saturn'), getG('sun'), sunSignLordLon, true, true)
    : computeRawSaham(getG('saturn'), getG('moon'), moonSignLordLon, true, true);
  addResult(karyasiddhiDef, karyasiddhiRaw.lon, karyasiddhiRaw.arcRuleApplied);

  // 26. Vivaha Saham (Day: Venus - Sat + Lagna; Night: Sat - Venus + Lagna)
  const vivahaDef = SAHAM_DEFINITIONS.find((d) => d.id === 'vivaha')!;
  const vivahaRaw = computeRawSaham(getG('venus'), getG('saturn'), lagnaLon, isDay);
  addResult(vivahaDef, vivahaRaw.lon, vivahaRaw.arcRuleApplied);

  // 27. Santapa Saham (Day: Sat - Moon + H6; Night: Moon - Sat + H6)
  const santapaDef = SAHAM_DEFINITIONS.find((d) => d.id === 'santapa')!;
  const santapaRaw = computeRawSaham(getG('saturn'), getG('moon'), getH(6), isDay);
  addResult(santapaDef, santapaRaw.lon, santapaRaw.arcRuleApplied);

  // 28. Sraddha Saham (Day: Venus - Mars + Lagna; Night: Mars - Venus + Lagna)
  const sraddhaDef = SAHAM_DEFINITIONS.find((d) => d.id === 'sraddha')!;
  const sraddhaRaw = computeRawSaham(getG('venus'), getG('mars'), lagnaLon, isDay);
  addResult(sraddhaDef, sraddhaRaw.lon, sraddhaRaw.arcRuleApplied);

  // 29. Preeti Saham (Day: Sastra - Punya + Lagna; Night: Punya - Sastra + Lagna)
  const preetiDef = SAHAM_DEFINITIONS.find((d) => d.id === 'preeti')!;
  const preetiRaw = computeRawSaham(computedPoints.sastra!, computedPoints.punya!, lagnaLon, isDay);
  addResult(preetiDef, preetiRaw.lon, preetiRaw.arcRuleApplied);

  // 30. Jadya Saham (Day: Mars - Sat + Mercury; Night: Sat - Mars + Mercury)
  const jadyaDef = SAHAM_DEFINITIONS.find((d) => d.id === 'jadya')!;
  const jadyaRaw = computeRawSaham(getG('mars'), getG('saturn'), getG('mercury'), isDay);
  addResult(jadyaDef, jadyaRaw.lon, jadyaRaw.arcRuleApplied);

  // 31. Vyapara Saham (Mars - Sat + Lagna, same day/night)
  const vyaparaDef = SAHAM_DEFINITIONS.find((d) => d.id === 'vyapara')!;
  const vyaparaRaw = computeRawSaham(getG('mars'), getG('saturn'), lagnaLon, isDay, true);
  addResult(vyaparaDef, vyaparaRaw.lon, vyaparaRaw.arcRuleApplied);

  // 32. Satru Saham (Day: Mars - Sat + Lagna; Night: Sat - Mars + Lagna)
  const satruDef = SAHAM_DEFINITIONS.find((d) => d.id === 'satru')!;
  const satruRaw = computeRawSaham(getG('mars'), getG('saturn'), lagnaLon, isDay);
  addResult(satruDef, satruRaw.lon, satruRaw.arcRuleApplied);

  // 33. Jalapatana Saham (Cancer 15° [105°] - Sat + Lagna; Night: Sat - Cancer 15° + Lagna)
  const jalapatanaDef = SAHAM_DEFINITIONS.find((d) => d.id === 'jalapatana')!;
  const jalapatanaRaw = computeRawSaham(105, getG('saturn'), lagnaLon, isDay);
  addResult(jalapatanaDef, jalapatanaRaw.lon, jalapatanaRaw.arcRuleApplied);

  // 34. Bandhana Saham (Day: Punya - Sat + Lagna; Night: Sat - Punya + Lagna)
  const bandhanaDef = SAHAM_DEFINITIONS.find((d) => d.id === 'bandhana')!;
  const bandhanaRaw = computeRawSaham(computedPoints.punya!, getG('saturn'), lagnaLon, isDay);
  addResult(bandhanaDef, bandhanaRaw.lon, bandhanaRaw.arcRuleApplied);

  // 35. Apamrityu Saham (Day: H8 - Mars + Lagna; Night: Mars - H8 + Lagna)
  const apamrityuDef = SAHAM_DEFINITIONS.find((d) => d.id === 'apamrityu')!;
  const apamrityuRaw = computeRawSaham(getH(8), getG('mars'), lagnaLon, isDay);
  addResult(apamrityuDef, apamrityuRaw.lon, apamrityuRaw.arcRuleApplied);

  // 36. Labha Saham (H11 - L11 + Lagna, same day/night)
  const labhaDef = SAHAM_DEFINITIONS.find((d) => d.id === 'labha')!;
  const labhaRaw = computeRawSaham(getH(11), getG(getHLord(11)), lagnaLon, isDay, true);
  addResult(labhaDef, labhaRaw.lon, labhaRaw.arcRuleApplied);

  return { sahams: results, sahamsList: list };
}
