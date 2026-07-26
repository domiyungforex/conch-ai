import { Query, ID, type Databases } from "node-appwrite";
import type { ZodType } from "zod";
import { createAdminClient } from "./appwrite";
import { DB_ID, type AppwriteDoc } from "./db";
import { resolveAuth, scopeAllows, forbiddenScope } from "./apiAuth";
import { checkRateLimit, rateLimitResponse } from "./rateLimit";
import { isModuleEnabled, moduleUnavailableResponse } from "./moduleFlags";
import { getPlan } from "./planLimits";
import type { ModuleKey } from "./modules";

// Shared plumbing behind every future-module API route. Without this,
// activating 6 dormant modules with ~15 entities between them would mean
// hand-writing 15+ nearly-identical list/create/get/update/delete handlers.
// Every handler produced here: resolves auth, checks the owning module's
// feature flag (returning the controlled "unavailable" response if it's
// off), rate-limits, validates with the caller's Zod schema, and enforces
// ownership before touching a document.

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
}
function notFound() {
  return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
}
function badRequest(details?: unknown) {
  return new Response(JSON.stringify({ error: "Invalid request", details }), { status: 400 });
}

async function gate(req: Request, module: ModuleKey, rlKey: string) {
  const resolved = await resolveAuth(req);
  if (!resolved) return { error: unauthorized() } as const;
  if (!scopeAllows(resolved.scope, "write")) return { error: forbiddenScope() } as const;
  const { userId } = resolved;

  const { databases } = createAdminClient();
  const plan = await getPlan(databases, userId);
  const enabled = await isModuleEnabled(databases, module, { userId, plan });
  if (!enabled) return { error: moduleUnavailableResponse(module) } as const;

  const rate = checkRateLimit(`${rlKey}:${userId}`, 30, 60_000);
  if (!rate.success) return { error: rateLimitResponse(rate.resetAt) } as const;

  return { userId, databases } as const;
}

interface OwnedCrudConfig<TCreate, TUpdate> {
  collection: string;
  module: ModuleKey;
  createSchema: ZodType<TCreate>;
  updateSchema: ZodType<TUpdate>;
  ownerField?: string; // default "userId"
}

// For entities directly owned by the requesting user (businesses,
// opportunities, financial_accounts, marketplace_listings).
export function createOwnedCrud<TCreate extends Record<string, unknown>, TUpdate extends Record<string, unknown>>(
  config: OwnedCrudConfig<TCreate, TUpdate>
) {
  const ownerField = config.ownerField ?? "userId";

  const list = async (req: Request) => {
    const gated = await gate(req, config.module, `${config.collection}:list`);
    if ("error" in gated) return gated.error;
    const { userId, databases } = gated;

    const result = await databases.listDocuments(DB_ID, config.collection, [
      Query.equal(ownerField, userId),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ]);
    return Response.json({ items: result.documents });
  };

  const create = async (req: Request) => {
    const gated = await gate(req, config.module, `${config.collection}:create`);
    if ("error" in gated) return gated.error;
    const { userId, databases } = gated;

    const parsed = config.createSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return badRequest(parsed.error.flatten());

    const doc = await databases.createDocument(DB_ID, config.collection, ID.unique(), {
      ...parsed.data,
      [ownerField]: userId,
    });
    return Response.json({ item: doc }, { status: 201 });
  };

  const getOne = async (req: Request, id: string) => {
    const gated = await gate(req, config.module, `${config.collection}:get`);
    if ("error" in gated) return gated.error;
    const { userId, databases } = gated;

    const doc = await fetchOwned(databases, config.collection, id, ownerField, userId);
    if (!doc) return notFound();
    return Response.json({ item: doc });
  };

  const update = async (req: Request, id: string) => {
    const gated = await gate(req, config.module, `${config.collection}:update`);
    if ("error" in gated) return gated.error;
    const { userId, databases } = gated;

    const existing = await fetchOwned(databases, config.collection, id, ownerField, userId);
    if (!existing) return notFound();

    const parsed = config.updateSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return badRequest(parsed.error.flatten());

    const doc = await databases.updateDocument(DB_ID, config.collection, id, parsed.data);
    return Response.json({ item: doc });
  };

  const remove = async (req: Request, id: string) => {
    const gated = await gate(req, config.module, `${config.collection}:delete`);
    if ("error" in gated) return gated.error;
    const { userId, databases } = gated;

    const existing = await fetchOwned(databases, config.collection, id, ownerField, userId);
    if (!existing) return notFound();

    await databases.deleteDocument(DB_ID, config.collection, id);
    return new Response(null, { status: 204 });
  };

  return { list, create, getOne, update, remove };
}

async function fetchOwned(
  databases: Databases,
  collection: string,
  id: string,
  ownerField: string,
  userId: string
): Promise<AppwriteDoc<Record<string, unknown>> | null> {
  try {
    const doc = (await databases.getDocument(DB_ID, collection, id)) as unknown as AppwriteDoc<Record<string, unknown>>;
    if (doc[ownerField] !== userId) return null;
    return doc;
  } catch {
    return null;
  }
}

