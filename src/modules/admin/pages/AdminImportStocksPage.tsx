import { App, Button, Card, InputNumber, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { adminApi, type InventoryStock } from '@/modules/admin/api/adminApi'
import { invalidateCatalogStockCaches } from '@/modules/admin/utils/invalidateAdminCaches'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'

type StockAction = {
  bookId: number
  amount: number
  mode: 'increase' | 'decrease'
}

export default function AdminImportStocksPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [amounts, setAmounts] = useState<Record<number, number>>({})
  const inventoryQuery = useApiQuery(['admin', 'inventory'], () => adminApi.getInventory())
  const booksQuery = useApiQuery(['admin', 'books'], () => adminApi.getBooks())

  const bookById = useMemo(
    () => new Map((booksQuery.data ?? []).map((book) => [book.id, book])),
    [booksQuery.data]
  )

  const sortedInventory = useMemo(() => {
    return [...(inventoryQuery.data ?? [])].sort((left, right) => {
      const leftBook = bookById.get(left.bookId)
      const rightBook = bookById.get(right.bookId)
      const leftLabel = leftBook ? `${leftBook.title} ${leftBook.author}` : ''
      const rightLabel = rightBook ? `${rightBook.title} ${rightBook.author}` : ''
      const byBookName = leftLabel.localeCompare(rightLabel, 'vi', { sensitivity: 'base' })
      return byBookName || left.bookId - right.bookId
    })
  }, [bookById, inventoryQuery.data])

  const stockMutation = useApiMutation(
    (action: StockAction) =>
      action.mode === 'increase'
        ? adminApi.increaseStock(action.bookId, action.amount)
        : adminApi.decreaseStock(action.bookId, action.amount),
    {
      onSuccess: async () => {
        void message.success('Đã cập nhật tồn kho')
        await invalidateCatalogStockCaches(queryClient)
      },
    }
  )

  const columns: ColumnsType<InventoryStock> = [
    { title: 'Book ID', dataIndex: 'bookId', width: 100 },
    {
      title: 'Sách',
      render: (_, stock) => {
        const book = bookById.get(stock.bookId)
        return book ? `${book.title} - ${book.author}` : `Book #${stock.bookId}`
      },
    },
    { title: 'Số lượng', dataIndex: 'quantity', width: 120 },
    { title: 'Cập nhật', dataIndex: 'updatedAt', width: 180 },
    {
      title: 'Điều chỉnh thủ công',
      render: (_, stock) => {
        const amount = amounts[stock.bookId] ?? 1
        return (
          <Space>
            <InputNumber
              min={1}
              value={amount}
              onChange={(value) => setAmounts((prev) => ({ ...prev, [stock.bookId]: Number(value ?? 1) }))}
            />
            <Button onClick={() => stockMutation.mutate({ bookId: stock.bookId, amount, mode: 'increase' })}>
              Tăng
            </Button>
            <Button danger onClick={() => stockMutation.mutate({ bookId: stock.bookId, amount, mode: 'decrease' })}>
              Giảm
            </Button>
          </Space>
        )
      },
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Nhập và điều chỉnh tồn kho
      </Typography.Title>
      <Card>
        <Table
          rowKey="bookId"
          columns={columns}
          dataSource={sortedInventory}
          loading={inventoryQuery.isLoading || booksQuery.isLoading}
        />
      </Card>
    </Space>
  )
}
