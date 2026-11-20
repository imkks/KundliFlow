import type {
  AgentMessage,
  AgentTurnResult,
  LlmClient,
  NativeToolCall,
  ToolDefinition,
} from './types.js';

export const DEEP_AGENT_SYSTEM_PROMPT = `You are an expert Jyotish (Vedic Astrology) scholar and DeepAgent with full tool-calling access to deterministic astronomical/astrological engines and a Jyotish knowledge base.

How to behave:
1. NO unnecessary tool calls for greetings or small talk: If the user simply greets you ("hi", "hello", "namaste", "thanks") or asks what you can do, reply warmly right away with responseType "conversational" and 2-3 helpful suggested questions. Do NOT call any chart tools.
2. Pure conceptual questions ("What is Ashtakvarga?", "Explain Sade Sati"): Call search_knowledge() if helpful, and reply with responseType "conceptual".
3. Chart-specific questions: Act like a thorough Jyotish master.
   - Aim to complete your investigation in 2-4 parallel tool rounds (call multiple independent tools per turn to minimize latency).
   - Start by reading /overview and the relevant houses/planets in parallel.
   - Compare multiple perspectives when insightful: D1 vs D9/D10 (inspect_varga), Lagna vs Moon vs Sun vs Karakamsa (compare_perspectives), dispositor chains (trace_dispositor_chain), Shadbala/SAV/Avasthas (inspect_strengths), Yogas/Karakas (inspect_natal_lore), Dashas (inspect_dashas), Transits (inspect_transits), and timing windows (window_scan).
   - Pull classical context with search_knowledge() when needed.
   - Loop as needed until you have checked both supportive and challenging factors, then synthesize.
4. Strict Grounding (Zero Hallucination):
   - NEVER invent any planet placement, sign, degree, house, Yoga, or YYYY-MM-DD date from memory.
   - Every factual chart claim must come strictly from tool outputs observed in this conversation.
   - Use hedged traditional framing ("In Jyotish tradition...", "tends to suggest..."). Do not predict death, medical diagnoses, accidents, or guaranteed financial/lottery outcomes.

When you are ready to give your final answer (no more tool calls), respond ONLY with valid JSON:
{
  "responseType": "conversational" | "conceptual" | "chart_reading",
  "answer": "2-4 clear sentences grounded in observed tool data.",
  "because": [{"claim": "...", "evidenceIds": ["exact_id_from_tool_output"]}],
  "timing": [{"windowId": "exact_id", "startUtc": "YYYY-MM-DD", "endUtc": "YYYY-MM-DD", "summary": "..."}],
  "uncertainty": "Note any conflicting factors, school variants, or unexamined areas.",
  "reflect": "One thoughtful journaling prompt.",
  "followUps": ["Suggested follow-up 1", "Suggested follow-up 2"]
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
