# 03: Dead Code & Redundancy Audit

This document inventories dead code, orphaned subsystems, duplicate rule files, and redundant network operations across the monorepo.

---

## 1. Dead Files & Unreferenced Components

### 1.1 Dead Component: `AskAndReaderPanel.tsx`
- **Location:** [apps/web/src/components/AskAndReaderPanel.tsx](file:///Users/krish/Developer/MyAstro/apps/web/src/components/AskAndReaderPanel.tsx)
- **Size:** **1,371 lines (58.9 KB)**
- **Audit:**
  ```bash
  grep -rn "AskAndReaderPanel" apps packages
  # Only matches its own file declaration (0 usages)
  ```
- **Context:** This was the original monolithic reading and chat drawer. It was superseded by the cleaner [AskCopilotDrawer.tsx](file:///Users/krish/Developer/MyAstro/apps/web/src/components/AskCopilotDrawer.tsx), but the 59 KB original file was never deleted.
- **Action:** Delete `apps/web/src/components/AskAndReaderPanel.tsx`.

---

### 1.2 Orphaned Package: `packages/app-core`
- **Audit:**
  ```bash
  grep -rn "@astro/app-core" apps packages
  # apps/web/package.json:12 (listed as dependency, never imported in src)
  # packages/app-core/package.json:2
  ```
- **Contents:**
  - `calc/local-calc-provider.ts`
  - `calc/types.ts`
  - `client-core.ts` (implements `ClientCore` coordinator)
  - `places/static-city-provider.ts`
  - `places/types.ts`
- **Context:** Originally built to satisfy Milestone 0 and spec §12.1 for a client-side Web Worker architecture. Neither `apps/web` nor `apps/api` ever imported it.
- **Action:** Either integrate `ClientCore` into the client architecture or deprecate/retire the package.

---

### 1.3 Orphaned Package: `packages/store`
- **Audit:**
  ```bash
  grep -rn "@astro/store" apps packages
  # packages/app-core/src/client-core.ts (orphaned package)
  # apps/web/package.json:15 (listed as dependency, never imported in src)
  ```
- **Contents:** Clean SQLite database schemas and repositories (`ProfileRepository`, `NatalChartRepository`, `JournalRepository`, `HourlyScoreRepository`).
- **Context:** When the backend API was created, developers implemented [apps/api/src/db.ts](file:///Users/krish/Developer/MyAstro/apps/api/src/db.ts) from scratch with a separate schema (`users`, `profiles`, `chart_snapshots`, `qa_messages`, `journal_entries`) instead of importing `@astro/store`.
- **Action:** Unify database layers. Either adopt `@astro/store` inside `apps/api` or remove `@astro/store`.

---

### 1.4 Dead DDL Table: `kb_embedding`
- **Location:** [packages/kb/src/store.ts#L40-L44](file:///Users/krish/Developer/MyAstro/packages/kb/src/store.ts#L40-L44)
- **Code:**
  ```sql
  CREATE TABLE IF NOT EXISTS kb_embedding (
    item_id TEXT PRIMARY KEY REFERENCES kb_item(id),
    model TEXT NOT NULL,
    vec BLOB NOT NULL
  );
  ```
- **Audit:** This table is declared in `KB_SCHEMA` but is never inserted into or queried anywhere in the repository. The application uses SQLite FTS5 for knowledge retrieval rather than vector embeddings.
- **Action:** Remove table declaration from `KB_SCHEMA` until vector embeddings are implemented.

---

## 2. Duplicate Rules & Shadowing Bug

### 2.1 `sample_rules.yaml` Overriding Production Rules
- **Location:** [packages/content/rules/sample_rules.yaml](file:///Users/krish/Developer/MyAstro/packages/content/rules/sample_rules.yaml)
- **Problem:** Contains 20 illustrative sample rules created during early testing. **16 rule IDs are identical** to rules in `dignity_and_yogas.yaml`, `lord_in_house.yaml`, and `planet_in_house.yaml`:
  - `dignity.saturn.debilitated`
  - `dignity.sun.own`
  - `lord.1.in.4`
  - `lord.10.in.12`
  - `lord.4.in.4`
  - `lord.7.in.3`
  - `lord.9.in.12`
  - `pih.jupiter.11`
  - `pih.ketu.10`
  - `pih.mars.3`
  - `pih.mercury.4`
  - `pih.moon.11`
  - `pih.rahu.4`
  - `pih.saturn.12`
  - `pih.sun.4`
  - `pih.venus.4`
- **Runtime Defect:** In [packages/rules/src/evaluator.ts#L48](file:///Users/krish/Developer/MyAstro/packages/rules/src/evaluator.ts#L48), files are loaded alphabetically with `sample_rules.yaml` sorted last:
  ```ts
  .sort((a, b) => (a === 'sample_rules.yaml' ? 1 : b === 'sample_rules.yaml' ? -1 : a.localeCompare(b)))
  ```
  Because rules are stored in a map `byId.set(r.id, r)`, the placeholder test statements and unreviewed modifiers in `sample_rules.yaml` **silently overwrite the real production rules**!
- **Action:** Delete `packages/content/rules/sample_rules.yaml` or move it to a dedicated `test/fixtures/` folder.

---

## 3. Redundant Network Operations

### 3.1 Duplicate Level 2 Reading Fetches
- In [apps/web/src/App.tsx#L1287](file:///Users/krish/Developer/MyAstro/apps/web/src/App.tsx#L1287), the app fetches the profile bundle:
  ```ts
  const { profileId, bundle } = await fetchOrCreateStaticBundle(...);
  // bundle.level2Static already contains simple, standard, and detailed readings!
  ```
- Inside [apps/web/src/context/ReadingContext.tsx#L167](file:///Users/krish/Developer/MyAstro/apps/web/src/context/ReadingContext.tsx#L167), `ReadingProvider` independently makes a separate request:
  ```ts
  fetch(`${apiBaseUrl}/api/reading`, {
    method: 'POST',
    body: JSON.stringify({ profileId, level: depth }),
  });
  ```
- **Consequence:** Double network requests and duplicate computation on every page load and profile switch.
- **Action:** Pass `bundle.level2Static` directly into `ReadingProvider` instead of initiating a redundant fetch.

---

## 4. Package Dependency & Packaging Inconsistencies

### 4.1 Unused `js-yaml` Dependency in `@astro/content`
- `packages/content/package.json` declares `"js-yaml": "^5.5.0"`.
- No file in `packages/content/src/` imports `js-yaml`. They import `data.json` via assertion.
- **Action:** Either implement a build script in `@astro/content` that uses `js-yaml` to compile YAMLs to JSON, or remove the dependency.

### 4.2 Phantom Dependencies in `apps/web/package.json`
- `apps/web/package.json` declares:
  - `"@astro/app-core": "workspace:*"`
  - `"@astro/store": "workspace:*"`
- Neither package is imported anywhere in `apps/web/src/`.
- **Action:** Remove both unused dependencies from `apps/web/package.json`.

---

## 5. Test Utilities in Production Source

### 5.1 `generateSyntheticTestEntries` in Engine Source
- **Location:** [packages/engine/src/calibration/index.ts#L271-L332](file:///Users/krish/Developer/MyAstro/packages/engine/src/calibration/index.ts#L271-L332)
- **Problem:** A 62-line synthetic data generator (`generateSyntheticTestEntries`) using `Math.random()` is exported from the core engine calculation module.
- **Action:** Relocate to `packages/engine/test/` or a dedicated test fixture utility module.
