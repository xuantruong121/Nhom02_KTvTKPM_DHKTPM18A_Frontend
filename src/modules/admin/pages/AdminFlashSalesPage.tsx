import { PlusOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  DatePicker,
  Form,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import {
  adminApi,
  type AdminBook,
  type FlashSale,
  type FlashSalePayload,
} from '@/modules/admin/api/adminApi'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'

type FlashSaleBookForm = {
  bookId?: number
  saleQuantity?: number
  discountPercent?: number
}

type FlashSaleForm = {
  range?: [Dayjs, Dayjs]
  active?: boolean
  items: FlashSaleBookForm[]
}

type FlashSaleGroup = {
  key: string
  startAt: string
  endAt: string
  items: FlashSale[]
}

function isGroupExpired(group: FlashSaleGroup) {
  return dayjs(group.endAt).isBefore(dayjs())
}

function money(value: number | string | undefined) {
  return `${Number(value ?? 0).toLocaleString('vi-VN')} đ`
}

function toPayload(values: FlashSaleForm, item: FlashSaleBookForm): FlashSalePayload {
  return {
    bookId: Number(item.bookId),
    saleQuantity: Number(item.saleQuantity ?? 1),
    discountPercent: Number(item.discountPercent ?? 30),
    startAt: values.range?.[0].format('YYYY-MM-DDTHH:mm:ss') ?? '',
    endAt: values.range?.[1].format('YYYY-MM-DDTHH:mm:ss') ?? '',
    active: values.active ?? true,
  }
}

function saleToPayload(sale: FlashSale, active = sale.active): FlashSalePayload {
  return {
    bookId: sale.bookId,
    saleQuantity: sale.saleQuantity,
    discountPercent: sale.discountPercent,
    startAt: dayjs(sale.startAt).format('YYYY-MM-DDTHH:mm:ss'),
    endAt: dayjs(sale.endAt).format('YYYY-MM-DDTHH:mm:ss'),
    active,
  }
}

const defaultItem = { saleQuantity: 1, discountPercent: 30 }
type ModalMode = 'create' | 'addToGroup' | 'editItem' | 'editGroup'

export default function AdminFlashSalesPage() {
  const { message } = App.useApp()
  const [form] = Form.useForm<FlashSaleForm>()
  const queryClient = useQueryClient()
  const [editingSale, setEditingSale] = useState<FlashSale | null>(null)
  const [editingGroup, setEditingGroup] = useState<FlashSaleGroup | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('create')

  const flashSalesQuery = useApiQuery(['admin', 'flashSales'], () => adminApi.getFlashSales())
  const booksQuery = useApiQuery(['admin', 'books', 'flashSale'], () => adminApi.getBooks())

  const saveMutation = useApiMutation(
    async (values: FlashSaleForm) => {
      if (editingGroup) {
        const range = values.range
        if (!range) {
          throw new Error('Chọn thời gian sale')
        }

        return Promise.all(
          editingGroup.items.map((sale) =>
            adminApi.updateFlashSale(sale.id, {
              bookId: sale.bookId,
              saleQuantity: sale.saleQuantity,
              discountPercent: sale.discountPercent,
              startAt: range[0].format('YYYY-MM-DDTHH:mm:ss'),
              endAt: range[1].format('YYYY-MM-DDTHH:mm:ss'),
              active: values.active ?? sale.active,
            })
          )
        )
      }

      const items = values.items ?? []
      if (items.length === 0) {
        throw new Error('Vui lòng thêm ít nhất một sách')
      }

      const bookIds = items.map((item) => item.bookId).filter(Boolean)
      if (!editingSale && new Set(bookIds).size !== bookIds.length) {
        throw new Error('Không chọn trùng sách trong cùng một khung giờ')
      }

      if (editingSale) {
        const item = items[0]
        return adminApi.updateFlashSale(editingSale.id, {
          bookId: editingSale.bookId,
          saleQuantity: Number(item.saleQuantity ?? editingSale.saleQuantity),
          discountPercent: Number(item.discountPercent ?? editingSale.discountPercent),
          startAt: dayjs(editingSale.startAt).format('YYYY-MM-DDTHH:mm:ss'),
          endAt: dayjs(editingSale.endAt).format('YYYY-MM-DDTHH:mm:ss'),
          active: editingSale.active,
        })
      }

      return Promise.all(items.map((item) => adminApi.createFlashSale(toPayload(values, item))))
    },
    {
      onSuccess: async () => {
        void message.success(
          editingSale || editingGroup ? 'Đã cập nhật Flash Sale' : 'Đã tạo Flash Sale'
        )
        form.resetFields()
        setEditingSale(null)
        setEditingGroup(null)
        setModalOpen(false)
        await queryClient.invalidateQueries({ queryKey: ['admin', 'flashSales'] })
      },
      onError: (error) => {
        void message.error(error instanceof Error ? error.message : 'Không lưu được Flash Sale')
      },
    }
  )

  const deleteMutation = useApiMutation((id: number) => adminApi.deleteFlashSale(id), {
    onSuccess: async () => {
      void message.success('Đã xoá Flash Sale')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'flashSales'] })
    },
  })

  const toggleMutation = useApiMutation(
    ({ sales, active }: { sales: FlashSale[]; active: boolean }) =>
      Promise.all(
        sales.map((sale) => adminApi.updateFlashSale(sale.id, saleToPayload(sale, active)))
      ),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['admin', 'flashSales'] })
      },
      onError: () => {
        void message.error('Không cập nhật được trạng thái Flash Sale')
      },
    }
  )

  const startEdit = (sale: FlashSale) => {
    setEditingSale(sale)
    setEditingGroup(null)
    setModalMode('editItem')
    setModalOpen(true)
    form.setFieldsValue({
      items: [
        {
          saleQuantity: sale.saleQuantity,
          discountPercent: sale.discountPercent,
        },
      ],
    })
  }

  const openCreateModal = () => {
    setEditingSale(null)
    setEditingGroup(null)
    setModalMode('create')
    form.resetFields()
    form.setFieldsValue({ active: true, items: [defaultItem] })
    setModalOpen(true)
  }

  const openAddToGroupModal = (group: { startAt: string; endAt: string }) => {
    setEditingSale(null)
    setEditingGroup(null)
    setModalMode('addToGroup')
    form.resetFields()
    form.setFieldsValue({
      range: [dayjs(group.startAt), dayjs(group.endAt)],
      active: true,
      items: [defaultItem],
    })
    setModalOpen(true)
  }

  const openEditGroupModal = (group: FlashSaleGroup) => {
    const activeCount = group.items.filter((sale) => sale.active).length
    setEditingSale(null)
    setEditingGroup(group)
    setModalMode('editGroup')
    form.resetFields()
    form.setFieldsValue({
      range: [dayjs(group.startAt), dayjs(group.endAt)],
      active: activeCount > 0,
      items: [],
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingSale(null)
    setEditingGroup(null)
    setModalMode('create')
    form.resetFields()
  }

  const modalTitle =
    modalMode === 'editItem'
      ? 'Cập nhật sách Flash Sale'
      : modalMode === 'editGroup'
        ? 'Cập nhật khung giờ Flash Sale'
        : modalMode === 'addToGroup'
          ? 'Thêm sách vào Flash Sale'
          : 'Thêm Flash Sale'

  const submitText =
    modalMode === 'editItem' || modalMode === 'editGroup'
      ? 'Cập nhật'
      : modalMode === 'addToGroup'
        ? 'Thêm sách'
        : 'Thêm Flash Sale'

  const bookOptions = (booksQuery.data ?? []).map((book: AdminBook) => ({
    value: book.id,
    label: `${book.title} - ${book.author}`,
  }))

  const groupedFlashSales = useMemo(() => {
    const groups = new Map<string, FlashSaleGroup>()
    for (const sale of flashSalesQuery.data ?? []) {
      const key = `${dayjs(sale.startAt).format('YYYY-MM-DDTHH:mm:ss')}__${dayjs(sale.endAt).format('YYYY-MM-DDTHH:mm:ss')}`
      const group = groups.get(key)
      if (group) {
        group.items.push(sale)
      } else {
        groups.set(key, {
          key,
          startAt: sale.startAt,
          endAt: sale.endAt,
          items: [sale],
        })
      }
    }

    return [...groups.values()].sort(
      (a, b) => dayjs(a.startAt).valueOf() - dayjs(b.startAt).valueOf()
    )
  }, [flashSalesQuery.data])

  const columns: ColumnsType<FlashSale> = [
    {
      title: 'Sách',
      render: (_, sale) => (
        <Space>
          {sale.imageUrl ? (
            <img
              src={sale.imageUrl}
              alt={sale.title}
              style={{ width: 42, height: 58, objectFit: 'cover' }}
            />
          ) : null}
          <div>
            <strong>{sale.title}</strong>
            <div style={{ color: '#64748b' }}>{sale.author || 'SEBook'}</div>
          </div>
        </Space>
      ),
    },
    { title: 'SL sale', dataIndex: 'saleQuantity', width: 100 },
    {
      title: 'Giảm',
      dataIndex: 'discountPercent',
      width: 90,
      render: (value: number) => <Tag color="red">-{value}%</Tag>,
    },
    { title: 'Giá gốc', dataIndex: 'price', width: 130, render: money },
    { title: 'Giá sale', dataIndex: 'salePrice', width: 130, render: money },
    {
      title: '',
      width: 130,
      render: (_, sale) => (
        <Space>
          <Button type="link" onClick={() => startEdit(sale)}>
            Sửa
          </Button>
          <Button danger type="link" onClick={() => deleteMutation.mutate(sale.id)}>
            Xoá
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Quản lý Flash Sale
        </Typography.Title>
        <Button type="primary" onClick={openCreateModal}>
          Thêm Flash Sale
        </Button>
      </Space>

      <Modal
        title={modalTitle}
        open={modalOpen}
        width={960}
        onCancel={closeModal}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ active: true, items: [defaultItem] }}
          onFinish={(values) => saveMutation.mutate(values)}
        >
          <Space wrap align="end" size="large">
            {modalMode !== 'editItem' ? (
              <Form.Item
                name="range"
                label="Giờ sale"
                rules={[{ required: true, message: 'Chọn thời gian sale' }]}
              >
                <DatePicker.RangePicker
                  disabled={modalMode === 'addToGroup'}
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: 460 }}
                />
              </Form.Item>
            ) : null}
            {modalMode === 'create' || modalMode === 'editGroup' ? (
              <Form.Item name="active" label="Bật" valuePropName="checked">
                <Switch />
              </Form.Item>
            ) : null}
            {modalMode !== 'editItem' ? (
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
                    {submitText}
                  </Button>
                  <Button onClick={closeModal}>Huỷ</Button>
                </Space>
              </Form.Item>
            ) : null}
          </Space>

          {modalMode !== 'editGroup' ? (
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {fields.map((field) => (
                    <Space wrap align="end" size="middle" key={field.key}>
                      {modalMode === 'editItem' ? (
                        <Form.Item>
                          <div
                            style={{
                              width: 420,
                              minHeight: 32,
                              padding: '4px 0',
                              fontWeight: 600,
                            }}
                          >
                            {editingSale?.title}
                            <div style={{ color: '#64748b', fontWeight: 400 }}>
                              {editingSale?.author || 'SEBook'}
                            </div>
                          </div>
                        </Form.Item>
                      ) : null}
                      {modalMode !== 'editItem' ? (
                        <Form.Item
                          {...field}
                          name={[field.name, 'bookId']}
                          label="Sách"
                          rules={[{ required: true, message: 'Chọn sách sale' }]}
                        >
                          <Select
                            showSearch
                            options={bookOptions}
                            optionFilterProp="label"
                            style={{ width: 420 }}
                            placeholder="Chọn sách sale"
                          />
                        </Form.Item>
                      ) : null}
                      <Form.Item
                        {...field}
                        name={[field.name, 'saleQuantity']}
                        label="Số lượng"
                        rules={[{ required: true, message: 'Nhập số lượng' }]}
                      >
                        <InputNumber min={1} style={{ width: 150 }} />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'discountPercent']}
                        label="% giảm"
                        rules={[{ required: true, message: 'Nhập % giảm' }]}
                      >
                        <InputNumber min={1} max={90} addonAfter="%" style={{ width: 160 }} />
                      </Form.Item>
                      {modalMode === 'editItem' ? (
                        <Form.Item>
                          <Space>
                            <Button
                              type="primary"
                              htmlType="submit"
                              loading={saveMutation.isPending}
                            >
                              {submitText}
                            </Button>
                            <Button onClick={closeModal}>Huỷ</Button>
                          </Space>
                        </Form.Item>
                      ) : null}
                      {fields.length > 1 && modalMode !== 'editItem' ? (
                        <Form.Item>
                          <Button danger onClick={() => remove(field.name)}>
                            Xoá
                          </Button>
                        </Form.Item>
                      ) : null}
                    </Space>
                  ))}
                  {modalMode !== 'editItem' ? (
                    <div style={{ padding: 14, background: '#f8fafc' }}>
                      <Button
                        aria-label="Thêm sách"
                        icon={<PlusOutlined />}
                        shape="circle"
                        type="primary"
                        onClick={() => add(defaultItem)}
                      />
                    </div>
                  ) : null}
                </Space>
              )}
            </Form.List>
          ) : null}
        </Form>
      </Modal>

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {flashSalesQuery.isLoading ? (
          <Card>
            <Table rowKey="id" columns={columns} dataSource={[]} loading scroll={{ x: 900 }} />
          </Card>
        ) : groupedFlashSales.length ? (
          groupedFlashSales.map((group) => {
            const activeCount = group.items.filter((sale) => sale.active).length
            const expired = isGroupExpired(group)
            const switchChecked = activeCount > 0 && !expired
            return (
              <Card
                key={group.key}
                title={
                  <Space size="large" wrap>
                    <Typography.Text strong>
                      {dayjs(group.startAt).format('DD/MM/YYYY HH:mm')} -{' '}
                      {dayjs(group.endAt).format('DD/MM/YYYY HH:mm')}
                    </Typography.Text>
                    <Tag color="blue">{group.items.length} sách</Tag>
                  </Space>
                }
                extra={
                  <Space>
                    <Button onClick={() => openEditGroupModal(group)}>Sửa</Button>
                    <Switch
                      checked={switchChecked}
                      loading={toggleMutation.isPending}
                      disabled={expired}
                      onChange={(active) => toggleMutation.mutate({ sales: group.items, active })}
                    />
                    <Button type="primary" onClick={() => openAddToGroupModal(group)}>
                      Thêm sách
                    </Button>
                  </Space>
                }
              >
                <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={group.items}
                  pagination={false}
                  scroll={{ x: 900 }}
                />
              </Card>
            )
          })
        ) : (
          <Card>
            <Typography.Text type="secondary">Chưa có Flash Sale</Typography.Text>
          </Card>
        )}
      </Space>
    </Space>
  )
}
