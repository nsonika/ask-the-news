export type Env = {
  DATABASE_URL: string;
  JINA_API_KEY: string;
  GROQ_API_KEY: string;
  GROQ_MODEL?: string;
  RSS_FEED_URL?: string;
  TOP_K?: string;
  FETCH_FULL_ARTICLES?: string;
  ARTICLE_FETCH_TIMEOUT_MS?: string;
  EMBEDDING_DIMENSIONS?: string;
  INGEST_TOKEN?: string;
};

export type Article = {
  id: string;
  title: string;
  contentSnippet: string;
  content: string;
  link: string;
  publishedAt: string | null;
  text: string;
};

export type ArticleChunk = {
  id: string;
  articleId: string;
  chunkIndex: number;
  title: string;
  contentSnippet: string;
  link: string;
  publishedAt: string | null;
  text: string;
  embedding?: number[];
  score?: number;
};

export type RagRepository = {
  countChunks(env: Env): Promise<number>;
  saveChunks(chunks: ArticleChunk[], articles: Article[], env: Env): Promise<void>;
  searchChunksWithNeighbors(
    queryEmbedding: number[],
    env: Env,
    topK: number,
    windowSize?: number
  ): Promise<ArticleChunk[]>;
};
