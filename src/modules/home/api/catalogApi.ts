import { http, unwrapApi } from '@/shared/api/http'

export type Category = {
  id: number
  name: string
  active?: boolean
  isActive?: boolean
}

export type Book = {
  id: number
  title: string
  author: string
  description?: string | null
  price: number | string
  quantity: number
  imageUrl?: string | null
  active?: boolean
  isActive?: boolean
  publisher?: string | null
  language?: string | null
  originalPrice?: number | string | null
  averageRating?: number | string | null
  ratingCount?: number
  categoryIds?: number[]
}

export const catalogApi = {
  getCategories() {
    return unwrapApi<Category[]>(http.get('/catalog/categories'))
  },
  getBooks() {
    return unwrapApi<Book[]>(http.get('/catalog/books'))
  },
}
