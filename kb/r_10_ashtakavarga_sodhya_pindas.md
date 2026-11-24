---
route_id: "R-10"
module_name: "Ashtakavarga (PAV, BAV, SAV), Divisional AV & Sodhya Pindas"
dependencies: ["R-01", "R-04"]
primary_source: "vedic_astro_textbook.pdf (PVR Ch. 12, p. 157–177; Tables 19–29; Charts 11–12)"
secondary_source: "Elements of Vedic Astrology (Charak Ch. XXX; Tables XXX-1, XXX-2)"
conflict_policy: "Parashara's checksum-verified binary tables (PVR Tables 19–26); internal representation benefic_point = 1 (PVR 'Rekha', Charak 'Bindu') vs 0 (malefic); Whole-Sign Rasi positions only"
---

# Ashtakavarga (PAV, BAV, SAV), Divisional AV & Sodhya Pindas

## 1. Core Concepts & Definitions

* **Ashtakavarga (`AV` — "Group of 8"):** Evaluates the beneficence of each of the 7 planets (plus Lagna) in every sign with respect to **8 natal reference points**: `Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Lagna`. (Rahu & Ketu excluded.)
* **Three Tables:**
  * **PAV (Prastaara Ashtakavarga):** Full `8 × 12` binary spreadsheet showing *exactly which* references contribute `1` (benefic) in each sign. Required for **Kakshya** transit analysis (`R-14`).
  * **BAV (Bhinna Ashtakavarga):** Column sums of PAV ($0$–$8$ per sign) for a single planet.
  * **SAV (Samudaaya / Sarva Ashtakavarga):** Sum of the 7 planetary BAVs (Sun–Saturn; **total always = `337`** across 12 signs; Lagna's BAV is NOT added into SAV).
* **Divisional Ashtakavarga (PVR Ch. 12.5):** Compute BAV, PAV, and SAV identically inside **any Divisional Chart** (e.g., `D10` SAV for career, `D24` SAV for education, `D9` SAV for marriage).
* **Sodhita Ashtakavarga (`SoAV`) & Sodhya Pinda:** Reduced BAV after **Trikona** and **Ekaadhipatya** reductions, weighted by Rasi and Graha multipliers to produce each planet's **Sodhya Pinda** for transit timing (`R-14`).

---

## 2. Deterministic Rules & Formulas

### 2.1 PAV, BAV & SAV Construction
For target planet $P \in \{\text{Sun..Sat, Lagna}\}$ and each reference $R_j \in \{\text{Sun..Sat, Lagna}\}$ located in sign $S(R_j)$:
1. For every house offset $h \in \{1..12\}$ where Table `19–26` has `1` in column $R_j$:
   * Target sign $T = ((S(R_j) + h - 2) \bmod 12) + 1$.
   * Set $\text{PAV}[P][R_j][T] = 1$ (else $0$).
2. $\text{BAV}[P][T] = \sum_{j=1}^{8} \text{PAV}[P][R_j][T] \in \{0..8\}$.
3. $\text{SAV}[T] = \sum_{P \in \{\text{Sun..Sat}\}} \text{BAV}[P][T]$ (sum over all 12 signs $= 337$).

### 2.2 Trikona Sodhana (Trinal Reduction — Step 1 of SoAV)
Process the 4 trinal sign-triplets independently: `{Ar, Le, Sg}`, `{Ta, Vi, Cp}`, `{Ge, Li, Aq}`, `{Cn, Sc, Pi}`. Let their BAV values be $(a, b, c)$:
1. If $\min(a, b, c) == 0$: **no change**.
2. Else (including when $a == b == c$): subtract $m = \min(a, b, c)$ from all three $\rightarrow (a-m, b-m, c-m)$.

### 2.3 Ekaadhipatya Sodhana (Co-Owned Reduction — Step 2 of SoAV)
Process the 5 dual-lord sign pairs independently: `{Ar, Sc}`, `{Ta, Li}`, `{Ge, Vi}`, `{Sg, Pi}`, `{Cp, Aq}`. (`Cn` and `Le` are untouched.) Let their post-Trikona values be $(x, y)$:
1. If $x == 0$ **OR** $y == 0$: **no change**.
2. If **both** signs are occupied by at least one planet (Sun–Saturn; Rahu/Ketu ignored or check PVR note): **no change**.
3. If **one** sign is occupied (`occ`) and the **other** is empty (`emp`):
   * If `emp < occ`: set `emp = 0`.
   * If `emp >= occ`: set `emp = occ`.
4. If **both** signs are empty:
   * If $x == y$: set **both to `0`**.
   * If $x \ne y$: replace the **higher** value with the **lower** value ($\min(x, y)$).

### 2.4 Sodhya Pinda Calculation
Given `SoAV[1..12]` for planet $P$:
1. **Rasi Pinda:** $\sum_{s=1}^{12} \text{SoAV}[s] \times \text{RasiMult}[s]$ (Table 28).
2. **Graha Pinda:** $\sum_{g \in \{\text{Sun..Sat}\}} \text{SoAV}[\text{sign}(g)] \times \text{GrahaMult}[g]$ (Table 29).
3. **Sodhya Pinda:** $\text{Rasi Pinda} + \text{Graha Pinda}$.

### 2.5 Parashara vs. Varahamihira Controversies (PVR 12.8)
The 3 exact cells where Varahamihira differs from Parashara (PVR uses **Parashara**):
1. Moon BAV: `9th` from Moon = `1`, `9th` from Mars = `0` (Varahamihira swaps them).
2. Moon BAV: `2nd` from Jupiter = `1`, `12th` from Jupiter = `0` (Varahamihira swaps them).
3. Venus BAV: `4th` from Mars = `1`, `5th` from Mars = `0` (Varahamihira swaps them).

---

## 3. Lookup Tables (Structured)

### Tables 19–26: Parashara Benefic Houses (`1` = Benefic Point)
*(Listed as exact 1-based house offsets from each of the 8 references for compact, error-free programmatic ingestion; totals verified to 337.)*

| Target BAV (Total) | From Sun | From Moon | From Mars | From Mercury | From Jupiter | From Venus | From Saturn | From Lagna |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Sun (48)** | `1,2,4,7,8,9,10,11` | `3,6,10,11` | `1,2,4,7,8,9,10,11` | `3,5,6,9,10,11,12` | `5,6,9,11` | `6,7,12` | `1,2,4,7,8,9,10,11` | `3,4,6,10,11,12` |
| **Moon (49)** | `3,6,7,8,10,11` | `1,3,6,7,9,10,11` | `2,3,5,6,10,11` | `1,3,4,5,7,8,10,11` | `1,2,4,7,8,10,11` | `3,4,5,7,9,10,11` | `3,5,6,11` | `3,6,10,11` |
| **Mars (39)** | `3,5,6,10,11` | `3,6,11` | `1,2,4,7,8,10,11` | `3,5,6,11` | `6,10,11,12` | `6,8,11,12` | `1,4,7,8,9,10,11` | `1,3,6,10,11` |
| **Mercury (54)** | `5,6,9,11,12` | `2,4,6,8,10,11` | `1,2,4,7,8,9,10,11` | `1,3,5,6,9,10,11,12` | `6,8,11,12` | `1,2,3,4,5,8,9,11` | `1,2,4,7,8,9,10,11` | `1,2,4,6,8,10,11` |
| **Jupiter (56)** | `1,2,3,4,7,8,9,10,11` | `2,5,7,9,11` | `1,2,4,7,8,10,11` | `1,2,4,5,6,9,10,11` | `1,2,3,4,7,8,10,11` | `2,5,6,9,10,11` | `3,5,6,12` | `1,2,4,5,6,7,9,10,11` |
| **Venus (52)** | `8,11,12` | `1,2,3,4,5,8,9,11,12` | `3,4,6,9,11,12` | `3,5,6,9,11` | `5,8,9,10,11` | `1,2,3,4,5,8,9,10,11` | `3,4,5,8,9,10,11` | `1,2,3,4,5,8,9,11` |
| **Saturn (39)** | `1,2,4,7,8,10,11` | `3,6,11` | `3,5,6,10,11,12` | `6,8,9,10,11,12` | `5,6,11,12` | `6,11,12` | `3,5,6,11` | `1,3,4,6,10,11` |
| **Lagna (49)** | `3,4,6,10,11,12` | `3,6,10,11,12` | `1,3,6,10,11` | `1,2,4,6,8,10,11` | `1,2,4,5,6,7,9,10,11` | `1,2,3,4,5,8,9` | `1,3,4,6,10,11` | `3,6,10,11` |

### Tables 28–29: Sodhya Pinda Multipliers (Rasimana & Grahamana)
* **Rasi Multipliers (Table 28):** `Ar: 7, Ta: 10, Ge: 8, Cn: 4, Le: 10, Vi: 6, Li: 7, Sc: 8, Sg: 9, Cp: 5, Aq: 11, Pi: 12`.
* **Graha Multipliers (Table 29):** `Sun: 5, Moon: 5, Mars: 8, Mercury: 5, Jupiter: 10, Venus: 7, Saturn: 5`.

### Table 10A: Strength Thresholds
| Metric | Weak / Unfavorable | Average / Neutral | Strong / Favorable |
| :--- | :---: | :---: | :---: |
| **BAV (0–8)** | `0–3` (`0–1` very poor) | `4` | `5–8` (`6–8` excellent) |
| **SAV (Sign)** | `< 25` | `25–29` | `>= 30` (very strong) |

---

## 4. Entity Relationships (Graph Edges)

* `(Planet, Sign, Varga) --[HAS_BAV_SCORE]--> (Int 0..8)`
* `(Sign, Varga) --[HAS_SAV_SCORE]--> (Int)`
* `(BAV) --[TRIKONA_AND_EKAADHIPATYA_SODHANA]--> (SoAV) --[WEIGHTED_SUM]--> (SodhyaPinda)`

---

## 5. Interpretive Guidelines & Modifiers

* **Dignity Override (Charak Ch. XXX):** An exalted/own-sign planet with very few BAV points loses much of its delivery; a debilitated/combust planet with high BAV points ($\ge 5$) retains substantial efficacy.
* **Muhurta SAV Check:** For auspicious elections, prefer Muhurta Lagna, Moon, and Sun in signs holding $\ge 30$ points in the native's natal SAV.

---

## 6. Verification Test Cases (From Source PDF)

1. **P.V. Narasimha Rao — Mercury BAV, SoAV & Sodhya Pinda (PVR Ex. 38, 40, 41, 43; Chart 6 & 11, p. 163–172):**
   * *Mercury BAV (`Ar..Pi`):* `[7, 4, 7, 4, 4, 3, 4, 4, 4, 3, 6, 4]` (Total `54`).
   * *SAV (`Ar..Pi`):* `[34, 25, 34, 25, 26, 25, 22, 29, 28, 30, 29, 30]` (Total `337`).
   * *Mercury SoAV:* `[3, 1, 3, 0, 0, 0, 0, 0, 0, 0, 2, 0]`.
   * *Sodhya Pinda:* Rasi Pinda = `77`, Graha Pinda = `75` $\rightarrow$ **Sodhya Pinda = `152`**.
2. **Ronald Reagan — Full 7-Planet Sodhya Pindas (PVR Ex. 22, Chart 7, p. 176–177):**
   * *SAV (`Ar..Pi`):* `[27, 24, 25, 26, 34, 35, 31, 28, 26, 26, 34, 21]` (Total `337`).
   * *Sodhya Pindas:* `Sun=233 (152+81), Moon=140 (85+55), Mars=95 (52+43), Merc=128 (95+33), Jup=124 (68+56), Ven=208 (154+54), Sat=225 (162+63)`.
3. **Madonna D-10 SAV (PVR Ex. 21, Chart 12, p. 175):**
   * *D-10 SAV (`Ar..Pi`):* `[24, 25, 31, 28, 27, 39, 33, 29, 26, 22, 28, 25]` (`Vi` Lagna = `39`, `Ge` 10th = `31`, `Li` 2nd = `33`).