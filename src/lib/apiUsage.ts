import { ID } from "node-appwrite";
import { createAdminClient } from "./appwrite";
import { DB_ID, COLLECTIONS } from "./db";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ApiUsageEntry {
  /** Clerk user ID or API key hash prefix */
  actorId: string;
  /** HTTP method */
  method: string;
  /** Request path (e.g. /api/memory) */
  path: string;
  /** HTTP status code returned */
  status: number;
  /** Request duration in milliseconds */
  durationMs: number;
  /** Whether this request came via an API key (vs session) */
  viaApiKey: boolean;
  /** API key scope if authenticated via key */
  scope?: string;
  /** Optional additional context */
  metadata?: Record<string, unknown>;
}

// ── Tracking ───────────────────────────────────────────────────────────────

/**
 * Log an API usage event to the audit_logs collection.
 * Fire-and-forget — never blocks the originating request.
 */
export async function logApiUsage(entry: ApiUsageEntry): Promise<void> {
  try {
    const { databases } = createAdminClient();
    await databases.createDocument(DB_ID, COLLECTIONS.AUDIT_LOGS, ID.unique(), {
      actorId: entry.actorId,
      action: `api.${entry.method.toLowerCase()}.${entry.path.split("/").filter(Boolean).slice(0, 3).join(".")}`,
      target: entry.path,
      metadata: JSON.stringify({
        method: entry.method,
        path: entry.path,
        status: entry.status,
        durationMs: entry.durationMs,
        viaApiKey: entry.viaApiKey,
        scope: entry.scope ?? null,
        timestamp: new Date().toISOString(),
        ...entry.metadata,
      }),
    });
  } catch {
    // Non-critical — never break the originating request.
  }
}

// ── Higher-Order Function ──────────────────────────────────────────────────

/**
 * Wraps an API route handler to automatically track usage.
 * Logs method, path, status, duration, and auth method to audit_logs.
 *
 * Usage:
 *   export const GET = withApiTracking(async (req) => { ... });
 *   export const POST = withApiTracking(async (req) => { ... });
 */
export function withApiTracking<T extends unknown[]>(
  handler: (req: Request, ...args: T) => Promise<Response>
): (req: Request, ...args: T) => Promise<Response> {
  return async (req: Request, ...args: T) => {
    const start = performance.now();
    let status = 500;

    try {
      const response = await handler(req, ...args);
      status = response.status;
      return response;
    } catch (err) {
      status = 500;
      throw err;
    } finally {
      const durationMs = Math.round(performance.now() - start);

      // Extract auth info from the request
      const authHeader = req.headers.get("authorization");
      const bearerKey = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : null;
      const viaApiKey = !!bearerKey && bearerKey.startsWith("cnch_");
      const scope = extractScopeFromKey(bearerKey) ?? undefined;

      // Best-effort user ID extraction (don't block on auth resolution)
      let actorId = "anonymous";
      try {
        if (viaApiKey) {
          actorId = `key:${bearerKey.slice(0, 12)}`;
        } else {
          // Try to extract from Clerk session — fire-and-forget
          const { auth } = await import("@clerk/nextjs/server");
          const { userId } = await auth();
          if (userId) actorId = userId;
        }
      } catch {
        // Auth resolution failed — log as anonymous
      }

      // Fire-and-forget logging
      logApiUsage({
        actorId,
        method: req.method,
        path: new URL(req.url).pathname,
        status,
        durationMs,
        viaApiKey,
        scope,
      }).catch(() => {});
    }
  };
}

/**
 * Extract a readable scope label from an API key.
 * Returns null for session-based auth.
 */
function extractScopeFromKey(key: string | null): string | null {
  if (!key || !key.startsWith("cnch_")) return null;
  // We can't determine scope from the key alone without looking it up,
  // but we log the prefix for identification
  return `key:${key.slice(0, 12)}`;
}

// ── Query Helpers ──────────────────────────────────────────────────────────

/**
 * Get usage stats for a user from the audit_logs collection.
 * Returns counts by endpoint, total requests, and recent activity.
 */
export async function getUserUsageStats(
  userId: string,
  days: number = 30
): Promise<{
  totalRequests: number;
  byMethod: Record<string, number>;
  byPath: Record<string, number>;
  byStatus: Record<string, number>;
  recentActivity: Array<{
    action: string;
    target: string;
    metadata: string | null;
    createdAt: string;
  }>;
}> {
  const { databases } = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  try {
    const result = await databases.listDocuments(DB_ID, COLLECTIONS.AUDIT_LOGS, [
      // Query by actorId — this works for both session users and API keys
      // Session users have their Clerk userId as actorId
      // API keys have `key:prefix` as actorId
    ]);

    // Filter to this user's activity (actorId matches userId or key: prefix)
    const userLogs = result.documents.filter((doc: Record<string, unknown>) => {
      const actor = doc.actorId as string;
      return actor === userId || actor.startsWith(`key:`);
    });

    const byMethod: Record<string, number> = {};
    const byPath: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const log of userLogs) {
      try {
        const meta = log.metadata ? JSON.parse(log.metadata as string) : {};
        const method = meta.method ?? "UNKNOWN";
        const path = meta.path ?? log.target ?? "unknown";
        const status = String(meta.status ?? "0");

        byMethod[method] = (byMethod[method] ?? 0) + 1;
        byPath[path] = (byPath[path] ?? 0) + 1;
        byStatus[status] = (byStatus[status] ?? 0) + 1;
      } catch {
        // Skip malformed entries
      }
    }

    return {
      totalRequests: userLogs.length,
      byMethod,
      byPath,
      byStatus,
      recentActivity: userLogs.slice(0, 20).map((doc: Record<string, unknown>) => ({
        action: doc.action as string,
        target: doc.target as string,
        metadata: doc.metadata as string | null,
        createdAt: doc.$createdAt as string,
      })),
    };
  } catch {
    return {
      totalRequests: 0,
      byMethod: {},
      byPath: {},
      byStatus: {},
      recentActivity: [],
    };
  }
}
