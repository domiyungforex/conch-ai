import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/appwrite";
import { isAdmin, forbiddenAdmin } from "@/lib/admin";
import { getAllModuleStates } from "@/lib/moduleFlags";
import { MODULE_REGISTRY } from "@/lib/modules";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!isAdmin(userId)) return forbiddenAdmin();

  const { databases } = createAdminClient();
  const states = await getAllModuleStates(databases);
  const items = states.map((state) => ({ ...state, info: MODULE_REGISTRY[state.key] }));

  return Response.json({ items });
}
