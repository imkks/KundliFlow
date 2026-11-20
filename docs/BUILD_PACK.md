# Astro Journal: Build Pack for the Coding Harness

A complete spec set for building the app with a coding agent: product requirements, architecture, engine and scoring specs, data model, UI, content rules, tests and milestones. Prepared 13 November 2026.

## 0. How to use this pack

- Export this doc as Markdown, split it into the files shown below, and commit them under docs/.
- Run the harness one milestone at a time (section 10). A milestone is done only when its tests pass.
- The sample AstroSage report (7 Sep 1998, 23:20:34, Jamshedpur) is the golden fixture. Put the PDF in fixtures/ so the agent can read it.
- Never let the agent invent astrology constants. Every table lives in packages/content with a source comment, and tests check it.

Recommended repo layout:

```
astro-journal/
  CLAUDE.md            rules for the agent (section 0.1)
  docs/                PRD, ARCHITECTURE, ENGINE_SPEC, SCORING_SPEC, DATA_MODEL,
                       UI_SPEC, CONTENT_SPEC, TEST_PLAN, SAFETY, MILESTONES
  packages/
    engine/            pure TypeScript calculation library, no I/O
    content/           rules, constants, templates as YAML/JSON
    store/             SQLite schema, migrations, repositories
    app-core/          use cases: today view, log entry, patterns, polish
  apps/
    web/               Vite + React PWA (first client)
    mobile/            Expo (later)
  fixtures/            golden charts as JSON, plus the sample report PDF
```

### 0.1 CLAUDE.md (place at repo root)

1. The engine is pure: no network, no file I/O, no clock reads. Time is always an input.
2. Deterministic: the same input and settings give byte-identical JSON output.
3. All astrology constants (lords, friendships, dasha years, bindu tables, template text) are data files in packages/content, each with a source field.
4. Every engine function has unit tests, and every milestone adds golden tests against fixtures/.
5. LLM code lives only in packages/app-core/polish and is optional. The app must pass every test with it disabled.
6. Every user-facing statement carries factor ids so the UI can show why.
7. Angles are float64 degrees internally, normalized with mod 360. Format to degrees-minutes-seconds only at the edge.
8. Strict TypeScript, no any, zod schemas at every boundary.
9. Small commits. Update the docs whenever a decision changes.
10. Ask before adding a dependency with a non-permissive license.

## 1. Product requirements (PRD)

### 1.1 Vision

A personal almanac for people who live by the sky. It calculates Vedic astrology for the next hour, today, this month and this year, and pairs that with a daily journal that stores mood and events together with the sky at that moment. Over time the app shows the user their own patterns.

### 1.2 Users

- Primary: adults in India and the diaspora who already check astrology apps daily and want calculation and reflection in one place.
- Secondary (later): learners and practitioners who want transparent calculations.

### 1.3 Core loop

Open Now, see the band and the reasons, log mood or an event, review weekly patterns, and trust the app more because it shows its work.

### 1.4 In scope for v1

- Onboarding with birth data, place search and timezone confirmation.
- Natal chart (D1 and D9), North and South Indian rendering, planet table.
- Vimshottari dasha to pratyantar level, and panchang.
- Views: Now (next hour), Today, This Month, This Year.
- Journal: quick log, timeline, tags, sky snapshot saved with each entry.
- Patterns screen built from the user's own entries.
- Safety flow for distress.
- Local-first storage, JSON export, delete-all.
- Settings: ayanamsa, house system, node type, dasha year length, chart style.
- PDF export of the natal report, with no ads.

### 1.5 Non-goals for v1

- Live astrologer marketplace, per-minute billing, e-commerce or remedy selling.
- Social features.
- Predictions about health, death, accidents, pregnancy or money.
- Open-ended LLM chat.
- Kundli matching (v2).

### 1.6 Success metrics

| Metric | Target |
| --- | --- |
| Day-7 retention | 35% or higher |
| Journal entries per active user per week | 4 or more |
| Users opening the Why panel | 40% or higher |
| Engine agreement with reference software on test charts | 100% on signs, nakshatras and dasha lords; planets within 1 arcminute |

## 2. Architecture

### 2.1 Stack

- TypeScript in a pnpm monorepo. The engine is a pure package usable in browser, Node and React Native.
- Ephemeris behind an interface (EphemerisProvider). Primary implementation: Swiss Ephemeris compiled to WASM. Alternative: astronomy-engine (MIT, roughly 1 arcminute accuracy). Swiss Ephemeris is AGPL or a paid commercial license, so make this licensing decision in milestone M0 before building on it.
- Storage: SQLite (better-sqlite3 in tests, SQLite WASM in the browser, expo-sqlite on mobile).
- Optional LLM polish through a thin server proxy, off by default.

### 2.2 Data flow

```
BirthInput -> computeNatal -> NatalChart (cached, immutable)
Instant    -> computeSky  -> SkySnapshot
(natal, sky, panchang, dasha) -> scoreHour -> HourScore {band, score, factors[]}
factors -> selectTemplates -> text (deterministic)
text -> optional polish -> validator -> final text or fallback
Journal entry -> attach SkySnapshot -> store -> pattern job
```

### 2.3 Public engine API

