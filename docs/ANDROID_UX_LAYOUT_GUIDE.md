# Android UI & UX Layout Guide — KundliFlow (MyAstro)

> **Canonical Specification (v2 — Calm Depth and Gradual Discovery)**
>
> Blueprint for building a **native, calm, habit-forming Android app** (Jetpack Compose + Material 3 Expressive) backed by KundliFlow (`apps/api`).
>
> **Core Directive:** Preserve **100% of the visual theme** (`#15132B` Midnight Indigo, `#201D40` / `#2A2652` surfaces, `#E3AD46` Antique Gold, `#5FC2B3` Celestial Teal, `#D97736` Amber, `#F3EEE2` Parchment, `Cinzel` + `Plus Jakarta Sans`) and **100% of the Vedic content & API capabilities**, while **discarding the web desktop layout**. Users discover chart depth **one rung at a time**, never all at once.

---

## 1. Visual Theme & Material 3 Design System

Preserves the exact aesthetic from [`apps/web/src/index.css`](../apps/web/src/index.css), [`packages/content/scoring.yaml`](../packages/content/scoring.yaml), and [`ASSET_PROMPTS.md`](../ASSET_PROMPTS.md), adapted for edge-to-edge Android OLED screens.

### 1.1 Color Tokens (`Color.kt`)

| Role | Hex / Alpha | Android M3 Mapping & Semantic Usage |
| :--- | :--- | :--- |
| **Deep Cosmic Indigo** (`bgInk`) | `#15132B` | `background`, `surfaceContainerLowest`. Edge-to-edge canvas behind transparent system bars. |
| **Indigo Surface** (`surface`) | `#201D40` | `surfaceContainerLow`. Cards, modal bottom sheets, collapsed inspector dock. |
| **Elevated Indigo** (`surfaceAlt`) | `#2A2652` | `surfaceContainerHigh`. Active chips, selected house polygon fill, nested panels. |
| **Glass Dock Indigo** | `#EB201D40` (92%) | Floating bottom capsule & sticky bars (`RenderEffect` blur on API 31+, solid `#201D40` fallback below API 31). |
| **Warm Parchment** (`textMain`) | `#F3EEE2` | `onBackground`, `onSurface`. Primary headlines, interpretive prose, planet glyphs. |
| **Muted Twilight** (`textMuted`) | `#A6A0BA` | `onSurfaceVariant`. Astronomical metadata, timestamps, secondary subtitles. |
| **Antique Gold** (`gold`) | `#E3AD46` | `primary`. Sacred Vedic accent, `Steady` band color, active tab highlight, chart lines, Lagna markers, lit discovery nodes. |
| **Celestial Teal** (`teal`) | `#5FC2B3` | `secondary`. `Flowing` band color, `● NOW` markers, `Ask` Copilot orb aura, cancelled *Bhanga* badges, focus rings. |
| **Warm Amber** (`amber`) | `#D97736` | `tertiary`. `Go gently` band color (Rahu Kalam / Yamaganda / Ghatak). **Never use red for scoring bands or transits.** |
| **Alert Crimson** | `#F87171` / `#E06C75` | `error`. Reserved strictly for destructive UI actions (e.g., Data Vault `RESET`) or network error retry prompts—never astrological states. |
| **Gold Hairline** | `#33E3AD46` (20%) | Subtle border on selected items and spotlighted chart containers. |
| **Subtle Divider** | `#14F3EEE2` (8%) | Quiet dividers inside sheets and tables. |

### 1.2 Ambient Gradients & Typography (`Type.kt`)
- **Cosmic Hero Radial:** Subtle radial washes (`gold` 14% alpha top-right, `teal` 10% alpha bottom-left) over `#15132B`.
- **Ask Orb Gradient:** `135°` linear gradient (`#5FC2B3` → `#E3AD46`) with high-contrast `#121026` iconography.
- **Display Serif (`Cinzel` — 500, 600, 700):** Hero band word, screen/sheet titles, `ShareBlueprint` card (`letterSpacing = 0.04.em`). Never use `Cinzel` below `14sp` or on multi-line paragraphs.
- **UI & Telemetry Sans (`Plus Jakarta Sans` — 400, 500, 600, 700):** Body copy (`15sp`, `lineHeight = 23sp`). Planetary degrees (`DMS`), Ashtakvarga bindus, Shadbala ratios, and timers use `fontFeatureSettings = "tnum"` (tabular numerals) so scrubbing never shifts layout.

### 1.3 Sacred Assets (`ASSET_PROMPTS.md`)
- Render the **5 Sacred Motifs** (`motif-surya`, `motif-kalachakra`, `motif-yantra`, `motif-journal`, `motif-ganesha`) as quiet `8–12%` opacity watermarks on onboarding cards and section backdrops.
- Pair **9 Navagraha medallions** and **12 Rashi medallions** with Hora pills, Dasha bars, Planet/House cards, and the `9:16` Cosmic Blueprint card.

---

## 2. Core Interaction Model: The Depth Ladder

Instead of asking newcomers to pick `Guided`, `Explorer`, or `Quant` before seeing any value, every astrological subject lives on a unified **4-Rung Depth Ladder**. Users descend one rung per tap/gesture and return cleanly.

| Rung | Name | Appearance & Content | Gesture | Moon Example | Budget |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **0** | **Glance** | One word or number + glyph on a main screen | None | *Moon in Pisces: Calm* | 1 line |
| **1** | **Peek** | Compact card or half-sheet summary (`simple` / `overview`) | Tap subject | Sign, nakshatra, what it covers | 3 facts, `<= 40` words |
| **2** | **Explain** | Reading sheet with Level 2 findings + expandable `Why` chips | Tap `Why` or swipe up | Findings + evidence IDs (`standard`) | 3 findings visible |
| **3** | **Evidence** | Full-screen Level 1 telemetry: degrees, tables, rule IDs (`detailed`) | Tap `Show the math` | Nirayana longitude, Shadbala, Bindus | Uncapped (Tools & Tables) |

