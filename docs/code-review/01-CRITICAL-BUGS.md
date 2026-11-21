# 01: Critical Runtime Bugs & Type Discrepancies

This document catalogs critical silent bugs, runtime failures, and TypeScript compilation errors discovered across the codebase.

---

## 1. Silent Runtime Bugs (Passing Vitest but Producing Faulty Outputs)

### 1.1 KP Sub-Lord Property Mismatch (`starLord` vs `nakshatraLord`)
- **Location:** [packages/tools/src/server.ts#L484](file:///Users/krish/Developer/MyAstro/packages/tools/src/server.ts#L484)
- **Code:**
  ```ts
  `KP ${key}: StarLord=${k.nakshatraLord}, SubLord=${k.subLord}, SubSub=${k.subSubLord}.`
  ```
- **Bug:** `KpPlacement` ([packages/engine/src/kp/sublords.ts#L5-L15](file:///Users/krish/Developer/MyAstro/packages/engine/src/kp/sublords.ts#L5-L15)) declares the field as `starLord`, not `nakshatraLord`.
- **Impact:** Evaluates to `undefined` at runtime. Renders: `KP sun: StarLord=undefined, SubLord=mercury, SubSub=venus.`.
- **Fix:** Replace `k.nakshatraLord` with `k.starLord`.

---

### 1.2 Ashtakoota Vashya Invariant Breakdown (`vashya` vs `vasya`)
- **Location:** [packages/engine/src/natal/ashtakoota.ts#L55](file:///Users/krish/Developer/MyAstro/packages/engine/src/natal/ashtakoota.ts#L55) and [packages/tools/src/server.ts#L617](file:///Users/krish/Developer/MyAstro/packages/tools/src/server.ts#L617)
- **Code:**
  ```ts
  const vashyaPts = avA.vashya === avB.vashya ? 2 : 1;
  ```
- **Bug:** `AvakahadaDetails` ([packages/engine/src/natal/avakahada.ts#L4-L11](file:///Users/krish/Developer/MyAstro/packages/engine/src/natal/avakahada.ts#L4-L11)) names the property `vasya`.
- **Impact:** `avA.vashya` and `avB.vashya` are both `undefined`. In JavaScript:
  ```js
  undefined === undefined // true -> always evaluates to 2 points!
  ```
  The Vashya Koota check is completely broken and awards maximum points for every pair of charts regardless of compatibility.
- **Fix:** Standardize on `vasya` across `ashtakoota.ts`, `server.ts`, and types, or alias `vashya` in `AvakahadaDetails`.

---

### 1.3 Birth Panchang Tithi Elapsed (`elapsed` vs `elapsedFraction`)
- **Location:** [packages/tools/src/server.ts#L874](file:///Users/krish/Developer/MyAstro/packages/tools/src/server.ts#L874)
- **Code:**
  ```ts
  `Birth Panchang: Vara=${p.wara.name} ..., Tithi=${p.tithi.paksha} ${p.tithi.name} (#${p.tithi.index}, ${(p.tithi.elapsed * 100).toFixed(0)}% elapsed).`
  ```
- **Bug:** In `TithiInfo` ([packages/engine/src/panchang/index.ts#L14-L20](file:///Users/krish/Developer/MyAstro/packages/engine/src/panchang/index.ts#L14-L20)), the fraction is named `elapsedFraction`.
- **Impact:** Evaluates to `undefined * 100` -> renders `NaN% elapsed`.
- **Fix:** Replace `p.tithi.elapsed` with `p.tithi.elapsedFraction`.

---

### 1.4 Missing Nakshatra Name in Dossier and Reports (`nakshatra` vs `nakshatraName`)
- **Locations:**
  - [packages/engine/src/natal/llm-dossier.ts#L118](file:///Users/krish/Developer/MyAstro/packages/engine/src/natal/llm-dossier.ts#L118)
  - [packages/engine/src/natal/llm-dossier.ts#L210](file:///Users/krish/Developer/MyAstro/packages/engine/src/natal/llm-dossier.ts#L210)
  - [packages/engine/src/natal/upagrahas.ts#L66](file:///Users/krish/Developer/MyAstro/packages/engine/src/natal/upagrahas.ts#L66)
  - [apps/web/src/components/PrintableNatalReport.tsx#L361](file:///Users/krish/Developer/MyAstro/apps/web/src/components/PrintableNatalReport.tsx#L361)
- **Code:**
  ```tsx
  <td className="py-2 px-3">{g.nakshatraName}</td>
  ```
- **Bug:** `GrahaDetail` ([packages/engine/src/natal/types.ts#L37-L54](file:///Users/krish/Developer/MyAstro/packages/engine/src/natal/types.ts#L37-L54)) and `NakshatraPosition` define the string property as `nakshatra`.
- **Impact:** The Printable PDF / Report renders empty nakshatra table cells; the LLM prompt dossier receives `undefined` for planet nakshatra names.
- **Fix:** Replace `g.nakshatraName` with `g.nakshatra`.

---

### 1.5 Missing `lord` on `LagnaDetail`
- **Location:** [packages/engine/src/natal/interpretations.ts#L35](file:///Users/krish/Developer/MyAstro/packages/engine/src/natal/interpretations.ts#L35)
- **Code:**
  ```ts
  bullets.push(
    `Ascendant in ${lagna.sign.toUpperCase()} (Lord: ${chart.grahas[lagna.lord]?.sign ? lagna.lord.toUpperCase() : lagna.lord}): Endows a ${lagna.sign.toLowerCase()} constitutional focus...`
  );
  ```
- **Bug:** `LagnaDetail` does not have a `lord` property.
- **Impact:** Evaluates to `undefined`. Generates string: `Ascendant in PISCES (Lord: undefined): Endows a pisces constitutional focus...`.
- **Fix:** Compute lagna lord from sign index: `SIGN_LORDS[lagna.signIndex]`.

---

### 1.6 Missing `dignity` on `GrahaDetail`
- **Location:** [packages/engine/src/natal/interpretations.ts#L46](file:///Users/krish/Developer/MyAstro/packages/engine/src/natal/interpretations.ts#L46)
- **Code:**
  ```ts
  const dignityStr = d.dignity ? ` [${d.dignity}]` : '';
  ```
- **Bug:** `GrahaDetail` has no `dignity` field. Dignity is emitted as facts in `@astro/facts` or computed in `level2Extras.ts`, but does not exist on the Level 1 `GrahaDetail`.
- **Impact:** `d.dignity` is always `undefined`, so `dignityStr` is always empty.

---

### 1.7 Missing `abhijitMuhurta` in `InauspiciousWindows`
- **Location:** [packages/tools/src/server.ts#L974](file:///Users/krish/Developer/MyAstro/packages/tools/src/server.ts#L974)
- **Code:**
  ```ts
  const abhijitStr = day.inauspicious?.abhijitMuhurta
    ? `${day.inauspicious.abhijitMuhurta.startFormatted}–${day.inauspicious.abhijitMuhurta.endFormatted}`
    : 'midday';
  ```
- **Bug:** `InauspiciousWindows` ([packages/engine/src/timequality/horas.ts#L49-L53](file:///Users/krish/Developer/MyAstro/packages/engine/src/timequality/horas.ts#L49-L53)) only defines `rahuKalam`, `yamaganda`, and `gulika`. Abhijit Muhurta is an auspicious window computed separately.
- **Impact:** `day.inauspicious?.abhijitMuhurta` is always `undefined`, falling back always to `"midday"`.

---

### 1.8 Argument Count Mismatch in `createNatalDigest`
- **Location:** [packages/tools/src/engine-session.ts#L329](file:///Users/krish/Developer/MyAstro/packages/tools/src/engine-session.ts#L329)
- **Code:**
  ```ts
  const digest = createNatalDigest(this.natal, this.getAshtakvarga(), this.getVimshottari());
  ```
- **Bug:** `createNatalDigest` ([packages/engine/src/natal/digest.ts#L40](file:///Users/krish/Developer/MyAstro/packages/engine/src/natal/digest.ts#L40)) only accepts 1 parameter (`chart: NatalChart`).
- **Impact:** Arguments 2 and 3 are ignored. While benign at runtime in JavaScript, it causes `TS2554: Expected 1 arguments, but got 3.` in TypeScript.

---

## 2. TypeScript Compilation Breakdown (371 Errors in `tsc -b`)

When running `./node_modules/.bin/tsc -b`, TypeScript fails with 371 errors. These fall into 4 primary clusters:

### Cluster A: Missing Export Paths & Type Declarations
* **Files:**
  - `packages/engine/src/dasha/chara.ts:2`
  - `packages/engine/src/natal/arudha.ts:2`
  - `packages/engine/src/natal/yogas.ts:1`
  - `packages/engine/src/shadbala/index.ts:1`
* **Error:** `TS2305: Module '"../natal/types.js"' has no exported member 'NatalChart'.`
* **Root Cause:** `NatalChart` is declared in `packages/engine/src/natal/positions.ts`, but multiple files attempt to import it from `natal/types.js`.
* **Fix:** Export `NatalChart` from `packages/engine/src/natal/types.ts` or re-export it in `index.ts` and import from `./positions.js`.

---

### Cluster B: `exactOptionalPropertyTypes: true` Incompatibilities
* `tsconfig.base.json` enables `"exactOptionalPropertyTypes": true`. Under this rule, a type `foo?: string` cannot accept `undefined` (e.g. `{ foo: undefined }`).
* **Errors Triggered:**
  - `packages/rules/src/evaluator.ts:303`: `resolvedLord: ctx.resolvedLord` where `ctx.resolvedLord` is `string | undefined`.
  - `packages/rules/src/renderer.ts:158`: `schoolNote: string | undefined` assigned to `schoolNote?: string`.
  - `packages/agent/src/loop.ts:470`: `step: number | undefined` assigned to `step?: number`.
* **Fix:** Either declare optional properties as `foo?: string | undefined;` or disable `exactOptionalPropertyTypes` in `tsconfig.base.json`.

---

### Cluster C: `noUncheckedIndexedAccess: true` Array Access
* `tsconfig.base.json` enables `"noUncheckedIndexedAccess": true`. Array indexing `arr[i]` returns `T | undefined`.
* **Errors Triggered:**
  - `packages/engine/src/calibration/index.ts:82`: `sum += sample[idx];` (Object is possibly 'undefined').
  - `packages/engine/src/calibration/index.ts:96`: `ciLow` and `ciHigh` are possibly 'undefined'.
  - `packages/engine/src/calibration/index.ts:319`: `horaRuler: [...] [i % 7]` is `string | undefined`.
* **Fix:** Add non-null assertions `sample[idx]!` or null guards where index bounds are statically guaranteed.

---

### Cluster D: Omission of Apps in Root `tsconfig.json` References
* [tsconfig.json](file:///Users/krish/Developer/MyAstro/tsconfig.json#L3-L13) lists:
  ```json
  "references": [
    { "path": "packages/engine" },
    { "path": "packages/content" },
    { "path": "packages/app-core" },
    { "path": "packages/store" },
    { "path": "packages/facts" },
    { "path": "packages/rules" },
    { "path": "packages/kb" },
    { "path": "packages/tools" },
    { "path": "packages/agent" }
  ]
  ```
* `apps/api` and `apps/web` are completely omitted from the project reference graph. Running `tsc -b` at the root does not validate the applications at all.
