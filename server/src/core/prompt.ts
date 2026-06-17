import type { ArticleChunk } from "./types";

export function buildMessages(question: string, chunks: ArticleChunk[]) {
  const context = chunks
    .map((chunk, index) => {
      return [
        `Source ${index + 1}: ${chunk.title}`,
        `Chunk: ${chunk.chunkIndex}`,
        `URL: ${chunk.link}`,
        `Published: ${chunk.publishedAt || "unknown"}`,
        chunk.text,
      ].join("\n");
    })
    .join("\n\n---\n\n");

  return [
    {
      role: "system",
      content:
        "Answer only using the provided news context. Give a clear, helpful answer in 2-4 sentences. If the context does not contain the answer, say you do not know from the provided news.",
    },
    {
      role: "user",
      content: `News context:\n${context}\n\nQuestion: ${question}`,
    },
  ];
}
