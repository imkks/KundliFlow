# UI Contents & Visual Marker Guide — KundliFlow (`apps/web`)

Comprehensive visual and structural inventory of every screen, tab, chart, modal, form field, action, design token, and data binding in **KundliFlow (`apps/web`)**.

> [!TIP]
> **Who this is for:** Visual redesign agents, design-system contributors, and mobile engineers (e.g., Jetpack Compose / Android) building feature-parity native views without inspecting every React TSX file. Every section below maps directly to the current `apps/web/src/` components, state, and REST endpoints.

---

## 1. Visual Design System & Tokens (`apps/web/src/index.css`)

### Color Palette

| Token / Class | Value | Semantic Role |
| :--- | :--- | :--- |
| `--bg-ink` / `--bg-main` | `#15132b` | Root canvas / deep indigo background |
| `--surface` | `#201d40` | Primary card, drawer & panel background |
| `--surface-alt` | `#2a2652` | Elevated sub-cards, table headers, interactive chips |
| `--text-main` | `#f3eee2` | Warm parchment primary text |
| `--text-muted` | `#a6a0ba` | Secondary labels, captions, astronomical metadata |
| `--gold` | `#e3ad46` | Primary Vedic accent, active tabs/pills, hero headings, highlights |
| `--teal` | `#5fc2b3` | Active `● NOW` indicators, supportive scores, AI Copilot accent, focus ring |
| `--amber` | `#d97736` | Caution windows, Ghatak guardrails, low scores, negative Drik |
| Error Danger | `#f87171` / `#e06c75` | Vedha obstructions, depleted mood, destructive hard reset |
| `--border` | `rgba(227, 173, 70, 0.2)` | Gold-tinted structural border |
| `--border-subtle` | `rgba(243, 238, 226, 0.08)` | Subtle divider lines inside cards and tables |

### Typography & Motion

- **Body Font (`body`)**: `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`
- **Display / Heading Font (`h1, h2, h3, .serif-title`)**: `'Cinzel', serif` (`letter-spacing: 0.04em`)
- **Accessibility**: `2px solid var(--teal)` outline (`outline-offset: 2px`) on `:focus-visible` interactive controls and `.svg-focusable` SVG shapes; `@media (prefers-reduced-motion: reduce)` collapses transitions and animations.

### Core Surfaces & Layout Breakpoints (`src/index.css`)

- **`.app-topbar`**: Sticky (`top: 0`, `z-index: 60`), translucent `#15132b` (`0.92` alpha + `backdrop-filter: blur(16px)`).
- **`.app-body`**: Desktop CSS Grid (`256px` `.app-sidebar` + `minmax(0, 1fr)` `.app-main`), `max-width: 1680px`.
- **Tablet / Mobile (`<= 960px`)**: Single-column layout; `.app-sidebar` hides (`display: none`); bottom `.nav-bar` anchors primary tab navigation.
- **Topic Grid Collapse (`<= 980px`)**: `.topic-focus-grid` shifts from 5 equal columns to `repeat(auto-fit, minmax(150px, 1fr))`.
- **Small Mobile Modals (`<= 640px`)**: `.modal-backdrop` aligns panels to `flex-end` (`max-height: 92vh`, bottom-sheet rounding).
- **Visual Primitives**: `.card` (`16px` radius, `20px` padding), `.gold-badge` / `.teal-badge` / `.amber-badge` (`20px` pill tags), `.kundli-hero` (radial gold/teal glow banner), `.kundli-stage` (radial-lit chart container), `.topic-focus-card(.is-active)`, `.nav-item-featured`.

---

## 2. Three Progressive-Disclosure Lenses (`src/context/ReadingContext.tsx`)

The topbar segmented switcher maps one engine response (`simple | standard | detailed`) into three user personas:

| Lens | Internal `ReadingDepth` | What Changes Across the UI |
| :--- | :--- | :--- |
| **Guided** | `simple` | Hides raw tables, `Yamaganda`/`Gulika`, `Chandrabala`/`Tarabala` badges, and `Double Transit`/`Ghatak` panels; surfaces **Life Events AI Prompt Builder**, plain-English bottom lines, and caps Gochar list to 4 cards with a `"Show all 9 transits"` toggle. |
| **Explorer** | `standard` | Default learning workspace: shows full **Teach Me** 6-step tour, **Causal Pattern Decoder**, clickable `GlossaryTerm` pills, **House -> Lord SVG connectors**, `Why? ▾` rule cards, `Double Transit`, and `Ghatak` guardrails. |
| **Quant** | `detailed` | Reveals inline `Planetary Positions`, `ShadbalaTable`, `AshtakvargaTable`, `FriendshipMatrix`, `Live Panchang Telemetry`, Kakshya (`K#`) & 3°45' arc badges, direct workbench links, **Deep AI Mode**, and synthetic `n=45` calibration test data. |

