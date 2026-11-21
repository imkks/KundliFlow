# 05: Token-Efficient Codebase Navigation Map

This document is a complete, structured directory and file inventory of the **MyAstro** monorepo. It is designed to allow coding agents and engineers to rapidly locate functions, understand package boundaries, and complete tasks with minimal token consumption.

---

## 1. Monorepo Topology & Boundaries

```
MyAstro/
├── apps/
│   ├── api/            # Backend server (port 8787): Node.js, SQLite, Auth, AI Agent loop
│   └── web/            # Frontend (port 5173): React 18, Vite, Lucide icons, client charts
└── packages/
    ├── engine/         # Pure Jyotish astronomy, ephemeris, and natal math (zero I/O)
    ├── facts/          # Fact extraction, relational fact schema, in-memory chart.db
    ├── rules/          # Rule evaluator, strength weighting, linter, text renderer
    ├── kb/             # In-memory FTS5 knowledge store & topic router
    ├── content/        # Curated cities, rule YAMLs, lore YAMLs, scoring constants
    ├── tools/          # Tool server, VFS filesystem (/houses, /planets), EngineSession
    ├── agent/          # Multi-turn LLM reasoning loop, tool executor, evidence verifier
    ├── store/          # [ORPHANED] SQLite schema & repositories for offline PWA
    └── app-core/       # [ORPHANED] ClientCore use-case coordinator
```

---

## 2. Root Configurations & Scripts

| Path | Purpose | Key Details |
| :--- | :--- | :--- |
| `package.json` | Root workspace script definitions | Defines `test` (`vitest run`), `typecheck` (`tsc -b`). |
| `pnpm-workspace.yaml` | Declares workspace packages | `"packages/*"`, `"apps/*"`. |
| `tsconfig.base.json` | Base TS options inherited by all packages | `ES2022`, `Bundler`, `exactOptionalPropertyTypes: true`, `noUncheckedIndexedAccess: true`. |
| `tsconfig.json` | Composite project references root | References all 9 packages (omits `apps/api` and `apps/web`). |
| `vitest.config.ts` | Vitest testing configuration | Global test configuration matching `packages/*/test/*.test.ts`. |
| `render.yaml` | Render cloud deployment spec | Node 20 runtime, build command, `PORT: 8787`, `DB_PATH`. |
| `scripts/deploy-oracle.sh` | VM deployment script for Ubuntu | Automates Node 20 setup, PM2 process management, and Caddy reverse proxy. |

---

## 3. Backend API (`apps/api`)

| Path | Role | Key Exports / Responsibilities |
| :--- | :--- | :--- |
| `src/index.ts` | Process entrypoint | Reads `.env`, starts server on `PORT` (default 8787). |
| `src/server.ts` | Main HTTP dispatcher | 1002 lines. Handles auth, profiles, `/api/reading`, `/api/ask`, `/api/sync`. |
| `src/auth.ts` | JWT & Google OAuth | `signJwt`, `verifyJwt`, `extractAuthUser`, `verifyGoogleIdToken`. |
| `src/db.ts` | Application SQLite DB | `createAppDatabase`. Tables: `users`, `profiles`, `chart_snapshots`, `qa_messages`, `journal_entries`, `life_events`. |
| `src/level2Extras.ts` | L2 synthesized readings | Synthesizes overviews, vargas, upagrahas, yogini, muntha, and ghatak texts. |
| `src/noop-swisseph.ts` | Bundler alias stub | Stubs `@swisseph/browser` for esbuild bundling. |

---

## 4. Frontend Application (`apps/web`)

