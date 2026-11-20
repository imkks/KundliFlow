import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  Compass,
  Layers,
  ShieldAlert,
  Sun,
  Moon,
  Info,
} from 'lucide-react';
import type {
  NatalChart,
  MonthView,
  YearView,
  TransitOverview,
} from '@astro/engine';
import { API_BASE_URL } from '../config.ts';

interface CalendarExplorerProps {
  profileId?: string | null;
  natalChart: NatalChart;
}

export const CalendarExplorer: React.FC<CalendarExplorerProps> = ({
  profileId,
}) => {
  const nowDate = new Date();
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [year, setYear] = useState<number>(nowDate.getFullYear());
  const [month, setMonth] = useState<number>(nowDate.getMonth() + 1);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(nowDate.toISOString().slice(0, 10));
  const [muhurtaFilter, setMuhurtaFilter] = useState<'all' | 'career' | 'travel' | 'finance' | 'rest'>('all');
  const [dateNote, setDateNote] = useState('');
  const [journalTick, setJournalTick] = useState(0);
  const [serverCal, setServerCal] = useState<{ monthData: MonthView; yearData: YearView; transits: TransitOverview } | null>(null);

  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;
    fetch(
      `${API_BASE_URL}/api/profiles/${encodeURIComponent(profileId)}/calendar?year=${year}&month=${month}&date=${encodeURIComponent(selectedDateStr)}`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.monthData && data?.yearData && data?.transits) {
          setServerCal({ monthData: data.monthData, yearData: data.yearData, transits: data.transits });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profileId, year, month, selectedDateStr]);

  const journalByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    try {
      const raw = localStorage.getItem('astro_journal_entries_v1');
      const arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr)) {
        for (const e of arr) {
          const d = String(e.atUtc ?? '').slice(0, 10);
          if (!d) continue;
          if (!map.has(d)) map.set(d, []);
          map.get(d)!.push(e);
        }
      }
    } catch {
      // ignore
    }
    return map;
  }, [journalTick]);

  const matchesMuhurta = (day: any) => {
    if (muhurtaFilter === 'all') return false;
    if (muhurtaFilter === 'career') return day.dayBand === 'flowing' || day.dayScore >= 2;
    if (muhurtaFilter === 'travel') return day.dayBand === 'flowing' && day.dayScore >= 1;
    if (muhurtaFilter === 'finance') return day.dayScore >= 2;
    if (muhurtaFilter === 'rest') return day.dayBand === 'go_gently' || day.dayScore <= 0;
    return false;
  };

  const handleSaveDateNote = () => {
    if (!dateNote.trim()) return;
    try {
      const raw = localStorage.getItem('astro_journal_entries_v1');
      const arr = raw ? JSON.parse(raw) : [];
      const newEntry = {
        id: `cal-${Date.now()}`,
        atUtc: `${selectedDateStr}T12:00:00Z`,
        mood: selectedDaySummary?.dayScore && selectedDaySummary.dayScore >= 2 ? 4 : 3,
        energy: 3,
        kind: 'reflection',
        body: dateNote.trim(),
        tags: ['calendar'],
        snapshot: {
          id: `snap-${Date.now()}`,
          atUtc: `${selectedDateStr}T12:00:00Z`,
          score: selectedDaySummary?.dayScore ?? 0,
          band: selectedDaySummary?.dayBand ?? 'steady',
          horaRuler: 'sun',
          moonSign: transits.transits.moon.sign,
          moonNakshatra: 'unknown',
          dasha: 'active',
          factors: [],
        },
      };
      localStorage.setItem('astro_journal_entries_v1', JSON.stringify([newEntry, ...(Array.isArray(arr) ? arr : [])]));
      setDateNote('');
      setJournalTick((t) => t + 1);
    } catch {
      // ignore
    }
  };

  const monthData: MonthView | null = serverCal?.monthData ?? null;
  const yearData: YearView | null = serverCal?.yearData ?? null;
  const transits: TransitOverview | null = serverCal?.transits ?? null;

  if (!monthData || !yearData || !transits) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
        Loading calendar heatmap &amp; planetary transits from server…
      </div>
    );
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  // Find selected day summary
  const selectedDaySummary = monthData.days.find((d) => d.date === selectedDateStr);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header with View Mode Switcher */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarIcon size={20} style={{ color: 'var(--gold)' }} />
              <h2 className="serif-title" style={{ fontSize: 18, color: 'var(--gold)' }}>
                Multi-Horizon Astrological Calendar
              </h2>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Explore day-by-day energetic bands, lunar rhythms, and macro slow transits across months and years.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              background: 'var(--surface-alt)',
              padding: 3,
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => setViewMode('month')}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 6,
                border: 'none',
                background: viewMode === 'month' ? 'var(--gold)' : 'transparent',
                color: viewMode === 'month' ? '#15132b' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Month Heatmap
            </button>
            <button
              onClick={() => setViewMode('year')}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 6,
                border: 'none',
                background: viewMode === 'year' ? 'var(--gold)' : 'transparent',
                color: viewMode === 'year' ? '#15132b' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Year Transits (Gochar)
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: MONTH HEATMAP */}
      {viewMode === 'month' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            {/* Month Navigator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={handlePrevMonth}
                  style={{
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: 6,
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <h3 className="serif-title" style={{ fontSize: 16, color: 'var(--text-main)', minWidth: 150 }}>
                  {monthNames[month - 1]} {year}
                </h3>
                <button
                  onClick={handleNextMonth}
                  style={{
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: 6,
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Band Legend */}
              <div style={{ display: 'flex', gap: 12, fontSize: 11, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--teal)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)' }} />
                  Flowing (&ge; +3)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--gold)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />
                  Steady (-1 to +2)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--amber)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)' }} />
                  Go Gently (&le; -2)
                </span>
              </div>
            </div>

            {/* Muhurta "Find a Good Day" Filter */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase' }}>
                Find Best Days For:
              </span>
              {(
                [
                  { id: 'all', label: 'All Days' },
                  { id: 'career', label: '💼 Career / Launch' },
                  { id: 'travel', label: '✈️ Travel / Move' },
                  { id: 'finance', label: '💰 Finances' },
                  { id: 'rest', label: '🌿 Rest & Reset' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setMuhurtaFilter(f.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 14,
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: muhurtaFilter === f.id ? 'var(--teal)' : 'var(--surface-alt)',
                    color: muhurtaFilter === f.id ? '#15132b' : 'var(--text-main)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div
                  key={d}
                  style={{
                    textAlign: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    paddingBottom: 4,
                  }}
                >
                  {d}
                </div>
              ))}

              {monthData.days.map((day) => {
                const isSelected = day.date === selectedDateStr;
                const dayNum = parseInt(day.date.split('-')[2]!, 10);
                const isFlowing = day.dayBand === 'flowing';
                const isGoGently = day.dayBand === 'go_gently';
                const isMuhurtaMatch = matchesMuhurta(day);
                const hasJournal = journalByDate.has(day.date);

                return (
                  <div
                    key={day.date}
                    onClick={() => setSelectedDateStr(day.date)}
                    style={{
                      background: isSelected
                        ? 'rgba(227, 173, 70, 0.25)'
                        : isMuhurtaMatch
                        ? 'rgba(95, 194, 179, 0.2)'
                        : isFlowing
                        ? 'rgba(95, 194, 179, 0.12)'
                        : isGoGently
                        ? 'rgba(217, 119, 54, 0.12)'
                        : 'var(--surface-alt)',
                      border: `1px solid ${
                        isSelected
                          ? 'var(--gold)'
                          : isMuhurtaMatch
                          ? 'var(--teal)'
                          : isFlowing
                          ? 'rgba(95, 194, 179, 0.4)'
                          : isGoGently
                          ? 'rgba(217, 119, 54, 0.4)'
                          : 'var(--border-subtle)'
                      }`,
                      opacity: muhurtaFilter !== 'all' && !isMuhurtaMatch ? 0.55 : 1,
                      borderRadius: 8,
                      padding: '8px 6px',
                      minHeight: 54,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: isSelected ? 800 : 600, color: 'var(--text-main)' }}>
                        {dayNum}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10 }}>
                        {isMuhurtaMatch && <span style={{ color: 'var(--gold)' }} title="Recommended Muhurta Day">★</span>}
                        {hasJournal && <span title="Has Journal Entry">📝</span>}
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: isFlowing ? 'var(--teal)' : isGoGently ? 'var(--amber)' : 'var(--gold)',
                          }}
                        />
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textAlign: 'right',
                        color: isFlowing ? 'var(--teal)' : isGoGently ? 'var(--amber)' : 'var(--text-muted)',
                      }}
                    >
                      {day.dayScore > 0 ? `+${day.dayScore}` : day.dayScore}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Detail Drawer */}
          {selectedDaySummary && (
            <div className="card" style={{ borderLeft: '4px solid var(--gold)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h4 className="serif-title" style={{ fontSize: 16, color: 'var(--text-main)' }}>
                    Detailed Day View: {selectedDaySummary.date}
                  </h4>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Overall Day Band:{' '}
                    <strong
                      style={{
                        color:
                          selectedDaySummary.dayBand === 'flowing'
                            ? 'var(--teal)'
                            : selectedDaySummary.dayBand === 'go_gently'
                            ? 'var(--amber)'
                            : 'var(--gold)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {selectedDaySummary.dayBand} ({selectedDaySummary.dayScore > 0 ? `+${selectedDaySummary.dayScore}` : selectedDaySummary.dayScore})
                    </strong>
                  </div>
                </div>

                <span className="gold-badge" style={{ fontSize: 11 }}>
                  Transit Moon in {transits.transits.moon.sign.toUpperCase()} (House {transits.transits.moon.houseFromMoon} from Natal Moon)
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 12 }}>
                <div style={{ background: 'var(--surface-alt)', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Moon Transit House</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginTop: 2 }}>
                    House {transits.transits.moon.houseFromLagna} from Lagna • House {transits.transits.moon.houseFromMoon} from Moon
                  </div>
                </div>

                <div style={{ background: 'var(--surface-alt)', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ashtakvarga Strength</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal)', marginTop: 2 }}>
                    {transits.transits.moon.ashtakvargaBindus} Bindus (Bhinna Table)
                  </div>
                </div>

                <div style={{ background: 'var(--surface-alt)', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sade Sati Status</div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: transits.sadeSati.isActive ? 'var(--amber)' : 'var(--teal)',
                      marginTop: 2,
                      textTransform: 'capitalize',
                    }}
                  >
                    {transits.sadeSati.isActive ? `Active (${transits.sadeSati.phase} phase)` : 'Not in Sade Sati'}
                  </div>
                </div>
              </div>

              {/* Calendar <-> Journal Notes for Selected Date */}
              <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--teal)' }}>
                  📝 Journal Notes for {selectedDaySummary.date}
                </div>
                {(journalByDate.get(selectedDaySummary.date) ?? []).length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No journal note logged for this day yet.</div>
                ) : (
                  (journalByDate.get(selectedDaySummary.date) ?? []).map((je: any) => (
                    <div key={je.id} style={{ fontSize: 12, paddingLeft: 8, borderLeft: '2px solid var(--gold)' }}>
                      {je.body}
                    </div>
                  ))
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={dateNote}
                    onChange={(e) => setDateNote(e.target.value)}
                    placeholder={`Add a note or intention for ${selectedDaySummary.date}...`}
                    style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'var(--text-main)' }}
                  />
                  <button onClick={handleSaveDateNote} className="btn btn-primary" style={{ fontSize: 12 }}>
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: YEAR TRANSITS STRIP (GOCHAR) */}
      {viewMode === 'year' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Year Strip */}
          <div className="card">
            <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', marginBottom: 12 }}>
              {year} Dominant Energy Seasons by Month
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 8 }}>
              {yearData.months.map((m) => {
                const isFlowing = m.dominantBand === 'flowing';
                const isGoGently = m.dominantBand === 'go_gently';

                return (
                  <div
                    key={m.month}
                    style={{
                      background: 'var(--surface-alt)',
                      padding: 10,
                      borderRadius: 8,
                      border: `1px solid ${isFlowing ? 'var(--teal)' : isGoGently ? 'var(--amber)' : 'var(--border-subtle)'}`,
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{monthNames[m.month - 1]?.slice(0, 3)}</div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: isFlowing ? 'var(--teal)' : isGoGently ? 'var(--amber)' : 'var(--gold)',
                        marginTop: 4,
                        textTransform: 'capitalize',
                      }}
                    >
                      {m.dominantBand === 'flowing' ? 'Flowing' : m.dominantBand === 'go_gently' ? 'Gentle' : 'Steady'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      {m.meanScore > 0 ? `+${m.meanScore.toFixed(1)}` : m.meanScore.toFixed(1)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Slow Transits Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
            {/* Saturn Sade Sati Card */}
            <div className="card" style={{ borderLeft: '4px solid var(--amber)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h4 className="serif-title" style={{ fontSize: 14, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldAlert size={16} style={{ color: 'var(--amber)' }} /> Saturn (Shani) & Sade Sati
                </h4>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: transits.sadeSati.isActive ? 'rgba(217, 119, 54, 0.2)' : 'rgba(95, 194, 179, 0.2)',
                    color: transits.sadeSati.isActive ? 'var(--amber)' : 'var(--teal)',
                  }}
                >
                  {transits.sadeSati.isActive ? `Active (${transits.sadeSati.phase} phase)` : 'Clear'}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 8px 0' }}>
                Saturn is currently transiting <strong>{transits.transits.saturn.sign.toUpperCase()}</strong> (House {transits.transits.saturn.houseFromMoon} from your birth Moon).
              </p>
              <div style={{ fontSize: 11, color: 'var(--text-main)', background: 'var(--surface-alt)', padding: 8, borderRadius: 6 }}>
                {transits.sadeSati.isActive
                  ? 'Saturn’s 7.5-year transit invites deep maturity, patience, and karmic resilience. Focus on sustainable long-term structures.'
                  : 'You are currently outside the 7.5-year Sade Sati window. Saturn supports steady, disciplined foundation building.'}
              </div>
            </div>

            {/* Jupiter Guru Gochar Card */}
            <div className="card" style={{ borderLeft: '4px solid var(--gold)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h4 className="serif-title" style={{ fontSize: 14, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={16} style={{ color: 'var(--gold)' }} /> Jupiter (Guru Gochar)
                </h4>
                <span className="gold-badge" style={{ fontSize: 10 }}>
                  House {transits.jupiterHouseFromMoon} from Moon
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 8px 0' }}>
                Jupiter transits <strong>{transits.transits.jupiter.sign.toUpperCase()}</strong> (House {transits.transits.jupiter.houseFromLagna} from Lagna, House {transits.jupiterHouseFromMoon} from Moon).
              </p>
              <div style={{ fontSize: 11, color: 'var(--text-main)', background: 'var(--surface-alt)', padding: 8, borderRadius: 6 }}>
                Jupiter bestows expansive intellectual clarity, ethical counsel, and opportunities for wisdom and cooperative alliance.
              </div>
            </div>

            {/* Rahu-Ketu Karmic Axis Card */}
            <div className="card" style={{ borderLeft: '4px solid var(--teal)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h4 className="serif-title" style={{ fontSize: 14, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Compass size={16} style={{ color: 'var(--teal)' }} /> Rahu-Ketu Nodal Axis
                </h4>
                <span className="teal-badge" style={{ fontSize: 10 }}>
                  18-Month Cycle
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 8px 0' }}>
                Rahu transits House {transits.rahuKetuAxis.rahuHouseFromMoon} from Moon • Ketu transits House {transits.rahuKetuAxis.ketuHouseFromMoon} from Moon.
              </p>
              <div style={{ fontSize: 11, color: 'var(--text-main)', background: 'var(--surface-alt)', padding: 8, borderRadius: 6 }}>
                The lunar nodes highlight the axis of evolutionary experimentation (Rahu) balanced against inner detachment and spiritual mastery (Ketu).
              </div>
            </div>
          </div>

          {/* Full Gochar Table */}
          <div className="card">
            <h4 className="serif-title" style={{ fontSize: 14, color: 'var(--text-main)', marginBottom: 10 }}>
              Live Planetary Gochar Matrix (9 Grahas)
            </h4>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '6px 8px' }}>Planet</th>
                    <th style={{ padding: '6px 8px' }}>Transit Sign</th>
                    <th style={{ padding: '6px 8px' }}>Motion</th>
                    <th style={{ padding: '6px 8px' }}>House from Lagna</th>
                    <th style={{ padding: '6px 8px' }}>House from Moon</th>
                    <th style={{ padding: '6px 8px' }}>SAV Bindus</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(transits.transits).map((tp) => (
                    <tr key={tp.graha} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px 8px', fontWeight: 600, color: 'var(--gold)', textTransform: 'capitalize' }}>
                        {tp.graha}
                      </td>
                      <td style={{ padding: '8px 8px', textTransform: 'capitalize' }}>
                        {tp.sign} {tp.degInSign.toFixed(1)}°
                      </td>
                      <td style={{ padding: '8px 8px' }}>
                        {tp.retrograde ? (
                          <span className="amber-badge" style={{ fontSize: 10 }}>Retro (R)</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Direct</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 8px' }}>House {tp.houseFromLagna}</td>
                      <td style={{ padding: '8px 8px' }}>House {tp.houseFromMoon}</td>
                      <td style={{ padding: '8px 8px', fontWeight: 600, color: 'var(--teal)' }}>
                        {tp.ashtakvargaBindus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
