import { ClearOutlined, CloseOutlined, MessageOutlined, RobotOutlined, SendOutlined } from '@ant-design/icons'
import { Alert, Button, Flex, Input, Space, Spin } from 'antd'
import { useRef, useState, type PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { aiApi } from '@/modules/ai/api/aiApi'
import { getErrorMessage } from '@/shared/api/http'
import { useAuthUser } from '@/shared/store/authStore'
import './AiChatWidget.css'

type ChatItem = {
  role: 'user' | 'assistant'
  content: string
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
  const user = useAuthUser()
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

  async function sendChat() {
    const content = chatMessage.trim()
    if (!content) return

    setChatMessage('')
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
      const answer = await aiApi.chat(sessionIdRef.current, content, user?.userId ?? undefined, abortController.signal)
      setChatItems((current) => [...current, { role: 'assistant', content: answer }])
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