### 4.1 Shell, Context & Services
| Path | Role | Key Exports / Responsibilities |
| :--- | :--- | :--- |
| `src/main.tsx` | React DOM bootstrap | Mounts `<App />` under `#root` in StrictMode. |
| `src/App.tsx` | Main application shell | 1633 lines. Manages profile state, tabs, modals, topbar, and static bundle fetching. |
| `src/config.ts` | Environment config | `API_BASE_URL` (default `http://localhost:8787`), `GOOGLE_CLIENT_ID`. |
| `src/context/ReadingContext.tsx` | Reading state & tabs | `ReadingProvider`, `useReading`. Manages active tab, reading depth, drawer triggers. |
| `src/services/apiClient.ts` | REST API client | `fetchOrCreateStaticBundle`, `fetchTodaySky`, `syncDeltaWithServer`, `loginWithGoogleIdToken`. |
| `src/noop-swisseph.ts` | Vite alias stub | Stubs `@swisseph/browser` for browser builds. |

### 4.2 Tab Views (`apps/web/src/tabs/`)
| Path | Visual Tab | Contents |
| :--- | :--- | :--- |
| `TodayTab.tsx` | **Today** | 24-hr score bar, current hora score, birth panchang card, inauspicious windows. |
| `KundliTab.tsx` | **Kundli & Systems** | D1 chart, divisional vargas (D9, D10...), Sripati chalit table, KP sub-lords, house dossiers. |
| `TimingTab.tsx` | **Timing** | Vimshottari, Yogini, Chara dasha timelines, live transits, Sade Sati status, month calendar. |
| `StrengthsTab.tsx` | **Strengths & Yogas** | Shadbala strength bars, Ashtakvarga matrices (BAV/SAV), Yogas & Doshas, Friendship grid. |
| `JournalTab.tsx` | **Journal** | Daily subjective mood/energy logger, past reflections, statistical calibration explorer. |

### 4.3 Key Components (`apps/web/src/components/`)
| Component | Function | Status |
| :--- | :--- | :--- |
| `AskCopilotDrawer.tsx` | Slide-out AI assistant with SSE stream & evidence cards | Active |
| `AskAndReaderPanel.tsx` | Deprecated 1371-line legacy AI panel | **DEAD CODE (0 usages)** |
| `NorthIndianChart.tsx` | Classical diamond SVG Kundli renderer | Active |
| `SouthIndianChart.tsx` | Classical square SVG Kundli renderer | Active |
| `DualKundliChart.tsx` | Side-by-side comparison of D1 and divisional charts | Active |
| `AshtakvargaTable.tsx` | 8-planet BAV and SAV bindu score grid | Active |
| `ShadbalaTable.tsx` | 6-fold planetary strength metrics table | Active |
| `VimshottariExplorer.tsx` | Collapsible 3-tier Vimshottari dasha tree | Active |
| `YoginiExplorer.tsx` | 8-Yogini cycle dasha view | Active |
| `CharaExplorer.tsx` | Jaimini Chara sign-based dasha view | Active |
| `ChalitTable.tsx` | Bhava begin/mid degrees and cusp shifts | Active |
| `KpTable.tsx` | Krishnamurti Paddhati star and sub-lord table | Active |
| `CalendarExplorer.tsx` | Monthly peak score and caution day calendar | Active |
| `CalibrationExplorer.tsx` | Statistical correlation chart (user mood vs transits) | Active |
| `JournalExplorer.tsx` | Form for logging mood, energy, and notes | Active |
| `PrintableNatalReport.tsx` | Print-optimized stylesheet and multi-page natal summary | Active (nakshatra typo) |
| `CommandPaletteModal.tsx` | Spotlight quick-search modal (Cmd+K) | Active |
| `GoogleAuthModal.tsx` | Google One-Tap / OAuth sign-in modal | Active |
| `AuthOnboardingGate.tsx` | First-run gate encouraging account creation or demo mode | Active |
| `FirstVisitOnboarding.tsx` | Multi-step birth time and city entry wizard | Active |
| `GooglePlaceAutocomplete.tsx` | Geocoding input powered by Google Places API | Active |
| `DataSovereigntyModal.tsx` | LocalStorage export/import/wipe tool | Active |
| `ShareBlueprintModal.tsx` | Generates shareable plain-text astrological summary card | Active |
| `PlainEnglishExplainerModal.tsx` | 800-line glossary of Vedic astrology terminology | Active |
| `SpecialLagnasAndVarshaphal.tsx` | Solar return (Varshaphal) and Arudha pada display | Active |
| `FriendshipMatrix.tsx` | 5-fold compound planetary friendship table | Active |

