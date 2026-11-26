---
route_id: "R-14"
module_name: "Transits (Gochara), Divisional Transits, Double Transit, Kakshya, Sodhya Pinda & Nakshatra Techniques"
dependencies: ["R-01", "R-04", "R-05", "R-10"]
primary_source: "vedic_astro_textbook.pdf (PVR Ch. 25–26, p. 326–376; Tables 53–70; Fig. 3; Charts 52–65)"
secondary_source: "Elements of Vedic Astrology (Charak Ch. XXIX–XXX) & K.N. Rao (Double Transit + Retrograde Previous-Sign Rule, R-19)"
conflict_policy: "Transits are strictly subservient to Natal Promise and active Dasas; combine Double Transit (Saturn & Jupiter) + Gochara + Vedha + Murthi + Ashtakavarga/Kakshya + Divisional Transits for high precision"
---

# Transits (Gochara), Divisional Transits, Kakshya, Sodhya Pinda & Nakshatra Techniques

## 1. Core Concepts & Definitions

* **Gochara (Transit):** Real-time planetary positions correlated against natal reference points (**Natal Moon / Janma Rasi** = mental state; **Lagna** = vitality/efforts; **Paaka Lagna** = physical body; **Arudhas** = material status; **Sahams** = specific events).
* **Double Transit of Saturn & Jupiter (K.N. Rao — Cross-Ref `R-19` Sec. 2.1):** For major life events (career rise, marriage `1/7`, childbirth `5th/9th`, sibling birth `3rd`) to fructify, **both transiting Saturn AND transiting Jupiter** must simultaneously influence (occupy or aspect) the relevant house and/or its lord, gated by Ashtakavarga (`SAV >= 25–30`). **Critical Rule:** When Saturn or Jupiter is **retrograde**, treat it as also acting and aspecting from the **previous sign**.
* **Divisional Transits (PVR Ch. 25.4):** All Vargas share the same 12-sign zodiac:
  1. **`Natal Varga × Transit D1` (Coarse Timing):** Shows when physical-plane transits trigger innate potential in a specific life domain (e.g., Transit D1 Jupiter over Natal D9 7th house $\rightarrow$ marriage).
  2. **`Natal D1 × Transit Varga` (Fine Timing):** Shows momentary transformation of physical potential into a domain event (e.g., Transit D11 Saturn over Natal D1 Sun).
* **Modulators:** Raw Gochara is modified by **Murthis** (ingress quality), **Rasi Vedha** (obstruction), **Ashtakavarga/Kakshya** (8-reference harmony), **Sodhya Pinda** (exact Nakshatra trigger), **Taras & 11 Special Nakshatras**, **Latta** (kick), and **Sarvatobhadra Chakra (`SBC`)**.

---

## 2. Deterministic Rules & Formulas

### 2.1 Kakshya & PAV Daily Transit Scoring (PVR 25.5.2 & Charak Ch. XXX)
Divide each $30^\circ$ Rasi into **8 equal Kakshyas of $3^\circ 45'$ each** (Table `60`).
* For each transiting planet $P \in \{\text{Sun..Sat}\}$ at sign $S$ and degree $d \in [0^\circ, 30^\circ)$:
  1. Find Kakshya index $k = \lfloor d / 3.75^\circ \rfloor + 1 \in \{1..8\}$ and its ruler $R_k$ (Table `60`).
  2. Look up $\text{PAV}[P][R_k][S] \in \{0, 1\}$ (`R-10`).
  3. If `1`, planet $P$ has a **benefic point** in its current Kakshya; count how many of the 7 planets score `1` on a given day (especially checking the active Vimsottari Dasa lord).

### 2.2 Sodhya Pinda Transit Timing (PVR 25.6)
1. Pick domain planet $P$ and house $H$ from $P$ (Table `61`).
2. Find $b = \text{BAV}[P][\text{sign\_of\_H\_from\_P}]$.
3. Compute product $X = b \times \text{Sodhya\_Pinda}[P]$ (`R-10`).
4. **Trigger Nakshatra:** $N = X \bmod 27$ (if $0 \rightarrow 27$, Revati) — plus its trinal stars (`10th` and `19th` from $N$).
5. **Trigger Rasi:** $R = X \bmod 12$ (if $0 \rightarrow 12$, Pisces).
* **Effect:** Transit **Saturn** in $N$ (or $R$) brings setbacks/suffering to the house's domain; transit **Jupiter** brings blessings.

### 2.3 Murthis (Sign-Ingress Forms — PVR 26.2)
At the exact moment a planet enters a new Rasi, find the house $H_{\text{Moon}}$ of **transit Moon from natal Moon**:
* `1, 6, 11` $\rightarrow$ **Swarna (Gold)** — highly favorable.
* `2, 5, 9` $\rightarrow$ **Rajata (Silver)** — favorable.
* `3, 7, 10` $\rightarrow$ **Taamra (Copper)** — unfavorable.
* `4, 8, 12` $\rightarrow$ **Loha (Iron)** — highly unfavorable.

