import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { env } from '@/shared/config/env'
import type { ApiErrorBody, ApiResponse } from '@/shared/api/types'
import { getDeviceId } from '@/shared/api/deviceId'
import { useAuthStore } from '@/shared/store/authStore'
import { notifySessionExpired } from '@/shared/auth/sessionExpiredEvent'

type RefreshPair = {
  accessToken: string
  refreshToken?: string
  deviceId?: string
}

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
})

export const httpV2 = axios.create({
  baseURL: env.apiBaseUrl.replace(/\/v1\/?$/, '/v2'),
  withCredentials: true,
})

function attachRequestInterceptor(client: AxiosInstance) {
  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    config.headers.set('X-Device-ID', getDeviceId())
    if (!config.headers.has('Content-Type') && config.data !== undefined && !(config.data instanceof FormData)) {
      config.headers.set('Content-Type', 'application/json')
    }
    return config
  })
}

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

function attachResponseInterceptor(client: AxiosInstance) {
  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError<ApiErrorBody>) => {
      const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined
      const status = error.response?.status
      const hadAuthenticatedSession =
        useAuthStore.getState().accessToken !== null || useAuthStore.getState().user !== null

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
          return client(original)
        }
        useAuthStore.getState().clearAuth()
        if (hadAuthenticatedSession) {
          notifySessionExpired()
        }
      }
      return Promise.reject(error)
    }
  )
}

attachRequestInterceptor(http)
attachRequestInterceptor(httpV2)
attachResponseInterceptor(http)
attachResponseInterceptor(httpV2)

export async function unwrapApi<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const { data: envelope } = await promise
  if (!envelope.success) {
    throw new Error(envelope.message || 'Yeu cau that bai')
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
  return 'Da xay ra loi khong xac dinh'
}
