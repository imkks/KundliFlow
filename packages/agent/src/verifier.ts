import { PLANET_IDS, SIGN_IDS, type ChartWorkspace } from '@astro/facts';
import type { TimingWindow } from '@astro/tools';
import { ComposedAnswerSchema, type ComposedAnswer } from './types.js';

export interface VerifyResult {
  valid: boolean;
  errors: string[];
}

// Keep strict evidence grounding while allowing candid, high-precision analytical phrasing
// (block only abusive fatalistic language).
const BANNED_ANSWER_PHRASES = [
  'destined to die',
  'cursed',
  'doomed',
  'you will die on',
];

export function verifyComposedAnswer(
  answer: ComposedAnswer,
  observed: { ids: Set<string>; corpus: string },
  scannedWindows: TimingWindow[],
  ws: ChartWorkspace,
): VerifyResult {
  const errors: string[] = [];

  const parsed = ComposedAnswerSchema.safeParse(answer);
  if (!parsed.success) {
    errors.push(`Schema validation failed: ${parsed.error.issues.map((i) => i.message).join('; ')}`);
    return { valid: false, errors };
  }

  const lowerAnswer = answer.answer.toLowerCase();
  for (const banned of BANNED_ANSWER_PHRASES) {
    if (lowerAnswer.includes(banned)) {
      errors.push(`Answer contains banned certainty/fatalistic phrase "${banned}".`);
    }
  }

  if (answer.responseType === 'conversational' || answer.responseType === 'conceptual') {
    return { valid: errors.length === 0, errors };
  }

  // Strict grounding checks for chart_reading
  if (answer.because.length === 0) {
    errors.push('chart_reading must include at least one grounded claim in "because".');
  }

  const windowCorpus = scannedWindows
    .map((w) => `${w.id} ${w.lord} ${w.startUtc.slice(0, 10)} ${w.endUtc.slice(0, 10)} ${w.reason}`)
    .join(' ')
    .toLowerCase();
  const fullCorpus = `${observed.corpus} ${windowCorpus}`;

  // 1. Check evidence IDs
  for (const b of answer.because) {
    for (const eid of b.evidenceIds) {
      if (observed.ids.has(eid)) continue;
      const inFacts = Boolean(ws.getFact(eid));
      const inFindings = Boolean(
        ws.db.prepare('SELECT id FROM finding WHERE id = ? OR rule_id = ?').get(eid, eid),
      );
      const inPeriods = Boolean(ws.db.prepare('SELECT id FROM period WHERE id = ?').get(eid));
      if (!inFacts && !inFindings && !inPeriods) {
        errors.push(`Evidence ID "${eid}" was not observed in tool outputs and does not exist in chart.db.`);
      }
    }
  }

  // 2. Check timing windows come strictly from window_scan
  for (const tw of answer.timing) {
    const match = scannedWindows.find((w) => w.id === tw.windowId);
    if (!match) {
      errors.push(`Timing window "${tw.windowId}" did not come from window_scan.`);
    } else if (
      tw.startUtc.slice(0, 10) !== match.startUtc.slice(0, 10) ||
      tw.endUtc.slice(0, 10) !== match.endUtc.slice(0, 10)
    ) {
      errors.push(`Timing dates for "${tw.windowId}" were altered from window_scan output.`);
    }
  }

  // 3. Check any explicit YYYY-MM-DD dates in answer text
  const datesInText = answer.answer.match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? [];
  for (const d of datesInText) {
    if (!fullCorpus.includes(d)) {
      errors.push(`Date "${d}" in answer does not appear in observed tool outputs or window_scan.`);
    }
  }

  // 4. Check no hallucinated planets or signs in answer
  for (const planet of PLANET_IDS) {
    const re = new RegExp(`\\b${planet}\\b`, 'i');
    if (re.test(lowerAnswer) && !fullCorpus.includes(planet)) {
      errors.push(`Planet "${planet}" mentioned in answer was not observed in tool outputs.`);
    }
  }
  for (const sign of SIGN_IDS) {
    const re = new RegExp(`\\b${sign}\\b`, 'i');
    if (re.test(lowerAnswer) && !fullCorpus.includes(sign)) {
      errors.push(`Sign "${sign}" mentioned in answer was not observed in tool outputs.`);
    }
  }

  return { valid: errors.length === 0, errors };
}
