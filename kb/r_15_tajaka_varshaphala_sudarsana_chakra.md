---
route_id: "R-15"
module_name: "Tajaka (Varshaphala) Annual/Monthly/60-Hr Charts, 16 Yogas, Annual Dasas & Sudarsana Chakra"
dependencies: ["R-01", "R-04", "R-11", "R-12"]
primary_source: "vedic_astro_textbook.pdf (PVR Ch. 27–31, p. 379–427; Tables 71–76; Fig. 4; Charts 66–74)"
secondary_source: "Elements of Vedic Astrology (Charak Ch. XXV, XXXI); Companion Advanced Module: R-20 (M.S. Mehta & K.N. Rao)"
conflict_policy: "Cast all Tajaka charts at BIRTHPLACE coordinates using exact non-linear Lahiri Ayanamsha; expose TAJAKA_SCHOOL: PVR | NEELAKANTHA_MEHTA (see R-20 for Neelakantha variants, Tri-Pataki Chakra, Dwi-Janma Year & Annual House/Dasha rules)"
---

# Tajaka (Varshaphala) Charts, 16 Yogas, Annual Dasas & Sudarsana Chakra

## 1. Core Concepts & Definitions

* **Tajaka Solar Return System:** Evaluates a focused time window by casting a full horoscope (D1 + all 20 Vargas) at **birthplace coordinates** whenever Sun returns to its exact natal longitude (or fixed increments thereof):
  * **Annual Chart (`Varsha Pravesh`):** Every $360^\circ$ of Sun's motion (1 solar year).
  * **Monthly Chart (`Maasa Pravesh`):** Every $30^\circ$ of Sun's motion (12 per year).
  * **Sixty-Hour Chart (`Shashti-Hora`):** Every $2^\circ 30'$ of Sun's motion (12 per month $\approx 2.5$ days).
