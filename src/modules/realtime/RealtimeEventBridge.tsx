import { App } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { env } from '@/shared/config/env'
import { useAuthStore } from '@/shared/store/authStore'
import type { RealtimeEvent } from '@/modules/realtime/types'
import { notifySessionExpired } from '@/shared/auth/sessionExpiredEvent'

type RealtimeEnvelope = {
  event?: 'connected' | 'notification' | 'realtime'
  data?: unknown
}

function parseRealtimeEvent(raw: string): RealtimeEvent | null {
  try {
    return parseRealtimePayload(JSON.parse(raw))
  } catch {
    return null
  }
}

function parseRealtimePayload(value: unknown): RealtimeEvent | null {
  if (!value || typeof value !== 'object') return null
  const payload = value as Partial<RealtimeEvent>
  return typeof payload.type === 'string' ? (payload as RealtimeEvent) : null
}

function parseRealtimeEnvelope(raw: string): RealtimeEnvelope | null {
  try {
    const value = JSON.parse(raw) as RealtimeEnvelope
    return typeof value.event === 'string' ? value : null
  } catch {
    return null
  }
}

function buildNotificationSocketUrl(accessToken: string) {
  const apiBaseUrl = env.apiBaseUrl.replace(/\/$/, '')
  const baseUrl = /^https?:\/\//i.test(apiBaseUrl)
    ? apiBaseUrl
    : `${window.location.origin}${apiBaseUrl.startsWith('/') ? '' : '/'}${apiBaseUrl}`
  const url = new URL(`${baseUrl}/notifications/ws`)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.searchParams.set('token', accessToken)
  return url.toString()
}

