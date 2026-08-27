import { z } from "zod";
import { PAID_PLAN_IDS } from "./plans";
import { AGENT_TYPES } from "./agentTypes";

const MAX_IMAGE_BASE64_CHARS = 5_000_000; // ~3.6MB raw, under Anthropic's 5MB/image limit

export const ChatImageSchema = z.object({
  mediaType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]),
  data: z.string().min(1).max(MAX_IMAGE_BASE64_CHARS),
});

export const ChatRequestSchema = z.object({
  conversationId: z.string().nullable().optional(),
  agentId: z.string().nullable().optional(),
  message: z.string().min(1).max(10000),
  images: z.array(ChatImageSchema).max(3).optional(),
});

export const MemoryCreateSchema = z.object({
  content: z.string().min(1).max(5000),
  category: z.enum(["EPISODIC", "SEMANTIC", "PREFERENCE", "PROCEDURAL"]).default("SEMANTIC"),
  tags: z.array(z.string().max(50)).max(10).default([]),
  importance: z.number().min(0).max(1).default(0.5),
  source: z.string().optional(),
  // Project/tenant isolation for external API callers: memories land in this
  // namespace and list/search can be scoped to it. Free-form, so each
  // integration can use its own scheme ("app", "client_x", "project/2026").
  namespace: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z0-9._\-]+$/, "Namespace may only contain letters, numbers, dots, underscores, and hyphens")
    .default("default"),
  // Relationship layer — ids of memories this one links to (same user only).
  // Omitted at creation: auto-linked to the most similar existing memory.
  relatedMemoryIds: z.array(z.string().max(36)).max(20).optional(),
});

export const UserSettingsUpdateSchema = z.object({
  publicProfile: z.boolean().optional(),
  notifyChatSummaries: z.boolean().optional(),
  notifyMemoryInsights: z.boolean().optional(),
  notifyAgentAlerts: z.boolean().optional(),
  notifyWeeklyDigest: z.boolean().optional(),
  notifyProductUpdates: z.boolean().optional(),
  // Conch 2.0: Context Engine settings
  contextDefaultImportance: z.number().min(0).max(1).optional(),
  contextDefaultConfidence: z.number().min(0).max(1).optional(),
  contextRetentionDays: z.number().min(0).max(3650).optional(),
  contextAutoArchive: z.boolean().optional(),
});

export const MemoryVerifyConfirmSchema = z.object({
  attestationUid: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
});

export const SubscriptionConfirmSchema = z.object({
  txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  billingCycle: z.enum(["monthly", "annual"]),
  plan: z.enum(PAID_PLAN_IDS),
});

// ── Conch 2.0: Context Engine Validators ───────────────────────────────────

export const ContextCreateSchema = z.object({
  type: z.enum(["memory", "intent", "goal", "decision", "constraint", "assumption", "instruction", "preference", "task_state", "project_state", "knowledge"]),
  content: z.string().min(1).max(10000),
  projectId: z.string().max(36).optional(),
  agentId: z.string().max(36).optional(),
  importance: z.number().min(0).max(1).default(0.5),
  confidence: z.number().min(0).max(1).default(0.5),
  source: z.enum(["user", "conversation", "document", "agent", "external_api", "database", "developer", "system", "verified_source"]).default("user"),
  sourceDetail: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  relatedIds: z.array(z.string().max(36)).max(20).default([]),
  lifecycle: z.enum(["draft", "active", "verified", "stale", "superseded", "archived", "deleted"]).default("active"),
});

export const ContextUpdateSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  importance: z.number().min(0).max(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
  lifecycle: z.enum(["draft", "active", "verified", "stale", "superseded", "archived", "deleted"]).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  relatedIds: z.array(z.string().max(36)).max(20).optional(),
});

