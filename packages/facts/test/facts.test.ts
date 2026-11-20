import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadEphemeris,
  resolveBirthTime,
  computePositions,
  computeShadbala,
  computeAshtakvarga,
  computeVimshottariDashas,
  type EphemerisProvider,
} from '@astro/engine';
import { buildChartWorkspace } from '../src/workspace.js';

describe('L2-M1: packages/facts & chart.db workspace', () => {
  let eph: EphemerisProvider;

  beforeAll(async () => {
    eph = await loadEphemeris('swisseph');
  });

  it('emits golden 4th-house facts for the Taurus-Lagna sample chart and builds chart.db in < 150 ms', () => {
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
    const ashtakvarga = computeAshtakvarga({
      sun: natal.grahas.sun.signIndex,
      moon: natal.grahas.moon.signIndex,
      mars: natal.grahas.mars.signIndex,
      mercury: natal.grahas.mercury.signIndex,
      jupiter: natal.grahas.jupiter.signIndex,
      venus: natal.grahas.venus.signIndex,
      saturn: natal.grahas.saturn.signIndex,
      lagna: natal.lagna?.signIndex ?? 0,
    });
    const dashas = computeVimshottariDashas(
      natal.grahas.moon.nakshatraIndex,
      natal.grahas.moon.elapsedInNakshatra,
      res.resolved.birthLocal,
      2,
    );

    const ws = buildChartWorkspace({
      natal,
      shadbala,
      ashtakvarga,
      dashas,
      options: { referenceDateIso: '2026-11-18T00:00:00Z' },
    });

    try {
      expect(ws.buildMs).toBeLessThan(150);

      // Verify Taurus Lagna & 4th house Leo
      const lord4 = ws.getFact('lord.house4');
      expect(lord4).not.toBeNull();
      expect(lord4?.value).toBe('sun');
      expect(lord4?.args.sign).toBe('leo');
      expect(lord4?.args.placedHouseLagna).toBe(4);
      expect(lord4?.args.placedSign).toBe('leo');

      // Verify Sun dignity in Leo
      const sunDignity = ws.getFact('dignity.sun');
      expect(sunDignity?.value).toBe('own');

      // Verify Rahu-Venus tight conjunction (~0.7 deg)
      const conjRahuVenus = ws.getFact('conj.rahu.venus');
      expect(conjRahuVenus).not.toBeNull();
      expect(conjRahuVenus?.args.label).toBe('tight');
      expect(Number(conjRahuVenus?.value)).toBeLessThan(1.5);

      // Verify Mercury-Rahu tight conjunction (~1.0 deg)
      const conjMercuryRahu = ws.getFact('conj.mercury.rahu');
      expect(conjMercuryRahu).not.toBeNull();
      expect(conjMercuryRahu?.args.label).toBe('tight');
      expect(Number(conjMercuryRahu?.value)).toBeLessThan(2.0);

      // Verify Rahu-Sun wide conjunction (~14.4 deg)
      const conjRahuSun = ws.getFact('conj.rahu.sun');
      expect(conjRahuSun).not.toBeNull();
      expect(conjRahuSun?.args.label).toBe('wide');

      // Verify Venus & Mercury are not combust
      expect(ws.getFact('combust.venus')?.value).toBe(false);
      expect(ws.getFact('combust.mercury')?.value).toBe(false);

      // Verify Rahu nakshatra is Magha
      const nakRahu = ws.getFact('nakshatra.rahu');
      expect(nakRahu?.value).toBe('magha');

      // Verify SQLite tables populated
      const factCount = (ws.db.prepare('SELECT COUNT(*) as c FROM fact').get() as { c: number }).c;
      const edgeCount = (ws.db.prepare('SELECT COUNT(*) as c FROM edge').get() as { c: number }).c;
      const periodCount = (ws.db.prepare('SELECT COUNT(*) as c FROM period').get() as { c: number }).c;

      expect(factCount).toBeGreaterThan(40);
      expect(edgeCount).toBeGreaterThan(20);
      expect(periodCount).toBeGreaterThan(10);
    } finally {
      ws.close();
    }
  });
});
