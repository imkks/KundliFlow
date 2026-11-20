import React, { useState } from 'react';
import { Clock, ShieldAlert, MapPin, Sparkles, ChevronDown, ChevronRight, HelpCircle, CheckCircle2, PenLine } from 'lucide-react';
import { CITIES } from '@astro/content';
import type { DayView, HourScore } from '@astro/engine';
import { useReading } from '../context/ReadingContext.tsx';
import { GlossaryTerm } from '../components/GlossaryTerm.tsx';
import { API_BASE_URL } from '../config.ts';

interface TodayTabProps {
  cityName: string;
  onCityChange: (city: string) => void;
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
  dayView,
  currentScore,
  activeCityName,
  backendProfileId,
  onQuickCheckinSaved,
}) => {
  const { reading, openAskDrawer, setActiveTab } = useReading();
  const [showHoras, setShowHoras] = useState(false);
  const [quickMood, setQuickMood] = useState<number>(4);
  const [quickNote, setQuickNote] = useState('');
  const [checkinSaved, setCheckinSaved] = useState(false);

  const todayMoon = reading?.panchang?.todayMoon;
  const activeDasha = reading?.dashas?.[0];
  const yogini = reading?.extendedDashas?.yogini;
  const chara = reading?.extendedDashas?.chara;
  const transitPlanets = reading?.transits?.planets ?? [];

  // Resolve real active Hora ruler from currentScore, dayView.horas, or weekday lord
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
        dasha: activeDasha?.lord ?? 'unknown',
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
      // ignore storage errors
    }

    if (backendProfileId) {
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
      }).catch(() => {});
    }

    setQuickNote('');
    setCheckinSaved(true);
    setTimeout(() => setCheckinSaved(false), 4000);
  };

  if (!dayView) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
        Computing today&apos;s planetary rhythms…
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Location & Active Timing Strip */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <MapPin size={15} style={{ color: 'var(--teal)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)' }}>Your location today:</span>
          <select
            value={cityName}
            onChange={(e) => onCityChange(e.target.value)}
            aria-label="Your location today"
            style={{
              background: 'var(--surface-alt)',
              color: 'var(--text-main)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.country})
              </option>
            ))}
          </select>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Used for sunrise, Hora &amp; Rahu Kalam
          </span>
        </div>

        <button
          onClick={() => openAskDrawer('How should I plan my day given today’s Moon, Hora, and transits?')}
          className="btn btn-outline"
          style={{ fontSize: 12 }}
        >
          <HelpCircle size={13} /> Ask AI about Today
        </button>
      </div>

      {/* Current Time Quality Hero + Today's Moon & Active Dashas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {currentScore && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="serif-title" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                CURRENT TIME QUALITY
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
                  Hora Ruler: <strong style={{ color: 'var(--gold)', textTransform: 'capitalize' }}>{activeHoraRuler}</strong> • {(currentScore as any).summary ?? currentScore.text}
                </p>
              </div>
            </div>

            <div style={{ background: 'var(--surface-alt)', padding: 10, borderRadius: 8 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--gold)', marginBottom: 6 }}>
                SCORE ATTRIBUTION FACTORS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
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
            </div>

            {/* Current Hora Action Hint */}
            {HORA_GUIDANCE[activeHoraRuler.toLowerCase()] && (
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: 'rgba(212, 175, 55, 0.08)',
                  border: '1px solid rgba(212, 175, 55, 0.22)',
                  fontSize: 11.5,
                  color: 'var(--text-main)',
                }}
              >
                <strong style={{ color: 'var(--gold)', textTransform: 'capitalize' }}>
                  {activeHoraRuler} Hora Best For:{' '}
                </strong>
                {HORA_GUIDANCE[activeHoraRuler.toLowerCase()]}
              </div>
            )}

            {/* 24-Hour Day Energy Sparkline */}
            {Array.isArray(dayView.hourlyScores) && dayView.hourlyScores.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>24-HOUR ENERGY CURVE</span>
                  <span>00:00 → 12:00 → 23:00</span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${dayView.hourlyScores.length}, minmax(0, 1fr))`,
                    gap: 2,
                    alignItems: 'end',
                    height: 36,
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
                    return (
                      <div
                        key={idx}
                        title={`${String(idx).padStart(2, '0')}:00 • Score ${sc > 0 ? `+${sc}` : sc} (${h.bandLabel ?? ''})`}
                        style={{
                          height: `${norm}%`,
                          borderRadius: 3,
                          background: barColor,
                          opacity: isCurrent ? 1 : 0.72,
                          outline: isCurrent ? '2px solid #ffffff' : 'none',
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Today's Moon + Active Dasha Snapshot */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="serif-title" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              PERSONAL ALIGNMENT TODAY
            </span>
            <button
              onClick={() => setActiveTab('timing')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--teal)',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Full Timing →
            </button>
          </div>

          {todayMoon ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>
                  <GlossaryTerm term="Chandrabala" /> &amp; <GlossaryTerm term="Tarabala" />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <span className={todayMoon.chandraBalaSupportive ? 'teal-badge' : 'amber-badge'} style={{ fontSize: 11 }}>
                    {todayMoon.chandraBalaSupportive ? '✓ Supportive' : '⚠ Watch'} • Moon in {todayMoon.sign} (H{todayMoon.houseFromMoon} from Natal Moon)
                  </span>
                  <span className={todayMoon.taraSupportive ? 'teal-badge' : 'amber-badge'} style={{ fontSize: 11 }}>
                    {todayMoon.taraName}
                  </span>
                  {reading?.transits?.sadeSati && (
                    <span
                      className={
                        reading.transits.sadeSati.isActive || reading.transits.sadeSati.isAshtamaShani
                          ? 'amber-badge'
                          : 'teal-badge'
                      }
                      style={{ fontSize: 11 }}
                    >
                      {reading.transits.sadeSati.isActive
                        ? `♄ Sade Sati (${reading.transits.sadeSati.phase})`
                        : reading.transits.sadeSati.isAshtamaShani
                        ? '♄ Ashtama Shani (8th)'
                        : reading.transits.sadeSati.isKantakaShani
                        ? `♄ Kantaka Shani (H${reading.transits.sadeSati.houseFromMoon})`
                        : '✓ No Sade Sati'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Connect API for Tarabala &amp; Chandrabala alignment.
            </div>
          )}

          {((reading?.dashas?.length ?? 0) > 0 || yogini || chara) && (
            <div style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Sparkles size={12} /> ACTIVE LIFE CHAPTERS
              </div>
              {(reading?.dashas ?? []).slice(0, 3).map((dr: any) => {
                const prog = computeDashaProgress(dr.startUtc, dr.endUtc);
                const levelLabel = dr.level === 1 ? 'Mahadasha' : dr.level === 2 ? 'Antardasha' : 'Pratyantar';
                return (
                  <div key={dr.periodId ?? dr.level} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                      <span>
                        <strong style={{ color: dr.level === 1 ? 'var(--teal)' : 'var(--gold)', textTransform: 'capitalize' }}>
                          {levelLabel}: {dr.lord}
                        </strong>
                      </span>
                      <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                        {prog ? `${prog.pct}% • ${prog.remainingLabel}` : String(dr.endUtc ?? '').slice(0, 10)}
                      </span>
                    </div>
                    {prog && (
                      <div style={{ height: 4, borderRadius: 3, background: 'var(--surface)', overflow: 'hidden' }}>
                        <div style={{ width: `${prog.pct}%`, height: '100%', background: dr.level === 1 ? 'var(--teal)' : 'var(--gold)', borderRadius: 3 }} />
                      </div>
                    )}
                    {dr.level === 1 && dr.summary && (
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>{dr.summary}</div>
                    )}
                  </div>
                );
              })}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 4, borderTop: '1px solid var(--border-subtle)', fontSize: 11.5, color: 'var(--text-muted)' }}>
                {yogini && (
                  <span>
                    <strong style={{ color: 'var(--gold)' }}>Yogini:</strong> {yogini.maha} ({yogini.mahaLord})
                    {yogini.antar ? ` / ${yogini.antar}` : ''}
                  </span>
                )}
                {chara && (
                  <span>
                    <strong style={{ color: 'var(--teal)' }}>Chara:</strong> {chara.mahaSign} (H{chara.mahaHouse})
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Best Action Windows Today + Today's Live Panchang */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {/* Best Action Windows */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--teal)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={15} /> Best Action Windows Today
            </h3>
            <span className="teal-badge" style={{ fontSize: 10 }}>
              Day Avg: {dayView.wakingMeanScore > 0 ? `+${dayView.wakingMeanScore.toFixed(1)}` : dayView.wakingMeanScore.toFixed(1)}
            </span>
          </div>
          {(dayView.flowingWindows ?? []).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dayView.flowingWindows.map((w, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 12px',
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
                      {w.startHour} — {w.endHour}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{w.bandLabel}</div>
                  </div>
                  <span className="teal-badge" style={{ fontSize: 11 }}>
                    +{w.avgScore.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Today has a steady, even pace ({dayView.dayBandLabel}) — great for consistent execution and routine progress outside caution windows.
            </div>
          )}

          {/* Retrograde Sky Watch */}
          {transitPlanets.some((p: any) => p.retrograde) && (
            <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(217, 119, 54, 0.08)', border: '1px solid rgba(217, 119, 54, 0.28)', fontSize: 11.5 }}>
              <strong style={{ color: 'var(--amber)' }}>↺ Retrograde in Sky Today: </strong>
              {transitPlanets
                .filter((p: any) => p.retrograde)
                .map((p: any) => `${String(p.planet).toUpperCase()} (${p.sign})`)
                .join(' • ')}
            </div>
          )}
        </div>

        {/* Today's Live Panchang */}
        {dayView.panchang && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)', margin: 0 }}>
                Today&apos;s Live Panchang
              </h3>
              <span className="gold-badge" style={{ fontSize: 10 }}>
                {dayView.panchang.wara.name} ({dayView.panchang.wara.lord.toUpperCase()})
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 8 }}>
              <div style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Tithi (Lunar Day)</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>
                  {dayView.panchang.tithi.paksha} {dayView.panchang.tithi.name}
                </div>
                <div style={{ height: 4, borderRadius: 3, background: 'var(--surface)', marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round(dayView.panchang.tithi.elapsedFraction * 100)}%`, height: '100%', background: 'var(--teal)' }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                  {(dayView.panchang.tithi.elapsedFraction * 100).toFixed(0)}% elapsed • {dayView.panchang.tithi.paksha === 'Shukla' ? 'Waxing' : 'Waning'}
                </div>
              </div>
              <div style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Yoga (Luni-Solar)</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginTop: 2 }}>
                  {dayView.panchang.yoga.name}
                </div>
                <div style={{ height: 4, borderRadius: 3, background: 'var(--surface)', marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round(dayView.panchang.yoga.elapsedFraction * 100)}%`, height: '100%', background: 'var(--gold)' }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                  {(dayView.panchang.yoga.elapsedFraction * 100).toFixed(0)}% elapsed
                </div>
              </div>
              <div style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Karana (Half-Tithi)</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: dayView.panchang.karana.isVishtiBhadra ? 'var(--amber)' : 'var(--teal)', marginTop: 2 }}>
                  {dayView.panchang.karana.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                  {dayView.panchang.karana.isVishtiBhadra ? '⚠ Bhadra caution for launches' : '✓ Clear for execution'}
                </div>
              </div>
              <div style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Day Rhythm</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal)', marginTop: 2 }}>
                  {dayView.dayBandLabel}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                  Avg {dayView.wakingMeanScore > 0 ? `+${dayView.wakingMeanScore.toFixed(1)}` : dayView.wakingMeanScore.toFixed(1)} waking score
                </div>
              </div>
              <div style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Sunrise / Sunset</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>
                  {(dayView.horas?.[0] as any)?.startFormatted ?? (dayView.horas?.[0] as any)?.startIso?.slice(11, 16) ?? '—'} /{' '}
                  {(dayView.horas?.[11] as any)?.endFormatted ?? (dayView.horas?.[11] as any)?.endIso?.slice(11, 16) ?? '—'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                  {activeCityName} local solar day
                </div>
              </div>
              <div style={{ padding: 10, borderRadius: 8, background: 'var(--surface-alt)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Transit Moon</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-main)', marginTop: 2, textTransform: 'capitalize' }}>
                  {todayMoon?.sign ?? '—'} {todayMoon?.houseFromMoon ? `(H${todayMoon.houseFromMoon})` : ''}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                  {todayMoon?.taraName?.split(' (')[0] ?? 'Tarabala active'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inauspicious Windows */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
            <ShieldAlert size={16} /> Caution Windows Today
          </h3>
          <span className="amber-badge" style={{ fontSize: 10 }}>
            Traditional Muhurta Guards
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div style={{ background: 'var(--surface-alt)', padding: 12, borderRadius: 8, borderLeft: '3px solid var(--amber)' }}>
            <div style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 700 }}>RAHU KALAM</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
              {(dayView as any).inauspicious?.rahuKalam?.startFormatted ?? (dayView as any).rahuKalam?.start ?? '—'} — {(dayView as any).inauspicious?.rahuKalam?.endFormatted ?? (dayView as any).rahuKalam?.end ?? '—'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Avoid launching major contracts or travels
            </div>
          </div>

          <div style={{ background: 'var(--surface-alt)', padding: 12, borderRadius: 8, borderLeft: '3px solid var(--gold)' }}>
            <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700 }}>YAMAGANDA</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
              {(dayView as any).inauspicious?.yamaganda?.startFormatted ?? '—'} — {(dayView as any).inauspicious?.yamaganda?.endFormatted ?? '—'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Unfavorable for financial beginnings
            </div>
          </div>

          <div style={{ background: 'var(--surface-alt)', padding: 12, borderRadius: 8, borderLeft: '3px solid var(--teal)' }}>
            <div style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 700 }}>GULIKA KALAM</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
              {(dayView as any).inauspicious?.gulika?.startFormatted ?? '—'} — {(dayView as any).inauspicious?.gulika?.endFormatted ?? '—'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Saturnian focus window; routine &amp; review work well
            </div>
          </div>
        </div>
      </div>

      {/* Key Transits Today */}
      {transitPlanets.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)', margin: 0 }}>
                Live Planetary Transits (Gochar) &amp; <GlossaryTerm term="BAV" /> Cushion
              </h3>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                All {transitPlanets.length} Vedic grahas mapped to your Lagna &amp; Moon houses (4+ BAV bindus = supportive cushion)
              </div>
            </div>
            <button
              onClick={() => setActiveTab('timing')}
              style={{ background: 'transparent', border: 'none', color: 'var(--teal)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
            >
              See Full Calendar &amp; Dashas →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(245px, 1fr))', gap: 10 }}>
            {transitPlanets.map((tp: any) => {
              const bindus = Number(tp.bindus ?? 0);
              const bavPct = Math.min(100, Math.round((bindus / 8) * 100));
              const bavColor = tp.bavQuality === 'supportive' ? 'var(--teal)' : tp.bavQuality === 'cautious' ? 'var(--amber)' : 'var(--gold)';
              const lagnaArea = HOUSE_SHORT_AREAS[Number(tp.houseFromLagna)] ?? `House ${tp.houseFromLagna}`;
              return (
                <div
                  key={tp.planet}
                  style={{
                    padding: 11,
                    borderRadius: 10,
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-main)' }}>
                      {tp.planet}{' '}
                      {tp.retrograde && (
                        <span style={{ fontSize: 10, color: 'var(--amber)', fontWeight: 700 }}>(Rx)</span>
                      )}{' '}
                      → {tp.sign}
                    </span>
                    <span
                      className={tp.bavQuality === 'supportive' ? 'teal-badge' : tp.bavQuality === 'cautious' ? 'amber-badge' : 'gold-badge'}
                      style={{ fontSize: 10 }}
                    >
                      {tp.bavQuality === 'supportive' ? '✓' : tp.bavQuality === 'cautious' ? '⚠' : '•'} BAV {bindus}/8
                    </span>
                  </div>

                  {/* BAV mini gauge */}
                  <div style={{ height: 4, borderRadius: 3, background: 'var(--surface)', overflow: 'hidden' }}>
                    <div style={{ width: `${bavPct}%`, height: '100%', background: bavColor, borderRadius: 3 }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>
                      <strong style={{ color: 'var(--gold)' }}>H{tp.houseFromLagna}</strong> ({lagnaArea}) • H{tp.houseFromMoon} Moon
                    </span>
                  </div>

                  {tp.plainMeaning && (
                    <div style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--text-main)' }}>
                      {tp.plainMeaning}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: 2 }}>
                    <button
                      onClick={() =>
                        openAskDrawer(
                          `How is transit ${tp.planet} in ${tp.sign} (House ${tp.houseFromLagna} from Lagna, BAV ${bindus}/8) affecting me right now?`,
                        )
                      }
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        fontSize: 10.5,
                        fontWeight: 600,
                        color: 'var(--teal)',
                        cursor: 'pointer',
                      }}
                    >
                      Ask AI about this transit →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1-Tap Mood Check-in */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <PenLine size={14} /> 1-Tap Daily Check-in
            </h3>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              Log how today feels — paired with today&apos;s Moon, Hora ({activeHoraRuler}) &amp; Dasha in your Journal.
            </span>
          </div>
          {checkinSaved && (
            <span style={{ fontSize: 11, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              <CheckCircle2 size={13} /> Saved to Journal
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
              onClick={() => setQuickMood(m.val)}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
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
              padding: '6px 10px',
              fontSize: 12,
              color: 'var(--text-main)',
            }}
          />
          <button onClick={handleSaveQuickCheckin} className="btn" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
            Save
          </button>
        </div>
      </div>

      {/* Collapsible 24 Unequal Horas */}
      <div className="card">
        <button
          onClick={() => setShowHoras((v) => !v)}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            padding: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            color: 'var(--gold)',
          }}
        >
          <span className="serif-title" style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={15} /> 24 Unequal Day &amp; Night Horas
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            {showHoras ? 'Hide calculation' : 'Show 24 hourly windows'}
            {showHoras ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </span>
        </button>

        {showHoras && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginTop: 12 }}>
            {(dayView.horas || []).map((h: any) => {
              const isNight = !h.isDayHora;
              return (
                <div
                  key={h.index}
                  style={{
                    background: 'var(--surface-alt)',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                    <span>#{h.index} {isNight ? 'Night' : 'Day'}</span>
                    <span style={{ color: 'var(--gold)', textTransform: 'capitalize', fontWeight: 600 }}>{h.lord}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>
                    {h.startFormatted || h.startIso?.slice(11, 16) || '—'} - {h.endFormatted || h.endIso?.slice(11, 16) || '—'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
