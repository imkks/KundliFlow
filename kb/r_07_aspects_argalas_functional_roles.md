---
route_id: "R-07"
module_name: "Aspects (Graha & Rasi Drishti), Argalas, Functional Nature & Baadhakas"
dependencies: ["R-02", "R-05"]
primary_source: "vedic_astro_textbook.pdf (PVR Ch. 10, p. 112–123; Ch. 13.2–13.3, p. 178–181; Fig. 2; Tables 30–31)"
secondary_source: "Elements of Vedic Astrology (Charak Ch. VI, XIX)"
conflict_policy: "Both Graha Drishti and Rasi Drishti operate simultaneously with distinct roles; Ketu reverses Argala counting"
---

# Aspects (Graha & Rasi Drishti), Argalas, Functional Nature & Baadhakas

## 1. Core Concepts & Definitions

* **Influence Hierarchy (Weakest $\rightarrow$ Strongest):**
  1. **Rasi Drishti (Sign Aspect):** Environmental / neighbor-like influence due to the *sign* occupied. Always mutual (`X` aspects `Y` $\iff$ `Y` aspects `X`).
  2. **Graha Drishti (Planetary Aspect):** Concrete, deliberate influence due to the *planet's* inherent nature.
  3. **Argala (Decisive Intervention — "A Bolt"):** Factors that *decisively intervene* to make or break a house/planet's affairs.
* **Natural vs. Functional Nature:** Natural benefic/malefic = whether a person is inherently kind/harsh. Functional benefic/malefic = whether a planet helps or harms a specific Lagna based on house lordship.
* **Yogada ("Giver of Yoga"):** Any planet that associates with (owns, occupies, or aspects) **Lagna AND Hora Lagna (`HL`)** gives wealth; any planet associating with **Lagna AND Ghati Lagna (`GL`)** gives power/authority—irrespective of functional nature.
* **Baadhaka ("Troublemaker"):** Specific house (`Baadhaka Sthaana`) and its lord (`Baadhaka`) causing obstructions to any house or Arudha Pada in any Varga.
* **Kartari ("Scissors"):** Planets in the `12th` and `2nd` houses flanking a target house/planet. Natural benefics = **Subha Kartari** (protective); natural malefics = **Paapa Kartari** (hemming/afflicting).

---

## 2. Deterministic Rules & Formulas

### 2.1 Graha Drishti (Planetary Aspects)
Counted zodiacally from the planet's Rasi (inclusive):
* **All Planets (`Sun, Moon, Mars, Merc, Jup, Ven, Sat`):** Aspect the **`7th`** house.
* **Special Full Aspects:**
  * **Mars:** Also aspects **`4th` and `8th`**.
  * **Jupiter:** Also aspects **`5th` and `9th`**.
  * **Saturn:** Also aspects **`3rd` and `10th`**.
