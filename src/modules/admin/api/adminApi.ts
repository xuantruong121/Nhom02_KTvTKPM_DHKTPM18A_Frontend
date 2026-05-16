import { http, httpV2, unwrapApi } from '@/shared/api/http'

export type Money = number | string

export type FulfillmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'CANCELLED'

export type DashboardMetrics = {
  totalOrders: number
  paidOrders: number
  conversionRate: number
  averageTimeToPaymentSeconds: number
  averageOrderValue: Money
  uniqueBuyers: number
  totalRevenue: Money
  netRevenue: Money
  refundAmount: Money
  topBooks: TopBook[]
}

export type TopBook = {
  bookId: number
  title: string
  quantitySold: number
  revenue: Money
}

export type OrderItem = {
  bookId: number
  title?: string
  quantity: number
  priceAtPurchase: Money
}

export type AdminOrder = {
  orderId: number
  userId: number
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  shippingAddress?: string
  totalAmount: Money
  discountAmount: Money
  finalAmount: Money
  fulfillmentStatus: FulfillmentStatus
  sagaStatus: string
  requestId: string
  createdAt?: string
  updatedAt?: string
  items: OrderItem[]
}

export type ReturnStatus = 'PENDING' | 'APPROVED' | 'RECEIVED' | 'REFUNDED' | 'REJECTED'
export type ItemCondition = 'GOOD' | 'DAMAGED' | 'MISSING_PARTS' | 'UNSELLABLE'

export type ReturnRequest = {
  id: string
  orderId: number
  customerId: number
  status: ReturnStatus
  refundAmount?: Money
  reason: string
  notes?: string
  createdAt?: string
  items: Array<{
    id: string
    bookId: number
    quantity: number
    refundPrice?: Money
    condition?: ItemCondition
  }>
}

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT'

export type Coupon = {
  id: number
  code: string
  description?: string
  discountType: DiscountType
  discountValue: Money
  minOrderValue?: Money
  maxDiscountValue?: Money
  usageLimit?: number
  usedCount: number
  startDate?: string
  endDate?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type CouponPayload = {
  code?: string
  description?: string
  discountType?: DiscountType
  discountValue: number
  minOrderValue?: number
  maxDiscountValue?: number
  usageLimit?: number
  startDate?: string
  endDate?: string
  isActive: boolean
}

export type Supplier = {
  id: number
  name: string
  contactPerson?: string
  phoneNumber?: string
  email?: string
  address?: string
  taxCode?: string
  createdAt?: string
  updatedAt?: string
}

export type SupplierPayload = Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>

export type PurchaseOrderStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'RETURNED' | 'RECEIVED' | 'CANCELLED'

export type PurchaseOrder = {
  id: number
  supplier?: Supplier
  status: PurchaseOrderStatus
  totalAmount: Money
  createdBy?: string
  approvedBy?: string
  receivedBy?: string
  createdAt?: string
  approvedAt?: string
  receivedAt?: string
  cancelReason?: string
  cancelledBy?: string
  cancelledAt?: string
  version?: number
  note?: string
  items: Array<{
    id: number
    bookId: number
    quantity: number
    priceAtOrder: Money
    currency?: string
    createdAt?: string
  }>
}

export type PurchaseOrderPayload = {
  supplierId: number
  note?: string
  items: Array<{
    bookId: number
    quantity: number
    price: number
  }>
}

export type InventoryStock = {
  id: number
  bookId: number
  quantity: number
  version: number
  createdAt?: string
  updatedAt?: string
}

export type OrderFilters = {
  status?: FulfillmentStatus
  customerKeyword?: string
}

export type AdminUser = {
  id: number
  email: string
  fullName: string
  role: 'ADMIN' | 'STAFF_SELLER' | 'STAFF_WAREHOUSE' | 'CUSTOMER' | 'GUEST'
  enabled: boolean
}

export type StaffRole = 'STAFF_SELLER' | 'STAFF_WAREHOUSE'

export type CreateStaffPayload = {
  email: string
  fullName: string
  password: string
  role: StaffRole
}

export type AuditLog = {
  id: number
  userId?: string
  role?: StaffRole
  action: string
  target?: string
  oldValue?: string
  newValue?: string
  createdAt: string
}

export type Category = {
  id: number
  name: string
  active?: boolean
  isActive?: boolean
}

export type AdminBook = {
  id: number
  title: string
  author: string
  description?: string
  price: Money
  originalPrice?: Money
  quantity: number
  imageUrl?: string
  publisher?: string
  isbn?: string
  publicationYear?: number
  language?: string
  pageCount?: number
  coverType?: string
  categoryIds?: number[]
  active?: boolean
  isActive?: boolean
}

export type BookPayload = {
  title?: string
  author?: string
  description?: string
  price?: number
  originalPrice?: number
  quantity?: number
  image?: File
  categoryIds?: number[]
  publisher?: string
  isbn?: string
  publicationYear?: number
  language?: string
  keywords?: string[]
  pageCount?: number
  coverType?: string
}

function toBookFormData(payload: BookPayload) {
  const form = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (key === 'categoryIds' || key === 'keywords') {
      ;(value as Array<number | string>).forEach((item) => form.append(key, String(item)))
      return
    }
    form.append(key, value instanceof File ? value : String(value))
  })
  return form
}

