import type { ChartWorkspace } from '@astro/facts';
import type { KnowledgeBase } from '@astro/kb';
import { renderHouse, type Finding } from '@astro/rules';
import { EngineSession, ToolServer, type ToolResult } from '@astro/tools';
import { DEEP_AGENT_SYSTEM_PROMPT, extractJsonObject } from './llm.js';
import { routeQuestion } from './router.js';
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
    description: 'Inspect any divisional chart (D1, D2, D4, D7, D9, D10, D12, D20, D24, D60) and Vargottama status.',
    parameters: {
      type: 'object',
      properties: {
        varga: { type: 'string', description: 'e.g. D9, D10, D4, D7' },
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
    description: 'Inspect planetary/house strength engines: shadbala, bhavabala, ashtakvarga, avasthas, or friendship.',
    parameters: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['shadbala', 'bhavabala', 'ashtakvarga', 'avasthas', 'friendship'] },
        target: { type: 'string' },
      },
      required: ['kind'],
    },
  },
  {
    name: 'inspect_natal_lore',
    description: 'Inspect detected classical yogas, doshas, mutual aspects, Jaimini Chara Karakas, Avakahada, Ghatak, Upagrahas, or Arudha Padas (AL, UL, A2..A11).',
    parameters: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['yogas', 'doshas', 'aspects', 'karakas', 'avakahada', 'ghatak', 'upagrahas', 'arudha'] },
      },
      required: ['kind'],
    },
  },
  {
    name: 'inspect_dashas',
    description: 'Inspect Vimshottari, Yogini, or Jaimini Chara Dasha periods within an optional date window.',
    parameters: {
      type: 'object',
      properties: {
        system: { type: 'string', enum: ['vimshottari', 'yogini', 'chara'] },
        from: { type: 'string', description: 'YYYY-MM-DD' },
        to: { type: 'string', description: 'YYYY-MM-DD' },
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
    description: 'Inspect Tajika Varshaphal (Solar Return annual chart, Varsha Lagna, Muntha, and Vara Pati) for a given calendar year.',
    parameters: {
      type: 'object',
      properties: { year: { type: 'number', description: 'Target year, e.g. 2026' } },
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
    description: 'Compare a house (1-12) simultaneously from Lagna, Chandra Lagna (Moon), Surya Lagna (Sun), and Karakamsa (D9 AK).',
    parameters: {
      type: 'object',
      properties: { house: { type: 'number' } },
      required: ['house'],
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
      const label = sys === 'yogini' ? 'Yogini' : sys === 'chara' ? 'Jaimini Chara' : 'Vimshottari';
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
      };
      return labels[kind] ?? `Inspecting ${kind}`;
    }
    case 'inspect_strengths': {
      const kind = String(a.kind ?? 'shadbala');
      const labels: Record<string, string> = {
        shadbala: 'Measuring planetary stamina (Shadbala)',
        bhavabala: 'Measuring 12-house strength (Bhavabala)',
        ashtakvarga: 'Checking Ashtakvarga bindu cushion (BAV/SAV)',
        avasthas: 'Checking planetary vitality & mood (Avasthas)',
        friendship: 'Checking 5-fold planetary friendship matrix',
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
      return `Comparing House ${a.house ?? 1} from Lagna, Moon, Sun & Karakamsa`;
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
    case 'inspect_dashas':
      return server.inspect_dashas(a.system ?? 'vimshottari', a.from, a.to);
    case 'inspect_transits':
      return server.inspect_transits();
    case 'inspect_panchang':
      return server.inspect_panchang();
    case 'inspect_bhavas':
      return server.inspect_bhavas(a.house ? Number(a.house) : undefined);
    case 'inspect_varshaphal':
      return await server.inspect_varshaphal(a.year ? Number(a.year) : undefined);
    case 'inspect_ashtakoota':
      return server.inspect_ashtakoota(Number(a.partnerMoonSignIndex ?? 0), Number(a.partnerMoonNakshatraIndex ?? 0));
    case 'inspect_muhurta':
      return await server.inspect_muhurta(a.date ? String(a.date) : undefined);
    case 'inspect_journal_insights':
      return server.inspect_journal_insights(a.limit ? Number(a.limit) : 8);
    case 'compare_perspectives':
      return server.compare_perspectives(Number(a.house ?? 1));
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
        systemPrompt: DEEP_AGENT_SYSTEM_PROMPT,
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
      };
    }

    emitTrace('fallback', 'Verification failed; falling back to Level 2 deterministic reading');
    return {
      mode: 'level2_fallback',
      trace,
      observedEvidenceIds: Array.from(server.getObservedEvidence().ids),
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
