---
route_id: "R-05"
module_name: "Houses (Bhavas), Reference Frames, Karakas & Family Derivation"
dependencies: ["R-02", "R-03", "R-04"]
primary_source: "vedic_astro_textbook.pdf (PVR Ch. 7–8, p. 79–96; Ch. 13.4.2, p. 182–183; Tables 12–17)"
secondary_source: "Elements of Vedic Astrology (Charak Ch. VII, XVII, XVIII)"
conflict_policy: "Whole-Sign Houses (Bhava = Rasi) default across all 20 Vargas; never mix Chara, Sthira, and Naisargika Karakas"
---

# Houses (Bhavas), Reference Frames, Karakas & Family Derivation

## 1. Core Concepts & Definitions

* **Whole-Sign House Counting:** Given any reference sign $R_{\text{ref}} \in \{1,\dots,12\}$, that sign is House 1. Any target sign $R_{\text{target}}$ occupies House:
  $$H = ((R_{\text{target}} - R_{\text{ref}}) \bmod 12) + 1$$
  Default reference when unspecified is **Lagna (Ascendant)**.
* **Bhavat Bhavam (House-from-House Concatenation):** Meanings compose recursively. Examples: `3rd` = younger sibling $\rightarrow$ `4th` (`2nd` from `3rd`) = younger sibling's wealth/speech; `9th` (`7th` from `3rd`) = younger sibling's spouse; `4th` (`6th` from `11th`) = enemies/diseases of friends; `3rd` (`12th` from `4th`) = expenditure on home/vehicles.
* **Domain Coloring:** The exact signification of a house depends on **both** the Divisional Chart (`D-n`) and the Reference Frame (e.g., `4th` in `D24` = education, `D16` = vehicle, `D4` = house/property, `D12` = mother).
* **Three Distinct Karaka Systems (Presided by Trimurti — NEVER MIX):**
  1. **Naisargika Karakas (9 planets, Brahma):** Everything in creation (impersonal things + people). Used for general *Phalita Jyotish*. Count the **relevant house FROM the Karaka** (e.g., `7th` from Venus = marriage; `5th` from Jupiter = progeny).
  2. **Chara Karakas (8 planets, Sun–Rahu, Vishnu):** People playing key roles in sustenance, achievements, Raja Yogas, and karmic continuity across lives (Ketu excluded as moksha-karaka). The **Karaka itself** represents the person (e.g., `DK` itself = spouse, NOT `7th` from DK).
  3. **Sthira Karakas (7 planets, Sun–Saturn, Shiva):** Physical bodies of near relatives for **timing death** (used with Shoola Dasa). The **Karaka itself** represents the relative's physical body.

---

## 2. Deterministic Rules & Formulas

### 2.1 Special House Categories (Applicable from Any Reference or House)
* **Trikonas (Trines — Prosperity / Goddess Lakshmi):** `1, 5, 9` (planets in mutual trines make each other prosper).
  * *Four Purusharthas (Life Goals):*
    * **Dharma Trikona:** `1, 5, 9` (duty, character, intelligence, righteousness).
    * **Artha Trikona:** `2, 6, 10` (wealth, service, career).
    * **Kaama Trikona:** `3, 7, 11` (desire, persistence, relationships, gains).
    * **Moksha Trikona:** `4, 8, 12` (harmony, occult/transformation, liberation).
* **Kendras (Quadrants — Sustenance / Lord Vishnu):** `1, 4, 7, 10` (planets in mutual quadrants sustain each other).
* **Panapharas (Succedants):** `2, 5, 8, 11`.
* **Apoklimas (Cadents):** `3, 6, 9, 12`.
* **Upachayas (Growth & Gains):** `3, 6, 10, 11`.
* **Dusthanas / Trik Sthanas (Obstacles & Setbacks):** `6, 8, 12` (weak Dusthana lord = easy sailing; fortified/malefic Dusthana = severe obstacles).
* **Chaturasras:** `4, 8`.
* **Visible vs. Invisible Half:** `7, 8, 9, 10, 11, 12` = **Visible half** (materially manifest results); `1, 2, 3, 4, 5, 6` = **Invisible half** (internal/less visible results).

