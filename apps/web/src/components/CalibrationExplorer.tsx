import React, { useState, useMemo } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Info,
  CheckCircle2,
  Clock,
  FlaskConical,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import {
  runCalibrationAnalysis,
  generateSyntheticTestEntries,
  type SubjectiveLog,
} from '@astro/engine';
import { useReading } from '../context/ReadingContext.tsx';

interface CalibrationExplorerProps {
  realJournalLogs: SubjectiveLog[];
  onAddSyntheticLogs?: (logs: SubjectiveLog[]) => void;
  onClearLogs?: () => void;
}

export const CalibrationExplorer: React.FC<CalibrationExplorerProps> = ({
  realJournalLogs,
  onAddSyntheticLogs,
}) => {
  const { isQuant, openAskDrawer } = useReading();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [syntheticLogs, setSyntheticLogs] = useState<SubjectiveLog[]>([]);
  const [showQuantDetails, setShowQuantDetails] = useState(false);

  // Combined logs: user's real entries + synthetic test data if loaded
  const combinedLogs = useMemo(() => {
    return [...realJournalLogs, ...syntheticLogs];
  }, [realJournalLogs, syntheticLogs]);

  // Run the 1,000-resample bootstrap analysis
  const analysis = useMemo(() => {
    return runCalibrationAnalysis(combinedLogs, 30);
  }, [combinedLogs]);

  const handleLoadSynthetic = () => {
    const generated = generateSyntheticTestEntries(45);
    setSyntheticLogs(generated);
    if (onAddSyntheticLogs) {
      onAddSyntheticLogs(generated);
    }
  };

  const handleClearSynthetic = () => {
    setSyntheticLogs([]);
  };

  const categories = [
    { id: 'all', label: 'All Factors' },
    { id: 'chandra_bala', label: 'Chandra Bala' },
    { id: 'tara_bala', label: 'Tara Bala' },
    { id: 'time_quality', label: 'Time Quality' },
    { id: 'hora', label: 'Hora Lords' },
    { id: 'ashtakvarga', label: 'Ashtakvarga' },
  ];

  const filteredResults = useMemo(() => {
    if (selectedCategory === 'all') return analysis.results;
    return analysis.results.filter((r) => r.category === selectedCategory);
  }, [analysis.results, selectedCategory]);

  const verifiedCount = analysis.results.filter(
    (r) => r.hasEnoughData && (r.isMoodSignificant || r.isEnergySignificant)
  ).length;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FlaskConical size={20} style={{ color: 'var(--teal)' }} />
            <h2 className="serif-title" style={{ fontSize: 18, color: 'var(--text-main)' }}>Personal Calibration Engine</h2>
            <span className="teal-badge" style={{ fontSize: 10 }}>Bootstrap 95% CI</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Empirical statistical correlation testing traditional astrological rules against your personal logged experience (n ≥ 30).
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() =>
              openAskDrawer(
                `I have logged ${realJournalLogs.length} daily check-ins. How do my mood and energy check-ins line up with my Moon transits and active Dasha?`,
              )
            }
            className="btn btn-primary"
            style={{ fontSize: 12 }}
          >
            <Sparkles size={13} /> Ask AI About My Patterns
          </button>

          {(isQuant || showQuantDetails) && (
            syntheticLogs.length === 0 ? (
              <button
                onClick={handleLoadSynthetic}
                style={{
                  background: 'var(--surface-alt)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 600,
                }}
                title="Inject 45 realistic synthetic logs to test statistical calibration"
              >
                <Sparkles size={14} style={{ color: 'var(--gold)' }} />
                Load Test Data (n=45)
              </button>
            ) : (
              <button
                onClick={handleClearSynthetic}
                style={{
                  background: 'var(--surface-alt)',
                  color: 'var(--amber)',
                  border: '1px solid var(--amber)',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 600,
                }}
              >
                <RefreshCw size={14} />
                Clear Test Data
              </button>
            )
          )}

          {!isQuant && (
            <button
              type="button"
              onClick={() => setShowQuantDetails((v) => !v)}
              className="btn btn-outline"
              style={{ fontSize: 11.5 }}
            >
              {showQuantDetails ? 'Hide Quant Stats' : 'Advanced Stats (Bootstrap CI)'}
            </button>
          )}
        </div>
      </div>

      {!isQuant && !showQuantDetails && (
        <div style={{ padding: 14, borderRadius: 10, background: 'rgba(95, 194, 179, 0.08)', border: '1px solid rgba(95, 194, 179, 0.3)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
            <strong style={{ color: 'var(--teal)' }}>Personal Calibration Progress</strong>
            <span style={{ fontWeight: 700 }}>{Math.min(30, realJournalLogs.length)} / 30 check-ins</span>
          </div>
          <div style={{ height: 7, borderRadius: 999, background: 'var(--surface-alt)', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, Math.round((realJournalLogs.length / 30) * 100))}%`, height: '100%', background: 'var(--teal)' }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {realJournalLogs.length >= 30
              ? 'You have enough check-ins for statistical verification! Click "Advanced Stats" above or switch to Quant mode to inspect 95% confidence intervals.'
              : `Log 1-tap check-ins from the Today screen (${30 - realJournalLogs.length} more to reach statistical calibration) to discover which transits genuinely shift your energy and mood.`}
          </div>
        </div>
      )}

      {/* Baseline Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div style={{ background: 'var(--surface-alt)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={13} style={{ color: 'var(--teal)' }} /> Total Observations
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, fontFamily: 'serif' }}>{analysis.totalLogs}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {realJournalLogs.length} real {syntheticLogs.length > 0 ? `+ ${syntheticLogs.length} test` : ''}
          </div>
        </div>

        <div style={{ background: 'var(--surface-alt)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={13} style={{ color: 'var(--gold)' }} /> Global Mood Mean (μ)
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, fontFamily: 'serif', color: 'var(--gold)' }}>
            {analysis.totalLogs > 0 ? analysis.baselineMoodMean.toFixed(2) : '—'}{' '}
            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>/ 5.0</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Overall subjective mood</div>
        </div>

        <div style={{ background: 'var(--surface-alt)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={13} style={{ color: 'var(--teal)' }} /> Global Energy Mean
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, fontFamily: 'serif', color: 'var(--teal)' }}>
            {analysis.totalLogs > 0 ? analysis.baselineEnergyMean.toFixed(2) : '—'}{' '}
            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>/ 5.0</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Vitality baseline</div>
        </div>

        <div style={{ background: 'var(--surface-alt)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={13} style={{ color: 'var(--teal)' }} /> Verified Factors
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, fontFamily: 'serif', color: 'var(--teal)' }}>{verifiedCount}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>95% CI excludes zero</div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              background: selectedCategory === c.id ? 'var(--teal)' : 'var(--surface-alt)',
              color: selectedCategory === c.id ? '#15132b' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Results List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredResults.map((res) => {
          const progressPercent = Math.min(100, Math.round((res.sampleCount / res.minRequiredCount) * 100));
          const hasSignificance = res.isMoodSignificant || res.isEnergySignificant;

          return (
            <div
              key={res.conditionId}
              style={{
                background: hasSignificance ? 'rgba(64, 184, 170, 0.08)' : 'var(--surface-alt)',
                border: `1px solid ${hasSignificance ? 'var(--teal)' : 'var(--border-subtle)'}`,
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>{res.conditionName}</h3>
                    {hasSignificance && (
                      <span className="teal-badge" style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={11} /> Statistically Verified
                      </span>
                    )}
                    {!res.hasEnoughData && (
                      <span className="amber-badge" style={{ fontSize: 10 }}>
                        Gathering Observations ({res.sampleCount}/{res.minRequiredCount})
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Category: <span style={{ textTransform: 'capitalize' }}>{res.category.replace('_', ' ')}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}>
                    {res.sampleCount} observations
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {res.hasEnoughData ? 'Threshold met (n ≥ 30)' : `${res.minRequiredCount - res.sampleCount} more needed`}
                  </div>
                </div>
              </div>

              {/* Progress bar if under threshold */}
              {!res.hasEnoughData && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ width: '100%', background: 'var(--border-subtle)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                    <div
                      style={{
                        background: 'var(--amber)',
                        height: '100%',
                        borderRadius: 999,
                        width: `${progressPercent}%`,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Statistical Shift if enough data */}
              {res.hasEnoughData && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ background: 'var(--card-bg, #1a1738)', padding: 10, borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Mood Effect (Δμ)</span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          color: res.deltaMoodMean > 0 ? 'var(--teal)' : res.deltaMoodMean < 0 ? 'var(--amber)' : 'var(--text-muted)',
                        }}
                      >
                        {res.deltaMoodMean > 0 ? `+${res.deltaMoodMean.toFixed(2)}` : res.deltaMoodMean.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'monospace' }}>
                      95% CI: [{res.moodCi95[0] > 0 ? `+${res.moodCi95[0]}` : res.moodCi95[0]}, {res.moodCi95[1] > 0 ? `+${res.moodCi95[1]}` : res.moodCi95[1]}]
                    </div>
                  </div>

                  <div style={{ background: 'var(--card-bg, #1a1738)', padding: 10, borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Energy Effect (Δμ)</span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          color: res.deltaEnergyMean > 0 ? 'var(--teal)' : res.deltaEnergyMean < 0 ? 'var(--amber)' : 'var(--text-muted)',
                        }}
                      >
                        {res.deltaEnergyMean > 0 ? `+${res.deltaEnergyMean.toFixed(2)}` : res.deltaEnergyMean.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'monospace' }}>
                      95% CI: [{res.energyCi95[0] > 0 ? `+${res.energyCi95[0]}` : res.energyCi95[0]}, {res.energyCi95[1] > 0 ? `+${res.energyCi95[1]}` : res.energyCi95[1]}]
                    </div>
                  </div>
                </div>
              )}

              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Info size={13} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                <span>{res.summaryText}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanatory Footer */}
      <div style={{ background: 'var(--surface-alt)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>
          <HelpCircle size={14} style={{ color: 'var(--teal)' }} />
          How Personal Calibration Works
        </div>
        <p style={{ lineHeight: 1.5 }}>
          Vedic texts claim categorical effects for factors like Chandrashtama (Moon in 8th house) or Tara Bala.
          Instead of relying on rigid dogma, this engine performs 1,000 bootstrap resamples on your actual logged entries.
          A correlation is confirmed only when the 95% Confidence Interval excludes 0, establishing that the shift is
          statistically significant and not random noise.
        </p>
      </div>
    </div>
  );
};
