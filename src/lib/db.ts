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
  // Platform infrastructure — active now.
  FEATURE_FLAGS: "feature_flags",
  WAITLIST: "waitlist",
  AUDIT_LOGS: "audit_logs",
  // Future modules — schemas exist, routes are flag-gated dormant. See
  // src/lib/modules.ts for activation status.
  BUSINESSES: "businesses",
  BUSINESS_CUSTOMERS: "business_customers",
  BUSINESS_SUPPLIERS: "business_suppliers",
  BUSINESS_PRODUCTS: "business_products",
  BUSINESS_ORDERS: "business_orders",
  BUSINESS_INVENTORY: "business_inventory",
  BUSINESS_EXPENSES: "business_expenses",
  BUSINESS_REVENUES: "business_revenues",
  ECONOMIC_SIGNALS: "economic_signals",
  OPPORTUNITIES: "opportunities",
  FINANCIAL_ACCOUNTS: "financial_accounts",
  FINANCIAL_TRANSACTIONS: "financial_transactions",
  MARKETPLACE_LISTINGS: "marketplace_listings",
  CREDIT_PROFILES: "credit_profiles",
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
  // Set once, at the moment the Pro memory cap was introduced, for whoever
  // was already an active/grace Pro subscriber at that point — so tightening
  // the limit for new signups never retroactively blocks someone who already
  // paid under the old unlimited-memory terms. Never set for anyone after
  // that one-time migration; new Pro subscribers get the real cap.
  grandfatheredUnlimitedMemory?: boolean;
  publicProfile?: boolean;
  notifyChatSummaries?: boolean;
  notifyMemoryInsights?: boolean;
  notifyAgentAlerts?: boolean;
  notifyWeeklyDigest?: boolean;
  notifyProductUpdates?: boolean;
  // ISO 3166-1 alpha-2, read from Vercel's x-vercel-ip-country header at
  // signup time and never updated afterward — reflects where the account was
  // created, not current location. Null for accounts created off Vercel
  // (local dev) or where the header was absent.
  country?: string | null;
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
  // Optional so pre-existing agents (created before agent types existed)
  // stay valid — treated as "personal" wherever a type is needed.
  agentType?: string;
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

// ── Platform infrastructure (active) ───────────────────────────────────────

export type ModuleFlagStatus = "enabled" | "disabled" | "beta";

export interface FeatureFlagDoc {
  key: string;
  status: ModuleFlagStatus;
  rolloutPercentage: number;
  minPlan: string | null;
  allowlistUserIds: string[];
  updatedBy: string | null;
}

export interface WaitlistEntryDoc {
  userId: string | null;
  email: string;
  module: string;
  note: string | null;
}

export interface AuditLogDoc {
  actorId: string;
  action: string;
  target: string;
  metadata: string | null;
}

// ── Business AI (future — dormant) ─────────────────────────────────────────

export interface BusinessDoc {
  userId: string;
  name: string;
  industry: string | null;
  description: string | null;
  website: string | null;
  currency: string;
  region: string;
}

export interface BusinessCustomerDoc {
  businessId: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  totalSpentUsd: number;
}

export interface BusinessSupplierDoc {
  businessId: string;
  name: string;
  contact: string | null;
  notes: string | null;
}

export interface BusinessProductDoc {
  businessId: string;
  name: string;
  sku: string | null;
  priceUsd: number;
  costUsd: number | null;
  category: string | null;
}

export interface BusinessOrderDoc {
  businessId: string;
  customerId: string | null;
  itemsJson: string;
  totalUsd: number;
  status: string;
  orderedAt: string;
}

export interface BusinessInventoryDoc {
  businessId: string;
  productId: string;
  quantity: number;
  reorderThreshold: number;
  location: string | null;
}

export interface BusinessExpenseDoc {
  businessId: string;
  category: string;
  amountUsd: number;
  incurredAt: string;
  notes: string | null;
}

export interface BusinessRevenueDoc {
  businessId: string;
  source: string;
  amountUsd: number;
  receivedAt: string;
  notes: string | null;
}

// ── Economic Intelligence + Opportunity Engine (future — dormant) ─────────

export interface EconomicSignalDoc {
  region: string;
  category: string;
  title: string;
  description: string;
  source: string;
  sourceUrl: string | null;
  confidence: number;
  methodology: string;
  observedAt: string;
  createdBy: string;
}

export interface OpportunityDoc {
  userId: string;
  businessId: string | null;
  title: string;
  description: string;
  evidenceJson: string;
  dataSourcesJson: string;
  estimatedSizeUsd: number | null;
  riskFactorsJson: string;
  confidence: number;
  status: string;
}

// ── Financial + Credit Intelligence (future — dormant) ─────────────────────

export interface FinancialAccountDoc {
  userId: string;
  businessId: string | null;
  provider: string;
  accountType: string;
  currency: string;
  externalRef: string | null;
  lastSyncedAt: string | null;
}

export interface FinancialTransactionDoc {
  accountId: string;
  amountUsd: number;
  category: string | null;
  description: string | null;
  occurredAt: string;
  source: string;
}

export interface CreditProfileDoc {
  businessId: string;
  dataPointsJson: string;
  disclaimer: string;
  consentGiven: boolean;
  consentAt: string | null;
  generatedAt: string | null;
}

// ── Marketplace (future — dormant) ──────────────────────────────────────────

export interface MarketplaceListingDoc {
  ownerId: string;
  businessId: string | null;
  type: string;
  title: string;
  description: string;
  region: string;
  status: string;
}

// Appwrite documents include $id, $createdAt, $updatedAt from the platform.
// These utility types represent a full document as returned by the SDK.
export type AppwriteDoc<T> = T & {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
};
