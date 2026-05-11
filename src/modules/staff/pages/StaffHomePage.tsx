import { Card, Typography } from 'antd'
import { useAuth } from '@/modules/auth/hooks/useAuth'

export default function StaffHomePage() {
  const { user } = useAuth()
  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Khu vực nhân viên
      </Typography.Title>
      <Card>
        <Typography.Paragraph>
          Đăng nhập với vai trò <strong>{user?.role}</strong>. Tùy theo role bạn sẽ có quyền truy
          cập các nghiệp vụ khác nhau (đơn hàng, kho, mua hàng…).
        </Typography.Paragraph>
      </Card>
    </div>
  )
}
