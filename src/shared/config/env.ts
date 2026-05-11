/**
 * Biến môi trường Vite (prefix VITE_). Copy `.env.example` -> `.env` và chỉnh nếu cần.
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
} as const
