import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { NatalChart, VargaType } from '@astro/engine';
import { API_BASE_URL } from '../config.ts';
import { authHeaders } from '../services/apiClient.ts';

export type MainTab = 'today' | 'kundli' | 'timing' | 'strengths' | 'journal';
export type ReadingDepth = 'simple' | 'standard' | 'detailed';
export type LifeTopicId = 'career' | 'love' | 'wealth' | 'health' | 'year';

export interface LifeTopicMeta {
  id: LifeTopicId;
  icon: string;
  label: string;
  shortLabel: string;
  house: number;
  varga: VargaType;
  tagline: string;
  askPrompt: string;
}

export const LIFE_TOPICS: LifeTopicMeta[] = [
  {
    id: 'career',
    icon: '💼',
    label: 'Career & Calling',
    shortLabel: 'Career',
    house: 10,
    varga: 'D10',
    tagline: 'Work, role & recognition',
    askPrompt: 'What does my 10th house, 10th lord, and D10 chart show about my career path and recognition?',
  },
  {
    id: 'love',
    icon: '💞',
    label: 'Love & Marriage',
    shortLabel: 'Love & Marriage',
    house: 7,
    varga: 'D9',
    tagline: 'Partnerships & commitment',
    askPrompt: 'What does my 7th house, Venus/Jupiter, and D9 Navamsha reveal about love and marriage?',
  },
  {
    id: 'wealth',
    icon: '💰',
    label: 'Wealth & Assets',
    shortLabel: 'Wealth',
    house: 2,
    varga: 'D2',
    tagline: 'Savings, income & property',
    askPrompt: 'How do my 2nd house, 11th house, and D2 Hora indicate wealth and financial growth?',
  },
  {
    id: 'health',
    icon: '🌿',
    label: 'Home & Inner Peace',
    shortLabel: 'Home & Peace',
    house: 4,
    varga: 'D9',
    tagline: 'Emotional roots & calm',
    askPrompt: 'What does my 4th house and Moon placement show for home, emotional peace, and resilience?',
  },
  {
    id: 'year',
    icon: '🗓',
    label: 'Year Ahead Cycle',
    shortLabel: 'Year Ahead',
    house: 1,
    varga: 'D9',
    tagline: 'Varshaphal Muntha & Dasha',
    askPrompt: 'What does my current Varshaphal year chart, Muntha, and active Dasha emphasize for the year ahead?',
  },
];

export const LENS_META: Record<
  ReadingDepth,
  {
    id: ReadingDepth;
    shortLabel: string;
    title: string;
    subtitle: string;
  }
> = {
  simple: {
    id: 'simple',
    shortLabel: 'Guided',
    title: 'Guided AI',
    subtitle: 'Plain English & life-event storytelling',
  },
  standard: {
    id: 'standard',
    shortLabel: 'Explorer',
    title: 'Chart Explorer',
    subtitle: 'Navigate patterns, houses & meanings',
  },
  detailed: {
    id: 'detailed',
    shortLabel: 'Quant',
    title: 'Quant Pro',
    subtitle: 'Full degrees, virupas, tables & systems',
  },
};

export type QuantMatrixTabId = 'degrees' | 'shadbala' | 'ashtakvarga' | 'radars' | 'horas';
export type ChartSystemTabId = 'dual' | 'bhavas' | 'kp' | 'varshaphal' | 'birth';

export type PatternTarget =
  | { kind: 'house'; house: number }
  | { kind: 'planet'; planet: string }
  | { kind: 'yoga'; yoga: any };

export interface GlossaryRequest {
  category?: string;
  term?: string;
}

export interface LifeEventPreset {
  title?: string;
  date?: string;
  category?: 'career' | 'relationship' | 'move' | 'health' | 'breakthrough';
}

export interface ReadingData {
  overview?: {
    coreNature: string;
    soulAndCareer: string;
    currentChapter: string;
    topStrengthAndWatch: string;
  };
  houses: any[];
  planets: any[];
  dashas: any[];
  transits?: {
    sadeSati: any;
    planets: any[];
  };
  yogas?: any[];
  strengths?: {
    planets: any[];
    savTopSigns: { sign: string; bindus: number }[];
  };
  specials?: {
    karakas: any[];
    vargas: any[];
    arudhas: any[];
    ghatak: any;
    upagrahas: any[];
  };
  panchang?: {
    natal: any;
    avakahada: any;
    todayMoon: any;
  };
  extendedDashas?: {
    yogini: any;
    chara: any;
  };
  kundliExtras?: {
    chalitShifts: any[];
    kpCusps: any[];
    varshaphal: any;
  };
}

