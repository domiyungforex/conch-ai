const VOYAGE_MODEL = "voyage-3.5";
export const EMBEDDING_DIMENSIONS = 1024;

export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: text.slice(0, 8000),
      output_dimension: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!res.ok) {
    throw new Error(`Voyage AI embedding request failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const embedding = data?.data?.[0]?.embedding;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error("No embedding returned from Voyage AI");
  }
  return embedding;
}
