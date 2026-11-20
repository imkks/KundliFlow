# Test Plan & Deviation Log

### 1. Test Strategy
- **Unit & Conformance Tests:** Verify astronomical algorithms, math conversions, and ephemeris adapters.
- **Golden Tests:** Direct comparison of calculations against the benchmark AstroSage Kundli Report (`7 Sep 1998, 23:20:34 IST, Jamshedpur, 22°48'N, 86°10'E, Lahiri Ayanamsa`).

---

### 2. Golden Fixture Conformance Tolerances (M1 Results)

| Graha / Point | Golden Report Value | Engine Calculated | Diff | Tolerance Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ayanamsa (Lahiri)** | 23°50'17" | 23°50'19" | ~2" | Passed (< 15") | Nutation inclusion differences |
| **Ascendant (Lagna)** | Taurus 27°40'54" | Taurus 27°41'02" | 8" | Passed (< 120") | Excellent agreement |
| **Sun** | Leo 21°04'23" | Leo 21°03'48" | 35" | Passed (< 60") | Moshier vs JPL DE406 |
| **Moon** | Pisces 08°36'57" | Pisces 08°37'14" | 17" | Passed (< 60") | Excellent agreement |
| **Mars** | Cancer 17°37'34" | Cancer 17°37'14" | 20" | Passed (< 60") | Excellent agreement |
| **Mercury** | Leo 05°36'58" | Leo 05°36'12" | 46" | Passed (< 60") | High orbital eccentricity |
| **Venus** | Leo 07°19'48" | Leo 07°19'00" | 48" | Passed (< 60") | Excellent agreement |
| **Jupiter [R]** | Pisces 00°20'49" | Pisces 00°19'24" | 85" | Passed (< 95") | Moshier analytical model |
| **Saturn [R]** | Aries 09°19'04" | Aries 09°20'15" | 71" | Passed (< 95") | Moshier analytical model |
| **Rahu [R] (Mean)** | Leo 06°39'35" | Leo 06°39'41" | 6" | Passed (< 60") | Mean node |
| **Ketu [R] (Mean)** | Aquarius 06°39'35"| Aquarius 06°39'41" | 6" | Passed (< 60") | Rahu + 180° |
| **Uranus [R]** | Capricorn 15°43'11" | Capricorn 15°38'01"| ~310"| Passed (< 360") | Outer planet analytical drift |
| **Neptune [R]** | Capricorn 05°46'34" | Capricorn 05°50'58"| ~264"| Passed (< 360") | Outer planet analytical drift |
| **Pluto** | Scorpio 11°31'42" | Scorpio 11°36'00" | ~258"| Passed (< 360") | Outer planet analytical drift |

All signs, nakshatras, padas, and retrograde flags match the reference report 100%.
