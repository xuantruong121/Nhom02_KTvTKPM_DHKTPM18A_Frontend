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
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'

type POAction = 'submit' | 'approve' | 'return' | 'receive' | 'cancel'
type POItem = PurchaseOrder['items'][number]

function money(value: number | string | undefined) {
  return Number(value ?? 0).toLocaleString('vi-VN')
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
        void message.success('Da cap nhat PO')
        setActiveAction(null)
        setReason('')
        await invalidatePurchaseOrderCaches(queryClient)
      },
    }
  )

  const po = poQuery.data
  const actions = useMemo(() => (po ? getActions(po.status) : []), [po])

  const columns: ColumnsType<POItem> = [
    { title: 'Book ID', dataIndex: 'bookId', width: 120 },
    { title: 'So luong', dataIndex: 'quantity', width: 120 },
    { title: 'Don gia', dataIndex: 'priceAtOrder', render: money, width: 160 },
    {
      title: 'Thanh tien',
      render: (_, item) => money(Number(item.priceAtOrder) * item.quantity),
      width: 160,
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space>
        <Link to="..">
          <Button>Quay lai</Button>
        </Link>
        <Typography.Title level={3} style={{ margin: 0 }}>
          PO #{poId}
        </Typography.Title>
      </Space>

      <Card loading={poQuery.isLoading}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Nha cung cap">{po?.supplier?.name ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Trang thai">
            <Tag color={po?.status === 'CANCELLED' ? 'red' : 'blue'}>{po?.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Tong tien">{money(po?.totalAmount)}</Descriptions.Item>
          <Descriptions.Item label="Nguoi tao">{po?.createdBy ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Nguoi duyet">{po?.approvedBy ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Nguoi nhan">{po?.receivedBy ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Ghi chu" span={2}>
            {po?.note ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Ly do huy" span={2}>
            {po?.cancelReason ?? '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Thao tac">
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
          {actions.length === 0 ? <Typography.Text type="secondary">Khong con thao tac kha dung</Typography.Text> : null}
        </Space>
      </Card>

      <Card title="San pham">
        <Table rowKey="id" columns={columns} dataSource={po?.items ?? []} pagination={false} />
      </Card>

      <Modal
        title="Xac nhan PO"
        open={Boolean(activeAction)}
        onCancel={() => setActiveAction(null)}
        onOk={() => actionMutation.mutate()}
        confirmLoading={actionMutation.isPending}
        style={{ top: 24 }}
      >
        {activeAction === 'return' || activeAction === 'cancel' ? (
          <Input.TextArea rows={3} placeholder="Ly do" value={reason} onChange={(event) => setReason(event.target.value)} />
        ) : (
          <Typography.Text>Xac nhan thao tac {activeAction ? actionLabels[activeAction] : ''}</Typography.Text>
        )}
      </Modal>
    </Space>
  )
}

const actionLabels: Record<POAction, string> = {
  submit: 'Gui duyet',
  approve: 'Duyet',
  return: 'Tra ve',
  receive: 'Nhan hang',
  cancel: 'Huy',
}

function getActions(status: PurchaseOrderStatus): POAction[] {
  if (status === 'DRAFT') return ['submit', 'cancel']
  if (status === 'SUBMITTED') return ['approve', 'return', 'cancel']
  if (status === 'APPROVED') return ['receive', 'cancel']
  return []
}
