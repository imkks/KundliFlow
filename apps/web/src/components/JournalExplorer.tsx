import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  PlusCircle,
  Sparkles,
  Calendar,
  Clock,
  Trash2,
  Tag,
  Filter,
  Flame,
  BatteryCharging,
  Smile,
  Meh,
  Frown,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  X,
  Compass,
} from 'lucide-react';
import type { NatalChart, HourScore, DayView, AshtakvargaResult } from '@astro/engine';

export interface SkySnapshotData {
  id: string;
  atUtc: string;
  score: number;
  band: 'flowing' | 'steady' | 'go_gently';
  horaRuler: string;
  moonSign: string;
  moonNakshatra: string;
  dasha: string;
  factors: Array<{ description: string; points: number }>;
  chandraBalaHouse?: number;
  taraBalaCategory?: 'janma' | 'sampat' | 'vipat' | 'kshema' | 'pratyari' | 'sadhana' | 'naidhana' | 'mitra' | 'parama_mitra';
  horaCompatibility?: 'friend' | 'neutral' | 'enemy';
  savBindus?: number;
}

export interface JournalEntry {
  id: string;
  atUtc: string;
  mood: number; // 1 to 5
  energy: number; // 1 to 5
  kind: 'checkin' | 'event' | 'reflection';
  body: string;
  tags: string[];
  snapshot: SkySnapshotData;
}

interface JournalExplorerProps {
  natalChart: NatalChart;
  currentScore: HourScore | null;
  dayView: DayView | null;
  ashtakvarga?: AshtakvargaResult | null;
  onEntriesChange?: (entries: JournalEntry[]) => void;
}

const STORAGE_KEY = 'astro_journal_entries_v1';

const PRESET_TAGS = ['work', 'focus', 'creative', 'meditation', 'family', 'health', 'travel', 'study'];

const MOOD_CONFIG = [
  { value: 1, label: 'Depleted', icon: Frown, color: '#e06c75' },
  { value: 2, label: 'Low', icon: Meh, color: 'var(--amber)' },
  { value: 3, label: 'Neutral', icon: Smile, color: 'var(--text-muted)' },
  { value: 4, label: 'Good', icon: Smile, color: 'var(--teal)' },
  { value: 5, label: 'Radiant', icon: Sparkles, color: 'var(--gold)' },
];

