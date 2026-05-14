import {
  AppstoreOutlined,
  AuditOutlined,
  BookOutlined,
  InboxOutlined,
  LogoutOutlined,
  ProfileOutlined,
  StockOutlined,
  TagsOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Layout, Menu, Space, Tag, Typography } from 'antd'
import type { MenuProps } from 'antd'
import { memo, useCallback, useMemo } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore, useAuthUser } from '@/shared/store/authStore'
import { useUIStore } from '@/shared/store/uiStore'

const { Sider, Header, Content } = Layout
const SIDER_WIDTH = 200
const SIDER_COLLAPSED_WIDTH = 80

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

  const menuItems = useMemo<MenuProps['items']>(() => {
    const items: MenuProps['items'] = [
      { key: '/staff', icon: <AppstoreOutlined />, label: <Link to="/staff">Tổng quan</Link> },
    ]

    if (user?.role === 'STAFF_SELLER') {
      items.push(
        {
          key: '/staff/orders',
          icon: <ProfileOutlined />,
          label: <Link to="/staff/orders">Đơn hàng</Link>,
        },
        {
          key: '/staff/returns',
          icon: <AuditOutlined />,
          label: <Link to="/staff/returns">Trả hàng</Link>,
        }
      )
    }

    if (user?.role === 'STAFF_WAREHOUSE') {
      items.push(
        {
          key: '/staff/books',
          icon: <BookOutlined />,
          label: <Link to="/staff/books">Sách</Link>,
        },
        {
          key: '/staff/categories',
          icon: <TagsOutlined />,
          label: <Link to="/staff/categories">Danh mục</Link>,
        },
        {
          key: '/staff/inventory',
          icon: <StockOutlined />,
          label: <Link to="/staff/inventory">Tồn kho</Link>,
        },
        {
          key: '/staff/purchase-orders',
          icon: <InboxOutlined />,
          label: <Link to="/staff/purchase-orders">PO mua hàng</Link>,
        },
        {
          key: '/staff/stock-check',
          icon: <StockOutlined />,
          label: <Link to="/staff/stock-check">Kiểm kho</Link>,
        }
      )
    }

    return items
  }, [user?.role])

  const selectedKeys = useMemo(() => {
    const match = menuItems?.find((item) => {
      if (!item || !('key' in item) || typeof item.key !== 'string') return false
      return item.key !== '/staff' && location.pathname.startsWith(item.key)
    })
    return [match && 'key' in match ? String(match.key) : '/staff']
  }, [location.pathname, menuItems])
  const roleTagColor = user?.role === 'STAFF_WAREHOUSE' ? 'gold' : 'blue'
  const siderWidth = collapsed ? SIDER_COLLAPSED_WIDTH : SIDER_WIDTH

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        theme="dark"
        breakpoint="lg"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          position: 'fixed',
          insetInlineStart: 0,
          top: 0,
          bottom: 0,
          height: '100vh',
          overflow: 'auto',
          zIndex: 100,
        }}
      >
        <div style={{ color: '#fff', fontWeight: 700, padding: '16px 24px', fontSize: 18 }}>
          {collapsed ? 'SB' : 'SEBook Staff'}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={selectedKeys} items={menuItems} />
      </Sider>
      <Layout style={{ marginLeft: siderWidth, transition: 'margin-left 0.2s' }}>
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
