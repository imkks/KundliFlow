---
route_id: "R-06"
module_name: "Arudha Padas (Bhava & Graha Arudhas) and Maya Layer"
dependencies: ["R-02", "R-04", "R-05", "R-08"]
primary_source: "vedic_astro_textbook.pdf (PVR Ch. 9, p. 97–111; Table 18; Charts 1–4)"
secondary_source: "N/A (PVR Integrated Parashara-Jaimini Standard)"
conflict_policy: "Strictly enforce 1st/7th -> 10th exception; use Stronger Co-Lord (R-08) for Sc/Aq and Stronger Rasi (R-08) for dual-sign planets"
---

# Arudha Padas (Bhava & Graha Arudhas) and Maya Layer

## 1. Core Concepts & Definitions

* **Arudha (Pada) = Maya (Material Perception / Image):** In the material world, how a person or matter is *perceived* often governs tangible outcomes (elections, exam ranks, promotions, wealth) more than hidden reality.
* **Three-Layer Reality vs. Perception Model (PVR p. 110 — CRITICAL for AI Counseling):**
  1. **Planets from Lagna:** Shows **objective reality** (what actually is).
  2. **Planets from Arudha Lagna (`AL`):** Shows **world's perception & material status** (how society sees the native).
  3. **Graha Arudhas from Lagna:** Shows **native's own subjective perception / feelings** (how the native *feels* about what is happening).
* **Desa–Kaala–Paatra Rule:** Because Arudhas represent the tangible cues by which society forms impressions, their concrete manifestation must be adapted to country, era, and social class.

---

## 2. Deterministic Rules & Formulas

### 2.1 Computation of Bhava Arudhas (`AL`, `A2`–`A11`, `UL`)
Applicable in **every Divisional Chart (`D-n`)** for each house $H \in \{1, \dots, 12\}$:
1. Let $S_{\text{house}} \in \{1, \dots, 12\}$ be the Rasi containing house $H$.
2. Find its lord $L$. *(If $S_{\text{house}} \in \{\text{Sc}, \text{Aq}\}$, pick the **stronger co-lord** per `R-08` Section 2.3.)*
3. Let $S_{\text{lord}}$ be the Rasi occupied by $L$ in the same Divisional Chart.
4. Count signs **zodiacally** from $S_{\text{house}}$ to $S_{\text{lord}}$ (inclusive):
   $$d = ((S_{\text{lord}} - S_{\text{house}}) \bmod 12) + 1$$
5. Count the same number $d$ signs zodiacally from $S_{\text{lord}}$:
   $$S_{\text{raw}} = ((S_{\text{lord}} + d - 2) \bmod 12) + 1$$
6. **Mandatory Exception (`1st` or `7th` from original house):**
   * If $S_{\text{raw}} == S_{\text{house}}$ (1st) **OR** $S_{\text{raw}} == ((S_{\text{house}} + 5) \bmod 12) + 1$ (7th):
     $$S_{\text{arudha}} = ((S_{\text{raw}} + 8) \bmod 12) + 1 \quad (\text{10th sign from } S_{\text{raw}})$$
   * Else: $S_{\text{arudha}} = S_{\text{raw}}$.
   *(Shortcut check: If lord is in 1st $\rightarrow$ Arudha is in 10th; if lord is in 4th $\rightarrow$ raw is 7th $\rightarrow$ shifted to 4th; if lord is in 7th $\rightarrow$ raw is 1st $\rightarrow$ shifted to 10th; if lord is in 10th $\rightarrow$ raw is 7th $\rightarrow$ shifted to 4th.)*

### 2.2 Computation of Graha Arudhas (All 9 Planets)
1. Let $S_{\text{planet}}$ be the Rasi occupied by planet $P$ in chart `D-n`.
2. Find the Rasi owned by $P$. *(For `Mars, Mercury, Jupiter, Venus, Saturn` who own 2 signs, pick the **stronger Rasi** per `R-08` Section 2.4; for `Rahu` use `Aq`; for `Ketu` use `Sc`.)* Let this be $S_{\text{own}}$.
3. Count signs zodiacally from $S_{\text{planet}}$ to $S_{\text{own}}$:
   $$d = ((S_{\text{own}} - S_{\text{planet}}) \bmod 12) + 1$$
4. Count $d$ signs zodiacally from $S_{\text{own}}$ to get $S_{\text{raw}}$.
5. **Same Exception:** If $S_{\text{raw}}$ is in the `1st` or `7th` from $S_{\text{planet}}$, take the **10th sign from $S_{\text{raw}}$**.
* **Node Symmetry Property (PVR p. 107):** Whenever Rahu & Ketu are $180^\circ$ apart (e.g., `D1`), their Graha Arudhas fall in the **exact same sign**. Whenever Rahu & Ketu are conjoined in a Varga, their Graha Arudhas fall in **opposite signs**.

---

## 3. Lookup Tables (Structured)

