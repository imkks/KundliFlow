import { z } from 'zod';

export type ResponseType = 'conversational' | 'conceptual' | 'chart_reading';

export const ComposedAnswerSchema = z.object({
  responseType: z.enum(['conversational', 'conceptual', 'chart_reading']).default('chart_reading'),
  answer: z.string().min(2),
  because: z
    .array(
      z.object({
        claim: z.string().min(3),
        evidenceIds: z.array(z.string()),
      }),
    )
    .default([]),
  timing: z
    .array(
      z.object({
        windowId: z.string(),
        startUtc: z.string(),
        endUtc: z.string(),
        summary: z.string(),
      }),
    )
    .default([]),
  uncertainty: z.string().default(''),
  reflect: z.string().default(''),
  followUps: z.array(z.string()).max(5).default([]),
});

export type ComposedAnswer = z.infer<typeof ComposedAnswerSchema>;

export interface NativeToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface AgentMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: NativeToolCall[];
  toolCallId?: string;
  toolName?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface AgentTurnResult {
  text?: string;
  toolCalls?: NativeToolCall[];
}

export interface LlmClient {
  runAgentTurn(context: {
    systemPrompt: string;
    messages: AgentMessage[];
    tools: ToolDefinition[];
  }): Promise<AgentTurnResult>;
}

export interface AgentTraceEvent {
  type: 'trace' | 'tool_call' | 'answer' | 'fallback';
  message: string;
  step?: number;
  data?: unknown;
}

export interface AskResult {
  mode: 'level3_verified' | 'level2_fallback' | 'conversational' | 'conceptual';
  response: ComposedAnswer;
  trace: string[];
  observedEvidenceIds: string[];
  verifierErrors?: string[];
}
