import { chatResponseSchema } from '../schemas/chat'
import type { ChatResponse } from '../schemas/chat'
import { endpoints } from '../config/endpoints'

export async function askNews(question: string): Promise<ChatResponse> {
  const response = await fetch(endpoints.chat, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null
    throw new Error(payload?.error || 'Could not get an answer from the API.')
  }

  return chatResponseSchema.parse(await response.json())
}
