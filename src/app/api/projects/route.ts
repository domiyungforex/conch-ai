import { createAdminClient } from "@/lib/appwrite";
import { createProject, listProjects } from "@/lib/contextEngine";
import { ProjectCreateSchema } from "@/lib/validators";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { checkFeatureAccess, upgradeRequiredResponse, checkProjectQuota, upgradeHint } from "@/lib/planLimits";

export async function GET(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "read")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const { databases } = createAdminClient();

  const featureAccess = await checkFeatureAccess(databases, appwriteId);
  if (!featureAccess.allowed) return upgradeRequiredResponse();

  const projects = await listProjects(appwriteId);
  return Response.json({ projects, total: projects.length });
}

export async function POST(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "write")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const { databases } = createAdminClient();

  const featureAccess = await checkFeatureAccess(databases, appwriteId);
  if (!featureAccess.allowed) return upgradeRequiredResponse();

  const rateCheck = checkRateLimit(`project:create:${appwriteId}`, 10, 60_000);
  if (!rateCheck.success) return rateLimitResponse(rateCheck.resetAt);

  const parsed = ProjectCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const quota = await checkProjectQuota(databases, appwriteId);
  if (!quota.allowed) {
    return new Response(JSON.stringify({
      error: `Your plan is limited to ${quota.limit} projects. ${upgradeHint(quota.plan)} for more.`,
      code: "QUOTA_EXCEEDED",
    }), { status: 403 });
  }

  const doc = await createProject({
    userId: appwriteId,
    ...parsed.data,
  });

  return Response.json({ project: doc }, { status: 201 });
}
