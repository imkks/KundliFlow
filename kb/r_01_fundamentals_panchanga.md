---
route_id: "R-01"
module_name: "Fundamentals, Coordinates & Panchanga"
dependencies: []
primary_source: "vedic_astro_textbook.pdf (PVR Ch. 1, p. 15–32; Tables 1–5; Fig. 1)"
secondary_source: "Elements of Vedic Astrology (Charak Ch. II, III, V)"
conflict_policy: "Sidereal (Nirayana) Lahiri/Chitrapaksha Ayanamsha; 9 Grahas only (exclude Uranus, Neptune, Pluto); Whole-Sign houses default"
---

# Fundamentals, Zodiac Coordinates & Panchanga

## 1. Core Concepts & Definitions

* **Zodiac (Nirayana / Sidereal):** Fixed $360^\circ$ belt measured from the start of Aries ($0^\circ 0' 0''$) to $359^\circ 59' 59''$. Tropical (Sayana) longitudes from modern ephemerides are converted to Sidereal (Nirayana) by subtracting the **Ayanamsha** (Chitrapaksha / Lahiri standard):
  $$\lambda_{\text{sidereal}} = (\lambda_{\text{tropical}} - \text{Ayanamsha}) \bmod 360^\circ$$
* **Grahas (9 Planets):** Seven physical luminaries/planets (`Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn`) plus two shadow mathematical nodes (`Rahu` = North Node, `Ketu` = South Node). Extra-Saturnine planets are strictly excluded.
* **Rasis (12 Signs):** 12 equal divisions of $30^\circ$ each.
* **Nakshatras (27 / 28 Constellations):** 27 equal divisions of $13^\circ 20'$ ($800'$). Each Nakshatra has 4 equal **Padas** (quarters) of $3^\circ 20'$ ($200'$), yielding 108 Padas total.
  * *28-Nakshatra Exception:* **Abhijit** (the last quarter/pada of Uttarashadha) is used exclusively in special charts such as **Sarvatobhadra Chakra**, **Kota Chakra**, and **Yoni Koota** matching.
