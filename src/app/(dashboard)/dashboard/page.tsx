import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        reputation: true,
        _count: { select: { memories: true, conversations: true, agents: true } },
      },
    });

    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl">⚙️</div>
          <h2 className="text-lg font-semibold text-white">Setting up your account…</h2>
          <p className="text-sm text-slate-400 max-w-sm">
            Your profile is being created. This takes a few seconds after your first sign-in.
            Refresh the page in a moment.
          </p>
        </div>
      );
    }

    const [recentMemories, recentConversations] = await Promise.all([
      prisma.memory.findMany({
        where: { userId: user.id, isArchived: false },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.conversation.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        take: 3,
        include: { _count: { select: { messages: true } } },
      }),
    ]);

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
  } catch {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl">🗄️</div>
        <h2 className="text-lg font-semibold text-white">Database not connected</h2>
        <p className="text-sm text-slate-400 max-w-sm">
          Add your Supabase <code className="text-violet-400">DATABASE_URL</code> and{" "}
          <code className="text-violet-400">DIRECT_URL</code> to Vercel environment variables,
          then redeploy.
        </p>
      </div>
    );
  }
}
