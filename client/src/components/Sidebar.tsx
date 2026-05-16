export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="News workspace">
      <div className="brand">
        <div className="brand-mark">ATN</div>
        <div>
          <p className="eyebrow">Ask The News</p>
          <h1>Your live news analyst</h1>
        </div>
      </div>
      <p className="sidebar-copy">
        Ask a question. The answer is generated from retrieved article chunks and
        returned with sources.
      </p>
    </aside>
  )
}
