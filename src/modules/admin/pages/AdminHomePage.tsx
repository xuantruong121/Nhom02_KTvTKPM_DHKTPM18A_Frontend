import { Alert, Card, Col, Row, Space, Statistic, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { adminApi, type TopBook } from '@/modules/admin/api/adminApi'
import { useApiQuery } from '@/shared/hooks/useApiQuery'

function money(value: number | string | undefined) {
  return Number(value ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
}

export default function AdminHomePage() {
  const metricsQuery = useApiQuery(['admin', 'dashboard'], () => adminApi.getDashboard(), {
    refetchInterval: 5_000,
  })
  const metrics = metricsQuery.data

  const columns: ColumnsType<TopBook> = [
    { title: 'Mã sách', dataIndex: 'bookId', width: 100 },
    { title: 'Tên sách', dataIndex: 'title' },
    { title: 'Đã bán', dataIndex: 'quantitySold', width: 120 },
    { title: 'Doanh thu', dataIndex: 'revenue', render: money, width: 160 },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Bảng điều khiển Admin
      </Typography.Title>
      {metricsQuery.isError ? <Alert type="error" title="Không tải được dashboard" showIcon /> : null}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8} xl={6}>
          <Card loading={metricsQuery.isLoading}>
            <Statistic title="Tổng đơn" value={metrics?.totalOrders ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={6}>
          <Card loading={metricsQuery.isLoading}>
            <Statistic title="Đơn đã thanh toán" value={metrics?.paidOrders ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={6}>
          <Card loading={metricsQuery.isLoading}>
            <Statistic title="Tỷ lệ chuyển đổi" value={metrics?.conversionRate ?? 0} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={6}>
          <Card loading={metricsQuery.isLoading}>
            <Statistic title="Khách mua duy nhất" value={metrics?.uniqueBuyers ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={metricsQuery.isLoading}>
            <Statistic title="Tổng doanh thu" value={money(metrics?.totalRevenue)} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={metricsQuery.isLoading}>
            <Statistic title="Hoàn tiền" value={money(metrics?.refundAmount)} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={metricsQuery.isLoading}>
            <Statistic title="Doanh thu ròng" value={money(metrics?.netRevenue)} />
          </Card>
        </Col>
      </Row>
      <Card title="Top sách bán chạy">
        <Table
          rowKey="bookId"
          columns={columns}
          dataSource={metrics?.topBooks ?? []}
          loading={metricsQuery.isLoading}
          pagination={false}
        />
      </Card>
    </Space>
  )
}
