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
import { PrintableNatalReport } from './components/PrintableNatalReport.tsx';
import { DataSovereigntyModal } from './components/DataSovereigntyModal.tsx';
import { LlmDossierModal } from './components/LlmDossierModal.tsx';
import { PlainEnglishExplainerModal } from './components/PlainEnglishExplainerModal.tsx';
import { AskCopilotDrawer } from './components/AskCopilotDrawer.tsx';
import { ShareBlueprintModal } from './components/ShareBlueprintModal.tsx';
import { CommandPaletteModal } from './components/CommandPaletteModal.tsx';
import { type JournalEntry } from './components/JournalExplorer.tsx';
import { ReadingProvider, useReading, type MainTab } from './context/ReadingContext.tsx';
import { TodayTab } from './tabs/TodayTab.tsx';
import { KundliTab } from './tabs/KundliTab.tsx';
import { TimingTab } from './tabs/TimingTab.tsx';
import { StrengthsTab } from './tabs/StrengthsTab.tsx';
import { JournalTab } from './tabs/JournalTab.tsx';
import { API_BASE_URL } from './config.ts';
import { fetchOrCreateStaticBundle, fetchTodaySky, syncDeltaWithServer } from './services/apiClient.ts';

type ChartStyle = 'north' | 'south';

const ACTIVE_PROFILE_KEY = 'astro_active_profile_v1';

const DEMO_PROFILE: UserProfileInput = {
  name: 'Sample Native',
  birthDate: '2000-04-14',
  birthTime: '06:30:00',
  cityName: 'New Delhi',
  lat: 28.6139,
  lon: 77.209,
  tzId: 'Asia/Kolkata',
  timeCertainty: 'exact',
  ayanamsa: 'lahiri',
};

