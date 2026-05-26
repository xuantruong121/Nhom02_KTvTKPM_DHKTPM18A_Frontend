import { DeleteOutlined, StarFilled } from '@ant-design/icons'
import { App, Button, Card, Input, Popconfirm, Rate, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { adminApi, type AdminReview } from '@/modules/admin/api/adminApi'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'

export default function AdminReviewsPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const reviewsQuery = useApiQuery(['admin', 'reviews'], () => adminApi.getReviews())

  const deleteMutation = useApiMutation((id: number) => adminApi.deleteReview(id), {
    onSuccess: async () => {
      void message.success('Đã xoá đánh giá')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
    },
  })

  const reviews = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) return reviewsQuery.data ?? []
    return (reviewsQuery.data ?? []).filter((review) =>
      [
        review.bookTitle,
        review.reviewerName,
        review.reviewerEmail,
        review.content,
        String(review.bookId),
        String(review.userId),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    )
  }, [keyword, reviewsQuery.data])

  const columns: ColumnsType<AdminReview> = [
    {
      title: 'Sách',
      render: (_, review) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{review.bookTitle}</Typography.Text>
          <Typography.Text type="secondary">Mã sách: {review.bookId}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Người đánh giá',
      render: (_, review) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{review.reviewerName || 'Người dùng SEBook'}</Typography.Text>
          <Typography.Text type="secondary">
            {review.reviewerEmail || `User #${review.userId}`}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Số sao',
      dataIndex: 'rating',
      width: 140,
      render: (value: number) => <Rate disabled value={value} style={{ fontSize: 14 }} />,
    },
    {
      title: 'Nội dung',
      dataIndex: 'content',
      render: (value?: string | null) =>
        value || <Typography.Text type="secondary">Không có nội dung</Typography.Text>,
    },
    {
      title: 'Sửa',
      dataIndex: 'editCount',
      width: 120,
      render: (value: number) => <Tag color={value > 0 ? 'orange' : 'green'}>{value}/1 lần</Tag>,
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      width: 160,
      render: (value?: string) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : ''),
    },
    {
      title: '',
      width: 100,
      render: (_, review) => (
        <Popconfirm
          title="Xoá đánh giá này?"
          okText="Xoá"
          cancelText="Huỷ"
          okButtonProps={{ danger: true }}
          onConfirm={() => deleteMutation.mutate(review.id)}
        >
          <Button danger type="link" icon={<DeleteOutlined />}>
            Xoá
          </Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Quản lý đánh giá
        </Typography.Title>
        <Tag color="gold" icon={<StarFilled />}>
          {reviewsQuery.data?.length ?? 0} đánh giá
        </Tag>
      </Space>
      <Card>
        <Input.Search
          allowClear
          placeholder="Tìm theo sách, người dùng, nội dung"
          style={{ width: 360 }}
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </Card>
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={reviews}
          loading={reviewsQuery.isLoading}
          scroll={{ x: 1000 }}
        />
      </Card>
    </Space>
  )
}
