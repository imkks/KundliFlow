# Vedic Astrology Mathematical Algorithms & Specifications

All formulas, lookup tables, and calculation steps below are extracted from *Elements of Vedic Astrology* (Dr. K.S. Charak, Parashari System) and *Brihat Parashara Hora Shastra (BPHS)* for direct implementation in software.

---

## 1. Fundamental Constants & Coordinate Conversions

### 1.1 Angular & Time Units
* **Zodiac Circle:** $360^\circ = 12\text{ Rashis (Signs)} = 27\text{ Nakshatras} = 108\text{ Padas}$
* **Span of 1 Rashi:** $30^\circ$
* **Span of 1 Nakshatra:** $13^\circ 20' = \frac{40}{3}^\circ \approx 13.3333^\circ$
* **Span of 1 Nakshatra Pada:** $3^\circ 20' = \frac{10}{3}^\circ \approx 3.3333^\circ$
* **Traditional Time Units (Sunrise to Sunrise = 1 Civil Day):**
  * $1\text{ Day} = 60\text{ Ghatis}$
  * $1\text{ Ghati (Danda)} = 24\text{ minutes} = 60\text{ Palas (Vighatis)}$
  * $1\text{ Pala (Vighati)} = 24\text{ seconds} = 6\text{ Asus (Pranas)}$
  * $1\text{ Asu} = 4\text{ seconds}$
* **Sidereal Day:** $23\text{h } 56\text{m } 4.09\text{s}$ (approx. $3\text{m } 56\text{s}$ shorter than a mean solar day).
* **Precession Rate (Mean):** $50.26''\text{ per year}$ ($\approx 71.63\text{ years per degree}$).

### 1.2 Sayana (Tropical) to Nirayana (Sidereal) Conversion
$$\lambda_{\text{Nirayana}} = (\lambda_{\text{Sayana}} - \text{Ayanamsha}) \bmod 360^\circ$$
* Recommended Ayanamsha: **Lahiri (Chitrapaksha)**.

### 1.3 Rashi, Nakshatra, and Pada from Nirayana Longitude $\lambda \in [0^\circ, 360^\circ)$
* **Rashi Index ($1$ to $12$):**
  $$R = \left\lfloor \frac{\lambda}{30^\circ} \right\rfloor + 1$$
* **Degrees within Rashi:**
  $$d = \lambda \bmod 30^\circ$$
