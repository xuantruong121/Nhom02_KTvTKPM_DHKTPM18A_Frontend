import {
  BankOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  GiftOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
  TruckOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd'
import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { accountApi, type AddressDto } from '@/modules/account/api/accountApi'
import { cartApi, type Cart } from '@/modules/cart/api/cartApi'
import { catalogApi } from '@/modules/catalog/api/catalogApi'
import { orderApi } from '@/modules/order/api/orderApi'
import {
  compactAddress,
  formatMoney,
  makeRequestId,
  toNumber,
} from '@/modules/order/utils/orderFormat'
import { promotionApi, type ValidatePromotionResponse } from '@/modules/promotion/api/promotionApi'
import { useApiQuery } from '@/shared/hooks/useApiQuery'
import './CheckoutPage.css'

type CheckoutValues = {
  addressMode: 'saved' | 'custom'
  addressId?: number
  recipientName?: string
  customerPhone?: string
  street?: string
  ward?: string
  city?: string
  shippingAddress?: string
  shippingMethod: 'STANDARD' | 'EXPRESS'
  paymentMethod: 'COD' | 'VNPAY'
  needInvoice?: boolean
  invoiceType?: 'PERSONAL' | 'BUSINESS'
  invoiceBuyerName?: string
  invoicePersonalAddress?: string
  invoiceCitizenId?: string
  invoicePassport?: string
  invoiceEmail?: string
  invoiceTaxCode?: string
  invoiceCompany?: string
  invoiceBusinessAddress?: string
  invoiceBudgetUnitCode?: string
  note?: string
  agree: boolean
}

const shippingOptions = {
  STANDARD: {
    label: 'Giao hàng tiêu chuẩn',
    desc: 'Nhận hàng dự kiến trong 2-4 ngày làm việc',
    fee: 0,
  },
  EXPRESS: {
    label: 'Giao hàng nhanh',
    desc: 'Ưu tiên xử lý và giao sớm khi khu vực hỗ trợ',
    fee: 22000,
  },
}

export function CheckoutPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<CheckoutValues>()
  const [couponCode, setCouponCode] = useState('')
  const [promotion, setPromotion] = useState<ValidatePromotionResponse | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [addressModalOpen, setAddressModalOpen] = useState(false)

  const cartQuery = useApiQuery(['cart'], () => cartApi.getCart())
  const profileQuery = useApiQuery(['account', 'profile'], () => accountApi.getProfile())
  const booksQuery = useApiQuery(['catalog', 'books', 'checkout'], () => catalogApi.getBooks())

  const selectedBookIds = useMemo(() => {
    const state = location.state as { selectedBookIds?: unknown } | null
    return Array.isArray(state?.selectedBookIds)
      ? state.selectedBookIds.filter((id): id is number => typeof id === 'number')
      : []
  }, [location.state])
  const selectedBookIdSet = useMemo(() => new Set(selectedBookIds), [selectedBookIds])
  const cartItems = useMemo(() => cartQuery.data?.items ?? [], [cartQuery.data?.items])
  const items = useMemo(
    () =>
      selectedBookIdSet.size > 0
        ? cartItems.filter((item) => selectedBookIdSet.has(item.bookId))
        : cartItems,
    [cartItems, selectedBookIdSet]
  )
  const booksById = useMemo(
    () => new Map((booksQuery.data ?? []).map((book) => [book.id, book])),
    [booksQuery.data]
  )
  const addresses = profileQuery.data?.addresses ?? []
  const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0]
  const selectedAddressId = Form.useWatch('addressId', form)
  const selectedSavedAddress =
    addresses.find((address) => address.id === selectedAddressId) ?? defaultAddress
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + toNumber(item.price) * item.quantity, 0),
    [items]
  )
  const discount = promotion?.valid ? toNumber(promotion.discountAmount) : 0
  const watchedShippingMethod = Form.useWatch('shippingMethod', form) ?? 'STANDARD'
  const shippingFee = shippingOptions[watchedShippingMethod].fee
  const finalAmount = Math.max(0, subtotal - discount + shippingFee)
  const loading = cartQuery.isLoading || profileQuery.isLoading || booksQuery.isLoading

  const handleValidateCoupon = async () => {
    const code = couponCode.trim()
    if (!code) {
      setPromotion(null)
      return
    }
    setValidatingCoupon(true)
    try {
      const result = await promotionApi.validate({ code, orderTotal: subtotal })
      setPromotion(result)
      if (result.valid) void message.success('Mã giảm giá hợp lệ')
      else void message.warning(result.message || 'Mã giảm giá không hợp lệ')
    } catch (err) {
      setPromotion(null)
      void message.error(err instanceof Error ? err.message : 'Không kiểm tra được mã giảm giá')
    } finally {
      setValidatingCoupon(false)
    }
  }

  const buildCustomAddress = (values: CheckoutValues) =>
    [values.street, values.ward, values.city].filter(Boolean).join(', ')

  const getAddressRecipientName = (address?: typeof defaultAddress | null) =>
    address?.recipientName || profileQuery.data?.fullName || ''

  const getAddressPhone = (address?: typeof defaultAddress | null) =>
    address?.phoneNumber || profileQuery.data?.phoneNumber || ''

  const renderAddressContact = (address?: AddressDto | null) => (
    <>
      <strong>{getAddressRecipientName(address)}</strong>
      <span>{getAddressPhone(address)}</span>
      <small>{address ? compactAddress(address) : 'Chưa chọn địa chỉ giao hàng'}</small>
    </>
  )

  const selectSavedAddress = (addressId: number) => {
    const selected = addresses.find((address) => address.id === addressId)
    form.setFieldsValue({
      addressId,
      recipientName: getAddressRecipientName(selected),
      customerPhone: getAddressPhone(selected),
    })
  }

  const handleFinish = async (values: CheckoutValues) => {
    if (items.length === 0) return
    const selectedAddress =
      values.addressMode === 'saved'
        ? (addresses.find((address) => address.id === values.addressId) ?? defaultAddress)
        : null
    const shippingAddress = selectedAddress
      ? compactAddress(selectedAddress)
      : buildCustomAddress(values) || values.shippingAddress?.trim()
    const customerPhone = selectedAddress
      ? getAddressPhone(selectedAddress)
      : values.customerPhone?.trim() || profileQuery.data?.phoneNumber

    if (!shippingAddress) {
      void message.error('Vui lòng nhập địa chỉ giao hàng')
      return
    }

    if (!customerPhone) {
      void message.error('Vui lòng nhập số điện thoại nhận hàng')
      return
    }

    setSubmitting(true)
    try {
      const order = await orderApi.checkout({
        requestId: makeRequestId(),
        shippingAddress,
        customerPhone,
        couponCode: promotion?.valid ? couponCode.trim() : undefined,
        paymentMethod: values.paymentMethod,
        selectedBookIds: selectedBookIds.length > 0 ? selectedBookIds : undefined,
      })

      if (values.paymentMethod === 'VNPAY') {
        const { paymentUrl } = await orderApi.createPaymentUrl(order.orderId)
        window.location.assign(paymentUrl)
        return
      }

      void message.success('Đặt hàng thành công')
      queryClient.setQueryData<Cart>(['cart'], (cart) =>
        cart
          ? {
              ...cart,
              items:
                selectedBookIdSet.size > 0
                  ? cart.items.filter((item) => !selectedBookIdSet.has(item.bookId))
                  : [],
              totalAmount: 0,
              totalPrice: 0,
            }
          : cart
      )
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      await queryClient.invalidateQueries({ queryKey: ['catalog', 'books'] })
      navigate(`/orders/${order.orderId}`)
    } catch (err) {
      void message.error(err instanceof Error ? err.message : 'Không thể tạo đơn hàng')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="checkout-page">
        <section className="checkout-shell">
          <Skeleton active paragraph={{ rows: 10 }} />
        </section>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="checkout-page">
        <section className="checkout-shell">
          <Card className="se-card">
            <Empty description="Giỏ hàng đang trống" image={Empty.PRESENTED_IMAGE_SIMPLE}>
              <Button type="primary" href="/books">
                Tiếp tục mua sách
              </Button>
            </Empty>
          </Card>
        </section>
      </main>
    )
  }

  return (
    <main className="checkout-page">
      <section className="checkout-shell">
        <div className="checkout-heading">
          <Typography.Title level={1}>Thanh toán</Typography.Title>
          <Typography.Text type="secondary">
            Kiểm tra thông tin nhận hàng, ưu đãi, vận chuyển và thanh toán trong một bước.
          </Typography.Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            addressMode: defaultAddress ? 'saved' : 'custom',
            addressId: defaultAddress?.id,
            recipientName: getAddressRecipientName(defaultAddress),
            customerPhone: getAddressPhone(defaultAddress),
            shippingMethod: 'STANDARD',
            paymentMethod: 'VNPAY',
            invoiceType: 'PERSONAL',
            agree: true,
          }}
          onFinish={handleFinish}
        >
          <div className="checkout-grid">
            <div className="checkout-main">
              <Card
                className="se-card checkout-section"
                title={
                  <Space>
                    <EnvironmentOutlined />
                    <span>Địa chỉ giao hàng</span>
                  </Space>
                }
                extra={<Tag color="red">Bắt buộc</Tag>}
              >
                <Form.Item name="addressMode">
                  <Radio.Group className="checkout-radio-stack">
                    {addresses.length > 0 && (
                      <Radio value="saved">
                        Dùng địa chỉ đã lưu
                        {defaultAddress && <Tag color="blue">Mặc định</Tag>}
                      </Radio>
                    )}
                    <Radio value="custom">Nhập địa chỉ giao hàng mới</Radio>
                  </Radio.Group>
                </Form.Item>

                <Row gutter={12} className="checkout-recipient-fields">
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Họ và tên người nhận"
                      name="recipientName"
                      rules={[{ required: true, message: 'Nhập họ tên người nhận' }]}
                    >
                      <Input prefix={<IdcardOutlined />} placeholder="VD: Nguyễn Văn A" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Số điện thoại"
                      name="customerPhone"
                      rules={[{ required: true, message: 'Nhập số điện thoại nhận hàng' }]}
                    >
                      <Input placeholder="VD: 0901234567" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  noStyle
                  shouldUpdate={(prev, cur) => prev.addressMode !== cur.addressMode}
                >
                  {({ getFieldValue }) =>
                    getFieldValue('addressMode') === 'saved' && addresses.length > 0 ? (
                      <>
                        <div className="checkout-selected-address">
                          <div>{renderAddressContact(selectedSavedAddress)}</div>
                          <Button onClick={() => setAddressModalOpen(true)}>Thay đổi</Button>
                        </div>
                        <Form.Item
                          name="addressId"
                          rules={[{ required: true, message: 'Chọn địa chỉ giao hàng' }]}
                        >
                          <Radio.Group
                            className="checkout-address-list"
                            onChange={(event) => {
                              const selected = addresses.find(
                                (address) => address.id === event.target.value
                              )
                              form.setFieldsValue({
                                recipientName: getAddressRecipientName(selected),
                                customerPhone: getAddressPhone(selected),
                              })
                            }}
                          >
                            {addresses.map((address) => (
                              <Radio.Button value={address.id} key={address.id}>
                                <strong>{getAddressRecipientName(address)}</strong>
                                <span>
                                  {getAddressPhone(address)} - {address.street}, {address.ward},{' '}
                                  {address.city}
                                </span>
                              </Radio.Button>
                            ))}
                          </Radio.Group>
                        </Form.Item>
                      </>
                    ) : (
                      <div className="checkout-address-fields">
                        <Form.Item
                          label="Số nhà, tên đường"
                          name="street"
                          rules={[{ required: true, message: 'Nhập số nhà, tên đường' }]}
                        >
                          <Input placeholder="VD: 12 Nguyễn Văn Bảo" />
                        </Form.Item>
                        <Row gutter={12}>
                          <Col xs={24} md={8}>
                            <Form.Item
                              label="Phường / Xã"
                              name="ward"
                              rules={[{ required: true, message: 'Nhập phường/xã' }]}
                            >
                              <Input placeholder="VD: Phường 4" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              label="Tỉnh / Thành phố"
                              name="city"
                              rules={[{ required: true, message: 'Nhập tỉnh/thành phố' }]}
                            >
                              <Input placeholder="VD: TP. Hồ Chí Minh" />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    )
                  }
                </Form.Item>

                <Form.Item label="Ghi chú giao hàng" name="note">
                  <Input.TextArea
                    rows={2}
                    placeholder="VD: Giao giờ hành chính, gọi trước khi giao"
                  />
                </Form.Item>
              </Card>

              <Card
                className="se-card checkout-section"
                title={
                  <Space>
                    <TruckOutlined />
                    <span>Phương thức vận chuyển</span>
                  </Space>
                }
              >
                <Form.Item name="shippingMethod" rules={[{ required: true }]}>
                  <Radio.Group className="checkout-option-list">
                    {Object.entries(shippingOptions).map(([value, option]) => (
                      <Radio.Button value={value} key={value}>
                        <TruckOutlined />
                        <span>
                          <strong>{option.label}</strong>
                          <small>{option.desc}</small>
                        </span>
                        <b>{option.fee ? formatMoney(option.fee) : 'Miễn phí'}</b>
                      </Radio.Button>
                    ))}
                  </Radio.Group>
                </Form.Item>
              </Card>

              <Card
                className="se-card checkout-section"
                title={
                  <Space>
                    <WalletOutlined />
                    <span>Phương thức thanh toán</span>
                  </Space>
                }
              >
                <Form.Item name="paymentMethod" rules={[{ required: true }]}>
                  <Radio.Group className="checkout-option-list">
                    <Radio.Button value="VNPAY">
                      <BankOutlined />
                      <span>
                        <strong>Thanh toán VNPay</strong>
                      </span>
                      <Tag color="green">Khuyến nghị</Tag>
                    </Radio.Button>
                    <Radio.Button value="COD">
                      <CheckCircleOutlined />
                      <span>
                        <strong>Thanh toán bằng tiền mặt khi nhận hàng</strong>
                        <small>Trả tiền mặt trực tiếp cho nhân viên giao hàng</small>
                      </span>
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </Card>

              <Card
                className="se-card checkout-section"
                title={
                  <Space>
                    <SafetyCertificateOutlined />
                    <span>Thông tin hóa đơn</span>
                  </Space>
                }
              >
                <div className="checkout-invoice-toggle">
                  <Form.Item name="needInvoice" valuePropName="checked" noStyle>
                    <Checkbox>Xuất hóa đơn GTGT</Checkbox>
                  </Form.Item>
                  <Button type="link" size="small">
                    Chi tiết
                  </Button>
                </div>
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, cur) => prev.needInvoice !== cur.needInvoice}
                >
                  {({ getFieldValue }) =>
                    getFieldValue('needInvoice') ? (
                      <div className="checkout-invoice-box">
                        <p className="checkout-invoice-warning">
                          *Từ 01/07/2025, Quý khách chịu trách nhiệm về thông tin địa chỉ xuất Hóa
                          đơn theo quy định Hành chính mới. SEBook sẽ không xuất lại hóa đơn nếu
                          thông tin không đúng.
                        </p>
                        <Form.Item name="invoiceType">
                          <Radio.Group className="checkout-invoice-type">
                            <Radio value="PERSONAL">Cá nhân</Radio>
                            <Radio value="BUSINESS">Doanh nghiệp</Radio>
                          </Radio.Group>
                        </Form.Item>

                        <Form.Item
                          noStyle
                          shouldUpdate={(prev, cur) => prev.invoiceType !== cur.invoiceType}
                        >
                          {({ getFieldValue }) =>
                            getFieldValue('invoiceType') === 'BUSINESS' ? (
                              <div className="checkout-invoice-fields">
                                <Form.Item label="Họ tên người mua hàng" name="invoiceBuyerName">
                                  <Input placeholder="Nhập họ tên người mua hàng" />
                                </Form.Item>
                                <Form.Item
                                  label="Tên doanh nghiệp"
                                  name="invoiceCompany"
                                  rules={[{ required: true, message: 'Nhập tên doanh nghiệp' }]}
                                >
                                  <Input placeholder="Nhập tên doanh nghiệp" />
                                </Form.Item>
                                <Form.Item
                                  label="Địa chỉ doanh nghiệp"
                                  name="invoiceBusinessAddress"
                                  rules={[{ required: true, message: 'Nhập địa chỉ doanh nghiệp' }]}
                                >
                                  <Input placeholder="Nhập địa chỉ doanh nghiệp" />
                                </Form.Item>
                                <Form.Item
                                  label="Mã số thuế"
                                  name="invoiceTaxCode"
                                  rules={[{ required: true, message: 'Nhập mã số thuế' }]}
                                >
                                  <Input placeholder="Nhập mã số thuế" />
                                </Form.Item>
                                <Form.Item label="Mã đơn vị QHNS" name="invoiceBudgetUnitCode">
                                  <Input placeholder="Nhập mã đơn vị quan hệ ngân sách" />
                                </Form.Item>
                                <Form.Item
                                  label="Email nhận hóa đơn"
                                  name="invoiceEmail"
                                  rules={[
                                    { required: true, message: 'Nhập email nhận hóa đơn' },
                                    { type: 'email', message: 'Email không hợp lệ' },
                                  ]}
                                >
                                  <Input placeholder="Nhập email nhận hóa đơn" />
                                </Form.Item>
                              </div>
                            ) : (
                              <div className="checkout-invoice-fields">
                                <Form.Item label="Họ tên người mua hàng" name="invoiceBuyerName">
                                  <Input placeholder="Nhập họ tên người mua hàng" />
                                </Form.Item>
                                <Form.Item label="Địa chỉ cá nhân" name="invoicePersonalAddress">
                                  <Input placeholder="Nhập địa chỉ cá nhân" />
                                </Form.Item>
                                <Form.Item label="Căn cước công dân" name="invoiceCitizenId">
                                  <Input placeholder="Nhập căn cước công dân" />
                                </Form.Item>
                                <Form.Item label="Số hộ chiếu" name="invoicePassport">
                                  <Input placeholder="Nhập số hộ chiếu" />
                                </Form.Item>
                                <Form.Item
                                  label="Email nhận hóa đơn"
                                  name="invoiceEmail"
                                  rules={[
                                    { required: true, message: 'Nhập email nhận hóa đơn' },
                                    { type: 'email', message: 'Email không hợp lệ' },
                                  ]}
                                >
                                  <Input placeholder="Nhập email nhận hóa đơn" />
                                </Form.Item>
                              </div>
                            )
                          }
                        </Form.Item>
                      </div>
                    ) : null
                  }
                </Form.Item>
              </Card>
            </div>

            <aside className="checkout-aside">
              <Card
                className="se-card checkout-section"
                title={
                  <Space>
                    <ShoppingCartOutlined />
                    <span>Kiểm tra đơn hàng</span>
                  </Space>
                }
              >
                <div className="checkout-items">
                  {items.map((item) => {
                    const book = booksById.get(item.bookId)
                    const lineTotal = toNumber(item.price) * item.quantity
                    return (
                      <div className="checkout-item" key={item.bookId}>
                        <div className="checkout-thumb">
                          {book?.imageUrl ? (
                            <img src={book.imageUrl} alt={item.title} />
                          ) : (
                            <ShoppingCartOutlined />
                          )}
                        </div>
                        <div>
                          <Link to={`/books/${item.bookId}`}>{item.title}</Link>
                          <span>{book?.author || book?.publisher || 'SEBook'}</span>
                          <small>
                            {formatMoney(item.price)} x {item.quantity}
                          </small>
                        </div>
                        <strong>{formatMoney(lineTotal)}</strong>
                      </div>
                    )
                  })}
                </div>
                <Button type="link" href="/cart" className="checkout-edit-cart">
                  Chỉnh sửa giỏ hàng
                </Button>
              </Card>

              <Card
                className="se-card checkout-section checkout-summary"
                title={
                  <Space>
                    <GiftOutlined />
                    <span>Mã giảm giá</span>
                  </Space>
                }
              >
                <Space.Compact className="checkout-coupon">
                  <Input
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(event.target.value.toUpperCase())
                      setPromotion(null)
                    }}
                    placeholder="Nhập mã giảm giá"
                  />
                  <Button loading={validatingCoupon} onClick={handleValidateCoupon}>
                    Áp dụng
                  </Button>
                </Space.Compact>
                {promotion && (
                  <Alert
                    type={promotion.valid ? 'success' : 'warning'}
                    showIcon
                    message={promotion.valid ? 'Đã áp dụng mã giảm giá' : promotion.message}
                  />
                )}
              </Card>

              <Card
                className="se-card checkout-section checkout-summary"
                title="Thông tin thanh toán"
              >
                <div className="checkout-total-row">
                  <span>Tạm tính</span>
                  <strong>{formatMoney(subtotal)}</strong>
                </div>
                <div className="checkout-total-row">
                  <span>Phí vận chuyển</span>
                  <strong>{shippingFee ? formatMoney(shippingFee) : 'Miễn phí'}</strong>
                </div>
                <div className="checkout-total-row">
                  <span>Giảm giá</span>
                  <strong>-{formatMoney(discount)}</strong>
                </div>
                <div className="checkout-grand-total">
                  <span>Thành tiền</span>
                  <strong>{formatMoney(finalAmount)}</strong>
                </div>

                <div className="checkout-policy">
                  <ClockCircleOutlined />
                  <span>Đơn hàng sẽ được giữ trong thời gian chờ thanh toán VNPay.</span>
                </div>

                <Form.Item
                  name="agree"
                  valuePropName="checked"
                  rules={[
                    {
                      validator: (_, checked) =>
                        checked
                          ? Promise.resolve()
                          : Promise.reject(new Error('Vui lòng xác nhận điều khoản')),
                    },
                  ]}
                >
                  <Checkbox>Tôi đồng ý với điều khoản mua hàng và chính sách đổi trả</Checkbox>
                </Form.Item>

                <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
                  Hoàn tất đặt hàng
                </Button>
              </Card>
            </aside>
          </div>
        </Form>
        <Modal
          open={addressModalOpen}
          title="Chọn địa chỉ giao hàng"
          onCancel={() => setAddressModalOpen(false)}
          footer={null}
          destroyOnClose
        >
          <Radio.Group
            className="checkout-address-modal-list"
            value={selectedSavedAddress?.id}
            onChange={(event) => {
              selectSavedAddress(event.target.value)
              setAddressModalOpen(false)
            }}
          >
            {addresses.map((address) => (
              <Radio.Button value={address.id} key={address.id}>
                <strong>{getAddressRecipientName(address)}</strong>
                <span>{getAddressPhone(address)}</span>
                <small>{compactAddress(address)}</small>
              </Radio.Button>
            ))}
          </Radio.Group>
        </Modal>
      </section>
    </main>
  )
}