### 2.2 Chara Karaka Computation (8-Karaka Scheme)
1. Take `Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu`.
2. Compute each planet's degree advancement within its `D1` Rasi:
   * For `Sun..Saturn`: $\text{adv} = \lambda \bmod 30^\circ$.
   * For `Rahu`: $\text{adv} = 30^\circ - (\lambda_{\text{Rahu}} \bmod 30^\circ)$ *(measured from the end of its Rasi)*.
3. Sort in **strictly decreasing order** of $\text{adv}$ (compare degrees $\rightarrow$ minutes $\rightarrow$ seconds).
4. Assign ranks `1..8` to `AK, AmK, BK, MK, PiK, PK, GK (JK), DK`.
* **Tie Exception:** If two planets have identical longitude down to the second, they share the same Karakatwa, the next Karakatwa becomes vacant, and the corresponding **Sthira Karaka** substitutes for the vacant role.

### 2.3 Family Member Derivation Inside Native's Vargas (PVR Ch. 13.4.2)
To inspect a relative's life from the native's chart, open the corresponding Varga and treat the **sign occupied by the relevant house lord** (or its **Arudha Pada**) as that relative's **Lagna**:
* **Parents (`D12`):** Father = `9th` lord or `A9`; Mother = `4th` lord or `A4`.
* **Spouse & In-Laws (`D9`):** `7th` house / `7th` lord / `UL`.
* **Siblings (`D3`):**
  * Direction: **Forward** if `D3` Lagna is **odd**; **Backward** if `D3` Lagna is **even**.
  * *Younger siblings:* `3rd` lord (1st younger), `5th` lord (2nd younger), `7th` lord (3rd younger), stepping by $+2$ houses.
  * *Elder siblings:* `11th` lord (1st elder), `9th` lord (2nd elder), `7th` lord (3rd elder), stepping by $-2$ houses.
* **Children (`D7`):**
  * Direction: **Forward** if `D7` Lagna is **odd**; **Backward** if `D7` Lagna is **even**.
  * *Children sequence:* `5th` lord (1st child), `7th` lord (2nd child), `9th` lord (3rd child), stepping by $+2$ houses.
  * *Wrap-around Note:* After covering all 6 odd (or even) signs, transition into the opposite parity signs rather than repeating the starting sign.

---

## 3. Lookup Tables (Structured)

### Table 5A: 12 Houses — General & Medical Significations (PVR Ch. 7.2 + Charak Ch. VII)
| House | Core General Significations | Medical / Anatomical Significations |
| :---: | :--- | :--- |
| **1st** | Physical body, complexion, appearance, intelligence, strength, energy, fame, success, nature of birth | Head, overall constitution & vitality |
| **2nd** | Wealth, assets, family, speech, voice, food, grooming/samskara, maraka | Face, eyes (right eye), mouth, teeth |
| **3rd** | Younger siblings, confidants, courage, mental strength, communication, writing, creativity, short travels, father's death (`7th` from `9th`), vehicle/home expenses (`12th` from `4th`) | Throat, ears (right ear), arms, shoulders, upper limbs |
| **4th** | Mother, vehicles, house, lands, immovable property, motherland, childhood, education, happiness, comforts, peace of mind | Heart, chest, lungs, breast |
| **5th** | Children, poorvapunya (past-life merit), intelligence, scholarship, devotion, mantras, authority/power, following, fame, love, emotions, judgment, speculation | Stomach, digestive system, upper abdomen, liver, gall bladder |
| **6th** | Enemies, rivals, service, servants, litigation, mental tension, injuries, diseases, agriculture, accidents, maternal uncle | Hips, intestines, acute illness |
| **7th** | Marriage, marital life, spouse, sex/passion, long journeys, business partners, overt enemies, maraka/death | Below navel, lower urinary tract, reproductive/sexual act |
| **8th** | Longevity, debts, chronic disease, ill-fame, inheritance, occult studies, secrets, windfalls, disgrace, suddenness, hard work | Genitals, chronic/incurable diseases, non-healing wounds |
| **9th** | Father, teacher/guru, boss, fortune, religion, spirituality, God, higher studies, foreign fortune/trips, diksha, grandchildren, dharma, intuition, charity | Thighs, hips |
| **10th** | Growth, profession, career, karma (action), conduct in society, fame, honors, awards, self-respect, dignity | Knees |
| **11th** | Elder siblings, income, gains, realization of hopes, friends | Ankles, legs, left ear |
| **12th** | Losses, expenditure, punishment, imprisonment, hospitalization, bed pleasures, sleep, meditation, donation, secret enemies, foreign residence, moksha | Feet, left eye |

