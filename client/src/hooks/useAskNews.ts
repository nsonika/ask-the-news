import { useMutation } from '@tanstack/react-query'
import { askNews } from '../api/chat'

export function useAskNews() {
  return useMutation({
    mutationFn: askNews,
  })
}