export const DecisionCreateSchema = z.object({
  projectId: z.string().max(36).optional(),
  what: z.string().min(1).max(2000),
  why: z.string().min(1).max(2000),
  who: z.string().max(200).default("user"),
  alternatives: z.string().max(2000).default(""),
  constraints: z.string().max(2000).default(""),
  assumptions: z.string().max(2000).default(""),
  fallbackCondition: z.string().max(1000).optional(),
  agentId: z.string().max(36).optional(),
  confidence: z.number().min(0).max(1).default(0.5),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

export const ConstraintCreateSchema = z.object({
  projectId: z.string().max(36).optional(),
  content: z.string().min(1).max(2000),
  category: z.string().min(1).max(100),
  severity: z.enum(["hard", "soft"]).default("hard"),
  source: z.enum(["user", "conversation", "document", "agent", "external_api", "database", "developer", "system", "verified_source"]).default("user"),
  sourceDetail: z.string().max(500).optional(),
  agentId: z.string().max(36).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

export const ProjectCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

export const HandoffCreateSchema = z.object({
  fromAgentId: z.string().min(1).max(36),
  toAgentId: z.string().min(1).max(36),
  projectId: z.string().max(36).optional(),
  objective: z.string().min(1).max(2000),
  workCompleted: z.string().min(1).max(5000),
  findings: z.string().max(5000).default(""),
  decisions: z.string().max(5000).default(""),
  reasoning: z.string().max(5000).default(""),
  constraints: z.string().max(5000).default(""),
  unresolvedIssues: z.string().max(5000).default(""),
  assumptions: z.string().max(5000).default(""),
  requiredAction: z.string().min(1).max(2000),
  relevantMemoryIds: z.array(z.string().max(36)).max(50).default([]),
  sources: z.string().max(2000).default(""),
  confidence: z.number().min(0).max(1).default(0.5),
});

export const MemoryUpdateSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  category: z.enum(["EPISODIC", "SEMANTIC", "PREFERENCE", "PROCEDURAL"]).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  importance: z.number().min(0).max(1).optional(),
  isArchived: z.boolean().optional(),
  namespace: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z0-9._\-]+$/, "Namespace may only contain letters, numbers, dots, underscores, and hyphens")
    .optional(),
  relatedMemoryIds: z.array(z.string().max(36)).max(20).optional(),
});

export const AgentCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  systemPrompt: z.string().min(1).max(4000),
  modelId: z.string().max(100).optional(),
  memoryScope: z.enum(["user", "agent", "global"]).default("user"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(4000).default(2000),
  agentType: z.enum(AGENT_TYPES).default("personal"),
});

export const AgentUpdateSchema = AgentCreateSchema.partial().extend({
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
});

export const ConversationCreateSchema = z.object({
  title: z.string().max(200).optional(),
  agentId: z.string().optional(),
});

export const WalletLinkSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  signature: z.string(),
  message: z.string(),
});

export const ApiKeyCreateSchema = z.object({
  name: z.string().min(1).max(100),
  scope: z.enum(["FULL", "MEMORY_READ", "MEMORY_WRITE", "CHAT"]).default("FULL"),
  expiresAt: z.string().datetime().optional(),
});

export const SearchSchema = z.object({
  query: z.string().min(1).max(500),
  topK: z.number().min(1).max(20).default(10),
  category: z.enum(["EPISODIC", "SEMANTIC", "PREFERENCE", "PROCEDURAL"]).optional(),
  minScore: z.number().min(0).max(1).default(0.3),
  // Optional namespace scoping — when present, only memories in that
  // namespace are searched; when absent, the caller's whole memory is searched
  // (backward compatible with pre-namespace behavior).
  namespace: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z0-9._\-]+$/, "Namespace may only contain letters, numbers, dots, underscores, and hyphens")
    .optional(),
});

export const CodeRunSchema = z.object({
  code: z.string().min(1).max(20000),
});

// ── Platform infrastructure ──────────────────────────────────────────────

export const WaitlistJoinSchema = z.object({
  email: z.string().email().max(320),
  module: z.string().min(1).max(64),
  note: z.string().max(500).optional(),
});

export const AdminModuleUpdateSchema = z.object({
  status: z.enum(["enabled", "disabled", "beta"]).optional(),
  rolloutPercentage: z.number().min(0).max(100).optional(),
  minPlan: z.enum(["free", "pro", "premium"]).nullable().optional(),
  allowlistUserIds: z.array(z.string()).max(200).optional(),
});

