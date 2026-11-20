# MyAstro — Visual Asset Generation Guide

Drop generated assets into `apps/web/public/assets/` using the exact filenames below. The UI is designed on a **deep cosmic indigo (`#15132b`)** background with **antique gold (`#e3ad46`)** and **celestial teal (`#5fc2b3`)** accents.

## Global Style Prompt Suffix (append to every prompt)
> *"minimalist luxury Vedic astrology icon, fine antique gold (#e3ad46) and soft celestial teal (#5fc2b3) linework on deep midnight indigo (#15132b) background, subtle sacred geometry halo, clean vector-like illustration, crisp centered composition, no text, no watermark"*

---

## 1. Brand, Hero & AI Copilot (512×512 PNG or WebP)

| Filename | Where Used | Prompt |
| :--- | :--- | :--- |
| `apps/web/public/assets/brand-logo.png` | Top bar & sidebar logo | Minimalist golden lotus and crescent moon inscribed inside a geometric Sri Yantra star, antique gold and teal glow on `#15132b` |
| `apps/web/public/assets/onboarding-hero.png` | First-visit onboarding screen (1200×600) | Serene Vedic astronomical observatory at night, golden astrolabe rings and zodiac constellations over calm indigo horizon, editorial illustration, no text |
| `apps/web/public/assets/copilot-avatar.png` | Ask AI Chatbot avatar (256×256) | Glowing celestial astrolabe orb with subtle golden constellation rings and teal core, friendly mystical AI assistant icon |
| `apps/web/public/assets/blueprint-bg.png` | Shareable Cosmic Blueprint card background (1080×1080) | Subtle dark midnight indigo celestial chart background with faint golden orbital arcs and starfield borders, plenty of dark space in center for text |

---

## 2. Five Sacred / Section Motif Icons (256×256 PNG, transparent or `#15132b` bg)

| Filename | Tab / Meaning | Prompt |
| :--- | :--- | :--- |
| `apps/web/public/assets/motif-ganesha.png` | Onboarding & Auspicious Muhurta | Stylized minimalist golden Ganesha emblem in sacred geometry linework, serene and refined, subtle teal aura |
| `apps/web/public/assets/motif-surya.png` | Today & Daily Time Quality | Radiant Vedic Surya sun medallion with 12 delicate rays and geometric center, antique gold and warm amber |
| `apps/web/public/assets/motif-kalachakra.png` | Timing (Dashas & Gochar) | Intricate Vedic Kala Chakra wheel of time with concentric orbital rings and crescent moons, gold and teal linework |
| `apps/web/public/assets/motif-yantra.png` | Strengths, Yogas & Shadbala | Sacred geometric lotus yantra with balanced triangles and glowing center bindi, antique gold on deep indigo |
| `apps/web/public/assets/motif-journal.png` | Journal & Life Patterns | Celestial quill pen and open astronomical almanac scroll with small stars rising from the page, gold and teal |

---

## 3. Nine Navagraha (Planet) Icons (256×256 PNG)

| Filename | Planet (Graha) | Prompt |
| :--- | :--- | :--- |
| `apps/web/public/assets/planets/sun.png` | Sun (Surya) | Regal golden solar disc with subtle flame corona and Vedic bindu center, radiant gold on `#15132b` |
| `apps/web/public/assets/planets/moon.png` | Moon (Chandra) | Luminous silver-teal crescent moon cradling a pearl-like full orb, calm lunar glow |
| `apps/web/public/assets/planets/mars.png` | Mars (Mangala) | Sculpted warm copper-gold Mars sphere with subtle geometric spear/triangle aura, dynamic yet refined |
| `apps/web/public/assets/planets/mercury.png` | Mercury (Budha) | Crisp emerald-teal winged sphere with fine sacred geometry intellect grid, sharp and luminous |
| `apps/web/public/assets/planets/jupiter.png` | Jupiter (Guru) | Majestic golden-amber banded planet with halo of wisdom lotus petals, warm sovereign glow |
| `apps/web/public/assets/planets/venus.png` | Venus (Shukra) | Opalescent pearl-and-gold planet surrounded by delicate geometric rose-lotus symmetry |
| `apps/web/public/assets/planets/saturn.png` | Saturn (Shani) | Deep sapphire and antique gold ringed planet with crisp geometric elliptical rings, disciplined timeless elegance |
| `apps/web/public/assets/planets/rahu.png` | Rahu (North Node) | Mystical indigo-teal eclipse ring with subtle ascending serpent-arc geometry, smoky celestial glow |
| `apps/web/public/assets/planets/ketu.png` | Ketu (South Node) | Ethereal golden-violet comet/flag emblem with descending lunar node arc and starlight tail |

---

## 4. Twelve Rashi (Zodiac) Emblems (256×256 PNG)

Generate all 12 in the same thin-gold-line medallion style so they match the chart & House cards:
- `apps/web/public/assets/signs/aries.png` — Minimalist golden ram horns medallion (Mesha)
- `apps/web/public/assets/signs/taurus.png` — Minimalist golden bull silhouette medallion (Vrishabha)
- `apps/web/public/assets/signs/gemini.png` — Minimalist golden twin stars / dual pillars medallion (Mithuna)
- `apps/web/public/assets/signs/cancer.png` — Minimalist golden crab / crescent water medallion (Karka)
- `apps/web/public/assets/signs/leo.png` — Minimalist golden lion crest medallion (Simha)
- `apps/web/public/assets/signs/virgo.png` — Minimalist golden wheat & lotus maiden emblem (Kanya)
- `apps/web/public/assets/signs/libra.png` — Minimalist golden celestial scales medallion (Tula)
- `apps/web/public/assets/signs/scorpio.png` — Minimalist golden scorpion constellation medallion (Vrishchika)
- `apps/web/public/assets/signs/sagittarius.png` — Minimalist golden celestial bow and arrow medallion (Dhanu)
- `apps/web/public/assets/signs/capricorn.png` — Minimalist golden Makara (sea-goat) medallion (Makara)
- `apps/web/public/assets/signs/aquarius.png` — Minimalist golden Kumbha (sacred water vessel) pouring starlight (Kumbha)
- `apps/web/public/assets/signs/pisces.png` — Minimalist golden twin cosmic fish in yin-yang circle (Meena)
