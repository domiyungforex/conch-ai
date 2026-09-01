import { Query } from "node-appwrite";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type UserDoc } from "@/lib/db";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

countries.registerLocale(en);

// Bounds the brute-force scan below Appwrite's max query limit, same
// tradeoff as retrieveRelevantMemories in src/lib/memory.ts.
const MAX_CANDIDATES = 1000;

// Public and unauthenticated by design — this backs a page meant to be
// shared/linked externally. Only ever returns a country and a count, never
// email/name/anything from an individual document, so exposing it with no
// auth doesn't leak anything beyond what the /community page itself shows.
export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success, resetAt } = checkRateLimit(`stats:users:${ip}`, 30, 60_000);
  if (!success) return rateLimitResponse(resetAt);

  const { databases } = createAdminClient();

  const result = await databases.listDocuments(DB_ID, COLLECTIONS.USERS, [
    Query.select(["country"]),
    Query.limit(MAX_CANDIDATES),
  ]);

  const counts = new Map<string, number>();
  for (const doc of result.documents as unknown as Pick<UserDoc, "country">[]) {
    const code = doc.country ?? "unknown";
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }

  // numericId matches world-atlas's topojson feature ids (UN M49 numeric
  // codes) so the map component can join without doing its own ISO lookup.
  const countryStats = Array.from(counts.entries())
    .map(([alpha2, count]) => ({
      code: alpha2,
      name: alpha2 === "unknown" ? "Unknown" : (countries.getName(alpha2, "en") ?? alpha2),
      numericId: alpha2 === "unknown" ? null : (countries.alpha2ToNumeric(alpha2) ?? null),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return Response.json(
    { total: result.total, countries: countryStats, updatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
