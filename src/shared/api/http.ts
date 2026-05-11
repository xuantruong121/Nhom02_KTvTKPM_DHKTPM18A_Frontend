import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { env } from '@/shared/config/env'
import type { ApiErrorBody, ApiResponse } from '@/shared/api/types'
import { getDeviceId } from '@/shared/api/deviceId'
import { useAuthStore } from '@/shared/store/authStore'

type RefreshPair = {
  accessToken: string
  refreshToken?: string
  deviceId?: string
}

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true, // gửi cookie refreshToken (HttpOnly) đến BE
})

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  config.headers.set('X-Device-ID', getDeviceId())
  if (!config.headers.has('Content-Type') && config.data !== undefined) {
    config.headers.set('Content-Type', 'application/json')
  }
  return config
})

// Refresh-once mutex: nếu nhiều request fail 401 cùng lúc, chỉ gọi /auth/refresh 1 lần.
let refreshPromise: Promise<string | null> | null = null

async function callRefresh(): Promise<string | null> {
  try {
    const res = await axios.post<ApiResponse<RefreshPair>>(
      `${env.apiBaseUrl}/auth/refresh`,
      {},
      {
        withCredentials: true,
        headers: { 'X-Device-ID': getDeviceId() },
      }
    )
    if (res.data?.success && res.data.data?.accessToken) {
      useAuthStore.getState().setAccessToken(res.data.data.accessToken)
      return res.data.data.accessToken
    }
    return null
  } catch {
    return null
  }
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined
    const status = error.response?.status

    const isAuthEndpoint =
      typeof original?.url === 'string' &&
      (original.url.includes('/auth/login') ||
        original.url.includes('/auth/register') ||
        original.url.includes('/auth/refresh'))

    if (status === 401 && original && !original._retried && !isAuthEndpoint) {
      original._retried = true
      if (!refreshPromise) {
        refreshPromise = callRefresh().finally(() => {
          refreshPromise = null
        })
      }
      const newToken = await refreshPromise
      if (newToken) {
        original.headers = {
          ...(original.headers ?? {}),
          Authorization: `Bearer ${newToken}`,
        }
        return http(original)
      }
      useAuthStore.getState().clearAuth()
    }
    return Promise.reject(error)
  }
)

/** Trích `data` từ envelope ApiResponse; ném lỗi có message từ server. */
export async function unwrapApi<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const { data: envelope } = await promise
  if (!envelope.success) {
    throw new Error(envelope.message || 'Yêu cầu thất bại')
  }
  return envelope.data
}

export function isAxiosApiError(err: unknown): err is AxiosError<ApiErrorBody> {
  return axios.isAxiosError(err) && err.response?.data !== undefined
}

export function getErrorMessage(err: unknown): string {
  if (isAxiosApiError(err)) {
    const body = err.response?.data
    if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') {
      return body.message
    }
    return err.message
  }
  if (err instanceof Error) return err.message
  return 'Đã xảy ra lỗi không xác định'
}
