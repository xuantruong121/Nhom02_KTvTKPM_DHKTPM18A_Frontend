import { BookOutlined } from '@ant-design/icons'
import { Card, Col, Row, Typography } from 'antd'
import { useAuth } from '@/modules/auth/hooks/useAuth'

export function HomePage() {
  const { user, isAuthenticated } = useAuth()
  return (
    <div>
      <Card
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg,#1d4ed8 0%, #6d28d9 100%)',
          color: '#fff',
          border: 'none',
        }}
        styles={{ body: { padding: 32 } }}
      >
        <Typography.Title level={2} style={{ color: '#fff', marginBottom: 8 }}>
          {isAuthenticated && user
            ? `Xin chào, ${user.email.split('@')[0]} 👋`
            : 'Chào mừng đến với SEBook'}
        </Typography.Title>
        <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.92)', marginBottom: 0 }}>
          Khám phá thế giới tri thức với hàng nghìn đầu sách. Mua sắm tiện lợi, giao hàng nhanh.
        </Typography.Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        {[1, 2, 3].map((i) => (
          <Col xs={24} md={8} key={i}>
            <Card hoverable>
              <BookOutlined style={{ fontSize: 28, color: '#1d4ed8' }} />
              <Typography.Title level={4} style={{ marginTop: 12 }}>
                Khu vực #{i}
              </Typography.Title>
              <Typography.Text type="secondary">
                Component HomePage tạm. Thêm danh mục, sách bán chạy, khuyến mãi ở đây.
              </Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
