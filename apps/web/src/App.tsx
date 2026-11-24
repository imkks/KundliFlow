import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Calculator,
  Target,
} from 'lucide-react';
import {
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
import { AuthOnboardingGate } from './components/AuthOnboardingGate.tsx';
import { AskCopilotDrawer } from './components/AskCopilotDrawer.tsx';
import { type JournalEntry } from './components/JournalExplorer.tsx';
import {
  ReadingProvider,
  useReading,
  LENS_META,
  LIFE_TOPICS,
  type MainTab,
  type ReadingDepth,
} from './context/ReadingContext.tsx';
import { TodayTab } from './tabs/TodayTab.tsx';
import { KundliTab } from './tabs/KundliTab.tsx';
import { TimingTab } from './tabs/TimingTab.tsx';
import { StrengthsTab } from './tabs/StrengthsTab.tsx';
import { JournalTab } from './tabs/JournalTab.tsx';
import { API_BASE_URL } from './config.ts';

// Lazy-load secondary, calculation-matrix, and report modals to keep initial JS lean
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
const LifeEventModal = React.lazy(() =>
  import('./components/LifeEventModal.tsx').then((m) => ({ default: m.LifeEventModal }))
);
const PatternDecoderModal = React.lazy(() =>
  import('./components/PatternDecoderModal.tsx').then((m) => ({ default: m.PatternDecoderModal }))
);
const QuantMatrixModal = React.lazy(() =>
  import('./components/QuantMatrixModal.tsx').then((m) => ({ default: m.QuantMatrixModal }))
);
const ChartSystemsModal = React.lazy(() =>
  import('./components/ChartSystemsModal.tsx').then((m) => ({ default: m.ChartSystemsModal }))
);
const DoshaAuditModal = React.lazy(() =>
  import('./components/DoshaAuditModal.tsx').then((m) => ({ default: m.DoshaAuditModal }))
);
import {
  fetchOrCreateStaticBundle,
  fetchTodaySky,
  clearTodaySkyCache,
  syncDeltaWithServer,
  fetchAuthMe,
  logoutAuth,
  deleteProfileOnServer,
  type AuthUser,
  type ServerProfileSummary,
} from './services/apiClient.ts';

import {
  useAppStore,
  appStore,
  type ChartStyle,
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
  onOpenEditProfile: () => void;
  onOpenAddProfile: () => void;
  onOpenPrintReport: () => void;
  onOpenLlmDossier: () => void;
  onOpenDataVault: () => void;
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
    isGuided,
    isQuant,
    reading,
    apiOffline,
    retryReading,
    activeTab,
    setActiveTab,
    activeTopic,
    focusLifeTopic,
    askOpen,
    setAskOpen,
    openLifeEventModal,
    glossaryRequest,
    openGlossaryModal,
    closeGlossaryModal,
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

  // Global Cmd+K / Ctrl+K shortcut for Quick Search & Escape to close menus
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((o) => !o);
      } else if (e.key === 'Escape') {
        setChartsMenuOpen(false);
        setAccountMenuOpen(false);
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

  const TABS: { id: MainTab; label: string; mobileLabel?: string; badge?: string; featured?: boolean; Icon: React.FC<any> }[] = [
    { id: 'today', label: 'Today', Icon: Clock },
    { id: 'kundli', label: 'Kundli', mobileLabel: 'Kundli', badge: 'D1–D60', featured: true, Icon: Compass },
    { id: 'timing', label: 'Timing', Icon: Layers },
    { id: 'strengths', label: 'Yogas & Power', mobileLabel: 'Yogas', Icon: Award },
    { id: 'journal', label: 'Timeline', Icon: PenLine },
  ];

  const LENS_BUTTONS: Array<{ id: ReadingDepth; Icon: React.FC<any> }> = [
    { id: 'simple', Icon: Bot },
    { id: 'standard', Icon: Compass },
    { id: 'detailed', Icon: Calculator },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Full-Width Sticky Top Bar */}
      <header className="app-topbar" style={{ flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
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
              minWidth: 185,
              justifyContent: 'space-between',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Search size={13} style={{ color: 'var(--gold)' }} />
              Search chart, houses…
            </span>
            <kbd style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'var(--surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              ⌘K
            </kbd>
          </button>

          {/* 3-Lens Experience Switcher (Noob / Some Knowledge / Expert) */}
          <div
            role="radiogroup"
            aria-label="Experience level lens"
            className="lens-switcher"
            title="Switch between Guided AI (simple), Chart Explorer (standard), and Quant Pro (detailed)"
          >
            {LENS_BUTTONS.map(({ id, Icon }) => {
              const meta = LENS_META[id];
              const isSelected = depth === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setDepth(id)}
                  title={`${meta.title}: ${meta.subtitle}`}
                  className={`lens-btn ${isSelected ? `active-${id}` : ''}`}
                >
                  <Icon size={13} />
                  <span>{meta.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Global Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => openLifeEventModal()}
            className="btn btn-outline"
            style={{ fontSize: 12, borderColor: 'rgba(95, 194, 179, 0.4)' }}
            title="Decode a life event date with Dashas & AI"
          >
            <Target size={13} style={{ color: 'var(--teal)' }} /> Life Events
          </button>

          {isQuant && (
            <button
              type="button"
              onClick={props.onOpenLlmDossier}
              className="btn btn-outline"
              style={{ fontSize: 12 }}
              title="Export structured JSON/Markdown chart dossier"
            >
              <Bot size={13} style={{ color: 'var(--gold)' }} /> Dossier
            </button>
          )}

          <button
            onClick={() => setShowShareBlueprint(true)}
            className="btn btn-outline"
            style={{ fontSize: 12 }}
            title="Shareable Cosmic Blueprint card"
          >
            <Share2 size={13} style={{ color: 'var(--teal)' }} /> Share
          </button>

          {/* 1. Saved Charts / Active Profile Switcher (Mobile only; desktop uses sidebar) */}
          <div className="mobile-only-inline" style={{ position: 'relative' }}>
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
                        props.onOpenAddProfile();
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
                              <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
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
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      {props.authUser ? 'Saving chart…' : 'Local guest chart active'}
                    </div>
                  )}

                  <div style={{ paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      onClick={() => {
                        setChartsMenuOpen(false);
                        props.onOpenEditProfile();
                      }}
                      className="btn btn-outline"
                      style={{ width: '100%', fontSize: 11.5, justifyContent: 'center' }}
                    >
                      <User size={12} /> Edit Current Chart
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 2. Google Account Photo Button OR Guest Sign-In Button */}
          {props.authUser ? (
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
          ) : (
            <button
              type="button"
              onClick={props.onOpenAuthModal}
              className="btn btn-outline"
              style={{ fontSize: 12, borderColor: 'rgba(227, 173, 70, 0.35)' }}
              title="Sign in with Google to sync charts across devices"
            >
              <LogIn size={13} style={{ color: 'var(--gold)' }} /> Sign in
            </button>
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
                onClick={props.onOpenEditProfile}
                style={{ fontSize: 11, color: 'var(--teal)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Edit
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={11} style={{ color: 'var(--gold)' }} /> {props.birthDate} • {props.birthTime.slice(0, 8)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={11} style={{ color: 'var(--teal)' }} /> {props.cityName}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
              <span className="gold-badge" style={{ fontSize: 10.5, padding: '2px 7px' }}>
                Asc: {props.natalChart.lagna?.sign?.toUpperCase() ?? 'CHANDRA'}
              </span>
              <span className="teal-badge" style={{ fontSize: 10.5, padding: '2px 7px', textTransform: 'capitalize' }}>
                Moon: {props.natalChart.grahas.moon.sign}
              </span>
              {props.natalChart.ayanamsa?.id && (
                <button
                  type="button"
                  onClick={props.onOpenEditProfile}
                  className={props.natalChart.ayanamsa.id === 'lahiri' ? 'badge' : 'amber-badge'}
                  style={{ fontSize: 10, padding: '2px 7px', textTransform: 'uppercase', cursor: 'pointer' }}
                  title="Active Ayanamsa (click to edit calculation settings)"
                >
                  {props.natalChart.ayanamsa.id.replace('_', ' ')}
                </button>
              )}
            </div>
          </div>

          {/* Saved Profiles History Switcher (Per Google Account) */}
          <div style={{ padding: 10, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Users size={12} style={{ color: 'var(--teal)' }} />
                {props.authUser ? `Saved Charts (${props.savedProfiles.length})` : 'Cloud Sync'}
              </span>
              {props.authUser ? (
                <button
                  onClick={props.onOpenAddProfile}
                  style={{ fontSize: 11, color: 'var(--gold)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}
                  title="Add another birth chart under your account"
                >
                  <Plus size={11} /> Add
                </button>
              ) : (
                <button
                  onClick={props.onOpenAuthModal}
                  style={{ fontSize: 11, color: 'var(--gold)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700 }}
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
          <nav role="tablist" aria-label="Primary chart sections" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 8px 4px' }}>
              Explore
            </div>
            {TABS.map(({ id, label, badge, featured, Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(id)}
                  className={featured && !isActive ? 'nav-item-featured' : undefined}
                  style={{
                    width: '100%',
                    padding: featured ? '10px 12px' : '9px 12px',
                    borderRadius: 10,
                    fontSize: featured ? 13.5 : 13,
                    fontWeight: isActive || featured ? 700 : 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    textAlign: 'left',
                    background: isActive
                      ? 'rgba(227, 173, 70, 0.2)'
                      : featured
                      ? 'rgba(227, 173, 70, 0.08)'
                      : 'transparent',
                    color: isActive || featured ? 'var(--gold)' : 'var(--text-main)',
                    border: isActive
                      ? '1px solid rgba(227, 173, 70, 0.55)'
                      : featured
                      ? '1px solid rgba(227, 173, 70, 0.28)'
                      : '1px solid transparent',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    <Icon size={15} /> {label}
                  </span>
                  {badge && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 6,
                        background: isActive ? 'var(--gold)' : 'rgba(227, 173, 70, 0.16)',
                        color: isActive ? '#15132b' : 'var(--gold)',
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Highlighted Life Topics Quick Focus */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0 8px 3px' }}>
              Life Topics
            </div>
            {LIFE_TOPICS.map((t) => {
              const isTopicActive = activeTab === 'kundli' && activeTopic === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    props.onVargaChange(t.varga);
                    focusLifeTopic(t.id);
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: isTopicActive ? 700 : 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 6,
                    textAlign: 'left',
                    background: isTopicActive ? 'rgba(95, 194, 179, 0.16)' : 'transparent',
                    color: isTopicActive ? 'var(--teal)' : 'var(--text-main)',
                    border: isTopicActive ? '1px solid rgba(95, 194, 179, 0.35)' : '1px solid transparent',
                  }}
                  title={t.tagline}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <span>{t.icon}</span>
                    <span>{t.shortLabel}</span>
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {t.id === 'year' ? 'Annual' : `H${t.house}`}
                  </span>
                </button>
              );
            })}
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
            <button onClick={() => openGlossaryModal({ category: activeTab })} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'left' }}>
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
                padding: '9px 14px',
                borderRadius: 10,
                background: 'rgba(217, 119, 54, 0.14)',
                border: '1px solid var(--amber)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10,
                fontSize: 12,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <WifiOff size={14} style={{ color: 'var(--amber)' }} />
                Backend API is offline — showing cached chart data &amp; client calculations. Live AI chat is paused.
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={props.onOpenLlmDossier} className="btn btn-outline" style={{ fontSize: 11 }}>
                  Copy AI Dossier
                </button>
                <button onClick={retryReading} className="btn btn-outline" style={{ fontSize: 11 }}>
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Dismissible Adaptive Quick-Start Strip */}
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
                <strong style={{ color: 'var(--teal)' }}>
                  ✨ {isGuided ? 'Guided Start:' : isQuant ? 'Quant Workspace:' : 'Explorer Start:'}
                </strong>
                {isGuided ? (
                  <>
                    <button onClick={() => openLifeEventModal()} style={{ color: 'var(--text-main)', textDecoration: 'underline', fontSize: 12 }}>
                      1. Decode a Past or Future Life Event
                    </button>
                    <button onClick={() => setAskOpen(true)} style={{ color: 'var(--text-main)', textDecoration: 'underline', fontSize: 12 }}>
                      2. Ask AI About Your Life
                    </button>
                    <button onClick={() => setActiveTab('today')} style={{ color: 'var(--text-main)', textDecoration: 'underline', fontSize: 12 }}>
                      3. Check Today&apos;s Best Hours
                    </button>
                  </>
                ) : isQuant ? (
                  <>
                    <button onClick={() => setActiveTab('kundli')} style={{ color: 'var(--text-main)', textDecoration: 'underline', fontSize: 12 }}>
                      1. Inspect Degrees, Vargas &amp; KP
                    </button>
                    <button onClick={() => setActiveTab('strengths')} style={{ color: 'var(--text-main)', textDecoration: 'underline', fontSize: 12 }}>
                      2. Shadbala &amp; Ashtakvarga Tables
                    </button>
                    <button onClick={props.onOpenLlmDossier} style={{ color: 'var(--text-main)', textDecoration: 'underline', fontSize: 12 }}>
                      3. Export JSON/MD Dossier
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setActiveTab('kundli')} style={{ color: 'var(--text-main)', textDecoration: 'underline', fontSize: 12 }}>
                      1. Click Your Chart &amp; Trace Patterns
                    </button>
                    <button onClick={() => openLifeEventModal()} style={{ color: 'var(--text-main)', textDecoration: 'underline', fontSize: 12 }}>
                      2. Test Past Life Events
                    </button>
                    <button onClick={() => openGlossaryModal({ category: 'kundli' })} style={{ color: 'var(--text-main)', textDecoration: 'underline', fontSize: 12 }}>
                      3. Open Plain English Glossary
                    </button>
                  </>
                )}
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
            <p>MyAstro Almanac • Swiss Ephemeris &amp; Local-First Sync • Private by Default</p>
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
          <span>{isGuided ? 'Ask AI · Life & Chart' : `Ask AI · ${props.userName.split(' ')[0]}`}</span>
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
        onOpenDossier={props.onOpenLlmDossier}
      />

      {/* Shared Progressive Disclosure Modals */}
      <React.Suspense fallback={null}>
        <LifeEventModal
          natalChart={props.natalChart}
          dashas={props.dashas}
          yoginiDashas={props.yoginiDashas}
          charaDashas={props.charaDashas}
        />
        <PatternDecoderModal
          natalChart={props.natalChart}
          charaKarakas={props.charaKarakas}
        />
        <QuantMatrixModal
          natalChart={props.natalChart}
          charaKarakas={props.charaKarakas}
          shadbala={props.shadbala}
          ashtakvarga={props.ashtakvarga}
          sevenPlanetSigns={props.sevenPlanetSigns}
          dayView={props.dayView}
          currentTransits={props.currentTransits}
        />
        <ChartSystemsModal
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
        />
        <DoshaAuditModal />
        {glossaryRequest && (
          <PlainEnglishExplainerModal
            initialTab={glossaryRequest.category ?? activeTab}
            initialSearch={glossaryRequest.term ?? ''}
            onClose={closeGlossaryModal}
          />
        )}
      </React.Suspense>

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
        {TABS.map(({ id, label, mobileLabel, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={`mob-${id}`}
              onClick={() => setActiveTab(id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              aria-label={label}
            >
              <Icon size={18} />
              <span>{mobileLabel ?? label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default function App() {
  const [onboardingMode, setOnboardingMode] = useState<'add' | 'edit'>('edit');
  const forceRecomputeRef = React.useRef(false);
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

  const setChartStyle = useCallback((s: ChartStyle) => appStore.setChartStyle(s), []);
  const setSelectedVarga = useCallback((v: VargaType) => appStore.setState({ selectedVarga: v }), []);
  const setChartPerspective = useCallback((p: 'lagna' | 'chandra') => appStore.setState({ chartPerspective: p }), []);
  const setShowOnboarding = (v: boolean) => appStore.setState({ showOnboarding: v });
  const setShowPrintReport = (v: boolean) => appStore.setState({ showPrintReport: v });
  const setShowDataSovereignty = (v: boolean) => appStore.setState({ showDataSovereignty: v });
  const setShowLlmDossier = (v: boolean) => appStore.setState({ showLlmDossier: v });
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

  useEffect(() => {
    try {
      localStorage.setItem('astro_chart_style_v1', chartStyle);
    } catch {
      // ignore
    }
  }, [chartStyle]);

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
    setTodayCityName(p.cityName);
    setTodayLocation({ name: p.cityName, lat: p.lat, lon: p.lon, tzId: p.tzId });
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
            let localId: string | null = null;
            try {
              localId = localStorage.getItem('astro_backend_profile_id_v1');
            } catch {
              // ignore
            }
            const active =
              (localId ? res.profiles.find((p) => p.id === localId) : undefined) ??
              res.profiles.find((p) => p.isActive) ??
              res.profiles[0]!;
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

  const handleSaveProfile = (p: UserProfileInput, mode: 'add' | 'edit' = 'add') => {
    const preservedId = mode === 'edit' ? (selectedServerProfileId ?? backendProfileId ?? null) : null;
    forceRecomputeRef.current = true;
    try {
      if (preservedId) {
        localStorage.removeItem(`astro_bundle_cache_v1_${preservedId}`);
        localStorage.removeItem(`astro_server_bundle_v2_${preservedId}`);
      }
      if (backendProfileId && backendProfileId !== preservedId) {
        localStorage.removeItem(`astro_bundle_cache_v1_${backendProfileId}`);
        localStorage.removeItem(`astro_server_bundle_v2_${backendProfileId}`);
      }
      clearTodaySkyCache(preservedId);
      clearTodaySkyCache(backendProfileId);
    } catch {
      // ignore
    }
    appStore.setState((s) => ({
      savedProfile: p,
      activeProfile: p,
      selectedServerProfileId: preservedId,
      todayCityName: p.cityName,
      todayLocation: { name: p.cityName, lat: p.lat, lon: p.lon, tzId: p.tzId },
      serverLevel1: null,
      serverLevel2: null,
      natalChart: null,
      retryTick: s.retryTick + 1,
    }));
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
      const forceRecompute = forceRecomputeRef.current;
      forceRecomputeRef.current = false;
      const nowLocal = new Date();
      const todayStr = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(nowLocal.getDate()).padStart(2, '0')}`;

      try {
        const { profileId, bundle, fromServerMutation } = await fetchOrCreateStaticBundle({
          ...(selectedServerProfileId ? { id: selectedServerProfileId } : {}),
          forceRecompute,
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
        // Only refresh saved profiles list & sync delta when a profile was created or edited on the server
        if (authUser && fromServerMutation) {
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

        if (fromServerMutation) {
          syncDeltaWithServer(profileId).catch(() => {});
        }
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

  // Step 0: Restoring existing authenticated session
  if (!authChecked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
        <Sparkles style={{ color: 'var(--gold)', width: 34, height: 34 }} className="spin" />
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Checking your account…</p>
      </div>
    );
  }

  // Step 1 (Mandatory): Sign-In / Account Gate
  if (!authUser) {
    return <AuthOnboardingGate onSuccess={handleAuthSuccess} />;
  }

  // Step 2: Signed in, no chart yet -> Enter Birth Details + Choose Experience Lens
  if (!savedProfile) {
    return (
      <>
        <FirstVisitOnboarding
          onComplete={(p, lens) => {
            try {
              localStorage.setItem('astro_reading_depth_v1', lens);
            } catch {
              // ignore
            }
            handleSaveProfile(p, 'add');
          }}
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
        <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 440, margin: 0 }}>
          {serverError} Make sure the MyAstro API server is running at <code>{API_BASE_URL}</code>.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => setRetryTick((t) => t + 1)} className="btn btn-primary">
            Retry Connection
          </button>
          <button
            onClick={() => {
              setOnboardingMode('edit');
              setShowOnboarding(true);
            }}
            className="btn btn-outline"
          >
            Edit Birth Details
          </button>
        </div>
        <OnboardingModal
          isOpen={showOnboarding}
          mode={onboardingMode}
          onClose={() => setShowOnboarding(false)}
          currentProfile={currentProfile}
          onSaveProfile={handleSaveProfile}
        />
      </div>
    );
  }

  if (loading || !natalChart || !natalChart.lagna) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
        <Sparkles style={{ color: 'var(--gold)', width: 36, height: 36 }} className="spin" />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Preparing your Vedic chart &amp; life readings…</p>
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
        onOpenEditProfile={() => {
          setOnboardingMode('edit');
          setShowOnboarding(true);
        }}
        onOpenAddProfile={() => {
          setOnboardingMode('add');
          setShowOnboarding(true);
        }}
        onOpenPrintReport={() => setShowPrintReport(true)}
        onOpenLlmDossier={() => setShowLlmDossier(true)}
        onOpenDataVault={() => setShowDataSovereignty(true)}
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
        mode={onboardingMode}
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
    </ReadingProvider>
  );
}
