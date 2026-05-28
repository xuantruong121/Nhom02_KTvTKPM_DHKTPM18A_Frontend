import {
  AppstoreOutlined,
  BookOutlined,
  FireOutlined,
  GiftOutlined,
  LeftOutlined,
  RightOutlined,
  RocketOutlined,
  StarFilled,
  TagsOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Carousel,
  Col,
  Empty,
  Flex,
  Modal,
  Progress,
  Row,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { CarouselRef } from 'antd/es/carousel'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { cartApi } from '@/modules/cart/api/cartApi'
import { catalogApi, type Book } from '@/modules/catalog/api/catalogApi'
import { BookCoverImage } from '@/modules/catalog/components/BookCoverImage'
import { homeApi, type HomeBook } from '@/modules/home/api/homeApi'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'
import { useIsAuthenticated } from '@/shared/store/authStore'
import './HomePage.css'

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

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

const HOME_CATEGORY_PREVIEW_LIMIT = 5
const FEATURED_CATEGORY_LIMIT = 6

function getRemainingTime(targetAt?: string | null) {
  if (!targetAt) return { total: 0, hours: '00', minutes: '00', seconds: '00' }
  const total = Math.max(0, dayjs(targetAt).diff(dayjs(), 'second'))
  const hours = String(Math.floor(total / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const seconds = String(total % 60).padStart(2, '0')
  return { total, hours, minutes, seconds }
}

function getFlashSaleCountdownTarget(startAt?: string | null, endAt?: string | null) {
  if (startAt && dayjs().isBefore(dayjs(startAt))) return startAt
  return endAt
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

function getCoverBooks(books: Book[], count: number) {
  const withImages = books.filter((book) => book.imageUrl)
  return (withImages.length ? withImages : books).slice(0, count)
}

function SectionHeader({
  icon,
  title,
  action = 'Xem thêm',
  onAction,
}: {
  icon: ReactNode
  title: string
  action?: string | null
  onAction?: () => void
}) {
  return (
    <Flex align="center" justify="space-between" className="home-section-header">
      <Space>
        <span className="home-section-icon">{icon}</span>
        <Typography.Title level={3}>{title}</Typography.Title>
      </Space>
      {action ? (
        <Button type="link" icon={<RightOutlined />} onClick={onAction}>
          {action}
        </Button>
      ) : null}
    </Flex>
  )
}

function ProductCard({
  book,
  compact = false,
  action,
}: {
  book: Book
  compact?: boolean
  action?: ReactNode
}) {
  const discount = getDiscount(book)

  return (
    <Card hoverable className={compact ? 'home-product-card compact' : 'home-product-card'}>
      <Link to={`/books/${book.id}`} className="home-product-link">
        <div className="home-product-cover">
          <BookCoverImage src={book.imageUrl} isbn={book.isbn} alt={book.title} />
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
      {action ? <div className="home-product-action">{action}</div> : null}
    </Card>
  )
}

function RankingList({ books, limit }: { books: HomeBook[]; limit?: number }) {
  const visibleBooks = typeof limit === 'number' ? books.slice(0, limit) : books

  return (
    <div className="home-ranking-list">
      {visibleBooks.map((book, index) => {
        const quantitySold = toNumber(book.quantitySold)

        return (
          <Link to={`/books/${book.id}`} className="home-ranking-item" key={book.id}>
            <span className="home-rank-number">{index + 1}</span>
            <div className="home-rank-cover">
              {book.imageUrl ? <img src={book.imageUrl} alt={book.title} /> : <BookOutlined />}
            </div>
            <div className="home-rank-info">
              <strong>{book.title}</strong>
              <span>{book.author || book.publisher || 'SEBook'}</span>
              <b>{formatPrice(book.price)}</b>
              <span className="home-rank-sold">
                Đã bán {quantitySold.toLocaleString('vi-VN')} cuốn
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function TextTile({
  label,
  tone = 'default',
  to,
}: {
  label: string
  tone?: 'default' | 'warm' | 'cool'
  to?: string
}) {
  const content = (
    <>
      <GiftOutlined />
      <span>{label}</span>
    </>
  )

  return to ? (
    <Link className={`home-text-tile ${tone}`} to={to}>
      {content}
    </Link>
  ) : (
    <button className={`home-text-tile ${tone}`} type="button">
      {content}
    </button>
  )
}

export function HomePage() {
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [activeTrendTab, setActiveTrendTab] = useState('daily')
  const heroCarouselRef = useRef<CarouselRef | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()
  const { message } = App.useApp()
  const categoriesQuery = useApiQuery(['catalog', 'categories'], () => catalogApi.getCategories())
  const booksQuery = useApiQuery(['catalog', 'books'], () => catalogApi.getBooks())
  const discoveryQuery = useApiQuery(['home', 'discovery'], () =>
    homeApi.getDiscovery({ limit: 8 })
  )
  const categorySalesQuery = useApiQuery(['home', 'rankings', 'sales', 'featured-categories'], () =>
    homeApi.getRankingBooks('SALES_RANKING', { limit: 100 })
  )
  const recommendationsQuery = useApiQuery(['home', 'recommendations'], () =>
    homeApi.getRecommendations({ limit: 8 })
  )
  const activeFlashSaleQuery = useApiQuery(
    ['home', 'flash-sale', 'active'],
    () => homeApi.getActiveFlashSale(),
    {
      refetchInterval: 30_000,
    }
  )
  const flashSaleCountdownTarget = getFlashSaleCountdownTarget(
    activeFlashSaleQuery.data?.startAt,
    activeFlashSaleQuery.data?.endAt
  )
  const flashSaleBuyMutation = useApiMutation((payload: { bookId: number; quantity: number }) =>
    cartApi.addFlashSaleItem(payload)
  )

  const handleFlashSaleBuyNow = async (bookId: number) => {
    if (!isAuthenticated) {
      navigate('/auth/login', {
        state: {
          from: `${location.pathname}${location.search}${location.hash}`,
        },
      })
      return
    }

    await flashSaleBuyMutation.mutateAsync(
      { bookId, quantity: 1 },
      {
        onSuccess: async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['cart'] }),
            queryClient.invalidateQueries({ queryKey: ['home', 'flash-sale', 'active'] }),
          ])
          void message.success('Đã áp dụng giá Flash Sale')
          navigate('/checkout', { state: { selectedBookIds: [bookId] } })
        },
      }
    )
  }

  useEffect(() => {
    if (!location.hash) return
    const target = document.getElementById(location.hash.slice(1))
    if (!target) return
    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [location.hash])

  const [flashSaleRemaining, setFlashSaleRemaining] = useState(() =>
    getRemainingTime(flashSaleCountdownTarget)
  )

  useEffect(() => {
    const updateRemaining = () => setFlashSaleRemaining(getRemainingTime(flashSaleCountdownTarget))
    updateRemaining()
    const timer = window.setInterval(updateRemaining, 1000)
    return () => window.clearInterval(timer)
  }, [flashSaleCountdownTarget])

  const categories = useMemo(
    () => (categoriesQuery.data ?? []).filter(isActive),
    [categoriesQuery.data]
  )
  const books = useMemo(() => (booksQuery.data ?? []).filter(isActive), [booksQuery.data])
  const newBooks = useMemo(() => {
    const sevenDaysAgo = dayjs().subtract(7, 'day')
    return books
      .filter((book) => Boolean(book.createdAt) && dayjs(book.createdAt).isAfter(sevenDaysAgo))
      .sort((left, right) => dayjs(right.createdAt).valueOf() - dayjs(left.createdAt).valueOf())
      .slice(0, 8)
  }, [books])

  const loading = categoriesQuery.isLoading || booksQuery.isLoading || discoveryQuery.isLoading
  const hasError = categoriesQuery.isError || booksQuery.isError

  const discoverySections = useMemo(() => {
    return new Map(
      (discoveryQuery.data?.sections ?? []).map((section) => [section.key, section.books])
    )
  }, [discoveryQuery.data?.sections])

  const discountedBooks = useMemo(
    () =>
      books
        .filter((book) => getDiscount(book) !== null)
        .sort((a, b) => (getDiscount(b) ?? 0) - (getDiscount(a) ?? 0)),
    [books]
  )
  const deepDiscountedBooks = useMemo(
    () => discountedBooks.filter((book) => (getDiscount(book) ?? 0) >= 30),
    [discountedBooks]
  )

  const trendingBooks = discoverySections.get('trending-daily') ?? books.slice(0, 8)
  const hotBooks = discoverySections.get('hot-books') ?? books.slice(0, 8)
  const shockSaleBooks = discoverySections.get('shock-sale') ?? deepDiscountedBooks.slice(0, 8)
  const salesRankingBooks = discoverySections.get('sales-ranking') ?? []
  const bestSellerRankingBooks = discoverySections.get('best-seller-ranking') ?? []
  const recommendedBooks = recommendationsQuery.data ?? []
  const activeFlashSaleItems = activeFlashSaleQuery.data?.items ?? []
  const configuredFlashSaleProducts = activeFlashSaleItems.map((item) => ({
    ...item,
    id: item.bookId,
    price: item.salePrice,
    originalPrice: item.price,
    quantity: item.saleQuantity,
  }))
  const shouldShowFlashSaleSection =
    activeFlashSaleQuery.isLoading || configuredFlashSaleProducts.length > 0
  const flashSaleCountdownLabel =
    activeFlashSaleQuery.data?.startAt && dayjs().isBefore(dayjs(activeFlashSaleQuery.data.startAt))
      ? 'Bắt đầu sau'
      : 'Kết thúc trong'
  const coverBooks = getCoverBooks(books, 5)
  const heroSlides = [
    { title: 'Ưu Đãi Siêu To', tag: 'SEBook', to: '/collections/trends?tab=sale' },
    { title: 'Flash Sale 15.05', tag: '15.05', to: '/collections/flash-sale' },
    { title: 'Sản Phẩm Mới', tag: 'SEBook', to: '/collections/new-books' },
  ]
  const homeCategoryItems = categories.length ? categories : [{ id: 0, name: 'Sách Trong Nước' }]
  const previewCategories = homeCategoryItems.slice(0, HOME_CATEGORY_PREVIEW_LIMIT)
  const categorySalesById = useMemo(() => {
    return (categorySalesQuery.data ?? []).reduce((map, book) => {
      const categoryIds = book.categoryIds?.length ? book.categoryIds : [0]
      const quantitySold = toNumber(book.quantitySold)

      categoryIds.forEach((categoryId) => {
        map.set(categoryId, (map.get(categoryId) ?? 0) + quantitySold)
      })

      return map
    }, new Map<number, number>())
  }, [categorySalesQuery.data])
  const featuredCategoryItems = categories.length
    ? [...categories]
        .sort((left, right) => {
          const soldDiff =
            (categorySalesById.get(right.id) ?? 0) - (categorySalesById.get(left.id) ?? 0)
          return soldDiff || left.name.localeCompare(right.name, 'vi')
        })
        .slice(0, FEATURED_CATEGORY_LIMIT)
        .map((category) => ({
          id: category.id,
          label: category.name,
          to: `/books?categoryId=${category.id}`,
        }))
    : featuredCategories
        .map((category) => ({
          id: category,
          label: category,
          to: '/books',
        }))
        .slice(0, FEATURED_CATEGORY_LIMIT)
  const trendTabs = [
    { key: 'daily', label: 'Xu Hướng Theo Ngày', books: trendingBooks },
    { key: 'hot', label: 'Sách Hot', books: hotBooks },
    { key: 'sale', label: 'Giảm Sốc', books: shockSaleBooks },
    { key: 'best-seller', label: 'Bestseller', books: bestSellerRankingBooks },
  ]

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
          <SectionHeader
            icon={<AppstoreOutlined />}
            title="Danh mục sản phẩm"
            action="Tất cả"
            onAction={() => setCategoryModalOpen(true)}
          />
          <div className="home-category-list">
            {previewCategories.map((category) => (
              <Link
                to={category.id ? `/books?categoryId=${category.id}` : '/books'}
                key={category.id}
              >
                <BookOutlined />
                <span>{category.name}</span>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="home-hero-card">
          <Carousel ref={heroCarouselRef} autoplay dots draggable>
            {heroSlides.map((slide, index) => (
              <div className="home-hero-slide" key={slide.title}>
                <div>
                  <Tag color="red">{slide.tag}</Tag>
                  <Typography.Title level={1}>{slide.title}</Typography.Title>
                  <Typography.Paragraph>
                    Khám phá sách mới, ưu đãi nổi bật và bộ sưu tập đang được độc giả quan tâm.
                  </Typography.Paragraph>
                  <Button type="primary" size="large" onClick={() => navigate(slide.to)}>
                    Xem ngay
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
          <div className="home-hero-controls">
            <Button
              shape="circle"
              icon={<LeftOutlined />}
              aria-label="Slide trước"
              onClick={() => heroCarouselRef.current?.prev()}
            />
            <Button
              shape="circle"
              icon={<RightOutlined />}
              aria-label="Slide sau"
              onClick={() => heroCarouselRef.current?.next()}
            />
          </div>
        </Card>
      </section>

      {shouldShowFlashSaleSection ? (
        <section className="home-shell" id="flash-sale">
          <Card className="home-section-card">
            <SectionHeader
              icon={<FireOutlined />}
              title="Flash Sale"
              action="Xem tất cả"
              onAction={() => navigate('/collections/flash-sale')}
            />
            <div className="home-countdown">
              <span>{flashSaleCountdownLabel}</span>
              <b>{flashSaleRemaining.hours}</b>:<b>{flashSaleRemaining.minutes}</b>:
              <b>{flashSaleRemaining.seconds}</b>
            </div>
            {activeFlashSaleQuery.isLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : configuredFlashSaleProducts.length ? (
              <Row gutter={[16, 16]}>
                {configuredFlashSaleProducts.map((book, index) => {
                  const bookSaleNotStarted = Boolean(
                    book.startAt && dayjs().isBefore(dayjs(book.startAt))
                  )

                  return (
                    <Col xs={12} sm={8} md={6} lg={4} key={book.id}>
                      <ProductCard
                        book={book}
                        action={
                          <Button
                            block
                            type="primary"
                            loading={flashSaleBuyMutation.isPending}
                            disabled={bookSaleNotStarted || toNumber(book.quantity) <= 0}
                            onClick={() => void handleFlashSaleBuyNow(book.id)}
                          >
                            {bookSaleNotStarted ? 'Sắp diễn ra' : 'Mua ngay'}
                          </Button>
                        }
                      />
                      <Progress
                        percent={Math.min(100, 35 + index * 12)}
                        showInfo={false}
                        strokeColor="#c92127"
                        className="home-sale-progress"
                      />
                    </Col>
                  )
                })}
              </Row>
            ) : (
              <Empty description="Chưa có Flash Sale được cấu hình" />
            )}
          </Card>
        </section>
      ) : null}

      <section className="home-shell" id="new-books">
        <Card className="home-section-card">
          <SectionHeader
            icon={<RocketOutlined />}
            title="Sách mới"
            action="Xem thêm"
            onAction={() => navigate('/collections/new-books')}
          />
          {loading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : newBooks.length ? (
            <Row gutter={[16, 16]}>
              {newBooks.map((book) => (
                <Col xs={12} sm={8} md={6} lg={6} key={book.id}>
                  <ProductCard book={book} compact />
                </Col>
              ))}
            </Row>
          ) : (
            <Empty description="Chưa có sách mới trong 7 ngày gần đây" />
          )}
        </Card>
      </section>

      <section className="home-shell" id="featured-categories">
        <Card className="home-section-card">
          <SectionHeader
            icon={<TagsOutlined />}
            title="Danh Mục Sản Phẩm Nổi Bật"
            action="Xem thêm"
            onAction={() => setCategoryModalOpen(true)}
          />
          <div className="home-tile-grid featured">
            {featuredCategoryItems.map((category) => (
              <TextTile label={category.label} to={category.to} key={category.id} />
            ))}
          </div>
        </Card>
      </section>

      <section className="home-shell" id="shopping-trends">
        <Card className="home-section-card">
          <SectionHeader
            icon={<RocketOutlined />}
            title="Xu Hướng Mua Sắm"
            onAction={() => navigate(`/collections/trends?tab=${activeTrendTab}`)}
          />
          <Tabs
            activeKey={activeTrendTab}
            onChange={setActiveTrendTab}
            items={trendTabs.map((tab) => ({
              key: tab.key,
              label: tab.label,
              children: tab.books.length ? (
                <Row gutter={[16, 16]}>
                  {tab.books.slice(0, 8).map((book) => (
                    <Col xs={12} sm={8} md={6} lg={6} key={book.id}>
                      <ProductCard book={book} compact />
                    </Col>
                  ))}
                </Row>
              ) : (
                <Empty description="Chưa có sách phù hợp" />
              ),
            }))}
          />
        </Card>
      </section>

      <section className="home-shell" id="rankings">
        <Card className="home-section-card">
          <SectionHeader
            icon={<TrophyOutlined />}
            title="Bảng Xếp Hạng SEBook"
            action={salesRankingBooks.length > 6 ? 'Xem thêm' : null}
            onAction={() => navigate('/collections/rankings')}
          />
          {salesRankingBooks.length ? (
            <RankingList books={salesRankingBooks} limit={6} />
          ) : (
            <Empty description="Chưa có sách đã bán" />
          )}
        </Card>
      </section>

      <section className="home-shell" id="recommendations">
        <Card className="home-section-card">
          <SectionHeader icon={<GiftOutlined />} title="Gợi ý dành cho bạn" action={null} />
          {recommendationsQuery.isLoading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : recommendedBooks.length ? (
            <Row gutter={[16, 16]}>
              {recommendedBooks.slice(0, 8).map((book) => (
                <Col xs={12} sm={8} md={6} lg={6} key={book.id}>
                  <ProductCard book={book} compact />
                  <div className="home-recommendation-reason">
                    {book.reason || 'Phù hợp để khám phá thêm'}
                  </div>
                </Col>
              ))}
            </Row>
          ) : (
            <Empty description="Chưa có gợi ý phù hợp" />
          )}
        </Card>
      </section>

      <Modal
        className="home-category-modal"
        title="Chọn danh mục"
        open={categoryModalOpen}
        footer={null}
        onCancel={() => setCategoryModalOpen(false)}
      >
        <div className="home-category-modal-grid">
          {homeCategoryItems.map((category) => (
            <Link
              to={category.id ? `/books?categoryId=${category.id}` : '/books'}
              key={category.id}
              onClick={() => setCategoryModalOpen(false)}
            >
              <BookOutlined />
              <span>{category.name}</span>
            </Link>
          ))}
        </div>
      </Modal>
    </main>
  )
}
