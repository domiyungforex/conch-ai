import { createAdminClient } from "@/lib/appwrite";
import { BUSINESS_TEMPLATES } from "@/lib/businessTemplates";
import { checkModuleAccess, moduleUnavailableResponse } from "@/lib/moduleFlags";
import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { getPlan } from "@/lib/planLimits";

// Read-only industry-template registry (see src/lib/businessTemplates.ts).
// The UI uses this to let a business pick what to track; the assistant uses
// the same registry to adapt its answers to the industry.
export async function GET(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "read")) return forbiddenScope();

  const { databases } = createAdminClient();
  const plan = await getPlan(databases, resolved.userId);
  const access = await checkModuleAccess(databases, "business_ai", { userId: resolved.userId, plan });
  if (!access.allowed) return moduleUnavailableResponse("business_ai", access);

  return Response.json({ templates: BUSINESS_TEMPLATES });
}