---

## 3. Onboarding & Authentication Flow (`App.tsx`)

App mount runs `fetchAuthMe()` using `astro_auth_token_v1` -> `GET /api/auth/me`:

### Step 1 — Sign-In Gate (`AuthOnboardingGate.tsx`)
Rendered when `!authUser`:
- **Primary**: Official Google Identity button (`GOOGLE_CLIENT_ID`) -> `POST /api/auth/google`.
- **Localhost Dev Auth** *(visible on `localhost` / `127.0.0.1` with backend `ALLOW_DEV_AUTH=true`)*: Quick test buttons for `alice@local.test` and `bob@local.test`, plus custom email + name form.
- **Contract**: Each user account isolates saved birth profiles, journals, life events, and AI chat threads.

### Step 2 — First-Visit Chart Setup (`FirstVisitOnboarding.tsx`)
Rendered when `authUser && !savedProfile` in a 2-column card:
- **Left Column**: `"Step 2 of 2"` indicator + 3 radio selection cards for starting Experience Lens (`Guided (AI-First)`, `Chart Explorer`, `Quant Pro`).
- **Right Column Form**:
  - `Full Name` (text input)
  - `Birth Date` (`date` picker)
  - `Birth Time` (`time` input with `step="1"` for HH:MM:SS precision)
  - `Birth Time Certainty` selector (`Exact`, `Approx ±15m`, `Unknown (Moon Ref)`)
  - Birth City / Place (`GooglePlaceAutocomplete.tsx` with optional `"Use Current Location"` button) + live resolved `Lat / Lon / TZ` summary
  - Primary CTA: **`Generate My Chart`** -> calls `POST /api/profiles`.

---

## 4. Global App Shell & Navigation (`App.tsx`)

### Top App Bar (`.app-topbar`)
- **Left Cluster**:
  - Brand button (`MyAstro`, navigates to `today`)
  - **Command Palette Trigger**: `Search chart, houses…` (`⌘K`) -> `CommandPaletteModal.tsx`
  - **3-Lens Experience Switcher** (`role="radiogroup"`): `Guided` | `Explorer` | `Quant`
- **Right Cluster**:
  - **`Life Events`** button -> `LifeEventModal.tsx`
  - **`Dossier`** button *(shown when `isQuant`)* -> `LlmDossierModal.tsx`
  - **`Share`** button -> `ShareBlueprintModal.tsx`
  - **Mobile Saved Charts Switcher** (`mobile-only-inline` dropdown; desktop uses the sidebar)
  - **Account Avatar / `Sign in` Button**: Avatar opens popover (`name`, `email`, **`Sign out`**); unauthenticated state opens `GoogleAuthModal.tsx`

### Desktop Left Sidebar (`256px`)
1. **Active Profile Card**: Native name + **`Edit`** (`OnboardingModal mode="edit"`), Birth Date/Time/City, `Asc` badge, `Moon` badge, clickable `Ayanamsa` badge (opens Edit Chart).
2. **`Saved Charts` Switcher**: `+ Add`, clickable chart rows (`0`-network local-first switch), and delete (`Trash2`) when multiple charts exist.
3. **Primary Navigation (`TABS`)**:
   - `Today` (`id: 'today'`)
   - **`Kundli`** *(featured `.nav-item-featured` with **`D1–D60`** badge, `id: 'kundli'`)*
   - `Timing` (`id: 'timing'`)
   - `Yogas & Power` *(mobile label: `Yogas`, `id: 'strengths'`)*
   - `Timeline` (`id: 'journal'`)
4. **Life Topics Quick-Jump (`LIFE_TOPICS`)**:
   Interactive domain buttons calling `focusLifeTopic(id)` (navigates to `Kundli`, sets active spotlight topic, highlights target House & switches Varga when applicable):
   - **Career & Work** (`House 10` · `D10`)
   - **Love & Marriage** (`House 7` · `D9`)
   - **Wealth & Assets** (`House 2` · `D2`)
   - **Home & Peace** (`House 4` · `D9`)
   - **Year Ahead** (`Annual` / `House 1`)