### Table 5B: The 9 Reference Frames (PVR Ch. 7.3)
| Reference Frame | Definition | Perspective / What It Reveals |
| :--- | :--- | :--- |
| **Lagna (Asc)** | Rising sign | True conceptual self, intentions, scholarship (`5th` in D24) |
| **Chandra Lagna** | Moon's sign | Mind, emotional view, ambition, mental experience |
| **Ravi Lagna** | Sun's sign | Soul, physical vitality, long-term themes |
| **Arudha Lagna (AL)** | `A1` | World's perception, status, success in competition (`5th` from AL in D24) |
| **Paaka Lagna** | Lagna Lord's sign | Physical self, bodily vitality, physical memory (`5th` from Paaka in D24) |
| **Karakamsa Lagna** | `AK`'s sign in `D9` | Inner self & soul evolution (`12th` from Karakamsa = moksha & Ishta Devata) |
| **Ghati Lagna (GL)** | Special Lagna | Power, authority, political/career fame |
| **Hora Lagna (HL)** | Special Lagna | Wealth, money, material prosperity |
| **Graha Lagnas** | Natural Karaka's sign | Domain-specific perspective (use when Karaka is stronger than Lagna) |

### Table 12 & 15: Primary Naisargika Karakas (House-from-Planet)
| Planet | Houses Seen From Planet (Table 12) | Primary Naisargika Karakatwas (Tables 15–16) |
| :--- | :--- | :--- |
| **Sun** | `1st, 9th, 10th, 11th` | Self, soul, health (`1st`); fame, power (`5th`); father, boss (`9th`); career, achievements (`10th`) |
| **Moon** | `1st, 2nd, 4th, 9th, 11th` | Mind (`1st`); mother, peace of mind (`4th`); friends (`11th`) |
| **Mars** | `3rd, 6th` | Courage, younger siblings (`3rd`); real estate (`4th`); Nyaya/speculation (`5th`); enemies, accidents, loans (`6th`) |
| **Mercury** | `6th, 10th` | Speech (`2nd`); learning (`4th`); memory, scholarship, students (`5th`); work, honors (`10th`); credits (`11th`) |
| **Jupiter** | `2nd, 5th, 9th, 11th` | Family, wealth (`2nd`); traditional learning (`4th`); children, intelligence (`5th`); guru, religion, fortune (`9th`); elder brother, gains (`11th`) |
| **Venus** | `7th` | Vehicles (`4th`); spouse, marital bliss (`7th`); bed pleasures (`12th`) |
| **Saturn** | `8th, 12th` | Following (`5th`); servants (`6th`); longevity, troubles (`8th`); losses, hospitalization (`12th`) |
| **Rahu** | — | Accidents (`6th`); occult knowledge (`8th`); pilgrimages, foreign travel (`9th`) |
| **Ketu** | — | Occult knowledge (`8th`); pilgrimages, foreign travel (`9th`); moksha (`12th`) |

### Table 13: Chara Karakas (8 Variable Significators)
| Rank | Karaka | Symbol | Persons / Roles Shown |
| :---: | :--- | :---: | :--- |
| 1 (Highest) | Atma Karaka | `AK` | Self / Soul (king of chart; past-life karma link) |
| 2 | Amatya Karaka | `AmK` | Ministers, advisors, counselors, career guides |
| 3 | Bhratri Karaka | `BK` | Siblings, guru |
| 4 | Matri Karaka | `MK` | Mother |
| 5 | Pitri Karaka | `PiK` | Father, boss |
| 6 | Putra Karaka | `PK` | Children, subordinates, followers |
| 7 | Jnaati Karaka | `GK` (`JK`) | Rivals, enemies, paternal cousins |
| 8 (Lowest) | Dara Karaka | `DK` | Spouse |

