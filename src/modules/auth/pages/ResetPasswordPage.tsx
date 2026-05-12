import { LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/shared/api/http'
import { authApi } from '@/modules/auth/api/authApi'

type FormValues = {
  email: string
  otp: string
  newPassword: string
  confirmPassword: string
}

type LocationState = { email?: string }

export default function ResetPasswordPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form] = Form.useForm<FormValues>()

  // Pre-fill email nếu được truyền từ ForgotPasswordPage
  const initialEmail = state?.email ?? ''

  const handleFinish = async (values: FormValues) => {
    setLoading(true)
    setError(null)
    try {
      await authApi.resetPassword({
        email: values.email.trim(),
        otp: values.otp.trim(),
        newPassword: values.newPassword,
      })
      void message.success('Mật khẩu đã được cập nhật thành công. Vui lòng đăng nhập lại!')
      navigate('/auth/login', { replace: true })
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
        background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
        padding: 24,
      }}
    >
      <Card style={{ width: 440, boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            Đặt lại mật khẩu
          </Typography.Title>
          <Typography.Text type="secondary">
            Nhập mã OTP đã gửi đến email của bạn cùng mật khẩu mới
          </Typography.Text>
        </div>

        {error && (
          <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} closable />
        )}

        <Form<FormValues>
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          autoComplete="off"
          initialValues={{ email: initialEmail }}
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
              readOnly={!!initialEmail}
            />
          </Form.Item>

          <Form.Item
            label="Mã OTP"
            name="otp"
            rules={[
              { required: true, message: 'Vui lòng nhập mã OTP' },
              { len: 6, message: 'OTP gồm đúng 6 chữ số' },
              { pattern: /^\d+$/, message: 'OTP chỉ gồm chữ số' },
            ]}
          >
            <Input
              prefix={<SafetyOutlined />}
              placeholder="6 chữ số"
              size="large"
              maxLength={6}
              autoComplete="one-time-code"
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Tối thiểu 6 ký tự"
              size="large"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_rule, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve()
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'))
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập lại mật khẩu mới"
              size="large"
              autoComplete="new-password"
            />
          </Form.Item>

          <Button type="primary" htmlType="submit" size="large" block loading={loading}>
            Cập nhật mật khẩu
          </Button>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Link to="/auth/forgot-password">Gửi lại mã OTP</Link>
            <Typography.Text type="secondary"> · </Typography.Text>
            <Link to="/auth/login">Quay lại đăng nhập</Link>
          </div>
        </Form>
      </Card>
    </div>
  )
}
