import React, { useState } from 'react';
import {
  Clock,
  ShieldAlert,
  MapPin,
  Sparkles,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  CheckCircle2,
  PenLine,
  Target,
  Table2,
  ArrowRight,
} from 'lucide-react';
import type { DayView, HourScore } from '@astro/engine';
import { useReading, LIFE_TOPICS } from '../context/ReadingContext.tsx';
import { GlossaryTerm } from '../components/GlossaryTerm.tsx';
import { API_BASE_URL } from '../config.ts';
import { GooglePlaceAutocomplete } from '../components/GooglePlaceAutocomplete.tsx';

export interface TodayLocation {
  name: string;
  lat: number;
  lon: number;
  tzId: string;
}

interface TodayTabProps {
  cityName: string;
  onCityChange?: (city: string) => void;
  onLocationChange?: (loc: TodayLocation) => void;
  dayView: DayView | null;
  currentScore: HourScore | null;
  activeCityName: string;
  backendProfileId?: string | null;
  onQuickCheckinSaved?: (entries: any[]) => void;
}

const HORA_GUIDANCE: Record<string, string> = {
  sun: 'Leadership, authority, visibility & bold decisions',
  moon: 'Empathy, creative flow, care & emotional check-ins',
  mars: 'Decisive execution, workouts, courage & clearing blockers',
  mercury: 'Writing, coding, negotiations, learning & calls',
  jupiter: 'Strategy, mentorship, long-term planning & growth',
  venus: 'Design, relationships, diplomacy, beauty & finances',
  saturn: 'Deep focus, systems, discipline & finishing backlogs',
};

const HOUSE_SHORT_AREAS: Record<number, string> = {
  1: 'Self & Vitality',
  2: 'Wealth & Voice',
  3: 'Courage & Skills',
  4: 'Home & Peace',
  5: 'Creativity & Focus',
  6: 'Work & Health',
  7: 'Partnerships',
  8: 'Deep Shifts',
  9: 'Wisdom & Luck',
  10: 'Career & Status',
  11: 'Gains & Network',
  12: 'Rest & Reflection',
};

function computeDashaProgress(startIso?: string, endIso?: string): { pct: number; remainingLabel: string } | null {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const now = Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  const pct = Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)));
  const remDays = Math.max(0, Math.ceil((end - now) / 86400000));
  const remainingLabel =
    remDays >= 365
      ? `${(remDays / 365.25).toFixed(1)} yrs left`
      : remDays >= 45
      ? `${Math.round(remDays / 30.4)} mos left`
      : `${remDays}d left`;
  return { pct, remainingLabel };
}

