import {
  ArrowLeftOutlined,
  BankOutlined,
  FileProtectOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Checkbox,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Skeleton,
  Tag,
  Timeline,
  Typography,
  Upload,
} from 'antd'
import type { UploadFile } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { catalogApi } from '@/modules/catalog/api/catalogApi'
import { orderApi, type Order, type OrderItem } from '@/modules/order/api/orderApi'
import {
  formatMoney,
  getOrderStatusMeta,
  toNumber,
} from '@/modules/order/utils/orderFormat'
import { returnsApi, type ReturnReason } from '@/modules/returns/api/returnsApi'
import { getErrorMessage, isAxiosApiError } from '@/shared/api/http'
import { useApiQuery } from '@/shared/hooks/useApiQuery'
import './OrderPages.css'

type ReturnFormValues = {
  reason: ReturnReason | 'OTHER'
  otherReason?: string
  notes?: string
  items: Record<string, boolean>
  quantities: Record<string, number>
}

/*
  { value: 'DAMAGED', label: 'Sản phẩm bị hư hỏng' },
  { value: 'WRONG_ITEM', label: 'Giao sai sản phẩm' },
  { value: 'NOT_AS_DESCRIBED', label: 'Không đúng mô tả' },
  { value: 'CUSTOMER_CHANGE_MIND', label: 'Đổi ý sau khi mua' },
  { value: 'OTHER', label: 'Lý do khác' },
]

*/

const returnReasons = [
  { value: 'DEFECTIVE', label: 'Sản phẩm bị lỗi / hư hỏng' },
  { value: 'WRONG_ITEM', label: 'Giao sai sản phẩm' },
  { value: 'NO_LONGER_NEEDED', label: 'Không còn nhu cầu sử dụng' },
  { value: 'OTHER', label: 'Lý do khác' },
]

function getOrderIdParam(value?: string) {
  const id = Number(value)
  return Number.isFinite(id) && id > 0 ? id : null
}

