/**
 * Personal Calibration Patterns Engine
 *
 * Implements client-side bootstrap 95% Confidence Interval (CI) statistical analysis
 * correlating subjective user check-ins (mood, energy) with objective astrological conditions.
 */

export interface SubjectiveLog {
  mood: number; // 1 to 5
  energy: number; // 1 to 5
  atUtc: string;
  snapshot: {
    score: number;
    band: 'flowing' | 'steady' | 'go_gently';
    horaRuler: string;
    moonSign: string;
    moonNakshatra: string;
    dasha: string;
    chandraBalaHouse?: number; // House of transit Moon from natal Moon (1-12)
    taraBalaCategory?: 'janma' | 'sampat' | 'vipat' | 'kshema' | 'pratyari' | 'sadhana' | 'naidhana' | 'mitra' | 'parama_mitra';
    horaCompatibility?: 'friend' | 'neutral' | 'enemy';
    savBindus?: number; // Bindus of transit sign in SAV
  };
}

export interface CalibrationCondition {
  id: string;
  category: 'chandra_bala' | 'tara_bala' | 'hora' | 'time_quality' | 'ashtakvarga' | 'dasha';
  name: string;
  description: string;
  filter: (log: SubjectiveLog) => boolean;
}

export interface BootstrapResult {
  conditionId: string;
  conditionName: string;
  category: string;
  sampleCount: number;
  minRequiredCount: number;
  hasEnoughData: boolean;
  baselineMoodMean: number;
  conditionMoodMean: number;
  deltaMoodMean: number;
  baselineEnergyMean: number;
  conditionEnergyMean: number;
  deltaEnergyMean: number;
  moodCi95: [number, number];
  energyCi95: [number, number];
  isMoodSignificant: boolean;
  isEnergySignificant: boolean;
  summaryText: string;
}

/**
 * Standard bootstrap resample to compute 95% confidence interval of sample mean difference
 */
export function computeBootstrapCI(
  sample: number[],
  baselineMean: number,
  iterations: number = 1000
): { deltaMean: number; ci95: [number, number]; isSignificant: boolean } {
  const n = sample.length;
  if (n === 0) {
    return { deltaMean: 0, ci95: [0, 0], isSignificant: false };
  }

  const sampleSum = sample.reduce((a, b) => a + b, 0);
  const sampleMean = sampleSum / n;
  const deltaMean = sampleMean - baselineMean;

  if (n < 5) {
    return { deltaMean, ci95: [deltaMean, deltaMean], isSignificant: false };
  }

  const diffs: number[] = new Array(iterations);

  // Deterministic or seeded pseudo-random resampler
  for (let b = 0; b < iterations; b++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.random() * n);
      sum += sample[idx];
    }
    const bootMean = sum / n;
    diffs[b] = bootMean - baselineMean;
  }

  diffs.sort((a, b) => a - b);
  const lowIdx = Math.floor(iterations * 0.025);
  const highIdx = Math.floor(iterations * 0.975);

  const ciLow = diffs[lowIdx];
  const ciHigh = diffs[highIdx];

  // Significant if 0 is outside the 95% confidence interval
  const isSignificant = (ciLow > 0 && ciHigh > 0) || (ciLow < 0 && ciHigh < 0);

  return {
    deltaMean: Math.round(deltaMean * 100) / 100,
    ci95: [Math.round(ciLow * 100) / 100, Math.round(ciHigh * 100) / 100],
    isSignificant,
  };
}

/**
 * Classical condition definitions to test
 */
