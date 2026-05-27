import { CopyOutlined, InfoCircleOutlined, PercentageOutlined } from '@ant-design/icons'
import { App, Button, Card, Empty, Modal, Progress, Skeleton, Typography } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { promotionApi, type ActiveCoupon } from '@/modules/promotion/api/promotionApi'
import { useApiQuery } from '@/shared/hooks/useApiQuery'
import './ActivePromotionsPage.css'

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return 0
  return typeof value === 'number' ? value : Number(value)
}

function formatPrice(value: number | string | null | undefined) {
  return currencyFormatter.format(toNumber(value))
}

function formatCouponCondition(coupon: ActiveCoupon) {
  const parts = []
  const minOrder = toNumber(coupon.minOrderValue)
  if (minOrder) parts.push(`Đơn từ ${formatPrice(minOrder)}`)
  if (coupon.maxDiscountValue && coupon.discountType === 'PERCENTAGE') {
    parts.push(`Giảm tối đa ${formatPrice(coupon.maxDiscountValue)}`)
  }
  if (coupon.usageLimit) {
    parts.push(`Còn ${Math.max(0, coupon.usageLimit - coupon.usedCount)} lượt`)
  }
  return parts.length ? parts.join(' - ') : 'Áp dụng cho đơn hàng đủ điều kiện'
}

function formatCouponDate(value?: string | null) {
  return value ? dayjs(value).format('DD/MM/YY') : 'Không giới hạn'
}

function getCouponProgress(coupon: ActiveCoupon) {
  if (!coupon.usageLimit) return 100
  return Math.max(0, Math.min(100, ((coupon.usageLimit - coupon.usedCount) / coupon.usageLimit) * 100))
}

export default function ActivePromotionsPage() {
  const { message } = App.useApp()
  const [couponDetail, setCouponDetail] = useState<ActiveCoupon | null>(null)
  const activeCouponsQuery = useApiQuery(['promotions', 'active', 'page'], () =>
    promotionApi.getActiveCoupons()
  )

  const copyCouponCode = async (code: string) => {
    await navigator.clipboard?.writeText(code)
    void message.success('Đã sao chép mã giảm giá')
  }

  return (
    <main className="promotion-page">
      <Card className="promotion-page-card">
        <div className="promotion-page-heading">
          <span>
            <PercentageOutlined />
          </span>
          <div>
            <Typography.Title level={2}>Mã giảm giá còn hiệu lực</Typography.Title>
            <Typography.Text type="secondary">
              Lưu mã và dùng khi thanh toán để nhận ưu đãi phù hợp.
            </Typography.Text>
          </div>
        </div>

        {activeCouponsQuery.isLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : activeCouponsQuery.data?.length ? (
          <div className="promotion-coupon-grid">
            {activeCouponsQuery.data.map((coupon) => (
              <div className="promotion-coupon-card" key={coupon.id}>
                <div className="promotion-coupon-badge">
                  <PercentageOutlined />
                  <b>Mã giảm</b>
                </div>
                <div className="promotion-coupon-cut" />
                <div className="promotion-coupon-content">
                  <div className="promotion-coupon-title-row">
                    <Typography.Text strong ellipsis>
                      {coupon.name}
                    </Typography.Text>
                    <Button
                      type="text"
                      size="small"
                      className="promotion-coupon-info"
                      icon={<InfoCircleOutlined />}
                      onMouseEnter={() => setCouponDetail(coupon)}
                      onClick={() => setCouponDetail(coupon)}
                    />
                  </div>
                  <Typography.Text type="secondary" ellipsis>
                    {formatCouponCondition(coupon)}
                  </Typography.Text>
                  <div className="promotion-coupon-footer">
                    <span>HSD: {formatCouponDate(coupon.endDate)}</span>
                    <Button
                      type="primary"
                      icon={<CopyOutlined />}
                      onClick={() => void copyCouponCode(coupon.code)}
                    >
                      Lưu mã
                    </Button>
                  </div>
                  <Progress
                    percent={getCouponProgress(coupon)}
                    showInfo={false}
                    strokeColor="#1677ff"
                    trailColor="#e5e7eb"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty description="Chưa có mã giảm giá còn hiệu lực" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      <Modal
        title="Chi tiết mã giảm giá"
        open={Boolean(couponDetail)}
        footer={null}
        onCancel={() => setCouponDetail(null)}
        width={560}
      >
        {couponDetail ? (
          <div className="promotion-coupon-detail">
            <div>
              <span>Tên</span>
              <strong>{couponDetail.name}</strong>
            </div>
            <div>
              <span>Mã</span>
              <strong>{couponDetail.code}</strong>
              <Button
                type="link"
                icon={<CopyOutlined />}
                onClick={() => void copyCouponCode(couponDetail.code)}
              >
                Sao chép
              </Button>
            </div>
            <div>
              <span>Hạn sử dụng</span>
              <strong>{formatCouponDate(couponDetail.endDate)}</strong>
            </div>
            <div>
              <span>Điều kiện sử dụng</span>
              <p>{formatCouponCondition(couponDetail)}</p>
            </div>
            <div>
              <span>Mô tả</span>
              <p>{couponDetail.description || 'Chưa có mô tả'}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </main>
  )
}
