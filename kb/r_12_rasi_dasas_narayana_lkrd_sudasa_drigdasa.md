---
route_id: "R-12"
module_name: "Rasi Dasas: Narayana Dasa (Rasi & Varga), LKRD, Sudasa & Drigdasa"
dependencies: ["R-02", "R-03", "R-04", "R-06", "R-07", "R-08"]
primary_source: "vedic_astro_textbook.pdf (PVR Ch. 18–21, p. 243–284; Table 40–41; Charts 24–38)"
secondary_source: "N/A (PVR Integrated Parashara-Jaimini Standard)"
conflict_policy: "All Rasi Dasas use Solar Years (360° Sun motion; 1 month = 30° Sun motion; 1 day = 1° Sun motion) for exact sub-period division; use R-08 tie-breakers for Stronger Co-Lord & Stronger Rasi"
---

# Rasi Dasas: Narayana Dasa (Rasi & Varga), LKRD, Sudasa & Drigdasa

## 1. Core Concepts & Definitions

* **Narayana Dasa (Most Versatile Phalita Rasi Dasa):** Represents the progression of Lagna (or 7th house) through life, showing **real external happenings**. Can be computed **independently for every Divisional Chart (`D-n`)** to time domain-specific events.
* **Lagna Kendradi Rasi Dasa (`LKRD`):** Follows the Lakshmi movement (`Kendras -> Panapharas -> Apoklimas`) from the stronger of Lagna/7th to time material success.
* **Sudasa (`Sree Lagna Kendradi Rasi Dasa`):** Superior Lakshmi Dasa seeded from **Sree Lagna (`SL`)**; primary Dasa for **money, wealth, power, and status**.
* **Drigdasa ("Vision Dasa"):** Aspect-based Rasi Dasa starting from `9th -> 10th -> 11th` houses; dedicated to **spiritual evolution, initiation, renunciation, and liberation**.

---

## 2. Deterministic Rules & Formulas

### 2.1 Shared Dasa Duration Formula (Used by Narayana, LKRD, Sudasa & Drigdasa)
For any Rasi $S \in \{1..12\}$ with primary lord $L$ *(use Stronger Co-Lord from `R-08` for `Sc`/`Aq`)* occupying sign $S_L$:
1. **Counting Direction:**
   * If $S$ is **Odd-footed** (`Ar, Ta, Ge, Li, Sc, Sg`): count **forward** (zodiacally) from $S$ to $S_L$.
   * If $S$ is **Even-footed** (`Cn, Le, Vi, Cp, Aq, Pi`): count **backward** (anti-zodiacally) from $S$ to $S_L$.
2. **Base Duration:** $\text{Years} = \text{count}(S \to S_L) - 1$.
3. **Exceptions & Modifiers (CRITICAL):**
   * **Own Sign:** If $S_L == S$ (count $= 1$), $\text{Years} = \mathbf{12}$ (NOT $0$).
   * **Exalted Lord:** If $L$ is exalted, **add `1` year** (max cap / note: if already 12? Standard PVR rule applies `+1` to non-own signs; own sign stays 12).
   * **Debilitated Lord:** If $L$ is debilitated, **subtract `1` year** (can yield **`0` years** in Cycle 1, e.g., Jupiter in `Cp` for `Sg` $\rightarrow 2 - 1 - 1 = 0$ yrs in Cycle 1 and `12` yrs in Cycle 2).
   * **Second Cycle:** After all 12 Rasis complete Cycle 1, Cycle 2 repeats the exact same order with duration $= 12 - \text{Cycle1\_Years}$ (total across 2 cycles $= 144$ yrs; truncate at 120 yrs).

### 2.2 Narayana Dasa (`D1` & All Vargas)
1. **Dasa Seed (`D1`):** Stronger of `Lagna (1st)` and `7th` house (using `R-08` Stronger Rasi).
2. **Varga Narayana Dasa Seed (`D-n`):**
   * Find seed house $H_{\text{seed}} = ((n - 1) \bmod 12) + 1$ (e.g., `D4 -> 4th`, `D7 -> 7th`, `D9 -> 9th`, `D10 -> 10th`, `D12 -> 12th`, `D16 -> 4th`, `D24 -> 12th`, `D27 -> 3rd`, `D30 -> 6th`).
   * Find the lord of $H_{\text{seed}}$ in the **`D1` (Rasi) chart**.
   * Locate the sign occupied by that planet in **`D-n`** and treat **that sign** as virtual Lagna; take the stronger of it and its `7th` as the Dasa Seed.