* **Subservience Rule:** Tajaka charts deliver events **only if** those events are already promised in the natal chart and supported by natal Dasas. *(For Tri-Pataki Chakra, Dwi-Janma Year, Moon Varsheswara disqualification, Annual Yogini Dasa, 12-House Annual Interpretation, and K.N. Rao's 4-Point Varshaphala Synthesis, load companion module **`R-20`**.)*
* **Sudarsana Chakra (`SC`):** 3 concentric rings showing all 12 houses simultaneously from **Lagna** (body), **Moon** (mind), and **Sun** (soul). Its 12-year Dasa (`1 yr MD / 1 mo AD / 2.5 day PD`) uses Tajaka Annual/Monthly/60-Hour charts as its **entry charts**.

---

## 2. Deterministic Rules & Formulas

### 2.1 Muntha & Tajaka Aspects / Deeptamsa Orbs (PVR Ch. 28.1–28.2)
* **Muntha:** Progress natal Lagna forward by **1 sign per completed year**:
  $$\text{Muntha} = ((\text{Natal\_Lagna} + \text{Completed\_Years} - 1) \bmod 12) + 1$$
  * *House Results from Annual Lagna:* `9, 10, 11` = excellent (prosperity/status/gains); `1, 2, 3, 5` = good; `6, 8, 12` = bad (illness/trouble/loss); `4` = disputes/loss of position; `7` = marital/hardship. *(See `R-20` for Rahu's Face/Back/Tail & Birth-Chart half-year Muntha timing.)*
* **6 Tajaka Aspects:** `5/9` (Trine — strong benefic), `3/11` (Sextile — weak benefic), `4/10` (Square — weak malefic), `1` (Conjunction — strong malefic), `7` (Opposition — strong malefic), `2/12` (Semi-sextile — neutral).
* **Deeptamsa (Aspect Orbs):** `Sun: 15°`, `Moon: 12°`, `Mars: 8°`, `Mercury: 7°`, `Jupiter: 9°`, `Venus: 7°`, `Saturn: 9°`. *(Note: `NEELAKANTHA_MEHTA` mode in `R-20` uses Mean Deeptamsa $(\text{Orb}_A + \text{Orb}_B)/2$.)*

### 2.2 Tajaka Strengths: Harsha, Pancha Vargeeya (`PVB`) & Dwadasa Vargeeya (`DVB`)
1. **Harsha Bala (0–20 units, 4 × 5 units):**
   * *(1) Sthana:* `Sun 9th, Moon 3rd, Mars 6th, Merc 1st, Jup 11th, Ven 5th, Sat 12th` (`+5`).
   * *(2) Dignity:* Own or Exaltation sign (`+5`).
   * *(3) Gender-House:* Feminine (`Moon, Merc, Ven, Sat`) in `1,2,3,7,8,9`; Masculine (`Sun, Mars, Jup`) in `4,5,6,10,11,12` (`+5`).
   * *(4) Day/Night:* Day start $\rightarrow$ Masculine (`+5`); Night start $\rightarrow$ Feminine (`+5`).
2. **Pancha Vargeeya Bala (`PVB` — PVR 3-Tier Mode):** Sum 5 components and **divide by `4`**:
   * `Kshetra (D1)`: Own `30`, Friend `15`, Enemy `7.5`.
   * `Uchcha`: $\frac{\text{arc\_from\_debil}}{180^\circ} \times 20$.
   * `Hadda` (Table `72`): Own `15`, Friend `7.5`, Enemy `3.75`.
   * `Drekkana (D3)`: Own `10`, Friend `5`, Enemy `2.5`.
   * `Navamsa (D9)`: Own `5`, Friend `2.5`, Enemy `1.25`.
   * *Scale:* `<5` weak, `5–10` ordinary, `10–15` strong, `15–20` very strong, `>20` extraordinary. *(See `R-20` for Neelakantha's 4-tier `PVB`, aspect-based friendships, and Tajaka sequential Drekkana table.)*
3. **Dwadasa Vargeeya Bala (`DVB`):** Across `D1..D12`, compute `(count of Exalt/Own/Friend) - (count of Debil/Enemy)`.

### 2.3 Varsheswara (Lord of the Year) & Lord of the Month
* **5 Candidates (Annual):** (1) Sign lord of Sun (day start) or Moon (night start) in annual chart; (2) Natal Lagna lord; (3) Muntha lord; (4) Annual Lagna lord; (5) Triraasi lord of Annual Lagna (Table `73`). *(Monthly adds Candidate 6: Varsheswara.)*
* **Selection (`PVR` Mode):** Shortlist candidates casting a **benefic Tajaka aspect** on Annual Lagna $\rightarrow$ pick highest **`PVB`** (tie-breaker: candidate appearing in more categories). Fallback: malefic aspect $\rightarrow$ highest `PVB` $\rightarrow$ Candidate 1. *(See `R-20` for `NEELAKANTHA_MEHTA` Moon disqualification & Muntha-lord fallback.)*

### 2.4 Sahams (36 Significant Points — Table 74)
Formula format $A - B + C$ (daytime); **reverse to $B - A + C$ for nighttime** *unless marked "(same for day & night)"*.
* **Mandatory $+30^\circ$ Arc Rule:** Start at $B$ and move zodiacally to $A$. If $C$ does **NOT** lie on that arc, **add $30^\circ$** to $(A - B + C) \bmod 360^\circ$. *(See `R-20` for Punya Saham priority, 6 fructification conditions, and Common Lordship rule.)*

### 2.5 The 16 Tajaka Yogas (PVR Ch. 29)
Speed order (slowest $\rightarrow$ fastest): `Saturn < Rahu/Ketu < Jupiter < Mars < Sun < Venus < Mercury < Moon`.
1. **Ishkavala:** All planets in Kendras/Panapharas (`Apoklimas` empty) $\rightarrow$ wealth/fortune.
2. **Induvara:** All planets in Apoklimas (`Kendras/Panapharas` empty) $\rightarrow$ worries/illness.
3. **Ithasala (Applying Aspect — Fulfillment):** Two planets have a Tajaka aspect within orb AND the **faster planet has lower degree** in its Rasi than the slower planet.
   * *Vartamaana:* Both within each other's Deeptamsa.
   * *Poorna:* Degree difference $\le 1^\circ$ (fastest/strongest fulfillment).
   * *Bhavishya:* Faster planet $\le 1^\circ$ away from entering slower planet's Deeptamsa.
   * **Retrograde Exceptions (CRITICAL):** If the faster planet is **retrograde** and *behind* $\rightarrow$ NO Ithasala (turns to Eesarpha). If the faster planet is **retrograde** and *ahead* $\rightarrow$ **IS Ithasala** (moving toward exact aspect). If the faster planet turns retrograde *before* catching up $\rightarrow$ NO Ithasala.
4. **Eesarpha (Separating Aspect — Failure):** Faster planet has **higher degree** than slower planet (reverse if faster is retrograde).
5. **Nakta:** Two non-aspecting/non-Ithasala planets both form Ithasala with a **faster 3rd planet** (fulfillment via 3rd party).
6. **Yamaya:** Same as Nakta, but bridged by a **slower 3rd planet** (fulfillment via 3rd party after delay).
7. **Manahoo:** Mars or Saturn conjoins the faster planet of an Ithasala within its Deeptamsa $\rightarrow$ **cancels Ithasala**.
8. **Kamboola:** Moon forms Ithasala with either/both planets in an Ithasala $\rightarrow$ **amplifies Ithasala** *(14 graded tiers in `R-20`)*.
9. **Gairi-Kamboola:** Moon at $29^\circ$–$30^\circ$ forms Ithasala immediately upon entering next sign + has Ithasala with a strong planet (Moon not exalt/debil/own D9/D3/Hadda).
10. **Khallasara:** Lagna lord sits in sign between Moon and planet $X$ with no Ithasala to either $\rightarrow$ destroys $X$'s significations.
11. **Radda:** Ithasala involving a debilitated, combust, retrograde, or weak planet $\rightarrow$ **negates Ithasala**.
12. **Duhphali-Kutta:** Faster planet in Ithasala is strong (exalt/own/high PVB) & slower is weak $\rightarrow$ realization of ambitions.
13. **Duttota:** Two weak planets in Ithasala, where one also forms Ithasala with a strong planet $\rightarrow$ **rescues into good results**.
14. **Thambira:** Planet in last degree ($29^\circ$–$30^\circ$) forms Ithasala with slower planet right after sign ingress $\rightarrow$ success after hard work.
15. **Kutta:** Planet in Lagna aspected by own/exalt planet in Kendra/Panaphara $\rightarrow$ fulfills desires of Lagna occupant.
16. **Durupha:** Ithasala between two weak/combust/retro/debilitated planets in Dusthanas (`6, 8, 12`) $\rightarrow$ powerless.

### 2.6 Three Annual Dasas (PVR Ch. 30; + Annual Yogini in `R-20`)
1. **Patyayini Dasa:** Sort `Lagna` + 7 planets by ascending degree-in-sign (`Krisamsa`). `Patyamsa` = consecutive differences (`first = krisamsa[0]`, `rest = krisamsa[i] - krisamsa[i-1]`). Sum of Patyamsas $= \max(\text{Krisamsa})$.
   $$\text{Days}_i = 365.2425 \times \frac{\text{Patyamsa}_i}{\max(\text{Krisamsa})}$$
   `AD`s start from `MD` planet itself using the same ratios. *(Works for Monthly charts too.)*
2. **Mudda Dasa (Varsha Vimsottari):** Compress 120 yrs $\rightarrow$ 360 solar days ($\times 3$ days/yr: `Sun 18, Moon 30, Mars 21, Rahu 54, Jup 48, Sat 57, Merc 51, Ketu 21, Ven 60`). Start planet $= (((\text{Birth\_MD\_Index} + \text{Completed\_Years}) - 1) \bmod 9) + 1$; balance uses natal Moon's remaining Nakshatra fraction.
3. **Varsha Narayana Dasa (Best Annual Dasa):** Compress 120 yrs $\rightarrow$ 360 solar days (`3 × n` solar days per `n` yrs). Compute exactly like Natal `D1`/Varga Narayana Dasa (`R-12`), **replacing Annual Lagna with Muntha** as the virtual Lagna!

### 2.7 Sudarsana Chakra Dasa (PVR Ch. 31 & Charak Ch. XXXI)
* **MD Sign (Running Year $Y = \text{Completed\_Years} + 1$):** House $= ((Y - 1) \bmod 12) + 1$ counted from **strongest of Lagna, Moon, Sun** (or evaluate all 3 rings; Charak restricts 3-ring method to when Lagna, Moon, Sun occupy different signs).
* **AD / PD:** `12` equal `AD`s (`1` solar month each) starting from `MD` sign zodiacally; `12` equal `PD`s (`2.5` days / 60-hr) starting from `AD` sign.
* **Interpretation (Using Tajaka Entry Chart Positions Relative to SC Dasa Sign):** Benefics in `1, 4, 5, 7, 8, 9, 10` (avoiding `6/12` per PVR, `2/12` per Charak) = favorable; Malefics in `3, 6, 11` = favorable; Rahu alone destroys occupied house.

---

## 3. Lookup Tables (Structured)

### Table 73: Triraasi Lords (Day / Night)
| Lagna | `Ar` | `Ta` | `Ge` | `Cn` | `Le` | `Vi` | `Li` | `Sc` | `Sg` | `Cp` | `Aq` | `Pi` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Day** | Sun | Ven | Sat | Ven | Jup | Moon | Merc | Mars | Sat | Mars | Jup | Moon |
| **Night** | Jup | Moon | Merc | Mars | Sun | Ven | Sat | Ven | Sat | Mars | Jup | Moon |

### Table 74: Core Sahams (Daytime Formula; Reverse $A \leftrightarrow B$ at Night Unless Marked `=`)
| Saham | Meaning | Formula | Saham | Meaning | Formula |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Punya** | Fortune | `Moon - Sun + Asc` | **Vivaha** | Marriage | `Ven - Sat + Asc` |
| **Vidya** | Education | `Sun - Moon + Asc` | **Putra** | Children | `Jup - Moon + Asc` |
| **Yasas** | Fame | `Jup - Punya + Asc` | **Rajya** | Kingdom/Power | `Sat - Sun + Asc` |
| **Artha** `=` | Money | `H2 - L2 + Asc` | **Karma** | Career/Work | `Mars - Merc + Asc` |
| **Labha** `=` | Gains | `H11 - L11 + Asc` | **Paradesa** `=` | Foreign | `H9 - L9 + Asc` |
| **Jalapatana** | Crossing ocean | `Cn 15° - Sat + Asc` | **Vyapara** `=` | Business | `Mars - Sat + Asc` |
| **Roga** | Disease | `Asc - Moon + Asc` | **Kali** | Misfortune | `Jup - Mars + Asc` |
| **Mrityu** `=` | Death | `H8 - Moon + Asc` | **Bandhana** | Imprisonment | `Punya - Sat + Asc` |
| **Karyasiddhi** | Success | Day: `Sat - Sun + L(Sun)`; Night: `Sat - Moon + L(Moon)` | **Samartha** | Enterprise | `Mars - L1 + Asc` (`Jup - Mars + Asc` if Mars = L1) |

*(All 36 Sahams & Hadda Table 72 reside in `vedic_astro_textbook.pdf`, p. 390 & 394–395.)*

---

## 4. Entity Relationships (Graph Edges)

* `(BirthChart, TargetYear) --[SOLAR_RETURN]--> (TajakaAnnualChart, Muntha, Varsheswara)`
* `(LagnaLord, SahamLord) --[ITHASALA_YOGA]--> (EventFulfillmentInYear)`
* `(SC_DasaSign) --[EVALUATED_IN]--> (TajakaEntryChart)`
* `(TajakaAnnualChart) --[EXTENDED_BY]--> (R-20: TriPataki, DwiJanma, AnnualRules)`

---

## 5. Interpretive Guidelines & Modifiers

* **Ayanamsha Non-Linearity Warning (PVR p. 382–383):** Because Lagna moves `360x` faster than Sun, a $1'$ error in Sun's longitude/ayanamsha shifts Tajaka Lagna by $6^\circ$. Always use exact non-linear Lahiri precession when computing Varsha Pravesh.

---

## 6. Verification Test Cases (From Source PDF)

1. **Varsha Pravesh, Harsha Bala, Varsheswara & Sahams (PVR Ex. 118–121, Chart 66, p. 379–396):**
   * Birth: `Mar 8, 1967, 5:40 PM IST` (`Sun = 23 Aq 50' 25''`). 34th yr Varsha Pravesh = `Mar 8, 2000, 4:41:21 AM IST`.
   * Harsha Bala: `Moon=15, Merc=10, Ven=10, Jup=5, Sat=5, Sun=0, Mars=0`. Varsheswara = **Mars** (PVB `13.7`, sextile to Cp Lagna).
   * Sahams: `Artha = 2 Sc 30` (no $+30^\circ$), `Samartha = 5 Pi 02` ($+30^\circ$ applied), `Vanik = 7 Sg 04` (no $+30^\circ$).
2. **Marriage Timing via All 3 Annual Dasas (PVR Ex. 122, Chart 67, p. 408–414):**
   * Married `Jul 24, 1993` $\rightarrow$ Patyayini = **Mercury** (`Jun 26–Aug 13`, Varsheswara & D9 7th lord); Mudda = **Jupiter** (7th & Vivaha Saham lord); D9 Varsha Narayana (Muntha=`Cp`) = **Pisces** (D9 Lagna, started `Jul 20`).
3. **Sudarsana Chakra — Indira Gandhi 1976–77 Election Loss (PVR Ex. 127, Chart 73, p. 424–425):**
   * 60th yr $\rightarrow$ `12th` house from strongest (`Sun`) = **Libra**; in 1976–77 annual chart, Rahu in `Li` (1st) and Saturn in `Cn` (10th from `Li`) $\rightarrow$ loss of power.