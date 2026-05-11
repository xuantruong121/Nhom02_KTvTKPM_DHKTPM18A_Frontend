import { IdcardOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/shared/api/http'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import type { RegisterRequest } from '@/modules/auth/types'

type FormValues = RegisterRequest & { confirmPassword: string }

export default function RegisterPage() {
  const { register } = useAuth()
  const { message } = App.useApp()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form] = Form.useForm<FormValues>()

  const handleFinish = async (values: FormValues) => {
    setLoading(true)
    setError(null)
    try {
      await register({
        email: values.email.trim(),
        password: values.password,
        fullName: values.fullName.trim(),
      })
      void message.success('Tạo tài khoản thành công. Vui lòng đăng nhập.')
      navigate('/auth/login', {
        replace: true,
        state: { fromRegister: true, email: values.email.trim() },
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
        background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
        padding: 24,
      }}
    >
      <Card style={{ width: 460, boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            Tạo tài khoản khách hàng
          </Typography.Title>
          <Typography.Text type="secondary">
            Đăng ký miễn phí để mua sách và theo dõi đơn hàng
          </Typography.Text>
        </div>
        {error && (
          <Alert type="error" title={error} showIcon style={{ marginBottom: 16 }} closable />
        )}
        <Form<FormValues>
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Họ và tên"
            name="fullName"
            rules={[
              { required: true, message: 'Vui lòng nhập họ tên' },
              { min: 2, max: 100, message: 'Họ tên 2-100 ký tự' },
            ]}
          >
            <Input prefix={<IdcardOutlined />} placeholder="Nguyễn Văn A" size="large" />
          </Form.Item>
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
              placeholder="Tối thiểu 6 ký tự"
              size="large"
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_rule, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve()
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'))
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập lại mật khẩu"
              size="large"
              autoComplete="new-password"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={loading}>
            Tạo tài khoản
          </Button>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Typography.Text type="secondary">Đã có tài khoản? </Typography.Text>
            <Link to="/auth/login">Đăng nhập</Link>
          </div>
        </Form>
      </Card>
    </div>
  )
}
