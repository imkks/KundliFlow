import { describe, it, expect } from 'vitest';
import {
  evaluateNavatara,
  computeSpecialNakshatras,
  computeFullNavataraTable,
  evaluateLattaForGraha,
  evaluateTransitNavatara,
  SPECIAL_NAKSHATRA_DEFS,
  NAKSHATRAS,
} from '../src/index.js';

describe('Navatara & 11 Special Nakshatras Suite (PVR Rao Ch. 26)', () => {
  it('correctly calculates 9 Taras and Paryayas with index wrapping', () => {
    // Suppose Natal Moon is in Rohini (index 3)
    const rohiniIndex = 3;

    // 1. Same star (Rohini -> Rohini): Janma, Paryaya 1
    const tJanma = evaluateNavatara(rohiniIndex, rohiniIndex);
    expect(tJanma.offset).toBe(1);
    expect(tJanma.taraNumber).toBe(1);
    expect(tJanma.tara).toBe('janma');
    expect(tJanma.paryayaNumber).toBe(1);
    expect(tJanma.paryaya).toBe('prathama');
    expect(tJanma.category).toBe('mixed');

    // 2. 2nd star (Rohini -> Mrigashira, index 4): Sampat, Auspicious
    const tSampat = evaluateNavatara(rohiniIndex, 4);
    expect(tSampat.offset).toBe(2);
    expect(tSampat.taraNumber).toBe(2);
    expect(tSampat.tara).toBe('sampat');
    expect(tSampat.paryayaNumber).toBe(1);
    expect(tSampat.isFavorable).toBe(true);

    // 3. 7th star (Rohini -> Pushya, index 7 - wait: Rohini is 3, 3 + 7 - 1 = 9 = Magha): Naidhana / Vadha
    const tNaidhana = evaluateNavatara(rohiniIndex, 9);
    expect(tNaidhana.offset).toBe(7);
    expect(tNaidhana.taraNumber).toBe(7);
    expect(tNaidhana.tara).toBe('naidhana');
    expect(tNaidhana.category).toBe('inauspicious');

    // 4. 10th star (Rohini -> Purva Phalguni, index 12): Janma in 2nd Paryaya (Karma star)
    const tParyaya2 = evaluateNavatara(rohiniIndex, 12);
    expect(tParyaya2.offset).toBe(10);
    expect(tParyaya2.taraNumber).toBe(1);
    expect(tParyaya2.tara).toBe('janma');
    expect(tParyaya2.paryayaNumber).toBe(2);
    expect(tParyaya2.paryaya).toBe('dwitiya');

    // 5. Wrap-around check: Natal Moon in Revati (index 26)
    // Target Ashwini (index 0): offset should be 2 (Sampat)
    const tWrap = evaluateNavatara(26, 0);
    expect(tWrap.offset).toBe(2);
    expect(tWrap.taraNumber).toBe(2);
    expect(tWrap.tara).toBe('sampat');

    // Target Revati (26): offset should be 1
    const tRevatiSelf = evaluateNavatara(26, 26);
    expect(tRevatiSelf.offset).toBe(1);
    expect(tRevatiSelf.tara).toBe('janma');

    // Target Uttara Bhadrapada (25): 27th star from Revati -> Parama Mitra in 3rd Paryaya
    const tRevatiLast = evaluateNavatara(26, 25);
    expect(tRevatiLast.offset).toBe(27);
    expect(tRevatiLast.taraNumber).toBe(9);
    expect(tRevatiLast.tara).toBe('parama_mitra');
    expect(tRevatiLast.paryayaNumber).toBe(3);
    expect(tRevatiLast.paryaya).toBe('tritiya');
  });

  it('generates a full 27-star Navatara table', () => {
    const table = computeFullNavataraTable(0); // Ashwini
    expect(table.length).toBe(27);
    expect(table[0]!.tara).toBe('janma');
    expect(table[1]!.tara).toBe('sampat');
    expect(table[26]!.tara).toBe('parama_mitra');
  });

  it('computes all 11 Special Life-Department Nakshatras with correct offsets and occupants', () => {
    // Ashwini = 0
    const specials = computeSpecialNakshatras(0, [
      { graha: 'sun', nakshatraIndex: 9 }, // Magha (index 9) = 10th from Ashwini = Karma Nakshatra!
      { graha: 'jupiter', nakshatraIndex: 12 }, // Hasta (index 12) = 13th from Ashwini = Abhisheka Nakshatra!
    ]);

    expect(specials.length).toBe(11);

    const keys = specials.map((s) => s.def.key);
    expect(keys).toEqual([
      'janma',
      'jaati',
      'naidhana',
      'karma',
      'desha',
      'abhisheka',
      'sanghatika',
      'samudayika',
      'aadhana',
      'vainashika',
      'manasa',
    ]);

    // Check Karma Nakshatra (10th from Ashwini => index 9 = Magha)
    const karmaStar = specials.find((s) => s.def.key === 'karma')!;
    expect(karmaStar.nakshatraIndex).toBe(9);
    expect(karmaStar.nakshatra).toBe('magha');
    expect(karmaStar.occupyingGrahas).toEqual(['sun']);

    // Check Abhisheka Nakshatra (13th from Ashwini => index 12 = Hasta)
    const abhiStar = specials.find((s) => s.def.key === 'abhisheka')!;
    expect(abhiStar.nakshatraIndex).toBe(12);
    expect(abhiStar.nakshatra).toBe('hasta');
    expect(abhiStar.occupyingGrahas).toEqual(['jupiter']);

    // Check Manasa Nakshatra (25th from Ashwini => index 24 = Purva Bhadrapada)
    const manasaStar = specials.find((s) => s.def.key === 'manasa')!;
    expect(manasaStar.nakshatraIndex).toBe(24);
    expect(manasaStar.nakshatra).toBe('purva_bhadrapada');
  });

  it('correctly calculates Latta (Planetary Kicks) matching classical textbook examples', () => {
    // Classical verification case from PVR Rao Ex. 112 (Bill Gates, p. 359-362):
    // Rahu in Punarvasu (index 6): kicks 9th backward -> Uttara Bhadrapada (index 25)
    const punarvasuIdx = NAKSHATRAS.indexOf('punarvasu'); // 6
    const ubhadraIdx = NAKSHATRAS.indexOf('uttara_bhadrapada'); // 25
    expect(punarvasuIdx).toBe(6);
    expect(ubhadraIdx).toBe(25);

    const rahuLatta = evaluateLattaForGraha('rahu', punarvasuIdx, ubhadraIdx);
    expect(rahuLatta).not.toBeNull();
    expect(rahuLatta!.direction).toBe('prishtha_latta');
    expect(rahuLatta!.stepCount).toBe(9);
    expect(rahuLatta!.kickedNakshatraIndex).toBe(ubhadraIdx);
    expect(rahuLatta!.kickedNakshatra).toBe('uttara_bhadrapada');
    expect(rahuLatta!.targetsJanmaNakshatra).toBe(true);

    // Mars in Mrigashira (index 4): kicks 3rd forward -> Punarvasu (index 6)
    const mrigashiraIdx = NAKSHATRAS.indexOf('mrigashira'); // 4
    expect(mrigashiraIdx).toBe(4);

    const marsLatta = evaluateLattaForGraha('mars', mrigashiraIdx, 0, punarvasuIdx);
    expect(marsLatta).not.toBeNull();
    expect(marsLatta!.direction).toBe('purolatta');
    expect(marsLatta!.stepCount).toBe(3);
    expect(marsLatta!.kickedNakshatraIndex).toBe(punarvasuIdx);
    expect(marsLatta!.kickedNakshatra).toBe('punarvasu');
    expect(marsLatta!.targetsLagnaNakshatra).toBe(true);

    // Forward check: Sun in Ashwini (0) -> kicks 12th forward: (0 + 12 - 1) = 11 (Uttara Phalguni)
    const sunLatta = evaluateLattaForGraha('sun', 0, 11);
    expect(sunLatta!.kickedNakshatraIndex).toBe(11);
    expect(sunLatta!.targetsJanmaNakshatra).toBe(true);

    // Forward check: Saturn in Ashwini (0) -> kicks 8th forward: (0 + 8 - 1) = 7 (Pushya)
    const saturnLatta = evaluateLattaForGraha('saturn', 0, 7);
    expect(saturnLatta!.kickedNakshatraIndex).toBe(7);
    expect(saturnLatta!.targetsJanmaNakshatra).toBe(true);
  });

  it('evaluates comprehensive Transit Navatara triggers and Latta afflictions', () => {
    // Native has Moon in Ashwini (0) and Lagna in Rohini (3)
    const evalResult = evaluateTransitNavatara({
      natalMoonNakshatraIndex: 0,
      natalLagnaNakshatraIndex: 3,
      transitGrahas: {
        saturn: { nakshatraIndex: 9 }, // Magha = 10th from Ashwini = Karma Nakshatra!
        jupiter: { nakshatraIndex: 12 }, // Hasta = 13th from Ashwini = Abhisheka Nakshatra!
        mars: { nakshatraIndex: 1 }, // Bharani (index 1) -> kicks 3rd forward: 1 + 3 - 1 = 3 (Rohini = Lagna star!)
      },
    });

    expect(evalResult.specialNakshatraTriggers.length).toBe(2);

    const satTrigger = evalResult.specialNakshatraTriggers.find((t) => t.graha === 'saturn')!;
    expect(satTrigger.specialNakshatra.key).toBe('karma');

    const jupTrigger = evalResult.specialNakshatraTriggers.find((t) => t.graha === 'jupiter')!;
    expect(jupTrigger.specialNakshatra.key).toBe('abhisheka');

    expect(evalResult.lattaAfflictions.length).toBe(1);
    expect(evalResult.lattaAfflictions[0]!.graha).toBe('mars');
    expect(evalResult.lattaAfflictions[0]!.targetsLagnaNakshatra).toBe(true);
  });
});