---

## 5. Calculation Engine (`packages/engine`)

All calculation functions are pure, deterministic, and free of I/O or network calls.

### 5.1 Math, Angles & Ephemeris
- `src/angles.ts`: `norm360`, `angleDiff`, `signOf`, `nakshatraOf`, `dmsToDeg`, `degToDms`, `SIGNS`, `NAKSHATRAS`.
- `src/sidereal.ts`: `lahiriAyanamsaDeg`, `ayanamsaOffsetDeg` (Lahiri, Krishnamurti, Raman, Yukteshwar).
- `src/time/julian.ts`: `julianDayUt`.
- `src/time/resolve.ts`: `resolveBirthTime` (computes UTC instant and local mean time from wall clock & tz).
- `src/ephemeris/types.ts`: `EphemerisProvider`, `BodyState`, `ChartAngles`, `AyanamsaId`.
- `src/ephemeris/config.ts`: `DEFAULT_EPHEMERIS = 'swisseph'`.
- `src/ephemeris/registry.ts`: `loadEphemeris` (factory for SwissEph WASM and Astronomy-Engine).
- `src/ephemeris/adapters/swisseph.ts`: Swiss Ephemeris WASM adapter (Moshier model).
- `src/ephemeris/adapters/astronomy-engine.ts`: Astronomy-Engine MIT adapter.

### 5.2 Natal & Systems
- `src/natal/positions.ts`: `computePositions`, declares `NatalChart`, `NatalSettings`.
- `src/natal/types.ts`: `ALL_GRAHAS`, `VEDIC_GRAHAS`, `GrahaDetail`, `LagnaDetail`.
- `src/natal/digest.ts`: `createNatalDigest` (compact ~2KB chart snapshot).
- `src/natal/avakahada.ts`: `computeAvakahada` (paya, varna, yoni, gana, vasya, nadi).
- `src/natal/karakas.ts`: `computeCharaKarakas` (AK, AmK, BK, MK, PK, GK, DK).
- `src/natal/yogas.ts`: `detectYogasAndDoshas` (Raja, Dhana, Mahapurusha, Kuja, Kemadruma).
- `src/natal/bhavas.ts`: `computeBhavaAnalysis` (12 house dossiers).
- `src/natal/aspects.ts`: `computeMutualAspects` (angular separations, orbs, aspects).
- `src/natal/upagrahas.ts`: `computeUpagrahas` (7 classical shadow planets).
- `src/natal/arudha.ts`: `computeArudhaPadas` (AL, A1..A12).
- `src/natal/varshaphal.ts`: `computeVarshaphal` (solar return chart and Muntha).
- `src/natal/ashtakoota.ts`: `computeAshtakoota` (36-point marriage compatibility).
- `src/natal/llm-dossier.ts`: `compileLlmDossier` (markdown prompt grounding document).

