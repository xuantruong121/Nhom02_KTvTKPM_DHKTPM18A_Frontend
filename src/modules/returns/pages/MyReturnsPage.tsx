import { ArrowLeftOutlined, FileProtectOutlined } from '@ant-design/icons'
import { Button, Card, Empty, Image, Skeleton, Space, Tag, Timeline, Typography } from 'antd'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import { formatMoney, getReturnStatusMeta } from '@/modules/order/utils/orderFormat'
import { returnsApi } from '@/modules/returns/api/returnsApi'
import { useApiQuery } from '@/shared/hooks/useApiQuery'
import '@/modules/order/pages/OrderPages.css'

const returnReasonLabels: Record<string, string> = {
  DEFECTIVE: 'Sản phẩm bị lỗi / hư hỏng',
  WRONG_ITEM: 'Giao sai sản phẩm',
  NO_LONGER_NEEDED: 'Không còn nhu cầu sử dụng',
}

export function MyReturnsPage() {
  const returnsQuery = useApiQuery(['returns', 'my'], () => returnsApi.getMyReturns())
  const requests = [...(returnsQuery.data ?? [])].sort((left, right) => {
    const rightTime = right.createdAt ? dayjs(right.createdAt).valueOf() : 0
    const leftTime = left.createdAt ? dayjs(left.createdAt).valueOf() : 0
    if (rightTime !== leftTime) return rightTime - leftTime
    return String(right.id).localeCompare(String(left.id), 'vi', { numeric: true })
  })

  return (
    <main className="order-page">
      <section className="order-shell">
        <div className="order-heading">
          <div>
            <Typography.Title level={1}>Yêu cầu trả hàng</Typography.Title>
            <Typography.Text type="secondary">
              Theo dõi các yêu cầu đổi trả và hoàn tiền của bạn.
            </Typography.Text>
          </div>
          <Button icon={<ArrowLeftOutlined />} href="/orders">
            Đơn hàng của tôi
          </Button>
        </div>

        {returnsQuery.isLoading ? (
          <Card className="se-card">
            <Skeleton active paragraph={{ rows: 5 }} />
          </Card>
        ) : requests.length === 0 ? (
          <Card className="se-card">
            <Empty description="Bạn chưa có yêu cầu trả hàng" image={Empty.PRESENTED_IMAGE_SIMPLE}>
              <Button type="primary" href="/orders">
                Xem đơn hàng
              </Button>
            </Empty>
          </Card>
        ) : (
          <div className="order-list">
            {requests.map((request) => {
              const meta = getReturnStatusMeta(request.status)
              return (
                <Card className="se-card order-card" key={request.id}>
                  <div className="order-card-head">
                    <Space>
                      <FileProtectOutlined />
                      <strong>Yêu cầu #{request.id}</strong>
                      <Tag color={meta.color}>{meta.label}</Tag>
                    </Space>
                    <Typography.Text type="secondary">
                      {request.createdAt ? dayjs(request.createdAt).format('DD/MM/YYYY HH:mm') : 'Đang cập nhật'}
                    </Typography.Text>
                  </div>
                  <div className="return-card-body">
                    <div>
                      <span>Đơn hàng</span>
                      <Link to={`/orders/${request.orderId}`}>#{request.orderId}</Link>
                    </div>
                    <div>
                      <span>Lý do</span>
                      <strong>{returnReasonLabels[request.reason] ?? request.reason}</strong>
                    </div>
                    {request.notes ? (
                      <div>
                        <span>Chi tiết</span>
                        <strong>{request.notes}</strong>
                      </div>
                    ) : null}
                    {request.evidenceImageUrl ? (
                      <div>
                        <span>Ảnh minh chứng</span>
                        <Image
                          width={72}
                          height={72}
                          src={request.evidenceImageUrl}
                          alt={`Anh minh chung ${request.id}`}
                          style={{ objectFit: 'cover', borderRadius: 8 }}
                        />
                      </div>
                    ) : null}
                    <div>
                      <span>Hoàn tiền dự kiến</span>
                      <strong>{formatMoney(request.refundAmount)}</strong>
                    </div>
                  </div>
                  {request.histories && request.histories.length > 0 && (
                    <Timeline
                      className="return-timeline"
                      items={request.histories.map((history) => ({
                        content: `${history.note ?? history.toStatus} - ${
                          history.changedAt ? dayjs(history.changedAt).format('DD/MM/YYYY HH:mm') : ''
                        }`,
                      }))}
                    />
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
