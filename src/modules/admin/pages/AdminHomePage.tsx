import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Image,
  Progress,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  AlertOutlined,
  BookOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  StarOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  adminApi,
  type AdminBook,
  type AdminOrder,
  type AdminReview,
  type Category,
  type FulfillmentStatus,
  type InventoryStock,
  type Money,
} from '@/modules/admin/api/adminApi'
import { compareDate, compareNumber, compareText } from '@/modules/admin/utils/tableSort'
import { useApiQuery } from '@/shared/hooks/useApiQuery'
import './AdminHomePage.css'

dayjs.extend(isoWeek)

type RangePreset = 'today' | '7d' | '30d' | 'year' | 'custom'
type Granularity = 'day' | 'week' | 'month' | 'quarter'

type Trend = {
  value: number
  percent: number | null
  direction: 'up' | 'down' | 'flat'
}

type KpiCardProps = {
  title: string
  value: string | number
  icon: ReactNode
  loading: boolean
  trend?: Trend
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'slate'
}

type RevenuePoint = {
  label: string
  revenue: number
  previousRevenue: number
}

type StatusPoint = {
  name: string
  value: number
  color: string
}

type TopBookRow = {
  bookId: number
  title: string
  author?: string
  imageUrl?: string
  quantitySold: number
  revenue: number
  stock: number
}

type CategoryRow = {
  id: number
  name: string
  quantitySold: number
  revenue: number
  percentage: number
}

type CustomerRow = {
  id: number
  fullName: string
  email: string
  createdAt?: string
  orderCount: number
  totalSpent: number
}

const LOW_STOCK_THRESHOLD = 10
const REVENUE_STATUSES: FulfillmentStatus[] = ['CONFIRMED', 'PROCESSING', 'DELIVERING', 'DELIVERED']

const STATUS_LABEL: Record<FulfillmentStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang xử lý',
  DELIVERING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
}

const STATUS_COLOR: Record<FulfillmentStatus, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#2563eb',
  PROCESSING: '#7c3aed',
  DELIVERING: '#0891b2',
  DELIVERED: '#16a34a',
  CANCELLED: '#dc2626',
}

function toNumber(value: Money | undefined): number {
  return Number(value ?? 0)
}

function money(value: Money | undefined) {
  return toNumber(value).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
}

function numberFormat(value: number) {
  return value.toLocaleString('vi-VN')
}

function formatDate(value?: string) {
  return value ? dayjs(value).format('DD/MM/YYYY HH:mm') : ''
}

function isRevenueOrder(order: AdminOrder) {
  return REVENUE_STATUSES.includes(order.fulfillmentStatus)
}

function orderAmount(order: AdminOrder) {
  return toNumber(order.finalAmount ?? order.totalAmount)
}

function orderDate(order: AdminOrder) {
  return dayjs(order.createdAt ?? order.updatedAt)
}

function isWithin(value: string | undefined, start: Dayjs, end: Dayjs) {
  if (!value) return false
  const date = dayjs(value)
  return date.isSame(start) || date.isSame(end) || (date.isAfter(start) && date.isBefore(end))
}

function isOrderWithin(order: AdminOrder, start: Dayjs, end: Dayjs) {
  const date = orderDate(order)
  return date.isValid() && (date.isSame(start) || date.isSame(end) || (date.isAfter(start) && date.isBefore(end)))
}

function getRange(preset: RangePreset, customRange: [Dayjs, Dayjs] | null): [Dayjs, Dayjs] {
  const now = dayjs()
  if (preset === 'custom' && customRange) {
    return [customRange[0].startOf('day'), customRange[1].endOf('day')]
  }
  if (preset === 'today') return [now.startOf('day'), now.endOf('day')]
  if (preset === '7d') return [now.subtract(6, 'day').startOf('day'), now.endOf('day')]
  if (preset === 'year') return [now.startOf('year'), now.endOf('day')]
  return [now.subtract(29, 'day').startOf('day'), now.endOf('day')]
}

function getPreviousRange(start: Dayjs, end: Dayjs): [Dayjs, Dayjs] {
  const durationMs = end.diff(start) + 1
  const previousEnd = start.subtract(1, 'millisecond')
  return [previousEnd.subtract(durationMs - 1, 'millisecond'), previousEnd]
}

function getBucketKey(date: Dayjs, granularity: Granularity) {
  if (granularity === 'week') return date.startOf('week').format('YYYY-[W]WW')
  if (granularity === 'month') return date.format('YYYY-MM')
  if (granularity === 'quarter') {
    const quarter = Math.floor(date.month() / 3) + 1
    return `${date.year()}-Q${quarter}`
  }
  return date.format('YYYY-MM-DD')
}

