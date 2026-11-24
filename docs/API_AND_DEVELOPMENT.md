# API, Local Setup & Development Guide

Reference guide for running, configuring, testing, and deploying **KundliFlow (MyAstro)**.

---

## 1. Prerequisites & Local Development

- **Node.js**: `>= 20`
- **Package Manager**: `pnpm@9.15.0` via Corepack

```bash
corepack pnpm install
corepack pnpm test                      # Run all 19 Vitest files (102 tests)
corepack pnpm --filter @astro/api build # Build single-file Node API -> apps/api/dist/index.js
corepack pnpm --filter @astro/api start # Start API on http://localhost:8787
corepack pnpm --filter @astro/web dev   # Start Vite frontend on http://localhost:5173
```

---

## 2. Environment Variables (`.env` / `apps/web/.env.local`)

See [`.env.example`](../.env.example) for the complete template.

| Scope | Variable | Purpose |
| :--- | :--- | :--- |
| API (`apps/api`) | `PORT` | HTTP listen port (default `8787`) |
| API (`apps/api`) | `DB_PATH` | SQLite path (default `data/myastro.db`) |
| API (`apps/api`) | `JWT_SECRET` | HS256 secret for session JWT tokens |
| API (`apps/api`) | `GOOGLE_CLIENT_ID` | Google OAuth audience verification |
| API (`apps/api`) | `ALLOW_DEV_AUTH` | Enables `POST /api/auth/google` `{ devEmail, devName }` outside `NODE_ENV=production` |
| API (`apps/api`) | `EPHEMERIS_PROVIDER` | `'swisseph'` *(default)* or `'astronomy-engine'` |
| API (`apps/api`) | `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_MODEL` | Anthropic-compatible LLM client for Level 3 `/api/ask` |
| API (`apps/api`) | `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` | Alternative OpenAI-compatible LLM client |
| Web (`apps/web`) | `VITE_API_BASE_URL` / `VITE_API_URL` | Backend base URL (defaults to `http://localhost:8787`) |
| Web (`apps/web`) | `VITE_GOOGLE_CLIENT_ID` | Google Identity Services client ID |
| Web (`apps/web`) | `VITE_GOOGLE_MAPS_API_KEY` | Optional Google Places / Geocoding autocomplete key |

---

## 3. REST API Reference (`apps/api/src/routes/`)

| Method & Path | Description |
| :--- | :--- |
| `GET /health` | Service status, rule/topic counts, profile count, active ephemeris info |
| `GET /api/diagnostics/compare` | Live benchmark comparing `swisseph` vs `astronomy-engine` for given birth params |
| `POST /api/auth/google` | Verify Google ID token (or dev credentials if enabled), return JWT + user profiles |
| `GET /api/auth/me` | Return authenticated user + owned profile summaries |
| `GET /api/profiles` | List profiles for current user (or unowned profiles when unauthenticated) |
| `POST /api/profiles` | Create or update profile, recompute Level 1 + Level 2 snapshots, bump `bundleVersion` |
| `POST /api/profiles/:id/activate` | Set profile active flag in SQLite |
| `DELETE /api/profiles/:id` | Delete profile and cascaded snapshots/journals/chats/events |
| `GET /api/profiles/:id/bundle` | Fetch cached static bundle (`ETag` / `304 Not Modified`) |
| `GET /api/profiles/:id/today` | Compute & cache hourly scores, Panchang, Horas, transits, and month peaks |
| `GET /api/profiles/:id/calendar` | Month heatmap, year overview, and selected-date transits |
| `GET /api/profiles/:id/varshaphal` | Compute Tajika Varshaphal + Sahams, 12 Arudha Padas, 7 Upagrahas |
| `GET /api/profiles/:id/dashboard` | Raw profile + saved Level 1 / Level 2 snapshot |
| `GET /api/facts/:profileId/:factId` | Inspect raw chart fact and matching rule finding |
| `POST /api/reading` | Render Level 2 houses/planets reading (`simple`, `standard`, `detailed`) |
| `GET /api/conversations/:id` | Load persisted AI Copilot conversation messages |
| `POST /api/ask` | Grounded Level 3 AI Copilot (`Accept: text/event-stream` supported; falls back to `level2_fallback` if LLM fails) |
| `POST /api/sync` | Bidirectional delta sync for `journalEntries` and `lifeEvents` |
| `GET /api/journal/:profileId`, `POST /api/journal` | Read and create journal entries |

---

## 4. Testing, Typechecking & CI Checks

- **Test Suite (`corepack pnpm test`)**: Runs **19 test files (102 tests)** across `@astro/engine` (AstroSage fixture conformance, dashas, shadbala, ashtakvarga, sahams, navatara, ghatak, scoring), `@astro/facts`, `@astro/rules`, `@astro/kb`, `@astro/tools`, `@astro/agent`, and `@astro/app-core`.
- **Production Frontend Build (`corepack pnpm --filter @astro/web build`)**: Emits code-split JS/CSS chunks into `apps/web/dist/assets/`. CI verifies zero `*.wasm` files exist in `apps/web/dist/assets/`.
- **Web Typecheck (`corepack pnpm --filter @astro/web exec tsc --noEmit`)**: Currently reports 24 pre-existing diagnostics in 5 legacy files (`GooglePlaceAutocomplete.tsx`, `JournalExplorer.tsx`, `PrintableNatalReport.tsx`, `geolocationHelper.ts`, `googleMapsLoader.ts`).
