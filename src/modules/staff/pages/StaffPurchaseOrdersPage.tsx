import { App, Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  adminApi,
  type PurchaseOrder,
  type PurchaseOrderPayload,
  type PurchaseOrderStatus,
} from '@/modules/admin/api/adminApi'
import { invalidatePurchaseOrderCaches } from '@/modules/admin/utils/invalidateAdminCaches'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'

type POAction = 'submit' | 'approve' | 'return' | 'receive' | 'cancel'

export default function StaffPurchaseOrdersPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [openCreate, setOpenCreate] = useState(false)
  const [active, setActive] = useState<{ po: PurchaseOrder; action: POAction } | null>(null)
  const [reason, setReason] = useState('')
  const [form] = Form.useForm<PurchaseOrderPayload>()

  const poQuery = useApiQuery(['staff', 'purchaseOrders'], () => adminApi.getPurchaseOrders())
  const suppliersQuery = useApiQuery(['admin', 'suppliers'], () => adminApi.getSuppliers())
  const booksQuery = useApiQuery(['admin', 'books'], () => adminApi.getBooks())
  const bookOptions = (booksQuery.data ?? []).map((book) => ({
    value: book.id,
    label: `${book.title} - ${book.author}`,
  }))

  const createMutation = useApiMutation((payload: PurchaseOrderPayload) => adminApi.createPurchaseOrder(payload), {
    onSuccess: async () => {
      void message.success('Đã tạo PO')
      setOpenCreate(false)
      form.resetFields()
      await invalidatePurchaseOrderCaches(queryClient)
    },
  })

  const actionMutation = useApiMutation(
    async () => {
      if (!active) return
      if (active.action === 'submit') return adminApi.submitPurchaseOrder(active.po.id)
      if (active.action === 'approve') return adminApi.approvePurchaseOrder(active.po.id)
      if (active.action === 'receive') return adminApi.receivePurchaseOrder(active.po.id)
      if (active.action === 'return') return adminApi.returnPurchaseOrder(active.po.id, reason)
      return adminApi.cancelPurchaseOrder(active.po.id, reason)
    },
    {
      onSuccess: async () => {
        void message.success('Đã cập nhật PO')
        setActive(null)
        setReason('')
        await invalidatePurchaseOrderCaches(queryClient)
      },
    }
  )

  const columns: ColumnsType<PurchaseOrder> = [
    {
      title: 'Mã PO',
      dataIndex: 'id',
      render: (id: number) => <Link to={`${id}`}>#{id}</Link>,
      width: 100,
    },
    { title: 'Nhà cung cấp', render: (_, po) => po.supplier?.name ?? '-', width: 220 },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (value: PurchaseOrderStatus) => <Tag color={value === 'CANCELLED' ? 'red' : 'blue'}>{value}</Tag>,
      width: 140,
    },
    { title: 'Tổng tiền', dataIndex: 'totalAmount', render: (value: string | number) => Number(value).toLocaleString('vi-VN') },
    {
      title: 'Sách',
      render: (_, po) => po.items.map((item) => getBookLabel(item.bookId, bookOptions)).join(', '),
    },
    {
      title: 'Thao tác',
      render: (_, po) => (
        <Space wrap>
          {getActions(po.status).map((action) => (
            <Button key={action} size="small" onClick={() => setActive({ po, action })}>
              {action}
            </Button>
          ))}
          <Link to={`${po.id}`}>
            <Button size="small" type="link">
              Chi tiet
            </Button>
          </Link>
        </Space>
      ),
      width: 300,
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          PO mua hàng
        </Typography.Title>
        <Button type="primary" onClick={() => setOpenCreate(true)}>
          Tạo PO
        </Button>
      </Space>
      <Card>
        <Table rowKey="id" columns={columns} dataSource={poQuery.data ?? []} loading={poQuery.isLoading} />
      </Card>
      <Modal
        title="Tạo PO"
        open={openCreate}
        onCancel={() => setOpenCreate(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        width={720}
        style={{ top: 24 }}
        styles={{ body: { maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', paddingRight: 12 } }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ items: [{ quantity: 1, price: 0 }] }}
          onFinish={(values) => createMutation.mutate(values)}
        >
          <Form.Item name="supplierId" label="Nhà cung cấp" rules={[{ required: true }]}>
            <Select
              options={(suppliersQuery.data ?? []).map((supplier) => ({
                value: supplier.id,
                label: supplier.name,
              }))}
            />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <Space direction="vertical" style={{ width: '100%' }}>
                {fields.map((field) => (
                  <Space key={field.key} align="baseline">
                    <Form.Item name={[field.name, 'bookId']} rules={[{ required: true }]}>
                      <Select
                        showSearch
                        placeholder="Sách"
                        style={{ width: 260 }}
                        options={bookOptions}
                        optionFilterProp="label"
                      />
                    </Form.Item>
                    <Form.Item name={[field.name, 'quantity']} rules={[{ required: true }]}>
                      <InputNumber placeholder="SL" min={1} />
                    </Form.Item>
                    <Form.Item name={[field.name, 'price']} rules={[{ required: true }]}>
                      <InputNumber placeholder="Giá" min={0} />
                    </Form.Item>
                    <Button onClick={() => remove(field.name)}>Xóa</Button>
                  </Space>
                ))}
                <Button onClick={() => add({ quantity: 1, price: 0 })}>Thêm sách</Button>
              </Space>
            )}
          </Form.List>
        </Form>
      </Modal>
      <Modal
        title="Xác nhận PO"
        open={Boolean(active)}
        onCancel={() => setActive(null)}
        onOk={() => actionMutation.mutate()}
        confirmLoading={actionMutation.isPending}
        style={{ top: 24 }}
      >
        {active?.action === 'return' || active?.action === 'cancel' ? (
          <Input.TextArea rows={3} placeholder="Lý do" value={reason} onChange={(event) => setReason(event.target.value)} />
        ) : (
          <Typography.Text>Xác nhận thao tác {active?.action}</Typography.Text>
        )}
      </Modal>
    </Space>
  )
}

function getActions(status: PurchaseOrderStatus): POAction[] {
  if (status === 'DRAFT') return ['submit', 'cancel']
  if (status === 'SUBMITTED') return ['approve', 'return', 'cancel']
  if (status === 'APPROVED') return ['receive', 'cancel']
  return []
}

function getBookLabel(bookId: number, options: Array<{ value: number; label: string }>) {
  return options.find((option) => option.value === bookId)?.label ?? `Book #${bookId}`
}