export default function RealtimeEventBridge() {
  const { notification } = App.useApp()
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    const invalidate = (...queryKeys: Array<readonly unknown[]>) => {
      queryKeys.forEach((queryKey) => void queryClient.invalidateQueries({ queryKey }))
    }

    const invalidateCatalog = (bookId?: number | null) => {
      invalidate(
        ['admin', 'books'],
        ['admin', 'bookCategories'],
        ['admin', 'dashboard'],
        ['catalog', 'books'],
        ['home'],
        ['cart']
      )
      if (bookId) invalidate(['catalog', 'book', bookId])
    }

    const invalidateCategories = () => {
      invalidate(
        ['admin', 'categories'],
        ['admin', 'bookCategories'],
        ['admin', 'books'],
        ['admin', 'dashboard'],
        ['staff', 'categories'],
        ['catalog', 'categories'],
        ['catalog', 'books'],
        ['home']
      )
    }

    const invalidateInventory = (bookId?: number | null) => {
      invalidate(
        ['admin', 'inventory'],
        ['admin', 'books'],
        ['admin', 'dashboard'],
        ['catalog', 'books'],
        ['home'],
        ['cart']
      )
      if (bookId) invalidate(['catalog', 'book', bookId])
    }

    const invalidatePromotions = (includeFlashSale: boolean, bookId?: number | null) => {
      invalidate(['admin', 'coupons'], ['promotions', 'active'])
      if (includeFlashSale) {
        invalidate(['admin', 'flashSales'], ['home'], ['catalog', 'books'], ['cart'])
      }
      if (bookId) invalidate(['catalog', 'book', bookId])
    }

    const invalidateOrders = (orderId?: number | null) => {
      invalidate(['orders'], ['orders', 'my'], ['admin', 'orders'], ['admin', 'dashboard'])
      if (orderId) invalidate(['orders', orderId], ['admin', 'orders', orderId])
    }

    const invalidateNotifications = () => invalidate(['notifications'])

    const invalidateReturns = () => {
      invalidate(['returns', 'my'], ['staff', 'returns'], ['admin', 'dashboard'])
    }

    const invalidateReviews = (bookId?: number | null) => {
      invalidate(['admin', 'reviews'], ['admin', 'dashboard'], ['catalog', 'books'], ['home'])
      if (bookId) invalidate(['catalog', 'book', bookId], ['catalog', 'book', bookId, 'reviews'])
    }

    const invalidatePurchaseOrders = (purchaseOrderId?: number | null) => {
      invalidate(['staff', 'purchaseOrders'], ['admin', 'inventory'], ['admin', 'books'], ['admin', 'dashboard'])
      if (purchaseOrderId) invalidate(['staff', 'purchaseOrders', purchaseOrderId])
    }

    const invalidateStocktakes = (stocktakeId?: number | null) => {
      invalidate(['admin', 'stocktakes'])
      if (stocktakeId) invalidate(['admin', 'stocktakes', stocktakeId])
    }

    const invalidateFallback = (source?: string | null) => {
      switch (source) {
        case 'BOOK':
          invalidateCatalog()
          break
        case 'CATEGORY':
          invalidateCategories()
          break
        case 'COUPON':
          invalidatePromotions(false)
          break
        case 'FLASH_SALE':
          invalidatePromotions(true)
          break
        case 'SUPPLIER':
          invalidate(['admin', 'suppliers'], ['staff', 'purchaseOrders'])
          break
        case 'STOCKTAKE':
          invalidateStocktakes()
          break
        default:
          invalidate(['admin', 'dashboard'], ['admin', 'auditLogs'])
      }
    }

    const handleRealtimePayload = (payload: RealtimeEvent) => {
      switch (payload.type) {
        case 'ORDER_CREATED':
          invalidateOrders(payload.orderId)
          invalidate(['cart'])
          invalidateNotifications()
          if (user && user.role !== 'CUSTOMER') {
            notification.info({
              message: payload.message || 'Có đơn hàng mới',
              description: payload.orderId ? `Mã đơn hàng: #${payload.orderId}` : undefined,
              placement: 'topRight',
            })
          }
          break
        case 'PAYMENT_SUCCESS':
        case 'PAYMENT_FAILED':
          invalidateOrders(payload.orderId)
          invalidateNotifications()
          if (user?.role === 'CUSTOMER') {
            notification[payload.type === 'PAYMENT_SUCCESS' ? 'success' : 'warning']({
              message: payload.message || 'Trạng thái thanh toán đã thay đổi',
              placement: 'topRight',
            })
          }
          break
        case 'ORDER_STATUS_CHANGED':
          invalidateOrders(payload.orderId)
          invalidateNotifications()
          if (user?.role === 'CUSTOMER') {
            notification.info({
              message: payload.message || 'Đơn hàng đã được cập nhật',
              placement: 'topRight',
            })
          }
          break
        case 'BOOK_CHANGED':
          invalidateCatalog(payload.bookId)
          break
        case 'CATEGORY_CHANGED':
          invalidateCategories()
          break
        case 'INVENTORY_INITIALIZED':
        case 'INVENTORY_INCREASED':
        case 'INVENTORY_DECREASED':
          invalidateInventory(payload.bookId)
          break
        case 'COUPON_CHANGED':
          invalidatePromotions(false)
          break
        case 'FLASH_SALE_CHANGED':
          invalidatePromotions(true, payload.bookId)
          break
        case 'SUPPLIER_CHANGED':
          invalidate(['admin', 'suppliers'], ['staff', 'purchaseOrders'])
          break
        case 'PURCHASE_ORDER_UPDATED':
          invalidatePurchaseOrders(payload.purchaseOrderId)
          if (user?.role === 'ADMIN' || user?.role === 'STAFF_WAREHOUSE') {
            notification.info({ message: payload.message || 'PO mua hàng đã được cập nhật', placement: 'topRight' })
          }
          break
        case 'STOCKTAKE_UPDATED':
          invalidateStocktakes(payload.stocktakeId)
          break
        case 'RETURN_CREATED':
        case 'RETURN_STATUS_CHANGED':
          invalidateReturns()
          if (payload.type === 'RETURN_CREATED' && user?.role !== 'CUSTOMER') {
            notification.info({ message: payload.message || 'Có yêu cầu trả hàng mới', placement: 'topRight' })
          }
          if (payload.type === 'RETURN_STATUS_CHANGED' && user?.role === 'CUSTOMER') {
            notification.info({ message: payload.message || 'Yêu cầu trả hàng đã được cập nhật', placement: 'topRight' })
          }
          break
        case 'REVIEW_UPDATED':
        case 'REVIEW_NEEDS_ACTION':
        case 'REVIEW_DELETED':
          invalidateReviews(payload.bookId)
          if (payload.type === 'REVIEW_NEEDS_ACTION' && user?.role === 'ADMIN') {
            notification.warning({ message: payload.message || 'Có đánh giá cần xử lý', placement: 'topRight' })
          }
          break
        case 'USER_CHANGED':
          invalidate(['admin', 'users'], ['admin', 'dashboard'])
          break
        case 'CUSTOMER_CONTACT_CHANGED':
          invalidate(['admin', 'orders'])
          break
        case 'AUDIT_LOG_CHANGED':
          invalidate(['admin', 'auditLogs'])
          break
        case 'ADMIN_DATA_CHANGED':
          invalidateFallback(payload.status)
          break
        case 'SESSION_EXPIRED':
          useAuthStore.getState().clearAuth()
          notifySessionExpired()
          break
        default:
          break
      }
    }

    if (accessToken && user) {
      let stopped = false
      let socket: WebSocket | null = null
      let reconnectTimer: ReturnType<typeof window.setTimeout> | undefined

      const connect = () => {
        socket = new WebSocket(buildNotificationSocketUrl(accessToken))
        socket.onmessage = (event) => {
          const envelope = parseRealtimeEnvelope(event.data)
          if (!envelope) return
          if (envelope.event === 'notification') {
            invalidateNotifications()
            return
          }
          if (envelope.event === 'realtime') {
            const payload = parseRealtimePayload(envelope.data)
            if (payload) handleRealtimePayload(payload)
          }
        }
        socket.onclose = () => {
          if (!stopped) reconnectTimer = window.setTimeout(connect, 2000)
        }
        socket.onerror = () => socket?.close()
      }

      connect()
      return () => {
        stopped = true
        if (reconnectTimer) window.clearTimeout(reconnectTimer)
        socket?.close()
      }
    }

    const eventSource = new EventSource(`${env.apiBaseUrl}/notifications/public-stream`)
    eventSource.addEventListener('realtime', (event) => {
      const payload = parseRealtimeEvent(event.data)
      if (payload) handleRealtimePayload(payload)
    })
    return () => eventSource.close()
  }, [accessToken, notification, queryClient, user])

  return null
}