### Table 18: Classical Names & General Meanings of Bhava Arudhas
| Code | Classical Names | Core Maya / Material Manifestation |
| :---: | :--- | :--- |
| `AL` (`A1`) | Arudha Lagna, Pada Lagna | Public image, material status, reputation |
| `A2` | Dhanarudha, Vittapada | Manifested financial resources, assets |
| `A3` | Bhratripada, Vikramapada | Weapons, authored books/articles (tangible proof of boldness/writing) |
| `A4` | Matripada, Vahanapada, Sukhapada | Physical vehicle (`D16`), school/university (`D24`), tangible home (`D4`) |
| `A5` | Mantrapada, Putrapada, Buddhipada | Mantras/rituals (`D20`), exam scores/awards (`D24`), trappings of power (`D10`) |
| `A6` | Rogapada, Satrupada | Visible enemies, litigation, debts, disease manifestations |
| `A7` | Darapada | People/associates one interacts with (colleagues, partners, friends) |
| `A8` | Mrityupada, Kashtapada, Randhrapada | Visible crises, accidents, yogic sadhana/Kundalini (`D20`/Drigdasa) |
| `A9` | Bhagyapada, Pitripada, Gurupada | Academic degrees (`D24`), formal honors/rankings (e.g., Forbes list), father's body (`D12`) |
| `A10` | Karmapada, Swargapada, Rajyapada | Physical workplace (`D10`), office environment, throne/position |
| `A11` | Labhapada | Manifested material gains & income sources |
| `UL` (`A12`) | Upapada Lagna, Gaunapada, Mokshapada | **Marriage & spouse** (longevity = `8th` from UL; break-up/divorce = `2nd`/`7th` from UL) |

### Table 6A: Key House Placements From `AL` & `UL`
| Reference | House(s) | Occupant / Influence | Predictive Rule |
| :--- | :---: | :--- | :--- |
| **`AL`** | `3rd`, `6th` | **Natural Malefics** | Perceived as bold, hits rivals hard $\rightarrow$ **materially successful** |
| **`AL`** | `3rd`, `6th` | **Natural Benefics** | Gentle, restrained in public $\rightarrow$ **saintly / non-combative** |
| **`AL`** | `11th` | Any strong planet | Financial gains, income inflow, status growth |
| **`AL`** | `12th` | Planets / Malefics | Financial expenditure, outflow, status drain |
| **`AL`** | `3rd, 6th, 10th, 11th` | Upachayas | Growth of status and material rise |
| **`AL`** | `8th`, `12th` | Malefics / Dasa | Fall in status, material setbacks |
| **`UL`** | `1st` (`UL`) | Occupying planet | Nature of spouse & marriage (Merc=intelligent/indecisive, Ketu=spiritual/short-tempered, Sun=charming/authoritative, Mars=bold/quarrelsome) |
| **`UL`** | `8th` from `UL` | Benefics vs. Malefics | Longevity of marriage (Benefics = long; Malefics = rough/short) |
| **`UL`** | `2nd`, `7th` from `UL` | Malefics / Dasa | End of marriage, separation, divorce (remedy: fast on weekday of UL lord) |

---

## 4. Entity Relationships (Graph Edges)

* `(House H, Varga D-n) --[PROJECTS_MAYA_TO]--> (BhavaArudha An)`
* `(Graha P, Varga D-n) --[PROJECTS_PERCEPTION_TO]--> (GrahaArudha GA_P)`
* `(GrahaArudha GA_P) --[PLACED_IN_HOUSE_FROM_LAGNA]--> (NativeSubjectiveFeeling)`
* `(UL) --[SEPARATION_TRIGGERED_BY]--> (2nd_from_UL, 7th_from_UL)`
* `(AL, A7) --[MUTUAL_POSITION_NOT_IN {2/12, 6/8}]--> (AmplifiesRajaYogas)`

---

## 5. Interpretive Guidelines & Modifiers

* **True Happiness vs. Perceived Luxury (`4th` vs. `A4` in `D16`):** Benefics in `A4` + Saturn in `4th` = owns luxury cars (perceived happy) yet personally dissatisfied. Saturn in `A4` + Jupiter/Venus in `4th` = owns modest vehicle yet genuinely happy with it.
* **Spouse Nature vs. Marriage Longevity (`UL` vs. `8th` from `UL`):** Mars+Saturn in `UL` with Jupiter in `8th` from `UL` = long marriage to a quarrelsome spouse. Jupiter in `UL` with Mars+Saturn in `8th` from `UL` = noble spouse but rough marriage / divorce risk.
* **Counseling Synthesis (A.B. Vajpayee Example 32, p. 108):** In `Jupiter-Rahu`, Rahu is in `8th` from Lagna (real stress/health), `6th` from `AL` (natural malefic $\rightarrow$ victory over rivals, became PM), and Rahu's Graha Arudha is in `12th` from Lagna (personally felt frustrated/unhappy). All three layers operate simultaneously.

---

## 6. Verification Test Cases (From Source PDF)

1. **All 12 Bhava Arudhas — Chart 1 (PVR Ex. 29, p. 99–100):**
   * `Asc=Vi, Sun/Merc/Ven=Pi, Jup/Mars/Sat=Ar, Moon=Ge, Rahu=Cn, Ketu=Cp`. (Stronger lords: `Sc=Mars`, `Aq=Sat`).
   * Expected: `AL=Ge, A2=Le, A3=Vi, A4=Le, A5=Ar, A6=Ge, A7=Ta, A8=Cp, A9=Cp, A10=Vi, A11=Ta, UL=Li`.
2. **All 9 Graha Arudhas — Chart 1 (PVR Ex. 30, p. 106–107):**
   * Expected: `Sun=Cp, Moon=Le, Mars=Cp, Merc=Ge, Jup=Aq, Ven=Ta, Sat=Cn, Rahu=Vi, Ketu=Vi`.
3. **Bhava & Graha Arudhas — Chart 2 D-16 (PVR Exercises 12–13, p. 101 & 111):**
   * Expected Bhava Arudhas: `AL=Aq, A2=Ar, A3=Sg, A4=Sc, A5=Sg, A6=Aq, A7=Pi, A8=Vi, A9=Ta, A10=Sg, A11=Sg, UL=Aq`.
   * Expected Graha Arudhas: `Sun=Sc, Moon=Sg, Mars=Ge, Merc=Pi, Jup=Sc, Ven=Aq, Sat=Sg, Rahu=Vi, Ketu=Pi`.