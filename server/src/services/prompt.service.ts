import { PromptTemplate } from "@langchain/core/prompts";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import type { ArticleChunk } from "../types/article";

const userPrompt = PromptTemplate.fromTemplate(
  "News context:\n{context}\n\nQuestion: {question}"
);

export async function buildMessages(
  question: string,
  chunks: ArticleChunk[]
): Promise<ChatCompletionMessageParam[]> {
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

  const userContent = await userPrompt.format({ context, question });

  return [
    {
      role: "system",
      content:
        "Answer only using the provided news context. Give a clear, helpful answer in 2-4 sentences. If the context does not contain the answer, say you do not know from the provided news.",
    },
    {
      role: "user",
      content: userContent,
    },
  ];
}
