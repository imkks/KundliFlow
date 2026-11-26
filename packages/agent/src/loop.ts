import type { ChartWorkspace } from '@astro/facts';
import type { KnowledgeBase } from '@astro/kb';
import { renderHouse, type Finding } from '@astro/rules';
import { EngineSession, ToolServer, type ToolResult } from '@astro/tools';
import { buildDeepAgentSystemPrompt, extractJsonObject } from './llm.js';
import { routeQuestion } from './router.js';
import {
  getAgentSkill,
  renderActiveSkillBriefing,
  renderSkillPlaybook,
  routeSkills,
} from './skills/index.js';
import { verifyComposedAnswer } from './verifier.js';
import {
  ComposedAnswerSchema,
  type AgentMessage,
  type AgentTraceEvent,
  type AskResult,
  type ComposedAnswer,
  type LlmClient,
  type NativeToolCall,
  type ToolDefinition,
} from './types.js';

export const DEEP_AGENT_TOOLS: ToolDefinition[] = [
  {
    name: 'read',
    description: 'Read chart.db VFS paths: /overview, /houses/1..12, /houses/N/lord, /planets/<name>, /periods/current, /transits/now, /strength/planets, /strength/houses.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        depth: { type: 'number' },
        limit: { type: 'number' },
      },
      required: ['path'],
    },
  },
  {
    name: 'ls',
    description: 'List children at a VFS path (/, /houses, /planets, /topics).',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path'],
    },
  },
  {
    name: 'find',
    description: 'Search across chart facts and rule findings by keyword (e.g. "career", "exalted", "retrograde", "saturn").',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Keyword to search for' },
        scope: { type: 'string', enum: ['all', 'facts', 'findings'] },
      },
      required: ['text'],
    },
  },
  {
    name: 'follow',
    description: 'Traverse chart.db graph edges (conjunct, aspects, lord_of, evidence_of) from a fact or finding ID.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        rel: { type: 'string' },
        depth: { type: 'number' },
      },
      required: ['id'],
    },
  },
  {
    name: 'inspect_varga',
    description: 'Inspect any of the 20 divisional charts (D1, D2, D3, D4, D5, D6, D7, D8, D9, D10, D11, D12, D16, D20, D24, D27, D30, D40, D45, D60) and Vargottama status.',
    parameters: {
      type: 'object',
      properties: {
        varga: { type: 'string', description: 'e.g. D9, D10, D4, D5, D6, D7, D8, D11, D24' },
        planet: { type: 'string' },
      },
      required: ['varga'],
    },
  },
  {
    name: 'inspect_kp_chalit',
    description: 'Inspect KP Nakshatra/Sub-Lord placements and Sripati Bhava Chalit house shifts.',
    parameters: {
      type: 'object',
      properties: { target: { type: 'string', description: 'Optional planet or lagna' } },
    },
  },
  {
    name: 'inspect_strengths',
    description: 'Inspect planetary/house strength engines: shadbala, bhavabala, ashtakvarga, avasthas, friendship, vaisheshikamsa (10-varga dignity), pushkara, navatara (9-Tara cycle), special_nakshatras, kakshya (3°45\' transit bindu), or vedha (obstruction with father-son exemptions).',
    parameters: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['shadbala', 'bhavabala', 'ashtakvarga', 'avasthas', 'friendship', 'vaisheshikamsa', 'pushkara', 'navatara', 'special_nakshatras', 'kakshya', 'vedha'] },
        target: { type: 'string' },
      },
      required: ['kind'],
    },
  },
  {
    name: 'inspect_natal_lore',
    description: 'Inspect detected classical yogas, doshas, mutual aspects, Jaimini Chara Karakas, Avakahada, Ghatak, Upagrahas, Arudha Padas, 36 Tajika Sahams, or Special Lagnas (BL, HL wealth, GL power, SL prosperity, Indu, Pranapada).',
    parameters: {
      type: 'object',
      properties: {
        kind: {
          type: 'string',
          enum: ['yogas', 'doshas', 'aspects', 'karakas', 'avakahada', 'ghatak', 'upagrahas', 'arudha', 'sahams', 'special_lagnas'],
        },
      },
      required: ['kind'],
    },
  },
  {
    name: 'inspect_arudhas',
    description: 'Inspect 12 Jaimini Bhava Arudha Padas (AL public image + 11th/12th/3rd/6th diagnostics, UL marriage endurance, A10 career status, A11 gains) and optional 9 Graha Arudhas (subjective perception plane) in D1 or ANY divisional chart (D9, D10, D16, D24, etc.).',
    parameters: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Optional code (AL, UL, A10, A11, A2...) or planet name for Graha Arudha (sun..ketu)' },
        varga: { type: 'string', description: 'Optional Varga chart (D1..D60), defaults to D1' },
        includeGrahaArudhas: { type: 'boolean', description: 'Set true to include all 9 Graha Arudhas (subjective perception houses)' },
      },
    },
  },
  {
    name: 'inspect_karakas',
    description: 'Inspect 7 Jaimini Chara Karakas: AK (Atmakaraka/soul purpose), AmK (Amatyakaraka/career), DK (Darakaraka/spouse), PK (Putrakaraka/children), etc.',
    parameters: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Optional role: AK, AmK, DK, PK, etc., or planet name' },
      },
    },
  },
  {
    name: 'inspect_dashas',
    description: 'Inspect Vimshottari (with MD-AD axis + Rath Tripod & Drekkana delivery), Yogini, Jaimini Chara, Sudarshana Chakra, Narayana Dasa (D1 or any Varga), Sudasa (wealth), Drigdasa (spirituality), Shoola Dasa (vulnerability), Kalachakra Dasa (Deha/Jeeva, Gati leaps & SAV), or Ashtottari Dasa (108y).',
    parameters: {
      type: 'object',
      properties: {
        system: {
          type: 'string',
          enum: ['vimshottari', 'yogini', 'chara', 'sudarshana', 'narayana', 'sudasa', 'drigdasa', 'shoola', 'kalachakra', 'ashtottari'],
        },
        from: { type: 'string', description: 'YYYY-MM-DD' },
        to: { type: 'string', description: 'YYYY-MM-DD' },
        varga: { type: 'string', description: 'Optional Varga for Narayana Dasa, e.g. D1, D9, D10, D7, D4, D24' },
      },
      required: ['system'],
    },
  },
  {
    name: 'inspect_transits',
    description: 'Inspect live Gochar planetary transits, Sade Sati status, and BAV bindus.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'inspect_panchang',
    description: 'Inspect birth Panchang: Vara (weekday), Tithi, Yoga, Karana, and Moon Nakshatra/Pada.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'inspect_bhavas',
    description: 'Inspect the 12-house Bhava Dossier (Kendra/Trikona/Dusthana/Upachaya classification, lord, occupants, aspects, SAV, summary).',
    parameters: {
      type: 'object',
      properties: { house: { type: 'number', description: 'Optional house 1-12' } },
    },
  },
  {
    name: 'inspect_varshaphal',
    description: 'Inspect Tajaka Annual (Varsha Pravesh), Monthly (Maasa Pravesh, 30° Sun), or 60-Hour (Shashti-Hora, 2°30\' Sun) return charts integrating BOTH PVR (3-tier PVB + D1..D12 DVB) and Neelakantha/Mehta (4-tier aspect-based PVB + Sequential Drekkana + Moon Varsheswara disqualification), plus Tri-Pataki Chakra Vedha, Dwi-Janma Year, Muntha Rahu-axis/half-year rules, Annual Yogini/Patyayini/Mudda/Varsha Narayana Dasas, crisis flags & antidotes, Saham Common Lordship, and Ithasala/Kamboola/Rashi-Anta/Duphalikuttha yogas.',
    parameters: {
      type: 'object',
      properties: {
        year: { type: 'number', description: 'Target year for annual return, e.g. 2026' },
        mode: { type: 'string', enum: ['annual', 'monthly', '60hr'], description: 'Return granularity: annual (default), monthly (Maasa Pravesh), or 60hr (Shashti-Hora)' },
        targetDate: { type: 'string', description: 'YYYY-MM-DD target date for monthly or 60hr Tajaka entry charts' },
        varga: { type: 'string', description: 'Optional Varga for Varsha Narayana Dasa (e.g. D1, D4, D9, D10, D24)' },
        school: { type: 'string', enum: ['both', 'pvr', 'neelakantha'], description: 'Tajaka school comparison: both (default — shows convergence/divergence), pvr, or neelakantha' },
      },
    },
  },
  {
    name: 'inspect_ashtakoota',
    description: 'Compute 36-point Ashtakoota Gun Milan compatibility against a partner Moon sign index (0-11) and Moon nakshatra index (0-26).',
    parameters: {
      type: 'object',
      properties: {
        partnerMoonSignIndex: { type: 'number' },
        partnerMoonNakshatraIndex: { type: 'number' },
      },
      required: ['partnerMoonSignIndex', 'partnerMoonNakshatraIndex'],
    },
  },
  {
    name: 'inspect_muhurta',
    description: 'Inspect Panchang, Abhijit Muhurta, Rahu Kalam, Flowing windows, and Ghatak friction for any specific date (YYYY-MM-DD), e.g. today or a future date.',
    parameters: {
      type: 'object',
      properties: { date: { type: 'string', description: 'YYYY-MM-DD' } },
    },
  },
  {
    name: 'inspect_journal_insights',
    description: 'Read the user\'s personal journal entries, mood/focus/energy logs, and sky snapshots to correlate lived experience with astrological patterns.',
    parameters: {
      type: 'object',
      properties: { limit: { type: 'number' } },
    },
  },
  {
    name: 'compare_perspectives',
    description: 'Compare a house (1-12) simultaneously across Lagna (reality), Chandra Lagna (psychology), Surya Lagna, Arudha Lagna AL (perception/Maya), Paaka Lagna (delivery), and Karakamsa (D9 AK).',
    parameters: {
      type: 'object',
      properties: { house: { type: 'number' } },
      required: ['house'],
    },
  },
  {
    name: 'inspect_functional_roles',
    description: 'Inspect Lagna-specific Functional Benefics, Functional Malefics, Yogakaraka, Marakas, Baadhaka Sthaana/Lord, Yogada (Lagna+HL/GL), Parivartana exchanges, and Varga cusp / birthtime sensitivity.',
    parameters: {
      type: 'object',
      properties: {
        planet: { type: 'string', description: 'Optional planet name to check a single planet role' },
      },
    },
  },
  {
    name: 'inspect_argala',
    description: 'Inspect Parashari Argala (decisive interventions 2nd/4th/11th/5th vs Virodhargala obstructions, Ketu reverse rule) and Jaimini Rasi Drishti on any house (1-12), planet (e.g. "saturn" for vocation), or Arudha Pada (AL, A10, UL).',
    parameters: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'House number "1".."12", planet name (e.g. "saturn"), or Arudha code (AL, A10, UL)' },
      },
      required: ['target'],
    },
  },
  {
    name: 'inspect_remedies',
    description: 'Get rule-safe classical remedies: Functional-Benefic/Yogakaraka-only gemstones (explicitly excluding malefics/marakas), UL/A10 weekday fasting, Ishta Devata (12th from AK in D9), and constructive charity practices.',
    parameters: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Optional focus domain: career, marriage, spirituality, general' },
      },
    },
  },
  {
    name: 'inspect_varga_analytics',
    description: 'Composite Divisional Chart analytics: computes Divisional Ashtakavarga SAV (e.g. D10/D9/D24/D7/D4), Divisional Transits (Natal Varga x Transit D1), and active Varga Narayana Dasa in one call.',
    parameters: {
      type: 'object',
      properties: {
        varga: { type: 'string', description: 'Target Varga, e.g. D10, D9, D24, D7, D4' },
      },
      required: ['varga'],
    },
  },
  {
    name: 'inspect_longevity',
    description: 'Inspect classical Ayurdaya (Three-Pair Alpayu/Madhyayu/Poornayu + Kakshya Vriddhi), Rudra, Trishoola Rasis, Maheswara, and Shoola Dasa vulnerability windows with AK/Jupiter protective shields.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'inspect_sbc',
    description: 'Inspect Sarvatobhadra Chakra (9x9 grid 3-line Vedha on Janma/Karma/Abhisheka/Manasa stars, Lagna/Moon Rasis, and Special Tithis) plus Transit Murthis (Swarna/Rajata/Taamra/Loha).',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'inspect_family_vargas',
    description: 'Derive specific family member indicators from divisional charts: D12 parents (father/mother), D3 siblings (odd-forward/even-backward), D7 children, and D9 spouse.',
    parameters: {
      type: 'object',
      properties: {
        member: { type: 'string', description: 'Optional filter: father, mother, sibling, child, spouse, or varga D12/D3/D7/D9' },
      },
    },
  },
  {
    name: 'inspect_kn_rao_audit',
    description: 'Run K.N. Rao empirical audits: Checklists I-III (D1/D9 crossovers, 22nd Drekkana, 23rd Vainashika, Leo/Sg seal, Table 19B remarks), 10-Level Maraka Hierarchy, >80% Educational Counseling Formula (5th from Lagna+NakLord & Mercury), 7-Point Political Profile, and Astro-Psychology Blind Diagnosis.',
    parameters: {
      type: 'object',
      properties: {
        focus: {
          type: 'string',
          enum: ['all', 'checklists', 'education', 'politics', 'psychology', 'maraka'],
          description: 'Optional targeted audit focus (default: all)',
        },
      },
    },
  },
  {
    name: 'load_skill',
    description: 'Load a specialized Jyotish analysis playbook from the Deep Agent skill catalog when the user asks a multi-topic question beyond the auto-routed skill.',
    parameters: {
      type: 'object',
      properties: {
        skillId: { type: 'string', description: 'Skill ID from the catalog (e.g. remedies_guidance, career_vocation, birthtime_sensitivity)' },
      },
      required: ['skillId'],
    },
  },
  {
    name: 'trace_dispositor_chain',
    description: 'Trace the full dispositor chain starting from a planet or house (e.g. "house4" or "rahu").',
    parameters: {
      type: 'object',
      properties: { planetOrHouse: { type: 'string' } },
      required: ['planetOrHouse'],
    },
  },
  {
    name: 'window_scan',
    description: 'Deterministically rank future dasha and transit timing windows for a theme (e.g. career, home_family, relationships, money).',
    parameters: {
      type: 'object',
      properties: {
        theme: { type: 'string' },
        from: { type: 'string', description: 'YYYY-MM-DD' },
        to: { type: 'string', description: 'YYYY-MM-DD' },
      },
      required: ['theme'],
    },
  },
  {
    name: 'search_knowledge',
    description: 'Hybrid RAG search (FTS5 + Sanskrit/English synonyms) over classical Jyotish lore, houses, planets, yogas, and dashas.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        house: { type: 'number' },
        planet: { type: 'string' },
        k: { type: 'number' },
      },
      required: ['query'],
    },
  },
];

