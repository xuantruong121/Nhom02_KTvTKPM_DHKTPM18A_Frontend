import { App, Button, Card, Image, Input, Modal, Select, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  adminApi,
  type ItemCondition,
  type ReturnRequest,
} from '@/modules/admin/api/adminApi'
import { invalidateAdminReturnCaches } from '@/modules/admin/utils/invalidateAdminCaches'
import { matchesKeyword } from '@/modules/admin/utils/search'
import { compareNumber, compareText } from '@/modules/admin/utils/tableSort'
import { catalogApi } from '@/modules/catalog/api/catalogApi'
import { formatMoney } from '@/modules/order/utils/orderFormat'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'

type ReturnAction = 'approve' | 'receive' | 'refund' | 'reject'

const CONDITIONS: ItemCondition[] = ['GOOD', 'DAMAGED', 'MISSING_PARTS', 'UNSELLABLE']
const ALL_STATUSES = 'ALL'

const returnStatusOptions = [
  { value: ALL_STATUSES, label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'RECEIVED', label: 'Đã nhận hàng' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền' },
  { value: 'REJECTED', label: 'Đã từ chối' },
]

const returnReasonLabels: Record<string, string> = {
  DEFECTIVE: 'Sản phẩm bị lỗi / hư hỏng',
  WRONG_ITEM: 'Giao sai sản phẩm',
  NO_LONGER_NEEDED: 'Không còn nhu cầu sử dụng',
}

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString('vi-VN') : '-'

export default function StaffReturnRequestsPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const returnsQuery = useApiQuery(['staff', 'returns'], () => adminApi.getReturns())
  const booksQuery = useApiQuery(['catalog', 'books', 'staff-returns'], () => catalogApi.getBooks())
  const [active, setActive] = useState<{ request: ReturnRequest; action: ReturnAction } | null>(
    null
  )
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES)
  const [reason, setReason] = useState('')
  const [conditions, setConditions] = useState<ItemCondition[]>(['GOOD'])

  const booksById = useMemo(
    () => new Map((booksQuery.data ?? []).map((book) => [book.id, book])),
    [booksQuery.data]
  )

  const sortedReturns = useMemo(() => {
    return [...(returnsQuery.data ?? [])]
      .filter((request) => statusFilter === ALL_STATUSES || request.status === statusFilter)
      .filter((request) =>
        matchesKeyword(
          keyword,
          request.id,
          request.orderId,
          request.status,
          request.reason,
          request.notes,
          request.items
            ?.map((item) => `${item.bookId} ${booksById.get(item.bookId)?.title ?? ''} ${item.quantity}`)
            .join(' ')
        )
      )
      .sort((left, right) => {
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0
        if (rightTime !== leftTime) return rightTime - leftTime
        return String(right.id).localeCompare(String(left.id), 'vi', { numeric: true })
      })
  }, [booksById, keyword, returnsQuery.data, statusFilter])

  const openAction = (request: ReturnRequest, action: ReturnAction) => {
    setActive({ request, action })
    setReason('')
    setConditions(Array.from({ length: Math.max(request.items?.length ?? 1, 1) }, () => 'GOOD'))
  }

  const actionMutation = useApiMutation(
    async () => {
      if (!active) return
      if (active.action === 'approve') return adminApi.approveReturn(active.request.id)
      if (active.action === 'refund') return adminApi.refundReturn(active.request.id)
      if (active.action === 'reject') return adminApi.rejectReturn(active.request.id, reason)
      return adminApi.receiveReturn(active.request.id, conditions)
    },
    {
      onSuccess: async () => {
        void message.success('Đã cập nhật yêu cầu trả hàng')
        setActive(null)
        setReason('')
        setConditions(['GOOD'])
        await invalidateAdminReturnCaches(queryClient)
      },
    }
  )

  const columns: ColumnsType<ReturnRequest> = [
    { title: 'Mã', dataIndex: 'id', width: 120, sorter: (a, b) => compareText(a.id, b.id) },
    { title: 'Đơn hàng', dataIndex: 'orderId', width: 120, sorter: (a, b) => compareNumber(a.orderId, b.orderId) },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      width: 180,
      render: (value: string) => returnReasonLabels[value] ?? value,
      sorter: (a, b) => compareText(a.reason, b.reason),
    },
    {
      title: 'Lý do chi tiết',
      dataIndex: 'notes',
      width: 360,
      render: (value?: string) =>
        value ? (
          <Typography.Paragraph ellipsis={{ rows: 3, expandable: true }} style={{ margin: 0 }}>
            {value}
          </Typography.Paragraph>
        ) : (
          '-'
        ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      width: 170,
      render: (value?: string) => formatDateTime(value),
    },
    {
      title: 'Sản phẩm trả',
      dataIndex: 'items',
      width: 260,
      render: (items: ReturnRequest['items']) =>
        items?.length
          ? items
              .map((item) => `${booksById.get(item.bookId)?.title ?? `Book #${item.bookId}`} x${item.quantity}`)
              .join(', ')
          : '-',
    },
    {
      title: 'Hoàn tiền',
      dataIndex: 'refundAmount',
      width: 130,
      render: (value: ReturnRequest['refundAmount']) => formatMoney(value),
      sorter: (a, b) => compareNumber(Number(a.refundAmount ?? 0), Number(b.refundAmount ?? 0)),
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'evidenceImageUrl',
      width: 110,
      render: (value?: string | null) =>
        value ? (
          <Image
            width={56}
            height={56}
            src={value}
            alt="Anh minh chung"
            style={{ objectFit: 'cover', borderRadius: 6 }}
          />
        ) : (
          '-'
        ),
    },
    {
      title: 'Thao tác',
      render: (_, request) => (
        <Space wrap>
          <Button
            size="small"
            disabled={request.status !== 'PENDING'}
            onClick={() => openAction(request, 'approve')}
          >
            Duyệt
          </Button>
          <Button
            size="small"
            disabled={request.status !== 'APPROVED'}
            onClick={() => openAction(request, 'receive')}
          >
            Đã nhận
          </Button>
          <Button
            size="small"
            disabled={request.status !== 'RECEIVED'}
            onClick={() => openAction(request, 'refund')}
          >
            Hoàn tiền
          </Button>
          <Button
            size="small"
            danger
            disabled={request.status === 'REFUNDED'}
            onClick={() => openAction(request, 'reject')}
          >
            Từ chối
          </Button>
        </Space>
      ),
      width: 300,
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Yêu cầu trả hàng
      </Typography.Title>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Input.Search
              allowClear
              placeholder="Tìm theo mã trả hàng, đơn hàng, sản phẩm, lý do"
              style={{ width: 420 }}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <Select
              style={{ width: 200 }}
              value={statusFilter}
              options={returnStatusOptions}
              onChange={setStatusFilter}
            />
          </Space>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={sortedReturns}
            loading={returnsQuery.isLoading || booksQuery.isLoading}
            scroll={{ x: 1280 }}
          />
        </Space>
      </Card>
      <Modal
        title="Xác nhận thao tác"
        open={Boolean(active)}
        onCancel={() => setActive(null)}
        onOk={() => actionMutation.mutate()}
        confirmLoading={actionMutation.isPending}
        style={{ top: 24 }}
      >
        {active?.action === 'reject' ? (
          <Input.TextArea
            rows={3}
            placeholder="Lý do từ chối"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        ) : null}
        {active?.action === 'receive' ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            {active.request.items?.map((item, index) => (
              <Select
                key={item.id ?? `${item.bookId}-${index}`}
                style={{ width: '100%' }}
                value={conditions[index] ?? 'GOOD'}
                onChange={(value) =>
                  setConditions((prev) => {
                    const next = [...prev]
                    next[index] = value
                    return next
                  })
                }
                options={CONDITIONS.map((condition) => ({
                  value: condition,
                  label: `${booksById.get(item.bookId)?.title ?? `Book #${item.bookId}`} x${item.quantity} - ${condition}`,
                }))}
              />
            ))}
          </Space>
        ) : null}
      </Modal>
    </Space>
  )
}
