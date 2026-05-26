import { http, unwrapApi } from '@/shared/api/http'

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'CANCELLED'
  | string

export type CheckoutRequest = {
  requestId: string
  shippingAddress?: string
  customerPhone?: string
  couponCode?: string
  paymentMethod?: 'COD' | 'VNPAY'
  selectedBookIds?: number[]
}

export type OrderItem = {
  bookId: number
  quantity: number
  priceAtPurchase: number | string
}

export type Order = {
  orderId: number
  userId: number
  totalAmount: number | string
  discountAmount?: number | string | null
  finalAmount?: number | string | null
  fulfillmentStatus: OrderStatus
  sagaStatus?: string | null
  requestId?: string | null
  updatedAt?: string | null
  items: OrderItem[]
}

export type PaymentUrlResponse = {
  paymentUrl: string
}

export const orderApi = {
  checkout(payload: CheckoutRequest) {
    return unwrapApi<Order>(http.post('/orders/checkout', payload))
  },
  getMyOrders() {
    return unwrapApi<Order[]>(http.get('/orders'))
  },
  getOrder(id: number) {
    return unwrapApi<Order>(http.get(`/orders/${id}`))
  },
  createPaymentUrl(orderId: number) {
    return unwrapApi<PaymentUrlResponse>(
      http.post('/payments/create-payment-url', null, { params: { orderId } })
    )
  },
  cancelMyOrder(orderId: number, reason = 'Khách hàng hủy đơn trước khi xác nhận') {
    return unwrapApi<Order>(http.put(`/orders/${orderId}/cancel`, { reason }))
  },
}