const HOUSE_LABELS_FRIENDLY: Record<number, string> = {
  1: 'Self, Vitality & Path',
  2: 'Wealth, Family & Speech',
  3: 'Courage, Skills & Siblings',
  4: 'Home, Peace & Foundations',
  5: 'Creativity, Focus & Learning',
  6: 'Work, Routines & Health',
  7: 'Partnerships & Marriage',
  8: 'Deep Shifts & Research',
  9: 'Wisdom, Mentors & Luck',
  10: 'Career & Public Reputation',
  11: 'Gains, Goals & Community',
  12: 'Rest, Reflection & Foreign Links',
};

function describeToolForUser(tc: NativeToolCall): string {
  const a = tc.args ?? {};
  switch (tc.name) {
    case 'read': {
      const p = String(a.path ?? '/overview');
      if (p === '/overview') return 'Reading your chart overview (Ascendant, Moon & core placements)';
      const hMatch = p.match(/^\/houses\/(\d+)/);
      if (hMatch) {
        const h = Number(hMatch[1]);
        return `Inspecting House ${h} (${HOUSE_LABELS_FRIENDLY[h] ?? 'life area'})`;
      }
      const pMatch = p.match(/^\/planets\/([a-z]+)/i);
      if (pMatch) {
        const pl = pMatch[1]!.charAt(0).toUpperCase() + pMatch[1]!.slice(1);
        return `Inspecting ${pl}'s sign, house & dignity`;
      }
      if (p.includes('periods')) return 'Checking your active planetary life chapters (Dashas)';
      if (p.includes('transits')) return 'Checking live planetary transits (Gochar)';
      if (p.includes('strength')) return 'Checking planetary & house strength metrics';
      return `Reading chart section ${p}`;
    }
    case 'inspect_varga': {
      const v = String(a.varga ?? 'D9').toUpperCase();
      const vDesc =
        v === 'D9' ? 'Navamsha (inner maturity & partnerships)' :
        v === 'D10' ? 'Dashamsha (career & status)' :
        v === 'D2' ? 'Hora (wealth & resources)' :
        v === 'D4' ? 'Chaturthamsha (home & assets)' :
        v === 'D7' ? 'Saptamsha (creativity & children)' : `${v} divisional chart`;
      return `Analyzing your ${v} — ${vDesc}`;
    }
    case 'inspect_dashas': {
      const sys = String(a.system ?? 'vimshottari');
      const label =
        sys === 'yogini'
          ? 'Yogini'
          : sys === 'chara'
          ? 'Jaimini Chara'
          : sys === 'sudarshana'
          ? 'Sudarshana Chakra'
          : sys === 'narayana'
          ? `${a.varga ? String(a.varga).toUpperCase() + ' ' : ''}Narayana`
          : sys === 'sudasa'
          ? 'Sudasa (Wealth)'
          : sys === 'drigdasa'
          ? 'Drigdasa (Spiritual)'
          : sys === 'shoola'
          ? 'Shoola'
          : sys === 'kalachakra'
          ? 'Kalachakra'
          : sys === 'ashtottari'
          ? 'Ashtottari'
          : 'Vimshottari';
      return `Checking your ${label} Dasha timeline${a.from ? ` (${a.from} onward)` : ''}`;
    }
    case 'inspect_transits':
      return 'Scanning live planetary transits (Gochar) & Sade Sati status';
    case 'inspect_natal_lore': {
      const kind = String(a.kind ?? 'yogas');
      const labels: Record<string, string> = {
        yogas: 'Checking classical Yogas in your chart',
        doshas: 'Checking Doshas & classical Bhanga cancellations',
        aspects: 'Checking planetary mutual aspects (Drishti)',
        karakas: 'Checking Jaimini Chara Karakas (Atmakaraka & soul drivers)',
        avakahada: 'Checking Avakahada & birth star temperament',
        ghatak: 'Checking favourable amplifiers & Ghatak guardrails',
        upagrahas: 'Checking subtle Upagraha placements',
        arudha: 'Checking Arudha Padas (public image & perception)',
        sahams: 'Checking 36 Tajika Sahams (sensitive fruition points)',
        special_lagnas: 'Checking Special Lagnas (Hora, Ghati, Sree & Indu Lagna)',
      };
      return labels[kind] ?? `Inspecting ${kind}`;
    }
    case 'inspect_arudhas':
      return a.target ? `Inspecting Arudha Pada ${String(a.target).toUpperCase()} (Maya / perceived layer)` : 'Inspecting Jaimini Arudha Padas (public perception vs reality)';
    case 'inspect_karakas':
      return a.target ? `Inspecting Chara Karaka ${String(a.target).toUpperCase()} (soul / functional significator)` : 'Inspecting 7 Jaimini Chara Karakas (soul purpose & drivers)';
    case 'inspect_strengths': {
      const kind = String(a.kind ?? 'shadbala');
      const labels: Record<string, string> = {
        shadbala: 'Measuring planetary stamina (Shadbala)',
        bhavabala: 'Measuring 12-house strength (Bhavabala)',
        ashtakvarga: 'Checking Ashtakvarga bindu cushion (BAV/SAV)',
        avasthas: 'Checking planetary vitality & mood (Avasthas)',
        friendship: 'Checking 5-fold planetary friendship matrix',
        vaisheshikamsa: 'Checking 10-divisional chart dignity (Vaisheshikamsa: Parijata to Sreedhama)',
        pushkara: 'Checking Pushkara Navamsha & Pushkara Bhaga healing degrees',
        navatara: 'Checking 9-Tara relationship from Moon (Sampat, Vipat, Sadhana, Naidhana, etc.)',
        special_nakshatras: 'Checking 11 Special Life-Department Nakshatras (Karma, Manasa, Abhisheka, Desha, etc.)',
        kakshya: "Checking Ashtakavarga Kakshya (3°45' transit slice) benefic points",
        vedha: 'Checking Gochara Vedha transit obstructions & Father-Son exemptions',
      };
      return labels[kind] ?? `Checking ${kind}`;
    }
    case 'inspect_kp_chalit':
      return 'Checking KP Sub-Lords & Sripati Bhava Chalit house shifts';
    case 'inspect_panchang':
      return 'Checking birth Panchang (Tithi, Yoga, Karana & weekday)';
    case 'inspect_bhavas':
      return a.house ? `Analyzing House ${a.house} Bhava dossier` : 'Analyzing all 12 house dossiers';
    case 'inspect_varshaphal':
      return `Computing annual Varshaphal (Solar Return) & Muntha${a.year ? ` for ${a.year}` : ''}`;
    case 'inspect_muhurta':
      return `Checking Panchang, Rahu Kalam & favorable windows${a.date ? ` for ${a.date}` : ''}`;
    case 'inspect_journal_insights':
      return 'Reviewing your recent journal check-ins & sky snapshots';
    case 'compare_perspectives':
      return `Comparing House ${a.house ?? 1} across Lagna, Moon, Sun, AL & Paaka Lagna`;
    case 'inspect_functional_roles':
      return a.planet
        ? `Checking Lagna-specific functional role of ${String(a.planet)}`
        : 'Checking Functional Benefics, Yogakaraka, Baadhaka & birthtime sensitivity';
    case 'inspect_argala':
      return `Checking Argala interventions & Rasi Drishti on ${String(a.target ?? 'house 1')}`;
    case 'inspect_remedies':
      return 'Checking rule-safe classical remedies (functional benefics, fasting & Ishta Devata)';
    case 'inspect_varga_analytics':
      return `Analyzing ${String(a.varga ?? 'D10').toUpperCase()} Divisional SAV, Divisional Transits & Varga Narayana Dasa`;
    case 'inspect_longevity':
      return 'Checking Three-Pair Ayurdaya, Rudra, Trishoola Rasis & Shoola vulnerability windows';
    case 'inspect_sbc':
      return 'Scanning Sarvatobhadra Chakra 3-line Vedha, Special Tithis & Transit Murthis';
    case 'inspect_family_vargas':
      return `Checking family member divisional indicators${a.member ? ` (${String(a.member)})` : ''}`;
    case 'inspect_kn_rao_audit':
      return `Running K.N. Rao empirical audit${a.focus && a.focus !== 'all' ? ` (${String(a.focus)})` : ' (Checklists I–III & patterns)'}`;
    case 'load_skill':
      return `Loading specialized analysis playbook (${String(a.skillId ?? 'skill')})`;
    case 'trace_dispositor_chain':
      return `Tracing the dispositor chain for ${String(a.planetOrHouse ?? 'chart')}`;
    case 'window_scan':
      return `Scanning upcoming favorable timing windows for ${String(a.theme ?? 'your focus')}`;
    case 'search_knowledge':
      return `Consulting Jyotish reference library ("${String(a.query ?? '').slice(0, 36)}")`;
    case 'find':
      return `Searching chart facts for "${String(a.text ?? '')}"`;
    default:
      return `Running ${tc.name}`;
  }
}

