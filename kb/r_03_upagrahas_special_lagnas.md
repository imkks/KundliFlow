---
route_id: "R-03"
module_name: "Upagrahas (Sub-Planets) & Special Lagnas"
dependencies: ["R-01"]
primary_source: "vedic_astro_textbook.pdf (PVR Ch. 4–5, p. 53–62; Tables 9–10)"
secondary_source: "Elements of Vedic Astrology (Charak Ch. XI, XXI)"
conflict_policy: "Sunrise defined as appearance of upper tip of Sun's disk (first ray); Kaala/Mrityu/Arthaprahara/Yamaghantaka/Gulika rise at midpoint of their 1/8th part, Maandi at start of Saturn's part"
---

# Upagrahas (Sub-Planets) & Special Lagnas

## 1. Core Concepts & Definitions

* **Upagrahas (11 Sub-Planets):** Non-physical mathematical points defined by Parashara in two groups:
  1. **5 Sun-based Upagrahas (Dhoomadi group):** `Dhuma, Vyatipaata, Parivesha, Indrachaapa, Upaketu`. All 5 are strongly malefic and spoil houses they occupy in D1 or Divisional Charts.
  2. **6 Time-based Upagrahas (Gulikadi group):** `Kaala` ($\approx$ Sun, malefic), `Mrityu` ($\approx$ Mars, malefic), `Arthaprahaara` ($\approx$ Mercury), `Yamaghantaka` ($\approx$ Jupiter), `Gulika` & `Maandi` ($\approx$ Saturn, malefic).
* **Special Lagnas (4 Core Points):** Alternative reference ascendants representing specific dimensions of the self:
  * **Bhava Lagna (BL):** Moves at $1\text{ sign} / 2\text{ hours}$ ($1^\circ / 4\text{ min}$).
  * **Hora Lagna (HL):** Moves at $1\text{ sign} / 1\text{ hour}$ ($0.5^\circ / \text{min}$). Shows self from the perspective of **wealth, money, and prosperity**.
  * **Ghati Lagna (GL):** Moves at $1\text{ sign} / 1\text{ ghati (24 min)}$ ($1.25^\circ / \text{min}$). Shows self from the perspective of **power, authority, and fame**.
  * **Sree Lagna (SL):** Lakshmi Sthana; shows **prosperity** and anchors **Sudasa**.

---

## 2. Deterministic Rules & Formulas

