import {
  Alert,
  App,
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  adminApi,
  type AdminBook,
  type AdminUser,
  type CreateStocktakePayload,
  type StocktakeItem,
  type StocktakeStatus,
  type StocktakeSummary,
  type UpdateStocktakeActualsPayload,
} from '@/modules/admin/api/adminApi'
import { invalidateCatalogStockCaches } from '@/modules/admin/utils/invalidateAdminCaches'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'
import { useAuthStore } from '@/shared/store/authStore'

type ActualDraft = Record<number, { actualQuantity?: number; note?: string }>

const statusColors: Record<StocktakeStatus, string> = {
  IN_PROGRESS: 'processing',
  SUBMITTED: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  CANCELLED: 'default',
}

const statusLabels: Record<StocktakeStatus, string> = {
  IN_PROGRESS: 'Đang kiểm kê',
  SUBMITTED: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  CANCELLED: 'Đã hủy',
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function renderStatus(status: StocktakeStatus, label?: string) {
  return <Tag color={statusColors[status]}>{label || statusLabels[status]}</Tag>
}

function bookLabel(book?: AdminBook) {
  if (!book) return 'Sách chưa xác định'
  return `${book.title} - ${book.author}`
}

export default function StaffStockCheckPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'ADMIN'
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [actualDraft, setActualDraft] = useState<ActualDraft>({})
  const [createForm] = Form.useForm<CreateStocktakePayload>()

  const sessionsQuery = useApiQuery(['admin', 'stocktakes'], () => adminApi.getStocktakes())
  const detailQuery = useApiQuery(
    ['admin', 'stocktakes', selectedId],
    () => adminApi.getStocktake(selectedId as number),
    { enabled: selectedId !== null }
  )
  const booksQuery = useApiQuery(['admin', 'books'], () => adminApi.getBooks())
  const usersQuery = useApiQuery(['admin', 'users'], () => adminApi.getUsers(), { enabled: isAdmin })

  const stocktake = detailQuery.data
  const booksById = useMemo(
    () => new Map((booksQuery.data ?? []).map((book) => [book.id, book])),
    [booksQuery.data]
  )
  const warehouseUsers = useMemo(
    () => (usersQuery.data ?? []).filter((staff) => staff.role === 'STAFF_WAREHOUSE'),
    [usersQuery.data]
  )

  useEffect(() => {
    if (!detailQuery.data) return
    setActualDraft(
      Object.fromEntries(
        detailQuery.data.items.map((item) => [
          item.bookId,
          { actualQuantity: item.actualQuantity ?? undefined, note: item.note ?? undefined },
        ])
      )
    )
  }, [detailQuery.data])

  const invalidateStocktake = async (id?: number | null) => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'stocktakes'] })
    if (id) {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'stocktakes', id] })
    }
  }

  const createMutation = useApiMutation((payload: CreateStocktakePayload) => adminApi.createStocktake(payload), {
    onSuccess: async (created) => {
      void message.success('Đã tạo phiên kiểm kê')
      setCreateOpen(false)
      createForm.resetFields()
      setSelectedId(created.id)
      await invalidateStocktake(created.id)
    },
  })

  const saveActualsMutation = useApiMutation(
    (payload: UpdateStocktakeActualsPayload) => adminApi.updateStocktakeActuals(stocktake?.id as number, payload),
    {
      onSuccess: async (updated) => {
        void message.success('Đã lưu kết quả kiểm kê')
        await invalidateStocktake(updated.id)
      },
    }
  )

  const submitMutation = useApiMutation((id: number) => adminApi.submitStocktake(id), {
    onSuccess: async (updated) => {
      void message.success('Đã gửi báo cáo kiểm kê')
      await invalidateStocktake(updated.id)
    },
  })

  const approveMutation = useApiMutation((id: number) => adminApi.approveStocktake(id), {
    onSuccess: async (updated) => {
      void message.success('Đã duyệt báo cáo kiểm kê')
      await invalidateCatalogStockCaches(queryClient)
      await invalidateStocktake(updated.id)
    },
  })

  const rejectMutation = useApiMutation(
    ({ id, reason }: { id: number; reason: string }) => adminApi.rejectStocktake(id, reason),
    {
      onSuccess: async (updated) => {
        void message.success('Đã từ chối báo cáo kiểm kê')
        setRejectOpen(false)
        setRejectReason('')
        await invalidateStocktake(updated.id)
      },
    }
  )

  const cancelMutation = useApiMutation((id: number) => adminApi.cancelStocktake(id), {
    onSuccess: async (updated) => {
      void message.success('Đã hủy phiên kiểm kê')
      await invalidateStocktake(updated.id)
    },
  })

  const sessionColumns: ColumnsType<StocktakeSummary> = [
    {
      title: 'Phiên kiểm kê',
      dataIndex: 'name',
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{name}</Typography.Text>
          <Typography.Text type="secondary">#{record.id}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status: StocktakeStatus, record) => renderStatus(status, record.statusLabel),
    },
    {
      title: 'Nhân viên',
      dataIndex: 'assignedStaffEmail',
      render: (email) => email || '-',
    },
    {
      title: 'Sách',
      dataIndex: 'itemCount',
      width: 90,
    },
    {
      title: 'Chênh lệch',
      dataIndex: 'differenceCount',
      width: 110,
      render: (count: number) => (count > 0 ? <Tag color="error">{count}</Tag> : <Tag>0</Tag>),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      render: formatDate,
    },
  ]

  const itemColumns: ColumnsType<StocktakeItem> = [
    {
      title: 'Sách',
      dataIndex: 'bookId',
      render: (bookId: number) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{bookLabel(booksById.get(bookId))}</Typography.Text>
          <Typography.Text type="secondary">ID sách {bookId}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Tồn hệ thống',
      dataIndex: 'systemQuantity',
      width: 130,
    },
    {
      title: 'Số lượng thực tế',
      dataIndex: 'actualQuantity',
      width: 170,
      render: (_, item) =>
        stocktake?.status === 'IN_PROGRESS' ? (
          <InputNumber
            min={0}
            value={actualDraft[item.bookId]?.actualQuantity}
            style={{ width: '100%' }}
            onChange={(value) =>
              setActualDraft((current) => ({
                ...current,
                [item.bookId]: {
                  ...current[item.bookId],
                  actualQuantity: typeof value === 'number' ? value : undefined,
                },
              }))
            }
          />
        ) : (
          item.actualQuantity ?? '-'
        ),
    },
    {
      title: 'Chênh lệch',
      dataIndex: 'difference',
      width: 120,
      render: (_, item) => {
        const draftValue = actualDraft[item.bookId]?.actualQuantity
        const value =
          stocktake?.status === 'IN_PROGRESS' && typeof draftValue === 'number'
            ? draftValue - item.systemQuantity
            : item.difference
        if (value === null || value === undefined) return '-'
        if (value > 0) return <Tag color="success">+{value}</Tag>
        if (value < 0) return <Tag color="error">{value}</Tag>
        return <Tag>0</Tag>
      },
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      render: (_, item) =>
        stocktake?.status === 'IN_PROGRESS' ? (
          <Input
            value={actualDraft[item.bookId]?.note}
            placeholder="Lý do chênh lệch"
            onChange={(event) =>
              setActualDraft((current) => ({
                ...current,
                [item.bookId]: {
                  ...current[item.bookId],
                  note: event.target.value,
                },
              }))
            }
          />
        ) : (
          item.note || '-'
        ),
    },
  ]

  const handleCreate = (values: CreateStocktakePayload) => {
    const staff = warehouseUsers.find((item) => item.id === values.assignedStaffId)
    createMutation.mutate({
      name: values.name,
      assignedStaffId: staff?.id ?? null,
      assignedStaffEmail: staff?.email ?? null,
      bookIds: values.bookIds,
    })
  }

  const handleSaveActuals = () => {
    if (!stocktake) return
    const items = stocktake.items.map((item) => ({
      bookId: item.bookId,
      actualQuantity: actualDraft[item.bookId]?.actualQuantity ?? item.actualQuantity ?? item.systemQuantity,
      note: actualDraft[item.bookId]?.note,
    }))
    saveActualsMutation.mutate({ items })
  }

  const canSubmit =
    stocktake?.status === 'IN_PROGRESS' &&
    stocktake.items.every((item) => typeof actualDraft[item.bookId]?.actualQuantity === 'number')

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }} align="center">
        <Typography.Title level={3} style={{ margin: 0 }}>
          Kiểm kho
        </Typography.Title>
        {isAdmin && (
          <Button type="primary" onClick={() => setCreateOpen(true)}>
            Tạo phiên kiểm kê
          </Button>
        )}
      </Space>

      {sessionsQuery.isError && (
        <Alert type="error" showIcon message="Không thể tải danh sách phiên kiểm kê" />
      )}

      <Card>
        <Table<StocktakeSummary>
          rowKey="id"
          columns={sessionColumns}
          dataSource={sessionsQuery.data ?? []}
          loading={sessionsQuery.isLoading}
          locale={{ emptyText: <Empty description="Chưa có phiên kiểm kê" /> }}
          rowClassName={(record) => (record.id === selectedId ? 'ant-table-row-selected' : '')}
          onRow={(record) => ({
            onClick: () => setSelectedId(record.id),
          })}
          pagination={{ pageSize: 6 }}
        />
      </Card>

      {selectedId && (
        <Card
          title={stocktake ? `${stocktake.name} #${stocktake.id}` : 'Chi tiết kiểm kê'}
          extra={stocktake ? renderStatus(stocktake.status, stocktake.statusLabel) : null}
          loading={detailQuery.isLoading}
        >
          {detailQuery.isError && (
            <Alert type="error" showIcon message="Không thể tải chi tiết phiên kiểm kê" />
          )}
          {!detailQuery.isLoading && !stocktake && <Empty description="Không có dữ liệu kiểm kê" />}
          {stocktake && (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space wrap>
                <Tag>Ngày tạo: {formatDate(stocktake.createdAt)}</Tag>
                <Tag>Người tạo: {stocktake.createdBy}</Tag>
                <Tag>Nhân viên: {stocktake.assignedStaffEmail || '-'}</Tag>
                {stocktake.submittedAt && <Tag>Ngày gửi: {formatDate(stocktake.submittedAt)}</Tag>}
                {stocktake.approvedAt && <Tag>Ngày duyệt: {formatDate(stocktake.approvedAt)}</Tag>}
              </Space>

              {stocktake.status === 'REJECTED' && stocktake.rejectReason && (
                <Alert type="warning" showIcon message="Lý do từ chối" description={stocktake.rejectReason} />
              )}

              <Table<StocktakeItem>
                rowKey="id"
                columns={itemColumns}
                dataSource={stocktake.items}
                pagination={false}
                scroll={{ x: 900 }}
                locale={{ emptyText: <Empty description="Phiên chưa có sách" /> }}
              />

              <Space wrap>
                {stocktake.status === 'IN_PROGRESS' && (
                  <>
                    <Button loading={saveActualsMutation.isPending} onClick={handleSaveActuals}>
                      Lưu kết quả
                    </Button>
                    <Button
                      type="primary"
                      disabled={!canSubmit}
                      loading={submitMutation.isPending}
                      onClick={() => submitMutation.mutate(stocktake.id)}
                    >
                      Gửi báo cáo
                    </Button>
                    {isAdmin && (
                      <Button danger loading={cancelMutation.isPending} onClick={() => cancelMutation.mutate(stocktake.id)}>
                        Hủy phiên
                      </Button>
                    )}
                  </>
                )}
                {isAdmin && stocktake.status === 'SUBMITTED' && (
                  <>
                    <Button
                      type="primary"
                      loading={approveMutation.isPending}
                      onClick={() => approveMutation.mutate(stocktake.id)}
                    >
                      Duyệt và cập nhật tồn kho
                    </Button>
                    <Button danger onClick={() => setRejectOpen(true)}>
                      Từ chối
                    </Button>
                  </>
                )}
              </Space>
            </Space>
          )}
        </Card>
      )}

      <Modal
        title="Tạo phiên kiểm kê"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        okText="Tạo phiên"
        cancelText="Hủy"
        confirmLoading={createMutation.isPending}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Tên phiên" rules={[{ required: true, message: 'Vui lòng nhập tên phiên' }]}>
            <Input placeholder="Kiểm kê cuối tháng" />
          </Form.Item>
          <Form.Item name="assignedStaffId" label="Nhân viên phụ trách">
            <Select
              allowClear
              showSearch
              loading={usersQuery.isLoading}
              optionFilterProp="label"
              options={warehouseUsers.map((staff: AdminUser) => ({
                value: staff.id,
                label: `${staff.fullName} - ${staff.email}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="bookIds" label="Sách kiểm kê" rules={[{ required: true, message: 'Vui lòng chọn sách' }]}>
            <Select
              mode="multiple"
              showSearch
              loading={booksQuery.isLoading}
              optionFilterProp="label"
              maxTagCount="responsive"
              options={(booksQuery.data ?? []).map((book) => ({
                value: book.id,
                label: bookLabel(book),
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Từ chối báo cáo kiểm kê"
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onOk={() => {
          if (!stocktake || !rejectReason.trim()) {
            void message.warning('Vui lòng nhập lý do từ chối')
            return
          }
          rejectMutation.mutate({ id: stocktake.id, reason: rejectReason.trim() })
        }}
        okText="Từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        confirmLoading={rejectMutation.isPending}
      >
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          placeholder="Nhập lý do từ chối"
        />
      </Modal>
    </Space>
  )
}
