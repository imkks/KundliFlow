export type LifeEventCategory = 'career' | 'relationship' | 'move' | 'health' | 'breakthrough';

export interface LifeEventItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  category: LifeEventCategory;
  notes?: string;
  createdAt?: string;
}

const LIFE_EVENTS_KEY = 'astro_life_events_v1';
const LIFE_EVENTS_CHANGE_EVENT = 'myastro:life-events-changed';

export function loadLifeEvents(): LifeEventItem[] {
  try {
    const raw = localStorage.getItem(LIFE_EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLifeEvents(events: LifeEventItem[]): void {
  try {
    localStorage.setItem(LIFE_EVENTS_KEY, JSON.stringify(events));
    window.dispatchEvent(new CustomEvent(LIFE_EVENTS_CHANGE_EVENT, { detail: events }));
  } catch {
    // ignore storage errors
  }
}

export function addLifeEvent(item: Omit<LifeEventItem, 'id' | 'createdAt'>): LifeEventItem[] {
  const existing = loadLifeEvents();
  const next: LifeEventItem[] = [
    {
      ...item,
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    },
    ...existing,
  ];
  saveLifeEvents(next);
  return next;
}

export function removeLifeEvent(id: string): LifeEventItem[] {
  const next = loadLifeEvents().filter((e) => e.id !== id);
  saveLifeEvents(next);
  return next;
}

export function subscribeLifeEvents(cb: (events: LifeEventItem[]) => void): () => void {
  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent<LifeEventItem[]>).detail;
    cb(Array.isArray(detail) ? detail : loadLifeEvents());
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === LIFE_EVENTS_KEY) cb(loadLifeEvents());
  };
  window.addEventListener(LIFE_EVENTS_CHANGE_EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(LIFE_EVENTS_CHANGE_EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}
