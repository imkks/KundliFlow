import { useSyncExternalStore } from 'react';
import type {
  NatalChart,
  DayView,
  HourScore,
  VargaType,
  AvakahadaDetails,
  AshtakvargaResult,
  ChalitChart,
  VimshottariDashaTree,
  YoginiDashaTree,
  CharaDashaTree,
  ShadbalaResult,
  SubjectiveLog,
} from '@astro/engine';
import { CITIES } from '@astro/content';
import type { UserProfileInput } from '../components/OnboardingModal.tsx';
import type { AuthUser, ServerProfileSummary } from '../services/apiClient.ts';
import type { JournalEntry } from '../components/JournalExplorer.tsx';

export type ChartStyle = 'north' | 'south';

export const EMPTY_PROFILE: UserProfileInput = {
  name: '',
  birthDate: '1995-08-15',
  birthTime: '09:30:00',
  cityName: 'New Delhi',
  lat: 28.6139,
  lon: 77.209,
  tzId: 'Asia/Kolkata',
  timeCertainty: 'exact',
  ayanamsa: 'lahiri',
};

const ACTIVE_PROFILE_KEY = 'astro_active_profile_v1';
const CHART_STYLE_KEY = 'astro_chart_style_v1';
const BACKEND_PROFILE_ID_KEY = 'astro_backend_profile_id_v1';
const JOURNAL_ENTRIES_KEY = 'astro_journal_entries_v1';

export function loadInitialProfile(): UserProfileInput | null {
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

export function loadInitialChartStyle(): ChartStyle {
  try {
    const saved = localStorage.getItem(CHART_STYLE_KEY);
    if (saved === 'north' || saved === 'south') return saved;
  } catch {
    // ignore
  }
  return 'north';
}

export function loadInitialBackendProfileId(): string | null {
  try {
    return localStorage.getItem(BACKEND_PROFILE_ID_KEY);
  } catch {
    return null;
  }
}

export function loadInitialJournalEntries(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(JOURNAL_ENTRIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export interface AppState {
  // Profile & Location State
  savedProfile: UserProfileInput | null;
  activeProfile: UserProfileInput;
  backendProfileId: string | null;
  todayLocation: { name: string; lat: number; lon: number; tzId: string };
  todayCityName: string;

  // Chart Presentation State
  chartStyle: ChartStyle;
  selectedVarga: VargaType;
  chartPerspective: 'lagna' | 'chandra';

  // Server & Calculation State
  loading: boolean;
  serverError: string | null;
  retryTick: number;
  serverLevel1: any;
  serverLevel2: any;
  serverTransits: any;
  monthPeakSummary: any;

  // Classical Jyotish Datasets
  natalChart: NatalChart | null;
  dayView: DayView | null;
  currentScore: HourScore | null;
  avakahada: AvakahadaDetails | null;
  dashas: VimshottariDashaTree | null;
  yoginiDashas: YoginiDashaTree | null;
  charaDashas: CharaDashaTree | null;
  shadbala: ShadbalaResult | null;
  ashtakvarga: AshtakvargaResult | null;
  chalit: ChalitChart | null;
  panchang: any;

  // Auth State
  authChecked: boolean;
  authUser: AuthUser | null;
  savedProfiles: ServerProfileSummary[];
  selectedServerProfileId: string | null;

  // Modals Visibility
  showOnboarding: boolean;
  showPrintReport: boolean;
  showDataSovereignty: boolean;
  showLlmDossier: boolean;
  showAuthModal: boolean;

  // Journal
  journalEntries: JournalEntry[];
}

const initialSavedProfile = loadInitialProfile();
const initialActiveProfile = initialSavedProfile ?? EMPTY_PROFILE;

const defaultTodayLocation = (() => {
  const matched = CITIES.find((c) => c.name.toLowerCase() === initialActiveProfile.cityName.toLowerCase());
  if (matched) {
    return { name: matched.name, lat: matched.lat, lon: matched.lon, tzId: matched.tzId };
  }
  return {
    name: initialActiveProfile.cityName,
    lat: initialActiveProfile.lat,
    lon: initialActiveProfile.lon,
    tzId: initialActiveProfile.tzId,
  };
})();

let state: AppState = {
  savedProfile: initialSavedProfile,
  activeProfile: initialActiveProfile,
  backendProfileId: loadInitialBackendProfileId(),
  todayLocation: defaultTodayLocation,
  todayCityName: defaultTodayLocation.name,

  chartStyle: loadInitialChartStyle(),
  selectedVarga: 'D9',
  chartPerspective: 'lagna',

  loading: true,
  serverError: null,
  retryTick: 0,
  serverLevel1: null,
  serverLevel2: null,
  serverTransits: undefined,
  monthPeakSummary: null,

  natalChart: null,
  dayView: null,
  currentScore: null,
  avakahada: null,
  dashas: null,
  yoginiDashas: null,
  charaDashas: null,
  shadbala: null,
  ashtakvarga: null,
  chalit: null,
  panchang: null,

  authChecked: false,
  authUser: null,
  savedProfiles: [],
  selectedServerProfileId: null,

  showOnboarding: false,
  showPrintReport: false,
  showDataSovereignty: false,
  showLlmDossier: false,
  showAuthModal: false,

  journalEntries: loadInitialJournalEntries(),
};

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export const appStore = {
  getState: (): AppState => state,

  setState: (updater: Partial<AppState> | ((prev: AppState) => Partial<AppState>)) => {
    const patch = typeof updater === 'function' ? updater(state) : updater;
    const keys = Object.keys(patch) as Array<keyof AppState>;
    const changed = keys.some((k) => !Object.is(state[k], patch[k]));
    if (!changed) return;

    const next = { ...state, ...patch };
    // Update activeProfile derived state if savedProfile changed
    if ('savedProfile' in patch) {
      next.activeProfile = next.savedProfile ?? EMPTY_PROFILE;
    }
    state = next;

    emitChange();
  },

  setChartStyle: (chartStyle: ChartStyle) => {
    appStore.setState({ chartStyle });
    try {
      localStorage.setItem(CHART_STYLE_KEY, chartStyle);
    } catch {
      // ignore
    }
  },

  setBackendProfileId: (id: string | null) => {
    appStore.setState({ backendProfileId: id });
    try {
      if (id) localStorage.setItem(BACKEND_PROFILE_ID_KEY, id);
      else localStorage.removeItem(BACKEND_PROFILE_ID_KEY);
    } catch {
      // ignore
    }
  },

  setJournalEntries: (entries: JournalEntry[]) => {
    appStore.setState({ journalEntries: entries });
    try {
      localStorage.setItem(JOURNAL_ENTRIES_KEY, JSON.stringify(entries));
    } catch {
      // ignore
    }
  },

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useAppStore<T>(selector: (state: AppState) => T): T {
  return useSyncExternalStore(appStore.subscribe, () => selector(appStore.getState()));
}
