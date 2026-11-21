# 02: Hardcoded Values & Security Audit

This document details hardcoded paths, security vulnerabilities, magic numbers, and duplicate domain constants identified during the code review.

---

## 1. Security & Authentication Vulnerabilities

### 1.1 Insecure Default Secret for JWT Signing
- **Location:** [apps/api/src/auth.ts#L12](file:///Users/krish/Developer/MyAstro/apps/api/src/auth.ts#L12)
- **Code:**
  ```ts
  const DEFAULT_SECRET = process.env.JWT_SECRET || 'myastro-local-dev-secret-change-in-prod';
  ```
- **Risk:** If `JWT_SECRET` is not set on a production server (such as Render or an Oracle VM), the API server silently boots using this well-known fallback secret. An attacker can sign their own JWTs with arbitrary `sub` IDs and gain full administrative access to any user profile.
- **Remediation:** Throw an error on server startup in production if `JWT_SECRET` is missing:
  ```ts
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET must be configured in production.');
  }
  ```

---

### 1.2 Google ID Token Audience Verification Bypass
- **Location:** [apps/api/src/auth.ts#L77-L92](file:///Users/krish/Developer/MyAstro/apps/api/src/auth.ts#L77-L92)
- **Code:**
  ```ts
  export async function verifyGoogleIdToken(
    idToken: string,
    expectedClientId = process.env.GOOGLE_CLIENT_ID,
  ): Promise<VerifiedGoogleIdentity> {
    ...
    if (expectedClientId && info.aud !== expectedClientId) {
      throw new Error('Google token audience mismatch');
    }
    ...
  }
  ```
- **Risk:** If `GOOGLE_CLIENT_ID` is undefined in the backend environment, the audience check is completely skipped (`if (expectedClientId && ...)`). This means *any valid Google ID token from any application anywhere in the world* (even unrelated third-party apps) will pass verification and create an authenticated session.
- **Remediation:** Make `expectedClientId` mandatory for verification.

---

### 1.3 Development Authentication Backdoor
- **Location:** [apps/api/src/server.ts#L358](file:///Users/krish/Developer/MyAstro/apps/api/src/server.ts#L358) and [.env#L3](file:///Users/krish/Developer/MyAstro/.env#L3)
- **Code:**
  ```ts
  } else if (process.env.ALLOW_DEV_AUTH === 'true' && body.devEmail) {
    identity = {
      googleSub: `dev_${String(body.devEmail).replace(/[^a-z0-9]/gi, '_')}`,
      email: String(body.devEmail),
      name: String(body.devName || 'Dev User'),
    };
  }
  ```
- **Risk:** `.env` is committed with `ALLOW_DEV_AUTH=true`. Any client can pass an arbitrary email and impersonate any user without credentials.
- **Remediation:** Ensure `ALLOW_DEV_AUTH` is disabled by default, rejected if `NODE_ENV === 'production'`, and remove `.env` from git tracking.

---

## 2. Fragile Paths & Build Scripts

### 2.1 Hardcoded pnpm Virtual Store Binary Path
- **Location:** [apps/api/package.json#L8](file:///Users/krish/Developer/MyAstro/apps/api/package.json#L8)
- **Code:**
  ```json
  "build": "../../node_modules/.pnpm/esbuild@0.21.5/node_modules/esbuild/bin/esbuild src/index.ts --bundle --platform=node ..."
  ```
- **Risk:** Hardcodes an exact pnpm virtual store version (`esbuild@0.21.5`). If dependencies update, if hoisting rules change, or if deployed outside pnpm, the build script crashes immediately.
- **Remediation:** Replace with standard `esbuild`:
  ```json
  "build": "esbuild src/index.ts --bundle --platform=node --format=esm --external:better-sqlite3 --external:js-yaml --external:zod --alias:@swisseph/browser=./src/noop-swisseph.ts --outfile=dist/index.js"
  ```

---

### 2.2 Ignored `DB_PATH` Environment Variable
- **Location:** [apps/api/src/server.ts#L56](file:///Users/krish/Developer/MyAstro/apps/api/src/server.ts#L56) vs [render.yaml#L14-L15](file:///Users/krish/Developer/MyAstro/render.yaml#L14-L15)
- **Code in server.ts:**
  ```ts
  const ROOT_DIR = path.resolve(__dirname, '../../..');
  const DB_PATH = path.join(ROOT_DIR, 'data/myastro.db');
  ```
- **Code in render.yaml:**
  ```yaml
  envVars:
    - key: DB_PATH
      value: "./data/myastro.db"
  ```
- **Risk:** `server.ts` completely ignores `process.env.DB_PATH`. When deploying to Render or cloud VMs where persistent volumes are mounted at custom paths (e.g. `/var/data/myastro.db`), the server writes to the local transient disk and loses all data on restarts.
- **Remediation:**
  ```ts
  const DB_PATH = process.env.DB_PATH || path.join(ROOT_DIR, 'data/myastro.db');
  ```

---

### 2.3 Fragile Monorepo Path Assumptions
- **Location:** [apps/api/src/server.ts#L55-L64](file:///Users/krish/Developer/MyAstro/apps/api/src/server.ts#L55-L64)
- **Code:**
  ```ts
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const ROOT_DIR = path.resolve(__dirname, '../../..');
  const STRENGTH_PATH = path.join(ROOT_DIR, 'packages/content/strength.yaml');
  const RULES_DIR = path.join(ROOT_DIR, 'packages/content/rules');
  const TOPICS_PATH = path.join(ROOT_DIR, 'packages/content/topics/topics.yaml');
  const CONCEPTS_PATH = path.join(ROOT_DIR, 'packages/content/kb/concepts.yaml');
  const LORE_PATH = path.join(ROOT_DIR, 'packages/content/kb/jyotish_lore.yaml');
  const NAKSHATRAS_PATH = path.join(ROOT_DIR, 'packages/content/kb/nakshatras.yaml');
  const PRINCIPLES_PATH = path.join(ROOT_DIR, 'packages/content/kb/yogas_and_principles.yaml');
  ```
- **Risk:** Assumes the build artifact (`dist/index.js`) is run exactly from `apps/api/dist` inside the original monorepo checkout. If containerized into a standalone Docker image, the YAML files will not be found.

---

## 3. Duplicate Domain Constants & Magic Values

### 3.1 `SIGN_LORDS` Defined in 6 Separate Files
`SIGN_LORDS` maps sign indices 0..11 to their ruling Vedic planets:
- [packages/facts/src/vocab.ts#L115](file:///Users/krish/Developer/MyAstro/packages/facts/src/vocab.ts#L115)
- [packages/engine/src/natal/varshaphal.ts#L6](file:///Users/krish/Developer/MyAstro/packages/engine/src/natal/varshaphal.ts#L6)
- [packages/engine/src/natal/yogas.ts#L15](file:///Users/krish/Developer/MyAstro/packages/engine/src/natal/yogas.ts#L15)
- [packages/engine/src/natal/ashtakoota.ts#L19](file:///Users/krish/Developer/MyAstro/packages/engine/src/natal/ashtakoota.ts#L19)
- [packages/engine/src/kp/sublords.ts#L17](file:///Users/krish/Developer/MyAstro/packages/engine/src/kp/sublords.ts#L17)
- [packages/engine/src/scoring/builders.ts#L60](file:///Users/krish/Developer/MyAstro/packages/engine/src/scoring/builders.ts#L60)

**Remediation:** Export a single canonical `SIGN_LORDS: readonly VedicGraha[]` from `@astro/engine` and import it everywhere.

---

### 3.2 Arbitrary Default Lagna Lord
- **Location:** [packages/engine/src/scoring/builders.ts#L147, L263](file:///Users/krish/Developer/MyAstro/packages/engine/src/scoring/builders.ts#L147)
- **Code:**
  ```ts
  const lagnaLord: VedicGraha = digest.lagna ? SIGN_LORDS[digest.lagna.signIndex]! : 'venus';
  ```
- **Risk:** If Lagna is omitted (e.g. unknown birth time), the lagna lord silently defaults to `'venus'`.

---

### 3.3 House Domain Labels Duplicated Across 5 Files
Friendly labels like `"Self, Vitality & Path"` for House 1 are hardcoded in:
1. `packages/agent/src/loop.ts:224-237`
2. `packages/rules/src/renderer.ts:66-79`
3. `apps/web/src/components/CommandPaletteModal.tsx:20-33`
4. `apps/web/src/tabs/TodayTab.tsx:37-50`
5. `packages/engine/src/natal/bhavas.ts:44-50`

---

### 3.4 Hardcoded Text Descriptions
- [apps/api/src/level2Extras.ts](file:///Users/krish/Developer/MyAstro/apps/api/src/level2Extras.ts#L25-L100) hardcodes massive static dictionaries:
  - `YOGA_MEANINGS` (14 items)
  - `YOGINI_THEMES` (8 items)
  - `TARA_NAMES` (9 items)
  - `UPAGRAHA_MEANINGS` (7 items)
  - `GANA_MEANINGS` (3 items)
  - `NADI_MEANINGS` (3 items)
  - `MUNTHA_HOUSE_THEMES` (12 items)
- These texts duplicate definitions already present in `packages/content/kb/*.yaml` and `apps/web/src/components/PlainEnglishExplainerModal.tsx`.
