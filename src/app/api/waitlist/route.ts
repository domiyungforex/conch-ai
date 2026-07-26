import { auth } from "@clerk/nextjs/server";
import { ID } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { WaitlistJoinSchema } from "@/lib/validators";
import { MODULE_KEYS, type ModuleKey } from "@/lib/modules";

// Not module-gated — collecting demand signal for a locked feature has to
// work precisely when that feature is off. This is the "track demand
// without activating the expensive backend" mechanism the whole locked-UX
// pattern depends on.
export async function POST(req: Request) {
  const { userId } = await auth();

  const rateKey = userId ?? req.headers.get("x-forwarded-for") ?? "anonymous";
  const rate = checkRateLimit(`waitlist:${rateKey}`, 5, 60_000);
  if (!rate.success) return rateLimitResponse(rate.resetAt);

  const parsed = WaitlistJoinSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }
  if (!MODULE_KEYS.includes(parsed.data.module as ModuleKey)) {
    return new Response(JSON.stringify({ error: "Unknown module" }), { status: 400 });
  }

  const { databases } = createAdminClient();
  const doc = await databases.createDocument(DB_ID, COLLECTIONS.WAITLIST, ID.unique(), {
    userId: userId ?? null,
    email: parsed.data.email,
    module: parsed.data.module,
    note: parsed.data.note ?? null,
  });

  return Response.json({ item: doc }, { status: 201 });
}
