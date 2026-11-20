import { describe, it, expect } from 'vitest';
import {
  computeBootstrapCI,
  runCalibrationAnalysis,
  generateSyntheticTestEntries,
} from '../src/calibration/index.js';

describe('Calibration Engine', () => {
  it('computes bootstrap confidence interval correctly', () => {
    const sample = [4, 5, 4, 5, 4, 5, 4, 5, 5, 4];
    const baseline = 3.0;
    const res = computeBootstrapCI(sample, baseline, 500);

    expect(res.deltaMean).toBeGreaterThan(1.0);
    expect(res.ci95[0]).toBeGreaterThan(0.5);
    expect(res.ci95[1]).toBeGreaterThan(res.ci95[0]);
    expect(res.isSignificant).toBe(true);
  });

  it('declares no significance when sample is near baseline', () => {
    const sample = [3, 3, 3, 3, 3, 3];
    const baseline = 3.0;
    const res = computeBootstrapCI(sample, baseline, 500);

    expect(res.deltaMean).toBe(0);
    expect(res.ci95[0]).toBeLessThanOrEqual(0);
    expect(res.ci95[1]).toBeGreaterThanOrEqual(0);
    expect(res.isSignificant).toBe(false);
  });

  it('runs complete calibration analysis on synthetic data', () => {
    const synthetic = generateSyntheticTestEntries(50);
    expect(synthetic.length).toBe(50);

    const report = runCalibrationAnalysis(synthetic, 20); // using 20 threshold for unit test
    expect(report.totalLogs).toBe(50);
    expect(report.baselineMoodMean).toBeGreaterThan(1);
    expect(report.baselineEnergyMean).toBeGreaterThan(1);
    expect(report.results.length).toBeGreaterThan(5);

    const chandrashtama = report.results.find((r) => r.conditionId === 'chandrashtama');
    expect(chandrashtama).toBeDefined();
    expect(chandrashtama?.sampleCount).toBeGreaterThanOrEqual(1);
  });
});
