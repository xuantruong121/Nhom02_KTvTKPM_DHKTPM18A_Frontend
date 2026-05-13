import {
  AppstoreOutlined,
  BellOutlined,
  BookOutlined,
  DownOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  GlobalOutlined,
  LoginOutlined,
  LogoutOutlined,
  MenuOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  AutoComplete,
  Avatar,
  Badge,
  Button,
  Col,
  Dropdown,
  Input,
  Layout,
  Popover,
  Row,
  Select,
  Space,
} from 'antd'
import type { MenuProps } from 'antd'
import { memo, useCallback, useMemo, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { cartApi } from '@/modules/cart/api/cartApi'
import { catalogApi } from '@/modules/catalog/api/catalogApi'
import { useApiQuery } from '@/shared/hooks/useApiQuery'
import { useAuthStore, useAuthUser } from '@/shared/store/authStore'
import './PublicLayout.css'

const { Header, Content, Footer } = Layout

const megaMenuGroups = [
  {
    title: 'Sách Trong Nước',
    items: ['Văn học', 'Kinh tế', 'Tâm lý - Kỹ năng sống', 'Thiếu nhi', 'Giáo khoa - Tham khảo'],
  },
  {
    title: 'Foreign Books',
    items: ['Fiction', 'Business & Management', 'Children Books', 'Language Learning'],
  },
  {
    title: 'VPP - Dụng Cụ Học Sinh',
    items: ['Bút viết', 'Tập vở', 'Dụng cụ vẽ', 'Máy tính bỏ túi'],
  },
  {
    title: 'Đồ Chơi',
    items: ['Boardgame', 'Lego', 'Đồ chơi giáo dục', 'Mô hình'],
  },
  {
    title: 'Làm Đẹp - Sức Khỏe',
    items: ['Chăm sóc cá nhân', 'Sức khỏe', 'Mỹ phẩm', 'Phụ kiện'],
  },
  {
    title: 'Thương Hiệu',
    items: ['Alpha Books', 'Deli', 'Đinh Tị', 'Tân Việt Books', 'Pace Books'],
  },
]

function PublicLayoutImpl() {
  const user = useAuthUser()
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const cartQuery = useApiQuery(['cart'], () => cartApi.getCart(), {
    enabled: Boolean(user),
  })
  const cartCount = useMemo(
    () => cartQuery.data?.items.length ?? 0,
    [cartQuery.data?.items]
  )

  const [searchValue, setSearchValue] = useState('')
  const booksQuery = useApiQuery(['catalog', 'books', 'header-search'], () =>
    catalogApi.getBooks()
  )

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

  const megaMenu = (
    <div className="public-mega-menu">
      {megaMenuGroups.map((group) => (
        <div className="public-mega-group" key={group.title}>
          <strong>{group.title}</strong>
          {group.items.map((item) => (
            <Link to="/books" key={item}>
              {item}
            </Link>
          ))}
        </div>
      ))}
    </div>
  )

  return (
    <Layout className="public-layout">
      <Header className="public-header">
        <div className="public-announcement">
          <span>Freeship cho đơn từ 250.000đ</span>
          <span>Hotline: 1900 0000</span>
        </div>
        <div className="public-header-main">
          <Link to="/" className="public-logo">
            <BookOutlined />
            <span>SEBook</span>
          </Link>

          <Popover content={megaMenu} trigger="click" placement="bottomLeft">
            <Button className="public-category-button" icon={<MenuOutlined />}>
              Danh mục <DownOutlined />
            </Button>
          </Popover>

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
            <Button type="text" icon={<BellOutlined />}>
              Thông báo
            </Button>
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
          <Link to="/#flash-sale">
            <AppstoreOutlined /> Flash Sale
          </Link>
          <Link to="/books">Tất cả sách</Link>
          <Link to="/orders">Đơn hàng của tôi</Link>
          <Link to="/#featured-categories">Danh mục nổi bật</Link>
          <Link to="/#shopping-trends">Xu hướng mua sắm</Link>
          <Link to="/#rankings">Bảng xếp hạng</Link>
          <Link to="/#brands">Thương hiệu</Link>
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
          <Input.Search placeholder="Nhập email của bạn" enterButton="Đăng ký" size="large" />
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
