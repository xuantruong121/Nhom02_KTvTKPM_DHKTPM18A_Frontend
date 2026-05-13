import { LockOutlined, MailOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/shared/api/http'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import type { LoginRequest } from '@/modules/auth/types'

type LocationState = { from?: string }

export default function AdminLoginPage() {
  const { login, logout } = useAuth()
  const { message } = App.useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const fallback = state?.from?.startsWith('/admin') ? state.from : '/admin'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form] = Form.useForm<LoginRequest>()

  const handleFinish = async (values: LoginRequest) => {
    setLoading(true)
    setError(null)
    try {
      const user = await login({ email: values.email.trim(), password: values.password })
      if (user.role !== 'ADMIN') {
        await logout()
        setError('Tài khoản này không có quyền quản trị.')
        return
      }
      void message.success('Đăng nhập quản trị thành công')
      navigate(fallback, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(135deg, #eef2ff 0%, #f8fafc 52%, #ecfeff 100%)',
        padding: 24,
      }}
    >
      <Card style={{ width: 420, boxShadow: '0 12px 34px rgba(15,23,42,0.12)' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <SafetyCertificateOutlined style={{ fontSize: 34, color: '#1d4ed8', marginBottom: 10 }} />
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            Đăng nhập Admin
          </Typography.Title>
          <Typography.Text type="secondary">Cổng quản trị SEBook</Typography.Text>
        </div>
        {error && <Alert type="error" title={error} showIcon style={{ marginBottom: 16 }} closable />}
        <Form<LoginRequest> form={form} layout="vertical" onFinish={handleFinish} autoComplete="off">
          <Form.Item
            label="Email admin"
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email admin' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="admin@sebook.local" size="large" autoComplete="email" />
          </Form.Item>
          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="******"
              size="large"
              autoComplete="current-password"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={loading}>
            Vào trang quản trị
          </Button>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Typography.Text type="secondary">Không phải admin? </Typography.Text>
            <Link to="/auth/login">Đăng nhập người dùng</Link>
          </div>
        </Form>
      </Card>
    </div>
  )
}
