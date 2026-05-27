import { Card, Input, Space, Table, Tabs, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { adminApi } from '@/modules/admin/api/adminApi'
import { matchesKeyword } from '@/modules/admin/utils/search'
import { compareNumber, compareText } from '@/modules/admin/utils/tableSort'
import CategoryManagementPage from '@/modules/catalog/pages/CategoryManagementPage'
import { useApiQuery } from '@/shared/hooks/useApiQuery'

type AuthorRow = {
  name: string
  bookCount: number
}

export default function AdminSystemCatalogPage() {
  const [authorKeyword, setAuthorKeyword] = useState('')
  const booksQuery = useApiQuery(['admin', 'books', 'authors'], () => adminApi.getBooks())

  const authors = useMemo<AuthorRow[]>(() => {
    const countByAuthor = new Map<string, number>()
    ;(booksQuery.data ?? []).forEach((book) => {
      const author = book.author?.trim()
      if (!author) return
      countByAuthor.set(author, (countByAuthor.get(author) ?? 0) + 1)
    })
    return [...countByAuthor.entries()]
      .map(([name, bookCount]) => ({ name, bookCount }))
      .sort((left, right) => left.name.localeCompare(right.name, 'vi'))
  }, [booksQuery.data])

  const filteredAuthors = useMemo(
    () => authors.filter((author) => matchesKeyword(authorKeyword, author.name, author.bookCount)),
    [authorKeyword, authors]
  )

  const authorColumns: ColumnsType<AuthorRow> = [
    { title: 'Tác giả', dataIndex: 'name', sorter: (a, b) => compareText(a.name, b.name) },
    { title: 'Số sách', dataIndex: 'bookCount', width: 120, sorter: (a, b) => compareNumber(a.bookCount, b.bookCount) },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Cấu hình danh mục
      </Typography.Title>
      <Tabs
        items={[
          {
            key: 'categories',
            label: 'Thể loại',
            children: <CategoryManagementPage area="admin" />,
          },
          {
            key: 'authors',
            label: 'Tác giả',
            children: (
              <Card>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Input.Search
                    allowClear
                    placeholder="Tìm theo tên tác giả"
                    style={{ maxWidth: 320 }}
                    value={authorKeyword}
                    onChange={(event) => setAuthorKeyword(event.target.value)}
                  />
                  <Table
                    rowKey="name"
                    columns={authorColumns}
                    dataSource={filteredAuthors}
                    loading={booksQuery.isLoading}
                    pagination={{ pageSize: 10 }}
                  />
                </Space>
              </Card>
            ),
          },
        ]}
      />
    </Space>
  )
}
