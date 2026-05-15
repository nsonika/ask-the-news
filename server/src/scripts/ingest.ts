import { ingestNews } from "../services/ingest.service";

if (require.main === module) {
  ingestNews()
    .then(({ articles, chunks }) => {
      console.log(`Ingested ${articles.length} articles into ${chunks.length} chunks.`);
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    });
}

export { ingestNews };
