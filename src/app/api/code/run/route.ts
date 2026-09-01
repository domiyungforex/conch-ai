import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { CodeRunSchema } from "@/lib/validators";
import { runPythonSnippet } from "@/lib/codeExecution";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { checkFeatureAccess, upgradeRequiredResponse } from "@/lib/planLimits";
import { createAdminClient } from "@/lib/appwrite";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "chat")) return forbiddenScope();
  const { userId } = resolved;

  const { databases } = createAdminClient();
  const featureAccess = await checkFeatureAccess(databases, userId);
  if (!featureAccess.allowed) return upgradeRequiredResponse();

  if (!isFeatureEnabled("codeExecution")) {
    return new Response(JSON.stringify({ error: "Code execution is temporarily unavailable." }), { status: 503 });
  }

  const rateCheck = checkRateLimit(`code:run:${userId}`, 10, 5 * 60_000);
  if (!rateCheck.success) return rateLimitResponse(rateCheck.resetAt);

  const parsed = CodeRunSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Code execution is not configured" }), { status: 503 });
  }

  try {
    const result = await runPythonSnippet(apiKey, parsed.data.code);
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Execution failed";
    return new Response(JSON.stringify({ error: message }), { status: 502 });
  }
}