interface AppShellProps {
  userName: string;
  birthDate: string;
  birthTime: string;
  tzId: string;
  cityName: string;
  onCityChange: (c: string) => void;
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
  calibrationLogs: SubjectiveLog[];
  onEntriesChange: (entries: JournalEntry[]) => void;
  onOpenOnboarding: () => void;
  onOpenPrintReport: () => void;
  onOpenLlmDossier: () => void;
  onOpenDataVault: () => void;
  onOpenPlainGuide: (cat: string) => void;
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
    setAskOpen,
  } = useReading();

  const [showShareBlueprint, setShowShareBlueprint] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('astro_welcome_dismissed_v1') === '1';
    } catch {
      return false;
    }
  });

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
            style={{
              background: 'var(--teal)',
              color: '#15132b',
              fontWeight: 700,
              fontSize: 12,
              borderRadius: 8,
              padding: '7px 13px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <Bot size={14} /> Ask AI
          </button>

          <button
            onClick={props.onOpenOnboarding}
            className="btn btn-outline"
            style={{ fontSize: 12 }}
            title="Switch or edit birth profile"
          >
            <User size={13} style={{ color: 'var(--gold)' }} /> {props.userName.split(' ')[0]}
          </button>
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

      {/* Modern Chatbot Ask AI Drawer */}
      <AskCopilotDrawer
        profileId={props.backendProfileId}
        natalChart={props.natalChart}
        shadbala={props.shadbala}
        ashtakvarga={props.ashtakvarga}
        dashas={props.dashas}
        transits={props.currentTransits}
      />

      {/* Cmd+K Global Search Palette */}
      <CommandPaletteModal
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onOpenShare={() => setShowShareBlueprint(true)}
      />

      {/* Shareable Cosmic Blueprint Modal */}
      {showShareBlueprint && (
        <ShareBlueprintModal
          userName={props.userName}
          natalChart={props.natalChart}
          reading={reading}
          charaKarakas={props.charaKarakas}
          onClose={() => setShowShareBlueprint(false)}
        />
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
  const [savedProfile, setSavedProfile] = useState<UserProfileInput | null>(loadSavedProfile);
  const activeProfile = savedProfile ?? DEMO_PROFILE;

  const [chartStyle, setChartStyle] = useState<ChartStyle>(() => {
    try {
      const saved = localStorage.getItem('astro_chart_style_v1');
      if (saved === 'north' || saved === 'south') return saved;
    } catch {
      // ignore
    }
    return 'north';
  });
  const [selectedVarga, setSelectedVarga] = useState<VargaType>('D9');
  const [chartPerspective, setChartPerspective] = useState<'lagna' | 'chandra'>('lagna');
  const [loading, setLoading] = useState(true);

  const [userName, setUserName] = useState(activeProfile.name);
  const [cityName, setCityName] = useState(activeProfile.cityName);
  const [todayCityName, setTodayCityName] = useState(() => {
    const matched = CITIES.find((c) => c.name.toLowerCase() === activeProfile.cityName.toLowerCase());
    return matched ? matched.name : CITIES[0]!.name;
  });
  const [lat, setLat] = useState(activeProfile.lat);
  const [lon, setLon] = useState(activeProfile.lon);
  const [birthDate, setBirthDate] = useState(activeProfile.birthDate);
  const [birthTime, setBirthTime] = useState(activeProfile.birthTime);
  const [tzId, setTzId] = useState(activeProfile.tzId);
  const [timeCertainty, setTimeCertainty] = useState<'exact' | 'approx' | 'unknown'>(activeProfile.timeCertainty);
  const [ayanamsa, setAyanamsa] = useState<AyanamsaId>(activeProfile.ayanamsa);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [natalChart, setNatalChart] = useState<NatalChart | null>(null);
  const [dayView, setDayView] = useState<DayView | null>(null);
  const [currentScore, setCurrentScore] = useState<HourScore | null>(null);
  const [avakahada, setAvakahada] = useState<AvakahadaDetails | null>(null);
  const [dashas, setDashas] = useState<VimshottariDashaTree | null>(null);
  const [yoginiDashas, setYoginiDashas] = useState<YoginiDashaTree | null>(null);
  const [charaDashas, setCharaDashas] = useState<CharaDashaTree | null>(null);
  const [shadbala, setShadbala] = useState<ShadbalaResult | null>(null);
  const [ashtakvarga, setAshtakvarga] = useState<AshtakvargaResult | null>(null);
  const [chalit, setChalit] = useState<ChalitChart | null>(null);
  const [panchang, setPanchang] = useState<any>(null);
  const [serverLevel1, setServerLevel1] = useState<any>(null);
  const [monthPeakSummary, setMonthPeakSummary] = useState<any>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  const [showPrintReport, setShowPrintReport] = useState(false);
  const [showDataSovereignty, setShowDataSovereignty] = useState(false);
  const [showLlmDossier, setShowLlmDossier] = useState(false);
  const [showPlainEnglishModal, setShowPlainEnglishModal] = useState(false);
  const [plainEnglishCategory, setPlainEnglishCategory] = useState<string>('kundli');
  const [backendProfileId, setBackendProfileId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('astro_backend_profile_id_v1');
    } catch {
      return null;
    }
  });
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [serverTransits, setServerTransits] = useState<any>(undefined);

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

  const handleSaveProfile = (p: UserProfileInput) => {
    setSavedProfile(p);
    setUserName(p.name);
    setBirthDate(p.birthDate);
    setBirthTime(p.birthTime);
    setCityName(p.cityName);
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
    return CITIES.find((c) => c.name.toLowerCase() === todayCityName.toLowerCase()) || CITIES[0]!;
  }, [todayCityName]);

  useEffect(() => {
    if (!savedProfile) {
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
        const l1 = bundle.level1Static;
        setServerLevel1(l1);
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
  }, [savedProfile, userName, birthDate, birthTime, cityName, lat, lon, tzId, timeCertainty, ayanamsa, retryTick]);

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
    map.get(calculateVargaSign(natalChart.lagna.lon, selectedVarga))?.push({ label: 'Asc', isLagna: true });
    const shortNames: Record<string, string> = {
      sun: 'Su', moon: 'Mo', mars: 'Ma', mercury: 'Me', jupiter: 'Ju',
      venus: 'Ve', saturn: 'Sa', rahu: 'Ra', ketu: 'Ke',
    };
    for (const [id, g] of Object.entries(natalChart.grahas)) {
      if (!shortNames[id]) continue;
      map.get(calculateVargaSign(g.lon, selectedVarga))?.push({ label: shortNames[id]!, isRetrograde: g.retrograde });
    }
    return Array.from(map.entries()).map(([signIndex, items]) => ({ signIndex, items }));
  }, [natalChart, selectedVarga]);

  const vargaLagnaSignIndex = useMemo(() => {
    if (!natalChart || !natalChart.lagna) return 0;
    return calculateVargaSign(natalChart.lagna.lon, selectedVarga);
  }, [natalChart, selectedVarga]);

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
  if (!savedProfile) {
    return (
      <FirstVisitOnboarding
        onComplete={(p) => handleSaveProfile(p)}
        onUseDemo={() => handleSaveProfile(DEMO_PROFILE)}
      />
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
    >
      <AppShell
        userName={userName}
        birthDate={birthDate}
        birthTime={birthTime}
        tzId={tzId}
        cityName={todayCityName}
        onCityChange={setTodayCityName}
        lat={lat}
        lon={lon}
        natalChart={natalChart}
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
      />

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        currentProfile={currentProfile}
        onSaveProfile={handleSaveProfile}
      />

      {showPrintReport && (
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
      )}

      {showDataSovereignty && (
        <DataSovereigntyModal
          currentProfile={currentProfile}
          onRestoreData={(newProfile, newEntries) => {
            handleSaveProfile(newProfile);
            setJournalEntries(newEntries);
          }}
          onHardReset={() => window.location.reload()}
          onClose={() => setShowDataSovereignty(false)}
        />
      )}

      {showLlmDossier && llmDossierInput && (
        <LlmDossierModal input={llmDossierInput} onClose={() => setShowLlmDossier(false)} />
      )}

      {showPlainEnglishModal && (
        <PlainEnglishExplainerModal initialTab={plainEnglishCategory} onClose={() => setShowPlainEnglishModal(false)} />
      )}
    </ReadingProvider>
  );
}