function getBucketLabel(date: Dayjs, granularity: Granularity) {
  if (granularity === 'week') return `Tuần ${date.format('WW/YYYY')}`
  if (granularity === 'month') return date.format('MM/YYYY')
  if (granularity === 'quarter') return `Q${Math.floor(date.month() / 3) + 1}/${date.year()}`
  return date.format('DD/MM')
}

function nextBucket(date: Dayjs, granularity: Granularity) {
  if (granularity === 'week') return date.add(1, 'week')
  if (granularity === 'month') return date.add(1, 'month')
  if (granularity === 'quarter') return date.add(3, 'month')
  return date.add(1, 'day')
}

function buildRevenueSeries(
  orders: AdminOrder[],
  start: Dayjs,
  end: Dayjs,
  previousStart: Dayjs,
  granularity: Granularity
): RevenuePoint[] {
  const points = new Map<string, RevenuePoint>()
  for (let cursor = start; cursor.isBefore(end) || cursor.isSame(end, 'day'); cursor = nextBucket(cursor, granularity)) {
    points.set(getBucketKey(cursor, granularity), {
      label: getBucketLabel(cursor, granularity),
      revenue: 0,
      previousRevenue: 0,
    })
  }

  orders.filter(isRevenueOrder).forEach((order) => {
    const currentDate = orderDate(order)
    if (isOrderWithin(order, start, end)) {
      const currentKey = getBucketKey(currentDate, granularity)
      const point = points.get(currentKey)
      if (point) point.revenue += orderAmount(order)
      return
    }

    const offsetMs = currentDate.diff(previousStart)
    if (offsetMs >= 0) {
      const mirroredDate = start.add(offsetMs, 'millisecond')
      if (mirroredDate.isBefore(end) || mirroredDate.isSame(end)) {
        const previousKey = getBucketKey(mirroredDate, granularity)
        const point = points.get(previousKey)
        if (point) point.previousRevenue += orderAmount(order)
      }
    }
  })

  return [...points.values()]
}

function trend(current: number, previous: number): Trend {
  if (previous === 0) {
    return {
      value: current - previous,
      percent: current > 0 ? 100 : 0,
      direction: current > 0 ? 'up' : 'flat',
    }
  }
  const difference = current - previous
  return {
    value: difference,
    percent: Math.abs((difference / previous) * 100),
    direction: difference > 0 ? 'up' : difference < 0 ? 'down' : 'flat',
  }
}

