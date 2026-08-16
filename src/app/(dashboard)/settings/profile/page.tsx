import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type UserDoc, type AppwriteDoc } from "@/lib/db";
import { getSubscriptionStatus, getEffectivePlan, isTesterUserId } from "@/lib/subscription";
import { resolveUserEmail } from "@/lib/planLimits";
import { PLANS } from "@/lib/plans";
import { GlassCard } from "@/components/shared/GlassCard";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { databases } = createAdminClient();

  let user: AppwriteDoc<UserDoc>;
  try {
    user = await databases.getDocument(DB_ID, COLLECTIONS.USERS, userId) as unknown as AppwriteDoc<UserDoc>;
  } catch {
    redirect("/dashboard");
  }

  // Pre-email docs have a blank email on the Appwrite record; resolve it
  // from Clerk so the tester override still shows the right plan (and the
  // doc gets backfilled for next time).
  const email = (await resolveUserEmail(databases, userId, user)) ?? "";
  const effectiveUser = { ...user, email };

  const initial = (user.name?.[0] ?? email[0] ?? "?").toUpperCase();
  const status = isTesterUserId(userId) ? "active" : getSubscriptionStatus(effectiveUser);
  const planLabel = isTesterUserId(userId) ? PLANS.premium.label : PLANS[getEffectivePlan(effectiveUser)].label;

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-white mb-6">Profile Information</h2>
        <div className="flex items-start gap-6">
          <Avatar className="w-16 h-16">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name ?? email} />}
            <AvatarFallback className="bg-linear-to-br from-coral-600 to-gold-600 text-white text-xl font-bold">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-white">{user.name ?? email}</p>
            <p className="text-xs text-slate-400 mt-0.5">{email}</p>
            <p className="text-xs text-slate-500 mt-1">
              {planLabel} plan{status === "grace" ? " · renewal overdue" : ""}{user.onboarded ? "" : " · onboarding incomplete"}
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
