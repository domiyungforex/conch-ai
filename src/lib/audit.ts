import { ID } from "node-appwrite";
import { createAdminClient } from "./appwrite";
import { DB_ID, COLLECTIONS } from "./db";

// Shared audit trail for security-relevant actions: external API-key access to
// memories and API-key lifecycle events. Fire-and-forget by design — a failed
// audit write must never take down the request it's attached to.
export async function logAudit(
  actorId: string,
  action: string,
  target: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const { databases } = createAdminClient();
    await databases.createDocument(DB_ID, COLLECTIONS.AUDIT_LOGS, ID.unique(), {
      actorId,
      action,
      target,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  } catch {
    // Non-critical — never break the originating request.
  }
}