### Depth Ladder Rules
1. **Main Screens Stay Calm:** Main tabs surface only **Rungs 0 and 1**. **Rungs 2 and 3** open inside sheets or full-screen Tools studios.
2. **Universal Sheet Footer:** Every `SubjectSheet` ends with the exact same two-button footer: **`Ask`** (opens Copilot sheet pre-filled with this subject) and **`Reflect`** (opens the Journal composer pre-filled). There are no scattered per-card `Ask AI` buttons.
3. **Single Subject Identity:** Tapping the same subject from the Kundli canvas, a `Today` card, a Discovery story, or an AI evidence chip opens the exact same `SubjectSheet` keyed by `Subject`.
4. **Zero-Network Rung Transitions:** Because `GET /api/profiles/:id/bundle` already embeds `level1Static` alongside `level2Static` (`simple`, `standard`, and `detailed` readings per house, planet, and period), switching between Rungs 1, 2, and 3 executes **100% locally from `Room`**. Only `Ask` calls Level 3 (`POST /api/ask`).
5. **Self-Adapting Detail Level (No Onboarding Quiz):** Remove lens selection from onboarding (default to `Balanced`). After a user taps **`Show the math`** (Rung 3) three times, prompt once: *"Always show details?"* (sets `detailLevel = Full`). Settings inside `Me` offers manual selection (`Simple`, `Balanced`, `Full`).
6. **Visited-Stack Predictive Back:** System Back pops the **visited rung stack** for that sheet. If the user traversed `Peek -> Explain -> Evidence`, Back steps `Evidence -> Explain -> Peek -> Dismiss`. If the user jumped straight to Rung 2 (`Explain`, e.g., tapping `Yogas` on the Explore shelf), Back dismisses the sheet directly rather than dropping into an unseen `Peek` state.
7. **`44dp` Spatial Mini-Kundli Header:** Whenever `SubjectSheet` opens for a `House` or `Planet` from `Today`, `Discovery`, or `Ask`, display a `44dp` North/South mini-chart icon in the sheet header with that house/planet glowing gold—quietly teaching spatial geometry without extra taps.
8. **Zero-Trap One-Thumb Sheet Physics:** At `Peek` and `Half` (`55%`) detents, vertical swipes anywhere inside `SubjectSheet` or the Chart Inspector move the **sheet** smoothly between detents; inner vertical list scrolling activates **only** at the `Full` (`90%`) detent so nested-scroll fights never trap the thumb.

### Compose Contract (`SubjectSheet.kt`)

```kotlin
enum class SubjectFindingKind { RULE, YOGA, DOSHA, TRANSIT, PATTERN }

sealed interface Subject {
    data class Planet(val id: PlanetId) : Subject
    data class House(val number: Int) : Subject
    data class Period(val id: String) : Subject
    data class Finding(val id: String, val kind: SubjectFindingKind = SubjectFindingKind.RULE) : Subject
    data class DivisionalChart(val varga: VargaType) : Subject
}

enum class Rung { Glance, Peek, Explain, Evidence }

@Composable
fun SubjectSheet(
    subject: Subject,
    rungStack: List<Rung>, // top = active Rung; Back pops stack cleanly
    onPushRung: (Rung) -> Unit,
    onPopRung: () -> Unit,
    onAskSubject: (Subject) -> Unit,
    onReflectSubject: (Subject) -> Unit,
)
```

---

## 3. Screen Budgets & Clutter Lint

Above the fold, each primary tab shows **1 Hero**, **1 Primary Action**, and **1 Curiosity Item**. Everything else waits for a tap or scroll.

### 3.1 Hard Per-Screen & Per-Card Limits

| Element | Limit |
| :--- | :--- |
| Hero | `1` per screen |
| Primary action | `1` per screen |
| Curiosity item | `1` per screen |
| Secondary cards before first scroll | `<= 2` |
| Findings visible per card | `<= 3` |
| Words per card (Rungs 0–2) | `<= 40` |
| Numbers per card (Rungs 0–2) | `<= 3` *(uncapped only at Rung 3)* |
| Chips visible per row | `<= 4`, then horizontal scroll |
| Status colors | Band color only (`#5FC2B3` Flowing, `#E3AD46` Steady, `#D97736` Go gently) |

### 3.2 Clutter Lint & Design-Review Gate
- **Writing:** Every Sanskrit term carries a plain English gloss on first appearance (tappable for the `Glossary` sheet); every number carries a plain label next to it.
- **Visual:** Maximum `1` accent color and `2` type sizes per card; borders appear only on selected items; maximum `2` surface elevation levels (`#201D40`, `#2A2652`).
- **5-Question PR Gate:**
  1. Can this screen be described in one sentence?
  2. Is there one obvious next tap?
  3. Does it obey every cap in §3.1?
  4. Does every number have a plain label?
  5. Is anything shown that the user has not yet earned the context for?

---

## 4. Navigation, Thumb-Zone Shell & Adaptive Layouts

Four destinations flank the central **`Ask` Copilot Orb** inside a floating capsule dock `12dp` above the Android gesture bar (`navigationBarsPadding()`).

```text
+---------------------------------------------------+
| [Priya ▾]                                     [⌕] |  <- 56dp Collapsing Top Bar
+---------------------------------------------------+
|                                                   |
|              SCROLLABLE / TOUCH CANVAS            |  <- Edge-to-edge #15132B
|          (Today / Chart / Time / Journal)         |     Zero blocking corner FAB
|                                                   |
+---------------------------------------------------+
|  [Today]  [Chart]   (✦ Ask)   [Time]  [Journal]   |  <- 72dp Floating Capsule Dock
+---------------------------------------------------+
```

### 4.1 Complete Web-to-Android Parity Map

| Web Surface (`apps/web`) | Native Android Home |
| :--- | :--- |
| Topbar `⌘K Command Palette` | Top-right **`Search` (`⌕`)** opening Material 3 full-screen `SearchBar` over Life Topics, Houses `1–12`, Planets `9`, Systems, and Glossary terms. |
| Sidebar `Active Profile` + `Saved Charts` + `Tools & Vault` + `Settings` | Top-left **Profile Chip (`Priya ▾`)** opening the **`Me` Sheet**, organized into 3 scannable collapsible groups:<br>• **Your Charts:** Profile Switcher (`+ Add`, `Edit` w/ `Time Certainty` & `Ayanamsa`: `Lahiri`, `KP New`, `KP Old`, `Raman`, `Yukteshwar`, `Delete`) with quiet **Orbit Band Dots** (teal/gold/amber dot per cached profile today) and an opt-in Day-8 prompt (*"Want to see how today flows for someone close to you? Add a chart."*).<br>• **Preferences:** `Detail level` (`Simple`/`Balanced`/`Full`), `Chart Style` (`North`/`South`), `Notifications & Quiet Hours`.<br>• **Your Data & Deep Lore:** `Discovery Map`, `9:16 Share Cosmic Blueprint`, `Print / PDF Dossier`, `AI LLM Context` (`Markdown`/`JSON`), `Plain English Glossary` (7 categories), `Data Sovereignty Vault` (`Export JSON`, `Restore`, guarded `RESET`), and `Google Sign-In / Sign out`. |
| `Today` Tab | **Tab 1: `Today`** (Band hero w/ Personal Hook, 1-tap check-in, 1 Discovery curiosity, 40dp collapsed day strip, `Explore` row). |
| `Kundli` + `Yogas & Power` + `ChartSystemsModal` + `QuantMatrixModal` + `DoshaAuditModal` + `PatternDecoderModal` | **Tab 2: `Chart`** (1 full-width canvas, 3-detent Inspector, `Explore` horizontal shelf, and the quiet `Tools` room at Rung 3). |
| Floating `Ask AI` FAB + `AskCopilotDrawer` | **Center `Ask` Jewel Orb** + uniform **`Ask`** footer button inside every `SubjectSheet`. |
| `Timing` + `LifeEventModal` + `CalendarExplorer` | **Tab 3: `Time`** (`Now` chapter, `Next shift`, `Month calendar`, `Time-Machine` milestones, plus transits/dashas behind tap). |
| `Timeline` (`JournalExplorer` + `CalibrationExplorer`) | **Tab 4: `Journal`** (First-class tab: Progressive Composer, `Your Patterns`, Weekly Rhythm dots, `Entries` + `Milestones` filter, Weekly Review). |

