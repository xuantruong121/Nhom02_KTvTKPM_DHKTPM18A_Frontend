import { DeleteOutlined, MessageOutlined, StarFilled } from '@ant-design/icons'
import { App, Button, Card, Form, Input, Modal, Popconfirm, Rate, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { adminApi, type AdminReview, type ReviewHandlingPayload } from '@/modules/admin/api/adminApi'
import { compareDate, compareNumber, compareText } from '@/modules/admin/utils/tableSort'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'

type ReplyForm = ReviewHandlingPayload
type ReplyFilter = 'ALL' | 'REPLIED' | 'NOT_REPLIED'

const RATING_OPTIONS = [
  { value: 5, label: '5 sao' },
  { value: 4, label: '4 sao' },
  { value: 3, label: '3 sao' },
  { value: 2, label: '2 sao' },
  { value: 1, label: '1 sao' },
]

const REPLY_OPTIONS = [
  { value: 'ALL', label: 'Tất cả phản hồi' },
  { value: 'NOT_REPLIED', label: 'Chưa phản hồi' },
  { value: 'REPLIED', label: 'Đã phản hồi' },
]

const STATUS_OPTIONS = [
  { value: 'NORMAL', label: 'Bình thường' },
  { value: 'NEEDS_ACTION', label: 'Cần xử lý' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'RESOLVED', label: 'Đã xử lý' },
]

const statusMeta: Record<string, { label: string; color: string }> = {
  NORMAL: { label: 'Bình thường', color: 'default' },
  NEEDS_ACTION: { label: 'Cần xử lý', color: 'red' },
  IN_PROGRESS: { label: 'Đang xử lý', color: 'orange' },
  RESOLVED: { label: 'Đã xử lý', color: 'green' },
}

export default function AdminReviewsPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<ReplyForm>()
  const [keyword, setKeyword] = useState('')
  const [ratingFilter, setRatingFilter] = useState<number | undefined>()
  const [replyFilter, setReplyFilter] = useState<ReplyFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [replyReview, setReplyReview] = useState<AdminReview | null>(null)
  const reviewsQuery = useApiQuery(['admin', 'reviews'], () => adminApi.getReviews())

  const deleteMutation = useApiMutation((id: number) => adminApi.deleteReview(id), {
    onSuccess: async () => {
      void message.success('Đã xoá đánh giá')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
      await queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
    onError: () => message.error('Không thể xoá đánh giá'),
  })

  const replyMutation = useApiMutation(
    (payload: ReplyForm) => adminApi.updateReviewHandling(replyReview?.id ?? 0, payload),
    {
      onSuccess: async () => {
        void message.success('Đã gửi phản hồi của cửa hàng')
        setReplyReview(null)
        form.resetFields()
        await queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
        await queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      },
      onError: () => message.error('Không thể gửi phản hồi'),
    }
  )

  const reviews = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    return (reviewsQuery.data ?? []).filter((review) => {
      const hasReply = Boolean(review.adminPublicReply?.trim())
      const matchesKeyword =
        !normalized ||
        [review.bookTitle, review.reviewerName, review.reviewerEmail, review.content]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalized))
      const matchesRating = ratingFilter === undefined || review.rating === ratingFilter
      const matchesReply =
        replyFilter === 'ALL' ||
        (replyFilter === 'REPLIED' && hasReply) ||
        (replyFilter === 'NOT_REPLIED' && !hasReply)
      const matchesStatus = !statusFilter || (review.handlingStatus || 'NORMAL') === statusFilter
      return matchesKeyword && matchesRating && matchesReply && matchesStatus
    })
  }, [keyword, ratingFilter, replyFilter, reviewsQuery.data, statusFilter])

  const openReply = (review: AdminReview) => {
    setReplyReview(review)
    form.setFieldsValue({
      publicReply: review.adminPublicReply ?? undefined,
      status: review.handlingStatus === 'NORMAL' ? 'RESOLVED' : review.handlingStatus,
    })
  }

  const columns: ColumnsType<AdminReview> = [
    {
      title: 'Sách',
      render: (_, review) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{review.bookTitle}</Typography.Text>
          <Typography.Text type="secondary">Mã sách: {review.bookId}</Typography.Text>
        </Space>
      ),
      sorter: (a, b) => compareText(a.bookTitle, b.bookTitle),
    },
    {
      title: 'Khách hàng',
      render: (_, review) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{review.reviewerName || 'Người dùng SEBook'}</Typography.Text>
          <Typography.Text type="secondary">{review.reviewerEmail || `User #${review.userId}`}</Typography.Text>
        </Space>
      ),
      sorter: (a, b) => compareText(a.reviewerName || a.reviewerEmail, b.reviewerName || b.reviewerEmail),
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      width: 130,
      render: (value: number) => <Rate disabled value={value} style={{ fontSize: 14 }} />,
      sorter: (a, b) => compareNumber(a.rating, b.rating),
    },
    {
      title: 'Phản hồi',
      width: 135,
      render: (_, review) =>
        review.adminPublicReply ? <Tag color="green">Đã phản hồi</Tag> : <Tag color="orange">Chưa phản hồi</Tag>,
      sorter: (a, b) => Number(Boolean(a.adminPublicReply)) - Number(Boolean(b.adminPublicReply)),
    },
    {
      title: 'Xử lý',
      dataIndex: 'handlingStatus',
      width: 130,
      render: (value?: string) => {
        const meta = statusMeta[value || 'NORMAL'] ?? statusMeta.NORMAL
        return <Tag color={meta.color}>{meta.label}</Tag>
      },
      sorter: (a, b) => compareText(a.handlingStatus, b.handlingStatus),
    },
    {
      title: 'Nội dung review',
      dataIndex: 'content',
      render: (_, review) => (
        <Space direction="vertical" size={6}>
          <Typography.Text>{review.content || 'Không có nội dung'}</Typography.Text>
          {review.adminPublicReply ? (
            <div style={{ borderLeft: '3px solid #1677ff', paddingLeft: 10 }}>
              <Tag color="blue">Phản hồi từ cửa hàng</Tag>
              <Typography.Paragraph style={{ margin: '6px 0 0' }}>{review.adminPublicReply}</Typography.Paragraph>
              {review.adminRepliedAt ? (
                <Typography.Text type="secondary">{dayjs(review.adminRepliedAt).format('DD/MM/YYYY HH:mm')}</Typography.Text>
              ) : null}
            </div>
          ) : null}
        </Space>
      ),
      sorter: (a, b) => compareText(a.content, b.content),
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      width: 155,
      render: (value?: string) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : ''),
      sorter: (a, b) => compareDate(a.updatedAt, b.updatedAt),
    },
    {
      title: '',
      width: 170,
      render: (_, review) => (
        <Space>
          <Button type="link" icon={<MessageOutlined />} onClick={() => openReply(review)}>
            Phản hồi
          </Button>
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
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Quản lý đánh giá
        </Typography.Title>
        <Space>
          <Tag color="red">{reviewsQuery.data?.filter((review) => review.handlingStatus === 'NEEDS_ACTION').length ?? 0} cần xử lý</Tag>
          <Tag color="gold" icon={<StarFilled />}>{reviewsQuery.data?.length ?? 0} đánh giá</Tag>
        </Space>
      </Space>

      <Card>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Tìm theo sách, khách hàng hoặc nội dung review"
            style={{ width: 380 }}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Select allowClear placeholder="Rating" style={{ width: 150 }} options={RATING_OPTIONS} value={ratingFilter} onChange={setRatingFilter} />
          <Select style={{ width: 180 }} options={REPLY_OPTIONS} value={replyFilter} onChange={setReplyFilter} />
          <Select allowClear placeholder="Trạng thái xử lý" style={{ width: 180 }} options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
        </Space>
      </Card>

      <Card>
        <Table rowKey="id" columns={columns} dataSource={reviews} loading={reviewsQuery.isLoading} scroll={{ x: 1250 }} />
      </Card>

      <Modal
        title={replyReview ? `Phản hồi đánh giá #${replyReview.id}` : 'Phản hồi đánh giá'}
        open={Boolean(replyReview)}
        onCancel={() => setReplyReview(null)}
        onOk={() => form.submit()}
        confirmLoading={replyMutation.isPending}
        okText="Gửi phản hồi"
        width={680}
      >
        <Form form={form} layout="vertical" onFinish={(values) => replyMutation.mutate(values)}>
          <Form.Item
            name="publicReply"
            label="Phản hồi từ cửa hàng"
            rules={[{ required: true, whitespace: true, message: 'Nội dung phản hồi không được rỗng' }]}
          >
            <Input.TextArea rows={4} placeholder="Nhập phản hồi chính thức của cửa hàng" />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái xử lý">
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}