export const adminApi = {
  getDashboard() {
    return unwrapApi<DashboardMetrics>(httpV2.get('/admin/dashboard/metrics'))
  },
  getOrders(params?: OrderFilters) {
    return unwrapApi<AdminOrder[]>(httpV2.get('/admin/orders', { params }))
  },
  getOrder(id: number) {
    return unwrapApi<AdminOrder>(httpV2.get(`/admin/orders/${id}`))
  },
  updateOrderStatus(id: number, newStatus: FulfillmentStatus, reason?: string) {
    return unwrapApi<AdminOrder>(httpV2.put(`/admin/orders/${id}/status`, { newStatus, reason }))
  },
  processOrder(id: number) {
    return unwrapApi<AdminOrder>(httpV2.put(`/admin/orders/${id}/process`))
  },
  shipOrder(id: number) {
    return unwrapApi<AdminOrder>(httpV2.put(`/admin/orders/${id}/ship`))
  },
  completeOrder(id: number) {
    return unwrapApi<AdminOrder>(httpV2.put(`/admin/orders/${id}/complete`))
  },
  cancelOrder(id: number, reason?: string) {
    return unwrapApi<AdminOrder>(httpV2.put(`/admin/orders/${id}/cancel`, reason ? { reason } : undefined))
  },
  getReturns() {
    return unwrapApi<ReturnRequest[]>(http.get('/admin/returns'))
  },
  approveReturn(id: string) {
    return unwrapApi<void>(http.put(`/admin/returns/${id}/approve`))
  },
  receiveReturn(id: string, conditions: ItemCondition[]) {
    return unwrapApi<void>(http.put(`/admin/returns/${id}/receive`, conditions))
  },
  refundReturn(id: string) {
    return unwrapApi<void>(http.put(`/admin/returns/${id}/refund`))
  },
  rejectReturn(id: string, reason: string) {
    return unwrapApi<void>(http.put(`/admin/returns/${id}/reject`, undefined, { params: { reason } }))
  },
  getCoupons() {
    return unwrapApi<Coupon[]>(http.get('/admin/coupons'))
  },
  getCoupon(id: number) {
    return unwrapApi<Coupon>(http.get(`/admin/coupons/${id}`))
  },
  createCoupon(payload: CouponPayload) {
    return unwrapApi<Coupon>(http.post('/admin/coupons', payload))
  },
  updateCoupon(id: number, payload: CouponPayload) {
    return unwrapApi<Coupon>(http.put(`/admin/coupons/${id}`, payload))
  },
  deleteCoupon(id: number) {
    return unwrapApi<void>(http.delete(`/admin/coupons/${id}`))
  },
  getSuppliers() {
    return unwrapApi<Supplier[]>(http.get('/logistics/suppliers'))
  },
  createSupplier(payload: SupplierPayload) {
    return unwrapApi<Supplier>(http.post('/logistics/suppliers', payload))
  },
  deleteSupplier(id: number) {
    return unwrapApi<void>(http.delete(`/logistics/suppliers/${id}`))
  },
  getPurchaseOrders() {
    return unwrapApi<PurchaseOrder[]>(http.get('/logistics/purchase-orders'))
  },
  getPurchaseOrder(id: number) {
    return unwrapApi<PurchaseOrder>(http.get(`/logistics/purchase-orders/${id}`))
  },
  createPurchaseOrder(payload: PurchaseOrderPayload) {
    return unwrapApi<PurchaseOrder>(http.post('/logistics/purchase-orders', payload))
  },
  submitPurchaseOrder(id: number) {
    return unwrapApi<PurchaseOrder>(http.post(`/logistics/purchase-orders/${id}/submit`))
  },
  approvePurchaseOrder(id: number) {
    return unwrapApi<PurchaseOrder>(http.post(`/logistics/purchase-orders/${id}/approve`))
  },
  returnPurchaseOrder(id: number, reason: string) {
    return unwrapApi<PurchaseOrder>(
      http.post(`/logistics/purchase-orders/${id}/return`, undefined, { params: { reason } })
    )
  },
  receivePurchaseOrder(id: number) {
    return unwrapApi<PurchaseOrder>(http.post(`/logistics/purchase-orders/${id}/receive`))
  },
  cancelPurchaseOrder(id: number, reason: string) {
    return unwrapApi<PurchaseOrder>(
      http.post(`/logistics/purchase-orders/${id}/cancel`, undefined, { params: { reason } })
    )
  },
  confirmStockAdjustment(payload: { bookId: number; adjustmentQuantity: number; reason: string }) {
    return unwrapApi<string>(http.post('/logistics/stock-adjustments', payload))
  },
  getInventory() {
    return unwrapApi<InventoryStock[]>(http.get('/admin/inventory'))
  },
  getInventoryItem(bookId: number) {
    return unwrapApi<InventoryStock>(http.get(`/admin/inventory/${bookId}`))
  },
  getUsers() {
    return unwrapApi<AdminUser[]>(http.get('/admin/users'))
  },
  createStaff(payload: CreateStaffPayload) {
    return unwrapApi<AdminUser>(http.post('/admin/users/staff', payload))
  },
  lockUser(id: number) {
    return unwrapApi<AdminUser>(http.put(`/admin/users/${id}/lock`))
  },
  getAuditLogs() {
    return unwrapApi<AuditLog[]>(http.get('/admin/audit-logs'))
  },
  increaseStock(bookId: number, amount: number) {
    return unwrapApi<InventoryStock>(http.put(`/admin/inventory/${bookId}/increase`, { amount }))
  },
  decreaseStock(bookId: number, amount: number) {
    return unwrapApi<InventoryStock>(http.put(`/admin/inventory/${bookId}/decrease`, { amount }))
  },
  getBooks() {
    return unwrapApi<AdminBook[]>(http.get('/catalog/books'))
  },
  getCategories() {
    return unwrapApi<Category[]>(http.get('/catalog/categories'))
  },
  createBook(payload: BookPayload) {
    return unwrapApi<AdminBook>(
      http.post('/catalog/books', toBookFormData(payload), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    )
  },
  updateBook(id: number, payload: BookPayload) {
    return unwrapApi<AdminBook>(
      http.patch(`/catalog/books/${id}`, toBookFormData(payload), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    )
  },
  deleteBook(id: number) {
    return unwrapApi<void>(http.delete(`/catalog/books/${id}`))
  },
}
