const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''

export const endpoints = {
  chat: `${apiBaseUrl}/chat`,
  health: `${apiBaseUrl}/health`,
  ingest: `${apiBaseUrl}/ingest`,
  search: `${apiBaseUrl}/search`,
} as const
