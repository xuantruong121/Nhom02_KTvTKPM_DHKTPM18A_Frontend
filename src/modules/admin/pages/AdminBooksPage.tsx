import { App, Button, Card, DatePicker, Image, Input, Popconfirm, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { adminApi, type AdminBook, type BookPayload } from '@/modules/admin/api/adminApi'
import { invalidateCatalogStockCaches } from '@/modules/admin/utils/invalidateAdminCaches'
import { matchesKeyword } from '@/modules/admin/utils/search'
import StaffBookModal from '@/modules/staff/components/StaffBookModal'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'

type AdminBooksPageProps = {
  canDelete?: boolean
}

function money(value: number | string | undefined) {
  return Number(value ?? 0).toLocaleString('vi-VN')
}

export default function AdminBooksPage({ canDelete = true }: AdminBooksPageProps) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [editingBook, setEditingBook] = useState<AdminBook | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [salesRange, setSalesRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)

  const salesFilters = useMemo(
    () => ({
      from: salesRange?.[0]?.format('YYYY-MM-DD'),
      to: salesRange?.[1]?.format('YYYY-MM-DD'),
    }),
    [salesRange]
  )
  const hasSalesDateFilter = Boolean(salesFilters.from || salesFilters.to)

  const booksQuery = useApiQuery(['admin', 'books'], () => adminApi.getBooks(), {
    refetchInterval: 5_000,
  })
  const bookSalesQuery = useApiQuery(['admin', 'bookSales', salesFilters], () =>
    adminApi.getBookSales(salesFilters)
  )
  const categoriesQuery = useApiQuery(['admin', 'bookCategories'], () => adminApi.getCategories())

  const salesByBookId = useMemo(() => {
    return new Map((bookSalesQuery.data ?? []).map((item) => [item.bookId, item]))
  }, [bookSalesQuery.data])

  const saveMutation = useApiMutation(
    (payload: BookPayload) =>
      editingBook ? adminApi.updateBook(editingBook.id, payload) : adminApi.createBook(payload),
    {
      onSuccess: async () => {
        void message.success('Đã lưu sách')
        setModalOpen(false)
        setEditingBook(null)
        await invalidateCatalogStockCaches(queryClient)
      },
    }
  )

  const deleteMutation = useApiMutation((id: number) => adminApi.deleteBook(id), {
    onSuccess: async () => {
      void message.success('Đã xóa sách')
      await invalidateCatalogStockCaches(queryClient)
    },
  })

  const books = useMemo(
    () =>
      (booksQuery.data ?? []).filter((book) => {
        const matchesSearch = matchesKeyword(
          keyword,
          book.id,
          book.title,
          book.author,
          book.publisher,
          book.isbn,
          book.price,
          book.quantity,
          salesByBookId.get(book.id)?.quantitySold ?? 0
        )
        if (!matchesSearch) return false
        if (!hasSalesDateFilter) return true
        return (salesByBookId.get(book.id)?.quantitySold ?? 0) > 0
      }),
    [booksQuery.data, hasSalesDateFilter, keyword, salesByBookId]
  )

  const columns: ColumnsType<AdminBook> = [
    {
      title: 'Ảnh',
      dataIndex: 'imageUrl',
      width: 90,
      render: (url?: string) => (url ? <Image width={48} height={64} src={url} /> : '-'),
    },
    {
      title: 'Sách',
      render: (_, book) => (
        <Space direction="vertical" size={0}>
          <strong>{book.title}</strong>
          <Typography.Text type="secondary">{book.author}</Typography.Text>
        </Space>
      ),
    },
    { title: 'Giá', dataIndex: 'price', render: money, width: 130 },
    { title: 'Tồn', dataIndex: 'quantity', width: 90 },
    {
      title: 'Bán ra',
      width: 110,
      sorter: (a, b) =>
        (salesByBookId.get(a.id)?.quantitySold ?? 0) - (salesByBookId.get(b.id)?.quantitySold ?? 0),
      render: (_, book) => {
        const sales = salesByBookId.get(book.id)
        return (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{sales?.quantitySold ?? 0}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {money(sales?.revenue)} đ
            </Typography.Text>
          </Space>
        )
      },
    },
    {
      title: 'Trạng thái',
      render: (_, book) => (
        <Tag color={(book.active ?? book.isActive ?? true) ? 'green' : 'red'}>ACTIVE</Tag>
      ),
      width: 120,
    },
    {
      title: '',
      render: (_, book) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setEditingBook(book)
              setModalOpen(true)
            }}
          >
            Sửa
          </Button>
          {canDelete ? (
            <Popconfirm
              title="Xóa sách?"
              description={`Bạn có chắc muốn xóa "${book.title}"?`}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
              onConfirm={() => deleteMutation.mutate(book.id)}
            >
              <Button danger type="link">
                Xóa
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
      width: 140,
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Quản lý sách
        </Typography.Title>
        <Button
          type="primary"
          onClick={() => {
            setEditingBook(null)
            setModalOpen(true)
          }}
        >
          Thêm sách
        </Button>
      </Space>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input.Search
            allowClear
            placeholder="Tim theo ten sach, tac gia, NXB, ISBN"
            style={{ maxWidth: 360 }}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <DatePicker.RangePicker
            allowClear
            format="DD/MM/YYYY"
            placeholder={['Từ ngày', 'Đến ngày']}
            value={salesRange}
            onChange={(range) => setSalesRange(range)}
          />
          <Table
            rowKey="id"
            columns={columns}
            dataSource={books}
            loading={booksQuery.isLoading || bookSalesQuery.isLoading}
          />
        </Space>
      </Card>
      <StaffBookModal
        open={modalOpen}
        book={editingBook}
        categories={categoriesQuery.data ?? []}
        loading={saveMutation.isPending}
        onCancel={() => setModalOpen(false)}
        onSubmit={(payload) => saveMutation.mutate(payload)}
      />
    </Space>
  )
}
