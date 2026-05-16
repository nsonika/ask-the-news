import type { ChatSource } from '../schemas/chat'
import { confidenceLabel, formatSourceMeta } from '../utils/sources'

type EvidencePanelProps = {
  allSources: ChatSource[]
  visibleSources: ChatSource[]
}

export function EvidencePanel({ allSources, visibleSources }: EvidencePanelProps) {
  return (
    <aside className="evidence-panel" aria-label="Source evidence">
      <div className="panel-heading">
        <p className="eyebrow">Source stack</p>
        <span>{confidenceLabel(allSources)}</span>
      </div>
      {visibleSources.length === 0 ? (
        <p className="empty-sources">No sources returned for this answer.</p>
      ) : (
        visibleSources.map((source, index) => (
          <article className="source-card" key={`${source.title}-${index}`}>
            <div>
              <strong>Source {index + 1}</strong>
              <span>{formatSourceMeta(source)}</span>
            </div>
            {source.link ? (
              <a href={source.link} target="_blank" rel="noreferrer">
                {source.title}
              </a>
            ) : (
              <p>{source.title}</p>
            )}
            <small>
              {source.score === undefined
                ? 'Retrieved'
                : `${Math.round(source.score * 100)}% match`}
            </small>
          </article>
        ))
      )}
    </aside>
  )
}
