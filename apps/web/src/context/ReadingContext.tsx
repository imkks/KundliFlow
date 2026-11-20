import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { NatalChart } from '@astro/engine';
import { API_BASE_URL } from '../config.ts';

export type MainTab = 'today' | 'kundli' | 'timing' | 'strengths' | 'journal';
export type ReadingDepth = 'simple' | 'standard' | 'detailed';

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
  const [askOpen, setAskOpen] = useState(false);
  const [askPrefill, setAskPrefill] = useState('');

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

  const retryReading = useCallback(() => {
    setRetryTick((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!natalChart) return;
    let cancelled = false;
    setReadingLoading(true);

    fetch(`${apiBaseUrl}/api/reading`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  }, [apiBaseUrl, profileId, natalChart, shadbala, ashtakvarga, dashas, transits, depth, retryTick]);

  return (
    <ReadingContext.Provider
      value={{
        depth,
        setDepth,
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