5. **`Tools & Vault` Strip**:
   - `Print PDF Dossier` (`PrintableNatalReport`)
   - `AI LLM Context` (`LlmDossierModal`)
   - `Data Vault` (`DataSovereigntyModal`)
   - `Plain English Glossary` (`PlainEnglishExplainerModal`)
   *(Note: `ChartSystemsModal` and `QuantMatrixModal` launch contextually from within the `Today`, `Kundli`, `Timing`, and `Yogas & Power` tabs as well as the `⌘K` Command Palette.)*

### Floating Copilot FAB & Mobile Bottom Navigation
- **Floating Bottom-Right Ask AI Pill (`ask-ai-cta ask-ai-fab`)**: Always visible when `!askOpen` (`Ask AI · Life & Chart` in Guided, `Ask AI · <FirstName>` otherwise) -> opens `AskCopilotDrawer.tsx`.
- **Mobile Bottom Navigation (`.nav-bar`, `<= 960px`)**: 5 persistent bottom icon buttons: `Today`, `Kundli`, `Timing`, `Yogas`, `Timeline`.

---

## 5. Primary Tabs — Screen-by-Screen Contents

### Tab 1: `Today` (`src/tabs/TodayTab.tsx`)
1. **Location & Panchang Bar**: `GooglePlaceAutocomplete` for live transit/sunrise city, button **`Full Panchang & 24 Horas`** (`QuantMatrixModal -> 'horas'`), button **`Ask AI about Today`**.
2. **Split Today Hero Card**:
   - **Left Column (`CURRENT TIME QUALITY` / `TODAY'S VIBE & BEST TIMING`)**: Numeric circular score, `bandLabel` / `tierLabel` badge, `activeHoraRuler` hint, interactive **24-hour energy curve SVG sparkline**, and collapsible **`Score factors`** accordion.
   - **Right Column (`ACTION WINDOWS & ALIGNMENT`)**:
     - **Best Windows** cards (peak auspicious slots)
     - **Caution Windows**: Always shows `Rahu Kalam`; adds `Yamaganda` and `Gulika` when `!isGuided`
     - **Lunar Resonance** *(hidden in Guided)*: `Chandrabala` & `Tarabala` cards
     - **ACTIVE LIFE CHAPTER**: Current Mahadasha / Antardasha summary with progress bar.
3. **Lens-Adaptive Middle Card**:
   - **Guided**: Life-Event AI Prompt CTA card (`Open Ask AI`)
   - **Quant**: `Live Panchang Telemetry` (Vara, Tithi %, Nakshatra, Yoga, Karana)
   - **Explorer**: `Top 3 Transits` summary cards
4. **`Explore Your Kundli by Life Topic`**: 5-card responsive grid calling `focusLifeTopic(...)`.
5. **`1-Tap Daily Check-in`**: Instant mood (`1–5`) & tag quick logger saved directly into `astro_journal_entries_v1`.

### Tab 2: `Kundli` — Featured Anchor Tab (`src/tabs/KundliTab.tsx`)
1. **`.kundli-hero` Banner**:
   - Title: **`Your Vedic Kundli`**
   - Badges: active **Ayanamsa** (`Lahiri`, `KP New`, etc.) + active **Mahadasha**
   - 3-Pillar Pill Summary: Ascendant (Lagna), Moon & Nakshatra, Sun sign
   - Action Bar: **`Teach Me`** *(6-step interactive chart tour)*, **`60s Summary`**, **`Elements & Aspects`**, **`Degrees & Vargas`**, **`More Systems`**, plus direct Quant shortcuts (`Shadbala`, `Ashtakvarga`, `KP System`, `Bhava Chalit`).
2. **`Explore by Life Topic` (`.topic-focus-grid`) + `Active Topic Spotlight`**:
   - 5 selectable cards matching sidebar `LIFE_TOPICS` (`.is-active` highlights gold/teal border).
   - Active Spotlight bar explains the selected house/varga focus, offers a 1-click switch to `D1` or target Varga (`D10`/`D9`/`D2`), `Trace Pattern`, and `Ask AI`.
