export type ToolItem = {
  id: string;
  kind: string;
  text: string; // capped near 40 words
  polarity?: string;
  strength?: number;
  evidence?: string[];
  tokens: number;
};

export type ToolResult = {
  items: ToolItem[];
  more?: { cursor: string; remaining: number };
  budget: { stepsLeft: number; tokensLeft: number };
};

export interface LedgerEntry {
  id: string;
  claim: string;
  evidenceIds: string[];
  confidence: number;
}

export interface TimingWindow {
  id: string;
  startUtc: string;
  endUtc: string;
  lord: string;
  level: number;
  score: number;
  activatedHouses: number[];
  reason: string;
}

export interface ToolServerOptions {
  maxSteps?: number; // 10 normal, 16 deep
  maxTokens?: number; // 6000 default
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function capWords(text: string, maxWords: number = 42): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(' ')}…`;
}
