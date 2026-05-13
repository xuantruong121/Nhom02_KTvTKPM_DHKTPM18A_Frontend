import { App, Button, Card, Input, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { adminApi, type AdminUser } from '@/modules/admin/api/adminApi'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'

const ROLE_OPTIONS: AdminUser['role'][] = ['ADMIN', 'STAFF_SELLER', 'STAFF_WAREHOUSE', 'CUSTOMER', 'GUEST']

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
  const [role, setRole] = useState<AdminUser['role'] | undefined>()
  const [enabled, setEnabled] = useState<boolean | undefined>()
  const [keyword, setKeyword] = useState('')
  const usersQuery = useApiQuery(['admin', 'users'], () => adminApi.getUsers())

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
    { title: 'ID', dataIndex: 'id', width: 80 },
    {
      title: 'Người dùng',
      render: (_, user) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{user.fullName}</Typography.Text>
          <Typography.Text type="secondary">{user.email}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      width: 180,
      render: (value: AdminUser['role']) => <Tag color={ROLE_COLOR[value]}>{value}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'enabled',
      width: 150,
      render: (value: boolean) => <Tag color={value ? 'green' : 'red'}>{value ? 'Đang hoạt động' : 'Đã khóa'}</Tag>,
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
      <Typography.Title level={3} style={{ margin: 0 }}>
        Người dùng
      </Typography.Title>
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
    </Space>
  )
}
