import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Public diagnostic endpoint — no auth required.
// Hit GET /api/health after deploying to verify all three services are reachable.
export async function GET() {
  const results: Record<string, string> = {};
  const errors: Record<string, string> = {};

  // ── Database ─────────────────────────────────────────────────────────────
  try {
    await prisma.$queryRaw`SELECT 1`;
    results.db = "ok";
  } catch (err) {
    results.db = "error";
    errors.db = String(err).slice(0, 150);
  }

  // ── OpenAI ───────────────────────────────────────────────────────────────
  if (!process.env.OPENAI_API_KEY) {
    results.openai = "missing_key";
  } else {
    try {
      const { OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      // Minimal call: 8-dim embedding to keep token cost near zero
      await client.embeddings.create({ model: "text-embedding-3-small", input: "health", dimensions: 8 });
      results.openai = "ok";
    } catch (err) {
      const msg = String(err);
      if (msg.includes("401") || msg.includes("invalid_api_key") || msg.includes("Incorrect API key")) {
        results.openai = "invalid_key";
      } else if (msg.includes("429") || msg.includes("rate_limit")) {
        results.openai = "rate_limited";
      } else if (msg.includes("404") && msg.includes("model")) {
        results.openai = "model_not_found";
      } else {
        results.openai = "error";
      }
      errors.openai = msg.slice(0, 150);
    }
  }

  // ── Pinecone ─────────────────────────────────────────────────────────────
  if (!process.env.PINECONE_API_KEY) {
    results.pinecone = "missing_key";
  } else {
    try {
      const { Pinecone } = await import("@pinecone-database/pinecone");
      const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
      const indexName = process.env.PINECONE_INDEX_NAME ?? "conch-memories";
      await pc.index(indexName).describeIndexStats();
      results.pinecone = "ok";
    } catch (err) {
      results.pinecone = "error";
      errors.pinecone = String(err).slice(0, 150);
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
