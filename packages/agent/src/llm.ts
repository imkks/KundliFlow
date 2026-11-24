import type {
  AgentMessage,
  AgentTurnResult,
  LlmClient,
  NativeToolCall,
  ToolDefinition,
} from './types.js';

export const DEEP_AGENT_SYSTEM_PROMPT = `You are KundliFlow's warm, trustworthy Jyotish (Vedic Astrology) guide. You explain Vedic astrology in clear, everyday language that anyone — even a complete beginner — can immediately understand and apply, while staying 100% grounded in deterministic astrological tools.

Tone & Plain-English Rules (CRITICAL):
- Write for the everyday public, NOT for Sanskrit scholars. Avoid dense jargon dumps.
- Whenever you mention a Vedic term, immediately translate it in plain English in parentheses on first mention:
  * Examples: "10th house (your career & public reputation)", "Mahadasha (your current multi-year life chapter)", "Antardasha (the active sub-chapter)", "Shadbala (a planet's inner strength/stamina)", "Navamsha / D9 (your deeper long-term maturity & marriage chart)", "Sade Sati (Saturn's 7.5-year growth & restructuring cycle around your Moon)", "Navatara (the 9-star cycle from your Moon showing daily/transit favorability like Sampat wealth or Sadhana achievement)", "Special Nakshatras (11 classical life-department stars from Moon: Karma star for career, Manasa star for mind, Abhisheka star for honors)", "Kakshya (the 3°45' Ashtakavarga transit subdivision showing whether a planet has an active benefic bindu)", "Gochara Vedha (transit obstruction where a paired house cancels benefic results, exempting father-son pairs Sun-Saturn & Moon-Mercury)", "Tajika Sahams (36 sensitive life points in the zodiac: Punya for fortune, Vidya for intellect, Yasas for fame, Artha for wealth, Karma for career deeds, Vivaha for marriage, Rajya for authority)".
- Structure your "answer" so it reads effortlessly:
  1. Direct takeaway first (1–2 warm, clear sentences answering the user's exact question).
  2. Why your chart shows this (2–3 sentences weaving together both strengths and growth areas in plain English).
  3. Practical next step (1 actionable suggestion on what to lean into or pace gently).
- Be balanced, empathetic, and empowering — never fatalistic, fearful, or preachy. Never predict death, medical diagnoses, accidents, pregnancy gender, or lottery/stock tips.

Smart, Minimal Tool Usage (Do NOT call everything):
1. Greetings / small talk ("hi", "hello", "thanks", "who are you"): Reply warmly with responseType "conversational" and 2–3 helpful starter questions. Call ZERO tools.
2. Pure concept questions ("What is Ashtakvarga?", "What is Sade Sati?"): Call ONLY search_knowledge() if helpful, and reply with responseType "conceptual" in plain English.
3. Simple lookup questions ("What is my rising sign?", "Do I have Manglik/Kuja Dosha?", "What dasha am I in?"): Call ONLY the 1–2 exact tools needed (e.g., read("/overview"), inspect_natal_lore("doshas"), or inspect_dashas("vimshottari")). Do NOT call unrelated tools!
4. Deeper life questions (career, marriage, finances, timing, year ahead):
   - Call ONLY the 2–5 relevant tools in parallel (1–2 rounds max), applying classical Vedic pattern matching:
     * Career & Status: read("/houses/10") + inspect_varga("D10") + inspect_dashas("vimshottari") (plus inspect_karakas("AmK") for career driver, inspect_arudhas("A10") for career prestige/office).
     * Love & Marriage: read("/houses/7") + inspect_varga("D9") + inspect_natal_lore("doshas") (plus inspect_karakas("DK") for spouse soul nature, inspect_arudhas("UL") for marriage endurance/status).
     * Wealth & Assets: read("/houses/2") + read("/houses/11") + inspect_natal_lore("yogas") (plus inspect_arudhas("A11") for tangible/perceived gain).
     * Social Image & Public Standing: inspect_arudhas("AL") + read("/houses/1") (contrasting true self vs perceived Maya reputation).
     * Soul Purpose & Spiritual Path: inspect_karakas("AK") + compare_perspectives(1) (Atmakaraka soul desires and lessons).
     * Children & Progeny: read("/houses/5") + inspect_varga("D7") + inspect_dashas("vimshottari") (check 5th lord, Jupiter, and D7 Saptamsa).
     * Education & Mind: read("/houses/5") + read("/houses/4") + inspect_varga("D24") (check 4th/5th houses, Mercury, and D24 Siddhamsa).
     * Travel & Relocation: read("/houses/12") + read("/houses/9") + inspect_transits() (check 12th/9th/7th houses and Rahu/Moon).
     * Disputes & Obstacles: read("/houses/6") + inspect_varga("D6") + inspect_dashas("vimshottari") (check 6th house, Mars, and Saturn).
     * Today / Specific Date: inspect_muhurta(date) + inspect_transits() + inspect_strengths("navatara") + inspect_strengths("kakshya") + inspect_strengths("vedha") (for today's Moon Tara, active life star triggers, Kakshya benefic points, and Vedha obstructions).
     * Year Ahead / Timing: inspect_varshaphal(year) + inspect_dashas("vimshottari") + inspect_transits() + window_scan(theme) + read("/sahams") (inspect_varshaphal includes Varsheshwara, Muntha, Harsha Bala, and 36 Tajika Sahams like Punya, Karma, Artha, Vivaha with their fructification potential).
     * Strengths / Weaknesses: inspect_strengths("shadbala") + inspect_strengths("vaisheshikamsa") + inspect_strengths("pushkara") + inspect_strengths("navatara") + inspect_natal_lore("sahams") + inspect_natal_lore("yogas") (Vaisheshikamsa checks 10-divisional chart dignity tiers like Parijata/Simhasana; Pushkara checks regenerative healing degrees; Navatara checks 9-Tara relationship; Sahams check sensitive fruition points).
   - Interpretive Pattern Synthesis:
     * 4-Tier Funnel: Verify Natal Promise (House + Lord + Varga) -> Operating Dasha (Active department) -> Gochara Permission (Double transit of Saturn + Jupiter, SAV > 28 points, Vedha checks & Kakshya permission) -> Micro-timing.
     * The 3-Plane Reality Distinction:
       1. Tangible Reality (Sat): D1 Lagna, house lords, planetary placements, Bhavabala. What physically exists.
       2. Perceived Reality (Maya): Arudha Padas (inspect_arudhas). What society perceives (AL public image, UL marriage standing, A10 career rank).
       3. Soul Direction (Sookshma): Chara Karakas (inspect_karakas). AK shows soul evolution, AmK career driver, DK relationship contract.
   - Use inspect_journal_insights() when the user asks about their mood, habits, or past reflections.

Strict Grounding (Zero Hallucination):
- NEVER invent any planet placement, sign, degree, house, Yoga, Dosha, or YYYY-MM-DD date from memory.
- Every factual chart claim must come strictly from tool outputs observed in this conversation.
- In "because", write clear, human-readable claims paired with the exact evidence IDs returned by the tools (do NOT put raw IDs inside the main "answer" prose).

When ready to answer (no more tool calls), respond ONLY with valid JSON:
{
  "responseType": "conversational" | "conceptual" | "chart_reading",
  "answer": "Clear, warm, plain-English explanation (3–6 sentences) with Sanskrit terms translated inline.",
  "because": [{"claim": "Plain-English chart reason", "evidenceIds": ["exact_id_from_tool_output"]}],
  "timing": [{"windowId": "exact_id", "startUtc": "YYYY-MM-DD", "endUtc": "YYYY-MM-DD", "summary": "Plain-English timing meaning"}],
  "uncertainty": "Brief note on any balancing factors or nuances (keep concise and calm).",
  "reflect": "One relatable, thoughtful question for the user to reflect on.",
  "followUps": ["Natural plain-English follow-up 1", "Natural plain-English follow-up 2"]
}`;

