import { auth } from "@clerk/nextjs/server";
import { streamText } from "ai";
import { openai as aiSdkOpenai } from "@ai-sdk/openai";
import { prisma } from "@/lib/prisma";
import { retrieveRelevantMemories, buildSystemPrompt } from "@/lib/memory";
import { ChatRequestSchema } from "@/lib/validators";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const rateCheck = checkRateLimit(`chat:${clerkId}`, 30, 60_000);
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

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
  }

  let agent = null;
  if (agentId) {
    agent = await prisma.agent.findFirst({ where: { id: agentId, userId: user.id } });
  }

  let conversation;
  if (conversationId) {
    conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: user.id },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
    });
    if (!conversation) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), { status: 404 });
    }
  } else {
    conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        agentId: agent?.id ?? null,
        title: message.slice(0, 60),
        messages: { create: { role: "user", content: message } },
      },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  if (conversationId) {
    await prisma.message.create({
      data: { conversationId: conversation.id, role: "user", content: message },
    });
  }

  const memories = await retrieveRelevantMemories(user.id, message, 5);
  const systemPrompt = buildSystemPrompt(agent?.systemPrompt ?? null, memories);

  const history = conversation.messages
    .filter((m) => !(m.role === "user" && m.content === message && !conversationId))
    .slice(-19)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const result = streamText({
    model: aiSdkOpenai(agent?.modelId ?? "gpt-4o"),
    system: systemPrompt,
    messages: [...history, { role: "user", content: message }],
    maxTokens: agent?.maxTokens ?? 2000,
    temperature: agent?.temperature ?? 0.7,
    onFinish: async ({ text, usage }) => {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: text,
          tokensUsed: usage?.totalTokens ?? null,
          memoryIds: memories.map((m) => m.id),
        },
      });
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });
      await prisma.reputation.updateMany({
        where: { userId: user.id },
        data: { chatCount: { increment: 1 } },
      });
    },
  });

  const response = result.toDataStreamResponse();
  const newHeaders = new Headers(response.headers);
  newHeaders.set("X-Conversation-Id", conversation.id);
  return new Response(response.body, { status: response.status, headers: newHeaders });
}
