# Ask The News

A news app. It reads RSS articles, embeds the text with
Jina, stores chunks in pgvector, retrieves relevant chunks, and asks Groq
to answer from that context.

## Flow

```text
RSS articles
  -> chunk text
  -> Jina embeddings
  -> pgvector
  -> user question
  -> top-k retrieval
  -> Groq answer with sources
```

## Apps

```text
client/   React UI
server/   Express backend plus optional Cloudflare Worker backend
```

The Express backend is useful for local development. The Cloudflare Worker is
the deployed backend and also runs cron ingestion every 2 days.

## Tech Stack

### Backend

- Express
- Cloudflare Workers
- TypeScript
- RSS parsing
- Postgres + pgvector
- Jina embeddings
- Groq chat completions
- LangChain prompt templates
- LangSmith tracing
- SSE streaming

### Frontend

- React
- Vite
- TypeScript
- TanStack React Query
- Zustand
- Zod

## Folder Structure

```text
client/
  src/
    api/          API calls
    components/   UI components
    hooks/        React Query hooks
    schemas/      Zod schemas
    stores/       Zustand state

server/
  src/
    core/         shared RAG logic for Worker
    db/           Prisma client + Neon repository
    routes/       Express routes
    services/     Express services
    worker/       Cloudflare Worker entrypoint
  prisma/         schema and migrations
  wrangler.toml   Cloudflare Worker config
```

## RSS Feed

The default feed is TechCrunch:

```text
https://techcrunch.com/feed/
```

The RSS feed provides article metadata such as title, link, publish date, and a
short description. During ingestion, the backend follows each article link and
tries to extract the full article body before chunking and embedding it.

## LangSmith

LangSmith is used to trace the RAG flow in the Express backend:

```text
question -> embedding -> retrieval -> prompt -> Groq answer
```

This makes it easier to inspect retrieval quality, prompts, model calls, and
latency while testing.

## Setup

Install dependencies:

```bash
cd server
npm install

cd ../client
npm install
```

Create `server/.env` for local Express development:

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

For the client, set the backend URL:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

For production, use the Cloudflare Worker URL instead:

```bash
VITE_API_BASE_URL=https://ask-the-news-worker.sonika-ask-news.workers.dev
```

## Run Locally

Express backend:

```bash
cd server
npm run dev
```

React client:

```bash
cd client
npm run dev
```

Cloudflare Worker backend:

```bash
cd server
npm run worker:dev
```

## API

```bash
curl http://localhost:3000/health

curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'

curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is happening with GoPro?"}'
```

Worker ingest requires the `x-ingest-token` header.

## Deploy Worker

Set Cloudflare secrets:

```bash
cd server
npx wrangler secret put DATABASE_URL
npx wrangler secret put JINA_API_KEY
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put INGEST_TOKEN
```

Deploy:

```bash
npm run worker:deploy
```
