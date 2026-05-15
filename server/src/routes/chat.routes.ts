import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { answerQuestion, streamAnswer } from "../services/groq.service";

export const chatRouter = Router();

chatRouter.post("/chat", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const question = req.body.question as string | undefined;
    if (!question) {
      res.status(400).json({ error: "question is required" });
      return;
    }

    res.json(await answerQuestion(question));
  } catch (error) {
    next(error);
  }
});

chatRouter.get("/chat/stream", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const question = req.query.question;
    if (typeof question !== "string" || !question) {
      res.status(400).json({ error: "question query param is required" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const sources = await streamAnswer(question, (token) => {
      res.write("event: token\n");
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    });

    res.write("event: sources\n");
    res.write(`data: ${JSON.stringify({ sources })}\n\n`);
    res.write("event: done\n");
    res.write("data: {}\n\n");
    res.end();
  } catch (error) {
    next(error);
  }
});
