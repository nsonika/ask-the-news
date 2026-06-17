import { groqModel, topK } from "../config/env";
import type { ArticleChunk } from "../types/article";
import { streamGroq } from "./groq.service";
import {
  traceRagChat,
  tracedAskGroq,
  tracedBuildMessages,
  tracedEmbedQuery,
  tracedRetrieve,
} from "./tracing.service";

function publicSources(chunks: ArticleChunk[]) {
  return chunks.map(({ title, link, publishedAt, chunkIndex, score }) => ({
    title,
    link,
    publishedAt,
    chunkIndex,
    score: Number((score || 0).toFixed(4)),
  }));
}

function logRagRequest(question: string, chunks: ArticleChunk[], mode = "chat") {
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

async function answerQuestionCore(question: string) {
  const queryEmbedding = await tracedEmbedQuery(question);
  const retrieved = await tracedRetrieve(queryEmbedding, topK);

  logRagRequest(question, retrieved);

  const messages = await tracedBuildMessages(question, retrieved);
  const completion = await tracedAskGroq(messages);

  const answer = completion.choices[0]?.message?.content || "";
  console.log("Groq response received");
  console.log(`Answer: ${answer}`);

  return {
    answer,
    sources: publicSources(retrieved),
  };
}

export const answerQuestion = traceRagChat(answerQuestionCore);

export async function streamAnswer(question: string, onToken: (token: string) => void) {
  const queryEmbedding = await tracedEmbedQuery(question);
  const retrieved = await tracedRetrieve(queryEmbedding, topK);

  logRagRequest(question, retrieved, "streaming chat");

  const messages = await tracedBuildMessages(question, retrieved);
  await streamGroq(messages, onToken);

  console.log("Groq stream finished");

  return publicSources(retrieved);
}
