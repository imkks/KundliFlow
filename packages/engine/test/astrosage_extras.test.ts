import { describe, it, expect, beforeAll } from 'vitest';
import {
  angleDiff,
  checkTransitVedha,
  computeArudhaPadas,
  computeAshtakoota,
  computeBhavaBala,
  computePanchakaRahita,
  computePositions,
  computeShadbala,
  computeShodhyaPinda,
  computeSudarshanaChakra,
  computeThreePairLongevity,
  computeUpagrahas,
  computePranapada,
  computeVarshaphal,
  detectYogasAndDoshas,
  evaluateKakshyaTransits,
  evaluateSpecialMuhurtas,
  loadEphemeris,
  performEkadhipatyaShodhana,
  performTrikonaShodhana,
  resolveBirthTime,
  type EphemerisProvider,
  type NatalChart,
} from '../src/index.js';

describe('AstroSage Extra Engines: Upagrahas, Arudha Padas, Varshaphal, Ashtakoota', () => {
  let eph: EphemerisProvider;

  beforeAll(async () => {
    eph = await loadEphemeris('swisseph');
  });

  it('computes all 7 Upagrahas, 12 Arudha Padas, 2026 Varshaphal, and 36-pt Ashtakoota', () => {
    const res = resolveBirthTime({
      date: '1998-09-07',
      time: '23:20:34',
      tzId: 'Asia/Kolkata',
      placeName: 'Jamshedpur',
      lat: 22.8,
      lon: 86.166667,
      timeCertainty: 'exact',
    });
    if (!res.success) throw new Error(res.message);

    const natal = computePositions(
      eph,
      res.resolved,
      { name: 'Jamshedpur', lat: 22.8, lon: 86.166667 },
      { ayanamsa: 'lahiri', nodeType: 'mean' },
    );

    // 1. Upagrahas
    const upagrahas = computeUpagrahas(natal);
    expect(upagrahas).toHaveLength(7);
    expect(upagrahas.map((u) => u.id)).toContain('dhuma');
    expect(upagrahas.map((u) => u.id)).toContain('gulika');

    // 2. Arudha Padas (AL .. UL)
    const arudhas = computeArudhaPadas(natal);
    expect(arudhas).toHaveLength(12);
    expect(arudhas[0]?.code).toBe('AL');
    expect(arudhas[11]?.code).toBe('UL');

    // 3. Varshaphal 2026
    const varsha = computeVarshaphal(eph, natal, 2026);
    expect(varsha.targetYear).toBe(2026);
    expect(varsha.completedAge).toBe(28);
    expect(Math.abs(angleDiff(varsha.annualChart.grahas.sun.lon, natal.grahas.sun.lon))).toBeLessThan(0.01);

    // 4. Ashtakoota - Baseline check
    const match = computeAshtakoota(
      { moonSignIndex: natal.grahas.moon.signIndex, moonNakshatraIndex: natal.grahas.moon.nakshatraIndex },
      { moonSignIndex: 1, moonNakshatraIndex: 3 }, // Taurus / Rohini
    );
    expect(match.maxPoints).toBe(36);
    expect(match.kootas).toHaveLength(8);
    expect(match.totalPoints).toBeGreaterThanOrEqual(0);
    expect(match.totalPoints).toBeLessThanOrEqual(36);

    // 4b. Dr. K.S. Charak Worked Example (Ch. XXVII, p. 462)
    // Groom: Moola (Nak 19 -> index 18), Dhanu (sign 8)
    // Bride: Uttara Bhadrapada (Nak 26 -> index 25), Meena (sign 11)
    const charakMatch = computeAshtakoota(
      { moonSignIndex: 8, moonNakshatraIndex: 18 },
      { moonSignIndex: 11, moonNakshatraIndex: 25 },
    );
    // Varna=0, Vashya=0.5, Tara=1.5, Yoni=2, GrahaMaitri=5, Gana=0, Bhakoota=7, Naadi=8 -> Total: 24.0
    expect(charakMatch.kootas.find(k => k.name === 'Varna')?.points).toBe(0);
    expect(charakMatch.kootas.find(k => k.name === 'Vashya')?.points).toBe(0.5);
    expect(charakMatch.kootas.find(k => k.name === 'Tara')?.points).toBe(1.5);
    expect(charakMatch.kootas.find(k => k.name === 'Yoni')?.points).toBe(2);
    expect(charakMatch.kootas.find(k => k.name === 'Graha Maitri')?.points).toBe(5);
    expect(charakMatch.kootas.find(k => k.name === 'Gana')?.points).toBe(0);
    expect(charakMatch.kootas.find(k => k.name === 'Bhakoot')?.points).toBe(7);
    expect(charakMatch.kootas.find(k => k.name === 'Nadi')?.points).toBe(8);
    expect(charakMatch.totalPoints).toBe(24);
    expect(charakMatch.verdict).toBe('Good');

    // 5. Pranapada
    const pp = computePranapada(natal);
    expect(pp.id).toBe('pranapada');
    expect(pp.lon).toBeGreaterThanOrEqual(0);
    expect(pp.lon).toBeLessThan(360);
    expect(pp.signIndex).toBeGreaterThanOrEqual(0);
    expect(pp.signIndex).toBeLessThan(12);

    // 6. Sudarshana Chakra & Dasha
    const sudarshana = computeSudarshanaChakra(natal, 28.0);
    expect(sudarshana.rings.innerLagna).toBe(natal.lagna!.signIndex);
    expect(sudarshana.rings.middleChandra).toBe(natal.grahas.moon.signIndex);
    expect(sudarshana.rings.outerSurya).toBe(natal.grahas.sun.signIndex);
    expect(sudarshana.houses).toHaveLength(12);
    expect(sudarshana.currentDasha.mahadashaHouse).toBe(((28 % 12) + 1)); // House 5

    // 7. Kakshya Transit evaluation
    const kakshya = evaluateKakshyaTransits({
      sun: natal.grahas.sun.lon,
      moon: natal.grahas.moon.lon,
      mars: natal.grahas.mars.lon,
      mercury: natal.grahas.mercury.lon,
      jupiter: natal.grahas.jupiter.lon,
      venus: natal.grahas.venus.lon,
      saturn: natal.grahas.saturn.lon,
    });
    expect(kakshya.evaluations).toHaveLength(7);
    expect(kakshya.evaluations[0]!.kakshyaIndex).toBeGreaterThanOrEqual(1);
    expect(kakshya.evaluations[0]!.kakshyaIndex).toBeLessThanOrEqual(8);
    expect(kakshya.beneficCount).toBeGreaterThanOrEqual(0);
  });

  it('detects classical yogas and doshas under specific configurations', () => {
    const res = resolveBirthTime({
      date: '1998-09-07',
      time: '23:20:34',
      tzId: 'Asia/Kolkata',
      placeName: 'Jamshedpur',
      lat: 22.8,
      lon: 86.166667,
      timeCertainty: 'exact',
    });
    if (!res.success) throw new Error(res.message);

    const baseChart = computePositions(
      eph,
      res.resolved,
      { name: 'Jamshedpur', lat: 22.8, lon: 86.166667 },
      { ayanamsa: 'lahiri', nodeType: 'mean' },
    );

    // 1. Guru Chandal Yoga: Jupiter conjunct Rahu in same sign
    const chartGuruChandal: NatalChart = {
      ...baseChart,
      grahas: {
        ...baseChart.grahas,
        jupiter: { ...baseChart.grahas.jupiter, lon: 125, signIndex: 4, sign: 'leo' },
        rahu: { ...baseChart.grahas.rahu, lon: 126, signIndex: 4, sign: 'leo' },
      },
    };
    const gcYogas = detectYogasAndDoshas(chartGuruChandal);
    const gc = gcYogas.find((y) => y.id === 'guru_chandal');
    expect(gc?.presence).toBe(true);
    expect(gc?.strength).toBe('strong');

    // 2. Angarak Dosha: Mars conjunct Rahu in same sign
    const chartAngarak: NatalChart = {
      ...baseChart,
      grahas: {
        ...baseChart.grahas,
        mars: { ...baseChart.grahas.mars, lon: 125, signIndex: 4, sign: 'leo' },
        rahu: { ...baseChart.grahas.rahu, lon: 127, signIndex: 4, sign: 'leo' },
      },
    };
    const angarakYogas = detectYogasAndDoshas(chartAngarak);
    const ang = angarakYogas.find((y) => y.id === 'angarak_dosha');
    expect(ang?.presence).toBe(true);
    expect(ang?.strength).toBe('strong');

    // 3. Vish Yoga: Saturn conjunct Moon
    const chartVish: NatalChart = {
      ...baseChart,
      grahas: {
        ...baseChart.grahas,
        saturn: { ...baseChart.grahas.saturn, lon: 340, signIndex: 11, sign: 'pisces' },
        moon: { ...baseChart.grahas.moon, lon: 342, signIndex: 11, sign: 'pisces' },
      },
    };
    const vishYogas = detectYogasAndDoshas(chartVish);
    const vish = vishYogas.find((y) => y.id === 'vish_dosha');
    expect(vish?.presence).toBe(true);
    expect(vish?.strength).toBe('strong');

    // 4. Gandanta Dosha: Moon at Revati-Ashwini sandhi (359°)
    const chartGandanta: NatalChart = {
      ...baseChart,
      grahas: {
        ...baseChart.grahas,
        moon: { ...baseChart.grahas.moon, lon: 359.5, signIndex: 11, sign: 'pisces' },
      },
    };
    const gandantaYogas = detectYogasAndDoshas(chartGandanta);
    const gand = gandantaYogas.find((y) => y.id === 'gandanta_dosha');
    expect(gand?.presence).toBe(true);

    // 5. Chandra-Mangala Yoga: Moon conjunct Mars
    const chartChandraMangala: NatalChart = {
      ...baseChart,
      grahas: {
        ...baseChart.grahas,
        moon: { ...baseChart.grahas.moon, lon: 45, signIndex: 1, sign: 'taurus' },
        mars: { ...baseChart.grahas.mars, lon: 47, signIndex: 1, sign: 'taurus' },
      },
    };
    const cmYogas = detectYogasAndDoshas(chartChandraMangala);
    const cm = cmYogas.find((y) => y.id === 'chandra_mangala');
    expect(cm?.presence).toBe(true);
    expect(cm?.strength).toBe('strong');

    // 6. Amala Yoga: Jupiter in 10th house from Lagna (Lagna Taurus signIndex 1 -> 10th sign Aquarius signIndex 10)
    const chartAmala: NatalChart = {
      ...baseChart,
      grahas: {
        ...baseChart.grahas,
        jupiter: {
          ...baseChart.grahas.jupiter,
          lon: 310,
          signIndex: 10,
          sign: 'aquarius',
          houses: { houseFromLagna: 10, houseFromMoon: 12 },
        },
      },
    };
    const amalaYogas = detectYogasAndDoshas(chartAmala);
    const amala = amalaYogas.find((y) => y.id === 'amala_yoga');
    expect(amala?.presence).toBe(true);
  });

  it('evaluates Gochara Vedha transit obstructions with classical father-son exemptions', () => {
    // Sun in 3rd from Moon is normally benefic, paired Vedha house is 9th
    // Case A: 9th has Mars -> Obstructed!
    const resA = checkTransitVedha('sun', 3, {
      sun: 3,
      moon: 1,
      mars: 9,
      mercury: 5,
      jupiter: 2,
      venus: 4,
      saturn: 6,
      rahu: 11,
      ketu: 5,
    });
    expect(resA.isFavourableHouse).toBe(true);
    expect(resA.obstructingHouse).toBe(9);
    expect(resA.isObstructed).toBe(true);
    expect(resA.obstructingPlanets).toContain('mars');
    expect(resA.netStatus).toBe('favourable_obstructed');

    // Case B: 9th has Saturn -> NOT obstructed (Sun & Saturn father-son exemption per Dr. Charak)
    const resB = checkTransitVedha('sun', 3, {
      sun: 3,
      moon: 1,
      mars: 6,
      mercury: 5,
      jupiter: 2,
      venus: 4,
      saturn: 9,
      rahu: 11,
      ketu: 5,
    });
    expect(resB.isFavourableHouse).toBe(true);
    expect(resB.obstructingHouse).toBe(9);
    expect(resB.isObstructed).toBe(false);
    expect(resB.obstructingPlanets).not.toContain('saturn');
    expect(resB.netStatus).toBe('favourable_unobstructed');
  });

  it('performs Ashtakavarga Trikona & Ekadhipatya Shodhana and computes Shodhya Pinda', () => {
    // Test sample BAV (e.g. Sun BAV): 12 values
    const sampleBav = [5, 4, 3, 2, 6, 5, 4, 3, 4, 5, 4, 3];
    const trikonaReduced = performTrikonaShodhana(sampleBav);
    expect(trikonaReduced).toHaveLength(12);
    // In Aries (0), Leo (4), Sag (8): values 5, 6, 4 -> min is 4 -> reduced to 1, 2, 0
    expect(trikonaReduced[0]).toBe(1);
    expect(trikonaReduced[4]).toBe(2);
    expect(trikonaReduced[8]).toBe(0);

    // Ekadhipatya Shodhana
    const ekadhipatya = performEkadhipatyaShodhana(trikonaReduced, [0, 4, 11]);
    expect(ekadhipatya).toHaveLength(12);

    // Shodhya Pinda
    const pinda = computeShodhyaPinda(ekadhipatya, {
      sun: 4,
      moon: 11,
      mars: 3,
      mercury: 4,
      jupiter: 11,
      venus: 4,
      saturn: 0,
    });
    expect(pinda.rashiPinda).toBeGreaterThan(0);
    expect(pinda.grahaPinda).toBeGreaterThan(0);
    expect(pinda.shodhyaPinda).toBe(pinda.rashiPinda + pinda.grahaPinda);
  });

  it('computes 12-Bhava Bala, Panchaka Rahita, and Three-Pair Longevity', () => {
    const res = resolveBirthTime({
      date: '1998-09-07',
      time: '23:20:34',
      tzId: 'Asia/Kolkata',
      placeName: 'Jamshedpur',
      lat: 22.8,
      lon: 86.166667,
      timeCertainty: 'exact',
    });
    if (!res.success) throw new Error(res.message);

    const natal = computePositions(
      eph,
      res.resolved,
      { name: 'Jamshedpur', lat: 22.8, lon: 86.166667 },
      { ayanamsa: 'lahiri', nodeType: 'mean' },
    );
    const shadbala = computeShadbala(natal);

    // 1. Bhava Bala
    const bb = computeBhavaBala(natal, shadbala);
    expect(bb.bhavas).toHaveLength(12);
    expect(bb.strongestHouse).toBeGreaterThanOrEqual(1);
    expect(bb.strongestHouse).toBeLessThanOrEqual(12);
    expect(bb.bhavas[0]!.totalRupas).toBeGreaterThan(5);

    // 2. Panchaka Rahita
    const panchaka = computePanchakaRahita(16, 2, 26, 2); // Tithi 16, Mon, U.Bhadrapada, Taurus
    expect(panchaka.sum).toBe(16 + 2 + 26 + 2);
    expect(panchaka.remainder).toBe((16 + 2 + 26 + 2) % 9);
    expect(panchaka.defectName).toBeDefined();

    // 2b. Special Muhurtas (Guru Pushya on Thursday + Pushya)
    const guruPushya = evaluateSpecialMuhurtas(5, 8);
    expect(guruPushya.guruPushya).toBe(true);
    expect(guruPushya.sarvarthaSiddhi).toBe(true);
    expect(guruPushya.amritaSiddhi).toBe(true);

    // 3. Three-Pair Longevity
    const ayur = computeThreePairLongevity(natal);
    expect(ayur.pairs).toHaveLength(3);
    expect(['alpayu', 'madhyayu', 'poornayu']).toContain(ayur.finalVerdict);
    expect(ayur.estimatedYearsRange).toBeDefined();
  });
});
