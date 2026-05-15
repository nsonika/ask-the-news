import fs from "node:fs/promises";
import path from "node:path";
import { databaseUrl } from "../config/env";
import { cosineSimilarity } from "../utils/similarity";
import {
  countPostgresChunks,
  initPostgresStore,
  savePostgresChunks,
  searchPostgresChunks,
  searchPostgresChunksWithNeighbors,
} from "../repositories/vector.repository";
import type { Article, ArticleChunk } from "../types/article";

const STORE_PATH = path.join(__dirname, "..", "..", "data", "articles.json");

let chunks: ArticleChunk[] = [];

function normalizeChunk(record: ArticleChunk, index: number): ArticleChunk {
  return {
    ...record,
    id: record.id || `${record.articleId || "article"}-chunk-${record.chunkIndex || index}`,
    articleId: record.articleId || record.id || `article-${index}`,
    chunkIndex: Number.isInteger(record.chunkIndex) ? record.chunkIndex : 0,
  };
}

export async function loadArticles(): Promise<ArticleChunk[]> {
  if (databaseUrl) {
    await initPostgresStore();
    chunks = [];
    return chunks;
  }

  try {
    const file = await fs.readFile(STORE_PATH, "utf8");
    chunks = (JSON.parse(file) as ArticleChunk[]).map(normalizeChunk);
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
      throw error;
    }
    chunks = [];
  }

  return chunks;
}

export async function saveArticles(
  nextChunks: ArticleChunk[],
  sourceArticles: Article[] = []
): Promise<ArticleChunk[]> {
  chunks = nextChunks.map(normalizeChunk);

  if (databaseUrl) {
    return savePostgresChunks(chunks, sourceArticles);
  }

  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(chunks, null, 2));
  return chunks;
}

export async function getArticleCount(): Promise<number> {
  if (databaseUrl) {
    return countPostgresChunks();
  }

  return chunks.length;
}

export async function searchArticles(queryEmbedding: number[], topK = 3): Promise<ArticleChunk[]> {
  if (databaseUrl) {
    return searchPostgresChunks(queryEmbedding, topK);
  }

  return chunks
    .map((chunk) => ({
      ...chunk,
      score: chunk.embedding ? cosineSimilarity(queryEmbedding, chunk.embedding) : 0,
    }))
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, topK);
}

export async function searchArticlesWithNeighbors(
  queryEmbedding: number[],
  topK = 3,
  windowSize = 1
): Promise<ArticleChunk[]> {
  if (databaseUrl) {
    return searchPostgresChunksWithNeighbors(queryEmbedding, topK, windowSize);
  }

  const directMatches = await searchArticles(queryEmbedding, topK);
  const selected = new Map<string, ArticleChunk>();

  for (const match of directMatches) {
    const neighbors = chunks.filter((chunk) => {
      return (
        chunk.articleId === match.articleId &&
        Math.abs(chunk.chunkIndex - match.chunkIndex) <= windowSize
      );
    });

    for (const neighbor of neighbors) {
      selected.set(neighbor.id, {
        ...neighbor,
        score:
          neighbor.id === match.id && match.score !== undefined
            ? match.score
            : neighbor.embedding
              ? cosineSimilarity(queryEmbedding, neighbor.embedding)
              : 0,
      });
    }
  }

  return [...selected.values()].sort((a, b) => {
    if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
    if (a.articleId !== b.articleId) return a.articleId.localeCompare(b.articleId);
    return a.chunkIndex - b.chunkIndex;
  });
}

export { cosineSimilarity };