async function executeToolCall(server: ToolServer, tc: NativeToolCall): Promise<ToolResult> {
  const a = tc.args ?? {};
  switch (tc.name) {
    case 'ls':
      return server.ls(String(a.path ?? '/'));
    case 'read':
      return server.read(String(a.path ?? '/overview'), a.depth ?? 2, a.limit ?? 12);
    case 'find':
      return server.find(String(a.text ?? ''), a.scope ?? 'all', a.filters ?? {});
    case 'follow':
      return server.follow(String(a.id ?? ''), a.rel, a.depth ?? 1);
    case 'inspect_varga':
      return server.inspect_varga(String(a.varga ?? 'D9'), a.planet);
    case 'inspect_kp_chalit':
      return server.inspect_kp_chalit(a.target);
    case 'inspect_strengths':
      return server.inspect_strengths(a.kind ?? 'shadbala', a.target);
    case 'inspect_natal_lore':
      return server.inspect_natal_lore(a.kind ?? 'yogas');
    case 'inspect_arudhas':
      return server.inspect_arudhas(
        a.target ? String(a.target) : undefined,
        a.varga ? String(a.varga) : undefined,
        typeof a.includeGrahaArudhas === 'boolean' ? a.includeGrahaArudhas : undefined,
      );
    case 'inspect_karakas':
      return server.inspect_karakas(a.target ? String(a.target) : undefined);
    case 'inspect_dashas':
      return server.inspect_dashas(a.system ?? 'vimshottari', a.from, a.to, a.varga ? String(a.varga) : undefined);
    case 'inspect_transits':
      return server.inspect_transits();
    case 'inspect_panchang':
      return server.inspect_panchang();
    case 'inspect_bhavas':
      return server.inspect_bhavas(a.house ? Number(a.house) : undefined);
    case 'inspect_varshaphal':
      return await server.inspect_varshaphal(
        a.year ? Number(a.year) : undefined,
        a.mode === 'monthly' || a.mode === '60hr' ? a.mode : 'annual',
        a.targetDate ? String(a.targetDate) : undefined,
        a.varga ? String(a.varga) : undefined,
        a.school === 'pvr' || a.school === 'neelakantha' ? a.school : 'both',
      );
    case 'inspect_ashtakoota':
      return server.inspect_ashtakoota(Number(a.partnerMoonSignIndex ?? 0), Number(a.partnerMoonNakshatraIndex ?? 0));
    case 'inspect_muhurta':
      return await server.inspect_muhurta(a.date ? String(a.date) : undefined);
    case 'inspect_journal_insights':
      return server.inspect_journal_insights(a.limit ? Number(a.limit) : 8);
    case 'compare_perspectives':
      return server.compare_perspectives(Number(a.house ?? 1));
    case 'inspect_functional_roles':
      return server.inspect_functional_roles(a.planet ? String(a.planet) : undefined);
    case 'inspect_argala':
      return server.inspect_argala(String(a.target ?? '1'));
    case 'inspect_remedies':
      return server.inspect_remedies(a.domain ? String(a.domain) : undefined);
    case 'inspect_varga_analytics':
      return server.inspect_varga_analytics(a.varga ? String(a.varga) : 'D10');
    case 'inspect_longevity':
      return server.inspect_longevity();
    case 'inspect_sbc':
      return server.inspect_sbc();
    case 'inspect_family_vargas':
      return server.inspect_family_vargas(a.member ? String(a.member) : undefined);
    case 'inspect_kn_rao_audit':
      return server.inspect_kn_rao_audit((a.focus as any) ?? 'all');
    case 'load_skill': {
      const skill = getAgentSkill(String(a.skillId ?? ''));
      if (!skill) {
        return {
          items: [
            {
              id: 'skill.not_found',
              kind: 'skill',
              text: `Unknown skillId "${String(a.skillId ?? '')}". Choose a skillId from the catalog in the system prompt.`,
              tokens: 18,
            },
          ],
          budget: { stepsLeft: 1, tokensLeft: 1000 },
        };
      }
      const text = renderSkillPlaybook(skill);
      return {
        items: [{ id: `skill.${skill.id}`, kind: 'skill', text, tokens: Math.ceil(text.length / 4) }],
        budget: { stepsLeft: 1, tokensLeft: 1000 },
      };
    }
    case 'trace_dispositor_chain':
      return server.trace_dispositor_chain(String(a.planetOrHouse ?? 'sun'));
    case 'window_scan':
      return server.window_scan(String(a.theme ?? 'self'), a.from, a.to);
    case 'search_knowledge':
      return server.search_knowledge(
        String(a.query ?? ''),
        {
          ...(a.house ? { house: Number(a.house) } : {}),
          ...(a.planet ? { planet: String(a.planet) } : {}),
        },
        Number(a.k ?? 4),
      );
    default:
      return {
        items: [{ id: 'unknown_tool', kind: 'error', text: `Unknown tool: ${tc.name}`, tokens: 4 }],
        budget: { stepsLeft: 1, tokensLeft: 100 },
      };
  }
}