* **Nakshatra Index ($1$ to $27$):**
  $$N = \left\lfloor \frac{\lambda}{13^\circ 20'} \right\rfloor + 1 = \left\lfloor \frac{3 \lambda}{40^\circ} \right\rfloor + 1$$
* **Pada Index ($1$ to $4$ within Nakshatra):**
  $$P = \left( \left\lfloor \frac{\lambda}{3^\circ 20'} \right\rfloor \bmod 4 \right) + 1$$

---

## 2. Panchanga Algorithms

Let $\lambda_{\text{Sun}}$ and $\lambda_{\text{Moon}}$ be the Nirayana (Sidereal) longitudes in degrees.

1. **Tithi ($1$ to $30$, each $12^\circ$):**
   $$\Delta = (\lambda_{\text{Moon}} - \lambda_{\text{Sun}}) \bmod 360^\circ$$
   $$\text{Tithi} = \left\lfloor \frac{\Delta}{12^\circ} \right\rfloor + 1$$
   * $1\text{--}15$: Shukla Paksha (Waxing); $16\text{--}30$: Krishna Paksha (Waning).
2. **Nakshatra ($1$ to $27$):** Computed using $\lambda_{\text{Moon}}$ per Section 1.3.
3. **Yoga ($1$ to $27$, each $13^\circ 20'$):**
   *(Note: Because longitudes are summed, $\lambda_{\text{Sun}} + \lambda_{\text{Moon}}$ must strictly be sidereal, as Ayanamsha does not cancel out).*
   $$\Sigma = (\lambda_{\text{Sun}} + \lambda_{\text{Moon}}) \bmod 360^\circ$$
   $$\text{Yoga} = \left\lfloor \frac{\Sigma}{13^\circ 20'} \right\rfloor + 1$$
4. **Karana ($60$ half-tithis, each $6^\circ$):**
   $$\text{HalfTithi} = \left\lfloor \frac{\Delta}{6^\circ} \right\rfloor + 1 \quad (1 \le \text{HalfTithi} \le 60)$$
   * **Fixed (Sthira) Karanas (4 specific half-tithis):**
     * $\text{HalfTithi} = 1 \implies$ **Kimstughna** (Fixed, 2nd half of Krishna Amavasya / 1st half of Shukla Pratipada).
     * $\text{HalfTithi} = 58 \implies$ **Shakuni** (Fixed, 2nd half of Krishna Chaturdashi).
     * $\text{HalfTithi} = 59 \implies$ **Chatushpada** (Fixed, 1st half of Krishna Amavasya).
     * $\text{HalfTithi} = 60 \implies$ **Naga** (Fixed, 2nd half of Krishna Amavasya).
   * **Movable (Chara) Karanas (56 half-tithis, $\text{HalfTithi} \in [2, 57]$):**
     Cycles 8 times through the 7 movable karanas:
     $$\text{CharaIndex} = ((\text{HalfTithi} - 2) \bmod 7) + 1$$
     Where: $1 = \text{Bava}, 2 = \text{Balava}, 3 = \text{Kaulava}, 4 = \text{Taitila}, 5 = \text{Gara}, 6 = \text{Vanija}, 7 = \text{Vishti (Bhadra)}$.
5. **Vaara:** Weekday determined from local sunrise to next local sunrise.

---

## 3. Ascendant (Lagna) & House Cusp Algorithms

### 3.1 Local Mean Time (LMT) & Sidereal Time (ST)
Given Standard Time $T_{\text{std}}$, Standard Meridian $L_{\text{std}}$ (e.g., $82.5^\circ\text{ E}$ for IST), and Place Longitude $L_{\text{place}}$ (East positive, West negative):
1. **LMT Conversion ($4\text{ minutes}$ per degree of longitude):**
   $$T_{\text{LMT}} = T_{\text{std}} + (L_{\text{place}} - L_{\text{std}}) \times 4\text{ min}$$
2. **Sidereal Time at Birth:**
   * Take Sidereal Time at local mean noon ($ST_{\text{noon}}$) for the date, applying longitude correction of $+0.66\text{s}$ per degree West (or $-0.66\text{s}$ East) relative to the ephemeris reference meridian.
   * Let $\Delta t = T_{\text{LMT}} - 12\text{h } 00\text{m}$ (signed).
   * Apply solar-to-sidereal rate correction ($+9.856\text{s/hr}$, approximated in manual tables as $+10\text{s/hr}$):
     $$ST_{\text{birth}} = \left( ST_{\text{noon}} + \Delta t \times \left(1 + \frac{10}{3600}\right) \right) \bmod 24\text{h}$$

### 3.2 Southern Latitude Adjustment (Using Northern Tables)
If $\text{Latitude} < 0^\circ$ (South):
1. $ST' = (ST_{\text{birth}} + 12\text{h}) \bmod 24\text{h}$
2. Compute Ascendant $\lambda_{\text{asc}}'$ for $|\text{Latitude}|$ (North) using $ST'$.
3. True Southern Ascendant:
   $$\lambda_{\text{asc}} = (\lambda_{\text{asc}}' + 180^\circ) \bmod 360^\circ$$

### 3.3 House Cusps (Sripati / Bhava Chalit Trisection Method)
In Sripati Jyotish, the points $C_1, \dots, C_{12}$ calculated below represent the **Bhava Madhyas (House Midpoints / Peak Centers)**, not house beginnings:
Given Ascendant ($C_1$) and 10th House Midheaven ($C_{10}$):
* $C_7 = (C_1 + 180^\circ) \bmod 360^\circ$
* $C_4 = (C_{10} + 180^\circ) \bmod 360^\circ$
* Let $\Delta_{10\to 1} = (C_1 - C_{10}) \bmod 360^\circ$:
  * $C_{11} = \left(C_{10} + \frac{1}{3}\Delta_{10\to 1}\right) \bmod 360^\circ$
  * $C_{12} = \left(C_{10} + \frac{2}{3}\Delta_{10\to 1}\right) \bmod 360^\circ$
* Symmetrical opposite cusps:
  * $C_5 = (C_{11} + 180^\circ) \bmod 360^\circ$, $C_6 = (C_{12} + 180^\circ) \bmod 360^\circ$
  * Let $\Delta_{1\to 4} = (C_4 - C_1) \bmod 360^\circ$:
    * $C_2 = \left(C_1 + \frac{1}{3}\Delta_{1\to 4}\right) \bmod 360^\circ$, $C_3 = \left(C_1 + \frac{2}{3}\Delta_{1\to 4}\right) \bmod 360^\circ$
    * $C_8 = (C_2 + 180^\circ) \bmod 360^\circ$, $C_9 = (C_3 + 180^\circ) \bmod 360^\circ$

**Bhava Sandhis (House Boundaries / Beginnings & Ends):**
The house boundary between House $i-1$ and House $i$ is the exact midpoint between their Madhyas:
$$\text{Begin}_i = \left( C_{i-1} + \frac{(C_i - C_{i-1}) \bmod 360^\circ}{2} \right) \bmod 360^\circ$$
$$\text{End}_i = \text{Begin}_{(i \bmod 12) + 1}$$
A celestial body at sidereal longitude $\lambda$ falls in House $i$ if:
$$\begin{cases} \lambda \ge \text{Begin}_i \text{ and } \lambda < \text{End}_i & \text{if } \text{Begin}_i \le \text{End}_i \\ \lambda \ge \text{Begin}_i \text{ or } \lambda < \text{End}_i & \text{if } \text{Begin}_i > \text{End}_i \text{ (wrap across } 0^\circ \text{)} \end{cases}$$

---

## 4. Planetary Longitudes (Graha-Sphutas)

When interpolating between daily ephemeris entries at epoch $t_0$ (e.g., 5:30 AM IST / 00:00 UTC) and $t_1 = t_0 + 24\text{h}$:
* Elapsed fraction: $f = \frac{t_{\text{birth}} - t_0}{24\text{h}}$
* Daily motion: $\Delta \lambda = \lambda(t_1) - \lambda(t_0)$ (normalized across $360^\circ/0^\circ$ wrap-around).
* **Direct or Retrograde Interpolation:**
  $$\lambda(t_{\text{birth}}) = (\lambda(t_0) + f \cdot \Delta \lambda) \bmod 360^\circ$$
  *(If retrograde, $\Delta \lambda < 0$, so elapsed motion is automatically subtracted.)*
* **Ketu from Rahu:**
  $$\lambda_{\text{Ketu}} = (\lambda_{\text{Rahu}} + 180^\circ) \bmod 360^\circ$$

---

## 5. Shodashavarga (All 16 Divisional Charts)

Let a planet's Rashi be $R \in \{1, 2, \dots, 12\}$ and its degree within the sign be $d \in [0^\circ, 30^\circ)$.
Define helper properties:
* **Parity:** $\text{isOdd}(R) \iff R \in \{1, 3, 5, 7, 9, 11\}$; $\text{isEven}(R) \iff R \in \{2, 4, 6, 8, 10, 12\}$.
* **Modality:**
  * Movable (Chara): $R \in \{1, 4, 7, 10\}$
  * Fixed (Sthira): $R \in \{2, 5, 8, 11\}$
  * Dual/Mixed (Dwiswabhava): $R \in \{3, 6, 9, 12\}$
* **Element:** Fire $\{1,5,9\}$, Earth $\{2,6,10\}$, Air $\{3,7,11\}$, Water $\{4,8,12\}$.
* **Sign Wrap Helper:** $\text{wrap}(x) = ((x - 1) \bmod 12) + 1$.
* **Part Index ($0$-based) for $n$ equal divisions:** $k = \min\left(n - 1, \left\lfloor \frac{d}{30^\circ / n} \right\rfloor\right) \in \{0, 1, \dots, n-1\}$.

| Varga | $n$ | Span | Formula for Divisional Sign ($1$--$12$) |
| :--- | :---: | :---: | :--- |
| **D1 (Rashi)** | 1 | $30^\circ$ | $R$ |
| **D2 (Hora)** | 2 | $15^\circ$ | Odd $R$: $k=0 \to 5\text{ (Simha)}$, $k=1 \to 4\text{ (Karka)}$. Even $R$: $k=0 \to 4$, $k=1 \to 5$. |
| **D3 (Drekkana)** | 3 | $10^\circ$ | $\text{wrap}(R + 4k)$ *(1st, 5th, 9th from $R$)* |
| **D4 (Chaturthamsha)** | 4 | $7^\circ 30'$ | $\text{wrap}(R + 3k)$ *(1st, 4th, 7th, 10th from $R$)* |
| **D7 (Saptamsha)** | 7 | $4^\circ 17' 8.57''$ | Odd $R$: $\text{wrap}(R + k)$. Even $R$: $\text{wrap}(R + 6 + k)$. |
| **D9 (Navamsha)** | 9 | $3^\circ 20'$ | Movable: $\text{wrap}(R + k)$; Fixed: $\text{wrap}(R + 8 + k)$; Dual: $\text{wrap}(R + 4 + k)$. *(Equivalently: $\text{wrap}(\lfloor \lambda / 3^\circ 20' \rfloor + 1)$)* |
| **D10 (Dashamsha)** | 10 | $3^\circ$ | Odd $R$: $\text{wrap}(R + k)$. Even $R$: $\text{wrap}(R + 8 + k)$. |
| **D12 (Dwadashamsha)** | 12 | $2^\circ 30'$ | $\text{wrap}(R + k)$ |
| **D16 (Shodashamsha)** | 16 | $1^\circ 52' 30''$ | Movable: $\text{wrap}(1 + k)$; Fixed: $\text{wrap}(5 + k)$; Dual: $\text{wrap}(9 + k)$. |
| **D20 (Vimshamsha)** | 20 | $1^\circ 30'$ | Movable: $\text{wrap}(1 + k)$; Fixed: $\text{wrap}(9 + k)$; Dual: $\text{wrap}(5 + k)$. |
| **D24 (Chaturvimshamsha)** | 24 | $1^\circ 15'$ | Odd $R$: $\text{wrap}(5 + k)$. Even $R$: $\text{wrap}(4 + k)$. |
| **D27 (Bhamsha)** | 27 | $1^\circ 6' 40''$ | Fire: $\text{wrap}(1+k)$; Earth: $\text{wrap}(4+k)$; Air: $\text{wrap}(7+k)$; Water: $\text{wrap}(10+k)$. |
| **D30 (Trimshamsha)** | 30 | Unequal | **Odd $R$:** $[0,5)\to\text{Mars (1)}$, $[5,10)\to\text{Sat (11)}$, $[10,18)\to\text{Jup (9)}$, $[18,25)\to\text{Mer (3)}$, $[25,30)\to\text{Ven (7)}$. **Even $R$:** $[0,5)\to\text{Ven (2)}$, $[5,12)\to\text{Mer (6)}$, $[12,20)\to\text{Jup (12)}$, $[20,25)\to\text{Sat (10)}$, $[25,30)\to\text{Mars (8)}$. |
| **D40 (Khavedamsha)** | 40 | $0^\circ 45'$ | Odd $R$: $\text{wrap}(1 + k)$. Even $R$: $\text{wrap}(7 + k)$. |
| **D45 (Akshavedamsha)** | 45 | $0^\circ 40'$ | Movable: $\text{wrap}(1 + k)$; Fixed: $\text{wrap}(5 + k)$; Dual: $\text{wrap}(9 + k)$. |
| **D60 (Shashtyamsha)** | 60 | $0^\circ 30'$ | $\text{wrap}(1 + k) = (k \bmod 12) + 1$ *(BPHS Ch. 6: count strictly from Aries, ignoring natal sign $R$)* |

* **Vargottama Check:** A planet is Vargottama if $\text{Sign}_{D1} = \text{Sign}_{D9}$.

---

## 6. Sub-Planets (Upagrahas)

### 6.1 Gulika & Mandi
Let $D_{\text{day}}$ be duration from sunrise to sunset (in Ghatis), $D_{\text{night}}$ from sunset to next sunrise (in Ghatis), and $w \in \{0,1,2,3,4,5,6\}$ be weekday (Sunday $= 0$ to Saturday $= 6$).
* **Mandi Rise Time (in Ghatis after sunrise/sunset):**
  * **Day Birth:** $T_{\text{Mandi}} = \frac{D_{\text{day}}}{30} \times M_{\text{day}}[w]$, where $M_{\text{day}} = [26, 22, 18, 14, 10, 6, 2]$.
  * **Night Birth:** $T_{\text{Mandi}} = \frac{D_{\text{night}}}{30} \times M_{\text{night}}[w]$, where $M_{\text{night}} = [10, 6, 2, 26, 22, 18, 14]$.
  * **Longitude:** Compute the Ascendant (Lagna) for the exact timestamp of $T_{\text{Mandi}}$.
* **Gulika:** Divide day (or night) into 8 equal parts. For day, 1st part belongs to weekday lord; for night, 1st part belongs to the 5th planet from weekday lord. The 8th part is lordless. Compute the Ascendant for the end (or midpoint) of Saturn's part.

### 6.2 Dhoomadi Group (From Sun's Longitude $\lambda_{\text{Sun}}$)
1. $\lambda_{\text{Dhooma}} = (\lambda_{\text{Sun}} + 133^\circ 20') \bmod 360^\circ$ *(i.e., $+4\text{ signs } 13^\circ 20'$)*
2. $\lambda_{\text{Vyatipata}} = (360^\circ - \lambda_{\text{Dhooma}}) \bmod 360^\circ$
3. $\lambda_{\text{Parivesha}} = (\lambda_{\text{Vyatipata}} + 180^\circ) \bmod 360^\circ$
4. $\lambda_{\text{Indrachapa}} = (360^\circ - \lambda_{\text{Parivesha}}) \bmod 360^\circ$
5. $\lambda_{\text{Upaketu}} = (\lambda_{\text{Indrachapa}} + 16^\circ 40') \bmod 360^\circ$
   *(Mathematical validation invariant: $(\lambda_{\text{Upaketu}} + 30^\circ) \bmod 360^\circ = \lambda_{\text{Sun}}$).*

### 6.3 Pranapada
1. Convert Ishta-Kaala (time elapsed since local sunrise) into Palas ($1\text{ Pala} = 24\text{ seconds}$).
2. $\theta_{\text{PP}} = (\text{Palas} \times 2)^\circ \bmod 360^\circ$.
3. Offset based on Sun's Rashi modality:
   * Movable (Chara): $\lambda_{\text{PP}} = (\lambda_{\text{Sun}} + \theta_{\text{PP}}) \bmod 360^\circ$
   * Fixed (Sthira): $\lambda_{\text{PP}} = (\lambda_{\text{Sun}} + \theta_{\text{PP}} + 240^\circ) \bmod 360^\circ$ *(9th from Sun)*
   * Dual (Dwiswabhava): $\lambda_{\text{PP}} = (\lambda_{\text{Sun}} + \theta_{\text{PP}} + 120^\circ) \bmod 360^\circ$ *(5th from Sun)*

---

## 7. Planetary States (Avasthas)

### 7.1 Baladi Avasthas (Physical States)
For degree $d \in [0^\circ, 30^\circ)$ in Rashi $R$, let $q = \lfloor d / 6^\circ \rfloor \in \{0,1,2,3,4\}$.
* If $R$ is **Odd**: $0=\text{Bala}$, $1=\text{Kumara}$, $2=\text{Yuva}$, $3=\text{Vriddha}$, $4=\text{Mrita}$.
* If $R$ is **Even**: $0=\text{Mrita}$, $1=\text{Vriddha}$, $2=\text{Yuva}$, $3=\text{Kumara}$, $4=\text{Bala}$.

### 7.2 Twelve-Fold Shayanadi Avasthas & Cheshta Strength
For a planet $p \in \{1\text{ (Sun)}, \dots, 9\text{ (Ketu)}\}$:
1. **Avastha Index ($A \in \{1, \dots, 12\}$):**
   $$S = (N_p \times p \times \text{Nav}_p) + N_{\text{Moon}} + R_{\text{Lagna}} + \text{IshtaGhatis}$$
   $$A = ((S - 1) \bmod 12) + 1$$
   *(where $N_p$ = planet's nakshatra $1\text{--}27$, $\text{Nav}_p$ = planet's navamsha part $1\text{--}9$ in its sign, $N_{\text{Moon}}$ = birth nakshatra, $R_{\text{Lagna}}$ = lagna sign $1\text{--}12$, $\text{IshtaGhatis}$ = elapsed ghatis since sunrise).*
   * States: $1=\text{Sayana}, 2=\text{Upaveshana}, 3=\text{Netrapani}, 4=\text{Prakasana}, 5=\text{Gamana}, 6=\text{Agamana}, 7=\text{Sabha}, 8=\text{Agama}, 9=\text{Bhojana}, 10=\text{Nrityalipsa}, 11=\text{Kautuka}, 12=\text{Nidra}$.
2. **Cheshta Category:**
   * Let $C_{\text{name}}$ be the numeric constant for the first letter of the native's name, and $K_p$ be the planet's Kshepaka constant:
     $$K = [5, 2, 2, 3, 5, 3, 3, 4, 4] \quad (\text{Sun through Ketu})$$
   * Compute $V = ((A^2 + C_{\text{name}}) \bmod 12) + K_p$.
   * Compute $r = V \bmod 3$:
     * $r = 1 \implies \text{Drishti}$ (Ordinary result)
     * $r = 2 \implies \text{Cheshta}$ (Intense result)
     * $r = 0 \implies \text{Vicheshta}$ (Minimal result)

---

## 8. Graha Bala (Shadbala) & Bhava Bala

**Units:** $1\text{ Rupa} = 60\text{ Shashtyamshas (Virupas)}$.

### 8.1 Sthana Bala (Positional Strength)
1. **Uchcha Bala:** Let $\delta = \min(|\lambda_p - \lambda_{\text{deb}}|, 360^\circ - |\lambda_p - \lambda_{\text{deb}}|)$ be the angular distance from deep debilitation ($\delta \in [0^\circ, 180^\circ]$):
   $$\text{UchchaBala} = \frac{\delta}{3^\circ} \text{ Shashtyamshas}$$
2. **Saptavargaja Bala:** Sum dignity points across 7 vargas (D1, D2, D3, D7, D9, D12, D30):
   * Moolatrikona (D1 only): $45.0$
   * Own Sign: $30.0$; Adhi-Mitra: $22.5$; Mitra: $15.0$; Sama: $7.5$; Shatru: $3.75$; Adhi-Shatru: $1.875$.
3. **Oja-Yugma Rashi & Navamsha Bala:**
   * Moon & Venus in Even sign $\implies +15$ (check D1 and D9 separately).
   * Sun, Mars, Mercury, Jupiter, Saturn in Odd sign $\implies +15$ (check D1 and D9 separately).
4. **Kendradi Bala:** Houses $\{1,4,7,10\} \implies 60$; $\{2,5,8,11\} \implies 30$; $\{3,6,9,12\} \implies 15$.
5. **Drekkana Bala:**
   * Male planets (Sun, Mars, Jupiter) in 1st Drekkana ($0^\circ\text{--}10^\circ$) $\implies +15$.
   * Neutral (Mercury, Saturn) in 2nd Drekkana ($10^\circ\text{--}20^\circ$) $\implies +15$.
   * Female (Moon, Venus) in 3rd Drekkana ($20^\circ\text{--}30^\circ$) $\implies +15$.

### 8.2 Kaala Bala (Temporal Strength)
1. **Nata-Unnata Bala:**
   * Let $h$ be hours from local midnight ($0 \le h \le 12$, symmetric around noon):
   * Sun, Jupiter, Venus: $60 \times \frac{h}{12}$ (max 60 at noon, 0 at midnight).
   * Moon, Mars, Saturn: $60 \times \left(1 - \frac{h}{12}\right)$ (max 60 at midnight, 0 at noon).
   * Mercury: Always $60$.
2. **Paksha Bala:** Let $\Delta = \min(|\lambda_{\text{Moon}} - \lambda_{\text{Sun}}|, 360^\circ - |\lambda_{\text{Moon}} - \lambda_{\text{Sun}}|) \in [0^\circ, 180^\circ]$.
   * Benefics (Moon, Mercury, Jupiter, Venus): $\frac{\Delta}{3^\circ}$ (Double this value for the Moon, max 120).
   * Malefics (Sun, Mars, Saturn): $60 - \frac{\Delta}{3^\circ}$.
3. **Tri-Bhaga Bala:** Divide day (sunrise–sunset) or night (sunset–sunrise) into 3 equal parts:
   * Day: 1st = Mercury ($60$), 2nd = Sun ($60$), 3rd = Saturn ($60$).
   * Night: 1st = Moon ($60$), 2nd = Venus ($60$), 3rd = Mars ($60$).
   * Jupiter: Always $60$.
4. **Abda, Masa, Vaara, Hora Bala:** Year lord $= 15$; Month lord $= 30$; Weekday lord $= 45$; Birth Hora lord $= 60$.
5. **Ayana Bala:** Based on declination $\delta \in [-23^\circ 27', +23^\circ 27']$:
   * Sun, Mars, Jupiter, Venus: $30 \times \left(1 + \frac{\delta}{23.45^\circ}\right)$ (Double for Sun).
   * Moon, Saturn: $30 \times \left(1 - \frac{\delta}{23.45^\circ}\right)$.
   * Mercury: $30 \times \left(1 + \frac{|\delta|}{23.45^\circ}\right)$.
6. **Yuddha Bala (Planetary War):**
   * Occurs when two planets (among Mars, Mercury, Jupiter, Venus, Saturn) are within $1^\circ$ longitude.
   * **Winner determination:**
     * *Classical Scriptural Standard (BPHS / Surya Siddhanta):* Planet with greater **Northern celestial latitude** wins. **Venus is always victorious** by classical decree.
     * *Modern Software Standard:* Planet with lower longitudinal degree wins.
   * Difference in (Sthana + Dig + Kaala up to Hora) is transferred: added to the victor and subtracted from the loser.

### 8.3 Cheshta Bala (Motional Strength)
Classical discrete values by motion state: Vakra $= 60$, Sheeghra $= 45$, Anuvakra $= 30$, Madhya $= 30$, Ati-sheeghra $= 30$, Vikala $= 15$, Manda $= 15$, Mandatara $= 7.5$.

### 8.4 Drig Bala (Aspectual Strength)
Let $\theta = (\lambda_{\text{aspected}} - \lambda_{\text{aspecting}}) \bmod 360^\circ$.
Exact continuous piecewise linear formulation:
$$\text{Base Aspect}(\theta) = \begin{cases} 
0 & 0^\circ \le \theta < 30^\circ \text{ or } \theta \ge 300^\circ \\
\frac{\theta - 30^\circ}{2} & 30^\circ \le \theta < 60^\circ \\
\theta - 45^\circ & 60^\circ \le \theta < 90^\circ \\
45^\circ - \frac{\theta - 90^\circ}{2} & 90^\circ \le \theta < 120^\circ \\
150^\circ - \theta & 120^\circ \le \theta < 150^\circ \\
2 \cdot (\theta - 150^\circ) & 150^\circ \le \theta < 180^\circ \\
\frac{300^\circ - \theta}{2} & 180^\circ \le \theta < 300^\circ
\end{cases}$$

**Special Overrides (Vishesha Drishti):**
* Mars: $+15$ Virupas at 4th house ($90^\circ\text{--}120^\circ$) and 8th house ($210^\circ\text{--}240^\circ$) (clamped to 60).
* Jupiter: $+30$ Virupas at 5th house ($120^\circ\text{--}150^\circ$) and 9th house ($240^\circ\text{--}270^\circ$) (clamped to 60).
* Saturn: $+45$ Virupas at 3rd house ($60^\circ\text{--}90^\circ$) and 10th house ($270^\circ\text{--}300^\circ$) (clamped to 60).

**Net Drig Bala:**
$$\text{DrigBala} = \frac{\sum \text{BeneficAspects} - \sum \text{MaleficAspects}}{4}$$

### 8.5 Bhava Bala (House Strength)
$$\text{BhavaBala}_h = \text{LordShadbala}_h + \text{BhavaDrigBala}_h + \text{BhavaDigBala}_h$$
* **Lord Shadbala:** Total Shadbala of the planet ruling the sign on House $h$.
* **Bhava Drishti Bala:** Net Drig Bala cast on the Bhava Madhya of House $h$.
* **Bhava Dig Bala:** Find angular distance $\alpha$ between house cusp $C_h$ and reference cusp based on the sign on $C_h$:
  * Dwipada / Nara (Mithuna, Kanya, Tula, Kumbha, 1st half Dhanu): reference $= C_7$ (7th house)
  * Chatushpada (Mesha, Vrisha, Simha, 2nd half Dhanu, 1st half Makara): reference $= C_4$ (4th house)
  * Keeta (Karka, Vrischika): reference $= C_1$ (1st house / Lagna)
  * Jalachara (Meena, 2nd half Makara): reference $= C_{10}$ (10th house / MC)
  * Let $\alpha = \min(|C_h - C_{\text{ref}}|, 360^\circ - |C_h - C_{\text{ref}}|) \in [0^\circ, 180^\circ]$:
    $$\text{BhavaDigBala} = \frac{\alpha}{3^\circ}$$

---

## 9. Dasha Systems

### 9.1 Vimshottari Dasha (120-Year Cycle)
* **Fixed Sequence & Durations (Years):**
  1. Ketu: $7$, 2. Venus: $20$, 3. Sun: $6$, 4. Moon: $10$, 5. Mars: $7$, 6. Rahu: $18$, 7. Jupiter: $16$, 8. Saturn: $19$, 9. Mercury: $17$.
* **Birth Mahadasha Lord:** Index $(N_{\text{Moon}} - 1) \bmod 9$ in sequence above.
* **Balance of Birth Dasha:**
  * Fraction elapsed in Moon's nakshatra: $f_{\text{elapsed}} = \frac{\lambda_{\text{Moon}} \bmod 13^\circ 20'}{13^\circ 20'}$
  * Remaining years: $\text{Balance} = Y_{\text{lord}} \times (1 - f_{\text{elapsed}})$
* **Sub-Periods (Antardasha $AD$ & Pratyantardasha $PD$):**
  $$\text{Duration}_{AD} = \frac{a \times b}{120} \text{ years}, \quad \text{Duration}_{PD} = \frac{a \times b \times c}{120 \times 120} \text{ years}$$

### 9.2 Yogini Dasha (36-Year Cycle)
* **Sequence & Years:** Mangala ($1$), Pingala ($2$), Dhanya ($3$), Bhramari ($4$), Bhadrika ($5$), Ulka ($6$), Siddha ($7$), Sankata ($8$).
* **Birth Yogini Index:**
  $$\text{YoginiIndex} = ((N_{\text{Moon}} + 3 - 1) \bmod 8) + 1$$
  *(where $1=\text{Mangala}, \dots, 8=\text{Sankata}$; verify: Ashwini $N=1 \implies (1+2)\bmod 8 + 1 = 4 = \text{Bhramari}$).*

---

## 10. Mathematical Longevity (Ayurdaya)

### 10.1 Pindayu
* Max years at deep exaltation (Sun–Saturn): $[19, 25, 15, 12, 15, 21, 20]$.
* Min years at deep debilitation: Half of max ($[9.5, 12.5, 7.5, 6, 7.5, 10.5, 10]$).
* Linear interpolation by distance $\delta \in [0^\circ, 180^\circ]$ from debilitation:
  $$Y_p = Y_{\min} + Y_{\min} \times \frac{\delta}{180^\circ}$$
* **Lagna Ayurdaya Contribution:**
  $$\text{LagnaYears} = \text{Completed Navamshas of Lagna} = \left\lfloor \frac{\lambda_{\text{Lagna}}}{3^\circ 20'} \right\rfloor \bmod 12$$

### 10.2 Amshayu
For each of the 7 planets + Lagna:
1. Convert longitude $\lambda$ to arc-minutes: $M = \lambda \times 60$.
2. Raw years: $Y_{\text{raw}} = \frac{M}{200}$.
3. Reduce modulo $12$: $Y_{\text{base}} = Y_{\text{raw}} \bmod 12$.
4. Apply Bharanas (multipliers: Exalted $= \times 3$, Own/Retrograde/Vargottama $= \times 2$) and Haranas (reductions: Astangata $= 1/2$, Shatru-Kshetra $= 1/3$, Chakrapaata by house; in Amshayu, per Satyacharya rule, apply only the single largest Harana if multiple apply).

### 10.3 Nisargayu (Fixed Natural Spans)
Moon ($1$), Mars ($2$), Mercury ($9$), Venus ($20$), Jupiter ($18$), Sun ($20$), Saturn ($50$) — Total $= 120\text{ years}$.

---

## 11. Varshaphala (Annual Solar Return)

* **Sidereal Year:** $365\text{d } 6\text{h } 9\text{m } 10\text{s}$.
* **Dhruvanka Constant (1 Year):** $1\text{d } 6\text{h } 9\text{m } 10\text{s}$ (remainder after removing 52 weeks).
* **Varshapravesha (Solar Return Moment) for $N$ completed years:**
  1. Add $N \times (1\text{d } 6\text{h } 9\text{m } 10\text{s})$ to $(\text{BirthWeekday} \in \{0\dots 6\}, \text{BirthTime})$.
  2. Programmatic precision: solve $\lambda_{\text{Sun}}(t) = \lambda_{\text{Sun}}(t_{\text{birth}})$ via binary search or Newton-Raphson.
* **Varsheshwara (Lord of the Year):** Evaluated among the *Panchadhikari* (Muntha lord, Janma Lagna lord, Varsha Lagna lord, Tri-Rasheesha, and Dina/Ratri lord) based on Harsha Bala and Tajika aspects to Varsha Lagna.
* **Annual Dashas:** Patyayini Dasha, Mudda Dasha (Vimshottari scaled to 365.25 days), or Yogini (36 yrs scaled to 1 yr).

---

## 12. Ashtakavarga & Daily Kakshya Transit

### 12.1 Structure
* Uses 8 reference points: 7 planets (Sun to Saturn) + Lagna (excludes Rahu & Ketu).
* Calculated strictly on **Rashi (D1)** positions.
* **Prastaraka:** $8 \times 12$ binary matrix per planet (1 = Bindu/benefic point, 0 = none).
* **Bhinnashtakavarga (BAV):** Column sum of a planet's Prastaraka across the 12 signs (scores $0$ to $8$ per sign).
* **Sarvashtakavarga (SAV):** Sum of all 7 BAVs per sign. Total Bindus across all 12 signs is always **$337$**.
* **Shodhana (Reductions):**
  1. *Trikona Shodhana:* In each of the 4 trines (Fire, Earth, Air, Water), subtract the minimum bindu count from all 3 signs.
  2. *Ekadhipatya Shodhana:* For signs owned by Mars, Mercury, Jupiter, Venus, Saturn, adjust bindus based on occupancy of planets.
  3. *Shodhita Pinda:* $\text{Rashi Pinda} + \text{Graha Pinda}$.

### 12.2 Daily Transit via Kakshyas
Each $30^\circ$ sign is divided into **8 equal Kakshyas of $3^\circ 45'$** ($3.75^\circ$) in natural astronomical order from slowest to fastest:

| Kakshya # | Degree Span in Sign | Kakshya Lord |
| :---: | :---: | :--- |
| 1 | $0^\circ 00'$ -- $3^\circ 45'$ | Saturn |
| 2 | $3^\circ 45'$ -- $7^\circ 30'$ | Jupiter |
| 3 | $7^\circ 30'$ -- $11^\circ 15'$ | Mars |
| 4 | $11^\circ 15'$ -- $15^\circ 00'$ | Sun |
| 5 | $15^\circ 00'$ -- $18^\circ 45'$ | Venus |
| 6 | $18^\circ 45'$ -- $22^\circ 30'$ | Mercury |
| 7 | $22^\circ 30'$ -- $26^\circ 15'$ | Moon |
| 8 | $26^\circ 15'$ -- $30^\circ 00'$ | Lagna |

* **Daily Transit Evaluation Algorithm:**
  For each transiting planet $P$ at longitude $\lambda_P$:
  1. Find its current sign $R_P = \lfloor \lambda_P / 30^\circ \rfloor$.
  2. Find its current Kakshya index $K_P = \lfloor (\lambda_P \bmod 30^\circ) / 3.75^\circ \rfloor$ and corresponding Kakshya Lord $L$.
  3. Look up $\text{Prastaraka}_P[L][R_P]$. If $= 1$, planet $P$'s transit is **benefic** today; if $= 0$, **adverse**.
  4. Sum the count of benefic transiting planets ($0$ to $7$) for the daily auspiciousness score.

---

## 13. Sudarshana Chakra & Dasha

### 13.1 Concentric 3-Ring Chart
* **Inner Ring:** Natal Lagna as House 1 (signs anti-clockwise).
* **Middle Ring:** Chandra Lagna (Moon's sign as House 1).
* **Outer Ring:** Surya Lagna (Sun's sign as House 1).

### 13.2 Sudarshana Chakra Dasha (12-Year Cycle)
* **Mahadasha (MD):** Each house operates for **1 year**, starting from House 1 at birth, cycling every 12 years:
  $$\text{MD\_House}(\text{age}) = (\lfloor \text{age} \rfloor \bmod 12) + 1$$
* **Antardasha (AD):** 1 month per house starting from the MD house.
* **Pratyantardasha (PD):** $2.5$ days per house starting from the AD house ($30\text{ days} / 12 = 2.5\text{ days}$).
* **Evaluation Rules (treating active Dasha House as temporary Lagna):**
  * Benefics in houses $\{1, 4, 5, 7, 8, 9, 10\}$ from Dasha Lagna $\implies$ favorable; in $\{2, 12\} \implies$ harmful.
  * Malefics in houses $\{3, 6, 11\}$ from Dasha Lagna $\implies$ favorable; elsewhere $\implies$ adverse.
  * Solo Rahu or Solo Ketu in a house $\implies$ adverse.
  * Confirm results against Ashtakavarga and Vimshottari Dasha.
