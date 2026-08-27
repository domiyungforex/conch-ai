import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";
import { Query } from "node-appwrite";

export const runtime = "nodejs";

// Public diagnostic endpoint — no auth required.
// Hit GET /api/health after deploying to verify all three services are reachable.
export async function GET() {
  const results: Record<string, string> = {};
  const errors: Record<string, string> = {};

  // ── Appwrite Database ─────────────────────────────────────────────────────
  try {
    const { databases } = createAdminClient();
    await databases.listDocuments(DB_ID, COLLECTIONS.USERS, [Query.limit(1)]);
    results.db = "ok";
  } catch (err) {
    results.db = "error";
    errors.db = String(err).slice(0, 150);
  }

  // ── AI provider (OpenRouter or direct Anthropic) ───────────────────────────
  const useOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const apiKeyForHealth = useOpenRouter ? process.env.OPENROUTER_API_KEY : process.env.ANTHROPIC_API_KEY;

  if (!apiKeyForHealth) {
    results.anthropic = "missing_key";
  } else {
    try {
      let res: Response;
      if (useOpenRouter) {
        // OpenRouter uses OpenAI-compatible /chat/completions format
        res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "anthropic/claude-sonnet-5",
            max_tokens: 1,
            messages: [{ role: "user", content: "hi" }],
          }),
        });
      } else {
        // Direct Anthropic API: use /messages with x-api-key
        res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": process.env.ANTHROPIC_API_KEY!,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-5",
            max_tokens: 1,
            thinking: { type: "adaptive" },
            output_config: { effort: "low" },
            messages: [{ role: "user", content: "hi" }],
          }),
        });
      }
      if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 200)}`);
      results.anthropic = "ok";
    } catch (err) {
      const msg = String(err);
      if (msg.includes("401") || msg.includes("authentication_error") || msg.includes("invalid x-api-key")) {
        results.anthropic = "invalid_key";
      } else if (msg.includes("429") || msg.includes("rate_limit")) {
        results.anthropic = "rate_limited";
      } else if (msg.includes("404") && msg.includes("model")) {
        results.anthropic = "model_not_found";
      } else {
        results.anthropic = "error";
      }
      errors.anthropic = msg.slice(0, 150);
    }
  }

  // ── Voyage AI (embeddings) ────────────────────────────────────────────────
  if (!process.env.VOYAGE_API_KEY) {
    results.voyage = "missing_key";
  } else {
    try {
      const { generateEmbedding } = await import("@/lib/embeddings");
      await generateEmbedding("health");
      results.voyage = "ok";
    } catch (err) {
      const msg = String(err);
      if (msg.includes("401") || msg.includes("403")) {
        results.voyage = "invalid_key";
      } else if (msg.includes("429")) {
        results.voyage = "rate_limited";
      } else {
        results.voyage = "error";
      }
      errors.voyage = msg.slice(0, 150);
    }
  }

  const allOk = Object.values(results).every((v) => v === "ok");

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      services: results,
      ...(Object.keys(errors).length > 0 ? { errors } : {}),
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 }
  );
}
