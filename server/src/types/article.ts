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
