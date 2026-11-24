# AGENTS.md — KundliFlow (MyAstro) Repository Map

Fast orientation for coding agents working in this monorepo (`pnpm` workspaces, TypeScript, Node >= 20).

## Architecture at a Glance
- **Server-Compute-Once Backend (`apps/api`)**: Executes Swiss Ephemeris WASM (`@swisseph/browser`) + deterministic Parashari/Jaimini/KP calculations (`@astro/engine`), rule evaluation (`@astro/rules`), and Level 3 AI Copilot (`@astro/agent`) on Node.js, persisting snapshots in SQLite (`data/myastro.db`).
- **Local-First Thin Web Client (`apps/web`)**: Vite + React 18 UI backed by `localStorage` caching (`ETag` + bundle cache). **Must ship zero `.wasm` files** in `apps/web/dist/assets/`.
- **Shared Packages (`packages/*`)**: Workspace ESM packages exported directly as `.ts` entrypoints (`"exports": { ".": "./src/index.ts" }`).

## Repository Map

| Path | Package Name | Purpose |
| :--- | :--- | :--- |
| `apps/api/` | `@astro/api` | Node HTTP API server (`esbuild` -> `apps/api/dist/index.js`) & SQLite persistence (`db.ts`) |
| `apps/web/` | `@astro/web` | React 18 / Vite frontend (`src/App.tsx`, tabs, modals, stores) |
| `packages/engine/` | `@astro/engine` | Deterministic Vedic calculations (positions, dashas, shadbala, ashtakvarga, vargas, kp, transits, yogas, scoring) |
| `packages/facts/` | `@astro/facts` | In-memory SQLite `ChartWorkspace` graph of natal/transit facts & edges |
| `packages/rules/` | `@astro/rules` | Evaluates 537 YAML rules (`packages/content/rules/`) and renders `simple` / `standard` / `detailed` readings |
| `packages/content/` | `@astro/content` | YAML rules, topics, KB lore, strength weights, and `places/cities.json` |
| `packages/kb/` | `@astro/kb` | SQLite FTS knowledge base ingesting YAML concepts/lore/nakshatras |
| `packages/tools/` | `@astro/tools` | `EngineSession` + `chart.db` VFS (`ToolServer`) used by `@astro/agent` |
| `packages/agent/` | `@astro/agent` | Multi-turn tool-calling agent (`runAgentQuery`), citation verifier, and `level2_fallback` |
| `packages/store/` | `@astro/store` | Shared SQLite repository schema/helpers |
| `packages/app-core/` | `@astro/app-core` | Offline client-core pipeline & `PlaceProvider` (`StaticCityProvider`) |
| `fixtures/` | — | Golden AstroSage reference fixture (`sample-1998-09-07-jamshedpur`) for conformance tests |

See deeper maps before editing specific subsystems:
- [`apps/web/AGENTS.md`](apps/web/AGENTS.md) — UI tabs, 3-Lens UX state, modals, caching & `localStorage` keys
- [`apps/api/AGENTS.md`](apps/api/AGENTS.md) — HTTP routes, SQLite schema, ephemeris loading, auth & AI endpoint
- [`packages/AGENTS.md`](packages/AGENTS.md) — Engine modules, facts/rules pipeline, and agent verification loop
- Human docs: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/UX_PRODUCT_GUIDE.md`](docs/UX_PRODUCT_GUIDE.md), [`docs/UI_CONTENTS.md`](docs/UI_CONTENTS.md), [`docs/API_AND_DEVELOPMENT.md`](docs/API_AND_DEVELOPMENT.md)

## Commands & Verification

```bash
corepack pnpm test                      # Run all 19 Vitest files (102 tests) across packages
corepack pnpm --filter @astro/api build # Bundle apps/api/dist/index.js with esbuild
corepack pnpm --filter @astro/api start # Start API server on http://localhost:8787
corepack pnpm --filter @astro/web dev   # Start Vite dev server on http://localhost:5173
corepack pnpm --filter @astro/web build # Production build into apps/web/dist/
corepack pnpm --filter @astro/web exec tsc --noEmit
```

## Non-Negotiable Invariants & Gotchas
1. **Zero WASM in `apps/web/dist/assets/`**: CI (`.github/workflows/build-and-deploy.yml`) fails if any `*.wasm` asset lands in `apps/web/dist/assets/`. `apps/web/vite.config.ts` aliases `@swisseph/browser` to `apps/web/src/noop-swisseph.ts`. Never import browser Swiss Ephemeris WASM directly in web runtime code.
2. **Chart data shape (`GrahaDetail`)**: Planet house positions live under `graha.houses.houseFromLagna` and `graha.houses.houseFromMoon` (see `packages/engine/src/natal/positions.ts`), **not** top-level `graha.houseFromLagna`.
3. **`calculateVargaSign` signature**: Takes string Varga ID (`'D1' | 'D2' | ... | 'D60'`), never a numeric divisional factor (`9`).
4. **Local-first profile cache vs edits**: `fetchOrCreateStaticBundle()` in `apps/web/src/services/apiClient.ts` returns cached `localStorage` bundles when inputs match `profileMatchesBundle(...)` and `forceRecompute` is false. Editing a profile in `App.tsx` **must** set `forceRecompute` and call `clearTodaySkyCache(...)` so `POST /api/profiles` recalculates on the server.
5. **Pre-existing `tsc --noEmit` baseline in `apps/web`**: Currently `24` pre-existing errors exist across 5 legacy files (`GooglePlaceAutocomplete.tsx`, `JournalExplorer.tsx`, `PrintableNatalReport.tsx`, `geolocationHelper.ts`, `googleMapsLoader.ts`). Any new/edited web file must introduce **0** TS errors.
6. **External dependencies in `packages/*`**: Packages export `.ts` directly via `workspace:*`; `esbuild` bundles `apps/api` while keeping `better-sqlite3`, `js-yaml`, `zod`, and `@swisseph/browser` external.
