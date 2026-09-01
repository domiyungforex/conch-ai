import type { QueryIntent } from '@/types';

const INTENT_PATTERNS: { intent: QueryIntent; patterns: RegExp[] }[] = [
  { intent: 'VERSE_LOOKUP', patterns: [/\b\d?\s*[A-Z][a-z]+\s+\d+:\d+/i, /\bverse?\b/i] },
  { intent: 'PASSAGE_EXPLANATION', patterns: [/\bexplain\b/i, /\bwhat does .+ mean\b/i, /\bhelp me understand\b/i] },
  { intent: 'TOPICAL_SEARCH', patterns: [/\bwhat does the bible say about\b/i, /\bverses about\b/i, /\bscripture about\b/i] },
  { intent: 'PERSON_SEARCH', patterns: [/\bwho (was|is|were) [A-Z][a-z]+\b/i] },
  { intent: 'THEOLOGICAL_QUESTION', patterns: [/\btheology of\b/i, /\bdo christians believe\b/i] },
  { intent: 'SERMON_REQUEST', patterns: [/\bsermon/i, /\bpreach/i] },
  { intent: 'BIBLE_STUDY_REQUEST', patterns: [/\bbible study\b/i, /\bstudy plan/i, /\bdevotional/i] },
  { intent: 'PRAYER_REQUEST', patterns: [/\bprayer\b/i, /\bhelp me pray\b/i] },
  { intent: 'LIFE_APPLICATION', patterns: [/\bi('m| am) (struggling|facing|dealing with)\b/i, /\bi need help with\b/i] },
  { intent: 'DECISION_SUPPORT', patterns: [/\bshould i\b/i, /\bi can('t| not) decide\b/i] },
  { intent: 'COMPARISON', patterns: [/\bcompare\b/i, /\bdifference between\b/i] },
  { intent: 'TIMELINE', patterns: [/\btimeline\b/i, /\bwhen did\b/i] },
  { intent: 'ORIGINAL_LANGUAGE', patterns: [/\bhebrew\b/i, /\bgreek\b/i, /\boriginal (language|word)\b/i] },
];

export function detectIntent(query: string): { intent: QueryIntent; confidence: number; extractedReferences?: string[] } {
  let bestMatch: { intent: QueryIntent; confidence: number } = { intent: 'GENERAL_BIBLE', confidence: 0 };
  for (const { intent, patterns } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(query)) {
        const confidence = 0.8 + Math.random() * 0.2;
        if (confidence > bestMatch.confidence) bestMatch = { intent, confidence };
        break;
      }
    }
  }
  if (bestMatch.confidence < 0.5) bestMatch = { intent: 'GENERAL_BIBLE', confidence: 0.5 };
  const refPattern = /\b(\d?\s*[A-Z][a-z]+\s+\d+:\d+(?:-\d+)?)\b/g;
  const refs = query.match(refPattern);
  return { ...bestMatch, extractedReferences: refs || [] };
}

export function routeQuery(query: string) {
  const match = detectIntent(query);
  const workflows: Record<QueryIntent, string> = {
    VERSE_LOOKUP: 'verse-lookup', PASSAGE_EXPLANATION: 'passage-explanation', TOPICAL_SEARCH: 'topical-search',
    PERSON_SEARCH: 'entity-search', PLACE_SEARCH: 'entity-search', EVENT_SEARCH: 'entity-search',
    THEOLOGICAL_QUESTION: 'theological-research', CROSS_REFERENCE: 'cross-reference', TIMELINE: 'timeline',
    COMPARISON: 'comparison', ORIGINAL_LANGUAGE: 'original-language', SERMON_REQUEST: 'sermon-builder',
    BIBLE_STUDY_REQUEST: 'study-builder', PRAYER_REQUEST: 'prayer-companion', LIFE_APPLICATION: 'life-application',
    DECISION_SUPPORT: 'decision-support', DEVOTIONAL: 'devotional', GENERAL_BIBLE: 'general-chat',
  };
  return { intent: match.intent, confidence: match.confidence, workflow: workflows[match.intent], params: {} };
}
