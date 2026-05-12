/**
 * Shared hook wrappers for TanStack Query.
 * Mọi module import từ đây để đảm bảo pattern nhất quán.
 *
 * Usage:
 *   const { data, isLoading } = useApiQuery(['profile'], () => accountApi.getProfile())
 *   const mutation = useApiMutation((id) => accountApi.deleteAddress(id), {
 *     onSuccess: () => message.success('Đã xóa địa chỉ'),
 *   })
 */
import {
  useMutation,
  useQuery,
  type MutationFunction,
  type MutationKey,
  type QueryFunction,
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { App } from 'antd'
import { getErrorMessage } from '@/shared/api/http'

// ─── Query ───────────────────────────────────────────────────────────────────

export function useApiQuery<TData = unknown, TError = unknown>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TData, QueryKey>,
  options?: Omit<UseQueryOptions<TData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, TError, TData, QueryKey>({ queryKey, queryFn, ...options })
}

// ─── Mutation ────────────────────────────────────────────────────────────────

type UseApiMutationOptions<TData, TError, TVariables, TContext> = UseMutationOptions<
  TData,
  TError,
  TVariables,
  TContext
> & {
  /** Nếu bật, tự động hiện message.error khi mutation thất bại. */
  showErrorMessage?: boolean
  mutationKey?: MutationKey
}

export function useApiMutation<TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
  mutationFn: MutationFunction<TData, TVariables>,
  options?: UseApiMutationOptions<TData, TError, TVariables, TContext>
) {
  const { message } = App.useApp()
  const { showErrorMessage = true, mutationKey, ...rest } = options ?? {}

  return useMutation({
    mutationKey,
    mutationFn,
    onError(err, variables, context) {
      if (showErrorMessage) {
        void message.error(getErrorMessage(err as unknown))
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(rest as any).onError?.(err, variables, context)
    },
    ...rest,
  } as UseMutationOptions<TData, TError, TVariables, TContext>)
}
