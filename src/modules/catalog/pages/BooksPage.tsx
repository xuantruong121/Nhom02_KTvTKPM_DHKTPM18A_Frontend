import { AppstoreOutlined, ClearOutlined, FilterOutlined, SlidersOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Col,
  Empty,
  Flex,
  InputNumber,
  Pagination,
  Row,
  Select,
  Skeleton,
  Slider,
  Space,
  Typography,
} from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { catalogApi, type Book } from '@/modules/catalog/api/catalogApi'
import { BookCard } from '@/modules/catalog/components/BookCard'
import { useApiQuery } from '@/shared/hooks/useApiQuery'
import './BooksPage.css'

const PAGE_SIZE_OPTIONS = [8, 12, 16, 24]
const PRICE_STEP = 5000

function isActive(entity: { active?: boolean; isActive?: boolean }) {
  return entity.active ?? entity.isActive ?? true
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return 0
  return typeof value === 'number' ? value : Number(value)
}

function roundDownPrice(value: number) {
  return Math.floor(value / PRICE_STEP) * PRICE_STEP
}

function roundUpPrice(value: number) {
  return Math.ceil(value / PRICE_STEP) * PRICE_STEP
}

function matchesText(book: Book, text: string) {
  const keyword = text.trim().toLowerCase()
  if (!keyword) return true
  return [book.title, book.author, book.publisher, book.isbn]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(keyword))
}