export function OrderDetailPage() {
  const { id } = useParams()
  const orderId = getOrderIdParam(id)
  const navigate = useNavigate()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [returnOpen, setReturnOpen] = useState(false)
  const [returnForm] = Form.useForm<ReturnFormValues>()
  const [submittingReturn, setSubmittingReturn] = useState(false)
  const [paying, setPaying] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])

  const orderQuery = useApiQuery(['orders', orderId], () => orderApi.getOrder(orderId ?? 0), {
    enabled: Boolean(orderId),
  })
  const booksQuery = useApiQuery(['catalog', 'books', 'order-detail'], () => catalogApi.getBooks())

  const booksById = useMemo(
    () => new Map((booksQuery.data ?? []).map((book) => [book.id, book])),
    [booksQuery.data]
  )

  const order = orderQuery.data
  const statusMeta = getOrderStatusMeta(order?.fulfillmentStatus)
  const canPay = order?.fulfillmentStatus === 'PENDING'
  const canCancel = order?.fulfillmentStatus === 'PENDING'
  const canReturn = order?.fulfillmentStatus === 'DELIVERED'

  const handlePay = async () => {
    if (!order) return
    setPaying(true)
    try {
      const { paymentUrl } = await orderApi.createPaymentUrl(order.orderId)
      window.location.assign(paymentUrl)
    } catch (err) {
      void message.error(getErrorMessage(err))
    } finally {
      setPaying(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!order) return
    setCancelling(true)
    try {
      await orderApi.cancelMyOrder(order.orderId)
      await queryClient.invalidateQueries({ queryKey: ['orders', order.orderId] })
      await queryClient.invalidateQueries({ queryKey: ['orders', 'my'] })
      void message.success('Đã hủy đơn hàng')
    } catch (err) {
      void message.error(err instanceof Error ? err.message : 'Không thể hủy đơn hàng')
    } finally {
      setCancelling(false)
    }
  }

  const openReturnModal = (targetOrder: Order) => {
    const checked: Record<string, boolean> = {}
    const quantities: Record<string, number> = {}
    targetOrder.items.forEach((item) => {
      checked[String(item.bookId)] = true
      quantities[String(item.bookId)] = item.quantity
    })
    returnForm.setFieldsValue({ reason: 'DEFECTIVE', items: checked, quantities })
    setFiles([])
    setReturnOpen(true)
  }

  const handleCreateReturn = async () => {
    if (!order) return
    const values = await returnForm.validateFields()
    const selectedItems = order.items
      .filter((item) => values.items?.[String(item.bookId)])
      .map((item) => ({
        bookId: item.bookId,
        quantity: Math.min(values.quantities?.[String(item.bookId)] ?? item.quantity, item.quantity),
      }))
      .filter((item) => item.quantity > 0)

    if (selectedItems.length === 0) {
      void message.error('Vui lòng chọn ít nhất một sản phẩm cần trả')
      return
    }

    setSubmittingReturn(true)
    try {
      const notes = [values.reason === 'OTHER' ? `Lý do khác: ${values.otherReason}` : null, values.notes]
        .filter(Boolean)
        .join('\n')
      await returnsApi.create({
        orderId: order.orderId,
        reason: values.reason === 'OTHER' ? 'NO_LONGER_NEEDED' : values.reason,
        notes,
        items: selectedItems,
      })
      void message.success('Đã gửi yêu cầu trả hàng')
      setReturnOpen(false)
      navigate('/returns')
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      void message.error(
        (isAxiosApiError(err) && err.response?.status === 409) ||
          errorMessage.includes('409') ||
          errorMessage.includes('RET_ALREADY_EXISTS')
          ? 'Đơn hàng đã có yêu cầu trả hàng đang được xử lý'
          : errorMessage
      )
    } finally {
      setSubmittingReturn(false)
    }
  }

  if (!orderId) {
    return (
      <main className="order-page">
        <section className="order-shell">
          <Empty description="Mã đơn hàng không hợp lệ" />
        </section>
      </main>
    )
  }

  return (
    <main className="order-page">
      <section className="order-shell">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>
          Quay lại đơn hàng
        </Button>

        {orderQuery.isLoading || booksQuery.isLoading ? (
          <Card className="se-card">
            <Skeleton active paragraph={{ rows: 8 }} />
          </Card>
        ) : !order ? (
          <Card className="se-card">
            <Empty description="Không tìm thấy đơn hàng" />
          </Card>
        ) : (
          <div className="order-detail-grid">
            <div className="order-detail-main">
              <Card className="se-card order-detail-head">
                <div>
                  <Typography.Title level={1}>Đơn #{order.orderId}</Typography.Title>
                  <Typography.Text type="secondary">
                    Cập nhật: {order.updatedAt ? dayjs(order.updatedAt).format('DD/MM/YYYY HH:mm') : 'Đang cập nhật'}
                  </Typography.Text>
                </div>
                <Tag color={statusMeta.color}>{statusMeta.label}</Tag>
              </Card>

              <Card className="se-card" title="Sản phẩm">
                <div className="order-items">
                  {order.items.map((item) => (
                    <OrderItemRow item={item} key={item.bookId} title={booksById.get(item.bookId)?.title} />
                  ))}
                </div>
              </Card>

              <Card className="se-card" title="Tiến trình đơn hàng">
                <Timeline
                  items={[
                    { color: 'blue', content: 'Đơn hàng đã được tạo' },
                    {
                      color: order.fulfillmentStatus === 'PENDING' ? 'gray' : 'blue',
                      content: 'Xác nhận thanh toán và tồn kho',
                    },
                    {
                      color: ['PROCESSING', 'DELIVERING', 'DELIVERED'].includes(order.fulfillmentStatus) ? 'blue' : 'gray',
                      content: 'Chuẩn bị và đóng gói',
                    },
                    {
                      color: ['DELIVERING', 'DELIVERED'].includes(order.fulfillmentStatus) ? 'blue' : 'gray',
                      content: 'Giao hàng',
                    },
                    {
                      color: order.fulfillmentStatus === 'DELIVERED' ? 'green' : 'gray',
                      content: 'Hoàn tất',
                    },
                  ]}
                />
              </Card>
            </div>

            <aside className="order-detail-side">
              <Card className="se-card order-summary-panel" title="Thanh toán">
                <div className="order-money-row">
                  <span>Tạm tính</span>
                  <strong>{formatMoney(order.totalAmount)}</strong>
                </div>
                <div className="order-money-row">
                  <span>Giảm giá</span>
                  <strong>-{formatMoney(order.discountAmount)}</strong>
                </div>
                <div className="order-money-total">
                  <span>Thành tiền</span>
                  <strong>{formatMoney(order.finalAmount ?? order.totalAmount)}</strong>
                </div>
                {canPay && (
                  <Button type="primary" block icon={<BankOutlined />} loading={paying} onClick={handlePay}>
                    Thanh toán VNPay
                  </Button>
                )}
                {canCancel && (
                  <Popconfirm
                    title="Hủy đơn hàng này?"
                    description="Bạn chỉ có thể hủy đơn khi đơn chưa được xác nhận."
                    okText="Hủy đơn"
                    cancelText="Đóng"
                    okButtonProps={{ danger: true }}
                    onConfirm={handleCancelOrder}
                  >
                    <Button danger block loading={cancelling}>
                      Hủy đơn hàng
                    </Button>
                  </Popconfirm>
                )}
              </Card>

              <Card className="se-card order-summary-panel" title="Trả hàng">
                <Typography.Paragraph type="secondary">
                  Có thể tạo yêu cầu trả hàng khi đơn đã giao thành công.
                </Typography.Paragraph>
                <Button
                  block
                  icon={<FileProtectOutlined />}
                  disabled={!canReturn}
                  onClick={() => openReturnModal(order)}
                >
                  Tạo yêu cầu trả hàng
                </Button>
                <Button block type="link" href="/returns" icon={<ReloadOutlined />}>
                  Xem yêu cầu của tôi
                </Button>
              </Card>
            </aside>
          </div>
        )}
      </section>

      <Modal
        open={returnOpen}
        title="Tạo yêu cầu trả hàng"
        okText="Gửi yêu cầu"
        cancelText="Đóng"
        onCancel={() => setReturnOpen(false)}
        onOk={handleCreateReturn}
        confirmLoading={submittingReturn}
        centered
        className="return-request-modal"
        width={720}
      >
        <Form form={returnForm} layout="vertical">
          <Form.Item name="reason" label="Lý do trả hàng" rules={[{ required: true }]}>
            <Select options={returnReasons} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.reason !== cur.reason}>
            {({ getFieldValue }) =>
              getFieldValue('reason') === 'OTHER' ? (
                <Form.Item
                  name="otherReason"
                  label="Nhập lý do khác"
                  rules={[{ required: true, message: 'Vui lòng nhập lý do khác' }]}
                >
                  <Input placeholder="Nhập lý do trả hàng" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <div className="return-item-picker">
            {order?.items.map((item) => (
              <div className="return-item-row" key={item.bookId}>
                <Form.Item name={['items', String(item.bookId)]} valuePropName="checked" noStyle>
                  <Checkbox />
                </Form.Item>
                <span>{booksById.get(item.bookId)?.title ?? `Sách #${item.bookId}`}</span>
                <Form.Item name={['quantities', String(item.bookId)]} noStyle>
                  <InputNumber min={1} max={item.quantity} />
                </Form.Item>
              </div>
            ))}
          </div>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Mô tả tình trạng sản phẩm hoặc yêu cầu hỗ trợ" />
          </Form.Item>
          <Form.Item label="Ảnh minh chứng">
            <Upload
              listType="picture"
              fileList={files}
              beforeUpload={() => false}
              onChange={({ fileList }) => setFiles(fileList)}
            >
              <Button>Chọn ảnh</Button>
            </Upload>
            <Typography.Text type="secondary">
              Backend hiện chưa nhận ảnh trong API trả hàng, ảnh chỉ được chọn để chuẩn bị UI.
            </Typography.Text>
          </Form.Item>
        </Form>
      </Modal>
    </main>
  )
}

function OrderItemRow({ item, title }: { item: OrderItem; title?: string }) {
  return (
    <div className="order-item-row">
      <div className="order-item-thumb">
        <ShoppingCartOutlined />
      </div>
      <div>
        <Link to={`/books/${item.bookId}`}>{title ?? `Sách #${item.bookId}`}</Link>
        <span>Số lượng: {item.quantity}</span>
      </div>
      <strong>{formatMoney(toNumber(item.priceAtPurchase) * item.quantity)}</strong>
    </div>
  )
}
