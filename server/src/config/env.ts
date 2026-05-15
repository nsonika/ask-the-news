import "dotenv/config";

export const port = Number(process.env.PORT || 3000);
export const jinaApiKey = process.env.JINA_API_KEY;
export const groqApiKey = process.env.GROQ_API_KEY;
export const groqModel = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
export const rssFeedUrl = process.env.RSS_FEED_URL || "https://techcrunch.com/feed/";
export const topK = Number(process.env.TOP_K || 3);
export const databaseUrl = process.env.DATABASE_URL;
export const embeddingDimensions = Number(process.env.EMBEDDING_DIMENSIONS || 1024);
export const fetchFullArticles = process.env.FETCH_FULL_ARTICLES !== "false";
export const articleFetchTimeoutMs = Number(process.env.ARTICLE_FETCH_TIMEOUT_MS || 10000);
