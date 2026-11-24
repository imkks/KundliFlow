---
route_id: "R-04"
module_name: "Divisional Charts (20 Vargas), Planes of Existence & Amsabala"
dependencies: ["R-01", "R-02", "R-03"]
primary_source: "vedic_astro_textbook.pdf (PVR Ch. 6, p. 63–78; Table 11)"
secondary_source: "Elements of Vedic Astrology (Charak Ch. X; Tables X-1 to X-15; Vimsopaka weightages)"
conflict_policy: "Compute all 20 Parashara/Jaimini/Tajaka Vargas using Whole-Sign mapping; apply all chart rules (houses, arudhas, aspects, argalas, ashtakavarga) uniformly inside each Varga"
---

# Divisional Charts (20 Vargas), Planes of Existence & Amsabala

## 1. Core Concepts & Definitions

* **Varga Chakra (Divisional Chart):** Dividing each $30^\circ$ Rasi into $n$ parts and mapping each part back to a Rasi ($1$–$12$). Every planet, Upagraha, Lagna, and Special Lagna is mapped into each `D-n` chart, which is then analyzed as an independent horoscope for its specific life domain.
* **Four Planes of Existence (PVR Ch. 6.4):**
  1. **Physical Plane (`D1`–`D12`):** Physical body, wealth, siblings, property, children, spouse, career, parents.
  2. **Mental Plane (`D16, D20, D24`):** Comforts/pleasure, religious devotion, intellect/learning.
  3. **Sub-conscious Plane (`D27, D30`):** Inherent strengths/weaknesses, psychological imbalances, evils/punishments.
  4. **Karmic Plane (`D40, D45, D60`):** Subtle past-life karma governing overarching life patterns.
* **Vargottama:** A body occupying the **exact same Rasi in `D1` and `D9`**—highly strengthening and auspicious.

---

## 2. Deterministic Rules & Formulas (All 20 Vargas)

Let $R \in \{1, \dots, 12\}$ be the body's `D1` Rasi (`1=Ar ... 12=Pi`) and $d \in [0^\circ, 30^\circ)$ be its degree within $R$. For uniform $n$-part divisions, let part index $k \in \{0, 1, \dots, n-1\}$ be:
$$k = \left\lfloor \frac{d}{30^\circ / n} \right\rfloor$$
All sign additions wrap via $\text{sign}(x) = ((x - 1) \bmod 12) + 1$.

