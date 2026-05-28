import { HeartOutlined } from '@ant-design/icons'
import { Button, Card, Col, Empty, Row, Skeleton, Space, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { catalogApi } from '@/modules/catalog/api/catalogApi'
import { BookCard } from '@/modules/catalog/components/BookCard'
import { useFavoriteBooks } from '@/modules/favorites/hooks/useFavoriteBooks'
import { useApiQuery } from '@/shared/hooks/useApiQuery'
import './FavoriteBooksPage.css'

function isActive(entity: { active?: boolean; isActive?: boolean }) {
  return entity.active ?? entity.isActive ?? true
}

export default function FavoriteBooksPage() {
  const { favoriteIds } = useFavoriteBooks()
  const booksQuery = useApiQuery(['catalog', 'books'], () => catalogApi.getBooks())

  const favoriteBooks = (booksQuery.data ?? [])
    .filter(isActive)
    .filter((book) => favoriteIds.includes(book.id))

  return (
    <main className="favorite-books-page">
      <section className="favorite-books-shell">
        <Card className="favorite-books-card se-card">
          <Space className="favorite-books-title">
            <HeartOutlined />
            <Typography.Title level={2}>Sản phẩm yêu thích</Typography.Title>
          </Space>

          {booksQuery.isLoading ? (
            <Row gutter={[16, 16]}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Col xs={12} sm={8} lg={6} key={index}>
                  <Card>
                    <Skeleton.Image active className="favorite-books-skeleton-cover" />
                    <Skeleton active paragraph={{ rows: 2 }} />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : favoriteBooks.length === 0 ? (
            <Empty description="Bạn chưa có sản phẩm yêu thích nào">
              <Link to="/books">
                <Button type="primary">Khám phá sách</Button>
              </Link>
            </Empty>
          ) : (
            <Row gutter={[16, 16]}>
              {favoriteBooks.map((book) => (
                <Col xs={12} sm={8} lg={6} key={book.id}>
                  <BookCard book={book} />
                </Col>
              ))}
            </Row>
          )}
        </Card>
      </section>
    </main>
  )
}
