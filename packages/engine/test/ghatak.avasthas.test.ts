import { describe, it, expect } from 'vitest';
import {
  computeFavourableAndGhatak,
  computeBaladiAvastha,
  computeJagratadiAvastha,
  computeDeeptadiAvastha,
  computePlanetaryAvasthas,
  computeMutualAspects,
  generateLlmDossier,
  type NatalChart,
} from '../src/index.js';

describe('Ghatak & Favourable Points against AstroSage Golden Fixture', () => {
  it('conforms to Page 2 of AstroSage golden report for Pisces Moon (Priyanka Kumari)', () => {
    // Priyanka Kumari: Moon in Pisces (index 11), Revati Nakshatra
    const result = computeFavourableAndGhatak(11);

    expect(result.ghatak.badDay).toBe('Friday');
    expect(result.ghatak.badRasi).toBe('Kumbh');
    expect(result.ghatak.badLagna).toBe('Singha');
    expect(result.ghatak.badNakshatra).toBe('Ashlesha');
    expect(result.ghatak.badKaran).toBe('Chatuspad');
    expect(result.ghatak.badYoga).toBe('Vajra');
    expect(result.ghatak.badPlanets).toContain('Venus');
    expect(result.ghatak.badPlanets).toContain('Mercury');

    expect(result.favourable.luckyNumber).toBe(2);
    expect(result.favourable.goodNumbers).toEqual([2, 7, 9]);
    expect(result.favourable.evilNumbers).toEqual([4, 8]);
    expect(result.favourable.goodYears).toContain(11);
    expect(result.favourable.goodYears).toContain(20);
    expect(result.favourable.luckyMetal).toBe('Gold');
    expect(result.favourable.luckyStone).toBe('Yellow Sapphire');
  });
});

describe('Planetary Avasthas against AstroSage Golden Fixture (Page 23)', () => {
  it('computes Baladi Avasthas conforming to degree & odd/even sign rules', () => {
    // Sun: Capricorn (Even sign, index 9), 6°55' -> falls in 6°-12° -> Vradha
    expect(computeBaladiAvastha(6.92, 9)).toBe('Vradha');

    // Moon: Pisces (Even sign, index 11), 29°10' -> falls in 24°-30° -> Bala
    expect(computeBaladiAvastha(29.17, 11)).toBe('Bala');

    // Mars: Pisces (Even sign, index 11), 7°37' -> falls in 6°-12° -> Vradha
    expect(computeBaladiAvastha(7.62, 11)).toBe('Vradha');

    // Mercury: Capricorn (Even sign, index 9), 20°09' -> falls in 18°-24° -> Kumar
    expect(computeBaladiAvastha(20.15, 9)).toBe('Kumar');

    // Jupiter: Gemini (Odd sign, index 2), 14°10' -> falls in 12°-18° -> Yuva
    expect(computeBaladiAvastha(14.18, 2)).toBe('Yuva');

    // Venus: Capricorn (Even sign, index 9), 8°30' -> falls in 6°-12° -> Vradha
    expect(computeBaladiAvastha(8.5, 9)).toBe('Vradha');

    // Saturn: Taurus (Even sign, index 1), 14°26' -> falls in 12°-18° -> Yuva
    expect(computeBaladiAvastha(14.44, 1)).toBe('Yuva');
  });

  it('computes Jagratadi and Deeptadi Avasthas correctly', () => {
    expect(computeJagratadiAvastha('own')).toBe('Jaagrat');
    expect(computeJagratadiAvastha('friend')).toBe('Swapna');
    expect(computeJagratadiAvastha('enemy')).toBe('Susupta');

    expect(computeDeeptadiAvastha('exalted', false)).toBe('Deepta');
    expect(computeDeeptadiAvastha('own', false)).toBe('Swatha');
    expect(computeDeeptadiAvastha('great_friend', false)).toBe('Muditha');
    expect(computeDeeptadiAvastha('friend', false)).toBe('Shant');
    expect(computeDeeptadiAvastha('neutral', false)).toBe('Deena');
    expect(computeDeeptadiAvastha('enemy', false)).toBe('Dukhita');
    expect(computeDeeptadiAvastha('debilitated', false)).toBe('Khal');
    expect(computeDeeptadiAvastha('own', true)).toBe('Vikala'); // Combust
  });
});

