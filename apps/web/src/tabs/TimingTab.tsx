import React, { useState, useMemo, useEffect } from 'react';
import { HelpCircle, Clock, Target, Plus, Trash2, Calendar } from 'lucide-react';
import type {
  NatalChart,
  VimshottariDashaTree,
  YoginiDashaTree,
  CharaDashaTree,
} from '@astro/engine';
import { VimshottariExplorer } from '../components/VimshottariExplorer.tsx';
import { YoginiExplorer } from '../components/YoginiExplorer.tsx';
import { CharaExplorer } from '../components/CharaExplorer.tsx';
import { CalendarExplorer } from '../components/CalendarExplorer.tsx';
import { useReading } from '../context/ReadingContext.tsx';
import { GlossaryTerm } from '../components/GlossaryTerm.tsx';

interface LifeEventItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  category: 'career' | 'relationship' | 'move' | 'breakthrough';
}

const LIFE_EVENTS_KEY = 'astro_life_events_v1';

const DEFAULT_EVENTS: LifeEventItem[] = [
  { id: 'ev-1', title: 'First Career / Academic Turning Point', date: '2020-07-01', category: 'career' },
  { id: 'ev-2', title: 'Major Shift / Relocation', date: '2024-03-01', category: 'move' },
];

function matchVimshottari(dashas: VimshottariDashaTree | null, dateStr: string): string {
  if (!dashas?.periods) return '—';
  const target = `${dateStr}T12:00:00Z`;
  const maha = dashas.periods.find((p) => target >= p.startDateIso && target < p.endDateIso);
  if (!maha) return 'Outside dasha range';
  const antar = maha.subPeriods?.find((a) => target >= a.startDateIso && target < a.endDateIso);
  return `${maha.lord.toUpperCase()}${antar ? ` / ${antar.lord.toUpperCase()}` : ''}`;
}

function matchYogini(yogini: YoginiDashaTree | null, dateStr: string): string {
  if (!yogini?.periods) return '—';
  const target = `${dateStr}T12:00:00Z`;
  const maha = yogini.periods.find((p) => target >= p.startDateIso && target < p.endDateIso);
  if (!maha) return '—';
  const antar = maha.subPeriods?.find((a) => target >= a.startDateIso && target < a.endDateIso);
  return `${maha.name}${antar ? ` / ${antar.name}` : ''}`;
}

function matchChara(chara: CharaDashaTree | null, dateStr: string): string {
  if (!chara?.periods) return '—';
  const target = `${dateStr}T12:00:00Z`;
  const maha = chara.periods.find((p) => target >= p.startDateIso && target < p.endDateIso);
  if (!maha) return '—';
  const antar = maha.subPeriods?.find((a) => target >= a.startDateIso && target < a.endDateIso);
  return `${maha.sign}${antar ? ` / ${antar.sign}` : ''}`;
}

function daysUntil(isoStr?: string | null): number | null {
  if (!isoStr) return null;
  const targetMs = new Date(isoStr).getTime();
  if (!Number.isFinite(targetMs)) return null;
  return Math.max(0, Math.ceil((targetMs - Date.now()) / 86400000));
}

function periodProgress(startIso?: string | null, endIso?: string | null): { pct: number; remText: string } | null {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const now = Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  const pct = Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)));
  const remDays = Math.max(0, Math.ceil((end - now) / 86400000));
  const remText =
    remDays >= 365
      ? `${(remDays / 365.25).toFixed(1)} yrs left`
      : remDays >= 45
      ? `${Math.round(remDays / 30.4)} mos left`
      : `${remDays} days left`;
  return { pct, remText };
}

interface TimingTabProps {
  profileId?: string | null;
  natalChart: NatalChart;
  monthPeakSummary?: {
    peakDays: Array<{ date: string; dayScore: number; dayBand: string }>;
    cautionDays: Array<{ date: string; dayScore: number; dayBand: string }>;
    ingressCount: number;
  } | null;
  dashas: VimshottariDashaTree | null;
  yoginiDashas: YoginiDashaTree | null;
  charaDashas: CharaDashaTree | null;
}

