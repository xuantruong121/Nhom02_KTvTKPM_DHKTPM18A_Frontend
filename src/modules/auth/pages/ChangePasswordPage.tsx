import { LockOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/shared/api/http'
import { useAuthUser } from '@/shared/store/authStore'
import { authApi } from '@/modules/auth/api/authApi'

type FormValues = {
  otp: string
  newPassword: string
  confirmPassword: string
}

/**
 * ChangePasswordPage — dùng cho user đã đăng nhập muốn đổi mật khẩu.
 * Flow: gọi /auth/forgot-password (server gửi OTP) → nhập OTP + mật khẩu mới qua /auth/reset-password.
 * Lưu ý: BE chưa có endpoint change-password riêng cho user đã đăng nhập, nên dùng lại flow OTP.
 */
export default function ChangePasswordPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const user = useAuthUser()

  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [otpLoading, setOtpLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form] = Form.useForm<FormValues>()

  const email = user?.email ?? ''

  const handleRequestOtp = async () => {
    if (!email) return
    setOtpLoading(true)
    setError(null)
    try {
      await authApi.forgotPassword(email)
      void message.success('Mã OTP đã được gửi đến email của bạn')
      setStep('reset')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setOtpLoading(false)
    }
  }

  const handleFinish = async (values: FormValues) => {
    setLoading(true)
    setError(null)
    try {
      await authApi.resetPassword({
        email,
        otp: values.otp.trim(),
        newPassword: values.newPassword,
      })
      void message.success('Mật khẩu đã được cập nhật thành công!')
      navigate('/', { replace: true })
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
        background: 'linear-gradient(135deg, #fdf4ff 0%, #eff6ff 100%)',
        padding: 24,
      }}
    >
      <Card style={{ width: 440, boxShadow: '0 10px 30px rgba(15,23,42,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            Đổi mật khẩu
          </Typography.Title>
          {step === 'request' ? (
            <Typography.Text type="secondary">
              Nhấn nút bên dưới để nhận mã OTP qua email <strong>{email}</strong>
            </Typography.Text>
          ) : (
            <Typography.Text type="secondary">
              Nhập mã OTP đã gửi đến <strong>{email}</strong> và mật khẩu mới
            </Typography.Text>
          )}
        </div>

        {error && (
          <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} closable />
        )}

        {step === 'request' ? (
          <>
            <Button
              type="primary"
              size="large"
              block
              loading={otpLoading}
              onClick={handleRequestOtp}
            >
              Gửi mã OTP đến email
            </Button>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Link to="/profile">Quay lại hồ sơ</Link>
            </div>
          </>
        ) : (
          <Form<FormValues>
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            autoComplete="off"
          >
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

            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <Button
                type="link"
                size="small"
                loading={otpLoading}
                onClick={handleRequestOtp}
              >
                Gửi lại mã OTP
              </Button>
              <Typography.Text type="secondary"> · </Typography.Text>
              <Link to="/profile">Hủy</Link>
            </div>
          </Form>
        )}
      </Card>
    </div>
  )
}
