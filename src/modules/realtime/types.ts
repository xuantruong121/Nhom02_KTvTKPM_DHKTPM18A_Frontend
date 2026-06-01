export type RealtimeEventType =
  | 'ORDER_CREATED'
  | 'ORDER_STATUS_CHANGED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'INVENTORY_INCREASED'
  | 'INVENTORY_DECREASED'
  | 'INVENTORY_INITIALIZED'
  | 'PURCHASE_ORDER_UPDATED'
  | 'ADMIN_DATA_CHANGED'
  | 'BOOK_CHANGED'
  | 'CATEGORY_CHANGED'
  | 'COUPON_CHANGED'
  | 'FLASH_SALE_CHANGED'
  | 'SUPPLIER_CHANGED'
  | 'STOCKTAKE_UPDATED'
  | 'USER_CHANGED'
  | 'CUSTOMER_CONTACT_CHANGED'
  | 'AUDIT_LOG_CHANGED'
  | 'REVIEW_UPDATED'
  | 'REVIEW_NEEDS_ACTION'
  | 'REVIEW_DELETED'
  | 'RETURN_CREATED'
  | 'RETURN_STATUS_CHANGED'
  | 'SESSION_EXPIRED'

export type RealtimeEvent = {
  type: RealtimeEventType
  orderId?: number | null
  userId?: number | null
  bookId?: number | null
  reviewId?: number | null
  returnRequestId?: string | null
  purchaseOrderId?: number | null
  stocktakeId?: number | null
  quantity?: number | null
  amount?: number | null
  status?: string | null
  message?: string | null
  occurredAt?: string | null
}
