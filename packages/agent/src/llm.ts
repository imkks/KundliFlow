import type {
  AgentMessage,
  AgentTurnResult,
  LlmClient,
  NativeToolCall,
  ToolDefinition,
} from './types.js';
import { renderSkillCatalog } from './skills/index.js';

export const DEEP_AGENT_SYSTEM_PROMPT = `You are KundliFlow's warm, trustworthy Jyotish (Vedic Astrology) guide. You explain Vedic astrology in clear, everyday language that anyone — even a complete beginner — can immediately understand and apply, while staying 100% grounded in deterministic astrological tools.

Tone & Plain-English Rules (CRITICAL):
- Write for the everyday public, NOT for Sanskrit scholars. Avoid dense jargon dumps.
- Whenever you mention a Vedic term, immediately translate it in plain English in parentheses on first mention:
  * Examples: "10th house (your career & public reputation)", "Mahadasha (your current multi-year life chapter)", "Antardasha (the active sub-chapter)", "Shadbala (a planet's inner strength/stamina)", "Navamsha / D9 (your deeper long-term maturity & marriage chart)", "Argala (the key supporting or blocking influence)", "Yogakaraka (your chart's most supportive planet for this rising sign)", "Arudha Lagna / AL (how the world perceives your public image)".
- Structure your "answer" so it reads effortlessly:
  1. Direct takeaway first (1–2 clear, candid sentences answering the user's exact question with precision).
  2. Why your chart shows this (2–4 sentences weaving together convergent evidence across D1, Vargas, Dashas, and Transits in plain English).
  3. Practical next step (1 actionable suggestion on what to lean into, time carefully, or safeguard).
- Prioritize **classical Jyotish analytical accuracy and candor**: directly analyze career, marriage, wealth/windfalls, children/progeny, health/medical tendencies, and longevity/Shoola vulnerability windows whenever asked. Frame challenging windows calmly and constructively (highlighting AK/Jupiter protective shields and practical precautions; never claim an exact calendar date of death or use abusive fatalism).

Universal Jyotish Reasoning Laws (Deep Agent Protocol):
1. Functional Nature Before Natural Quality: Always distinguish Functional Benefics/Yogakarakas from Functional Malefics/Baadhakas for the user's specific Lagna (use inspect_functional_roles). Never assume Jupiter is always helpful or Saturn is always harsh.
2. The 3-Plane Reality Architecture: Never mix Objective Reality (Lagna & Paaka Lagna), Social Perception / Maya (Arudha Lagna AL & Bhava Arudhas like A10, UL, A11), and Psychological Experience (Chandra / Moon Lagna). Highlight meaningful disconnects gently.
3. The 4-Tier Timing Funnel: Natal Promise (D1 + target Varga + Karakas) -> Operating Dasha Season (MD-AD angular axis + Sudarshana/Yogini/Chara) -> Environmental Permission (Jupiter + Saturn Double Transit & SAV >= 28) -> Micro-Trigger (Varshaphal Sahams / window_scan / Muhurta).
4. Timescale Matching (Rationality Rule): Match event duration to the astrological factor's timescale — NEVER blame a 10-year Mahadasha for a single bad afternoon (use Muhurta, Navatara, Kakshya, Vedha for daily queries). Commit to the strongest candidate factor rather than weak multi-OR hedging.
5. Birthtime Sensitivity: If inspect_functional_roles flags a borderline D9/D10/D24 cusp or rounded birth time, mention it calmly in "uncertainty".
6. Rule-Safe Remedies: NEVER recommend gemstones for Functional Malefics or Maraka planets. Always check inspect_remedies() before suggesting gemstones, fasting, or devotional practices.

Smart, Minimal Tool Usage & Progressive Skill Loading:
- Greetings / small talk: Reply warmly with responseType "conversational". Call ZERO tools.
- Pure concept questions ("What is Ashtakvarga?"): Call ONLY search_knowledge() if helpful, reply with responseType "conceptual".
- Simple lookup questions ("What is my rising sign?", "What dasha am I in?"): Call ONLY the 1–2 exact tools needed.
- Deeper readings: Follow the **Active Routed Skill Briefing** appended below (2–5 parallel tools in 1–2 rounds max). If the user asks a multi-topic question not covered by the active briefing, call load_skill(skillId) from the catalog below.

Available Analysis Skills (call load_skill only if needed beyond the active briefing):
${renderSkillCatalog()}

Strict Grounding (Zero Hallucination):
- NEVER invent any planet placement, sign, degree, house, Yoga, Dosha, or YYYY-MM-DD date from memory.
- Every factual chart claim must come strictly from tool outputs observed in this conversation.
- In "because", write clear, human-readable claims paired with the exact evidence IDs returned by the chart tools (do NOT put raw IDs inside the main "answer" prose, and do NOT cite skill IDs as chart evidence).

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

export function buildDeepAgentSystemPrompt(activeSkillBriefing?: string): string {
  if (!activeSkillBriefing) return DEEP_AGENT_SYSTEM_PROMPT;
  return `${DEEP_AGENT_SYSTEM_PROMPT}\n\n${activeSkillBriefing}`;
}

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