describe('Prompt-Ready LLM Context Dossier Engine', () => {
  it('generates structured JSON and comprehensive Markdown context for LLM synthesis', () => {
    const mockChart = {
      ayanamsa: { id: 'lahiri', value: 23.88 },
      time: { julianDayUt: 2452296, birthLocal: '2002-01-21T06:30:00', birthUtc: '2002-01-21T01:00:00Z', isDaytime: true },
      lagna: { lon: 276.49, sign: 'Capricorn', signIndex: 9, degInSign: 6.49 },
      grahas: {
        sun: { lon: 276.93, sign: 'Capricorn', signIndex: 9, degInSign: 6.93, speed: 1.0, retrograde: false, nakshatraName: 'Uttarashadha', nakshatraIndex: 20, pada: 4, dignity: 'enemy' },
        moon: { lon: 359.17, sign: 'Pisces', signIndex: 11, degInSign: 29.17, speed: 13.2, retrograde: false, nakshatraName: 'Revati', nakshatraIndex: 26, pada: 4, dignity: 'friend' },
        mars: { lon: 337.62, sign: 'Pisces', signIndex: 11, degInSign: 7.62, speed: 0.7, retrograde: false, nakshatraName: 'Uttarabhadra', nakshatraIndex: 25, pada: 2, dignity: 'friend' },
        mercury: { lon: 290.15, sign: 'Capricorn', signIndex: 9, degInSign: 20.15, speed: -0.2, retrograde: true, nakshatraName: 'Shravana', nakshatraIndex: 21, pada: 4, dignity: 'neutral' },
        jupiter: { lon: 74.18, sign: 'Gemini', signIndex: 2, degInSign: 14.18, speed: -0.1, retrograde: true, nakshatraName: 'Ardra', nakshatraIndex: 5, pada: 3, dignity: 'enemy' },
        venus: { lon: 278.50, sign: 'Capricorn', signIndex: 9, degInSign: 8.50, speed: 1.2, retrograde: false, nakshatraName: 'Uttarashadha', nakshatraIndex: 20, pada: 4, dignity: 'friend' },
        saturn: { lon: 44.44, sign: 'Taurus', signIndex: 1, degInSign: 14.44, speed: -0.05, retrograde: true, nakshatraName: 'Rohini', nakshatraIndex: 3, pada: 2, dignity: 'great_friend' },
        rahu: { lon: 61.41, sign: 'Gemini', signIndex: 2, degInSign: 1.41, speed: -0.05, retrograde: true, nakshatraName: 'Mrigashira', nakshatraIndex: 4, pada: 3 },
        ketu: { lon: 241.41, sign: 'Sagittarius', signIndex: 8, degInSign: 1.41, speed: -0.05, retrograde: true, nakshatraName: 'Mula', nakshatraIndex: 18, pada: 1 },
      },
      housesFromLagna: [],
      housesFromMoon: [],
    } as unknown as NatalChart;

    const avasthas = computePlanetaryAvasthas(mockChart.grahas);
    const ghatak = computeFavourableAndGhatak(11);
    const aspects = computeMutualAspects(mockChart.grahas);

    const dossier = generateLlmDossier({
      userName: 'Priyanka Kumari',
      birthDate: '2002-01-21',
      birthTime: '06:30:00',
      cityName: 'Jamshedpur',
      lat: 22.80,
      lon: 86.20,
      tzId: 'Asia/Kolkata',
      ayanamsa: 'lahiri',
      timeCertainty: 'exact',
      natalChart: mockChart,
      avasthas,
      ghatak,
      aspects,
    });

    expect(dossier.markdownPrompt).toContain('# SYSTEM INSTRUCTION FOR LLM ASTROLOGER');
    expect(dossier.markdownPrompt).toContain('Priyanka Kumari');
    expect(dossier.markdownPrompt).toContain('Capricorn');
    expect(dossier.markdownPrompt).toContain('Revati');
    expect(dossier.markdownPrompt).toContain('Ashlesha');
    expect(dossier.markdownPrompt).toContain('Yellow Sapphire');
    expect(dossier.tokenEstimate).toBeGreaterThan(300);
    expect(dossier.structuredJson.grahas.length).toBe(9);
  });
});
