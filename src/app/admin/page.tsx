import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { AdminFlagsClient } from "./AdminFlagsClient";

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!isAdmin(userId)) redirect("/dashboard");

  return (
    <div className="min-h-dvh bg-background p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Module Control Center</h1>
        <p className="text-sm text-slate-400 mt-1">
          Enable, disable, or beta-test any module. Changes take effect within 30 seconds (flag cache TTL) and are logged.
        </p>
      </div>
      <AdminFlagsClient />
    </div>
  );
}
