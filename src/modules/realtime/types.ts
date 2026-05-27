export type RealtimeEventType =
  | 'ORDER_CREATED'
  | 'ORDER_STATUS_CHANGED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'INVENTORY_INCREASED'
  | 'INVENTORY_DECREASED'

export type RealtimeEvent = {
  type: RealtimeEventType
  orderId?: number | null
  userId?: number | null
  bookId?: number | null
  quantity?: number | null
  amount?: number | null
  status?: string | null
  message?: string | null
  occurredAt?: string | null
}