// ── Business AI (future) ─────────────────────────────────────────────────

export const BusinessCreateSchema = z.object({
  name: z.string().min(1).max(200),
  industry: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  website: z.string().url().max(500).optional(),
  currency: z.string().max(8).default("USD"),
  region: z.string().max(8).default("global"),
  // Industry template (see src/lib/businessTemplates.ts) — tells the AI
  // assistant what to track and what questions it should answer well.
  template: z.string().max(64).optional(),
  // Optional suggested record categories this business tracks.
  categories: z.array(z.string().max(50)).max(20).optional(),
});
export const BusinessUpdateSchema = BusinessCreateSchema.partial();

export const BusinessCustomerCreateSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320).optional(),
  phone: z.string().max(32).optional(),
  notes: z.string().max(2000).optional(),
  totalSpentUsd: z.number().min(0).default(0),
});
export const BusinessCustomerUpdateSchema = BusinessCustomerCreateSchema.partial();

export const BusinessSupplierCreateSchema = z.object({
  name: z.string().min(1).max(200),
  contact: z.string().max(320).optional(),
  notes: z.string().max(2000).optional(),
});
export const BusinessSupplierUpdateSchema = BusinessSupplierCreateSchema.partial();

export const BusinessProductCreateSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().max(64).optional(),
  priceUsd: z.number().min(0),
  costUsd: z.number().min(0).optional(),
  category: z.string().max(100).optional(),
});
export const BusinessProductUpdateSchema = BusinessProductCreateSchema.partial();

export const BusinessOrderCreateSchema = z.object({
  customerId: z.string().optional(),
  itemsJson: z.string().min(1).max(5000),
  totalUsd: z.number().min(0),
  status: z.enum(["pending", "fulfilled", "cancelled"]).default("pending"),
  orderedAt: z.string().datetime(),
});
export const BusinessOrderUpdateSchema = BusinessOrderCreateSchema.partial();

export const BusinessInventoryCreateSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().min(0).default(0),
  reorderThreshold: z.number().min(0).default(0),
  location: z.string().max(200).optional(),
});
export const BusinessInventoryUpdateSchema = BusinessInventoryCreateSchema.partial();

export const BusinessExpenseCreateSchema = z.object({
  category: z.string().min(1).max(100),
  amountUsd: z.number().min(0),
  incurredAt: z.string().datetime(),
  notes: z.string().max(2000).optional(),
});
export const BusinessExpenseUpdateSchema = BusinessExpenseCreateSchema.partial();

export const BusinessRevenueCreateSchema = z.object({
  source: z.string().min(1).max(200),
  amountUsd: z.number().min(0),
  receivedAt: z.string().datetime(),
  notes: z.string().max(2000).optional(),
});
export const BusinessRevenueUpdateSchema = BusinessRevenueCreateSchema.partial();

// ── Creator Memory (active) ─────────────────────────────────────────────

export const CreatorStageValues = [
  "musician", "artist", "youtuber", "tiktok", "influencer",
  "writer", "producer", "photographer", "agency",
] as const;

export const CreatorSongStatusValues = ["unreleased", "released", "archived"] as const;
export const CreatorIdeaStatusValues = ["idea", "in_progress", "published", "archived"] as const;
export const CreatorCampaignStatusValues = ["planned", "active", "completed", "archived"] as const;

export const CreatorCreateSchema = z.object({
  name: z.string().min(1).max(200),
  stage: z.enum(CreatorStageValues).default("musician"),
  genre: z.string().max(100).optional(),
  brandIdentity: z.string().max(2000).optional(),
  bio: z.string().max(2000).optional(),
});
export const CreatorUpdateSchema = CreatorCreateSchema.partial();

export const CreatorSongCreateSchema = z.object({
  title: z.string().min(1).max(200),
  lyrics: z.string().max(10000).optional(),
  status: z.enum(CreatorSongStatusValues).default("unreleased"),
  releaseDate: z.string().datetime().optional(),
  producers: z.array(z.string().max(100)).max(10).default([]),
  notes: z.string().max(2000).optional(),
});
export const CreatorSongUpdateSchema = CreatorSongCreateSchema.partial();

