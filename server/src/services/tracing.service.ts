import { traceable } from "langsmith/traceable";
import { groqModel, topK } from "../config/env";
import { askGroq } from "./groq.service";
import { embedQuery } from "./jina.service";
import { buildMessages } from "./prompt.service";
import { searchArticlesWithNeighbors } from "./retrieval.service";

export const tracedEmbedQuery = traceable(embedQuery, {
  name: "Jina query embedding",
  run_type: "embedding",
});

export const tracedRetrieve = traceable(searchArticlesWithNeighbors, {
  name: "pgvector top-k retrieval with neighbors",
  run_type: "retriever",
});

export const tracedBuildMessages = traceable(buildMessages, {
  name: "LangChain RAG prompt formatting",
  run_type: "prompt",
});

export const tracedAskGroq = traceable(askGroq, {
  name: "Groq chat completion",
  run_type: "llm",
  getInvocationParams: () => ({
    ls_provider: "groq",
    ls_model_name: groqModel,
    ls_model_type: "chat",
    ls_temperature: 0.2,
  }),
});

export function traceRagChat<ReturnValue>(
  fn: (question: string) => Promise<ReturnValue>
) {
  return traceable(fn, {
    name: "Ask The News RAG chat",
    run_type: "chain",
    metadata: {
      topK,
    },
  });
}
