import Groq from "groq-sdk";
import { groqApiKey, groqModel, topK } from "../config/env";
import { embedQuery } from "./jina.service";
import { searchArticlesWithNeighbors } from "./retrieval.service";
import type { ArticleChunk } from "../types/article";

function createGroqClient(): Groq {
  if (!groqApiKey) {
    throw new Error("Missing GROQ_API_KEY in .env");
  }

  return new Groq({ apiKey: groqApiKey });
}

function buildMessages(question: string, chunks: ArticleChunk[]) {
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
      role: "system" as const,
      content:
        "Answer only using the provided news context. Give a clear, helpful answer in 2-4 sentences. If the context does not contain the answer, say you do not know from the provided news.",
    },
    {
      role: "user" as const,
      content: `News context:\n${context}\n\nQuestion: ${question}`,
    },
  ];
}

function publicSources(chunks: ArticleChunk[]) {
  return chunks.map(({ title, link, publishedAt, chunkIndex, score }) => ({
    title,
    link,
    publishedAt,
    chunkIndex,
    score: Number((score || 0).toFixed(4)),
  }));
}

function logGroqRequest(question: string, chunks: ArticleChunk[], mode = "chat") {
  console.log(`\nCalling Groq for ${mode}`);
  console.log(`Model: ${groqModel}`);
  console.log(`Question: ${question}`);
  console.table(
    chunks.map((chunk) => ({
      score: Number((chunk.score || 0).toFixed(4)),
      chunk: chunk.chunkIndex,
      title: chunk.title,
      context: chunk.text.slice(0, 120),
    }))
  );
}

export async function answerQuestion(question: string) {
  const queryEmbedding = await embedQuery(question);
  const retrieved = await searchArticlesWithNeighbors(queryEmbedding, topK);
  const groq = createGroqClient();

  logGroqRequest(question, retrieved);

  const completion = await groq.chat.completions.create({
    model: groqModel,
    messages: buildMessages(question, retrieved),
    temperature: 0.2,
  });

  const answer = completion.choices[0]?.message?.content || "";
  console.log("Groq response received");
  console.log(`Answer: ${answer}`);

  return {
    answer,
    sources: publicSources(retrieved),
  };
}

export async function streamAnswer(question: string, onToken: (token: string) => void) {
  const queryEmbedding = await embedQuery(question);
  const retrieved = await searchArticlesWithNeighbors(queryEmbedding, topK);
  const groq = createGroqClient();

  logGroqRequest(question, retrieved, "streaming chat");

  const stream = await groq.chat.completions.create({
    model: groqModel,
    messages: buildMessages(question, retrieved),
    temperature: 0.2,
    stream: true,
  });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content;
    if (token) onToken(token);
  }

  console.log("Groq stream finished");

  return publicSources(retrieved);
}
