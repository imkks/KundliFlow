import React, { useState, useMemo, useEffect } from 'react';
import {
  HelpCircle,
  Clock,
  Target,
  Plus,
  Trash2,
  Calendar,
  Radio,
  Activity,
  ShieldAlert,
  Sparkles,
  GitBranch,
} from 'lucide-react';
import {
  SIGNS,
  computeAshtakvarga,
  evaluateKakshyaTransits,
  checkTransitVedha,
  type VedhaCheckResult,
  type VedicGraha,
  type NatalChart,
  type VimshottariDashaTree,
  type YoginiDashaTree,
  type CharaDashaTree,
} from '@astro/engine';
import { VimshottariExplorer } from '../components/VimshottariExplorer.tsx';
import { YoginiExplorer } from '../components/YoginiExplorer.tsx';
import { CharaExplorer } from '../components/CharaExplorer.tsx';
import { CalendarExplorer } from '../components/CalendarExplorer.tsx';
import { useReading } from '../context/ReadingContext.tsx';
import { GlossaryTerm } from '../components/GlossaryTerm.tsx';
import {
  loadLifeEvents,
  removeLifeEvent,
  subscribeLifeEvents,
  type LifeEventItem,
} from '../utils/lifeEventsStore.ts';

const HOUSE_MILESTONES: Record<number, { title: string; desc: string }> = {
  1: { title: 'Identity & Vitality Reboot', desc: 'Major new life beginnings, personal health & lifestyle milestones' },
  2: { title: 'Wealth & Family Expansion', desc: 'Significant asset accumulation, savings growth & family moments' },
  3: { title: 'Initiatives & Creative Courage', desc: 'Bold personal projects, publications, skills & short-journey leaps' },
  4: { title: 'Home, Property & Inner Peace', desc: 'Property purchase, vehicle, sanctuary & deep emotional contentment' },
  5: { title: 'Children, Creativity & Learning', desc: 'Progeny milestones, creative breakthroughs & academic honors' },
  6: { title: 'Competitive Triumph & Healing', desc: 'Overcoming health hurdles, clearing debts & steady resilience' },
  7: { title: 'Marriage & Key Partnerships', desc: 'Commitment, marriage & thriving business alliances' },
  8: { title: 'Transformative Breakthroughs', desc: 'Deep research, shared resources & catalytic psychological shifts' },
  9: { title: 'Higher Fortune, Mentors & Dharma', desc: 'Guidance, higher learning, long travel & fortunate openings' },
  10: { title: 'Career Leap & Public Elevation', desc: 'Major career promotion, role expansion & reputation growth' },
  11: { title: 'Ambitions Fulfilled & Inflows', desc: 'Realization of goals, financial inflows & network leaps' },
  12: { title: 'Foreign Relocation & Retreat', desc: 'Relocation abroad, spiritual retreat & letting go of old baggage' },
};

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
  const [showAllGochar, setShowAllGochar] = useState(false);

  const {
    reading,
    isGuided,
    isQuant,
    openAskDrawer,
    setActiveTab,
    openLifeEventModal,
    openQuantMatrix,
    openPatternDecoder,
  } = useReading();

  const [lifeEvents, setLifeEvents] = useState<LifeEventItem[]>(() => loadLifeEvents());

  useEffect(() => {
    const unsub = subscribeLifeEvents(setLifeEvents);
    return unsub;
  }, []);

  const dashaReadings = reading?.dashas ?? [];
  const extendedDashas = reading?.extendedDashas;
  const transitSummary = reading?.transits;
  const ghatak = reading?.specials?.ghatak;

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

  const doubleTransitHouses = useMemo(() => {
    if (!transitSummary?.planets) return [];
    const saturn = transitSummary.planets.find((p: any) => p.planet === 'saturn');
    const jupiter = transitSummary.planets.find((p: any) => p.planet === 'jupiter');
    if (!saturn || !jupiter) return [];

    const sH = Number(saturn.houseFromLagna);
    const jH = Number(jupiter.houseFromLagna);
    if (!sH || !jH) return [];

    const saturnAspects = new Set([
      sH,
      ((sH - 1 + 2) % 12) + 1,
      ((sH - 1 + 6) % 12) + 1,
      ((sH - 1 + 9) % 12) + 1,
    ]);
    const jupiterAspects = new Set([
      jH,
      ((jH - 1 + 4) % 12) + 1,
      ((jH - 1 + 6) % 12) + 1,
      ((jH - 1 + 8) % 12) + 1,
    ]);

    const common = Array.from(saturnAspects).filter((h) => jupiterAspects.has(h)).sort((a, b) => a - b);
    const lagnaSignIndex = natalChart.lagna?.signIndex ?? 0;

    return common.map((h) => {
      const houseData = reading?.houses?.find((hd: any) => hd.house === h);
      const sign = SIGNS[(lagnaSignIndex + h - 1) % 12];
      const milestone = HOUSE_MILESTONES[h] ?? { title: `House ${h}`, desc: 'Life area' };
      const sav = houseData?.sav ?? null;
      return {
        house: h,
        sign,
        sav,
        title: milestone.title,
        desc: milestone.desc,
        saturnAspectNote: h === sH ? 'Saturn transits here' : `Saturn aspects (H${h})`,
        jupiterAspectNote: h === jH ? 'Jupiter transits here' : `Jupiter aspects (H${h})`,
      };
    });
  }, [transitSummary, reading?.houses, natalChart]);

  const ashtakvargaData = useMemo(() => {
    try {
      return computeAshtakvarga({
        sun: natalChart.grahas.sun.signIndex,
        moon: natalChart.grahas.moon.signIndex,
        mars: natalChart.grahas.mars.signIndex,
        mercury: natalChart.grahas.mercury.signIndex,
        jupiter: natalChart.grahas.jupiter.signIndex,
        venus: natalChart.grahas.venus.signIndex,
        saturn: natalChart.grahas.saturn.signIndex,
        lagna: natalChart.lagna?.signIndex ?? 0,
      });
    } catch {
      return null;
    }
  }, [natalChart]);

  const kakshyaData = useMemo(() => {
    if (!transitSummary?.planets || !ashtakvargaData?.prastara) return null;
    const lons: Record<string, number> = {};
    for (const tp of transitSummary.planets) {
      if (tp.degInSign !== undefined && tp.signIndex !== undefined) {
        lons[tp.planet] = tp.signIndex * 30 + tp.degInSign;
      } else if (tp.lon !== undefined) {
        lons[tp.planet] = tp.lon;
      }
    }
    return evaluateKakshyaTransits(lons, ashtakvargaData.prastara);
  }, [transitSummary, ashtakvargaData]);

  const vedhaData = useMemo(() => {
    if (!transitSummary?.planets) return null;
    const allHouses = {} as Record<VedicGraha, number>;
    for (const tp of transitSummary.planets) {
      if (tp.houseFromMoon !== undefined) {
        allHouses[tp.planet as VedicGraha] = tp.houseFromMoon;
      }
    }
    const results: Record<string, VedhaCheckResult> = {};
    for (const tp of transitSummary.planets) {
      if (tp.houseFromMoon !== undefined) {
        results[tp.planet] = checkTransitVedha(tp.planet as VedicGraha, tp.houseFromMoon, allHouses);
      }
    }
    return results;
  }, [transitSummary]);

  const allGochar = transitSummary?.planets ?? [];
  const visibleGochar = isGuided && !showAllGochar ? allGochar.slice(0, 4) : allGochar;

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
            type="button"
            onClick={() => setSubMode('dashas')}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              borderRadius: 7,
              fontWeight: subMode === 'dashas' ? 700 : 500,
              background: subMode === 'dashas' ? 'var(--gold)' : 'transparent',
              color: subMode === 'dashas' ? '#15132b' : 'var(--text-main)',
            }}
          >
            Life Chapters &amp; Transits
          </button>
          <button
            type="button"
            onClick={() => setSubMode('calendar')}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              borderRadius: 7,
              fontWeight: subMode === 'calendar' ? 700 : 500,
              background: subMode === 'calendar' ? 'var(--gold)' : 'transparent',
              color: subMode === 'calendar' ? '#15132b' : 'var(--text-main)',
            }}
          >
            Month Heatmap &amp; Year Transits
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => openQuantMatrix('radars')}
            className="btn btn-outline"
            style={{ fontSize: 12 }}
          >
            <Activity size={13} style={{ color: 'var(--gold)' }} /> Kakshya, Vedha &amp; Navatara
          </button>
          <button
            type="button"
            onClick={() => openAskDrawer('What is my current Vimshottari Mahadasha and Antardasha activating?')}
            className="btn btn-outline"
            style={{ fontSize: 12 }}
          >
            <HelpCircle size={13} /> Ask AI about Timing
          </button>
        </div>
      </div>

      {subMode === 'dashas' && (
        <>
          {/* 1. Promoted Life Events AI Validator (Top Priority for Noob & Learner) */}
          <div
            className="card"
            style={{
              background: 'rgba(95, 194, 179, 0.06)',
              border: '1px solid rgba(95, 194, 179, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Target size={16} style={{ color: 'var(--teal)' }} /> Test &amp; Explain Real Life Events
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Check which planetary chapters were running on any past or upcoming milestone date—and ask AI why.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openLifeEventModal()}
                className="btn btn-primary"
                style={{ fontSize: 12 }}
              >
                <Plus size={14} /> Check a Milestone Date
              </button>
            </div>

            {lifeEvents.length === 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { title: 'Started new job / career shift', category: 'career' as const },
                  { title: 'Moved to a new city', category: 'move' as const },
                  { title: 'Major relationship milestone', category: 'relationship' as const },
                ].map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => openLifeEventModal(preset)}
                    className="btn btn-outline"
                    style={{ fontSize: 11.5 }}
                  >
                    + {preset.title}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                {lifeEvents.map((ev) => {
                  const vimLabel = matchVimshottari(dashas, ev.date);
                  return (
                    <div key={ev.id} style={{ padding: 12, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                        <strong style={{ fontSize: 13, color: 'var(--text-main)' }}>{ev.title}</strong>
                        <button
                          type="button"
                          onClick={() => setLifeEvents(removeLifeEvent(ev.id))}
                          aria-label={`Remove ${ev.title}`}
                          style={{ color: 'var(--text-muted)', padding: 3 }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>
                        {ev.date} • {ev.category.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--text-main)' }}>
                        <div><strong>Vimshottari:</strong> {vimLabel}</div>
                        {!isGuided && (
                          <>
                            <div><strong>Yogini:</strong> {matchYogini(yoginiDashas, ev.date)}</div>
                            <div><strong>Chara:</strong> {matchChara(charaDashas, ev.date)}</div>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => openAskDrawer(`Explain why "${ev.title}" (${ev.date}, ${ev.category}) happened during my ${vimLabel} planetary period in simple language.`)}
                        style={{ alignSelf: 'flex-start', marginTop: 2, fontSize: 11.5, fontWeight: 700, color: 'var(--teal)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Sparkles size={12} /> Explain with AI →
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Upcoming Shifts + Month Peak Days */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {upcomingShifts.length > 0 && (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--teal)' }}>
                  ⏳ Upcoming Chapter Shifts
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                  {upcomingShifts.map((s) => (
                    <div key={s.label} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--surface-alt)', fontSize: 12 }}>
                      <div style={{ fontWeight: 700 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 2 }}>
                        {s.endIso} • in {s.daysLeft} day{s.daysLeft === 1 ? '' : 's'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {monthPeakSummary && (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={15} /> This Month&apos;s Key Dates
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSubMode('calendar')}
                    style={{ color: 'var(--teal)', fontSize: 11.5, fontWeight: 600 }}
                  >
                    Full Heatmap →
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', marginRight: 4 }}>★ Best:</span>
                    {monthPeakSummary.peakDays.map((d) => (
                      <span key={d.date} className="teal-badge" style={{ fontSize: 10.5 }}>
                        {d.date} ({d.dayScore > 0 ? `+${d.dayScore}` : d.dayScore})
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', marginRight: 4 }}>⚠ Pace:</span>
                    {monthPeakSummary.cautionDays.map((d) => (
                      <span key={d.date} className="amber-badge" style={{ fontSize: 10.5 }}>
                        {d.date} ({d.dayScore > 0 ? `+${d.dayScore}` : d.dayScore})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Current Planetary Chapters */}
          {(dashaReadings.length > 0 || (!isGuided && extendedDashas)) && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={15} /> Current Planetary Chapters
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                {dashaReadings.slice(0, isGuided ? 2 : 3).map((dr: any) => {
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
                          <span className="gold-badge" style={{ fontSize: 10.5 }}>
                            {prog.pct}% • {prog.remText}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {String(dr.startUtc).slice(0, 10)} → {String(dr.endUtc).slice(0, 10)}
                      </div>

                      {prog && (
                        <div style={{ height: 5, borderRadius: 4, background: 'var(--surface)', overflow: 'hidden' }}>
                          <div style={{ width: `${prog.pct}%`, height: '100%', background: dr.level === 1 ? 'var(--teal)' : 'var(--gold)' }} />
                        </div>
                      )}

                      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--text-main)' }}>{dr.summary}</p>

                      {!isGuided && dr.findings?.slice(0, 2).map((f: any) => (
                        <div key={f.id} style={{ fontSize: 11.5, color: 'var(--text-muted)', paddingLeft: 8, borderLeft: '2px solid var(--gold)', lineHeight: 1.45 }}>
                          {f.text}
                        </div>
                      ))}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: 2 }}>
                        <button
                          type="button"
                          onClick={() => openAskDrawer(`What should I focus on during my ${dr.lord} ${lvlName} (${String(dr.startUtc).slice(0, 10)} to ${String(dr.endUtc).slice(0, 10)})?`)}
                          style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)' }}
                        >
                          Ask AI about this chapter →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!isGuided && extendedDashas && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                  {extendedDashas.yogini && (
                    <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-alt)', border: '1px solid var(--border-subtle)', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: 'var(--gold)' }}>
                          Yogini: {extendedDashas.yogini.maha} ({extendedDashas.yogini.mahaLord})
                          {extendedDashas.yogini.antar ? ` / ${extendedDashas.yogini.antar}` : ''}
                        </span>
                        {daysUntil(extendedDashas.yogini.mahaEnd) !== null && (
                          <span className="gold-badge" style={{ fontSize: 10.5 }}>{daysUntil(extendedDashas.yogini.mahaEnd)}d left</span>
                        )}
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
                          <span className="teal-badge" style={{ fontSize: 10.5 }}>{daysUntil(extendedDashas.chara.mahaEnd)}d left</span>
                        )}
                      </div>
                      <div style={{ lineHeight: 1.45, color: 'var(--text-main)' }}>{extendedDashas.chara.plainSummary}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. Interactive Dasha Tree Explorer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!isGuided && (
              <div style={{ display: 'flex', gap: 6, background: 'var(--surface-alt)', padding: 4, borderRadius: 8, border: '1px solid var(--border-subtle)', alignSelf: 'flex-start', flexWrap: 'wrap' }}>
                {(
                  [
                    { id: 'vimshottari', label: 'Vimshottari (120y)' },
                    { id: 'yogini', label: 'Yogini (36y)' },
                    { id: 'chara', label: 'Chara (Jaimini)' },
                  ] as const
                ).map((sys) => (
                  <button
                    key={sys.id}
                    type="button"
                    onClick={() => setDashaSystem(sys.id)}
                    style={{
                      padding: '5px 12px',
                      fontSize: 12,
                      borderRadius: 6,
                      fontWeight: dashaSystem === sys.id ? 700 : 400,
                      background: dashaSystem === sys.id ? 'var(--gold)' : 'transparent',
                      color: dashaSystem === sys.id ? '#15132b' : 'var(--text-main)',
                    }}
                  >
                    {sys.label}
                  </button>
                ))}
              </div>
            )}

            {isGuided || dashaSystem === 'vimshottari'
              ? dashas && <VimshottariExplorer dashas={dashas} />
              : dashaSystem === 'yogini'
              ? yoginiDashas && <YoginiExplorer yogini={yoginiDashas} />
              : charaDashas && <CharaExplorer chara={charaDashas} />}
          </div>

          {/* 5. Double Transit Manifestation Gates (Explorer & Quant) */}
          {!isGuided && doubleTransitHouses.length > 0 && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Radio size={16} style={{ color: 'var(--gold)' }} />
                  Double Transit Gates (Saturn + Jupiter)
                </h3>
                <span className="teal-badge" style={{ fontSize: 11 }}>Joint Manifestation Window</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: 10 }}>
                {doubleTransitHouses.map((dth) => {
                  const savHigh = dth.sav !== null && dth.sav >= 28;
                  return (
                    <div
                      key={dth.house}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        background: 'var(--surface-alt)',
                        border: '1px solid var(--gold)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 13 }}>
                          House {dth.house} ({dth.sign})
                        </span>
                        {dth.sav !== null && (
                          <span className={savHigh ? 'teal-badge' : 'amber-badge'} style={{ fontSize: 10.5 }}>
                            SAV {dth.sav} {savHigh ? '✓' : '•'}
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 12.5 }}>{dth.title}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>{dth.desc}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ background: 'var(--surface)', padding: '2px 6px', borderRadius: 4 }}>🪐 {dth.saturnAspectNote}</span>
                        <span style={{ background: 'var(--surface)', padding: '2px 6px', borderRadius: 4 }}>✨ {dth.jupiterAspectNote}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openPatternDecoder({ kind: 'house', house: dth.house })}
                        style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 700, color: 'var(--teal)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}
                      >
                        <GitBranch size={12} /> Trace House {dth.house} Pattern →
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Single Canonical Gochar Transits & Sade Sati */}
          {transitSummary && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <h3 className="serif-title" style={{ fontSize: 15, color: 'var(--gold)', margin: 0 }}>
                  Live Sky Transits (<GlossaryTerm term="Sade Sati" />)
                </h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {transitSummary.sadeSati && (
                    <span className={transitSummary.sadeSati.isActive ? 'amber-badge' : 'teal-badge'} style={{ fontSize: 11 }}>
                      {transitSummary.sadeSati.isActive ? `⚠ Sade Sati Active (${transitSummary.sadeSati.phase})` : '✓ Sade Sati Inactive'}
                    </span>
                  )}
                  {isQuant && (
                    <button type="button" onClick={() => openQuantMatrix('radars')} className="btn btn-outline" style={{ fontSize: 11 }}>
                      Kakshya &amp; Navatara ↗
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(235px, 1fr))', gap: 8 }}>
                {visibleGochar.map((tp: any) => {
                  const v = vedhaData?.[tp.planet] ?? tp.vedha;
                  const k = kakshyaData?.evaluations.find((e) => e.planet === tp.planet) ?? tp.kakshya;
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
                        gap: 5,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>
                          {tp.planet} {tp.retrograde ? '(R)' : ''} → {tp.sign}
                        </span>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <span className={tp.bavQuality === 'supportive' ? 'teal-badge' : tp.bavQuality === 'cautious' ? 'amber-badge' : 'gold-badge'} style={{ fontSize: 10 }}>
                            <GlossaryTerm term="BAV">{tp.bindus}/8</GlossaryTerm>
                          </span>
                          {isQuant && k && (
                            <span className={k.isBenefic ? 'teal-badge' : 'amber-badge'} style={{ fontSize: 10 }}>
                              K{k.kakshyaIndex}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        H{tp.houseFromLagna} Lagna • H{tp.houseFromMoon} Moon
                      </div>
                      {!isGuided && v && v.isFavourableHouse && (
                        <div style={{ fontSize: 11 }}>
                          {v.isObstructed ? (
                            <span style={{ color: '#f87171' }}>⚠ Vedha by {v.obstructingPlanets.map((p: string) => p.toUpperCase()).join(', ')}</span>
                          ) : (
                            <span style={{ color: 'var(--teal)' }}>✓ Unobstructed Flow</span>
                          )}
                        </div>
                      )}
                      {tp.plainMeaning && <div style={{ fontSize: 11.5, lineHeight: 1.45 }}>{tp.plainMeaning}</div>}
                      <button
                        type="button"
                        onClick={() => openAskDrawer(`How is transit ${tp.planet} in ${tp.sign} (House ${tp.houseFromLagna}, BAV ${tp.bindus}/8) affecting me right now?`)}
                        style={{ alignSelf: 'flex-end', marginTop: 'auto', fontSize: 11, fontWeight: 600, color: 'var(--teal)' }}
                      >
                        Ask AI →
                      </button>
                    </div>
                  );
                })}
              </div>

              {isGuided && allGochar.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllGochar((v) => !v)}
                  className="btn btn-outline"
                  style={{ alignSelf: 'flex-start', fontSize: 11.5 }}
                >
                  {showAllGochar ? 'Show fewer transits' : `Show all ${allGochar.length} transits`}
                </button>
              )}
            </div>
          )}

          {/* 7. Personal Ghatak Timing Guardrails (Moved here from StrengthsTab!) */}
          {!isGuided && ghatak && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <h3 className="serif-title" style={{ fontSize: 14, color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldAlert size={15} style={{ color: 'var(--amber)' }} /> Personal Muhurta &amp; Ghatak Guardrails
                </h3>
                <button type="button" onClick={() => openQuantMatrix('horas')} className="btn btn-outline" style={{ fontSize: 11.5 }}>
                  Full Amplifiers &amp; Horas ↗
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, fontSize: 12 }}>
                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(95, 194, 179, 0.08)', border: '1px solid rgba(95, 194, 179, 0.25)' }}>
                  <strong style={{ color: 'var(--teal)' }}>✓ Supportive Days:</strong> {(ghatak.luckyDays ?? []).join(', ')} · Lucky #{ghatak.luckyNumber}
                </div>
                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(217, 119, 54, 0.08)', border: '1px solid rgba(217, 119, 54, 0.25)' }}>
                  <strong style={{ color: 'var(--amber)' }}>⚠ Ghatak Caution:</strong> {ghatak.badDay} • Tithi: {ghatak.badTithi} • Moon Sign: {ghatak.badRasi}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {subMode === 'calendar' && (
        <CalendarExplorer profileId={profileId} natalChart={natalChart} />
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
        <button type="button" onClick={() => setActiveTab('journal')} className="btn btn-outline" style={{ fontSize: 12 }}>
          Compare this period with your Timeline →
        </button>
      </div>
    </div>
  );
};