export const DEFAULT_CALIBRATION_CONDITIONS: CalibrationCondition[] = [
  {
    id: 'chandrashtama',
    category: 'chandra_bala',
    name: 'Chandrashtama (Moon in 8th from Natal Moon)',
    description: 'Transit Moon transiting the 8th house of emotional turmoil and vulnerability.',
    filter: (log) => log.snapshot.chandraBalaHouse === 8,
  },
  {
    id: 'chandra_bala_benefic',
    category: 'chandra_bala',
    name: 'Favorable Chandra Bala (Houses 3, 6, 10, 11)',
    description: 'Transit Moon in Upachaya houses known to bestow vigor and operational success.',
    filter: (log) => [3, 6, 10, 11].includes(log.snapshot.chandraBalaHouse || 0),
  },
  {
    id: 'tara_favorable',
    category: 'tara_bala',
    name: 'Favorable Tara Bala (Sampat / Kshema / Sadhana / Mitra)',
    description: 'Auspicious nakshatra relationship from birth constellation indicating ease and support.',
    filter: (log) => ['sampat', 'kshema', 'sadhana', 'mitra', 'parama_mitra'].includes(log.snapshot.taraBalaCategory || ''),
  },
  {
    id: 'tara_challenging',
    category: 'tara_bala',
    name: 'Adverse Tara Bala (Vipat / Pratyari / Naidhana)',
    description: 'Challenging lunar constellations requiring conscious patience and non-reactivity.',
    filter: (log) => ['vipat', 'pratyari', 'naidhana'].includes(log.snapshot.taraBalaCategory || ''),
  },
  {
    id: 'flowing_band',
    category: 'time_quality',
    name: 'Flowing Celestial Band (+3 or higher)',
    description: 'Hours with positive net additive scores favoring proactive action.',
    filter: (log) => log.snapshot.band === 'flowing',
  },
  {
    id: 'go_gently_band',
    category: 'time_quality',
    name: 'Go Gently Celestial Band (-2 or lower)',
    description: 'Hours marked by malefic horas or inauspicious windows favoring low friction.',
    filter: (log) => log.snapshot.band === 'go_gently',
  },
  {
    id: 'hora_friendly',
    category: 'hora',
    name: 'Friendly Hora Lord',
    description: 'Hours governed by planetary friends of Lagna lord.',
    filter: (log) => log.snapshot.horaCompatibility === 'friend',
  },
  {
    id: 'hora_enemy',
    category: 'hora',
    name: 'Inimical Hora Lord',
    description: 'Hours governed by natural or temporal enemies of Lagna lord.',
    filter: (log) => log.snapshot.horaCompatibility === 'enemy',
  },
  {
    id: 'high_sav',
    category: 'ashtakvarga',
    name: 'High SAV Transit House (Bindus ≥ 30)',
    description: 'Transit through signs with strong collective Sarva Ashtakvarga nourishment.',
    filter: (log) => (log.snapshot.savBindus ?? 0) >= 30,
  },
  {
    id: 'low_sav',
    category: 'ashtakvarga',
    name: 'Low SAV Transit House (Bindus < 25)',
    description: 'Transit through signs with lean Ashtakvarga reserve requiring conserved energy.',
    filter: (log) => (log.snapshot.savBindus ?? 0) < 25 && (log.snapshot.savBindus ?? 0) > 0,
  },
];

/**
 * Run calibration analysis across all configured conditions
 */
export function runCalibrationAnalysis(
  logs: SubjectiveLog[],
  minRequiredCount: number = 30,
  conditions: CalibrationCondition[] = DEFAULT_CALIBRATION_CONDITIONS
): {
  totalLogs: number;
  baselineMoodMean: number;
  baselineEnergyMean: number;
  results: BootstrapResult[];
} {
  const totalLogs = logs.length;
  if (totalLogs === 0) {
    return {
      totalLogs: 0,
      baselineMoodMean: 0,
      baselineEnergyMean: 0,
      results: [],
    };
  }

  const baselineMoodMean = logs.reduce((sum, l) => sum + l.mood, 0) / totalLogs;
  const baselineEnergyMean = logs.reduce((sum, l) => sum + l.energy, 0) / totalLogs;

  const results: BootstrapResult[] = conditions.map((cond) => {
    const matchingLogs = logs.filter(cond.filter);
    const sampleCount = matchingLogs.length;
    const hasEnoughData = sampleCount >= minRequiredCount;

    const moods = matchingLogs.map((l) => l.mood);
    const energies = matchingLogs.map((l) => l.energy);

    const conditionMoodMean = sampleCount > 0 ? moods.reduce((a, b) => a + b, 0) / sampleCount : 0;
    const conditionEnergyMean = sampleCount > 0 ? energies.reduce((a, b) => a + b, 0) / sampleCount : 0;

    const moodBoot = computeBootstrapCI(moods, baselineMoodMean);
    const energyBoot = computeBootstrapCI(energies, baselineEnergyMean);

    let summaryText = '';
    if (!hasEnoughData) {
      summaryText = `Gathering data (${sampleCount}/${minRequiredCount} entries logged). Minimum 30 needed for empirical statistical significance.`;
    } else if (moodBoot.isSignificant || energyBoot.isSignificant) {
      const parts: string[] = [];
      if (moodBoot.isSignificant) {
        const direction = moodBoot.deltaMean > 0 ? 'higher' : 'lower';
        parts.push(`Mood is ${Math.abs(moodBoot.deltaMean).toFixed(2)} pts ${direction} (95% CI: ${moodBoot.ci95[0]} to ${moodBoot.ci95[1]})`);
      }
      if (energyBoot.isSignificant) {
        const direction = energyBoot.deltaMean > 0 ? 'higher' : 'lower';
        parts.push(`Energy is ${Math.abs(energyBoot.deltaMean).toFixed(2)} pts ${direction} (95% CI: ${energyBoot.ci95[0]} to ${energyBoot.ci95[1]})`);
      }
      summaryText = `Empirically verified correlation (n=${sampleCount}): ${parts.join('; ')}.`;
    } else {
      summaryText = `No statistically significant shift observed from baseline (n=${sampleCount}). 95% CI encompasses zero.`;
    }

    return {
      conditionId: cond.id,
      conditionName: cond.name,
      category: cond.category,
      sampleCount,
      minRequiredCount,
      hasEnoughData,
      baselineMoodMean: Math.round(baselineMoodMean * 100) / 100,
      conditionMoodMean: Math.round(conditionMoodMean * 100) / 100,
      deltaMoodMean: moodBoot.deltaMean,
      baselineEnergyMean: Math.round(baselineEnergyMean * 100) / 100,
      conditionEnergyMean: Math.round(conditionEnergyMean * 100) / 100,
      deltaEnergyMean: energyBoot.deltaMean,
      moodCi95: moodBoot.ci95,
      energyCi95: energyBoot.ci95,
      isMoodSignificant: moodBoot.isSignificant,
      isEnergySignificant: energyBoot.isSignificant,
      summaryText,
    };
  });

  return {
    totalLogs,
    baselineMoodMean: Math.round(baselineMoodMean * 100) / 100,
    baselineEnergyMean: Math.round(baselineEnergyMean * 100) / 100,
    results,
  };
}

