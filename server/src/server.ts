import { app } from "./app";
import { port } from "./config/env";
import { loadArticles } from "./services/retrieval.service";

loadArticles()
  .then(() => {
    app.listen(port, () => {
      console.log(`Ask The News backend running on http://localhost:${port}`);
    });
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
