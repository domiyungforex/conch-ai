import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ReputationView } from "@/components/dashboard/ReputationView";

export const metadata = { title: "Reputation — Conch" };

export default async function ReputationPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        reputation: true,
        _count: { select: { memories: true, conversations: true, agents: true } },
      },
    });
  } catch {
    redirect("/dashboard");
  }

  if (!user) redirect("/sign-in");

  return (
    <ReputationView
      reputation={user.reputation}
      counts={{
        memories:      user._count.memories,
        agents:        user._count.agents,
        conversations: user._count.conversations,
      }}
    />
  );
}
