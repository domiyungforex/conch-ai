import { z } from "zod";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type CreatorDoc, type AppwriteDoc } from "@/lib/db";
import { checkModuleAccess, moduleUnavailableResponse } from "@/lib/moduleFlags";
import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { getPlan } from "@/lib/planLimits";
import { completeViaGateway } from "@/lib/modelGateway";
import { routeModel } from "@/lib/aiRouter";
import { Query } from "node-appwrite";

const MAX_ROWS = 100;
const ASSISTANT_ROUTE = routeModel("creator_qa");

const AskSchema = z.object({
  question: z.string().min(1).max(1000),
});

// The "give me five TikTok ideas based on my previous songs" assistant —
// grounded in the creator's own records (songs, ideas, campaigns,
// collaborators, content) plus their brand identity.
export async function POST(req: Request, { params }: { params: Promise<{ creatorId: string }> }) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "read")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const { databases } = createAdminClient();

  const plan = await getPlan(databases, appwriteId);
  const access = await checkModuleAccess(databases, "creator_ai", { userId: appwriteId, plan });
  if (!access.allowed) return moduleUnavailableResponse("creator_ai", access);

  const rateCheck = checkRateLimit(`creator:ask:${appwriteId}`, 15, 60_000);
  if (!rateCheck.success) return rateLimitResponse(rateCheck.resetAt);

  const { creatorId } = await params;

  let creator: AppwriteDoc<CreatorDoc>;
  try {
    creator = await databases.getDocument(DB_ID, COLLECTIONS.CREATORS, creatorId) as unknown as AppwriteDoc<CreatorDoc>;
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }
  if (creator.userId !== appwriteId) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const parsed = AskSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const context = await collectCreatorContext(databases, creator, creatorId);

  const system = [
    `You are the AI creative assistant for ${creator.name}, a ${creator.stage}${creator.genre ? ` working in ${creator.genre}` : ""}.`,
    creator.brandIdentity ? `Brand identity: ${creator.brandIdentity}` : "",
    "You have access to the creator's own records below. Rules:",
    "- Base every suggestion on the records provided — previous songs, ideas, campaigns, content, and collaborators.",
    "- Never invent songs, releases, campaigns, or collaborations that aren't in the records.",
    "- When asked for ideas (e.g. content concepts), ground them in the creator's existing work and brand.",
    "- Reply in the same language the question is written in.",
    "- Be direct and concrete; number lists when a list is genuinely useful.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await completeViaGateway({
      model: ASSISTANT_ROUTE.model,
      system,
      messages: [{ role: "user", content: `${context}\n\nQuestion: ${parsed.data.question}` }],
      maxTokens: 1024,
    });

    return Response.json({ answer: result.text, provider: result.provider, usage: result.usage });
  } catch (err) {
    console.error("[creator ask] model call failed:", err);
    return new Response(JSON.stringify({ error: "The assistant is unavailable right now. Please try again." }), { status: 503 });
  }
}

async function collectCreatorContext(
  databases: ReturnType<typeof createAdminClient>["databases"],
  creator: AppwriteDoc<CreatorDoc>,
  creatorId: string
): Promise<string> {
  const sections: string[] = [
    `Creator: ${creator.name}`,
    `Stage: ${creator.stage}${creator.genre ? ` · Genre: ${creator.genre}` : ""}`,
    creator.brandIdentity ? `Brand identity: ${creator.brandIdentity}` : "",
    creator.bio ? `Bio: ${creator.bio}` : "",
  ].filter(Boolean);

  const tables: [string, string][] = [
    ["SONGS (title | status | releaseDate | producers | notes | lyrics)", COLLECTIONS.CREATOR_SONGS],
    ["IDEAS (title | description | platform | status | notes)", COLLECTIONS.CREATOR_IDEAS],
    ["CAMPAIGNS (name | goal | platform | budgetUsd | status | notes)", COLLECTIONS.CREATOR_CAMPAIGNS],
    ["COLLABORATORS (name | role | contact | notes)", COLLECTIONS.CREATOR_COLLABORATORS],
    ["CONTENT (title | platform | url | publishedAt | notes)", COLLECTIONS.CREATOR_CONTENT],
  ];

  for (const [header, collection] of tables) {
    try {
      const result = await databases.listDocuments(DB_ID, collection, [
        Query.equal("creatorId", creatorId),
        Query.orderDesc("$createdAt"),
        Query.limit(MAX_ROWS),
      ]);
      if (result.documents.length === 0) continue;
      const rows = result.documents.map((d) =>
        Object.fromEntries(Object.entries(d as Record<string, unknown>).filter(([k]) => !k.startsWith("$")))
      );
      sections.push(`${header}:\n${JSON.stringify(rows)}`);
    } catch {
      // A missing or empty sub-collection shouldn't block the assistant.
    }
  }

  const raw = sections.join("\n\n");
  return raw.length > 20_000 ? raw.slice(0, 20_000) + "\n…(truncated)" : raw;
}
