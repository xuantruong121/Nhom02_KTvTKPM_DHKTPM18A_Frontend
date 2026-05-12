import { useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { cartApi } from '@/modules/cart/api/cartApi'
import { useApiMutation } from '@/shared/hooks/useApiQuery'
import { useIsAuthenticated } from '@/shared/store/authStore'

type AddToCartInput = {
  bookId: number
  quantity?: number
}

export function useAddToCart() {
  const isAuthenticated = useIsAuthenticated()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  const mutation = useApiMutation((payload: AddToCartInput) =>
    cartApi.addItem({ bookId: payload.bookId, quantity: payload.quantity ?? 1 })
  )

  const addToCart = async ({ bookId, quantity = 1 }: AddToCartInput) => {
    if (!isAuthenticated) {
      navigate('/auth/login', {
        state: {
          from: `${location.pathname}${location.search}`,
        },
      })
      return
    }

    await mutation.mutateAsync(
      { bookId, quantity },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: ['cart'] })
          void message.success('Đã thêm sách vào giỏ hàng')
        },
      }
    )
  }

  return {
    addToCart,
    isPending: mutation.isPending,
  }
}
