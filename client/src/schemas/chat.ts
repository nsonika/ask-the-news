import { z } from 'zod'

export const chatSourceSchema = z.object({
  title: z.string(),
  link: z.string().optional(),
  publishedAt: z.string().nullable().optional(),
  chunkIndex: z.number().optional(),
  score: z.number().optional(),
  source: z.string().optional(),
})

export const chatResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(chatSourceSchema).default([]),
})

export type ChatSource = z.infer<typeof chatSourceSchema>
export type ChatResponse = z.infer<typeof chatResponseSchema>
