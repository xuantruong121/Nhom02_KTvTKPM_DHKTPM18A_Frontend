import { http } from '@/shared/api/http'

export type OcrResult = {
  title?: string | null
  author?: string | null
  rawText?: string | null
  detected: boolean
}

export const aiApi = {
  async chat(sessionId: string, message: string, customerId?: number | null) {
    const { data } = await http.post<string>('/ai/chat', message, {
      params: { sessionId, customerId: customerId ?? undefined },
      headers: { 'Content-Type': 'text/plain' },
    })
    return data
  },

  async clearChat(sessionId: string) {
    await http.delete(`/ai/chat/${encodeURIComponent(sessionId)}`)
  },

  async search(query: string, topK = 10) {
    const { data } = await http.get<number[]>('/ai/search', {
      params: { q: query, topK },
    })
    return data
  },

  async recognizeBook(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await http.post<OcrResult>('/ai/book-recognize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async syncAll() {
    const { data } = await http.post<string>('/admin/ai/sync-all')
    return data
  },
}
