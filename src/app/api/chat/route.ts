import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type AgentDoc, type ConversationDoc, type MessageDoc, type ReputationDoc, type AppwriteDoc } from "@/lib/db";
import { streamText } from "ai";
import { openai as aiSdkOpenai } from "@ai-sdk/openai";
import { retrieveRelevantMemories, buildSystemPrompt } from "@/lib/memory";
import type { MemoryWithScore } from "@/lib/memory";
import { ChatRequestSchema } from "@/lib/validators";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { Query, ID } from "node-appwrite";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const appwriteId = userId;

  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "AI service is not configured. Please contact support." }),
      { status: 503 }
    );
  }

  const rateCheck = checkRateLimit(`chat:${appwriteId}`, 30, 60_000);
  if (!rateCheck.success) return rateLimitResponse(rateCheck.resetAt);

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

  const { conversationId, agentId, message } = parsed.data;
  const { databases } = createAdminClient();

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
        role: "user",
        content: message,
        tokensUsed: null,
        memoryIds: [],
      });
    } else {
      const conv = await databases.createDocument(DB_ID, COLLECTIONS.CONVERSATIONS, ID.unique(), {
        userId: appwriteId,
        agentId: agent?.$id ?? null,
        title: message.slice(0, 60),
        summary: null,
      }) as unknown as AppwriteDoc<ConversationDoc>;
      convId = conv.$id;

      await databases.createDocument(DB_ID, COLLECTIONS.MESSAGES, ID.unique(), {
        conversationId: convId,
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

  let memories: MemoryWithScore[] = [];
  try {
    memories = await retrieveRelevantMemories(appwriteId, message, 5);
  } catch (memErr) {
    console.error("[chat] memory retrieval failed, continuing without context:", memErr);
  }

  const systemPrompt = buildSystemPrompt(agent?.systemPrompt ?? null, memories);

  const history = messageHistory
    .slice(-19)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  let result;
  try {
    result = streamText({
      model: aiSdkOpenai(agent?.modelId ?? "gpt-4o"),
      system: systemPrompt,
      messages: [...history, { role: "user", content: message }],
      maxTokens: agent?.maxTokens ?? 2000,
      temperature: agent?.temperature ?? 0.7,
      onError: ({ error }) => {
        const msg = String(error);
        const isRateLimit  = msg.includes("429") || msg.includes("rate_limit");
        const isAuth       = msg.includes("401") || msg.includes("invalid_api_key") || msg.includes("Incorrect API key");
        const isModelError = msg.includes("model") && msg.includes("404");
        console.error("[chat] stream error:", { isRateLimit, isAuth, isModelError, raw: msg.slice(0, 200) });
      },
      onFinish: async ({ text, usage }) => {
        try {
          await databases.createDocument(DB_ID, COLLECTIONS.MESSAGES, ID.unique(), {
            conversationId: convId,
            role: "assistant",
            content: text,
            tokensUsed: usage?.totalTokens ?? null,
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
      },
    });
  } catch (err) {
    console.error("[chat] streamText init failed:", err);
    const isKeyMissing = String(err).includes("API key") || String(err).includes("401");
    return new Response(
      JSON.stringify({ error: isKeyMissing ? "AI service not configured. Check OPENAI_API_KEY." : "AI service unavailable. Please try again." }),
      { status: 503 }
    );
  }

  const response = result.toDataStreamResponse();
  const newHeaders = new Headers(response.headers);
  newHeaders.set("X-Conversation-Id", convId);
  return new Response(response.body, { status: response.status, headers: newHeaders });
}
