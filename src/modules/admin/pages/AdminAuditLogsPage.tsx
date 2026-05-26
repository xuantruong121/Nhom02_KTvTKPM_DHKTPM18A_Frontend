import { Card, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { adminApi, type AuditLog } from '@/modules/admin/api/adminApi'
import { useApiQuery } from '@/shared/hooks/useApiQuery'

function formatDate(value?: string) {
  if (!value) return '-'
  return new Date(value).toLocaleString('vi-VN')
}

export default function AdminAuditLogsPage() {
  const logsQuery = useApiQuery(['admin', 'auditLogs'], () => adminApi.getAuditLogs(), {
    refetchInterval: 10_000,
  })

  const columns: ColumnsType<AuditLog> = [
    { title: 'Thời gian', dataIndex: 'createdAt', width: 180, render: formatDate },
    { title: 'Người thao tác', dataIndex: 'userId', width: 220, render: (value?: string) => value || 'SYSTEM' },
    {
      title: 'Nhóm',
      dataIndex: 'role',
      width: 160,
      render: (value?: AuditLog['role']) => <Tag color={value === 'STAFF_WAREHOUSE' ? 'geekblue' : 'blue'}>{value}</Tag>,
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      width: 180,
      render: (value: string) => <Tag color="blue">{value}</Tag>,
    },
    { title: 'Đối tượng', dataIndex: 'target', ellipsis: true },
    { title: 'Giá trị mới', dataIndex: 'newValue', ellipsis: true },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Nhật ký thao tác nhân viên
      </Typography.Title>
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={logsQuery.data ?? []}
          loading={logsQuery.isLoading}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </Space>
  )
}
