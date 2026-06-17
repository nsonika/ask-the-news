import Groq from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import { groqApiKey, groqModel } from "../config/env";

function createGroqClient(): Groq {
  if (!groqApiKey) {
    throw new Error("Missing GROQ_API_KEY in .env");
  }

  return new Groq({ apiKey: groqApiKey });
}

export async function askGroq(messages: ChatCompletionMessageParam[]) {
  const groq = createGroqClient();

  return groq.chat.completions.create({
    model: groqModel,
    messages,
    temperature: 0.2,
  });
}

export async function streamGroq(
  messages: ChatCompletionMessageParam[],
  onToken: (token: string) => void
) {
  const groq = createGroqClient();

  const stream = await groq.chat.completions.create({
    model: groqModel,
    messages,
    temperature: 0.2,
    stream: true,
  });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content;
    if (token) onToken(token);
  }
}