| Varga | Part Width | Starting Sign $S_0$ Rule | Target Sign Formula |
| :--- | :---: | :--- | :--- |
| **D1 (Rasi)** | $30^\circ$ | $S_0 = R$ | $R$ |
| **D2 (Hora)** | $15^\circ$ | Odd $R$: $k=0 \rightarrow \text{Le (5)}, k=1 \rightarrow \text{Cn (4)}$; Even $R$: $k=0 \rightarrow \text{Cn (4)}, k=1 \rightarrow \text{Le (5)}$ | Direct lookup |
| **D3 (Drekkana)** | $10^\circ$ | $k=0 \rightarrow R$; $k=1 \rightarrow R+4$ (5th); $k=2 \rightarrow R+8$ (9th) | $\text{sign}(R + 4k)$ |
| **D4 (Chaturthamsa)** | $7^\circ 30'$ | $k \in \{0,1,2,3\} \rightarrow$ 1st, 4th, 7th, 10th from $R$ | $\text{sign}(R + 3k)$ |
| **D5 (Panchamsa)** | $6^\circ$ | Odd $R$: `[Ar, Aq, Sg, Ge, Li]`; Even $R$: `[Ta, Vi, Pi, Cp, Sc]` | Index $k$ into array |
| **D6 (Shashthamsa)** | $5^\circ$ | Odd $R$: $S_0 = 1\text{ (Ar)}$; Even $R$: $S_0 = 7\text{ (Li)}$ | $\text{sign}(S_0 + k)$ |
| **D7 (Saptamsa)** | $4^\circ 17' 8.57''$ | Odd $R$: $S_0 = R$; Even $R$: $S_0 = \text{sign}(R + 6)$ (7th) | $\text{sign}(S_0 + k)$ |
| **D8 (Ashtamsa)** | $3^\circ 45'$ | Movable: `Ar (1)`; Fixed: `Sg (9)`; Dual: `Le (5)` | $\text{sign}(S_0 + k)$ |
| **D9 (Navamsa)** | $3^\circ 20'$ | Fire: `Ar (1)`; Earth: `Cp (10)`; Air: `Li (7)`; Water: `Cn (4)` | $\text{sign}(S_0 + k)$ |
| **D10 (Dasamsa)** | $3^\circ$ | Odd $R$: $S_0 = R$; Even $R$: $S_0 = \text{sign}(R + 8)$ (9th) | $\text{sign}(S_0 + k)$ |
| **D11 (Rudramsa)** | $2^\circ 43' 38.18''$ | Count $R$ signs **anti-zodiacally** from `Ar`: $S_0 = ((1 - (R - 1) - 1) \bmod 12) + 1 = ((13 - R) \bmod 12) + 1$ *(e.g. Ar$\rightarrow$Ar, Ta$\rightarrow$Pi, Ge$\rightarrow$Aq, Sc$\rightarrow$Vi)* | $\text{sign}(S_0 + k)$ |
| **D12 (Dwadasamsa)** | $2^\circ 30'$ | $S_0 = R$ | $\text{sign}(R + k)$ |
| **D16 (Shodasamsa)** | $1^\circ 52' 30''$ | Movable: `Ar (1)`; Fixed: `Le (5)`; Dual: `Sg (9)` | $\text{sign}(S_0 + k)$ |
| **D20 (Vimsamsa)** | $1^\circ 30'$ | Movable: `Ar (1)`; Fixed: `Sg (9)`; Dual: `Le (5)` | $\text{sign}(S_0 + k)$ |
| **D24 (Chaturvimsamsa)** | $1^\circ 15'$ | Odd $R$: `Le (5)`; Even $R$: `Cn (4)` | $\text{sign}(S_0 + k)$ |
| **D27 (Nakshatramsa)** | $1^\circ 6' 40''$ | Fire: `Ar (1)`; Earth: `Cn (4)`; Air: `Li (7)`; Water: `Cp (10)` | $\text{sign}(S_0 + k)$ |
| **D30 (Trimsamsa)** | Non-uniform | **Odd $R$:** `[0–5): Ar, [5–10): Aq, [10–18): Sg, [18–25): Ge, [25–30): Li`<br>**Even $R$:** `[0–5): Ta, [5–12): Vi, [12–20): Pi, [20–25): Cp, [25–30): Sc` | Direct range lookup |
| **D40 (Khavedamsa)** | $0^\circ 45'$ | Odd $R$: `Ar (1)`; Even $R$: `Li (7)` | $\text{sign}(S_0 + k)$ |
| **D45 (Akshavedamsa)** | $0^\circ 40'$ | Movable: `Ar (1)`; Fixed: `Le (5)`; Dual: `Sg (9)` | $\text{sign}(S_0 + k)$ |
| **D60 (Shashtyamsa)** | $0^\circ 30'$ | $S_0 = R$; $k = \lfloor 2d \rfloor$ | $\text{sign}(R + k)$ |

### Exceptions & Edge Cases
* **D11 Anti-Zodiacal Formula Check:** `Ar(1)->Ar(1)`, `Ta(2)->Pi(12)`, `Ge(3)->Aq(11)`, ..., `Sc(8)->Vi(6)`. Note that `sign(14 - R)` produces `13->1`, `12->12`, `11->11`, `6->6`, matching PVR Example 18 (`Ge -> Aq`, `Sc -> Vi`).
* **D8 Example 15 Typo in Book:** PVR p. 67 correctly computes `3rd from Le = Li` for Mercury in Ge, then has a typo in the summary sentence ("Le"). Trust the formula: `Li`.

