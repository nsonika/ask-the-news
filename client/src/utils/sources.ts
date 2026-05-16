import type { ChatSource } from '../schemas/chat'

export function formatSourceMeta(source: ChatSource) {
  if (source.publishedAt) {
    const publishedDate = new Date(source.publishedAt)

    return publishedDate.toString() === 'Invalid Date'
      ? source.publishedAt
      : new Intl.DateTimeFormat(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(publishedDate)
  }

  return source.chunkIndex === undefined ? 'Source' : `Chunk ${source.chunkIndex}`
}

export function uniqueSources(sources: ChatSource[]) {
  const seen = new Set<string>()

  return sources.filter((source) => {
    const key = source.link || source.title
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function confidenceLabel(sources: ChatSource[]) {
  const bestScore = Math.max(...sources.map((source) => source.score || 0))

  if (bestScore >= 0.7) return 'Confidence: high'
  if (bestScore >= 0.4) return 'Confidence: medium'
  if (sources.length > 0) return 'Confidence: limited'
  return 'Confidence: unknown'
}
