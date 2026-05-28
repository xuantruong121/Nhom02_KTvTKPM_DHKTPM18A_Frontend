import {
  BookOutlined,
  CheckCircleOutlined,
  GiftOutlined,
  HeartFilled,
  HeartOutlined,
  MinusOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  TruckOutlined,
} from '@ant-design/icons'
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  Flex,
  Form,
  Image,
  Input,
  InputNumber,
  List,
  Modal,
  Progress,
  Rate,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { catalogApi, type Book, type Category } from '@/modules/catalog/api/catalogApi'
import { BookCard } from '@/modules/catalog/components/BookCard'
import { useAddToCart } from '@/modules/cart/hooks/useAddToCart'
import { useFavoriteBooks } from '@/modules/favorites/hooks/useFavoriteBooks'
import { homeApi } from '@/modules/home/api/homeApi'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'
import { useIsAuthenticated } from '@/shared/store/authStore'
import './BookDetailPage.css'

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

function isActive(entity: { active?: boolean; isActive?: boolean }) {
  return entity.active ?? entity.isActive ?? true
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return 0
  return typeof value === 'number' ? value : Number(value)
}

function formatPrice(value: number | string | null | undefined) {
  return currencyFormatter.format(toNumber(value))
}

function getDiscount(book: Book) {
  const price = toNumber(book.price)
  const originalPrice = toNumber(book.originalPrice)
  if (!originalPrice || originalPrice <= price) return null
  return Math.round(((originalPrice - price) / originalPrice) * 100)
}

function getCategoryNames(book: Book, categories: Category[]) {
  const ids = book.categoryIds ?? []
  return categories.filter((category) => ids.includes(category.id)).map((category) => category.name)
}

