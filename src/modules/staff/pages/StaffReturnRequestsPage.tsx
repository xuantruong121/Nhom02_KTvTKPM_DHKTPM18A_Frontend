import { App, Button, Card, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  adminApi,
  type ItemCondition,
  type ReturnRequest,
  type ReturnStatus,
} from '@/modules/admin/api/adminApi'
import { invalidateAdminReturnCaches } from '@/modules/admin/utils/invalidateAdminCaches'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'

type ReturnAction = 'approve' | 'receive' | 'refund' | 'reject'

const CONDITIONS: ItemCondition[] = ['GOOD', 'DAMAGED', 'MISSING_PARTS', 'UNSELLABLE']

export default function StaffReturnRequestsPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const returnsQuery = useApiQuery(['staff', 'returns'], () => adminApi.getReturns())
  const [active, setActive] = useState<{ request: ReturnRequest; action: ReturnAction } | null>(null)
  const [reason, setReason] = useState('')
  const [conditions, setConditions] = useState<ItemCondition[]>(['GOOD'])

  const sortedReturns = useMemo(() => {
    return [...(returnsQuery.data ?? [])].sort((left, right) => {
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0
      if (rightTime !== leftTime) return rightTime - leftTime
      return String(right.id).localeCompare(String(left.id), 'vi', { numeric: true })
    })
  }, [returnsQuery.data])

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
    { title: 'Mã', dataIndex: 'id', width: 120 },
    { title: 'Đơn hàng', dataIndex: 'orderId', width: 120 },
    { title: 'Khách', dataIndex: 'customerId', width: 100 },
    { title: 'Lý do', dataIndex: 'reason' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (value: ReturnStatus) => <Tag color={value === 'REJECTED' ? 'red' : 'blue'}>{value}</Tag>,
      width: 140,
    },
    {
      title: 'Thao tác',
      render: (_, request) => (
        <Space wrap>
          <Button size="small" disabled={request.status !== 'PENDING'} onClick={() => openAction(request, 'approve')}>
            Duyệt
          </Button>
          <Button size="small" disabled={request.status !== 'APPROVED'} onClick={() => openAction(request, 'receive')}>
            Đã nhận
          </Button>
          <Button size="small" disabled={request.status !== 'RECEIVED'} onClick={() => openAction(request, 'refund')}>
            Hoàn tiền
          </Button>
          <Button size="small" danger disabled={request.status === 'REFUNDED'} onClick={() => openAction(request, 'reject')}>
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
        <Table rowKey="id" columns={columns} dataSource={sortedReturns} loading={returnsQuery.isLoading} />
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
          <Input.TextArea rows={3} placeholder="Lý do từ chối" value={reason} onChange={(event) => setReason(event.target.value)} />
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
                  label: `Book #${item.bookId} x${item.quantity} - ${condition}`,
                }))}
              />
            ))}
          </Space>
        ) : null}
      </Modal>
    </Space>
  )
}