3. **Interactive 6-Step `Teach Me` Tour Banner** *(when toggled open)*: Step-by-step highlight guide across Houses, Lords, Aspects, and Navamsha.
4. **`.kundli-stage` Interactive Chart & Inspector Grid**:
   - **Left Chart Stage**:
     - Header Pill: `Focusing H#` *(active house number & theme)*
     - Co-located Stage Controls: Style (`North` / `South`), Reference (`Lagna` / `Moon`), Varga Dropdown (`D1`–`D60` divisional charts)
     - Primary D1 `NorthIndianChart` or `SouthIndianChart` (`maxWidth={410}`) + optional side-by-side Varga chart when selected.
   - **Right Sticky `Chart Inspector`**:
     - Segmented Switcher: **`Houses (12)`** | **`Planets (9)`**
     - **Telemetry Strip**: Sign, Lord, Placed House, SAV Bindus *(Houses mode)*; Degree, Dignity, Owned Houses, D9 Sign *(Planets mode)*.
     - **Findings Cards**: Rule interpretations with expandable **`Why? ▾`**, clickable **`GlossaryTerm`** definitions, **`Trace Pattern`** (`PatternDecoderModal`), and **`Reflect`** / **`Ask AI`**.
5. **Quant Inline Telemetry** *(when `isQuant`)*: Full Nirayana Planetary Positions table directly beneath `.kundli-stage`.
6. **In-Place Overview Modal** (`overviewModalTab`): `summary`, `elements`, or `conditions` breakdown opened from the Hero action bar.

### Tab 3: `Timing` (`src/tabs/TimingTab.tsx`)
- **Top Sub-Mode Toggle**: `Life Chapters & Transits` | `Month Heatmap & Year Transits`
- **Top Action Buttons**: `Kakshya, Vedha & Navatara` (`QuantMatrixModal -> 'radars'`), `Ask AI about Timing`
- **Sub-View A — `Life Chapters & Transits`**:
  1. **`Test & Explain Real Life Events`**: Preset life-milestone pills or saved milestone cards showing matching Vimshottari/Yogini/Chara lords + **`Explain with AI →`** and `Add Milestone` (`LifeEventModal`).
  2. **`Upcoming Chapter Shifts`**: Chronological cards of incoming Mahadasha / Antardasha transitions.
  3. **`This Month's Key Dates`**: Peak flowing days & caution day chips (`monthPeakSummary`).
  4. **`Current Planetary Chapters`**: Progress bars + Explorer switcher between **`Vimshottari (120y)`** (`VimshottariExplorer`: interactive Mahadasha -> Antardasha -> Pratyantar tree auto-expanded to `● NOW`), **`Yogini (36y)`** (`YoginiExplorer`: 8-archetype sub-periods), and **`Chara (Jaimini)`** (`CharaExplorer`: sign-based dashas). *(Guided lens shows Vimshottari only.)*
  5. **`Double Transit Gates (Saturn + Jupiter)`** *(Explorer & Quant)*: House cards with SAV score badge, Saturn & Jupiter aspect notes, and **`Trace House # Pattern →`**.
  6. **`Live Sky Transits` (*Sade Sati*)**: Active/Inactive Sade Sati badge, Quant `Kakshya & Navatara ↗` button, 9 planet transit cards (`sign`, `retrograde`, `H# Lagna • H# Moon`, `BAV x/8` badge, Quant `K#` Kakshya badge, Vedha obstruction vs `✓ Unobstructed Flow`, `plainMeaning`, `Ask AI →`). Guided defaults to 4 cards with expand toggle.
  7. **`Personal Muhurta & Ghatak Guardrails`** *(Explorer & Quant)*: Supportive Days & Lucky Number card vs. Ghatak Caution Day/Tithi/Moon Sign + **`Full Amplifiers & Horas ↗`**.
- **Sub-View B — `Month Heatmap & Year Transits` (`CalendarExplorer.tsx`)**:
  - Fetches `GET /api/profiles/:id/calendar?year=...&month=...&date=...`.
  - Inner Toggle: `Month Heatmap` | `Year Transits (Gochar)`
  - Month Navigator (`‹` / `›`), Muhurta Filters (`all`, `career`, `travel`, `finance`, `rest`), color-banded day grid, selected-day telemetry panel + quick date reflection note saver (`astro_journal_entries_v1`).
- **Footer CTA**: `Compare this period with your Timeline →` (jumps to `journal` tab).

