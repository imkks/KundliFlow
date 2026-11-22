# 06: Server-Centric Architecture Plan: Static Blueprint & Daily Sky Delta

This plan outlines the end-to-end architecture to move all heavy astronomical and scoring computations exclusively to the server, establishing a high-performance **"Compute Once, Cache Everywhere"** model for Web and the upcoming Android app.

---

## 1. Architectural Blueprint: Two Payloads Only

Instead of running mathematical calculations or ad-hoc rule engines on the client, clients interact with **two clean, server-computed JSON payloads**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SERVER-CENTRIC DATA FLOW                        │
└────────────────────────────────────────────────────────────────────────┘

  [1] PROFILE CREATION (Once in a Lifetime)
      Client (Web/Android) ──> POST /api/profiles (birth date, time, lat/lon)
      Server ─────────────────> Computes All Positions, Vargas, Strengths, Dashas, Rules
      Server ─────────────────> Stores in `chart_snapshots` (DB)
      Server ─────────────────> Returns Static Bundle (~50 KB JSON)
      Client ─────────────────> Caches permanently in LocalStorage / Room DB

  [2] DAILY SKY DELTA (Once Per Day)
      Client (Web/Android) ──> GET /api/profiles/:id/today?date=YYYY-MM-DD
      Server ─────────────────> Checks `daily_sky_cache` (Memory / SQLite)
                                 - Hit: Returns instantly (<2ms)
                                 - Miss: Computes DayView, Transits, Horas -> Caches
      Client ─────────────────> Caches for current day
```

---

## 2. Payload 1: Static Natal Blueprint (Compute Once, Cache Forever)

### What it contains
Everything derived from the birth instant:
* **Level 1 (Astronomical & Harmonic Placements):**
  - Lagna & 9 Grahas (sign, degree, nakshatra, pada)
  - Precalculated Divisional Charts (D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D60)
  - Sripati Bhava Chalit beginnings & midpoints
  - KP Star Lords, Sub-Lords, Sub-Sub Lords
  - Shadbala (6-fold strength totals & ratios)
  - Ashtakvarga (BAV planet grids & 12-sign SAV bindus)
  - Avakahada Chakra, Jaimini Chara Karakas, Arudha Padas, Upagrahas
  - Complete 120-year Vimshottari Dasha tree, 36-year Yogini tree, Chara dasha cycle
* **Level 2 (Classical Rules & Interpretations):**
  - All Yogas & Doshas detected
  - Mutual aspect angles and orbs
  - Planetary Avasthas (Baladi, Jagratadi, Deeptadi)
  - Favourable and Ghatak points
  - Synthesized plain-English house dossiers (simple, standard, detailed)

### Client Storage Strategy
* **Web:** Stored in `localStorage` or `IndexedDB` under key `astro_bundle_${profileId}_v${bundleVersion}`.
* **Android:** Stored in a local **Room Database** table `natal_bundles` or EncryptedSharedPreferences.
* **Cache Invalidation:** Only invalidated if the user edits their birth date/time/location (`bundleVersion` increments).
* **HTTP Cache Headers:**
  ```http
  ETag: "bundle-v1-profile123"
  Cache-Control: public, max-age=31536000, immutable
  ```

---

## 3. Payload 2: Daily Sky Delta (Compute Once Per Day, Cache Daily)

### What it contains
Everything specific to today's date and the user's current city:
* **Today's Panchang:** Tithi, weekday lord, current nakshatra, yoga, karana.
* **Time Quality & Horas:** Exact sunrise/sunset, 24 horas for the day, active hora, Rahu Kalam, Yamaganda, Gulika.
* **Hourly Score Curve:** 24 hourly scores (-10 to +10) with benefic/malefic factor breakdown and band labels (`flowing`, `steady`, `go_gently`).
* **Live Transits (Gochar):** Real-time planetary positions today, transit houses relative to natal Moon and Lagna, transit Ashtakvarga bindus, and Sade Sati status.
* **Calendar Summary:** Top 3 peak days and caution days for the month.
* **Active Dasha Pointer:** The specific Maha-Antar-Pratyantar nodes active today.

### Server-Side Daily Caching (`daily_sky_cache`)
Currently, `GET /api/profiles/:id/today` re-runs `buildDay`, `computeTransits`, and `buildMonth` on every single request. 

**Optimization:**
Introduce a daily cache table in SQLite:
```sql
CREATE TABLE IF NOT EXISTS daily_sky_cache (
  profile_id TEXT NOT NULL,
  date TEXT NOT NULL,
  tz_id TEXT NOT NULL,
  lat_bucket REAL NOT NULL, -- Rounded to 2 decimals
  lon_bucket REAL NOT NULL, -- Rounded to 2 decimals
  payload_json TEXT NOT NULL,
  computed_at TEXT NOT NULL,
  PRIMARY KEY (profile_id, date, tz_id, lat_bucket, lon_bucket)
);
```
1. When a request arrives, check `daily_sky_cache`.
2. If present, return `payload_json` immediately (< 2ms).
3. If not, compute using `buildDay` + `computeTransits`, store in table, and return.
4. Also decouple `buildMonth` from `/today`: `/today` only needs today's transits and horas; monthly peak summaries can be computed once a month or fetched on demand when opening the Calendar tab.

---

## 4. Frontend Web Refactoring (`apps/web`)

### Step 1: Clean up `InterpretationsGuide.tsx`
* **Current:** Imports calculation functions from `@astro/engine` and computes yogas, avasthas, aspects, and ghatak on every render.
* **Refactor:** Remove all calculations. Read directly from the cached `bundle.level1Static` and `bundle.level2Static`.

### Step 2: Remove Varga calculation in `App.tsx`
* **Current:** Calls `calculateVargaSign` client-side when switching between D1, D9, D10.
* **Refactor:** Precompute all varga placements in the server static bundle (`bundle.level1Static.vargas[vargaId]`). The UI simply renders the precomputed coordinates.

### Step 3: Delete Duplicate Fetch in `ReadingContext.tsx`
* **Current:** Issues a redundant `POST /api/reading` network call on mount.
* **Refactor:** Pass `bundle.level2Static` directly from `App.tsx` into `ReadingContext`. Eliminate the network call completely.

---

## 5. Android Architecture Ready-Pack

With this design, building the Android app becomes dramatically simpler:

```
Android App Architecture (MVVM + Offline-First)
├── data/
│   ├── api/
│   │   ├── AstroApiService.kt        # Retrofit endpoints: getBundle(), getTodaySky()
│   │   └── models/                   # Kotlin @Serializable data classes
│   ├── db/
│   │   ├── AppDatabase.kt            # Room DB
│   │   ├── ProfileDao.kt             # Profiles table
│   │   └── NatalBundleDao.kt         # Stores the static JSON bundle
│   └── repository/
│       ├── ProfileRepository.kt      # Manages profiles & bundles (Room + Retrofit)
│       └── TodaySkyRepository.kt     # In-memory / Room cache of today's delta
├── domain/
│   └── models/                       # UI domain models (Chart, DashaNode, ScoreBar)
├── ui/
│   ├── today/                        # Jetpack Compose: 24-hr score bar, Hora, Panchang
│   ├── kundli/                       # Canvas/Compose: North & South Indian Chart view
│   ├── timing/                       # Dasha tree LazyColumn & transit cards
│   └── strengths/                    # Shadbala bars & Ashtakvarga grid
└── worker/
    └── DailySkySyncWorker.kt         # WorkManager: pre-fetches today's sky at 00:01 AM
