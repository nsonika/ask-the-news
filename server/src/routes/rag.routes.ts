import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { embedQuery } from "../services/jina.service";
import { getArticleCount, searchArticles } from "../services/retrieval.service";

export const ragRouter = Router();

ragRouter.get("/health", async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      ok: true,
      chunks: await getArticleCount(),
    });
  } catch (error) {
    next(error);
  }
});

ragRouter.post("/search", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const question = req.body.question as string | undefined;
    if (!question) {
      res.status(400).json({ error: "question is required" });
      return;
    }

    const requestTopK = Number(req.body.topK || 3);
    const queryEmbedding = await embedQuery(question);
    const matches = await searchArticles(queryEmbedding, requestTopK);

    console.log(`\nSemantic search for: "${question}"`);
    console.table(
      matches.map((article) => ({
        score: Number((article.score || 0).toFixed(4)),
        chunk: article.chunkIndex,
        title: article.title,
      }))
    );

    res.json({
      question,
      matches: matches.map((article) => ({
        score: Number((article.score || 0).toFixed(4)),
        title: article.title,
        link: article.link,
        publishedAt: article.publishedAt,
        chunkIndex: article.chunkIndex,
        preview: article.text.slice(0, 300),
      })),
    });
  } catch (error) {
    next(error);
  }
});
