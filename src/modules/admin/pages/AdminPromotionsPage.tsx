import { App, Button, Card, Input, Space, Switch, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi, type Coupon } from '@/modules/admin/api/adminApi'
import { matchesKeyword } from '@/modules/admin/utils/search'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'

function money(value: number | string | undefined) {
  return Number(value ?? 0).toLocaleString('vi-VN')
}

function dateTime(value: string | undefined) {
  return value ? dayjs(value).format('DD/MM/YYYY HH:mm') : 'Không giới hạn'
}

function usage(value: number | undefined) {
  return value ? value.toLocaleString('vi-VN') : 'Không giới hạn'
}

export default function AdminPromotionsPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const couponsQuery = useApiQuery(['admin', 'coupons'], () => adminApi.getCoupons())
  const deleteMutation = useApiMutation((id: number) => adminApi.deleteCoupon(id), {
    onSuccess: async () => {
      void message.success('Đã xóa coupon')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
    },
  })

  const coupons = useMemo(
    () =>
      (couponsQuery.data ?? []).filter((coupon) =>
        matchesKeyword(
          keyword,
          coupon.code,
          coupon.description,
          coupon.discountType,
          coupon.discountValue
        )
      ),
    [couponsQuery.data, keyword]
  )

  const columns: ColumnsType<Coupon> = [
    {
      title: 'Code',
      dataIndex: 'code',
      render: (value: string) => <Tag color="purple">{value}</Tag>,
    },
    { title: 'Loại', dataIndex: 'discountType', width: 150 },
    { title: 'Giá trị', dataIndex: 'discountValue', render: money, width: 140 },
    { title: 'Bắt đầu', dataIndex: 'startDate', render: dateTime, width: 160 },
    { title: 'Kết thúc', dataIndex: 'endDate', render: dateTime, width: 160 },
    { title: 'Số lượng', dataIndex: 'usageLimit', render: usage, width: 130 },
    { title: 'Đã dùng', dataIndex: 'usedCount', render: money, width: 100 },
    {
      title: 'Còn lại',
      render: (_, coupon) =>
        coupon.usageLimit
          ? Math.max(0, coupon.usageLimit - coupon.usedCount).toLocaleString('vi-VN')
          : 'Không giới hạn',
      width: 130,
    },
    {
      title: 'Đang bật',
      dataIndex: 'isActive',
      render: (value: boolean) => <Switch checked={value} disabled />,
      width: 110,
    },
    {
      title: '',
      render: (_, coupon) => (
        <Space>
          <Link to={`/admin/promotions/${coupon.id}`}>
            <Button type="link">Sửa</Button>
          </Link>
          <Button danger type="link" onClick={() => deleteMutation.mutate(coupon.id)}>
            Xóa
          </Button>
        </Space>
      ),
      width: 150,
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Khuyến mãi
        </Typography.Title>
        <Link to="/admin/promotions/new">
          <Button type="primary">Tạo coupon</Button>
        </Link>
      </Space>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input.Search
            allowClear
            placeholder="Tim theo ma coupon, mo ta, loai"
            style={{ maxWidth: 360 }}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Table
            rowKey="id"
            columns={columns}
            dataSource={coupons}
            loading={couponsQuery.isLoading}
            scroll={{ x: 1120 }}
          />
        </Space>
      </Card>
    </Space>
  )
}
