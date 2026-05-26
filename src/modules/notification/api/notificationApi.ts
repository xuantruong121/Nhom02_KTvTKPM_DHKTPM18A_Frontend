import { http, unwrapApi } from '@/shared/api/http'

export type WebNotification = {
  id: number
  orderId?: number
  title: string
  message: string
  channel?: string
  createdAt?: string
  readAt?: string | null
}

export const notificationApi = {
  getMyNotifications() {
    return unwrapApi<WebNotification[]>(http.get('/notifications'))
  },
  markAsRead(id: number) {
    return unwrapApi<void>(http.put(`/notifications/${id}/read`))
  },
  markAllAsRead() {
    return unwrapApi<void>(http.put('/notifications/read-all'))
  },
}
