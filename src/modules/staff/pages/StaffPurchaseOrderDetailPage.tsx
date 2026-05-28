import { App, Button, Card, Descriptions, Input, Modal, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  adminApi,
  type PurchaseOrder,
  type PurchaseOrderStatus,
} from '@/modules/admin/api/adminApi'
import { invalidatePurchaseOrderCaches } from '@/modules/admin/utils/invalidateAdminCaches'
import { compareNumber } from '@/modules/admin/utils/tableSort'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'

type POAction = 'submit' | 'approve' | 'return' | 'receive' | 'cancel'
type POItem = PurchaseOrder['items'][number]

function money(value: number | string | undefined) {
  return Number(value ?? 0).toLocaleString('vi-VN')
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString('vi-VN') : '-'
}

const statusLabels: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  RETURNED: 'Trả về',
  RECEIVED: 'Đã nhập kho',
  CANCELLED: 'Đã hủy',
}

const statusColors: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'default',
  SUBMITTED: 'processing',
  APPROVED: 'blue',
  RETURNED: 'orange',
  RECEIVED: 'green',
  CANCELLED: 'red',
}

export default function StaffPurchaseOrderDetailPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const params = useParams()
  const poId = Number(params.id)
  const [activeAction, setActiveAction] = useState<POAction | null>(null)
  const [reason, setReason] = useState('')

  const poQuery = useApiQuery(['staff', 'purchaseOrders', poId], () => adminApi.getPurchaseOrder(poId), {
    enabled: Number.isFinite(poId),
  })

  const actionMutation = useApiMutation(
    async () => {
      if (!activeAction) return
      if (activeAction === 'submit') return adminApi.submitPurchaseOrder(poId)
      if (activeAction === 'approve') return adminApi.approvePurchaseOrder(poId)
      if (activeAction === 'receive') return adminApi.receivePurchaseOrder(poId)
      if (activeAction === 'return') return adminApi.returnPurchaseOrder(poId, reason)
      return adminApi.cancelPurchaseOrder(poId, reason)
    },
    {
      onSuccess: async () => {
        void message.success('Đã cập nhật PO')
        setActiveAction(null)
        setReason('')
        await invalidatePurchaseOrderCaches(queryClient)
      },
    }
  )

  const po = poQuery.data
  const actions = useMemo(() => (po ? getActions(po.status) : []), [po])

  const columns: ColumnsType<POItem> = [
    { title: 'Book ID', dataIndex: 'bookId', width: 120, sorter: (a, b) => compareNumber(a.bookId, b.bookId) },
    { title: 'Số lượng', dataIndex: 'quantity', width: 120, sorter: (a, b) => compareNumber(a.quantity, b.quantity) },
    { title: 'Đơn giá', dataIndex: 'priceAtOrder', render: money, width: 160, sorter: (a, b) => compareNumber(a.priceAtOrder, b.priceAtOrder) },
    {
      title: 'Thành tiền',
      render: (_, item) => money(Number(item.priceAtOrder) * item.quantity),
      width: 160,
      sorter: (a, b) => compareNumber(Number(a.priceAtOrder) * a.quantity, Number(b.priceAtOrder) * b.quantity),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space>
        <Link to="..">
          <Button>Quay lại</Button>
        </Link>
        <Typography.Title level={3} style={{ margin: 0 }}>
          PO #{poId}
        </Typography.Title>
      </Space>

      <Card loading={poQuery.isLoading}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Nhà cung cấp">{po?.supplier?.name ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {po ? <Tag color={statusColors[po.status]}>{statusLabels[po.status]}</Tag> : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Tổng tiền">{money(po?.totalAmount)}</Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">{formatDate(po?.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="Người tạo">{po?.createdBy ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Người duyệt">{po?.approvedBy ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Người nhận">{po?.receivedBy ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Ghi chú" span={2}>
            {po?.note ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Lý do hủy" span={2}>
            {po?.cancelReason ?? '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Thao tác">
        <Space wrap>
          {actions.map((action) => (
            <Button
              key={action}
              type={action === 'cancel' ? 'default' : 'primary'}
              danger={action === 'cancel'}
              loading={actionMutation.isPending}
              onClick={() => setActiveAction(action)}
            >
              {actionLabels[action]}
            </Button>
          ))}
          {actions.length === 0 ? <Typography.Text type="secondary">Không còn thao tác khả dụng</Typography.Text> : null}
        </Space>
      </Card>

      <Card title="Sản phẩm">
        <Table rowKey="id" columns={columns} dataSource={po?.items ?? []} pagination={false} />
      </Card>

      <Modal
        title="Xác nhận PO"
        open={Boolean(activeAction)}
        onCancel={() => setActiveAction(null)}
        onOk={() => actionMutation.mutate()}
        confirmLoading={actionMutation.isPending}
        style={{ top: 24 }}
      >
        {activeAction === 'return' || activeAction === 'cancel' ? (
          <Input.TextArea rows={3} placeholder="Lý do" value={reason} onChange={(event) => setReason(event.target.value)} />
        ) : (
          <Typography.Text>Xác nhận thao tác {activeAction ? actionLabels[activeAction] : ''}</Typography.Text>
        )}
      </Modal>
    </Space>
  )
}

const actionLabels: Record<POAction, string> = {
  submit: 'Gửi duyệt',
  approve: 'Duyệt',
  return: 'Trả về',
  receive: 'Xác nhận nhập kho',
  cancel: 'Hủy',
}

function getActions(status: PurchaseOrderStatus): POAction[] {
  if (status === 'DRAFT') return ['submit', 'cancel']
  if (status === 'SUBMITTED') return ['approve', 'return', 'cancel']
  if (status === 'APPROVED') return ['receive', 'cancel']
  return []
}
