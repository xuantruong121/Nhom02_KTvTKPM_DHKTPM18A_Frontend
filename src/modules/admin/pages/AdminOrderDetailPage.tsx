import { App, Button, Card, Descriptions, Input, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  adminApi,
  type AdminOrder,
  type FulfillmentStatus,
  type OrderItem,
} from '@/modules/admin/api/adminApi'
import { invalidateAdminOrderCaches } from '@/modules/admin/utils/invalidateAdminCaches'
import { getOrderStatusMeta } from '@/modules/order/utils/orderFormat'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'

function money(value: number | string | undefined) {
  return Number(value ?? 0).toLocaleString('vi-VN')
}

export default function AdminOrderDetailPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const location = useLocation()
  const params = useParams()
  const orderId = Number(params.id)
  const [cancelReason, setCancelReason] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<FulfillmentStatus>()
  const ordersBasePath = location.pathname.startsWith('/staff') ? '/staff/orders' : '/admin/orders'

  const orderQuery = useApiQuery(['admin', 'orders', orderId], () => adminApi.getOrder(orderId), {
    enabled: Number.isFinite(orderId),
  })

  const refresh = async () => {
    await invalidateAdminOrderCaches(queryClient)
  }

  const actionMutation = useApiMutation(
    (status: FulfillmentStatus) => updateStatus(orderId, status, cancelReason),
    {
      onSuccess: async () => {
        setSelectedStatus(undefined)
        setCancelReason('')
        void message.success('Đã cập nhật đơn hàng')
        await refresh()
      },
    }
  )

  const order = orderQuery.data
  const statusOptions = useMemo(() => getNextStatusOptions(order), [order])
  const statusMeta = getOrderStatusMeta(order?.fulfillmentStatus)
  const canSubmitStatus = Boolean(selectedStatus)

  const columns: ColumnsType<OrderItem> = [
    { title: 'Mã sách', dataIndex: 'bookId', width: 100 },
    { title: 'Tên sách', dataIndex: 'title' },
    { title: 'Số lượng', dataIndex: 'quantity', width: 120 },
    { title: 'Giá mua', dataIndex: 'priceAtPurchase', render: money, width: 150 },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space>
        <Link to={ordersBasePath}>
          <Button>Quay lại</Button>
        </Link>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Đơn hàng #{orderId}
        </Typography.Title>
      </Space>
      <Card loading={orderQuery.isLoading}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Khách hàng">
            {order?.customerName || order?.userId}
          </Descriptions.Item>
          <Descriptions.Item label="Email">{order?.customerEmail || '-'}</Descriptions.Item>
          <Descriptions.Item label="SĐT">{order?.customerPhone || '-'}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={statusMeta.color}>{statusMeta.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Địa chỉ" span={2}>
            {order?.shippingAddress || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Tổng tiền">{money(order?.totalAmount)}</Descriptions.Item>
          <Descriptions.Item label="Thanh toán">{money(order?.finalAmount)}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="Thao tác">
        {statusOptions.length > 0 ? (
          <Space wrap align="start">
            <Select
              placeholder="Chọn trạng thái mới"
              style={{ width: 240 }}
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={statusOptions.map((status) => {
                const meta = getOrderStatusMeta(status)
                return { value: status, label: meta.label }
              })}
            />
            {selectedStatus === 'CANCELLED' ? (
              <Input
                placeholder="Lý do hủy"
                style={{ width: 280 }}
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
              />
            ) : null}
            <Button
              type="primary"
              danger={selectedStatus === 'CANCELLED'}
              disabled={!canSubmitStatus}
              loading={actionMutation.isPending}
              onClick={() => selectedStatus && actionMutation.mutate(selectedStatus)}
            >
              Cập nhật trạng thái
            </Button>
          </Space>
        ) : (
          <Typography.Text type="secondary">
            Đơn hàng không còn trạng thái có thể cập nhật.
          </Typography.Text>
        )}
      </Card>
      <Card title="Sản phẩm">
        <Table
          rowKey="bookId"
          columns={columns}
          dataSource={order?.items ?? []}
          pagination={false}
        />
      </Card>
    </Space>
  )
}

function updateStatus(orderId: number, status: FulfillmentStatus, cancelReason: string) {
  if (status === 'CANCELLED') {
    return adminApi.cancelOrder(orderId, cancelReason || undefined)
  }
  if (status === 'PROCESSING') {
    return adminApi.processOrder(orderId)
  }
  if (status === 'DELIVERING') {
    return adminApi.shipOrder(orderId)
  }
  if (status === 'DELIVERED') {
    return adminApi.completeOrder(orderId)
  }
  return adminApi.updateOrderStatus(orderId, status, getStatusReason(status))
}

function getNextStatusOptions(order?: AdminOrder): FulfillmentStatus[] {
  if (!order) return []
  if (order.fulfillmentStatus === 'PENDING') return ['CONFIRMED']
  if (order.fulfillmentStatus === 'CONFIRMED') return ['PROCESSING', 'CANCELLED']
  if (order.fulfillmentStatus === 'PROCESSING') return ['DELIVERING', 'CANCELLED']
  if (order.fulfillmentStatus === 'DELIVERING') return ['DELIVERED', 'PROCESSING', 'CANCELLED']
  return []
}

function getStatusReason(status: FulfillmentStatus) {
  const meta = getOrderStatusMeta(status)
  return `Admin cập nhật trạng thái sang ${meta.label}`
}
