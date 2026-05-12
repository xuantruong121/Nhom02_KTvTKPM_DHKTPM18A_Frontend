import {
  CameraOutlined,
  EditOutlined,
  KeyOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Form,
  Input,
  Skeleton,
  Space,
  Tag,
  Typography,
  Upload,
} from 'antd'
import type { UploadFile } from 'antd'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthUser } from '@/shared/store/authStore'
import { getErrorMessage } from '@/shared/api/http'
import { useApiQuery } from '@/shared/hooks/useApiQuery'
import { accountApi, type UpdateProfileRequest } from '@/modules/account/api/accountApi'
import { useQueryClient } from '@tanstack/react-query'

const PROFILE_QUERY_KEY = ['account', 'profile']

export default function ProfilePage() {
  const { message } = App.useApp()
  const authUser = useAuthUser()
  const queryClient = useQueryClient()
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [form] = Form.useForm<{ phoneNumber?: string }>()

  const { data: profile, isLoading } = useApiQuery(
    PROFILE_QUERY_KEY,
    () => accountApi.getProfile()
  )

  const handleSave = async (values: { phoneNumber?: string }) => {
    setSaving(true)
    setError(null)
    try {
      const payload: UpdateProfileRequest = {}
      if (values.phoneNumber) payload.phoneNumber = values.phoneNumber
      if (avatarFile) payload.avatar = avatarFile
      await accountApi.updateProfile(payload)
      await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })
      void message.success('Cập nhật hồ sơ thành công!')
      setEditMode(false)
      setAvatarFile(null)
      setAvatarPreview(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = (info: { fileList: UploadFile[] }) => {
    const file = info.fileList[0]?.originFileObj
    if (file) {
      const isLt5M = file.size / 1024 / 1024 < 5
      if (!isLt5M) {
        void message.error('Ảnh đại diện phải nhỏ hơn 5MB!')
        return
      }
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setAvatarPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  if (isLoading) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto' }}>
        <Skeleton active avatar paragraph={{ rows: 4 }} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto' }}>
        <Alert type="error" message="Không thể tải thông tin hồ sơ" />
      </div>
    )
  }

  const avatarSrc = avatarPreview ?? profile.avatarUrl

  return (
    <div style={{ maxWidth: 600, margin: '32px auto' }}>
      <Card
        title={
          <Space>
            <UserOutlined />
            <span>Hồ sơ cá nhân</span>
          </Space>
        }
        extra={
          !editMode && (
            <Button icon={<EditOutlined />} onClick={() => setEditMode(true)}>
              Chỉnh sửa
            </Button>
          )
        }
        style={{ boxShadow: '0 4px 20px rgba(15,23,42,0.06)' }}
      >
        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {editMode ? (
            <Upload
              accept="image/png,image/jpeg"
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleAvatarChange}
              maxCount={1}
            >
              <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}>
                <Avatar size={88} src={avatarSrc} icon={<UserOutlined />} />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CameraOutlined style={{ color: '#fff', fontSize: 22 }} />
                </div>
              </div>
            </Upload>
          ) : (
            <Avatar size={88} src={avatarSrc} icon={<UserOutlined />} />
          )}
          <Typography.Title level={4} style={{ marginTop: 8, marginBottom: 2 }}>
            {profile.fullName || authUser?.fullName || 'Người dùng hệ thống'}
          </Typography.Title>
          <Tag color="blue">{profile.role || authUser?.role}</Tag>
        </div>

        {error && (
          <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} closable />
        )}

        {editMode ? (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{ phoneNumber: profile.phoneNumber ?? '' }}
          >
            <Form.Item label="Email">
              <Input
                prefix={<MailOutlined />}
                value={profile.email || authUser?.email}
                disabled
                size="large"
              />
            </Form.Item>
            <Form.Item
              label="Số điện thoại"
              name="phoneNumber"
              rules={[
                {
                  pattern: /^(0|\+84)[0-9]{8,10}$/,
                  message: 'Số điện thoại không hợp lệ',
                },
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="0912345678"
                size="large"
                maxLength={15}
              />
            </Form.Item>

            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setEditMode(false)
                  setAvatarFile(null)
                  setAvatarPreview(null)
                  setError(null)
                }}
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                Lưu thay đổi
              </Button>
            </Space>
          </Form>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <Card size="small" bordered={false} style={{ background: '#f8fafc' }}>
              <Space>
                <MailOutlined style={{ color: '#6b7280' }} />
                <Typography.Text type="secondary">Email:</Typography.Text>
                <Typography.Text strong>{profile.email || authUser?.email}</Typography.Text>
              </Space>
            </Card>
            <Card size="small" bordered={false} style={{ background: '#f8fafc' }}>
              <Space>
                <PhoneOutlined style={{ color: '#6b7280' }} />
                <Typography.Text type="secondary">Điện thoại:</Typography.Text>
                <Typography.Text strong>
                  {profile.phoneNumber ?? (
                    <Typography.Text type="secondary" italic>Chưa cập nhật</Typography.Text>
                  )}
                </Typography.Text>
              </Space>
            </Card>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <Link to="/profile/addresses">
                <Button block>Quản lý địa chỉ</Button>
              </Link>
              <Link to="/profile/change-password">
                <Button icon={<KeyOutlined />} block>
                  Đổi mật khẩu
                </Button>
              </Link>
            </div>
          </Space>
        )}
      </Card>
    </div>
  )
}
