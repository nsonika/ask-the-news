import { buildMessages } from "./prompt";
import type { ArticleChunk, Env } from "./types";

export async function askGroq(question: string, chunks: ArticleChunk[], env: Env) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.GROQ_MODEL || "llama-3.1-8b-instant",
      messages: buildMessages(question, chunks),
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq chat failed: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as {
    choices: Array<{ message?: { content?: string } }>;
  };

  return payload.choices[0]?.message?.content || "";
}
