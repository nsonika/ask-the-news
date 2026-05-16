import type { FormEvent } from 'react'

type AskPanelProps = {
  errorMessage: string | null
  isPending: boolean
  onQuestionChange: (question: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  question: string
}

export function AskPanel({
  errorMessage,
  isPending,
  onQuestionChange,
  onSubmit,
  question,
}: AskPanelProps) {
  return (
    <form className="ask-panel" aria-label="Ask the news" onSubmit={onSubmit}>
      <div className="input-row">
        <textarea
          aria-label="Ask a question"
          rows={3}
          value={question}
          onChange={(event) => onQuestionChange(event.target.value)}
        />
        <button disabled={isPending}>{isPending ? 'Asking...' : 'Ask'}</button>
      </div>
      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
    </form>
  )
}
