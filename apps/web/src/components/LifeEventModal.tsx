import React, { useState, useEffect, useMemo } from 'react';
import { X, Target, Sparkles, Plus, Calendar, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import {
  SIGN_LORDS,
  type NatalChart,
  type VimshottariDashaTree,
  type YoginiDashaTree,
  type CharaDashaTree,
} from '@astro/engine';
import { useReading } from '../context/ReadingContext.tsx';
import {
  loadLifeEvents,
  addLifeEvent,
  removeLifeEvent,
  subscribeLifeEvents,
  type LifeEventItem,
  type LifeEventCategory,
} from '../utils/lifeEventsStore.ts';

interface LifeEventModalProps {
  natalChart: NatalChart;
  dashas: VimshottariDashaTree | null;
  yoginiDashas: YoginiDashaTree | null;
  charaDashas: CharaDashaTree | null;
}

const PRESET_EVENTS: Array<{ title: string; category: LifeEventCategory }> = [
  { title: 'Started new job / career shift', category: 'career' },
  { title: 'Moved to a new city or home', category: 'move' },
  { title: 'Major relationship milestone', category: 'relationship' },
  { title: 'Health or lifestyle turning point', category: 'health' },
  { title: 'Personal breakthrough or big win', category: 'breakthrough' },
];

const HOUSE_THEMES_SHORT: Record<number, string> = {
  1: 'identity, health & self-direction',
  2: 'income, family & speech',
  3: 'courage, skills & short moves',
  4: 'home, property & peace of mind',
  5: 'creativity, learning & romance',
  6: 'daily work, effort & problem-solving',
  7: 'marriage & committed partnerships',
  8: 'deep transformation & sudden shifts',
  9: 'mentors, higher learning, travel & luck',
  10: 'career, status & public role',
  11: 'gains, ambitions & social network',
  12: 'foreign stays, rest & letting go',
};

function findActiveVimshottari(dashas: VimshottariDashaTree | null, dateStr: string) {
  if (!dashas?.periods) return null;
  const target = `${dateStr}T12:00:00Z`;
  const maha = dashas.periods.find((p) => target >= p.startDateIso && target < p.endDateIso);
  if (!maha) return null;
  const antar = maha.subPeriods?.find((a) => target >= a.startDateIso && target < a.endDateIso);
  const pratyantar = antar?.subPeriods?.find((pr) => target >= pr.startDateIso && target < pr.endDateIso);
  return { maha, antar, pratyantar };
}

function findYoginiText(yogini: YoginiDashaTree | null, dateStr: string): string {
  if (!yogini?.periods) return '—';
  const target = `${dateStr}T12:00:00Z`;
  const maha = yogini.periods.find((p) => target >= p.startDateIso && target < p.endDateIso);
  if (!maha) return '—';
  const antar = maha.subPeriods?.find((a) => target >= a.startDateIso && target < a.endDateIso);
  return `${maha.name}${antar ? ` / ${antar.name}` : ''}`;
}

function findCharaText(chara: CharaDashaTree | null, dateStr: string): string {
  if (!chara?.periods) return '—';
  const target = `${dateStr}T12:00:00Z`;
  const maha = chara.periods.find((p) => target >= p.startDateIso && target < p.endDateIso);
  if (!maha) return '—';
  const antar = maha.subPeriods?.find((a) => target >= a.startDateIso && target < a.endDateIso);
  return `${maha.sign}${antar ? ` / ${antar.sign}` : ''}`;
}

function describeLordHouses(natalChart: NatalChart, lord: string): string {
  const g = (natalChart.grahas as any)[lord];
  if (!g) return '';
  const lagnaIdx = natalChart.lagna?.signIndex ?? 0;
  const owned: number[] = [];
  for (let h = 1; h <= 12; h++) {
    const signIdx = (lagnaIdx + h - 1) % 12;
    if (SIGN_LORDS[signIdx] === lord) owned.push(h);
  }
  const placedH = g.houses?.houseFromLagna ?? (g as any).houseFromLagna;
  const parts: string[] = [];
  if (placedH) parts.push(`sits in House ${placedH} (${HOUSE_THEMES_SHORT[placedH] ?? 'life area'})`);
  if (owned.length > 0) parts.push(`rules House ${owned.join(' & ')}`);
  return parts.join(' and ');
}

export const LifeEventModal: React.FC<LifeEventModalProps> = ({
  natalChart,
  dashas,
  yoginiDashas,
  charaDashas,
}) => {
  const {
    lifeEventModalOpen,
    lifeEventPreset,
    closeLifeEventModal,
    openAskDrawer,
    isGuided,
  } = useReading();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<LifeEventCategory>('career');
  const [savedNotice, setSavedNotice] = useState(false);
  const [events, setEvents] = useState<LifeEventItem[]>(() => loadLifeEvents());

  useEffect(() => {
    const unsub = subscribeLifeEvents(setEvents);
    return unsub;
  }, []);

  useEffect(() => {
    if (!lifeEventModalOpen) return;
    setSavedNotice(false);
    setEvents(loadLifeEvents());
    if (lifeEventPreset?.title) setTitle(lifeEventPreset.title);
    if (lifeEventPreset?.date) setDate(lifeEventPreset.date);
    if (lifeEventPreset?.category) setCategory(lifeEventPreset.category);
  }, [lifeEventModalOpen, lifeEventPreset]);

  const vim = useMemo(() => findActiveVimshottari(dashas, date), [dashas, date]);
  const yoginiTxt = useMemo(() => findYoginiText(yoginiDashas, date), [yoginiDashas, date]);
  const charaTxt = useMemo(() => findCharaText(charaDashas, date), [charaDashas, date]);

  if (!lifeEventModalOpen) return null;

  const mahaLord = vim?.maha?.lord ?? null;
  const antarLord = vim?.antar?.lord ?? null;
  const pratyantarLord = vim?.pratyantar?.lord ?? null;

  const mahaDesc = mahaLord ? describeLordHouses(natalChart, mahaLord) : '';
  const antarDesc = antarLord ? describeLordHouses(natalChart, antarLord) : '';

  const handleSaveMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    const next = addLifeEvent({ title: title.trim(), date, category });
    setEvents(next);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleAskAi = () => {
    const eventLabel = title.trim() || `my ${category} milestone`;
    const dashaLabel = mahaLord
      ? `${mahaLord.toUpperCase()} Mahadasha${antarLord ? ` / ${antarLord.toUpperCase()} Antardasha` : ''}${pratyantarLord ? ` / ${pratyantarLord.toUpperCase()} Pratyantar` : ''}`
      : 'active dasha';
    closeLifeEventModal();
    openAskDrawer(
      `On ${date}, I experienced (or am planning): "${eventLabel}" (${category}). My chart was running ${dashaLabel}. In plain English, why did this theme show up and what does my chart say about it?`,
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Life Event Astrological Decoder"
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeLifeEventModal();
      }}
    >
      <div className="modal-panel" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, borderRadius: 10, background: 'rgba(95, 194, 179, 0.14)', color: 'var(--teal)' }}>
              <Target size={19} />
            </div>
            <div>
              <h2 className="serif-title" style={{ margin: 0, fontSize: 17, color: 'var(--gold)' }}>
                Decode a Life Event with Your Chart &amp; AI
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Pick any past or future date to see which planetary chapters were running—and ask AI why.
              </p>
            </div>
          </div>
          <button type="button" onClick={closeLifeEventModal} aria-label="Close modal" style={{ color: 'var(--text-muted)', padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Quick Presets */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PRESET_EVENTS.map((p) => (
              <button
                key={p.title}
                type="button"
                onClick={() => {
                  setTitle(p.title);
                  setCategory(p.category);
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: 14,
                  fontSize: 11.5,
                  fontWeight: 600,
                  background: title === p.title ? 'rgba(95, 194, 179, 0.2)' : 'var(--surface-alt)',
                  color: title === p.title ? 'var(--teal)' : 'var(--text-main)',
                  border: title === p.title ? '1px solid var(--teal)' : '1px solid var(--border-subtle)',
                }}
              >
                + {p.title}
              </button>
            ))}
          </div>

          <form onSubmit={handleSaveMilestone} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What happened? (e.g., Got promoted, Moved abroad)"
                style={{
                  gridColumn: '1 / -1',
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '9px 12px',
                  fontSize: 13,
                  color: 'var(--text-main)',
                }}
              />
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <Calendar size={11} /> Event Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '8px 10px',
                    fontSize: 12.5,
                    color: 'var(--text-main)',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Life Area
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as LifeEventCategory)}
                  style={{
                    width: '100%',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '8px 10px',
                    fontSize: 12.5,
                    color: 'var(--text-main)',
                  }}
                >
                  <option value="career">Career &amp; Work</option>
                  <option value="relationship">Love &amp; Marriage</option>
                  <option value="move">Relocation &amp; Home</option>
                  <option value="health">Health &amp; Inner Shift</option>
                  <option value="breakthrough">Breakthrough / Milestone</option>
                </select>
              </div>
            </div>

            {/* Live Astrological Chapter Preview */}
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: 'rgba(95, 194, 179, 0.07)',
                border: '1px solid rgba(95, 194, 179, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock size={13} /> Planetary Chapter Active on {date}
                </span>
                {mahaLord && (
                  <span className="gold-badge" style={{ fontSize: 11, textTransform: 'uppercase' }}>
                    {mahaLord}
                    {antarLord ? ` / ${antarLord}` : ''}
                    {pratyantarLord ? ` / ${pratyantarLord}` : ''}
                  </span>
                )}
              </div>

              {mahaLord ? (
                <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-main)' }}>
                  <div>
                    • <strong style={{ color: 'var(--gold)', textTransform: 'capitalize' }}>{mahaLord} Mahadasha</strong> (main life season){mahaDesc ? ` — ${mahaDesc}` : ''}.
                  </div>
                  {antarLord && (
                    <div style={{ marginTop: 3 }}>
                      • <strong style={{ color: 'var(--teal)', textTransform: 'capitalize' }}>{antarLord} Antardasha</strong> (sub-chapter trigger){antarDesc ? ` — ${antarDesc}` : ''}.
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Selected date is outside your computed 120-year Vimshottari range.
                </div>
              )}

              {!isGuided && (
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', paddingTop: 4, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <span><strong>Yogini:</strong> {yoginiTxt}</span>
                  <span><strong>Jaimini Chara:</strong> {charaTxt}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <button
                type="button"
                onClick={handleAskAi}
                className="ask-ai-cta"
                style={{ padding: '9px 16px', fontSize: 12.5 }}
              >
                <Sparkles size={14} /> Ask AI to Explain This Event →
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {savedNotice && (
                  <span style={{ fontSize: 11.5, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                    <CheckCircle2 size={13} /> Saved to Timeline
                  </span>
                )}
                <button type="submit" disabled={!title.trim()} className="btn btn-outline" style={{ padding: '8px 14px', opacity: title.trim() ? 1 : 0.5 }}>
                  <Plus size={14} /> Save to Timeline
                </button>
              </div>
            </div>
          </form>

          {/* Saved Milestones Quick List */}
          {events.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Your Saved Life Milestones ({events.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 190, overflowY: 'auto' }}>
                {events.map((ev) => {
                  const evVim = findActiveVimshottari(dashas, ev.date);
                  const dLabel = evVim?.maha
                    ? `${evVim.maha.lord.toUpperCase()}${evVim.antar ? ` / ${evVim.antar.lord.toUpperCase()}` : ''}`
                    : '—';
                  return (
                    <div
                      key={ev.id}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'var(--surface-alt)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 12,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{ev.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {ev.date} • {ev.category} • <strong style={{ color: 'var(--gold)' }}>{dLabel}</strong>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => {
                            closeLifeEventModal();
                            openAskDrawer(`Explain what "${ev.title}" (${ev.date}, ${ev.category}) during my ${dLabel} period shows in my birth chart.`);
                          }}
                          className="btn btn-outline"
                          style={{ fontSize: 11, padding: '4px 9px', color: 'var(--teal)' }}
                        >
                          Ask AI
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${ev.title}`}
                          onClick={() => setEvents(removeLifeEvent(ev.id))}
                          style={{ color: 'var(--text-muted)', padding: 4 }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
