import { http, unwrapApi } from '@/shared/api/http'

export type NewsletterSubscription = {
  email: string
  active: boolean
}

export const newsletterApi = {
  subscribe(email: string) {
    return unwrapApi<NewsletterSubscription>(http.post('/newsletter/subscribe', { email }))
  },
}
