import { Query, ID, type Databases } from "node-appwrite";
import { DB_ID, COLLECTIONS, type FeatureFlagDoc, type ModuleFlagStatus, type AppwriteDoc } from "./db";
import { MODULE_KEYS, DEFAULT_MODULE_STATUS, type ModuleKey } from "./modules";
import type { PlanId } from "./plans";

export interface ModuleFlagContext {
  userId?: string;
  plan?: PlanId;
}

export interface ModuleFlagState {
  key: ModuleKey;
  status: ModuleFlagStatus;
  rolloutPercentage: number;
  minPlan: PlanId | null;
  allowlistUserIds: string[];
  source: "db" | "default";
}

// Short in-memory cache, same philosophy as rateLimit.ts / marketData's cache
// elsewhere in this codebase: fine to reset on redeploy, saves a DB round
// trip on every request that touches a flag-gated route without it.
const CACHE_TTL_MS = 30_000;
const cache = new Map<ModuleKey, { state: ModuleFlagState; expiresAt: number }>();

function defaultState(key: ModuleKey): ModuleFlagState {
  return { key, status: DEFAULT_MODULE_STATUS[key], rolloutPercentage: 0, minPlan: null, allowlistUserIds: [], source: "default" };
}

async function loadState(databases: Databases, key: ModuleKey): Promise<ModuleFlagState> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.state;

  let state: ModuleFlagState;
  try {
    const result = await databases.listDocuments(DB_ID, COLLECTIONS.FEATURE_FLAGS, [
      Query.equal("key", key),
      Query.limit(1),
    ]);
    const doc = result.documents[0] as unknown as AppwriteDoc<FeatureFlagDoc> | undefined;
    state = doc
      ? {
          key,
          status: doc.status,
          rolloutPercentage: doc.rolloutPercentage,
          minPlan: (doc.minPlan as PlanId | null) ?? null,
          allowlistUserIds: doc.allowlistUserIds ?? [],
          source: "db",
        }
      : defaultState(key);
  } catch {
    // Collection not migrated yet, or Appwrite unreachable — fail closed to
    // the compiled-in default rather than 500ing every flag-gated route.
    state = defaultState(key);
  }

  cache.set(key, { state, expiresAt: Date.now() + CACHE_TTL_MS });
  return state;
}

// Stable 0-99 bucket per user so the same user consistently lands in or out
// of a percentage rollout, instead of flip-flopping on every request.
function bucketFor(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return hash % 100;
}

const PLAN_RANK: Record<PlanId, number> = { free: 0, pro: 1, premium: 2 };

export async function isModuleEnabled(
  databases: Databases,
  key: ModuleKey,
  ctx: ModuleFlagContext = {}
): Promise<boolean> {
  const state = await loadState(databases, key);

  if (ctx.userId && state.allowlistUserIds.includes(ctx.userId)) return true;

  if (state.status === "disabled") return false;

  if (state.status === "enabled") {
    if (state.minPlan && ctx.plan) return PLAN_RANK[ctx.plan] >= PLAN_RANK[state.minPlan];
    return true;
  }

  // "beta" — allowlist already checked above; otherwise gated by rollout %,
  // and only ever for a known, logged-in user (no anonymous beta access).
  if (!ctx.userId) return false;
  return bucketFor(ctx.userId) < state.rolloutPercentage;
}

export async function getModuleState(databases: Databases, key: ModuleKey): Promise<ModuleFlagState> {
  return loadState(databases, key);
}

export async function getAllModuleStates(databases: Databases): Promise<ModuleFlagState[]> {
  return Promise.all(MODULE_KEYS.map((key) => loadState(databases, key)));
}

export async function setModuleStatus(
  databases: Databases,
  key: ModuleKey,
  updates: Partial<Pick<FeatureFlagDoc, "status" | "rolloutPercentage" | "minPlan" | "allowlistUserIds">>,
  actorId: string
): Promise<ModuleFlagState> {
  const existing = await databases.listDocuments(DB_ID, COLLECTIONS.FEATURE_FLAGS, [
    Query.equal("key", key),
    Query.limit(1),
  ]);
  const doc = existing.documents[0] as unknown as AppwriteDoc<FeatureFlagDoc> | undefined;

  const payload = {
    key,
    status: updates.status ?? doc?.status ?? DEFAULT_MODULE_STATUS[key],
    rolloutPercentage: updates.rolloutPercentage ?? doc?.rolloutPercentage ?? 0,
    minPlan: updates.minPlan !== undefined ? updates.minPlan : doc?.minPlan ?? null,
    allowlistUserIds: updates.allowlistUserIds ?? doc?.allowlistUserIds ?? [],
    updatedBy: actorId,
  };

  if (doc) {
    await databases.updateDocument(DB_ID, COLLECTIONS.FEATURE_FLAGS, doc.$id, payload);
  } else {
    await databases.createDocument(DB_ID, COLLECTIONS.FEATURE_FLAGS, ID.unique(), payload);
  }

  cache.delete(key);

  return {
    key,
    status: payload.status,
    rolloutPercentage: payload.rolloutPercentage,
    minPlan: payload.minPlan as PlanId | null,
    allowlistUserIds: payload.allowlistUserIds,
    source: "db",
  };
}

// The controlled response every disabled-module route returns — never a
// generic 404 (ambiguous with "doesn't exist") and never real business logic
// leaking through, per the "no fake buttons, no exposed unfinished
// functionality" rule this architecture is built around.
export function moduleUnavailableResponse(key: ModuleKey): Response {
  return new Response(
    JSON.stringify({ error: "This feature isn't available yet.", code: "MODULE_UNAVAILABLE", module: key }),
    { status: 404 }
  );
}
