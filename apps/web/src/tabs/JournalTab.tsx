import React, { useState, useEffect } from 'react';
import { PenLine, FlaskConical, Target, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { NatalChart, DayView, HourScore, AshtakvargaResult, SubjectiveLog } from '@astro/engine';
import { JournalExplorer, type JournalEntry } from '../components/JournalExplorer.tsx';
import { CalibrationExplorer } from '../components/CalibrationExplorer.tsx';
import { API_BASE_URL } from '../config.ts';
import { useReading } from '../context/ReadingContext.tsx';
import {
  loadLifeEvents,
  removeLifeEvent,
  subscribeLifeEvents,
  type LifeEventItem,
} from '../utils/lifeEventsStore.ts';

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
  const [lifeEvents, setLifeEvents] = useState<LifeEventItem[]>(() => loadLifeEvents());
  const { openLifeEventModal, openAskDrawer } = useReading();

  useEffect(() => {
    return subscribeLifeEvents(setLifeEvents);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div
          style={{
            display: 'flex',
            gap: 6,
            background: 'var(--surface-alt)',
            padding: 4,
            borderRadius: 10,
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => setSubTab('timeline')}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: subTab === 'timeline' ? 'var(--gold)' : 'transparent',
              color: subTab === 'timeline' ? '#15132b' : 'var(--text-muted)',
            }}
          >
            <PenLine size={13} /> Life Milestones &amp; Daily Logs
          </button>
          <button
            type="button"
            onClick={() => setSubTab('calibration')}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: subTab === 'calibration' ? 'var(--teal)' : 'transparent',
              color: subTab === 'calibration' ? '#15132b' : 'var(--text-muted)',
            }}
          >
            <FlaskConical size={13} /> Personal Patterns
          </button>
        </div>

        <button
          type="button"
          onClick={() => openLifeEventModal()}
          className="btn btn-outline"
          style={{ fontSize: 12, borderColor: 'rgba(95, 194, 179, 0.4)' }}
        >
          <Plus size={13} style={{ color: 'var(--teal)' }} /> Add Life Milestone
        </button>
      </div>

      {subTab === 'timeline' && (
        <>
          {/* Unified Life Milestones Strip (Synced with Timing Tab & LifeEventModal) */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={16} style={{ color: 'var(--teal)' }} />
                <strong className="serif-title" style={{ fontSize: 14, color: 'var(--gold)' }}>
                  Life Milestones ({lifeEvents.length})
                </strong>
              </div>
              <button
                type="button"
                onClick={() => openLifeEventModal()}
                style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--teal)' }}
              >
                + Decode New Date
              </button>
            </div>

            {lifeEvents.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                No milestones logged yet — add a major career, relationship, or relocation date to link it with your chart&apos;s Dashas &amp; AI explanations.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
                {lifeEvents.map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                      <strong style={{ color: 'var(--text-main)' }}>{ev.title}</strong>
                      <button
                        type="button"
                        aria-label={`Remove ${ev.title}`}
                        onClick={() => setLifeEvents(removeLifeEvent(ev.id))}
                        style={{ color: 'var(--text-muted)', padding: 2 }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gold)' }}>
                      {ev.date} • {ev.category.toUpperCase()}
                    </div>
                    <button
                      type="button"
                      onClick={() => openAskDrawer(`Explain my milestone "${ev.title}" on ${ev.date} (${ev.category}) against my birth chart and active Dasha.`)}
                      style={{ alignSelf: 'flex-start', marginTop: 2, fontSize: 11, fontWeight: 700, color: 'var(--teal)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Sparkles size={11} /> Ask AI →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
        </>
      )}

      {subTab === 'calibration' && <CalibrationExplorer realJournalLogs={calibrationLogs} />}
    </div>
  );
};
