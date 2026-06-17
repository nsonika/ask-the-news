import { extractJsonLdArticleBody, extractParagraphsFromHtml, htmlToText } from "./html";
import type { Article, Env } from "./types";

function readTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return htmlToText(match?.[1] || "");
}

function readRawTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1] || "";
}

function parseRssItems(xml: string) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => {
    const item = match[1];
    return {
      title: readTag(item, "title") || "Untitled",
      link: readTag(item, "link"),
      pubDate: readTag(item, "pubDate"),
      description: readRawTag(item, "description"),
      content: readRawTag(item, "content:encoded"),
    };
  });
}

async function fetchArticleBody(link: string, env: Env): Promise<string> {
  if (env.FETCH_FULL_ARTICLES === "false" || !link) return "";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(env.ARTICLE_FETCH_TIMEOUT_MS || 10000));

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
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchNews(env: Env, limit = 20): Promise<Article[]> {
  const response = await fetch(env.RSS_FEED_URL || "https://techcrunch.com/feed/");
  if (!response.ok) throw new Error(`RSS fetch failed: ${response.status}`);

  const xml = await response.text();
  const now = Date.now();
  const items = parseRssItems(xml).slice(0, limit);

  return Promise.all(
    items.map(async (item, index) => {
      const rssContent = htmlToText(item.content || item.description);
      const fullArticleContent = await fetchArticleBody(item.link, env);
      const content = fullArticleContent.length > rssContent.length ? fullArticleContent : rssContent;
      const contentSnippet = htmlToText(item.description || content).slice(0, 300);
      const publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : null;

      return {
        id: `${now}-${index}`,
        title: item.title,
        contentSnippet,
        content,
        link: item.link,
        publishedAt,
        text: `${item.title}\n\n${content}`.trim(),
      };
    })
  );
}
