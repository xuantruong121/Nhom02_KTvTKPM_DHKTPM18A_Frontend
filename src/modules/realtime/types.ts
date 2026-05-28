export type RealtimeEventType =
  | 'ORDER_CREATED'
  | 'ORDER_STATUS_CHANGED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'INVENTORY_INCREASED'
  | 'INVENTORY_DECREASED'
  | 'PURCHASE_ORDER_UPDATED'
  | 'ADMIN_DATA_CHANGED'
  | 'REVIEW_UPDATED'
  | 'REVIEW_NEEDS_ACTION'
  | 'RETURN_STATUS_CHANGED'
  | 'SESSION_EXPIRED'

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