export const CreatorIdeaCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  platform: z.string().max(64).optional(),
  status: z.enum(CreatorIdeaStatusValues).default("idea"),
  notes: z.string().max(2000).optional(),
});
export const CreatorIdeaUpdateSchema = CreatorIdeaCreateSchema.partial();

export const CreatorCampaignCreateSchema = z.object({
  name: z.string().min(1).max(200),
  goal: z.string().max(1000).optional(),
  platform: z.string().max(64).optional(),
  budgetUsd: z.number().min(0).default(0),
  status: z.enum(CreatorCampaignStatusValues).default("planned"),
  notes: z.string().max(2000).optional(),
});
export const CreatorCampaignUpdateSchema = CreatorCampaignCreateSchema.partial();

export const CreatorCollaboratorCreateSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().max(100).optional(),
  contact: z.string().max(320).optional(),
  notes: z.string().max(2000).optional(),
});
export const CreatorCollaboratorUpdateSchema = CreatorCollaboratorCreateSchema.partial();

export const CreatorContentCreateSchema = z.object({
  title: z.string().min(1).max(300),
  platform: z.string().max(64).optional(),
  url: z.string().url().max(500).optional(),
  publishedAt: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
});
export const CreatorContentUpdateSchema = CreatorContentCreateSchema.partial();

// ── Economic Intelligence + Opportunity Engine (future) ─────────────────

export const EconomicSignalCreateSchema = z.object({
  region: z.string().max(8).default("global"),
  category: z.string().min(1).max(100),
  title: z.string().min(1).max(300),
  description: z.string().min(1).max(4000),
  source: z.string().min(1).max(200),
  sourceUrl: z.string().url().max(500).optional(),
  confidence: z.number().min(0).max(1).default(0.5),
  methodology: z.string().min(1).max(1000),
  observedAt: z.string().datetime(),
});

export const OpportunityCreateSchema = z.object({
  businessId: z.string().optional(),
  title: z.string().min(1).max(300),
  description: z.string().min(1).max(1500),
  evidenceJson: z.string().min(1).max(1500),
  dataSourcesJson: z.string().min(1).max(2000),
  estimatedSizeUsd: z.number().min(0).optional(),
  riskFactorsJson: z.string().min(1).max(2000),
  confidence: z.number().min(0).max(1).default(0.5),
  status: z.enum(["open", "dismissed", "pursued"]).default("open"),
});
export const OpportunityUpdateSchema = OpportunityCreateSchema.partial();

// ── Financial + Credit Intelligence (future) ─────────────────────────────

export const FinancialAccountCreateSchema = z.object({
  businessId: z.string().optional(),
  provider: z.string().min(1).max(64),
  accountType: z.string().min(1).max(64),
  currency: z.string().max(8).default("USD"),
  externalRef: z.string().max(256).optional(),
});
export const FinancialAccountUpdateSchema = FinancialAccountCreateSchema.partial();

export const FinancialTransactionCreateSchema = z.object({
  amountUsd: z.number(),
  category: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  occurredAt: z.string().datetime(),
  source: z.string().min(1).max(64),
});
export const FinancialTransactionUpdateSchema = FinancialTransactionCreateSchema.partial();

export const CreditProfileConsentSchema = z.object({
  consentGiven: z.literal(true),
});

// ── Push Notifications + Reminders ───────────────────────────────────────

export const ReminderCreateSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  scheduledAt: z.string().datetime(),
  source: z.string().max(100).optional(),
  recurrence: z.enum(["none", "daily", "weekly", "monthly"]).default("none"),
  recurrenceEndDate: z.string().datetime().optional(),
});

// ── Marketplace (future) ──────────────────────────────────────────────────

export const MarketplaceListingCreateSchema = z.object({
  businessId: z.string().optional(),
  type: z.enum(["business", "product", "service", "opportunity"]),
  title: z.string().min(1).max(300),
  description: z.string().min(1).max(4000),
  region: z.string().max(8).default("global"),
  status: z.enum(["draft", "active", "closed"]).default("draft"),
});
export const MarketplaceListingUpdateSchema = MarketplaceListingCreateSchema.partial();
