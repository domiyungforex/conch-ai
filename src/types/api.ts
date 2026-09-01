import type { MemoryDoc, ConversationDoc, MessageDoc, AgentDoc, WalletDoc, ReputationDoc, ApiKeyDoc, MemoryCategory, AppwriteDoc } from "@/lib/db";

export type { MemoryCategory };

export interface MemoryWithScore extends AppwriteDoc<MemoryDoc> {
  score: number;
}

export interface ConversationWithMessages extends AppwriteDoc<ConversationDoc> {
  messages: AppwriteDoc<MessageDoc>[];
}

export interface ConversationWithCount extends AppwriteDoc<ConversationDoc> {
  _count?: { messages: number };
}

export interface AgentWithCounts extends AppwriteDoc<AgentDoc> {
  _count?: { memories: number; conversations: number };
}

export interface UserStats {
  memoryCount: number;
  conversationCount: number;
  agentCount: number;
  reputation: AppwriteDoc<ReputationDoc> | null;
}

export interface ApiKeyPublic {
  $id: string;
  name: string;
  keyPrefix: string;
  scope: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isRevoked: boolean;
  $createdAt: string;
}

export interface ApiKeyCreated extends AppwriteDoc<ApiKeyDoc> {
  fullKey: string;
}

export interface WalletPublic extends AppwriteDoc<WalletDoc> {
  isVerified: boolean;
}

export interface SearchResult {
  memory: AppwriteDoc<MemoryDoc>;
  score: number;
}

export interface ApiError {
  error: string;
  details?: unknown;
}