export const JournalExplorer: React.FC<JournalExplorerProps> = ({
  natalChart,
  currentScore,
  dayView,
  ashtakvarga,
  onEntriesChange,
}) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);

  // Filter state
  const [filterTag, setFilterTag] = useState<string>('all');
  const [filterMood, setFilterMood] = useState<number | 'all'>('all');
  const [filterBand, setFilterBand] = useState<string>('all');

  // Form State
  const [mood, setMood] = useState<number>(4);
  const [energy, setEnergy] = useState<number>(4);
  const [kind, setKind] = useState<'checkin' | 'event' | 'reflection'>('checkin');
  const [body, setBody] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['focus']);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setEntries(parsed);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load journal entries:', e);
    }

    // Default sample entry if empty
    const defaultEntry: JournalEntry = {
      id: 'entry_sample_01',
      atUtc: new Date().toISOString(),
      mood: 4,
      energy: 5,
      kind: 'checkin',
      body: 'Started initial deep work session. Mind feels clear and alert, aligned with the Leo 4th house solar cluster and Pisces 11th house Moon.',
      tags: ['focus', 'meditation'],
      snapshot: {
        id: 'snap_sample_01',
        atUtc: new Date().toISOString(),
        score: currentScore?.score ?? 2,
        band: (currentScore?.band as any) ?? 'flowing',
        horaRuler: currentScore?.horaRuler ?? 'sun',
        moonSign: natalChart.grahas.moon.sign,
        moonNakshatra: natalChart.grahas.moon.nakshatra,
        dasha: 'Rahu - Saturn',
        factors: currentScore?.factors ?? [
          { description: 'Moon in Pisces (11th House of Gains)', points: 2 },
          { description: 'Hora Ruler is Sun (Natural Friend to Taurus Lagna)', points: 1 },
        ],
      },
    };
    setEntries([defaultEntry]);
  }, [currentScore, natalChart]);

  // Persist to local storage
  const saveEntriesToStorage = (updated: JournalEntry[]) => {
    setEntries(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save journal to local storage:', e);
    }
    if (onEntriesChange) {
      onEntriesChange(updated);
    }
  };

  const handleCreateEntry = () => {
    const atUtc = new Date().toISOString();
    const snapId = 'snap_' + Math.random().toString(36).substring(2, 9);
    const entryId = 'entry_' + Math.random().toString(36).substring(2, 9);

    const taraCategories: SkySnapshotData['taraBalaCategory'][] = [
      'janma', 'sampat', 'vipat', 'kshema', 'pratyari', 'sadhana', 'naidhana', 'mitra', 'parama_mitra'
    ];
    const nakIdx = natalChart.grahas.moon.nakshatraIndex ?? 0;
    const assignedTara = taraCategories[nakIdx % 9];

    const snapshot: SkySnapshotData = {
      id: snapId,
      atUtc,
      score: currentScore?.score ?? 1,
      band: (currentScore?.band as any) ?? 'steady',
      horaRuler: currentScore?.horaRuler ?? 'sun',
      moonSign: natalChart.grahas.moon.sign,
      moonNakshatra: natalChart.grahas.moon.nakshatra,
      dasha: 'Rahu - Saturn',
      factors: currentScore?.factors?.map((f) => ({ description: f.description, points: f.points })) ?? [
        { description: 'Moon in supportive transit house', points: 1 },
      ],
      chandraBalaHouse: ((natalChart.grahas.moon.signIndex) % 12) + 1,
      taraBalaCategory: assignedTara,
      horaCompatibility: currentScore?.horaRuler === 'sun' || currentScore?.horaRuler === 'jupiter' ? 'friend' : 'neutral',
      savBindus: ashtakvarga?.sarva[natalChart.grahas.moon.signIndex] ?? 28,
    };

    const newEntry: JournalEntry = {
      id: entryId,
      atUtc,
      mood,
      energy,
      kind,
      body: body.trim(),
      tags: selectedTags,
      snapshot,
    };

    const updated = [newEntry, ...entries];
    saveEntriesToStorage(updated);

    // Reset form
    setBody('');
    setShowLogModal(false);
  };

  const handleDeleteEntry = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    saveEntriesToStorage(updated);
  };

  const toggleTag = (tag: string) => {
    const clean = tag.toLowerCase().trim().replace(/^#/, '');
    if (selectedTags.includes(clean)) {
      setSelectedTags(selectedTags.filter((t) => t !== clean));
    } else {
      setSelectedTags([...selectedTags, clean]);
    }
  };

  const addCustomTag = () => {
    const clean = customTagInput.toLowerCase().trim().replace(/^#/, '');
    if (clean && !selectedTags.includes(clean)) {
      setSelectedTags([...selectedTags, clean]);
      setCustomTagInput('');
    }
  };

  // Filtered list
  const filteredEntries = entries.filter((e) => {
    if (filterTag !== 'all' && !e.tags.includes(filterTag)) return false;
    if (filterMood !== 'all' && e.mood !== filterMood) return false;
    if (filterBand !== 'all' && e.snapshot.band !== filterBand) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Banner & Quick Log CTA */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={20} style={{ color: 'var(--gold)' }} />
              <h2 className="serif-title" style={{ fontSize: 18, color: 'var(--gold)' }}>
                Personal Almanac & Daily Journal
              </h2>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Record your daily state, energy, and events. An objective, immutable snapshot of the sky is automatically frozen with each memory.
            </p>
          </div>

          <button
            onClick={() => setShowLogModal(true)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: 'var(--gold)',
              color: '#15132b',
              fontWeight: 700,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <PlusCircle size={16} /> Log Sky Entry
          </button>
        </div>
      </div>

      {/* QUICK LOG MODAL */}
      {showLogModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(10, 8, 22, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 540,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} style={{ color: 'var(--gold)' }} />
                <h3 className="serif-title" style={{ fontSize: 16, color: 'var(--gold)' }}>
                  New Sky Journal Entry
                </h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Frozen Sky Preview Chip */}
            <div
              style={{
                background: 'var(--surface-alt)',
                border: '1px solid rgba(227, 173, 70, 0.3)',
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 11,
                color: 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Compass size={13} /> FREEZING SKY SNAPSHOT
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 10,
                    background:
                      currentScore && currentScore.score > 0
                        ? 'rgba(95, 194, 179, 0.2)'
                        : 'rgba(217, 119, 54, 0.2)',
                    color:
                      currentScore && currentScore.score > 0
                        ? 'var(--teal)'
                        : 'var(--amber)',
                  }}
                >
                  Score: {currentScore?.score ?? '+1'} ({currentScore?.tierLabel ?? 'Steady'})
                </span>
              </div>
              <div>
                Moon in <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>{natalChart.grahas.moon.sign}</strong> ({natalChart.grahas.moon.nakshatra} pada {natalChart.grahas.moon.pada}) • Hora:{' '}
                <strong style={{ color: 'var(--gold)', textTransform: 'capitalize' }}>{currentScore?.horaRuler ?? 'Sun'}</strong> • Running Dasha:{' '}
                <strong style={{ color: 'var(--teal)' }}>Rahu-Saturn</strong>
              </div>
            </div>

            {/* Mood Selector */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 8, display: 'block' }}>
                Mood / Inner State:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {MOOD_CONFIG.map((m) => {
                  const Icon = m.icon;
                  const isSelected = mood === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => setMood(m.value)}
                      style={{
                        padding: '10px 4px',
                        borderRadius: 8,
                        border: `1px solid ${isSelected ? m.color : 'var(--border)'}`,
                        background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'var(--surface-alt)',
                        color: isSelected ? m.color : 'var(--text-muted)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Icon size={20} />
                      <span style={{ fontSize: 10, fontWeight: 600 }}>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Energy Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)' }}>
                  Vitality / Energy Level:
                </label>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)' }}>
                  Level {energy} / 5
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--teal)', cursor: 'pointer' }}
              />
            </div>

            {/* Entry Type */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 6, display: 'block' }}>
                Entry Classification:
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['checkin', 'event', 'reflection'] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setKind(k)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      border: `1px solid ${kind === k ? 'var(--gold)' : 'var(--border)'}`,
                      background: kind === k ? 'rgba(227, 173, 70, 0.15)' : 'var(--surface-alt)',
                      color: kind === k ? 'var(--gold)' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag Selection */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 6, display: 'block' }}>
                Context Tags:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {PRESET_TAGS.map((t) => {
                  const isSelected = selectedTags.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleTag(t)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 14,
                        fontSize: 11,
                        border: `1px solid ${isSelected ? 'var(--teal)' : 'var(--border)'}`,
                        background: isSelected ? 'rgba(95, 194, 179, 0.18)' : 'var(--surface-alt)',
                        color: isSelected ? 'var(--teal)' : 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      #{t}
                    </button>
                  );
                })}
              </div>

              {/* Custom tag input */}
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  placeholder="Add custom tag..."
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
                  style={{
                    flex: 1,
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '4px 8px',
                    fontSize: 11,
                    color: 'var(--text-main)',
                  }}
                />
                <button
                  onClick={addCustomTag}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-alt)',
                    color: 'var(--text-main)',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Reflection Note */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 6, display: 'block' }}>
                Reflection / Observation:
              </label>
              <textarea
                rows={3}
                placeholder="What is arising in your awareness right now? (Optional notes are kept 100% locally on device)..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 12,
                  color: 'var(--text-main)',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Submit CTA */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => setShowLogModal(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEntry}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  background: 'var(--gold)',
                  border: 'none',
                  color: '#15132b',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Sparkles size={14} /> Save & Freeze Sky
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="card" style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 11 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gold)', fontWeight: 600 }}>
            <Filter size={13} /> Filter By:
          </span>

          {/* Tag Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>Tag:</span>
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              style={{
                background: 'var(--surface-alt)',
                color: 'var(--text-main)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '2px 6px',
                fontSize: 11,
              }}
            >
              <option value="all">All Tags</option>
              {PRESET_TAGS.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>
          </div>

          {/* Mood Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>Mood:</span>
            <select
              value={filterMood}
              onChange={(e) => setFilterMood(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              style={{
                background: 'var(--surface-alt)',
                color: 'var(--text-main)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '2px 6px',
                fontSize: 11,
              }}
            >
              <option value="all">All Moods</option>
              {MOOD_CONFIG.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label} ({m.value}/5)
                </option>
              ))}
            </select>
          </div>

          {/* Band Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>Sky Band:</span>
            <select
              value={filterBand}
              onChange={(e) => setFilterBand(e.target.value)}
              style={{
                background: 'var(--surface-alt)',
                color: 'var(--text-main)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '2px 6px',
                fontSize: 11,
              }}
            >
              <option value="all">All Bands</option>
              <option value="flowing">Flowing (+3+)</option>
              <option value="steady">Steady (-1 to +2)</option>
              <option value="go_gently">Go Gently (&le; -2)</option>
            </select>
          </div>

          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredEntries.length}</strong> of {entries.length} entries
          </span>
        </div>
      </div>

      {/* TIMELINE LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredEntries.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <BookOpen size={32} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
            <h4 style={{ fontSize: 14, color: 'var(--text-main)' }}>No matching entries found</h4>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 360 }}>
              Try loosening your filters, or log a fresh sky reflection to begin tracking your personal rhythms.
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const moodMeta = MOOD_CONFIG.find((m) => m.value === entry.mood) || MOOD_CONFIG[2]!;
            const MoodIcon = moodMeta.icon;
            const isExpanded = expandedEntryId === entry.id;

            return (
              <div
                key={entry.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  borderLeft: `4px solid ${
                    entry.snapshot.band === 'flowing'
                      ? 'var(--teal)'
                      : entry.snapshot.band === 'go_gently'
                      ? 'var(--amber)'
                      : 'var(--gold)'
                  }`,
                }}
              >
                {/* Entry Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'var(--surface-alt)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: moodMeta.color,
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <MoodIcon size={18} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                          {moodMeta.label} ({entry.mood}/5)
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>• Energy: {entry.energy}/5</span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '1px 6px',
                            borderRadius: 6,
                            background: 'var(--surface-alt)',
                            color: 'var(--text-muted)',
                            textTransform: 'capitalize',
                          }}
                        >
                          {entry.kind}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Calendar size={11} /> {new Date(entry.atUtc).toLocaleDateString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={11} /> {new Date(entry.atUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      title="Delete entry"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Entry Body */}
                {entry.body && (
                  <p style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
                    {entry.body}
                  </p>
                )}

                {/* Tags */}
                {entry.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {entry.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: 10,
                          padding: '2px 8px',
                          borderRadius: 10,
                          background: 'var(--surface-alt)',
                          color: 'var(--teal)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Frozen Sky Snapshot Pill */}
                <div
                  style={{
                    background: 'var(--surface-alt)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 11,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gold)', fontWeight: 600 }}>
                        <Moon size={12} /> Moon in {entry.snapshot.moonSign.toUpperCase()} ({entry.snapshot.moonNakshatra})
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>• Hora: {entry.snapshot.horaRuler.toUpperCase()}</span>
                      <span style={{ color: 'var(--teal)' }}>• Dasha: {entry.snapshot.dasha}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 8,
                          background:
                            entry.snapshot.band === 'flowing'
                              ? 'rgba(95, 194, 179, 0.2)'
                              : entry.snapshot.band === 'go_gently'
                              ? 'rgba(217, 119, 54, 0.2)'
                              : 'rgba(227, 173, 70, 0.2)',
                          color:
                            entry.snapshot.band === 'flowing'
                              ? 'var(--teal)'
                              : entry.snapshot.band === 'go_gently'
                              ? 'var(--amber)'
                              : 'var(--gold)',
                        }}
                      >
                        Sky {entry.snapshot.score > 0 ? `+${entry.snapshot.score}` : entry.snapshot.score} ({entry.snapshot.band})
                      </span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>

                  {/* Expanded Factor Attribution */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Frozen Factor Attribution at Log Time:
                      </div>
                      {entry.snapshot.factors.map((f, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                          <span style={{ color: 'var(--text-main)' }}>{f.description}</span>
                          <span
                            style={{
                              fontWeight: 700,
                              color: f.points > 0 ? 'var(--teal)' : f.points < 0 ? 'var(--amber)' : 'var(--text-muted)',
                            }}
                          >
                            {f.points > 0 ? `+${f.points}` : f.points}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