```ts
computeNatal(birth: BirthInput, s: Settings): NatalChart
computeDashas(natal: NatalChart, s: Settings, depth: 1 | 2 | 3 | 4): DashaTree
computePanchang(at: Instant, place: Place, s: Settings): Panchang
computeSky(at: Instant, s: Settings): SkySnapshot
scoreHour(ctx: ScoreContext, cfg: ScoringConfig): HourScore
buildDay(ctx, date, cfg): DayView
buildMonth(ctx, year, month, cfg): MonthView
buildYear(ctx, year, cfg): YearView
```

BirthInput: local date and time, place name, latitude, longitude, IANA timezone id, resolved UTC offset, and timeCertainty (exact, approximate or unknown).

Settings and defaults:

| Setting | Options | Default |
| --- | --- | --- |
| ayanamsa | lahiri, kp\_new, raman, krishnamurti, yukteshwar | lahiri |
| houseSystem | whole\_sign, equal, sripati, placidus | whole\_sign for rashi view, sripati for Chalit |
| nodeType | mean, true | mean |
| dashaYear | 365.25, 360 | 365.25 |
| chartStyle | north, south, east | north |

### 2.4 Performance targets (mid-range phone)

Natal chart under 50 ms, a day of 24 hourly scores under 200 ms, a month under 1 s, a year under 3 s. Cache transit positions per day and never recompute the natal chart unless engine version or settings change.

## 3. Engine specification

### 3.1 Time

- Resolve the IANA timezone from latitude and longitude using historical rules. Convert local time to a UTC instant and store the original local string and timezone id too.
- If the local time is ambiguous or does not exist (daylight saving, wartime offsets), return AMBIGUOUS\_LOCAL\_TIME with the candidates and let the user choose.
- Julian Day comes from the UTC instant. The sample report shows only the integer part (2451064), while the real value is about 2451064.243.
- Local Mean Time correction is longitude divided by 15 hours, minus the timezone offset. Check: 86°10'E gives +14m40s relative to 5.5h, matching the report.

### 3.2 Planet positions

- Sun to Saturn plus Rahu and Ketu. Outer planets (Uranus, Neptune, Pluto) are optional and off by default.
- Compute tropical longitudes, then sidereal = tropical minus ayanamsa, normalized to 0 to 360.
- Retrograde flag when daily speed is negative. Rahu and Ketu are always marked retrograde in the mean-node convention. Ketu is Rahu plus 180.
- Output per planet: longitude, sign, degree in sign, nakshatra, pada, speed, retrograde, and combustion flag (v2).

### 3.3 Ayanamsa

Lahiri is the default. Expected on the sample date: Lahiri 23°50'17″, KP new 23°44'53″. The difference moves the Moon about 6 arcminutes, enough to change dasha dates by weeks.

### 3.4 Lagna and houses

- Ascendant from local sidereal time, latitude and obliquity, then subtract ayanamsa.
- Whole-sign houses for the rashi chart. For the Chalit chart use Sripati (bhava madhya, with bhava begin at midpoints), validated against the sample report's Chalit table.
- Expected: Lagna Taurus 27°40'54″ (Lahiri), lord Venus.

### 3.5 Nakshatra and pada

nakshatra = floor(longitude / 13.3333), pada = floor((longitude mod 13.3333) / 3.3333) + 1. Check: Moon at 338.6158° gives index 25 (Uttarabhadra), pada 2.

### 3.6 Panchang

| Item | Formula (sidereal longitudes) | Sample check |
| --- | --- | --- |
| Tithi | floor(((Moon - Sun) mod 360) / 12) + 1 | 17, which is Krishna Dvitiya |
| Yoga | floor(((Sun + Moon) mod 360) / 13.3333) + 1 | 9, Shula |
| Karana | half-tithi index from floor(((Moon - Sun) mod 360) / 6); index 0 is Kimstughna, indices 1 to 56 cycle Bava, Balava, Kaulava, Taitila, Gara, Vanija, Vishti, indices 57 to 59 are Shakuni, Chatushpada, Naga | Taitila |
| Vara | weekday from sunrise to next sunrise | Monday |

Sunrise and sunset use the upper limb with standard refraction. Expected: sunrise 05:29:25, sunset 17:57:31, day length 12:28:05 (allow 1 minute tolerance because definitions differ).

### 3.7 Vimshottari dasha

- Order and years: Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19, Mercury 17 (total 120).
- Starting lord is the lord of the Moon's nakshatra. Balance at birth = lord years x (1 - fraction of the nakshatra elapsed).
- Sub-periods are proportional: sub-period length = parent length x child years / 120, starting from the parent lord. Support depth 4 (mahadasha, antardasha, pratyantar, sookshma).
- Year length is a setting (365.25 or 360 days) and must be shown to the user.
- Check: Moon 5.2825° into Uttarabhadra gives fraction 0.3962, so Saturn balance is 19 x 0.6038 = 11.47 years, which is 11y 5m 20d. Saturn mahadasha ends 28/2/2010 (Lahiri) and Mercury starts then.

### 3.8 Divisional charts

Priority 1 (v1): D1, D2, D3, D4, D7, D9, D10, D12. Priority 2: D16 to D60. Implement Parashari rules and expose school variants as settings where they exist.

| Chart | Rule |
| --- | --- |
| D9 Navamsa | 9 parts of 3°20' per sign. Movable signs start from the same sign, fixed from the 9th, dual from the 5th, then count forward. |
| D10 Dasamsa | 10 parts of 3°. Odd signs start from the same sign, even signs from the 9th. |
| D3 Drekkana | 3 parts of 10°: same sign, 5th, 9th. |
| D7 Saptamsa | 7 parts. Odd signs start from the same sign, even from the 7th. |
| D12 Dwadasamsa | 12 parts of 2°30', starting from the same sign. |
| D2 Hora | Odd signs: first 15° Sun (Leo), next 15° Moon (Cancer). Even signs reversed. |

