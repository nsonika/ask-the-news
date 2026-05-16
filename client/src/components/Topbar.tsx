type TopbarProps = {
  onReset: () => void
}

export function Topbar({ onReset }: TopbarProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Ask The News</p>
        <h2>Ask a question and inspect the sources.</h2>
        {/* <p className="topbar-copy">
          Uses the `/chat` API to retrieve news context, generate an answer, and
          return source links.
        </p> */}
      </div>
      <button className="ghost-button" type="button" onClick={onReset}>
        Clear
      </button>
    </header>
  )
}
