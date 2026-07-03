import {
  emptyOrganization,
  hashContent,
  dedupe,
  titleCase,
  type DocumentOrganization,
  type Intent,
  type Priority,
} from './DocumentOrganization';

/**
 * Deterministic, offline organization. This is the floor the app always has —
 * it runs with AI off, offline, or as a fallback when a model call fails, and it
 * doubles as the AI's minimum expectation. Pure and fully unit-tested.
 */
const ACTION_VERBS = new Set([
  'finish', 'send', 'pay', 'call', 'buy', 'order', 'write', 'email', 'book', 'schedule',
  'review', 'fix', 'build', 'plan', 'prepare', 'submit', 'renew', 'update', 'remind',
  'make', 'get', 'clean', 'organize', 'organise', 'cancel', 'confirm', 'purchase',
]);

const WEEKDAY = 'monday|tuesday|wednesday|thursday|friday|saturday|sunday';

const STOP_NAMES = new Set([
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december',
  'the', 'a', 'an', 'me', 'us', 'them', 'it', 'this', 'that', 'today', 'tomorrow',
  'tonight', 'then', 'some', 'more', 'all', 'my', 'your', 'our', 'his', 'her',
]);

export function analyzeHeuristically(title: string, text: string, now: number): DocumentOrganization {
  const full = `${title}\n${text}`.trim();
  const lower = full.toLowerCase();
  const has = (re: RegExp): boolean => re.test(lower);

  const categories: string[] = [];
  const tags: string[] = [];
  let intent: Intent = 'other';
  let priority: Priority = null;

  if (has(/\b(buy|order|purchase|groceries|grocery|shopping|restock|cart)\b/)) {
    categories.push('Shopping');
    tags.push('shopping');
  }
  if (
    has(/\b(ksh|tsh|ugx|usd|invoice|vat|taxes?|budget|salary|refund|receipt|expense|loan|subscription)\b/) ||
    /[$£€]/.test(full) ||
    has(/\bpay(?:ing|ment)?\b/)
  ) {
    categories.push('Finance');
    tags.push('finance');
  }
  if (has(/\b(gym|workout|exercise|running|run|calories|steps|meditat\w*|sleep|yoga)\b/)) {
    categories.push('Health');
    tags.push('health');
  }
  if (has(/\b(flight|hotel|trip|travel|passport|itinerary|airbnb|booking|visa)\b/)) {
    categories.push('Travel');
    tags.push('travel');
  }
  const meeting = has(/\b(meeting|meet|call|discuss|sync|catch up|interview|standup)\b/);
  if (meeting) categories.push('Meetings');
  if (has(/\b(today i|i feel|i felt|dear diary|grateful|gratitude|reflection|journal)\b/)) {
    categories.push('Journal');
    intent = 'journal';
  }
  if (has(/\b(idea|ideas|concept|what if|brainstorm)\b/)) {
    categories.push('Ideas');
    if (intent === 'other') intent = 'idea';
  }
  if (has(/\b(research|study|investigate|read about|compare|analysis)\b/)) {
    categories.push('Research');
    if (intent === 'other') intent = 'research';
  }

  const people = extractPeople(full);

  // An action verb (leading or a purchase/pay verb anywhere) makes it a task,
  // overriding the softer category-implied intents.
  const firstWord = (title.trim().split(/\s+/)[0] ?? '').toLowerCase().replace(/[^a-z]/g, '');
  const leadingAction = ACTION_VERBS.has(firstWord);
  const purchaseOrPay = has(/\b(buy|order|purchase|pay)\b/);
  if (leadingAction || purchaseOrPay) intent = 'task';
  else if (intent === 'other' && meeting) intent = 'meeting';

  const dueHint = extractDueHint(full);
  if (dueHint) priority = 'high';
  if (has(/\b(urgent|asap|important|high priority|deadline)\b/)) priority = 'high';

  const finalCategories = dedupe(categories.map(titleCase));
  const finalPeople = dedupe(people);
  const confidence: Record<string, number> = {};
  for (const c of finalCategories) confidence[c] = 0.55;
  for (const p of finalPeople) confidence[p] = 0.5;

  return {
    ...emptyOrganization(),
    categories: finalCategories,
    people: finalPeople,
    tags: dedupe(tags),
    intent,
    priority,
    dueHint,
    confidence,
    source: 'heuristic',
    analyzedAt: now,
    contentHash: hashContent(title, text),
  };
}

/** Capitalized names following a relational cue (with/meeting/call/…). */
function extractPeople(text: string): string[] {
  const cue = /\b(?:with|meet(?:ing)?|call(?:ing)?|met|see(?:ing)?|email(?:ing)?)\s+([A-Z][a-z]{1,})\b/g;
  const found: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = cue.exec(text)) !== null) {
    const name = m[1];
    if (name && !STOP_NAMES.has(name.toLowerCase())) found.push(name);
  }
  return found;
}

/** A verbatim time phrase if the note hints at a deadline, else null. */
function extractDueHint(text: string): string | null {
  const before = /\b((?:before|by|due(?:\s+on)?)\s+[^.,;\n]{2,40})/i.exec(text);
  if (before?.[1]) return normalize(before[1]);
  const relative = new RegExp(`\\b((?:this|next|on)\\s+(?:${WEEKDAY}))`, 'i').exec(text);
  if (relative?.[1]) return normalize(relative[1]);
  const named = /\b(today|tomorrow|tonight|asap)\b/i.exec(text);
  if (named?.[1]) return named[1].toLowerCase();
  return null;
}

function normalize(phrase: string): string {
  return phrase.trim().replace(/\s+/g, ' ');
}