Check: the sample Navamsa lagna is Virgo (Taurus is fixed, so counting starts at Capricorn, and the 9th part lands on Virgo).

### 3.9 Ashtakvarga

- Encode the classical Parashara bindu contribution tables (7 planets plus Lagna, each from 8 reference points) in packages/content/ashtakvarga.json, with the source cited.
- Output Bhinna (per planet), Sarva (sum) and Prastara tables.
- Invariants: planet totals Sun 48, Moon 49, Mars 39, Mercury 54, Jupiter 56, Venus 52, Saturn 39, and Sarva total 337.
- Sample Sarva by sign from Aries: 26, 33, 33, 26, 31, 19, 30, 20, 28, 37, 28, 26. The report's Prastara tables (page 18) are golden fixtures.

### 3.10 Transits (Gochar)

- For any instant compute sky positions, then for each planet its house from natal Lagna and from natal Moon sign.
- Sade Sati: Saturn in the 12th, 1st or 2nd sign from the natal Moon sign. Also flag Ashtama Shani (Saturn 8th from Moon) and Kantaka Shani (4th, 7th, 10th).
- Jupiter transit house from the Moon, Rahu-Ketu axis, stations and retrograde periods.
- Ashtakvarga transit points: bindus of the sign a planet currently occupies, from that planet's own Bhinna table.

### 3.11 Yogas and doshas (phase 2)

Rules are data, not code. Each rule is a YAML entry the engine evaluates:

```yaml
- id: gajakesari
  name: Gaja Kesari Yoga
  source: Phaladeepika (verify chapter and verse)
  when:
    all:
      - planets: [jupiter, moon]
        relation: in_kendra_from
  strength: from_dignity_and_aspects
  text_key: yoga.gajakesari
```

Start with about 25 well-attested yogas (Pancha Mahapurusha, Gaja Kesari, Budha-Aditya, Dhana and Raja yogas by lordship), plus Mangal dosha and Kaal Sarp, each flagged with a school note where interpretations differ.

## 4. Scoring specification

### 4.1 Principles

The score is additive, transparent and configurable. Every factor returns an id, a signed value, a short label and a template key, so the UI can list exactly why a band was shown. All weights live in packages/content/scoring.yaml and carry a version string that is saved with every sky snapshot.

These rules are tradition-based heuristics. Nothing here is validated as predictive, and the UI must say so.

### 4.2 Hour factors

| Factor id | Rule | Value |
| --- | --- | --- |
| chandra\_bala | Transit Moon's house counted from the natal Moon sign | Houses 1, 3, 6, 7, 10, 11: +2. Houses 2, 4, 5, 9, 12: -1. House 8 (Chandrashtama): -2 |
| tara\_bala | Count from natal nakshatra to the Moon's current nakshatra, mod 9 (1 Janma, 2 Sampat, 3 Vipat, 4 Kshema, 5 Pratyari, 6 Sadhana, 7 Naidhana, 8 Mitra, 9 Parama Mitra) | Taras 2, 4, 6, 8, 9: +2. Taras 3, 5, 7: -2. Tara 1: 0 |
| sav\_moon\_sign | Sarva Ashtakvarga bindus in the sign the Moon occupies | 30 or more: +1. 25 to 29: 0. 24 or fewer: -1 |
| hora | Hora lord against the natal Lagna lord, by natural friendship | Friend +1, neutral 0, enemy -1 |
| dasha\_hora | Hora lord equals the running Mahadasha or Antardasha lord | +1, otherwise 0 |
| window | Rahu Kalam, Yamaganda or Gulika is active (take the worst, not the sum) | -1, otherwise 0 |

Total range is -6 to +7. Default bands: 3 or more is Flowing, -2 or less is Go gently, anything between is Steady. Band names, thresholds and weights are configuration, never hard-coded.

Hora: the day is split into 12 horas from sunrise to sunset and the night into 12 from sunset to next sunrise. The first hora of a day belongs to the weekday lord, then lords follow the order Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon.

Inauspicious windows: divide sunrise to sunset into 8 equal parts and use the part number by weekday.

| Weekday | Rahu Kalam | Yamaganda | Gulika |
| --- | --- | --- | --- |
| Sunday | 8 | 5 | 7 |
| Monday | 2 | 4 | 6 |
| Tuesday | 7 | 3 | 5 |
| Wednesday | 5 | 2 | 4 |
| Thursday | 6 | 1 | 3 |
| Friday | 4 | 7 | 2 |
| Saturday | 3 | 6 | 1 |

### 4.3 Day view

- Score every hour, then merge consecutive hours of the same band into windows.
- Show the two best Flowing windows, the two Go gently windows, Rahu Kalam, and the panchang card.
- Day band is the mean score of waking hours (06:00 to 22:00), mapped through the same thresholds.

### 4.4 Month view

- A heat-map calendar using each day's band.
- Event list: Sun ingress, sign changes of Mars, Mercury, Venus, Jupiter, Saturn and the nodes, retrograde and direct stations, new and full moon, and Antardasha or Pratyantar changes.
- Theme line per week: which house from Lagna the transiting Sun and Mars activate, stated neutrally.

### 4.5 Year view

