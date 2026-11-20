import type { KnowledgeBase } from '@astro/kb';
import type { RouterResult } from './types.js';

const GREETING_RE =
  /^(hi+|hii+|hey+|hello+|namaste|namaskar|hola|yo|sup|good\s+(morning|afternoon|evening|night)|how\s+are\s+you|hi\s+there|hey\s+there|hello\s+there|thanks|thank\s+you(\s+so\s+much)?|thx|ok|okay|cool|great|awesome|got\s+it|bye|goodbye|what\s+can\s+you\s+do|who\s+are\s+you|help)[!?. ,\s]*$/i;
const DISTRESS_RE = /\b(suicide|kill myself|end my life|self[- ]?harm|don'?t want to live|want to die)\b/i;
const DECLINED_RE =
  /\b(when will i die|time of death|lifespan|lottery|gambl|jackpot|stock tip|which stock|crypto trade|accident|miscarriage|boy or girl|gender of baby)\b/i;
const OTHER_PERSON_RE = /\b(my (ex|boss|crush|friend|neighbor|colleague)'?s chart|without their birth)\b/i;
const HEALTH_RE = /\b(diagnos|cancer|tumor|which disease|medical advice|cure my|will i get sick)\b/i;
const TIMING_RE = /\b(when|which month|which year|timing|next year|this year|this month)\b/i;
const DECISION_RE = /\b(should i|decide|choose between|take this job|quit my job)\b/i;

export function routeQuestion(
  question: string,
  kb: KnowledgeBase,
  referenceDateIso: string = new Date().toISOString().slice(0, 10),
): RouterResult {
  const q = question.trim();
  const refDate = new Date(referenceDateIso);
  const yearAhead = new Date(refDate.getTime() + 365 * 86400 * 1000).toISOString().slice(0, 10);
  const monthAhead = new Date(refDate.getTime() + 30 * 86400 * 1000).toISOString().slice(0, 10);

  const isMonth = /\bthis month\b/i.test(q);
  const timeframe = {
    from: refDate.toISOString().slice(0, 10),
    to: isMonth ? monthAhead : yearAhead,
  };

  if (GREETING_RE.test(q)) {
    return {
      topicId: 'self_personality',
      timeframe,
      riskClass: 'greeting',
    };
  }

  if (DISTRESS_RE.test(q)) {
    return {
      topicId: 'self_personality',
      timeframe,
      riskClass: 'distress',
      declineMessage:
        'It sounds like you may be going through a very difficult moment. Astrology cannot help with crisis support—please reach out to someone you trust or a local crisis helpline right away.',
    };
  }

  if (DECLINED_RE.test(q)) {
    return {
      topicId: 'year_ahead',
      timeframe,
      riskClass: 'declined',
      declineMessage:
        'In keeping with responsible Jyotish practice, I do not predict death, accidents, pregnancy outcomes, lotteries, or speculative trading outcomes. I can explore general life themes or timing windows instead.',
    };
  }

  if (OTHER_PERSON_RE.test(q)) {
    return {
      topicId: 'relationships',
      timeframe,
      riskClass: 'other_person',
      declineMessage:
        'I can only read charts that have been added to your workspace. To explore another person’s chart, please add their birth profile first.',
    };
  }

  const matched = kb.matchTopic(q);

  if (HEALTH_RE.test(q)) {
    return {
      topicId: 'health_routine',
      timeframe,
      riskClass: 'health_non_diagnostic',
    };
  }

  if (DECISION_RE.test(q)) {
    return { topicId: matched.id, timeframe, riskClass: 'decision' };
  }

  if (TIMING_RE.test(q)) {
    return { topicId: matched.id, timeframe, riskClass: 'timing' };
  }

  return { topicId: matched.id, timeframe, riskClass: 'reflective' };
}