function KpiCard({ title, value, icon, loading, trend: cardTrend, tone = 'blue' }: KpiCardProps) {
  return (
    <Card className={`admin-kpi-card admin-kpi-${tone}`} loading={loading}>
      <div className="admin-kpi-content">
        <span className="admin-kpi-icon">{icon}</span>
        <div>
          <Typography.Text type="secondary">{title}</Typography.Text>
          <Typography.Title level={4}>{value}</Typography.Title>
          {cardTrend ? (
            <Tag color={cardTrend.direction === 'down' ? 'red' : cardTrend.direction === 'up' ? 'green' : 'default'}>
              {cardTrend.direction === 'up' ? '+' : cardTrend.direction === 'down' ? '-' : ''}
              {cardTrend.percent === null ? '0' : cardTrend.percent.toFixed(1)}% so voi ky truoc
            </Tag>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

export default function AdminHomePage() {
  const [rangePreset, setRangePreset] = useState<RangePreset>('30d')
  const [granularity, setGranularity] = useState<Granularity>('day')
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null)

  const metricsQuery = useApiQuery(['admin', 'dashboard'], () => adminApi.getDashboard())
  const ordersQuery = useApiQuery(['admin', 'orders', 'dashboard'], () => adminApi.getOrders())
  const booksQuery = useApiQuery(['admin', 'books', 'dashboard'], () => adminApi.getBooks())
  const inventoryQuery = useApiQuery(['admin', 'inventory', 'dashboard'], () => adminApi.getInventory())
  const usersQuery = useApiQuery(['admin', 'users', 'dashboard'], () => adminApi.getUsers())
  const reviewsQuery = useApiQuery(['admin', 'reviews', 'dashboard'], () => adminApi.getReviews())
  const categoriesQuery = useApiQuery(['admin', 'categories', 'dashboard'], () => adminApi.getCategories())

  const [start, end] = getRange(rangePreset, customRange)
  const [previousStart, previousEnd] = getPreviousRange(start, end)

  const orders = ordersQuery.data ?? []
  const books = booksQuery.data ?? []
  const inventory = inventoryQuery.data ?? []
  const users = usersQuery.data ?? []
  const reviews = reviewsQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const isLoading =
    metricsQuery.isLoading ||
    ordersQuery.isLoading ||
    booksQuery.isLoading ||
    inventoryQuery.isLoading ||
    usersQuery.isLoading ||
    reviewsQuery.isLoading ||
    categoriesQuery.isLoading
  const hasError =
    metricsQuery.isError ||
    ordersQuery.isError ||
    booksQuery.isError ||
    inventoryQuery.isError ||
    usersQuery.isError ||
    reviewsQuery.isError ||
    categoriesQuery.isError

  const bookById = new Map<number, AdminBook>(books.map((book) => [book.id, book]))
  const stockByBookId = new Map<number, InventoryStock>(inventory.map((stock) => [stock.bookId, stock]))
  const categoryById = new Map<number, Category>(categories.map((category) => [category.id, category]))

  const currentOrders = orders.filter((order) => isOrderWithin(order, start, end))
  const previousOrders = orders.filter((order) => isOrderWithin(order, previousStart, previousEnd))
  const revenueOrders = currentOrders.filter(isRevenueOrder)
  const previousRevenueOrders = previousOrders.filter(isRevenueOrder)

  const currentRevenue = revenueOrders.reduce((sum, order) => sum + orderAmount(order), 0)
  const previousRevenue = previousRevenueOrders.reduce((sum, order) => sum + orderAmount(order), 0)
  const soldBooks = revenueOrders.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  )
  const previousSoldBooks = previousRevenueOrders.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  )
  const customers = users.filter((user) => user.role === 'CUSTOMER')
  const newCustomers = customers.filter((user) => isWithin(user.createdAt, start, end))
  const previousNewCustomers = customers.filter((user) => isWithin(user.createdAt, previousStart, previousEnd))
  const pendingOrders = currentOrders.filter((order) => order.fulfillmentStatus === 'PENDING').length
  const previousPendingOrders = previousOrders.filter((order) => order.fulfillmentStatus === 'PENDING').length
  const cancelledOrders = currentOrders.filter((order) => order.fulfillmentStatus === 'CANCELLED').length
  const previousCancelledOrders = previousOrders.filter((order) => order.fulfillmentStatus === 'CANCELLED').length
  const lowStockBooks = books
    .map((book) => ({
      ...book,
      stock: stockByBookId.get(book.id)?.quantity ?? book.quantity ?? 0,
    }))
    .filter((book) => book.stock < LOW_STOCK_THRESHOLD)
    .sort((left, right) => left.stock - right.stock)
  const currentReviews = reviews.filter((review) => isWithin(review.createdAt, start, end))
  const previousReviews = reviews.filter((review) => isWithin(review.createdAt, previousStart, previousEnd))

  const revenueSeries = buildRevenueSeries(orders, start, end, previousStart, granularity)
  const statusSeries: StatusPoint[] = (Object.keys(STATUS_LABEL) as FulfillmentStatus[])
    .map((status) => ({
      name: STATUS_LABEL[status],
      value: currentOrders.filter((order) => order.fulfillmentStatus === status).length,
      color: STATUS_COLOR[status],
    }))
    .filter((item) => item.value > 0)

  const salesByBookRows = Array.from(
    revenueOrders
      .flatMap((order) => order.items)
      .reduce((map, item) => {
        const existing = map.get(item.bookId) ?? { quantitySold: 0, revenue: 0 }
        existing.quantitySold += item.quantity
        existing.revenue += toNumber(item.priceAtPurchase) * item.quantity
        map.set(item.bookId, existing)
        return map
      }, new Map<number, { quantitySold: number; revenue: number }>())
  )
    .map<TopBookRow>(([bookId, sales]) => {
      const book = bookById.get(bookId)
      return {
        bookId,
        title: book?.title ?? `Book #${bookId}`,
        author: book?.author,
        imageUrl: book?.imageUrl,
        quantitySold: sales.quantitySold,
        revenue: sales.revenue,
        stock: stockByBookId.get(bookId)?.quantity ?? book?.quantity ?? 0,
      }
    })
    .sort((left, right) => right.quantitySold - left.quantitySold)

  const topBooks = salesByBookRows.slice(0, 10)

  const categoryRows = Array.from(
    salesByBookRows.reduce((map, bookSales) => {
      const book = bookById.get(bookSales.bookId)
      const categoryIds = book?.categoryIds?.length ? book.categoryIds : [0]
      const revenueShare = bookSales.revenue / categoryIds.length
      const quantityShare = bookSales.quantitySold / categoryIds.length
      categoryIds.forEach((categoryId) => {
        const current = map.get(categoryId) ?? { quantitySold: 0, revenue: 0 }
        current.quantitySold += quantityShare
        current.revenue += revenueShare
        map.set(categoryId, current)
      })
      return map
    }, new Map<number, { quantitySold: number; revenue: number }>())
  )
    .map<CategoryRow>(([id, value]) => ({
      id,
      name: categoryById.get(id)?.name ?? 'Chưa phân loại',
      quantitySold: Math.round(value.quantitySold),
      revenue: value.revenue,
      percentage: currentRevenue > 0 ? (value.revenue / currentRevenue) * 100 : 0,
    }))
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, 8)

  const customerRows = customers
    .map<CustomerRow>((customer) => {
      const customerOrders = orders.filter((order) => order.userId === customer.id && isRevenueOrder(order))
      return {
        id: customer.id,
        fullName: customer.fullName,
        email: customer.email,
        createdAt: customer.createdAt,
        orderCount: customerOrders.length,
        totalSpent: customerOrders.reduce((sum, order) => sum + orderAmount(order), 0),
      }
    })
    .sort((left, right) => {
      const leftTime = left.createdAt ? dayjs(left.createdAt).valueOf() : left.id
      const rightTime = right.createdAt ? dayjs(right.createdAt).valueOf() : right.id
      return rightTime - leftTime
    })
    .slice(0, 8)

  const recentReviews = [...reviews]
    .sort((left, right) => dayjs(right.createdAt).valueOf() - dayjs(left.createdAt).valueOf())
    .slice(0, 6)
  const criticalReviews = reviews.filter((review) => review.rating <= 2).length
  const latestOrders = [...orders]
    .sort((left, right) => orderDate(right).valueOf() - orderDate(left).valueOf())
    .slice(0, 8)

  const topBookColumns: ColumnsType<TopBookRow> = [
    {
      title: 'Sách',
      dataIndex: 'title',
      render: (_, row) => (
        <Space>
          <Image width={42} height={56} src={row.imageUrl} fallback="" preview={false} className="admin-book-cover" />
          <div>
            <Typography.Text strong>{row.title}</Typography.Text>
            <br />
            <Typography.Text type="secondary">{row.author || 'SEBook'}</Typography.Text>
          </div>
        </Space>
      ),
    },
    { title: 'Đã bán', dataIndex: 'quantitySold', width: 92, render: numberFormat, sorter: (a, b) => compareNumber(a.quantitySold, b.quantitySold) },
    { title: 'Doanh thu', dataIndex: 'revenue', width: 150, render: money, sorter: (a, b) => compareNumber(a.revenue, b.revenue) },
    { title: 'Tồn kho', dataIndex: 'stock', width: 90, sorter: (a, b) => compareNumber(a.stock, b.stock) },
  ]

  const lowStockColumns: ColumnsType<AdminBook & { stock: number }> = [
    {
      title: 'Sách sắp hết',
      dataIndex: 'title',
      render: (_, row) => (
        <Space>
          <Image width={40} height={54} src={row.imageUrl} fallback="" preview={false} className="admin-book-cover" />
          <div>
            <Typography.Text strong>{row.title}</Typography.Text>
            <br />
            <Typography.Text type="secondary">{row.author || 'SEBook'}</Typography.Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Tồn',
      dataIndex: 'stock',
      width: 80,
      render: (value: number) => <Tag color={value <= 3 ? 'red' : 'orange'}>{value}</Tag>,
      sorter: (a, b) => compareNumber(a.stock, b.stock),
    },
    { title: 'Ngưỡng', width: 90, render: () => LOW_STOCK_THRESHOLD },
    {
      title: '',
      width: 110,
      render: () => (
        <Link to="/admin/inventory">
          <Button size="small">Quản lý</Button>
        </Link>
      ),
    },
  ]

  const orderColumns: ColumnsType<AdminOrder> = [
    { title: 'Đơn', dataIndex: 'orderId', width: 82, render: (id: number) => <Link to={`/admin/orders/${id}`}>#{id}</Link>, sorter: (a, b) => compareNumber(a.orderId, b.orderId) },
    { title: 'Khách hàng', dataIndex: 'customerName', render: (_, row) => row.customerName || row.customerEmail || `User #${row.userId}`, sorter: (a, b) => compareText(a.customerName || a.customerEmail, b.customerName || b.customerEmail) },
    { title: 'Trạng thái', dataIndex: 'fulfillmentStatus', width: 130, render: (status: FulfillmentStatus) => <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Tag>, sorter: (a, b) => compareText(STATUS_LABEL[a.fulfillmentStatus], STATUS_LABEL[b.fulfillmentStatus]) },
    { title: 'Tổng tiền', dataIndex: 'finalAmount', width: 140, render: money, sorter: (a, b) => compareNumber(a.finalAmount, b.finalAmount) },
    { title: 'Ngày tạo', dataIndex: 'createdAt', width: 150, render: formatDate, sorter: (a, b) => compareDate(a.createdAt, b.createdAt) },
  ]

  const customerColumns: ColumnsType<CustomerRow> = [
    { title: 'Khách hàng', dataIndex: 'fullName', sorter: (a, b) => compareText(a.fullName, b.fullName) },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Số đơn', dataIndex: 'orderCount', width: 90, sorter: (a, b) => compareNumber(a.orderCount, b.orderCount) },
    { title: 'Tổng chi', dataIndex: 'totalSpent', width: 140, render: money, sorter: (a, b) => compareNumber(a.totalSpent, b.totalSpent) },
    { title: 'Ngày đăng ký', dataIndex: 'createdAt', width: 150, render: formatDate, sorter: (a, b) => compareDate(a.createdAt, b.createdAt) },
  ]

  const reviewColumns: ColumnsType<AdminReview> = [
    { title: 'Sách', dataIndex: 'bookTitle', sorter: (a, b) => compareText(a.bookTitle, b.bookTitle) },
    { title: 'Khách hàng', dataIndex: 'reviewerName', render: (_, row) => row.reviewerName || row.reviewerEmail || `User #${row.userId}`, sorter: (a, b) => compareText(a.reviewerName || a.reviewerEmail, b.reviewerName || b.reviewerEmail) },
    { title: 'Sao', dataIndex: 'rating', width: 80, render: (rating: number) => <Tag color={rating <= 2 ? 'red' : 'gold'}>{rating} sao</Tag>, sorter: (a, b) => compareNumber(a.rating, b.rating) },
    { title: 'Ngày', dataIndex: 'createdAt', width: 150, render: formatDate, sorter: (a, b) => compareDate(a.createdAt, b.createdAt) },
  ]

  return (
    <Space direction="vertical" size="large" className="admin-dashboard">
      <div className="admin-dashboard-header">
        <div>
          <Typography.Title level={3}>Bảng điều khiển Admin</Typography.Title>
          <Typography.Text type="secondary">
            Theo dõi doanh thu, đơn hàng, tồn kho, khách hàng và đánh giá từ dữ liệu vận hành thực.
          </Typography.Text>
        </div>
        <Space wrap>
          <Select<RangePreset>
            value={rangePreset}
            onChange={setRangePreset}
            options={[
              { value: 'today', label: 'Hôm nay' },
              { value: '7d', label: '7 ngày' },
              { value: '30d', label: '30 ngày' },
              { value: 'year', label: 'Năm nay' },
              { value: 'custom', label: 'Tùy chọn' },
            ]}
            style={{ width: 128 }}
          />
          <DatePicker.RangePicker
            disabled={rangePreset !== 'custom'}
            format="DD/MM/YYYY"
            value={customRange}
            onChange={(value) =>
              setCustomRange(value && value[0] && value[1] ? [value[0], value[1]] : null)
            }
          />
          <Select<Granularity>
            value={granularity}
            onChange={setGranularity}
            options={[
              { value: 'day', label: 'Theo ngày' },
              { value: 'week', label: 'Theo tuần' },
              { value: 'month', label: 'Theo tháng' },
              { value: 'quarter', label: 'Theo quý' },
            ]}
            style={{ width: 130 }}
          />
        </Space>
      </div>

      {hasError ? (
        <Alert
          type="error"
          showIcon
          message="Không tải được đầy đủ dữ liệu dashboard"
          description="Vui lòng kiểm tra kết nối API hoặc quyền ADMIN của tài khoản hiện tại."
        />
      ) : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard title="Tổng số đơn hàng" value={numberFormat(currentOrders.length)} icon={<ShoppingCartOutlined />} loading={isLoading} trend={trend(currentOrders.length, previousOrders.length)} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard title="Tổng doanh thu" value={money(currentRevenue)} icon={<DollarOutlined />} loading={isLoading} trend={trend(currentRevenue, previousRevenue)} tone="green" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard title="Sách đã bán" value={numberFormat(soldBooks)} icon={<BookOutlined />} loading={isLoading} trend={trend(soldBooks, previousSoldBooks)} tone="violet" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard title="Khách hàng mới" value={numberFormat(newCustomers.length)} icon={<TeamOutlined />} loading={isLoading} trend={trend(newCustomers.length, previousNewCustomers.length)} tone="blue" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard title="Đơn chờ xử lý" value={numberFormat(pendingOrders)} icon={<ClockCircleOutlined />} loading={isLoading} trend={trend(pendingOrders, previousPendingOrders)} tone="amber" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard title="Đơn đã hủy" value={numberFormat(cancelledOrders)} icon={<CloseCircleOutlined />} loading={isLoading} trend={trend(cancelledOrders, previousCancelledOrders)} tone="red" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard title="Sách sắp hết hàng" value={numberFormat(lowStockBooks.length)} icon={<AlertOutlined />} loading={isLoading} tone="amber" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiCard title="Đánh giá mới" value={numberFormat(currentReviews.length)} icon={<StarOutlined />} loading={isLoading} trend={trend(currentReviews.length, previousReviews.length)} tone="slate" />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card title="Doanh thu theo thời gian" loading={isLoading}>
            {revenueSeries.some((point) => point.revenue > 0 || point.previousRevenue > 0) ? (
              <ResponsiveContainer width="100%" height={330}>
                <LineChart data={revenueSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" minTickGap={18} />
                  <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                  <Tooltip formatter={(value) => money(Number(value ?? 0))} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Kỳ hiện tại" stroke="#2563eb" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="previousRevenue" name="Kỳ trước" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Chưa có doanh thu trong khoảng thời gian này" />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="Tỷ lệ trạng thái đơn hàng" loading={isLoading}>
            {statusSeries.length ? (
              <ResponsiveContainer width="100%" height={330}>
                <PieChart>
                  <Pie data={statusSeries} dataKey="value" nameKey="name" innerRadius={72} outerRadius={112} paddingAngle={2}>
                    {statusSeries.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Chưa có đơn hàng" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="Top sách bán chạy" loading={isLoading}>
            <Table rowKey="bookId" columns={topBookColumns} dataSource={topBooks} pagination={false} locale={{ emptyText: <Empty description="Chưa có sách bán chạy" /> }} />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="Cảnh báo tồn kho thấp" loading={isLoading}>
            <Table rowKey="id" columns={lowStockColumns} dataSource={lowStockBooks.slice(0, 8)} pagination={false} locale={{ emptyText: <Empty description="Không có sách sắp hết hàng" /> }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Danh mục bán chạy" loading={isLoading}>
            {categoryRows.length ? (
              <Space direction="vertical" className="admin-category-list">
                {categoryRows.map((category) => (
                  <div key={category.id} className="admin-category-row">
                    <div>
                      <Typography.Text strong>{category.name}</Typography.Text>
                      <Typography.Text type="secondary">
                        {numberFormat(category.quantitySold)} cuốn - {money(category.revenue)}
                      </Typography.Text>
                    </div>
                    <Progress percent={Number(category.percentage.toFixed(1))} strokeColor="#2563eb" />
                  </div>
                ))}
              </Space>
            ) : (
              <Empty description="Chưa có dữ liệu danh mục" />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Đơn hàng mới nhất" loading={isLoading}>
            <Table rowKey="orderId" columns={orderColumns} dataSource={latestOrders} pagination={false} size="small" locale={{ emptyText: <Empty description="Chưa có đơn hàng" /> }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Khách hàng mới và nổi bật" loading={isLoading}>
            <Table rowKey="id" columns={customerColumns} dataSource={customerRows} pagination={false} size="small" locale={{ emptyText: <Empty description="Chưa có khách hàng" /> }} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card
            title="Đánh giá và phản hồi mới"
            extra={criticalReviews ? <Tag color="red">{criticalReviews} đánh giá 1-2 sao</Tag> : <Tag icon={<CheckCircleOutlined />} color="green">Ổn định</Tag>}
            loading={isLoading}
          >
            <Table rowKey="id" columns={reviewColumns} dataSource={recentReviews} pagination={false} size="small" locale={{ emptyText: <Empty description="Chưa có đánh giá" /> }} />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
