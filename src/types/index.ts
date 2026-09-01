export type QueryIntent = 'VERSE_LOOKUP' | 'PASSAGE_EXPLANATION' | 'TOPICAL_SEARCH' | 'PERSON_SEARCH' | 'PLACE_SEARCH' | 'EVENT_SEARCH' | 'THEOLOGICAL_QUESTION' | 'CROSS_REFERENCE' | 'TIMELINE' | 'COMPARISON' | 'ORIGINAL_LANGUAGE' | 'SERMON_REQUEST' | 'BIBLE_STUDY_REQUEST' | 'PRAYER_REQUEST' | 'LIFE_APPLICATION' | 'DECISION_SUPPORT' | 'DEVOTIONAL' | 'GENERAL_BIBLE';

export type ResponseSection = 'SCRIPTURE' | 'CONTEXT' | 'CONNECTIONS' | 'INTERPRETATION' | 'INFERENCE' | 'APPLICATION' | 'UNCERTAINTY' | 'READ_NEXT';

export interface ScriptureCitation { reference: string; text: string; translation: string; verseId: string; validated: boolean; }

export interface AIProviderInterface { name: string; chat(params: AIChatParams): Promise<AIStructuredResponse>; chatStream(params: AIChatParams): AsyncGenerator<AIStreamChunk>; embed(text: string): Promise<number[]>; }
export interface AIChatParams { messages: AIMessage[]; systemPrompt?: string; temperature?: number; maxTokens?: number; }
export interface AIMessage { role: 'user' | 'assistant' | 'system'; content: string; }
export interface AIStructuredResponse { content: string; citations: ScriptureCitation[]; intent: QueryIntent; metadata: { model: string; tokens: { input: number; output: number }; latency: number; }; }
export interface AIStreamChunk { type: 'text' | 'citation' | 'done' | 'error'; content: string; citation?: ScriptureCitation; }

export type EntityType = 'person' | 'place' | 'event' | 'theme' | 'prophecy' | 'covenant' | 'miracle' | 'parable' | 'teaching' | 'book';
export type RelationshipType = 'FATHER_OF' | 'MOTHER_OF' | 'SON_OF' | 'DAUGHTER_OF' | 'BROTHER_OF' | 'SISTER_OF' | 'FRIEND_OF' | 'ENEMY_OF' | 'LIVED_IN' | 'TRAVELED_TO' | 'MENTIONED_IN' | 'PARTICIPATED_IN' | 'RELATED_TO' | 'OCCURS_BEFORE' | 'OCCURS_AFTER' | 'PROPHECY' | 'FULFILLMENT' | 'QUOTATION' | 'ALLUSION';

export type SermonType = 'expository' | 'topical' | 'textual' | 'evangelistic' | 'teaching' | 'devotional' | 'youth' | 'children' | 'leadership' | 'wedding' | 'funeral' | 'bible_study';
export type SermonSectionType = 'introduction' | 'context' | 'point_1' | 'point_2' | 'point_3' | 'illustration' | 'cross_references' | 'application' | 'conclusion' | 'response' | 'prayer' | 'discussion';

export type LifeCategory = 'fear' | 'relationships' | 'family' | 'money' | 'purpose' | 'career' | 'forgiveness' | 'leadership' | 'failure' | 'loneliness' | 'temptation' | 'decision_making' | 'grief' | 'anger' | 'faith' | 'doubt';

export interface LifeApplicationResponse {
  whatScriptureSays: { reference: string; text: string; explanation: string }[];
  whatThisMeans: string;
  biblicalPrinciples: string[];
  practicalApplication: string[];
  reflection: string[];
  prayer?: string;
  nextSteps: string[];
}

export type SearchType = 'exact' | 'semantic' | 'reference' | 'entity' | 'theme';
export interface SearchResult { verseId: string; book: string; chapter: number; verse: number; text: string; translation: string; relevance: number; themes?: string[]; entities?: string[]; relatedPassages?: string[]; }
