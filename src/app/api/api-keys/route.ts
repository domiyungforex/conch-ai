import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type ApiKeyDoc, type AppwriteDoc } from "@/lib/db";
import { ApiKeyCreateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { generateRandomBytes } from "@/lib/utils";
import bcrypt from "bcryptjs";
import { Query, ID } from "node-appwrite";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const appwriteId = userId;

  const { databases } = createAdminClient();
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.API_KEYS, [
    Query.equal("userId", appwriteId),
    Query.equal("isRevoked", false),
    Query.orderDesc("$createdAt"),
    Query.limit(50),
  ]);

  const apiKeys = result.documents as unknown as AppwriteDoc<ApiKeyDoc>[];
  return Response.json({ apiKeys });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const appwriteId = userId;

  const parsed = ApiKeyCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const rawBytes = generateRandomBytes(32);
  const fullKey = `cnch_${rawBytes}`;
  const keyPrefix = fullKey.slice(0, 12);
  const keyHash = await bcrypt.hash(fullKey, 10);

  const { databases } = createAdminClient();
  const apiKey = await databases.createDocument(DB_ID, COLLECTIONS.API_KEYS, ID.unique(), {
    userId: appwriteId,
    name: parsed.data.name,
    keyHash,
    keyPrefix,
    scope: parsed.data.scope,
    expiresAt: parsed.data.expiresAt ?? null,
    lastUsedAt: null,
    isRevoked: false,
  }) as unknown as AppwriteDoc<ApiKeyDoc>;

  await logAudit(appwriteId, "api_key.created", apiKey.$id, { name: parsed.data.name, scope: parsed.data.scope });

  return Response.json({ apiKey, fullKey }, { status: 201 });
}
