import { App, Button, Card, Descriptions, Input, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { adminApi, type AdminOrder, type OrderItem } from '@/modules/admin/api/adminApi'
import { invalidateAdminOrderCaches } from '@/modules/admin/utils/invalidateAdminCaches'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'

function money(value: number | string | undefined) {
  return Number(value ?? 0).toLocaleString('vi-VN')
}

export default function AdminOrderDetailPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const params = useParams()
  const orderId = Number(params.id)
  const [cancelReason, setCancelReason] = useState('')

  const orderQuery = useApiQuery(['admin', 'orders', orderId], () => adminApi.getOrder(orderId), {
    enabled: Number.isFinite(orderId),
  })

  const refresh = async () => {
    await invalidateAdminOrderCaches(queryClient)
  }

  const actionMutation = useApiMutation(
    (action: 'process' | 'ship' | 'complete' | 'cancel') => {
      if (action === 'process') return adminApi.processOrder(orderId)
      if (action === 'ship') return adminApi.shipOrder(orderId)
      if (action === 'complete') return adminApi.completeOrder(orderId)
      return adminApi.cancelOrder(orderId, cancelReason || undefined)
    },
    {
      onSuccess: async () => {
        void message.success('Đã cập nhật đơn hàng')
        await refresh()
      },
    }
  )

  const order = orderQuery.data
  const actions = useMemo(() => getActions(order), [order])

  const columns: ColumnsType<OrderItem> = [
    { title: 'Mã sách', dataIndex: 'bookId', width: 100 },
    { title: 'Tên sách', dataIndex: 'title' },
    { title: 'Số lượng', dataIndex: 'quantity', width: 120 },
    { title: 'Giá mua', dataIndex: 'priceAtPurchase', render: money, width: 150 },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space>
        <Link to="/admin/orders">
          <Button>Quay lại</Button>
        </Link>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Đơn hàng #{orderId}
        </Typography.Title>
      </Space>
      <Card loading={orderQuery.isLoading}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Khách hàng">{order?.customerName || order?.userId}</Descriptions.Item>
          <Descriptions.Item label="Email">{order?.customerEmail || '-'}</Descriptions.Item>
          <Descriptions.Item label="SĐT">{order?.customerPhone || '-'}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={order?.fulfillmentStatus === 'CANCELLED' ? 'red' : 'blue'}>
              {order?.fulfillmentStatus}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Địa chỉ" span={2}>
            {order?.shippingAddress || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Tổng tiền">{money(order?.totalAmount)}</Descriptions.Item>
          <Descriptions.Item label="Thanh toán">{money(order?.finalAmount)}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="Thao tác">
        <Space wrap>
          {actions.map((action) => (
            <Button
              key={action.value}
              type={action.value === 'cancel' ? 'default' : 'primary'}
              danger={action.value === 'cancel'}
              loading={actionMutation.isPending}
              onClick={() => actionMutation.mutate(action.value)}
            >
              {action.label}
            </Button>
          ))}
          {actions.some((action) => action.value === 'cancel') ? (
            <Input
              placeholder="Lý do hủy"
              style={{ width: 280 }}
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
            />
          ) : null}
        </Space>
      </Card>
      <Card title="Sản phẩm">
        <Table rowKey="bookId" columns={columns} dataSource={order?.items ?? []} pagination={false} />
      </Card>
    </Space>
  )
}

function getActions(order?: AdminOrder) {
  if (!order) return []
  if (order.fulfillmentStatus === 'CONFIRMED') {
    return [
      { value: 'process' as const, label: 'Xử lý' },
      { value: 'cancel' as const, label: 'Hủy' },
    ]
  }
  if (order.fulfillmentStatus === 'PROCESSING') {
    return [
      { value: 'ship' as const, label: 'Giao hàng' },
      { value: 'cancel' as const, label: 'Hủy' },
    ]
  }
  if (order.fulfillmentStatus === 'DELIVERING') {
    return [
      { value: 'complete' as const, label: 'Hoàn tất' },
      { value: 'cancel' as const, label: 'Hủy' },
    ]
  }
  if (order.fulfillmentStatus === 'PENDING') {
    return [{ value: 'cancel' as const, label: 'Hủy' }]
  }
  return []
}
