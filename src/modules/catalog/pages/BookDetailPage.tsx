import {
  BookOutlined,
  CheckCircleOutlined,
  GiftOutlined,
  HeartOutlined,
  MinusOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  TruckOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  Flex,
  Image,
  InputNumber,
  Progress,
  Rate,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { catalogApi, type Book, type Category } from '@/modules/catalog/api/catalogApi'
import { BookCard } from '@/modules/catalog/components/BookCard'
import { useAddToCart } from '@/modules/cart/hooks/useAddToCart'
import { useApiQuery } from '@/shared/hooks/useApiQuery'
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

export function BookDetailPage() {
  const params = useParams<{ id: string }>()
  const navigate = useNavigate()
  const bookId = Number(params.id)
  const [quantity, setQuantity] = useState(1)
  const { addToCart, isPending: isAddingToCart } = useAddToCart()

  const bookQuery = useApiQuery(['catalog', 'book', bookId], () => catalogApi.getBook(bookId), {
    enabled: Number.isFinite(bookId),
  })
  const categoriesQuery = useApiQuery(['catalog', 'categories'], () => catalogApi.getCategories())
  const booksQuery = useApiQuery(['catalog', 'books', 'related'], () => catalogApi.getBooks())

  const book = bookQuery.data
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
  const stock = book.quantity
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
                <Button size="large" icon={<HeartOutlined />} />
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
              {[5, 4, 3, 2, 1].map((star) => (
                <Flex align="center" gap={10} key={star}>
                  <span>{star} sao</span>
                  <Progress percent={star === Math.round(rating) ? 70 : 0} showInfo={false} />
                </Flex>
              ))}
            </div>
            <Button type="primary">Viết đánh giá</Button>
          </div>
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
    </main>
  )
}
