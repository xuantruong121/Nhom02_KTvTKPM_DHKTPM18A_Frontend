import { ClearOutlined, CloseOutlined, MessageOutlined, RobotOutlined, SendOutlined } from '@ant-design/icons'
import { Alert, Button, Flex, Input, Space, Spin } from 'antd'
import { useRef, useState } from 'react'
import { aiApi } from '@/modules/ai/api/aiApi'
import { getErrorMessage } from '@/shared/api/http'
import { useAuthUser } from '@/shared/store/authStore'
import './AiChatWidget.css'

type ChatItem = {
  role: 'user' | 'assistant'
  content: string
}

const SESSION_STORAGE_KEY = 'sebook_ai_session_id'

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

export default function AiChatWidget() {
  const user = useAuthUser()
  const sessionIdRef = useRef(getSessionId())
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

  const chatCanSend = chatMessage.trim().length > 0 && !chatLoading

  async function sendChat() {
    const content = chatMessage.trim()
    if (!content) return

    setChatMessage('')
    setChatError(null)
    setChatItems((current) => [...current, { role: 'user', content }])
    setChatLoading(true)

    try {
      const answer = await aiApi.chat(sessionIdRef.current, content, user?.userId ?? undefined)
      setChatItems((current) => [...current, { role: 'assistant', content: answer }])
    } catch (error) {
      setChatError(getErrorMessage(error))
    } finally {
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
    <section className="ai-chatbox" aria-label="SEBook Assistant chatbox">
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
            {item.content}
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
