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
  // ── Conch 2.0 Context Engine ────────────────────────────────────────────
  PROJECTS: "projects",
  CONTEXT_OBJECTS: "context_objects",
  DECISIONS: "decisions",
  CONSTRAINTS: "constraints",
  AGENT_STATE: "agent_state",
  AGENT_HANDOFFS: "agent_handoffs",
  CONTEXT_PERMISSIONS: "context_permissions",
  CONTEXT_PROVENANCE: "context_provenance",
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
  // Creator Memory workspace — musicians, artists, YouTubers, writers, etc.
  CREATORS: "creators",
  CREATOR_SONGS: "creator_songs",
  CREATOR_IDEAS: "creator_ideas",
  CREATOR_CAMPAIGNS: "creator_campaigns",
  CREATOR_COLLABORATORS: "creator_collaborators",
  CREATOR_CONTENT: "creator_content",
  ECONOMIC_SIGNALS: "economic_signals",
  OPPORTUNITIES: "opportunities",
  FINANCIAL_ACCOUNTS: "financial_accounts",
  FINANCIAL_TRANSACTIONS: "financial_transactions",
  MARKETPLACE_LISTINGS: "marketplace_listings",
  CREDIT_PROFILES: "credit_profiles",
  // Push Notifications + Reminders
  PUSH_SUBSCRIPTIONS: "push_subscriptions",
  REMINDERS: "reminders",
  // ── Creator Challenge ──────────────────────────────────────────────
  CHALLENGE_WAITLIST: "challenge_waitlist",
  CHALLENGE: "challenge",
  CHALLENGE_PARTICIPANTS: "challenge_participants",
  CHALLENGE_PROJECTS: "challenge_projects",
  CHALLENGE_SUBMISSIONS: "challenge_submissions",
  CHALLENGE_WINNERS: "challenge_winners",
  CHALLENGE_EVENTS: "challenge_events",
} as const;

export type MemoryCategory = "EPISODIC" | "SEMANTIC" | "PREFERENCE" | "PROCEDURAL";
export type MemoryLifecycle = "temporary" | "active" | "verified" | "stale" | "superseded" | "archived" | "deleted";
export type AgentStatus = "ACTIVE" | "PAUSED" | "ARCHIVED";
export type ApiKeyScope =
  | "FULL"
  | "MEMORY_READ"
  | "MEMORY_WRITE"
  | "CHAT"
  | "CONTEXT_READ"
  | "CONTEXT_WRITE"
  | "AGENTS_READ"
  | "AGENTS_WRITE"
  | "PROJECTS_READ"
  | "PROJECTS_WRITE"
  | "HANDOFF_READ"
  | "HANDOFF_WRITE";
export type BillingCycle = "monthly" | "annual";

// ── Payment States ────────────────────────────────────────────────────────
// Explicit states for financial transaction tracking.
export type PaymentState =
  | "INITIATED"     // User started the payment flow
  | "PENDING"       // Transaction submitted to wallet, waiting for confirmation
  | "CONFIRMING"    // Transaction mined, backend verifying
  | "CONFIRMED"     // Backend verified, subscription activated
  | "FAILED"        // Transaction failed or reverted
  | "EXPIRED"       // Payment window expired without completion
  | "REFUNDED"      // Payment was refunded
  | "REJECTED";     // Backend rejected the payment (wrong amount, etc.)

// ── Subscription Payment States ───────────────────────────────────────────
export type SubscriptionPaymentStatus =
  | "PAYMENT_REQUIRED"  // No active subscription, payment needed
  | "PAYMENT_PENDING"   // Payment in progress
  | "ACTIVE"            // Subscription is active
  | "PENDING"           // Subscription pending (e.g. awaiting first block)
  | "EXPIRED"           // Subscription expired
  | "CANCELLED"         // User cancelled
  | "PAYMENT_FAILED";   // Last payment attempt failed

