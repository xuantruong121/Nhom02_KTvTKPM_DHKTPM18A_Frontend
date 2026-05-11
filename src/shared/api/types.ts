/**
 * Khớp `iuh.fit.se.shared.api.ApiResponse` (Backend).
 */
export type ApiResponse<T> = {
  success: boolean
  code: number
  message: string
  data: T
  timestamp?: string
}

export type ApiErrorBody = {
  success: false
  code: number
  message: string
  data?: unknown
  timestamp?: string
}
