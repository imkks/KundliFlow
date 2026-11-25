---
name: KundliFlow Vedic Codex (v5)
colors:
  background: '#121028'
  surface: '#1E1B38'
  surface-recessed: '#14122B'
  surface-alt: '#29264B'
  glass-dock: '#1C1936'
  on-surface: '#F3EEE2'
  on-surface-variant: '#A6A0BA'
  primary: '#E3AD46'
  on-primary: '#121026'
  secondary: '#5FC2B3'
  on-secondary: '#121026'
  tertiary: '#D97736'
  outline-gold: '#3BE3AD46'
  outline-subtle: '#1CF3EEE2'
  alert-destructive: '#F87171'
typography:
  display-small:
    fontFamily: Cinzel
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: 1.2px
  headline-medium:
    fontFamily: Cinzel
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: 0.9px
  headline-small:
    fontFamily: Cinzel
    fontSize: 19px
    fontWeight: '500'
    lineHeight: 25px
    letterSpacing: 0.8px
  title-large:
    fontFamily: Cinzel
    fontSize: 17px
    fontWeight: '500'
    lineHeight: 23px
    letterSpacing: 0.6px
  title-medium:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  title-small:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  body-medium:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 21px
  body-small:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 19px
  label-medium:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.6px
  label-small:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.7px
  telemetry:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    fontVariantNumeric: tabular-nums
rounded:
  sm: 10px
  md: 14px
  lg: 18px
  xl: 22px
  pill: 999px
spacing:
  margin: 20px
  section-gap: 20px
  card-padding: 18px
  inner-gap: 12px
  dock-clearance: 116px
---

# KundliFlow — Vedic Codex Design System (Android Jetpack Compose + Material 3)

## Brand & Emotional Philosophy
KundliFlow is a quiet, contemplative, editorial Vedic astrology almanac and personal rhythm companion. It feels like an illuminated nocturnal astronomical manuscript—never a noisy horoscope feed, gamified wellness app, or alarmist fortune teller.

### Non-Negotiable UX Invariants
1. **Never use red for astrological states:** Challenging or cautious periods use **Warm Amber (`#D97736`)** ("Go gently"). Crimson (`#F87171`) is strictly reserved for destructive data-delete buttons or network errors.
2. **No streak-loss guilt copy:** Journal tracking uses calm Monday-reset weekly dots ("4 of 7 days logged · No deadline").
3. **Calm, spacious vertical scrolling:** Expansive editorial vertical rhythm (`20dp` outer horizontal margins, `20dp` gaps between major sections, `18dp` card padding, `116dp` bottom clearance above the floating dock).
4. **Zero-placeholder authentic telemetry:** Every planetary degree, Nakshatra, Tithi, Hora, Shadbala ratio, Ashtakavarga SAV bindu, and Dasha span uses `tabular-nums` alignment.
5. **Local-first privacy + compassionate safety:** Private journal badges, encrypted local vault messaging, and always-reachable 24/7 support helplines.

---

## Color Architecture & Tonal Layering
Depth is conveyed through **three distinct nocturnal indigo tiers** and **delicate 1dp hairline borders**, never muddy drop shadows:
- **Canvas (`BgInk`):** `#121028` — deep nocturnal space backdrop.
- **Primary Almanac Card (`Surface`):** `#1E1B38` — main rounded containers (`18dp–22dp` radius) with `1dp` subtle border (`#1CF3EEE2`) or `1dp` Antique Gold hairline (`#3BE3AD46`) for hero/focal cards.
- **Recessed Inner Telemetry Tile (`SurfaceRecessed`):** `#14122B` — nested dark boxes inside cards for Panchang cells, Shadbala cards, Diff rows, Band comparison meters, and 36dp icon tiles.
- **Elevated Active Surface (`SurfaceAlt`):** `#29264B` — active segment fills, active Hora card, highlighted SAV house.
- **Semantic Accents:**
  - **Antique Gold (`#E3AD46`):** Steady band, primary solid CTA fills (`#121026` ink text), active navigation tab, section accents, editorial quote left-bars (`3dp–4dp`).
  - **Celestial Teal (`#5FC2B3`):** Flowing band, live transit/Gochar pills, verified Bhanga cancellations, calibration progress, Ask AI sparkle orb gradient.
  - **Warm Amber (`#D97736`):** Go gently band, Rahu Kalam warning tiles (`14%` amber fill + `55%` amber hairline).
  - **Warm Parchment (`#F3EEE2`):** Primary readable ink.
  - **Muted Lavender-Grey (`#A6A0BA`):** Eyebrows, secondary descriptions, timestamps.

---

## Typography
- **Display & Section Headers:** **Cinzel** (`Medium` / `SemiBold`), typically **UPPERCASE** with subtle letter-spacing (`0.6sp–1.2sp`) for authoritative editorial calm (`GOOD MORNING`, `TODAY'S PANCHANG & SKY`, `KUNDLI CODEX`, `ASTROLOGICAL POTENCY & CLASSICAL YOGAS`).
- **Body, Controls & Telemetry:** **Plus Jakarta Sans** (`Regular`, `Medium`, `SemiBold`) with `font-variant-numeric: tabular-nums` on all numeric readings (`+5.8`, `1.34x`, `33 / 337`, `18°42'`).

---

## Signature Component Grammar
1. **Top App Bar (`56dp`):** Flat on `#121028` with `☰` drawer icon (or `←` back arrow on full-screen pages), Cinzel uppercase title or profile pill, Search icon, and a `34dp` Gold-bordered circular profile badge (or `[✦ Ask AI]` pill on secondary studio pages).
2. **Floating Bottom Capsule Dock (`72dp` height, `36dp` radius):** Translucent `#1C1936` (`94%` alpha) with `1dp` Antique Gold hairline (`#3BE3AD46`), 4 tabs (`Today`, `Chart`, `Time`, `Journal`), and a raised central `52dp` Teal-to-Gold glowing **Ask AI** orb.
3. **Unified Segmented Tracks:** Single recessed `#14122B` container (`12dp–14dp` radius, `3dp–4dp` inner padding) where the active segment elevates to `#29264B` with a `1dp` gold or teal hairline border (used for `Simple | Balanced | Full`, `North | South`, and `Yogas & Audits | Planetary Power | Soul & Maitri`).
4. **Eyebrow + Cinzel Section Header Pattern:** Stacked `10sp` uppercase muted eyebrow (`EPHEMERIS TELEMETRY`) above `17sp–19sp` Cinzel title (`TODAY'S PANCHANG & SKY`), paired with a right-aligned badge pill or `See all →` action.
5. **Icon-Tile List Rows:** `36dp` rounded `#14122B` icon square (`10dp` radius, tinted `1dp` border) + title & muted subtitle + optional teal/gold pill badge + `>` chevron.
6. **Editorial Accent Cards:** Full-width `#1E1B38` cards with a `3dp–4dp` solid Gold left vertical accent bar for key quotes, milestones, and major Mahadasha transitions.
7. **Primary & Secondary Action Buttons:** Full-width `48dp` height, `14dp` radius—Primary uses solid Antique Gold (`#E3AD46`) fill with `#121026` ink text; Secondary uses transparent/recessed fill with `1dp` subtle outline.