* **Panchaanga (5 Limbs of Time):** `Tithi` (lunar day), `Vaara` (weekday, sunrise-to-sunrise), `Nakshatra` (Moon's constellation), `Yoga` (Sun-Moon longitudinal sum), and `Karana` (half-tithi).
* **Solar vs. Lunar Calendars:**
  * *Solar Year:* Time for Sun to move $360^\circ$ ($\approx 365.2425$ days). $1$ solar month $= 30^\circ$ Sun motion; $1$ solar day $= 1^\circ$ Sun motion.
  * *Lunar Month:* Time between consecutive exact Sun-Moon conjunctions ($\approx 29.53$ days), consisting of $30$ Tithis divided into **Sukla Paksha** (waxing, $0^\circ$–$180^\circ$) and **Krishna Paksha** (waning, $180^\circ$–$360^\circ$).

---

## 2. Deterministic Rules & Formulas

### 2.1 Rasi, Nakshatra & Pada from Sidereal Longitude ($\lambda \in [0^\circ, 360^\circ)$)
* **Rasi Index ($1$–$12$):**
  $$R = \left\lfloor \frac{\lambda}{30^\circ} \right\rfloor + 1, \quad \text{degree\_in\_rasi} = \lambda \bmod 30^\circ$$
* **Nakshatra Index ($1$–$27$):**
  $$N = \left\lfloor \frac{\lambda \times 60}{800} \right\rfloor + 1$$
* **Pada Index ($1$–$4$):**
  $$P = \left\lfloor \frac{(\lambda \times 60) \bmod 800}{200} \right\rfloor + 1$$

### 2.2 Tithi (Lunar Day)
1. Compute angular elongation:
   $$\Delta = (\lambda_{\text{Moon}} - \lambda_{\text{Sun}}) \bmod 360^\circ$$
2. Compute Tithi index ($1$–$30$):
   $$T = \left\lfloor \frac{\Delta}{12^\circ} \right\rfloor + 1$$
3. **Paksha:** If $1 \le T \le 15$, **Sukla (Suddha) Paksha**; if $16 \le T \le 30$, **Krishna (Bahula) Paksha**.

### 2.3 Sun-Moon Yoga (27 Yogas)
1. Compute longitudinal sum:
   $$S = (\lambda_{\text{Sun}} + \lambda_{\text{Moon}}) \bmod 360^\circ$$
2. Compute Yoga index ($1$–$27$):
   $$Y = \left\lfloor \frac{S \times 60}{800} \right\rfloor + 1$$

### 2.4 Karana (Half-Tithi)
Each Tithi ($12^\circ$) splits into 2 Karanas ($6^\circ$ each), giving $60$ half-tithis per lunar month:
$$K_{\text{slot}} = \left\lfloor \frac{\Delta}{6^\circ} \right\rfloor + 1 \in \{1, \dots, 60\}$$
* **Fixed (Sthira) Karanas (4, occur once/month):**
  * $K_{\text{slot}} = 1$ (1st half of Sukla Pratipat) $\rightarrow$ **Kimstughna**
  * $K_{\text{slot}} = 58$ (2nd half of Krishna Chaturdasi) $\rightarrow$ **Sakuna**
  * $K_{\text{slot}} = 59$ (1st half of Amavasya) $\rightarrow$ **Chatushpada**
  * $K_{\text{slot}} = 60$ (2nd half of Amavasya) $\rightarrow$ **Naga**
* **Movable (Chara) Karanas (7, repeat 8 times for $K_{\text{slot}} \in \{2, \dots, 57\}$):**
  $$K_{\text{chara\_idx}} = ((K_{\text{slot}} - 2) \bmod 7) + 1$$
  Maps to: `1: Bava, 2: Balava, 3: Kaulava, 4: Taitula, 5: Garija, 6: Vanija, 7: Vishti`.

### 2.5 Planetary Hora (24 Parts per Day)
* A Hindu day runs from **local sunrise to next local sunrise** and is divided into 24 equal **Horas**.
* Let $h \in \{1, \dots, 24\}$ be the running Hora index elapsed since sunrise.
* **Speed Order (decreasing geocentric speed):** `Sun -> Venus -> Mercury -> Moon -> Saturn -> Jupiter -> Mars` (equivalently: `Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon` repeating).
* **Rule:** Hora $1$ is ruled by the **Weekday Lord** (`Sun=Sunday, Moon=Monday, Mars=Tuesday, Mercury=Wednesday, Jupiter=Thursday, Venus=Friday, Saturn=Saturday`). Hora $h$ is ruled by the $((h - 1) \bmod 7)$-th planet after the weekday lord in the list `[Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon]`.

### 2.6 Exceptions & Edge Cases
* **Hindu Weekday Boundary:** Weekday changes at **local sunrise**, NOT midnight (e.g., 12:22 AM Friday on a civil calendar is still **Thursday** in Vedic astrology).
* **Adhika Maasa (Intercalary Lunar Month):** Occurs roughly once every 3 years when two Sun-Moon conjunctions fall inside the same Rasi. The extra month is **Adhika**; the regular month is **Nija**.
* **Chart Rendering Orientations:**
  * **South Indian (Jupiter-ruled):** Rasi-based; fixed 12 outer boxes; signs progress **clockwise** starting with Aries at top-row 2nd box.
  * **North Indian (Venus-ruled):** Bhava-based; diamond layout; House 1 (`Asc`) is fixed at top-center diamond; houses progress **anti-clockwise**; sign numbers ($1$–$12$) rotate inside boxes.
  * **East Indian (Sun-ruled):** Rasi-based; fixed signs progressing **anti-clockwise** starting with Aries at top-center.

---

## 3. Lookup Tables (Structured)

### Table 1: The 12 Rasis (Signs)
| Index | English Name | Sanskrit Name | Symbol | Start | End |
| :---: | :--- | :--- | :---: | :---: | :---: |
| 1 | Aries | Mesha | `Ar` | $0^\circ 0' 0''$ | $29^\circ 59' 59''$ |
| 2 | Taurus | Vrishabha / Vrisha | `Ta` | $30^\circ 0' 0''$ | $59^\circ 59' 59''$ |
| 3 | Gemini | Mithuna | `Ge` | $60^\circ 0' 0''$ | $89^\circ 59' 59''$ |
| 4 | Cancer | Karkataka / Karka | `Cn` | $90^\circ 0' 0''$ | $119^\circ 59' 59''$ |
| 5 | Leo | Simha | `Le` | $120^\circ 0' 0''$ | $149^\circ 59' 59''$ |
| 6 | Virgo | Kanya | `Vi` | $150^\circ 0' 0''$ | $179^\circ 59' 59''$ |
| 7 | Libra | Thula | `Li` | $180^\circ 0' 0''$ | $209^\circ 59' 59''$ |
| 8 | Scorpio | Vrischika | `Sc` | $210^\circ 0' 0''$ | $239^\circ 59' 59''$ |
| 9 | Sagittarius | Dhanus | `Sg` | $240^\circ 0' 0''$ | $269^\circ 59' 59''$ |
| 10 | Capricorn | Makara | `Cp` | $270^\circ 0' 0''$ | $299^\circ 59' 59''$ |
| 11 | Aquarius | Kumbha | `Aq` | $300^\circ 0' 0''$ | $329^\circ 59' 59''$ |
| 12 | Pisces | Meena | `Pi` | $330^\circ 0' 0''$ | $359^\circ 59' 59''$ |

### Table 2: The 27 Nakshatras
| # | Nakshatra | Start | End | Vimsottari Lord | Ruling Deity |
| :---: | :--- | :---: | :---: | :--- | :--- |
| 1 | Aswini | `00 Ar 00` | `13 Ar 20` | Ketu | Aswini Kumara |
| 2 | Bharani | `13 Ar 20` | `26 Ar 40` | Venus | Yama |
| 3 | Krittika | `26 Ar 40` | `10 Ta 00` | Sun | Agni |
| 4 | Rohini | `10 Ta 00` | `23 Ta 20` | Moon | Brahma |
| 5 | Mrigasira | `23 Ta 20` | `06 Ge 40` | Mars | Moon |
| 6 | Aardra | `06 Ge 40` | `20 Ge 00` | Rahu | Shiva |
| 7 | Punarvasu | `20 Ge 00` | `03 Cn 20` | Jupiter | Aditi |
| 8 | Pushyami | `03 Cn 20` | `16 Cn 40` | Saturn | Jupiter |
| 9 | Aasresha | `16 Cn 40` | `30 Cn 00` | Mercury | Rahu |
| 10 | Makha | `00 Le 00` | `13 Le 20` | Ketu | Sun |
| 11 | Poorva Phalguni | `13 Le 20` | `26 Le 40` | Venus | Aryaman |
| 12 | Uttara Phalguni | `26 Le 40` | `10 Vi 00` | Sun | Sun |
| 13 | Hasta | `10 Vi 00` | `23 Vi 20` | Moon | Viswakarma |
| 14 | Chitra | `23 Vi 20` | `06 Li 40` | Mars | Vaayu |
| 15 | Swaati | `06 Li 40` | `20 Li 00` | Rahu | Indra |
| 16 | Visaakha | `20 Li 00` | `03 Sc 20` | Jupiter | Mitra |
| 17 | Anooraadha | `03 Sc 20` | `16 Sc 40` | Saturn | Indra |
| 18 | Jyeshtha | `16 Sc 40` | `30 Sc 00` | Mercury | Nirriti |
| 19 | Moola | `00 Sg 00` | `13 Sg 20` | Ketu | Varuna |
| 20 | Poorvaashaadha | `13 Sg 20` | `26 Sg 40` | Venus | Viswadeva |
| 21 | Uttaraashaadha | `26 Sg 40` | `10 Cp 00` | Sun | Brahma |
| 22 | Sravanam | `10 Cp 00` | `23 Cp 20` | Moon | Vishnu |
| 23 | Dhanishtha | `23 Cp 20` | `06 Aq 40` | Mars | Vasu |
| 24 | Satabhishak | `06 Aq 40` | `20 Aq 00` | Rahu | Varuna |
| 25 | Poorvaabhaadra | `20 Aq 00` | `03 Pi 20` | Jupiter | Ajacharana |
| 26 | Uttaraabhaadra | `03 Pi 20` | `16 Pi 40` | Saturn | Ahirbudhanya |
| 27 | Revati | `16 Pi 40` | `30 Pi 00` | Mercury | Pooshan |

### Table 3: The 30 Tithis & Lords
| Sukla Index | Krishna Index | Tithi Name | Lord |
| :---: | :---: | :--- | :--- |
| 1 | 16 | Pratipat / Pratipada / Padyami | Sun |
| 2 | 17 | Dwitiya / Vidiya | Moon |
| 3 | 18 | Tritiya / Tadiya | Mars |
| 4 | 19 | Chaturthi / Chaviti / Chauth | Mercury |
| 5 | 20 | Panchami | Jupiter |
| 6 | 21 | Shashti | Venus |
| 7 | 22 | Saptami | Saturn |
| 8 | 23 | Ashtami | Rahu |
| 9 | 24 | Navami | Sun |
| 10 | 25 | Dasami | Moon |
| 11 | 26 | Ekadasi | Mars |
| 12 | 27 | Dwadasi | Mercury |
| 13 | 28 | Trayodasi | Jupiter |
| 14 | 29 | Chaturdasi | Venus |
| 15 | — | Paurnami / Poornima (Full Moon) | Saturn |
| — | 30 | Amavasya (New Moon) | Rahu |

### Table 4: Lunar Months
| Sun-Moon Conjunction Rasi | Lunar Month | Likely Full Moon Nakshatra | Approx. Gregorian |
| :--- | :--- | :--- | :--- |
| Pisces | Chaitra | Chitra | Mar/Apr |
| Aries | Vaisaakha | Visaakha | Apr/May |
| Taurus | Jyeshtha | Jyeshtha | May/Jun |
| Gemini | Aashaadha | Poorva/Uttara Aashaadha | Jun/Jul |
| Cancer | Sraavana | Sravana | Jul/Aug |
| Leo | Bhaadrapada | Poorva/Uttara Bhadrapada | Aug/Sep |
| Virgo | Aaswayuja | Aswini | Sep/Oct |
| Libra | Kaarteeka | Krittika | Oct/Nov |
| Scorpio | Maargasira | Mrigasira | Nov/Dec |
| Sagittarius | Pushya | Pushyami | Dec/Jan |
| Capricorn | Maagha | Makha | Jan/Feb |
| Aquarius | Phaalguna | Poorva/Uttara Phalguni | Feb/Mar |

### Table 5: The 27 Sun-Moon Yogas
| # | Yoga | Meaning | # | Yoga | Meaning | # | Yoga | Meaning |
| :---: | :--- | :--- | :---: | :--- | :--- | :---: | :--- | :--- |
| 1 | Vishkambha | Supporting pillar | 10 | Ganda | Danger | 19 | Parigha | Obstacle/hindrance |
| 2 | Preeti | Love/affection | 11 | Vriddhi | Growth | 20 | Shiva | Purity |
| 3 | Aayushmaan | Long-lived | 12 | Dhruva | Fixed/constant | 21 | Siddha | Accomplished |
| 4 | Saubhaagya | Good fortune | 13 | Vyaaghaata | Great blow | 22 | Saadhya | Possible |
| 5 | Sobhana | Splendid/bright | 14 | Harshana | Cheerful | 23 | Subha | Auspicious |
| 6 | Atiganda | Great danger | 15 | Vajra | Diamond/strong | 24 | Sukla | White/bright |
| 7 | Sukarman | Good deeds | 16 | Siddhi | Accomplishment | 25 | Brahma | Knowledge/purity |
| 8 | Dhriti | Firmness | 17 | Vyatipaata | Great fall | 26 | Indra | Ruler of gods |
| 9 | Shoola | Pain/weapon | 18 | Variyan | Chief/best | 27 | Vaidhriti | Class of gods |

---

## 4. Entity Relationships (Graph Edges)

* `(Longitude) --[MAPS_TO]--> (Rasi, DegreeInRasi, Nakshatra, Pada)`
* `(Nakshatra) --[RULED_BY_VIMSHOTTARI]--> (Graha)`
* `(Sun, Moon) --[DETERMINES]--> (Tithi, Paksha, SunMoonYoga, Karana, LunarMonth)`
* `(SunriseTime, EventTime, WeekdayLord) --[DETERMINES]--> (RunningHoraLord)`
* `(ReferencePoint, TargetRasi) --[MAPS_TO_HOUSE]--> (HouseIndex 1..12)` (Whole-Sign: $((R_{\text{target}} - R_{\text{ref}}) \bmod 12) + 1$)

---

## 5. Interpretive Guidelines & Modifiers

* **Four Pillars of Vedic Astrology:** Every analysis rests on `(1) Grahas`, `(2) Rasis`, `(3) Bhavas`, and `(4) Varga Chakras`.
* **Multiple Dasas Are Perspectives, Not Redundancies:** Different Dasa systems analyze different facets of the same event (e.g., Vimsottari = mind, Narayana = external events, Kalachakra = inner connectedness, Sudasa = wealth, Drigdasa = spirituality).
* **Panchanga in Muhurta:** Auspicious Tithi, Vaara, Nakshatra, Yoga, Karana, and favorable Hora are baseline filters for electional timing.

---

## 6. Verification Test Cases (From Source PDF)

1. **Coordinate Parsing (PVR Ex. 1, p. 19 & 32):**
   * Jupiter $94^\circ 19'$ $\rightarrow$ `Cn` $4^\circ 19'$; Mercury `5s 17° 45'` $\rightarrow$ `Vi` $17^\circ 45'$; Venus `25 Li 31` $\rightarrow$ `Li` $25^\circ 31'$.
2. **Whole-Sign House Counting (PVR Ex. 2, p. 19 & 32):**
   * Lagna=`Cn`, Sun=`Ar`, Moon=`Ta`, Mars=`Cp` $\rightarrow$ From Lagna: Sun=`10th`, Moon=`11th`, Mars=`7th`. From Moon: Sun=`12th`, Moon=`1st`, Mars=`9th`.
3. **Tithi Calculation (PVR Example 2 & Ex. 3, p. 26 & 32):**
   * Moon=`24 Ge 12` ($84^\circ 12'$), Sun=`17 Sc 46` ($227^\circ 46'$) $\rightarrow$ $\Delta = 216^\circ 26'$ $\rightarrow$ Tithi `19` = **Krishna Chaturthi**.
   * Moon=`14 Le 43`, Sun=`28 Cp 13` $\rightarrow$ Tithi `17` = **Krishna Dwitiya**.
4. **Sun-Moon Yoga (PVR Example 3 & Ex. 4, p. 28–29 & 32):**
   * Sun=`23 Cp 50`, Moon=`17 Li 20` $\rightarrow$ Sum $= 131^\circ 10' = 7870'$ $\rightarrow$ $\lfloor 7870/800 \rfloor + 1 = 10$ (**Ganda Yoga**).
   * Moon=`14 Le 43`, Sun=`28 Cp 13` $\rightarrow$ **Atiganda Yoga** (Index 6).
5. **Hora Calculation (PVR p. 29):**
   * Wednesday, Sunrise `6:10 AM`, Event `9:40 PM` $\rightarrow$ `15h 30m` elapsed $\rightarrow$ 16th Hora $\rightarrow$ $16 \bmod 7 = 2$nd from Mercury (`Mercury -> Moon`) $\rightarrow$ **Moon Hora**.