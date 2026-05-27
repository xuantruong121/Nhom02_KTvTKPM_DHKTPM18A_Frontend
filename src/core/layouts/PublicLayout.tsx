import {
  AppstoreOutlined,
  BellOutlined,
  BookOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  GlobalOutlined,
  LoginOutlined,
  LogoutOutlined,
  PercentageOutlined,
  RobotOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  App,
  AutoComplete,
  Avatar,
  Badge,
  Button,
  Col,
  Dropdown,
  Empty,
  Input,
  Layout,
  List,
  Popover,
  Row,
  Select,
  Space,
  Typography,
} from 'antd'
import type { MenuProps } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { memo, useCallback, useMemo, useState, type MouseEvent } from 'react'
import { Link, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { cartApi } from '@/modules/cart/api/cartApi'
import { catalogApi } from '@/modules/catalog/api/catalogApi'
import { notificationApi } from '@/modules/notification/api/notificationApi'
import { newsletterApi } from '@/modules/notification/api/newsletterApi'
import { homePathForRole } from '@/modules/auth/utils/roleRedirect'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'
import { useAuthStore, useAuthUser } from '@/shared/store/authStore'
import './PublicLayout.css'

const { Header, Content, Footer } = Layout

function PublicLayoutImpl() {
  const { message } = App.useApp()
  const user = useAuthUser()
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const cartQuery = useApiQuery(['cart'], () => cartApi.getCart(), {
    enabled: Boolean(user),
  })
  const notificationsQuery = useApiQuery(
    ['notifications'],
    () => notificationApi.getMyNotifications(),
    {
      enabled: Boolean(user),
    }
  )
  const markAllNotificationsRead = useApiMutation(() => notificationApi.markAllAsRead(), {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
  const markNotificationRead = useApiMutation((id: number) => notificationApi.markAsRead(id), {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
  const newsletterMutation = useApiMutation((email: string) => newsletterApi.subscribe(email), {
    onSuccess: (result) => {
      setNewsletterEmail('')
      void message.success(`Đã đăng ký nhận bản tin cho ${result.email}`)
    },
  })
  const cartCount = useMemo(() => cartQuery.data?.items.length ?? 0, [cartQuery.data?.items])
  const notifications = notificationsQuery.data ?? []
  const unreadNotificationCount = notifications.filter((item) => !item.readAt).length

  const handleNewsletterSubmit = useCallback(
    (value: string) => {
      const email = value.trim()
      if (!email) {
        void message.warning('Vui lòng nhập email')
        return
      }
      newsletterMutation.mutate(email)
    },
    [message, newsletterMutation]
  )

  const scrollToHomeSection = useCallback(
    (sectionId: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()

      if (window.location.pathname !== '/') {
        navigate(`/#${sectionId}`)
        return
      }

      window.history.replaceState(null, '', `/#${sectionId}`)
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    },
    [navigate]
  )

  const [searchValue, setSearchValue] = useState('')
  const booksQuery = useApiQuery(['catalog', 'books'], () => catalogApi.getBooks())

  const suggestionOptions = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase()
    if (!keyword) return []

    function isActive(entity: { active?: boolean; isActive?: boolean }) {
      return entity.active ?? entity.isActive ?? true
    }

    return (booksQuery.data ?? [])
      .filter(isActive)
      .filter((book) => {
        return [book.title, book.author, book.publisher, book.isbn]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword))
      })
      .slice(0, 8)
      .map((book) => ({
        value: book.title,
        label: (
          <div className="public-suggestion">
            <strong>{book.title}</strong>
            <span>{book.author || book.publisher || 'SEBook'}</span>
          </div>
        ),
      }))
  }, [booksQuery.data, searchValue])

  const handleLogout = useCallback(async () => {
    await logout()
    navigate('/auth/login', { replace: true })
  }, [logout, navigate])

  const goLogin = useCallback(() => navigate('/auth/login'), [navigate])
  const goRegister = useCallback(() => navigate('/auth/register'), [navigate])
  const handleLogoClick = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])
  const handleSearch = useCallback(
    (value: string) => {
      const keyword = value.trim()
      navigate(keyword ? `/books?title=${encodeURIComponent(keyword)}` : '/books')
    },
    [navigate]
  )

  const handleSearchSelect = useCallback(
    (value: string) => {
      setSearchValue(value)
      handleSearch(value)
    },
    [handleSearch]
  )

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
        {
          key: 'orders',
          icon: <FileTextOutlined />,
          label: <Link to="/orders">Đơn hàng của tôi</Link>,
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

  const notificationPanel = (
    <div className="public-notification-panel">
      <div className="public-notification-header">
        <Typography.Text strong>Thông báo</Typography.Text>
        {notifications.length > 0 ? (
          <Button
            type="link"
            size="small"
            disabled={unreadNotificationCount === 0}
            onClick={() => markAllNotificationsRead.mutate()}
          >
            Đánh dấu đã đọc
          </Button>
        ) : null}
      </div>
      {notifications.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có thông báo" />
      ) : (
        <List
          className="public-notification-list"
          dataSource={notifications.slice(0, 8)}
          renderItem={(item) => (
            <List.Item className={item.readAt ? '' : 'unread'}>
              <Link
                to={item.orderId ? `/orders/${item.orderId}` : '/orders'}
                onClick={() => {
                  if (!item.readAt) markNotificationRead.mutate(item.id)
                }}
              >
                <strong>{item.title}</strong>
                <span>{item.message}</span>
                {item.createdAt ? (
                  <small>{dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}</small>
                ) : null}
              </Link>
            </List.Item>
          )}
        />
      )}
    </div>
  )

  if (user && user.role !== 'CUSTOMER') {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  return (
    <Layout className="public-layout">
      <Header className="public-header">
        <div className="public-announcement">
          <span>Chào mừng bạn đến với SE Book – Thiên đường dành cho người yêu sách</span>
        </div>
        <div className="public-header-main">
          <Link to="/" className="public-logo" onClick={handleLogoClick}>
            <BookOutlined />
            <span>SEBook</span>
          </Link>

          <AutoComplete
            className="public-search"
            value={searchValue}
            options={suggestionOptions}
            onChange={setSearchValue}
            onSelect={handleSearchSelect}
            filterOption={false}
          >
            <Input.Search
              size="large"
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm sách, tác giả, nhà xuất bản..."
              enterButton="Tìm"
              allowClear
              onSearch={handleSearch}
            />
          </AutoComplete>

          <Space className="public-actions" size={14}>
            <Popover content={notificationPanel} trigger="click" placement="bottomRight">
              <Badge count={unreadNotificationCount} size="small">
                <Button type="text" icon={<BellOutlined />}>
                  Thông báo
                </Button>
              </Badge>
            </Popover>
            <Badge count={cartCount} size="small">
              <Button type="text" icon={<ShoppingCartOutlined />} onClick={() => navigate('/cart')}>
                Giỏ hàng
              </Button>
            </Badge>
            <Select
              size="small"
              defaultValue="vi"
              className="public-language"
              suffixIcon={<GlobalOutlined />}
              options={[
                { value: 'vi', label: 'VN' },
                { value: 'en', label: 'EN' },
              ]}
            />
            {user ? (
              <Dropdown menu={userMenu} trigger={['click']}>
                <Space className="public-user">
                  <Avatar size="small" icon={<UserOutlined />} />
                  <span>{user.fullName || user.email}</span>
                </Space>
              </Dropdown>
            ) : (
              <Space.Compact>
                <Button icon={<LoginOutlined />} onClick={goLogin}>
                  Đăng nhập
                </Button>
                <Button type="primary" onClick={goRegister}>
                  Đăng ký
                </Button>
              </Space.Compact>
            )}
          </Space>
        </div>
        <nav className="public-nav">
          <Link to="/ai">
            <RobotOutlined /> Trợ lý AI
          </Link>
          <Link to="/#flash-sale" onClick={scrollToHomeSection('flash-sale')}>
            <AppstoreOutlined /> Flash Sale
          </Link>
          <Link to="/#new-books" onClick={scrollToHomeSection('new-books')}>
            Sách mới
          </Link>
          <Link to="/books">Tất cả sách</Link>
          <Link to="/orders">Đơn hàng của tôi</Link>
          <Link to="/#featured-categories" onClick={scrollToHomeSection('featured-categories')}>
            Danh mục nổi bật
          </Link>
          <Link to="/#shopping-trends" onClick={scrollToHomeSection('shopping-trends')}>
            Xu hướng mua sắm
          </Link>
          <Link to="/#rankings" onClick={scrollToHomeSection('rankings')}>
            Bảng xếp hạng
          </Link>
          <Link to="/promotions">
            <PercentageOutlined /> Mã giảm giá
          </Link>
        </nav>
      </Header>

      <Content className="public-content">
        <Outlet />
      </Content>

      <Footer className="public-footer">
        <section className="public-newsletter">
          <div>
            <h3>Đăng ký nhận bản tin</h3>
            <p>Nhận thông tin sách mới, ưu đãi và chương trình dành riêng cho thành viên.</p>
          </div>
          <Input.Search
            placeholder="Nhập email của bạn"
            enterButton="Đăng ký"
            size="large"
            value={newsletterEmail}
            loading={newsletterMutation.isPending}
            onChange={(event) => setNewsletterEmail(event.target.value)}
            onSearch={handleNewsletterSubmit}
          />
        </section>

        <Row gutter={[24, 24]} className="public-footer-links">
          <Col xs={24} md={8}>
            <h4>SEBook</h4>
            <p>Nhà sách trực tuyến của Nhóm 02 KTvTKPM DHKTPM18A.</p>
            <p>Địa chỉ: 12 Nguyễn Văn Bảo, Gò Vấp, TP. Hồ Chí Minh.</p>
          </Col>
          <Col xs={12} md={4}>
            <h4>Dịch vụ</h4>
            <a>Điều khoản sử dụng</a>
            <a>Chính sách bảo mật</a>
            <a>Chính sách đổi trả</a>
          </Col>
          <Col xs={12} md={4}>
            <h4>Hỗ trợ</h4>
            <a>Hướng dẫn mua hàng</a>
            <a>Phương thức vận chuyển</a>
            <a>Phương thức thanh toán</a>
          </Col>
          <Col xs={12} md={4}>
            <h4>Tài khoản</h4>
            <a>Đăng nhập</a>
            <a>Đăng ký</a>
            <Link to="/orders">Đơn hàng của tôi</Link>
          </Col>
          <Col xs={12} md={4}>
            <h4>Liên hệ</h4>
            <a>Facebook</a>
            <a>Instagram</a>
            <a>App Store / Google Play</a>
          </Col>
        </Row>
        <div className="public-copyright">
          © {new Date().getFullYear()} SEBook. Thông tin giấy phép kinh doanh đang được cập nhật.
        </div>
      </Footer>
    </Layout>
  )
}

export default memo(PublicLayoutImpl)