- A 12-month strip using the mean of day bands.
- Slow-transit cards: Jupiter and Saturn house from Lagna and from Moon, Rahu-Ketu axis, Sade Sati phase, with start and end dates.
- Dasha timeline for the year, with Antardasha changes.
- Varshaphal (Tajaka annual chart) is a v2 module.

### 4.6 Personal calibration

- Per band, compute the mean mood from the user's entries, the difference from the user's overall mean, and a bootstrap 95% confidence interval (1000 resamples).
- Show a pattern only when each bucket has at least 30 entries and the interval excludes zero. Otherwise show: No clear pattern yet.
- In v1 never change the astrological score from user data. Show the user's own statistics next to it.

## 5. Data model

SQLite, timestamps in ISO 8601 UTC, ids as UUIDs.

```sql
CREATE TABLE profile (
  id TEXT PRIMARY KEY, name TEXT,
  birth_utc TEXT NOT NULL, birth_local TEXT NOT NULL, tz_id TEXT NOT NULL,
  lat REAL NOT NULL, lon REAL NOT NULL, place_name TEXT,
  time_certainty TEXT NOT NULL CHECK (time_certainty IN ('exact','approx','unknown')),
  created_at TEXT NOT NULL
);
CREATE TABLE settings (
  profile_id TEXT PRIMARY KEY REFERENCES profile(id),
  json TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE natal_chart (
  profile_id TEXT PRIMARY KEY REFERENCES profile(id),
  engine_version TEXT NOT NULL, settings_hash TEXT NOT NULL,
  json TEXT NOT NULL, computed_at TEXT NOT NULL
);
CREATE TABLE sky_snapshot (
  id TEXT PRIMARY KEY, profile_id TEXT NOT NULL REFERENCES profile(id),
  at_utc TEXT NOT NULL, engine_version TEXT NOT NULL, scoring_version TEXT NOT NULL,
  band TEXT NOT NULL, score INTEGER NOT NULL, json TEXT NOT NULL
);
CREATE TABLE journal_entry (
  id TEXT PRIMARY KEY, profile_id TEXT NOT NULL REFERENCES profile(id),
  at_utc TEXT NOT NULL,
  mood INTEGER CHECK (mood BETWEEN 1 AND 5),
  energy INTEGER CHECK (energy BETWEEN 1 AND 5),
  body TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('checkin','event','reflection')),
  snapshot_id TEXT REFERENCES sky_snapshot(id),
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT
);
CREATE TABLE tag (id TEXT PRIMARY KEY, label TEXT UNIQUE NOT NULL);
CREATE TABLE entry_tag (
  entry_id TEXT REFERENCES journal_entry(id),
  tag_id TEXT REFERENCES tag(id),
  PRIMARY KEY (entry_id, tag_id)
);
CREATE TABLE pattern_result (
  id TEXT PRIMARY KEY, profile_id TEXT NOT NULL REFERENCES profile(id),
  metric TEXT NOT NULL, bucket TEXT NOT NULL, n INTEGER NOT NULL,
  mean REAL, ci_low REAL, ci_high REAL,
  scoring_version TEXT NOT NULL, computed_at TEXT NOT NULL
);
CREATE TABLE safety_event (
  id TEXT PRIMARY KEY, at_utc TEXT NOT NULL, trigger TEXT NOT NULL, action_shown TEXT NOT NULL
);
CREATE INDEX idx_entry_time ON journal_entry(profile_id, at_utc);
CREATE INDEX idx_snapshot_time ON sky_snapshot(profile_id, at_utc);
```

Rules:

- Sky snapshots are immutable. A new scoring version never rewrites old snapshots.
- Recompute natal\_chart when engine\_version or settings\_hash changes.
- Journal deletes are soft first, and hard-deleted by the delete-all action.
- safety\_event stores no free text.
- Full JSON export and delete-all must work offline.

## 6. UI specification

### 6.1 Design tokens

| Token | Value |
| --- | --- |
| Ink (dark background) | #15132b |
| Surface (dark cards) | #201d40 |
| Text on dark | #f3eee2 |
| Gold accent | #e3ad46 |
| Teal accent | #5fc2b3 |
| Paper (light background) | #f6f1e7 |
| Indigo (light accent) | #3b3a8f |

Band colors: Flowing is teal, Steady is sand, Go gently is soft amber. Never use red. Display type is serif, UI type is a clean sans. Respect system light and dark mode. Band is always shown with a text label and an icon, never color alone.

### 6.2 Navigation

Bottom tabs: Now, Journal, Calendar (Day, Month, Year), Chart, Me.

### 6.3 Screens

| Screen | Contents and behavior |
| --- | --- |
| Onboarding | Name, date, time, place search. Show the resolved timezone and UTC offset with a Is this right? confirm. Time certainty selector. Short honest note on what the app is. Ayanamsa defaults to Lahiri. |
| Now | Band card with one-line text, a Why expander listing each factor with its plus or minus, a Shifts at 14:10 line, next Flowing window, and a floating Log button. |
| Quick log | Five-step mood, energy slider, tag chips, optional note, Save. A toast confirms Sky saved with the entry. Works offline. |
| Today | 24-hour strip of colored segments, window list, panchang card, current dasha line. |
| Month | Heat-map calendar, tap a day to open its Today view, event list below. |
| Year | 12-month strip, slow-transit cards, dasha timeline. |
| Timeline | Entries newest first, each with a small sky chip (Moon sign, dasha). Filter by tag, mood, dasha, or band. |
| Patterns | One card per finding with n, the interval, and plain wording. Empty state explains the 30-entry minimum and shows progress. |
| Chart | D1 and D9 toggle, North, South or East style, planet table, dasha tree. |
| Settings and privacy | Ayanamsa, house system, node type, dasha year, chart style, notifications (off by default), export, delete-all, polish toggle (off). |
| Safety | Full-screen calm layout, see section 9. |

