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

---

## Executive Summary & Monorepo Health Scorecard

| Dimension | Rating | Summary |
| :--- | :---: | :--- |
| **Deterministic Calculations** | **A** | Sub-arcsecond accuracy, conforms to AstroSage golden fixtures across SwissEph & Astronomy-Engine. |
| **Test Suite Execution** | **B+** | 74 unit tests in `vitest` pass in ~1.5s, covering positions, dashas, ashtakvarga, and agent tools. |
| **TypeScript Integrity** | **D** | **Fails with 371 errors** under `tsc -b` due to outdated types, import path errors, and strict flag mismatches. |
| **Code Hygiene & Dead Code** | **C-** | ~1,500 lines of dead components/tables, 2 orphaned packages, and duplicate YAML rules. |
| **Configuration & Security** | **C** | Hardcoded pnpm paths in build scripts, default dev secrets, and unverified Google OAuth token audiences. |
| **Architecture Alignment** | **C+** | Diverged from the original Web Worker static PWA spec (D1) into a hybrid client/server setup without retiring legacy layers. |

---

## Recommended Next Steps

1. **Immediate Execution:** Follow [01-CRITICAL-BUGS.md](file:///Users/krish/Developer/MyAstro/docs/code-review/01-CRITICAL-BUGS.md) to fix property typos and restore `tsc -b` green status.
2. **Prune Dead Code:** Delete `AskAndReaderPanel.tsx` and duplicate rules in `sample_rules.yaml` as detailed in [03-DEAD-AND-UNNECESSARY-CODE.md](file:///Users/krish/Developer/MyAstro/docs/code-review/03-DEAD-AND-UNNECESSARY-CODE.md).
3. **Harmonize Architecture:** Review [04-ARCHITECTURE-AND-REFACTORING.md](file:///Users/krish/Developer/MyAstro/docs/code-review/04-ARCHITECTURE-AND-REFACTORING.md) to decide on database layer consolidation and state management cleanup.