3. **Progression Pattern & Direction:**
   * *Base Step:* Movable Seed = **Brahma** (`+1`, regular); Fixed Seed = **Shiva** (`+6`, every 6th); Dual Seed = **Vishnu** (Trinal: `1, 5, 9; 10, 2, 6; 7, 11, 3; 4, 8, 12`).
   * *Base Direction:* Check the **`9th` house from Dasa Seed**. If **Odd-footed** $\rightarrow$ **Forward**; if **Even-footed** $\rightarrow$ **Backward**.
   * **Saturn Exception:** If **Saturn** occupies Dasa Seed $\rightarrow$ override to **Regular Zodiacal (`+1` Forward)** regardless of modality/9th house.
   * **Ketu Exception:** If **Ketu** occupies Dasa Seed $\rightarrow$ **reverse** the base direction (Forward $\leftrightarrow$ Backward), keeping the modality step.
4. **Antardasas (`AD`) & Sub-Divisions (`PD, SD, PAD, DAD`):**
   * Every `MD` of $n$ years divides into **12 equal `AD`s** of $n$ solar months ($30n^\circ$ of Sun's motion; divide in Sun-longitude space for `PD/SD/PAD/DAD`).
   * Find **Antardasa Seed** = stronger of `Dasa Rasi` and its `7th` house.
   * `AD`s start from the sign occupied by the **lord of the Antardasa Seed** and step `+1` (regular).
   * Direction: **Forward** if the starting sign is **Odd**; **Backward** if **Even** *(Odd/Even, NOT odd/even-footed!)*.
   * *AD Exceptions:* If **Saturn** occupies the Antardasa Seed $\rightarrow$ Forward; if **Ketu** occupies the Antardasa Seed $\rightarrow$ reverse direction.

### 2.3 Lagna Kendradi Rasi Dasa (`LKRD`)
1. **Seed:** Stronger of Lagna and `7th`.
2. **Direction:** **Forward** if Lagna is **Odd**; **Backward** if **Even** *(Saturn in seed $\rightarrow$ Forward; Ketu in seed $\rightarrow$ Reverse)*.
3. **Order:** First 4 = Kendras (`1, 4, 7, 10`), next 4 = Panapharas (`2, 5, 8, 11`), last 4 = Apoklimas (`3, 6, 9, 12`), counted in the chosen direction. Durations per Section `2.1`.

### 2.4 Sudasa (Sree Lagna Kendradi Rasi Dasa)
1. **Seed:** Sign containing **Sree Lagna (`SL`)**.
2. **Direction & Order:** Same Kendras $\rightarrow$ Panapharas $\rightarrow$ Apoklimas rule as `LKRD`, using `SL`'s **Odd/Even** parity *(Ketu in SL reverses direction, see Bill Gates Ex. 132)*.
3. **First Dasa Balance Exception:** Only the remaining fraction of `SL`'s sign is left at birth:
   $$\text{Balance}_{\text{first}} = \frac{30^\circ - (\lambda_{\text{SL}} \bmod 30^\circ)}{30^\circ} \times \text{Years}_{\text{first}}$$

### 2.5 Drigdasa (Spirituality)
1. **Order (3 Groups of 4):**
   * Group 1: `9th` house + the 3 signs casting **Rasi Drishti** on it (ordered Forward if `9th` is Odd-footed, Backward if Even-footed).
   * Group 2: `10th` house + the 3 signs casting Rasi Drishti on it (Forward/Backward by `10th` odd/even-footed).
   * Group 3: `11th` house + the 3 signs casting Rasi Drishti on it (Forward/Backward by `11th` odd/even-footed).
2. **Durations:** Per Section `2.1`.

---

## 3. Lookup Tables (Structured)

### Table 40: Narayana Dasa Progressions (Normal / Saturn / Ketu)
| Seed | Normal Progression | Saturn Exception | Ketu Exception |
| :---: | :--- | :--- | :--- |
| `Ar` | `Ar,Ta,Ge,Cn,Le,Vi,Li,Sc,Sg,Cp,Aq,Pi` | `Ar,Ta,Ge,Cn,Le,Vi,Li,Sc,Sg,Cp,Aq,Pi` | `Ar,Pi,Aq,Cp,Sg,Sc,Li,Vi,Le,Cn,Ge,Ta` |
| `Ta` | `Ta,Sg,Cn,Aq,Vi,Ar,Sc,Ge,Cp,Le,Pi,Li` | `Ta,Ge,Cn,Le,Vi,Li,Sc,Sg,Cp,Aq,Pi,Ar` | `Ta,Li,Pi,Le,Cp,Ge,Sc,Ar,Vi,Aq,Cn,Sg` |
| `Ge` | `Ge,Aq,Li,Vi,Ta,Cp,Sg,Le,Ar,Pi,Sc,Cn` | `Ge,Cn,Le,Vi,Li,Sc,Sg,Cp,Aq,Pi,Ar,Ta` | `Ge,Li,Aq,Pi,Cn,Sc,Sg,Ar,Le,Vi,Cp,Ta` |
| `Cn` | `Cn,Ge,Ta,Ar,Pi,Aq,Cp,Sg,Sc,Li,Vi,Le` | `Cn,Le,Vi,Li,Sc,Sg,Cp,Aq,Pi,Ar,Ta,Ge` | `Cn,Le,Vi,Li,Sc,Sg,Cp,Aq,Pi,Ar,Ta,Ge` |
| `Le` | `Le,Cp,Ge,Sc,Ar,Vi,Aq,Cn,Sg,Ta,Li,Pi` | `Le,Vi,Li,Sc,Sg,Cp,Aq,Pi,Ar,Ta,Ge,Cn` | `Le,Pi,Li,Ta,Sg,Cn,Aq,Vi,Ar,Sc,Ge,Cp` |
| `Vi` | `Vi,Cp,Ta,Ge,Li,Aq,Pi,Cn,Sc,Sg,Ar,Le` | `Vi,Li,Sc,Sg,Cp,Aq,Pi,Ar,Ta,Ge,Cn,Le` | `Vi,Ta,Cp,Sg,Le,Ar,Pi,Sc,Cn,Ge,Aq,Li` |
| `Li` | `Li,Sc,Sg,Cp,Aq,Pi,Ar,Ta,Ge,Cn,Le,Vi` | `Li,Sc,Sg,Cp,Aq,Pi,Ar,Ta,Ge,Cn,Le,Vi` | `Li,Vi,Le,Cn,Ge,Ta,Ar,Pi,Aq,Cp,Sg,Sc` |
| `Sc` | `Sc,Ge,Cp,Le,Pi,Li,Ta,Sg,Cn,Aq,Vi,Ar` | `Sc,Sg,Cp,Aq,Pi,Ar,Ta,Ge,Cn,Le,Vi,Li` | `Sc,Ar,Vi,Aq,Cn,Sg,Ta,Li,Pi,Le,Cp,Ge` |
| `Sg` | `Sg,Le,Ar,Pi,Sc,Cn,Ge,Aq,Li,Vi,Ta,Cp` | `Sg,Cp,Aq,Pi,Ar,Ta,Ge,Cn,Le,Vi,Li,Sc` | `Sg,Ar,Le,Vi,Cp,Ta,Ge,Li,Aq,Pi,Cn,Sc` |
| `Cp` | `Cp,Sg,Sc,Li,Vi,Le,Cn,Ge,Ta,Ar,Pi,Aq` | `Cp,Aq,Pi,Ar,Ta,Ge,Cn,Le,Vi,Li,Sc,Sg` | `Cp,Aq,Pi,Ar,Ta,Ge,Cn,Le,Vi,Li,Sc,Sg` |
| `Aq` | `Aq,Cn,Sg,Ta,Li,Pi,Le,Cp,Ge,Sc,Ar,Vi` | `Aq,Pi,Ar,Ta,Ge,Cn,Le,Vi,Li,Sc,Sg,Cp` | `Aq,Vi,Ar,Sc,Ge,Cp,Le,Pi,Li,Ta,Sg,Cn` |
| `Pi` | `Pi,Cn,Sc,Sg,Ar,Le,Vi,Cp,Ta,Ge,Li,Aq` | `Pi,Ar,Ta,Ge,Cn,Le,Vi,Li,Sc,Sg,Cp,Aq` | `Pi,Sc,Cn,Ge,Aq,Li,Vi,Ta,Cp,Sg,Le,Ar` |

---

## 4. Entity Relationships (Graph Edges)

* `(D1_Narayana_Rasi) --[ACTS_AS_PROGRESSED_LAGNA]--> (DasaLagna) | If started from 7th, DasaLagna = 7th from DasaRasi`
* `(DasaLagna_Lord) --[OCCUPIES]--> (PaakaRasi)`
* `(Sudasa_Rasi) --[ASPECTS_OR_OCCUPIES]--> (HL / GL / UpachayasFromAL) --> (Wealth / Power / StatusGain)`
* `(Drigdasa_Rasi) --[CONTAINS_OR_ASPECTS]--> (AL / Lagna / A5 / A8 / Ketu) --> (Renunciation / Awakening / Mantra / Kundalini / Moksha)`

---

## 5. Interpretive Guidelines & Modifiers

* **Narayana Dasa (`D1`) Interpretation:** Treat `Dasa Lagna` as Lagna (note: do **NOT** treat Varga Narayana Dasa sign as progressed Lagna; interpret Varga Narayana Dasa strictly from natal Varga Lagna, `AL`, and Arudhas!).
  * Natural malefics in `3rd`/`6th` from Dasa Lagna = venture success; natural benefics in `1, 5, 8, 9` = happiness; any planet in `11th` = gains; Rahu in `8th`/`12th` = constant fear; debilitated Dusthana lord = good.
  * **3-Part Rule:** Divide each Dasa into 3 equal thirds: `1st third` = Rasi dominates; `2nd third` = Rasi lord dominates; `3rd third` = Occupants & aspecting planets dominate.
* **Event Timescale Matching (PVR p. 266):** `MD` = multi-year mood; `AD` = multi-month events; `PD` = week-to-month events; `PAD/DAD` = hour-level mental events.

---

## 6. Verification Test Cases (From Source PDF)

1. **Dr. B.V. Raman — `D1` Narayana Dasa (PVR Ex. 66, Chart 23, p. 247–249):**
   * `7th` (`Le`) > Lagna (`Aq`) $\rightarrow$ Seed `Le` $\rightarrow$ `Le (1y), Cp (8y), Ge (2y), Sc (9y), Ar (4y), Vi (1y), Aq (9y), Cn (3y: 2+1 exalt), Sg (11y), Ta (3y), Li (10y), Pi (4y)`. Cycle 2: `Le (11y), Cp (4y), Ge (10y)`.
2. **Bill Gates — `D1` Narayana Dasa (PVR Ex. 68, Chart 24, p. 252–253):**
   * Seed `Ge`: `Ge (4y), Aq (5y), Li (12y), Vi (12y), Ta (5y), Cp (4y: 1993–97 rise, contains A10 & exalted Sat+Ven in 10th), Sg (8y: 1997–2005, Rahu in 12th = antitrust lawsuits)`.
3. **A.B. Vajpayee — Sudasa (PVR Ex. 77–78, Chart 3, p. 276–277):**
   * `SL = 12 Cp 21` (even $\rightarrow$ backward): `Cp (2y, bal 1.1766y), Li (2y), Cn (11y), Ar (12y), Sg (2y), Vi (10y), Ge (5y), Pi (1y), Sc (2y), Le (8y), Ta (7y), Aq (3y)`. Cycle 2 `Cp` (`AL`, `A5`, `7th` from `GL`) made him Prime Minister.
4. **Sri Aurobindo — Drigdasa (PVR Ex. 83, Chart 38, p. 283–284):**
   * `Sc` (1906–1913, Ketu + `7th` from AL) = spiritual awakening in prison & starting ashram; `Cn` (1918–1925, Lagna) = growth/recognition; `Li` (1925+, `A8` + Ketu argala) = retirement into seclusion for yogic sadhana.