### 4.2 Adaptive `WindowSizeClass` Rules & Cross-Tab Return
- **Compact (`< 600dp` — Phones):** Floating bottom dock + center orb; full-width `1:1` Kundli canvas + 3-detent Bottom Sheet Inspector; single-column scroll.
- **Medium (`600dp–839dp` — Unfolded Foldables):** Left **Material 3 `NavigationRail`** (`80dp`, with `Ask` jewel anchored in rail); `50/50` split between Kundli canvas and Inspector panel.
- **Expanded (`>= 840dp` — Tablets):** Persistent Navigation Rail + 2-pane Chart/Inspector Studio + side-docked `420dp` `Ask` Copilot panel.
- **Contextual Cross-Link Back Pill:** When a deep nudge or `Explore` chip jumps across tabs (e.g., `Explore: Career` on `Today` → `Chart` focused on `H10/D10`), show a floating pill at top-left (`← Back to Today`) for `10s` or until browsing elsewhere so cross-tab exploration never feels disorienting.

---

## 5. Screen-by-Screen Blueprints

### 5.1 `Today` (`GET /api/profiles/:id/today`)

```text
+---------------------------------------------------+
| [Priya ▾]                                     [⌕] |
+---------------------------------------------------+
|                                                   |
|   Good evening                                    |
|            (   Flowing   )                        |  <- Hero: Band word + soft ring
|   Jupiter hour · your 10th house lights up        |  <- Personal Hook Line (Top Factor)
|   "A strong window for career moves"              |     Tap -> Peek (-7..+7 score +
|                                                   |            3 reasons + disclaimer)
|   Next shift 19:40: Venus hour, Steady            |
+---------------------------------------------------+
|   How does now feel?   1   2   3   4   5          |  <- Primary Action (1-tap log)
+---------------------------------------------------+
|   In the sky today                                |
|   The Moon moves into your 11th house.            |  <- 1 Curiosity (Discovery Path)
|   Tap to see what it lights up.                   |
+---------------------------------------------------+
|   Your day  ────o───────────────────────          |  <- 40dp Strip -> Expandable Wave
|   Go gently 10:30 to 12:00   Best 16:20 to 18:00  |     Sheet w/ hourly haptic ticks
+---------------------------------------------------+
|   Explore:  Career   Home   Love   Money   Year  >|  <- Horizontal Life Topics Reel
+---------------------------------------------------+
```

- **Band-First Hero with Personal Hook Line:** Shows the band word (`Flowing`, `Steady`, `Go gently`) inside a soft tinted ring. Below it sits the **Personal Hook Line**: because `dayView.hourlyScores[hour].factors` is unsorted, the client sorts `factors` by magnitude aligned with the current band (highest positive `value` when `flowing`, lowest negative when `go_gently`) to identify the dominant driver, then joins the active `horaRuler` from `dayView.horas` with `level1Static.natal.grahas[horaRuler]` in `Room` to map which natal house(s) it rules or occupies (*"Jupiter hour · highlights your 10th house of work & focus"*; falls back to natural karaka domain like *"learning & reflection"* when `timeCertainty == "unknown"`). Active Hora and `Next shift` timestamp (`19:40`) are read from `dayView.horas` paired with `dayView.hourlyScores[hour]`. Tapping the hero opens **Rung 1 (`Peek`)** with the numeric score (`-7..+7`), top 3 reasons, and the disclaimer: *"This is tradition and reflection, not a prediction."* Tapping **`Show the math`** opens **Rung 3** (`Live Panchang`, `24 Horas`, and full `ScoreFactors`).
- **1.5-Second "Inline Sky Echo" Check-in Morph:** Tapping `1–5` on the Primary Action bar saves immediately and smoothly morphs the bar inline for `8s` (no modal interruption) into: `Saved (4/5) · Bottled under Jupiter Hora · Flowing` with optional 1-tap tag pills `[Work] [Focus] [Calm] [+ Note]`.
- **40dp Collapsed Day Strip & Evening "Horizon Hook":** Renders `dayView.hourlyScores[0..23]` with `dayView.flowingWindows`, `dayView.goGentlyWindows`, and `dayView.inauspicious.rahuKalam`. Tapping opens the full-width **Thumb-Scrubbable 24-Hour Wave Sheet** (`Canvas` Bezier curve with hourly `CLOCK_TICK` haptics and live sticky Hora/band pill; `Go gently` regions tint soft amber with a gentle `REJECT` pulse—never an alarm countdown on the hero). After `19:00` local time, the strip footer pivots to **Tomorrow's Opening** (via pre-fetched `date + 1` cache): *"Tomorrow opens Flowing · Best window 09:15–11:30 (Venus Hora)."*
- **The Core "Aha Moment" Design (Dual-Branch + Safety Preemption):**
  - *The Retention Inflection Point:* Comparing the user's first two moods logged across **two distinct bands** (e.g., *Go gently* vs. *Flowing*). If the 2nd check-in falls in the same band, defer the card until a second distinct band is logged.
  - *Dual-Branch Copy:*
    - **Aligned** *(e.g., mood `2` in Go gently, `4` in Flowing)*: *"Your first two sky snapshots: 2 in Go gently, 4 in Flowing. Early sign your rhythm tracks the sky."*
    - **Inverted** *(e.g., mood `4` in Go gently, `2` in Flowing)*: *"Interesting—you felt 4/5 during Go gently. That's why we calibrate to YOU, not generic horoscopes. Over time we'll see if Hora or Moon sign matters more for your chart."*
  - *Safety Preemption:* **Distress Safety Flow (§7.3) ALWAYS preempts** the Aha Moment and all astrological UI (e.g., if `mood == 1` twice in 3 days).
- **Single Dynamic Slot Arbiter (`resolveTodaySlot`):** To strictly honor §3.1's screen budget (`1` Hero, `1` Primary Action, `1` Curiosity Item), `Today` renders **strictly ONE dynamic slot** between `Check-in` and the `40dp Day Strip` selected by priority:
  `P0` Distress Safety Screen *(full takeover)* > `P1` Welcome-Back Digest *(`> 72h`)* > `P2` Check-in #2 Aha Comparison > `P3` Sunday Weekly Review > `P4` Live Sky Event > `P5` First-Week Nudge *(max 1/day)* > `P6` Curiosity Slot *(Act I Discovery Node → Act II Evergreen Cycle)*.
