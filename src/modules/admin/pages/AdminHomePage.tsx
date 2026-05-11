import { Card, Statistic, Typography } from 'antd'

export default function AdminHomePage() {
  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Bảng điều khiển Admin
      </Typography.Title>
      <Card>
        <Statistic title="Endpoint đang dùng" value="/api/v1/*" />
      </Card>
    </div>
  )
}
