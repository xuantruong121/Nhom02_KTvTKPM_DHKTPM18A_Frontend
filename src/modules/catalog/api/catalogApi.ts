import { http, unwrapApi } from '@/shared/api/http'

export type Category = {
  id: number
  name: string
  active?: boolean
  isActive?: boolean
}

export type CategoryPayload = {
  name: string
}

export type Book = {
  id: number
  createdAt?: string
  updatedAt?: string
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

export type BookReview = {
  id: number
  bookId: number
  bookTitle: string
  userId: number
  orderId?: number | null
  reviewerName?: string
  reviewerEmail?: string
  rating: number
  content?: string | null
  editCount: number
  canEdit: boolean
  handlingStatus?: string
  issueType?: string | null
  adminPublicReply?: string | null
  adminRepliedAt?: string | null
  supportAction?: string | null
  flaggedAt?: string | null
  handledByUserId?: number | null
  handledAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export type BookReviewPayload = {
  rating: number
  content?: string
}

export const catalogApi = {
  getCategories() {
    return unwrapApi<Category[]>(http.get('/catalog/categories'))
  },
  createCategory(payload: CategoryPayload) {
    return unwrapApi<Category>(http.post('/catalog/categories', payload))
  },
  updateCategory(id: number, payload: CategoryPayload) {
    return unwrapApi<Category>(http.patch(`/catalog/categories/${id}`, payload))
  },
  deleteCategory(id: number) {
    return unwrapApi<void>(http.delete(`/catalog/categories/${id}`))
  },
  getBooks(params?: BookSearchParams) {
    return unwrapApi<Book[]>(http.get('/catalog/books', { params }))
  },
  getBook(id: number) {
    return unwrapApi<Book>(http.get(`/catalog/books/${id}`))
  },
  getBookReviews(bookId: number) {
    return unwrapApi<BookReview[]>(http.get(`/catalog/books/${bookId}/reviews`))
  },
  getMyBookReview(bookId: number) {
    return unwrapApi<BookReview | null>(http.get(`/catalog/books/${bookId}/reviews/me`))
  },
  submitBookReview(bookId: number, payload: BookReviewPayload) {
    return unwrapApi<BookReview>(http.post(`/catalog/books/${bookId}/reviews`, payload))
  },
}
