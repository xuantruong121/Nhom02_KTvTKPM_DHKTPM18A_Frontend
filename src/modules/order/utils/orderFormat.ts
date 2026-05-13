import type { OrderStatus } from '@/modules/order/api/orderApi'
import type { ReturnStatus } from '@/modules/returns/api/returnsApi'

export const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

export function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return 0
  return typeof value === 'number' ? value : Number(value)
}

export function formatMoney(value: number | string | null | undefined) {
  return currencyFormatter.format(toNumber(value))
}

export function makeRequestId(prefix = 'checkout') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const orderStatusMeta: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ thanh toán', color: 'gold' },
  CONFIRMED: { label: 'Chờ xác nhận', color: 'blue' },
  PROCESSING: { label: 'Đang xử lý', color: 'cyan' },
  DELIVERING: { label: 'Đang giao', color: 'purple' },
  DELIVERED: { label: 'Đã giao', color: 'green' },
  CANCELLED: { label: 'Đã hủy', color: 'red' },
}

export const returnStatusMeta: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ duyệt', color: 'gold' },
  APPROVED: { label: 'Đã duyệt', color: 'blue' },
  RECEIVED: { label: 'Đã nhận hàng', color: 'cyan' },
  REFUNDED: { label: 'Đã hoàn tiền', color: 'green' },
  REJECTED: { label: 'Từ chối', color: 'red' },
}

export function getOrderStatusMeta(status?: OrderStatus | null) {
  return orderStatusMeta[String(status ?? '')] ?? { label: status || 'Không rõ', color: 'default' }
}

export function getReturnStatusMeta(status?: ReturnStatus | null) {
  return returnStatusMeta[String(status ?? '')] ?? { label: status || 'Không rõ', color: 'default' }
}

export function compactAddress(address: {
  street: string
  ward: string
  district: string
  city: string
}) {
  return [address.street, address.ward, address.district, address.city].filter(Boolean).join(', ')
}
