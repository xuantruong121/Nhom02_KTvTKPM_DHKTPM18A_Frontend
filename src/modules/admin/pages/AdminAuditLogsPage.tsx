import { Card, Input, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { adminApi, type AuditLog } from '@/modules/admin/api/adminApi'
import { matchesKeyword } from '@/modules/admin/utils/search'
import { compareDate, compareText } from '@/modules/admin/utils/tableSort'
import { useApiQuery } from '@/shared/hooks/useApiQuery'

function formatDate(value?: string) {
  if (!value) return '-'
  return new Date(value).toLocaleString('vi-VN')
}

const actionLabels: Record<string, string> = {
  ADMIN_CREATE_STAFF: 'Tạo nhân viên',
  ADMIN_LOCK_USER: 'Khóa tài khoản',
  STAFF_CREATE_BOOK: 'Tạo sách',
  STAFF_UPDATE_BOOK: 'Cập nhật sách',
  STAFF_CREATE_CATEGORY: 'Tạo danh mục',
  STAFF_UPDATE_CATEGORY: 'Cập nhật danh mục',
  STAFF_DELETE_CATEGORY: 'Xóa danh mục',
  STAFF_INIT_STOCK: 'Khởi tạo tồn kho',
  STAFF_INCREASE_STOCK: 'Tăng tồn kho',
  STAFF_DECREASE_STOCK: 'Giảm tồn kho',
  STAFF_APPROVE_RETURN: 'Duyệt trả hàng',
  STAFF_RECEIVE_RETURN: 'Nhận hàng trả',
  STAFF_REFUND_RETURN: 'Hoàn tiền trả hàng',
  STAFF_REJECT_RETURN: 'Từ chối trả hàng',
}

function actionLabel(action: string) {
  return actionLabels[action] ?? action.replaceAll('_', ' ')
}

function readableTarget(log: AuditLog) {
  const target = log.target?.trim()
  if (!target) return 'Đối tượng hệ thống'
  if (/^\d+$/.test(target)) return `${inferTargetPrefix(log.action)} ${target}`
  return redactSensitive(target)
}

function inferTargetPrefix(action: string) {
  if (action.includes('BOOK') || action.includes('STOCK')) return 'ID sách'
  if (action.includes('CATEGORY')) return 'ID danh mục'
  if (action.includes('RETURN')) return 'ID yêu cầu trả hàng'
  if (action.includes('USER') || action.includes('STAFF')) return 'ID tài khoản'
  return 'ID đối tượng'
}

function redactSensitive(value?: string) {
  if (!value) return '-'
  return value
    .replace(/password=[^,\])}]+/gi, 'password=***')
    .replace(/token=[^,\])}]+/gi, 'token=***')
    .replace(/secret=[^,\])}]+/gi, 'secret=***')
}

export default function AdminAuditLogsPage() {
  const [keyword, setKeyword] = useState('')
  const logsQuery = useApiQuery(['admin', 'auditLogs'], () => adminApi.getAuditLogs(), {
    refetchInterval: 10_000,
  })

  const logs = useMemo(
    () =>
      (logsQuery.data ?? []).filter((log) =>
        matchesKeyword(
          keyword,
          log.userId,
          log.role,
          actionLabel(log.action),
          readableTarget(log),
          log.oldValue,
          log.newValue
        )
      ),
    [keyword, logsQuery.data]
  )

  const columns: ColumnsType<AuditLog> = [
    { title: 'Thời gian', dataIndex: 'createdAt', width: 180, render: formatDate, sorter: (a, b) => compareDate(a.createdAt, b.createdAt) },
    {
      title: 'Người thao tác',
      dataIndex: 'userId',
      width: 220,
      render: (value?: string) => value || 'SYSTEM',
      sorter: (a, b) => compareText(a.userId, b.userId),
    },
    {
      title: 'Nhóm',
      dataIndex: 'role',
      width: 160,
      render: (value?: AuditLog['role']) => (
        <Tag color={value === 'STAFF_WAREHOUSE' ? 'geekblue' : 'blue'}>{value}</Tag>
      ),
      sorter: (a, b) => compareText(a.role, b.role),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      width: 180,
      render: (value: string) => <Tag color="blue">{actionLabel(value)}</Tag>,
      sorter: (a, b) => compareText(actionLabel(a.action), actionLabel(b.action)),
    },
    {
      title: 'Đối tượng',
      dataIndex: 'target',
      ellipsis: true,
      render: (_, log) => readableTarget(log),
      sorter: (a, b) => compareText(readableTarget(a), readableTarget(b)),
    },
    {
      title: 'Giá trị mới',
      dataIndex: 'newValue',
      ellipsis: true,
      render: redactSensitive,
      sorter: (a, b) => compareText(redactSensitive(a.newValue), redactSensitive(b.newValue)),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Nhật ký thao tác nhân viên
      </Typography.Title>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input.Search
            allowClear
            placeholder="Tìm theo người thao tác, nhóm, hành động, đối tượng"
            style={{ maxWidth: 420 }}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Table
            rowKey="id"
            columns={columns}
            dataSource={logs}
            loading={logsQuery.isLoading}
            pagination={{ pageSize: 20 }}
          />
        </Space>
      </Card>
    </Space>
  )
}
