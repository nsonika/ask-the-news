import type { FormEvent } from 'react'
import './App.css'
import { AnswerCard } from './components/AnswerCard'
import { AskPanel } from './components/AskPanel'
import { EvidencePanel } from './components/EvidencePanel'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { useAskNews } from './hooks/useAskNews'
import { useChatStore } from './stores/chatStore'
import { uniqueSources } from './utils/sources'

function App() {
  const { answer, lastUpdated, question, reset, setQuestion, setResult, sources } =
    useChatStore()
  const chatMutation = useAskNews()
  const displayedSources = uniqueSources(sources)

  function resetBrief() {
    reset()
    chatMutation.reset()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || chatMutation.isPending) return

    chatMutation.mutate(trimmedQuestion, {
      onSuccess: (result) => {
        setResult({
          answer: result.answer || 'No answer returned.',
          sources: result.sources,
          lastUpdated: new Intl.DateTimeFormat(undefined, {
            hour: 'numeric',
            minute: '2-digit',
          }).format(new Date()),
        })
      },
    })
  }

  return (
    <main className="app-shell">
      <Sidebar />

      <section className="workspace">
        <Topbar onReset={resetBrief} />
        <AskPanel
          errorMessage={
            chatMutation.isError
              ? chatMutation.error instanceof Error
                ? chatMutation.error.message
                : 'Something went wrong.'
              : null
          }
          isPending={chatMutation.isPending}
          onQuestionChange={setQuestion}
          onSubmit={handleSubmit}
          question={question}
        />

        <section className="answer-grid">
          <AnswerCard
            answer={answer}
            checkedCount={sources.length}
            lastUpdated={lastUpdated}
            question={question}
          />
          <EvidencePanel allSources={sources} visibleSources={displayedSources} />
        </section>
      </section>
    </main>
  )
}

export default App