### 6.4 States and edge cases

- Offline: everything works. Only place search and the optional polish need a network.
- Unknown birth time: hide Lagna-dependent features and show Moon-based views only, with a banner.
- Ambiguous local time: ask the user to pick from the candidates.
- Empty journal: one-line invitation to log, no guilt language.

### 6.5 Notifications and accessibility

- Notifications are opt-in, at most one daily summary at a time the user picks. Never fear wording.
- Contrast 4.5:1 minimum, dynamic type, screen reader labels for every band and chart, reduce-motion support.

## 7. Content and text generation

### 7.1 Templates

Templates are YAML with slots. Selection is deterministic: pick the variant by hash of date and template id, so the same inputs always give the same text.

```yaml
- id: now.chandra.good
  when: { factor: chandra_bala, gte: 2 }
  variants:
    - In Jyotish tradition the Moon in your {{moon_house_from_moon}}th house from your birth Moon favors steady, practical action.
    - The Moon sits {{moon_house_from_moon}} signs from your birth Moon, a placement traditionally read as supportive.
  factors: [chandra_bala]
```

- Two to three sentences per card. Hedged, traditional framing (In Jyotish tradition, traditionally read as).
- Banned words and ideas: death, accident, illness, cursed, doom, guaranteed, will happen, and any health, pregnancy or financial forecast.
- Go gently text suggests pacing and attention, never prohibits activity.

### 7.2 Optional LLM polish

Input is a JSON object with the facts, the template text and a style hint. The model may only rephrase. Output must pass a validator:

1. No planet, sign, house, number or date that is absent from the input facts.
2. Length no more than 1.3 times the template text.
3. No banned words.
4. Any failure means the template text is shown.

The provider sits behind an interface, nothing is logged, and the prompt is versioned in the repo. The app passes all tests with polish disabled.

## 8. Test plan

### 8.1 Golden fixtures from the sample report

Birth: 7 Sep 1998, 23:20:34 IST (UTC+5:30), Jamshedpur, 22°48'N, 86°10'E, Lahiri.

| Item | Expected |
| --- | --- |
| Lagna | Taurus 27°40'54″, Mrigasira pada 2 |
| Sun | Leo 21°04'23″ |
| Moon | Pisces 8°36'57″, Uttarabhadra pada 2 |
| Mars | Cancer 17°37'34″ |
| Mercury | Leo 5°36'58″ |
| Jupiter | Pisces 0°20'49″, retrograde |
| Venus | Leo 7°19'48″ |
| Saturn | Aries 9°19'04″, retrograde |
| Rahu / Ketu | Leo / Aquarius 6°39'35″ |
| Panchang | Krishna Dvitiya, Yoga Shula, Karana Taitila, Monday |
| Vimshottari | Saturn balance 11y 5m 20d, Mercury Mahadasha starts 28/2/2010 |
| KP variant | Using KP new ayanamsa 23°44'53″, Mercury Mahadasha starts 11/1/2010 |
| Ashtakvarga | Sarva by sign: 26, 33, 33, 26, 31, 19, 30, 20, 28, 37, 28, 26 |
| Sunrise, sunset | 05:29:25 and 17:57:31 (within 1 minute) |

Tolerances: planets within 1 arcminute, Lagna within 2 arcminutes, dasha dates within 1 day.

### 8.2 Property tests

- Angle normalization stays in 0 to 360.
- Mahadasha lengths sum to 120 years, sub-periods sum to their parent.
- Sarva Ashtakvarga total is always 337 and each planet total matches its constant.
- Tithi increases monotonically across a lunar month.
- Same input gives byte-identical output.

### 8.3 Cross-checks and other layers

- Compare 10 varied charts against Jagannatha Hora: pre-1945 India births, high latitude, near midnight, near sign boundaries. Log every deviation in docs/TEST\_PLAN.md with the cause.
- Snapshot tests for generated text, regression tests for scoring configs, Playwright flows for onboarding, quick log and Now, accessibility checks in CI.
- CI runs lint, typecheck, unit, golden and build on every push.

## 9. Safety, ethics and privacy

### 9.1 Positioning

Onboarding and the Why panel state: This is a reflection tool based on Jyotish tradition. It is not a prediction, and not medical, legal or financial advice.

### 9.2 Content limits

No statements about death, illness, accidents, pregnancy or money outcomes. No remedy selling, no fear-based prompts, no urgency language.

### 9.3 Distress flow

- Trigger on mood 1 logged twice within three days, or on keywords in a maintained English and Hindi list in packages/content/safety.yaml.
- When triggered, skip astrology entirely. Show a calm screen: acknowledgement, two grounding steps (slow breathing, write it down), a prompt to reach someone you trust, and locale-based help resources.
- Resources are data, not code. For India include Tele-MANAS (14416) and the emergency number 112. Verify every number before each release.
- Never ask probing questions inside the app, and never store the text that triggered the flow.

### 9.4 Overuse

