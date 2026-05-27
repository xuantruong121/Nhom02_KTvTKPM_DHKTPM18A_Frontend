import { App, Button, Card, Form, Input, Modal, Popconfirm, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { adminApi, type Supplier, type SupplierPayload } from '@/modules/admin/api/adminApi'
import { matchesKeyword } from '@/modules/admin/utils/search'
import { compareText } from '@/modules/admin/utils/tableSort'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'

export default function AdminSuppliersPage() {
  const { message } = App.useApp()
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [form] = Form.useForm<SupplierPayload>()
  const queryClient = useQueryClient()
  const suppliersQuery = useApiQuery(['admin', 'suppliers'], () => adminApi.getSuppliers())

  const createMutation = useApiMutation(
    (payload: SupplierPayload) => adminApi.createSupplier(payload),
    {
      onSuccess: async () => {
        void message.success('Đã tạo nhà cung cấp')
        setOpen(false)
        form.resetFields()
        await queryClient.invalidateQueries({ queryKey: ['admin', 'suppliers'] })
      },
    }
  )

  const deleteMutation = useApiMutation((id: number) => adminApi.deleteSupplier(id), {
    onSuccess: async () => {
      void message.success('Đã xóa nhà cung cấp')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'suppliers'] })
    },
  })

  const suppliers = useMemo(
    () =>
      (suppliersQuery.data ?? []).filter((supplier) =>
        matchesKeyword(
          keyword,
          supplier.name,
          supplier.contactPerson,
          supplier.phoneNumber,
          supplier.email,
          supplier.address,
          supplier.taxCode
        )
      ),
    [keyword, suppliersQuery.data]
  )

  const columns: ColumnsType<Supplier> = [
    { title: 'Tên', dataIndex: 'name', sorter: (a, b) => compareText(a.name, b.name) },
    { title: 'Liên hệ', dataIndex: 'contactPerson', sorter: (a, b) => compareText(a.contactPerson, b.contactPerson) },
    { title: 'SĐT', dataIndex: 'phoneNumber', sorter: (a, b) => compareText(a.phoneNumber, b.phoneNumber) },
    { title: 'Email', dataIndex: 'email', sorter: (a, b) => compareText(a.email, b.email) },
    { title: 'Mã số thuế', dataIndex: 'taxCode', sorter: (a, b) => compareText(a.taxCode, b.taxCode) },
    {
      title: '',
      width: 110,
      render: (_, supplier) => (
        <Popconfirm
          title="Xóa nhà cung cấp?"
          description="Nhà cung cấp sẽ được ẩn khỏi danh sách, dữ liệu PO cũ vẫn được giữ."
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
          onConfirm={() => deleteMutation.mutate(supplier.id)}
        >
          <Button danger size="small" loading={deleteMutation.isPending}>
            Xóa
          </Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Nhà cung cấp
        </Typography.Title>
        <Button type="primary" onClick={() => setOpen(true)}>
          Tạo mới
        </Button>
      </Space>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input.Search
            allowClear
            placeholder="Tìm theo tên, liên hệ, SĐT, email, mã số thuế"
            style={{ maxWidth: 420 }}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Table
            rowKey="id"
            columns={columns}
            dataSource={suppliers}
            loading={suppliersQuery.isLoading}
          />
        </Space>
      </Card>
      <Modal
        title="Tạo nhà cung cấp"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        style={{ top: 24 }}
      >
        <Form form={form} layout="vertical" onFinish={(values) => createMutation.mutate(values)}>
          <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contactPerson" label="Người liên hệ">
            <Input />
          </Form.Item>
          <Form.Item name="phoneNumber" label="SĐT">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="taxCode" label="Mã số thuế">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}
