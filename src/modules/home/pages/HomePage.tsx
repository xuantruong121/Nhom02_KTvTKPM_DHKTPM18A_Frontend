import {
  AppstoreOutlined,
  BookOutlined,
  CrownOutlined,
  FireOutlined,
  GiftOutlined,
  PercentageOutlined,
  RightOutlined,
  RocketOutlined,
  StarFilled,
  TagsOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Carousel,
  Col,
  Empty,
  Flex,
  Image,
  Progress,
  Row,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { catalogApi, type Book, type Category } from '@/modules/catalog/api/catalogApi'
import { useApiQuery } from '@/shared/hooks/useApiQuery'
import './HomePage.css'

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const quickActions = [
  { label: 'Flash Sale', icon: <FireOutlined />, color: '#ef4444' },
  { label: 'Mã giảm giá', icon: <PercentageOutlined />, color: '#f97316' },
  { label: 'Sản phẩm mới', icon: <RocketOutlined />, color: '#2563eb' },
  { label: 'Manga', icon: <BookOutlined />, color: '#7c3aed' },
  { label: 'Ngoại văn', icon: <AppstoreOutlined />, color: '#0891b2' },
  { label: 'Phiên chợ đồ cũ', icon: <TagsOutlined />, color: '#16a34a' },
  { label: 'Thương hiệu', icon: <CrownOutlined />, color: '#ca8a04' },
]

const featuredCategories = [
  'Luyện Thi THCS, THPT',
  'Sách Lịch Sử',
  'Tiểu Thuyết Ngôn Tình',
  'Sách Kinh Tế',
  'Tâm Lý Kỹ Năng',
  'Góc Ngoại Ngữ',
  'Sách Thiếu Nhi',
  'Boardgame',
  'Dụng Cụ Vẽ',
  'Quả Địa Cầu',
  'Gift Cards',
]

const bookshelves = [
  'Tô Màu Dán Hình Cho Bé',
  'Bình Yên Để Bắt Đầu',
  'Làm Chủ Đồng Tiền',
  'Tác Giả Trẻ Việt Nam',
  'Harry Potter',
  'Nguyễn Nhật Ánh',
  'Văn học Việt Nam',
  'Tác phẩm kinh điển',
  'Nuôi con thảnh thơi',
  'Truyện đọc cho bé',
]

const collections = [
  'Transformers',
  'Zootopia',
  'Doraemon',
  'Conan',
  'One Piece',
  'Disney',
  'Sanrio',
  'Pokémon',
  'Panda - Gấu trúc',
]

const brands = [
  'Tân Việt Books',
  'Alphabooks',
  'Đinh Tị Books',
  'Deli Online',
  'Megabook',
  'Pace Books',
  'Sách Tham Khảo',
  'Giáo trình Tiếng Anh',
  'Góc Ngoại Ngữ',
]

const comboTrending = [
  'Combo Kinh Tế',
  'Combo Sách Học Ngoại Ngữ',
  'Combo Tâm Lý - Kĩ Năng Sống',
  'Combo Văn Học',
  'Combo Thiếu Nhi',
]

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

function getCoverBooks(books: Book[], count: number) {
  const withImages = books.filter((book) => book.imageUrl)
  return (withImages.length ? withImages : books).slice(0, count)
}

function getBooksByCategoryName(categories: Category[], books: Book[], keyword: string) {
  const categoryIds = categories
    .filter((category) => category.name.toLowerCase().includes(keyword.toLowerCase()))
    .map((category) => category.id)

  if (categoryIds.length === 0) return []
  return books.filter((book) => book.categoryIds?.some((id) => categoryIds.includes(id)))
}

function SectionHeader({
  icon,
  title,
  action = 'Xem thêm',
}: {
  icon: ReactNode
  title: string
  action?: string
}) {
  return (
    <Flex align="center" justify="space-between" className="home-section-header">
      <Space>
        <span className="home-section-icon">{icon}</span>
        <Typography.Title level={3}>{title}</Typography.Title>
      </Space>
      <Button type="link" icon={<RightOutlined />}>
        {action}
      </Button>
    </Flex>
  )
}

function ProductCard({ book, compact = false }: { book: Book; compact?: boolean }) {
  const discount = getDiscount(book)

  return (
    <Card hoverable className={compact ? 'home-product-card compact' : 'home-product-card'}>
      <Link to={`/books/${book.id}`} className="home-product-link">
        <div className="home-product-cover">
          {book.imageUrl ? (
            <Image src={book.imageUrl} alt={book.title} preview={false} />
          ) : (
            <BookOutlined />
          )}
        </div>
        <Typography.Text strong className="home-product-title">
          {book.title}
        </Typography.Text>
        <Typography.Text type="secondary" className="home-product-author">
          {book.author || book.publisher || 'SEBook'}
        </Typography.Text>
      <Flex align="center" justify="space-between" className="home-product-price-row">
        <div>
          <Typography.Text strong className="home-product-price">
            {formatPrice(book.price)}
          </Typography.Text>
          {book.originalPrice ? (
            <Typography.Text delete className="home-product-original">
              {formatPrice(book.originalPrice)}
            </Typography.Text>
          ) : null}
        </div>
        {discount ? <Tag color="red">-{discount}%</Tag> : null}
      </Flex>
      {!compact ? (
        <Flex align="center" justify="space-between" className="home-product-meta">
          <span>
            <StarFilled /> {toNumber(book.averageRating).toFixed(1)}
          </span>
          <span>{book.quantity > 0 ? `Còn ${book.quantity}` : 'Hết hàng'}</span>
        </Flex>
      ) : null}
      </Link>
    </Card>
  )
}

function RankingList({ books }: { books: Book[] }) {
  return (
    <div className="home-ranking-list">
      {books.slice(0, 6).map((book, index) => (
        <Link to={`/books/${book.id}`} className="home-ranking-item" key={book.id}>
          <span className="home-rank-number">{index + 1}</span>
          <div className="home-rank-cover">
            {book.imageUrl ? <img src={book.imageUrl} alt={book.title} /> : <BookOutlined />}
          </div>
          <div className="home-rank-info">
            <strong>{book.title}</strong>
            <span>{book.author || book.publisher || 'SEBook'}</span>
            <b>{formatPrice(book.price)}</b>
          </div>
        </Link>
      ))}
    </div>
  )
}

function TextTile({
  label,
  tone = 'default',
}: {
  label: string
  tone?: 'default' | 'warm' | 'cool'
}) {
  return (
    <button className={`home-text-tile ${tone}`} type="button">
      <GiftOutlined />
      <span>{label}</span>
    </button>
  )
}

export function HomePage() {
  const categoriesQuery = useApiQuery(['catalog', 'categories'], () => catalogApi.getCategories())
  const booksQuery = useApiQuery(['catalog', 'books'], () => catalogApi.getBooks())

  const categories = useMemo(
    () => (categoriesQuery.data ?? []).filter(isActive),
    [categoriesQuery.data]
  )
  const books = useMemo(() => (booksQuery.data ?? []).filter(isActive), [booksQuery.data])

  const loading = categoriesQuery.isLoading || booksQuery.isLoading
  const hasError = categoriesQuery.isError || booksQuery.isError

  const discountedBooks = useMemo(
    () =>
      books
        .filter((book) => getDiscount(book) !== null)
        .sort((a, b) => (getDiscount(b) ?? 0) - (getDiscount(a) ?? 0)),
    [books]
  )

  const flashSaleProducts = discountedBooks.length ? discountedBooks.slice(0, 5) : books.slice(0, 5)
  const coverBooks = getCoverBooks(books, 5)
  const literatureBooks = getBooksByCategoryName(categories, books, 'Văn học')
  const businessBooks = getBooksByCategoryName(categories, books, 'Kinh tế')
  const skillBooks = getBooksByCategoryName(categories, books, 'Kỹ năng')
  const childrenBooks = getBooksByCategoryName(categories, books, 'Thiếu nhi')
  const foreignBooks = books.filter((book) => book.language && book.language !== 'vi')

  const trendTabs = [
    { key: 'daily', label: 'Xu Hướng Theo Ngày', books: books.slice(0, 8) },
    { key: 'sale', label: 'Sách HOT - Giảm Sốc', books: flashSaleProducts },
    { key: 'foreign', label: 'Bestseller Ngoại Văn', books: foreignBooks.slice(0, 8) },
    { key: 'exclusive', label: 'Sách chỉ bán tại SEBook', books: books.slice(8, 16) },
  ]

  const rankingTabs = [
    { key: 'literature', label: 'Văn học', books: literatureBooks },
    { key: 'business', label: 'Kinh Tế', books: businessBooks },
    { key: 'skill', label: 'Tâm lý - Kỹ năng sống', books: skillBooks },
    { key: 'children', label: 'Thiếu nhi', books: childrenBooks },
    { key: 'foreign', label: 'Foreign books', books: foreignBooks },
  ].map((tab) => ({ ...tab, books: tab.books.length ? tab.books : books }))

  if (hasError) {
    return (
      <main className="home-page">
        <Card>
          <Empty description="Không tải được dữ liệu sách. Vui lòng kiểm tra backend hoặc cấu hình API." />
        </Card>
      </main>
    )
  }

  return (
    <main className="home-page">
      <section className="home-shell home-hero-grid">
        <Card className="home-mega-card" id="categories">
          <SectionHeader icon={<AppstoreOutlined />} title="Danh mục sản phẩm" action="Tất cả" />
          <div className="home-category-list">
            {(categories.length ? categories : [{ id: 0, name: 'Sách Trong Nước' }]).map(
              (category) => (
                <a href="#shopping-trends" key={category.id}>
                  <BookOutlined />
                  <span>{category.name}</span>
                </a>
              )
            )}
          </div>
        </Card>

        <Card className="home-hero-card">
          <Carousel autoplay dots>
            {['Ưu Đãi Siêu To', 'Flash Sale 15.05', 'Sản Phẩm Mới'].map((title, index) => (
              <div className="home-hero-slide" key={title}>
                <div>
                  <Tag color="red">{index === 0 ? '15.05' : 'SEBook'}</Tag>
                  <Typography.Title level={1}>{title}</Typography.Title>
                  <Typography.Paragraph>
                    Khám phá sách mới, ưu đãi nổi bật và bộ sưu tập đang được độc giả quan tâm.
                  </Typography.Paragraph>
                  <Button type="primary" size="large">
                    Mua ngay
                  </Button>
                </div>
                <div className="home-hero-covers">
                  {coverBooks.slice(index, index + 3).map((book) => (
                    <img src={book.imageUrl ?? ''} alt={book.title} key={book.id} />
                  ))}
                </div>
              </div>
            ))}
          </Carousel>
        </Card>
      </section>

      <section className="home-shell home-shortcuts">
        {quickActions.map((action) => (
          <button type="button" className="home-shortcut" key={action.label}>
            <span style={{ color: action.color }}>{action.icon}</span>
            <strong>{action.label}</strong>
          </button>
        ))}
      </section>

      <section className="home-shell" id="flash-sale">
        <Card className="home-section-card">
          <SectionHeader icon={<FireOutlined />} title="Flash Sale" action="Xem tất cả" />
          <div className="home-countdown">
            <span>Kết thúc trong</span>
            <b>02</b>:<b>45</b>:<b>19</b>
          </div>
          {loading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : (
            <Row gutter={[16, 16]}>
              {flashSaleProducts.map((book, index) => (
                <Col xs={12} sm={8} md={6} lg={4} key={book.id}>
                  <ProductCard book={book} />
                  <Progress
                    percent={Math.min(100, 35 + index * 12)}
                    showInfo={false}
                    strokeColor="#c92127"
                    className="home-sale-progress"
                  />
                </Col>
              ))}
            </Row>
          )}
        </Card>
      </section>

      <section className="home-shell" id="featured-categories">
        <Card className="home-section-card">
          <SectionHeader icon={<TagsOutlined />} title="Danh Mục Sản Phẩm Nổi Bật" />
          <div className="home-tile-grid featured">
            {featuredCategories.map((category) => (
              <TextTile label={category} key={category} />
            ))}
          </div>
        </Card>
      </section>

      <section className="home-shell" id="shopping-trends">
        <Card className="home-section-card">
          <SectionHeader icon={<RocketOutlined />} title="Xu Hướng Mua Sắm" />
          <Tabs
            items={trendTabs.map((tab) => ({
              key: tab.key,
              label: tab.label,
              children: (
                <Row gutter={[16, 16]}>
                  {(tab.books.length ? tab.books : books).slice(0, 8).map((book) => (
                    <Col xs={12} sm={8} md={6} lg={6} key={book.id}>
                      <ProductCard book={book} compact />
                    </Col>
                  ))}
                </Row>
              ),
            }))}
          />
        </Card>
      </section>

      <section className="home-shell">
        <Card className="home-section-card">
          <SectionHeader icon={<BookOutlined />} title="Tủ Sách Nổi Bật" />
          <div className="home-tile-grid shelf">
            {bookshelves.map((shelf) => (
              <TextTile label={shelf} tone="warm" key={shelf} />
            ))}
          </div>
        </Card>
      </section>

      <section className="home-shell" id="rankings">
        <Card className="home-section-card">
          <SectionHeader icon={<TrophyOutlined />} title="Bảng Xếp Hạng SEBook" />
          <Tabs
            tabPosition="left"
            className="home-ranking-tabs"
            items={rankingTabs.map((tab) => ({
              key: tab.key,
              label: tab.label,
              children: <RankingList books={tab.books} />,
            }))}
          />
        </Card>
      </section>

      <section className="home-shell">
        <Card className="home-section-card">
          <SectionHeader icon={<CrownOutlined />} title="Bộ Sưu Tập Nổi Bật" />
          <div className="home-tile-grid collection">
            {collections.map((collection) => (
              <TextTile label={collection} tone="cool" key={collection} />
            ))}
          </div>
        </Card>
      </section>

      <section className="home-shell" id="brands">
        <Card className="home-section-card">
          <SectionHeader icon={<StarFilled />} title="Thương Hiệu Nổi Bật" />
          <div className="home-brand-grid">
            {brands.map((brand) => (
              <button type="button" key={brand}>
                {brand}
              </button>
            ))}
          </div>
        </Card>
      </section>

      <section className="home-shell">
        <Card className="home-section-card">
          <SectionHeader icon={<GiftOutlined />} title="Combo Trending" />
          <div className="home-combo-grid">
            {comboTrending.map((combo, index) => (
              <div className="home-combo" key={combo}>
                <div className="home-combo-covers">
                  {coverBooks.slice(index, index + 2).map((book) => (
                    <img src={book.imageUrl ?? ''} alt={book.title} key={book.id} />
                  ))}
                </div>
                <strong>{combo}</strong>
                <span>Tiết kiệm hơn khi mua theo bộ</span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </main>
  )
}
