import { Query, ID } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type AppwriteDoc, type MarketplaceListingDoc } from "@/lib/db";
import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { isModuleEnabled, moduleUnavailableResponse } from "@/lib/moduleFlags";
import { getPlan } from "@/lib/planLimits";
import { MarketplaceListingCreateSchema, MarketplaceListingUpdateSchema } from "@/lib/validators";

const MODULE = "marketplace" as const;

// Unlike every other module's entities, a listing is meant to be discovered
// by people other than its owner — so this can't reuse createOwnedCrud
// (whose `list` always filters to the caller's own rows). Reading is public
// (active listings only, unless you're the owner); writing is owner-only.

export async function browseListings(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "read")) return forbiddenScope();
  const { userId } = resolved;

  const { databases } = createAdminClient();
  const plan = await getPlan(databases, userId);
  if (!(await isModuleEnabled(databases, MODULE, { userId, plan }))) return moduleUnavailableResponse(MODULE);

  const rate = checkRateLimit(`marketplace:browse:${userId}`, 30, 60_000);
  if (!rate.success) return rateLimitResponse(rate.resetAt);

  const url = new URL(req.url);
  const region = url.searchParams.get("region");
  const type = url.searchParams.get("type");

  const queries = [Query.equal("status", "active"), Query.orderDesc("$createdAt"), Query.limit(50)];
  if (region) queries.push(Query.equal("region", region));
  if (type) queries.push(Query.equal("type", type));

  const result = await databases.listDocuments(DB_ID, COLLECTIONS.MARKETPLACE_LISTINGS, queries);
  return Response.json({ items: result.documents });
}

export async function myListings(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "read")) return forbiddenScope();
  const { userId } = resolved;

  const { databases } = createAdminClient();
  const plan = await getPlan(databases, userId);
  if (!(await isModuleEnabled(databases, MODULE, { userId, plan }))) return moduleUnavailableResponse(MODULE);

  const result = await databases.listDocuments(DB_ID, COLLECTIONS.MARKETPLACE_LISTINGS, [
    Query.equal("ownerId", userId),
    Query.orderDesc("$createdAt"),
    Query.limit(50),
  ]);
  return Response.json({ items: result.documents });
}

export async function createListing(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "write")) return forbiddenScope();
  const { userId } = resolved;

  const { databases } = createAdminClient();
  if (!(await isModuleEnabled(databases, MODULE, { userId }))) return moduleUnavailableResponse(MODULE);

  const rate = checkRateLimit(`marketplace:create:${userId}`, 20, 60_000);
  if (!rate.success) return rateLimitResponse(rate.resetAt);

  const parsed = MarketplaceListingCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });

  const doc = await databases.createDocument(DB_ID, COLLECTIONS.MARKETPLACE_LISTINGS, ID.unique(), {
    ...parsed.data,
    ownerId: userId,
  });
  return Response.json({ item: doc }, { status: 201 });
}

async function fetchListing(req: Request, id: string) {
  const resolved = await resolveAuth(req);
  if (!resolved) return { error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }) } as const;
  if (!scopeAllows(resolved.scope, "read")) return { error: forbiddenScope() } as const;
  const { userId } = resolved;

  const { databases } = createAdminClient();
  const plan = await getPlan(databases, userId);
  if (!(await isModuleEnabled(databases, MODULE, { userId, plan }))) return { error: moduleUnavailableResponse(MODULE) } as const;

  try {
    const doc = (await databases.getDocument(DB_ID, COLLECTIONS.MARKETPLACE_LISTINGS, id)) as unknown as AppwriteDoc<MarketplaceListingDoc>;
    return { userId, databases, doc } as const;
  } catch {
    return { error: new Response(JSON.stringify({ error: "Not found" }), { status: 404 }) } as const;
  }
}

export async function getListing(req: Request, id: string) {
  const result = await fetchListing(req, id);
  if ("error" in result) return result.error;
  const { userId, doc } = result;
  if (doc.status !== "active" && doc.ownerId !== userId) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }
  return Response.json({ item: doc });
}

export async function updateListing(req: Request, id: string) {
  const result = await fetchListing(req, id);
  if ("error" in result) return result.error;
  const { userId, databases, doc } = result;
  if (doc.ownerId !== userId) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const parsed = MarketplaceListingUpdateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });

  const updated = await databases.updateDocument(DB_ID, COLLECTIONS.MARKETPLACE_LISTINGS, id, parsed.data);
  return Response.json({ item: updated });
}

export async function deleteListing(req: Request, id: string) {
  const result = await fetchListing(req, id);
  if ("error" in result) return result.error;
  const { userId, databases, doc } = result;
  if (doc.ownerId !== userId) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  await databases.deleteDocument(DB_ID, COLLECTIONS.MARKETPLACE_LISTINGS, id);
  return new Response(null, { status: 204 });
}
