import { ClearOutlined, CloseOutlined, MessageOutlined, RobotOutlined, SendOutlined } from '@ant-design/icons'
import { Alert, Button, Flex, Input, Space, Spin, Tag, Typography } from 'antd'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState, type PointerEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { aiApi, type AgentAction, type AgentBookResult, type AgentCard, type AgentClientAction, type AgentResponse } from '@/modules/ai/api/aiApi'
import { accountApi, type AddressDto } from '@/modules/account/api/accountApi'
import type { Cart } from '@/modules/cart/api/cartApi'
import { getOrderStatusMeta } from '@/modules/order/utils/orderFormat'
import { getErrorMessage } from '@/shared/api/http'
import './AiChatWidget.css'

type ChatItem = {
  role: 'user' | 'assistant'
  content: string
  agent?: AgentResponse
}

const SESSION_STORAGE_KEY = 'sebook_ai_session_id'
const PRODUCT_LINK_PATTERN = /(\/books\/\d+)/g
const AI_RESPONSE_TIMEOUT_MS = 15_000
const DEFAULT_CHAT_SIZE = { width: 390, height: 620 }
const MIN_CHAT_SIZE = { width: 320, height: 420 }
const AI_CLARIFY_MESSAGE =
  'Hệ thống chưa hiểu rõ yêu cầu của bạn, hãy làm rõ nó. Ví dụ: theo tên sách, tên tác giả, thể loại mà bạn muốn.'