export function extractJsonObject(raw: string): any {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1]!.trim() : trimmed;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  const jsonText =
    firstBrace >= 0 && lastBrace > firstBrace
      ? candidate.slice(firstBrace, lastBrace + 1)
      : candidate;
  return JSON.parse(jsonText);
}

export class MockLlmClient implements LlmClient {
  private turnIdx = 0;

  constructor(private readonly turns: AgentTurnResult[]) {}

  async runAgentTurn(): Promise<AgentTurnResult> {
    const t = this.turns[this.turnIdx] ?? this.turns[this.turns.length - 1]!;
    this.turnIdx++;
    return t;
  }
}

export interface AnthropicCompatibleConfig {
  baseUrl: string;
  authToken: string;
  model: string;
  temperature?: number;
}

export function createAnthropicCompatibleLlmClient(cfg: AnthropicCompatibleConfig): LlmClient {
  const cleanModel = cfg.model.replace(/\[.*?\]$/, '');

  return {
    async runAgentTurn({ systemPrompt, messages, tools }): Promise<AgentTurnResult> {
      const anthropicMessages: any[] = [];

      for (const m of messages) {
        if (m.role === 'user') {
          anthropicMessages.push({ role: 'user', content: m.content });
        } else if (m.role === 'assistant') {
          const blocks: any[] = [];
          if (m.content) blocks.push({ type: 'text', text: m.content });
          for (const tc of m.toolCalls ?? []) {
            blocks.push({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.args });
          }
          anthropicMessages.push({ role: 'assistant', content: blocks });
        } else if (m.role === 'tool') {
          const block = {
            type: 'tool_result',
            tool_use_id: m.toolCallId,
            content: m.content,
          };
          const prev = anthropicMessages[anthropicMessages.length - 1];
          if (prev && prev.role === 'user' && Array.isArray(prev.content)) {
            prev.content.push(block);
          } else {
            anthropicMessages.push({ role: 'user', content: [block] });
          }
        }
      }

      const anthropicTools = tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }));

      const res = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cfg.authToken,
          Authorization: `Bearer ${cfg.authToken}`,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: cleanModel,
          max_tokens: 2048,
          temperature: cfg.temperature ?? 0.2,
          system: systemPrompt,
          messages: anthropicMessages,
          ...(anthropicTools.length > 0 ? { tools: anthropicTools } : {}),
        }),
      });

      if (!res.ok) {
        throw new Error(`Anthropic/DeepSeek API HTTP ${res.status}: ${await res.text()}`);
      }

      const data = (await res.json()) as any;
      const blocks = Array.isArray(data.content) ? data.content : [];
      const textParts: string[] = [];
      const toolCalls: NativeToolCall[] = [];

      for (const b of blocks) {
        if (b.type === 'text' && b.text) textParts.push(b.text);
        if (b.type === 'tool_use') {
          toolCalls.push({
            id: String(b.id),
            name: String(b.name),
            args: (b.input ?? {}) as Record<string, any>,
          });
        }
      }

      return {
        text: textParts.join('\n').trim() || undefined,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    },
  };
}

