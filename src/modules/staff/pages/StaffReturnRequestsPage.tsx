import { App, Button, Card, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
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
          <Button size="small" onClick={() => setActive({ request, action: 'approve' })}>
            Duyệt
          </Button>
          <Button size="small" onClick={() => setActive({ request, action: 'receive' })}>
            Đã nhận
          </Button>
          <Button size="small" onClick={() => setActive({ request, action: 'refund' })}>
            Hoàn tiền
          </Button>
          <Button size="small" danger onClick={() => setActive({ request, action: 'reject' })}>
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
        <Table rowKey="id" columns={columns} dataSource={returnsQuery.data ?? []} loading={returnsQuery.isLoading} />
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
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            value={conditions}
            onChange={setConditions}
            options={CONDITIONS.map((condition) => ({ value: condition, label: condition }))}
          />
        ) : null}
      </Modal>
    </Space>
  )
}
