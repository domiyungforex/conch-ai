import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

(async () => {
  const { generateEmbedding } = await import("../src/lib/embeddings");
  const { createAdminClient } = await import("../src/lib/appwrite");
  const { DB_ID, COLLECTIONS } = await import("../src/lib/db");
  const { Query } = await import("node-appwrite");

  const TEST_USER_ID = "test-context-engine-user";

  // Test 1: Check embedding generation
  console.log("=== Test: Embedding Generation ===\n");
  try {
    const embedding = await generateEmbedding("dark mode preference");
    console.log(`✅ Embedding generated: ${embedding.length} dimensions`);
    console.log(`   First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(", ")}]`);
  } catch (err) {
    console.log(`❌ Embedding generation failed: ${(err as Error).message}`);
  }

  // Test 2: Check Appwrite query
  console.log("\n=== Test: Appwrite Query ===\n");
  const { databases } = createAdminClient();

  try {
    const result = await databases.listDocuments(DB_ID, COLLECTIONS.CONTEXT_OBJECTS, [
      Query.equal("userId", TEST_USER_ID),
      Query.limit(10),
    ]);
    console.log(`✅ Query successful: ${result.total} documents found`);
    for (const doc of result.documents) {
      const d = doc as any;
      console.log(`   - ${d.type}: "${d.content?.slice(0, 50)}..." (embedding: ${d.embedding?.length ?? 0} dims)`);
    }
  } catch (err) {
    console.log(`❌ Query failed: ${(err as Error).message}`);
  }

  // Test 3: Manual cosine similarity test
  console.log("\n=== Test: Cosine Similarity ===\n");
  try {
    const vecA = await generateEmbedding("User prefers dark mode");
    const vecB = await generateEmbedding("dark mode preference");
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    const similarity = dotProduct / (normA * normB);
    console.log(`✅ Similarity: ${similarity.toFixed(4)} (should be high)`);
  } catch (err) {
    console.log(`❌ Similarity test failed: ${(err as Error).message}`);
  }
})();