export const TodayTab: React.FC<TodayTabProps> = ({
  cityName,
  onCityChange,
  onLocationChange,
  dayView,
  currentScore,
  activeCityName,
  backendProfileId,
  onQuickCheckinSaved,
}) => {
  const {
    reading,
    isGuided,
    isQuant,
    openAskDrawer,
    setActiveTab,
    focusLifeTopic,
    openLifeEventModal,
    openQuantMatrix,
  } = useReading();

  const [showScoreFactors, setShowScoreFactors] = useState(false);
  const [selectedHourIdx, setSelectedHourIdx] = useState<number>(() => new Date().getHours());
  const [quickMood, setQuickMood] = useState<number>(3);
  const [quickNote, setQuickNote] = useState('');
  const [checkinStatus, setCheckinStatus] = useState<'idle' | 'saving' | 'saved' | 'local_only'>('idle');

  const todayMoon = reading?.panchang?.todayMoon;
  const transitPlanets = reading?.transits?.planets ?? [];
  const topTransits = transitPlanets.filter((tp: any) => ['saturn', 'jupiter', 'moon', 'rahu', 'mars'].includes(tp.planet)).slice(0, 3);

  const activeHoraRuler: string = (() => {
    if (currentScore?.horaRuler) return currentScore.horaRuler;
    const nowMs = Date.now();
    const matched = (dayView?.horas ?? []).find((hr: any) => {
      const s = new Date(hr.startIso).getTime();
      const e = new Date(hr.endIso).getTime();
      return Number.isFinite(s) && Number.isFinite(e) && nowMs >= s && nowMs < e;
    });
    if (matched?.lord) return matched.lord;
    return dayView?.panchang?.wara?.lord ?? 'sun';
  })();

  const handleSaveQuickCheckin = () => {
    const nowIso = new Date().toISOString();
    const hora = activeHoraRuler;
    const band: 'flowing' | 'steady' | 'go_gently' =
      (currentScore?.score ?? 0) > 1 ? 'flowing' : (currentScore?.score ?? 0) < -1 ? 'go_gently' : 'steady';
    const newEntry = {
      id: `checkin-${Date.now()}`,
      atUtc: nowIso,
      mood: quickMood,
      energy: quickMood,
      kind: 'checkin' as const,
      body: quickNote.trim() || `Quick daily check-in (${quickMood >= 4 ? 'Flowing' : quickMood === 3 ? 'Steady' : 'Challenging'})`,
      tags: ['daily-checkin'],
      snapshot: {
        id: `snap-${Date.now()}`,
        atUtc: nowIso,
        score: currentScore?.score ?? 0,
        band,
        horaRuler: hora,
        moonSign: todayMoon?.sign ?? 'unknown',
        moonNakshatra: todayMoon?.taraName?.split(' (')[0] ?? 'unknown',
        dasha: reading?.dashas?.[0]?.lord ?? 'unknown',
        factors: (currentScore?.factors ?? []).map((f: any) => ({
          description: f.description ?? f.summary ?? '',
          points: f.points ?? f.value ?? 0,
        })),
        chandraBalaHouse: todayMoon?.houseFromMoon,
      },
    };

    try {
      const raw = localStorage.getItem('astro_journal_entries_v1');
      const existing = raw ? JSON.parse(raw) : [];
      const updated = [newEntry, ...(Array.isArray(existing) ? existing : [])];
      localStorage.setItem('astro_journal_entries_v1', JSON.stringify(updated));
      onQuickCheckinSaved?.(updated);
    } catch {
      // ignore
    }

    setQuickNote('');
    if (backendProfileId) {
      setCheckinStatus('saving');
      fetch(`${API_BASE_URL}/api/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newEntry.id,
          profileId: backendProfileId,
          entryDate: nowIso.slice(0, 10),
          note: newEntry.body,
          energy: quickMood,
          focus: quickMood,
          mood: quickMood,
          skySnapshot: newEntry.snapshot,
        }),
      })
        .then((res) => setCheckinStatus(res.ok ? 'saved' : 'local_only'))
        .catch(() => setCheckinStatus('local_only'))
        .finally(() => setTimeout(() => setCheckinStatus('idle'), 4000));
    } else {
      setCheckinStatus('local_only');
      setTimeout(() => setCheckinStatus('idle'), 4000);
    }
  };

  if (!dayView) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
        Computing today&apos;s planetary rhythms…
      </div>
    );
  }

  const factorsExpanded = isQuant || showScoreFactors;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Location & Quick Almanac Modal Bar */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={15} style={{ color: 'var(--teal)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
              Location today:
            </span>
          </div>
          <GooglePlaceAutocomplete
            value={cityName}
            onPlaceSelect={(place) => {
              onLocationChange?.({
                name: place.cityName,
                lat: place.lat,
                lon: place.lon,
                tzId: place.tzId,
              });
              onCityChange?.(place.cityName);
            }}
            onTextChange={(txt) => onCityChange?.(txt)}
            placeholder="Search city worldwide or use GPS…"
            showCurrentLocationBtn={true}
            style={{ width: 'auto', minWidth: 240, maxWidth: 340 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => openQuantMatrix('horas')}
            className="btn btn-outline"
            style={{ fontSize: 12 }}
          >
            <Table2 size={13} style={{ color: 'var(--gold)' }} /> Full Panchang &amp; 24 Horas
          </button>
          <button
            type="button"
            onClick={() => openAskDrawer('How should I plan my day given today’s Moon, Hora, and transits?')}
            className="btn btn-outline"
            style={{ fontSize: 12 }}
          >
            <HelpCircle size={13} style={{ color: 'var(--teal)' }} /> Ask AI about Today
          </button>
        </div>
      </div>

      {/* Hero Row: Time Quality Score + Personal Alignment & Windows */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 16 }}>
        {currentScore && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <span className="serif-title" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {isGuided ? 'TODAY’S VIBE & BEST TIMING' : 'CURRENT TIME QUALITY'}
              </span>
              <span className="gold-badge" style={{ fontSize: 11 }}>
                {dayView.date} • {activeCityName}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background:
                    currentScore.score > 1
                      ? 'rgba(95, 194, 179, 0.2)'
                      : currentScore.score < -1
                      ? 'rgba(217, 119, 54, 0.2)'
                      : 'rgba(227, 173, 70, 0.2)',
                  border: `2px solid ${
                    currentScore.score > 1
                      ? 'var(--teal)'
                      : currentScore.score < -1
                      ? 'var(--amber)'
                      : 'var(--gold)'
                  }`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 700,
                  color:
                    currentScore.score > 1
                      ? 'var(--teal)'
                      : currentScore.score < -1
                      ? 'var(--amber)'
                      : 'var(--gold)',
                }}
              >
                {currentScore.score > 0 ? `+${currentScore.score}` : currentScore.score}
              </div>

              <div>
                <h2 className="serif-title" style={{ fontSize: 19, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                  {(currentScore as any).tierLabel ?? currentScore.bandLabel}
                </h2>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>
                  {isGuided ? 'Focus window: ' : 'Hora Ruler: '}
                  <strong style={{ color: 'var(--gold)', textTransform: 'capitalize' }}>{activeHoraRuler}</strong> • {(currentScore as any).summary ?? currentScore.text}
                </p>
              </div>
            </div>

            {/* Hora Action Hint */}
            {HORA_GUIDANCE[activeHoraRuler.toLowerCase()] && (
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: 'rgba(212, 175, 55, 0.08)',
                  border: '1px solid rgba(212, 175, 55, 0.22)',
                  fontSize: 12,
                  color: 'var(--text-main)',
                }}
              >
                <strong style={{ color: 'var(--gold)', textTransform: 'capitalize' }}>
                  Best right now ({activeHoraRuler}):{' '}
                </strong>
                {HORA_GUIDANCE[activeHoraRuler.toLowerCase()]}
              </div>
            )}

            {/* 24-Hour Day Energy Sparkline */}
            {Array.isArray(dayView.hourlyScores) && dayView.hourlyScores.length > 0 && (() => {
              const activeHour = dayView.hourlyScores[selectedHourIdx] ?? dayView.hourlyScores[0];
              const activeSc = Number(activeHour?.score ?? 0);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>24-HOUR ENERGY CURVE</span>
                    <span>
                      {String(selectedHourIdx).padStart(2, '0')}:00 ·{' '}
                      <strong style={{ color: activeSc > 1 ? 'var(--teal)' : activeSc < -1 ? 'var(--amber)' : 'var(--gold)' }}>
                        {activeSc > 0 ? `+${activeSc}` : activeSc}
                      </strong>{' '}
                      {(activeHour as any)?.bandLabel ? `(${(activeHour as any).bandLabel})` : ''}
                    </span>
                  </div>
                  <div
                    role="group"
                    aria-label="24-hour energy curve"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${dayView.hourlyScores.length}, minmax(0, 1fr))`,
                      gap: 2,
                      alignItems: 'end',
                      height: 42,
                      padding: '4px 6px',
                      borderRadius: 8,
                      background: 'var(--surface-alt)',
                    }}
                  >
                    {dayView.hourlyScores.map((h: any, idx: number) => {
                      const sc = Number(h.score ?? 0);
                      const norm = Math.max(18, Math.min(100, Math.round(((sc + 6) / 12) * 100)));
                      const barColor = sc > 1 ? 'var(--teal)' : sc < -1 ? 'var(--amber)' : 'var(--gold)';
                      const isCurrent = idx === new Date().getHours();
                      const isSelected = idx === selectedHourIdx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedHourIdx(idx)}
                          aria-label={`${String(idx).padStart(2, '0')}:00 score ${sc > 0 ? `+${sc}` : sc}`}
                          aria-pressed={isSelected}
                          title={`${String(idx).padStart(2, '0')}:00 • Score ${sc > 0 ? `+${sc}` : sc} (${h.bandLabel ?? ''})`}
                          style={{
                            height: `${norm}%`,
                            borderRadius: 3,
                            background: barColor,
                            opacity: isSelected || isCurrent ? 1 : 0.65,
                            boxShadow: isSelected ? '0 0 0 2px #ffffff' : isCurrent ? '0 0 0 1px rgba(255,255,255,0.6)' : 'none',
                            padding: 0,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Score Attribution (Collapsible in Guided/Explorer, open in Quant) */}
            {!isGuided && (
              <div style={{ background: 'var(--surface-alt)', padding: '8px 10px', borderRadius: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowScoreFactors((v) => !v)}
                  aria-expanded={factorsExpanded}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: 'var(--gold)',
                    padding: '2px 0',
                  }}
                >
                  <span>Score factors ({currentScore.factors.length})</span>
                  {factorsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {factorsExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
                    {currentScore.factors.map((f: any, i: number) => {
                      const pts = f.points ?? f.value ?? 0;
                      return (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 12,
                            borderBottom: '1px solid var(--border-subtle)',
                            paddingBottom: 4,
                          }}
                        >
                          <span style={{ color: 'var(--text-main)' }}>{f.description ?? f.summary}</span>
                          <span style={{ fontWeight: 700, color: pts > 0 ? 'var(--teal)' : pts < 0 ? 'var(--amber)' : 'var(--text-muted)' }}>
                            {pts > 0 ? `+${pts}` : pts}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Right Hero: Best Windows, Caution Windows & Current Life Chapter */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="serif-title" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              ACTION WINDOWS &amp; ALIGNMENT
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('timing')}
              style={{ color: 'var(--teal)', fontSize: 11.5, fontWeight: 600 }}
            >
              Full Timing →
            </button>
          </div>

          {/* Best Flowing Windows */}
          {(dayView.flowingWindows ?? []).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {dayView.flowingWindows.slice(0, 2).map((w, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 8,
                    background: 'rgba(95, 194, 179, 0.1)',
                    borderLeft: '3px solid var(--teal)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-main)' }}>
                      ★ Best Window: {w.startHour} — {w.endHour}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{w.bandLabel}</div>
                  </div>
                  <span className="teal-badge" style={{ fontSize: 11 }}>+{w.avgScore.toFixed(1)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '9px 12px', borderRadius: 8, background: 'var(--surface-alt)', fontSize: 12, color: 'var(--text-muted)' }}>
              Steady pace today ({dayView.dayBandLabel}) — great for routine progress outside caution windows.
            </div>
          )}

          {/* Condensed Caution Windows */}
          <div style={{ padding: 10, borderRadius: 8, background: 'rgba(217, 119, 54, 0.08)', border: '1px solid rgba(217, 119, 54, 0.25)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <ShieldAlert size={13} /> PAUSE BIG LAUNCHES DURING
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, fontSize: 11.5 }}>
              <div>
                <div style={{ color: 'var(--amber)', fontWeight: 700, fontSize: 10.5 }}>Rahu Kalam</div>
                <div style={{ fontWeight: 600 }}>
                  {(dayView as any).inauspicious?.rahuKalam?.startFormatted ?? '—'}–{(dayView as any).inauspicious?.rahuKalam?.endFormatted ?? '—'}
                </div>
              </div>
              {!isGuided && (
                <>
                  <div>
                    <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 10.5 }}>Yamaganda</div>
                    <div style={{ fontWeight: 600 }}>
                      {(dayView as any).inauspicious?.yamaganda?.startFormatted ?? '—'}–{(dayView as any).inauspicious?.yamaganda?.endFormatted ?? '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--teal)', fontWeight: 700, fontSize: 10.5 }}>Gulika</div>
                    <div style={{ fontWeight: 600 }}>
                      {(dayView as any).inauspicious?.gulika?.startFormatted ?? '—'}–{(dayView as any).inauspicious?.gulika?.endFormatted ?? '—'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Personal Moon + Active Dasha Snapshot */}
          {todayMoon && !isGuided && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', fontSize: 11.5 }}>
              <GlossaryTerm term="Chandrabala" />
              <span className={todayMoon.chandraBalaSupportive ? 'teal-badge' : 'amber-badge'} style={{ fontSize: 11 }}>
                Moon: {todayMoon.sign} (H{todayMoon.houseFromMoon})
              </span>
              <GlossaryTerm term="Tarabala" />
              <span className={todayMoon.taraSupportive ? 'teal-badge' : 'amber-badge'} style={{ fontSize: 11 }}>
                {todayMoon.taraName}
              </span>
            </div>
          )}

          {(reading?.dashas?.length ?? 0) > 0 && (
            <div style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Sparkles size={12} /> ACTIVE LIFE CHAPTER
              </div>
              {(reading?.dashas ?? []).slice(0, isGuided ? 2 : 3).map((dr: any) => {
                const prog = computeDashaProgress(dr.startUtc, dr.endUtc);
                const levelLabel = dr.level === 1 ? 'Main Chapter' : dr.level === 2 ? 'Sub-Chapter' : 'Micro-Cycle';
                return (
                  <div key={dr.periodId ?? dr.level} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <strong style={{ color: dr.level === 1 ? 'var(--teal)' : 'var(--gold)', textTransform: 'capitalize' }}>
                        {isGuided ? levelLabel : dr.level === 1 ? 'Mahadasha' : dr.level === 2 ? 'Antardasha' : 'Pratyantar'}: {dr.lord}
                      </strong>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {prog ? `${prog.pct}% • ${prog.remainingLabel}` : String(dr.endUtc ?? '').slice(0, 10)}
                      </span>
                    </div>
                    {prog && (
                      <div style={{ height: 4, borderRadius: 3, background: 'var(--surface)', overflow: 'hidden' }}>
                        <div style={{ width: `${prog.pct}%`, height: '100%', background: dr.level === 1 ? 'var(--teal)' : 'var(--gold)' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lens-Adaptive Middle Card */}
      {isGuided ? (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(95, 194, 179, 0.12), rgba(227, 173, 70, 0.08))',
            border: '1px solid rgba(95, 194, 179, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Target size={16} style={{ color: 'var(--teal)' }} /> Understand Your Life Events with AI
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
                Pick a real milestone (job change, move, relationship, or turning point) or ask AI anything in plain English.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openLifeEventModal()}
              className="btn btn-primary"
              style={{ fontSize: 12.5, padding: '8px 14px' }}
            >
              <Target size={14} /> Decode a Life Event
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              'What is my current life chapter pushing me to focus on?',
              'Why have things felt intense or fast-moving lately?',
              'What opportunities are opening for my career this year?',
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => openAskDrawer(q)}
                style={{
                  padding: '7px 11px',
                  borderRadius: 10,
                  background: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Sparkles size={12} style={{ color: 'var(--teal)' }} /> {q}
              </button>
            ))}
          </div>
        </div>
      ) : isQuant ? (
        dayView.panchang && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)', margin: 0 }}>
                Today&apos;s Live Panchang Telemetry
              </h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="gold-badge" style={{ fontSize: 10.5 }}>
                  {dayView.panchang.wara.name} ({dayView.panchang.wara.lord.toUpperCase()})
                </span>
                <button type="button" onClick={() => openQuantMatrix('radars')} className="btn btn-outline" style={{ fontSize: 11.5 }}>
                  Kakshya &amp; Navatara ↗
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
              <div style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)' }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Tithi</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{dayView.panchang.tithi.paksha} {dayView.panchang.tithi.name}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{(dayView.panchang.tithi.elapsedFraction * 100).toFixed(0)}% elapsed</div>
              </div>
              <div style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)' }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Yoga</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>{dayView.panchang.yoga.name}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{(dayView.panchang.yoga.elapsedFraction * 100).toFixed(0)}% elapsed</div>
              </div>
              <div style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)' }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Karana</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: dayView.panchang.karana.isVishtiBhadra ? 'var(--amber)' : 'var(--teal)' }}>
                  {dayView.panchang.karana.name}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{dayView.panchang.karana.isVishtiBhadra ? '⚠ Bhadra' : '✓ Clear'}</div>
              </div>
              <div style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)' }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Sunrise / Sunset</div>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>
                  {(dayView.horas?.[0] as any)?.startFormatted ?? '—'} / {(dayView.horas?.[11] as any)?.endFormatted ?? '—'}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Waking mean: {dayView.wakingMeanScore.toFixed(1)}</div>
              </div>
            </div>
          </div>
        )
      ) : (
        topTransits.length > 0 && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)', margin: 0 }}>
                Key Sky Highlights Today (Top 3 Transits)
              </h3>
              <button type="button" onClick={() => setActiveTab('timing')} style={{ color: 'var(--teal)', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                All {transitPlanets.length} Gochar Transits &amp; Dashas <ArrowRight size={13} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10 }}>
              {topTransits.map((tp: any) => {
                const lagnaArea = HOUSE_SHORT_AREAS[Number(tp.houseFromLagna)] ?? `House ${tp.houseFromLagna}`;
                return (
                  <div key={tp.planet} style={{ padding: 11, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ textTransform: 'capitalize' }}>
                        {tp.planet} {tp.retrograde ? '(R)' : ''} → {tp.sign}
                      </strong>
                      <span className={tp.bavQuality === 'supportive' ? 'teal-badge' : tp.bavQuality === 'cautious' ? 'amber-badge' : 'gold-badge'} style={{ fontSize: 10.5 }}>
                        BAV {tp.bindus}/8
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      <strong style={{ color: 'var(--gold)' }}>H{tp.houseFromLagna}</strong> ({lagnaArea}) • H{tp.houseFromMoon} from Moon
                    </div>
                    {tp.plainMeaning && <div style={{ fontSize: 11.5, lineHeight: 1.45 }}>{tp.plainMeaning}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Highlighted Life Topics Strip (Direct Entry to Kundli) */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(227, 173, 70, 0.09), rgba(95, 194, 179, 0.06))',
          border: '1px solid rgba(227, 173, 70, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 className="serif-title" style={{ fontSize: 14.5, color: 'var(--gold)', margin: 0 }}>
              Explore Your Kundli by Life Topic
            </h3>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              Pick a life area to jump directly to its ruling house, chart pattern &amp; divisional chart.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('kundli')}
            style={{ color: 'var(--teal)', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            Open Full Kundli <ArrowRight size={13} />
          </button>
        </div>

        <div className="topic-focus-grid">
          {LIFE_TOPICS.map((t) => {
            const hData = (reading?.houses ?? []).find((h: any) => h.house === t.house);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => focusLifeTopic(t.id)}
                className="topic-focus-card"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16 }}>{t.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)' }}>
                    {t.id === 'year' ? 'Annual' : `H${t.house} · ${t.varga}`}
                  </span>
                </div>
                <strong style={{ fontSize: 12.5, color: 'var(--text-main)' }}>{t.shortLabel}</strong>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3 }}>
                  {hData ? `${hData.sign.toUpperCase()} • ${hData.tone === 'Mostly supportive' ? 'Supportive' : hData.tone === 'Needs attention' ? 'Needs care' : 'Balanced'}` : t.tagline}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1-Tap Mood Check-in */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <PenLine size={14} /> 1-Tap Daily Check-in
            </h3>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              Log how today feels — paired automatically with today&apos;s Moon &amp; Dasha in your Timeline.
            </span>
          </div>
          {checkinStatus === 'saved' && (
            <span style={{ fontSize: 11.5, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              <CheckCircle2 size={13} /> Saved &amp; synced
            </span>
          )}
          {checkinStatus === 'local_only' && (
            <span style={{ fontSize: 11.5, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              <CheckCircle2 size={13} /> Saved locally
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { val: 5, label: '🌊 Flowing (5/5)' },
            { val: 3, label: '⚖️ Steady (3/5)' },
            { val: 2, label: '🔥 Intense (2/5)' },
          ].map((m) => (
            <button
              key={m.val}
              type="button"
              onClick={() => setQuickMood(m.val)}
              style={{
                padding: '7px 11px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                background: quickMood === m.val ? 'var(--teal)' : 'var(--surface-alt)',
                color: quickMood === m.val ? '#15132b' : 'var(--text-main)',
                border: quickMood === m.val ? '1px solid var(--teal)' : '1px solid var(--border-subtle)',
              }}
            >
              {m.label}
            </button>
          ))}
          <input
            type="text"
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            placeholder="Optional 1-line note..."
            style={{
              flex: '1 1 200px',
              background: 'var(--surface-alt)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '7px 10px',
              fontSize: 12,
              color: 'var(--text-main)',
            }}
          />
          <button type="button" onClick={handleSaveQuickCheckin} disabled={checkinStatus === 'saving'} className="btn btn-primary" style={{ fontSize: 12 }}>
            {checkinStatus === 'saving' ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
