import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { SetupRetry } from "@/components/dashboard/SetupRetry";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  try {
    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        reputation: true,
        _count: { select: { memories: true, conversations: true, agents: true } },
      },
    });

    // Webhook may have missed — attempt fallback creation from Clerk session data.
    // Two-tier fallback: first try currentUser() for full profile data, then
    // fall back to a minimal record keyed only on clerkId so the user is never
    // permanently stuck. The webhook will fill in email/name/avatar later.
    if (!user) {
      let email = `${clerkId}@pending.conch`;
      let name: string | null = null;
      let avatarUrl: string | null = null;

      try {
        const clerkUser = await currentUser();
        if (clerkUser) {
          email = clerkUser.emailAddresses[0]?.emailAddress ?? email;
          name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
          avatarUrl = clerkUser.imageUrl ?? null;
        }
      } catch (clerkErr) {
        console.error("[dashboard] currentUser() failed, using minimal fallback:", clerkErr);
      }

      try {
        await prisma.user.upsert({
          where: { clerkId },
          create: {
            clerkId,
            email,
            name,
            avatarUrl,
            reputation: { create: {} },
          },
          update: {
            // Only overwrite if we have real data (not the placeholder email)
            ...(email.endsWith("@pending.conch") ? {} : { email }),
            ...(name !== null ? { name } : {}),
            ...(avatarUrl !== null ? { avatarUrl } : {}),
          },
        });

        user = await prisma.user.findUnique({
          where: { clerkId },
          include: {
            reputation: true,
            _count: { select: { memories: true, conversations: true, agents: true } },
          },
        });
      } catch (fallbackErr) {
        console.error("[dashboard] fallback user creation failed:", fallbackErr);
      }
    }

    if (!user) {
      return <SetupRetry />;
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
  } catch (err) {
    const code = (err as { code?: string })?.code;
    const isNoTable = code === "P2021" || code === "P1017" ||
      String(err).includes("does not exist") || String(err).includes("relation");
    const isNoConn = code === "P1001" || code === "P1000";

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl">
          <span className="text-red-400 text-lg font-bold">!</span>
        </div>
        <h2 className="text-lg font-semibold text-white">
          {isNoTable ? "Database tables missing" : isNoConn ? "Cannot reach database" : "Database error"}
        </h2>
        <p className="text-sm text-slate-400 max-w-sm">
          {isNoTable ? (
            <>Run <code className="text-violet-400">node_modules/.bin/prisma db push</code> to create the tables, then refresh.</>
          ) : isNoConn ? (
            <>Check that <code className="text-violet-400">DATABASE_URL</code> and <code className="text-violet-400">DIRECT_URL</code> are set correctly in Vercel, then redeploy.</>
          ) : (
            <>{String(err).slice(0, 120)}</>
          )}
        </p>
      </div>
    );
  }
}