### Tab 4: `Yogas & Power` *(Mobile: `Yogas`)* (`src/tabs/StrengthsTab.tsx`)
- **3 Sub-Tabs**: `Yogas & Patterns` | `Planetary Power (Shadbala & SAV)` | `Soul Drivers & Harmonics`
- **Top Actions**: `Plain Guide` (`PlainEnglishExplainerModal`), `AI Dossier` (`LlmDossierModal`), `Ask AI`
- **Sub-Tab Content**:
  - **Yogas & Patterns**: `Active Auspicious Yogas` card grid (`Dosha Audit` button opening `DoshaAuditModal`, `Trace Pattern`, `Ask AI`) + `Active Doshas` card grid.
  - **Planetary Power**: `Shadbala Planetary Horsepower` bar cards with `1.0x` minimum strength threshold line, `Sarvashtakavarga 12-Sign Support`, plus Quant inline `ShadbalaTable`, `AshtakvargaTable`, and `FriendshipMatrix`.
  - **Soul Drivers & Harmonics**: `Jaimini Chara Karakas` (AK, AmK, BK, MK, PK, GK, DK), `Vaisheshikamsa (10-Varga Dignity)`, and `Pushkara Navamsha & Pushkara Bhaga` harmonic points.

### Tab 5: `Timeline` (`src/tabs/JournalTab.tsx`, `JournalExplorer.tsx`, `CalibrationExplorer.tsx`)
- **Top Sub-Tabs**: `Life Milestones & Daily Logs` | `Personal Patterns` + **`Add Life Milestone`** CTA (`LifeEventModal`)
- **Sub-Tab 1 (`Life Milestones & Daily Logs`)**:
  - Synced **Life Milestones** cards (`lifeEventsStore.ts`, synced via `POST /api/sync`).
  - **`Personal Almanac & Daily Journal` (`JournalExplorer.tsx`)**: **`Log Sky Entry`** modal (Mood `1–5`: Depleted/Low/Neutral/Good/Radiant; Energy `1–5`; Kind: `checkin`/`event`/`reflection`; Preset tags `work`, `focus`, `creative`, `meditation`, `family`, `health`, `travel`, `study` + custom tags; automatically freezes an immutable `SkySnapshotData` with transit score, band, Hora ruler, Moon Sign/Nakshatra, Dasha, Chandrabala, Tarabala, SAV), filter controls (Tag / Mood / Band), synced via `POST /api/journal`.
- **Sub-Tab 2 (`Personal Patterns` — `CalibrationExplorer.tsx`)**:
  - Bootstrap `95% CI` empirical verification (`n >= 30` observations) correlating user check-ins against planetary factors.
  - Non-Quant progress bar (`X / 30 check-ins`) + `Advanced Stats (Bootstrap CI)` toggle.
  - Category Filter Pills (`All Factors`, `Chandra Bala`, `Tara Bala`, `Time Quality`, `Hora Lords`, `Ashtakvarga`), baseline Mood Mean / Metrics cards, `Ask AI About My Patterns`, and Quant `Load Test Data (n=45)` / `Clear Test Data`.

---

## 6. Interactive SVG Chart Components

| Component | Geometry & Features |
| :--- | :--- |
| **`NorthIndianChart.tsx`** | Classic diamond chart inside square SVG. Houses `1–12` stay fixed counter-clockwise starting at top-center diamond (`H1`). Renders dynamic zodiac sign numbers per house, planet glyphs/degrees/retrograde markers, dashed SVG line/arrow overlays tracing House -> Lord connections when a house is focused, and keyboard (`Enter`/`Space`) + mouse selection (`aria-label`, `.svg-focusable`). |
| **`SouthIndianChart.tsx`** | 4×4 fixed zodiac matrix (`Aries` top-left moving clockwise to `Pisces`). Marks Ascendant (`Lagna`) cell and supports click/keyboard cell selection. |
| **`DualKundliChart.tsx`** | Natal + Live Transit overlay chart used in `ChartSystemsModal` -> `Dual Transit Overlay` tab. |

---

## 7. Modals, Drawers & Overlays (Complete Reference)

### 1. `AskCopilotDrawer.tsx` — AI Copilot Drawer
- Right-anchored drawer (`width: min(540px, 100vw)`).
- **Sticky Header**: Shows active `profileName` & `activeTab`, **`Event Date`** shortcut (`LifeEventModal`), **`Fast` vs `✦ Deep`** mode toggle (forced `Deep` when `isQuant`), Clear/Close.
- **Empty State Builders**: Guided **Life-Event Prompt Builder** (topic + time window pills) + tab-aware `CONTEXT_SUGGESTIONS`.
- **Conversation Stream**: User & AI bubbles (`because`, `timing`, `reflect`, clickable `followUps` chips, retry trigger, and LLM Dossier export fallback on `level2_fallback`), live tool-call reasoning trace (`liveSteps`) streamed over SSE (`POST /api/ask`).
- **Sticky Composer**: Text input + `Send` submit button.

