import type { Article, ArticleChunk } from "../types/article";

export function chunkText(text: string, maxChars = 1200, overlapChars = 100): string[] {
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) return [];
  if (cleanText.length <= maxChars) return [cleanText];

  const chunks: string[] = [];
  let start = 0;

  while (start < cleanText.length) {
    const targetEnd = Math.min(start + maxChars, cleanText.length);
    let end = targetEnd;

    if (targetEnd < cleanText.length) {
      const sentenceBreak = cleanText.lastIndexOf(". ", targetEnd);
      const spaceBreak = cleanText.lastIndexOf(" ", targetEnd);
      end = sentenceBreak > start + 200 ? sentenceBreak + 1 : spaceBreak;
    }

    if (end <= start) end = targetEnd;

    chunks.push(cleanText.slice(start, end).trim());

    if (end >= cleanText.length) break;
    start = Math.max(0, end - overlapChars);
  }

  return chunks;
}

export function chunkArticles(articles: Article[]): ArticleChunk[] {
  return articles.flatMap((article) => {
    const chunks = chunkText(article.text);

    return chunks.map((text, chunkIndex) => ({
      id: `${article.id}-chunk-${chunkIndex}`,
      articleId: article.id,
      chunkIndex,
      title: article.title,
      contentSnippet: article.contentSnippet,
      link: article.link,
      publishedAt: article.publishedAt,
      text,
    }));
  });
}
