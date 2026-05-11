import { http, unwrapApi } from '@/shared/api/http'
import type { ApiResponse } from '@/shared/api/types'
import type { LoginRequest, RegisterRequest, TokenPair } from '@/modules/auth/types'

export const authApi = {
  login(payload: LoginRequest): Promise<TokenPair> {
    return unwrapApi(http.post<ApiResponse<TokenPair>>('/auth/login', payload))
  },

  register(payload: RegisterRequest): Promise<TokenPair> {
    return unwrapApi(http.post<ApiResponse<TokenPair>>('/auth/register', payload))
  },

  refresh(): Promise<TokenPair> {
    return unwrapApi(http.post<ApiResponse<TokenPair>>('/auth/refresh', {}))
  },

  logout(): Promise<void> {
    return unwrapApi(http.post<ApiResponse<void>>('/auth/logout', {}))
  },

  forgotPassword(email: string): Promise<void> {
    return unwrapApi(http.post<ApiResponse<void>>('/auth/forgot-password', { email }))
  },

  resetPassword(payload: { email: string; otp: string; newPassword: string }): Promise<void> {
    return unwrapApi(http.post<ApiResponse<void>>('/auth/reset-password', payload))
  },
}
