import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { AdminFlagsClient } from "./AdminFlagsClient";

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!isAdmin(userId)) redirect("/dashboard");

  return (
    <div className="min-h-dvh bg-background p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Admin Control Center</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage modules, billing, and platform settings.
        </p>
        <div className="flex gap-3 mt-4">
          <Link
            href="/admin/billing"
            className="text-sm px-4 py-2 rounded-xl bg-coral-500/15 text-coral-300 border border-coral-500/30 hover:bg-coral-500/25 transition-colors"
          >
            Billing Overview
          </Link>
        </div>
      </div>
      <AdminFlagsClient />
    </div>
  );
}
