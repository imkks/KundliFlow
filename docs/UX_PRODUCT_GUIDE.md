# UX & Product Guide — KundliFlow (MyAstro)

KundliFlow adapts one verified Vedic calculation core into three progressive-disclosure lenses so beginners, learners, and advanced astrologers share the same product without visual clutter.

---

## 1. Three Experience Lenses (`ReadingContext.tsx`)

Users pick a starting lens during Step 2 onboarding (`FirstVisitOnboarding.tsx`) and can switch anytime in the topbar radiogroup:

| Lens | Internal Level | Target User | UI Emphasized |
| :--- | :--- | :--- | :--- |
| **Guided** | `simple` | Newcomers using AI to understand life events | Plain-English bottom lines, Life Events AI Decoder (`LifeEventModal`), Quick Life-Event Prompt Builder in Ask AI, simplified cards without raw telemetry |
| **Explorer** | `standard` | Learners navigating houses, planets, and chart patterns | Interactive D1/D9 charts with dashed House -> Lord connectors, Causal `PatternDecoderModal`, `Teach Me` 6-step tour, clickable `GlossaryTerm` popovers, `Why?` rule explanations |
| **Quant** | `detailed` | Experts seeking calculation & rule depth | Full `Degrees & Vargas`, `Shadbala & Bhavabala`, `Ashtakvarga & Maitri`, `Kakshya / Vedha / Navatara`, `KP Sub-Lords`, `Bhava Chalit`, rule IDs/scores, JSON/Markdown AI Dossier |

---

## 2. Sign-In-First Onboarding Flow

1. **Step 1 — Sign-In Gate (`AuthOnboardingGate.tsx`)**: Authenticates users via Google Sign-In (`POST /api/auth/google`) or localhost dev login (`ALLOW_DEV_AUTH=true`) so profiles, journals, life events, and AI chat threads isolate per account.
2. **Step 2 — Birth Details & Lens (`FirstVisitOnboarding.tsx`)**: Collects birth date, time (with seconds support via `step="1"`), time certainty (`Exact`, `Approx`, `Unknown`), birth city/place autocomplete, and starting experience lens.

---

## 3. Navigation & Workspace Surfaces

### Primary Tabs (`App.tsx`)
1. **`Today`** (`TodayTab.tsx`): Live time-quality score, Moon Tara & current Hora guidance, caution windows, highlighted **Life Topics** jump cards, and 1-tap daily mood check-in.
2. **`Kundli`** *(Featured anchor tab, `D1–D60`)* (`KundliTab.tsx`):
   - **Hero Kundli Banner**: Displays Ascendant, Moon/Nakshatra, Sun, Active Mahadasha, active Ayanamsa badge, and quick modal triggers.
   - **Life Topics Spotlight (`LIFE_TOPICS`)**: Five domain cards (`Career · H10/D10`, `Love & Marriage · H7/D9`, `Wealth & Assets · H2/D2`, `Home & Peace · H4/D9`, `Year Ahead · Annual`) synced with the desktop sidebar **Life Topics** section, `Today`, and `⌘K` Command Palette.
   - **Focused Kundli Stage**: Spatially co-located style (`North` / `South`), reference (`Lagna` / `Moon`), and divisional Varga selector right above the interactive SVG chart + sticky House/Planet Inspector.
3. **`Timing`** (`TimingTab.tsx`): Life Events AI Validator, Vimshottari / Yogini / Chara Dashas (with active `● NOW` auto-expanded), Gochar transits & Double Transit, Ghatak guardrails, and monthly/annual Calendar heatmap.
4. **`Yogas & Power`** *(mobile: `Yogas`)* (`StrengthsTab.tsx`): Three focused sub-tabs: **Yogas & Patterns**, **Planetary Power (Shadbala & Ashtakvarga)**, and **Soul Drivers & Harmonics**.
5. **`Timeline`** (`JournalTab.tsx`): Synced Life Milestones, daily check-ins, and personal pattern calibration (`CalibrationExplorer.tsx`).

---

## 4. Progressive Disclosure Modals

All deep analytical views live in lazy-loaded modals (`App.tsx`) so tabs stay calm:
- **`LifeEventModal`**: Validate past or future milestone dates against Dashas or ask AI to explain why an event happened.
- **`PatternDecoderModal`**: causal chain viewer (`Placement -> Lordship -> Drishti Aspects -> D9/Shadbala`) for any House, Planet, or Yoga.
- **`ChartSystemsModal`**: `Dual Transit Overlay`, `Bhava Chalit`, `KP System`, `Varshaphal, Arudhas & Sahams`, and `Birth Panchang & Avakahada`.
- **`QuantMatrixModal`**: Tabbed Expert workbench (`Degrees & Vargas D1–D60`, `Shadbala & Bhavabala`, `Ashtakvarga & Maitri`, `Kakshya · Vedha · Navatara`, `24 Horas, Panchang & Ghatak`).
- **`DoshaAuditModal`**: Cancelled Doshas (*Bhanga*) and Verified Absent Doshas.
- **`PlainEnglishExplainerModal`**: Searchable astrology glossary deep-linked from clickable `GlossaryTerm` buttons.
- **`OnboardingModal`**: Add (`mode="add"`) or edit (`mode="edit"`) chart details; auto-expands coordinate/ayanamsa settings when editing non-Lahiri charts.
