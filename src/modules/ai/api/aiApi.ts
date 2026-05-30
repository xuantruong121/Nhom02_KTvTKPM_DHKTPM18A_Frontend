import { http, unwrapApi } from '@/shared/api/http'

export type OcrResult = {
  title?: string | null
  author?: string | null
  rawText?: string | null
  detected: boolean
}

export type AgentConfirmationCard = {
  pendingActionId: string
  title: string
  description: string
  confirmText: string
  cancelText: string
}

export type AgentBookResult = {
  bookId: number
  title: string
  author?: string
  price?: number | string
  quantity: number
  imageUrl?: string | null
  description?: string
}

export type AgentCartResult = {
  totalAmount?: number | string
  items: Array<{
    bookId: number
    title: string
    price?: number | string
    quantity: number
  }>
}

export type AgentOrderResult = {
  orderId: number
  totalAmount?: number | string
  discountAmount?: number | string | null
  finalAmount?: number | string | null
  fulfillmentStatus?: string
  paymentMethod?: string | null
}

export type AgentClientAction = {
  action: string
  bookId?: number | null
  orderId?: number | null
  addressId?: number | null
  quantity?: number | null
  paymentMethod?: string | null
  shippingAddress?: string | null
  customerPhone?: string | null
  message?: string | null
}

export type AgentAction = {
  label: string
  action: string
  pendingActionId?: string | null
  url?: string | null
  bookId?: number | null
  orderId?: number | null
  addressId?: number | null
  message?: string | null
  clientAction?: AgentClientAction | null
}

export type AgentCard = {
  type: string
  bookId?: number | null
  orderId?: number | null
  addressId?: number | null
  title?: string | null
  subtitle?: string | null
  message?: string | null
  price?: number | string | null
  stock?: number | null
  imageUrl?: string | null
  url?: string | null
  actions?: AgentAction[] | null
  metadata?: Record<string, unknown> | null
}

export type AgentPendingAction = {
  pendingActionId: string
  intent?: string | null
  expiresAt?: string | null
  summary?: Record<string, unknown> | null
}

export type AgentResponse = {
  message: string
  intent?: string | null
  source?: string | null
  confidence?: number | null
  cards?: AgentCard[] | null
  actions?: AgentAction[] | null
  pendingAction?: AgentPendingAction | null
  error?: { code?: string | null; message?: string | null } | null
  suggestions?: string[]
  confirmationCard?: AgentConfirmationCard | null
  redirectUrl?: string | null
  books?: AgentBookResult[] | null
  cart?: AgentCartResult | null
  order?: AgentOrderResult | null
}

export const aiApi = {
  async chat(sessionId: string, message: string, customerId?: number | null, signal?: AbortSignal) {
    const { data } = await http.post<string>('/ai/chat', message, {
      params: { sessionId, customerId: customerId ?? undefined },
      headers: { 'Content-Type': 'text/plain' },
      signal,
    })
    return data
  },

  async agentMessage(sessionId: string, message: string, clientAction?: AgentClientAction | null) {
    return unwrapApi<AgentResponse>(http.post('/ai/agent/messages', { sessionId, message, clientAction }))
  },

  async confirmAgentAction(pendingActionId: string) {
    return unwrapApi<AgentResponse>(http.post(`/ai/agent/actions/${encodeURIComponent(pendingActionId)}/confirm`))
  },

  async cancelAgentAction(pendingActionId: string) {
    return unwrapApi<AgentResponse>(http.post(`/ai/agent/actions/${encodeURIComponent(pendingActionId)}/cancel`))
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
