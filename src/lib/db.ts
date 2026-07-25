export const DB_ID = process.env.APPWRITE_DATABASE_ID!;

export const COLLECTIONS = {
  USERS: "users",
  MEMORIES: "memories",
  CONVERSATIONS: "conversations",
  MESSAGES: "messages",
  AGENTS: "agents",
  REPUTATIONS: "reputations",
  WALLETS: "wallets",
  SHARED_CONTEXTS: "shared_contexts",
  API_KEYS: "api_keys",
  PAYMENTS: "payments",
} as const;

export type MemoryCategory = "EPISODIC" | "SEMANTIC" | "PREFERENCE" | "PROCEDURAL";
export type AgentStatus = "ACTIVE" | "PAUSED" | "ARCHIVED";
export type ApiKeyScope = "FULL" | "MEMORY_READ" | "MEMORY_WRITE" | "CHAT";
export type BillingCycle = "monthly" | "annual";

export interface UserDoc {
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: string;
  planExpiresAt: string | null;
  onboarded: boolean;
  publicProfile?: boolean;
  notifyChatSummaries?: boolean;
  notifyMemoryInsights?: boolean;
  notifyAgentAlerts?: boolean;
  notifyWeeklyDigest?: boolean;
  notifyProductUpdates?: boolean;
}

export type MemoryVerificationStatus = "none" | "pending" | "verified";

export interface MemoryDoc {
  userId: string;
  content: string;
  category: MemoryCategory;
  tags: string[];
  embedding: number[];
  importance: number;
  accessCount: number;
  lastAccessed: string | null;
  source: string | null;
  agentId: string | null;
  isArchived: boolean;
  verificationStatus?: MemoryVerificationStatus;
  attestationUid?: string | null;
  attestationTxHash?: string | null;
  contentHash?: string | null;
}

export interface ConversationDoc {
  userId: string;
  agentId: string | null;
  title: string;
  summary: string | null;
}

export interface MessageDoc {
  conversationId: string;
  userId: string;
  role: string;
  content: string;
  tokensUsed: number | null;
  memoryIds: string[];
}

export interface AgentDoc {
  userId: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  avatarUrl: string | null;
  status: AgentStatus;
  memoryScope: string;
  modelId: string;
  temperature: number;
  maxTokens: number;
}

export interface ReputationDoc {
  userId: string;
  score: number;
  memoryCount: number;
  shareCount: number;
  agentCount: number;
  chatCount: number;
  level: string;
}

export interface WalletDoc {
  userId: string;
  address: string;
  chainId: number;
  ensName: string | null;
  badgeMinted: boolean;
  badgeTokenId: string | null;
  verifiedAt: string | null;
}

export interface PaymentDoc {
  userId: string;
  txHash: string;
  walletAddress: string;
  chainId: number;
  plan: string;
  billingCycle: BillingCycle;
  amountUsdcBaseUnits: number;
  periodStart: string;
  periodEnd: string;
  blockNumber: number;
  confirmedAt: string;
}

export interface SharedContextDoc {
  ownerId: string;
  receiverId: string | null;
  name: string;
  description: string | null;
  memoryIds: string[];
  isPublic: boolean;
  shareToken: string;
  expiresAt: string | null;
}

export interface ApiKeyDoc {
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  scope: ApiKeyScope;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isRevoked: boolean;
}

// Appwrite documents include $id, $createdAt, $updatedAt from the platform.
// These utility types represent a full document as returned by the SDK.
export type AppwriteDoc<T> = T & {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
};
