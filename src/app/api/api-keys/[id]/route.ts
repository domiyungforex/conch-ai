import { auth, createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type ApiKeyDoc, type AppwriteDoc } from "@/lib/db";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: appwriteId } = await auth();
  if (!appwriteId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { id } = await params;
  const { databases } = createAdminClient();

  let apiKey: AppwriteDoc<ApiKeyDoc>;
  try {
    apiKey = await databases.getDocument(DB_ID, COLLECTIONS.API_KEYS, id) as unknown as AppwriteDoc<ApiKeyDoc>;
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  if (apiKey.userId !== appwriteId) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  await databases.updateDocument(DB_ID, COLLECTIONS.API_KEYS, id, { isRevoked: true });
  return Response.json({ success: true });
}
