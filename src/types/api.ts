import type { Memory, Conversation, Message, Agent, Wallet, Reputation, ApiKey, MemoryCategory } from "@prisma/client";

export type { MemoryCategory };

export interface MemoryWithScore extends Memory {
  score: number;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface ConversationWithCount extends Conversation {
  _count: { messages: number };
}

export interface AgentWithCounts extends Agent {
  _count: { memories: number; conversations: number };
}

export interface UserStats {
  memoryCount: number;
  conversationCount: number;
  agentCount: number;
  reputation: Reputation | null;
}

export interface ApiKeyPublic {
  id: string;
  name: string;
  keyPrefix: string;
  scope: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  isRevoked: boolean;
  createdAt: Date;
}

export interface ApiKeyCreated extends ApiKeyPublic {
  fullKey: string;
}

export interface WalletPublic extends Wallet {
  isVerified: boolean;
}

export interface SearchResult {
  memory: Memory;
  score: number;
}

export interface ApiError {
  error: string;
  details?: unknown;
}
