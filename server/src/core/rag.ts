import { chunkArticles } from "./chunk";
import { embedQuery, embedTexts } from "./embeddings";
import { askGroq } from "./groq";
import { fetchNews } from "./news";
import type { ArticleChunk, Env, RagRepository } from "./types";

export function publicSources(chunks: ArticleChunk[]) {
  return chunks.map(({ title, link, publishedAt, chunkIndex, score }) => ({
    title,
    link,
    publishedAt,
    chunkIndex,
    score: Number((score || 0).toFixed(4)),
  }));
}

export async function ingestNews(env: Env, repository: RagRepository, limit = 20) {
  const articles = await fetchNews(env, limit);
  const chunks = chunkArticles(articles);
  const embeddings = await embedTexts(chunks.map((chunk) => chunk.text), env);
  const embeddedChunks = chunks.map((chunk, index) => ({ ...chunk, embedding: embeddings[index] }));

  await repository.saveChunks(embeddedChunks, articles, env);

  return {
    articles,
    chunks: embeddedChunks,
  };
}

export async function searchNews(question: string, env: Env, repository: RagRepository, topK?: number) {
  const queryEmbedding = await embedQuery(question, env);
  const chunks = await repository.searchChunksWithNeighbors(
    queryEmbedding,
    env,
    topK || Number(env.TOP_K || 3)
  );

  return chunks;
}

export async function answerQuestion(question: string, env: Env, repository: RagRepository) {
  const retrieved = await searchNews(question, env, repository);
  const answer = await askGroq(question, retrieved, env);

  return {
    answer,
    sources: publicSources(retrieved),
  };
}