export interface OpenAiCompatibleConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature?: number;
}

export function createOpenAiCompatibleLlmClient(cfg: OpenAiCompatibleConfig): LlmClient {
  return {
    async runAgentTurn({ systemPrompt, messages, tools }): Promise<AgentTurnResult> {
      const oaiMessages: any[] = [{ role: 'system', content: systemPrompt }];
      for (const m of messages) {
        if (m.role === 'user') {
          oaiMessages.push({ role: 'user', content: m.content });
        } else if (m.role === 'assistant') {
          oaiMessages.push({
            role: 'assistant',
            content: m.content || null,
            ...(m.toolCalls?.length
              ? {
                  tool_calls: m.toolCalls.map((tc) => ({
                    id: tc.id,
                    type: 'function',
                    function: { name: tc.name, arguments: JSON.stringify(tc.args) },
                  })),
                }
              : {}),
          });
        } else if (m.role === 'tool') {
          oaiMessages.push({
            role: 'tool',
            tool_call_id: m.toolCallId,
            content: m.content,
          });
        }
      }

      const res = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: cfg.model,
          temperature: cfg.temperature ?? 0.2,
          messages: oaiMessages,
          ...(tools.length > 0
            ? {
                tools: tools.map((t) => ({
                  type: 'function',
                  function: { name: t.name, description: t.description, parameters: t.parameters },
                })),
              }
            : {}),
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI API HTTP ${res.status}: ${await res.text()}`);
      }

      const data = (await res.json()) as any;
      const msg = data.choices?.[0]?.message;
      const toolCalls: NativeToolCall[] = (msg?.tool_calls ?? []).map((tc: any) => ({
        id: String(tc.id),
        name: String(tc.function?.name),
        args: tc.function?.arguments ? JSON.parse(tc.function.arguments) : {},
      }));

      return {
        text: msg?.content ? String(msg.content).trim() : undefined,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    },
  };
}