// ── Conch 2.0: Context Engine Types ───────────────────────────────────────
export type ContextObjectType = "memory" | "intent" | "goal" | "decision" | "constraint" | "assumption" | "instruction" | "preference" | "task_state" | "project_state" | "knowledge";
export type ContextLifecycle = "draft" | "active" | "verified" | "stale" | "superseded" | "archived" | "deleted";
export type ProvenanceSource = "user" | "conversation" | "document" | "agent" | "external_api" | "database" | "developer" | "system" | "verified_source";
export type PermissionLevel = "PRIVATE" | "USER_ONLY" | "PROJECT" | "TEAM" | "AGENT" | "APPLICATION" | "PUBLIC";
export type AgentHandoffStatus = "pending" | "accepted" | "rejected" | "completed";
export type ProjectStatus = "active" | "paused" | "completed" | "archived";

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
  // ── Conch 2.0: Context Engine settings ───────────────────────────────
  contextDefaultImportance?: number;
  contextDefaultConfidence?: number;
  contextRetentionDays?: number;
  contextAutoArchive?: boolean;
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
  namespace?: string;
  relatedMemoryIds?: string[];
  relatedSnippets?: { $id: string; content: string }[];
  verificationStatus?: MemoryVerificationStatus;
  attestationUid?: string | null;
  attestationTxHash?: string | null;
  contentHash?: string | null;
  // ── Conch 2.0 additions ──────────────────────────────────────────────
  lifecycle?: MemoryLifecycle;
  projectId?: string | null;
  supersededBy?: string | null;
  supersededFrom?: string | null;
  confidence?: number;
  version?: number;
  provenanceSource?: ProvenanceSource | null;
  provenanceDetail?: string | null;
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
  agentType?: string;
  // ── Conch 2.0 additions ──────────────────────────────────────────────
  projectId?: string | null;
  capabilities?: string[];
  permissionLevel?: PermissionLevel;
  trustLevel?: number;
  contextAccess?: string[];
  lastActiveAt?: string | null;
  currentTask?: string | null;
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
  // ── Enhanced wallet linking ────────────────────────────────────────────
  isPrimary: boolean;           // Whether this is the primary wallet
  lastConnectedAt: string | null; // Last time wallet was connected
  disconnectedAt: string | null;  // When wallet was disconnected
  walletType: string | null;    // e.g. "metamask", "coinbase", "walletconnect"
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
  // ── Enhanced payment tracking ──────────────────────────────────────────
  paymentState: PaymentState;
  paymentId: string;           // Unique idempotency key (uuid)
  tokenAddress: string | null; // Token contract address used for payment
  tokenSymbol: string | null;  // e.g. "USDC"
  recipientAddress: string | null; // Treasury address payment was sent to
  initiatedAt: string | null;  // When the user started the flow
  failedAt: string | null;     // When the payment failed
  failureReason: string | null; // Why it failed
  networkConfirmations: number | null; // Block confirmations received
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
  // Industry template id (see src/lib/businessTemplates.ts) + the suggested
  // record categories that came with it. Optional — pre-template businesses
  // simply have none set.
  template?: string | null;
  categories?: string[];
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

// ── Creator Memory (active) ────────────────────────────────────────────────

export type CreatorStage =
  | "musician" | "artist" | "youtuber" | "tiktok" | "influencer"
  | "writer" | "producer" | "photographer" | "agency";

export interface CreatorDoc {
  userId: string;
  name: string;
  stage: CreatorStage;
  genre: string | null;
  brandIdentity: string | null;
  bio: string | null;
}

export interface CreatorSongDoc {
  creatorId: string;
  title: string;
  lyrics: string | null;
  status: string;
  releaseDate: string | null;
  producers: string[];
  notes: string | null;
}

export interface CreatorIdeaDoc {
  creatorId: string;
  title: string;
  description: string;
  platform: string | null;
  status: string;
  notes: string | null;
}

export interface CreatorCampaignDoc {
  creatorId: string;
  name: string;
  goal: string | null;
  platform: string | null;
  budgetUsd: number;
  status: string;
  notes: string | null;
}

export interface CreatorCollaboratorDoc {
  creatorId: string;
  name: string;
  role: string | null;
  contact: string | null;
  notes: string | null;
}