### 5.3 Dashas, Strengths, Time Quality & Scoring
- `src/dasha/vimshottari.ts`: `computeVimshottariDashas` (120-year cycle tree).
- `src/dasha/yogini.ts`: `computeYoginiDashas` (36-year cycle tree).
- `src/dasha/chara.ts`: `computeCharaDashas` (Jaimini sign-based dasha).
- `src/kp/sublords.ts`: `calculateKpPlacement` (KP Star, Sub, Sub-Sub lords).
- `src/shadbala/index.ts`: `computeShadbala` (6 balas & ratio to requirement).
- `src/vargas/index.ts`: `calculateVargaSign`, `computeVargas` (D1..D60).
- `src/chalit/index.ts`: `computeSripatiChalit` (Sripati unequal house cusps).
- `src/ashtakvarga/index.ts`: `computeAshtakvarga` (BAV, SAV bindus).
- `src/panchang/index.ts`: `computePanchang` (Tithi, Vara, Nakshatra, Yoga, Karana).
- `src/timequality/suntimes.ts`: Sunrise and sunset calculator.
- `src/timequality/horas.ts`: `computeDayHoras` (24 horas) & `computeInauspiciousWindows` (Rahu Kalam, Yamaganda, Gulika).
- `src/transits/index.ts`: `computeTransits` (current Gochar & Sade Sati).
- `src/scoring/index.ts`: `calculateHourScore`, `buildDay`, `buildMonth`, `buildYear`.
- `src/scoring/builders.ts`: Benefic/malefic score factor builders.
- `src/calibration/index.ts`: Bootstrap confidence interval calibration engine.

---

## 6. Facts & Rules Packages

### `@astro/facts` (Relational Chart Model)
- `src/vocab.ts`: Normalized IDs for planets, signs, houses, nakshatras, dignity states, and friendship.
- `src/emitters.ts`: `emitChartFacts` (transforms `NatalChart` into discrete facts, edges, and periods).
- `src/workspace.ts`: `buildChartWorkspace` (creates in-memory SQLite `chart.db` workspace).

### `@astro/rules` (Declarative Rules)
- `src/schema.ts`: Zod schemas for rule definitions, condition trees, and modifiers.
- `src/evaluator.ts`: `evaluateRules` (evaluates rules against a `ChartWorkspace`).
- `src/aggregator.ts`: Selects top supportive and challenging findings by theme.
- `src/renderer.ts`: `renderHouse`, `renderPlanet`, `renderPeriod` (formats findings into user-facing text).
- `src/linter.ts`: Rule validation and linting tool.

---

## 7. Knowledge Base & Agent Packages

### `@astro/kb` (Knowledge Retrieval)
- `src/schema.ts`: Schemas for concepts, classical lore, and topic mappings.
- `src/store.ts`: `createKnowledgeBase` (in-memory SQLite FTS5 store for Jyotish lore and hybrid search).

### `@astro/tools` (Agent Tool Server)
- `src/server.ts`: Implements tools (`read`, `ls`, `find`, `inspect_varga`, `inspect_dashas`, `search_knowledge`, `inspect_muhurta`, etc.).
- `src/engine-session.ts`: `EngineSession` (caches calculation instances for active user chart).
- `src/vfs.ts`: Virtual file system navigating facts via URI paths (`/overview`, `/houses/:n`, `/planets/:p`).

### `@astro/agent` (LLM Orchestration)
- `src/loop.ts`: `runAgentQuery` (native tool-use loop with SSE streaming events).
- `src/llm.ts`: `createAnthropicCompatibleLlmClient`, `createOpenAiCompatibleLlmClient`.
- `src/router.ts`: `routeQuestion` (detects crisis, ethical blocks, greetings, and assigns themes).
- `src/verifier.ts`: `verifyComposedAnswer` (ensures all factual claims have verified evidence IDs).
- `src/types.ts`: `ComposedAnswer`, `AgentTraceEvent`, `AskResult`.

---

## 8. Data & Content (`packages/content`)

- `src/places.ts`: City validation schema and loader.
- `src/constants.ts`: Exports `SCORING_CONFIG`, `TEMPLATE_CARDS`, `FRIENDSHIP_TABLE`, `SAFETY_CONFIG` (read from `data.json`).
- `places/cities.json`: 22 pre-loaded cities with coordinates and timezones.
- `rules/*.yaml`: Classical rules for planetary placements, lordship, and dignity.
- `kb/*.yaml`: Classical Jyotish texts, nakshatra archetypes, and principles.
