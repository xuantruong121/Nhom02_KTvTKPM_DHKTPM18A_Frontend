import { http, unwrapApi } from '@/shared/api/http'

export type ValidatePromotionRequest = {
  code: string
  orderTotal: number
}

export type ValidatePromotionResponse = {
  valid: boolean
  discountAmount: number | string
  finalAmount: number | string
  message?: string | null
}

export const promotionApi = {
  validate(payload: ValidatePromotionRequest) {
    return unwrapApi<ValidatePromotionResponse>(http.post('/promotions/validate', payload))
  },
}
