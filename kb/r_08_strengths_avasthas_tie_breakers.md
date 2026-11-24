---
route_id: "R-08"
module_name: "Planetary Strengths (Shadbala), 4 Avastha Systems & Co-Lord/Rasi Tie-Breakers"
dependencies: ["R-01", "R-02", "R-04", "R-07"]
primary_source: "vedic_astro_textbook.pdf (PVR Ch. 15, p. 199–218; Tables 35–37)"
secondary_source: "Elements of Vedic Astrology (Charak Ch. XII–XIII)"
conflict_policy: "Use each strength metric strictly for its designated purpose; use PVR 15.5.1 & 15.5.2 tie-breakers for all Arudhas and Rasi Dasas"
---

# Planetary Strengths, 4 Avastha Systems & Co-Lord/Rasi Tie-Breakers

## 1. Core Concepts & Definitions

Never use different strength systems interchangeably (PVR Ch. 15.2):
* **Shadbala:** Measures **group leadership**—when multiple planets form a Yoga or influence a house, the one with highest Shadbala delivers the result on behalf of the group.
* **Ashtakavarga Bala:** Measures **environmental harmony**—how well a planet's energy aligns with the other 7 reference points in a specific Varga.
* **Avasthas (States):** Measures **age, alertness, mood, and current activity**—modulates output quality/quantity.
* **Vimsopaka Bala:** Measures **well-rounded life-wide weight** across multiple Vargas (`R-04`).
* **Simple Strengths (Tie-Breakers):** Lightweight deterministic rules used strictly to select **Stronger Co-Lord** (`Sc`: Mars vs. Ketu; `Aq`: Saturn vs. Rahu) and **Stronger Rasi** (for Graha Arudhas & Rasi Dasa initiation).

---

## 2. Deterministic Rules & Formulas

### 2.1 Four Avastha Systems (PVR Ch. 15.4)

#### A. Age / Baladi Avasthas (Table 35)
| Odd Rasi Degree | Even Rasi Degree | Avastha | Meaning | Result Output |
| :---: | :---: | :--- | :--- | :--- |
| $0^\circ$–$6^\circ$ | $24^\circ$–$30^\circ$ | **Saisava (Bala)** | Child | Quarter ($1/4$) |
| $6^\circ$–$12^\circ$ | $18^\circ$–$24^\circ$ | **Kumaara** | Adolescent | Half ($1/2$) |
| $12^\circ$–$18^\circ$ | $12^\circ$–$18^\circ$ | **Yuva** | Youth | Full ($1$) |
| $18^\circ$–$24^\circ$ | $6^\circ$–$12^\circ$ | **Vriddha** | Old | Very little |
| $24^\circ$–$30^\circ$ | $0^\circ$–$6^\circ$ | **Mrita** | Dead | Negligible / None |

#### B. Alertness / Jagradadi Avasthas
* **Jaagrita (Awake — Full results):** In exaltation or own Rasi.
* **Swapna (Dreaming — Medium results):** In friend's or neutral's Rasi.
* **Sushupta (Asleep — Negligible results):** In debilitation or enemy's Rasi.

