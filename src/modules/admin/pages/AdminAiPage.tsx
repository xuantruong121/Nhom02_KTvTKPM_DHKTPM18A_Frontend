import { RobotOutlined, SyncOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Space, Typography, message } from 'antd'
import { useState } from 'react'
import { aiApi } from '@/modules/ai/api/aiApi'
import { getErrorMessage } from '@/shared/api/http'

export default function AdminAiPage() {
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function syncAll() {
    setLoading(true)
    setError(null)
    setLastResult(null)
    try {
      const result = await aiApi.syncAll()
      setLastResult(result)
      message.success('Đã kích hoạt đồng bộ AI.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Quản lý AI
      </Typography.Title>

      <Card
        title={
          <Space>
            <RobotOutlined />
            Đồng bộ vector tìm kiếm sách
          </Space>
        }
        extra={
          <Button type="primary" icon={<SyncOutlined />} loading={loading} onClick={() => void syncAll()}>
            Sync tất cả sách
          </Button>
        }
      >
        <Typography.Paragraph type="secondary">
          Chức năng này gọi endpoint admin để tạo/cập nhật embedding cho toàn bộ sách trong catalog.
        </Typography.Paragraph>
        {lastResult ? <Alert type="success" message={lastResult} showIcon /> : null}
        {error ? <Alert type="error" message={error} showIcon /> : null}
      </Card>
    </Space>
  )
}
