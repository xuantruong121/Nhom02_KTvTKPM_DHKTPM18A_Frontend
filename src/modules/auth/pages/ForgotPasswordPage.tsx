import { MailOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/shared/api/http'
import { authApi } from '@/modules/auth/api/authApi'

type FormValues = { email: string }

export default function ForgotPasswordPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form] = Form.useForm<FormValues>()

  const handleFinish = async (values: FormValues) => {
    setLoading(true)
    setError(null)
    try {
      await authApi.forgotPassword(values.email.trim())
      void message.success('Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư!')
      navigate('/auth/reset-password', {
        state: { email: values.email.trim() },
      })
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
        background: 'linear-gradient(135deg, #fef9c3 0%, #eff6ff 100%)',
        padding: 24,
      }}
    >
      <Card style={{ width: 420, boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            Quên mật khẩu
          </Typography.Title>
          <Typography.Text type="secondary">
            Nhập email của bạn để nhận mã xác thực OTP
          </Typography.Text>
        </div>

        {error && (
          <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} closable />
        )}

        <Form<FormValues> form={form} layout="vertical" onFinish={handleFinish} autoComplete="off">
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

          <Button type="primary" htmlType="submit" size="large" block loading={loading}>
            Gửi mã OTP
          </Button>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Typography.Text type="secondary">Đã nhớ mật khẩu? </Typography.Text>
            <Link to="/auth/login">Quay lại đăng nhập</Link>
          </div>
        </Form>
      </Card>
    </div>
  )
}
