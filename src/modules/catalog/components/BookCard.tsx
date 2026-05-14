import { BookOutlined, ShoppingCartOutlined, StarFilled } from '@ant-design/icons'
import { Button, Card, Flex, Image, Space, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'
import type { Book } from '@/modules/catalog/api/catalogApi'
import { useAddToCart } from '@/modules/cart/hooks/useAddToCart'
import './BookCard.css'

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

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

export function BookCard({ book }: { book: Book }) {
  const discount = getDiscount(book)
  const { addToCart, isPending } = useAddToCart()

  return (
    <Card hoverable className="catalog-book-card">
      <Link to={`/books/${book.id}`} className="catalog-book-link" aria-label={`Xem chi tiết ${book.title}`}>
        <div className="catalog-book-cover">
          {book.imageUrl ? (
            <Image src={book.imageUrl} alt={book.title} preview={false} />
          ) : (
            <BookOutlined />
          )}
        </div>

        <Typography.Text strong className="catalog-book-title">
          {book.title}
        </Typography.Text>
        <Typography.Text type="secondary" className="catalog-book-author">
          {book.author || book.publisher || 'SEBook'}
        </Typography.Text>

        <Flex align="center" justify="space-between" className="catalog-book-price-row">
          <Space direction="vertical" size={0}>
            <Typography.Text strong className="catalog-book-price">
              {formatPrice(book.price)}
            </Typography.Text>
            {book.originalPrice ? (
              <Typography.Text delete className="catalog-book-original">
                {formatPrice(book.originalPrice)}
              </Typography.Text>
            ) : null}
          </Space>
          {discount ? <Tag color="red">-{discount}%</Tag> : null}
        </Flex>

        <Flex align="center" justify="space-between" className="catalog-book-meta">
          <span>
            <StarFilled /> {toNumber(book.averageRating).toFixed(1)} ({book.ratingCount ?? 0})
          </span>
          <span>{book.quantity > 0 ? `Còn ${book.quantity}` : 'Hết hàng'}</span>
        </Flex>
      </Link>

      <Button
        block
        type="primary"
        icon={<ShoppingCartOutlined />}
        disabled={book.quantity <= 0}
        loading={isPending}
        onClick={() => void addToCart({ bookId: book.id, quantity: 1 })}
      >
        Thêm vào giỏ
      </Button>
    </Card>
  )
}
