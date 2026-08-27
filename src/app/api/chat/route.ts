import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type AgentDoc, type ConversationDoc, type MessageDoc, type ReputationDoc, type MemoryDoc, type AppwriteDoc } from "@/lib/db";
import { streamAnthropicChat, type AnthropicToolDef } from "@/lib/anthropicRaw";
import { streamOpenAIChat } from "@/lib/openaiStream";
import { retrieveRelevantMemories, buildSystemPrompt } from "@/lib/memory";
import { buildContextPackage, formatContextForPrompt } from "@/lib/contextEngine";
import { generateEmbedding } from "@/lib/embeddings";
import { calculate } from "@/lib/calculator";
import { getMarketAnalysis } from "@/lib/marketData";
import type { MemoryWithScore } from "@/lib/memory";
import { ChatRequestSchema } from "@/lib/validators";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { checkConversationQuota, checkMemoryQuota, checkChatMessageQuota, upgradeHint, checkFeatureAccess, upgradeRequiredResponse } from "@/lib/planLimits";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { Query, ID, Permission, Role } from "node-appwrite";

// Map internal model IDs to OpenRouter model names
function mapToOpenRouterModel(modelId?: string | null): string {
  if (!modelId) return "anthropic/claude-sonnet-5";
  // Already an OpenRouter model name
  if (modelId.includes("/")) return modelId;
  // Map Anthropic model IDs to OpenRouter format
  const modelMap: Record<string, string> = {
    "claude-haiku-4-5-20251001": "anthropic/claude-sonnet-5",
    "claude-sonnet-5": "anthropic/claude-sonnet-5",
    "claude-opus-4-8": "anthropic/claude-opus-4.8",
  };
  return modelMap[modelId] || "anthropic/claude-sonnet-5";
}

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "chat")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENROUTER_API_KEY) {
    return new Response(
      JSON.stringify({ error: "AI service is not configured. Please contact support." }),
      { status: 503 }
    );
  }

  const rateCheck = checkRateLimit(`chat:${appwriteId}`, 30, 60_000);
  if (!rateCheck.success) return rateLimitResponse(rateCheck.resetAt);

  const { databases } = createAdminClient();

  const featureAccess = await checkFeatureAccess(databases, appwriteId);
  if (!featureAccess.allowed) return upgradeRequiredResponse();

  const chatQuota = await checkChatMessageQuota(databases, appwriteId);
  if (!chatQuota.allowed) {
    return new Response(JSON.stringify({
      error: `Free plan is limited to ${chatQuota.limit} messages a day. ${upgradeHint(chatQuota.plan)} for unlimited chat.`,
      code: "QUOTA_EXCEEDED",
    }), { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const { conversationId, agentId, message, images } = parsed.data;

  let agent: AppwriteDoc<AgentDoc> | null = null;
  let convId!: string;
  let messageHistory: Array<{ role: string; content: string }> = [];

  try {
    if (agentId) {
      try {
        const agentDoc = await databases.getDocument(DB_ID, COLLECTIONS.AGENTS, agentId) as unknown as AppwriteDoc<AgentDoc>;
        if (agentDoc.userId === appwriteId) agent = agentDoc;
      } catch {
        // Agent not found — proceed without it
      }
    }

    if (conversationId) {
      let conv: AppwriteDoc<ConversationDoc>;
      try {
        conv = await databases.getDocument(DB_ID, COLLECTIONS.CONVERSATIONS, conversationId) as unknown as AppwriteDoc<ConversationDoc>;
      } catch {
        return new Response(JSON.stringify({ error: "Conversation not found" }), { status: 404 });
      }
      if (conv.userId !== appwriteId) {
        return new Response(JSON.stringify({ error: "Conversation not found" }), { status: 404 });
      }
      convId = conv.$id;

      const msgsResult = await databases.listDocuments(DB_ID, COLLECTIONS.MESSAGES, [
        Query.equal("conversationId", convId),
        Query.orderAsc("$createdAt"),
        Query.limit(20),
      ]);
      messageHistory = (msgsResult.documents as unknown as AppwriteDoc<MessageDoc>[]).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      await databases.createDocument(DB_ID, COLLECTIONS.MESSAGES, ID.unique(), {
        conversationId: convId,
        userId: appwriteId,
        role: "user",
        content: message,
        tokensUsed: null,
        memoryIds: [],
      });
    } else {
      const quota = await checkConversationQuota(databases, appwriteId);
      if (!quota.allowed) {
        return new Response(JSON.stringify({
          error: `Free plan is limited to ${quota.limit} new conversations a month. Upgrade to Pro for unlimited.`,
          code: "QUOTA_EXCEEDED",
        }), { status: 403 });
      }

      const conv = await databases.createDocument(DB_ID, COLLECTIONS.CONVERSATIONS, ID.unique(), {
        userId: appwriteId,
        agentId: agent?.$id ?? null,
        title: message.slice(0, 60),
        summary: null,
      }) as unknown as AppwriteDoc<ConversationDoc>;
      convId = conv.$id;

      await databases.createDocument(DB_ID, COLLECTIONS.MESSAGES, ID.unique(), {
        conversationId: convId,
        userId: appwriteId,
        role: "user",
        content: message,
        tokensUsed: null,
        memoryIds: [],
      });
      messageHistory = [];
    }
  } catch (dbErr) {
    console.error("[chat] conversation setup failed:", dbErr);
    return new Response(
      JSON.stringify({ error: "Database unavailable. Please try again." }),
      { status: 503 }
    );
  }

  // Retrieve more memories when user is asking about what's remembered
  const isMemoryQuery = /\b(remember|recall|memories|memory|know about me|saved|stored)\b/i.test(message);
  const topK = isMemoryQuery ? 15 : 6;

  // Parallel retrieval: memories + context engine (decisions, constraints, handoffs)
  let memories: MemoryWithScore[] = [];
  let totalMemories = 0;
  let contextFragment = "";

  try {
    const [memResult, countResult, contextPkg] = await Promise.allSettled([
      retrieveRelevantMemories(appwriteId, message, topK),
      databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES, [
        Query.equal("userId", appwriteId),
        Query.equal("isArchived", false),
        Query.limit(1),
      ]),
      buildContextPackage({
        userId: appwriteId,
        query: message,
        agentId: agent?.$id ?? undefined,
      }),
    ]);

    if (memResult.status === "fulfilled") memories = memResult.value;
    else console.error("[chat] memory retrieval failed, continuing without context:", memResult.reason);

    if (countResult.status === "fulfilled") totalMemories = countResult.value.total;

    if (contextPkg.status === "fulfilled") {
      contextFragment = formatContextForPrompt(contextPkg.value);
    } else {
      console.error("[chat] context package failed, continuing without:", contextPkg.reason);
    }
  } catch (ctxErr) {
    console.error("[chat] parallel retrieval failed, continuing without context:", ctxErr);
  }

  const baseSystemPrompt = buildSystemPrompt(agent?.systemPrompt ?? null, memories, totalMemories);
  const systemPrompt = baseSystemPrompt + contextFragment;

  const history = messageHistory
    .slice(-19)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  // Tool: save a memory when the AI is instructed to remember something
  const saveMemory: AnthropicToolDef = {
    name: "saveMemory",
    description: "Save an important piece of information to the user's persistent memory. Use this when the user asks you to remember something, or when they share a preference, fact, or experience worth preserving.",
    input_schema: {
      type: "object",
      properties: {
        content: { type: "string", description: "The exact memory content to save (be concise and specific)" },
        category: {
          type: "string",
          enum: ["EPISODIC", "SEMANTIC", "PREFERENCE", "PROCEDURAL"],
          description: "EPISODIC: personal events/experiences; SEMANTIC: facts/knowledge; PREFERENCE: likes/dislikes/preferences; PROCEDURAL: how-to knowledge or workflows",
        },
        importance: { type: "number", description: "Importance score (0.5 = normal, 0.8 = very important, 1.0 = critical)" },
        tags: { type: "array", items: { type: "string" }, description: "Short descriptive tags (max 5)" },
      },
      required: ["content", "category", "importance", "tags"],
    },
    execute: async (input) => {
      const { content, category, importance, tags } = input as {
        content: string; category: string; importance: number; tags: string[];
      };
      try {
        const quota = await checkMemoryQuota(databases, appwriteId);
        if (!quota.allowed) {
          return { saved: false, error: `Your plan is limited to ${quota.limit} memories. Let the user know they'd need to ${upgradeHint(quota.plan).toLowerCase()} for more memory space.` };
        }

        const memId = ID.unique();

        let embedding: number[] = [];
        try {
          embedding = await generateEmbedding(content);
        } catch {
          // Memory saved even if embedding generation fails
        }

        await databases.createDocument(DB_ID, COLLECTIONS.MEMORIES, memId, {
          userId: appwriteId,
          embedding,
          content,
          category,
          importance,
          tags,
          source: "chat",
          agentId: agent?.$id ?? null,
          isArchived: false,
          accessCount: 0,
          lastAccessed: null,
        }, [
          Permission.read(Role.user(appwriteId)),
          Permission.update(Role.user(appwriteId)),
          Permission.delete(Role.user(appwriteId)),
        ]);

        // Increment reputation memory count
        try {
          const repResult = await databases.listDocuments(DB_ID, COLLECTIONS.REPUTATIONS, [
            Query.equal("userId", appwriteId), Query.limit(1),
          ]);
          if (repResult.documents.length > 0) {
            const rep = repResult.documents[0] as unknown as AppwriteDoc<ReputationDoc>;
            await databases.updateDocument(DB_ID, COLLECTIONS.REPUTATIONS, rep.$id, {
              memoryCount: rep.memoryCount + 1,
            });
          }
        } catch {
          // Non-critical
        }

        return { saved: true, memoryId: memId };
      } catch (err) {
        console.error("[chat] saveMemory tool failed:", err);
        return { saved: false, error: "Failed to save memory" };
      }
    },
  };

  // Tool: actively search memory when the auto-retrieved context isn't enough
  const searchMemory: AnthropicToolDef = {
    name: "searchMemory",
    description: "Search the user's full memory for anything relevant to a specific topic or question. Use this when the memories already shown to you don't cover what the user is asking about.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to search for (a topic, question, or keyword phrase)" },
      },
      required: ["query"],
    },
    execute: async (input) => {
      const { query } = input as { query: string };
      try {
        const found = await retrieveRelevantMemories(appwriteId, query, 8);
        for (const m of found) {
          if (!memories.some((existing) => existing.$id === m.$id)) memories.push(m);
        }
        return {
          results: found.map((m) => ({ content: m.content, category: m.category, createdAt: m.$createdAt })),
        };
      } catch (err) {
        console.error("[chat] searchMemory tool failed:", err);
        return { results: [], error: "Search failed" };
      }
    },
  };

  // Tool: actually delete memories on request, rather than deflecting to "contact support"
  const forgetMemory: AnthropicToolDef = {
    name: "forgetMemory",
    description: "Permanently delete memories matching a topic. Use this whenever the user asks you to forget, delete, or remove something you remember about them — you have direct access to their memory store, so never claim you can't do this or tell them to contact support. If the request is vague (e.g. \"delete everything\"), ask them to confirm or narrow it down in your text response instead of calling this tool.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The topic or content to find and delete (e.g. \"my old phone number\", \"the supplier named Kira\")" },
      },
      required: ["query"],
    },
    execute: async (input) => {
      const { query } = input as { query: string };
      try {
        // Stricter threshold than normal recall — deleting the wrong memory is worse
        // than missing one, so only remove close, confident matches.
        const matches = await retrieveRelevantMemories(appwriteId, query, 10, undefined, 0.5);
        if (matches.length === 0) return { deletedCount: 0, deleted: [] };

        for (const m of matches) {
          await databases.deleteDocument(DB_ID, COLLECTIONS.MEMORIES, m.$id);
          const idx = memories.findIndex((existing) => existing.$id === m.$id);
          if (idx !== -1) memories.splice(idx, 1);
        }

        try {
          const repResult = await databases.listDocuments(DB_ID, COLLECTIONS.REPUTATIONS, [
            Query.equal("userId", appwriteId), Query.limit(1),
          ]);
          if (repResult.documents.length > 0) {
            const rep = repResult.documents[0] as unknown as AppwriteDoc<ReputationDoc>;
            await databases.updateDocument(DB_ID, COLLECTIONS.REPUTATIONS, rep.$id, {
              memoryCount: Math.max(0, rep.memoryCount - matches.length),
            });
          }
        } catch {
          // Non-critical
        }

        return {
          deletedCount: matches.length,
          deleted: matches.map((m) => ({ content: m.content, category: m.category })),
        };
      } catch (err) {
        console.error("[chat] forgetMemory tool failed:", err);
        return { deletedCount: 0, deleted: [], error: "Delete failed" };
      }
    },
  };

  // Tool: precise math instead of the model estimating it in its head
  const calculateTool: AnthropicToolDef = {
    name: "calculate",
    description: "Evaluate a precise math expression — arithmetic, algebra-style formulas, trigonometry, logarithms, factorials, and statistics over a list of numbers. Use this for any calculation, from school homework to business/financial math, instead of computing it yourself: exact numbers matter.",
    input_schema: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description:
            "A math expression. Operators: + - * / % ^ (power) ! (factorial) and parentheses. " +
            "Constants: pi, e. Functions: sqrt, abs, sin, cos, tan, asin, acos, atan, log (base 10), ln, exp, floor, ceil, round, sign. " +
            "Multi-argument stats functions take plain comma-separated numbers, NOT array brackets — " +
            "write mean(85, 92, 78, 90), never mean([85, 92, 78, 90]). Same for min, max, sum, median, stddev. " +
            "Examples: \"(1500 - 1200) / 1200 * 100\", \"sqrt(3^2 + 4^2)\", \"pi * 5^2\", \"mean(85, 92, 78, 90)\".",
        },
      },
      required: ["expression"],
    },
    execute: async (input) => {
      const { expression } = input as { expression: string };
      try {
        return { result: calculate(expression) };
      } catch (err) {
        return { error: err instanceof Error ? err.message : "Could not evaluate expression" };
      }
    },
  };

  // Tool: browse memory directly (by category/tag) rather than similarity search —
  // for "what do you know about my business" style questions where the user wants
  // a full picture, not just the top-K most-similar matches.
  const listMemories: AnthropicToolDef = {
    name: "listMemories",
    description: "List the user's stored memories directly, optionally filtered by category or tag, ordered most recent first. Use this when the user wants a full overview (e.g. \"what do you know about my customers\", \"show me everything you have on X\") rather than an answer to a specific question.",
    input_schema: {
      type: "object",
      properties: {
        category: { type: "string", enum: ["EPISODIC", "SEMANTIC", "PREFERENCE", "PROCEDURAL"], description: "Optional category filter" },
        tag: { type: "string", description: "Optional tag filter (exact match)" },
        limit: { type: "number", description: "Max results, default 20, max 50" },
      },
      required: [],
    },
    execute: async (input) => {
      const { category, tag, limit } = input as { category?: string; tag?: string; limit?: number };
      try {
        const filters = [
          Query.equal("userId", appwriteId),
          Query.equal("isArchived", false),
          Query.orderDesc("$createdAt"),
          Query.limit(Math.min(limit ?? 20, 50)),
        ];
        if (category) filters.push(Query.equal("category", category));
        if (tag) filters.push(Query.equal("tags", tag));

        const result = await databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES, filters);
        const found = result.documents as unknown as AppwriteDoc<MemoryDoc>[];
        return {
          total: result.total,
          memories: found.map((m) => ({ content: m.content, category: m.category, tags: m.tags, createdAt: m.$createdAt })),
        };
      } catch (err) {
        console.error("[chat] listMemories tool failed:", err);
        return { total: 0, memories: [], error: "Could not list memories" };
      }
    },
  };

  // Tool: real price + technical analysis (SMA/EMA/RSI, recent high/low, trend) for
  // forex, gold, crypto, and stocks — never a substitute for the calculate tool, and
  // never a stand-in for the user's own decision to enter a trade.
  const marketDataTool: AnthropicToolDef = {
    name: "getMarketData",
    description:
      "Fetch price and technical data for a forex pair, gold/commodity, crypto, or stock symbol — current price, 24h change, SMA20/50, EMA20, RSI14, recent high/low, trend direction, and the last 30 candles' raw OHLC (chronological) for reading actual price structure. Use this for ANY question about a current price or technical setup; never guess or use a remembered price. Data is cached for about a minute, so treat it as near-real-time, not tick-by-tick.",
    input_schema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description:
            "Symbol in Twelve Data format. Forex pairs: \"EUR/USD\", \"GBP/JPY\". Gold: \"XAU/USD\". Crypto: \"BTC/USD\", \"ETH/USD\". Stocks: ticker, e.g. \"AAPL\".",
        },
        interval: {
          type: "string",
          enum: ["1min", "5min", "15min", "30min", "1h", "4h", "1day"],
          description: "Candle interval. Default \"1h\" for general questions, \"1day\" for longer-term trend questions.",
        },
      },
      required: ["symbol"],
    },
    execute: async (input) => {
      const { symbol, interval } = input as { symbol: string; interval?: string };
      if (!isFeatureEnabled("marketData")) return { error: "Market data is temporarily unavailable." };
      const apiKey = process.env.TWELVEDATA_API_KEY;
      if (!apiKey) return { error: "Market data isn't configured yet." };
      try {
        return await getMarketAnalysis(apiKey, symbol, interval ?? "1h");
      } catch (err) {
        return { error: err instanceof Error ? err.message : "Could not fetch market data" };
      }
    },
  };

  // Tool: set a reminder that will send a push notification at the scheduled time
  const setReminderTool: AnthropicToolDef = {
    name: "setReminder",
    description:
      "Create a reminder that will notify the user at a specific time. Use this when the user asks to be reminded about something, or asks you to set a reminder. Parse the time from their message (e.g. \"at 8pm\", \"in 2 hours\", \"tomorrow at 10am\"). Supports recurring reminders (daily, weekly, monthly).",
    input_schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description:
            "Short title for the reminder (e.g. \"Meeting with Trevin\", \"Call the dentist\")",
        },
        message: {
          type: "string",
          description:
            "Detailed message to show in the notification (e.g. \"Presentation with Trevin and Big Seven at 8:00 PM\")",
        },
        scheduledAt: {
          type: "string",
          description:
            "ISO 8601 datetime string for when to send the notification (e.g. \"2026-08-27T20:00:00Z\")",
        },
        recurrence: {
          type: "string",
          enum: ["none", "daily", "weekly", "monthly"],
          description:
            "How often to repeat. Use \"daily\" for every day, \"weekly\" for every week, \"monthly\" for every month. Default is \"none\" for a one-time reminder.",
        },
        recurrenceEndDate: {
          type: "string",
          description:
            "Optional ISO 8601 datetime string for when to stop repeating (e.g. \"2026-12-31T23:59:59Z\"). If not set, the reminder repeats indefinitely.",
        },
      },
      required: ["title", "message", "scheduledAt"],
    },
    execute: async (input) => {
      const { title, message: msg, scheduledAt, recurrence, recurrenceEndDate } = input as {
        title: string;
        message: string;
        scheduledAt: string;
        recurrence?: string;
        recurrenceEndDate?: string;
      };
      try {
        const date = new Date(scheduledAt);
        if (date <= new Date()) {
          return {
            success: false,
            error: "The scheduled time must be in the future. Please try again with a later time.",
          };
        }

        // Validate recurrence end date if provided
        if (recurrenceEndDate) {
          const endDate = new Date(recurrenceEndDate);
          if (endDate <= date) {
            return {
              success: false,
              error: "The recurrence end date must be after the scheduled time.",
            };
          }
        }

        const { databases } = createAdminClient();

        await databases.createDocument(DB_ID, COLLECTIONS.REMINDERS, ID.unique(), {
          userId: appwriteId,
          title,
          message: msg,
          scheduledAt: date.toISOString(),
          status: "pending",
          source: "chat",
          recurrence: recurrence || "none",
          recurrenceEndDate: recurrenceEndDate || null,
        });

        const recurrenceText = recurrence && recurrence !== "none"
          ? ` (repeats ${recurrence}${recurrenceEndDate ? ` until ${new Date(recurrenceEndDate).toLocaleDateString()}` : " indefinitely"})`
          : "";

        return {
          success: true,
          scheduledAt: date.toISOString(),
          title,
          recurrence: recurrence || "none",
          message: `Reminder set for ${date.toLocaleString()}${recurrenceText}`,
        };
      } catch (err) {
        console.error("[chat] setReminder tool failed:", err);
        return { success: false, error: "Failed to create reminder" };
      }
    },
  };

  // Images (if any) precede the text block, matching Anthropic's documented convention.
  const finalUserContent = images && images.length > 0
    ? [
        ...images.map((img) => ({
          type: "image" as const,
          source: { type: "base64" as const, media_type: img.mediaType, data: img.data },
        })),
        { type: "text" as const, text: message },
      ]
    : message;

  let stream: ReadableStream<Uint8Array>;
  try {
    const useOpenRouter = !!process.env.OPENROUTER_API_KEY;
    const chatMessages = [...history, { role: "user", content: finalUserContent }];
    const chatTools = [saveMemory, searchMemory, calculateTool, listMemories, forgetMemory, marketDataTool, setReminderTool];
    const onFinish = async ({ text, totalTokens }: { text: string; totalTokens: number }) => {
      try {
        await databases.createDocument(DB_ID, COLLECTIONS.MESSAGES, ID.unique(), {
          conversationId: convId,
          userId: appwriteId,
          role: "assistant",
          content: text,
          tokensUsed: totalTokens ?? null,
          memoryIds: memories.map((m) => m.$id),
        });

        const repResult = await databases.listDocuments(DB_ID, COLLECTIONS.REPUTATIONS, [
          Query.equal("userId", appwriteId), Query.limit(1),
        ]);
        if (repResult.documents.length > 0) {
          const rep = repResult.documents[0] as unknown as AppwriteDoc<ReputationDoc>;
          await databases.updateDocument(DB_ID, COLLECTIONS.REPUTATIONS, rep.$id, {
            chatCount: rep.chatCount + 1,
          });
        }
      } catch (finishErr) {
        console.error("[chat] onFinish DB write failed:", finishErr);
      }
    };

    // Helper to create an OpenRouter stream
    const createOpenRouterStream = () => streamOpenAIChat({
      baseUrl: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY!,
      model: mapToOpenRouterModel(agent?.modelId),
      system: systemPrompt,
      messages: chatMessages,
      maxTokens: agent?.maxTokens ?? 2000,
      temperature: agent?.temperature ?? 0.7,
      maxSteps: 3,
      tools: chatTools,
      onFinish,
    });

    // Helper to create an Anthropic stream
    const createAnthropicStream = () => streamAnthropicChat({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      model: agent?.modelId ?? "claude-haiku-4-5-20251001",
      system: systemPrompt,
      messages: chatMessages as { role: "user" | "assistant"; content: string }[],
      maxTokens: agent?.maxTokens ?? 2000,
      temperature: agent?.temperature ?? 0.7,
      maxSteps: 3,
      tools: chatTools,
      onFinish,
    });

    // Quick health check to decide which provider to use.
    // Anthropic errors (credit exhaustion etc.) are lazy — they only surface
    // when the client reads the stream — so we do a cheap preflight ping.
    let useAnthropic = !!process.env.ANTHROPIC_API_KEY;
    if (useAnthropic) {
      try {
        const pingRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": process.env.ANTHROPIC_API_KEY!,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1,
            messages: [{ role: "user", content: "ping" }],
          }),
        });
        if (!pingRes.ok) {
          const errBody = await pingRes.text().catch(() => "");
          console.error(`[chat] Anthropic preflight failed (${pingRes.status}):`, errBody.slice(0, 200));
          useAnthropic = false;
        }
      } catch {
        useAnthropic = false;
      }
    }

    if (useAnthropic) {
      stream = createAnthropicStream();
    } else if (useOpenRouter) {
      console.log("[chat] Falling back to OpenRouter");
      stream = createOpenRouterStream();
    } else {
      throw new Error("No AI provider available. Anthropic credits may be exhausted and no OpenRouter fallback is configured.");
    }
  } catch (err) {
    console.error("[chat] stream init failed:", err);
    const isKeyMissing = String(err).includes("API key") || String(err).includes("401");
    return new Response(
      JSON.stringify({ error: isKeyMissing ? "AI service not configured. Check your API keys." : "AI service unavailable. Please try again." }),
      { status: 503 }
    );
  }

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Conversation-Id": convId,
    },
  });
}