```

### Key Advantages for Android:
1. **Zero C++/WASM dependencies:** No need for Android NDK, SwissEph C bindings, or heavy WebViews. Pure 100% native Kotlin.
2. **Instant Warm Starts:** All tabs render from Room database with zero network delay.
3. **Background Sync:** Android `WorkManager` can fetch today's ~4 KB delta in the background every morning so the user opens the app to fresh transits instantly.
4. **Offline Resilience:** The entire natal chart, 120-year dashas, yogas, and house dossiers work on airplanes or in remote areas.

---

## 6. Implementation Checklist

- [ ] **1. Server Cache Table:** Add `daily_sky_cache` table to [apps/api/src/db.ts](file:///Users/krish/Developer/MyAstro/apps/api/src/db.ts).
- [ ] **2. Cache /today in Server:** Update `/api/profiles/:id/today` in [apps/api/src/server.ts](file:///Users/krish/Developer/MyAstro/apps/api/src/server.ts) to read from and write to `daily_sky_cache`.
- [ ] **3. Precompute Vargas in Bundle:** Include all divisional chart placements in `bundle.level1Static.vargas` in `aggregateLevel1And2`.
- [ ] **4. Strip Client Computations in Web:**
  - Update [InterpretationsGuide.tsx](file:///Users/krish/Developer/MyAstro/apps/web/src/components/InterpretationsGuide.tsx) to read from props/bundle.
  - Remove `calculateVargaSign` loops in [App.tsx](file:///Users/krish/Developer/MyAstro/apps/web/src/App.tsx).
  - Remove duplicate `POST /api/reading` in [ReadingContext.tsx](file:///Users/krish/Developer/MyAstro/apps/web/src/context/ReadingContext.tsx).
- [ ] **5. Android Contract Documentation:** Export OpenAPI / TypeScript-to-Kotlin schema definitions for `StaticBundleResponse` and `TodayPayloadResponse`.
