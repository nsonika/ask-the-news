import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { ingestNews } from "../services/ingest.service";

export const newsRouter = Router();

newsRouter.post("/ingest", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Number(req.body.limit || 20);
    const { articles, chunks } = await ingestNews(limit);

    res.json({
      ingestedArticles: articles.length,
      ingestedChunks: chunks.length,
      articles: articles.map(({ title, link, publishedAt, content }) => ({
        title,
        link,
        publishedAt,
        contentLength: content.length,
      })),
    });
  } catch (error) {
    next(error);
  }
});
