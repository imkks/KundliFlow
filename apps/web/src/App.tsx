import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Compass,
  Layers,
  Clock,
  Calendar,
  MapPin,
  Award,
  BookOpen,
  PenLine,
  User,
  Printer,
  HardDrive,
  Bot,
  WifiOff,
  Share2,
  X,
  Search,
  LogIn,
  LogOut,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import {
  degToDms,
  calculateVargaSign,
  type NatalChart,
  type DayView,
  type HourScore,
  type VargaType,
  type AvakahadaDetails,
  type AshtakvargaResult,
  type ChalitChart,
  type VimshottariDashaTree,
  type YoginiDashaTree,
  type CharaDashaTree,
  type ShadbalaResult,
  type AyanamsaId,
  type LlmDossierInput,
  type SubjectiveLog,
} from '@astro/engine';
import { CITIES } from '@astro/content';
import { type ChartPlacement } from './components/NorthIndianChart.tsx';
import { OnboardingModal, type UserProfileInput } from './components/OnboardingModal.tsx';
import { FirstVisitOnboarding } from './components/FirstVisitOnboarding.tsx';
import { AskCopilotDrawer } from './components/AskCopilotDrawer.tsx';
import { AuthOnboardingGate } from './components/AuthOnboardingGate.tsx';
import { type JournalEntry } from './components/JournalExplorer.tsx';
import { ReadingProvider, useReading, type MainTab } from './context/ReadingContext.tsx';
import { TodayTab } from './tabs/TodayTab.tsx';
import { KundliTab } from './tabs/KundliTab.tsx';
import { TimingTab } from './tabs/TimingTab.tsx';
import { StrengthsTab } from './tabs/StrengthsTab.tsx';
import { JournalTab } from './tabs/JournalTab.tsx';
import { API_BASE_URL } from './config.ts';

// Lazy-load secondary and report modals to optimize initial bundle size
const PrintableNatalReport = React.lazy(() =>
  import('./components/PrintableNatalReport.tsx').then((m) => ({ default: m.PrintableNatalReport }))
);
const DataSovereigntyModal = React.lazy(() =>
  import('./components/DataSovereigntyModal.tsx').then((m) => ({ default: m.DataSovereigntyModal }))
);
const LlmDossierModal = React.lazy(() =>
  import('./components/LlmDossierModal.tsx').then((m) => ({ default: m.LlmDossierModal }))
);
const PlainEnglishExplainerModal = React.lazy(() =>
  import('./components/PlainEnglishExplainerModal.tsx').then((m) => ({ default: m.PlainEnglishExplainerModal }))
);
const ShareBlueprintModal = React.lazy(() =>
  import('./components/ShareBlueprintModal.tsx').then((m) => ({ default: m.ShareBlueprintModal }))
);
const CommandPaletteModal = React.lazy(() =>
  import('./components/CommandPaletteModal.tsx').then((m) => ({ default: m.CommandPaletteModal }))
);
const GoogleAuthModal = React.lazy(() =>
  import('./components/GoogleAuthModal.tsx').then((m) => ({ default: m.GoogleAuthModal }))
);
import {
  fetchOrCreateStaticBundle,
  fetchTodaySky,
  syncDeltaWithServer,
  fetchAuthMe,
  logoutAuth,
  activateProfileOnServer,
  deleteProfileOnServer,
  type AuthUser,
  type ServerProfileSummary,
} from './services/apiClient.ts';

import {
  useAppStore,
  appStore,
  type ChartStyle,
  DEMO_PROFILE,
} from './store/useAppStore.ts';

const ACTIVE_PROFILE_KEY = 'astro_active_profile_v1';

interface AppShellProps {
  userName: string;
  birthDate: string;
  birthTime: string;
  tzId: string;
  cityName: string;
  onCityChange: (c: string) => void;
  onLocationChange?: (loc: { name: string; lat: number; lon: number; tzId: string }) => void;
  lat: number;
  lon: number;
  natalChart: NatalChart;
  dayView: DayView | null;
  currentScore: HourScore | null;
  activeCityName: string;
  currentTransits: any;
  monthPeakSummary: any;
  chalit: ChalitChart | null;
  panchang: any;
  avakahada: AvakahadaDetails | null;
  dashas: VimshottariDashaTree | null;
  yoginiDashas: YoginiDashaTree | null;
  charaDashas: CharaDashaTree | null;
  shadbala: ShadbalaResult | null;
  ashtakvarga: AshtakvargaResult | null;
  sevenPlanetSigns: any;
  chartStyle: ChartStyle;
  onChartStyleChange: (s: ChartStyle) => void;
  chartPerspective: 'lagna' | 'chandra';
  onPerspectiveChange: (p: 'lagna' | 'chandra') => void;
  selectedVarga: VargaType;
  onVargaChange: (v: VargaType) => void;
  d1Placements: ChartPlacement[];
  vargaPlacements: ChartPlacement[];
  vargaLagnaSignIndex: number;
  charaKarakas: Record<string, string>;
  backendProfileId: string | null;
  serverLevel1?: any;
  calibrationLogs: SubjectiveLog[];
  onEntriesChange: (entries: JournalEntry[]) => void;
  onOpenOnboarding: () => void;
  onOpenPrintReport: () => void;
  onOpenLlmDossier: () => void;
  onOpenDataVault: () => void;
  onOpenPlainGuide: (cat: string) => void;
  authUser: AuthUser | null;
  savedProfiles: ServerProfileSummary[];
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onSwitchProfile: (p: ServerProfileSummary) => void;
  onDeleteProfile: (id: string) => void;
}