export function BooksPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTitle = searchParams.get('title') ?? ''
  const initialCategory = searchParams.get('categoryId') ?? 'all'

  const [submittedTitle, setSubmittedTitle] = useState(initialTitle)
  const [categoryId, setCategoryId] = useState(initialCategory)
  const [minPrice, setMinPrice] = useState<number | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [sort, setSort] = useState('relevance')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)

  // Sync state when URL search params change (e.g. navigating from header search)
  useEffect(() => {
    const nextTitle = searchParams.get('title') ?? ''
    const nextCategory = searchParams.get('categoryId') ?? 'all'
    setSubmittedTitle(nextTitle)
    setCategoryId(nextCategory)
    setPage(1)
  }, [searchParams])

  const selectedCategoryId = categoryId === 'all' ? undefined : Number(categoryId)

  const categoriesQuery = useApiQuery(['catalog', 'categories'], () => catalogApi.getCategories())
  const booksQuery = useApiQuery(['catalog', 'books', submittedTitle, selectedCategoryId], () =>
    catalogApi.getBooks({ title: submittedTitle || undefined, categoryId: selectedCategoryId })
  )

  const categories = useMemo(
    () => (categoriesQuery.data ?? []).filter(isActive),
    [categoriesQuery.data]
  )
  const books = useMemo(() => (booksQuery.data ?? []).filter(isActive), [booksQuery.data])

  const priceBounds = useMemo(() => {
    const prices = books.map((book) => toNumber(book.price)).filter((price) => price > 0)
    if (prices.length === 0) return { min: 0, max: 100000 }
    return {
      min: roundDownPrice(Math.min(...prices)),
      max: roundUpPrice(Math.max(...prices)),
    }
  }, [books])

  const effectiveMinPrice = minPrice ?? priceBounds.min
  const effectiveMaxPrice = maxPrice ?? priceBounds.max

  const filteredBooks = useMemo(() => {
    const result = books.filter((book) => {
      const price = toNumber(book.price)
      return (
        matchesText(book, submittedTitle) &&
        (minPrice === null || price >= minPrice) &&
        (maxPrice === null || price <= maxPrice)
      )
    })

    return [...result].sort((a, b) => {
      if (sort === 'priceAsc') return toNumber(a.price) - toNumber(b.price)
      if (sort === 'priceDesc') return toNumber(b.price) - toNumber(a.price)
      if (sort === 'rating') return toNumber(b.averageRating) - toNumber(a.averageRating)
      if (sort === 'newest') return (b.publicationYear ?? 0) - (a.publicationYear ?? 0)
      return 0
    })
  }, [books, maxPrice, minPrice, sort, submittedTitle])

  const pagedBooks = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredBooks.slice(start, start + pageSize)
  }, [filteredBooks, page, pageSize])

  const loading = categoriesQuery.isLoading || booksQuery.isLoading
  const hasError = categoriesQuery.isError || booksQuery.isError

  const handleCategoryChange = (value: string) => {
    setCategoryId(value)
    setPage(1)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value !== 'all') next.set('categoryId', value)
      else next.delete('categoryId')
      if (submittedTitle) next.set('title', submittedTitle)
      else next.delete('title')
      return next
    })
  }

  const clearFilters = () => {
    setSubmittedTitle('')
    setCategoryId('all')
    setMinPrice(null)
    setMaxPrice(null)
    setSort('relevance')
    setPage(1)
    setSearchParams({})
  }

  return (
    <main className="books-page">
      <section className="books-page-shell">
        <Card className="books-filter-card se-card">
          <Flex align="center" justify="space-between" className="books-filter-title se-toolbar">
            <Space>
              <FilterOutlined />
              <strong>Bộ lọc</strong>
            </Space>
            <Button type="link" icon={<ClearOutlined />} onClick={clearFilters}>
              Xóa lọc
            </Button>
          </Flex>

          <div className="books-filter-grid">
            <div className="se-field">
              <span className="se-field-label">Danh mục</span>
              <Select
                value={categoryId}
                onChange={handleCategoryChange}
                className="books-filter-control se-control"
                options={[
                  { value: 'all', label: 'Tất cả danh mục' },
                  ...categories.map((category) => ({
                    value: String(category.id),
                    label: category.name,
                  })),
                ]}
              />
            </div>

            <div className="se-field books-price-field">
              <span className="se-field-label books-price-label">
                <SlidersOutlined />
                Hoặc chọn mức giá phù hợp với bạn
              </span>
              <Slider
                range
                min={priceBounds.min}
                max={priceBounds.max}
                step={PRICE_STEP}
                value={[effectiveMinPrice, effectiveMaxPrice]}
                tooltip={{
                  formatter: (value) => `${Number(value ?? 0).toLocaleString('vi-VN')}đ`,
                }}
                onChange={(value) => {
                  const [nextMin, nextMax] = value as [number, number]
                  setMinPrice(nextMin)
                  setMaxPrice(nextMax)
                  setPage(1)
                }}
              />
              <div className="books-price-inputs">
                <InputNumber
                  value={effectiveMinPrice}
                  min={priceBounds.min}
                  max={effectiveMaxPrice}
                  step={PRICE_STEP}
                  className="books-price-input se-control"
                  formatter={(value) =>
                    `${value ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'
                  }
                  parser={(value) => Number(value?.replace(/[^\d]/g, '') || 0)}
                  onChange={(value) => {
                    const nextValue = Math.min(Number(value ?? priceBounds.min), effectiveMaxPrice)
                    setMinPrice(nextValue)
                    setPage(1)
                  }}
                />
                <span className="books-price-divider" />
                <InputNumber
                  value={effectiveMaxPrice}
                  min={effectiveMinPrice}
                  max={priceBounds.max}
                  step={PRICE_STEP}
                  className="books-price-input se-control"
                  formatter={(value) =>
                    `${value ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'
                  }
                  parser={(value) => Number(value?.replace(/[^\d]/g, '') || 0)}
                  onChange={(value) => {
                    const nextValue = Math.max(Number(value ?? priceBounds.max), effectiveMinPrice)
                    setMaxPrice(nextValue)
                    setPage(1)
                  }}
                />
              </div>
            </div>

            <div className="se-field">
              <span className="se-field-label">Sắp xếp</span>
              <Select
                value={sort}
                onChange={(value) => {
                  setSort(value)
                  setPage(1)
                }}
                className="books-filter-control se-control"
                options={[
                  { value: 'relevance', label: 'Liên quan nhất' },
                  { value: 'priceAsc', label: 'Giá thấp đến cao' },
                  { value: 'priceDesc', label: 'Giá cao đến thấp' },
                  { value: 'rating', label: 'Đánh giá cao' },
                  { value: 'newest', label: 'Năm xuất bản mới' },
                ]}
              />
            </div>
          </div>
        </Card>

        <Card className="books-result-card se-card">
          <Flex align="center" justify="space-between" className="books-result-header">
            <Space>
              <AppstoreOutlined />
              <strong>{filteredBooks.length} sách phù hợp</strong>
            </Space>
            <Typography.Text type="secondary">
              Trang {filteredBooks.length === 0 ? 0 : page} /{' '}
              {Math.ceil(filteredBooks.length / pageSize) || 0}
            </Typography.Text>
          </Flex>

          {loading ? (
            <Row gutter={[16, 16]}>
              {Array.from({ length: pageSize }).map((_, index) => (
                <Col xs={12} sm={8} lg={6} key={index}>
                  <Card>
                    <Skeleton.Image active className="books-skeleton-cover" />
                    <Skeleton active paragraph={{ rows: 2 }} />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : hasError ? (
            <Empty description="Không tải được danh sách sách. Vui lòng kiểm tra backend hoặc cấu hình API." />
          ) : pagedBooks.length === 0 ? (
            <Empty description="Không tìm thấy sách phù hợp với bộ lọc hiện tại." />
          ) : (
            <Row gutter={[16, 16]}>
              {pagedBooks.map((book) => (
                <Col xs={12} sm={8} lg={6} key={book.id}>
                  <BookCard book={book} />
                </Col>
              ))}
            </Row>
          )}

          <Pagination
            className="books-pagination"
            current={page}
            pageSize={pageSize}
            total={filteredBooks.length}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            showSizeChanger
            showTotal={(total) => `${total} sách`}
            onChange={(nextPage, nextPageSize) => {
              setPage(nextPage)
              setPageSize(nextPageSize)
            }}
          />
        </Card>
      </section>
    </main>
  )
}
