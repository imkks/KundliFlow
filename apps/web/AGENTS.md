# apps/web/AGENTS.md — Frontend Architecture & UX Map

Thin React 18 + Vite client (`apps/web`). All natal/varga/dasha/rule math is computed once on `@astro/api` and stored locally in `localStorage`.

> **Visual & Component Inventory:** See [`docs/UI_CONTENTS.md`](../../docs/UI_CONTENTS.md) for a screen-by-screen marker of every tab, modal, chart widget, CSS token, and Android parity binding.

## Entry & Onboarding Flow (`src/App.tsx`)
1. On mount, `fetchAuthMe()` validates `astro_auth_token_v1` against `GET /api/auth/me`.
2. **Step 1 (`!authUser`)**: Renders `<AuthOnboardingGate />` (`src/components/AuthOnboardingGate.tsx`) for Google OAuth or localhost dev login (`ALLOW_DEV_AUTH=true`).
3. **Step 2 (`authUser && !savedProfile`)**: Renders `<FirstVisitOnboarding />` (`src/components/FirstVisitOnboarding.tsx`) where users choose their starting Experience Lens + enter birth details.
4. **Main Workspace (`AppShell`)**: Wraps content in `<ReadingProvider>` (`src/context/ReadingContext.tsx`) and lazy-loads all secondary modals.

## 3-Persona Adaptive Experience (`src/context/ReadingContext.tsx`)
The engine's Level 2 `simple | standard | detailed` payload maps directly to the topbar lens switcher (`LENS_META`):
- **`simple` (`Guided`)**: AI-first & plain-English storytelling, simplified cards, quick life-event question builder.
- **`standard` (`Explorer`)**: Interactive chart navigation, Causal Pattern Decoder, Life Topics focus, clickable glossary popovers.
- **`detailed` (`Quant`)**: Full tables (`Degrees`, `Shadbala`, `Ashtakvarga`, `KP`, `Chalit`, `Varshaphal`), Rule IDs, strength scores, JSON/MD Dossier export.

## Primary Tabs & Responsibilities

| Tab ID | Sidebar Label | Component | Focus |
| :--- | :--- | :--- | :--- |
| `'today'` | `Today` | `src/tabs/TodayTab.tsx` | Hourly score curve, Moon Tara/Hora, Caution Windows, Life Topics strip, 1-tap mood check-in |
| `'kundli'` | `Kundli` *(featured)* | `src/tabs/KundliTab.tsx` | Hero Natal Banner, Life Topics grid, D1/D9 `NorthIndianChart` / `SouthIndianChart`, sticky Inspector |
| `'timing'` | `Timing` | `src/tabs/TimingTab.tsx` | Life Events Validator, active Mahadasha/Antardasha (`Vimshottari`, `Yogini`, `Chara`), Gochar & Double Transit, `CalendarExplorer` |
| `'strengths'` | `Yogas & Power` | `src/tabs/StrengthsTab.tsx` | 3 sub-tabs: Yogas & Patterns, Planetary Power (`ShadbalaTable`, `AshtakvargaTable`), Soul Drivers (`Karakas`, `Arudhas`, Harmonics) |
| `'journal'` | `Timeline` | `src/tabs/JournalTab.tsx` | Unified Life Milestones (`lifeEventsStore.ts`), `JournalExplorer`, `CalibrationExplorer` |

## Shared Navigation & Progressive Disclosure Modals
Coordinated from `ReadingContext.tsx` and mounted lazily inside `AppShell` (`src/App.tsx`):
- `LIFE_TOPICS` & `focusLifeTopic(id)`: Connects sidebar Quick Life Topics, `TodayTab`, `CommandPaletteModal`, and `KundliTab` (highlighting H10/D10, H7/D9, H2/D2, H4/D9, or Annual H1).
- `LifeEventModal.tsx` — AI life-event date validator & timeline persistence (`src/utils/lifeEventsStore.ts`).
- `PatternDecoderModal.tsx` — Step-by-step causal chain for Houses, Planets, and Yogas.
- `ChartSystemsModal.tsx` — Tabbed modal for Dual Transit (`DualKundliChart`), Bhava Chalit (`ChalitTable`), KP (`KpTable`), `SpecialLagnasAndVarshaphal`, and Birth Panchang/Avakahada.
- `QuantMatrixModal.tsx` — Expert calculation workbench (`Degrees & Vargas`, `Shadbala`, `Ashtakvarga & Maitri`, `Kakshya · Vedha · Navatara`, `24 Horas & Ghatak`).
- `DoshaAuditModal.tsx` — Cancelled Doshas (*Bhanga*) & verified absent doshas.
- `PlainEnglishExplainerModal.tsx` & `GlossaryTerm.tsx` — Accessible button glossary deep-linking into search terms.
- `CommandPaletteModal.tsx` (`⌘K` / `Ctrl+K`), `AskCopilotDrawer.tsx` (SSE streaming `/api/ask`), `OnboardingModal.tsx` (`mode: 'add' | 'edit'`), `LlmDossierModal.tsx`, `DataSovereigntyModal.tsx`, `ShareBlueprintModal.tsx`, `PrintableNatalReport.tsx`, `GoogleAuthModal.tsx`.

## Local-First Caching & `localStorage` Keys
Do not add redundant fetches on profile switching (`services/apiClient.ts`, `store/useAppStore.ts`):
- `astro_auth_token_v1` — JWT token
- `astro_active_profile_v1` — Active profile input JSON
- `astro_backend_profile_id_v1` — Currently selected backend profile ID (local persistence across reloads)
- `astro_server_bundle_v2_<profileId>` — `{ etag, bundle }` (`level1Static` + `level2Static`); returned immediately if `profileMatchesBundle()` passes and `!forceRecompute`
- `astro_server_today_v1_<profileId>` — Per-profile cached `/today` payload keyed by `profileId|dateStr|tzId|lat|lon`
- `astro_reading_depth_v1` — `'simple' | 'standard' | 'detailed'`
- `astro_chart_style_v1` — `'north' | 'south'`
- `astro_journal_entries_v1` / `astro_life_events_v1` / `astro_copilot_chat_v2_<profileId>`

## Styling & React Rules
- Global CSS & modal/lens/kundli styles live in `src/index.css` (custom properties `--bg-ink`, `--surface`, `--surface-alt`, `--gold`, `--teal`, `--amber`, `--text-main`, `--text-muted`).
- `useAppStore.ts` guards `appStore.setState` with `Object.is` per key. Still stabilize callbacks passed into `useEffect`-heavy child tabs with `useCallback` to prevent render loops.
