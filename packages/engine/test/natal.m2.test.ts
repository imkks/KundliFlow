import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadEphemeris,
  resolveBirthTime,
  computePositions,
  computePanchang,
  computeVimshottariDashas,
  calculateVargaSign,
  computeSripatiChalit,
  createNatalDigest,
  computeCharaKarakas,
  computePanchadhaFriendship,
  computeYoginiDashas,
  computeCharaDashas,
  calculateKpPlacement,
  computeShadbala,
  detectYogasAndDoshas,
  getAvakahadaInterpretation,
  getPlanetaryInsights,
  getKarakasInsights,
  computeAvakahada,
  computeBhavaAnalysis,
  type BirthInput,
} from '../src/index.js';
import birthFixture from '../../../fixtures/sample-1998-09-07-jamshedpur/birth.json' assert { type: 'json' };
import lahiriFixture from '../../../fixtures/sample-1998-09-07-jamshedpur/positions.lahiri.json' assert { type: 'json' };
import panchangFixture from '../../../fixtures/sample-1998-09-07-jamshedpur/panchang.json' assert { type: 'json' };
import vimshottariFixture from '../../../fixtures/sample-1998-09-07-jamshedpur/vimshottari.lahiri.json' assert { type: 'json' };

describe('M2 Natal Calculations Suite (Panchang, Dashas, Vargas, Chalit, Digest)', () => {
  const birthInput: BirthInput = {
    date: '1998-09-07',
    time: '23:20:34',
    tzId: 'Asia/Kolkata',
    placeName: 'Jamshedpur',
    lat: 22.8,
    lon: 86.16666666666667,
    timeCertainty: 'exact',
  };

  let natal: ReturnType<typeof computePositions>;

  beforeAll(async () => {
    const eph = await loadEphemeris('swisseph');
    const timeRes = resolveBirthTime(birthInput);
    if (!timeRes.success) throw new Error('Time resolution failed');

    natal = computePositions(
      eph,
      timeRes.resolved,
      { name: 'Jamshedpur', lat: 22.8, lon: 86.16666666666667 },
      { ayanamsa: 'lahiri', nodeType: 'mean', includeOuterPlanets: true },
    );
  });

  describe('1. Panchang Calculation against AstroSage Golden Fixture', () => {
    it('verifies Tithi, Yoga, Karana, and Vara', () => {
      const sunLon = natal.grahas.sun.lon;
      const moonLon = natal.grahas.moon.lon;
      // 1998-09-07 was Monday (dayOfWeek index 1)
      const p = computePanchang(sunLon, moonLon, 1);

      // Tithi: Krishna Dvitiya (Index 17)
      expect(p.tithi.name).toBe(panchangFixture.tithi.name);
      expect(p.tithi.paksha).toBe(panchangFixture.tithi.paksha);
      expect(p.tithi.index).toBe(panchangFixture.tithi.index);

      // Yoga: Shula (Index 9)
      expect(p.yoga.name).toBe(panchangFixture.yoga.name);
      expect(p.yoga.index).toBe(panchangFixture.yoga.index);

      // Karana: Taitila (Index 32)
      expect(p.karana.name).toBe(panchangFixture.karana.name);
      expect(p.karana.index).toBe(panchangFixture.karana.index);

      // Vara: Monday
      expect(p.wara.name).toBe(panchangFixture.vara);
      expect(p.wara.lord).toBe('moon');
    });
  });

  describe('2. Vimshottari Dasha Engine against AstroSage Golden Fixture', () => {
    it('verifies initial balance at birth and subsequent Mahadashas', () => {
      const moon = natal.grahas.moon;
      // Moon in Uttarabhadrapada (index 25)
      // When yearDays='calendar' (traditional software model like AstroSage):
      const dashas = computeVimshottariDashas(
        moon.nakshatraIndex,
        moon.elapsedInNakshatra,
        natal.time.birthLocal,
        3, // Depth 3 (Pratyantar)
        'calendar',
      );

      // Balance at birth: Saturn ~ 11y 5m (between 16d and 20d depending on month definition and Moshier vs JPL Moon seconds)
      expect(dashas.balance.startingLord).toBe(vimshottariFixture.startingLord);
      expect(dashas.balance.balanceYears).toBeCloseTo(11.465, 1);
      expect(dashas.balance.formattedBalance).toMatch(/^SAT 11 Y 5 M (16|20) D$/);

      // Check Mahadasha sequence and transition dates
      const expectedMaha = vimshottariFixture.mahadashas;
      expect(dashas.periods.length).toBe(expectedMaha.length);

      for (let i = 0; i < expectedMaha.length; i++) {
        const exp = expectedMaha[i]!;
        const act = dashas.periods[i]!;
        expect(act.lord).toBe(exp.lord);

        // Transition dates:
        // AstroSage shows 28/02/2010 based on rounding Saturn balance to 20 days.
        // Analytical calculation yields 16 days (a 4-5 day difference due to Moon second precision).
        const expEnd = new Date(exp.endDate).getTime();
        const actEnd = new Date(act.endDateIso).getTime();
        const diffDays = Math.abs(actEnd - expEnd) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBeLessThanOrEqual(5);
      }

      // Check sub-period generation (Antardashas and Pratyantardashas)
      const saturnMaha = dashas.periods[0]!;
      expect(saturnMaha.subPeriods).toBeDefined();
      expect(saturnMaha.subPeriods!.length).toBe(9);

      // Verify first Mahadasha Antardashas span the full 19y cycle (not compressed into balance):
      // At birth (1998-09-07), ~7.5y of Saturn Mahadasha had elapsed -> Venus Antardasha is active
      const birthAntar = saturnMaha.subPeriods!.find(
        (a) => '1998-09-07' >= a.startDateIso && '1998-09-07' < a.endDateIso,
      );
      expect(birthAntar?.lord).toBe('venus');

      const firstAntar = saturnMaha.subPeriods![0]!;
      expect(firstAntar.subPeriods).toBeDefined();
      expect(firstAntar.subPeriods!.length).toBe(9);
    });
  });

  describe('3. Divisional Charts (Vargas)', () => {
    it('verifies D9 Navamsha sign placements for all grahas and lagna', () => {
      // Golden values from PDF report p. 7 (Navamsha Chart):
      // Lagna (Taurus 27°40') -> Virgo (Sign Index 5)
      // Sun (Leo 21°04') -> Libra (Sign Index 6)
      // Moon (Pisces 08°36') -> Virgo (Sign Index 5) [House 1 with Lagna in D9]
      // Mars (Cancer 17°37') -> Sagittarius (Sign Index 8)
      // Mercury (Leo 05°36') -> Taurus (Sign Index 1)
      // Jupiter (Pisces 00°20') -> Cancer (Sign Index 3)
      // Venus (Leo 07°19') -> Gemini (Sign Index 2)
      // Saturn (Aries 09°19') -> Gemini (Sign Index 2)
      // Rahu (Leo 06°39') -> Taurus (Sign Index 1)
      // Ketu (Aquarius 06°39') -> Scorpio (Sign Index 7)

      const d9Lagna = calculateVargaSign(natal.lagna!.lon, 'D9');
      expect(d9Lagna).toBe(5); // Virgo

      const d9Sun = calculateVargaSign(natal.grahas.sun.lon, 'D9');
      expect(d9Sun).toBe(6); // Libra

      const d9Moon = calculateVargaSign(natal.grahas.moon.lon, 'D9');
      expect(d9Moon).toBe(5); // Virgo (Uttara Bhadrapada pada 2 = Virgo)

      const d9Mars = calculateVargaSign(natal.grahas.mars.lon, 'D9');
      expect(d9Mars).toBe(8); // Sagittarius

      const d9Merc = calculateVargaSign(natal.grahas.mercury.lon, 'D9');
      expect(d9Merc).toBe(1); // Taurus

      const d9Jup = calculateVargaSign(natal.grahas.jupiter.lon, 'D9');
      expect(d9Jup).toBe(3); // Cancer

      const d9Ven = calculateVargaSign(natal.grahas.venus.lon, 'D9');
      expect(d9Ven).toBe(2); // Gemini

      const d9Sat = calculateVargaSign(natal.grahas.saturn.lon, 'D9');
      expect(d9Sat).toBe(2); // Gemini

      const d9Rahu = calculateVargaSign(natal.grahas.rahu.lon, 'D9');
      expect(d9Rahu).toBe(1); // Taurus

      const d9Ketu = calculateVargaSign(natal.grahas.ketu.lon, 'D9');
      expect(d9Ketu).toBe(7); // Scorpio
    });

    it('verifies D10 Dashamsha Lagna and Moon placements', () => {
      // Lagna (Taurus 27°40'): Taurus is even sign -> starts from 9th (Capricorn=9)
      // 27°40' is 10th division (part 9, index 9). 9 + 9 = 18 % 12 = 6 (Libra = Sign Index 6)
      // PDF report p. 8 shows D10 Lagna = Libra (7th zodiac sign, index 6)
      const d10Lagna = calculateVargaSign(natal.lagna!.lon, 'D10');
      expect(d10Lagna).toBe(6); // Libra
    });
  });

  describe('4. Sripati Chalit Chart Calculation', () => {
    it('verifies Bhava Madhya and Bhava Begin for key houses', async () => {
      const eph = await loadEphemeris('swisseph');
      const angles = eph.angles(natal.time.julianDayUt, 22.8, 86.166667);
      const ay = eph.ayanamsa(natal.time.julianDayUt, 'lahiri');
      const mcSidereal = (angles.mcTropical - ay + 360) % 360;

      const chalit = computeSripatiChalit(natal.lagna!.lon, mcSidereal);
      expect(chalit.bhavas.length).toBe(12);

      // House 1 Midpoint = Lagna (Taurus ~27°40'54")
      expect(chalit.bhavas[0]!.sign).toBe('taurus');
      expect(chalit.bhavas[0]!.midBhavaDeg).toBeCloseTo(natal.lagna!.lon, 2);

      // House 1 Bhava Begin matches Taurus ~10°33'39" from PDF Chalit Table
      const b1 = chalit.bhavas[0]!;
      expect(b1.sign).toBe('taurus');
      expect(b1.bhavaBeginDeg).toBeCloseTo(40.56, 1); // ~ Taurus 10.56°
    });
  });

  describe('5. Compact Natal Digest Generation', () => {
    it('generates a lightweight JSON digest under 3 KB with core factors', () => {
      const digest = createNatalDigest(natal);
      expect(digest.lagna?.sign).toBe('taurus');
      expect(digest.moon.sign).toBe('pisces');
      expect(digest.grahas.jupiter?.houseFromLagna).toBe(11);
      expect(digest.grahas.saturn?.retrograde).toBe(true);

      const jsonStr = JSON.stringify(digest);
      expect(jsonStr.length).toBeLessThan(3000);
      expect(jsonStr.length).toBeGreaterThan(500);
    });
  });

  describe('6. Jaimini Karakas & Five-Fold Friendship', () => {
    it('computes Jaimini 7 Chara Karakas matching degree order', () => {
      const karakas = computeCharaKarakas(natal.grahas);
      expect(karakas.sun).toBe('AK'); // Sun 21°04' (highest)
      expect(karakas.mars).toBe('AmK'); // Mars 17°37'
      expect(karakas.saturn).toBe('BK'); // Saturn 09°19'
      expect(karakas.moon).toBe('MK'); // Moon 08°36'
      expect(karakas.venus).toBe('PK'); // Venus 07°19'
      expect(karakas.mercury).toBe('GK'); // Mercury 05°36'
      expect(karakas.jupiter).toBe('DK'); // Jupiter 00°20' (lowest)
    });

    it('computes Five-fold friendship matching page 15 of report', () => {
      const signs = {
        sun: natal.grahas.sun.signIndex,
        moon: natal.grahas.moon.signIndex,
        mars: natal.grahas.mars.signIndex,
        mercury: natal.grahas.mercury.signIndex,
        jupiter: natal.grahas.jupiter.signIndex,
        venus: natal.grahas.venus.signIndex,
        saturn: natal.grahas.saturn.signIndex,
      };
      const panchadha = computePanchadhaFriendship(signs);

      // Mars -> Sun: Intimate (Adhi-Mitra)
      expect(panchadha.mars.sun).toBe('great_friend');
      // Mars -> Moon: Neutral
      expect(panchadha.mars.moon).toBe('neutral');
      // Mars -> Mercury: Neutral
      expect(panchadha.mars.mercury).toBe('neutral');
      // Mars -> Saturn: Friend
      expect(panchadha.mars.saturn).toBe('friend');
    });

    it('computes extended Shodashvargas D16 through D60', () => {
      // D16 Shodashamsha
      const d16Lagna = calculateVargaSign(natal.lagna!.lon, 'D16');
      expect(d16Lagna).toBeGreaterThanOrEqual(0);
      expect(d16Lagna).toBeLessThan(12);

      // D30 Trimshamsha for Lagna (Taurus 27°40' -> Even sign 25-30° is Mars = Scorpio = 7)
      const d30Lagna = calculateVargaSign(natal.lagna!.lon, 'D30');
      expect(d30Lagna).toBe(7); // Scorpio (ruled by Mars)

      // D60 Shashtiamsha
      const d60Lagna = calculateVargaSign(natal.lagna!.lon, 'D60');
      expect(d60Lagna).toBeGreaterThanOrEqual(0);
      expect(d60Lagna).toBeLessThan(12);
    });

    it('computes Yogini Dasha matching page 3 of report', () => {
      const moon = natal.grahas.moon;
      const yogini = computeYoginiDashas(
        moon.nakshatraIndex,
        moon.elapsedInNakshatra,
        natal.time.birthLocal,
      );
      // Starting Yogini is Bhadrika (Ba, 5 years)
      expect(yogini.startingBalance.name).toBe('Bhadrika');
      expect(yogini.startingBalance.code).toBe('Ba');
      expect(yogini.startingBalance.yearsRemaining).toBeGreaterThan(0);
      expect(yogini.startingBalance.yearsRemaining).toBeLessThanOrEqual(5);

      // Verify sequence of Mahadashas starts with Bhadrika
      expect(yogini.periods[0]!.name).toBe('Bhadrika');
      expect(yogini.periods[0]!.subPeriods.length).toBe(8);
      // Next is Ulka (6 years), Siddha (7 years), Sankata (8 years)
      expect(yogini.periods[1]!.name).toBe('Ulka');
      expect(yogini.periods[2]!.name).toBe('Siddha');
      expect(yogini.periods[3]!.name).toBe('Sankata');
    });

    it('computes KP Sub-Lord matching page 10 of report', () => {
      const moon = natal.grahas.moon;
      const kpMoon = calculateKpPlacement(moon.lon);
      expect(kpMoon.sign).toBe('pisces');
      expect(kpMoon.rashiLord).toBe('jupiter');
      expect(kpMoon.nakshatra).toBe('Uttarabhadrapada');
      expect(kpMoon.starLord).toBe('saturn');
      // Sub Lord for Moon is Venus (matching page 10 report)
      expect(kpMoon.subLord).toBe('venus');
    });

    it('computes Shadbala strengths & rankings matching page 16 of report', () => {
      const sb = computeShadbala(natal);
      expect(sb.planets.sun!.rank).toBe(1); // Sun rank #1 (ratio 1.36)
      expect(sb.planets.sun!.strengthRatio).toBeCloseTo(1.36, 1);
      expect(sb.planets.saturn!.rank).toBe(7); // Saturn rank #7 (ratio 0.89)
      expect(sb.bhavas.length).toBe(12);
    });

    it('computes Jaimini Chara Dasha matching pages 5-6 of report', () => {
      const chara = computeCharaDashas(natal.lagna!.signIndex, natal.time.birthLocal, natal.grahas);
      expect(chara.periods.length).toBe(12);
      // Taurus 3y (7/9/98 - 7/9/01)
      expect(chara.periods[0]!.sign).toBe('TAU 03 Year');
      expect(chara.periods[0]!.years).toBe(3);
      // Aries 3y (7/9/01 - 7/9/04)
      expect(chara.periods[1]!.sign).toBe('ARI 03 Year');
      // Pisces 12y (7/9/04 - 7/9/16)
      expect(chara.periods[2]!.sign).toBe('PIS 12 Year');
      // Sub-periods count
      expect(chara.periods[0]!.subPeriods.length).toBe(12);
    });

    it('detects classical Yogas and Doshas from natal chart', () => {
      const yogas = detectYogasAndDoshas(natal);
      const budhaditya = yogas.find((y) => y.id === 'budhaditya');
      const gajakesari = yogas.find((y) => y.id === 'gajakesari');
      const kujadosha = yogas.find((y) => y.id === 'kuja_dosha');
      const kaalsarp = yogas.find((y) => y.id === 'kaal_sarp');

      expect(budhaditya?.presence).toBe(true);
      expect(gajakesari?.presence).toBe(true);
      expect(kujadosha?.presence).toBe(false); // Mars in Cancer 3rd house: Kuja Dosha absent
      expect(kaalsarp?.presence).toBe(false); // Planets span across nodal axis: Kaal Sarp Yoga absent
    });

    it('generates rich textual interpretations for Avakahada, Planets, and Karakas', () => {
      const avk = computeAvakahada(natal.grahas.moon.nakshatraIndex, natal.grahas.moon.signIndex);
      const avkInterp = getAvakahadaInterpretation(avk);
      expect(avkInterp.title).toContain('Avakahada');
      expect(avkInterp.bullets.length).toBeGreaterThanOrEqual(5);

      const planInterp = getPlanetaryInsights(natal);
      expect(planInterp.title).toContain('Planetary Sign & House');
      expect(planInterp.bullets.length).toBeGreaterThanOrEqual(6);

      const karakas = computeCharaKarakas(natal);
      const karakaInterp = getKarakasInsights(karakas);
      expect(karakaInterp.title).toContain('Jaimini Chara Karakas');
      expect(karakaInterp.bullets.length).toBeGreaterThanOrEqual(5);
    });

    it('computes 12 Bhava dossiers with lords, occupants, and aspects', () => {
      const dossiers = computeBhavaAnalysis(natal);
      expect(dossiers.length).toBe(12);

      // House 1 (Lagna): Taurus, Lord Venus
      expect(dossiers[0]!.houseNumber).toBe(1);
      expect(dossiers[0]!.signName).toBe('taurus');
      expect(dossiers[0]!.lord).toBe('venus');
      expect(dossiers[0]!.lordHouse).toBe(4); // Venus is in 4th house (Leo)

      // House 4: Leo, Lord Sun in 4th house (Sva-Kshetra)
      expect(dossiers[3]!.houseNumber).toBe(4);
      expect(dossiers[3]!.signName).toBe('leo');
      expect(dossiers[3]!.lord).toBe('sun');
      expect(dossiers[3]!.lordHouse).toBe(4);
      expect(dossiers[3]!.natalOccupants.length).toBe(4); // Sun, Mercury, Venus, Rahu

      // House 11: Pisces, Lord Jupiter in 11th house (Sva-Kshetra)
      expect(dossiers[10]!.houseNumber).toBe(11);
      expect(dossiers[10]!.signName).toBe('pisces');
      expect(dossiers[10]!.lord).toBe('jupiter');
      expect(dossiers[10]!.lordHouse).toBe(11);
      expect(dossiers[10]!.natalOccupants.map((o) => o.graha)).toContain('moon');
      expect(dossiers[10]!.natalOccupants.map((o) => o.graha)).toContain('jupiter');
    });
  });
});
