# Decisions Log

### D1: Static PWA Architecture (Web-First)
- **Status:** Approved
- **Context:** Free tool with minimal infrastructure cost.
- **Decision:** Client-side compute inside a Web Worker. No backend calculation service required.

### D2: Pluggable Ephemeris Architecture
- **Status:** Approved & Implemented in M0
- **Context:** User requested minimal effort to switch engines.
- **Decision:** `EphemerisProvider` interface created. 
  - Default: `swisseph` (Swiss Ephemeris 2.10 WASM in Moshier mode, sub-arcsecond precision).
  - Alternate: `astronomy-engine` (MIT).
  - Switch via `packages/engine/src/ephemeris/config.ts` (`DEFAULT_EPHEMERIS`) or `VITE_EPHEMERIS` environment variable.
  - Conformance verified across both engines via `ephemeris.conformance.test.ts`.

### D3 & D4: Pluggable Places with Jamshedpur Default
- **Status:** Approved & Implemented in M0
- **Context:** Small dataset of cities for now; replace with an API later; default to user's location.
- **Decision:** `PlaceProvider` interface created in `@astro/app-core`.
  - Default implementation: `StaticCityProvider` reading 22 cities in `@astro/content`.
  - Default location: Jamshedpur (22.8° N, 86°10' E, `Asia/Kolkata`).
  - Swapping to a remote Geocoding API later requires only implementing `PlaceProvider` and calling `setPlaceProvider(...)`.

### D5: Licensing
- **Status:** Recorded
- **Context:** Using `@swisseph/browser` (AGPL-3.0) warrants AGPL-3.0 for public releases unless switched to MIT `astronomy-engine`.
