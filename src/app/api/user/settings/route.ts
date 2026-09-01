import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type UserDoc, type AppwriteDoc } from "@/lib/db";
import { UserSettingsUpdateSchema } from "@/lib/validators";

const DEFAULTS: Pick<
  UserDoc,
  "publicProfile" | "notifyChatSummaries" | "notifyMemoryInsights" | "notifyAgentAlerts" | "notifyWeeklyDigest" | "notifyProductUpdates" | "contextDefaultImportance" | "contextDefaultConfidence" | "contextRetentionDays" | "contextAutoArchive"
> = {
  publicProfile: false,
  notifyChatSummaries: true,
  notifyMemoryInsights: true,
  notifyAgentAlerts: false,
  notifyWeeklyDigest: true,
  notifyProductUpdates: false,
  contextDefaultImportance: 0.5,
  contextDefaultConfidence: 0.5,
  contextRetentionDays: 0,
  contextAutoArchive: false,
};

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { databases } = createAdminClient();
  let user: AppwriteDoc<UserDoc>;
  try {
    user = await databases.getDocument(DB_ID, COLLECTIONS.USERS, userId) as unknown as AppwriteDoc<UserDoc>;
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  return Response.json({
    settings: {
      publicProfile: user.publicProfile ?? DEFAULTS.publicProfile,
      notifyChatSummaries: user.notifyChatSummaries ?? DEFAULTS.notifyChatSummaries,
      notifyMemoryInsights: user.notifyMemoryInsights ?? DEFAULTS.notifyMemoryInsights,
      notifyAgentAlerts: user.notifyAgentAlerts ?? DEFAULTS.notifyAgentAlerts,
      notifyWeeklyDigest: user.notifyWeeklyDigest ?? DEFAULTS.notifyWeeklyDigest,
      notifyProductUpdates: user.notifyProductUpdates ?? DEFAULTS.notifyProductUpdates,
      contextDefaultImportance: user.contextDefaultImportance ?? DEFAULTS.contextDefaultImportance,
      contextDefaultConfidence: user.contextDefaultConfidence ?? DEFAULTS.contextDefaultConfidence,
      contextRetentionDays: user.contextRetentionDays ?? DEFAULTS.contextRetentionDays,
      contextAutoArchive: user.contextAutoArchive ?? DEFAULTS.contextAutoArchive,
    },
  });
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const parsed = UserSettingsUpdateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return new Response(JSON.stringify({ error: "No fields to update" }), { status: 400 });
  }

  const { databases } = createAdminClient();
  let user: AppwriteDoc<UserDoc>;
  try {
    user = await databases.updateDocument(DB_ID, COLLECTIONS.USERS, userId, parsed.data) as unknown as AppwriteDoc<UserDoc>;
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  return Response.json({
    settings: {
      publicProfile: user.publicProfile ?? DEFAULTS.publicProfile,
      notifyChatSummaries: user.notifyChatSummaries ?? DEFAULTS.notifyChatSummaries,
      notifyMemoryInsights: user.notifyMemoryInsights ?? DEFAULTS.notifyMemoryInsights,
      notifyAgentAlerts: user.notifyAgentAlerts ?? DEFAULTS.notifyAgentAlerts,
      notifyWeeklyDigest: user.notifyWeeklyDigest ?? DEFAULTS.notifyWeeklyDigest,
      notifyProductUpdates: user.notifyProductUpdates ?? DEFAULTS.notifyProductUpdates,
      contextDefaultImportance: user.contextDefaultImportance ?? DEFAULTS.contextDefaultImportance,
      contextDefaultConfidence: user.contextDefaultConfidence ?? DEFAULTS.contextDefaultConfidence,
      contextRetentionDays: user.contextRetentionDays ?? DEFAULTS.contextRetentionDays,
      contextAutoArchive: user.contextAutoArchive ?? DEFAULTS.contextAutoArchive,
    },
  });
}
