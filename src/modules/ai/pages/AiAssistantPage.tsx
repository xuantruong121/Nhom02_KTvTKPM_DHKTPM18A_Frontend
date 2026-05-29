import {
  CameraOutlined,
  RobotOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Row,
  Space,
  Spin,
  Typography,
  Upload,
} from 'antd'
import type { UploadFile } from 'antd'
import { useMemo, useState } from 'react'
import { aiApi, type OcrResult } from '@/modules/ai/api/aiApi'
import { catalogApi, type Book } from '@/modules/catalog/api/catalogApi'
import { BookCard } from '@/modules/catalog/components/BookCard'
import { getErrorMessage } from '@/shared/api/http'
import './AiAssistantPage.css'

function orderBooksByIds(ids: number[], books: Book[]) {
  const byId = new Map(books.map((book) => [book.id, book]))
  return ids.map((id) => byId.get(id)).filter((book): book is Book => Boolean(book))
}

function resolveRequestedBookCount(query: string) {
  const digitMatch = query.match(/\b(\d{1,2})\b/)
  if (digitMatch) {
    return Math.min(Math.max(Number(digitMatch[1]), 1), 5)
  }

  const normalized = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')

  if (normalized.includes('mot ')) return 1
  if (normalized.includes('hai ')) return 2
  if (normalized.includes('ba ')) return 3
  if (normalized.includes('bon ') || normalized.includes('tu ')) return 4
  if (normalized.includes('nam ')) return 5
  return null
}

