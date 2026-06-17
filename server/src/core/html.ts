export function decodeHtml(value = ""): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, "-")
    .replace(/&#8212;/g, "-")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

export function htmlToText(value = ""): string {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractJsonLdArticleBody(html: string): string {
  const matches =
    html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];

  for (const scriptTag of matches) {
    const jsonText = scriptTag.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();

    try {
      const parsed = JSON.parse(jsonText) as unknown;
      const items = Array.isArray(parsed) ? parsed : [parsed];
      const article = items.find((item) => {
        return typeof item === "object" && item !== null && "articleBody" in item;
      }) as { articleBody?: string } | undefined;

      if (article?.articleBody) return htmlToText(article.articleBody);
    } catch {
      // Fall back to paragraph extraction.
    }
  }

  return "";
}

export function extractParagraphsFromHtml(html: string): string {
  const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
  const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
  const scope = articleMatch?.[0] || mainMatch?.[0] || html;

  return [...scope.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => htmlToText(match[1]))
    .filter((text) => text.length > 40)
    .join("\n\n");
}
