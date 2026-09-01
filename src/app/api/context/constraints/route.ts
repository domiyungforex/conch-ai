import { createAdminClient } from "@/lib/appwrite";
import { storeConstraint, retrieveConstraints } from "@/lib/contextEngine";
import { ConstraintCreateSchema } from "@/lib/validators";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { checkFeatureAccess, upgradeRequiredResponse } from "@/lib/planLimits";

export async function GET(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "read")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const { databases } = createAdminClient();

  const featureAccess = await checkFeatureAccess(databases, appwriteId);
  if (!featureAccess.allowed) return upgradeRequiredResponse();

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") ?? undefined;
  const severity = searchParams.get("severity") as "hard" | "soft" | undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);

  const constraints = await retrieveConstraints({
    userId: appwriteId,
    projectId,
    severity,
    limit,
  });

  return Response.json({ constraints, total: constraints.length });
}

export async function POST(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "write")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const { databases } = createAdminClient();

  const featureAccess = await checkFeatureAccess(databases, appwriteId);
  if (!featureAccess.allowed) return upgradeRequiredResponse();

  const rateCheck = checkRateLimit(`constraint:create:${appwriteId}`, 20, 60_000);
  if (!rateCheck.success) return rateLimitResponse(rateCheck.resetAt);

  const parsed = ConstraintCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const doc = await storeConstraint({
    userId: appwriteId,
    ...parsed.data,
  });

  return Response.json({ constraint: doc }, { status: 201 });
}
