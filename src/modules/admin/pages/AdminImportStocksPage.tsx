import { App, Button, Card, Input, InputNumber, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { adminApi, type InventoryStock } from '@/modules/admin/api/adminApi'
import { invalidateCatalogStockCaches } from '@/modules/admin/utils/invalidateAdminCaches'
import { matchesKeyword } from '@/modules/admin/utils/search'
import { compareDate, compareNumber, compareText } from '@/modules/admin/utils/tableSort'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'
import './AdminImportStocksPage.css'

type StockAction = {
  bookId: number
  amount: number
  mode: 'increase' | 'decrease'
}

const LOW_STOCK_THRESHOLD = 10
const CRITICAL_STOCK_THRESHOLD = 3

function stockAlert(quantity: number) {
  if (quantity <= CRITICAL_STOCK_THRESHOLD) return { label: 'Sắp hết nghiêm trọng', color: 'red' }
  if (quantity < LOW_STOCK_THRESHOLD) return { label: 'Sắp hết hàng', color: 'orange' }
  return { label: 'Đủ hàng', color: 'green' }
}

export default function AdminImportStocksPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [amounts, setAmounts] = useState<Record<number, number>>({})
  const [keyword, setKeyword] = useState('')
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

  const inventory = useMemo(
    () =>
      sortedInventory.filter((stock) => {
        const book = bookById.get(stock.bookId)
        return matchesKeyword(
          keyword,
          stock.bookId,
          stock.quantity,
          book?.title,
          book?.author,
          book?.isbn
        )
      }),
    [bookById, keyword, sortedInventory]
  )

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
    { title: 'Book ID', dataIndex: 'bookId', width: 100, sorter: (a, b) => compareNumber(a.bookId, b.bookId) },
    {
      title: 'Sách',
      render: (_, stock) => {
        const book = bookById.get(stock.bookId)
        return book ? `${book.title} - ${book.author}` : `Book #${stock.bookId}`
      },
      sorter: (a, b) =>
        compareText(
          bookById.get(a.bookId) ? `${bookById.get(a.bookId)?.title} ${bookById.get(a.bookId)?.author}` : a.bookId,
          bookById.get(b.bookId) ? `${bookById.get(b.bookId)?.title} ${bookById.get(b.bookId)?.author}` : b.bookId
        ),
    },
    {
      title: 'Số lượng tồn',
      dataIndex: 'quantity',
      width: 140,
      render: (value: number) => {
        const alert = stockAlert(value)
        return <Tag color={alert.color}>{value}</Tag>
      },
      sorter: (a, b) => compareNumber(a.quantity, b.quantity),
    },
    {
      title: 'Cảnh báo',
      dataIndex: 'quantity',
      width: 180,
      render: (value: number) => {
        const alert = stockAlert(value)
        return <Tag color={alert.color}>{alert.label}</Tag>
      },
      sorter: (a, b) => compareNumber(a.quantity, b.quantity),
    },
    { title: 'Cập nhật', dataIndex: 'updatedAt', width: 180, sorter: (a, b) => compareDate(a.updatedAt, b.updatedAt) },
    {
      title: 'Điều chỉnh thủ công',
      render: (_, stock) => {
        const amount = amounts[stock.bookId] ?? 1
        return (
          <Space>
            <InputNumber
              min={1}
              value={amount}
              onChange={(value) =>
                setAmounts((prev) => ({ ...prev, [stock.bookId]: Number(value ?? 1) }))
              }
            />
            <Button
              onClick={() =>
                stockMutation.mutate({ bookId: stock.bookId, amount, mode: 'increase' })
              }
            >
              Tăng
            </Button>
            <Button
              danger
              onClick={() =>
                stockMutation.mutate({ bookId: stock.bookId, amount, mode: 'decrease' })
              }
            >
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
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input.Search
            allowClear
            placeholder="Tìm theo sách, tác giả, ISBN, Book ID"
            style={{ maxWidth: 360 }}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Table
            rowKey="bookId"
            columns={columns}
            dataSource={inventory}
            loading={inventoryQuery.isLoading || booksQuery.isLoading}
            rowClassName={(stock) =>
              stock.quantity <= CRITICAL_STOCK_THRESHOLD
                ? 'inventory-row-critical'
                : stock.quantity < LOW_STOCK_THRESHOLD
                  ? 'inventory-row-low'
                  : ''
            }
          />
        </Space>
      </Card>
    </Space>
  )
}