function buildLevel2Fallback(
  ws: ChartWorkspace,
  findings: Finding[],
  note: string,
): ComposedAnswer {
  const reading = renderHouse(1, ws, findings, 'standard');
  const topStatements = reading.findings.slice(0, 2).map((f) => f.text).join(' ');
  const evidenceIds = reading.evidenceChips.slice(0, 3).map((c) => c.id);

  return {
    responseType: 'chart_reading',
    answer: `${topStatements} (${note})`,
    because: reading.findings.slice(0, 3).map((f) => ({
      claim: f.text,
      evidenceIds: f.evidenceChips.length > 0 ? f.evidenceChips.map((c) => c.id) : evidenceIds,
    })),
    timing: [],
    uncertainty: note,
    reflect: reading.reflectionPrompt,
    followUps: [
      'How is my 10th house and D10 Dashamsha positioned for career?',
      'What does my current Vimshottari Mahadasha emphasize?',
    ],
  };
}

export interface RunDeepAgentOptions {
  question: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string; evidenceIds?: string[] }>;
  ws: ChartWorkspace;
  kb: KnowledgeBase;
  findings: Finding[];
  llm: LlmClient;
  engineSession?: EngineSession;
  deep?: boolean;
  onTrace?: (ev: AgentTraceEvent) => void;
}

