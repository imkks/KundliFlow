import type { AgentSkill, SkillId } from './types.js';

/**
 * Code-native Deep Agent Jyotish Skills Registry.
 * Distilled from classical Parashari/Jaimini/Tajaka rules (PVR Narasimha Rao & Dr. K.S. Charak)
 * for progressive disclosure in the runtime AI orchestrator.
 */
export const AGENT_SKILLS: readonly AgentSkill[] = [
  {
    id: 'career_vocation',
    title: 'Career, Vocation & Public Status',
    catalogSummary: 'D1+D10 career path, promotions, job changes, authority (A10, AL, GL, AmK, Argala on Saturn).',
    topicIds: ['career'],
    triggerPatterns: [/\b(career|job|work|profession|promotion|boss|business|office|vocation|company|resign|switch job|appraisal|role)\b/i],
    timescale: 'adaptive',
    primaryVargas: ['D1', 'D10'],
    primaryHouses: [10, 6, 2, 11, 7],
    keyArudhas: ['AL', 'A10'],
    keyKarakas: ['AmK', 'saturn', 'sun', 'mercury'],
    recommendedTools: [
      'read("/houses/10")',
      'inspect_varga("D10")',
      'inspect_varga_analytics("D10")',
      'inspect_functional_roles()',
      'inspect_argala("saturn")',
      'inspect_karakas("AmK")',
      'inspect_arudhas("A10")',
      'inspect_dashas("vimshottari")',
    ],
    protocolSteps: [
      'Check D1 10th house, 10th lord functional nature, D10 Dashamsha placements, and D10 Divisional SAV + D10 Narayana Dasa + Natal D10 x Transit D1 via inspect_varga_analytics("D10").',
      'Check Amatyakaraka (AmK), Raja Sambandha Yogas, D5 Panchamsha (fame/followers), and unobstructed Argala on Saturn (karaka of livelihood) to pinpoint vocation flavor & decisive backers.',
      'Compare 10th from Lagna (actual competence) vs D1 & D10 Varga Arudhas (inspect_arudhas("A10", "D10") / AL) + Graha Arudhas (subjective experience) and Ghati Lagna (GL) for authority/rank.',
      'For timing (job change/promotion): converge Vimshottari MD-AD axis + Rath Tripod/Drekkana + D10 Narayana Dasa + Double Transit + Varshaphal (PVB Varsheshwara, D10 Varsha Narayana, Karma/Rajya Saham Ithasala, Patyayini & Maasa Pravesh monthly charts).',
    ],
    disconnectCheck:
      'Strong 10th from Lagna + afflicted A10/AL = high capability but overlooked recognition; strong A10/AL + weak 10th = impressive title/PR carrying hidden strain.',
    pitfalls: [
      'Never evaluate career solely from D1 without checking D10 Dashamsha.',
      'Check whether 10th lord is in 6th (service/law/problem-solving), 8th (research/crisis/sudden pivots), or 12th (foreign/MNC/behind-the-scenes) rather than labeling dusthana placement as "bad career".',
    ],
    reasoningPattern:
      'D1+D10 Promise (10th lord + AmK + Saturn Argala) -> Active MD-AD harmony & D10 activation -> Jupiter+Saturn Double Transit & SAV >= 28 -> Practical positioning step.',
  },
  {
    id: 'marriage_relationships',
    title: 'Marriage, Spouse & Committed Partnerships',
    catalogSummary: 'D1+D9 relationships, marriage timing, partner nature, longevity/endurance (7th, DK, UL, A7, Doshas).',
    topicIds: ['relationships'],
    triggerPatterns: [/\b(marriage|marry|spouse|wife|husband|partner|relationship|love|dating|divorce|compatibility|manglik|kuja)\b/i],
    timescale: 'adaptive',
    primaryVargas: ['D1', 'D9'],
    primaryHouses: [7, 2, 8, 11],
    keyArudhas: ['UL', 'A7'],
    keyKarakas: ['DK', 'venus', 'jupiter'],
    recommendedTools: [
      'read("/houses/7")',
      'inspect_varga("D9")',
      'inspect_varga_analytics("D9")',
      'inspect_arudhas("UL")',
      'inspect_karakas("DK")',
      'inspect_natal_lore("doshas")',
      'inspect_dashas("vimshottari")',
    ],
    protocolSteps: [
      'Evaluate Natal Promise across D1 7th house/lord, Venus/Jupiter, D9 Navamsha (especially 1/7 & 4/10 axes + Mars/Venus influence per K.N. Rao), and D9 Divisional SAV + D9 Narayana Dasa via inspect_varga_analytics("D9").',
      'Inspect Darakaraka (DK) for spouse soul flavor, Upapada Lagna (UL) for marital endurance, and K.N. Rao markers: Moon-Venus 1/7 opposition (strain), Jupiter in D1/D9 Lagna ("Ganga water" rescuing delayed marriages), and 10th from 7th (4th house) for spouse profession.',
      'Check Manglik/Kuja Dosha AND classical Bhanga cancellations candidly, adapting classical 18th/33rd-yr widowhood combinations to modern divorce/separation risks.',
      'For marriage timing: converge Vimshottari MD/AD/PD (checking D1+D9 6/8 breakup flags) + D9 Narayana Dasa + Retrograde-aware Double Transit on 1/7 + Varshaphal Vivaha Saham Ithasala & wedding-day Mars-on-natal-Venus trigger.',
    ],
    disconnectCheck:
      'Afflicted 7th from Lagna or Moon + strong UL in Kendra from AL = socially respected marriage on the outside with private emotional friction inside.',
    pitfalls: [
      'Never declare Manglik Dosha fearfully without reporting cancellations and D9 balance.',
      'Distinguish A7 (attraction/associates) from UL (formal committed bond).',
    ],
    reasoningPattern:
      'D1+D9 7th & DK nature -> UL endurance & AL perception -> Dosha/Bhanga balance -> Dasha + Double Transit window (plus UL-lord weekday practice if asked).',
  },
  {
    id: 'wealth_finances',
    title: 'Wealth, Assets, Cash Flow & Business Gains',
    catalogSummary: 'D1+D2+D4 savings, gains, financial surges vs drains (2nd, 11th, HL, SL, Indu, AL, A2, A11, Yogada).',
    topicIds: ['money'],
    triggerPatterns: [/\b(wealth|money|finance|income|salary|rich|debt|loan|savings|invest|profit|cash|expense|windfall|asset)\b/i],
    timescale: 'adaptive',
    primaryVargas: ['D1', 'D2', 'D4'],
    primaryHouses: [2, 11, 5, 9, 12],
    keyArudhas: ['AL', 'A2', 'A11'],
    keyKarakas: ['jupiter', 'venus', 'mercury'],
    recommendedTools: [
      'read("/houses/2")',
      'read("/houses/11")',
      'inspect_functional_roles()',
      'inspect_arudhas("A11")',
      'inspect_natal_lore("special_lagnas")',
      'inspect_dashas("sudasa")',
      'inspect_natal_lore("yogas")',
    ],
    protocolSteps: [
      'Assess D1 2nd (accumulated wealth), 11th (gains), and Lakshmi Trines (5th/9th) plus 4-factor graded Dhana Yogas, Naabhasa Yogas, and Parivartana exchanges.',
      'Check Special Lagnas (HL, SL, Indu Lagna), Yogada links, and Sudasa (Sree Lagna Kendradi Rasi Dasa) — the primary classical timing system for wealth & material status.',
      'Check 11th from AL (sources of inflow) vs 12th from AL (nature of outflow/expenses) and unobstructed Argala on A11.',
      'For financial surges, windfalls, or speculative timing: converge Sudasa + Vimshottari MD-AD axis (flagging 2/12 drains vs 5/9 & 3/11 gains) + Jupiter transit bindus (BAV >= 5, SAV >= 28) + Artha/Labha Saham Ithasala.',
    ],
    disconnectCheck:
      'Strong 2nd/11th Dhana Yogas + Saturn/Ketu on AL/A11 = genuine quiet wealth behind a modest external lifestyle.',
    pitfalls: [
      'Always separate tangible assets (2nd/4th/D4) from liquid gains (11th/A11), speculative 5th/8th spikes, and outward luxury perception (AL).',
    ],
    reasoningPattern:
      'Dhana Yogas & 2nd/11th promise -> HL/SL/Yogada capacity -> AL 11th vs 12th inflow/outflow balance -> Dasha & Jupiter SAV timing.',
  },
  {
    id: 'personality_strengths',
    title: 'Core Personality, Strengths, Yogas & Chart Architecture',
    catalogSummary: 'Lagna, Moon, Sun, Paaka Lagna, functional roles, Shadbala leadership, Vaisheshikamsa, Pushkara, Yogas.',
    topicIds: ['self_personality'],
    triggerPatterns: [/\b(personality|who am i|strength|weakness|yoga|dosha|temperament|nature|talent|overview|birth chart|about me|strongest planet)\b/i],
    timescale: 'macro_natal',
    primaryVargas: ['D1', 'D9', 'D27'],
    primaryHouses: [1, 5, 9],
    keyArudhas: ['AL'],
    keyKarakas: ['AK', 'sun', 'moon'],
    recommendedTools: [
      'read("/overview")',
      'compare_perspectives(1)',
      'inspect_functional_roles()',
      'inspect_strengths("shadbala")',
      'inspect_strengths("vaisheshikamsa")',
      'inspect_natal_lore("yogas")',
    ],
    protocolSteps: [
      'Synthesize the 3-Plane self via compare_perspectives(1): Lagna (physical vitality & path), Moon (emotional mind), Sun (ego/soul), AL (how others perceive you), Paaka Lagna (where Lagna lord channels energy), and Karakamsa (D9 AK).',
      'Identify Yogakaraka, Functional Benefics, Functional Malefics, Baadhaka, and any Parivartana exchanges first.',
      'Use Shadbala to identify the "group leader" planet delivering multi-planet Yogas, Vaisheshikamsa (10-varga dignity) to grade Yoga magnitude, and Pushkara/Avasthas for refinement.',
    ],
    disconnectCheck:
      'Fortified AL with an afflicted Moon or weak 4th/1st = admired and successful externally while feeling privately restless or misunderstood.',
    pitfalls: [
      'Do not use strength metrics interchangeably: Shadbala = leadership/stamina, Ashtakvarga = environmental harmony, Vaisheshikamsa = life-wide dignity, Avasthas = mood/activity.',
      'Always note Varga cusp sensitivity if Lagna sits near a D9/D10 border.',
    ],
    reasoningPattern:
      'Lagna/Moon/AL 3-Plane portrait -> Functional Benefics & Shadbala leader -> Top Vaisheshikamsa-backed Yogas -> Balanced growth edge.',
  },
  {
    id: 'home_family_property',
    title: 'Home, Mother, Property & Emotional Foundations',
    catalogSummary: 'D1+D4 home stability, real estate, mother, vehicles, and inner peace (4th, A4, Moon, Mars, Argala).',
    topicIds: ['home_family'],
    triggerPatterns: [/\b(home|house|property|real estate|mother|mom|family|domestic|peace of mind|vehicle|car|land|buy a house)\b/i],
    timescale: 'adaptive',
    primaryVargas: ['D1', 'D4', 'D16'],
    primaryHouses: [4, 2, 12],
    keyArudhas: ['A4', 'AL'],
    keyKarakas: ['moon', 'mars', 'venus'],
    recommendedTools: [
      'read("/houses/4")',
      'compare_perspectives(4)',
      'inspect_varga("D4")',
      'inspect_family_vargas()',
      'inspect_argala("4")',
      'inspect_dashas("vimshottari")',
    ],
    protocolSteps: [
      'Inspect D1 4th house, 4th lord functional nature, Moon (inner peace/mother), Mars (land/property), and D4 Chaturthamsha.',
      'Check Argala & Virodhargala on the 4th house to see what decisively supports or disturbs domestic calm.',
      'Compare 4th from Lagna (physical home/assets) vs 4th from Moon (emotional peace) vs 4th from AL (external lifestyle/property status).',
    ],
    disconnectCheck:
      'Strong 4th from AL/D4 with afflicted Moon = comfortable physical home yet inner emotional restlessness.',
    pitfalls: [
      'For vehicles/comforts specifically, also inspect D16 and Venus rather than relying solely on D4.',
    ],
    reasoningPattern:
      'D1+D4 4th promise -> Argala interventions on 4th -> Lagna vs Moon peace distinction -> Timing via 4th-lord/D4 dasha & transits.',
  },
  {
    id: 'children_progeny',
    title: 'Children, Progeny & Creative Legacy',
    catalogSummary: 'D1+D7 progeny prospects, creative lineage, timing windows (5th, 9th, Jupiter, PK, A5, Putra Saham).',
    topicIds: ['children_progeny'],
    triggerPatterns: [/\b(child|children|progeny|kids|baby|conception|pregnancy|parenting|son|daughter)\b/i],
    timescale: 'adaptive',
    primaryVargas: ['D1', 'D7'],
    primaryHouses: [5, 9, 2],
    keyArudhas: ['A5'],
    keyKarakas: ['PK', 'jupiter'],
    recommendedTools: [
      'read("/houses/5")',
      'inspect_varga("D7")',
      'inspect_varga_analytics("D7")',
      'inspect_karakas("PK")',
      'inspect_arudhas("A5")',
      'inspect_dashas("vimshottari")',
    ],
    protocolSteps: [
      'Inspect D1 5th house/lord, Jupiter (Naisargika Putrakaraka), Putrakaraka (PK), D7 Saptamsha placements, and D7 Narayana Dasa + D7 SAV via inspect_varga_analytics("D7").',
      'Check A5 (manifestation of children/creativity), 5th from Jupiter, and D7 odd/even progression (odd Lagna forward 5th/7th/9th; even Lagna backward) for child order/traits.',
      'For timing: converge Vimshottari 5th/9th/Jupiter/PK Dashas + D7 Narayana Dasa + Double Transit on 5th/lord + Varshaphal Putra Saham Ithasala & Patyayini months.',
    ],
    disconnectCheck:
      'Separate creative intellect/mentorship (5th from Lagna) from outward recognition/awards or progeny manifestation (A5).',
    pitfalls: [
      'Keep classical D7 trait/polarity indicators framed clearly as traditional Jyotish tendencies rather than medical certainty.',
    ],
    reasoningPattern:
      'D1+D7 5th & Jupiter/PK promise -> Dasha activation of 5th/9th/Jupiter -> Double Transit & Putra Saham confirmation -> Constructive guidance.',
  },
  {
    id: 'education_intellect',
    title: 'Education, Exams, Research & Academic Honors',
    catalogSummary: 'D1+D24 learning, degrees, exams, scholarship, and academic awards (4th, 5th, 9th, Mercury, Jupiter, A4/A5/A9).',
    topicIds: ['education'],
    triggerPatterns: [/\b(study|education|exam|college|university|degree|research|learn|school|academic|scholarship|grade)\b/i],
    timescale: 'adaptive',
    primaryVargas: ['D1', 'D24'],
    primaryHouses: [4, 5, 9, 2],
    keyArudhas: ['A4', 'A5', 'A9'],
    keyKarakas: ['mercury', 'jupiter'],
    recommendedTools: [
      'read("/houses/5")',
      'inspect_kn_rao_audit("education")',
      'inspect_varga("D24")',
      'inspect_functional_roles()',
      'inspect_dashas("vimshottari")',
    ],
    protocolSteps: [
      'Apply K.N. Rao’s >80% Empirical Educational Counseling Formula via inspect_kn_rao_audit("education"): prioritize 5th house/lord from Lagna + its Nakshatra lord + 5th house/lord from Mercury (rather than relying mainly on the 4th house).',
      'Cross-check Mercury, Jupiter, 9th house (higher research), and D24 Siddhamsa.',
      'Distinguish actual scholarship (5th from Lagna/Mercury in D24) from grades/awards/academic reputation (5th from AL / A5) and check D24 birthtime cusp sensitivity.',
    ],
    disconnectCheck:
      'Strong 5th from Lagna/Mercury + weak A5 = deep thinker whose exam scores/credentials may understate true mastery.',
    pitfalls: [
      'Always flag D24 Lagna sensitivity in uncertainty if birth time is rounded.',
    ],
    reasoningPattern:
      'D1+D24 4th/5th/9th + Mercury/Jupiter -> Lagna scholarship vs AL reputation -> Active Dasha/exam transit window -> Study strategy.',
  },
  {
    id: 'travel_relocation',
    title: 'Foreign Travel, Immigration & Relocation',
    catalogSummary: 'D1+D4+D9+D12 relocation, visas, long journeys, foreign settlement (12th, 9th, 7th, 4th, Rahu, Moon).',
    topicIds: ['travel_relocation'],
    triggerPatterns: [/\b(foreign|abroad|relocat|visa|immigrat|settle abroad|move country|overseas|travel|journey)\b/i],
    timescale: 'adaptive',
    primaryVargas: ['D1', 'D4', 'D9'],
    primaryHouses: [12, 9, 7, 4, 3],
    keyArudhas: ['A9', 'A12'],
    keyKarakas: ['rahu', 'moon', 'saturn'],
    recommendedTools: [
      'read("/houses/12")',
      'read("/houses/9")',
      'inspect_varga("D4")',
      'inspect_transits()',
      'window_scan("travel_relocation")',
    ],
    protocolSteps: [
      'Inspect 12th (foreign settlement), 9th (long journeys), 7th (travel/residence abroad), and 4th (leaving homeland — especially movable signs or Rahu/12th links).',
      'Inspect D4 Chaturthamsha for residence shifts and Rahu/Moon/Saturn transits.',
      'Cross-check active Dashas activating 9th/12th/4th/Rahu and Paradesa Saham in Varshaphal for annual windows.',
    ],
    disconnectCheck:
      'Check whether relocation brings tangible residency stability (D4/4th from Lagna) vs emotional homesickness (4th from Moon).',
    pitfalls: [
      '12th house/Rahu activation is constructive for foreign careers/settlement — never frame 12th automatically as "loss".',
    ],
    reasoningPattern:
      'D1 12th/9th/4th + D4 residence promise -> Rahu/12th-lord Dasha -> Slow-planet transit & window_scan -> Practical relocation timing.',
  },
  {
    id: 'spirituality_dharma',
    title: 'Spirituality, Soul Purpose & Inner Growth',
    catalogSummary: 'D1+D9+D20 dharma, Atmakaraka/Karakamsa, 12th from AK (Ishta Devata), Ketu, Jupiter, meditation.',
    topicIds: ['spirituality'],
    triggerPatterns: [/\b(spirit|meditat|dharma|purpose|soul|karma|moksha|atmakaraka|ishta|guru|detachment|mantra)\b/i],
    timescale: 'macro_natal',
    primaryVargas: ['D1', 'D9', 'D20'],
    primaryHouses: [9, 12, 5, 8, 4],
    keyArudhas: ['AL', 'A5', 'A9'],
    keyKarakas: ['AK', 'ketu', 'jupiter', 'saturn'],
    recommendedTools: [
      'inspect_karakas("AK")',
      'compare_perspectives(1)',
      'inspect_varga("D20")',
      'inspect_dashas("drigdasa")',
      'read("/houses/9")',
      'read("/houses/12")',
      'inspect_remedies("spirituality")',
    ],
    protocolSteps: [
      'Inspect Atmakaraka (AK), its D9 sign (Karakamsa), and any Tapaswi Yoga (Saturn-Ketu-Venus triad).',
      'Check Drigdasa (Vision Dasa: 9th/10th/11th + Rasi Drishti) to time spiritual awakenings, retreats, and dharmic turning points.',
      'Check 12th from AK in D9 (Ishta Devata / moksha anchor) via inspect_remedies and D20 Vimsamsa (devotion, mantra, inner discipline).',
    ],
    disconnectCheck:
      'Natural benefics in 3rd/6th from AL often produce a gentle, saintly/detached outer reputation, whereas malefics in 3rd/6th from AL create worldly boldness.',
    pitfalls: [
      'Frame spiritual inclinations warmly and universally without imposing dogma.',
    ],
    reasoningPattern:
      'AK & Karakamsa soul theme -> D20 + 9th/12th/Ketu/Jupiter -> Ishta Devata archetype -> Grounded daily spiritual practice.',
  },
  {
    id: 'disputes_obstacles',
    title: 'Disputes, Obstacles, Competition & Course-Correction',
    catalogSummary: 'D1+D6 conflict resolution, legal/workplace friction, Baadhaka & Virodhargala blockers (6th, 8th, A6).',
    topicIds: ['disputes_litigation'],
    triggerPatterns: [/\b(dispute|litigation|court|lawsuit|legal|enemy|enemies|conflict|obstacle|block|stuck|problem|struggle|challenge)\b/i],
    timescale: 'adaptive',
    primaryVargas: ['D1', 'D6'],
    primaryHouses: [6, 8, 10],
    keyArudhas: ['A6', 'AL'],
    keyKarakas: ['mars', 'saturn', 'rahu'],
    recommendedTools: [
      'read("/houses/6")',
      'inspect_varga("D6")',
      'inspect_functional_roles()',
      'inspect_argala("6")',
      'inspect_dashas("vimshottari")',
    ],
    protocolSteps: [
      'Check D1 6th house/lord, D6 Shashthamsha, and whether Mars/Saturn/Rahu are functional malefics or placed in dusthanas (remember: functional malefics in 3/6/8/12 can suppress obstacles!).',
      'Identify Baadhaka Sthaana/Lord and any Virodhargala (obstructions) or 6/8 Shadashtaka MD-AD friction causing temporary resistance.',
      'Highlight resilience levers (10th/11th strength, unobstructed benefic Argala) and when the friction window eases.',
    ],
    disconnectCheck:
      'Check if friction is primarily perceived/reputational (A6/AL) versus structural (6th/8th from Lagna) or emotional stress (Moon).',
    pitfalls: [
      'Never give fatalistic fear; frame obstacles as karmic friction points (Dridha Karma) with clear resolution windows and practical boundaries.',
    ],
    reasoningPattern:
      '6th/D6 + Baadhaka/Shadashtaka diagnosis -> Resilience & resolution levers -> When friction eases -> Constructive action.',
  },
  {
    id: 'health_vitality',
    title: 'Health, Medical Astrology & Vitality',
    catalogSummary: 'Classical medical astrology (D1, D6, D30, 1st/6th/8th/12th, Dosha constitution, Sayanaadi/Lajjitadi, Shodhya Pinda, transits).',
    topicIds: ['health_routine'],
    triggerPatterns: [/\b(health|vitality|energy|stress|burnout|fatigue|routine|sleep|wellbeing|fitness|immunity|habit|medical|disease|illness|surgery|chronic)\b/i],
    timescale: 'adaptive',
    primaryVargas: ['D1', 'D6', 'D30'],
    primaryHouses: [1, 6, 8, 12],
    keyArudhas: ['A6', 'A8'],
    keyKarakas: ['sun', 'moon', 'mars', 'saturn'],
    recommendedTools: [
      'read("/houses/1")',
      'read("/houses/6")',
      'inspect_varga("D6")',
      'inspect_strengths("shadbala")',
      'inspect_strengths("avasthas")',
      'inspect_transits()',
      'inspect_dashas("vimshottari")',
    ],
    protocolSteps: [
      'Inspect Lagna & Lagna lord vitality (Sun = constitution/stamina, Moon = mental immunity/sleep, Mars = blood/inflammation/surgery), plus 6th (acute illness), 8th (chronic), 12th (recovery/hospital), and D6/D30.',
      'Check Sayanaadi/Lajjitadi Avasthas (e.g., Bhojana/Kshobhita afflictions), retrograde malefics, MD-AD 6/8 Shadashtaka axes, Latta kicks, and Shodhya Pinda triggers.',
      'State anatomical/Dosha tendencies candidly from classical Jyotish while noting clinical evaluation belongs with a physician.',
    ],
    disconnectCheck:
      'Strong Sun/Lagna with stressed Moon = pushing through physically while mentally depleted.',
    pitfalls: [
      'Ground every vulnerability indicator strictly in observed chart placements and pair with protective factors (Jupiter/benefic aspects) and practical self-care.',
    ],
    reasoningPattern:
      'Constitution (1st/Sun/Moon) -> 6th/8th/D6 + Avastha vulnerability factors -> Active Dasha/Transit/Latta triggers -> Protective levers & precautions.',
  },
  {
    id: 'longevity_vulnerability',
    title: 'Longevity (Ayurdaya), Rudra & Shoola Vulnerability Windows',
    catalogSummary: 'Three Pairs Ayurdaya (Alpayu/Madhyayu/Poornayu), Rudra, Trishoola Rasis, Maheswara, Shoola Dasa & AK/Jupiter shields.',
    topicIds: ['longevity_vulnerability'],
    triggerPatterns: [/\b(longevity|lifespan|ayurdaya|shoola|rudra|trishoola|maheswara|maraka|accident|vulnerability|risk period|when will i die|time of death)\b/i],
    timescale: 'macro_natal',
    primaryVargas: ['D1', 'D8', 'D11', 'D30'],
    primaryHouses: [1, 3, 8, 2, 7],
    keyArudhas: ['AL', 'A8'],
    keyKarakas: ['AK', 'saturn'],
    recommendedTools: [
      'inspect_longevity()',
      'inspect_functional_roles()',
      'inspect_dashas("shoola")',
      'inspect_dashas("vimshottari")',
      'inspect_transits()',
    ],
    protocolSteps: [
      'Run inspect_longevity() to report the Three-Pair Ayurdaya bracket (Alpayu / Madhyayu / Poornayu) and any Kakshya Vriddhi (Jupiter-in-Kendra elevation).',
      'Identify Rudra, Trishoola Rasis (trines from Rudra), Maheswara (8th from AK), and Maraka lords (2nd/7th from inspect_functional_roles).',
      'Inspect Shoola Dasa vulnerability windows (AL trines/3rd/8th & Trishoola signs) AND explicitly highlight AK and Jupiter protective shields.',
      'Cross-check active Saturn/Rahu transits, Shodhya Pinda Saturn-8th triggers, and Latta kicks to identify periods requiring extra physical/health caution.',
    ],
    disconnectCheck:
      'Distinguish physical vitality (Lagna/8th/3rd) from Shoola Dasa vulnerability windows (AL trines), and always verify whether AK or Jupiter shields a sign.',
    pitfalls: [
      'Follow PVR Ch. 14.6: present classical longevity brackets and Shoola vulnerability windows accurately and calmly — never claim an exact calendar date of death; always highlight protective shields and constructive precautions.',
    ],
    reasoningPattern:
      'Three-Pair Ayurdaya bracket -> Rudra/Trishoola/Maheswara & Marakas -> Shoola vulnerability windows vs AK/Jupiter shields -> Practical caution & remedies.',
  },
  {
    id: 'daily_muhurta_transits',
    title: 'Daily Forecast, Specific Date & Muhurta Election',
    catalogSummary: 'Micro-timescale day/hour quality: Muhurta, Panchang, Abhijit/Rahu Kalam, Navatara, Kakshya, Vedha, Ghatak.',
    topicIds: ['decision_timing'],
    triggerPatterns: [/\b(today|tomorrow|tonight|this afternoon|this morning|right now|this week|muhurta|auspicious time|good day|bad day|rahu kalam|panchang|tithi|hora|on \d{4}-\d{2}-\d{2})\b/i],
    timescale: 'micro_daily',
    primaryVargas: ['D1'],
    primaryHouses: [1, 9, 10, 11],
    keyArudhas: [],
    keyKarakas: ['moon', 'jupiter'],
    recommendedTools: [
      'inspect_muhurta()',
      'inspect_transits()',
      'inspect_sbc()',
      'inspect_strengths("navatara")',
      'inspect_strengths("kakshya")',
      'inspect_strengths("vedha")',
    ],
    protocolSteps: [
      'Apply PVR Ch. 33 Timescale Matching: for a single day/afternoon, prioritize fast-moving micro factors (Muhurta windows, Panchang Tithi/Vara/Yoga/Karana, Abhijit vs Rahu Kalam, Ghatak day/tithi check) and Tajaka 60-Hour (Shashti-Hora) / Monthly (Maasa Pravesh) entry charts via inspect_varshaphal(year, mode="60hr"|"monthly", targetDate).',
      'Check Navatara (today’s Moon Tara from natal Janma Nakshatra — e.g., Sampat/Sadhana vs Vipat/Naidhana) and Sarvatobhadra Chakra 3-line Vedha + Special Tithis (Karma/Dhana Tithi) + Transit Murthi (Swarna/Rajata/Taamra/Loha) via inspect_sbc().',
      'Check Ashtakavarga Kakshya (3°45\' benefic point), Latta kicks, and Gochara Vedha (obstructions, respecting Sun-Saturn and Moon-Mercury exemptions).',
    ],
    disconnectCheck:
      'A low-bindu Moon Kakshya or Ghatak day explains a choppy afternoon even inside a prosperous Mahadasha.',
    pitfalls: [
      'CRITICAL (PVR Ch. 33): NEVER blame a 10-year Mahadasha or multi-week retrograde for an isolated bad afternoon or single day!',
      'Always name the exact flowing windows and Rahu Kalam/Ghatak cautions when advising on a date.',
    ],
    reasoningPattern:
      'Day Panchang & Muhurta band -> Navatara + Kakshya + Vedha filter -> Flowing vs avoid windows -> Practical scheduling tip.',
  },
  {
    id: 'year_ahead_timing',
    title: 'Year Ahead, Multi-Dasha Convergence & Timing Funnel',
    catalogSummary: '4-Tier Timing Funnel: Vimshottari MD-AD axis + Sudarshana + Yogini/Chara + Double Transit + Varshaphal Sahams.',
    topicIds: ['year_ahead', 'decision_timing'],
    triggerPatterns: [/\b(year ahead|this year|next year|202\d|forecast|upcoming|timing|when will|which month|which year|next 12|varshaphal|solar return|dasha)\b/i],
    timescale: 'annual_window',
    primaryVargas: ['D1', 'D9', 'D10'],
    primaryHouses: [1, 10, 9, 11],
    keyArudhas: ['AL'],
    keyKarakas: ['jupiter', 'saturn'],
    recommendedTools: [
      'inspect_dashas("vimshottari")',
      'inspect_dashas("narayana")',
      'inspect_dashas("kalachakra")',
      'inspect_dashas("sudarshana")',
      'inspect_varshaphal()',
      'inspect_transits()',
      'window_scan("year_ahead")',
    ],
    protocolSteps: [
      'Apply K.N. Rao’s Subordination Law & 3-System Synthesis (Vimshottari + Jaimini Chara + Tajaka Annual Chart) inside the 4-Tier Timing Funnel: (1) Natal Promise -> (2) Operating Season (Vimshottari MD-AD + Chara Dasha + D1/Varga Narayana + Sudarshana 3-ring) -> (3) Gochara Permission (Retrograde-aware Double Transit + SAV >= 25) -> (4) Dual-School Varshaphal (PVR + Neelakantha/Mehta Varsheshwara convergence, non-Sun 6-planet PVB, Tri-Pataki Chakra Vedha on Lagna & Moon, Dwi-Janma Year check, Muntha Rahu-Face/Half-Year timing, Punya/Common-Lordship Sahams, Annual Yogini + Varsha Narayana + Patyayini + Mudda, and Maasa Pravesh monthly/60-hr charts).',
      'Always call window_scan(theme) when citing structured timing windows so dates are 100% deterministic and verifier-grounded.',
      'Highlight convergence where Vimshottari, Chara/Narayana, Double Transit, Tri-Pataki Vedha, and Dual-School Tajaka agree, and note Table 20D antidotes whenever a Dwi-Janma or crisis flag appears.',
    ],
    disconnectCheck:
      'Compare Sudarshana Lagna Ring (external events) vs Moon Ring (inner emotional experience) for the active year.',
    pitfalls: [
      'Never predict an event from transits alone without checking whether active Dashas and natal promise agree.',
      'Only place windows returned by window_scan into the JSON "timing" array.',
    ],
    reasoningPattern:
      'Active MD-AD axis & theme -> Sudarshana + Varshaphal Muntha/Sahams -> Double Transit & window_scan peaks -> Pacing advice.',
  },
  {
    id: 'remedies_guidance',
    title: 'Rule-Safe Remedies, Gemstones, Fasting & Practices',
    catalogSummary: 'PVR Ch. 34 safe remedies: Functional-Benefic/Yogakaraka-only gemstones, UL/A10 weekday fasting, Ishta Devata, charity.',
    topicIds: [],
    triggerPatterns: [/\b(remedy|remedies|upaya|gemstone|gem|stone|ratna|ring|sapphire|emerald|ruby|pearl|coral|fasting|vrat|mantra|stotra|deity|ishta|charity|donate|puja)\b/i],
    timescale: 'macro_natal',
    primaryVargas: ['D1', 'D9'],
    primaryHouses: [1, 5, 9, 12],
    keyArudhas: ['UL', 'A10'],
    keyKarakas: ['AK'],
    recommendedTools: [
      'inspect_functional_roles()',
      'inspect_remedies()',
      'inspect_dashas("vimshottari")',
    ],
    protocolSteps: [
      'Run inspect_functional_roles() and inspect_remedies() FIRST so every recommendation obeys classical functional-nature safety.',
      'Gemstones: ONLY suggest planets listed as eligible Yogakarakas or Functional Benefics — explicitly warn against gemstones for Functional Malefics or Marakas.',
      'Pair practical precautions with accessible non-commercial practices: UL lord weekday fasting/charity for relationship harmony, A10 lord weekday for career stability, Stotras/Ishta Devata (12th from AK in D9) for inner steadiness.',
    ],
    disconnectCheck:
      'Remember PVR Ch. 34.1: birth karma sets the broad weather, while free will, discipline, and remedies soften intensity and guide choices.',
    pitfalls: [
      'STRICT GUARDRAIL: NEVER recommend a gemstone for a Functional Malefic or Maraka planet.',
      'Never use fear-based language or imply bad luck will happen unless someone buys an expensive item.',
    ],
    reasoningPattern:
      'Functional Benefic check -> Safe gemstone eligibility + exclusions -> Weekday/charity/Ishta practice -> Grounded everyday habit.',
  },
  {
    id: 'birthtime_sensitivity',
    title: 'Birthtime Sensitivity & Pyramid Rectification Check',
    catalogSummary: 'PVR Ch. 32–33 cusp proximity on D9/D10/D24, rounded birthtime detection, and Pyramid event-anchor checks.',
    topicIds: [],
    triggerPatterns: [/\b(rectif|birth ?time|exact time|wrong time|unsure.*time|approximate time|cusp|borderline|twins|minute)\b/i],
    timescale: 'macro_natal',
    primaryVargas: ['D1', 'D4', 'D9', 'D10', 'D24'],
    primaryHouses: [1, 4, 7, 10],
    keyArudhas: ['AL', 'UL', 'A10'],
    keyKarakas: ['AK'],
    recommendedTools: [
      'read("/overview")',
      'inspect_functional_roles()',
      'inspect_varga("D9")',
      'inspect_varga("D10")',
      'inspect_varga("D24")',
    ],
    protocolSteps: [
      'Inspect cusp sensitivity in inspect_functional_roles() to see how many minutes Lagna sits from D9 (3°20\' ~13.3m), D10 (3° ~12m), and D24 (1°15\' ~5m) boundaries.',
      'Explain clearly which parts of the chart are rock-solid (planets in D1, Moon sign, broad Mahadashas) vs which parts are sensitive (D9/D10/D24 Lagnas, Ghati Lagna).',
      'Use PVR’s Pyramid Verification order (D4 residence/foreign -> D9 marriage/nature -> D10 career field -> D24 education subject) to suggest 2-3 simple life-event questions that confirm the chart.',
    ],
    disconnectCheck:
      'A 2–5 minute birth-time shift rarely changes D1 planets, but can flip D10/D24 Ascendants completely.',
    pitfalls: [
      'Never pretend a rounded birth time guarantees exact D24/D60 Lagna precision.',
      'Reject mechanical birth-quanta formulas; anchor strictly to verifiable past life milestones.',
    ],
    reasoningPattern:
      'Lagna degree & Varga boundary check -> What is stable vs sensitive -> 2-3 Pyramid anchor questions for the user.',
  },
  {
    id: 'political_public_life',
    title: 'Political Career, Elections & Public Authority',
    catalogSummary: 'K.N. Rao 7-point political profile (Jup-Sun, Gaja-Kesari, Sat-10th, 4th Parliament, 8th break, Leo/Sg seal, 7th/Sat PD entry).',
    topicIds: [],
    triggerPatterns: [/\b(politic|election|minister|parliament|governor|president|prime minister|public office|public life|campaign|government post|civil service|ias|bureaucrac)\b/i],
    timescale: 'adaptive',
    primaryVargas: ['D1', 'D9', 'D10'],
    primaryHouses: [10, 4, 7, 8, 12],
    keyArudhas: ['AL', 'A10'],
    keyKarakas: ['AmK', 'saturn', 'jupiter', 'sun'],
    recommendedTools: [
      'inspect_kn_rao_audit("politics")',
      'inspect_varga_analytics("D10")',
      'inspect_varshaphal()',
      'inspect_functional_roles()',
      'inspect_dashas("vimshottari")',
      'window_scan("career")',
    ],
    protocolSteps: [
      'Run inspect_kn_rao_audit("politics") to evaluate K.N. Rao’s 7 core indicators: Jupiter-Sun dignity, Gaja-Kesari popular appeal, Saturn-10th mass mandate, 4th house (Parliament/seat of power), Rahu-Ketu maneuvering, 8th house career-break pivot, and Leo/Sagittarius official seal.',
      'Distinguish executive/mass-mandate leadership (PM-type Saturn emphasis) vs dignified institutional leadership (President-type Jupiter emphasis).',
      'Check 7th lord or Saturn Pratyantar/Antardasha for entry/re-entry into public life, AND inspect the election year’s Varshaphal (inspect_varshaphal) for K.N. Rao’s Annual Political rules: Luminaries in Kendras, strong 3rd/6th political fightback, Mars in 12th foreign/hidden intrigues, Tri-Pataki Vedha, and Dwi-Janma / political Maraka risk.',
      'Follow K.N. Rao’s Intensive Verification rule: suggest confirming past non-political milestones before high-stakes election forecasting.',
    ],
    disconnectCheck:
      'Compare 4th/10th from Lagna (structural power & mass mandate) vs AL/GL (media stature and public image).',
    pitfalls: [
      'Never predict election victories without Double Transit of Saturn & Jupiter on 10th/4th gated by SAV >= 25.',
    ],
    reasoningPattern:
      '7-Point Political Profile + D10 SAV -> PM vs President leaning -> 7th/Saturn PD & Double Transit window -> Political Maraka risk check.',
  },
  {
    id: 'astro_psychology_counseling',
    title: 'Astro-Psychology, Emotional Stress & Blind Counseling',
    catalogSummary: 'K.N. Rao blind psychological diagnosis from active Dasha (D1+D9 6/8 crisis, 6th lord agitation, Moon+Rahu+Mars domestic stress, 108-mantra anchor).',
    topicIds: [],
    triggerPatterns: [/\b(anxiet|depress|mental|emotional|overwhelm|stressed|confused|mind|peace|neurosis|restless|family conflict|parents fight|heartbreak|breakup|feeling lost|therapy|psycholog)\b/i],
    timescale: 'adaptive',
    primaryVargas: ['D1', 'D9', 'D27'],
    primaryHouses: [1, 4, 5, 6, 8, 10],
    keyArudhas: ['AL'],
    keyKarakas: ['moon', 'AK'],
    recommendedTools: [
      'inspect_kn_rao_audit("psychology")',
      'inspect_dashas("vimshottari")',
      'compare_perspectives(4)',
      'inspect_transits()',
      'inspect_journal_insights()',
    ],
    protocolSteps: [
      'Run inspect_kn_rao_audit("psychology") to check K.N. Rao’s active Dasha psychological triggers: MD-AD in 6/8 in BOTH D1 and D9 (acute relationship/role collapse), 6th lord AD aspecting 4th/5th (property/family agitation), and Moon+Rahu+Mars domestic friction.',
      'Check if Jupiter protects the 10th house while 4th/Moon is stressed — if so, highlight K.N. Rao’s practical environmental counseling lever (thriving through structured external work or living independently).',
      'Overlay Sade Sati/Moon transits, Kalachakra connectedness, and user journal snapshots if present.',
      'Offer grounded psychological reframing plus Parashari 108-count daily mindfulness/mantra (27 Nakshatras x 4 Padas) and selfless daan.',
    ],
    disconnectCheck:
      'Strong AL/10th with afflicted Moon or D1+D9 6/8 Dasha = looking composed externally while absorbing intense private emotional pressure.',
    pitfalls: [
      'Be empathetic, practical, and non-judgmental; never use commercial fear-based remedies.',
    ],
    reasoningPattern:
      'Active MD-AD & D1+D9 psychological trigger -> Lagna/10th vs Moon/4th contrast -> Practical lifestyle/environment adjustment -> Calming daily anchor.',
  },
];

export const AGENT_SKILL_MAP: ReadonlyMap<SkillId, AgentSkill> = new Map(
  AGENT_SKILLS.map((s) => [s.id, s]),
);

export function getAgentSkill(id: string): AgentSkill | null {
  return AGENT_SKILL_MAP.get(id as SkillId) ?? null;
}
