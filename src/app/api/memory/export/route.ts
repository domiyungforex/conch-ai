import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type MemoryDoc, type AppwriteDoc } from "@/lib/db";
import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { checkFeatureAccess, upgradeRequiredResponse } from "@/lib/planLimits";
import { Query } from "node-appwrite";

const PAGE_SIZE = 100;
// Sanity cap so one accidental call can't pull an unbounded stream.
const MAX_EXPORT = 20_000;

export async function GET(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "read")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const { searchParams } = new URL(req.url);
  const includeArchived = searchParams.get("includeArchived") === "true";

  const { databases } = createAdminClient();

  const featureAccess = await checkFeatureAccess(databases, appwriteId);
  if (!featureAccess.allowed) return upgradeRequiredResponse();

  const memories: AppwriteDoc<MemoryDoc>[] = [];
  let offset = 0;
  while (memories.length < MAX_EXPORT) {
    const result = await databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES, [
      Query.equal("userId", appwriteId),
      Query.equal("isArchived", includeArchived),
      Query.orderDesc("$createdAt"),
      Query.limit(PAGE_SIZE),
      Query.offset(offset),
    ]);
    const page = result.documents as unknown as AppwriteDoc<MemoryDoc>[];
    memories.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  const exportedAt = new Date().toISOString();
  const body = JSON.stringify({ exportedAt, count: memories.length, memories }, null, 2);
  const dateStamp = exportedAt.slice(0, 10);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="conch-memories-${dateStamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