If Now is opened more than 10 times in a day, show one gentle note about checking less often.

### 9.5 Privacy and legal

- Data stays on the device. No analytics that include journal content or birth data. If sync is added later, encrypt end to end.
- Provide consent at onboarding, full export and delete-all. Review obligations under India's Digital Personal Data Protection Act, 2023 with counsel.
- Resolve the Swiss Ephemeris license (AGPL or commercial) before any public release.

## 10. Milestones

Each milestone ends with passing tests and updated docs.

| Milestone | Scope | Definition of done |
| --- | --- | --- |
| M0 Setup | Monorepo, CI, fixtures, CLAUDE.md, ephemeris adapter spike, license decision | CI green, sample PDF in fixtures, decision recorded |
| M1 Time and positions | Timezone resolution, Julian Day, sidereal time, planets, ayanamsa, Lagna | Golden positions pass within tolerance |
| M2 Panchang and dashas | Nakshatra, tithi, yoga, karana, Vimshottari to depth 4, D1 and D9, North and South SVG charts | Golden panchang and dasha dates pass |
| M3 Time quality and transits | Sunrise and sunset, hora, Rahu Kalam, Yamaganda, Gulika, Ashtakvarga, transit engine | Ashtakvarga fixtures and invariants pass |
| M4 Scoring and text | Scoring engine, day, month, year builders, templates, banned-word checks | Scoring regression and text snapshot tests pass |
| M5 Store and journal | SQLite schema, repositories, quick log, sky snapshots, timeline, app shell with Now | Entries persist offline, snapshot saved with each entry |
| M6 Views | Today, Month, Year, Chart screens, Settings | Playwright flows pass, accessibility checks pass |
| M7 Patterns and safety | Pattern job with bootstrap intervals, safety flow, export, delete-all | Statistical tests pass, safety flow tested end to end |
| M8 Polish | PDF natal report, opt-in notifications, optional LLM polish, beta build | Beta checklist complete |

Phase 2: all 16 vargas, KP system, Yogini and Char dasha, Shadbala, yoga and dosha rule engine, Kundli matching, Varshaphal, Muhurta.

## 11. Open decisions and starter prompts

### 11.1 Decisions to make early

1. Ephemeris and license: Swiss Ephemeris (commercial license or AGPL) versus the MIT astronomy-engine with lower accuracy.
2. First client: PWA first or Expo mobile first.
3. Place search: bundled GeoNames data versus a geocoding API.
4. Optional LLM provider and hosting for the polish proxy.
5. Monetization: subscription for deep reports and export. Not remedies, not per-minute consultations.

### 11.2 Starter prompts for the harness

M0: Read CLAUDE.md and docs/. Set up the pnpm monorepo with the layout in section 0, strict TypeScript, vitest, lint and CI. Define the EphemerisProvider interface and a Swiss Ephemeris WASM spike that returns the Sun and Moon longitudes for the sample birth. Copy the sample report PDF to fixtures/. Do not implement anything else.

M1: Implement section 3.1 to 3.5 in packages/engine. Write the golden tests in section 8.1 first, then make them pass. Report any value outside tolerance with the measured difference and a hypothesis. Do not change a test to make it pass without asking.

## 12. Client and server architecture (revision)

This section replaces the on-device engine plan. Calculations now run on a server. The client is a thin interface that keeps all of the user's data locally and renders only from its local store. Where this section conflicts with sections 2, 6.4, 9.5 and 10, this section wins (the list is in 12.11).

### 12.1 Principles

1. The server calculates. It is stateless: it stores no birth data, no journal and no user profile.
2. The client stores everything the user owns: profile, natal chart, dashas, journal, calculation results, patterns, settings.
3. The UI reads only from the local database. It never calls the API directly. A separate sync layer talks to the server and writes results into the database, and the UI updates from there.
4. Journal text never leaves the device. Patterns and the safety check are computed on the client.
5. Birth data is sent once (onboarding or a settings change). After that the client sends a small natal digest instead.
6. Calculations are deterministic by input, so responses are cacheable and any past moment can be recomputed later.

### 12.2 Topology

```
CLIENT (PWA now, Expo later)                         SERVER (stateless)
+-------------------------------+                    +--------------------------+
| UI components (no astrology)  |                    | API gateway + rate limit |
|   reads from local DB only    |                    |   |                      |
| view-models / hooks (app-core)|                    |   +-- Calc service       |
| Local store (SQLite)          |   HTTPS + JSON     |   |   (packages/engine)  |
|   profile, natal, journal,    | <----------------> |   +-- Content service    |
|   calc cache, hourly scores   |                    |   |   (templates, rules) |
| Sync layer: fetch, queue,     |                    |   +-- Geo/TZ lookup      |
|   retry, cache policy         |                    |   +-- Polish proxy (opt.)|
| Patterns + safety (local)     |                    +--------------------------+
+-------------------------------+
```

### 12.3 Natal digest

The digest is a compact JSON object (about 2 KB) produced by the server at onboarding and stored on the client. Scoring endpoints take the digest, not the birth data.

Contents: Lagna sign and lord, Moon sign and nakshatra, nakshatra index, Sarva Ashtakvarga array (12 values), planetary signs and houses, Mahadasha and Antardasha timeline (start dates, lords), settings hash, engine version.

### 12.4 API (v1)

All bodies are JSON validated by shared zod schemas in packages/api-contract. Every response uses an envelope:

