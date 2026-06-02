import { useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { cartApi } from '@/modules/cart/api/cartApi'
import { useApiMutation } from '@/shared/hooks/useApiQuery'
import { useIsAuthenticated } from '@/shared/store/authStore'

type AddToCartInput = {
  bookId: number
  quantity?: number
  flashSale?: boolean
  successMessage?: string | false
}

export function useAddToCart() {
  const isAuthenticated = useIsAuthenticated()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  const mutation = useApiMutation((payload: AddToCartInput) => {
    const request = { bookId: payload.bookId, quantity: payload.quantity ?? 1 }
    return payload.flashSale ? cartApi.addFlashSaleItem(request) : cartApi.addItem(request)
  })

  const addToCart = async ({
    bookId,
    quantity = 1,
    flashSale = false,
    successMessage,
  }: AddToCartInput) => {
    if (!isAuthenticated) {
      navigate('/auth/login', {
        state: {
          from: `${location.pathname}${location.search}`,
        },
      })
      return false
    }

    await mutation.mutateAsync(
      { bookId, quantity, flashSale },
      {
        onSuccess: async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['cart'] }),
            queryClient.invalidateQueries({ queryKey: ['home', 'flash-sale', 'active'] }),
          ])
          if (successMessage !== false) {
            void message.success(successMessage ?? 'Đã thêm sách vào giỏ hàng')
          }
        },
      }
    )
    return true
  }

  return {
    addToCart,
    isPending: mutation.isPending,
  }
}
