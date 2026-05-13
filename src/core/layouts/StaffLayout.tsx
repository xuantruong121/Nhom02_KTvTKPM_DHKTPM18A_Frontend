import {
  AppstoreOutlined,
  AuditOutlined,
  InboxOutlined,
  LogoutOutlined,
  StockOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Layout, Menu, Space, Tag, Typography } from 'antd'
import type { MenuProps } from 'antd'
import { memo, useCallback, useMemo } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore, useAuthUser } from '@/shared/store/authStore'
import { useUIStore } from '@/shared/store/uiStore'

const { Sider, Header, Content } = Layout

const MENU_ITEMS: MenuProps['items'] = [
  { key: '/staff', icon: <AppstoreOutlined />, label: <Link to="/staff">Tong quan</Link> },
  {
    key: '/staff/returns',
    icon: <AuditOutlined />,
    label: <Link to="/staff/returns">Tra hang</Link>,
  },
  {
    key: '/staff/purchase-orders',
    icon: <InboxOutlined />,
    label: <Link to="/staff/purchase-orders">PO mua hang</Link>,
  },
  {
    key: '/staff/stock-check',
    icon: <StockOutlined />,
    label: <Link to="/staff/stock-check">Kiem kho</Link>,
  },
]

function StaffLayoutImpl() {
  const user = useAuthUser()
  const logout = useAuthStore((s) => s.logout)
  const collapsed = useUIStore((s) => s.siderCollapsed)
  const setCollapsed = useUIStore((s) => s.setSiderCollapsed)
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = useCallback(async () => {
    await logout()
    navigate('/staff/login', { replace: true })
  }, [logout, navigate])

  const selectedKeys = useMemo(() => {
    const match = MENU_ITEMS?.find((item) => {
      if (!item || !('key' in item) || typeof item.key !== 'string') return false
      return item.key !== '/staff' && location.pathname.startsWith(item.key)
    })
    return [match && 'key' in match ? String(match.key) : '/staff']
  }, [location.pathname])
  const roleTagColor = user?.role === 'STAFF_WAREHOUSE' ? 'gold' : 'blue'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" breakpoint="lg" collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ fontWeight: 700, padding: '16px 24px', fontSize: 18, color: '#1d4ed8' }}>
          {collapsed ? 'SB' : 'SEBook Staff'}
        </div>
        <Menu mode="inline" selectedKeys={selectedKeys} items={MENU_ITEMS} />
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
            <Tag color={roleTagColor}>{user?.role}</Tag>
            <Typography.Link onClick={handleLogout}>
              <LogoutOutlined /> Dang xuat
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

export default memo(StaffLayoutImpl)
