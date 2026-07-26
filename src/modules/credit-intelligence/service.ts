import { Query, ID, type Databases } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type AppwriteDoc, type CreditProfileDoc, type BusinessDoc } from "@/lib/db";
import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { isModuleEnabled, moduleUnavailableResponse } from "@/lib/moduleFlags";
import { getPlan } from "@/lib/planLimits";
import { CreditProfileConsentSchema } from "@/lib/validators";

const MODULE = "credit_intelligence" as const;

const DISCLAIMER =
  "This is not a credit score and is not used for any lending decision. It is an opt-in summary of information you've " +
  "provided about your own business, intended to help you understand your own financial health. Conch does not make " +
  "lending decisions and is not a credit bureau.";

async function ownsBusiness(databases: Databases, businessId: string, userId: string): Promise<boolean> {
  try {
    const doc = (await databases.getDocument(DB_ID, COLLECTIONS.BUSINESSES, businessId)) as unknown as AppwriteDoc<BusinessDoc>;
    return doc.userId === userId;
  } catch {
    return false;
  }
}

// Get-or-null — a business with no profile yet just means consent hasn't
// been given. Never auto-creates one; see grantConsent below.
export async function getProfile(req: Request, businessId: string) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "read")) return forbiddenScope();
  const { userId } = resolved;

  const { databases } = createAdminClient();
  const plan = await getPlan(databases, userId);
  if (!(await isModuleEnabled(databases, MODULE, { userId, plan }))) return moduleUnavailableResponse(MODULE);
  if (!(await ownsBusiness(databases, businessId, userId))) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const result = await databases.listDocuments(DB_ID, COLLECTIONS.CREDIT_PROFILES, [
    Query.equal("businessId", businessId),
    Query.limit(1),
  ]);
  const doc = result.documents[0] as unknown as AppwriteDoc<CreditProfileDoc> | undefined;
  return Response.json({ item: doc ?? null });
}

// Consent is the only way a credit_profiles row ever gets created — no
// scoring, no data collection, no algorithm here. This just records that
// the business owner opted in; what (if anything) ever populates
// dataPointsJson is explicitly out of scope until Financial Intelligence
// is real and a legal review has happened (see modules.ts activation
// criteria). generatedAt stays null until that exists.
export async function grantConsent(req: Request, businessId: string) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "write")) return forbiddenScope();
  const { userId } = resolved;

  const { databases } = createAdminClient();
  if (!(await isModuleEnabled(databases, MODULE, { userId }))) return moduleUnavailableResponse(MODULE);
  if (!(await ownsBusiness(databases, businessId, userId))) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const rate = checkRateLimit(`credit_profiles:consent:${userId}`, 10, 60_000);
  if (!rate.success) return rateLimitResponse(rate.resetAt);

  const parsed = CreditProfileConsentSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });

  const existing = await databases.listDocuments(DB_ID, COLLECTIONS.CREDIT_PROFILES, [
    Query.equal("businessId", businessId),
    Query.limit(1),
  ]);
  const existingDoc = existing.documents[0] as unknown as AppwriteDoc<CreditProfileDoc> | undefined;
  if (existingDoc) return Response.json({ item: existingDoc });

  const doc = await databases.createDocument(DB_ID, COLLECTIONS.CREDIT_PROFILES, ID.unique(), {
    businessId,
    dataPointsJson: "{}",
    disclaimer: DISCLAIMER,
    consentGiven: true,
    consentAt: new Date().toISOString(),
    generatedAt: null,
  });
  return Response.json({ item: doc }, { status: 201 });
}
