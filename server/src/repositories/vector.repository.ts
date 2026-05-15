import { databaseUrl } from "../config/env";
import { prisma } from "../db/prisma.client";
import { cosineSimilarity } from "../utils/similarity";
import type { Article, ArticleChunk } from "../types/article";

type DbChunkRow = {
  id: string;
  article_id: string;
  chunk_index: number;
  title: string;
  content_snippet: string | null;
  link: string | null;
  published_at: Date | string | null;
  text: string;
  embedding?: string;
  score?: number | string;
};

type ArticleRow = {
  id: string;
  title: string;
  link: string | null;
  publishedAt: string | null;
  contentSnippet: string | null;
  fullContent: string | null;
  source: string;
};

function vectorToSql(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

function sqlToVector(value: string): number[] {
  return value
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .filter(Boolean)
    .map(Number);
}

function toChunk(row: DbChunkRow): ArticleChunk {
  return {
    id: row.id,
    articleId: row.article_id,
    chunkIndex: row.chunk_index,
    title: row.title,
    contentSnippet: row.content_snippet || "",
    link: row.link || "",
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
    text: row.text,
    embedding: row.embedding ? sqlToVector(row.embedding) : undefined,
    score: row.score === undefined ? undefined : Number(row.score),
  };
}

function toArticleRows(articles: Article[], chunks: ArticleChunk[]): ArticleRow[] {
  const articleMap = new Map<string, ArticleRow>();

  for (const article of articles) {
    articleMap.set(article.id, {
      id: article.id,
      title: article.title,
      link: article.link || null,
      publishedAt: article.publishedAt,
      contentSnippet: article.contentSnippet || null,
      fullContent: article.content || article.text || null,
      source: "TechCrunch",
    });
  }

  for (const chunk of chunks) {
    if (articleMap.has(chunk.articleId)) continue;
    articleMap.set(chunk.articleId, {
      id: chunk.articleId,
      title: chunk.title,
      link: chunk.link || null,
      publishedAt: chunk.publishedAt,
      contentSnippet: chunk.contentSnippet || null,
      fullContent: null,
      source: "TechCrunch",
    });
  }

  return [...articleMap.values()];
}

export async function initPostgresStore(): Promise<boolean> {
  if (!databaseUrl) return false;

  await prisma.$queryRaw`SELECT 1`;
  return true;
}

export async function countPostgresChunks(): Promise<number> {
  const result = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count FROM article_chunks
  `;
  return result[0]?.count || 0;
}

export async function savePostgresChunks(
  chunks: ArticleChunk[],
  articles: Article[] = []
): Promise<ArticleChunk[]> {
  const articleRows = toArticleRows(articles, chunks);

  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`TRUNCATE article_chunks`;
      await tx.$executeRaw`TRUNCATE articles CASCADE`;

      await tx.article.createMany({
        data: articleRows.map((article) => ({
          id: article.id,
          title: article.title,
          link: article.link,
          publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
          contentSnippet: article.contentSnippet,
          fullContent: article.fullContent,
          source: article.source,
        })),
      });

      for (const chunk of chunks) {
        if (!chunk.embedding) {
          throw new Error(`Chunk ${chunk.id} is missing an embedding`);
        }

        await tx.$executeRaw`
          INSERT INTO article_chunks (
            id,
            article_id,
            chunk_index,
            text,
            embedding
          )
          VALUES (
            ${chunk.id},
            ${chunk.articleId},
            ${chunk.chunkIndex},
            ${chunk.text},
            ${vectorToSql(chunk.embedding)}::vector
          )
        `;
      }
    },
    {
      maxWait: 10000,
      timeout: 60000,
    }
  );

  return chunks;
}

export async function searchPostgresChunks(
  queryEmbedding: number[],
  topK: number
): Promise<ArticleChunk[]> {
  const rows = await prisma.$queryRaw<DbChunkRow[]>`
    SELECT
      c.id,
      c.article_id,
      c.chunk_index,
      a.title,
      a.content_snippet,
      a.link,
      a.published_at,
      c.text,
      c.embedding::text AS embedding,
      1 - (c.embedding <=> ${vectorToSql(queryEmbedding)}::vector) AS score
    FROM article_chunks c
    JOIN articles a ON a.id = c.article_id
    ORDER BY c.embedding <=> ${vectorToSql(queryEmbedding)}::vector
    LIMIT ${topK}
  `;

  return rows.map(toChunk);
}

export async function searchPostgresChunksWithNeighbors(
  queryEmbedding: number[],
  topK: number,
  windowSize: number
): Promise<ArticleChunk[]> {
  const directMatches = await searchPostgresChunks(queryEmbedding, topK);
  const selected = new Map<string, ArticleChunk>();

  for (const match of directMatches) {
    const rows = await prisma.$queryRaw<DbChunkRow[]>`
      SELECT
        c.id,
        c.article_id,
        c.chunk_index,
        a.title,
        a.content_snippet,
        a.link,
        a.published_at,
        c.text,
        c.embedding::text AS embedding
      FROM article_chunks c
      JOIN articles a ON a.id = c.article_id
      WHERE c.article_id = ${match.articleId}
        AND c.chunk_index BETWEEN ${match.chunkIndex - windowSize} AND ${
          match.chunkIndex + windowSize
        }
      ORDER BY c.chunk_index ASC
    `;

    for (const row of rows) {
      const chunk = toChunk(row);
      if (!chunk.embedding) continue;
      selected.set(chunk.id, {
        ...chunk,
        score:
          chunk.id === match.id && match.score !== undefined
            ? match.score
            : cosineSimilarity(queryEmbedding, chunk.embedding),
      });
    }
  }

  return [...selected.values()].sort((a, b) => {
    if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
    if (a.articleId !== b.articleId) return a.articleId.localeCompare(b.articleId);
    return a.chunkIndex - b.chunkIndex;
  });
}
