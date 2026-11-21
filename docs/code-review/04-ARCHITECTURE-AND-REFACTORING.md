# 04: Architecture & Refactoring Roadmap

This document analyzes architectural drift between the original specification and current implementation, providing actionable recommendations to modernize the monorepo.

---

## 1. Architectural Drift Analysis

### The Original Specification (Spec §12 & `docs/DECISIONS.md` D1)
- **Goal:** Static PWA (Web-First) with zero server infrastructure costs.
- **Design:** Planetary coordinates, dashas, scoring, and SQLite database running in an in-browser Web Worker.
- **Layering:** UI -> `packages/app-core` (`ClientCore`) -> `packages/store` (SQLite repositories) -> `packages/engine`.

### The Current Reality
- An express/http server was introduced at `apps/api/` to host the DeepAgent LLM loop, Google OAuth, and database sync.
- Over time, backend developers implemented chart caching, panchang, scoring, and rules directly inside `apps/api/src/server.ts` and `apps/api/src/level2Extras.ts`.
- `apps/api` built its own ad-hoc SQLite layer ([apps/api/src/db.ts](file:///Users/krish/Developer/MyAstro/apps/api/src/db.ts)), completely ignoring `packages/store`.
- Meanwhile, `apps/web` retains client-side calculations for several tabs (`InterpretationsGuide.tsx`, `NorthIndianChart.tsx`, `SouthIndianChart.tsx`) while simultaneously calling `apps/api` for static bundles and today's sky.

```mermaid
graph LR
  subgraph Original Design (D1)
    UI1[apps/web] --> APPCORE1[packages/app-core]
    APPCORE1 --> STORE1[packages/store]
    APPCORE1 --> ENG1[packages/engine]
  end

  subgraph Current Hybrid State
    UI2[apps/web] -->|HTTP| API2[apps/api]
    API2 --> DB2[apps/api/src/db.ts]
    API2 --> ENG2[packages/engine]
    API2 --> FACTS2[packages/facts]
    API2 --> RULES2[packages/rules]
    API2 --> AGENT2[packages/agent]
    UI2 --> ENG2
    ORPHAN1[packages/app-core] -.->|Unused| UI2
    ORPHAN2[packages/store] -.->|Unused| API2
  end
```

---

## 2. Strategic Architectural Recommendations

### Recommendation A: Standardize on the Client-Server Architecture (Recommended)
Since user authentication (Google Sign-In), cloud persistence, and multi-turn LLM reasoning with prompt grounding are core features, standardizing on the Client-Server model is the most practical path forward:

1. **Unify Database Layer into `@astro/store`:**
   - Migrate `users`, `chart_snapshots`, `life_events`, and `qa_messages` from `apps/api/src/db.ts` into `packages/store/src/schema.ts`.
   - Have `apps/api` import `@astro/store` repositories. Delete `apps/api/src/db.ts`.
2. **Retire or Repurpose `@astro/app-core`:**
   - Either remove `packages/app-core` or re-purpose it as a shared client SDK (`@astro/client`) that encapsulates `apiClient.ts` and React query hooks.
3. **Modernize `apps/api/src/server.ts` with Hono or Fastify:**
   - `server.ts` currently hand-rolls an HTTP router using regex matching and manual JSON parsing across 1,002 lines.
   - Switching to [Hono](https://hono.dev/) or Fastify will provide typed routing, middleware, SSE streaming, and cleaner CORS handling with less boilerplate.

---

### Recommendation B: Refactor Web State Management (`App.tsx`)
[apps/web/src/App.tsx](file:///Users/krish/Developer/MyAstro/apps/web/src/App.tsx) currently spans **1,633 lines** and manages over 35 distinct `useState` hooks. 

**Recommended Action:**
1. Introduce **Zustand** or a React Context Reducer:
   ```ts
   interface ProfileState {
     activeProfile: UserProfileInput;
     savedProfiles: ServerProfileSummary[];
     chartStyle: 'north' | 'south';
     selectedVarga: VargaType;
     setProfile: (p: UserProfileInput) => void;
     switchProfile: (id: string) => void;
   }
   ```
2. Split `App.tsx` into modular subcomponents:
   - `AppHeader.tsx` (topbar, search trigger, profile menu)
   - `ModalContainer.tsx` (onboarding, print report, command palette, auth modal)
   - `ActiveTabView.tsx` (tab renderer)

---

### Recommendation C: Unify Content Pipeline & Single Source of Truth
Currently, `@astro/content` has source YAML files (`scoring.yaml`, `friendship.yaml`, `safety.yaml`) that are never read by the runtime; the runtime reads a hardcoded snapshot `data.json`.

**Recommended Action:**
1. Add a pre-build script to `packages/content`:
   ```json
   "scripts": {
     "build": "node scripts/compile-content.js"
   }
   ```
2. The script parses all YAML files with `js-yaml`, validates them with Zod, and outputs typed TypeScript or JSON constants.
3. Centralize text explanations from `level2Extras.ts` and `PlainEnglishExplainerModal.tsx` into `packages/content/kb/`.

---

## 3. Staged Refactoring Roadmap

```
Phase 1: Integrity & Critical Bugs (1-2 Days)
├── Fix property typos (starLord, vasya, elapsedFraction, nakshatra)
├── Fix missing NatalChart import paths
├── Resolve exactOptionalPropertyTypes mismatches
└── Verify ./node_modules/.bin/tsc -b exits 0

Phase 2: Dead Code & Security Cleanup (2-3 Days)
├── Delete apps/web/src/components/AskAndReaderPanel.tsx
├── Remove duplicate rule definitions from sample_rules.yaml
├── Remove unused workspace dependencies in apps/web/package.json
├── Fix esbuild path in apps/api/package.json
├── Guard Google ID token audience verification
└── Honor process.env.DB_PATH in server.ts

Phase 3: Subsystem Consolidation (3-5 Days)
├── Unify apps/api/src/db.ts into packages/store
├── Add automated YAML compile step in packages/content
├── Consolidate SIGN_LORDS and house labels into @astro/engine
└── Eliminate duplicate POST /api/reading in ReadingContext

Phase 4: Architecture Modernization (5-7 Days)
├── Migrate server.ts to Hono/Fastify
└── Refactor App.tsx state with Zustand and modularize shell
```
