import type { Env } from "./types";

async function embed(input: string[], task: "retrieval.passage" | "retrieval.query", env: Env) {
  if (!env.JINA_API_KEY) throw new Error("Missing JINA_API_KEY");
  if (input.length === 0) return [];

  const response = await fetch("https://api.jina.ai/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.JINA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "jina-embeddings-v3",
      task,
      dimensions: Number(env.EMBEDDING_DIMENSIONS || 1024),
      input,
    }),
  });

  if (!response.ok) {
    throw new Error(`Jina embeddings failed: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as { data: Array<{ embedding: number[] }> };
  return payload.data.map((item) => item.embedding);
}

export function embedTexts(texts: string[], env: Env): Promise<number[][]> {
  return embed(texts, "retrieval.passage", env);
}

export async function embedQuery(question: string, env: Env): Promise<number[]> {
  const embeddings = await embed([question], "retrieval.query", env);
  return embeddings[0];
}
