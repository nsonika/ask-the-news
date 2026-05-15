import { jinaApiKey } from "../config/env";

const JINA_EMBEDDINGS_URL = "https://api.jina.ai/v1/embeddings";

type JinaEmbeddingResponse = {
  data: Array<{ embedding: number[] }>;
};

async function callJina(input: string[], task: "retrieval.passage" | "retrieval.query") {
  if (!jinaApiKey) {
    throw new Error("Missing JINA_API_KEY in .env");
  }

  const response = await fetch(JINA_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jinaApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "jina-embeddings-v3",
      task,
      normalized: true,
      embedding_type: "float",
      input,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Jina embeddings failed: ${response.status} ${body}`);
  }

  const result = (await response.json()) as JinaEmbeddingResponse;
  return result.data.map((item) => item.embedding);
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  return callJina(texts, "retrieval.passage");
}

export async function embedQuery(question: string): Promise<number[]> {
  const embeddings = await callJina([question], "retrieval.query");
  return embeddings[0];
}
