import {
  DashboardOutlined,
  BookOutlined,
  GiftOutlined,
  LogoutOutlined,
  ProfileOutlined,
  RobotOutlined,
  ShopOutlined,
  StockOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Layout, Menu, Space, Typography } from 'antd'
import type { MenuProps } from 'antd'
import { memo, useCallback, useMemo } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore, useAuthUser } from '@/shared/store/authStore'
import { useUIStore } from '@/shared/store/uiStore'

const { Sider, Header, Content } = Layout

const MENU_ITEMS: MenuProps['items'] = [
  { key: '/admin', icon: <DashboardOutlined />, label: <Link to="/admin">Dashboard</Link> },
  { key: '/admin/ai', icon: <RobotOutlined />, label: <Link to="/admin/ai">AI</Link> },
  { key: '/admin/books', icon: <BookOutlined />, label: <Link to="/admin/books">Sách</Link> },
  { key: '/admin/orders', icon: <ProfileOutlined />, label: <Link to="/admin/orders">Đơn hàng</Link> },
  { key: '/admin/returns', icon: <ProfileOutlined />, label: <Link to="/admin/returns">Trả hàng</Link> },
  {
    key: '/admin/promotions',
    icon: <GiftOutlined />,
    label: <Link to="/admin/promotions">Khuyến mãi</Link>,
  },
  { key: '/admin/users', icon: <TeamOutlined />, label: <Link to="/admin/users">Người dùng</Link> },
  { key: '/admin/suppliers', icon: <ShopOutlined />, label: <Link to="/admin/suppliers">Nhà cung cấp</Link> },
  { key: '/admin/purchase-orders', icon: <ShopOutlined />, label: <Link to="/admin/purchase-orders">PO mua hàng</Link> },
  { key: '/admin/stock-check', icon: <StockOutlined />, label: <Link to="/admin/stock-check">Kiểm kho</Link> },
  { key: '/admin/inventory', icon: <StockOutlined />, label: <Link to="/admin/inventory">Tồn kho</Link> },
]

function AdminLayoutImpl() {
  const user = useAuthUser()
  const logout = useAuthStore((s) => s.logout)
  const collapsed = useUIStore((s) => s.siderCollapsed)
  const setCollapsed = useUIStore((s) => s.setSiderCollapsed)
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = useCallback(async () => {
    await logout()
    navigate('/admin/login', { replace: true })
  }, [logout, navigate])

  const selectedKeys = useMemo(() => {
    const match = MENU_ITEMS?.find((item) => {
      if (!item || !('key' in item) || typeof item.key !== 'string') return false
      return item.key !== '/admin' && location.pathname.startsWith(item.key)
    })
    return [match && 'key' in match ? String(match.key) : '/admin']
  }, [location.pathname])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" breakpoint="lg" collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ color: '#fff', fontWeight: 700, padding: '16px 24px', fontSize: 18 }}>
          {collapsed ? 'SB' : 'SEBook Admin'}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={selectedKeys} items={MENU_ITEMS} />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 24px',
            gap: 12,
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <Typography.Text strong>{user?.email}</Typography.Text>
            <Typography.Link onClick={handleLogout}>
              <LogoutOutlined /> Đăng xuất
            </Typography.Link>
          </Space>
        </Header>
        <Content style={{ padding: 24, background: '#f6f7f9' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default memo(AdminLayoutImpl)
