import { App, Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { adminApi, type AdminUser, type CreateStaffPayload, type StaffRole } from '@/modules/admin/api/adminApi'
import { compareNumber, compareText } from '@/modules/admin/utils/tableSort'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'

const ROLE_OPTIONS: AdminUser['role'][] = ['ADMIN', 'STAFF_SELLER', 'STAFF_WAREHOUSE', 'CUSTOMER', 'GUEST']
const STAFF_ROLE_OPTIONS: StaffRole[] = ['STAFF_SELLER', 'STAFF_WAREHOUSE']

const ROLE_COLOR: Record<AdminUser['role'], string> = {
  ADMIN: 'red',
  STAFF_SELLER: 'blue',
  STAFF_WAREHOUSE: 'geekblue',
  CUSTOMER: 'green',
  GUEST: 'default',
}

export default function AdminUsersPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [form] = Form.useForm<CreateStaffPayload>()
  const [role, setRole] = useState<AdminUser['role'] | undefined>()
  const [enabled, setEnabled] = useState<boolean | undefined>()
  const [keyword, setKeyword] = useState('')
  const usersQuery = useApiQuery(['admin', 'users'], () => adminApi.getUsers())

  const createStaffMutation = useApiMutation((payload: CreateStaffPayload) => adminApi.createStaff(payload), {
    onSuccess: async () => {
      void message.success('Đã tạo tài khoản nhân viên')
      setCreateOpen(false)
      form.resetFields()
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })

  const lockMutation = useApiMutation((id: number) => adminApi.lockUser(id), {
    onSuccess: async () => {
      void message.success('Đã khóa tài khoản')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })

  const users = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    return (usersQuery.data ?? []).filter((user) => {
      const matchesRole = !role || user.role === role
      const matchesEnabled = enabled === undefined || user.enabled === enabled
      const matchesKeyword =
        !normalizedKeyword ||
        user.email.toLowerCase().includes(normalizedKeyword) ||
        user.fullName.toLowerCase().includes(normalizedKeyword) ||
        String(user.id).includes(normalizedKeyword)
      return matchesRole && matchesEnabled && matchesKeyword
    })
  }, [enabled, keyword, role, usersQuery.data])

  const columns: ColumnsType<AdminUser> = [
    { title: 'ID', dataIndex: 'id', width: 80, sorter: (a, b) => compareNumber(a.id, b.id) },
    {
      title: 'Người dùng',
      render: (_, user) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{user.fullName}</Typography.Text>
          <Typography.Text type="secondary">{user.email}</Typography.Text>
        </Space>
      ),
      sorter: (a, b) => compareText(a.fullName, b.fullName),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      width: 180,
      render: (value: AdminUser['role']) => <Tag color={ROLE_COLOR[value]}>{value}</Tag>,
      sorter: (a, b) => compareText(a.role, b.role),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'enabled',
      width: 150,
      render: (value: boolean) => <Tag color={value ? 'green' : 'red'}>{value ? 'Đang hoạt động' : 'Đã khóa'}</Tag>,
      sorter: (a, b) => Number(a.enabled) - Number(b.enabled),
    },
    {
      title: '',
      width: 120,
      render: (_, user) =>
        user.enabled ? (
          <Popconfirm
            title="Khóa tài khoản này?"
            description="Người dùng sẽ không thể đăng nhập sau khi bị khóa."
            okText="Khóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => lockMutation.mutate(user.id)}
          >
            <Button danger size="small" loading={lockMutation.isPending}>
              Khóa
            </Button>
          </Popconfirm>
        ) : (
          <Typography.Text type="secondary">Đã khóa</Typography.Text>
        ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Người dùng
        </Typography.Title>
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          Tạo nhân viên
        </Button>
      </Space>
      <Card>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Tên, email hoặc ID"
            style={{ width: 280 }}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Select
            allowClear
            placeholder="Vai trò"
            style={{ width: 190 }}
            value={role}
            onChange={setRole}
            options={ROLE_OPTIONS.map((item) => ({ value: item, label: item }))}
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            style={{ width: 160 }}
            value={enabled}
            onChange={setEnabled}
            options={[
              { value: true, label: 'Đang hoạt động' },
              { value: false, label: 'Đã khóa' },
            ]}
          />
        </Space>
      </Card>
      <Card>
        <Table rowKey="id" columns={columns} dataSource={users} loading={usersQuery.isLoading} />
      </Card>
      <Modal
        title="Tạo tài khoản nhân viên"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createStaffMutation.isPending}
        okText="Tạo"
        cancelText="Hủy"
        style={{ top: 24 }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ role: 'STAFF_SELLER' }}
          onFinish={(values) =>
            createStaffMutation.mutate({
              ...values,
              email: values.email.trim(),
              fullName: values.fullName.trim(),
            })
          }
        >
          <Form.Item
            name="fullName"
            label="Họ tên"
            rules={[{ required: true, whitespace: true, message: 'Họ tên không được để trống' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Email không được để trống' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Nhóm quyền" rules={[{ required: true }]}>
            <Select options={STAFF_ROLE_OPTIONS.map((item) => ({ value: item, label: item }))} />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu tạm"
            rules={[
              { required: true, message: 'Mật khẩu không được để trống' },
              { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}
