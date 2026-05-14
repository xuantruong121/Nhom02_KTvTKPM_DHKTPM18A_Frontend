import { CloseCircleOutlined, ExclamationCircleOutlined, HomeOutlined, LoadingOutlined, ShoppingOutlined } from '@ant-design/icons'
import { Button, Card, Result, Space, Typography } from 'antd'
import { useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { formatMoney } from '@/modules/order/utils/orderFormat'
import './OrderPages.css'

export function PaymentResultPage() {
  const queryClient = useQueryClient()
  const [params] = useSearchParams()
  const responseCode = params.get('vnp_ResponseCode')
  const paymentStatus = params.get('paymentStatus')
  const transactionNo = params.get('vnp_TransactionNo')
  const orderRef = params.get('vnp_TxnRef')
  const amount = params.get('vnp_Amount')

  const normalizedAmount = useMemo(() => {
    if (!amount) return null
    return Number(amount) / 100
  }, [amount])

  const isSuccess = responseCode === '00' || paymentStatus === 'success'
  const isCancelled = responseCode === '24' || paymentStatus === 'cancelled'
  const isPending = !responseCode && !paymentStatus

  useEffect(() => {
    if (!isSuccess) return

    void queryClient.invalidateQueries({ queryKey: ['cart'] })
    void queryClient.invalidateQueries({ queryKey: ['orders'] })
    void queryClient.invalidateQueries({ queryKey: ['catalog', 'books'] })
  }, [isSuccess, queryClient])

  return (
    <main className="order-page">
      <section className="order-shell order-result-shell">
        <Card className="se-card">
          {isPending ? (
            <Result
              icon={<LoadingOutlined />}
              title="Đang chờ kết quả thanh toán"
              subTitle="Nếu bạn vừa quay lại từ VNPay, vui lòng kiểm tra lại danh sách đơn hàng."
              extra={<Button type="primary" href="/orders">Xem đơn hàng</Button>}
            />
          ) : isSuccess ? (
            <Result
              status="success"
              title="Thanh toán thành công"
              subTitle="Cảm ơn bạn đã mua sách tại SEBook."
              extra={[
                <Button type="primary" href="/orders" icon={<ShoppingOutlined />} key="orders">
                  Xem đơn hàng
                </Button>,
                <Button href="/" icon={<HomeOutlined />} key="home">
                  Về trang chủ
                </Button>,
              ]}
            />
          ) : isCancelled ? (
            <Result
              icon={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
              title="Bạn đã hủy thanh toán"
              subTitle="Đơn hàng vẫn được giữ lại. Bạn có thể mở chi tiết đơn hàng để thanh toán lại bất cứ lúc nào."
              extra={[
                <Button type="primary" href="/orders" icon={<ShoppingOutlined />} key="orders">
                  Xem đơn hàng
                </Button>,
                <Button href="/" icon={<HomeOutlined />} key="home">
                  Về trang chủ
                </Button>,
              ]}
            />
          ) : (
            <Result
              icon={<CloseCircleOutlined style={{ color: '#c92127' }} />}
              title="Thanh toán chưa hoàn tất"
              subTitle={`VNPay trả về mã ${responseCode || paymentStatus}. Bạn có thể thử thanh toán lại trong chi tiết đơn hàng.`}
              extra={<Button type="primary" href="/orders">Xem đơn hàng</Button>}
            />
          )}

          <div className="payment-meta">
            <Space direction="vertical">
              <Typography.Text>Mã tham chiếu: <strong>{orderRef || 'Không có'}</strong></Typography.Text>
              <Typography.Text>Mã giao dịch: <strong>{transactionNo || 'Không có'}</strong></Typography.Text>
              <Typography.Text>Số tiền: <strong>{normalizedAmount ? formatMoney(normalizedAmount) : 'Không có'}</strong></Typography.Text>
            </Space>
          </div>
        </Card>
      </section>
    </main>
  )
}