### 2. `CommandPaletteModal.tsx` — Quick Jump (`⌘K` / `Ctrl+K`)
- Modal search input filtering unified results across: **`Life Topics`**, **`Modals & Tools`**, **`Navigation`**, **`Houses` (1–12)**, and **`Planets` (9)**.

### 3. `LifeEventModal.tsx` — Life Events Validator & Logger
- 5 quick preset buttons (`Started new job / career shift`, `Moved to a new city or home`, `Major relationship milestone`, `Health or lifestyle turning point`, `Personal breakthrough or big win`).
- Form fields: Title text input, `Event Date` (`date`), `Life Area` select (`Career & Work`, `Love & Marriage`, `Relocation & Home`, `Health & Inner Shift`, `Breakthrough / Milestone`).
- **Live Astrological Chapter Preview**: Displays active `Mahadasha / Antardasha / Pratyantar` lords + house lordship context for the chosen date (plus `Yogini` and `Jaimini Chara` when `!isGuided`).
- Actions: **`Ask AI to Explain This Event →`**, **`Save to Timeline`** (`astro_life_events_v1` + `POST /api/sync`), and **`Your Saved Life Milestones`** list with `Ask AI` and Delete (`Trash2`) actions.

### 4. `PatternDecoderModal.tsx` — Causal Chain Decoder
- Decodes Houses, Planets, or Yogas across a 4-card causal flow (`1. Sign & Atmosphere`, `2. Where the Energy Flows (Lordship)`, `3. Occupants & Drishti (Aspects)`, `4. Support & Current Timing`) with bottom navigation actions (`Highlight House #` / `Inspect <PLANET> on Chart` / `Check When It Activates`) and **`Ask AI About This Pattern`**.

### 5. `ChartSystemsModal.tsx` — Alternative Jyotish Systems
Header includes **`Ask AI`** + 5 tabs:
1. **`Dual Transit Overlay`**: `DualKundliChart` + `BhavaDossierExplorer` (12 Houses interactive selector grid with SAV points + full active house dossier).
2. **`Bhava Chalit`**: Shifted planet badges + `ChalitTable` (`Bhava`, `Sign`, `Bhava Begin`, `Bhava Madhya` in DMS).
3. **`KP System`**: `KpTable` — Planet & Ascendant Star/Sub-Lords, `12 House Cuspal Positions & Sub-Lords`, `Significators of Houses (4-Tier)`, and `Planet Significations`.
4. **`Varshaphal, Arudhas & Sahams`**: `SpecialLagnasAndVarshaphal` — Birth-to-+90y **Year Selector**, `Tajika Varshaphal` & Muntha, **36 Tajika Sahams** with category filter (`All`, `Vital`, `Wealth`, `Career`, `Rel`, `Family`, etc.) & text search (`GET /api/profiles/:id/varshaphal`), `Special Reference Ascendants` (HL, GL, SL, IL), `Perception vs. Reality (Maya vs. Sat)`, `Jaimini Arudha Padas (AL, A2–A11, UL)`, and `7 Upagrahas`.
5. **`Birth Panchang & Avakahada`**: `Birth Temperament & Panchang Summary`, `Avakahada Chakra` 6-cell grid (`Paya`, `Varna`, `Yoni`, `Gana`, `Vasya`, `Nadi`), and 5-limb `Panchang at Birth` + `Julian Day (UT)`.

### 6. `QuantMatrixModal.tsx` — Expert Quantitative Workbench
5 tabs:
1. **`Degrees & Vargas (D1–D60)`**: Full Sidereal Nirayana longitudes, Nakshatra/Pada, Dignity, Chara Karaka table + D1–D60 Sign Matrix (marks `★ Vargottama`).
2. **`Shadbala & Bhavabala`**: `ShadbalaTable` with **`Planets (Shadbala)` / `Houses (Bhavabala)`** switcher (Sthana, Dig, Kala, Chesta, Naisargika, Drik, Total Virupas, Rupas, Req, Ratio, Rank).
3. **`Ashtakvarga & Maitri`**: `AshtakvargaTable` with **`BAV / SAV` / `SAV Chart` / `Prastara (8 Rows)`** switcher + `337` Total Bindus badge + `FriendshipMatrix` (**`5-Fold (Panchadha)` / `Permanent` / `Temporal`**).
4. **`Kakshya · Vedha · Navatara`**: Kakshya 3°45' planet cards (`1 Bindu ✓` / `0 Bindus`, ruler, Gochara Vedha father–son exemption & obstructions), **Navatara (9-Tara) & 11 Special Life Stars** grid, `Active Latta` alert banner, and collapsible **27-Star Table**.
5. **`24 Horas, Panchang & Ghatak`**: 24 Day & Night unequal planetary Hora cards, Today's 4-limb Panchang (`Vara`, `Tithi %`, `Yoga %`, `Karana` + `Vishti Bhadra` check), and `Favourable Personal Amplifiers` vs `Ghatak Caution Guardrails`.