```json
{ "meta": { "engineVersion": "1.0.0", "scoringVersion": "s1", "contentVersion": "c1",
            "settingsHash": "ab12", "computedAt": "ISO", "validUntil": "ISO" },
  "data": { } }
```

| Endpoint | Input | Output | Notes |
| --- | --- | --- | --- |
| POST /v1/natal | birth, settings | full natal chart, digest | Called once and on settings change. Not cached. |
| GET /v1/sky | at, lat, lon, settings | sky positions, panchang | Contains nothing personal. Round time to the minute, cache on a CDN. |
| POST /v1/dashas | digest, depth, from, to | dasha tree for the window | Full Mahadasha and Antardasha list is stored once, deeper levels on demand. |
| POST /v1/now | digest, at, place | hour score, factors, text | Single hour, used when the bundle is stale. |
| POST /v1/day, /month, /year | digest, period, place | the matching view | For navigating outside the prefetched range. |
| POST /v1/bundle | digest, place, from, days | hourly scores for N days, day bands, month and year views, panchang per day | The main prefetch call. Default 7 days of hours. |
| POST /v1/snapshots | digest, at\[\] (max 200) | one snapshot per instant | Back-fills journal entries logged offline. |
| GET /v1/content/manifest | none | engine, scoring and content versions | Cheap check for staleness. |
| GET /v1/geo/search, /v1/geo/tz | query, or lat and lon | places, timezone and historical offset | Place search for onboarding. |
| POST /v1/polish (optional) | facts, template text | polished text | Facts only, never journal text. |

Error codes: INVALID\_INPUT, AMBIGUOUS\_LOCAL\_TIME, UNSUPPORTED\_SETTING, RATE\_LIMITED, ENGINE\_ERROR, VERSION\_MISMATCH.

### 12.5 Server design

- Node and Fastify in TypeScript. It imports packages/engine and packages/content directly, so the engine stays the single source of truth.
- Stateless and horizontally scalable. Ephemeris data files are bundled in the container image.
- No request bodies are persisted or logged. Logs hold route, status, latency and engine version only.
- Determinism: the same request gives the same bytes. Send an ETag and honor If-None-Match.
- Rate limiting by anonymous install token (issued by the server, no personal data attached) plus IP.
- Targets: /v1/bundle p95 under 500 ms, /v1/now p95 under 150 ms, /v1/sky served from cache in most cases.
- Observability: metrics and traces with no personal data, alerts on error rate and latency.
- Deploy as containers behind a CDN, with blue-green releases. Choose an India region first, since most users are there.

### 12.6 Client design

Layers, top to bottom:

1. UI components: presentational, no astrology logic, no network.
2. View-models (hooks in packages/app-core): shape local rows for each screen, for example useNow(), useDay(date), useJournal().
3. Repositories (packages/store): the only code that touches SQLite.
4. Sync layer (packages/app-core/sync): the only code that touches the network. It fetches, validates against the contract, writes to the database, and manages the queue.

Technology: PWA with SQLite WASM on OPFS and a service worker for the app shell. Expo later with expo-sqlite. UI subscribes to live queries so a sync write updates the screen automatically.

Patterns (section 4.6) and the distress check (section 9.3) run on the client against local data.

### 12.7 Local database additions

These tables are added to section 5. The natal\_chart table also stores the digest.

```sql
ALTER TABLE natal_chart ADD COLUMN digest_json TEXT;

CREATE TABLE calc_cache (
  key TEXT PRIMARY KEY,            -- hash of endpoint + request
  kind TEXT NOT NULL,              -- bundle, day, month, year, dashas
  valid_from TEXT, valid_until TEXT NOT NULL,
  engine_version TEXT NOT NULL, scoring_version TEXT NOT NULL, content_version TEXT NOT NULL,
  json TEXT NOT NULL, fetched_at TEXT NOT NULL, stale INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE hourly_score (
  profile_id TEXT NOT NULL REFERENCES profile(id),
  hour_utc TEXT NOT NULL,
  score INTEGER NOT NULL, band TEXT NOT NULL,
  factors_json TEXT NOT NULL, text TEXT NOT NULL,
  scoring_version TEXT NOT NULL,
  PRIMARY KEY (profile_id, hour_utc)
);
CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY, op TEXT NOT NULL,   -- snapshot_backfill, bundle_refresh
  payload TEXT NOT NULL, created_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0, next_retry_at TEXT
);
CREATE TABLE kv_meta (k TEXT PRIMARY KEY, v TEXT NOT NULL);  -- last_sync, install_token, versions
```

### 12.8 Freshness and cache policy

| Data | Source | Valid until | When refreshed |
| --- | --- | --- | --- |
| Natal chart, digest | /v1/natal | Settings or engine version changes | Onboarding, settings change |
| Mahadasha and Antardasha list | /v1/dashas | Same as natal | With natal; Pratyantar window on demand |
| Hourly scores and panchang | /v1/bundle | End of the covered range | On app open if older than 6 hours, and daily in the background where allowed |
| Month view | /v1/bundle | End of the month, rechecked weekly | Current and next month |
| Year view | /v1/bundle | Rechecked monthly | Current and next year |
| Journal sky snapshot | hourly\_score or /v1/snapshots | Never changes | Once, at log time or on reconnect |

Stale-while-revalidate: show cached data at once with an Updated 2h ago chip, refresh in the background. If the cache does not cover the current hour, show a calm empty state: Connect to refresh your sky.

