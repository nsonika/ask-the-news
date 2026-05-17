# Ask The News

Full-stack RAG news app.

The backend ingests TechCrunch articles, extracts article text, chunks it,
creates embeddings with Jina, stores vectors in Postgres/pgvector, retrieves
relevant chunks for a question, and asks Groq to answer using only that
retrieved context. The frontend is a React UI for asking questions and viewing
the answer sources.

## Architecture

```text
TechCrunch RSS
  -> fetch article links
  -> extract article text
  -> chunk text
  -> create Jina embeddings
  -> store articles and chunks in Postgres pgvector
  -> retrieve top-k chunks for a question
  -> add neighbor chunks for context
  -> generate grounded answer with Groq
```

## Tech Stack

Backend:

- Node.js
- Express
- TypeScript
- Prisma
- Postgres / Neon
- pgvector
- Jina embeddings
- Groq chat completions
- SSE streaming

Frontend:

- React
- Vite
- TypeScript
- TanStack Query
- Zustand
- Zod

## Project Structure

```text
client/
  src/
    api/
    components/
    config/
    hooks/
    schemas/
    stores/
    utils/

server/
  prisma/
    migrations/
    schema.prisma
  src/
    app.ts
    server.ts
    config/
    db/
    middlewares/
    repositories/
    routes/
    scripts/
    services/
    types/
    utils/
```

## Environment

Create `server/.env`:

```bash
PORT=3000
JINA_API_KEY=your_jina_api_key
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
RSS_FEED_URL=https://techcrunch.com/feed/
TOP_K=3
FETCH_FULL_ARTICLES=true
ARTICLE_FETCH_TIMEOUT_MS=10000
DATABASE_URL=your_postgres_or_neon_url
EMBEDDING_DIMENSIONS=1024
```

## RSS Feed

The default feed is TechCrunch:

```text
https://techcrunch.com/feed/
```

The RSS feed provides article metadata such as title, link, publish date, and a
short description. During ingestion, the backend follows each article `link` and
tries to extract the full article body before chunking and embedding it.

Optional client env:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

## Install

```bash
cd server
npm install

cd ../client
npm install
```

## Database

Run migrations before ingesting articles:

```bash
cd server
npx prisma migrate deploy
npm run prisma:generate
```

The migration creates:

```text
articles
article_chunks
_prisma_migrations
```

## Run Locally

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend:

```bash
cd client
npm run dev
```

Open:

```text
http://localhost:5173
```

## Ingest News

```bash
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'
```

## Ask A Question

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is happening with GoPro?"}'
```

## Search Only

```bash
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"question": "GoPro defense pivot", "topK": 3}'
```

## SSE Streaming

```bash
curl -N "http://localhost:3000/chat/stream?question=What%20is%20happening%20with%20GoPro%3F"
```

The stream emits:

```text
event: token
event: sources
event: done
```

## Scripts

Server:

```bash
npm run dev
npm run start
npm run build
npm run start:prod
npm run ingest
npm run eval
npm run typecheck
npm run prisma:generate
```

Client:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```
