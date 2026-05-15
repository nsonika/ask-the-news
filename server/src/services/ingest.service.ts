import { embedTexts } from "./jina.service";
import { saveArticles } from "./retrieval.service";
import { fetchNews } from "./news.service";
import { chunkArticles } from "../utils/chunk";
import type { Article, ArticleChunk } from "../types/article";

export async function ingestNews(limit = 20): Promise<{
  articles: Article[];
  chunks: ArticleChunk[];
}> {
  const articles = await fetchNews(limit);
  const chunks = chunkArticles(articles);
  const embeddings = await embedTexts(chunks.map((chunk) => chunk.text));

  const embeddedChunks = chunks.map((chunk, index) => ({
    ...chunk,
    embedding: embeddings[index],
  }));

  await saveArticles(embeddedChunks, articles);
  return {
    articles,
    chunks: embeddedChunks,
  };
}