interface ReadingContextValue {
  depth: ReadingDepth;
  setDepth: (d: ReadingDepth) => void;
  isGuided: boolean;
  isExplorer: boolean;
  isQuant: boolean;
  reading: ReadingData | null;
  readingLoading: boolean;
  apiOffline: boolean;
  retryReading: () => void;
  selectedHouse: number;
  setSelectedHouse: (h: number) => void;
  selectedPlanet: string;
  setSelectedPlanet: (p: string) => void;
  askOpen: boolean;
  setAskOpen: (open: boolean) => void;
  askPrefill: string;
  openAskDrawer: (prefill?: string) => void;
  activeTab: MainTab;
  setActiveTab: (t: MainTab) => void;
  activeTopic: LifeTopicId | null;
  setActiveTopic: (t: LifeTopicId | null) => void;
  focusLifeTopic: (t: LifeTopicId) => void;
  // Shared modal coordinators (progressive disclosure without page clutter)
  patternTarget: PatternTarget | null;
  openPatternDecoder: (target: PatternTarget) => void;
  closePatternDecoder: () => void;
  lifeEventModalOpen: boolean;
  lifeEventPreset: LifeEventPreset | null;
  openLifeEventModal: (preset?: LifeEventPreset) => void;
  closeLifeEventModal: () => void;
  quantMatrixTab: QuantMatrixTabId | null;
  openQuantMatrix: (tab?: QuantMatrixTabId) => void;
  closeQuantMatrix: () => void;
  chartSystemsTab: ChartSystemTabId | null;
  openChartSystems: (tab?: ChartSystemTabId) => void;
  closeChartSystems: () => void;
  doshaAuditOpen: boolean;
  setDoshaAuditOpen: (open: boolean) => void;
  glossaryRequest: GlossaryRequest | null;
  openGlossaryModal: (req?: GlossaryRequest) => void;
  closeGlossaryModal: () => void;
}

const ReadingContext = createContext<ReadingContextValue | null>(null);

const DEPTH_STORAGE_KEY = 'astro_reading_depth_v1';
const VALID_TABS: MainTab[] = ['today', 'kundli', 'timing', 'strengths', 'journal'];

function parseHashTab(): MainTab {
  try {
    const raw = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    if (VALID_TABS.includes(raw as MainTab)) return raw as MainTab;
  } catch {
    // ignore
  }
  return 'today';
}

interface ReadingProviderProps {
  apiBaseUrl?: string;
  profileId: string | null;
  natalChart: NatalChart | null;
  shadbala: any;
  ashtakvarga: any;
  dashas: any;
  transits: any;
  serverLevel2?: any;
  children: React.ReactNode;
}

