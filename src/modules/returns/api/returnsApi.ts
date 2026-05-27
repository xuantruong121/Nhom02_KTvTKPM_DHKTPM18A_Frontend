import { http, unwrapApi } from '@/shared/api/http'

export type ReturnReason =
  | 'DEFECTIVE'
  | 'WRONG_ITEM'
  | 'NO_LONGER_NEEDED'
  | string

export type ReturnStatus = 'PENDING' | 'APPROVED' | 'RECEIVED' | 'REFUNDED' | 'REJECTED' | string

export type CreateReturnItem = {
  bookId: number
  quantity: number
}

export type CreateReturnRequest = {
  orderId: number
  reason: ReturnReason
  notes?: string
  items: CreateReturnItem[]
  evidenceImage?: File
}

export type ReturnItem = {
  id: string
  bookId: number
  quantity: number
  refundPrice?: number | string | null
  condition?: string | null
}

export type ReturnHistory = {
  id: string
  fromStatus?: ReturnStatus | null
  toStatus: ReturnStatus
  changedBy?: string | null
  changedAt?: string | null
  note?: string | null
}

export type ReturnRequest = {
  id: string
  orderId: number
  customerId: number
  status: ReturnStatus
  refundAmount?: number | string | null
  reason: string
  notes?: string | null
  evidenceImageUrl?: string | null
  createdAt?: string | null
  items: ReturnItem[]
  histories?: ReturnHistory[]
}

export const returnsApi = {
  create(payload: CreateReturnRequest) {
    if (payload.evidenceImage) {
      const { evidenceImage, ...requestPayload } = payload
      const form = new FormData()
      form.append(
        'payload',
        new Blob([JSON.stringify(requestPayload)], { type: 'application/json' })
      )
      form.append('evidenceImage', evidenceImage)
      return unwrapApi<ReturnRequest>(http.post('/returns', form))
    }
    return unwrapApi<ReturnRequest>(http.post('/returns', payload))
  },
  getMyReturns() {
    return unwrapApi<ReturnRequest[]>(http.get('/returns/my'))
  },
}
