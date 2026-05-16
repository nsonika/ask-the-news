import { create } from 'zustand'
import { initialQuestion } from '../data/newsBrief'
import type { ChatSource } from '../schemas/chat'

type ChatState = {
  answer: string | null
  lastUpdated: string | null
  question: string
  sources: ChatSource[]
  reset: () => void
  setQuestion: (question: string) => void
  setResult: (result: {
    answer: string
    lastUpdated: string
    sources: ChatSource[]
  }) => void
}

export const useChatStore = create<ChatState>((set) => ({
  answer: null,
  lastUpdated: null,
  question: initialQuestion,
  sources: [],
  reset: () =>
    set({
      answer: null,
      lastUpdated: null,
      question: initialQuestion,
      sources: [],
    }),
  setQuestion: (question) => set({ question }),
  setResult: (result) =>
    set({
      answer: result.answer,
      lastUpdated: result.lastUpdated,
      sources: result.sources,
    }),
}))
