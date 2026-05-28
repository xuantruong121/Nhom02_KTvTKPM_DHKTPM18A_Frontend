import { FileTextOutlined, SearchOutlined, ShoppingOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Empty,
  Input,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { orderApi } from '@/modules/order/api/orderApi'
import { formatMoney, getOrderStatusMeta } from '@/modules/order/utils/orderFormat'
import RealtimeEventBridge from '@/modules/realtime/RealtimeEventBridge'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'
import './OrderPages.css'

const statusOptions = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ thanh toán' },
  { value: 'CONFIRMED', label: 'Chờ xác nhận' },
  { value: 'PROCESSING', label: 'Đang xử lý' },
  { value: 'DELIVERING', label: 'Đang giao' },
  { value: 'DELIVERED', label: 'Đã giao' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]

export function MyOrdersPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('ALL')
  const [keyword, setKeyword] = useState('')
  const notifiedPaymentStatus = useRef<string | null>(null)
  const ordersQuery = useApiQuery(['orders', 'my'], () => orderApi.getMyOrders())
  const confirmReceivedMutation = useApiMutation((orderId: number) => orderApi.confirmReceived(orderId), {
    onSuccess: async (order) => {
      void message.success('Đã xác nhận nhận hàng')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orders', 'my'] }),
        queryClient.invalidateQueries({ queryKey: ['orders', order.orderId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'orders', order.orderId] }),
      ])
    },
  })

  useEffect(() => {
    const paymentStatus = searchParams.get('paymentStatus')
    if (!paymentStatus || notifiedPaymentStatus.current === paymentStatus) return
    notifiedPaymentStatus.current = paymentStatus

    if (paymentStatus === 'cancelled') {
      void message.warning(
        'Bạn đã hủy thanh toán VNPay. Đơn hàng vẫn nằm trong danh sách để thanh toán lại.'
      )
    } else if (paymentStatus === 'failed') {
      void message.error('Thanh toán VNPay chưa hoàn tất. Bạn có thể mở chi tiết đơn để thử lại.')
    }
  }, [message, searchParams])

  const filteredOrders = useMemo(() => {
    const text = keyword.trim().toLowerCase()
    return (ordersQuery.data ?? [])
      .filter((order) => status === 'ALL' || order.fulfillmentStatus === status)
      .filter(
        (order) =>
          !text ||
          String(order.orderId).includes(text) ||
          order.requestId?.toLowerCase().includes(text)
      )
      .sort((a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf())
  }, [keyword, ordersQuery.data, status])

  return (
    <main className="order-page">
      <RealtimeEventBridge />
      <section className="order-shell">
        <div className="order-heading">
          <div>
            <Typography.Title level={1}>Đơn hàng của tôi</Typography.Title>
            <Typography.Text type="secondary">
              Theo dõi trạng thái xử lý, thanh toán và yêu cầu trả hàng.
            </Typography.Text>
          </div>
          <Button icon={<FileTextOutlined />} href="/returns">
            Yêu cầu trả hàng
          </Button>
        </div>

        <Card className="se-card order-toolbar">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm theo mã đơn"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Select value={status} options={statusOptions} onChange={setStatus} />
        </Card>

        {ordersQuery.isLoading ? (
          <Card className="se-card">
            <Skeleton active paragraph={{ rows: 5 }} />
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card className="se-card">
            <Empty description="Chưa có đơn hàng phù hợp" image={Empty.PRESENTED_IMAGE_SIMPLE}>
              <Button type="primary" href="/books">
                Mua sách ngay
              </Button>
            </Empty>
          </Card>
        ) : (
          <div className="order-list">
            {filteredOrders.map((order) => {
              const meta = getOrderStatusMeta(order.fulfillmentStatus)
              return (
                <Card className="se-card order-card" key={order.orderId}>
                  <div className="order-card-head">
                    <Space>
                      <ShoppingOutlined />
                      <Link to={`/orders/${order.orderId}`}>Đơn #{order.orderId}</Link>
                      <Tag color={meta.color}>{meta.label}</Tag>
                    </Space>
                    <Typography.Text type="secondary">
                      {order.updatedAt
                        ? dayjs(order.updatedAt).format('DD/MM/YYYY HH:mm')
                        : 'Đang cập nhật'}
                    </Typography.Text>
                  </div>
                  <div className="order-card-body">
                    <div>
                      <span>Sản phẩm</span>
                      <strong>{order.items?.length ?? 0}</strong>
                    </div>
                    <div>
                      <span>Tổng tiền</span>
                      <strong>{formatMoney(order.finalAmount ?? order.totalAmount)}</strong>
                    </div>
                    <Space className="order-card-actions">
                      {order.fulfillmentStatus === 'DELIVERING' ? (
                        <Popconfirm
                          title="Xác nhận đã nhận đơn hàng?"
                          okText="Đã nhận"
                          cancelText="Đóng"
                          onConfirm={() => confirmReceivedMutation.mutate(order.orderId)}
                        >
                          <Button className="order-received-button" loading={confirmReceivedMutation.isPending}>
                            Đã nhận đơn hàng
                          </Button>
                        </Popconfirm>
                      ) : null}
                      <Button
                        type="primary"
                        className="order-detail-button"
                        href={`/orders/${order.orderId}`}
                      >
                        Xem chi tiết
                      </Button>
                    </Space>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
