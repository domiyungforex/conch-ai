import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type ApiKeyDoc, type AppwriteDoc } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { checkFeatureAccess, upgradeRequiredResponse } from "@/lib/planLimits";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const appwriteId = userId;

  const { id } = await params;
  const { databases } = createAdminClient();

  const featureAccess = await checkFeatureAccess(databases, appwriteId);
  if (!featureAccess.allowed) return upgradeRequiredResponse();

  let apiKey: AppwriteDoc<ApiKeyDoc>;
  try {
    apiKey = await databases.getDocument(DB_ID, COLLECTIONS.API_KEYS, id) as unknown as AppwriteDoc<ApiKeyDoc>;
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  if (apiKey.userId !== appwriteId) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  await databases.updateDocument(DB_ID, COLLECTIONS.API_KEYS, id, { isRevoked: true });

  await logAudit(appwriteId, "api_key.revoked", id, { name: apiKey.name });

  return Response.json({ success: true });
}
