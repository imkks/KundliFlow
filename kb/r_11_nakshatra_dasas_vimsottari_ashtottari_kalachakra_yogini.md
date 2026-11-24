---
route_id: "R-11"
module_name: "Nakshatra Dasas: Vimsottari, Ashtottari, Kalachakra & Yogini"
dependencies: ["R-01", "R-04", "R-05", "R-10"]
primary_source: "vedic_astro_textbook.pdf (PVR Ch. 16–17, p. 221–242; Ch. 24, p. 301–323; Tables 38–39, 42–52)"
secondary_source: "Elements of Vedic Astrology (Charak Ch. XIV–XV; Tables XIV-1 to XIV-17)"
conflict_policy: "Year length configurable (PVR uses 360-day Savana years for Nakshatra Dasas; Solar 365.2425 days as optional mode); include Vimsottari 4th/5th/8th star variations and Charak's Yogini Dasa as confirmatory tool"
---

# Nakshatra Dasas: Vimsottari, Ashtottari, Kalachakra & Yogini

## 1. Core Concepts & Definitions

* **Nakshatra Dasas:** Planetary or sign periods anchored to **Moon's Nakshatra** (or Nakshatra Pada), reflecting the evolution of the **mind** and **inner self** over time.
* **Distinct Psychological Perspectives (PVR Ch. 24.5):**
  * **Vimsottari Dasa (120 yrs):** Focuses on **how the mind views** life events (Moon's Nakshatra). Most universally applicable in Kali Yuga.
  * **Ashtottari Dasa (108 yrs):** 8-planet cycle (Ketu excluded; aligns with the 8 Chara Karakas). Used as a conditional *Phalita* or *Ayur* Dasa.
  * **Kalachakra Dasa (83–100 yrs):** Based on **Moon's Navamsa (Pada)**; called "the most respectable dasa" by Parashara. Focuses on **how connected the inner self feels** to ongoing life events.
  * **Yogini Dasa (36 yrs — Charak Ch. XIV):** Fast 8-Yogini cycle used as a confirmatory timing tool alongside Vimsottari.
* **Sub-Period Hierarchy:** Mahadasa (`MD`) $\rightarrow$ Antardasa (`AD`) $\rightarrow$ Pratyantardasa (`PD`) $\rightarrow$ Sookshma (`SD`) $\rightarrow$ Praana (`PAD`) $\rightarrow$ Deha (`DAD`).

---

## 2. Deterministic Rules & Formulas

### 2.1 Vimsottari Dasa (120-Year Cycle)
1. **Base Anchor:** Find Moon's Nakshatra ($13^\circ 20' = 800'$) and its Vimsottari lord (Table `2` in `R-01`).
2. **Remaining Fraction at Birth:**
   $$f_{\text{rem}} = \frac{800' - \text{adv\_in\_nakshatra}'}{800'}$$
3. **First Dasa Balance:** $\text{Balance} = f_{\text{rem}} \times D_{\text{first\_lord}}$ (where $D$ is from Table `38`). Subsequent Dasas follow the fixed cyclic order in Table `38`.
4. **Proportional Sub-Periods (`AD`, `PD`, `SD`, `PAD`, `DAD`):**
   * First `AD` in any `MD` belongs to the **`MD` lord itself**, then follows Table `38` order.
   * Exact durations:
     $$\text{AD}(a, b) = \frac{a \times b}{120}\text{ yrs}, \qquad \text{PD}(a, b, c) = \frac{a \times b \times c}{120^2}\text{ yrs}$$
   * **First Dasa Sub-Period Rule (Edge Case):** Divide the **complete** duration of the birth `MD` (not just the remaining balance) into 9 `AD`s; skip the elapsed `AD`s that occurred before birth.
5. **Vimsottari Variations (PVR Ch. 16.4 & 16.5.2):**
   * Always compute $f_{\text{rem}}$ from Moon's Nakshatra, but initiate the first Dasa from the lord of:
     * **5th Star (`Utpanna`):** Preferred for *Phalita* (general results) if the sign holding the 5th star's matching Pada is stronger than Moon's sign.
     * **4th Star (`Kshema`) or 8th Star (`Adhana`):** Preferred for *Ayur* (longevity) if their sign is stronger (maraka/malefic aspected) than Moon's sign.
     * **Lagna Star:** Applicable only when Lagna is considerably stronger than Moon.
   * *Exception:* If all 4 Kendras from the stronger of Lagna/Moon are occupied, Kendradi Graha (Moola) Dasa outperforms Vimsottari.

### 2.2 Ashtottari Dasa (108-Year Cycle)
1. Locate natal Moon's longitude in one of the **8 Nakshatra arcs** ($53^\circ 20'$ for 4-star arcs, $40^\circ 0'$ for 3-star arcs; Table `39`).
2. **First Dasa Balance:**
   $$f_{\text{rem}} = \frac{\text{arc\_end} - \lambda_{\text{Moon}}}{\text{arc\_length}}, \qquad \text{Balance} = f_{\text{rem}} \times D_{\text{arc\_lord}}$$
   *(Wrap-around Edge Case for Rahu's arc `333°20'–26°40'`: if $\lambda_{\text{Moon}} \ge 333^\circ 20'$, use `386°40' - lambda`; if $\lambda_{\text{Moon}} < 26^\circ 40'$, use `26°40' - lambda`.)*
3. **Antardasa Order (CRITICAL Difference vs. Vimsottari):** The first `AD` belongs to the **NEXT planet** in Table `39` after the `MD` lord, ending with the `MD` lord last. Duration $= (a \times b) / 108$ years.
4. **Applicability Views (3 Traditional Criteria):** (1) Universal; (2) Rahu not in Lagna and in Kendra/Trikona from Lagna lord; (3) Daytime birth in Krishna Paksha OR Nighttime birth in Sukla Paksha.

### 2.3 Kalachakra Dasa (PVR Ch. 24)
1. **Group Classification (Table `42`):** Nakshatras alternate in groups of 3 between **Savya** (zodiacal) and **Apasavya** (anti-zodiacal), each split into sub-groups `1` and `2`.
2. **24-Rasi Wheel Basis (Table `43`):**
   * *Savya:* `Ar..Pi` (Main) followed by `Sc, Li, Vi, Cn, Le, Ge, Ta, Ar, Pi, Aq, Cp, Sg` (Mirrored).
   * *Apasavya:* `Sg, Cp, Aq, Pi, Ar, Ta, Ge, Le, Cn, Vi, Li, Sc` (Mirrored) followed by `Pi..Ar` (Main).
3. **Birth Dasa & Balance:**
   * Look up the 9-Rasi sequence and `Paramayush` ($P_{\max} \in \{83, 85, 86, 100\}$ yrs) for Moon's exact Nakshatra Pada (Tables `44–47`).
   * Compute elapsed fraction of Moon's Pada ($3^\circ 20' = 200'$):
     $$f_{\text{elapsed}} = \frac{\text{adv\_in\_pada}'}{200'}, \qquad \text{Years\_Elapsed} = f_{\text{elapsed}} \times P_{\max}$$
   * Walk cumulative Dasa years (Table `48`) along the 9-Rasi sequence until cumulative sum exceeds $\text{Years\_Elapsed}$. That Rasi is the **birth Dasa** with remaining balance $= \text{cum\_end} - \text{Years\_Elapsed}$.
   * Take **9 total Dasas** starting from the birth Dasa. When a Pada's 9 Rasis finish, seamlessly continue into the next Pada (`Pada 4` of Savya-1 $\rightarrow$ `Pada 1` of Savya-2; `Pada 4` of Apasavya-2 $\rightarrow$ `Pada 1` of Apasavya-1).
4. **Antardasas:** Start from the `MD` Rasi itself and take the next 9 Rasis along the same 24-Rasi Kalachakra sequence. Distribute `MD` length proportionally to the sum of the 9 `AD` Rasi lengths.
5. **Deha & Jeeva Rasis (Dynamic Rule):**
   * *Savya Nakshatra:* **1st Dasa** = `Deha Rasi` (body); **9th Dasa** = `Jeeva Rasi` (spirit/life).
   * *Apasavya Nakshatra:* **1st Dasa** = `Jeeva Rasi`; **9th Dasa** = `Deha Rasi`.
6. **Three Special Gatis (Leaps):**
   * **Simhaavalokana (Lion's Leap):** Trinal jump (`Sg <-> Ar` or `Pi <-> Sc`).
   * **Markati (Monkey's Leap):** Temporary direction reversal (`Cn -> Le` in Savya; `Le -> Cn` in Apasavya).
   * **Mandooki (Frog's Leap):** Skipping one sign (`Vi -> Cn` or `Le -> Ge` in Savya; `Ge -> Le` or `Cn -> Vi` in Apasavya).

### 2.4 Yogini Dasa (36-Year Cycle — Charak Ch. XIV)
1. Let $N \in \{1..27\}$ be Moon's Nakshatra index.
2. Birth Yogini index: $I = (N + 3) \bmod 8$ (if $0 \rightarrow 8$).
3. Balance at birth $= f_{\text{rem}} \times D_I$ (using the same Moon Nakshatra remaining fraction as Vimsottari).
4. Antardasas start from the `MD` Yogini itself and proceed cyclically with duration $(a \times b)/36$ years.

---

## 3. Lookup Tables (Structured)

### Table 38: Vimsottari Dasa Sequence & Years (Total = 120)
| Order | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Planet** | Sun | Moon | Mars | Rahu | Jupiter | Saturn | Mercury | Ketu | Venus |
| **Years** | 6 | 10 | 7 | 18 | 16 | 19 | 17 | 7 | 20 |

### Table 39: Ashtottari Dasa Arcs & Years (Total = 108)
| # | Nakshatras Covered | Longitude Arc | Span | Planet | Years |
| :---: | :--- | :---: | :---: | :--- | :---: |
| 1 | Ardra, Punarvasu, Pushyami, Asresha | `66°40' – 120°00'` | $53^\circ 20'$ | Sun | 6 |
| 2 | Makha, P.Phalguni, U.Phalguni | `120°00' – 160°00'` | $40^\circ 00'$ | Moon | 15 |
| 3 | Hasta, Chitra, Swati, Visakha | `160°00' – 213°20'` | $53^\circ 20'$ | Mars | 8 |
| 4 | Anuradha, Jyeshtha, Moola | `213°20' – 253°20'` | $40^\circ 00'$ | Mercury | 17 |
| 5 | P.Ashadha, U.Ashadha, Sravanam | `253°20' – 293°20'` | $40^\circ 00'$ | Saturn | 10 |
| 6 | Dhanishtha, Satabhisha, P.Bhadra | `293°20' – 333°20'` | $40^\circ 00'$ | Jupiter | 19 |
| 7 | U.Bhadra, Revati, Aswini, Bharani | `333°20' – 26°40'` | $53^\circ 20'$ | Rahu | 12 |
| 8 | Krittika, Rohini, Mrigasira | `26°40' – 66°40'` | $40^\circ 00'$ | Venus | 21 |

### Tables 44–48: Kalachakra Dasa Sequences & Rasi Years
* **Rasi Years (Table 48):** `Le: 5`, `Cn: 21`, `Ar/Sc: 7`, `Ge/Vi: 9`, `Sg/Pi: 10`, `Ta/Li: 16`, `Cp/Aq: 4`.
* **Savya-1** (`Aswini, Krittika, Punarvasu, Asresha, Hasta, Swati, Moola, U.Ashadha, P.Bhadra`):
  * `P1 (100y)`: `Ar, Ta, Ge, Cn, Le, Vi, Li, Sc, Sg` | `P2 (85y)`: `Cp, Aq, Pi, Sc, Li, Vi, Cn, Le, Ge`
  * `P3 (83y)`: `Ta, Ar, Pi, Aq, Cp, Sg, Ar, Ta, Ge` | `P4 (86y)`: `Cn, Le, Vi, Li, Sc, Sg, Cp, Aq, Pi`
* **Savya-2** (`Bharani, Pushyami, Chitra, P.Ashadha, Revati`):
  * `P1 (100y)`: `Sc, Li, Vi, Cn, Le, Ge, Ta, Ar, Pi` | `P2 (85y)`: `Aq, Cp, Sg, Ar, Ta, Ge, Cn, Le, Vi`
  * `P3 (83y)`: `Li, Sc, Sg, Cp, Aq, Pi, Sc, Li, Vi` | `P4 (86y)`: `Cn, Le, Ge, Ta, Ar, Pi, Aq, Cp, Sg`
* **Apasavya-1** (`Rohini, Makha, Visakha, Sravanam`):
  * `P1 (86y)`: `Sg, Cp, Aq, Pi, Ar, Ta, Ge, Le, Cn` | `P2 (83y)`: `Vi, Li, Sc, Pi, Aq, Cp, Sg, Sc, Li`
  * `P3 (85y)`: `Vi, Le, Cn, Ge, Ta, Ar, Sg, Cp, Aq` | `P4 (100y)`: `Pi, Ar, Ta, Ge, Le, Cn, Vi, Li, Sc`
* **Apasavya-2** (`Mrigasira, Ardra, P.Phalguni, U.Phalguni, Anuradha, Jyeshtha, Dhanishtha, Satabhisha`):
  * `P1 (86y)`: `Pi, Aq, Cp, Sg, Sc, Li, Vi, Le, Cn` | `P2 (83y)`: `Ge, Ta, Ar, Sg, Cp, Aq, Pi, Ar, Ta`
  * `P3 (85y)`: `Ge, Le, Cn, Vi, Li, Sc, Pi, Aq, Cp` | `P4 (100y)`: `Sg, Sc, Li, Vi, Le, Cn, Ge, Ta, Ar`

### Table 51: Kalachakra Gati (Leap) Results & Directional Rules
| Leap | Savya Results | Apasavya Results |
| :--- | :--- | :--- |
| **Lion** (`Sg<->Ar`, `Pi<->Sc`) | Fear of animals/poison/weapons, loss of friends, fall from vehicle, fever | Death of father/elders, loss of position |
| **Monkey** (`Cn->Le`, `Le->Cn`) | Loss of wealth/agriculture, death of father/elders | Danger from water, distress to father, loss of position, anger of rulers |
| **Frog** (`Vi->Cn`, `Le->Ge`, `Ge->Le`, `Cn->Vi`) | Distress to elders/father, enemies/thieves; `Le->Ge` = mother/native danger | Distress to wife, loss of children, fever, sickness, loss of position |
* *Travel Direction Rules:* `Vi->Cn` (East/North good); `Le->Ge` (avoid East, SW good); `Cn->Le` (avoid South, West good); `Pi->Sc` / `Sg->Cp` (trouble in North); `Sg->Ar` (avoid journeys); `Le->Cn` (avoid West).

### Table XIV-13: Yogini Dasa (Charak — Total = 36 Years)
| # | Yogini | Lord | Years | # | Yogini | Lord | Years |
| :---: | :--- | :--- | :---: | :---: | :--- | :--- | :---: |
| 1 | Mangala | Moon | 1 | 5 | Bhadrika | Mercury | 5 |
| 2 | Pingala | Sun | 2 | 6 | Ulka | Saturn | 6 |
| 3 | Dhanya | Jupiter | 3 | 7 | Siddha | Venus | 7 |
| 4 | Bhramari | Mars | 4 | 8 | Sankata | Rahu/Ketu | 8 |

---

## 4. Entity Relationships (Graph Edges)

* `(Vimsottari_MD) --[JUDGED_FROM]--> (Sun / RaviYogas) | Rath's Tripod of Life`
* `(Vimsottari_AD) --[JUDGED_FROM]--> (Moon / ChandraYogas, MD_Lord) | Rath's Tripod of Life`
* `(Vimsottari_PD) --[JUDGED_FROM]--> (Lagna / RajaYogas) | Rath's Tripod of Life`
* `(Kalachakra_Rasi) --[WEIGHTED_BY]--> (Varga_SAV >= 30)`
* `(TransitMalefics) --[IN_DEHA_RASI / JEEVA_RASI]--> (BodilyDanger / LowSpirit)`

---

## 5. Interpretive Guidelines & Modifiers

* **Rath's Tripod of Life (PVR Ch. 16.5.3):** Evaluate `MD` from **Sun** (soul/slow), `AD` from **Moon** (mind/medium) and `MD` lord, and `PD` from **Lagna** (body/fast). Planets in Ravi Yogas deliver in `MD`; Chandra Yogas in `AD`; Lagna Raja Yogas in `PD`.
* **Charak's Drekkana Timing Within Dasa (Charak Ch. XV):** Planet in 1st Drekkana ($0^\circ$–$10^\circ$) delivers in the early part of its Dasa; 2nd ($10^\circ$–$20^\circ$) in the middle; 3rd ($20^\circ$–$30^\circ$) in the end.
* **Kalachakra + SAV Rule:** Always overlay the target Varga's `SAV` (`R-10`) onto Kalachakra Dasa signs—signs with $\ge 30$ points deliver peak periods in that Varga's domain.

---

## 6. Verification Test Cases (From Source PDF)

1. **Vimsottari Balance & Variations (PVR Ex. 50–51, p. 223–225):**
   * Moon at `2 Aq 23` (Dhanishtha 3rd pada, adv $= 9^\circ 03'$, $f_{\text{rem}} = 257/800 = 0.32125$).
   * Standard (Mars 7y): `2.24875 yrs` (`2y 2m 29d 33g`). 4th star (Saturn 19y): `6.10375y`. 5th star (Mercury 17y): `5.46125y`. 8th star (Sun 6y): `1.9275y`.
2. **Ashtottari Balance (PVR Ex. 59, p. 239–240):**
   * Moon at `24 Le 00` ($144^\circ$, Arc 2 Moon `120°–160°`, $f_{\text{rem}} = 16/40 = 0.4$) $\rightarrow$ Moon balance $= 15 \times 0.4 = \mathbf{6\text{ years}}$.
3. **Kalachakra Balance & Deha/Jeeva (PVR Ex. 95–96 & Ex. 34, p. 305–307, 321):**
   * Moon `15 Ta 50` (Rohini P2, Apasavya-1, 83y): $f_{\text{elapsed}} = 0.75 \rightarrow 62.25\text{y}$ elapsed $\rightarrow$ **Sc** balance `4.75 yrs`; Jeeva=`Sc`, Deha=`Sg`.
   * Moon `3 Cn 00` (Punarvasu P4, Savya-1, 86y): $f_{\text{elapsed}} = 0.9 \rightarrow 77.4\text{y}$ elapsed $\rightarrow$ **Pi** balance `8.6 yrs`; Deha=`Pi`, Jeeva=`Ar`.
   * Moon `5 Aq 50` (Dhanishtha P4, Apasavya-2, 100y): $f_{\text{elapsed}} = 0.75 \rightarrow 75\text{y}$ elapsed $\rightarrow$ **Ge** balance `2 yrs`, followed by `Ta (16), Ar (7), Sg (10)...`.