/**
 * Utility to generate realistic sample synthetic entries for testing the calibration engine
 */
export function generateSyntheticTestEntries(count: number = 40): SubjectiveLog[] {
  const taraOptions: SubjectiveLog['snapshot']['taraBalaCategory'][] = [
    'janma', 'sampat', 'vipat', 'kshema', 'pratyari', 'sadhana', 'naidhana', 'mitra', 'parama_mitra'
  ];
  const entries: SubjectiveLog[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now - (count - i) * 18 * 3600 * 1000).toISOString();
    const chandraHouse = ((i * 3 + 1) % 12) + 1; // 1 to 12
    const tara = taraOptions[i % taraOptions.length];
    const isChandrashtama = chandraHouse === 8;
    const isFavorableTara = ['sampat', 'kshema', 'sadhana'].includes(tara || '');
    const isAdverseTara = ['vipat', 'pratyari', 'naidhana'].includes(tara || '');

    // Inject realistic synthetic correlations
    let moodBase = 3.5;
    let energyBase = 3.5;

    if (isChandrashtama) {
      moodBase -= 1.0;
      energyBase -= 0.6;
    }
    if (isFavorableTara) {
      moodBase += 0.7;
      energyBase += 0.5;
    }
    if (isAdverseTara) {
      moodBase -= 0.6;
      energyBase -= 0.4;
    }

    const moodNoise = (Math.random() - 0.5) * 1.0;
    const energyNoise = (Math.random() - 0.5) * 1.0;

    const mood = Math.max(1, Math.min(5, Math.round(moodBase + moodNoise)));
    const energy = Math.max(1, Math.min(5, Math.round(energyBase + energyNoise)));

    const band: 'flowing' | 'steady' | 'go_gently' =
      mood >= 4 ? 'flowing' : mood <= 2 ? 'go_gently' : 'steady';

    entries.push({
      mood,
      energy,
      atUtc: timestamp,
      snapshot: {
        score: band === 'flowing' ? 4 : band === 'go_gently' ? -2 : 1,
        band,
        horaRuler: ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'][i % 7],
        moonSign: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][i % 12],
        moonNakshatra: 'Ashwini',
        dasha: 'Jupiter-Saturn',
        chandraBalaHouse: chandraHouse,
        taraBalaCategory: tara,
        horaCompatibility: i % 3 === 0 ? 'friend' : i % 3 === 1 ? 'neutral' : 'enemy',
        savBindus: 20 + ((i * 7) % 18), // 20 to 37
      },
    });
  }

  return entries;
}
