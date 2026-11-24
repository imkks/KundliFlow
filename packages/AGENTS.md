# packages/AGENTS.md — Engine, Facts, Rules & Agent Pipeline

All domain computation and reasoning lives inside `packages/*` and runs under Vitest (`corepack pnpm test`).

## End-to-End Calculation Pipeline

1. **Level 1 (`@astro/engine`)**: Pure deterministic Vedic astrology computations from Julian Day UT + geo coordinates + `EphemerisProvider`.
2. **Chart Facts DB (`@astro/facts`)**: `buildChartWorkspace()` creates an in-memory SQLite table graph of placements, lordships, aspects, dignities, dashas, and transits (`emitters.ts`, `workspace.ts`).
3. **Level 2 (`@astro/rules` + `@astro/content`)**: Evaluates 537 YAML rules (`packages/content/rules/*.yaml`) against `ChartWorkspace` (`evaluator.ts`), checks Argala (`argala.ts`), aggregates house/planet summaries (`aggregator.ts`, `renderer.ts`) across `'simple' | 'standard' | 'detailed'`, and lints safety rules (`linter.ts`).
4. **Tools & VFS (`@astro/tools`)**: Exposes `chart.db` virtual filesystem paths (`/overview`, `/houses/1..12`, `/planets/<name>`, `/sahams`, etc.) and `EngineSession` (`engine-session.ts`, `server.ts`, `vfs.ts`) so agents inspect exact calculations rather than guessing.
5. **Knowledge Base (`@astro/kb`)**: SQLite FTS over `packages/content/{topics,kb}/*.yaml`.
6. **Level 3 Agent (`@astro/agent`)**:
   - `router.ts` classifies greetings/conceptual vs full chart queries.
   - `loop.ts` executes bounded multi-turn LLM tool calls (using either `createAnthropicCompatibleLlmClient` or `createOpenAiCompatibleLlmClient` from `llm.ts`).
   - `verifier.ts` enforces strict evidence grounding (`observedEvidenceIds` must exist in tool outputs).
   - On LLM error or verification failure after retries, falls back deterministically (`mode: 'level2_fallback'`).

## `@astro/engine` Module Quick Lookup (`packages/engine/src/`)

| Domain | Key Files | Main Exports |
| :--- | :--- | :--- |
| Ephemeris | `ephemeris/{loader,config,registry,types}.ts`, `ephemeris/adapters/{swisseph,astronomy-engine}.ts` | `loadEphemeris`, supports `lahiri`, `kp_old`, `kp_new`, `raman`, `yukteshwar` |
| Time & Angles | `time/{julian,resolve}.ts`, `angles.ts`, `sidereal.ts` | `resolveBirthTime`, `julianDayUt`, `norm360`, `degToDms` |
| Natal Core | `natal/{positions,types,digest,interpretations,llm-dossier}.ts` | `computePositions`, `createNatalDigest`, `buildLlmDossierMarkdown` |
| Vargas | `vargas/index.ts`, `vargas/amsabala.ts` | `calculateVargaSign` (`'D1'..'D60'`), `computeChartVaisheshikamsa`, `VARGA_TYPES` |
| Dashas | `dasha/{vimshottari,yogini,chara,sudarshana}.ts` | `computeVimshottariDashas`, `computeYoginiDashas`, `computeCharaDashas` |
| Strength & BAV/SAV | `shadbala/{index,bhavabala}.ts`, `ashtakvarga/{index,shodhana}.ts`, `friendship/index.ts` | `computeShadbala`, `computeAshtakvarga`, `computeAshtakavargaShodhana` |
| Transits & Muhurta | `transits/{index,vedha}.ts`, `panchang/index.ts`, `timequality/{horas,suntimes}.ts`, `muhurta/index.ts` | `computeTransits`, `evaluateKakshyaTransits`, `checkTransitVedha`, `computePanchang` |
| Special Vedic Systems | `chalit/index.ts`, `kp/sublords.ts`, `longevity/ayurdaya.ts`, `natal/{yogas,aspects,arudha,upagrahas,varshaphal,sahams,navatara,special_lagnas,karakas,avasthas,avakahada,ghatak,bhavas,ashtakoota}.ts` | `computeSripatiChalit`, `calculateKpPlacement`, `computeVarshaphal`, `computeArudhaPadas`, `computeUpagrahas`, `computeFullNavataraTable`, `detectYogasAndDoshas` |
| Daily/Monthly Scoring | `scoring/{index,builders}.ts`, `calibration/index.ts` | `scoreHour`, `buildDay`, `buildMonth`, `buildYear` |
