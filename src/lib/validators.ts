import { z } from "zod";

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
});

export const UserSettingsUpdateSchema = z.object({
  publicProfile: z.boolean().optional(),
  notifyChatSummaries: z.boolean().optional(),
  notifyMemoryInsights: z.boolean().optional(),
  notifyAgentAlerts: z.boolean().optional(),
  notifyWeeklyDigest: z.boolean().optional(),
  notifyProductUpdates: z.boolean().optional(),
});

export const MemoryVerifyConfirmSchema = z.object({
  attestationUid: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
});

export const SubscriptionConfirmSchema = z.object({
  txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  billingCycle: z.enum(["monthly", "annual"]),
});

export const MemoryUpdateSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  category: z.enum(["EPISODIC", "SEMANTIC", "PREFERENCE", "PROCEDURAL"]).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  importance: z.number().min(0).max(1).optional(),
  isArchived: z.boolean().optional(),
});

export const AgentCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  systemPrompt: z.string().min(1).max(4000),
  modelId: z.string().max(100).optional(),
  memoryScope: z.enum(["user", "agent", "global"]).default("user"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(4000).default(2000),
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
});

export const CodeRunSchema = z.object({
  code: z.string().min(1).max(20000),
});
