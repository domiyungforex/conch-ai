import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { createAdminClient } from "@/lib/appwrite";
import {
  DB_ID,
  COLLECTIONS,
  type ContextObjectDoc,
  type AppwriteDoc,
} from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";
import { Query } from "node-appwrite";

// POST /api/v1/context/search — Semantic search across context objects
export async function POST(req: Request) {
  const auth = await resolveAuth(req);
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  if (!scopeAllows(auth.scope, "context:read")) return forbiddenScope();

  const body = await req.json().catch(() => ({}));
  const query = typeof body.query === "string" ? body.query.trim() : "";
  const topK = Math.min(20, Math.max(1, typeof body.topK === "number" ? body.topK : 10));
  const minScore = typeof body.minScore === "number" ? body.minScore : 0.3;
  const type = typeof body.type === "string" ? body.type : undefined;
  const projectId = typeof body.projectId === "string" ? body.projectId : undefined;

  if (!query) {
    return new Response(
      JSON.stringify({ error: "Query is required" }),
      { status: 400 }
    );
  }

  // Generate embedding for the query
  let queryEmbedding: number[];
  try {
    queryEmbedding = await generateEmbedding(query.slice(0, 8000));
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to generate query embedding" }),
      { status: 500 }
    );
  }

  const { databases } = createAdminClient();

  // Bounded scan: fetch candidates for this user
  const MAX_CANDIDATES = 500;
  const queries = [
    Query.equal("userId", auth.userId),
    Query.notEqual("lifecycle", "deleted"),
    Query.limit(MAX_CANDIDATES),
  ];
  if (type) queries.push(Query.equal("type", type));
  if (projectId) queries.push(Query.equal("projectId", projectId));

  const result = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.CONTEXT_OBJECTS,
    queries
  );

  const candidates = result.documents as unknown as AppwriteDoc<ContextObjectDoc>[];

  // Rank by cosine similarity
  const scored = candidates
    .map((doc) => {
      const sim = cosineSimilarity(queryEmbedding, doc.embedding ?? []);
      return { doc, score: sim };
    })
    .filter((item) => item.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return Response.json({
    results: scored.map(({ doc, score }) => ({
      context: doc,
      score,
    })),
  });
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
