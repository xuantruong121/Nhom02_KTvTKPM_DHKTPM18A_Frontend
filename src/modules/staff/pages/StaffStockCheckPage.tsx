import { App, Button, Card, Form, Input, InputNumber, Select, Space, Typography } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/modules/admin/api/adminApi'
import { invalidateCatalogStockCaches } from '@/modules/admin/utils/invalidateAdminCaches'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'

type StockCheckForm = {
  bookId: number
  adjustmentQuantity: number
  reason: string
}

export default function StaffStockCheckPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<StockCheckForm>()
  const booksQuery = useApiQuery(['admin', 'books'], () => adminApi.getBooks())
  const mutation = useApiMutation((values: StockCheckForm) => adminApi.confirmStockAdjustment(values), {
    onSuccess: async (result) => {
      void message.success(result || 'Đã ghi nhận chênh lệch kho')
      form.resetFields()
      await invalidateCatalogStockCaches(queryClient)
    },
  })

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Kiểm kho
      </Typography.Title>
      <Card>
        <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
          <Form.Item name="bookId" label="Book ID" rules={[{ required: true }]}>
            <Select
              showSearch
              loading={booksQuery.isLoading}
              optionFilterProp="label"
              options={(booksQuery.data ?? []).map((book) => ({
                value: book.id,
                label: `${book.title} - ${book.author}`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="adjustmentQuantity"
            label="Chênh lệch"
            tooltip="Số dương để tăng tồn, số âm để giảm tồn."
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="Lý do" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>
            Ghi nhận
          </Button>
        </Form>
      </Card>
    </Space>
  )
}
