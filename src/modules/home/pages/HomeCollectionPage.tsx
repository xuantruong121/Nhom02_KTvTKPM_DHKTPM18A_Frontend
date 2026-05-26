import {
  BookOutlined,
  FireOutlined,
  PercentageOutlined,
  RocketOutlined,
  StarFilled,
  TrophyOutlined,
} from '@ant-design/icons'
import { Card, Col, Empty, Image, Row, Skeleton, Space, Tabs, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { Link, useSearchParams } from 'react-router-dom'
import { catalogApi, type Book } from '@/modules/catalog/api/catalogApi'
import { homeApi, type HomeBook } from '@/modules/home/api/homeApi'
import { useApiQuery } from '@/shared/hooks/useApiQuery'
import './HomeCollectionPage.css'

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const trendTabLabels: Record<string, string> = {
  daily: 'Xu Hướng Theo Ngày',
  hot: 'Sách Hot',
  sale: 'Giảm Sốc',
  'best-seller': 'Bestseller',
}

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

function ProductCard({ book }: { book: Book }) {
  const discount = getDiscount(book)

  return (
    <Card hoverable className="home-collection-product">
      <Link to={`/books/${book.id}`}>
        <div className="home-collection-cover">
          {book.imageUrl ? (
            <Image src={book.imageUrl} alt={book.title} preview={false} />
          ) : (
            <BookOutlined />
          )}
        </div>
        <Typography.Text strong className="home-collection-title">
          {book.title}
        </Typography.Text>
        <Typography.Text type="secondary" className="home-collection-author">
          {book.author || book.publisher || 'SEBook'}
        </Typography.Text>
        <div className="home-collection-price-row">
          <div>
            <Typography.Text strong className="home-collection-price">
              {formatPrice(book.price)}
            </Typography.Text>
            {book.originalPrice ? (
              <Typography.Text delete className="home-collection-original">
                {formatPrice(book.originalPrice)}
              </Typography.Text>
            ) : null}
          </div>
          {discount ? <Tag color="red">-{discount}%</Tag> : null}
        </div>
        <div className="home-collection-meta">
          <span>
            <StarFilled /> {toNumber(book.averageRating).toFixed(1)}
          </span>
          <span>{toNumber(book.quantity) > 0 ? `Còn ${toNumber(book.quantity)}` : 'Hết hàng'}</span>
        </div>
      </Link>
    </Card>
  )
}

function ProductGrid({ books, loading }: { books: Book[]; loading: boolean }) {
  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />
  if (!books.length) return <Empty description="Chưa có sách phù hợp" />

  return (
    <Row gutter={[16, 16]}>
      {books.map((book) => (
        <Col xs={12} sm={8} md={6} xl={4} key={book.id}>
          <ProductCard book={book} />
        </Col>
      ))}
    </Row>
  )
}

function RankingList({ books, loading }: { books: HomeBook[]; loading: boolean }) {
  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />
  if (!books.length) return <Empty description="Chưa có sách đã bán" />

  return (
    <div className="home-collection-ranking">
      {books.map((book, index) => (
        <Link to={`/books/${book.id}`} className="home-collection-rank-item" key={book.id}>
          <span className="home-collection-rank-number">{index + 1}</span>
          <div className="home-collection-rank-cover">
            {book.imageUrl ? <img src={book.imageUrl} alt={book.title} /> : <BookOutlined />}
          </div>
          <div className="home-collection-rank-info">
            <strong>{book.title}</strong>
            <span>{book.author || book.publisher || 'SEBook'}</span>
            <b>{formatPrice(book.price)}</b>
            <span className="home-collection-sold">
              Đã bán {toNumber(book.quantitySold).toLocaleString('vi-VN')} cuốn
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}

function PageTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Space className="home-collection-titlebar">
      <span>{icon}</span>
      <Typography.Title level={2}>{title}</Typography.Title>
    </Space>
  )
}

export function HomeCollectionPage({ type }: { type: 'new-books' | 'trends' | 'rankings' | 'flash-sale' }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTrendTab = searchParams.get('tab') ?? 'daily'

  const booksQuery = useApiQuery(['catalog', 'books'], () => catalogApi.getBooks(), {
    enabled: type === 'new-books',
  })
  const flashSaleQuery = useApiQuery(['home', 'flash-sale', 'active', 'collection'], () =>
    homeApi.getActiveFlashSale(), { enabled: type === 'flash-sale' }
  )
  const dailyTrendQuery = useApiQuery(['home', 'trending', 'collection'], () =>
    homeApi.getTrendingBooks({ limit: 100 }), { enabled: type === 'trends' }
  )
  const hotBooksQuery = useApiQuery(['home', 'hot-books', 'collection'], () =>
    homeApi.getHotBooks({ limit: 100 }), { enabled: type === 'trends' }
  )
  const shockSaleQuery = useApiQuery(['home', 'shock-sale', 'collection'], () =>
    homeApi.getShockSaleBooks({ limit: 100 }), { enabled: type === 'trends' }
  )
  const bestSellerQuery = useApiQuery(['home', 'best-seller', 'collection'], () =>
    homeApi.getRankingBooks('BEST_SELLER', { limit: 100 }), { enabled: type === 'trends' }
  )
  const salesRankingQuery = useApiQuery(['home', 'rankings', 'sales', 'collection'], () =>
    homeApi.getRankingBooks('SALES_RANKING', { limit: 100 }), { enabled: type === 'rankings' }
  )

  const newBooks = (booksQuery.data ?? [])
    .filter(isActive)
    .filter((book) => Boolean(book.createdAt) && dayjs(book.createdAt).isAfter(dayjs().subtract(7, 'day')))
    .sort((left, right) => dayjs(right.createdAt).valueOf() - dayjs(left.createdAt).valueOf())

  const flashSaleBooks = (flashSaleQuery.data?.items ?? []).map((item) => ({
    ...item,
    id: item.bookId,
    price: item.salePrice,
    originalPrice: item.price,
    quantity: item.saleQuantity,
  }))

  const trendTabs = [
    { key: 'daily', books: dailyTrendQuery.data ?? [], loading: dailyTrendQuery.isLoading },
    { key: 'hot', books: hotBooksQuery.data ?? [], loading: hotBooksQuery.isLoading },
    { key: 'sale', books: shockSaleQuery.data ?? [], loading: shockSaleQuery.isLoading },
    { key: 'best-seller', books: bestSellerQuery.data ?? [], loading: bestSellerQuery.isLoading },
  ]

  if (type === 'new-books') {
    return (
      <main className="home-collection-page">
        <Card className="home-collection-card">
          <PageTitle icon={<RocketOutlined />} title="Sách mới" />
          <ProductGrid books={newBooks} loading={booksQuery.isLoading} />
        </Card>
      </main>
    )
  }

  if (type === 'flash-sale') {
    return (
      <main className="home-collection-page">
        <Card className="home-collection-card">
          <PageTitle icon={<FireOutlined />} title="Flash Sale" />
          <ProductGrid books={flashSaleBooks} loading={flashSaleQuery.isLoading} />
        </Card>
      </main>
    )
  }

  if (type === 'rankings') {
    return (
      <main className="home-collection-page">
        <Card className="home-collection-card">
          <PageTitle icon={<TrophyOutlined />} title="Bảng Xếp Hạng SEBook" />
          <RankingList books={salesRankingQuery.data ?? []} loading={salesRankingQuery.isLoading} />
        </Card>
      </main>
    )
  }

  return (
    <main className="home-collection-page">
      <Card className="home-collection-card">
        <PageTitle icon={<PercentageOutlined />} title="Xu Hướng Mua Sắm" />
        <Tabs
          activeKey={activeTrendTab}
          onChange={(key) => setSearchParams({ tab: key })}
          items={trendTabs.map((tab) => ({
            key: tab.key,
            label: trendTabLabels[tab.key],
            children: <ProductGrid books={tab.books} loading={tab.loading} />,
          }))}
        />
      </Card>
    </main>
  )
}
