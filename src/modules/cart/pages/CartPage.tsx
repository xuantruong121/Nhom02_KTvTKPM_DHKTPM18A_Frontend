import {
  ClearOutlined,
  DeleteOutlined,
  MinusOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Checkbox,
  Empty,
  Flex,
  Image,
  InputNumber,
  Popconfirm,
  Skeleton,
  Space,
  Typography,
} from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { cartApi, type Cart, type CartItem } from '@/modules/cart/api/cartApi'
import { catalogApi } from '@/modules/catalog/api/catalogApi'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'
import './CartPage.css'

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

function getLineTotal(price: number | string, quantity: number) {
  return toNumber(price) * quantity
}

export function CartPage() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  const cartQuery = useApiQuery(['cart'], () => cartApi.getCart())
  const booksQuery = useApiQuery(['catalog', 'books', 'cart'], () => catalogApi.getBooks())

  const removeMutation = useApiMutation<string, unknown, number>(
    (bookId) => cartApi.removeItem(bookId),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['cart'] })
        void message.success('Đã xóa sách khỏi giỏ hàng')
      },
    }
  )
  const clearMutation = useApiMutation(() => cartApi.clearCart(), {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      void message.success('Đã xóa toàn bộ giỏ hàng')
    },
  })

  const updateQuantityMutation = useApiMutation<
    string,
    unknown,
    { bookId: number; quantity: number },
    { previousCart?: Cart }
  >((payload) => cartApi.updateItem(payload), {
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] })

      const previousCart = queryClient.getQueryData<Cart>(['cart'])

      queryClient.setQueryData<Cart>(['cart'], (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((item) =>
            item.bookId === payload.bookId ? { ...item, quantity: payload.quantity } : item
          ),
        }
      })

      return { previousCart }
    },
    onError: (_err, _payload, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart)
      }
      void message.error('Có lỗi xảy ra khi cập nhật số lượng')
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  const items = useMemo(() => cartQuery.data?.items ?? [], [cartQuery.data?.items])
  const booksById = useMemo(
    () => new Map((booksQuery.data ?? []).map((book) => [book.id, book])),
    [booksQuery.data]
  )

  /* ── Bulk selection state ──────────────────────────────── */
  const [selectedKeys, setSelectedKeys] = useState<Set<number>>(new Set())
  const hasInitializedSelection = useRef(false)

  useEffect(() => {
    setSelectedKeys((prev) => {
      if (items.length === 0) {
        hasInitializedSelection.current = false
        return new Set()
      }

      if (!hasInitializedSelection.current) {
        hasInitializedSelection.current = true
        return new Set(items.map((item) => item.bookId))
      }

      const itemKeys = new Set(items.map((item) => item.bookId))
      return new Set([...prev].filter((bookId) => itemKeys.has(bookId)))
    })
  }, [items])

  const allSelected = items.length > 0 && items.every((item) => selectedKeys.has(item.bookId))
  const someSelected = items.some((item) => selectedKeys.has(item.bookId)) && !allSelected

  const toggleAll = () => {
    if (allSelected) {
      setSelectedKeys(new Set())
    } else {
      setSelectedKeys(new Set(items.map((i) => i.bookId)))
    }
  }

  const toggleItem = (bookId: number) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(bookId)) next.delete(bookId)
      else next.add(bookId)
      return next
    })
  }

  /* ── Local quantity display + debounced API ─────────────── */
  const [localQuantities, setLocalQuantities] = useState<Record<number, number>>({})
  const debounceTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  // Sync local display with server: keep only overrides still differs from server
  useEffect(() => {
    if (items.length === 0) return
    setLocalQuantities((prev) => {
      const next: Record<number, number> = {}
      for (const item of items) {
        const pending = prev[item.bookId]
        if (pending !== undefined && pending !== item.quantity) {
          next[item.bookId] = pending
        }
      }
      return next
    })
  }, [items])

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = debounceTimers.current
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  const getDisplayQty = useCallback(
    (item: CartItem) => localQuantities[item.bookId] ?? item.quantity,
    [localQuantities]
  )

  /* ── Quantity handler with debounce ──────────────────── */
  const updateQuantity = (item: CartItem, quantity: number) => {
    const stock = Math.max(1, booksById.get(item.bookId)?.quantity ?? item.quantity)
    const clamped = Math.max(1, Math.min(quantity, stock))

    // Update local display immediately
    if (clamped === item.quantity) {
      setLocalQuantities((prev) => {
        const next = { ...prev }
        delete next[item.bookId]
        return next
      })
    } else {
      setLocalQuantities((prev) => ({ ...prev, [item.bookId]: clamped }))
    }

    // Clear previous timer for this book
    const existing = debounceTimers.current.get(item.bookId)
    if (existing) clearTimeout(existing)

    // If reverted to server value, no need to call API
    if (clamped === item.quantity) {
      debounceTimers.current.delete(item.bookId)
      return
    }

    // Set new debounce timer (500ms)
    const timer = setTimeout(() => {
      debounceTimers.current.delete(item.bookId)
      updateQuantityMutation.mutate({ bookId: item.bookId, quantity: clamped })
    }, 500)
    debounceTimers.current.set(item.bookId, timer)
  }

  /* ── Bulk delete selected ──────────────────────────────── */
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const bulkDeleteSelected = async () => {
    if (selectedKeys.size === 0) return
    const count = selectedKeys.size
    setIsBulkDeleting(true)
    try {
      await Promise.all([...selectedKeys].map((bookId) => cartApi.removeItem(bookId)))
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      setSelectedKeys(new Set())
      void message.success(`Đã xóa ${count} sản phẩm khỏi giỏ hàng`)
    } catch {
      void message.error('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  /* ── Derived data ──────────────────────────────────────── */
  const cartSubtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const qty = localQuantities[item.bookId] ?? item.quantity
        return sum + getLineTotal(item.price, qty)
      }, 0),
    [items, localQuantities]
  )

  const selectedItems = useMemo(
    () => items.filter((item) => selectedKeys.has(item.bookId)),
    [items, selectedKeys]
  )

  const selectedSubtotal = useMemo(
    () =>
      selectedItems.reduce((sum, item) => {
        const qty = localQuantities[item.bookId] ?? item.quantity
        return sum + getLineTotal(item.price, qty)
      }, 0),
    [localQuantities, selectedItems]
  )

  const selectedQuantity = useMemo(
    () =>
      selectedItems.reduce(
        (total, item) => total + (localQuantities[item.bookId] ?? item.quantity),
        0
      ),
    [localQuantities, selectedItems]
  )

  const totalQuantity = useMemo(
    () => items.reduce((total, item) => total + (localQuantities[item.bookId] ?? item.quantity), 0),
    [items, localQuantities]
  )

  const loading = cartQuery.isLoading || booksQuery.isLoading

  return (
    <main className="cart-page">
      <section className="cart-shell">
        <Flex align="center" justify="space-between" className="cart-header">
          <Space>
            <ShoppingCartOutlined />
            <div>
              <Typography.Title level={1}>Giỏ hàng</Typography.Title>
              <Typography.Text type="secondary">
                Kiểm tra sách đã chọn trước khi chuyển sang thanh toán.
              </Typography.Text>
            </div>
          </Space>
          <Link to="/books">Tiếp tục mua sách</Link>
        </Flex>

        {loading ? (
          <Card className="se-card cart-card">
            <Skeleton active paragraph={{ rows: 5 }} />
          </Card>
        ) : items.length === 0 ? (
          <Card className="se-card cart-empty-card">
            <Empty description="Giỏ hàng của bạn đang trống." image={Empty.PRESENTED_IMAGE_SIMPLE}>
              <Button type="primary" href="/books">
                Chọn sách ngay
              </Button>
            </Empty>
          </Card>
        ) : (
          <div className="cart-grid">
            <Card className="se-card cart-card">
              {/* ── Card header ────────────────────────────── */}
              <Flex align="center" justify="space-between" className="cart-card-title">
                <Flex align="center" gap={12}>
                  <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll}>
                    <strong>{totalQuantity} sản phẩm</strong>
                  </Checkbox>
                  <Typography.Text type="secondary">
                    Đã chọn {selectedQuantity} / {totalQuantity}
                  </Typography.Text>
                  {selectedKeys.size > 0 && (
                    <Popconfirm
                      title={`Xóa ${selectedKeys.size} sản phẩm đã chọn?`}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                      onConfirm={bulkDeleteSelected}
                    >
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        loading={isBulkDeleting}
                      >
                        Xóa ({selectedKeys.size})
                      </Button>
                    </Popconfirm>
                  )}
                </Flex>

                <Flex align="center" gap={8}>
                  <Popconfirm
                    title="Xóa toàn bộ giỏ hàng?"
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => clearMutation.mutate()}
                  >
                    <Button
                      type="link"
                      danger
                      icon={<ClearOutlined />}
                      loading={clearMutation.isPending}
                    >
                      Xóa giỏ hàng
                    </Button>
                  </Popconfirm>
                </Flex>
              </Flex>

              {/* ── Cart items ────────────────────────────── */}
              <div className="cart-items">
                {items.map((item) => {
                  const book = booksById.get(item.bookId)
                  const stock = book?.quantity ?? 0
                  const currentQty = getDisplayQty(item)
                  const isUpdating = updateQuantityMutation.isPending

                  return (
                    <article
                      className={`cart-item${selectedKeys.has(item.bookId) ? ' cart-item--selected' : ''}`}
                      key={item.bookId}
                    >
                      {/* Checkbox */}
                      <div className="cart-item-check">
                        <Checkbox
                          checked={selectedKeys.has(item.bookId)}
                          onChange={() => toggleItem(item.bookId)}
                        />
                      </div>

                      {/* Cover image */}
                      <Link to={`/books/${item.bookId}`} className="cart-item-cover">
                        {book?.imageUrl ? (
                          <Image src={book.imageUrl} alt={item.title} preview={false} />
                        ) : (
                          <ShoppingCartOutlined />
                        )}
                      </Link>

                      {/* Info */}
                      <div className="cart-item-info">
                        <Link to={`/books/${item.bookId}`} className="cart-item-title">
                          {item.title}
                        </Link>
                        <Typography.Text type="secondary">
                          {book?.author || book?.publisher || 'SEBook'}
                        </Typography.Text>
                        <Typography.Text className="cart-item-stock">
                          Còn lại: <strong>{stock}</strong> bản
                        </Typography.Text>
                        <Typography.Text className="cart-item-mobile-price">
                          {formatPrice(item.price)}
                        </Typography.Text>
                      </div>

                      {/* Unit price */}
                      <div className="cart-item-price">{formatPrice(item.price)}</div>

                      {/* Quantity controls */}
                      <Flex align="center" className="cart-quantity">
                        <Button
                          icon={<MinusOutlined />}
                          disabled={currentQty <= 1 || isUpdating}
                          onClick={() => updateQuantity(item, currentQty - 1)}
                        />
                        <InputNumber
                          min={1}
                          max={stock || 1}
                          value={currentQty}
                          controls={false}
                          className="cart-quantity-input"
                          disabled={isUpdating}
                          onChange={(value) => updateQuantity(item, Number(value ?? 1))}
                        />
                        <Button
                          icon={<PlusOutlined />}
                          disabled={currentQty >= (stock || 1) || isUpdating}
                          onClick={() => updateQuantity(item, currentQty + 1)}
                        />
                      </Flex>

                      {/* Line total */}
                      <div className="cart-item-total">
                        {formatPrice(getLineTotal(item.price, currentQty))}
                      </div>

                      {/* Remove button */}
                      <Popconfirm
                        title="Xóa sách này khỏi giỏ hàng?"
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => removeMutation.mutate(item.bookId)}
                      >
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          loading={removeMutation.isPending}
                          aria-label="Xóa sách"
                        />
                      </Popconfirm>
                    </article>
                  )
                })}
              </div>
            </Card>

            {/* ── Order summary ────────────────────────────── */}
            <Card className="se-card cart-summary-card">
              <Typography.Title level={3}>Tóm tắt đơn hàng</Typography.Title>
              <Typography.Text type="secondary" className="cart-selected-note">
                {selectedItems.length > 0
                  ? `${selectedItems.length} sản phẩm được chọn`
                  : 'Chọn sản phẩm để thanh toán'}
              </Typography.Text>
              <div className="cart-summary-row">
                <span>Tạm tính</span>
                <strong>{formatPrice(selectedSubtotal)}</strong>
              </div>
              <div className="cart-summary-row">
                <span>Phí vận chuyển</span>
                <Typography.Text type="secondary">Tính khi thanh toán</Typography.Text>
              </div>
              <div className="cart-summary-divider" />
              <div className="cart-summary-total">
                <span>Tổng cộng</span>
                <strong>{formatPrice(selectedSubtotal)}</strong>
              </div>

              <Button block type="primary" size="large" disabled={selectedItems.length === 0}>
                Thanh toán
              </Button>
              <Typography.Paragraph type="secondary" className="cart-checkout-note">
                Tổng giỏ hàng: {formatPrice(cartSubtotal)}
              </Typography.Paragraph>
            </Card>
          </div>
        )}
      </section>
    </main>
  )
}
