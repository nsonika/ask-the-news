# Ask The News

Full-stack RAG news app.

The backend ingests articles from an RSS feed, chunks article text, creates Jina
embeddings, retrieves relevant chunks, and asks Groq to answer only from the
retrieved news context. The frontend is a simple React UI for asking a question
and inspecting the returned source links.

## Architecture

```text
RSS feed
  -> ingest articles
  -> chunk article text
  -> create Jina embeddings
  -> store chunks in JSON or Postgres
  -> retrieve similar chunks for a question
  -> Groq generates grounded answer
  -> React renders answer + sources
```

## Tech Stack

### Backend

- Express
- TypeScript
- RSS Parser
- Jina embeddings
- Groq chat completions
- JSON file storage by default
- Optional Postgres storage

### Frontend

- React
- Vite
- TypeScript
- TanStack React Query
- Zod
- Zustand

## Project Structure

```text
client/
  src/
    api/          API calls + response parsing
    components/   UI components
    config/       endpoint constants
    data/         UI defaults
    hooks/        React Query hooks
    schemas/      Zod schemas and inferred types
    stores/       Zustand UI state
    utils/        source formatting helpers

server/
  src/
    routes/       Express routes
    services/     ingestion, embeddings, retrieval, Groq
    repositories/ vector storage
    utils/        chunking and similarity helpers
    config/       environment config
```

## Environment

Create `server/.env`:

```bash
JINA_API_KEY=...
GROQ_API_KEY=...

# Optional
PORT=3000
GROQ_MODEL=llama-3.1-8b-instant
RSS_FEED_URL=https://techcrunch.com/feed/
TOP_K=3
FETCH_FULL_ARTICLES=true
ARTICLE_FETCH_TIMEOUT_MS=10000
```

Optional client env if the API is not on the same origin:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

During local development, the Vite client proxies API requests to
`http://localhost:3000`.

## Install

From the project root:

```bash
cd server
npm install

cd ../client
npm install
```

## Run Locally

Start backend:

```bash
cd server
npm run dev
```

Start frontend:

```bash
cd client
npm run dev
```

Open the Vite URL, usually:

```text
http://localhost:5173
```

## Ingest News

Before asking questions, ingest articles:

```bash
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'
```

Response:

```json
{
  "ingestedArticles": 10,
  "ingestedChunks": 15,
  "articles": []
}
```

## API Endpoints

### Health

```bash
curl http://localhost:3000/health
```

Response:

```json
{
  "ok": true,
  "chunks": 15
}
```

### Search Chunks

```bash
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"question": "What is happening in AI?", "topK": 3}'
```

### Ask Question

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is happening in AI?"}'
```

Response:

```json
{
  "answer": "Grounded answer from retrieved context.",
  "sources": [
    {
      "title": "Article title",
      "link": "https://example.com/article",
      "publishedAt": "2026-05-16T00:00:00.000Z",
      "chunkIndex": 0,
      "score": 0.72
    }
  ]
}
```

### Stream Question

```bash
curl -N "http://localhost:3000/chat/stream?question=What%20is%20happening%20in%20AI%3F"
```

The stream emits:

```text
event: token
event: sources
event: done
```

## Scripts

### Server

```bash
npm run dev              # watch server
npm run start            # start server once
npm run ingest           # run ingest script
npm run eval             # run tiny evals
npm run typecheck        # TypeScript check
npm run prisma:generate  # generate Prisma client
```

### Client

```bash
npm run dev      # Vite dev server
npm run build    # production build
npm run lint     # ESLint
npm run preview  # preview production build
```

## Optional Postgres

By default, the backend stores chunks in local JSON storage. To use Postgres,
set:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/ask_the_news
EMBEDDING_DIMENSIONS=1024
```

Create the database:

```bash
createdb ask_the_news
```

If using pgvector manually, enable it:

```bash
psql ask_the_news -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

## Current Frontend Data Flow

```text
AskPanel
  -> useAskNews()
  -> api/chat.ts
  -> POST /chat
  -> Zod validates response
  -> Zustand stores answer/sources
  -> AnswerCard + EvidencePanel render result
```

React Query owns request state. Zustand owns local UI/result state. Zod validates
the API boundary.
