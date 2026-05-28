import { App } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { env } from '@/shared/config/env'
import { useAuthStore } from '@/shared/store/authStore'
import type { RealtimeEvent } from '@/modules/realtime/types'
import { notifySessionExpired } from '@/shared/auth/sessionExpiredEvent'

function parseRealtimeEvent(raw: string): RealtimeEvent | null {
  try {
    const value = JSON.parse(raw) as Partial<RealtimeEvent>
    return typeof value.type === 'string' ? (value as RealtimeEvent) : null
  } catch {
    return null
  }
}

export default function RealtimeEventBridge() {
  const { notification } = App.useApp()
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    const streamUrl =
      accessToken && user
        ? `${env.apiBaseUrl}/notifications/stream?token=${encodeURIComponent(accessToken)}`
        : `${env.apiBaseUrl}/notifications/public-stream`
    const eventSource = new EventSource(streamUrl)

    const invalidateOrderCaches = (orderId?: number | null) => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['orders', 'my'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      void queryClient.refetchQueries({ queryKey: ['admin', 'orders'], type: 'active' })
      if (orderId) {
        void queryClient.invalidateQueries({ queryKey: ['orders', orderId] })
        void queryClient.invalidateQueries({ queryKey: ['admin', 'orders', orderId] })
      }
    }

    const invalidateInventoryCaches = (bookId?: number | null) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'books'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      void queryClient.invalidateQueries({ queryKey: ['staff', 'purchaseOrders'] })
      void queryClient.invalidateQueries({ queryKey: ['catalog', 'books'] })
      void queryClient.refetchQueries({ queryKey: ['admin', 'inventory'], type: 'active' })
      void queryClient.refetchQueries({ queryKey: ['staff', 'purchaseOrders'], type: 'active' })
      if (bookId) {
        void queryClient.invalidateQueries({ queryKey: ['catalog', 'book', bookId] })
      }
    }

    const invalidatePurchaseOrderCaches = () => {
      void queryClient.invalidateQueries({ queryKey: ['staff', 'purchaseOrders'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'books'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      void queryClient.refetchQueries({ queryKey: ['staff', 'purchaseOrders'], type: 'active' })
      void queryClient.refetchQueries({ queryKey: ['admin', 'inventory'], type: 'active' })
    }

    const invalidateManagementCaches = () => {
      ;[
        ['admin', 'dashboard'],
        ['admin', 'orders'],
        ['admin', 'inventory'],
        ['admin', 'stocktakes'],
        ['admin', 'books'],
        ['admin', 'categories'],
        ['admin', 'bookCategories'],
        ['admin', 'users'],
        ['admin', 'suppliers'],
        ['admin', 'reviews'],
        ['admin', 'coupons'],
        ['admin', 'flashSales'],
        ['admin', 'auditLogs'],
        ['staff', 'purchaseOrders'],
        ['staff', 'returns'],
        ['staff', 'categories'],
        ['catalog', 'books'],
        ['catalog', 'categories'],
        ['home'],
        ['promotions', 'active'],
        ['home', 'flash-sale', 'active'],
      ].forEach((queryKey) => {
        void queryClient.invalidateQueries({ queryKey })
      })
      void queryClient.refetchQueries({ type: 'active' })
    }

    const invalidateReviewCaches = (bookId?: number | null) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      if (bookId) {
        void queryClient.invalidateQueries({ queryKey: ['catalog', 'book', bookId, 'reviews'] })
        void queryClient.invalidateQueries({ queryKey: ['catalog', 'book', bookId] })
      }
    }

    const invalidateReturnCaches = () => {
      void queryClient.invalidateQueries({ queryKey: ['returns'] })
      void queryClient.invalidateQueries({ queryKey: ['staff', 'returns'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    }

    eventSource.addEventListener('notification', () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    })

    eventSource.addEventListener('realtime', (event) => {
      const payload = parseRealtimeEvent(event.data)
      if (!payload) {
        return
      }

      switch (payload.type) {
        case 'ORDER_CREATED':
          invalidateOrderCaches(payload.orderId)
          void queryClient.invalidateQueries({ queryKey: ['cart'] })
          invalidateInventoryCaches(payload.bookId)
          if (user && user.role !== 'CUSTOMER') {
            notification.info({
              message: payload.message || 'Có đơn hàng mới',
              description: payload.orderId ? `Mã đơn hàng: #${payload.orderId}` : undefined,
              placement: 'topRight',
            })
          }
          break
        case 'PAYMENT_SUCCESS':
          invalidateOrderCaches(payload.orderId)
          if (user?.role === 'CUSTOMER') {
            notification.success({ message: payload.message || 'Thanh toán thành công', placement: 'topRight' })
          }
          break
        case 'PAYMENT_FAILED':
          invalidateOrderCaches(payload.orderId)
          if (user?.role === 'CUSTOMER') {
            notification.warning({ message: payload.message || 'Thanh toán chưa hoàn tất', placement: 'topRight' })
          }
          break
        case 'ORDER_STATUS_CHANGED':
          invalidateOrderCaches(payload.orderId)
          if (user?.role === 'CUSTOMER') {
            notification.info({ message: payload.message || 'Đơn hàng đã được cập nhật', placement: 'topRight' })
          }
          break
        case 'INVENTORY_INCREASED':
        case 'INVENTORY_DECREASED':
          invalidateInventoryCaches(payload.bookId)
          break
        case 'PURCHASE_ORDER_UPDATED':
          invalidatePurchaseOrderCaches()
          if (user?.role === 'ADMIN' || user?.role === 'STAFF_WAREHOUSE') {
            notification.info({
              message: payload.message || 'PO mua hàng đã được cập nhật',
              placement: 'topRight',
            })
          }
          break
        case 'ADMIN_DATA_CHANGED':
          invalidateManagementCaches()
          break
        case 'REVIEW_UPDATED':
        case 'REVIEW_NEEDS_ACTION':
          invalidateReviewCaches(payload.bookId)
          if (user?.role === 'ADMIN') {
            notification.warning({
              message: payload.message || 'Có đánh giá mới',
              description: payload.bookId ? `Mã sách: #${payload.bookId}` : undefined,
              placement: 'topRight',
            })
          }
          break
        case 'RETURN_STATUS_CHANGED':
          invalidateReturnCaches()
          if (user?.role === 'CUSTOMER') {
            notification.info({
              message: payload.message || 'Yêu cầu trả hàng đã được cập nhật',
              placement: 'topRight',
            })
          }
          break
        case 'SESSION_EXPIRED':
          eventSource.close()
          useAuthStore.getState().clearAuth()
          notifySessionExpired()
          break
        default:
          break
      }
    })

    return () => eventSource.close()
  }, [accessToken, notification, queryClient, user])

  return null
}