### 2.1 Five Sun-Based Upagrahas (Table 9)
All results normalized to $[0^\circ, 360^\circ)$ via $\bmod 360^\circ$:
$$\lambda_{\text{Dhuma}} = (\lambda_{\text{Sun}} + 133^\circ 20') \bmod 360^\circ$$
$$\lambda_{\text{Vyatipaata}} = (360^\circ - \lambda_{\text{Dhuma}}) \bmod 360^\circ$$
$$\lambda_{\text{Parivesha}} = (\lambda_{\text{Vyatipaata}} + 180^\circ) \bmod 360^\circ$$
$$\lambda_{\text{Indrachaapa}} = (360^\circ - \lambda_{\text{Parivesha}}) \bmod 360^\circ = (\lambda_{\text{Dhuma}} + 180^\circ) \bmod 360^\circ$$
$$\lambda_{\text{Upaketu}} = (\lambda_{\text{Indrachaapa}} + 16^\circ 40') \bmod 360^\circ = (\lambda_{\text{Sun}} - 30^\circ) \bmod 360^\circ$$

### 2.2 Six Day/Night 8-Part Upagrahas (Table 10)
1. Determine if birth is **Daytime** (`sunrise <= birth < sunset`) or **Nighttime** (`sunset <= birth < next_sunrise`).
2. Divide the exact duration of that Day (or Night) into $8$ equal segments of duration $\Delta t = D / 8$.
3. Identify the ruling planet of each segment using Table 10 (7 planets + 1 lord-less segment):
   * *Daytime:* Segment 1 = Weekday lord; then follow weekday order (`Sun -> Moon -> Mars -> Merc -> Jup -> Ven -> Sat -> [None] -> wrap`).
   * *Nighttime:* Segment 1 = 5th planet from Weekday lord; then follow weekday order with `[None]` after Saturn.
4. Compute the rising Ascendant (Lagna) at the target timestamp:
   * **Kaala:** Ascendant at **midpoint** of Sun's segment.
   * **Mrityu:** Ascendant at **midpoint** of Mars's segment.
   * **Artha Praharaka:** Ascendant at **midpoint** of Mercury's segment.
   * **Yama Ghantaka:** Ascendant at **midpoint** of Jupiter's segment.
   * **Gulika:** Ascendant at **midpoint** of Saturn's segment.
   * **Maandi:** Ascendant at **beginning** of Saturn's segment.

### 2.3 Special Lagnas (BL, HL, GL, SL)
Let $t_{\text{elapsed}}$ be minutes elapsed from local **sunrise** to birth time, and $\lambda_{\text{Sun,sr}}$ be Sun's sidereal longitude at sunrise:
$$\lambda_{\text{BL}} = \left(\lambda_{\text{Sun,sr}} + \frac{t_{\text{elapsed}}}{4}\right) \bmod 360^\circ \quad \text{(Note: PVR p. 57 states } 1^\circ/\text{4m = } 15^\circ/\text{hr; wait: see note below)}$$
*(Correction Check on PVR p. 57: PVR text states "moves at $1^\circ$ per 4 minutes, i.e., $15^\circ$ per hour", though step 2 on p. 57 accidentally omits dividing minutes by 4 in Example 7. Use the astronomical definition: $1\text{ sign}/2\text{ hr} = 15^\circ/\text{hr} = 0.25^\circ/\text{min}$.)*
$$\lambda_{\text{HL}} = \left(\lambda_{\text{Sun,sr}} + \frac{t_{\text{elapsed}}}{2}\right) \bmod 360^\circ \quad (30^\circ/\text{hr} = 0.5^\circ/\text{min})$$
$$\lambda_{\text{GL}} = \left(\lambda_{\text{Sun,sr}} + \frac{5 \cdot t_{\text{elapsed}}}{4}\right) \bmod 360^\circ \quad (75^\circ/\text{hr} = 1.25^\circ/\text{min})$$
* **Sree Lagna (SL):**
  1. Find fraction $f \in [0, 1)$ of Moon's Nakshatra already traversed:
     $$f = \frac{(\lambda_{\text{Moon}} \times 60) \bmod 800}{800}$$
  2. Add $f \times 360^\circ$ to natal Lagna:
     $$\lambda_{\text{SL}} = (\lambda_{\text{Asc}} + f \times 360^\circ) \bmod 360^\circ$$

### 2.4 Optional Secondary Lagnas (Charak Ch. XI & XXI)
* **Pranapada (Charak Ch. XI):** Convert birth time after sunrise to Vighatis ($1\text{ hr} = 150\text{ vighatis}$), divide by $15$ to get signs/degrees, and add to Sun's longitude (if Sun is in Movable), Sun $+ 240^\circ$ (if Fixed), or Sun $+ 120^\circ$ (if Dual).
* **Indu Lagna (Charak Ch. XXI — Wealth):** Sum Kalas of 9th lord from Lagna and 9th lord from Moon (`Sun=30, Moon=16, Mars=6, Merc=8, Jup=10, Ven=12, Sat=1`), take $r = \text{sum} \bmod 12$ (if $0 \rightarrow 12$), and count $r$ signs from natal Moon.

### 2.5 Exceptions & Edge Cases
* **Birth Before Sunrise:** If birth is at e.g. `3:11 AM` on May 28, use **May 27's sunrise** and May 27's weekday! ($t_{\text{elapsed}}$ will be $> 12$ hours, e.g., $20\text{h } 52\text{m } 30\text{s}$).
* **High Sensitivity of GL:** A $1$-minute birthtime error shifts GL by $1^\circ 15'$ (shifts GL across a D10 boundary in $2.4$ minutes). Always rectify birthtime before relying on GL in Divisional Charts.

---

## 3. Lookup Tables (Structured)

### Table 10: Ruling Planets of the 8 Parts of Day & Night
| Weekday | Day: 1st | 2nd | 3rd | 4th | 5th | 6th | 7th | 8th |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Sunday** | Sun | Moon | Mars | Merc | Jup | Ven | Sat | *(None)* |
| **Monday** | Moon | Mars | Merc | Jup | Ven | Sat | *(None)* | Sun |
| **Tuesday** | Mars | Merc | Jup | Ven | Sat | *(None)* | Sun | Moon |
| **Wednesday** | Merc | Jup | Ven | Sat | *(None)* | Sun | Moon | Mars |
| **Thursday** | Jup | Ven | Sat | *(None)* | Sun | Moon | Mars | Merc |
| **Friday** | Ven | Sat | *(None)* | Sun | Moon | Mars | Merc | Jup |
| **Saturday** | Sat | *(None)* | Sun | Moon | Mars | Merc | Jup | Ven |

| Weekday | Night: 1st | 2nd | 3rd | 4th | 5th | 6th | 7th | 8th |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Sunday** | Jup | Ven | Sat | *(None)* | Sun | Moon | Mars | Merc |
| **Monday** | Ven | Sat | *(None)* | Sun | Moon | Mars | Merc | Jup |
| **Tuesday** | Sat | *(None)* | Sun | Moon | Mars | Merc | Jup | Ven |
| **Wednesday** | Sun | Moon | Mars | Merc | Jup | Ven | Sat | *(None)* |
| **Thursday** | Moon | Mars | Merc | Jup | Ven | Sat | *(None)* | Sun |
| **Friday** | Mars | Merc | Jup | Ven | Sat | *(None)* | Sun | Moon |
| **Saturday** | Merc | Jup | Ven | Sat | *(None)* | Sun | Moon | Mars |

---

## 4. Entity Relationships (Graph Edges)

* `(Planet) --[ASSOCIATES_WITH_LAGNA_AND]--> (HL) | Conjunction/Aspect/Ownership` $\rightarrow$ `Yogada (Wealth)`
* `(Planet) --[ASSOCIATES_WITH_LAGNA_AND]--> (GL) | Conjunction/Aspect/Ownership` $\rightarrow$ `Yogada (Power/Authority)`
* `(SL) --[SEEDS]--> (Sudasa)`
* `(MaleficUpagraha {Dhuma..Upaketu, Gulika, Maandi, Kaala, Mrityu}) --[AFFLICTS]--> (OccupiedHouse)`

---

## 5. Interpretive Guidelines & Modifiers

* **Domain Routing:** Use **HL** when timing financial/business surges; use **GL** when timing career promotions, elections, and public fame; use **SL** for Sudasa prosperity timing.
* **Divisional Propagation:** Special Lagnas and Upagrahas have exact longitudes and are mapped into **all 20 Divisional Charts** just like planets.

---

## 6. Verification Test Cases (From Source PDF)

1. **Sun-based Upagrahas (PVR Example 6 & Ex. 7, p. 53–56):**
   * Sun=`9 Sg 36` ($249^\circ 36'$) $\rightarrow$ Dhuma=`22 Ar 56`, Indrachapa=`22 Li 56`, Vyatipata=`7 Pi 04`, Parivesha=`7 Vi 04`.
   * Sun=`13 Ta 19` $\rightarrow$ Dhuma=`26 Vi 39`, Vyatipata=`3 Li 21`, Parivesha=`3 Ar 21`, Indrachapa=`26 Pi 39`, Upaketu=`19 Sc 01` *(note: $356^\circ 39' + 16^\circ 40' = 13^\circ 19' \text{ Ar}$ vs. Sun $- 30^\circ = 13^\circ 19' \text{ Ar}$; verify $360^\circ - 183^\circ 21' = 176^\circ 39' \text{ Vi}$? Wait: Dhuma = $43^\circ 19' + 133^\circ 20' = 176^\circ 39'$ = `26 Vi 39`; Vyatipata = $183^\circ 21'$ = `3 Li 21`; Parivesha = `3 Ar 21`; Indrachapa = `26 Pi 39`; Upaketu = `26 Pi 39` + $16^\circ 40'$ = `13 Ar 19`. PVR Ex. 7 answer `19 Sc 01` is an erratum in the book; enforce the exact formula $\lambda_{\text{Sun}} - 30^\circ$).*
2. **HL & GL (PVR Examples 8–9 & Ex. 8, p. 58–62):**
   * Birth `7:23 PM`, Sunrise `6:37 AM` ($766\text{ min}$), Sunrise Sun=`24 Cp 17` $\rightarrow$ **HL = `17 Aq 17`**, **GL = `21 Vi 47`**.
   * Birth `3:11:48 AM` May 28, 1961; Sunrise `6:19:18 AM` May 27 ($1252.5\text{ min}$); Sunrise Sun=`12 Ta 11` $\rightarrow$ **HL = `8 Aq 26`**, **GL = `17 Vi 48.5`**.
3. **Sree Lagna (PVR Example 10 & Ex. 10, p. 61–62):**
   * Moon=`13 Li 06` (Swati, $f = 0.4825$), Lagna=`25 Vi 05` $\rightarrow$ **SL = `18 Pi 47`**.
   * Moon=`15 Le 29`, Lagna=`14 Sc 19` $\rightarrow$ **SL = `12 Cp 22`**.