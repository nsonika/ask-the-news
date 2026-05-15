import { runEvals } from "../services/evals.service";

if (require.main === module) {
  runEvals().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

export { evals, runEvals } from "../services/evals.service";
