import React, { useState } from 'react';
import { PenLine, FlaskConical } from 'lucide-react';
import type { NatalChart, DayView, HourScore, AshtakvargaResult, SubjectiveLog } from '@astro/engine';
import { JournalExplorer, type JournalEntry } from '../components/JournalExplorer.tsx';
import { CalibrationExplorer } from '../components/CalibrationExplorer.tsx';
import { API_BASE_URL } from '../config.ts';

interface JournalTabProps {
  natalChart: NatalChart;
  currentScore: HourScore | null;
  dayView: DayView | null;
  ashtakvarga: AshtakvargaResult | null;
  backendProfileId: string | null;
  calibrationLogs: SubjectiveLog[];
  onEntriesChange: (entries: JournalEntry[]) => void;
}

export const JournalTab: React.FC<JournalTabProps> = ({
  natalChart,
  currentScore,
  dayView,
  ashtakvarga,
  backendProfileId,
  calibrationLogs,
  onEntriesChange,
}) => {
  const [subTab, setSubTab] = useState<'timeline' | 'calibration'>('timeline');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          display: 'flex',
          gap: 8,
          background: 'var(--surface-alt)',
          padding: 4,
          borderRadius: 8,
          border: '1px solid var(--border-subtle)',
          alignSelf: 'flex-start',
        }}
      >
        <button
          onClick={() => setSubTab('timeline')}
          style={{
            padding: '5px 14px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: subTab === 'timeline' ? 'var(--gold)' : 'transparent',
            color: subTab === 'timeline' ? '#15132b' : 'var(--text-muted)',
          }}
        >
          <PenLine size={13} /> Timeline &amp; Daily Logs
        </button>
        <button
          onClick={() => setSubTab('calibration')}
          style={{
            padding: '5px 14px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: subTab === 'calibration' ? 'var(--teal)' : 'transparent',
            color: subTab === 'calibration' ? '#15132b' : 'var(--text-muted)',
          }}
        >
          <FlaskConical size={13} /> Calibration Patterns (n ≥ 30)
        </button>
      </div>

      {subTab === 'timeline' && (
        <JournalExplorer
          natalChart={natalChart}
          currentScore={currentScore}
          dayView={dayView}
          ashtakvarga={ashtakvarga}
          onEntriesChange={(entries) => {
            onEntriesChange(entries);
            if (backendProfileId && entries.length > 0) {
              const latest = entries[0] as any;
              if (latest) {
                fetch(`${API_BASE_URL}/api/journal`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: latest.id,
                    profileId: backendProfileId,
                    entryDate: (latest.createdAtIso ?? latest.atUtc ?? new Date().toISOString()).slice(0, 10),
                    note: latest.note,
                    energy: latest.energyRating ?? latest.energy,
                    focus: latest.focusRating ?? latest.focus ?? latest.energy,
                    mood: latest.moodRating ?? latest.mood,
                    skySnapshot: latest.skySnapshot ?? latest.snapshot,
                  }),
                }).catch(() => {});
              }
            }
          }}
        />
      )}

      {subTab === 'calibration' && <CalibrationExplorer realJournalLogs={calibrationLogs} />}
    </div>
  );
};