interface ChildCrudConfig<TCreate, TUpdate> {
  collection: string;
  module: ModuleKey;
  parentCollection: string;
  parentField: string; // e.g. "businessId" on this collection
  parentOwnerField?: string; // field on the parent doc that holds its owning userId — default "userId"
  createSchema: ZodType<TCreate>;
  updateSchema: ZodType<TUpdate>;
}

async function resolveParentOwner(
  databases: Databases,
  parentCollection: string,
  parentId: string,
  parentOwnerField: string
): Promise<string | null> {
  try {
    const doc = (await databases.getDocument(DB_ID, parentCollection, parentId)) as unknown as AppwriteDoc<Record<string, unknown>>;
    return (doc[parentOwnerField] as string) ?? null;
  } catch {
    return null;
  }
}

// For entities owned indirectly through a parent (business_customers through
// businesses, financial_transactions through financial_accounts, etc.) —
// every operation first confirms the requesting user owns the parent.
export function createChildCrud<TCreate extends Record<string, unknown>, TUpdate extends Record<string, unknown>>(
  config: ChildCrudConfig<TCreate, TUpdate>
) {
  const parentOwnerField = config.parentOwnerField ?? "userId";

  const list = async (req: Request, parentId: string) => {
    const gated = await gate(req, config.module, `${config.collection}:list`);
    if ("error" in gated) return gated.error;
    const { userId, databases } = gated;

    const owner = await resolveParentOwner(databases, config.parentCollection, parentId, parentOwnerField);
    if (owner !== userId) return notFound();

    const result = await databases.listDocuments(DB_ID, config.collection, [
      Query.equal(config.parentField, parentId),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ]);
    return Response.json({ items: result.documents });
  };

  const create = async (req: Request, parentId: string) => {
    const gated = await gate(req, config.module, `${config.collection}:create`);
    if ("error" in gated) return gated.error;
    const { userId, databases } = gated;

    const owner = await resolveParentOwner(databases, config.parentCollection, parentId, parentOwnerField);
    if (owner !== userId) return notFound();

    const parsed = config.createSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return badRequest(parsed.error.flatten());

    const doc = await databases.createDocument(DB_ID, config.collection, ID.unique(), {
      ...parsed.data,
      [config.parentField]: parentId,
    });
    return Response.json({ item: doc }, { status: 201 });
  };

  const getOne = async (req: Request, parentId: string, id: string) => {
    const gated = await gate(req, config.module, `${config.collection}:get`);
    if ("error" in gated) return gated.error;
    const { userId, databases } = gated;

    const owner = await resolveParentOwner(databases, config.parentCollection, parentId, parentOwnerField);
    if (owner !== userId) return notFound();

    const doc = await fetchChild(databases, config.collection, id, config.parentField, parentId);
    if (!doc) return notFound();
    return Response.json({ item: doc });
  };

  const update = async (req: Request, parentId: string, id: string) => {
    const gated = await gate(req, config.module, `${config.collection}:update`);
    if ("error" in gated) return gated.error;
    const { userId, databases } = gated;

    const owner = await resolveParentOwner(databases, config.parentCollection, parentId, parentOwnerField);
    if (owner !== userId) return notFound();

    const existing = await fetchChild(databases, config.collection, id, config.parentField, parentId);
    if (!existing) return notFound();

    const parsed = config.updateSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return badRequest(parsed.error.flatten());

    const doc = await databases.updateDocument(DB_ID, config.collection, id, parsed.data);
    return Response.json({ item: doc });
  };

  const remove = async (req: Request, parentId: string, id: string) => {
    const gated = await gate(req, config.module, `${config.collection}:delete`);
    if ("error" in gated) return gated.error;
    const { userId, databases } = gated;

    const owner = await resolveParentOwner(databases, config.parentCollection, parentId, parentOwnerField);
    if (owner !== userId) return notFound();

    const existing = await fetchChild(databases, config.collection, id, config.parentField, parentId);
    if (!existing) return notFound();

    await databases.deleteDocument(DB_ID, config.collection, id);
    return new Response(null, { status: 204 });
  };

  return { list, create, getOne, update, remove };
}

async function fetchChild(
  databases: Databases,
  collection: string,
  id: string,
  parentField: string,
  parentId: string
): Promise<AppwriteDoc<Record<string, unknown>> | null> {
  try {
    const doc = (await databases.getDocument(DB_ID, collection, id)) as unknown as AppwriteDoc<Record<string, unknown>>;
    if (doc[parentField] !== parentId) return null;
    return doc;
  } catch {
    return null;
  }
}

export { gate as gateModuleRequest, notFound as moduleNotFound, badRequest as moduleBadRequest };