*(Note: Rahu/Ketu aspects are primarily taken via Rasi Drishti in PVR's framework; 5th/7th/9th Graha Drishti for nodes is optional.)*

### 2.2 Rasi Drishti (Sign Aspects — Fig. 2)
* **Movable (`Ar, Cn, Li, Cp`):** Aspects all **Fixed** signs *except the adjacent one*.
  * `Ar <-> {Le, Sc, Aq}` | `Cn <-> {Sc, Aq, Ta}` | `Li <-> {Aq, Ta, Le}` | `Cp <-> {Ta, Le, Sc}`.
* **Fixed (`Ta, Le, Sc, Aq`):** Aspects all **Movable** signs *except the adjacent one*.
* **Dual (`Ge, Vi, Sg, Pi`):** Aspects all **other Dual** signs (`Ge <-> Vi <-> Sg <-> Pi`).
* Every planet in sign $S$ casts Rasi Drishti on all signs aspected by $S$ and all planets/houses inside them.

### 2.3 Argala (Intervention) & Virodhargala (Obstruction)
For any target sign/house/planet $T$:
* **Primary Argalas & Their Obstructions:**
  * **`2nd` from $T$** (basic ingredient for sustenance) $\longleftrightarrow$ obstructed by **`12th` from $T$**.
  * **`4th` from $T$** (basic driving mood/state/progress) $\longleftrightarrow$ obstructed by **`10th` from $T$**.
  * **`11th` from $T$** (catalyst for gains) $\longleftrightarrow$ obstructed by **`3rd` from $T$**.
* **Secondary Argala & Its Obstruction:**
  * **`5th` from $T$** (additional contributing factor) $\longleftrightarrow$ obstructed by **`9th` from $T$**.
* **Subha vs. Paapa Argala:** Natural benefics cast **Subhaargala** (benefic intervention); natural malefics cast **Paapaargala** (malefic intervention).
* **Net Dominance Rule:** Compare planet counts in the Argala house vs. its paired Virodhargala house. More planets win. If tied in count, compare planetary strengths (`R-08`).
* **Exceptions & Edge Cases (CRITICAL):**
  1. **Ketu Reverse-Counting Exception:** If target sign $T$ contains **Ketu**, count all Argala (`2nd, 4th, 11th, 5th`) and Virodhargala (`12th, 10th, 3rd, 9th`) houses **anti-zodiacally** (backwards) from $T$.
  2. **3rd-House Malefics Exception:** If **several natural malefics** occupy the `3rd` house from $T$, they cast **Argala** on $T$ rather than Virodhargala.

### 2.4 Functional Nature Rules
* **Trine lords (`1, 5, 9`):** Functional Benefics.
* **Upachaya-Dusthana lords (`3, 6, 11`):** Functional Malefics.
* **Quadrant lords (`4, 7, 10`):** Natural Benefics become **Functional Malefics** (*Kendradhipati Dosha*); Natural Malefics become **Functionally Neutral**.
* **`2, 8, 12` lords:** Functionally Neutral (`8th` is more malefic than `2nd`/`12th`).
* **Yogakaraka:** A single planet owning **both a Quadrant (`4,7,10`) and a Trine (`5,9`)**.

---

## 3. Lookup Tables (Structured)

### Table 30: Functional Nature of Planets by Lagna
| Lagna | Yogakaraka | Functional Benefics | Functional Neutrals | Functional Malefics |
| :---: | :--- | :--- | :--- | :--- |
| `Ar` | — | Sun, Mars, Jupiter | — | Mercury, Venus, Saturn |
| `Ta` | **Saturn** | Sun, Mercury, Saturn | Mars | Moon, Jupiter, Venus |
| `Ge` | — | Venus | Moon, Mercury, Saturn | Sun, Mars, Jupiter |
| `Cn` | **Mars** | Moon, Mars, Jupiter | Sun, Saturn | Mercury, Venus |
| `Le` | **Mars** | Sun, Mars, Jupiter | Moon | Mercury, Venus, Saturn |
| `Vi` | — | Mercury, Venus | Sun, Saturn | Moon, Mars, Jupiter |
| `Li` | **Saturn** | Mercury, Venus, Saturn | — | Sun, Mars, Jupiter |
| `Sc` | — | Moon, Jupiter | Sun, Mars | Mercury, Venus, Saturn |
| `Sg` | — | Sun, Mars | Moon, Mercury, Jupiter | Venus, Saturn |
| `Cp` | **Venus** | Venus, Mercury, Saturn | Sun | Mars, Jupiter |
| `Aq` | **Venus** | Venus, Saturn | Sun, Mercury | Moon, Mars, Jupiter |
| `Pi` | — | Moon, Mars | Jupiter | Sun, Mercury, Venus, Saturn |

*(Moon for Movable Lagnas `Ar, Li, Cp`: Waxing Moon = Functional Malefic via quadrant ownership; Waning Moon = Functionally Neutral.)*

### Table 31: Baadhaka Sthaanas & Baadhaka Lords
*(Rule: Movable $\rightarrow$ `11th`; Fixed $\rightarrow$ `9th`; Dual $\rightarrow$ `7th`)*
| Sign | Modality | Baadhaka Sthaana | Baadhaka Lord(s) |
| :---: | :--- | :---: | :--- |
| `Ar` | Movable | `Aq` (11th) | Saturn & Rahu |
| `Ta` | Fixed | `Cp` (9th) | Saturn |
| `Ge` | Dual | `Sg` (7th) | Jupiter |
| `Cn` | Movable | `Ta` (11th) | Venus |
| `Le` | Fixed | `Ar` (9th) | Mars |
| `Vi` | Dual | `Pi` (7th) | Jupiter |
| `Li` | Movable | `Le` (11th) | Sun |
| `Sc` | Fixed | `Cn` (9th) | Moon |
| `Sg` | Dual | `Ge` (7th) | Mercury |
| `Cp` | Movable | `Sc` (11th) | Mars & Ketu |
| `Aq` | Fixed | `Li` (9th) | Venus |
| `Pi` | Dual | `Vi` (7th) | Mercury |

---

## 4. Entity Relationships (Graph Edges)

* `(Planet) --[GRAHA_DRISHTI]--> (TargetSign / TargetPlanet)`
* `(SignA) --[RASI_DRISHTI]--> (SignB)`
* `(SourceSign) --[ARGALA {2nd|4th|11th|5th}]--> (TargetSign) | Unobstructed`
* `(ObstructionSign) --[VIRODHARGALA {12th|10th|3rd|9th}]--> (ArgalaSource)`
* `(Lagna) --[ASSIGNS_FUNCTIONAL_ROLE {Yogakaraka|FB|FN|FM}]--> (Planet)`
* `(HouseOrArudha) --[HAS_BAADHAKA]--> (BaadhakaSign, BaadhakaLord)`

---

## 5. Interpretive Guidelines & Modifiers

* **Career & Livelihood via Argala on Saturn (PVR Ex. 35–36, Ex. 17):** Saturn is the Karaka of livelihood/karma. Unobstructed Argalas on Saturn directly reveal the nature of work (e.g., `Venus` in `11th` from Saturn = Ronald Reagan acting/entertainment; `Mercury+Sun+Mars` in `11th` = P.V. Narasimha Rao writing + politics; `Venus+Merc` in `4th`, `Mars` in `5th`, `Rahu` in `11th` = Gianni Versace fashion design + mafia links).
* **Functional Malefics in Dusthanas:** Functional malefics placed in `3rd, 6th, 8th, 12th` produce *favorable* results by suppressing obstacles.

---

## 6. Verification Test Cases (From Source PDF)

1. **Graha & Rasi Drishti — Chart 5 Navamsa (PVR Ex. 14–15, p. 113, 121–122):**
   * `Asc/Mars/Sat=Sc, Merc=Sg, Ven=Cp, Ketu/AL=Aq, Moon=Ar, Sun=Ta, GL/HL=Ge, Rahu=Le, Jup=Vi`.
   * *Graha Drishti:* Sun $\rightarrow$ `Sc (Mars, Sat)`; Mars $\rightarrow$ `Aq, Ta, Ge (Ketu, Sun)`; Jup $\rightarrow$ `Cp, Pi, Ta (Ven, Sun)`; Sat $\rightarrow$ `Cp, Ta, Le (Ven, Sun, Rahu)`.
   * *Rasi Drishti:* Sun (`Ta`) $\rightarrow$ `Cn, Li, Cp (Ven)`; Moon (`Ar`) $\rightarrow$ `Le, Sc, Aq (Rahu, Mars, Sat, Ketu)`; Merc (`Sg`) $\rightarrow$ `Pi, Ge, Vi (Jup)`.
2. **Argala with Ketu Reverse Exception — Chart 5, 4th House `Aq` (PVR Ex. 16, p. 122):**
   * `Aq` contains **Ketu** $\rightarrow$ count **anti-zodiacally**: `2nd`=`Cp` (Venus), `4th`=`Sc` (Mars, Sat), `11th`=`Ar` (Moon); Virodhargalas: `12th`=`Pi` (none), `10th`=`Ta` (Sun), `3rd`=`Sg` (Merc).