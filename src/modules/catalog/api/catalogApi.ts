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
  isbn?: string | null
  publicationYear?: number | null
  language?: string | null
  pageCount?: number | null
  coverType?: string | null
  originalPrice?: number | string | null
  averageRating?: number | string | null
  ratingCount?: number
  categoryIds?: number[]
}

export type BookSearchParams = {
  title?: string
  categoryId?: number
}

export const catalogApi = {
  getCategories() {
    return unwrapApi<Category[]>(http.get('/catalog/categories'))
  },
  getBooks(params?: BookSearchParams) {
    return unwrapApi<Book[]>(http.get('/catalog/books', { params }))
  },
}