const AppShell: React.FC<AppShellProps> = (props) => {
  const {
    depth,
    setDepth,
    reading,
    apiOffline,
    retryReading,
    activeTab,
    setActiveTab,
    setSelectedHouse,
    askOpen,
    setAskOpen,
  } = useReading();

  const [showShareBlueprint, setShowShareBlueprint] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [chartsMenuOpen, setChartsMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('astro_welcome_dismissed_v1') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    setAvatarBroken(false);
  }, [props.authUser?.picture]);

  // Global Cmd+K / Ctrl+K shortcut for Quick Search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((o) => !o);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const dismissWelcome = () => {
    setWelcomeDismissed(true);
    try {
      localStorage.setItem('astro_welcome_dismissed_v1', '1');
    } catch {
      // ignore
    }
  };

  const TABS: { id: MainTab; label: string; Icon: React.FC<any> }[] = [
    { id: 'today', label: 'Today', Icon: Clock },
    { id: 'kundli', label: 'Kundli & Systems', Icon: Compass },
    { id: 'timing', label: 'Timing', Icon: Layers },
    { id: 'strengths', label: 'Strengths & Yogas', Icon: Award },
    { id: 'journal', label: 'Journal', Icon: PenLine },
  ];

  const jumpToTopic = (house: number, varga: VargaType) => {
    setSelectedHouse(house);
    props.onVargaChange(varga);
    setActiveTab('kundli');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Full-Width Sticky Top Bar */}
      <header className="app-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => setActiveTab('today')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <Sparkles size={20} style={{ color: 'var(--gold)' }} />
            <span className="serif-title" style={{ fontSize: 17, fontWeight: 700, color: 'var(--gold)' }}>
              MyAstro
            </span>
          </button>

          {/* Cmd+K Search Trigger */}
          <button
            onClick={() => setShowCommandPalette(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 10,
              background: 'var(--surface-alt)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: 12,
              minWidth: 200,
              justifyContent: 'space-between',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Search size={13} style={{ color: 'var(--gold)' }} />
              Search chart, houses, topics…
            </span>
            <kbd style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'var(--surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Global Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Reading Depth Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--surface-alt)',
              padding: 3,
              borderRadius: 9,
              border: '1px solid var(--border-subtle)',
              gap: 2,
            }}
            title="Reading Depth for Level 2 explanations"
          >
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', padding: '0 6px', textTransform: 'uppercase' }}>
              Depth
            </span>
            {(['simple', 'standard', 'detailed'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setDepth(lvl)}
                style={{
                  padding: '4px 9px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'capitalize',
                  border: 'none',
                  cursor: 'pointer',
                  background: depth === lvl ? 'var(--gold)' : 'transparent',
                  color: depth === lvl ? '#15132b' : 'var(--text-muted)',
                }}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowShareBlueprint(true)}
            className="btn btn-outline"
            style={{ fontSize: 12 }}
            title="Shareable Cosmic Blueprint card"
          >
            <Share2 size={13} style={{ color: 'var(--teal)' }} /> Share
          </button>

          <button
            onClick={() => setAskOpen(true)}
            className="ask-ai-cta"
            title={`Ask Jyotish AI Copilot about ${props.userName}`}
          >
            <Sparkles size={14} />
            <span>Ask AI</span>
            <span className="ask-ai-pulse" />
          </button>

          {/* 1. Saved Charts / Active Profile Switcher (Separate from Account Photo) */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setChartsMenuOpen((o) => !o);
                setAccountMenuOpen(false);
              }}
              className="btn btn-outline"
              style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
              title="Switch saved birth charts or add a new chart"
            >
              <Users size={13} style={{ color: 'var(--gold)' }} />
              <span style={{ maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {props.userName.split(' ')[0]}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>▾</span>
            </button>

            {chartsMenuOpen && (
              <>
                <div onClick={() => setChartsMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
                <div
                  className="card"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 270,
                    padding: 12,
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    boxShadow: '0 14px 36px rgba(0, 0, 0, 0.55)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Saved Charts ({props.savedProfiles.length})
                    </span>
                    <button
                      onClick={() => {
                        setChartsMenuOpen(false);
                        props.onOpenOnboarding();
                      }}
                      style={{ fontSize: 11, color: 'var(--gold)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}
                    >
                      <Plus size={12} /> Add Chart
                    </button>
                  </div>

                  {props.savedProfiles.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                      {props.savedProfiles.map((sp) => {
                        const isCurrent = sp.id === props.backendProfileId;
                        return (
                          <div
                            key={sp.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 4,
                              padding: '6px 8px',
                              borderRadius: 8,
                              background: isCurrent ? 'rgba(95, 194, 179, 0.16)' : 'var(--surface-alt)',
                              border: isCurrent ? '1px solid rgba(95, 194, 179, 0.45)' : '1px solid transparent',
                            }}
                          >
                            <button
                              onClick={() => {
                                props.onSwitchProfile(sp);
                                setChartsMenuOpen(false);
                              }}
                              style={{ flex: 1, textAlign: 'left', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', overflow: 'hidden' }}
                            >
                              <div style={{ fontSize: 12, fontWeight: isCurrent ? 700 : 600, color: isCurrent ? 'var(--teal)' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {isCurrent ? '✓ ' : ''}{sp.name}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                {sp.birthDate} • {sp.cityName}
                              </div>
                            </button>
                            {props.savedProfiles.length > 1 && (
                              <button
                                onClick={() => props.onDeleteProfile(sp.id)}
                                title={`Delete ${sp.name}`}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 3 }}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Saving chart…</div>
                  )}

                  <div style={{ paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      onClick={() => {
                        setChartsMenuOpen(false);
                        props.onOpenOnboarding();
                      }}
                      className="btn btn-outline"
                      style={{ width: '100%', fontSize: 11.5, justifyContent: 'center' }}
                    >
                      <User size={12} /> Edit Current Chart Details
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 2. Separate Google Account Photo Button */}
          {props.authUser && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setAccountMenuOpen((o) => !o);
                  setChartsMenuOpen(false);
                }}
                aria-label="Account menu"
                title={`${props.authUser.name} (${props.authUser.email})`}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  padding: 0,
                  overflow: 'hidden',
                  border: '2px solid var(--gold)',
                  background: 'var(--surface-alt)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {props.authUser.picture && !avatarBroken ? (
                  <img
                    src={props.authUser.picture}
                    alt={props.authUser.name}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarBroken(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--gold)' }}>
                    {(props.authUser.name || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </button>

              {accountMenuOpen && (
                <>
                  <div onClick={() => setAccountMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
                  <div
                    className="card"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: 245,
                      padding: 12,
                      zIndex: 100,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      boxShadow: '0 14px 36px rgba(0, 0, 0, 0.55)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {props.authUser.picture && !avatarBroken ? (
                        <img
                          src={props.authUser.picture}
                          alt={props.authUser.name}
                          referrerPolicy="no-referrer"
                          onError={() => setAvatarBroken(true)}
                          style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--gold)' }}
                        />
                      ) : (
                        <span
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: 'var(--gold)',
                            color: '#15132b',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 15,
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {(props.authUser.name || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {props.authUser.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {props.authUser.email}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setAccountMenuOpen(false);
                        props.onLogout();
                      }}
                      className="btn btn-outline"
                      style={{ width: '100%', justifyContent: 'center', fontSize: 12, color: 'var(--amber)', borderColor: 'rgba(217, 119, 54, 0.35)' }}
                    >
                      <LogOut size={13} /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Full-Width Body: Left Sidebar + Fluid Main Workspace */}
      <div className="app-body">
        {/* Left Sidebar Navigation (Desktop) */}
        <aside className="app-sidebar" aria-label="Sidebar navigation">
          {/* Active Profile Card */}
          <div style={{ padding: 12, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
              <strong style={{ fontSize: 13.5, color: 'var(--gold)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {props.userName}
              </strong>
              <button
                onClick={props.onOpenOnboarding}
                style={{ fontSize: 10.5, color: 'var(--teal)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Edit
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={11} style={{ color: 'var(--gold)' }} /> {props.birthDate} • {props.birthTime.slice(0, 5)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={11} style={{ color: 'var(--teal)' }} /> {props.cityName}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
              <span className="gold-badge" style={{ fontSize: 10, padding: '2px 7px' }}>
                Asc: {props.natalChart.lagna?.sign?.toUpperCase() ?? 'CHANDRA'}
              </span>
              <span className="teal-badge" style={{ fontSize: 10, padding: '2px 7px', textTransform: 'capitalize' }}>
                Moon: {props.natalChart.grahas.moon.sign}
              </span>
            </div>
          </div>

          {/* Saved Profiles History Switcher (Per Google Account) */}
          <div style={{ padding: 10, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Users size={12} style={{ color: 'var(--teal)' }} />
                {props.authUser ? `Saved Charts (${props.savedProfiles.length})` : 'Account Sync'}
              </span>
              {props.authUser ? (
                <button
                  onClick={props.onOpenOnboarding}
                  style={{ fontSize: 10.5, color: 'var(--gold)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}
                  title="Add another birth chart under your account"
                >
                  <Plus size={11} /> Add
                </button>
              ) : (
                <button
                  onClick={props.onOpenAuthModal}
                  style={{ fontSize: 10.5, color: 'var(--gold)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                >
                  Sign in
                </button>
              )}
            </div>

            {props.authUser ? (
              props.savedProfiles.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 165, overflowY: 'auto' }}>
                  {props.savedProfiles.map((sp) => {
                    const isCurrent = sp.id === props.backendProfileId;
                    return (
                      <div
                        key={sp.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 4,
                          padding: '5px 7px',
                          borderRadius: 8,
                          background: isCurrent ? 'rgba(95, 194, 179, 0.14)' : 'var(--surface-alt)',
                          border: isCurrent ? '1px solid rgba(95, 194, 179, 0.45)' : '1px solid transparent',
                        }}
                      >
                        <button
                          onClick={() => props.onSwitchProfile(sp)}
                          style={{
                            flex: 1,
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            overflow: 'hidden',
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: isCurrent ? 700 : 600, color: isCurrent ? 'var(--teal)' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {sp.name}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {sp.birthDate} • {sp.cityName}
                          </div>
                        </button>
                        {props.savedProfiles.length > 1 && (
                          <button
                            onClick={() => props.onDeleteProfile(sp.id)}
                            title={`Delete ${sp.name}`}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  No saved charts yet — click <strong>+ Add</strong> to save your first chart.
                </div>
              )
            ) : (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Sign in with Google to save multiple charts &amp; switch profiles with isolated AI chats.
              </div>
            )}
          </div>

          {/* Primary Navigation Links */}
          <nav role="tablist" aria-label="Primary chart sections" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 8px 4px' }}>
              Explore
            </div>
            {TABS.map(({ id, label, Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(id)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    textAlign: 'left',
                    background: isActive ? 'rgba(227, 173, 70, 0.16)' : 'transparent',
                    color: isActive ? 'var(--gold)' : 'var(--text-main)',
                    border: isActive ? '1px solid rgba(227, 173, 70, 0.35)' : '1px solid transparent',
                  }}
                >
                  <Icon size={15} /> {label}
                </button>
              );
            })}
          </nav>

          {/* Quick Life Topics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 8px 4px' }}>
              Life Topics
            </div>
            {[
              { label: '💼 Career & Calling', house: 10, varga: 'D10' as VargaType },
              { label: '💞 Love & Marriage', house: 7, varga: 'D9' as VargaType },
              { label: '💰 Wealth & Assets', house: 2, varga: 'D2' as VargaType },
              { label: '🌿 Health & Peace', house: 4, varga: 'D9' as VargaType },
            ].map((t) => (
              <button
                key={t.label}
                onClick={() => jumpToTopic(t.house, t.varga)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  background: 'transparent',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tools & Export */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 8px 4px' }}>
              Tools &amp; Vault
            </div>
            <button onClick={props.onOpenPrintReport} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'left' }}>
              <Printer size={13} style={{ color: 'var(--gold)' }} /> Print PDF Dossier
            </button>
            <button onClick={props.onOpenLlmDossier} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'left' }}>
              <Bot size={13} style={{ color: 'var(--teal)' }} /> AI LLM Context
            </button>
            <button onClick={props.onOpenDataVault} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'left' }}>
              <HardDrive size={13} style={{ color: 'var(--teal)' }} /> Data Vault
            </button>
            <button onClick={() => props.onOpenPlainGuide(activeTab)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'left' }}>
              <BookOpen size={13} style={{ color: 'var(--gold)' }} /> Plain English Glossary
            </button>
          </div>
        </aside>

        {/* Fluid Main Workspace */}
        <main className="app-main">
          {/* Global API Offline Banner */}
          {apiOffline && (
            <div
              style={{
                marginBottom: 14,
                padding: '8px 14px',
                borderRadius: 10,
                background: 'rgba(217, 119, 54, 0.14)',
                border: '1px solid var(--amber)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                fontSize: 12,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <WifiOff size={14} style={{ color: 'var(--amber)' }} />
                Backend API (localhost:8787) is offline — showing client-side ephemeris charts &amp; tables. Start `@astro/api` for Level 2 readings &amp; Ask AI.
              </span>
              <button onClick={retryReading} className="btn btn-outline" style={{ fontSize: 11 }}>
                Retry
              </button>
            </div>
          )}

          {/* Dismissible First-Visit Guided Welcome Strip */}
          {!welcomeDismissed && (
            <div
              className="card"
              style={{
                marginBottom: 16,
                padding: '10px 14px',
                background: 'rgba(95, 194, 179, 0.08)',
                border: '1px solid rgba(95, 194, 179, 0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10,
                fontSize: 12,
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                <strong style={{ color: 'var(--teal)' }}>✨ Start Here:</strong>
                <button onClick={() => setActiveTab('today')} style={{ color: 'var(--text-main)', textDecoration: 'underline', fontSize: 12 }}>
                  1. Check Today&apos;s Briefing &amp; Mood
                </button>
                <button onClick={() => setActiveTab('kundli')} style={{ color: 'var(--text-main)', textDecoration: 'underline', fontSize: 12 }}>
                  2. Click Your Kundli &amp; Try &ldquo;Teach Me&rdquo;
                </button>
                <button onClick={() => setActiveTab('timing')} style={{ color: 'var(--text-main)', textDecoration: 'underline', fontSize: 12 }}>
                  3. Test Past Life Events
                </button>
              </div>
              <button onClick={dismissWelcome} aria-label="Dismiss welcome guide" style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* Active Domain View */}
          {activeTab === 'today' && (
            <TodayTab
              cityName={props.cityName}
              onCityChange={props.onCityChange}
              onLocationChange={props.onLocationChange}
              dayView={props.dayView}
              currentScore={props.currentScore}
              activeCityName={props.activeCityName}
              backendProfileId={props.backendProfileId}
              onQuickCheckinSaved={props.onEntriesChange}
            />
          )}

          {activeTab === 'kundli' && (
            <KundliTab
              profileId={props.backendProfileId}
              natalChart={props.natalChart}
              currentTransits={props.currentTransits}
              chalit={props.chalit}
              panchang={props.panchang}
              avakahada={props.avakahada}
              birthDate={props.birthDate}
              birthTime={props.birthTime}
              tzId={props.tzId}
              chartStyle={props.chartStyle}
              onChartStyleChange={props.onChartStyleChange}
              chartPerspective={props.chartPerspective}
              onPerspectiveChange={props.onPerspectiveChange}
              selectedVarga={props.selectedVarga}
              onVargaChange={props.onVargaChange}
              d1Placements={props.d1Placements}
              vargaPlacements={props.vargaPlacements}
              vargaLagnaSignIndex={props.vargaLagnaSignIndex}
              charaKarakas={props.charaKarakas}
            />
          )}

          {activeTab === 'timing' && (
            <TimingTab
              profileId={props.backendProfileId}
              natalChart={props.natalChart}
              monthPeakSummary={props.monthPeakSummary}
              dashas={props.dashas}
              yoginiDashas={props.yoginiDashas}
              charaDashas={props.charaDashas}
            />
          )}

          {activeTab === 'strengths' && (
            <StrengthsTab
              natalChart={props.natalChart}
              avakahada={props.avakahada}
              shadbala={props.shadbala}
              ashtakvarga={props.ashtakvarga}
              sevenPlanetSigns={props.sevenPlanetSigns}
              serverLevel1={props.serverLevel1}
              onOpenLlmDossier={props.onOpenLlmDossier}
            />
          )}

          {activeTab === 'journal' && (
            <JournalTab
              natalChart={props.natalChart}
              currentScore={props.currentScore}
              dayView={props.dayView}
              ashtakvarga={props.ashtakvarga}
              backendProfileId={props.backendProfileId}
              calibrationLogs={props.calibrationLogs}
              onEntriesChange={props.onEntriesChange}
            />
          )}

          <footer
            style={{
              marginTop: 28,
              paddingTop: 16,
              borderTop: '1px solid var(--border-subtle)',
              textAlign: 'center',
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
          >
            <p>MyAstro Almanac • Swiss Ephemeris WASM &amp; Local SQLite • Local-First &amp; Private</p>
          </footer>
        </main>
      </div>

      {/* Floating Bottom-Right Ask AI Pill (always reachable while scrolling) */}
      {!askOpen && (
        <button
          onClick={() => setAskOpen(true)}
          className="ask-ai-cta ask-ai-fab"
          aria-label={`Ask AI about ${props.userName}`}
        >
          <Sparkles size={15} />
          <span>Ask AI · {props.userName.split(' ')[0]}</span>
          <span className="ask-ai-pulse" />
        </button>
      )}

      {/* Modern Chatbot Ask AI Drawer (Strictly scoped to active profile) */}
      <AskCopilotDrawer
        profileId={props.backendProfileId}
        profileName={props.userName}
        natalChart={props.natalChart}
        shadbala={props.shadbala}
        ashtakvarga={props.ashtakvarga}
        dashas={props.dashas}
        transits={props.currentTransits}
      />

      {/* Cmd+K Global Search Palette */}
      {showCommandPalette && (
        <React.Suspense fallback={null}>
          <CommandPaletteModal
            isOpen={showCommandPalette}
            onClose={() => setShowCommandPalette(false)}
            onOpenShare={() => setShowShareBlueprint(true)}
          />
        </React.Suspense>
      )}

      {/* Shareable Cosmic Blueprint Modal */}
      {showShareBlueprint && (
        <React.Suspense fallback={null}>
          <ShareBlueprintModal
            userName={props.userName}
            natalChart={props.natalChart}
            reading={reading}
            charaKarakas={props.charaKarakas}
            onClose={() => setShowShareBlueprint(false)}
          />
        </React.Suspense>
      )}

      {/* Mobile Sticky Bottom Tab Bar */}
      <nav className="nav-bar mobile-bottom-nav" aria-label="Mobile navigation">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={`mob-${id}`}
              onClick={() => setActiveTab(id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              aria-label={label}
            >
              <Icon size={18} />
              <span>{id === 'kundli' ? 'Chart' : id === 'strengths' ? 'Strengths' : label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

function loadSavedProfile(): UserProfileInput | null {
  try {
    const raw = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p && p.name && p.birthDate) return p;
  } catch {
    // ignore
  }
  return null;
}

export default function App() {
  const store = useAppStore((s) => s);
  const {
    savedProfile,
    activeProfile,
    chartStyle,
    selectedVarga,
    chartPerspective,
    loading,
    todayLocation,
    todayCityName,
    showOnboarding,
    natalChart,
    dayView,
    currentScore,
    avakahada,
    dashas,
    yoginiDashas,
    charaDashas,
    shadbala,
    ashtakvarga,
    chalit,
    panchang,
    serverLevel1,
    serverLevel2,
    monthPeakSummary,
    serverError,
    retryTick,
    showPrintReport,
    showDataSovereignty,
    showLlmDossier,
    showPlainEnglishModal,
    plainEnglishCategory,
    authChecked,
    authUser,
    savedProfiles,
    showAuthModal,
    selectedServerProfileId,
    backendProfileId,
    journalEntries,
    serverTransits,
  } = store;

  const userName = activeProfile.name;
  const cityName = activeProfile.cityName;
  const lat = activeProfile.lat;
  const lon = activeProfile.lon;
  const birthDate = activeProfile.birthDate;
  const birthTime = activeProfile.birthTime;
  const tzId = activeProfile.tzId;
  const timeCertainty = activeProfile.timeCertainty;
  const ayanamsa = activeProfile.ayanamsa;

  const setChartStyle = (s: ChartStyle) => appStore.setChartStyle(s);
  const setSelectedVarga = (v: VargaType) => appStore.setState({ selectedVarga: v });
  const setChartPerspective = (p: 'lagna' | 'chandra') => appStore.setState({ chartPerspective: p });
  const setShowOnboarding = (v: boolean) => appStore.setState({ showOnboarding: v });
  const setShowPrintReport = (v: boolean) => appStore.setState({ showPrintReport: v });
  const setShowDataSovereignty = (v: boolean) => appStore.setState({ showDataSovereignty: v });
  const setShowLlmDossier = (v: boolean) => appStore.setState({ showLlmDossier: v });
  const setShowPlainEnglishModal = (v: boolean) => appStore.setState({ showPlainEnglishModal: v });
  const setPlainEnglishCategory = (v: string) => appStore.setState({ plainEnglishCategory: v });
  const setShowAuthModal = (v: boolean) => appStore.setState({ showAuthModal: v });
  const setSelectedServerProfileId = (id: string | null) => appStore.setState({ selectedServerProfileId: id });
  const setBackendProfileId = (id: string | null) => appStore.setBackendProfileId(id);
  const setSavedProfiles = (p: ServerProfileSummary[]) => appStore.setState({ savedProfiles: p });
  const setAuthUser = (u: AuthUser | null) => appStore.setState({ authUser: u });
  const setAuthChecked = (b: boolean) => appStore.setState({ authChecked: b });
  const setSavedProfile = (p: UserProfileInput | null) => appStore.setState({ savedProfile: p });
  const setNatalChart = (c: NatalChart | null) => appStore.setState({ natalChart: c });
  const setJournalEntries = (e: JournalEntry[]) => appStore.setJournalEntries(e);
  const setLoading = (l: boolean) => appStore.setState({ loading: l });
  const setServerError = (e: string | null) => appStore.setState({ serverError: e });
  const setRetryTick = (updater: (prev: number) => number) =>
    appStore.setState((s) => ({ retryTick: updater(s.retryTick) }));
  const setServerLevel1 = (l: any) => appStore.setState({ serverLevel1: l });
  const setServerLevel2 = (l: any) => appStore.setState({ serverLevel2: l });
  const setServerTransits = (t: any) => appStore.setState({ serverTransits: t });
  const setDayView = (d: any) => appStore.setState({ dayView: d });
  const setCurrentScore = (s: any) => appStore.setState({ currentScore: s });
  const setMonthPeakSummary = (m: any) => appStore.setState({ monthPeakSummary: m });
  const setAvakahada = (a: any) => appStore.setState({ avakahada: a });
  const setDashas = (d: any) => appStore.setState({ dashas: d });
  const setYoginiDashas = (y: any) => appStore.setState({ yoginiDashas: y });
  const setCharaDashas = (c: any) => appStore.setState({ charaDashas: c });
  const setShadbala = (s: any) => appStore.setState({ shadbala: s });
  const setAshtakvarga = (a: any) => appStore.setState({ ashtakvarga: a });
  const setChalit = (c: any) => appStore.setState({ chalit: c });
  const setPanchang = (p: any) => appStore.setState({ panchang: p });
  const setTodayLocation = (loc: any) => appStore.setState({ todayLocation: loc });
  const setTodayCityName = (name: string) => appStore.setState({ todayCityName: name });
  const setUserName = (_name: string) => {};
  const setBirthDate = (_b: string) => {};
  const setBirthTime = (_t: string) => {};
  const setCityName = (_c: string) => {};
  const setLat = (_l: number) => {};
  const setLon = (_l: number) => {};
  const setTzId = (_tz: string) => {};
  const setTimeCertainty = (_tc: any) => {};
  const setAyanamsa = (_ay: any) => {};

  useEffect(() => {
    try {
      localStorage.setItem('astro_chart_style_v1', chartStyle);
    } catch {
      // ignore
    }
  }, [chartStyle]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('astro_journal_entries_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setJournalEntries(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const applyServerProfileToState = (sp: ServerProfileSummary) => {
    const p: UserProfileInput = {
      name: sp.name,
      birthDate: sp.birthDate,
      birthTime: sp.birthTime,
      cityName: sp.cityName,
      lat: sp.lat,
      lon: sp.lon,
      tzId: sp.tzId,
      timeCertainty: (sp.timeCertainty as any) || 'exact',
      ayanamsa: (sp.ayanamsa as AyanamsaId) || 'lahiri',
    };
    setSelectedServerProfileId(sp.id);
    setBackendProfileId(sp.id);
    setSavedProfile(p);
    setUserName(p.name);
    setBirthDate(p.birthDate);
    setBirthTime(p.birthTime);
    setCityName(p.cityName);
    setTodayCityName(p.cityName);
    setTodayLocation({ name: p.cityName, lat: p.lat, lon: p.lon, tzId: p.tzId });
    setLat(p.lat);
    setLon(p.lon);
    setTzId(p.tzId);
    setTimeCertainty(p.timeCertainty);
    setAyanamsa(p.ayanamsa);
    try {
      localStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(p));
      localStorage.setItem('astro_backend_profile_id_v1', sp.id);
    } catch {
      // ignore
    }
  };

  // Restore Google-authenticated session & user's saved profile history on mount
  useEffect(() => {
    let cancelled = false;
    fetchAuthMe()
      .then((res) => {
        if (cancelled) return;
        if (res) {
          setAuthUser(res.user);
          setSavedProfiles(res.profiles);
          if (res.profiles.length > 0) {
            const active = res.profiles.find((p) => p.isActive) ?? res.profiles[0]!;
            applyServerProfileToState(active);
          } else {
            // Logged in but no saved charts yet -> show Step 2 birth details onboarding
            setSavedProfile(null);
            setSelectedServerProfileId(null);
          }
        } else {
          setAuthUser(null);
          setSavedProfiles([]);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAuthChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuthSuccess = (payload: { token: string; user: AuthUser; profiles: ServerProfileSummary[] }) => {
    setAuthUser(payload.user);
    setSavedProfiles(payload.profiles);
    if (payload.profiles.length > 0) {
      // Returning user: pick active saved profile immediately
      const active = payload.profiles.find((p) => p.isActive) ?? payload.profiles[0]!;
      applyServerProfileToState(active);
    } else {
      // New user with 0 saved profiles: show Step 2 onboarding card to enter birth details
      setSelectedServerProfileId(null);
      setBackendProfileId(null);
      setNatalChart(null);
      setSavedProfile(null);
    }
  };

  const handleSwitchProfile = async (sp: ServerProfileSummary) => {
    applyServerProfileToState(sp);
    activateProfileOnServer(sp.id).catch(() => {});
  };

  const handleDeleteProfile = async (profileIdToDelete: string) => {
    try {
      const remaining = await deleteProfileOnServer(profileIdToDelete);
      setSavedProfiles(remaining);
      if (backendProfileId === profileIdToDelete) {
        if (remaining.length > 0) {
          applyServerProfileToState(remaining[0]!);
        } else {
          setSelectedServerProfileId(null);
          setBackendProfileId(null);
          setSavedProfile(null);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    logoutAuth();
    setAuthUser(null);
    setSavedProfiles([]);
    setSelectedServerProfileId(null);
    setBackendProfileId(null);
    setNatalChart(null);
    setSavedProfile(null);
    try {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    } catch {
      // ignore
    }
  };

  const handleSaveProfile = (p: UserProfileInput) => {
    // Creating/editing a profile clears pinned server ID so POST /api/profiles creates/updates cleanly under current user
    setSelectedServerProfileId(null);
    setSavedProfile(p);
    setUserName(p.name);
    setBirthDate(p.birthDate);
    setBirthTime(p.birthTime);
    setCityName(p.cityName);
    setTodayCityName(p.cityName);
    setTodayLocation({ name: p.cityName, lat: p.lat, lon: p.lon, tzId: p.tzId });
    setLat(p.lat);
    setLon(p.lon);
    setTzId(p.tzId);
    setTimeCertainty(p.timeCertainty);
    setAyanamsa(p.ayanamsa);
    try {
      localStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(p));
    } catch {
      // ignore
    }
  };

  const currentTransits = serverTransits;

  const currentProfile: UserProfileInput = useMemo(() => ({
    name: userName,
    birthDate,
    birthTime,
    cityName,
    lat,
    lon,
    tzId,
    timeCertainty,
    ayanamsa,
  }), [userName, birthDate, birthTime, cityName, lat, lon, tzId, timeCertainty, ayanamsa]);

  const calibrationLogs: SubjectiveLog[] = useMemo(() => {
    return journalEntries.map((e) => ({
      mood: e.mood,
      energy: e.energy,
      atUtc: e.atUtc,
      snapshot: {
        score: e.snapshot.score,
        band: e.snapshot.band,
        horaRuler: e.snapshot.horaRuler,
        moonSign: e.snapshot.moonSign,
        moonNakshatra: e.snapshot.moonNakshatra,
        dasha: e.snapshot.dasha,
        chandraBalaHouse: e.snapshot.chandraBalaHouse,
        taraBalaCategory: e.snapshot.taraBalaCategory,
        horaCompatibility: e.snapshot.horaCompatibility,
        savBindus: e.snapshot.savBindus,
      },
    }));
  }, [journalEntries]);

  const llmDossierInput: LlmDossierInput | null = useMemo(() => {
    if (!natalChart || !serverLevel1) return null;
    return {
      userName,
      birthDate,
      birthTime,
      cityName,
      lat,
      lon,
      tzId,
      ayanamsa,
      timeCertainty,
      natalChart,
      panchang,
      avakahada,
      dashas,
      ashtakvarga,
      shadbala,
      chalit,
      yogas: serverLevel1.yogas ?? [],
      karakas: serverLevel1.karakas ?? {},
      avasthas: serverLevel1.avasthas ?? {},
      ghatak: serverLevel1.ghatak,
      aspects: serverLevel1.aspects ?? [],
      bhavas: serverLevel1.bhavas ?? [],
    };
  }, [
    natalChart, serverLevel1, userName, birthDate, birthTime, cityName, lat, lon, tzId, ayanamsa,
    timeCertainty, panchang, avakahada, dashas, ashtakvarga, shadbala, chalit,
  ]);

  const activeCity = useMemo(() => {
    return todayLocation;
  }, [todayLocation]);

  useEffect(() => {
    if (!authUser || !savedProfile) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function loadFromServer() {
      setLoading(true);
      setServerError(null);
      const nowLocal = new Date();
      const todayStr = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(nowLocal.getDate()).padStart(2, '0')}`;

      try {
        const { profileId, bundle } = await fetchOrCreateStaticBundle({
          ...(selectedServerProfileId ? { id: selectedServerProfileId } : {}),
          name: userName,
          birthDate,
          birthTime,
          cityName,
          lat,
          lon,
          tzId,
          timeCertainty,
          ayanamsa,
        });
        if (cancelled) return;

        setBackendProfileId(profileId);
        // Refresh saved profiles list if signed in so new/updated chart appears immediately in sidebar
        if (authUser) {
          fetchAuthMe()
            .then((me) => {
              if (!cancelled && me) setSavedProfiles(me.profiles);
            })
            .catch(() => {});
        }
        const l1 = bundle.level1Static;
        const l2 = bundle.level2Static;
        setServerLevel1(l1);
        setServerLevel2(l2);
        setNatalChart(l1.natal);
        setAvakahada(l1.avakahada ?? null);
        setPanchang(l1.panchang ?? null);
        setDashas(l1.dashas ?? null);
        setYoginiDashas(l1.yogini ?? null);
        setCharaDashas(l1.chara ?? null);
        setAshtakvarga(l1.ashtakvarga ?? null);
        setChalit(l1.chalit ?? null);
        setShadbala(l1.shadbala ?? null);

        const todayPayload = await fetchTodaySky(
          profileId,
          todayStr,
          activeCity.tzId || tzId,
          activeCity.lat,
          activeCity.lon,
        );
        if (cancelled) return;

        setDayView(todayPayload.dayView);
        setServerTransits(todayPayload.transits);
        setMonthPeakSummary(todayPayload.monthPeakSummary ?? null);
        const curHour = nowLocal.getHours();
        setCurrentScore(todayPayload.dayView?.hourlyScores?.[curHour] || todayPayload.dayView?.hourlyScores?.[12] || null);

        syncDeltaWithServer(profileId).catch(() => {});
      } catch (err: any) {
        if (!cancelled) {
          setServerError(err?.message ?? 'Could not connect to MyAstro API server.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFromServer();
    return () => {
      cancelled = true;
    };
  }, [savedProfile, selectedServerProfileId, authUser?.id, userName, birthDate, birthTime, cityName, lat, lon, tzId, timeCertainty, ayanamsa, retryTick]);

  // Refresh ONLY /today when the user changes their current location city (never mutates birth profile!)
  useEffect(() => {
    if (!backendProfileId || !natalChart) return;
    let cancelled = false;
    const nowLocal = new Date();
    const todayStr = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(nowLocal.getDate()).padStart(2, '0')}`;
    fetchTodaySky(backendProfileId, todayStr, activeCity.tzId || tzId, activeCity.lat, activeCity.lon)
      .then((todayPayload) => {
        if (cancelled) return;
        setDayView(todayPayload.dayView);
        setServerTransits(todayPayload.transits);
        setMonthPeakSummary(todayPayload.monthPeakSummary ?? null);
        const curHour = nowLocal.getHours();
        setCurrentScore(todayPayload.dayView?.hourlyScores?.[curHour] || todayPayload.dayView?.hourlyScores?.[12] || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeCity.name, activeCity.lat, activeCity.lon, activeCity.tzId]);

  const d1Placements: ChartPlacement[] = useMemo(() => {
    if (!natalChart || !natalChart.lagna) return [];
    const map = new Map<number, ChartPlacement['items']>();
    for (let s = 0; s < 12; s++) map.set(s, []);
    map.get(natalChart.lagna.signIndex)?.push({ label: 'Asc', isLagna: true });
    const shortNames: Record<string, string> = {
      sun: 'Su', moon: 'Mo', mars: 'Ma', mercury: 'Me', jupiter: 'Ju',
      venus: 'Ve', saturn: 'Sa', rahu: 'Ra', ketu: 'Ke', uranus: 'Ur', neptune: 'Ne', pluto: 'Pl',
    };
    for (const [id, g] of Object.entries(natalChart.grahas)) {
      map.get(g.signIndex)?.push({ label: shortNames[id] || id.slice(0, 2), isRetrograde: g.retrograde });
    }
    return Array.from(map.entries()).map(([signIndex, items]) => ({ signIndex, items }));
  }, [natalChart]);

  const vargaPlacements: ChartPlacement[] = useMemo(() => {
    if (!natalChart || !natalChart.lagna) return [];
    const map = new Map<number, ChartPlacement['items']>();
    for (let s = 0; s < 12; s++) map.set(s, []);

    const precomputed = serverLevel1?.vargas?.[selectedVarga];
    const lagnaSign = precomputed !== undefined
      ? precomputed.lagnaSignIndex
      : calculateVargaSign(natalChart.lagna.lon, selectedVarga);
    map.get(lagnaSign)?.push({ label: 'Asc', isLagna: true });

    const shortNames: Record<string, string> = {
      sun: 'Su', moon: 'Mo', mars: 'Ma', mercury: 'Me', jupiter: 'Ju',
      venus: 'Ve', saturn: 'Sa', rahu: 'Ra', ketu: 'Ke',
    };
    for (const [id, g] of Object.entries(natalChart.grahas)) {
      if (!shortNames[id]) continue;
      const sign = precomputed?.grahas?.[id] !== undefined
        ? precomputed.grahas[id]
        : calculateVargaSign(g.lon, selectedVarga);
      map.get(sign)?.push({ label: shortNames[id]!, isRetrograde: g.retrograde });
    }
    return Array.from(map.entries()).map(([signIndex, items]) => ({ signIndex, items }));
  }, [natalChart, selectedVarga, serverLevel1]);

  const vargaLagnaSignIndex = useMemo(() => {
    if (serverLevel1?.vargas?.[selectedVarga]?.lagnaSignIndex !== undefined) {
      return serverLevel1.vargas[selectedVarga].lagnaSignIndex;
    }
    if (!natalChart || !natalChart.lagna) return 0;
    return calculateVargaSign(natalChart.lagna.lon, selectedVarga);
  }, [natalChart, selectedVarga, serverLevel1]);

  const charaKarakas = useMemo(() => {
    return serverLevel1?.karakas ?? {};
  }, [serverLevel1]);

  const sevenPlanetSigns = useMemo(() => {
    if (!natalChart) return undefined;
    return {
      sun: natalChart.grahas.sun.signIndex,
      moon: natalChart.grahas.moon.signIndex,
      mars: natalChart.grahas.mars.signIndex,
      mercury: natalChart.grahas.mercury.signIndex,
      jupiter: natalChart.grahas.jupiter.signIndex,
      venus: natalChart.grahas.venus.signIndex,
      saturn: natalChart.grahas.saturn.signIndex,
    };
  }, [natalChart]);

  // First-visit onboarding screen (no hardcoded chart forced on new visitors)
  // Step 0: Restoring existing session
  if (!authChecked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
        <Sparkles style={{ color: 'var(--gold)', animation: 'spin 3s linear infinite', width: 34, height: 34 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Checking your account…</p>
      </div>
    );
  }

  // Step 1 (Mandatory): Sign In / Create Account Gate
  if (!authUser) {
    return <AuthOnboardingGate onSuccess={handleAuthSuccess} />;
  }

  // Step 2: Signed in, but no saved chart found under this account -> Enter Birth Details
  if (!savedProfile) {
    return (
      <>
        <FirstVisitOnboarding
          onComplete={(p) => handleSaveProfile(p)}
          onUseDemo={() => handleSaveProfile(DEMO_PROFILE)}
        />
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 50, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 12px 5px 6px',
              borderRadius: 20,
              background: 'rgba(20, 17, 41, 0.92)',
              border: '1px solid rgba(95, 194, 179, 0.45)',
              fontSize: 12,
              color: 'var(--teal)',
              fontWeight: 600,
            }}
          >
            {authUser.picture && (
              <img
                src={authUser.picture}
                alt={authUser.name}
                referrerPolicy="no-referrer"
                style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
              />
            )}
            <span>{authUser.name.split(' ')[0]}</span>
            <button
              onClick={handleLogout}
              style={{ background: 'transparent', border: 'none', color: 'var(--amber)', cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: '0 2px' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </>
    );
  }

  if (serverError && !natalChart) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 14, padding: 24, textAlign: 'center' }}>
        <WifiOff size={36} style={{ color: 'var(--amber)' }} />
        <h2 className="serif-title" style={{ color: 'var(--gold)', margin: 0 }}>MyAstro Server Unreachable</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 420, margin: 0 }}>
          {serverError} Make sure the MyAstro API server is running at <code>{API_BASE_URL}</code>.
        </p>
        <button onClick={() => setRetryTick((t) => t + 1)} className="btn btn-primary">
          Retry Connection
        </button>
      </div>
    );
  }

  if (loading || !natalChart || !natalChart.lagna) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
        <Sparkles style={{ color: 'var(--gold)', animation: 'spin 3s linear infinite', width: 36, height: 36 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading your chart bundle from MyAstro server...</p>
      </div>
    );
  }

  return (
    <ReadingProvider
      profileId={backendProfileId}
      natalChart={natalChart}
      shadbala={shadbala}
      ashtakvarga={ashtakvarga}
      dashas={dashas}
      transits={currentTransits}
      serverLevel2={serverLevel2}
    >
      <AppShell
        userName={userName}
        birthDate={birthDate}
        birthTime={birthTime}
        tzId={tzId}
        cityName={todayCityName}
        onCityChange={setTodayCityName}
        onLocationChange={(loc) => {
          setTodayLocation(loc);
          setTodayCityName(loc.name);
        }}
        lat={lat}
        lon={lon}
        natalChart={natalChart}
        serverLevel1={serverLevel1}
        dayView={dayView}
        currentScore={currentScore}
        activeCityName={activeCity.name}
        currentTransits={currentTransits}
        monthPeakSummary={monthPeakSummary}
        chalit={chalit}
        panchang={panchang}
        avakahada={avakahada}
        dashas={dashas}
        yoginiDashas={yoginiDashas}
        charaDashas={charaDashas}
        shadbala={shadbala}
        ashtakvarga={ashtakvarga}
        sevenPlanetSigns={sevenPlanetSigns}
        chartStyle={chartStyle}
        onChartStyleChange={setChartStyle}
        chartPerspective={chartPerspective}
        onPerspectiveChange={setChartPerspective}
        selectedVarga={selectedVarga}
        onVargaChange={setSelectedVarga}
        d1Placements={d1Placements}
        vargaPlacements={vargaPlacements}
        vargaLagnaSignIndex={vargaLagnaSignIndex}
        charaKarakas={charaKarakas}
        backendProfileId={backendProfileId}
        calibrationLogs={calibrationLogs}
        onEntriesChange={setJournalEntries}
        onOpenOnboarding={() => setShowOnboarding(true)}
        onOpenPrintReport={() => setShowPrintReport(true)}
        onOpenLlmDossier={() => setShowLlmDossier(true)}
        onOpenDataVault={() => setShowDataSovereignty(true)}
        onOpenPlainGuide={(cat) => {
          setPlainEnglishCategory(cat);
          setShowPlainEnglishModal(true);
        }}
        authUser={authUser}
        savedProfiles={savedProfiles}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onSwitchProfile={handleSwitchProfile}
        onDeleteProfile={handleDeleteProfile}
      />

      {showAuthModal && (
        <React.Suspense fallback={null}>
          <GoogleAuthModal
            open={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        </React.Suspense>
      )}

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        currentProfile={currentProfile}
        onSaveProfile={handleSaveProfile}
      />

      {showPrintReport && (
        <React.Suspense fallback={null}>
          <PrintableNatalReport
            userName={userName}
            cityName={cityName}
            birthDate={birthDate}
            birthTime={birthTime}
            tzId={tzId}
            lat={lat}
            lon={lon}
            ayanamsa={ayanamsa}
            timeCertainty={timeCertainty}
            natalChart={natalChart}
            avakahada={avakahada}
            dashas={dashas}
            ashtakvarga={ashtakvarga}
            shadbala={shadbala}
            chalit={chalit}
            panchang={panchang}
            onClose={() => setShowPrintReport(false)}
          />
        </React.Suspense>
      )}

      {showDataSovereignty && (
        <React.Suspense fallback={null}>
          <DataSovereigntyModal
            currentProfile={currentProfile}
            onRestoreData={(newProfile, newEntries) => {
              handleSaveProfile(newProfile);
              setJournalEntries(newEntries);
            }}
            onHardReset={() => window.location.reload()}
            onClose={() => setShowDataSovereignty(false)}
          />
        </React.Suspense>
      )}

      {showLlmDossier && llmDossierInput && (
        <React.Suspense fallback={null}>
          <LlmDossierModal input={llmDossierInput} onClose={() => setShowLlmDossier(false)} />
        </React.Suspense>
      )}

      {showPlainEnglishModal && (
        <React.Suspense fallback={null}>
          <PlainEnglishExplainerModal initialTab={plainEnglishCategory} onClose={() => setShowPlainEnglishModal(false)} />
        </React.Suspense>
      )}
    </ReadingProvider>
  );
}