### Table 5C: Sthira Karakas (7 Fixed Significators — For Timing Death Only)
| Planet | Relative(s) Signified (Physical Body) |
| :--- | :--- |
| **Sun or Venus** *(stronger)* | Father |
| **Moon or Mars** *(stronger)* | Mother |
| **Mars** | Younger siblings, brother-in-law, sister-in-law |
| **Mercury** | Maternal relatives (maternal uncles & aunts) |
| **Jupiter** | Husband, sons, paternal grandparents, paternal uncles/aunts |
| **Venus** | Wife, father-in-law, mother-in-law, maternal grandparents |
| **Saturn** | Elder siblings *(some scholars: children)* |

---

## 4. Entity Relationships (Graph Edges)

* `(ReferenceFrame, HouseIndex) --[EVALUATED_IN_VARGA]--> (DomainMeaning)`
* `(CharaKaraka AK) --[OCCUPIES_IN_D9]--> (KarakamsaSign)`
* `(KarakamsaSign) --[12TH_HOUSE_STRONGEST_PLANET]--> (IshtaDevata / MokshaPath)`
* `(NaisargikaKaraka) --[COUNT_HOUSE_FROM]--> (TargetHouse) | When Karaka > Lagna`
* `(SthiraKaraka) --[TRINES_IN_SHOOLA_DASA]--> (DeathWindowOfRelative)`

---

## 5. Interpretive Guidelines & Modifiers

* **Marriage vs. Death of Spouse Trap:** Use `7th` from **Venus** (Naisargika) for timing marriage in *both* male and female charts. Use **Jupiter** (female) and **Venus** (male) as **Sthira Karakas** *only* for timing death of spouse.
* **Classical Lord-in-House / Planet-in-House Retrieval (Charak Ch. XVII–XVIII):** When querying `lord_of_house X in house Y` or `planet P in house H`, always modify raw classical text by functional nature, dignity, Varga confirmation (`D9` + domain Varga), and active Dasha.

---

## 6. Verification Test Cases (From Source PDF)

1. **Chara Karakas (PVR Ex. 28, Table 14, p. 93):**
   * `Sun 12Ge47, Moon 20Ar28, Mars 13Ge51, Merc 25Ge18, Jup 5Ta40, Ven 17Ge21, Sat 2Ta28, Rahu 1Cn43`.
   * Rahu adv $= 30^\circ - 1^\circ 43' = 28^\circ 17'$.
   * Expected Order: `AK=Rahu, AmK=Merc, BK=Moon, MK=Ven, PiK=Mars, PK=Sun, GK=Jup, DK=Sat` *(note: PVR Table 14 row 8 prints "Venus" by typo for `2°28'`, which is Saturn)*.
2. **Chara Karakas (PVR Ex. 11, Table 17, p. 96):**
   * `Sun 9Sg36, Moon 15Le29, Mars 13Ar40, Merc 21Sc00, Jup 2Aq06, Ven 17Sg42, Sat 9Sc41, Rahu 14Ge30`.
   * Expected: `AK=Merc (21°00'), AmK=Ven (17°42'), BK=Rahu (15°30'), MK=Moon (15°29'), PiK=Mars (13°40'), PK=Sat (9°41'), GK=Sun (9°36'), DK=Jup (2°06')`.
3. **Sibling Derivation in D3 (PVR Ex. 45, Chart 14, p. 187–188):**
   * Rajiv Gandhi's `D3` Lagna = `Sg` (odd $\rightarrow$ forward) $\rightarrow$ `3rd` house = `Aq` $\rightarrow$ Lord Saturn in `Li` $\rightarrow$ Treat `Li` as younger brother Sanjay Gandhi's Lagna (exalted Saturn in Lagna, Rahu in 10th, Moon+Jup+Ven in 3rd).