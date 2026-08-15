import { z } from "zod";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type BusinessDoc, type AppwriteDoc } from "@/lib/db";
import { getBusinessTemplate } from "@/lib/businessTemplates";
import { checkModuleAccess, moduleUnavailableResponse } from "@/lib/moduleFlags";
import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { getPlan } from "@/lib/planLimits";
import { completeViaGateway } from "@/lib/modelGateway";
import { routeModel } from "@/lib/aiRouter";
import { Query } from "node-appwrite";

// Business records are bounded before being handed to the model so the prompt
// stays small, cheap, and fast — this is a record-keeping assistant, not a
// full data warehouse.
const MAX_ROWS = 100;
const ASSISTANT_ROUTE = routeModel("business_qa");

const AskSchema = z.object({
  question: z.string().min(1).max(1000),
});

export async function POST(req: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "read")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const { databases } = createAdminClient();

  const plan = await getPlan(databases, appwriteId);
  const access = await checkModuleAccess(databases, "business_ai", { userId: appwriteId, plan });
  if (!access.allowed) return moduleUnavailableResponse("business_ai", access);

  const rateCheck = checkRateLimit(`business:ask:${appwriteId}`, 15, 60_000);
  if (!rateCheck.success) return rateLimitResponse(rateCheck.resetAt);

  const { businessId } = await params;

  let business: AppwriteDoc<BusinessDoc>;
  try {
    business = await databases.getDocument(DB_ID, COLLECTIONS.BUSINESSES, businessId) as unknown as AppwriteDoc<BusinessDoc>;
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }
  // Same ownership rule as every other business route — never answer about a
  // business the caller doesn't own.
  if (business.userId !== appwriteId) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const parsed = AskSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const context = await collectBusinessContext(databases, business, businessId);

  const template = getBusinessTemplate(business.template);
  const system = [
    `You are the AI assistant for ${business.name}, a business in the ${business.industry || "unspecified"} industry.`,
    template
      ? `This business follows the "${template.label}" template — what it tracks: ${template.whatToTrack.join(", ")}.`
      : "No industry template is set — answer from the records provided.",
    `You have access to the business's own records below. Rules:`,
    `- Answer the question from the records provided. If the records don't contain what's needed, say so plainly and suggest what to record.`,
    `- Never invent customers, suppliers, orders, prices, or amounts.`,
    `- Do simple sums/compilations directly from the records (totals, counts, who's missing, fastest supplier, etc.).`,
    `- Reply in the same language the question is written in.`,
    `- Be direct and concise; use short bullet lists when a list is genuinely useful.`,
  ].join("\n");

  try {
    const result = await completeViaGateway({
      model: ASSISTANT_ROUTE.model,
      system,
      messages: [{ role: "user", content: `${context}\n\nQuestion: ${parsed.data.question}` }],
      maxTokens: 1024,
    });

    return Response.json({
      answer: result.text,
      provider: result.provider,
      usage: result.usage,
    });
  } catch (err) {
    console.error("[business ask] model call failed:", err);
    return new Response(JSON.stringify({ error: "The assistant is unavailable right now. Please try again." }), { status: 503 });
  }
}

async function collectBusinessContext(
  databases: ReturnType<typeof createAdminClient>["databases"],
  business: AppwriteDoc<BusinessDoc>,
  businessId: string
): Promise<string> {
  const sections: string[] = [
    `Business: ${business.name}`,
    business.description ? `Description: ${business.description}` : "",
    `Industry: ${business.industry || "unspecified"}`,
    `Currency: ${business.currency} · Region: ${business.region}`,
  ].filter(Boolean);

  const tables: [string, string][] = [
    ["CUSTOMERS (name | email | phone | notes | totalSpentUsd)", COLLECTIONS.BUSINESS_CUSTOMERS],
    ["SUPPLIERS (name | contact | notes)", COLLECTIONS.BUSINESS_SUPPLIERS],
    ["PRODUCTS (name | sku | priceUsd | costUsd | category)", COLLECTIONS.BUSINESS_PRODUCTS],
    ["ORDERS (status | totalUsd | orderedAt | itemsJson)", COLLECTIONS.BUSINESS_ORDERS],
    ["INVENTORY (productId | quantity | reorderThreshold | location)", COLLECTIONS.BUSINESS_INVENTORY],
    ["EXPENSES (category | amountUsd | incurredAt | notes)", COLLECTIONS.BUSINESS_EXPENSES],
    ["REVENUE (source | amountUsd | receivedAt | notes)", COLLECTIONS.BUSINESS_REVENUES],
  ];

  for (const [header, collection] of tables) {
    try {
      const result = await databases.listDocuments(DB_ID, collection, [
        Query.equal("businessId", businessId),
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
  // Hard cap keeps the prompt bounded even with 100 rows in every table.
  return raw.length > 20_000 ? raw.slice(0, 20_000) + "\n…(truncated)" : raw;
}
