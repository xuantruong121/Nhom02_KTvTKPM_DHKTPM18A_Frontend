import { App, Button, Card, Space, Switch, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { adminApi, type Coupon } from '@/modules/admin/api/adminApi'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'

function money(value: number | string | undefined) {
  return Number(value ?? 0).toLocaleString('vi-VN')
}

export default function AdminPromotionsPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const couponsQuery = useApiQuery(['admin', 'coupons'], () => adminApi.getCoupons())
  const deleteMutation = useApiMutation((id: number) => adminApi.deleteCoupon(id), {
    onSuccess: async () => {
      void message.success('Đã xóa coupon')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
    },
  })

  const columns: ColumnsType<Coupon> = [
    { title: 'Code', dataIndex: 'code', render: (value: string) => <Tag color="purple">{value}</Tag> },
    { title: 'Loại', dataIndex: 'discountType', width: 150 },
    { title: 'Giá trị', dataIndex: 'discountValue', render: money, width: 140 },
    { title: 'Đã dùng', dataIndex: 'usedCount', width: 100 },
    { title: 'Đang bật', dataIndex: 'isActive', render: (value: boolean) => <Switch checked={value} disabled />, width: 110 },
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
        <Table rowKey="id" columns={columns} dataSource={couponsQuery.data ?? []} loading={couponsQuery.isLoading} />
      </Card>
    </Space>
  )
}
