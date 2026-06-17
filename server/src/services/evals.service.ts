import { answerQuestion } from "./rag.service";
import { loadArticles } from "./retrieval.service";

export const evals = [
  {
    question: "What did Google announce?",
    expected: "AI",
  },
  {
    question: "What is happening with OpenAI?",
    expected: "OpenAI",
  },
];

export async function runEvals() {
  await loadArticles();

  for (const test of evals) {
    const result = await answerQuestion(test.question);
    const passed = result.answer.toLowerCase().includes(test.expected.toLowerCase());

    console.log(`Question: ${test.question}`);
    console.log(`Expected keyword: ${test.expected}`);
    console.log(`Passed: ${passed}`);
    console.log(`Answer: ${result.answer}`);
    console.log("---");
  }
}

if (require.main === module) {
  runEvals().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
