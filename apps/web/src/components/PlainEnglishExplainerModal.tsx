import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  Compass,
  Calendar,
  Layers,
  Award,
  Clock,
  Sparkles,
  BookOpen,
  FlaskConical,
  Search,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface PlainEnglishExplainerModalProps {
  onClose: () => void;
  initialTab?: string;
}

interface TermExplanation {
  term: string;
  sanskritName?: string;
  whatItIs: string;
  whyItHappens: string;
  plainEnglishMeaning: string;
  quickTakeaway: string;
}

interface TabCategory {
  id: string;
  title: string;
  icon: any;
  description: string;
  terms: TermExplanation[];
}

const GLOSSARY_CATEGORIES: TabCategory[] = [
  {
    id: 'kundli',
    title: 'Kundli & Charts',
    icon: Compass,
    description: 'The geometric celestial map at the exact moment of birth.',
    terms: [
      {
        term: 'Lagna (Ascendant)',
        sanskritName: 'Tanu Bhava (1st House)',
        whatItIs: 'The specific zodiac sign rising on the Eastern horizon at your exact second of birth.',
        whyItHappens: 'Earth rotates 360° every 24 hours, shifting the rising sign every ~2 hours.',
        plainEnglishMeaning: 'Your operating system, physical vitality, temperament, and how you instinctively navigate reality.',
        quickTakeaway: 'The Lagna sign defines house #1; all other 11 houses rotate from here.',
      },
      {
        term: 'D1 Rashi Chart',
        sanskritName: 'Janma Kundli',
        whatItIs: 'The primary birth chart showing real sidereal physical positions of all 9 grahas.',
        whyItHappens: 'Calculated using true astronomical coordinates minus the Lahiri Ayanamsa.',
        plainEnglishMeaning: 'The concrete physical world: your health, material assets, career, and physical surroundings.',
        quickTakeaway: 'The foundational master chart for all life readings.',
      },
      {
        term: 'D9 Navamsha Chart',
        sanskritName: 'Dharma Kundli',
        whatItIs: 'Each zodiac sign divided into 9 equal harmonic segments of 3°20\'.',
        whyItHappens: 'Maps each planet into its inner harmonic frequency.',
        plainEnglishMeaning: 'Your soul purpose, inner psychological strength, long-term marriage partner, and true destiny after age ~30.',
        quickTakeaway: 'A planet strong in D1 but debilitated in D9 will struggle to bear lasting fruit.',
      },
      {
        term: 'Shodashvargas (D1 to D60)',
        sanskritName: 'Divisional Harmonic Charts',
        whatItIs: '16 mathematical divisional charts slicing signs into halves, thirds, tenths, etc.',
        whyItHappens: 'Parashari mathematics magnifying specific domains like career (D10), wealth (D2), children (D7), and karma (D60).',
        plainEnglishMeaning: 'A specialist microscope: rather than guessing career from D1 alone, D10 specifically isolates professional mastery.',
        quickTakeaway: 'D1 = tree trunk; Vargas = specific individual fruits.',
      },
      {
        term: 'KP Sub-Lords & Nakshatra Nadi',
        sanskritName: 'Krishnamurti Padhdhati',
        whatItIs: 'Cusp-level precision dividing each Nakshatra into 9 unequal sub-divisions.',
        whyItHappens: 'Calculated using Placidus house cusps combined with Vimshottari lord ratios.',
        plainEnglishMeaning: 'Pinpoint precision: planets give the results of their Nakshatra Lord, but the Sub-Lord determines whether the outcome is favorable or blocked.',
        quickTakeaway: 'Explains why twins born 3 minutes apart have different life events.',
      },
      {
        term: 'Sripati Bhava Chalit',
        sanskritName: 'Bhava Madhya & Sandhi',
        whatItIs: 'House chart where midpoints (Madhya) define house centers instead of rigid sign boundaries.',
        whyItHappens: 'A planet near the cusp boundary (e.g., 29° or 1°) might shift into an adjacent house.',
        plainEnglishMeaning: 'Shows where planets actually exert their functional gravitational influence.',
        quickTakeaway: 'If a planet shifts in Chalit, it gives the psychological flavor of its Rashi, but event results of its Chalit house.',
      },
      {
        term: '12 Bhavas (House Classification)',
        sanskritName: 'Kendras, Trikonas & Dusthanas',
        whatItIs: 'Houses categorized into Kendra (1, 4, 7, 10 = action pillars), Trikona (1, 5, 9 = fortune/grace), Dusthana (6, 8, 12 = challenge/transformation), and Upachaya (3, 6, 10, 11 = growth over time).',
        whyItHappens: 'Classical division of human experience based on geometry relative to the ascendant.',
        plainEnglishMeaning: 'Kendra planets give public visibility; Trikona planets give effortless merit; Dusthana planets demand grit and spiritual healing.',
        quickTakeaway: 'Upachaya houses improve as you age; what felt hard in your 20s becomes your strength in your 40s.',
      },
      {
        term: 'Dual Kundli (Transit Overlay)',
        sanskritName: 'Gochar Samayoga',
        whatItIs: 'Live current sky planets overlaid directly onto your natal birth chart positions.',
        whyItHappens: 'Planets never stop moving; their live positions trigger your dormant birth promises.',
        plainEnglishMeaning: 'Shows current planetary triggers hitting your natal points right now.',
        quickTakeaway: 'A natal promise stays dormant until a matching transit triggers it.',
      },
    ],
  },
  {
    id: 'dashas',
    title: 'Dashas (Time Cycles)',
    icon: Calendar,
    description: 'The clock of karma showing which planetary energies are active.',
    terms: [
      {
        term: 'Vimshottari Dasha',
        sanskritName: '120-Year Lunar Cycle',
        whatItIs: 'A 120-year sequence of 9 planetary periods based on your birth Nakshatra.',
        whyItHappens: 'The Moon’s degree inside its birth constellation determines the starting dasha balance.',
        plainEnglishMeaning: 'The weather seasons of your life: Jupiter period brings learning/expansion; Saturn brings discipline/hard work; Venus brings relationships/comforts.',
        quickTakeaway: 'Mahadasha = the year; Antardasha = the month; Pratyantar = the week.',
      },
      {
        term: 'Yogini Dasha',
        sanskritName: '36-Year Repeating Cycle',
        whatItIs: 'A compact 36-year cycle of 8 divine feminine archetypes (Mangala, Pingala, Dhanya, Bhramari, Bhadrika, Ulka, Siddha, Sankata).',
        whyItHappens: 'Calculated from birth Nakshatra index modulo 8.',
        plainEnglishMeaning: 'Fast-acting, emotional, and psychological rhythms indicating immediate spikes of success or turbulence.',
        quickTakeaway: 'Repeats multiple times in a human lifespan for rapid event verification.',
      },
      {
        term: 'Jaimini Chara Dasha',
        sanskritName: 'Sign-Based Period Cycle',
        whatItIs: 'Entire zodiac signs become active for periods ranging from 1 to 12 years.',
        whyItHappens: 'Calculated using Jaimini formulas based on sign lord placements.',
        plainEnglishMeaning: 'Broad life chapters: when Scorpio is running, Scorpio’s house themes and aspects dominate your circumstances.',
        quickTakeaway: 'Focuses on soul evolution, career shifts, and major relocation chapters.',
      },
      {
        term: 'Dasha Hierarchy (Maha / Antar / Pratyantar)',
        sanskritName: 'Three-Tier Time Zoom',
        whatItIs: 'Hierarchical division of time: Mahadasha (major ruler, years), Antardasha (sub-ruler, months), and Pratyantar (sub-sub ruler, days/weeks).',
        whyItHappens: 'Fractal subdivision of each planetary period in proportion to the 120-year cycle.',
        plainEnglishMeaning: 'Mahadasha sets the climate (winter); Antardasha sets the weekly weather (blizzard); Pratyantar is the temperature today.',
        quickTakeaway: 'Event manifestation happens when all 3 levels coordinate on the same life theme.',
      },
    ],
  },
  {
    id: 'panchang',
    title: 'Panchang & Rhythms',
    icon: Clock,
    description: 'The 5 cosmic limbs of time at birth and in daily transits.',
    terms: [
      {
        term: 'Tithi',
        sanskritName: 'Lunar Phase (Jala Tatva)',
        whatItIs: 'The angular separation between Sun and Moon (every 12° represents one Tithi).',
        whyItHappens: 'Waxing (Shukla Paksha) when Moon moves away from Sun; Waning (Krishna Paksha) when Moon approaches Sun.',
        plainEnglishMeaning: 'Your emotional receptivity, financial relationships, and inner happiness capacity.',
        quickTakeaway: 'Purnima (Full Moon) = full fullness; Amavasya (New Moon) = introspection/restart.',
      },
      {
        term: 'Vara',
        sanskritName: 'Weekday Lord (Agni Tatva)',
        whatItIs: 'The planetary ruler of the 24-hour solar day from Sunrise to Sunrise.',
        whyItHappens: 'Determined by the natural planetary speed sequence (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn).',
        plainEnglishMeaning: 'Your physical energy, longevity, stamina, and willpower.',
        quickTakeaway: 'A native born on Sunday has solar vitality; on Monday has lunar adaptability.',
      },
      {
        term: 'Nakshatra & Pada',
        sanskritName: 'Lunar Constellation (Vayu Tatva)',
        whatItIs: 'One of the 27 stellar sectors of 13°20\' along the ecliptic; each split into 4 Padas of 3°20\'.',
        whyItHappens: 'The real star cluster in front of which the Moon was passing at birth.',
        plainEnglishMeaning: 'Your deep subconscious mind, innate talents, instinctive patterns, and core soul frequency.',
        quickTakeaway: 'Nakshatra is far more psychologically descriptive than just the zodiac sign.',
      },
      {
        term: 'Yoga (Panchang)',
        sanskritName: 'Solar-Lunar Combination (Akasha Tatva)',
        whatItIs: 'The mathematical sum of Sun’s longitude and Moon’s longitude (divided into 27 equal yogas).',
        whyItHappens: 'Binds consciousness (Sun) with emotional mind (Moon).',
        plainEnglishMeaning: 'Your health constitution, moral character, and overall harmony with universal flow.',
        quickTakeaway: 'Benefic yogas (Siddha, Sukarma) grant ease; harsh yogas (Vajra, Vyaghata) require patient effort.',
      },
      {
        term: 'Karana',
        sanskritName: 'Half-Tithi (Prithvi Tatva)',
        whatItIs: 'One half of a Tithi (6° separation between Sun and Moon).',
        whyItHappens: '60 Karana segments across each lunar month.',
        plainEnglishMeaning: 'Your capacity to execute tasks, work ethics, and concrete achievements in the material world.',
        quickTakeaway: 'Bhadra/Vishti karana suggests avoiding major commercial launches.',
      },
      {
        term: 'Abhijit & Brahma Muhurta',
        sanskritName: 'Victorious & Creator Windows',
        whatItIs: 'Brahma Muhurta occurs ~1.5 hours before sunrise; Abhijit Muhurta occurs during the 8th daytime muhurta centered around local noon.',
        whyItHappens: 'High sattvic prana before sunrise; solar peak nullifies ordinary doshas at noon.',
        plainEnglishMeaning: 'Brahma Muhurta = optimal window for meditation/clarity; Abhijit = supreme time to start any urgent task without checking complex astrology.',
        quickTakeaway: 'Lord Shiva said Abhijit Muhurta destroys countless negative planetary influences.',
      },
      {
        term: 'Chandra Bala & Tara Bala',
        sanskritName: 'Lunar Strength & Stellar Rhythm',
        whatItIs: 'Chandra Bala counts Moon’s transit house from your birth Moon (favorable: 1, 3, 6, 7, 10, 11); Tara Bala counts from your birth Nakshatra (9 taras).',
        whyItHappens: 'Evaluates personal harmony between the cosmic sky and your natal mental wiring on any given date.',
        plainEnglishMeaning: 'Tara 2 (Sampat = wealth), Tara 4 (Kshema = well-being), Tara 8 (Mitra = friendship) bring effortless flow; Tara 7 (Naidhana = danger) advises caution.',
        quickTakeaway: 'Your personal daily compass: even a universally good day will feel dragging if your Tara Bala is in Vipat/Pratyak.',
      },
    ],
  },
  {
    id: 'strengths',
    title: 'Strengths & Tables',
    icon: Award,
    description: 'Mathematical matrices proving how much power a planet actually possesses.',
    terms: [
      {
        term: 'Shadbala',
        sanskritName: 'Six-Fold Planetary Potency',
        whatItIs: 'Composite score evaluating positional (Sthana), directional (Dig), temporal (Kaala), motional (Chesta), natural (Naisargika), and aspectual (Drik) strengths.',
        whyItHappens: 'Computed in Virupas / Rupas against classical minimum thresholds.',
        plainEnglishMeaning: 'Answers: "Does this planet have the horsepower to deliver its promises?"',
        quickTakeaway: 'A planet can be in a great house, but if its Shadbala is low, its results will be faint or delayed.',
      },
      {
        term: 'Dig Bala (Directional Strength)',
        sanskritName: 'Directional Advantage',
        whatItIs: 'Jupiter & Mercury thrive in East (1st House); Sun & Mars in South (10th); Saturn in West (7th); Moon & Venus in North (4th).',
        whyItHappens: 'Planets resonate with specific quadrants of the sky.',
        plainEnglishMeaning: 'Directional clarity: Sun/Mars in 10th give natural executive leadership; Jupiter/Mercury in 1st give sharp intelligence.',
        quickTakeaway: 'Maximum Dig Bala equals 60 Virupas (1 Rupa).',
      },
      {
        term: 'Bhavabala',
        sanskritName: '12 House Potency Strengths',
        whatItIs: 'Strength rating of each of the 12 houses combining house lord, directional placement, and planetary aspects.',
        whyItHappens: 'Houses are the life stages; Bhavabala determines which domains flourish naturally.',
        plainEnglishMeaning: 'Rank #1 house = your most naturally empowered life arena; Rank #12 = requires conscious building.',
        quickTakeaway: 'Explains why someone might succeed wildly in career (10th) but struggle in partnership (7th).',
      },
      {
        term: 'Ashtakvarga (SAV & BAV)',
        sanskritName: '337 Collective Bindu Matrix',
        whatItIs: 'An objective point matrix where 7 grahas + Lagna contribute auspicious points (bindus) to all 12 signs.',
        whyItHappens: 'Total Sarva Ashtakvarga points always sum exactly to 337.',
        plainEnglishMeaning: 'Average sign strength is 28 bindus. Signs with ≥ 30 bindus are rich reservoirs of support; signs with < 25 require careful pacing.',
        quickTakeaway: 'When transiting planets pass through your high-SAV signs, events succeed with minimal friction.',
      },
      {
        term: 'Five-Fold Friendship (Pancha-Mitra)',
        sanskritName: 'Natural + Temporal Relationship',
        whatItIs: 'Combines permanent natural friendship with temporal 2nd, 3rd, 4th, 10th, 11th, 12th placement from each other.',
        whyItHappens: 'Yields 5 states: Intimate Friend, Friend, Neutral, Enemy, Bitter Enemy.',
        plainEnglishMeaning: 'Determines whether two planets cooperate or create passive-aggressive tension when aspecting or conjunct.',
        quickTakeaway: 'A natural enemy that becomes a temporal friend acts in a civilized, constructive manner.',
      },
      {
        term: 'Retrograde (Vakra) & Combust (Asta)',
        sanskritName: 'Apparent Backward Motion & Solar Burn',
        whatItIs: 'Retrograde: Earth overtaking another planet making it appear to reverse in the sky; Combust: planet positioned within 6°–14° of the blazing Sun.',
        whyItHappens: 'Orbital geometry relative to Earth and Sun.',
        plainEnglishMeaning: 'Retrograde planets have high Chesta Bala (intense inner drive, unconventional genius, repeat lessons); Combust planets lose external confidence and must operate with spiritual detachment.',
        quickTakeaway: 'Retrograde is not weak—in Vedic astrology, it makes benefics exceptionally strong and purposeful.',
      },
    ],
  },
  {
    id: 'insights',
    title: 'Interpretations, Yogas & Avasthas',
    icon: BookOpen,
    description: 'The psychological architecture, character blueprints, and planetary states.',
    terms: [
      {
        term: 'Avakahada Blueprint',
        sanskritName: 'Constitutional Matrix',
        whatItIs: 'Varna (Temperament), Yoni (Animal Archetype), Gana (Deva/Manushya/Rakshasa), Nadi (Ayurvedic dosha flow), and Paya (Foundation metal).',
        whyItHappens: 'Calculated directly from birth Nakshatra and Moon Pada.',
        plainEnglishMeaning: 'Your deep biological and behavioral compatibility blueprint.',
        quickTakeaway: 'Used for ancient relationship matching and understanding innate instinctual reactions.',
      },
      {
        term: 'Classical Yogas (Raj & Dhana)',
        sanskritName: 'Planetary Combinations',
        whatItIs: 'Specific geometric alignments between Kendra (action 1, 4, 7, 10) and Trikona (grace 1, 5, 9) lords.',
        whyItHappens: 'Kendra = Vishnu (effort); Trikona = Lakshmi (blessing). Their union creates extraordinary success.',
        plainEnglishMeaning: 'Budha-Aditya = intellectual brilliance; Gaja-Kesari = respected public wisdom; Hamsa = spiritual dignity.',
        quickTakeaway: 'Yogas show special talents that awaken during the dashas of participating planets.',
      },
      {
        term: 'Planetary Avasthas (Baladi & Deeptadi)',
        sanskritName: 'Age and Consciousness States',
        whatItIs: 'Classifies planets into Bala (infant), Kumar (youth), Yuva (prime), Vradha (old), Mrita (dormant) based on degree in sign.',
        whyItHappens: 'Odd signs progress forward (0-30°); even signs progress backward (30-0°).',
        plainEnglishMeaning: 'A planet in Yuva (12°-18°) delivers 100% of its promise; a planet in Mrita (dead) must rely on its dispositor.',
        quickTakeaway: 'Deeptadi avastha reveals mood: Deepta = radiant/exalted; Dukhita = pained/stressed.',
      },
      {
        term: 'Jaimini Chara Karakas',
        sanskritName: 'Variable Soul Significators',
        whatItIs: 'The 7 planets ranked by highest degree in sign (Atmakaraka AK, Amatyakaraka AmK, etc.).',
        whyItHappens: 'The planet with highest degree (closest to 30°) carries the soul’s primary lesson.',
        plainEnglishMeaning: 'Atmakaraka (AK) = your true soul self; Amatyakaraka (AmK) = your professional counselor/career driver; Darakaraka (DK) = spouse.',
        quickTakeaway: 'The sign your Atmakaraka occupies in Navamsha is your Karakamsa (soul purpose).',
      },
      {
        term: 'Ghatak Chakra (Avoidance Windows)',
        sanskritName: 'Inauspicious Transit Alignments',
        whatItIs: 'Specific combinations of weekday, tithi, nakshatra, and moon sign that cause friction for your natal Moon.',
        whyItHappens: 'Derived from ancient classical texts on personal biorhythms.',
        plainEnglishMeaning: 'Avoid scheduling elective surgeries, signing irreversible contracts, or launching sensitive ventures on your Ghatak day/tithi.',
        quickTakeaway: 'Ghatak is a preventive guardrail, not a curse.',
      },
      {
        term: 'Manglik Dosha (Kuja Dosha)',
        sanskritName: 'Martian Intensity in 1, 2, 4, 7, 8, 12',
        whatItIs: 'Mars placed in houses associated with marital harmony and emotional temper.',
        whyItHappens: 'Mars brings fire, raw drive, direct speech, and intolerance for passive-aggressiveness.',
        plainEnglishMeaning: 'Indicates high independence, fiery drive, and a requirement for a partner who communicates directly rather than holding grudges.',
        quickTakeaway: 'Most classical fears are overblown; multiple classical cancellations (e.g. Mars in own sign/exalted, Jupiter aspect) exist.',
      },
      {
        term: 'Mutual Aspects (Vedic Drishti & Angles)',
        sanskritName: 'Drik Sambandha',
        whatItIs: 'Planets casting optical rays across the chart: all planets cast full aspect on the 7th house (opposition), while Mars (4, 8), Jupiter (5, 9), and Saturn (3, 10) have special full drishti.',
        whyItHappens: 'Planets observe and illuminate opposite or resonant celestial sectors.',
        plainEnglishMeaning: 'Aspects modify the behavior of the recipient planet. Jupiter’s glance sanctifies and protects; Saturn’s glance tests and demands maturity.',
        quickTakeaway: 'Even if a planet is placed in a difficult house, a benefic aspect from Jupiter provides a divine safety net.',
      },
    ],
  },
  {
    id: 'timequality',
    title: 'Time Quality & Daily Windows',
    icon: Sparkles,
    description: 'Hourly planetary weather for optimal daily timing (Muhurta).',
    terms: [
      {
        term: '24 Unequal Horas',
        sanskritName: 'Planetary Hours',
        whatItIs: 'Daytime and nighttime each divided into 12 proportional hours from Sunrise to Sunset.',
        whyItHappens: 'Ruled sequentially by the Chaldean planetary speed order.',
        plainEnglishMeaning: 'Jupiter hora = excellent for finance/contracts; Mercury hora = great for writing/coding; Mars hora = great for exercise/courage.',
        quickTakeaway: 'Aligning your activity with the active hora lord reduces operational friction.',
      },
      {
        term: 'Flowing, Steady & Go Gently Bands',
        sanskritName: 'Time Quality Score (-6 to +7)',
        whatItIs: 'Real-time additive mathematical score combining transit Moon, Chandra Bala, Tara Bala, Hora lord, and SAV strength.',
        whyItHappens: 'Pure deterministic calculation; no arbitrary random generators.',
        plainEnglishMeaning: 'Flowing (Green) = proactive action favored; Steady (Gold) = balanced routine work; Go Gently (Amber) = patience, low friction, introspection.',
        quickTakeaway: 'Gives you an objective pulse of current celestial weather.',
      },
      {
        term: 'Rahu Kalam',
        sanskritName: 'Vortex of Rahu (1/8th of Day)',
        whatItIs: 'A 90-minute segment of the daytime governed by the shadowy North Node Rahu.',
        whyItHappens: 'Occurs at a fixed mathematical 1/8th segment depending on the weekday.',
        plainEnglishMeaning: 'Time of optical illusion and clouded judgment: avoid signing major deeds or embarking on critical journeys.',
        quickTakeaway: 'Excellent for meditation, research, and deep individual focus.',
      },
      {
        term: 'Yamaganda & Gulika',
        sanskritName: 'Ketu & Saturnian Windows',
        whatItIs: 'Fixed 90-minute daytime segments ruled by Jupiter’s son (Yamaganda) and Saturn’s son (Gulika).',
        whyItHappens: 'Calculated by dividing sunrise to sunset into 8 equal parts.',
        plainEnglishMeaning: 'Yamaganda represents death of initiative (unfavorable for money); Gulika represents Saturnian gravity (good for quiet spiritual work).',
        quickTakeaway: 'Classical Vedic muhurta safety windows.',
      },
      {
        term: 'Sade Sati & Shani Gochar',
        sanskritName: 'Saturn’s 7.5 Year Transit',
        whatItIs: 'Saturn transiting the 12th, 1st, and 2nd houses from your natal Moon sign (~7.5 years total).',
        whyItHappens: 'Saturn spends ~2.5 years in each of the 3 consecutive signs.',
        plainEnglishMeaning: 'The great cosmic reality check: removes illusions, forces maturity, builds unshakeable character, and restructures priorities.',
        quickTakeaway: 'Not a punishment, but a masterclass in patience, humility, and authentic self-reliance.',
      },
      {
        term: 'Personal Calibration & Empirical Scoring',
        sanskritName: 'Scientific Self-Validation',
        whatItIs: 'Logging your subjective energy, focus, and mood daily to compare with the engine’s mathematical predictions.',
        whyItHappens: 'Astrology without verification is dogma; empirical logging correlates celestial rhythms to your personal biochemistry.',
        plainEnglishMeaning: 'Answers: "Does the system accurately predict MY real-world performance?"',
        quickTakeaway: 'Builds an unshakeable, data-driven understanding of how transits genuinely affect you.',
      },
    ],
  },
];

