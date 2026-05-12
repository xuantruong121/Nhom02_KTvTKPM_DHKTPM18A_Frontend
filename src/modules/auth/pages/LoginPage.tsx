import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Form, Input, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/shared/api/http'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import type { LoginRequest, UserRole } from '@/modules/auth/types'
import { homePathForRole } from '@/modules/auth/utils/roleRedirect'

type LocationState = { from?: string; fromRegister?: boolean; email?: string }

type LoginPageProps = {
  title?: string
  subtitle?: string
  allowedRoles?: UserRole[]
  defaultRedirect?: string
  showRegisterLink?: boolean
}

export default function LoginPage({
  title = 'Đăng nhập',
  subtitle = 'SEBook - chào mừng bạn quay lại',
  allowedRoles,
  defaultRedirect,
  showRegisterLink = true,
}: LoginPageProps) {
  const { login, logout } = useAuth()
  const { message } = App.useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const fallback = state?.from
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form] = Form.useForm<LoginRequest>()

  useEffect(() => {
    if (state?.fromRegister) {
      void message.success('Đăng ký thành công. Vui lòng đăng nhập để bắt đầu mua sắm.')
      if (state.email) form.setFieldValue('email', state.email)
      // sau khi đã đọc state, đẩy state rỗng để F5/Back không hiện lại
      window.history.replaceState({}, '')
    }
    // chỉ chạy lần mount đầu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFinish = async (values: LoginRequest) => {
    setLoading(true)
    setError(null)
    try {
      const user = await login({ email: values.email.trim(), password: values.password })
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        await logout()
        setError('Tài khoản này không có quyền truy cập khu vực đã chọn.')
        return
      }
      navigate(fallback ?? defaultRedirect ?? homePathForRole(user.role), { replace: true })
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
        background: 'linear-gradient(135deg, #eff6ff 0%, #faf5ff 100%)',
        padding: 24,
      }}
    >
      <Card style={{ width: 420, boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            {title}
          </Typography.Title>
          <Typography.Text type="secondary">{subtitle}</Typography.Text>
        </div>
        {error && (
          <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} closable />
        )}
        <Form<LoginRequest>
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="vd: ban@sebook.vn"
              size="large"
              autoComplete="email"
            />
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
              placeholder="••••••"
              size="large"
              autoComplete="current-password"
            />
          </Form.Item>
          <div style={{ textAlign: 'right', marginBottom: 8, marginTop: -8 }}>
            <Link to="/auth/forgot-password" style={{ fontSize: 13 }}>
              Quên mật khẩu?
            </Link>
          </div>
          <Button type="primary" htmlType="submit" size="large" block loading={loading}>
            Đăng nhập
          </Button>
          {showRegisterLink ? (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Typography.Text type="secondary">Chưa có tài khoản? </Typography.Text>
              <Link to="/auth/register">Đăng ký ngay</Link>
            </div>
          ) : null}
        </Form>
      </Card>
    </div>
  )
}