export async function runAgentQuery(opts: RunDeepAgentOptions): Promise<AskResult> {
  const { question, history = [], ws, kb, findings, llm, engineSession, deep, onTrace } = opts;
  const trace: string[] = [];

  const emitTrace = (type: AgentTraceEvent['type'], message: string, step?: number, data?: unknown) => {
    trace.push(message);
    onTrace?.({ type, message, step, data });
  };

  // Fast-path: handle greetings, small talk, and safety guardrails immediately with ZERO tool calls & ZERO LLM latency
  const routed = routeQuestion(question, kb);
  if (routed.riskClass === 'greeting') {
    const qLower = question.trim().toLowerCase();
    const isThanks = /^(thanks|thank|thx|ok|okay|cool|great|awesome|got\s+it|bye|goodbye)/.test(qLower);
    const isHelp = /(what\s+can\s+you\s+do|who\s+are\s+you|help)/.test(qLower);
    const answer = isThanks
      ? "You're very welcome! Whenever you'd like to explore another part of your chart, timing, or daily energy, just ask."
      : isHelp
      ? "I'm your KundliFlow Jyotish guide. I can explain your birth chart in plain English — including career, relationships, strengths & Yogas, Dosha checks, current Dashas (life chapters), daily transits, and upcoming favorable windows."
      : "Namaste! I'm your KundliFlow Jyotish guide, ready to explore your active chart in simple, everyday language. What would you like to look into today?";

    emitTrace('answer', 'Fast-path conversational greeting (0 tool calls)');
    return {
      mode: 'conversational',
      trace,
      observedEvidenceIds: [],
      response: {
        responseType: 'conversational',
        answer,
        because: [],
        timing: [],
        uncertainty: '',
        reflect: '',
        followUps: [
          'What does my current life chapter (Dasha) focus on?',
          'What are my biggest career strengths in this chart?',
          'Do I have any important Yogas or Doshas I should know about?',
        ],
      },
    };
  }

  if (routed.declineMessage) {
    emitTrace('answer', `Fast-path guardrail (${routed.riskClass})`);
    return {
      mode: 'declined',
      trace,
      observedEvidenceIds: [],
      response: {
        responseType: 'conversational',
        answer: routed.declineMessage,
        because: [],
        timing: [],
        uncertainty: '',
        reflect: '',
        followUps: [
          'What are the main themes of my year ahead?',
          'How can I best use my current planetary period?',
        ],
      },
    };
  }

  const maxTurns = deep ? 10 : 7;
  const server = new ToolServer(ws, kb, { maxSteps: maxTurns * 4, maxTokens: 12000 }, engineSession);

  // Route domain + timescale Deep Agent Skill(s) for progressive disclosure
  const skillRoute = routeSkills(question, routed.topicId, routed.riskClass);
  const activeSkillIds = new Set<string>([
    skillRoute.primarySkill.id,
    ...skillRoute.secondarySkills.map((s) => s.id),
  ]);
  const skillBriefing = renderActiveSkillBriefing(skillRoute, routed.timeframe);
  const systemPrompt = buildDeepAgentSystemPrompt(skillBriefing);
  emitTrace(
    'trace',
    `Selected analysis skill: ${skillRoute.primarySkill.title} (${skillRoute.timescale})`,
    0,
    { activeSkills: Array.from(activeSkillIds), timescale: skillRoute.timescale },
  );

  // Seed prior conversation evidence IDs so follow-up turns remain grounded
  const priorIds = history.flatMap((h) => h.evidenceIds ?? []);
  if (priorIds.length > 0) {
    server.seedObservedEvidence(priorIds, history.map((h) => h.content));
  }

  const messages: AgentMessage[] = [
    ...history.slice(-6).map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: question },
  ];

  try {
    let finalComposed: ComposedAnswer | null = null;
    let lastVerifierErrors: string[] = [];

    for (let turn = 1; turn <= maxTurns; turn++) {
      if (turn === 1) {
        emitTrace('trace', 'Understanding your question & picking the right chart tools…', turn);
      } else {
        emitTrace('trace', 'Synthesizing chart insights into plain English…', turn);
      }

      const result = await llm.runAgentTurn({
        systemPrompt,
        messages,
        tools: DEEP_AGENT_TOOLS,
      });

      if (result.toolCalls && result.toolCalls.length > 0) {
        messages.push({
          role: 'assistant',
          content: result.text ?? '',
          toolCalls: result.toolCalls,
        });

        // Execute all parallel tool calls requested in this turn (with per-tool error isolation)
        for (const tc of result.toolCalls) {
          emitTrace('tool_call', describeToolForUser(tc), turn, { name: tc.name, args: tc.args });
          if (tc.name === 'load_skill' && tc.args?.skillId) {
            const loaded = getAgentSkill(String(tc.args.skillId));
            if (loaded) activeSkillIds.add(loaded.id);
          }
          let compactText: string;
          try {
            const toolOut = await executeToolCall(server, tc);
            compactText =
              toolOut.items.map((i) => `[${i.id}] ${i.text}`).join('\n') || '(no matching records)';
          } catch (toolErr: any) {
            compactText = `Tool error in ${tc.name}: ${toolErr?.message ?? 'unknown error'}. Try another tool or continue with available evidence.`;
          }
          messages.push({
            role: 'tool',
            toolCallId: tc.id,
            toolName: tc.name,
            content: compactText,
          });
        }
        continue;
      }

      // Final answer turn (no tool calls)
      const rawText = (result.text ?? '').trim();
      let parsedAnswer: ComposedAnswer;
      try {
        const obj = extractJsonObject(rawText);
        parsedAnswer = ComposedAnswerSchema.parse(obj);
      } catch {
        // If model replied in plain prose (e.g. conversational greeting), wrap cleanly
        parsedAnswer = {
          responseType: server.getObservedEvidence().ids.size === 0 ? 'conversational' : 'chart_reading',
          answer: rawText || 'How can I help explore your chart today?',
          because: [],
          timing: [],
          uncertainty: '',
          reflect: '',
          followUps: [],
        };
      }

      const verification = verifyComposedAnswer(
        parsedAnswer,
        server.getObservedEvidence(),
        server.getScannedWindows(),
        ws,
      );

      if (verification.valid) {
        finalComposed = parsedAnswer;
        emitTrace('answer', `Verified ${parsedAnswer.responseType} answer`);
        break;
      }

      lastVerifierErrors = verification.errors;
      emitTrace('trace', `Verifier flagged ${lastVerifierErrors.length} issue(s); requesting grounded correction`);
      messages.push({ role: 'assistant', content: rawText });
      messages.push({
        role: 'user',
        content: `Verification failed: ${lastVerifierErrors.join(' | ')}. Please correct and output ONLY valid JSON using strictly the planets, signs, dates, and IDs observed in the tool outputs above.`,
      });
    }

    if (finalComposed) {
      const mode: AskResult['mode'] =
        finalComposed.responseType === 'conversational'
          ? 'conversational'
          : finalComposed.responseType === 'conceptual'
          ? 'conceptual'
          : 'level3_verified';

      return {
        mode,
        response: finalComposed,
        trace,
        observedEvidenceIds: Array.from(server.getObservedEvidence().ids),
        activeSkills: Array.from(activeSkillIds),
      };
    }

    emitTrace('fallback', 'Verification failed; falling back to Level 2 deterministic reading');
    return {
      mode: 'level2_fallback',
      trace,
      observedEvidenceIds: Array.from(server.getObservedEvidence().ids),
      activeSkills: Array.from(activeSkillIds),
      verifierErrors: lastVerifierErrors,
      response: buildLevel2Fallback(
        ws,
        findings,
        'Showing deterministic Level 2 reading because verification could not confirm all citations.',
      ),
    };
  } catch (err: any) {
    emitTrace('fallback', `LLM unavailable (${err?.message ?? 'error'}); falling back to Level 2 reading`);
    return {
      mode: 'level2_fallback',
      trace,
      observedEvidenceIds: Array.from(server.getObservedEvidence().ids),
      response: buildLevel2Fallback(
        ws,
        findings,
        'Showing deterministic Level 2 reading because the AI service was unavailable.',
      ),
    };
  }
}
