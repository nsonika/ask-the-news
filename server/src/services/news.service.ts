import Parser from "rss-parser";
import { articleFetchTimeoutMs, fetchFullArticles, rssFeedUrl } from "../config/env";
import type { Article } from "../types/article";

const parser = new Parser();

function decodeHtml(value = ""): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8212;/g, "-")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function htmlToText(value = ""): string {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractJsonLdArticleBody(html: string): string {
  const matches =
    html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];

  for (const scriptTag of matches) {
    const jsonText = scriptTag
      .replace(/<script[^>]*>/i, "")
      .replace(/<\/script>/i, "")
      .trim();

    try {
      const parsed = JSON.parse(jsonText) as unknown;
      const items = Array.isArray(parsed) ? parsed : [parsed];
      const article = items.find((item) => {
        return typeof item === "object" && item !== null && "articleBody" in item;
      }) as { articleBody?: string } | undefined;

      if (article?.articleBody) return htmlToText(article.articleBody);
    } catch {
      // Some pages have JSON-LD that is not parseable. Paragraph extraction is next.
    }
  }

  return "";
}

function extractParagraphsFromHtml(html: string): string {
  const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
  const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
  const scope = articleMatch?.[0] || mainMatch?.[0] || html;

  return [...scope.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => htmlToText(match[1]))
    .filter((text) => text.length > 40)
    .join("\n\n");
}

async function fetchArticleBody(link: string): Promise<string> {
  if (!fetchFullArticles || !link) return "";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), articleFetchTimeoutMs);

  try {
    const response = await fetch(link, {
      signal: controller.signal,
      headers: {
        "User-Agent": "AskTheNewsBot/1.0",
        Accept: "text/html",
      },
    });

    if (!response.ok) return "";

    const html = await response.text();
    const jsonLdBody = extractJsonLdArticleBody(html);
    const paragraphBody = extractParagraphsFromHtml(html);

    return paragraphBody.length > jsonLdBody.length ? paragraphBody : jsonLdBody;
  } catch (error) {
    console.warn(`Could not fetch full article: ${link}`);
    console.warn(error instanceof Error ? error.message : error);
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchNews(limit = 20): Promise<Article[]> {
  const feed = await parser.parseURL(rssFeedUrl);
  const now = Date.now();

  return Promise.all(
    feed.items.slice(0, limit).map(async (item, index) => {
      const title = item.title || "Untitled";
      const rawContent =
        item["content:encoded" as keyof typeof item] ||
        item.content ||
        item.summary ||
        item.contentSnippet ||
        "";
      const link = item.link || "";
      const rssContent = htmlToText(String(rawContent));
      const fullArticleContent = await fetchArticleBody(link);
      const content =
        fullArticleContent.length > rssContent.length ? fullArticleContent : rssContent;
      const contentSnippet = htmlToText(item.contentSnippet || content).slice(0, 300);
      const publishedAt = item.isoDate || item.pubDate || null;

      return {
        id: `${now}-${index}`,
        title,
        contentSnippet,
        content,
        link,
        publishedAt,
        text: `${title}\n\n${content}`.trim(),
      };
    })
  );
}
