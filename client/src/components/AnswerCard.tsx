type AnswerCardProps = {
  answer: string | null
  checkedCount: number
  lastUpdated: string | null
  question: string
}

export function AnswerCard({
  answer,
  checkedCount,
  lastUpdated,
  question,
}: AnswerCardProps) {
  return (
    <article className="answer-card">
      <div className="answer-meta">
        <span className="answer-status">
          {answer ? 'Answer' : 'Waiting for question'}
        </span>
        {lastUpdated ? <span>Updated {lastUpdated}</span> : null}
        {checkedCount > 0 ? <span>{checkedCount} chunks checked</span> : null}
      </div>
      <h2>{question}</h2>
      <p>
        {answer ||
          'Submit a question to generate an answer from the indexed news context.'}
      </p>
    </article>
  )
}
