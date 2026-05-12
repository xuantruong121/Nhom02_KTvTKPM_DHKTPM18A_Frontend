import {
  BookOutlined,
  EnvironmentOutlined,
  LoginOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Dropdown, Layout, Space } from 'antd'
import type { MenuProps } from 'antd'
import { memo, useCallback, useMemo } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore, useAuthUser } from '@/shared/store/authStore'

const { Header, Content, Footer } = Layout

function PublicLayoutImpl() {
  // Selector hẹp: chỉ re-render khi `user` đổi (object reference).
  const user = useAuthUser()
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = useCallback(async () => {
    await logout()
    navigate('/auth/login', { replace: true })
  }, [logout, navigate])

  const goLogin = useCallback(() => navigate('/auth/login'), [navigate])
  const goRegister = useCallback(() => navigate('/auth/register'), [navigate])

  // useMemo: tránh tạo lại object items mỗi render (Dropdown sẽ re-mount popup nếu identity đổi)
  const userMenu = useMemo<MenuProps>(
    () => ({
      items: [
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: <Link to="/profile">Hồ sơ của tôi</Link>,
        },
        {
          key: 'addresses',
          icon: <EnvironmentOutlined />,
          label: <Link to="/profile/addresses">Địa chỉ nhận hàng</Link>,
        },
        { type: 'divider' as const },
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: 'Đăng xuất',
          onClick: handleLogout,
          danger: true,
        },
      ],
    }),
    [handleLogout]
  )

  return (
    <Layout style={{ minHeight: '100vh', background: '#f6f7f9' }}>
      <Header
        style={{
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '0 24px',
        }}
      >
        <Link to="/" style={{ fontWeight: 700, fontSize: 20, color: '#1d4ed8' }}>
          <BookOutlined /> SEBook
        </Link>
        <nav style={{ flex: 1, marginLeft: 24 }}>
          <Space size="large">
            <Link to="/">Trang chủ</Link>
          </Space>
        </nav>
        {user ? (
          <Dropdown menu={userMenu} trigger={['click']}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{user.fullName || user.email}</span>
            </Space>
          </Dropdown>
        ) : (
          <Space>
            <Button icon={<LoginOutlined />} onClick={goLogin}>
              Đăng nhập
            </Button>
            <Button type="primary" onClick={goRegister}>
              Đăng ký
            </Button>
          </Space>
        )}
      </Header>
      <Content style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center', color: '#6b7280' }}>
        © {new Date().getFullYear()} SEBook — Nhóm 02 KTvTKPM DHKTPM18A
      </Footer>
    </Layout>
  )
}

export default memo(PublicLayoutImpl)