function getSessionId() {
  try {
    const existing = localStorage.getItem(SESSION_STORAGE_KEY)
    if (existing) return existing
    const created =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`
    localStorage.setItem(SESSION_STORAGE_KEY, created)
    return created
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
}

function renderMessageContent(content: string) {
  return content.split(PRODUCT_LINK_PATTERN).map((part, index) => {
    if (/^\/books\/\d+$/.test(part)) {
      return (
        <Link className="ai-product-link" to={part} key={`${part}-${index}`}>
          Xem sản phẩm
        </Link>
      )
    }
    return part
  })
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export default function AiChatWidget() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const sessionIdRef = useRef(getSessionId())
  const chatboxRef = useRef<HTMLElement | null>(null)
  const [chatMessage, setChatMessage] = useState('')
  const [chatItems, setChatItems] = useState<ChatItem[]>([
    {
      role: 'assistant',
      content: 'Xin chào, mình có thể gợi ý sách hoặc trả lời câu hỏi về nhà sách SEBook.',
    },
  ])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatSize, setChatSize] = useState(DEFAULT_CHAT_SIZE)

  const chatCanSend = chatMessage.trim().length > 0 && !chatLoading

  async function sendChat(contentOverride?: string) {
    const content = (contentOverride ?? chatMessage).trim()
    if (!content) return

    if (!contentOverride) {
      setChatMessage('')
    }
    setChatError(null)
    setChatItems((current) => [...current, { role: 'user', content }])
    setChatLoading(true)

    const abortController = new AbortController()
    let timedOut = false
    const timeoutId = window.setTimeout(() => {
      timedOut = true
      abortController.abort()
    }, AI_RESPONSE_TIMEOUT_MS)

    try {
      const answer = await aiApi.agentMessage(sessionIdRef.current, content)
      setChatItems((current) => [...current, { role: 'assistant', content: answer.message, agent: answer }])
      syncAgentCart(answer)
      if (answer.cart || answer.order) {
        await invalidateAgentCaches()
      }
    } catch (error) {
      if (timedOut) {
        setChatItems((current) => [...current, { role: 'assistant', content: AI_CLARIFY_MESSAGE }])
      } else {
        setChatError(getErrorMessage(error))
      }
    } finally {
      window.clearTimeout(timeoutId)
      setChatLoading(false)
    }
  }

  async function sendClientAction(clientAction: AgentClientAction, content = clientAction.message || clientAction.action) {
    setChatError(null)
    setChatLoading(true)
    try {
      const answer = await aiApi.agentMessage(sessionIdRef.current, content || '', clientAction)
      setChatItems((current) => [...current, { role: 'assistant', content: answer.message, agent: answer }])
      syncAgentCart(answer)
      if (answer.cart || answer.order) {
        await invalidateAgentCaches()
      }
    } catch (error) {
      setChatError(getErrorMessage(error))
    } finally {
      setChatLoading(false)
    }
  }

  async function confirmAction(pendingActionId: string) {
    setChatError(null)
    setChatLoading(true)
    try {
      const answer = await aiApi.confirmAgentAction(pendingActionId)
      setChatItems((current) => [...current, { role: 'assistant', content: answer.message, agent: answer }])
      syncAgentCart(answer)
      await invalidateAgentCaches()
    } catch (error) {
      setChatError(getErrorMessage(error))
    } finally {
      setChatLoading(false)
    }
  }

  async function cancelAction(pendingActionId: string) {
    setChatError(null)
    setChatLoading(true)
    try {
      const answer = await aiApi.cancelAgentAction(pendingActionId)
      setChatItems((current) => [...current, { role: 'assistant', content: answer.message, agent: answer }])
    } catch (error) {
      setChatError(getErrorMessage(error))
    } finally {
      setChatLoading(false)
    }
  }

  async function invalidateAgentCaches() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['cart'] }),
      queryClient.invalidateQueries({ queryKey: ['orders'] }),
      queryClient.invalidateQueries({ queryKey: ['orders', 'my'] }),
      queryClient.invalidateQueries({ queryKey: ['catalog', 'books'] }),
      queryClient.invalidateQueries({ queryKey: ['home'] }),
    ])
  }

  function syncAgentCart(answer: AgentResponse) {
    if (!answer.cart) return
    queryClient.setQueryData<Cart>(['cart'], (current) => ({
      userId: current?.userId ?? 0,
      totalAmount: answer.cart?.totalAmount ?? 0,
      items: (answer.cart?.items ?? []).map((item) => ({
        bookId: item.bookId,
        title: item.title,
        price: item.price ?? 0,
        quantity: item.quantity,
      })),
    }))
  }

  async function clearChat() {
    try {
      await aiApi.clearChat(sessionIdRef.current)
      localStorage.removeItem(SESSION_STORAGE_KEY)
      sessionIdRef.current = getSessionId()
      setChatItems([
        {
          role: 'assistant',
          content: 'Lịch sử hội thoại đã được làm mới.',
        },
      ])
      setChatError(null)
    } catch (error) {
      setChatError(getErrorMessage(error))
    }
  }

  function startResize(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    const rect = chatboxRef.current?.getBoundingClientRect()
    if (!rect) return

    const startX = event.clientX
    const startY = event.clientY
    const startWidth = rect.width
    const startHeight = rect.height

    function handlePointerMove(moveEvent: globalThis.PointerEvent) {
      const maxWidth = Math.max(MIN_CHAT_SIZE.width, window.innerWidth - 32)
      const maxHeight = Math.max(MIN_CHAT_SIZE.height, window.innerHeight - 48)
      setChatSize({
        width: clamp(startWidth + startX - moveEvent.clientX, MIN_CHAT_SIZE.width, maxWidth),
        height: clamp(startHeight + startY - moveEvent.clientY, MIN_CHAT_SIZE.height, maxHeight),
      })
    }

    function stopResize() {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopResize)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopResize)
  }

  if (!chatOpen) {
    return (
      <Button
        className="ai-chatbox-toggle"
        type="primary"
        shape="circle"
        size="large"
        icon={<MessageOutlined />}
        onClick={() => setChatOpen(true)}
        aria-label="Mở chatbox SEBook Assistant"
      />
    )
  }

  return (
    <section
      ref={chatboxRef}
      className="ai-chatbox"
      style={{ width: chatSize.width, height: chatSize.height }}
      aria-label="SEBook Assistant chatbox"
    >
      <div className="ai-chatbox-resize-handle" onPointerDown={startResize} aria-label="Kéo để đổi kích thước" />
      <div className="ai-chatbox-header">
        <Space>
          <RobotOutlined />
          <span>SEBook Assistant</span>
        </Space>
        <Space size={4}>
          <Button size="small" type="text" icon={<ClearOutlined />} onClick={() => void clearChat()} />
          <Button size="small" type="text" icon={<CloseOutlined />} onClick={() => setChatOpen(false)} />
        </Space>
      </div>

      <div className="ai-chat-list">
        {chatItems.map((item, index) => (
          <div className={`ai-message ai-message-${item.role}`} key={`${item.role}-${index}`}>
            {renderMessageContent(item.content)}
            {item.agent ? (
              <AgentPayload
                agent={item.agent}
                loading={chatLoading}
                onConfirm={(id) => void confirmAction(id)}
                onCancel={(id) => void cancelAction(id)}
                onNavigate={(path) => navigate(path)}
                onSendMessage={(message) => void sendChat(message)}
                onClientAction={(action) => void sendClientAction(action)}
              />
            ) : null}
          </div>
        ))}
        {chatLoading ? (
          <div className="ai-message ai-message-assistant">
            <Spin size="small" /> Đang suy nghĩ...
          </div>
        ) : null}
      </div>

      {chatError ? <Alert className="ai-chat-error" type="error" title={chatError} showIcon /> : null}

      <Flex gap={8} className="ai-chat-input">
        <Input.TextArea
          value={chatMessage}
          autoSize={{ minRows: 1, maxRows: 3 }}
          placeholder="Hỏi về sách, tác giả, thể loại..."
          onChange={(event) => setChatMessage(event.target.value)}
          onPressEnter={(event) => {
            if (!event.shiftKey) {
              event.preventDefault()
              void sendChat()
            }
          }}
        />
        <Button type="primary" icon={<SendOutlined />} disabled={!chatCanSend} onClick={() => void sendChat()} />
      </Flex>
    </section>
  )
}

function AgentPayload({
  agent,
  loading,
  onConfirm,
  onCancel,
  onNavigate,
  onSendMessage,
  onClientAction,
}: {
  agent: AgentResponse
  loading: boolean
  onConfirm: (pendingActionId: string) => void
  onCancel: (pendingActionId: string) => void
  onNavigate: (path: string) => void
  onSendMessage: (message: string) => void
  onClientAction: (action: AgentClientAction) => void
}) {
  const card = agent.confirmationCard
  const displayCards = (agent.cards ?? []).filter((item) => !(agent.order && item.type === 'ORDER_CARD'))
  const hasStructuredCards = displayCards.length > 0
  const visibleActions = card ? (agent.actions ?? []).filter((action) => !isPendingConfirmationAction(action)) : (agent.actions ?? [])
  const visibleSuggestions = card ? (agent.suggestions ?? []).filter((suggestion) => !isConfirmationSuggestion(suggestion)) : (agent.suggestions ?? [])
  const primaryBook = agent.books?.[0] ?? cardBookToLegacy(displayCards.find((item) => item.type === 'BOOK_CARD'))
  const shouldShowAddresses = isCheckoutAddressPrompt(agent)
  const profileQuery = useQuery({
    queryKey: ['account', 'profile'],
    queryFn: () => accountApi.getProfile(),
    enabled: shouldShowAddresses,
    retry: false,
  })
  const addresses = profileQuery.data?.addresses ?? []

  return (
    <div className="ai-agent-payload">
      {hasStructuredCards ? (
        <div className="ai-agent-list">
          {displayCards.map((item, index) => (
            <div className={item.type === 'BOOK_CARD' ? 'ai-agent-book' : 'ai-agent-card'} key={`${item.type}-${item.bookId ?? item.orderId ?? index}`}>
              {item.type === 'BOOK_CARD' ? (
                <Link className="ai-agent-book-cover" to={item.url || `/books/${item.bookId}`} aria-label={`Xem chi tiết ${item.title || 'sách'}`}>
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.title || 'Sách'} loading="lazy" /> : <span>{(item.title || 'S').slice(0, 1)}</span>}
                </Link>
              ) : null}
              <Typography.Text strong>{item.title}</Typography.Text>
              {item.subtitle ? <Typography.Text type="secondary">{item.subtitle}</Typography.Text> : null}
              {item.message ? <Typography.Text>{item.message}</Typography.Text> : null}
              <Space size={4} wrap>
                {typeof item.stock === 'number' ? <Tag color={item.stock > 0 ? 'green' : 'red'}>{item.stock > 0 ? `Còn ${item.stock}` : 'Hết hàng'}</Tag> : null}
                {item.price ? <Tag>{Number(item.price).toLocaleString('vi-VN')}đ</Tag> : null}
              </Space>
              {item.actions && item.actions.length > 0 ? (
                <Space size={[4, 4]} wrap>
                  {item.actions.map((action) => (
                    <Button
                      key={`${action.action}-${action.label}-${action.bookId ?? action.orderId ?? action.pendingActionId ?? ''}`}
                      size="small"
                      disabled={loading}
                      onClick={() => handleAgentAction(action, onConfirm, onCancel, onNavigate, onSendMessage, onClientAction)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Space>
              ) : item.url ? (
                <Link className="ai-agent-link" to={item.url}>
                  Xem chi tiết
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      ) : agent.books && agent.books.length > 0 ? (
        <div className="ai-agent-list">
          {agent.books.map((book) => (
            <div className="ai-agent-book" key={book.bookId}>
              <Link className="ai-agent-book-cover" to={`/books/${book.bookId}`} aria-label={`Xem chi tiết ${book.title}`}>
                {book.imageUrl ? <img src={book.imageUrl} alt={book.title} loading="lazy" /> : <span>{book.title.slice(0, 1)}</span>}
              </Link>
              <Typography.Text strong>{book.title}</Typography.Text>
              <Typography.Text type="secondary">{book.author || 'Chưa rõ tác giả'}</Typography.Text>
              <Space size={4} wrap>
                <Tag color={book.quantity > 0 ? 'green' : 'red'}>{book.quantity > 0 ? `Còn ${book.quantity}` : 'Hết hàng'}</Tag>
                {book.price ? <Tag>{Number(book.price).toLocaleString('vi-VN')}đ</Tag> : null}
              </Space>
              <Link className="ai-agent-link" to={`/books/${book.bookId}`}>
                Xem chi tiết sách
              </Link>
            </div>
          ))}
        </div>
      ) : null}

      {agent.pendingAction && !card ? (
        <div className="ai-agent-confirm">
          <Typography.Text strong>Xác nhận thao tác</Typography.Text>
          <Typography.Text>{formatPendingSummary(agent.pendingAction.summary)}</Typography.Text>
          <Space>
            <Button size="small" type="primary" loading={loading} onClick={() => onConfirm(agent.pendingAction!.pendingActionId)}>
              Xác nhận
            </Button>
            <Button size="small" disabled={loading} onClick={() => onCancel(agent.pendingAction!.pendingActionId)}>
              Hủy
            </Button>
          </Space>
        </div>
      ) : null}

      {agent.cart && !agent.order ? (
        <div className="ai-agent-card">
          <Typography.Text strong>Giỏ hàng</Typography.Text>
          {agent.cart.items.length === 0 ? (
            <Typography.Text type="secondary">Giỏ hàng đang trống</Typography.Text>
          ) : (
            agent.cart.items.map((item) => (
              <div className="ai-agent-row" key={item.bookId}>
                <span>{item.title}</span>
                <Tag>x{item.quantity}</Tag>
              </div>
            ))
          )}
          {agent.cart.totalAmount ? <Typography.Text>Tổng: {Number(agent.cart.totalAmount).toLocaleString('vi-VN')}đ</Typography.Text> : null}
        </div>
      ) : null}

      {agent.order ? (
        <div className="ai-agent-card">
          <Typography.Text strong>Đơn hàng #{agent.order.orderId}</Typography.Text>
          {agent.order.finalAmount ? <Typography.Text>Tổng thanh toán: {Number(agent.order.finalAmount).toLocaleString('vi-VN')}đ</Typography.Text> : null}
          {agent.order.fulfillmentStatus ? (
            <Tag color={getOrderStatusMeta(agent.order.fulfillmentStatus).color}>{getOrderStatusMeta(agent.order.fulfillmentStatus).label}</Tag>
          ) : null}
          <Link className="ai-agent-link" to={`/orders/${agent.order.orderId}`}>
            Xem chi tiết đơn hàng
          </Link>
        </div>
      ) : null}

      {card ? (
        <div className="ai-agent-confirm">
          <Typography.Text strong>{card.title}</Typography.Text>
          <Typography.Text>{card.description}</Typography.Text>
          <Space>
            <Button size="small" type="primary" loading={loading} onClick={() => onConfirm(card.pendingActionId)}>
              {card.confirmText || 'Xác nhận'}
            </Button>
            <Button size="small" disabled={loading} onClick={() => onCancel(card.pendingActionId)}>
              {card.cancelText || 'Hủy'}
            </Button>
          </Space>
        </div>
      ) : null}

      {shouldShowAddresses ? (
        <div className="ai-agent-addresses">
          <Typography.Text strong>Chọn địa chỉ giao hàng</Typography.Text>
          {profileQuery.isLoading ? <Spin size="small" /> : null}
          {!profileQuery.isLoading && addresses.length === 0 ? (
            <Typography.Text type="secondary">Bạn chưa có địa chỉ đã lưu.</Typography.Text>
          ) : null}
          {addresses.map((address) => (
            <div className="ai-agent-address" key={address.id}>
              <Typography.Text strong>{address.recipientName || 'Người nhận'}</Typography.Text>
              <Typography.Text type="secondary">{formatAddress(address)}</Typography.Text>
              {address.phoneNumber || profileQuery.data?.phoneNumber ? (
                <Typography.Text type="secondary">{address.phoneNumber || profileQuery.data?.phoneNumber}</Typography.Text>
              ) : null}
              <Space size={6} wrap>
                <Button size="small" type="primary" disabled={loading} onClick={() => onSendMessage(buildCheckoutMessage(primaryBook, address, 'COD', profileQuery.data?.phoneNumber))}>
                  COD
                </Button>
                <Button size="small" disabled={loading} onClick={() => onSendMessage(buildCheckoutMessage(primaryBook, address, 'VNPAY', profileQuery.data?.phoneNumber))}>
                  VNPAY
                </Button>
              </Space>
            </div>
          ))}
          <Button size="small" onClick={() => onNavigate('/profile/addresses')}>
            Thêm địa chỉ mới
          </Button>
        </div>
      ) : null}

      {agent.redirectUrl ? (
        <Button type="primary" className="ai-agent-pay" onClick={() => window.location.assign(agent.redirectUrl as string)}>
          Thanh toán VNPAY
        </Button>
      ) : null}

      {visibleActions.length > 0 ? (
        <Space className="ai-agent-suggestions" size={[4, 4]} wrap>
          {visibleActions.map((action) => (
            <button
              className="ai-agent-suggestion"
              key={`${action.action}-${action.label}-${action.pendingActionId ?? ''}`}
              type="button"
              disabled={loading}
              onClick={() => handleAgentAction(action, onConfirm, onCancel, onNavigate, onSendMessage, onClientAction)}
            >
              {action.label}
            </button>
          ))}
        </Space>
      ) : null}

      {visibleSuggestions.length > 0 ? (
        <Space className="ai-agent-suggestions" size={[4, 4]} wrap>
          {visibleSuggestions.map((suggestion) => (
            <button
              className="ai-agent-suggestion"
              key={suggestion}
              type="button"
              disabled={loading}
              onClick={() => handleSuggestionClick(suggestion, agent, primaryBook, onNavigate, onSendMessage)}
            >
              {suggestion}
            </button>
          ))}
        </Space>
      ) : null}
    </div>
  )
}

function handleAgentAction(
  action: AgentAction,
  confirm: (pendingActionId: string) => void,
  cancel: (pendingActionId: string) => void,
  navigate: (path: string) => void,
  sendMessage: (message: string) => void,
  sendClientAction: (action: AgentClientAction) => void,
) {
  if (action.action === 'CONFIRM_PENDING_ACTION' && action.pendingActionId) {
    confirm(action.pendingActionId)
    return
  }
  if (action.action === 'CANCEL_PENDING_ACTION' && action.pendingActionId) {
    cancel(action.pendingActionId)
    return
  }
  if (action.url) {
    if (/^https?:\/\//i.test(action.url)) {
      window.location.assign(action.url)
    } else {
      navigate(action.url)
    }
    return
  }
  if (action.clientAction) {
    sendClientAction(action.clientAction)
    return
  }
  if (action.action === 'ADD_TO_CART' && action.bookId) {
    sendClientAction({ action: 'ADD_TO_CART', bookId: action.bookId, quantity: 1 })
    return
  }
  if (action.message) {
    sendMessage(action.message)
    return
  }
  sendMessage(action.label)
}

function isPendingConfirmationAction(action: AgentAction) {
  return action.action === 'CONFIRM_PENDING_ACTION' || action.action === 'CANCEL_PENDING_ACTION'
}

function isConfirmationSuggestion(suggestion: string) {
  const normalized = normalizeSuggestion(suggestion)
  return normalized === 'xac nhan' || normalized === 'huy'
}

function cardBookToLegacy(card: AgentCard | undefined): AgentBookResult | undefined {
  if (!card || !card.bookId) return undefined
  return {
    bookId: card.bookId,
    title: card.title || 'Sách',
    author: card.subtitle || undefined,
    price: card.price ?? undefined,
    quantity: card.stock ?? 0,
    imageUrl: card.imageUrl,
  }
}

function formatPendingSummary(summary?: Record<string, unknown> | null) {
  if (!summary) return 'Bạn xác nhận thao tác này chứ?'
  const bookTitle = typeof summary.bookTitle === 'string' && summary.bookTitle ? summary.bookTitle : null
  const quantity = typeof summary.quantity === 'number' ? summary.quantity : null
  const total = summary.estimatedTotal
  const parts = [
    bookTitle ? `${quantity || 1} cuốn ${bookTitle}` : null,
    typeof total === 'number' || typeof total === 'string' ? `Tạm tính ${Number(total).toLocaleString('vi-VN')}đ` : null,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : 'Bạn xác nhận thao tác này chứ?'
}

function handleSuggestionClick(
  suggestion: string,
  agent: AgentResponse,
  book: AgentBookResult | undefined,
  navigate: (path: string) => void,
  sendMessage: (message: string) => void,
) {
  const normalized = normalizeSuggestion(suggestion)
  if (normalized.includes('chi tiet sach') && book) {
    navigate(`/books/${book.bookId}`)
    return
  }
  if (normalized.includes('gio hang')) {
    navigate('/cart')
    return
  }
  if ((normalized.includes('don hang') || normalized.includes('chi tiet don')) && agent.order?.orderId) {
    navigate(`/orders/${agent.order.orderId}`)
    return
  }
  if (normalized.includes('dang nhap')) {
    navigate('/login')
    return
  }
  if (normalized.includes('them') && normalized.includes('gio') && book) {
    sendMessage(`Thêm 1 cuốn ${book.title} vào giỏ`)
    return
  }
  if ((normalized.includes('tuong tu') || normalized.includes('sach khac')) && book) {
    sendMessage(`Tìm sách tương tự ${book.title}`)
    return
  }
  if (normalized.includes('dat hang') && book) {
    sendMessage(`${suggestion} cho sách ${book.title}`)
    return
  }
  sendMessage(suggestion)
}

function isCheckoutAddressPrompt(agent: AgentResponse) {
  const message = normalizeSuggestion(agent.message || '')
  const suggestions = (agent.suggestions ?? []).map(normalizeSuggestion).join(' ')
  return !agent.confirmationCard && (message.includes('dia chi giao hang') || suggestions.includes('nhap dia chi'))
}

function formatAddress(address: AddressDto) {
  return [address.street, address.ward, address.city].filter(Boolean).join(', ')
}

function buildCheckoutMessage(book: AgentBookResult | undefined, address: AddressDto, paymentMethod: 'COD' | 'VNPAY', fallbackPhone?: string) {
  const bookText = book ? ` sách ${book.title}` : ''
  const phone = address.phoneNumber || fallbackPhone
  const phoneText = phone ? `; số điện thoại: ${phone}` : ''
  return `Đặt hàng ${paymentMethod}${bookText}; địa chỉ giao hàng: ${formatAddress(address)}${phoneText}`
}

function normalizeSuggestion(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}
