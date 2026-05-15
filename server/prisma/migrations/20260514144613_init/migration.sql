CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT,
    "published_at" TIMESTAMP(3),
    "content_snippet" TEXT,
    "full_content" TEXT,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_chunks" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "embedding" vector(1024) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "articles_link_key" ON "articles"("link");

-- CreateIndex
CREATE INDEX "article_chunks_article_id_idx" ON "article_chunks"("article_id");

-- CreateIndex
CREATE UNIQUE INDEX "article_chunks_article_id_chunk_index_key" ON "article_chunks"("article_id", "chunk_index");

-- AddForeignKey
ALTER TABLE "article_chunks" ADD CONSTRAINT "article_chunks_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