### 7. `DoshaAuditModal.tsx` — Dosha Cancellation Audit
- **`✓ Cancelled by Classical Bhanga`**: Cards listing neutralized doshas with classical `cancellationNote` explanations.
- **`✓ Verified Absent Doshas`**: Grid of checked doshas confirmed absent.

### 8. `PlainEnglishExplainerModal.tsx` & `GlossaryTerm.tsx`
- Inline **`GlossaryTerm`** pill buttons (`BAV`, `SAV`, `Tarabala`, `Chandrabala`, `Sade Sati`, `Vargottama`, `Shadbala`, `Chara Karaka`, `Muntha`, `SubLord`) show quick popover tooltips with a `"Deep Guide →"` link into the modal.
- Modal features live text search + 7 category tabs: `Kundli & Charts`, `Dashas (Time Cycles)`, `Panchang & Rhythms`, `Strengths & Tables`, `Interpretations, Yogas & Avasthas`, `Ashtakoota & Compatibility`, `Time Quality & Daily Windows`.
- Each term card renders 3 structured blocks: **`1. What Is It?`**, **`2. Why Does It Happen?`**, and **`3. Plain English Meaning`**.

### 9. `OnboardingModal.tsx` — Add / Edit Birth Chart
- Supports `mode: 'add' | 'edit'`.
- Inputs: Full Name, Birth Date, Birth Time (`step="1"`), Birth City (`GooglePlaceAutocomplete`), live Lat/Lon/TZ/Ayanamsa summary, `Birth Time Certainty` (`Exact`, `Approx`, `Unknown`), and collapsible **`Calculation & Coordinate Settings`** (`Latitude`, `Longitude`, `Timezone ID`, `Ayanamsa` selector — auto-expanded when `mode === 'edit' && ayanamsa !== 'lahiri'`).
- Saving sets `forceRecompute: true`, clears stale caches, and calls `POST /api/profiles`.

### 10. `GoogleAuthModal.tsx` — Account Sign-In / Switcher
- Modal dialog featuring Google Sign-In button (`GOOGLE_CLIENT_ID`) plus localhost dev email/name login (`ALLOW_DEV_AUTH=true`).

### 11. `LlmDossierModal.tsx` — External LLM Context Export
- Toggle between **`Prompt Format (Markdown)`** and **`Raw Data (JSON)`** (`~tokens` estimate badge), **`Copy Prompt`**, and **`Download .md/.json`** for ChatGPT / Claude / Gemini / DeepSeek.

### 12. `ShareBlueprintModal.tsx` — Shareable Cosmic Card
- Displays 2×2 card (`Rising (Lagna)`, `Moon & Star`, `Soul & Career Drivers AK/AmK`, `Signature Yoga`), `coreNature` blurb, active Dasha, and **`Copy Shareable Summary`** CTA.

### 13. `PrintableNatalReport.tsx` — Print / Save PDF Dossier
- Print-optimized (`print:bg-white print:text-black`) dossier with **`Print / Save PDF`** (`window.print()`):
  1. Native metadata header grid (Name, Birth Date/Time/Certainty, City, Coordinates, Timezone, Ayanamsa, Lagna)
  2. Birth Panchang & Tithi 6-cell summary
  3. Side-by-side D1 Rashi & D9 Navamsha SVG charts
  4. Planetary Positions & Dignities table
  5. Sarva Ashtakvarga (`337 Bindus`) & Avakahada Chakra
  6. 120-Year Vimshottari Dasha Lifeline

### 14. `DataSovereigntyModal.tsx` — Backup, Import & Hard Reset
- **Export JSON**: Downloads `myastro_backup_YYYY-MM-DD.json` (`currentProfile`, `savedProfiles`, `journalEntries`).
- **Restore from Backup (JSON)**: Validates `app === "MyAstro"` signature and restores profile + journal records.
- **Hard Reset**: Safeguarded behind typing **`RESET`** before wiping local state.