export default function AiAssistantPage() {
  const { message } = App.useApp()

  const [semanticQuery, setSemanticQuery] = useState('')
  const [semanticIds, setSemanticIds] = useState<number[]>([])
  const [semanticBooks, setSemanticBooks] = useState<Book[]>([])
  const [semanticLoading, setSemanticLoading] = useState(false)
  const [semanticError, setSemanticError] = useState<string | null>(null)
  const [submittedSemanticQuery, setSubmittedSemanticQuery] = useState('')

  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null)
  const [visionBooks, setVisionBooks] = useState<Book[]>([])
  const [visionLoading, setVisionLoading] = useState(false)
  const [visionError, setVisionError] = useState<string | null>(null)

  const emptySearchText = useMemo(() => {
    if (semanticIds.length > 0 && semanticBooks.length === 0) {
      return 'AI đã tìm thấy mã sách, nhưng không tải được thông tin chi tiết.'
    }
    return 'Nhập ý tưởng, chủ đề, tác giả hoặc vấn đề bạn muốn đọc.'
  }, [semanticBooks.length, semanticIds.length])
  const requestedSemanticCount = useMemo(
    () => resolveRequestedBookCount(submittedSemanticQuery),
    [submittedSemanticQuery]
  )
  const shouldShowInsufficientProducts =
    !semanticLoading &&
    Boolean(submittedSemanticQuery) &&
    requestedSemanticCount !== null &&
    semanticBooks.length < requestedSemanticCount

  async function runSemanticSearch(queryOverride?: string) {
    const query = (queryOverride ?? semanticQuery).trim()
    if (!query) return

    setSemanticLoading(true)
    setSemanticError(null)
    setSemanticIds([])
    setSemanticBooks([])
    setSubmittedSemanticQuery(query)

    try {
      const ids = await aiApi.search(query, 8)
      setSemanticIds(ids)
      const books = await Promise.all(ids.map((id) => catalogApi.getBook(id)))
      setSemanticBooks(orderBooksByIds(ids, books))
    } catch (error) {
      setSemanticError(getErrorMessage(error))
    } finally {
      setSemanticLoading(false)
    }
  }

  async function recognizeSelectedBook() {
    const file = fileList[0]?.originFileObj
    if (!file) {
      message.warning('Hãy chọn ảnh bìa sách trước.')
      return
    }

    setVisionLoading(true)
    setVisionError(null)
    setOcrResult(null)
    setVisionBooks([])

    try {
      const result = await aiApi.recognizeBook(file)
      setOcrResult(result)
      const query = [result.title, result.author].filter(Boolean).join(' ')
      if (result.detected && query) {
        const ids = await aiApi.search(query, 4)
        const books = await Promise.all(ids.map((id) => catalogApi.getBook(id)))
        setVisionBooks(orderBooksByIds(ids, books))
      }
    } catch (error) {
      setVisionError(getErrorMessage(error))
    } finally {
      setVisionLoading(false)
    }
  }

  return (
    <main className="ai-page">
      <section className="ai-shell">
        <div className="ai-heading">
          <Space>
            <RobotOutlined />
            <Typography.Title level={2}>Trợ lý AI SEBook</Typography.Title>
          </Space>
          <Typography.Text type="secondary">
            Tìm sách bằng ngôn ngữ tự nhiên, hỏi trợ lý và nhận diện sách từ ảnh bìa.
          </Typography.Text>
        </div>

        <Row gutter={[18, 18]}>
          <Col xs={24}>
            <Space orientation="vertical" size={18} className="ai-workspace">
              <Card
                className="ai-card"
                title={
                  <Space>
                    <SearchOutlined />
                    Tìm sách theo ngữ nghĩa
                  </Space>
                }
              >
                <Input.Search
                  size="large"
                  value={semanticQuery}
                  placeholder="Ví dụ: sách giúp quản lý thời gian cho sinh viên"
                  enterButton="Tìm bằng AI"
                  loading={semanticLoading}
                  onChange={(event) => setSemanticQuery(event.target.value)}
                  onSearch={() => void runSemanticSearch()}
                />
                {semanticError ? <Alert className="ai-section-alert" type="error" title={semanticError} showIcon /> : null}
                {shouldShowInsufficientProducts ? (
                  <Alert
                    className="ai-section-alert"
                    type="warning"
                    title="Hiện tại chúng tôi không có đủ sản phẩm cho yêu cầu của bạn"
                    showIcon
                  />
                ) : null}
                <div className="ai-result-grid">
                  {semanticLoading ? (
                    <Spin />
                  ) : semanticBooks.length > 0 ? (
                    <Row gutter={[14, 14]}>
                      {semanticBooks.map((book) => (
                        <Col xs={12} md={8} xl={6} key={book.id}>
                          <BookCard book={book} />
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <Empty description={emptySearchText} />
                  )}
                </div>
              </Card>

              <Card
                className="ai-card"
                title={
                  <Space>
                    <CameraOutlined />
                    Nhận diện sách từ ảnh
                  </Space>
                }
              >
                <Upload.Dragger
                  accept="image/*"
                  maxCount={1}
                  fileList={fileList}
                  beforeUpload={() => false}
                  onChange={({ fileList: nextFileList }) => setFileList(nextFileList)}
                >
                  <p className="ai-upload-icon">
                    <UploadOutlined />
                  </p>
                  <p>Kéo thả hoặc chọn ảnh bìa sách</p>
                </Upload.Dragger>

                <Button
                  className="ai-recognize-button"
                  type="primary"
                  icon={<CameraOutlined />}
                  loading={visionLoading}
                  onClick={() => void recognizeSelectedBook()}
                >
                  Nhận diện
                </Button>

                {visionError ? <Alert className="ai-section-alert" type="error" title={visionError} showIcon /> : null}

                {ocrResult ? (
                  <Alert
                    className="ai-section-alert"
                    type={ocrResult.detected ? 'success' : 'warning'}
                    showIcon
                    title={
                      ocrResult.detected
                        ? `${ocrResult.title || 'Không rõ tên sách'} - ${ocrResult.author || 'Không rõ tác giả'}`
                        : 'AI chưa nhận diện được sách trong ảnh này.'
                    }
                  />
                ) : null}

                {visionBooks.length > 0 ? (
                  <div className="ai-result-grid">
                    <Row gutter={[14, 14]}>
                      {visionBooks.map((book) => (
                        <Col xs={12} md={8} xl={6} key={book.id}>
                          <BookCard book={book} />
                        </Col>
                      ))}
                    </Row>
                  </div>
                ) : null}
              </Card>
            </Space>
          </Col>
        </Row>
      </section>

    </main>
  )
}
