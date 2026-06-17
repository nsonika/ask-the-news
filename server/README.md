# Ask The News Backend

This folder has two backend targets:

```text
Express backend            local Node server
Cloudflare Worker backend  deployed API + cron ingestion
```

Both use the same RAG idea:

```text
RSS -> chunks -> Jina embeddings -> pgvector -> Groq answer
```

## Structure

```text
src/
  app.ts              Express app
  server.ts           Express entrypoint
  routes/             Express routes
  services/           Express services
  repositories/       Prisma/JSON vector storage
  core/               Worker-compatible RAG logic
  db/
    prisma.client.ts
    neon.repository.ts
  worker/
    index.ts          Cloudflare Worker fetch() + scheduled()

wrangler.toml         Cloudflare Worker config
```

## Local Express Env

Create `server/.env`:

```bash
PORT=3000
DATABASE_URL=your_neon_postgres_url
JINA_API_KEY=your_jina_key
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.1-8b-instant
RSS_FEED_URL=https://techcrunch.com/feed/
TOP_K=3
FETCH_FULL_ARTICLES=true
ARTICLE_FETCH_TIMEOUT_MS=10000
EMBEDDING_DIMENSIONS=1024
```

Optional LangSmith for Express:

```bash
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=your_langsmith_key
LANGSMITH_PROJECT=ask-the-news
```

## Run

Express:

```bash
npm run dev
```

Cloudflare Worker:

```bash
npm run worker:dev
```

## Test API

```bash
curl http://localhost:3000/health

curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'

curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is happening with GoPro?"}'
```

For Worker `/ingest`, include:

```text
x-ingest-token: your_token
```

## Deploy Worker

Set secrets:

```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put JINA_API_KEY
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put INGEST_TOKEN
```

Deploy:

```bash
npm run worker:deploy
```

Worker URL:

```text
https://ask-the-news-worker.sonika-ask-news.workers.dev
```
