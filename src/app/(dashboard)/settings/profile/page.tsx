import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type UserDoc, type AppwriteDoc } from "@/lib/db";
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

  const initial = (user.name?.[0] ?? user.email[0] ?? "?").toUpperCase();

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-white mb-6">Profile Information</h2>
        <div className="flex items-start gap-6">
          <Avatar className="w-16 h-16">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name ?? user.email} />}
            <AvatarFallback className="bg-linear-to-br from-coral-600 to-gold-600 text-white text-xl font-bold">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-white">{user.name ?? user.email}</p>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
            <p className="text-xs text-slate-500 mt-1 capitalize">{user.plan} plan{user.onboarded ? "" : " · onboarding incomplete"}</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
