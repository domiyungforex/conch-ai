import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      reputation: true,
      _count: { select: { memories: true, conversations: true, agents: true } },
    },
  });

  if (!user) redirect("/sign-in");

  const recentMemories = await prisma.memory.findMany({
    where: { userId: user.id, isArchived: false },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const recentConversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 3,
    include: { _count: { select: { messages: true } } },
  });

  return (
    <DashboardHome
      user={user}
      stats={{
        memoryCount: user._count.memories,
        conversationCount: user._count.conversations,
        agentCount: user._count.agents,
        reputation: user.reputation,
      }}
      recentMemories={recentMemories}
      recentConversations={recentConversations}
    />
  );
}
