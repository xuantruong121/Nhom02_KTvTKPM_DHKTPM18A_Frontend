import { http, unwrapApi } from '@/shared/api/http'

export type CartItem = {
  bookId: number
  title: string
  price: number | string
  quantity: number
}

export type Cart = {
  userId: number
  items: CartItem[]
  totalAmount?: number | string
  totalPrice?: number | string
}

export type AddCartItemRequest = {
  bookId: number
  quantity: number
}

export type UpdateCartItemRequest = {
  bookId: number
  quantity: number
}

export const cartApi = {
  getCart() {
    return unwrapApi<Cart>(http.get('/cart'))
  },
  addItem(payload: AddCartItemRequest) {
    return unwrapApi<string>(http.post('/cart/items', payload))
  },
  updateItem(payload: UpdateCartItemRequest) {
    return unwrapApi<string>(http.put('/cart/items', payload))
  },
  removeItem(bookId: number) {
    return unwrapApi<string>(http.delete(`/cart/items/${bookId}`))
  },
  clearCart() {
    return unwrapApi<string>(http.delete('/cart'))
  },
}