export const ReadingProvider: React.FC<ReadingProviderProps> = ({
  apiBaseUrl = API_BASE_URL,
  profileId,
  natalChart,
  shadbala,
  ashtakvarga,
  dashas,
  transits,
  serverLevel2,
  children,
}) => {
  const [depth, setDepthState] = useState<ReadingDepth>(() => {
    try {
      const saved = localStorage.getItem(DEPTH_STORAGE_KEY);
      if (saved === 'simple' || saved === 'standard' || saved === 'detailed') return saved;
    } catch {
      // ignore
    }
    return 'standard';
  });

  const [activeTab, setActiveTabState] = useState<MainTab>(parseHashTab);
  const [reading, setReading] = useState<ReadingData | null>(null);
  const [readingLoading, setReadingLoading] = useState(false);
  const [apiOffline, setApiOffline] = useState(false);
  const [retryTick, setRetryTick] = useState(0);

  const [selectedHouse, setSelectedHouse] = useState<number>(1);
  const [selectedPlanet, setSelectedPlanet] = useState<string>('sun');
  const [activeTopic, setActiveTopic] = useState<LifeTopicId | null>(null);
  const [askOpen, setAskOpen] = useState(false);
  const [askPrefill, setAskPrefill] = useState('');

  // Shared Modals State
  const [patternTarget, setPatternTarget] = useState<PatternTarget | null>(null);
  const [lifeEventModalOpen, setLifeEventModalOpen] = useState(false);
  const [lifeEventPreset, setLifeEventPreset] = useState<LifeEventPreset | null>(null);
  const [quantMatrixTab, setQuantMatrixTab] = useState<QuantMatrixTabId | null>(null);
  const [chartSystemsTab, setChartSystemsTab] = useState<ChartSystemTabId | null>(null);
  const [doshaAuditOpen, setDoshaAuditOpen] = useState(false);
  const [glossaryRequest, setGlossaryRequest] = useState<GlossaryRequest | null>(null);

  const setDepth = useCallback((d: ReadingDepth) => {
    setDepthState(d);
    try {
      localStorage.setItem(DEPTH_STORAGE_KEY, d);
    } catch {
      // ignore
    }
  }, []);

  const setActiveTab = useCallback((t: MainTab) => {
    setActiveTabState(t);
    try {
      if (window.location.hash !== `#/${t}`) {
        window.location.hash = `#/${t}`;
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => setActiveTabState(parseHashTab());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const openAskDrawer = useCallback((prefill?: string) => {
    if (prefill) setAskPrefill(prefill);
    setAskOpen(true);
  }, []);

  const focusLifeTopic = useCallback((topicId: LifeTopicId) => {
    const meta = LIFE_TOPICS.find((t) => t.id === topicId);
    setActiveTopic(topicId);
    if (meta) setSelectedHouse(meta.house);
    setActiveTab('kundli');
  }, [setActiveTab]);

  const retryReading = useCallback(() => {
    setRetryTick((n) => n + 1);
  }, []);

  const openPatternDecoder = useCallback((target: PatternTarget) => setPatternTarget(target), []);
  const closePatternDecoder = useCallback(() => setPatternTarget(null), []);

  const openLifeEventModal = useCallback((preset?: LifeEventPreset) => {
    setLifeEventPreset(preset ?? null);
    setLifeEventModalOpen(true);
  }, []);
  const closeLifeEventModal = useCallback(() => {
    setLifeEventModalOpen(false);
    setLifeEventPreset(null);
  }, []);

  const openQuantMatrix = useCallback((tab: QuantMatrixTabId = 'degrees') => setQuantMatrixTab(tab), []);
  const closeQuantMatrix = useCallback(() => setQuantMatrixTab(null), []);

  const openChartSystems = useCallback((tab: ChartSystemTabId = 'dual') => setChartSystemsTab(tab), []);
  const closeChartSystems = useCallback(() => setChartSystemsTab(null), []);

  const openGlossaryModal = useCallback((req?: GlossaryRequest) => {
    setGlossaryRequest(req ?? {});
  }, []);
  const closeGlossaryModal = useCallback(() => setGlossaryRequest(null), []);

  useEffect(() => {
    if (serverLevel2 && serverLevel2[depth] && Array.isArray(serverLevel2[depth].houses)) {
      setReading(serverLevel2[depth]);
      setReadingLoading(false);
      setApiOffline(false);
      return;
    }

    if (!natalChart) return;
    let cancelled = false;
    setReadingLoading(true);

    fetch(`${apiBaseUrl}/api/reading`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(
        profileId
          ? { profileId, level: depth }
          : {
              natal: natalChart,
              shadbala,
              ashtakvarga,
              dashas,
              transits,
              level: depth,
            },
      ),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!cancelled && Array.isArray(data?.houses)) {
          setReading(data);
          setApiOffline(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApiOffline(true);
        }
      })
      .finally(() => {
        if (!cancelled) setReadingLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, profileId, natalChart, shadbala, ashtakvarga, dashas, transits, depth, retryTick, serverLevel2]);

  return (
    <ReadingContext.Provider
      value={{
        depth,
        setDepth,
        isGuided: depth === 'simple',
        isExplorer: depth === 'standard',
        isQuant: depth === 'detailed',
        reading,
        readingLoading,
        apiOffline,
        retryReading,
        selectedHouse,
        setSelectedHouse,
        selectedPlanet,
        setSelectedPlanet,
        askOpen,
        setAskOpen,
        askPrefill,
        openAskDrawer,
        activeTab,
        setActiveTab,
        activeTopic,
        setActiveTopic,
        focusLifeTopic,
        patternTarget,
        openPatternDecoder,
        closePatternDecoder,
        lifeEventModalOpen,
        lifeEventPreset,
        openLifeEventModal,
        closeLifeEventModal,
        quantMatrixTab,
        openQuantMatrix,
        closeQuantMatrix,
        chartSystemsTab,
        openChartSystems,
        closeChartSystems,
        doshaAuditOpen,
        setDoshaAuditOpen,
        glossaryRequest,
        openGlossaryModal,
        closeGlossaryModal,
      }}
    >
      {children}
    </ReadingContext.Provider>
  );
};

export function useReading() {
  const ctx = useContext(ReadingContext);
  if (!ctx) throw new Error('useReading must be used inside ReadingProvider');
  return ctx;
}
