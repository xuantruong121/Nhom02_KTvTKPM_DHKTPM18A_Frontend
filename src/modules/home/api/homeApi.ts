import { http, unwrapApi } from '@/shared/api/http'
import type { Book } from '@/modules/catalog/api/catalogApi'

export type HomeBook = Book & {
  discountPercent?: number | null
  quantitySold?: number | null
  revenue?: number | string | null
  badge?: string | null
  reason?: string | null
}

export type HomeSection = {
  key: string
  title: string
  books: HomeBook[]
}

export type HomeDiscovery = {
  snapshotDate: string
  sections: HomeSection[]
}

export type HomeFlashSale = {
  startAt?: string | null
  endAt?: string | null
  items: Array<HomeBook & {
    bookId: number
    salePrice: number | string
    saleQuantity: number
    discountPercent: number
    startAt: string
    endAt: string
  }>
}

export type HomeDiscoveryParams = {
  limit?: number
}

export const homeApi = {
  getDiscovery(params?: HomeDiscoveryParams) {
    return unwrapApi<HomeDiscovery>(http.get('/home', { params }))
  },
  getTrendingBooks(params?: HomeDiscoveryParams) {
    return unwrapApi<HomeBook[]>(http.get('/home/trending', { params }))
  },
  getHotBooks(params?: HomeDiscoveryParams) {
    return unwrapApi<HomeBook[]>(http.get('/home/hot-books', { params }))
  },
  getShockSaleBooks(params?: HomeDiscoveryParams) {
    return unwrapApi<HomeBook[]>(http.get('/home/shock-sale', { params }))
  },
  getRankingBooks(type = 'BEST_SELLER', params?: HomeDiscoveryParams) {
    return unwrapApi<HomeBook[]>(http.get('/home/rankings', { params: { ...params, type } }))
  },
  getActiveFlashSale() {
    return unwrapApi<HomeFlashSale>(http.get('/flash-sales/active'))
  },
}