function getRemainingTime(targetAt?: string | null) {
  if (!targetAt) return { total: 0, hours: '00', minutes: '00', seconds: '00' }
  const total = Math.max(0, dayjs(targetAt).diff(dayjs(), 'second'))
  const hours = String(Math.floor(total / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const seconds = String(total % 60).padStart(2, '0')
  return { total, hours, minutes, seconds }
}

export function BookDetailPage() {
  const { message } = App.useApp()
  const params = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const bookId = Number(params.id)
  const [quantity, setQuantity] = useState(1)
  const [saleRemaining, setSaleRemaining] = useState(() => getRemainingTime(null))
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewForm] = Form.useForm<{ rating: number; content?: string }>()
  const isAuthenticated = useIsAuthenticated()
  const { addToCart, isPending: isAddingToCart } = useAddToCart()
  const { isFavorite, toggleFavorite } = useFavoriteBooks()

  const bookQuery = useApiQuery(['catalog', 'book', bookId], () => catalogApi.getBook(bookId), {
    enabled: Number.isFinite(bookId),
  })
  const categoriesQuery = useApiQuery(['catalog', 'categories'], () => catalogApi.getCategories())
  const booksQuery = useApiQuery(['catalog', 'books'], () => catalogApi.getBooks())
  const reviewsQuery = useApiQuery(
    ['catalog', 'book', bookId, 'reviews'],
    () => catalogApi.getBookReviews(bookId),
    { enabled: Number.isFinite(bookId) }
  )
  const myReviewQuery = useApiQuery(
    ['catalog', 'book', bookId, 'reviews', 'me'],
    () => catalogApi.getMyBookReview(bookId),
    { enabled: Number.isFinite(bookId) && isAuthenticated }
  )
  const activeFlashSaleQuery = useApiQuery(
    ['home', 'flash-sale', 'active'],
    () => homeApi.getActiveFlashSale(),
    {
      refetchInterval: 30_000,
    }
  )

  const catalogBook = bookQuery.data
  const activeFlashSaleItem = activeFlashSaleQuery.data?.items.find(
    (item) => item.bookId === bookId
  )
  const saleIsRunning =
    activeFlashSaleItem &&
    dayjs().isAfter(dayjs(activeFlashSaleItem.startAt)) &&
    dayjs().isBefore(dayjs(activeFlashSaleItem.endAt)) &&
    activeFlashSaleItem.saleQuantity > 0
  const book =
    catalogBook && saleIsRunning
      ? {
          ...catalogBook,
          price: activeFlashSaleItem.salePrice,
          originalPrice: activeFlashSaleItem.price,
          quantity: activeFlashSaleItem.saleQuantity,
        }
      : catalogBook

  useEffect(() => {
    const updateRemaining = () => setSaleRemaining(getRemainingTime(activeFlashSaleItem?.endAt))
    updateRemaining()
    const timer = window.setInterval(updateRemaining, 1000)
    return () => window.clearInterval(timer)
  }, [activeFlashSaleItem?.endAt])

  const categories = useMemo(
    () => (categoriesQuery.data ?? []).filter(isActive),
    [categoriesQuery.data]
  )
  const relatedBooks = useMemo(() => {
    if (!book) return []
    const ids = book.categoryIds ?? []
    return (booksQuery.data ?? [])
      .filter(isActive)
      .filter((item) => item.id !== book.id)
      .filter((item) => item.categoryIds?.some((id) => ids.includes(id)))
      .slice(0, 4)
  }, [book, booksQuery.data])

  const submitReviewMutation = useApiMutation(
    (values: { rating: number; content?: string }) => catalogApi.submitBookReview(bookId, values),
    {
      onSuccess: async () => {
        void message.success('Đã lưu đánh giá')
        setReviewOpen(false)
        reviewForm.resetFields()
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['catalog', 'book', bookId] }),
          queryClient.invalidateQueries({ queryKey: ['catalog', 'book', bookId, 'reviews'] }),
          queryClient.invalidateQueries({ queryKey: ['catalog', 'book', bookId, 'reviews', 'me'] }),
        ])
      },
    }
  )

  useEffect(() => {
    if (book && quantity > Math.max(1, book.quantity)) {
      setQuantity(Math.max(1, book.quantity))
    }
  }, [book, quantity])

  if (bookQuery.isLoading) {
    return (
      <main className="book-detail-page">
        <Card className="book-detail-shell">
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </main>
    )
  }

  if (bookQuery.isError || !book) {
    return (
      <main className="book-detail-page">
        <Card className="book-detail-shell">
          <Empty description="Không tìm thấy sách hoặc không tải được dữ liệu chi tiết." />
        </Card>
      </main>
    )
  }

  const discount = getDiscount(book)
  const categoryNames = getCategoryNames(book, categories)
  const rating = toNumber(book.averageRating)
  const reviews = reviewsQuery.data ?? []
  const myReview = myReviewQuery.data
  const reviewDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((review) => review.rating === star).length
    return {
      star,
      percent: reviews.length ? Math.round((count / reviews.length) * 100) : 0,
    }
  })
  const stock = book.quantity
  const favorite = isFavorite(book.id)
  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      void message.info('Vui lòng đăng nhập để lưu sản phẩm yêu thích')
      navigate('/auth/login')
      return
    }

    const added = toggleFavorite(book.id)
    void message.success(added ? 'Đã thêm vào sản phẩm yêu thích' : 'Đã bỏ khỏi sản phẩm yêu thích')
  }
  const openReviewModal = () => {
    if (!isAuthenticated) {
      void message.info('Vui lòng đăng nhập để viết đánh giá')
      navigate('/auth/login')
      return
    }
    if (myReview && !myReview.canEdit) {
      void message.warning('Bạn đã dùng hết lượt chỉnh sửa đánh giá')
      return
    }
    reviewForm.setFieldsValue({
      rating: myReview?.rating ?? 5,
      content: myReview?.content ?? '',
    })
    setReviewOpen(true)
  }
  const handleBuyNow = async () => {
    const added = await addToCart({
      bookId: book.id,
      quantity,
      successMessage: false,
    })

    if (added) {
      navigate('/checkout', { state: { selectedBookIds: [book.id] } })
    }
  }

  return (
    <main className="book-detail-page">
      <section className="book-detail-shell">
        <Card className="book-main-card se-card">
          <div className="book-main-grid">
            <div className="book-gallery">
              <div className="book-cover-frame">
                {book.imageUrl ? (
                  <Image src={book.imageUrl} alt={book.title} preview />
                ) : (
                  <BookOutlined />
                )}
              </div>
              <div className="book-thumb-row">
                <button type="button" className="active">
                  {book.imageUrl ? <img src={book.imageUrl} alt={book.title} /> : <BookOutlined />}
                </button>
              </div>
            </div>

            <div className="book-summary">
              <Tag color="red">Deal hot</Tag>
              <Typography.Title level={1}>{book.title}</Typography.Title>

              <Row gutter={[12, 8]} className="book-brief">
                <Col xs={24} md={12}>
                  Nhà xuất bản: <strong>{book.publisher || 'Đang cập nhật'}</strong>
                </Col>
                <Col xs={24} md={12}>
                  Tác giả: <strong>{book.author || 'Đang cập nhật'}</strong>
                </Col>
                <Col xs={24} md={12}>
                  Hình thức bìa: <strong>{book.coverType || 'Đang cập nhật'}</strong>
                </Col>
                <Col xs={24} md={12}>
                  Danh mục: <strong>{categoryNames.join(', ') || 'Sách'}</strong>
                </Col>
              </Row>

              <Flex align="center" gap={10} className="book-rating-row">
                <Rate disabled allowHalf value={rating} />
                <span>{rating.toFixed(1)}</span>
                <Divider type="vertical" />
                <span>{book.ratingCount ?? 0} đánh giá</span>
                <Divider type="vertical" />
                <span>Đã bán {Math.max(0, 120 - stock)}</span>
              </Flex>

              <div className="book-price-box">
                {saleIsRunning ? (
                  <div className="book-flash-countdown">
                    <span>Giảm giá trong</span>
                    <b>{saleRemaining.hours}</b>:<b>{saleRemaining.minutes}</b>:
                    <b>{saleRemaining.seconds}</b>
                  </div>
                ) : null}
                <br />
                <Space align="baseline">
                  <Typography.Text className="book-sale-price">
                    {formatPrice(book.price)}
                  </Typography.Text>
                  {book.originalPrice ? (
                    <Typography.Text delete className="book-original-price">
                      {formatPrice(book.originalPrice)}
                    </Typography.Text>
                  ) : null}
                  {discount ? <Tag color="red">-{discount}%</Tag> : null}
                </Space>
              </div>

              <Card className="book-promo-card">
                <Flex align="center" justify="space-between">
                  <Space>
                    <GiftOutlined />
                    <strong>Ưu đãi liên quan</strong>
                  </Space>
                  <Button type="link">Xem thêm</Button>
                </Flex>
                <div className="book-promo-list">
                  <Tag color="volcano">Giảm 10% cho đơn từ 300.000đ</Tag>
                  <Tag color="orange">Freeship nội thành</Tag>
                  <Tag color="gold">Tích F-Point</Tag>
                </div>
              </Card>

              <Card className="book-shipping-card">
                <Space align="start">
                  <TruckOutlined />
                  <div>
                    <strong>Thông tin vận chuyển</strong>
                    <p>Giao hàng đến địa chỉ của bạn. Phí vận chuyển được tính khi thanh toán.</p>
                  </div>
                </Space>
              </Card>

              <Flex align="center" gap={16} className="book-quantity-row">
                <span>Số lượng</span>
                <Button
                  icon={<MinusOutlined />}
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                />
                <InputNumber
                  value={quantity}
                  min={1}
                  max={Math.max(1, stock)}
                  onChange={(value) => setQuantity(Number(value ?? 1))}
                />
                <Button
                  icon={<PlusOutlined />}
                  disabled={quantity >= stock}
                  onClick={() => setQuantity((value) => Math.min(stock, value + 1))}
                />
                <Typography.Text type={stock > 0 ? 'secondary' : 'danger'}>
                  {stock > 0 ? `Còn ${stock} sản phẩm` : 'Hết hàng'}
                </Typography.Text>
              </Flex>

              <Flex gap={12} wrap="wrap" className="book-action-row">
                <Button
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  disabled={stock <= 0}
                  loading={isAddingToCart}
                  onClick={() => void addToCart({ bookId: book.id, quantity })}
                >
                  Thêm vào giỏ hàng
                </Button>
                <Button
                  size="large"
                  type="primary"
                  disabled={stock <= 0}
                  loading={isAddingToCart}
                  onClick={() => void handleBuyNow()}
                >
                  Mua ngay
                </Button>
                <Button
                  size="large"
                  icon={favorite ? <HeartFilled /> : <HeartOutlined />}
                  className={favorite ? 'book-favorite-button active' : 'book-favorite-button'}
                  onClick={handleToggleFavorite}
                />
              </Flex>
            </div>
          </div>
        </Card>

        <Card className="book-detail-card se-card" title="Thông tin chi tiết">
          <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="middle">
            <Descriptions.Item label="Mã hàng">{book.id}</Descriptions.Item>
            {book.isbn ? <Descriptions.Item label="ISBN">{book.isbn}</Descriptions.Item> : null}
            {book.publisher ? (
              <Descriptions.Item label="Nhà xuất bản">{book.publisher}</Descriptions.Item>
            ) : null}
            {book.publicationYear ? (
              <Descriptions.Item label="Năm xuất bản">{book.publicationYear}</Descriptions.Item>
            ) : null}
            {book.language ? (
              <Descriptions.Item label="Ngôn ngữ">{book.language}</Descriptions.Item>
            ) : null}
            {book.pageCount ? (
              <Descriptions.Item label="Số trang">{book.pageCount}</Descriptions.Item>
            ) : null}
            {book.coverType ? (
              <Descriptions.Item label="Hình thức">{book.coverType}</Descriptions.Item>
            ) : null}
          </Descriptions>
        </Card>

        <Card className="book-detail-card se-card" title="Mô tả sản phẩm">
          <Typography.Paragraph className="book-description">
            {book.description || 'Mô tả sản phẩm đang được cập nhật.'}
          </Typography.Paragraph>
        </Card>

        <Card className="book-detail-card se-card" title="Đánh giá sản phẩm">
          <div className="book-review-summary">
            <div>
              <strong>{rating.toFixed(1)}/5</strong>
              <Rate disabled allowHalf value={rating} />
              <span>({book.ratingCount ?? 0} đánh giá)</span>
            </div>
            <div className="book-review-bars">
              {reviewDistribution.map((item) => (
                <Flex align="center" gap={10} key={item.star}>
                  <span>{item.star} sao</span>
                  <Progress percent={item.percent} showInfo={false} />
                </Flex>
              ))}
            </div>
            <Button type="primary" onClick={openReviewModal}>
              {myReview ? 'Sửa đánh giá' : 'Viết đánh giá'}
            </Button>
          </div>
          <Divider />
          <List
            loading={reviewsQuery.isLoading}
            dataSource={reviews}
            locale={{ emptyText: 'Chưa có đánh giá nào' }}
            renderItem={(review) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar>
                      {(review.reviewerName || review.reviewerEmail || 'U').charAt(0).toUpperCase()}
                    </Avatar>
                  }
                  title={
                    <Space>
                      <Typography.Text strong>
                        {review.reviewerName || 'Người dùng SEBook'}
                      </Typography.Text>
                      <Rate disabled value={review.rating} style={{ fontSize: 14 }} />
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <Typography.Text>
                        {review.content || 'Người dùng chưa nhập nội dung đánh giá.'}
                      </Typography.Text>
                      {review.adminPublicReply ? (
                        <div className="book-admin-reply">
                          <Tag color="blue">Phản hồi từ cửa hàng</Tag>
                          <Typography.Text>{review.adminPublicReply}</Typography.Text>
                          {review.adminRepliedAt ? (
                            <Typography.Text type="secondary">
                              {dayjs(review.adminRepliedAt).format('DD/MM/YYYY HH:mm')}
                            </Typography.Text>
                          ) : null}
                        </div>
                      ) : null}
                      <Typography.Text type="secondary">
                        {review.updatedAt ? dayjs(review.updatedAt).format('DD/MM/YYYY HH:mm') : ''}
                      </Typography.Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>

        {relatedBooks.length > 0 ? (
          <Card
            className="book-detail-card se-card"
            title={
              <Space>
                <CheckCircleOutlined />
                Sách liên quan
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              {relatedBooks.map((item) => (
                <Col xs={12} sm={8} lg={6} key={item.id}>
                  <BookCard book={item} />
                </Col>
              ))}
            </Row>
          </Card>
        ) : null}

        <Link to="/books">Quay lại danh sách sách</Link>
      </section>
      <Modal
        title={myReview ? 'Sửa đánh giá của bạn' : 'Viết đánh giá'}
        open={reviewOpen}
        onCancel={() => setReviewOpen(false)}
        onOk={() => reviewForm.submit()}
        confirmLoading={submitReviewMutation.isPending}
        okText="Lưu đánh giá"
        cancelText="Huỷ"
      >
        <Form
          form={reviewForm}
          layout="vertical"
          initialValues={{ rating: 5 }}
          onFinish={(values) => submitReviewMutation.mutate(values)}
        >
          <Form.Item
            name="rating"
            label="Số sao"
            rules={[{ required: true, message: 'Vui lòng chọn số sao' }]}
          >
            <Rate allowClear={false} />
          </Form.Item>
          <Form.Item name="content" label="Nội dung đánh giá">
            <Input.TextArea
              rows={4}
              maxLength={1000}
              showCount
              placeholder="Chia sẻ cảm nhận của bạn về cuốn sách"
            />
          </Form.Item>
          {myReview ? (
            <Typography.Text type={myReview.canEdit ? 'secondary' : 'danger'}>
              {myReview.canEdit
                ? 'Bạn còn 1 lần chỉnh sửa đánh giá này.'
                : 'Bạn đã dùng hết lượt chỉnh sửa đánh giá này.'}
            </Typography.Text>
          ) : null}
        </Form>
      </Modal>
    </main>
  )
}
