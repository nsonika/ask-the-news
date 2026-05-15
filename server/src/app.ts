import cors from "cors";
import express from "express";
import { errorMiddleware } from "./middlewares/error.middleware";
import { chatRouter } from "./routes/chat.routes";
import { newsRouter } from "./routes/news.routes";
import { ragRouter } from "./routes/rag.routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.use(ragRouter);
app.use(newsRouter);
app.use(chatRouter);

app.use(errorMiddleware);
