import { neon } from "@neondatabase/serverless";
import type { Article, ArticleChunk, Env, RagRepository } from "../core/types";

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

function toChunk(row: Record<string, unknown>): ArticleChunk {
  return {
    id: String(row.id),
    articleId: String(row.article_id),
    chunkIndex: Number(row.chunk_index),
    title: String(row.title),
    contentSnippet: String(row.content_snippet || ""),
    link: String(row.link || ""),
    publishedAt: row.published_at ? new Date(String(row.published_at)).toISOString() : null,
    text: String(row.text),
    embedding: row.embedding ? sqlToVector(String(row.embedding)) : undefined,
    score: row.score === undefined ? undefined : Number(row.score),
  };
}

async function initDb(env: Env) {
  const sql = neon(env.DATABASE_URL);

  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
  await sql`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      link TEXT UNIQUE,
      published_at TIMESTAMPTZ,
      content_snippet TEXT,
      full_content TEXT,
      source TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS article_chunks (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      chunk_index INTEGER NOT NULL,
      text TEXT NOT NULL,
      embedding vector(1024) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (article_id, chunk_index)
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS article_chunks_article_idx
    ON article_chunks (article_id, chunk_index)
  `;
}

async function countChunks(env: Env): Promise<number> {
  const sql = neon(env.DATABASE_URL);
  await initDb(env);
  const rows = await sql`SELECT COUNT(*)::int AS count FROM article_chunks`;
  return Number(rows[0]?.count || 0);
}

async function saveChunks(chunks: ArticleChunk[], articles: Article[], env: Env) {
  const sql = neon(env.DATABASE_URL);

  await initDb(env);
  await sql`TRUNCATE article_chunks`;
  await sql`TRUNCATE articles CASCADE`;

  for (const article of articles) {
    await sql`
      INSERT INTO articles (id, title, link, published_at, content_snippet, full_content, source)
      VALUES (
        ${article.id},
        ${article.title},
        ${article.link || null},
        ${article.publishedAt},
        ${article.contentSnippet || null},
        ${article.content || null},
        ${"TechCrunch"}
      )
    `;
  }

  for (const chunk of chunks) {
    if (!chunk.embedding) throw new Error(`Chunk ${chunk.id} is missing an embedding`);

    await sql`
      INSERT INTO article_chunks (id, article_id, chunk_index, text, embedding)
      VALUES (
        ${chunk.id},
        ${chunk.articleId},
        ${chunk.chunkIndex},
        ${chunk.text},
        ${vectorToSql(chunk.embedding)}::vector
      )
    `;
  }
}

async function searchChunks(queryEmbedding: number[], env: Env, topK: number): Promise<ArticleChunk[]> {
  const sql = neon(env.DATABASE_URL);
  await initDb(env);
  const vector = vectorToSql(queryEmbedding);
  const rows = await sql`
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
      1 - (c.embedding <=> ${vector}::vector) AS score
    FROM article_chunks c
    JOIN articles a ON a.id = c.article_id
    ORDER BY c.embedding <=> ${vector}::vector
    LIMIT ${topK}
  `;

  return rows.map(toChunk);
}

async function searchChunksWithNeighbors(
  queryEmbedding: number[],
  env: Env,
  topK: number,
  windowSize = 1
): Promise<ArticleChunk[]> {
  const sql = neon(env.DATABASE_URL);
  const directMatches = await searchChunks(queryEmbedding, env, topK);
  const selected = new Map<string, ArticleChunk>();

  for (const match of directMatches) {
    const rows = await sql`
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
        AND c.chunk_index BETWEEN ${match.chunkIndex - windowSize} AND ${match.chunkIndex + windowSize}
      ORDER BY c.chunk_index ASC
    `;

    for (const row of rows) {
      const chunk = toChunk(row);
      selected.set(chunk.id, {
        ...chunk,
        score: chunk.id === match.id ? match.score : undefined,
      });
    }
  }

  return [...selected.values()].sort((a, b) => {
    if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
    if (a.articleId !== b.articleId) return a.articleId.localeCompare(b.articleId);
    return a.chunkIndex - b.chunkIndex;
  });
}

export const neonRepository: RagRepository = {
  countChunks,
  saveChunks,
  searchChunksWithNeighbors,
};