#### C. Mood / Deeptadi (9) & Lajjitadi (6) Avasthas
* *Deeptadi (9):* `Deepta` (exalted), `Swastha` (own Rasi), `Mudita` (Adhimitra), `Saanta` (Mitra), `Deena` (Sama), `Duhkhita` (Satru/Adhisatru), `Vikala` (joined by malefics), `Khala` (in malefic's Rasi), `Kopita` (combust / closely joined by Sun).
* *Lajjitadi (6):* `Lajjita` (in 5th joined by Sun/Mars/Sat/Rahu/Ketu $\rightarrow$ child losses), `Garvita` (exalted/MT), `Kshudhita` (enemy sign, conjoined/aspected by enemies, or with Saturn), `Trishita` (watery sign aspected by enemies without benefic aspect), `Mudita` (friend's sign + aspect/conjunction of friends + Jupiter), `Kshobhita` (with Sun + aspected by malefics/enemies $\rightarrow$ spoils house, e.g., 7th = spouse loss).

#### D. Activity / 12 Sayanaadi Avasthas + Cheshta Strength (PVR 15.4.4)
1. Let $C \in \{1..27\}$ = planet's Nakshatra index; $P \in \{1..9\}$ = planet index (`Sun=1..Ketu=9`); $A \in \{1..9\}$ = planet's Navamsa part index within its Rasi ($\lfloor (\lambda \bmod 30^\circ) / 3^\circ 20' \rfloor + 1$); $M \in \{1..27\}$ = natal Moon's Nakshatra index; $G$ = running Ghati at birth ($\lfloor \text{minutes\_since\_sunrise} / 24 \rfloor + 1$); $L \in \{1..12\}$ = natal Lagna Rasi index.
2. Compute Avastha index $I \in \{1..12\}$:
   $$I = ((C \times P \times A) + M + G + L) \bmod 12 \quad (\text{if } 0 \rightarrow 12)$$
3. **Activity Strength (Cheshta):**
   * Look up $N_{\text{sound}} \in \{1..5\}$ for the first syllable of the native's given name (Table 37).
   * Compute $r_1 = (I^2 + N_{\text{sound}}) \bmod 12$.
   * Add planetary Kshepaka constant $K_P$: `Sun=5, Moon=2, Mars=2, Merc=3, Jup=5, Ven=3, Sat=3, Rahu=4, Ketu=4`.
   * Compute $S = (r_1 + K_P) \bmod 3$:
     * $S = 1$ $\rightarrow$ **Drishti** (medium results).
     * $S = 2$ $\rightarrow$ **Cheshta** (full/intense results).
     * $S = 0$ $\rightarrow$ **Vicheshta** (minimal results).

### 2.2 Shadbala & Bhava Bala Summary Formulas (Charak Ch. XIII)
Units: $60\text{ Shashtyamshas} = 1\text{ Rupa}$. Total Shadbala = sum of 6 components:
1. **Sthana Bala:** `Uchcha` ($\frac{\text{arc\_from\_debil}}{180^\circ} \times 60$) + `Saptavargaja` (MT `45` in D1 only; Own `30`, Adhimitra `22.5`, Mitra `15`, Sama `7.5`, Satru `3.75`, Adhisatru `1.875` across D1, D2, D3, D7, D9, D12, D30) + `Oja-Yugma` (Rasi & D9: `15` each for Moon/Ven in even, others in odd) + `Kendradi` (Kendra `60`, Panaphara `30`, Apoklima `15`) + `Drekkana` (`15`: Sun/Mar/Jup in 1st, Merc/Sat in 2nd, Moon/Ven in 3rd).
2. **Dig Bala:** `60` at peak cusp, `0` at opposite cusp ($180^\circ$ away), linear ($1\text{ Shashtyamsha}/3^\circ$): `Merc/Jup` = 1st, `Moon/Ven` = 4th, `Sat` = 7th, `Sun/Mar` = 10th.
3. **Kaala Bala:** `Nata-Unnata` (Day: Sun/Jup/Ven `60` at noon; Night: Moon/Mar/Sat `60` at midnight; Merc always `60`) + `Paksha` (Benefics `60` at Full Moon, Malefics `60` at New Moon; **Moon's Paksha Bala is doubled**) + `Tri-Bhaga` (`60` to Day 1/3 Merc, 2/3 Sun, 3/3 Sat; Night 1/3 Moon, 2/3 Ven, 3/3 Mars; Jup always `60`) + `Abda` (`15`) + `Maasa` (`30`) + `Vaara` (`45`) + `Hora` (`60`) + `Ayana` (Declination; **Sun's Ayana Bala is doubled**) + `Yuddha` (Planetary war within $1^\circ$ for Mars–Saturn; lower-longitude planet wins and takes difference).
4. **Cheshta Bala:** Motion speed (`Vakra=60, Sheeghra=45, Anuvakra/Madhya/Ati-sheeghra=30, Vikala/Manda=15, Mandatara=7.5`; Sun uses Ayana, Moon uses Paksha).
5. **Naisargika Bala (Fixed):** `Sun=60, Moon=51.43, Ven=42.86, Jup=34.29, Merc=25.71, Mars=17.14, Sat=8.57`.
6. **Drig Bala:** `(Net Benefic - Malefic aspect virupas) / 4`.
* **Bhava Bala:** `Bhavadhipati Bala` (House lord's Shadbala) + `Bhava Dig Bala` + `Bhava Drig Bala`.

### 2.3 Stronger Co-Lord Tie-Breaker (PVR 15.5.1 — Stop at First Winner)
Used to pick primary lord of `Sc` (`Mars` vs. `Ketu`) or `Aq` (`Saturn` vs. `Rahu`):
0. **Basic Rule:** If *one* co-lord occupies the sign itself and the other does not, pick the **other** planet (the one *outside* the sign).
1. **Conjunction Count:** Planet conjoined with **more planets** wins.
2. **Benefic/Dispositor Influence (Rasi Aspect or Conjunction):** Count how many of `{Jupiter, Mercury, own Dispositor}` conjoin or cast **Rasi Drishti** on the planet. Higher count wins.
3. **Exaltation:** Exalted planet wins.
4. **Rasi Modality Natural Strength:** `Dual > Fixed > Movable`.
5. **Final Tie-Breaker:**
   * *(a) For Rasi Dasas:* Planet yielding the **longer Dasa duration** wins.
   * *(b) For Arudha Padas:* Planet with **higher degree advancement** in its Rasi wins (`Rahu/Ketu` measured as $30^\circ - \text{deg}$).

### 2.4 Stronger Rasi Tie-Breaker (PVR 15.5.2 — Stop at First Winner)
Used for Graha Arudhas (2 own signs) and Rasi Dasa initiation (e.g., `1st` vs. `7th`):
1. **Planet Count:** Rasi containing **more planets** wins.
2. **Influence Count (Occupation or Rasi Drishti):** Count how many of `{Jupiter, Mercury, Rasi's own Lord}` occupy or cast **Rasi Drishti** on the Rasi (for `Sc`/`Aq`, either co-lord's aspect counts). Higher count wins.
3. **Exaltation:** Rasi containing an **exalted planet** wins.
4. **Lord Oddity Flip:** Rasi whose lord sits in a sign of **opposite parity** (odd sign with lord in even, or even sign with lord in odd) wins. *(Always breaks ties for Graha Arudhas since a planet's 2 signs have opposite parity.)*
5. **Natural Strength:** `Dual > Fixed > Movable`.
6. **Lord Advancement:** Rasi whose lord has **higher degree advancement** in its Rasi wins (`Rahu/Ketu` from $30^\circ$; for `Sc`/`Aq` use stronger co-lord).
* *Context Override Warning (PVR p. 217):* In **Ayur Dasas**, luminaries' (Sun/Moon) and malefics'/marakas' aspects take precedence over `{Jup, Merc, Lord}`.

---

## 3. Lookup Tables (Structured)

### Table 36: The 12 Sayanaadi Avasthas & Special House Overrides
| # | Avastha | Meaning | Key Special House Rules (PVR p. 213) |
| :---: | :--- | :--- | :--- |
| 1 | Sayana | Lying down / resting | Benefic in Sayana helps house; Malefic in 5th auspicious; Malefic in 8th = royal wrath/death; Malefic in 10th = miseries |
| 2 | Upavesana | Sitting down | — |
| 3 | Netrapaani | Eyes & hands | — |
| 4 | Prakaasana | Shining | Benefic or Own/Exalt planet in `1, 5, 7, 10` (esp. Moon in `10th`) = **Raja Yoga** |
| 5 | Gamana | Going / moving | — |
| 6 | Aagamana | Returning | — |
| 7 | Sabhaa | At an assembly | Generally royal/scholarly honors for Sun, Moon, Mars, Merc, Jup, Ven, Sat, Rahu |
| 8 | Aagama | Acquiring | — |
| 9 | Bhojana | Eating | Malefic in Bhojana **destroys** the house it occupies (esp. `10th`) |
| 10 | Nrityalipsaa | Urge to dance | Benefic or Own/Exalt planet in `1, 5, 7, 10` = **Raja Yoga** |
| 11 | Kautuka | Eager / delighted | Benefic or Own/Exalt planet in `1, 5, 7, 10` (esp. Moon in `10th`) = **Raja Yoga** |
| 12 | Nidraa | Sleeping | Malefic alone in `7th` auspicious; Malefic in `5th` auspicious; Malefic in `8th` = royal wrath/death |

### Table 37: Name Initial Sound Numbers (For Cheshta)
| Number | First Syllable Sounds (Roman Transliteration) |
| :---: | :--- |
| **1** | `a, ka, chh, d (alveolar), dh (dental), bh, v` |
| **2** | `i, kh, j, dh (alveolar), n (dental), m, s/sh (palatal)` |
| **3** | `u, g, jh, t, p, y, sh (alveolar)` |
| **4** | `e, gh, t (alveolar), th (dental), ph, r, s (dental)` |
| **5** | `o, ch, th (alveolar), d (dental), b, l, h` |

*(Full 9-planet × 12-avastha interpretive text matrix resides in `vedic_astro_textbook.pdf`, p. 205–211 for direct RAG chunking.)*

---

## 4. Entity Relationships (Graph Edges)

* `(PlanetGroup) --[DELIVERED_BY]--> (HighestShadbalaPlanet)`
* `(DualLordSign {Sc|Aq}) --[RESOLVED_BY_15.5.1]--> (PrimaryCoLord)`
* `(RasiPair) --[RESOLVED_BY_15.5.2]--> (StrongerRasi)`
* `(Planet) --[HAS_SAYANAADI_AVASTHA {1..12}, CHESHTA {Drishti|Cheshta|Vicheshta}]--> (ActivityOutput)`

---

## 5. Interpretive Guidelines & Modifiers

* **Do Not Over-Weight Avasthas Alone:** Avasthas only describe the planet's *state*; houses influenced across Divisional Charts remain primary. Never make literal predictions from Baladi or Sayanaadi lookup tables in isolation.

---

## 6. Verification Test Cases (From Source PDF)

1. **Sayanaadi Avasthas (PVR Ex. 49, p. 211–212):**
   * Birth `Apr 4, 1970, 5:50 PM IST`, Sunrise `6:00 AM` ($G=30$), `M=25` (P.Bhadra), `L=6` (Vi), Name starts with `V` ($N_{\text{sound}}=1$).
   * *Mercury (`3 Ar 08`, $C=1, P=4, A=1$):* Sum $= 65 \rightarrow 65 \bmod 12 = 5$ (**Gamana**); $(25+1)\bmod 12 = 2$; $(2+3)\bmod 3 = 2$ (**Cheshta** — full).
   * *Jupiter (`9 Li 46`, $C=15, P=5, A=3$):* Sum $= 286 \rightarrow 10$ (**Nrityalipsaa**); $(100+1)\bmod 12 = 5$; $(5+5)\bmod 3 = 1$ (**Drishti** — medium).
   * *Venus (`7 Ar 55`, $C=1, P=6, A=3$):* Sum $= 79 \rightarrow 7$ (**Sabhaa**); $(49+1)\bmod 12 = 2$; $(2+3)\bmod 3 = 2$ (**Cheshta** — full).
2. **Co-Lord & Rasi Tie-Breakers — Chart 12 Madonna D-10 (PVR Ex. 25–26, p. 217–218):**
   * *Co-lords:* `Aq` $\rightarrow$ **Saturn** (wins at Step 4: Dual `Pi` > Movable `Li`); `Sc` $\rightarrow$ **Ketu** (Basic Rule 0: Mars is in `Sc`, so Ketu acts as lord).
   * *Stronger Rasi Pairs:* `(Ar, Li) -> Ar` (Step 2), `(Ta, Sc) -> Sc` (Step 1), `(Ge, Sg) -> Sg` (Step 1), `(Cn, Cp) -> Cp` (Step 1), `(Le, Aq) -> Aq` (Step 2: co-lord Rahu aspects Aq), `(Vi, Pi) -> Pi` (Step 1).