export interface CreatorContentDoc {
  creatorId: string;
  title: string;
  platform: string | null;
  url: string | null;
  publishedAt: string | null;
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

// ── Conch 2.0: Context Engine Documents ───────────────────────────────────

export interface ProjectDoc {
  userId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  tags: string[];
  agentIds: string[];
  memoryIds: string[];
}

export interface ContextObjectDoc {
  userId: string;
  projectId: string | null;
  type: ContextObjectType;
  content: string;
  lifecycle: ContextLifecycle;
  importance: number;
  confidence: number;
  source: ProvenanceSource;
  sourceDetail: string | null;
  agentId: string | null;
  tags: string[];
  relatedIds: string[];
  supersededBy: string | null;
  version: number;
  embedding: number[];
}

export interface DecisionDoc {
  userId: string;
  projectId: string | null;
  what: string;
  why: string;
  who: string;
  alternatives: string;
  constraints: string;
  assumptions: string;
  fallbackCondition: string | null;
  status: "active" | "superseded" | "archived";
  supersededBy: string | null;
  agentId: string | null;
  confidence: number;
  tags: string[];
}

export interface ConstraintDoc {
  userId: string;
  projectId: string | null;
  content: string;
  category: string;
  severity: "hard" | "soft";
  source: ProvenanceSource;
  sourceDetail: string | null;
  status: "active" | "relaxed" | "removed";
  agentId: string | null;
  tags: string[];
}

export interface AgentStateDoc {
  agentId: string;
  userId: string;
  projectId: string | null;
  currentState: string;
  currentTask: string | null;
  lastActiveAt: string;
  contextVersion: number;
  memorySnapshot: string[];
}

export interface AgentHandoffDoc {
  fromAgentId: string;
  toAgentId: string;
  userId: string;
  projectId: string | null;
  objective: string;
  workCompleted: string;
  findings: string;
  decisions: string;
  reasoning: string;
  constraints: string;
  unresolvedIssues: string;
  assumptions: string;
  requiredAction: string;
  relevantMemoryIds: string[];
  sources: string;
  confidence: number;
  status: AgentHandoffStatus;
  contextVersion: number;
}

export interface ContextPermissionDoc {
  userId: string;
  contextId: string;
  contextType: string;
  granteeType: "agent" | "user" | "application";
  granteeId: string;
  level: PermissionLevel;
  expiresAt: string | null;
}

export interface ContextProvenanceDoc {
  contextId: string;
  contextType: string;
  source: ProvenanceSource;
  sourceDetail: string | null;
  agentId: string | null;
  verifiedAt: string | null;
  confidence: number;
}

// ── Push Notifications + Reminders ───────────────────────────────────────────

export type ReminderStatus = "pending" | "sent" | "cancelled";
export type ReminderRecurrence = "none" | "daily" | "weekly" | "monthly";

export interface PushSubscriptionDoc {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
}

export interface ReminderDoc {
  userId: string;
  title: string;
  message: string;
  scheduledAt: string;
  status: ReminderStatus;
  source: string | null;
  recurrence: ReminderRecurrence;
  recurrenceEndDate: string | null;
}

// ── Creator Challenge Documents ────────────────────────────────────────

export type ChallengePhase = "upcoming" | "open" | "building" | "submission" | "judging" | "completed";
export type SubmissionStatus = "draft" | "submitted" | "reviewing" | "approved" | "rejected" | "locked";

export interface ChallengeWaitlistDoc {
  fullName: string;
  email: string;
  twitterHandle: string | null;
  discordUsername: string | null;
  role: string;
  buildIdea: string | null;
  country: string | null;
  referralCode: string | null;
}

export interface ChallengeDoc {
  title: string;
  description: string | null;
  phase: ChallengePhase;
  startDate: string | null;
  endDate: string | null;
  submissionDeadline: string | null;
  judgingStart: string | null;
  winnerAnnouncementDate: string | null;
  totalPrizeFund: number;
  firstPrize: number;
  secondPrize: number;
  thirdPrize: number;
}

export interface ChallengeParticipantDoc {
  challengeId: string;
  clerkUserId: string | null;
  fullName: string;
  email: string;
  twitterHandle: string | null;
  discordUsername: string | null;
  role: string;
  country: string | null;
  bio: string | null;
  avatarUrl: string | null;
  referralCode: string | null;
}

export interface ChallengeProjectDoc {
  challengeId: string;
  participantId: string;
  name: string;
  slug: string;
  oneLiner: string | null;
  description: string | null;
  problemSolved: string | null;
  conchUsage: string | null;
  memoryImplementation: string | null;
  agentImplementation: string | null;
  demoUrl: string | null;
  videoUrl: string | null;
  githubUrl: string | null;
  coverImageUrl: string | null;
  status: string;
  featured: boolean;
  teamMembers: string | null;
  conchFeaturesUsed: string | null;
}

export interface ChallengeSubmissionDoc {
  projectId: string;
  status: SubmissionStatus;
  submittedAt: string | null;
}

export interface ChallengeWinnerDoc {
  challengeId: string;
  projectId: string;
  participantId: string;
  placement: number;
  prizeAmount: number;
  publishedAt: string | null;
}

export interface ChallengeEventDoc {
  type: string;
  actorId: string | null;
  actorEmail: string | null;
  data: string | null;
}

// Appwrite documents include $id, $createdAt, $updatedAt from the platform.
// These utility types represent a full document as returned by the SDK.
export type AppwriteDoc<T> = T & {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
};