- **Calm Location Switcher:** Tapping city inside the Day Wave Sheet or `Me` opens Place Search to refresh `/today` for travel/current city.
- **First-Week Progressive Emergence Schedule (Days 1–7):**
  - *Day 1 (Initial launch):* Hero with Personal Hook, 1-tap Check-in, **Curiosity Slot** (Node #4 after Onboarding Triad lights nodes 1–3), and `Explore` row.
  - *Day 1 (After 1st check-in):* Earned reveal—unlocks the **40dp Collapsed Day Strip**.
  - *Day 2:* Reveals the 1-line **Current Chapter** subtitle (`Mahadasha / Antardasha`).
  - *Day 3:* Surfaces **Discovery Node #5** + **Aha Moment Card** (once 2 distinct bands are logged).
  - *Day 4:* **Hora Accuracy Nudge:** *"Yesterday you felt [mood] during a Jupiter hour. Today's Jupiter hour starts at 16:20."*
  - *Day 5:* **Goal-Aligned Chart Nudge:** *"Your chart has a story about [Onboarding Goal]. Tap Chart to see House [X]."*
  - *Day 6:* **Weekly Rhythm Preview:** *"You've checked in [N] times this week. Sunday brings your first weekly review."*
  - *Day 7 (Sunday):* Unlocks the first **Weekly Review** (`Your week in the sky` + 1 verified pattern).
  - *After 7 entries:* Surfaces the **`Your Patterns`** teaser link.
  - *Sky Events:* Surfaces a `Sky movers` card only when notable events occur (sign ingress, Sade Sati shift).
- **Warm Welcome-Back State (`lastOpenedAt > 72h` Absence):** If the user returns after > 3 days of absence, replace the hero with a guilt-free welcome:
  *"Welcome back. Here's what shifted while you were away:"*
  - 1 Dasha / transit shift summary (if any occurred)
  - Current sky band compared to their historical average
  - Primary CTA: *"Pick up where you left off"* → resumes their next Discovery node. Zero broken streak banners, zero guilt copy.
- **Anti-Compulsion Constructive Redirect (`> 8 Opens/Day`):** If `Today` is opened more than `8` times in one day *and* neither the current **Band** nor active **Hora ruler** has changed since `lastOpenedAt`, protect against astrological anxiety by redirecting rather than stonewalling:
  *"The sky is the same as 14:20. While you wait for the next shift at 19:40, explore [Next Discovery Node] or reflect in your Journal."* (Protects against compulsive checking while providing a constructive, reflective path). When a real Hora or Band transition occurs, the hero refreshes normally.

---

### 5.2 `Chart` (One Canvas + Inspector + `Explore` Shelf + `Tools` Room)

```text
+---------------------------------------------------+
| Taurus rising · Moon in Pisces      [Chart opts]  |  <- Dynamic identity + options icon
| Saturn rules your career house                    |  <- Emotional Entry Line (Goal-aligned)
+---------------------------------------------------+
|                                                   |
|            [ Full-Width Chart Canvas ]            |  <- 1:1 Compose Canvas (North/South)
|       Selected house glows gold + lord line       |     Drag/tap isolated from pager
|                                                   |
+---------------------------------------------------+
| [D1 ▾]   Career   Love   Money   Home             |  <- Varga chip + Life Topic pills
+---------------------------------------------------+
| ═══  House 4, Leo · Lord Sun · Mixed         ‹ ›  |  <- Inspector Peek Detent
+---------------------------------------------------+
```

- **Emotional Entry Point (Dynamic Chart Headline):** Precedes the geometric canvas with one dynamic, meaning-grounded sentence: `Taurus rising · Moon in Pisces · Saturn rules your career house`. The 3rd element dynamically pivots to match the user's primary onboarding intent (`Career` → H10 lord; `Relationships` → H7 lord; `Finance` → H2/H11 lord). This grounds the intricate polygons in personal life meaning before the user touches a single box.
- **Canvas-First Stage, Live Transit Moon Pulse & Long-Press Drishti:** `NorthIndianChart` (`0..360` diamond polygons) or `SouthIndianChart` (`4×4` zodiac matrix) fills full width with `1:1` aspect ratio. Selecting a house lights it in `20%` gold and animates dashed **House → Lord** vectors.
  - *Live Transit Moon Pulse:* Render a soft pulsing **Celestial Teal dot (`●`)** inside the natal house where the live Moon is transiting today (from `/today` `transits`), paired with a quiet subtitle chip (`● Moon transiting House 11 today`), keeping the static natal chart alive every ~2.25 days.
  - *Long-Press Drishti Threads (`Rung 1.5`):* Holding a finger on any house or planet temporarily illuminates golden dashed **aspect threads** (`7th`, plus Mars `4/8`, Jupiter `5/9`, Saturn `3/10`) with a subtle `CONTEXT_CLICK` haptic; lifting fades them cleanly away.
- **`Chart options` Icon:** Houses `North / South`, `Lagna / Moon` reference, and optional `Compare with D1` split view (auto side-by-side on Medium/Expanded tablets).
- **Touch Safeguard:** Disable horizontal parent swiping while pointer gestures originate inside the chart canvas.
- **`Teach Me` (First Visit Only, 3 Steps):** Dimming overlay highlighting **Houses → Lords → Timing** offered once on first visit (re-triggerable from `Chart options`).
- **3-Detent Inspector Sheet & Empty State:**
  - *Empty State (Nothing selected yet):* Shows a warm invitation: *"Tap any house to see what it holds for you."* with a subtle, 1-second gentle pulse on House 1 (Lagna / Self).
  - *Peek:* Active subject 1-line summary + **`‹` / `›`** buttons to walk `H1–H12` or `9` Planets with one thumb.
  - *Half (55% — chart remains visible above):* `[ Houses (12) | Planets (9) ]` pill, telemetry chips (`Sign`, `Lord`, `Placed House`, `SAV` / `Degree`, `Dignity`, `Owned`, `D9`), and up to 3 findings with expandable **`Why`** + tappable `Glossary` terms (`Rung 2`). Note: Findings link to the **4-Step Swipeable Story `PatternDecoder`** (`1. Sign` → `2. Lordship` → `3. Occupants & Drishti` → `4. Support & Timing`).
  - *Full (90%):* Complete reading + **`Show the math`** row (`Rung 3`) + uniform `[ Ask | Reflect ]` footer.
- **`Explore` Shelf (Below First Fold):**

| Shelf Card | Opens | Rung |
| :--- | :--- | :--- |
| **Yogas** | Active auspicious yogas with plain meaning + `PatternDecoder` | 2 |
| **Doshas** | Reassuring `Dosha Audit`: Active vs **Cancelled by Classical *Bhanga*** vs Verified Absent | 2 |
| **Strengths** | Sorted `Shadbala` horsepower bars (`1.0x` threshold line, tap → 6-factor sheet + `Bhavabala`), 3×4 `SAV` Bindu heatmap (`337` total), `Chara Karakas` & `Harmonics` (`Vaisheshikamsa`, `Pushkara`) | 2 → 3 |
| **Divisional charts** | `D1–D60` grid with plain-English domain subtitles (`D9 Marriage`, `D10 Career`, `D2 Wealth`, etc.) | 2 |
| **Chapters** | Jumps directly to `Time` tab | 1 |
| **Tools** | Quiet door into the **Rung 3 Tools Room** | 3 |

- **The `Tools` Room (Specialist Workbench — Rung 3):** Keeps deep astrology 1 tap away for power users without cluttering main flows:
  - *Tools Empty / Intro Banner:* *"Specialist workbench: raw calculation matrices, KP cusps, and Varshaphal. Everything here is for deep study."*
  1. `Dual Transit Overlay` (`DualKundliChart`) & `12-House Bhava Dossier`
  2. `Bhava Chalit` (Sripati shifted planets + `Begin / Madhya`)
  3. `KP System` (Star/Sub-Lords, 12 Cusps, 4-Tier Significators, Planet Significations)
  4. `Tajika Varshaphal, Sahams, Arudhas & Upagrahas` (`GET /api/profiles/:id/varshaphal`: Birth-to-`+90y` scrubber, Muntha, searchable **36 Sahams** w/ category filters, Special Lagnas `HL/GL/SL/IL`, Perception vs Reality `AL/A2–A11/UL`, 7 Upagrahas)
  5. `Birth Panchang & Avakahada Chakra` (6-cell grid: `Paya`, `Varna`, `Yoni`, `Gana`, `Vasya`, `Nadi` + Julian Day UT)
  6. `Quant Calculation Matrices` (`Degrees & Vargas D1–D60` w/ `★ Vargottama`, `Shadbala/Bhavabala` full matrix, `Ashtakvarga BAV/SAV/Prastara (8 rows)` + `5-Fold Maitri`, `Kakshya 3°45' · Vedha · Navatara (9-Tara & 11 Special Stars) · Active Latta`, and `24 Horas & Ghatak`)

---

### 5.3 `Journal` (First-Class Tab)

```text
+---------------------------------------------------+
| [Priya ▾]                                     [⌕] |
+---------------------------------------------------+
|  Getting to know your patterns                    |
|  ( 14 of 30 entries )     no deadline             |  <- Your Patterns Card
+---------------------------------------------------+
|  This week   ● ● ● ● ○ ○ ○     4 of 7 days        |  <- Weekly Rhythm (Monday reset)
+---------------------------------------------------+
|  [All] [Entries] [Milestones] [Tags ▾]            |  <- Clean Filter Strip
+---------------------------------------------------+
|  Today, 19:20            (4/5)  Flowing · Pisces  |  <- Entry + Frozen Sky Chip
|  Good focus after lunch                           |     (Tap chip -> SkySnapshot Rung 2)
|  tags: work · focus                               |
+---------------------------------------------------+
|                  [ Check in ]                     |  <- Primary Action
+---------------------------------------------------+
```

- **Progressive Composer & Empty State:**
  - *Empty State (0 entries logged):* Instead of a blank feed, displays a poetic, compelling prompt: *"Your first entry will capture this exact sky. It never comes back."* with a glowing **`Check in now`** primary button.
  - *Fast Flow:* Tapping Mood (`1–5`) saves validly in 1 tap. Optional `Energy (1–5)`, `Kind` (`checkin`/`event`/`reflection`), `Tags` (`work`, `focus`, `creative`, `meditation`, `family`, `health`, `travel`, `study`), and free-text `Note` slide in gracefully without blocking the save.
- **Unified Timeline (`Entries` + `Milestones`):** Default feed shows daily entries; toggling **`Milestones`** surfaces saved `LifeEventEntity` milestones alongside entries from `Room` (`Time-Machine` remains the milestone validation workbench in `Time`).
- **Frozen Sky Chip:** Every entry embeds its immutable `SkySnapshotData` (`Band`, `Moon sign`, `Hora`, `Chandra/Tarabala`, `SAV`). Tapping opens the snapshot at Rung 2.
- **`Your Patterns` (Progressive Calibration Milestones):**
  - Rather than making users wait in the dark for 30 entries, the card delivers progressive evidence previews:
    - *At 5 entries:* *"Your average mood on Flowing hours: 3.8 / 5. Keep logging—your baseline is forming."*
    - *At 10 entries:* *"You've logged across 3 Hora rulers. Jupiter hours currently average your highest focus."*
    - *At 15 entries:* *"Early signal: your energy rises when the Moon transits your friendly signs."*
    - *At 20 entries:* *"Real patterns are emerging. 10 more entries to unlock statistical confidence (95% Bootstrap CI)."*
    - *At n >= 30:* Full statistical `CalibrationExplorer` unseals, displaying plain-English observed patterns (`Chandra Bala`, `Tara Bala`, `Band`, `Hora`, `SAV`) with **`95% Bootstrap CI`**, `n` sample size, and `Load Test Data (n=45)` tucked cleanly inside **Rung 3 (`Show the math`)**.
- **Sunday Weekly Review:** Weekly card (`Your week in the sky`) highlighting 1 supported pattern with an optional share card.

---

### 5.4 `Ask` (Copilot Sheet — `POST /api/ask`)

- **Trigger:** Center dock Orb or uniform `[ Ask ]` sheet footer. Opens an 85%→100% draggable bottom sheet.
- **Context Header:** Active profile name + originating context pill (e.g., `Viewing House 10 · Career`), **`Fast` / `✦ Deep`** toggle, **`+ Event Date`** shortcut, Clear history.
- **Conversation Memory UX:** Because `GET /api/conversations/:id` returns one chronological `messages[]` array per `profileId`, the client groups local `ChatMessageEntity` rows by session gaps (`> 2h` or subject switches) into up to `2` collapsible **"Recent Q&As"** cards above the input (context tag, 1-line synopsis, timestamp). Tapping scrolls to/resumes that exchange; `Clear history` calls `DELETE /api/conversations/:id` (Phase 0 addition).
- **Low-Friction Prompts:** Shows up to 2 suggestion chips tied to the originating screen; **`Build a question`** opens the 2-row `Life-Event Prompt Builder` (`Topic` × `Time Window`) on demand.
- **Single-Line SSE Ticker (`POST /api/ask`):** Sends `{ question, profileId, deep }` with `Accept: text/event-stream` and parses `event: <type>\ndata: <json>` events, rendering `liveSteps` as a calm 1-line crossfading ticker (expandable on tap to reveal the full reasoning trace).
- **Structured Reply Card:** Short answer first → collapsed **`Because`** (`evidenceIds` chips opening `SubjectSheet` at Rung 2), **`Timing`** (jumps to `Time` calendar), **`Reflect`** (opens pre-filled `Journal` composer), and max `2` **`Follow-up`** chips. Degrades cleanly on `level2_fallback` with an `Export AI Dossier` fallback.

---

### 5.5 `Time` (Dashas, Calendar, Transits & Time-Machine)

- **Default View (Calm Surface):**
  1. **`Now` Card:** Nested `Mahadasha / Antardasha` progress bars with dates and 1-line plain meaning (tap → Rung 2 w/ `Pratyantar`, and switcher for `Vimshottari 120y` · `Yogini 36y` · `Chara Jaimini`).
  2. **`Next shift` Card ("Diff-Only" Preview):** Next Antardasha or major transit transition date + **`Preview`** button opening a compact **3-row delta card** (*What winds down* · *What wakes up* · *House focus shift*, e.g., `Home (H4) → Partnerships (H7)`), hiding unchanged factors.
  3. **`Month calendar` (`GET /api/profiles/:id/calendar`):** Day grid tinted by band (`teal`/`gold`/`amber`), subtle dot on days with journal entries or milestones, purpose filter chips (`All`, `Career`, `Travel`, `Finance`, `Rest`). Tapping a day updates a pinned **Day Peek Card** + **`Add Date Note`**.
  4. **`Time-Machine` Milestones & Empty State:**
     - *Empty State (No milestones saved):* Displays an evocative invitation: *"Add a past milestone (graduation, marriage, move) — the app will show you which Dasha and planetary transits were active."*
     - *Populated:* **`Add milestone`** CTA with preset chips (`Career`, `Move`, `Relationship`, `Health`, `Breakthrough`); scrolling any past/future date immediately previews active Dasha lords and **`Explain with AI`**.
- **Behind Tap (Rungs 2 & 3):** `Sky movers` (top 3 transits → `See all 9` with Lagna/Moon house & plain meaning; `Vedha` obstructions & `Kakshya` `K#` at Rung 3), `Double Transit (Saturn + Jupiter)` gates, `Sade Sati` status, `Personal Muhurta & Ghatak`, and `Year` slow-planet transit timeline.

---

## 6. Gradual Reveal: The Chart Journey (24-Node Discovery Map)

Replaces arbitrary "variable cosmic drops" with a structured, meaningful **24-Node Constellation Map** (accessible from `Me` and surfacing 1 curated node daily in `Today`'s Curiosity slot).

| Ring | Nodes |
| :--- | :--- |
| **Core (4)** | Rising sign, Moon sign, Moon nakshatra, Sun sign |
| **Houses (12)** | Self, Money, Siblings & courage, Home, Children & learning, Work routine & health, Partnership, Change, Luck & purpose, Career, Gains, Retreat *(groupable into 3–4 thematic clusters if desired)* |
| **Timing (4)** | Current chapter, Next shift, Slow transits, Sade Sati status |
| **Depth (4)** | Divisional charts (`D1–D60`), Yogas & Doshas audit, Strengths & Ashtakvarga, Tools room |

- **Unknown Birth Time Fallback (`11` Nodes):** When `timeCertainty == "unknown"`, hide `Rising sign` (`1`) and `Houses` (`12`) and present an **11-node Moon-based discovery path** (`Core 3 + Timing 4 + Depth 4`).
- **3-Card Discovery Story (< 60s Curiosity Funnel):**
  1. *Card 1: The Hook (Curiosity Gap):* Replaces dry definitions with an intriguing tension or question based on their chart: *"Your Moon sits in Pisces—the sign of deep empathy. But your 10th house tells a very different story…"*
  2. *Card 2: The Reveal (Personal Data):* Resolves the tension with their Level 2 finding & evidence chip (`D10 Lord Jupiter exalted in Cancer`). Closes the curiosity gap and delivers a burst of insight.
  3. *Card 3: The Ownership Prompt (Investment):* Actionable reflection: *"Did that land? Log how it feels in your work today."* Launches the pre-filled `Journal` composer.
  - *Progression & Authentic Rarity Mirrors:* Completing Card 3—or exploring the subject organically to **Rung 2**—lights the node gold and animates a constellation edge to its neighbor. Previewed/lit nodes cite **verifiable chart rarities** from `level1Static` (e.g., *"Vargottama planet — same sign in D1 & D9 (~11% of placements)"*, *"Pushkara Navamsha"*, *"Exalted house lord"*, or *"Active Rajayoga"*) rather than generic percentages. Completing a ring unlocks a calm recap reading + optional share card.
- **Act II (Post-Day-24 Evergreen Lifecycle):** Once all `24` nodes (or `11` in Moon-only mode) are lit, `Today`'s Curiosity Slot (`P6`) transitions seamlessly from natal discovery to a rotating evergreen cycle:
  1. **Lunar / Janma Nakshatra Return** *(every 27.3 days — "The Moon returns to your birth star today")*
  2. **Personal Pattern Spotlight** *(computed locally from `JournalEntryEntity` — "In your last 30 logs, Mercury hours averaged 4.2/5")*
  3. **Pratyantar & Transit Micro-Stories** *(whenever a Pratyantar or major planet shifts)*
  4. **Annual Solar Return (`Varshaphal`)** *(around the user's birthday via `GET /api/profiles/:id/varshaphal`)*
- **Pacing & Event-Triggered Queue Jumps (Architecture-Safe):**
  - Onboarding goals reorder the default path (`Career` goal surfaces H10 + Current Chapter early).
  - **Event Sources (Without Polluting Immutable `/bundle`):**
    - *Dasha shifts (`Antardasha` ending within 48h):* Computed locally in `Room` from `level1Static.dashas` already returned by `/bundle`.
    - *Sky transitions (`Sade Sati` phase change, slow-planet sign ingress):* Supplied by `GET /api/profiles/:id/today` (`transits`) and `GET /api/profiles/:id/calendar` (`monthData.ingressEvents` & `yearData`), preserving `/bundle`'s immutable `ETag` caching *(note: exposing `ingressEvents` alongside `ingressCount` in `/today`'s `monthPeakSummary` is an optional 1-line backend optimization if needed on cold launch)*.

---

## 7. Calm Habit Design, Ethical Guardrails & Safety Flow

### 7.1 Daily & Weekly Habit Loops

| Moment | Trigger | Action (`~3s`) | Reward | Investment |
| :--- | :--- | :--- | :--- | :--- |
| **Morning** | Opt-in morning alert or `Glance` Widget | Open `Today`, glance band | Band word, next shift, 1 discovery | Optional check-in |
| **Midday** | Home Screen Widget | Glance only | Current Hora & next shift | None |
| **Evening** | Opt-in reminder | 1-tap mood check-in | Frozen sky chip + weekly rhythm dot | Journal entry |
| **Sunday** | Weekly Review card | Read | `Your week in the sky` + 1 pattern | Share or reflect |
| **Sky Event** | Chapter shift or ingress | Open 3-card story | Constellation node lights gold | Milestone entry |

### 7.2 Calm Framing & Weekly Rhythm
- **Weekly Rhythm Dots (Not Streaks):** Display 7 dots (Mon–Sun) with an adjustable goal (`4 of 7` default) resetting softly every Monday. No consecutive-day streaks, no grace shields, and **never copy saying a streak was lost**.
- **Calm Language Table:**
  - *Instead of* `"Tactical Caution Shield · 38m countdown"` → `"Go gently 10:30 to 12:00"` (soft amber tint; optional timer only inside `Peek`).
  - *Instead of* `"Defer contracts"` → `"A good window for focused work opens at 16:20"`.
  - *Instead of* `"Pattern Proof (95% CI)"` → `"Your Patterns (14 of 30, no deadline)"` (statistics sit inside Rung 3).
- **Content Safety (`packages/content/safety.yaml`):** Strictly zero predictions on health, death, accidents, pregnancy, or financial outcomes; no remedy selling; no urgency language; hedged traditional framing (*"In Jyotish tradition…"*).

### 7.3 Client-Side Distress Safety Flow & Journal Privacy
Aligned with [`BUILD_PACK.md` §9.3](../docs/BUILD_PACK.md#L483-L488):
- **Ship Local Safety Asset (`safety_resources.json`):** Contains maintained English & Hindi distress keywords plus verified locale helpline numbers (e.g., India: **Tele-MANAS `14416`** and emergency **`112`**).
- **Strict On-Device Evaluation Before Sync:**
  1. Triggered when `mood == 1` is logged twice within 3 days, or when composer text matches a safety keyword.
  2. **Skip all astrology UI immediately.** Present a calm grounding screen: acknowledgement, two grounding steps (slow breathing, private writing), prompt to reach someone trusted, and locale helplines.
  3. **Zero Transmission / Zero Persistence of Trigger Text:** Never ask probing follow-up questions, never persist triggering text in `Room`, and **never send triggering text to `/api/sync`, `/api/journal`, or `/api/ask`**.
- **Sync Privacy Boundary:** While `apps/api/src/routes/journal.ts` supports `/api/sync` and `/api/journal`, treat cloud backup of journal `note` text as explicitly opt-in (or client-encrypted before upload) while keeping non-sensitive metadata and distress checks strictly local-first.

### 7.4 Notifications, Widgets & Metrics
- **Notifications:** `1` default morning summary at user's chosen time (*"Your day starts Flowing. Jupiter hour at 08:40."*). Evening reflection, 48h chapter shift, and 15m `Go gently` heads-up are strictly opt-in. Hard cap `2/day`; quiet hours `22:00–07:00` default; zero guilt copy.
- **Android `Glance` Widgets:**
  - `2×2` **Band & Hora Orb** (band word, soft ring, current Hora + time).
  - `4×2` **Today Strip** (mini energy wave, next best window, `Go gently` hours, 1-tap mood launcher).
- **Healthy vs. Guard Metrics:**
  - *Optimize:* Day-7 & Day-30 retention, weekly rhythm (`>= 4/7`), discoveries lit, `Why` & `Show the math` engagement, weekly entries.
  - *Guard against:* Sessions/day `> 8`, notification opt-outs, 24h post-push uninstalls, distress-flow frequency, daily Copilot quota ceiling hits.

---

## 8. Motion & Haptics Catalog

| Moment | Motion | Duration | Haptic | Reduced Motion |
| :--- | :--- | :--- | :--- | :--- |
| **Hero band shifts** | Ring color crossfade, `1%` scale | `400ms` | None | Instant |
| **Tap hero -> Peek** | Spring sheet (`damping = 0.78`, `stiffness = 380`) | `~350ms` | `CONTEXT_CLICK` | Crossfade |
| **Select Chart house** | `20%` gold fill + dashed lord line draw | `300ms` | `CONTEXT_CLICK` | Instant fill, no line anim |
| **Long-press Drishti** | Dashed aspect threads illuminate & fade | `220ms` | `CONTEXT_CLICK` | Instant show/hide |
| **Inspector detent snap** | Spring | Spring | `CLOCK_TICK` per detent | Snap |
| **Scrub 24h wave** | Finger-locked cursor + morphing pill | Live | `CLOCK_TICK` per hour | Same without glow |
| **Enter `Go gently` hour** | Wave tint shifts soft amber | `200ms` | Soft `REJECT` | Color shift only |
| **Check-in saved** | Ring burst + rhythm dot fills | `600ms` | `CONFIRM` | Single fade |
| **Discovery node lit** | Gold glow + edge draws to neighbor | `900ms` | Double pulse | Static lit node |
| **Explore -> Chart house** | `SharedTransitionLayout` | `400ms` | None | Crossfade |
| **Ask trace ticker** | 1-line crossfade | `250ms` | None | Instant swap |

**Motion Discipline:** Maximum `1` hero animation per screen; stagger list entrances `40ms` (cap `4` items, never re-animate on scroll); stop idle breathing after `10s`, when off-screen, or in Battery Saver mode; disable motion when `ANIMATOR_DURATION_SCALE == 0`.

---

## 9. Onboarding (~60 Seconds)

1. **Celestial Threshold (`AuthOnboardingGate`):** Midnight starfield + `brand-logo` linework; native **Credential Manager Google Sign-In** (`POST /api/auth/google`) + subtle `Local Dev Sign-In` sheet when `ALLOW_DEV_AUTH=true`.
2. **Intent Chips:** *"What brings you here?"* (pick up to 2: `Career`, `Relationships`, `Home & family`, `Money`, `Understanding myself`, `Daily rhythm`) — sets Discovery Map & `Explore` row priority.
3. **3-Beat Birth Wizard:**
   - *Beat 1:* Name + `Time Certainty` (`Exact`, `Approx ±15m`, `Unknown (Moon Ref)`).
   - *Beat 2:* Native Wheel Date Picker + Seconds Time Picker (`HH:MM:SS` if `Exact`, hidden if `Unknown`).
   - *Beat 3:* Place Autocomplete + `Use Current GPS` + live `Lat/Lon/TZ` pill (`Lahiri` default w/ expandable `Ayanamsa`).
4. **3-Step Constellation Compute (`POST /api/profiles`):** Mapping Ascendant → Evaluating 537 Rules → Aligning Dashas.
5. **Your Cosmic Triad & Identity Anchor:** User taps `Rising` *(or `Moon Nakshatra` when `timeCertainty == "unknown"`)*, `Moon`, and `Current Chapter` cards one by one — lighting **3 of 24 nodes** immediately *(or **3 of 11** in Moon-only mode)*. Accompanied by a **verifiable combinatorial rarity anchor**: **Rising Sign × Moon Nakshatra = `1 in 324`** (`12 × 27`, e.g., *"Taurus rising with Revati Moon — a 1-in-324 sky signature"*), or **Sun Sign × Moon Nakshatra (`1 in 324`)** when `timeCertainty == "unknown"`.
6. **Session-0 Trust Hook — *Test the Math on a Year You Remember* (`Time-Machine`):** Elevated prompt (*"Test the math on a year you remember"* with a prominent 1-tap `Skip` link); neutral wording showing which active Dasha lords & natal houses were lit for any selected past year.
7. **Land on `Today`:** Ready with Node #4 curiosity and the 1-tap Check-in.

---

## 10. Backend API, Offline `Room` Sync & Storage Contracts

All calculations stay **100% server-side (`apps/api`, zero WASM on Android)**; `Room` + `WorkManager` guarantee **`< 100ms` cold opens** and **`0` network calls on profile switches**.

### 10.1 Endpoint & Cache Map

| Flow | Backend Endpoint | Local Persistence (`Room` / `DataStore`) & Policy |
| :--- | :--- | :--- |
| **Auth** | `POST /api/auth/google`, `GET /api/auth/me` | Encrypted `DataStore` (`astro_auth_token_v1`). |
| **Create / Edit Profile** | `POST /api/profiles` | Overwrites `ChartBundleEntity` with bumped `bundleVersion` and clears `TodaySkyCacheEntity`. |
| **Switch Profile** | `GET /api/profiles/:id/bundle` | **0 network calls** once `ChartBundleEntity` (`bundleVersion` + `ETag`) matches locally (`304 Not Modified` on revalidate). Provides `level1Static` + `level2Static` (`simple`, `standard`, `detailed`) and static Dasha boundaries for Discovery events. |
| **Delete Profile** | `DELETE /api/profiles/:id` | Cascades local deletion across snapshots, journals, milestones, discoveries, and chats. |
| **Today & Widgets** | `GET /api/profiles/:id/today?date=...&tzId=...&lat=...&lon=...` | Cached in `TodaySkyCacheEntity` (`profileId\|date\|tzId\|lat\|lon`). `WorkManager` pre-fetches **both `today` and `tomorrow` (`date + 1`)** at 5:30 AM and 8:00 PM (powering the Evening Horizon Hook); supplies `dayView` (`horas`, `hourlyScores`, `flowingWindows`, `goGentlyWindows`, `inauspicious`), live `transits`, `sadeSati`, and `monthPeakSummary` (`ingressCount`; Phase 0 adds `ingressEvents` & `canAccessProfile` guard). |
| **Calendar & Year** | `GET /api/profiles/:id/calendar?year=...&month=...&date=...` | Cached per `profileId\|year\|month`; supplies `monthData.ingressEvents` and `yearData` macro transits (enforce `canAccessProfile`). |
| **Varshaphal & Sahams** | `GET /api/profiles/:id/varshaphal?year=...` | Cached per `profileId\|year` (enforce `canAccessProfile`). |
| **Fact Evidence** | `GET /api/facts/:profileId/:factId`, `POST /api/reading` | Fallback deep lookup (most Rung 1–3 data already lives in `/bundle`). |
| **AI Copilot** | `POST /api/ask` (`Accept: text/event-stream`), `GET /api/conversations/:id`, `DELETE /api/conversations/:id` *(Phase 0)* | OkHttp `EventSource` / Ktor SSE; persisted per profile in `ChatMessageEntity` (grouped client-side by `> 2h` gaps into Recent Q&As). |
| **Journal & Milestones** | `POST /api/sync`, `GET /api/journal/:profileId`, `POST /api/journal` | Offline-first writes to `JournalEntryEntity` & `LifeEventEntity`; opt-in/encrypted sync via `WorkManager` (`astro_last_sync_at_v1`), **never uploading distress-flagged entries**. *(Phase 0 adds `tags` & `kind` persistence + `canAccessProfile` guard).* |

### 10.2 v2 Client-Side `Room` / `DataStore` Additions

| Entity | Fields |
| :--- | :--- |
| `DiscoveryNodeEntity` | `profileId`, `id`, `ring`, `state` (`hidden \| previewed \| lit`), `litAt`, `source` (`story \| explore`) |
| `GoalEntity` | `profileId`, `goals` (up to `2`), `createdAt` |
| `RhythmEntity` | `profileId`, `weekStart`, `daysLogged`, `goal` (`4` default) |
| `PreferenceEntity` | `detailLevel` (`simple \| balanced \| full`), `mathPromptShownCount`, `chartStyle` (`north \| south`), `activeProfileId`, `quietHoursStart`, `quietHoursEnd`, `openedTodayCount`, `lastOpenedAt`, `lastSeenBand`, `lastSeenHora`, `firstLaunchAt`, `ahaCardState` (`pending \| shown \| dismissed`), `lastWeeklyReviewWeekStart`, `dismissedSlotKeys`, `actTwoEnabled` |

---

## 11. Accessibility, Verification & Build Order

### 11.1 Accessibility & Device Guardrails
- **TalkBack on Compose `Canvas`:** Every polygon (`H1–H12`), sign cell (`Aries–Pisces`), and hourly wave point exposes semantic descriptions (`Modifier.semantics { contentDescription = ... }`) with `>= 48dp` touch bounds.
- **Dynamic Type (`sp`):** Never fix card heights (`height = 60.dp`); use `minHeight` and wrapping rows so `1.5x` system font scaling never clips text.
- **Edge-to-Edge & IME:** Apply `WindowCompat.setDecorFitsSystemWindows(window, false)` and `imePadding()` inside `Ask` and `Journal` composers.

### 11.2 Build Order & Starter Prompts

1. Design system tokens (`Color.kt`, `Type.kt`), `Subject` / `Rung` model, and universal `SubjectSheet`.
2. `Today` screen (`Room`-only read, Hero, Check-in, Curiosity slot, 40dp strip, `Explore` row, Hora-aware `> 8` quiet collapse).
3. `Chart` canvas (`North`/`South`), 3-detent Inspector, `Explore` shelf, and `Tools` room.
4. `Journal` (progressive composer, weekly rhythm dots, `Entries`/`Milestones` filter, `Your Patterns`, client-side Distress safety flow).
5. `Discovery` map (24-node JSON asset, goal ordering, 3-card stories) & Onboarding v2.
6. `Time` tab (`Now`, `Next shift`, `Month calendar`, `Time-Machine`, `Year`).
7. `Ask` Copilot sheet (SSE 1-line ticker, structured reply rows, `level2_fallback`).
8. Notifications, `Glance` widgets, `9:16` Share Card, PDF/LLM exports, and `Me` sheet.
9. Motion, haptics, TalkBack, and cold-start performance pass.

#### Coding-Agent Starter Prompts
- **`U1`:** Implement `Subject` (`Planet`, `House`, `Period`, `Finding`, `DivisionalChart`), `Rung` (`Glance`, `Peek`, `Explain`, `Evidence`), and `SubjectSheet` opening from any screen by subject ID, with `44dp` spatial mini-Kundli header, zero-trap detent physics, uniform `[Ask | Reflect]` footer, and visited-rung-stack Back behavior. Add Compose UI tests for rung transitions and screenshot tests per rung.
- **`U2`:** Build `Today` (§5.1) reading strictly from `Room`: Band-word Hero with sorted-factor Personal Hook, 1.5s Inline Sky Echo check-in morph, `resolveTodaySlot` Priority Arbiter (`P0–P6` with Distress Safety preemption and dual-branch Aha Moment), 40dp collapsible Day Wave strip w/ post-19:00 Horizon Hook, `Explore` row, Days 1–7 emergence, Welcome-Back digest, and Hora/Band-aware `> 8 opens` constructive redirect.
- **`U3`:** Build the 24-node Discovery Map, 3-card Curiosity Funnel (§6), and Act II Evergreen Cycle from a bundled `discovery_nodes.json` asset ordered by `GoalEntity`, lighting nodes on Card 3 completion or organic Rung 2 traversal, with Moon-only fallback (`11` nodes) when `timeCertainty == "unknown"` plus §8 haptics and reduced-motion variants.