When the manifest shows new engine, scoring or content versions, mark cache rows stale and refetch the bundle. Journal snapshots are never rewritten.

### 12.9 Sync flows

- Onboarding: place search, then /v1/natal, store profile, natal and digest, then /v1/bundle, then show Now.
- App open: render from the local database, then check the manifest and refresh the bundle if needed.
- Quick log: write the entry locally at once. Look up the covering hour in hourly\_score and attach it as the snapshot. If it is missing, queue a snapshot\_backfill and attach when /v1/snapshots returns.
- Settings change: confirm with the user, call /v1/natal with the new settings, mark caches stale, refetch the bundle. Old snapshots keep their original versions.
- Failures: exponential backoff with jitter, a maximum number of attempts, and a visible Sync paused note in Settings, never a blocking error.

### 12.10 Security and privacy under this model

- Be honest in the UI and the privacy text: birth details and the natal digest are sent to our server to calculate, and are not stored. Journal entries stay on the device.
- TLS only, certificate pinning on mobile, request size limits, schema validation on every request.
- No accounts in v1. The install token is anonymous and rotates.
- Local encryption: SQLCipher on mobile. On web, OPFS is not encrypted by default, so offer an optional passcode that derives a key with WebCrypto to encrypt journal text fields.
- Cross-device sync is v2, as an end-to-end encrypted blob the server cannot read.
- Review hosting location and data-transfer duties under India's Digital Personal Data Protection Act, 2023 with counsel.

### 12.11 What this section replaces

| Earlier statement | Now |
| --- | --- |
| 2.1 and 2.3: engine usable in the browser and on-device | Engine runs on the server only in v1. The client never imports packages/engine. |
| 2.4: performance targets for on-device compute | Targets are end-to-end: Now renders from local data instantly, bundle p95 under 500 ms. |
| 6.4: Offline, everything works | Offline: journal, timeline, patterns, chart and the last bundle work. Fresh calculations need a connection. |
| 9.5: Data stays on the device | Journal and stored results stay on the device. Birth data is sent to the stateless server for calculation only. |
| 0.1 rule 1 and the repo layout | Add the rules and packages in 12.12. |
| 10: milestones | Replaced by the table in 12.13. |

### 12.12 Monorepo and CLAUDE.md changes

New layout items: apps/server (Fastify), packages/api-contract (zod schemas and types shared by client and server). packages/engine stays pure and is used only by apps/server.

Add to CLAUDE.md:

11. UI components never import the engine and never call the API. They read from view-models only.
12. Only the sync layer touches the network, and it validates every response against api-contract.
13. The server never persists or logs request bodies. Add a test that proves it.
14. Any change to api-contract needs a version note and updated contract tests on both sides.
15. Journal text must never be sent to any endpoint.

### 12.13 Revised milestones

| Milestone | Scope | Definition of done |
| --- | --- | --- |
| M0 Setup | Monorepo, CI, fixtures, CLAUDE.md, ephemeris spike, license decision, api-contract skeleton, empty Fastify server with /health | CI green, contract package builds, server deploys locally |
| M1 Positions | Time, planets, ayanamsa, Lagna in packages/engine | Golden positions pass |
| M2 Natal API | Panchang, nakshatra, Vimshottari, D1 and D9, digest, POST /v1/natal and /v1/dashas | Golden panchang and dasha tests pass through the HTTP API |
| M3 Time quality | Sunrise and sunset, hora, windows, Ashtakvarga, transits, GET /v1/sky | Ashtakvarga fixtures pass, sky responses cache correctly |
| M4 Scoring | Scoring engine, templates, /v1/now, /day, /month, /year, /bundle, /snapshots | Scoring regression and text snapshot tests pass, bundle p95 under 500 ms |
| M5 Client core | SQLite schema, repositories, sync layer, cache policy, queue, onboarding, Now screen reading from local data | App renders Now offline from cache, network blocked test passes |
| M6 Journal and views | Quick log with snapshot attach and backfill, timeline, Today, Month, Year, Chart, Settings | Playwright flows pass online and offline |
| M7 Patterns and safety | Client-side pattern job, distress flow, export, delete-all | Statistical tests pass, privacy test shows no journal text in network traffic |
| M8 Polish | PDF natal report, opt-in notifications, optional polish proxy, beta build | Beta checklist complete |

### 12.14 Extra tests

- Contract tests: client fixtures generated from the schemas, and the server validated against the same schemas.
- Offline tests: Playwright with the network blocked, covering Now, quick log, timeline and Chart.
- Cache tests: stale marking on version change, stale-while-revalidate behavior, backfill of snapshots after reconnect.
- Privacy tests: assert no request body appears in server logs or storage, and that no journal text appears in any outgoing request.
- Load test: /v1/bundle at the expected request rate, checking latency and CPU per request.

### 12.15 Starter prompts

S1: Define packages/api-contract with zod schemas for every endpoint in section 12.4, including the envelope and error codes. Generate TypeScript types, a fixture for each response, and contract tests. Do not implement endpoints yet.

S2: Create apps/server with Fastify. Implement /health and /v1/content/manifest, request validation from api-contract, ETag handling, rate limiting by install token, and a logger that records route, status and latency only. Add a test that proves request bodies are never logged.

S3: Implement the sync layer in packages/app-core/sync against the mocked contract. It must write only through repositories, follow the cache policy in 12.8, queue snapshot back-fills while offline, and retry with backoff. UI code must have no network imports.
