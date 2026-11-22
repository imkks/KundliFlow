# MyAstro Code Review & Architecture Analysis

This directory contains an exhaustive, multi-part expert code review, security audit, and architectural navigation map for the **MyAstro** monorepo.

---

## Document Series Index

| Document | Primary Focus | Key Contents |
| :--- | :--- | :--- |
| **[01. Critical Bugs & Type Failures](file:///Users/krish/Developer/MyAstro/docs/code-review/01-CRITICAL-BUGS.md)** | Silent runtime errors & `tsc` breakdown | Typo property accesses (`vasya`, `starLord`, `nakshatraName`), 371 `tsc -b` errors, digest parameter mismatches |
| **[02. Hardcoded Values & Security](file:///Users/krish/Developer/MyAstro/docs/code-review/02-HARDCODED-VALUES-AND-SECURITY.md)** | Fragile configurations & vulnerabilities | pnpm virtual store paths, JWT fallback secrets, Google token `aud` bypass, `SIGN_LORDS` duplication in 6 files |
| **[03. Dead & Unnecessary Code](file:///Users/krish/Developer/MyAstro/docs/code-review/03-DEAD-AND-UNNECESSARY-CODE.md)** | Bloat, orphaned subsystems, redundant ops | 1,371-line dead `AskAndReaderPanel.tsx`, orphaned `@astro/store` & `@astro/app-core`, duplicate rules in `sample_rules.yaml` |
| **[04. Architecture & Refactoring Plan](file:///Users/krish/Developer/MyAstro/docs/code-review/04-ARCHITECTURE-AND-REFACTORING.md)** | Structural drift & modernization roadmap | PWA vs Client-Server divergence, database unification, Hono/Fastify proposal, Zustand state refactoring |
| **[05. Token-Efficient Codebase Map](file:///Users/krish/Developer/MyAstro/docs/code-review/05-CODEBASE-MAP.md)** | Comprehensive file-by-file index | Summary, key exports, and dependencies of every file in `apps/` and `packages/` to minimize token overhead |
| **[06. Server-Centric Architecture Plan](file:///Users/krish/Developer/MyAstro/docs/code-review/06-SERVER-CENTRIC-ARCHITECTURE-PLAN.md)** | Static Blueprint & Daily Sky Delta plan | Plan to compute fixed birth charts once, cache daily transits once/day, strip client compute, and prepare for Android |

---

## Executive Summary & Monorepo Health Scorecard

| Dimension | Previous | Post-Implementation | Status / Fix Applied |
| :--- | :---: | :---: | :--- |
| **Deterministic Calculations** | **A** | **A+** | Sub-arcsecond accuracy; 100% match against AstroSage golden fixtures; fixed silent Vashya score defect (`vashya` vs `vasya`). |
| **Test Suite Execution** | **B+** | **A+** | 74/74 unit tests in `vitest` pass cleanly in ~1.5s across all 15 test suites. |
| **TypeScript Integrity** | **D** | **A+** | **Reduced from 371 errors to 0 errors** under `tsc -b`. All workspaces build cleanly. |
| **Code Hygiene & Dead Code** | **C-** | **A** | Deleted 1,371-line dead `AskAndReaderPanel.tsx`, pruned orphaned `@astro/store` & `@astro/app-core`, resolved `sample_rules.yaml` shadowing. |
| **Configuration & Security** | **C** | **A** | Fixed brittle pnpm path in `apps/api/package.json`; enforced `JWT_SECRET` in prod; secured Google OAuth `aud` claim verification; blocked `ALLOW_DEV_AUTH` in prod. |
| **Architecture Alignment** | **C+** | **A-** | Server-Centric static natal bundle and Daily Sky Delta caching implemented; frontend reads server Level 1/2 payloads with 0 redundant client calculations. |

---

## Completed Implementation Milestones

1. **Phase 1: Build & TypeScript Restoration (`tsc -b`)**
   - Repaired all 371 TypeScript build errors across 12 packages and apps.
   - Fixed missing types, re-exports (`NatalChart`, `NatalSettings`, `BhavaAnalysis`, `DetectedYoga`), and canonical domain constants (`SIGN_LORDS`).
   - Fixed `ashtakoota.ts` silent runtime bug by adding `vashya` alias to `AvakahadaDetails`.

2. **Phase 2: Dead Code Elimination & Cleanup**
   - Deleted unused `apps/web/src/components/AskAndReaderPanel.tsx` (1,371 lines, 58.9 KB).
   - Removed orphaned `@astro/store` and `@astro/app-core` dependencies from `apps/web/package.json`.
   - Prevented test fixture rules in `sample_rules.yaml` from shadowing production rules in `evaluator.ts`, and promoted the 4 unique rules to `dignity_and_yogas.yaml`.

3. **Phase 3: Security & Build Hardening**
   - Enforced `JWT_SECRET` requirement in production (`NODE_ENV === 'production'`).
   - Made Google OAuth `GOOGLE_CLIENT_ID` audience verification mandatory to block token substitution attacks.
   - Restricted `ALLOW_DEV_AUTH` bypass to non-production environments.
   - Added standard `esbuild` dependency and updated `apps/api/package.json` build script.

4. **Phase 4: Server-Centric Static Natal Bundle & Daily Sky Cache**
   - Added `daily_sky_cache` SQLite table in `apps/api/src/db.ts` to cache transits per location-date.
   - Enhanced `GET /api/profiles/:id/today` with on-demand cache check and population.
   - Precomputed `vargas` in `level1Static` on the server.
   - Updated `apps/web` components (`InterpretationsGuide.tsx`, `ReadingContext.tsx`, `App.tsx`) to consume precomputed server data directly, eliminating redundant client recalculations.