export const PlainEnglishExplainerModal: React.FC<PlainEnglishExplainerModalProps> = ({
  onClose,
  initialTab = 'kundli',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  const activeCategory = GLOSSARY_CATEGORIES.find((c) => c.id === selectedCategory) || GLOSSARY_CATEGORIES[0]!;

  const filteredTerms = activeCategory.terms.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.term.toLowerCase().includes(q) ||
      (t.sanskritName && t.sanskritName.toLowerCase().includes(q)) ||
      t.plainEnglishMeaning.toLowerCase().includes(q) ||
      t.whatItIs.toLowerCase().includes(q)
    );
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(10, 8, 22, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2500,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: '920px',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            backgroundColor: 'rgba(32, 29, 64, 0.95)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                padding: '8px',
                borderRadius: '10px',
                backgroundColor: 'rgba(227, 173, 70, 0.15)',
                color: 'var(--gold)',
                border: '1px solid rgba(227, 173, 70, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, fontFamily: 'Cinzel, serif' }}>
                  Astrology Demystified (Plain English Guide)
                </h2>
                <span className="gold-badge" style={{ fontSize: '10px', padding: '2px 8px' }}>
                  Beginner Friendly
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Every calculation and data point explained: What it is, why it happens, and what it means in plain English.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              color: 'var(--text-muted)',
              padding: '6px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: 'transparent',
            }}
            title="Close Guide"
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Category Tabs & Search Bar */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--surface-alt)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', maxWidth: '100%' }}>
            {GLOSSARY_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSearchQuery('');
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: isSelected ? 'var(--gold)' : 'rgba(21, 19, 43, 0.6)',
                    color: isSelected ? '#15132b' : 'var(--text-muted)',
                    border: isSelected ? '1px solid var(--gold)' : '1px solid var(--border-subtle)',
                  }}
                >
                  <Icon style={{ width: '14px', height: '14px' }} />
                  {cat.title}
                </button>
              );
            })}
          </div>

          <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 auto', maxWidth: '280px' }}>
            <Search
              style={{
                width: '14px',
                height: '14px',
                color: 'var(--text-muted)',
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
            <input
              type="text"
              placeholder="Search terms or concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-ink)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '6px 12px 6px 32px',
                fontSize: '12px',
                color: 'var(--text-main)',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Content Body: Terms List */}
        <div
          style={{
            padding: '20px',
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', paddingBottom: '4px' }}>
            Showing calculations for <strong style={{ color: 'var(--text-main)' }}>{activeCategory.title}</strong>: {activeCategory.description}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredTerms.map((t, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'rgba(42, 38, 82, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                    borderBottom: '1px solid var(--border-subtle)',
                    paddingBottom: '8px',
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'var(--gold)',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {t.term}
                      {t.sanskritName && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 400,
                            color: 'var(--text-muted)',
                            fontStyle: 'italic',
                          }}
                        >
                          ({t.sanskritName})
                        </span>
                      )}
                    </h3>
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--teal)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Sparkles style={{ width: '12px', height: '12px' }} />
                    {t.quickTakeaway}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '12px',
                    fontSize: '12px',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      1. What Is Happening?
                    </span>
                    <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--text-main)' }}>{t.whatItIs}</p>
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--surface-alt)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      2. Why Does It Happen?
                    </span>
                    <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--text-main)' }}>{t.whyItHappens}</p>
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(95, 194, 179, 0.08)',
                      border: '1px solid rgba(95, 194, 179, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        color: 'var(--teal)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      3. Plain English Meaning
                    </span>
                    <p style={{ margin: 0, lineHeight: 1.5, fontWeight: 500, color: 'var(--text-main)' }}>
                      {t.plainEnglishMeaning}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {filteredTerms.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No matching astrological terms found for &quot;{searchQuery}&quot;.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}
        >
          <span>MyAstro Deterministic Astrology • Written for beginners & scholars alike</span>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-alt)',
              color: 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
