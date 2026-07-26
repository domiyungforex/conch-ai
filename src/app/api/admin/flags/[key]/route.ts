import { ID } from "node-appwrite";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";
import { isAdmin, forbiddenAdmin } from "@/lib/admin";
import { setModuleStatus } from "@/lib/moduleFlags";
import { MODULE_KEYS, type ModuleKey } from "@/lib/modules";
import { AdminModuleUpdateSchema } from "@/lib/validators";

export async function PATCH(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!isAdmin(userId)) return forbiddenAdmin();

  const { key } = await params;
  if (!MODULE_KEYS.includes(key as ModuleKey)) {
    return new Response(JSON.stringify({ error: "Unknown module" }), { status: 404 });
  }

  const parsed = AdminModuleUpdateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const { databases } = createAdminClient();
  const state = await setModuleStatus(databases, key as ModuleKey, parsed.data, userId);

  // Every activation-relevant change is logged — required by the admin
  // control center's own spec ("All changes must be logged").
  try {
    await databases.createDocument(DB_ID, COLLECTIONS.AUDIT_LOGS, ID.unique(), {
      actorId: userId,
      action: "module_flag_update",
      target: key,
      metadata: JSON.stringify(parsed.data),
    });
  } catch {
    // Audit logging failure shouldn't block the actual flag change.
  }

  return Response.json({ item: state });
}
