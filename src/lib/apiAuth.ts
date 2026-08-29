import { auth } from "@clerk/nextjs/server";
import bcrypt from "bcryptjs";
import { Query } from "node-appwrite";
import { createAdminClient } from "./appwrite";
import { DB_ID, COLLECTIONS, type ApiKeyDoc, type ApiKeyScope, type AppwriteDoc } from "./db";

export interface ResolvedAuth {
  userId: string;
  scope: ApiKeyScope;
  viaApiKey: boolean;
}

// Accepts either a Clerk session (browser/app UI) or a "cnch_..." API key sent as
// `Authorization: Bearer cnch_...` (external/programmatic use — the whole point of
// the API keys settings page, which previously issued keys that nothing ever checked).
export async function resolveAuth(req: Request): Promise<ResolvedAuth | null> {
  const authHeader = req.headers.get("authorization");
  const bearerKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (bearerKey && bearerKey.startsWith("cnch_")) {
    return resolveApiKey(bearerKey);
  }

  const { userId } = await auth();
  if (!userId) return null;
  return { userId, scope: "FULL", viaApiKey: false };
}

async function resolveApiKey(fullKey: string): Promise<ResolvedAuth | null> {
  const keyPrefix = fullKey.slice(0, 12);
  const { databases } = createAdminClient();

  let candidates: AppwriteDoc<ApiKeyDoc>[];
  try {
    const result = await databases.listDocuments(DB_ID, COLLECTIONS.API_KEYS, [
      Query.equal("keyPrefix", keyPrefix),
      Query.equal("isRevoked", false),
      Query.limit(5), // prefix collisions should be astronomically rare, but don't assume uniqueness
    ]);
    candidates = result.documents as unknown as AppwriteDoc<ApiKeyDoc>[];
  } catch {
    return null;
  }

  for (const doc of candidates) {
    const matches = await bcrypt.compare(fullKey, doc.keyHash);
    if (!matches) continue;

    if (doc.expiresAt && new Date(doc.expiresAt) < new Date()) return null;

    // Fire-and-forget — don't block the request on updating lastUsedAt.
    databases
      .updateDocument(DB_ID, COLLECTIONS.API_KEYS, doc.$id, { lastUsedAt: new Date().toISOString() })
      .catch(() => {});

    return { userId: doc.userId, scope: doc.scope, viaApiKey: true };
  }

  return null;
}

// FULL always passes. Session logins resolve to FULL, so this only actually
// restricts anything for requests authenticated via a scoped API key.
export function scopeAllows(
  scope: ApiKeyScope,
  need: "read" | "write" | "chat" | "context:read" | "context:write" | "agents:read" | "agents:write" | "projects:read" | "projects:write" | "handoff:read" | "handoff:write"
): boolean {
  if (scope === "FULL") return true;
  if (need === "chat") return scope === "CHAT";
  if (need === "read") return scope === "MEMORY_READ" || scope === "MEMORY_WRITE";
  if (need === "write") return scope === "MEMORY_WRITE";
  if (need === "context:read") return scope === "CONTEXT_READ" || scope === "CONTEXT_WRITE";
  if (need === "context:write") return scope === "CONTEXT_WRITE";
  if (need === "agents:read") return scope === "AGENTS_READ" || scope === "AGENTS_WRITE";
  if (need === "agents:write") return scope === "AGENTS_WRITE";
  if (need === "projects:read") return scope === "PROJECTS_READ" || scope === "PROJECTS_WRITE";
  if (need === "projects:write") return scope === "PROJECTS_WRITE";
  if (need === "handoff:read") return scope === "HANDOFF_READ" || scope === "HANDOFF_WRITE";
  if (need === "handoff:write") return scope === "HANDOFF_WRITE";
  return false;
}

export function forbiddenScope(): Response {
  return new Response(JSON.stringify({ error: "This API key's scope doesn't allow this action" }), { status: 403 });
}