export const TimingTab: React.FC<TimingTabProps> = ({
  profileId,
  natalChart,
  monthPeakSummary,
  dashas,
  yoginiDashas,
  charaDashas,
}) => {
  const [subMode, setSubMode] = useState<'dashas' | 'calendar'>('dashas');
  const [dashaSystem, setDashaSystem] = useState<'vimshottari' | 'yogini' | 'chara'>('vimshottari');
  const { reading, openAskDrawer, setActiveTab } = useReading();

  const [lifeEvents, setLifeEvents] = useState<LifeEventItem[]>(() => {
    try {
      const raw = localStorage.getItem(LIFE_EVENTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_EVENTS;
  });
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('2023-06-15');
  const [eventCategory, setEventCategory] = useState<LifeEventItem['category']>('career');

  useEffect(() => {
    try {
      localStorage.setItem(LIFE_EVENTS_KEY, JSON.stringify(lifeEvents));
    } catch {
      // ignore
    }
  }, [lifeEvents]);

  const handleAddEvent = () => {
    if (!eventTitle.trim() || !eventDate) return;
    setLifeEvents((prev) => [
      { id: `ev-${Date.now()}`, title: eventTitle.trim(), date: eventDate, category: eventCategory },
      ...prev,
    ]);
    setEventTitle('');
  };

  const dashaReadings = reading?.dashas ?? [];
  const extendedDashas = reading?.extendedDashas;
  const transitSummary = reading?.transits;

  const upcomingShifts = useMemo(() => {
    const items: Array<{ label: string; endIso: string; daysLeft: number }> = [];
    for (const dr of dashaReadings) {
      const d = daysUntil(dr.endUtc);
      if (d !== null && dr.level >= 2) {
        items.push({
          label: `${dr.level === 2 ? 'Antardasha' : 'Pratyantar'} (${String(dr.lord).toUpperCase()}) ends`,
          endIso: String(dr.endUtc).slice(0, 10),
          daysLeft: d,
        });
      }
    }
    if (extendedDashas?.yogini?.antarEnd) {
      const d = daysUntil(extendedDashas.yogini.antarEnd);
      if (d !== null) {
        items.push({
          label: `Yogini ${extendedDashas.yogini.antar} shifts`,
          endIso: extendedDashas.yogini.antarEnd,
          daysLeft: d,
        });
      }
    }
    if (extendedDashas?.chara?.antarEnd) {
      const d = daysUntil(extendedDashas.chara.antarEnd);
      if (d !== null) {
        items.push({
          label: `Chara ${extendedDashas.chara.antarSign} shifts`,
          endIso: extendedDashas.chara.antarEnd,
          daysLeft: d,
        });
      }
    }
    return items.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 4);
  }, [dashaReadings, extendedDashas]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Sub-mode Switcher */}
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
            onClick={() => setSubMode('dashas')}
            style={{
              padding: '5px 12px',
              fontSize: 12,
              borderRadius: 7,
              fontWeight: subMode === 'dashas' ? 700 : 500,
              background: subMode === 'dashas' ? 'var(--gold)' : 'transparent',
              color: subMode === 'dashas' ? '#15132b' : 'var(--text-main)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Active Dashas &amp; Gochar
          </button>
          <button
            onClick={() => setSubMode('calendar')}
            style={{
              padding: '5px 12px',
              fontSize: 12,
              borderRadius: 7,
              fontWeight: subMode === 'calendar' ? 700 : 500,
              background: subMode === 'calendar' ? 'var(--gold)' : 'transparent',
              color: subMode === 'calendar' ? '#15132b' : 'var(--text-main)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Month Heatmap &amp; Year Transits
          </button>
        </div>

        <button
          onClick={() => openAskDrawer('What is my current Vimshottari Mahadasha and Antardasha activating?')}
          className="btn btn-outline"
          style={{ fontSize: 12 }}
        >
          <HelpCircle size={13} /> Ask AI about Timing
        </button>
      </div>

      {subMode === 'dashas' && (
        <>
          {/* Upcoming Chapter Shifts Strip */}
          {upcomingShifts.length > 0 && (
            <div className="card" style={{ padding: '12px 16px', background: 'rgba(95, 194, 179, 0.05)', border: '1px solid rgba(95, 194, 179, 0.25)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', marginBottom: 8 }}>
                ⏳ Upcoming Period Shifts
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                {upcomingShifts.map((s) => (
                  <div key={s.label} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--surface-alt)', fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 2 }}>
                      {s.endIso} • in {s.daysLeft} day{s.daysLeft === 1 ? '' : 's'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* This Month's Peak & Caution Days Mini-Card */}
          {monthPeakSummary && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={15} /> This Month&apos;s Peak &amp; Caution Dates
                  </h3>
                  <span className="gold-badge" style={{ fontSize: 10 }}>
                    {monthPeakSummary.ingressCount} planetary sign shift{monthPeakSummary.ingressCount === 1 ? '' : 's'} this month
                  </span>
                </div>
                <button
                  onClick={() => setSubMode('calendar')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--teal)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
                >
                  Open Full Muhurta Heatmap →
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(95, 194, 179, 0.08)', border: '1px solid rgba(95, 194, 179, 0.25)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase' }}>
                    ★ Top Flowing Days (Launches &amp; Key Meetings)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {monthPeakSummary.peakDays.map((d) => (
                      <span key={d.date} className="teal-badge" style={{ fontSize: 11 }}>
                        {d.date} ({d.dayScore > 0 ? `+${d.dayScore}` : d.dayScore})
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Highest Moon Tarabala + Hora alignment — prioritize outreach, signings, and bold starts.
                  </div>
                </div>
                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(217, 119, 54, 0.08)', border: '1px solid rgba(217, 119, 54, 0.25)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase' }}>
                    ⚠ Go-Gently Days (Rest, Audit &amp; Routine)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {monthPeakSummary.cautionDays.map((d) => (
                      <span key={d.date} className="amber-badge" style={{ fontSize: 11 }}>
                        {d.date} ({d.dayScore > 0 ? `+${d.dayScore}` : d.dayScore})
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Lower lunar cushion — ideal for internal cleanup, research, and pacing yourself.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Level 2 Active Dasha Readings */}
          {(dashaReadings.length > 0 || extendedDashas) && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={15} /> Current Planetary Chapters (Level 2)
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                {dashaReadings.map((dr: any) => {
                  const prog = periodProgress(dr.startUtc, dr.endUtc);
                  const lvlName = dr.level === 1 ? 'Mahadasha' : dr.level === 2 ? 'Antardasha' : 'Pratyantar';
                  return (
                    <div
                      key={dr.periodId}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        background: 'var(--surface-alt)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 7,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                        <strong style={{ fontSize: 13.5, textTransform: 'capitalize', color: dr.level === 1 ? 'var(--teal)' : 'var(--gold)' }}>
                          {lvlName} • {dr.lord}
                        </strong>
                        {prog && (
                          <span className="gold-badge" style={{ fontSize: 10 }}>
                            {prog.pct}% • {prog.remText}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                        {String(dr.startUtc).slice(0, 10)} → {String(dr.endUtc).slice(0, 10)}
                      </div>

                      {prog && (
                        <div style={{ height: 5, borderRadius: 4, background: 'var(--surface)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${prog.pct}%`,
                              height: '100%',
                              background: dr.level === 1 ? 'var(--teal)' : 'var(--gold)',
                              borderRadius: 4,
                            }}
                          />
                        </div>
                      )}

                      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--text-main)' }}>{dr.summary}</p>

                      {dr.findings?.slice(0, 2).map((f: any) => (
                        <div key={f.id} style={{ fontSize: 11.5, color: 'var(--text-muted)', paddingLeft: 8, borderLeft: '2px solid var(--gold)', lineHeight: 1.45 }}>
                          {f.text}
                        </div>
                      ))}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: 2 }}>
                        <button
                          onClick={() => openAskDrawer(`What should I focus on during my ${dr.lord} ${lvlName} (${String(dr.startUtc).slice(0, 10)} to ${String(dr.endUtc).slice(0, 10)})?`)}
                          style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 10.5, fontWeight: 600, color: 'var(--teal)', cursor: 'pointer' }}
                        >
                          Ask AI about this chapter →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {extendedDashas && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                  {extendedDashas.yogini && (
                    <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: 'var(--gold)' }}>
                          Yogini: {extendedDashas.yogini.maha} ({extendedDashas.yogini.mahaLord})
                          {extendedDashas.yogini.antar ? ` / ${extendedDashas.yogini.antar}` : ''}
                        </span>
                        {daysUntil(extendedDashas.yogini.mahaEnd) !== null && (
                          <span className="gold-badge" style={{ fontSize: 10 }}>
                            {daysUntil(extendedDashas.yogini.mahaEnd)}d left
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Maha ends {extendedDashas.yogini.mahaEnd}{extendedDashas.yogini.antarEnd ? ` • Antar ends ${extendedDashas.yogini.antarEnd}` : ''}
                      </div>
                      <div style={{ lineHeight: 1.45, color: 'var(--text-main)' }}>{extendedDashas.yogini.plainSummary}</div>
                    </div>
                  )}
                  {extendedDashas.chara && (
                    <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: 'var(--teal)' }}>
                          Jaimini Chara: {extendedDashas.chara.mahaSign} (H{extendedDashas.chara.mahaHouse})
                          {extendedDashas.chara.antarSign ? ` / ${extendedDashas.chara.antarSign}` : ''}
                        </span>
                        {daysUntil(extendedDashas.chara.mahaEnd) !== null && (
                          <span className="teal-badge" style={{ fontSize: 10 }}>
                            {daysUntil(extendedDashas.chara.mahaEnd)}d left
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Maha ends {extendedDashas.chara.mahaEnd}{extendedDashas.chara.antarEnd ? ` • Antar ends ${extendedDashas.chara.antarEnd}` : ''}
                      </div>
                      <div style={{ lineHeight: 1.45, color: 'var(--text-main)' }}>{extendedDashas.chara.plainSummary}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Dasha System Explorer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, background: 'var(--surface-alt)', padding: 4, borderRadius: 8, border: '1px solid var(--border-subtle)', alignSelf: 'flex-start' }}>
              {(
                [
                  { id: 'vimshottari', label: 'Vimshottari Dasha (120y)' },
                  { id: 'yogini', label: 'Yogini Dasha (36y)' },
                  { id: 'chara', label: 'Chara Dasha (Jaimini)' },
                ] as const
              ).map((sys) => (
                <button
                  key={sys.id}
                  onClick={() => setDashaSystem(sys.id)}
                  style={{
                    padding: '4px 12px',
                    fontSize: 12,
                    borderRadius: 6,
                    cursor: 'pointer',
                    border: 'none',
                    fontWeight: dashaSystem === sys.id ? 600 : 400,
                    background: dashaSystem === sys.id ? 'var(--gold)' : 'transparent',
                    color: dashaSystem === sys.id ? '#15132b' : 'var(--text-main)',
                  }}
                >
                  {sys.label}
                </button>
              ))}
            </div>

            {dashaSystem === 'vimshottari'
              ? dashas && <VimshottariExplorer dashas={dashas} />
              : dashaSystem === 'yogini'
              ? yoginiDashas && <YoginiExplorer yogini={yoginiDashas} />
              : charaDashas && <CharaExplorer chara={charaDashas} />}
          </div>

          {/* All 9 Gochar Transits & Sade Sati */}
          {transitSummary && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0 }}>
                  All 9 Gochar Transits &amp; <GlossaryTerm term="Sade Sati" />
                </h3>
                {transitSummary.sadeSati && (
                  <span className={transitSummary.sadeSati.isActive ? 'amber-badge' : 'teal-badge'} style={{ fontSize: 11 }}>
                    {transitSummary.sadeSati.isActive ? `⚠ Sade Sati Active (${transitSummary.sadeSati.phase})` : '✓ Sade Sati Inactive'}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 8 }}>
                {(transitSummary.planets ?? []).map((tp: any) => (
                  <div
                    key={tp.planet}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-main)' }}>
                        {tp.planet} {tp.retrograde ? '(R)' : ''} → {tp.sign}
                      </span>
                      <span
                        className={tp.bavQuality === 'supportive' ? 'teal-badge' : tp.bavQuality === 'cautious' ? 'amber-badge' : 'gold-badge'}
                        style={{ fontSize: 10 }}
                      >
                        {tp.bavQuality === 'supportive' ? '✓' : tp.bavQuality === 'cautious' ? '⚠' : '•'} BAV {tp.bindus}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      H{tp.houseFromLagna} Lagna • H{tp.houseFromMoon} Moon
                    </div>
                    {tp.plainMeaning && <div style={{ fontSize: 11.5, lineHeight: 1.4 }}>{tp.plainMeaning}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Past Life Events Validator */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Target size={15} /> Test Your Chart Against Past Life Events
              </h3>
              <span className="teal-badge" style={{ fontSize: 10.5 }}>Dasha Accuracy Validator</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
              Enter real milestones (job change, move, marriage, setback) to see which planetary periods were active on that exact date.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Milestone (e.g., Started new job in Bengaluru)"
                style={{ flex: '2 1 200px', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'var(--text-main)' }}
              />
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'var(--text-main)' }}
              />
              <select
                value={eventCategory}
                onChange={(e) => setEventCategory(e.target.value as any)}
                style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'var(--text-main)' }}
              >
                <option value="career">Career</option>
                <option value="relationship">Relationship</option>
                <option value="move">Relocation</option>
                <option value="breakthrough">Breakthrough</option>
              </select>
              <button onClick={handleAddEvent} className="btn btn-primary" style={{ fontSize: 12 }}>
                <Plus size={13} /> Add Milestone
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 10 }}>
              {lifeEvents.map((ev) => (
                <div key={ev.id} style={{ padding: 12, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                    <strong style={{ fontSize: 13, color: 'var(--text-main)' }}>{ev.title}</strong>
                    <button
                      onClick={() => setLifeEvents((prev) => prev.filter((x) => x.id !== ev.id))}
                      aria-label="Remove event"
                      style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>
                    {ev.date} • {ev.category.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 11.5, lineHeight: 1.5, color: 'var(--text-main)' }}>
                    <div><strong>Vimshottari:</strong> {matchVimshottari(dashas, ev.date)}</div>
                    <div><strong>Yogini:</strong> {matchYogini(yoginiDashas, ev.date)}</div>
                    <div><strong>Chara:</strong> {matchChara(charaDashas, ev.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {subMode === 'calendar' && (
        <CalendarExplorer profileId={profileId} natalChart={natalChart} />
      )}

      {/* Contextual Next-Step Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
        <button onClick={() => setActiveTab('journal')} className="btn btn-outline" style={{ fontSize: 12 }}>
          Compare this period with your Journal →
        </button>
      </div>
    </div>
  );
};
