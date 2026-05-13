import { Button, Card, Input, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  adminApi,
  type AdminOrder,
  type FulfillmentStatus,
} from '@/modules/admin/api/adminApi'
import { useApiQuery } from '@/shared/hooks/useApiQuery'

const STATUS_OPTIONS: FulfillmentStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'DELIVERING',
  'DELIVERED',
  'CANCELLED',
]

function money(value: number | string) {
  return Number(value).toLocaleString('vi-VN')
}

export default function AdminOrdersPage() {
  const location = useLocation()
  const [status, setStatus] = useState<FulfillmentStatus | undefined>()
  const [keyword, setKeyword] = useState('')
  const [submittedKeyword, setSubmittedKeyword] = useState('')
  const ordersBasePath = location.pathname.startsWith('/staff') ? '/staff/orders' : '/admin/orders'

  const ordersQuery = useApiQuery(['admin', 'orders', status, submittedKeyword], () =>
    adminApi.getOrders({ status, customerKeyword: submittedKeyword || undefined })
  )

  const columns: ColumnsType<AdminOrder> = [
    { title: 'Mã đơn', dataIndex: 'orderId', width: 100 },
    {
      title: 'Khách hàng',
      render: (_, order) => (
        <Space direction="vertical" size={0}>
          <span>{order.customerName || `User #${order.userId}`}</span>
          <Typography.Text type="secondary">{order.customerEmail || order.customerPhone}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'fulfillmentStatus',
      render: (value: FulfillmentStatus) => <Tag color={value === 'CANCELLED' ? 'red' : 'blue'}>{value}</Tag>,
      width: 150,
    },
    { title: 'Tổng tiền', dataIndex: 'finalAmount', render: money, width: 140 },
    { title: 'Cập nhật', dataIndex: 'updatedAt', width: 180 },
    {
      title: '',
      render: (_, order) => (
        <Link to={`${ordersBasePath}/${order.orderId}`}>
          <Button type="link">Chi tiết</Button>
        </Link>
      ),
      width: 110,
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Đơn hàng
      </Typography.Title>
      <Card>
        <Space wrap>
          <Select
            allowClear
            placeholder="Trạng thái"
            style={{ width: 180 }}
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS.map((item) => ({ value: item, label: item }))}
          />
          <Input.Search
            allowClear
            enterButton="Tìm"
            placeholder="Tên, email, SĐT hoặc userId"
            style={{ width: 320 }}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onSearch={(value) => setSubmittedKeyword(value.trim())}
          />
        </Space>
      </Card>
      <Card>
        <Table
          rowKey="orderId"
          columns={columns}
          dataSource={ordersQuery.data ?? []}
          loading={ordersQuery.isLoading}
        />
      </Card>
    </Space>
  )
}
