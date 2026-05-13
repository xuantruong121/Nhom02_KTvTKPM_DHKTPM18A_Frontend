import { App, Button, Card, Form, Input, Modal, Popconfirm, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { adminApi, type Supplier, type SupplierPayload } from '@/modules/admin/api/adminApi'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'

export default function AdminSuppliersPage() {
  const { message } = App.useApp()
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm<SupplierPayload>()
  const queryClient = useQueryClient()
  const suppliersQuery = useApiQuery(['admin', 'suppliers'], () => adminApi.getSuppliers())

  const createMutation = useApiMutation((payload: SupplierPayload) => adminApi.createSupplier(payload), {
    onSuccess: async () => {
      void message.success('Đã tạo nhà cung cấp')
      setOpen(false)
      form.resetFields()
      await queryClient.invalidateQueries({ queryKey: ['admin', 'suppliers'] })
    },
  })

  const deleteMutation = useApiMutation((id: number) => adminApi.deleteSupplier(id), {
    onSuccess: async () => {
      void message.success('Đã xóa nhà cung cấp')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'suppliers'] })
    },
  })

  const columns: ColumnsType<Supplier> = [
    { title: 'Tên', dataIndex: 'name' },
    { title: 'Liên hệ', dataIndex: 'contactPerson' },
    { title: 'SĐT', dataIndex: 'phoneNumber' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Mã số thuế', dataIndex: 'taxCode' },
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
        <Table rowKey="id" columns={columns} dataSource={suppliersQuery.data ?? []} loading={suppliersQuery.isLoading} />
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