### 2.4 Rasi Gochara Vedha (Obstruction — PVR 26.3)
If a planet is in an auspicious house from natal Moon, any *other* transiting planet in its paired **Vedha Sthaana** (Table `63`) cancels the good result.
* **Father–Son Exceptions (CRITICAL):** `Sun` & `Saturn` do NOT cause Vedha on each other; `Moon` & `Mercury` do NOT cause Vedha on each other.

### 2.5 Latta (Planetary Kick — PVR 26.7)
If a transiting planet casts **Latta** onto the natal **Janma Nakshatra** (Moon's star) or **Lagna Nakshatra**, expect setbacks/losses related to that planet's natal house ownerships:
* **Purolatta (Forward count from planet's transit star, inclusive):** `Sun: 12th`, `Mars: 3rd`, `Jupiter: 6th`, `Saturn: 8th`.
* **Prishtha Latta (Backward count from planet's transit star, inclusive):** `Moon: 22nd`, `Mercury: 7th`, `Venus: 5th`, `Rahu: 9th`.

### 2.6 Sarvatobhadra Chakra (`SBC` — 9×9 Grid, 28 Nakshatras incl. Abhijit — PVR 26.8)
* **Grid Composition (81 squares):** Outer border = `28` Nakshatras (7 per side) + 4 corner vowels; inner rings = `20` consonants, `12` Rasis, `16` diagonal vowels, and center `5` squares = Tithi groups (`Nanda: 1,6,11...`, `Bhadra: 2,7,12...`, `Jaya: 3,8,13...`, `Rikta: 4,9,14...`, `Poorna: 5,10,15...`) + Weekdays.
* **3-Line Vedha:** From a transiting planet's Nakshatra on the border, draw **1 straight** (vertical/horizontal) and **2 diagonal** lines across the 9×9 grid; all natal points (`Janma/Special Nakshatra`, `Lagna/House Rasi`, `Name Vowel/Consonant`, `Janma/Special Tithi`, `Janma Vaara`) on those lines receive Benefic (`Moon, Merc, Jup, Ven`) or Malefic (`Sun, Mars, Sat, Rahu, Ketu`) Vedha.
* **Special Tithis (e.g., Karma Tithi for career, Dhana Tithi for wealth):** Multiply $(\lambda_{\text{Moon}} - \lambda_{\text{Sun}})$ by house number $h$ (e.g., `10` for Karma, `2` for Dhana), take $\bmod 360^\circ$, divide by $12^\circ$, add `1` $\rightarrow$ Tithi `1..30` $\rightarrow$ map to Nanda/Bhadra/Jaya/Rikta/Poorna.

---

## 3. Lookup Tables (Structured)

### Tables 53–59 & 63: Auspicious Houses from Natal Moon & Vedha Sthaanas
*(Rahu behaves like Saturn; Ketu behaves like Mars. Full 12-house text in PVR p. 327–330.)*
| Transit Planet | Auspicious Houses from Natal Moon *(Vedha House in Parentheses)* | Sade-Sati / Special Notes |
| :--- | :--- | :--- |
| **Sun** | `3 (9), 6 (12), 10 (4), 11 (5)` | No Vedha with Saturn |
| **Moon** | `1 (5), 3 (9), 6 (12), 7 (2), 10 (4), 11 (8)` | No Vedha with Mercury |
| **Mars** | `3 (12), 6 (9), 11 (5)` | Wedding-day Mars aspects natal Venus (`R-19`) |
| **Mercury** | `2 (5), 4 (3), 6 (9), 8 (1), 10 (8), 11 (12)` | No Vedha with Moon |
| **Jupiter** | `2 (12), 5 (4), 7 (3), 9 (10), 11 (8)` | Retrograde acts from previous sign (`R-19`) |
| **Venus** | `1 (8), 2 (7), 3 (1), 4 (10), 5 (9), 8 (5), 9 (11), 11 (6), 12 (3)` | — |
| **Saturn** | `3 (12), 6 (9), 11 (5)` | `12th, 1st, 2nd` from Moon = **Sade-Sati** (7.5 yrs); No Vedha with Sun; Retrograde acts from previous sign (`R-19`) |

### Table 60: Kakshya Lords ($3^\circ 45'$ Each)
| Arc | $0^\circ$–$3^\circ 45'$ | $3^\circ 45'$–$7^\circ 30'$ | $7^\circ 30'$–$11^\circ 15'$ | $11^\circ 15'$–$15^\circ$ | $15^\circ$–$18^\circ 45'$ | $18^\circ 45'$–$22^\circ 30'$ | $22^\circ 30'$–$26^\circ 15'$ | $26^\circ 15'$–$30^\circ$ |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Lord** | Saturn | Jupiter | Mars | Sun | Venus | Mercury | Moon | Lagna |

### Table 61: Sodhya Pinda Primary Timing Domains
`Sun (9th): Father` | `Moon (4th): Mother` | `Mars (3rd): Siblings` | `Mercury (10th): Profession` | `Jupiter (5th): Children` | `Venus (7th): Marriage` | `Saturn (8th): Longevity` *(also 6th from Saturn = litigation)*.

### Table 64 & Section 26.4.2: 9 Taras & 11 Special Nakshatras (Counted from Natal Moon's Star)
* **9 Taras (`((offset - 1) mod 9) + 1`):** `1: Janma (mixed)`, `2: Sampat (good)`, `3: Vipat (bad)`, `4: Kshema (good)`, `5: Pratyak (bad)`, `6: Saadhana (good)`, `7: Naidhana/Vadha (bad)`, `8: Mitra (good)`, `9: Parama Mitra (good)`.
* **11 Special Nakshatras:** `1st: Janma` (general well-being), `4th: Jaati` (community/peers), `7th: Naidhana` (death/suffering), `10th: Karma` (profession/workplace), `12th: Desa` (country/relocation), `13th: Abhisheka/Raajya` (power/coronation), `16th: Sanghaatika` (social group), `18th: Saamudaayika` (crowd/groups), `19th: Aadhaana` (family well-being), `22nd: Vainaasika` (destruction), `25th: Maanasa` (mental state).
* **Nakshatra Aspects (`26.5`):** `Sun/Moon: 14, 15`; `Mars: 1, 3, 7, 8, 15`; `Merc/Ven: 1, 15`; `Jup: 10, 15, 19`; `Sat: 3, 5, 15, 19`.
* **Body Parts in Transit (Tables `65–69`, PVR p. 364–366):** Maps Nakshatra offsets `1..27` from Janma Nakshatra to anatomical sites (`Head, Face, Chest, Heart, Stomach, Hands, Legs, Feet, Eyes, Back, Private Parts`) for medical/injury pinpointing.

---

## 4. Entity Relationships (Graph Edges)

* `(TransitPlanet, TransitRasi) --[ACTIVATES]--> (NatalHouse_In_D1_Or_Varga)`
* `(TransitSaturn, TransitJupiter) --[DOUBLE_TRANSIT_ON]--> (TargetHouse | TargetLord) | CrossRef R-19`
* `(TransitPlanet) --[HAS_BAV_AND_KAKSHYA_SCORE]--> (DailyFavorability)`
* `(TransitPlanet) --[CASTS_LATTA_ON]--> (JanmaNakshatra | LagnaNakshatra) --> (SetbackInPlanetHouseDomain)`
* `(TransitPlanet) --[SBC_VEDHA_ON]--> (NatalTithi, Vaara, SpecialNakshatra, HouseRasi)`

---

## 5. Interpretive Guidelines & Modifiers

* **Sign-Third Timing (Charak Ch. XXIX):** Sun & Mars deliver transit results in the **1st third** ($0^\circ$–$10^\circ$) of a sign; Jupiter & Venus in the **middle third** ($10^\circ$–$20^\circ$); Moon & Saturn in the **last third** ($20^\circ$–$30^\circ$); Mercury throughout.
* **Anti-Overfitting Rule (PVR 26.9):** Never make standalone predictions from Nakshatra-only tools (Taras, Latta, SBC) since they bucket humanity into 27 groups; always use them strictly to fine-tune events already promised by **Dasas and Tajaka charts**.

---

## 6. Verification Test Cases (From Source PDF)

1. **Sodhya Pinda Timing — Princess Diana (PVR Ex. 111, Chart 62, p. 351–352):**
   * `8th` from Saturn = `Le` (`0` rekhas in Saturn BAV), Sodhya Pinda = `203` $\rightarrow 0 \times 203 = 0 \rightarrow$ `27th` star **Revati** / `12th` sign **Pisces** (passed away with Saturn in Revati/Pisces).
2. **Bill Gates — June 8, 2000 Antitrust Ruling (PVR Ex. 112, 26.3–26.4, Ex. 45, p. 352, 359–362, 376):**
   * Sodhya Pinda: Moon (`122 × 6 = 732 mod 27 = 3` = **Krittika**); Saturn 6th (`145 × 3 = 435 mod 27 = 3` = **Krittika**; Saturn transited Krittika).
   * Mercury in `4th` from Moon obstructed by Vedha in `3rd` (`Ta`) + **Loha Murthi**.
   * **Latta:** Rahu in Punarvasu kicked `9th` backward = `U.Bhadra` (Janma star); Mars in Mrigasira kicked `3rd` forward = `Punarvasu` (Lagna star) — both linked to `6th` house (litigation).
3. **Indira Gandhi — Kakshya Check (PVR Ex. 110, Chart 61, p. 347–349):**
   * At assassination, **5 of 7 planets** (including Vimsottari MD lord Saturn) were in Kakshyas with `0` benefic points; only Moon and Mercury had `1`.