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

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT'

export type ActiveCoupon = {
  id: number
  code: string
  name: string
  description?: string | null
  discountType: DiscountType
  discountValue: number | string
  minOrderValue?: number | string | null
  maxDiscountValue?: number | string | null
  usageLimit?: number | null
  usedCount: number
  startDate?: string | null
  endDate?: string | null
}

export const promotionApi = {
  getActiveCoupons() {
    return unwrapApi<ActiveCoupon[]>(http.get('/promotions/active'))
  },

  validate(payload: ValidatePromotionRequest) {
    return unwrapApi<ValidatePromotionResponse>(http.post('/promotions/validate', payload))
  },
}
