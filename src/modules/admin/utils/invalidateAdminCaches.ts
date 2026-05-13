import type { QueryClient } from '@tanstack/react-query'

export async function invalidateCatalogStockCaches(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['admin', 'books'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] }),
    queryClient.invalidateQueries({ queryKey: ['catalog', 'books'] }),
  ])
}

export async function invalidateAdminOrderCaches(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'books'] }),
    queryClient.invalidateQueries({ queryKey: ['catalog', 'books'] }),
  ])
}

export async function invalidateAdminReturnCaches(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['staff', 'returns'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'books'] }),
    queryClient.invalidateQueries({ queryKey: ['catalog', 'books'] }),
  ])
}

export async function invalidatePurchaseOrderCaches(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['staff', 'purchaseOrders'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'books'] }),
    queryClient.invalidateQueries({ queryKey: ['catalog', 'books'] }),
  ])
}
