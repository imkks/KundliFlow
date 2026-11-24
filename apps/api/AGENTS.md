# apps/api/AGENTS.md — Backend API & SQLite Map

Node HTTP server (`@astro/api`) bundling all `@astro/*` workspace packages via `esbuild` into `apps/api/dist/index.js` while leaving native/data dependencies (`better-sqlite3`, `js-yaml`, `zod`, `@swisseph/browser`) external.

## Core Modules (`apps/api/src/`)
- `index.ts` — Loads `.env`, instantiates `createApiServer()`, starts listener on `PORT` (`8787`).
- `server.ts` — Initializes SQLite (`data/myastro.db` or `DB_PATH`), loads YAML rules (`packages/content/rules`), KB (`packages/content/kb/*.yaml` & `topics/topics.yaml`), ephemeris provider (`EPHEMERIS_PROVIDER || 'swisseph'`, falling back to `'astronomy-engine'` on init failure), LLM client (`ANTHROPIC_*` or `LLM_*`), and `aggregateLevel1And2()`.
- `db.ts` — `better-sqlite3` WAL database schema & repositories:
  - Tables: `users`, `profiles`, `chart_snapshots`, `qa_messages`, `journal_entries`, `life_events`, `daily_sky_cache`.
- `auth.ts` — Google ID token verification (`GOOGLE_CLIENT_ID`) + HS256 JWT signing/verification (`JWT_SECRET`) + dev token exchange (`NODE_ENV !== 'production' && ALLOW_DEV_AUTH === 'true'`).
- `level2Extras.ts` — Computes Level 2 interpretive extras (`chalitShifts`, `kpCusps`, `varshaphal` w/ `sahams`, `vargas`, `arudhas`, `upagrahas`, `sadeSati`, navatara/vedha/kakshya interpretations).
- `router/router.ts`, `router/types.ts` — Lightweight URL/method router with CORS & auth middleware.

## Route Files (`apps/api/src/routes/`)

| File | Endpoints | Notes |
| :--- | :--- | :--- |
| `health.ts` | `GET /health`, `GET /api/diagnostics/compare` | Active ephemeris diagnostics & Swisseph vs Astronomy Engine benchmark |
| `auth.ts` | `POST /api/auth/google`, `GET /api/auth/me` | Google OAuth or dev email login; lists owned profiles |
| `profiles.ts` | `GET /api/profiles`, `POST /api/profiles`, `POST /api/profiles/:id/activate`, `DELETE /api/profiles/:id`, `GET /api/profiles/:id/bundle`, `GET /api/profiles/:id/today`, `GET /api/profiles/:id/calendar`, `GET /api/profiles/:id/varshaphal`, `GET /api/profiles/:id/dashboard` | `POST /api/profiles` upserts profile, increments `bundle_version`, recomputes Level 1 & Level 2 (`simple`/`standard`/`detailed`), clears `daily_sky_cache`. `GET .../bundle` supports `If-None-Match` -> `304` |
| `reading.ts` | `GET /api/facts/:profileId/:factId`, `POST /api/reading` | Clickable fact/rule evidence lookup; Level 2 reading retrieval/evaluation |
| `chat.ts` | `GET /api/conversations/:id`, `POST /api/ask` | Q&A history + Level 3 `runAgentQuery` with `text/event-stream` SSE streaming |
| `journal.ts` | `POST /api/sync`, `GET /api/journal/:profileId`, `POST /api/journal` | Delta sync for journal entries & life events |

## Editing & Operational Notes
- Changing anything in `packages/*` or `apps/api/src/` requires rebuilding `apps/api` (`corepack pnpm --filter @astro/api build`) before restarting `node apps/api/dist/index.js`.
- Profile edits reusing an existing `id` go through `POST /api/profiles`, increment `bundle_version`, replace `chart_snapshots`, and invalidate `daily_sky_cache` automatically (`db.ts:saveSnapshot`).
- When LLM env vars (`ANTHROPIC_AUTH_TOKEN` + `ANTHROPIC_BASE_URL` or `LLM_API_KEY`) fail or are absent, `POST /api/ask` catches the error cleanly and returns `mode: 'level2_fallback'`.
