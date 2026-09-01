import { Query, ID } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type AppwriteDoc, type EconomicSignalDoc } from "@/lib/db";
import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { checkModuleAccess, moduleUnavailableResponse } from "@/lib/moduleFlags";
import { getPlan } from "@/lib/planLimits";
import { isAdmin, forbiddenAdmin } from "@/lib/admin";
import { EconomicSignalCreateSchema } from "@/lib/validators";

const MODULE = "economic_intelligence" as const;

// economic_signals is platform-level data, not per-user — every signal
// carries its own source/confidence/methodology (see modules.ts's mandate:
// never present analysis as certainty, never fabricate market data). Reading
// is open to any user once the module is enabled for them; writing is
// admin-only until there's a real, permitted data pipeline behind this.

export async function listSignals(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "read")) return forbiddenScope();
  const { userId } = resolved;

  const { databases } = createAdminClient();
  const plan = await getPlan(databases, userId);
  const access = await checkModuleAccess(databases, MODULE, { userId, plan });
  if (!access.allowed) return moduleUnavailableResponse(MODULE, access);

  const rate = checkRateLimit(`economic_signals:list:${userId}`, 30, 60_000);
  if (!rate.success) return rateLimitResponse(rate.resetAt);

  const url = new URL(req.url);
  const region = url.searchParams.get("region");
  const queries = [Query.orderDesc("$createdAt"), Query.limit(50)];
  if (region) queries.unshift(Query.equal("region", region));

  const result = await databases.listDocuments(DB_ID, COLLECTIONS.ECONOMIC_SIGNALS, queries);
  return Response.json({ items: result.documents });
}

export async function createSignal(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "write")) return forbiddenScope();
  const { userId } = resolved;
  if (!isAdmin(userId)) return forbiddenAdmin();

  const { databases } = createAdminClient();
  const plan = await getPlan(databases, userId);
  const createAccess = await checkModuleAccess(databases, MODULE, { userId, plan });
  if (!createAccess.allowed) return moduleUnavailableResponse(MODULE, createAccess);

  const parsed = EconomicSignalCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });

  const doc = await databases.createDocument(DB_ID, COLLECTIONS.ECONOMIC_SIGNALS, ID.unique(), {
    ...parsed.data,
    createdBy: userId,
  });
  return Response.json({ item: doc }, { status: 201 });
}

export async function getSignal(req: Request, id: string) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "read")) return forbiddenScope();
  const { userId } = resolved;

  const { databases } = createAdminClient();
  const plan = await getPlan(databases, userId);
  const getAccess = await checkModuleAccess(databases, MODULE, { userId, plan });
  if (!getAccess.allowed) return moduleUnavailableResponse(MODULE, getAccess);

  try {
    const doc = (await databases.getDocument(DB_ID, COLLECTIONS.ECONOMIC_SIGNALS, id)) as unknown as AppwriteDoc<EconomicSignalDoc>;
    return Response.json({ item: doc });
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }
}