---

## 3. Lookup Tables (Structured)

### Table 11: Divisional Chart Life-Domain Routing
| Varga | Name | Plane | Area of Life Seen From It |
| :--- | :--- | :--- | :--- |
| `D1` | Rasi (Kshetra) | Physical | Existence at physical level, body, overall foundation |
| `D2` | Hora | Physical | Wealth and money |
| `D3` | Drekkana | Physical | Siblings (brothers & sisters), initiative |
| `D4` | Chaturthamsa (Turyamsa) | Physical | Residence, houses owned, immovable property, fortune, foreign stay |
| `D5` | Panchamsa | Physical | Fame, authority, and power |
| `D6` | Shashthamsa | Physical | Health troubles, diseases |
| `D7` | Saptamsa | Physical | Children and grandchildren |
| `D8` | Ashtamsa | Physical | Sudden/unexpected troubles, litigation |
| `D9` | Navamsa (Dharmamsa) | Physical | Marriage, spouse, dharma (duty), interaction with others, basic skills, inner self |
| `D10` | Dasamsa (Karmamsa) | Physical | Career, profession, activities and achievements in society |
| `D11` | Rudramsa (Ekadasamsa) | Physical | Death, destruction, wars |
| `D12` | Dwadasamsa | Physical | Parents, uncles, aunts, grandparents (blood-relatives of parents) |
| `D16` | Shodasamsa (Kalamsa) | Mental | Vehicles, pleasures, comforts and discomforts |
| `D20` | Vimsamsa | Mental | Religious activities and spiritual matters |
| `D24` | Chaturvimsamsa (Siddhamsa) | Mental | Learning, knowledge, and education |
| `D27` | Nakshatramsa (Bhamsa) | Sub-conscious | Inherent strengths and weaknesses, subconscious nature |
| `D30` | Trimsamsa | Sub-conscious | Evils, punishment, subconscious self, certain diseases |
| `D40` | Khavedamsa | Karmic | Auspicious and inauspicious events |
| `D45` | Akshavedamsa | Karmic | All matters (general karmic pattern) |
| `D60` | Shashtyamsa | Karmic | Past-life karma, all matters (finest resolution) |

### Table 4A: Varga Groupings & Amsabala (Count of Own / Exaltation / Moolatrikona Placements)
* **Shadvarga (6 charts):** `D1, D2, D3, D9, D12, D30`
  * `2: Kimsukaamsa, 3: Vyanjanaamsa, 4: Chaamaraamsa, 5: Chatraamsa, 6: Kundalaamsa`
* **Saptavarga (7 charts):** `D1, D2, D3, D7, D9, D12, D30`
  * Same as Shadvarga + `7: Mukutaamsa`
* **Dasavarga (10 charts — CRITICAL for Raja Yoga grading):** `D1, D2, D3, D7, D9, D10, D12, D16, D30, D60`
  * `2: Paarijaataamsa, 3: Uttamaamsa, 4: Gopuraamsa, 5: Simhaasanaamsa, 6: Paaraavataamsa, 7: Devalokaamsa, 8: Brahmalokaamsa, 9: Airaavataamsa, 10: Sreedhaamaamsa`
* **Shodasavarga (16 charts):** `D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60`
  * `2: Bhedakaamsa, 3: Kusumaamsa, 4: Nagapurushaamsa, 5: Kandukaamsa, 6: Keralaamsa, 7: Kalpavrikshaamsa, 8: Chandanavanaamsa, 9: Poornachandraamsa, 10: Uchchaisravaamsa, 11: Dhanvantaryamsa, 12: Sooryakaantaamsa, 13: Vidrumaamsa, 14: Indraasanaamsa, 15: Golokaamsa, 16: Sree Vallabhaamsa`

