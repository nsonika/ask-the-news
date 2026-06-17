import { answerQuestion, ingestNews, publicSources, searchNews } from "../core/rag";
import type { Env } from "../core/types";
import { neonRepository } from "../db/neon.repository";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,x-ingest-token",
};

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...init.headers,
    },
  });
}

async function requireIngestToken(request: Request, env: Env) {
  if (!env.INGEST_TOKEN) return;

  const token = request.headers.get("x-ingest-token");
  if (token !== env.INGEST_TOKEN) {
    throw json({ error: "Invalid ingest token" }, { status: 401 });
  }
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(request.url);

  try {
    if (request.method === "GET" && url.pathname === "/health") {
      return json({
        ok: true,
        service: "cloudflare-worker",
        chunks: await neonRepository.countChunks(env),
      });
    }

    if (request.method === "POST" && url.pathname === "/ingest") {
      await requireIngestToken(request, env);
      const body = (await request.json().catch(() => ({}))) as { limit?: number };
      const result = await ingestNews(env, neonRepository, body.limit || 20);

      return json({
        ok: true,
        ingestedArticles: result.articles.length,
        ingestedChunks: result.chunks.length,
      });
    }

    if (request.method === "POST" && url.pathname === "/search") {
      const body = (await request.json()) as { question?: string; topK?: number };
      if (!body.question) return json({ error: "question is required" }, { status: 400 });

      const chunks = await searchNews(body.question, env, neonRepository, body.topK);
      return json({ matches: publicSources(chunks) });
    }

    if (request.method === "POST" && url.pathname === "/chat") {
      const body = (await request.json()) as { question?: string };
      if (!body.question) return json({ error: "question is required" }, { status: 400 });

      return json(await answerQuestion(body.question, env, neonRepository));
    }

    if (request.method === "GET" && url.pathname === "/chat/stream") {
      const question = url.searchParams.get("question");
      if (!question) return json({ error: "question query param is required" }, { status: 400 });

      const result = await answerQuestion(question, env, neonRepository);
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          for (const token of result.answer.split(/(\s+)/).filter(Boolean)) {
            controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ token })}\n\n`));
          }
          controller.enqueue(
            encoder.encode(`event: sources\ndata: ${JSON.stringify({ sources: result.sources })}\n\n`)
          );
          controller.enqueue(encoder.encode("event: done\ndata: {}\n\n"));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          ...corsHeaders,
        },
      });
    }

    return json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export default {
  fetch: handleRequest,
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      ingestNews(env, neonRepository, 20).then((result) => {
        console.log(`Scheduled ingest complete: ${result.articles.length} articles, ${result.chunks.length} chunks`);
      })
    );
  },
};