---

## 8. API & Local State Contracts (For Redesign / Android Parity)

### Screen-to-Endpoint Map (`apps/web/src/services/apiClient.ts`)

| User Flow / Screen | HTTP Endpoint | Caching / Sync Strategy |
| :--- | :--- | :--- |
| Sign-In Gate / Switch Account | `POST /api/auth/google`, `GET /api/auth/me` | Stores JWT in `astro_auth_token_v1`; returns owned profiles |
| Create or Edit Profile | `POST /api/profiles` | Server computes Level 1 + 2 once, bumps `bundleVersion`, clears daily sky cache |
| Profile Switch / App Reload | `GET /api/profiles/:id/bundle` *(only if uncached locally)* | Zero network calls once `astro_server_bundle_v2_<id>` passes `profileMatchesBundle()` |
| Delete Profile | `DELETE /api/profiles/:id` | Removes profile & cascaded SQLite rows |
| `Today` Tab | `GET /api/profiles/:id/today?date=...&tzId=...&lat=...&lon=...` | Cached locally per `profileId\|dateStr\|tzId\|lat\|lon` in `astro_server_today_v1_<id>` |
| `Timing` -> Calendar Heatmap | `GET /api/profiles/:id/calendar?year=...&month=...&date=...` | Fetched on month/year/date change |
| `ChartSystemsModal` -> Varshaphal | `GET /api/profiles/:id/varshaphal?year=...` | Fetched per selected solar-return year |
| `AskCopilotDrawer` AI Chat | `POST /api/ask` (`Accept: text/event-stream`), `GET /api/conversations/:id` | Streams `liveSteps` tool events; falls back to `level2_fallback` if LLM unavailable |
| `Timeline` / `LifeEventModal` Sync | `POST /api/sync`, `GET /api/journal/:profileId`, `POST /api/journal` | Bidirectional delta sync using `astro_last_sync_at_v1` |

### Client Storage Keys -> Suggested Android (`DataStore` / `Room`) Equivalents

| Web `localStorage` Key | Purpose | Android Mapping Suggestion |
| :--- | :--- | :--- |
| `astro_auth_token_v1` | Bearer JWT token | Encrypted `SharedPreferences` / `DataStore` |
| `astro_active_profile_v1` | Active `UserProfileInput` JSON | `Room` Profile entity (`isActive = true`) |
| `astro_backend_profile_id_v1` | Active server profile UUID | `DataStore` active ID preference |
| `astro_server_bundle_v2_<id>` | Cached `StaticBundleResponse` (`level1Static` + `level2Static`) + `etag` | `Room` `ChartBundleEntity` keyed by `profileId` + `bundleVersion` |
| `astro_server_today_v1_<id>` | Daily `/today` cache (`profileId\|date\|tzId\|lat\|lon`) | `Room` `TodaySkyCacheEntity` |
| `astro_reading_depth_v1` | `'simple' \| 'standard' \| 'detailed'` lens choice | `DataStore` user preference |
| `astro_chart_style_v1` | `'north' \| 'south'` SVG style preference | `DataStore` user preference |
| `astro_journal_entries_v1` | Journal entries + frozen `SkySnapshotData` | `Room` `JournalEntryEntity` |
| `astro_life_events_v1` | Saved life milestones (`lifeEventsStore.ts`) | `Room` `LifeEventEntity` |
| `astro_copilot_chat_v2_<id>` | Persisted chat history per profile | `Room` `ChatMessageEntity` |
| `astro_last_sync_at_v1` | ISO timestamp for delta `/api/sync` | `DataStore` sync cursor |

### Native Android UI Mapping Hints
- **SVG Kundli Charts (`NorthIndianChart` / `SouthIndianChart`)**: Port the `0..400` / fixed 4×4 coordinate math directly to Compose `Canvas` with `semantics { contentDescription = ... }` per house tap target.
- **Sticky Side Inspector (`KundliTab`)**: Convert desktop side-by-side layout into compact Compose top chart + `ModalBottomSheet` / expandable house pager on phones, retaining split-pane on foldable/tablet widths (`>= 840dp`).
- **Command Palette (`⌘K`)**: Map to TopAppBar Search Action opening full-screen Material 3 `SearchBar` over Houses, Planets, Life Topics, and Systems.
- **SSE Copilot Streaming**: Consume `POST /api/ask` SSE stream with OkHttp `EventSource` or Ktor SSE to render live `"Thinking & checking your chart..."` step ticks before the structured reply.