### Table 4B: Vimsopaka Bala Relative Varga Weightages (Charak Ch. X — Total = 20 Units Each)
| Scheme | Varga Weights (Total = 20) |
| :--- | :--- |
| **Shadvarga (6)** | `D1: 6, D9: 5, D3: 4, D2: 2, D12: 2, D30: 1` |
| **Saptavarga (7)** | `D1: 5, D9: 4.5, D3: 3, D7: 2.5, D2: 2, D12: 2, D30: 1` |
| **Dasavarga (10)** | `D60: 5, D1: 3, D2/D3/D7/D9/D10/D12/D16/D30: 1.5 each` |
| **Shodasavarga (16)** | `D60: 4, D1: 3.5, D9: 3, D16: 2, D2/D3/D30: 1 each, D4/D7/D10/D12/D20/D24/D27/D40/D45: 0.5 each` |

---

## 4. Entity Relationships (Graph Edges)

* `(LifeDomainQuery) --[ROUTES_TO_VARGA]--> (DivisionalChart D-n)`
* `(Graha, Longitude) --[PROJECTS_INTO]--> (Rasi in D-n)`
* `(Graha) --[HAS_DASAVARGA_AMSA]--> (AmsaTier) | Controls Raja Yoga Magnitude`
* `(Graha) --[IS_VARGOTTAMA]--> (True) | D1_Rasi == D9_Rasi`

---

## 5. Interpretive Guidelines & Modifiers

* **Never Analyze Specific Domains from D1 Alone:** D1 shows physical existence; always route career to `D10`, marriage to `D9`, children to `D7`, education to `D24`, residence/foreign stay to `D4`, vehicles to `D16`, spirituality to `D20`.
* **Cross-Linkage Pattern:** Inside the target Varga, look for links between the relevant **House**, its **Lord**, the **Naisargika/Chara Karaka**, **Special Lagnas (HL/GL)**, and **Arudha Padas** (e.g., `12th` lord + `Rahu` in `9th` in `D4` $\rightarrow$ foreign residence).

---

## 6. Verification Test Cases (From Source PDF)

1. **Varga Mapping Spot Checks (PVR Examples 11–26, p. 65–72):**
   * Mercury `11 Ge` & Jupiter `19 Sc`:
     * `D6`: Merc=`Ge`, Jup=`Cp` | `D9`: Merc=`Cp`, Jup=`Sg` | `D10`: Merc=`Vi`, Jup=`Cp`
     * `D11`: Merc=`Ge`, Jup=`Pi` | `D12`: Merc=`Li`, Jup=`Ge` | `D16`: Merc=`Ta`, Jup=`Ge`
     * `D20`: Merc=`Pi`, Jup=`Sg` | `D24`: Merc=`Ar`, Jup=`Li` | `D27`: Merc=`Le`, Jup=`Ge`
     * `D40`: Merc=`Ge`, Jup=`Sc` | `D45`: Merc=`Ar`, Jup=`Sg`
   * `D60` (Ex. 26): Jupiter `12 Sc 58` $\rightarrow$ $k = \lfloor 2 \times 12.967 \rfloor = 25$ (26th part) $\rightarrow$ 2nd from `Sc` = **`Sg`**.
2. **Amsabala Check — Bill Cosby's Jupiter (PVR Ex. 27, p. 77):**
   * Jupiter at `29 Sg 49`: `D1:Sg, D2:Cn, D3:Li, D4:Vi, D7:Ge, D9:Sg, D10:Vi, D12:Sc, D16:Pi, D20:Pi, D24:Cn, D27:Ge, D30:Li, D40:Cn, D45:Le, D60:Sc`.
   * Counts in `{Cn, Sg, Pi}`: Shadvarga = `3` (**Vyanjanaamsa**), Saptavarga = `3` (**Vyanjanaamsa**), Dasavarga = `4` (**Gopuraamsa**), Shodasavarga = `7` (**Kalpavrikshaamsa**).