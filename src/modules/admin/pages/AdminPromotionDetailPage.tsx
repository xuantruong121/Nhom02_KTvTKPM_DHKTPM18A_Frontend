import { App, Button, Card, DatePicker, Descriptions, Form, Input, InputNumber, Select, Space, Switch, Typography } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { adminApi, type CouponPayload, type DiscountType } from '@/modules/admin/api/adminApi'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'

const API_DATE_TIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss'
const DISPLAY_DATE_TIME_FORMAT = 'DD/MM/YYYY HH:mm'

type CouponForm = Omit<CouponPayload, 'startDate' | 'endDate'> & {
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs]
}

export default function AdminPromotionDetailPage() {
  const { message } = App.useApp()
  const [form] = Form.useForm<CouponForm>()
  const params = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isNew = params.id === 'new'
  const couponId = Number(params.id)

  const couponQuery = useApiQuery(['admin', 'coupons', couponId], () => adminApi.getCoupon(couponId), {
    enabled: !isNew && Number.isFinite(couponId),
  })

  if (couponQuery.data && !form.isFieldsTouched()) {
    form.setFieldsValue({
      code: couponQuery.data.code,
      name: couponQuery.data.name,
      description: couponQuery.data.description,
      discountType: couponQuery.data.discountType,
      discountValue: Number(couponQuery.data.discountValue),
      minOrderValue: Number(couponQuery.data.minOrderValue ?? 0),
      maxDiscountValue: Number(couponQuery.data.maxDiscountValue ?? 0),
      usageLimit: couponQuery.data.usageLimit,
      isActive: couponQuery.data.isActive,
      dateRange:
        couponQuery.data.startDate && couponQuery.data.endDate
          ? [dayjs(couponQuery.data.startDate), dayjs(couponQuery.data.endDate)]
          : undefined,
    })
  }

  const saveMutation = useApiMutation(
    (values: CouponForm) => {
      const payload = toPayload(values)
      if (isNew) return adminApi.createCoupon(payload)
      return adminApi.updateCoupon(couponId, payload)
    },
    {
      onSuccess: async () => {
        void message.success('Đã lưu coupon')
        await queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
        navigate('/admin/promotions')
      },
    }
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space>
        <Link to="/admin/promotions">
          <Button>Quay lại</Button>
        </Link>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {isNew ? 'Tạo coupon' : 'Sửa coupon'}
        </Typography.Title>
      </Space>
      <Card loading={couponQuery.isLoading}>
        {!isNew && couponQuery.data ? (
          <Descriptions
            bordered
            column={{ xs: 1, md: 2 }}
            size="middle"
            style={{ marginBottom: 24 }}
            items={[
              { key: 'name', label: 'Tên khuyến mãi', children: couponQuery.data.name },
              { key: 'code', label: 'Mã', children: couponQuery.data.code },
              {
                key: 'description',
                label: 'Mô tả',
                span: 2,
                children: couponQuery.data.description || 'Chưa có mô tả',
              },
              {
                key: 'condition',
                label: 'Điều kiện sử dụng',
                span: 2,
                children: formatCouponCondition(couponQuery.data),
              },
              {
                key: 'date',
                label: 'Hạn sử dụng',
                children: formatCouponDate(couponQuery.data.endDate),
              },
            ]}
          />
        ) : null}
        <Form
          form={form}
          layout="vertical"
          initialValues={{ discountType: 'PERCENTAGE' as DiscountType, isActive: true }}
          onFinish={(values) => saveMutation.mutate(values)}
        >
          <Form.Item name="code" label="Code" rules={[{ required: isNew }]}>
            <Input disabled={!isNew} />
          </Form.Item>
          <Form.Item name="name" label="Tên khuyến mãi" rules={[{ required: true }]}>
            <Input placeholder="VD: Giảm 10K đơn từ 120K" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="discountType" label="Loại" rules={[{ required: isNew }]}>
            <Select
              options={[
                { value: 'PERCENTAGE', label: 'Phần trăm' },
                { value: 'FIXED_AMOUNT', label: 'Số tiền' },
              ]}
            />
          </Form.Item>
          <Form.Item name="discountValue" label="Giá trị" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="minOrderValue" label="Giá trị đơn tối thiểu">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="maxDiscountValue" label="Giảm tối đa">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="usageLimit" label="Giới hạn lượt dùng">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="dateRange" label="Thời gian áp dụng">
            <DatePicker.RangePicker
              format={DISPLAY_DATE_TIME_FORMAT}
              showTime={{ format: 'HH:mm' }}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="isActive" label="Đang bật" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
            Lưu
          </Button>
        </Form>
      </Card>
    </Space>
  )
}

function formatPrice(value: number | string | undefined) {
  return Number(value ?? 0).toLocaleString('vi-VN') + ' đ'
}

function formatCouponDate(value?: string) {
  return value ? dayjs(value).format(DISPLAY_DATE_TIME_FORMAT) : 'Không giới hạn'
}

function formatCouponCondition(coupon: {
  minOrderValue?: number | string
  maxDiscountValue?: number | string
  usageLimit?: number
  usedCount: number
}) {
  const parts = []
  if (Number(coupon.minOrderValue ?? 0) > 0) {
    parts.push(`Đơn từ ${formatPrice(coupon.minOrderValue)}`)
  }
  if (Number(coupon.maxDiscountValue ?? 0) > 0) {
    parts.push(`Giảm tối đa ${formatPrice(coupon.maxDiscountValue)}`)
  }
  if (coupon.usageLimit) {
    parts.push(`Còn ${Math.max(0, coupon.usageLimit - coupon.usedCount).toLocaleString('vi-VN')} lượt`)
  }
  return parts.length ? parts.join(' - ') : 'Không giới hạn điều kiện'
}

function toPayload(values: CouponForm): CouponPayload {
  const { dateRange, ...rest } = values
  return {
    ...rest,
    startDate: dateRange?.[0]?.format(API_DATE_TIME_FORMAT),
    endDate: dateRange?.[1]?.format(API_DATE_TIME_FORMAT),
  }
}
