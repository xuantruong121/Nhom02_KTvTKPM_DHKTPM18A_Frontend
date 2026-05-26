import {
  App,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { matchesKeyword } from '@/modules/admin/utils/search'
import { catalogApi, type Category, type CategoryPayload } from '@/modules/catalog/api/catalogApi'
import { useApiMutation, useApiQuery } from '@/shared/hooks/useApiQuery'

type CategoryManagementPageProps = {
  area: 'admin' | 'staff'
}

function isCategoryActive(category: Category) {
  return category.active ?? category.isActive ?? true
}

export default function CategoryManagementPage({ area }: CategoryManagementPageProps) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [keyword, setKeyword] = useState('')
  const [form] = Form.useForm<CategoryPayload>()

  const categoriesQuery = useApiQuery([area, 'categories'], () => catalogApi.getCategories())

  useEffect(() => {
    if (!open) return
    form.setFieldsValue({ name: editingCategory?.name ?? '' })
  }, [editingCategory, form, open])

  const invalidateCategories = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] }),
      queryClient.invalidateQueries({ queryKey: ['staff', 'categories'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookCategories'] }),
      queryClient.invalidateQueries({ queryKey: ['catalog', 'categories'] }),
      queryClient.invalidateQueries({ queryKey: ['catalog', 'books'] }),
    ])
  }

  const saveMutation = useApiMutation(
    (payload: CategoryPayload) =>
      editingCategory
        ? catalogApi.updateCategory(editingCategory.id, payload)
        : catalogApi.createCategory(payload),
    {
      onSuccess: async () => {
        void message.success(editingCategory ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục')
        setOpen(false)
        setEditingCategory(null)
        form.resetFields()
        await invalidateCategories()
      },
    }
  )

  const deleteMutation = useApiMutation((id: number) => catalogApi.deleteCategory(id), {
    onSuccess: async () => {
      void message.success('Đã xóa danh mục')
      await invalidateCategories()
    },
  })

  const sortedCategories = useMemo(
    () =>
      [...(categoriesQuery.data ?? [])]
        .filter((category) =>
          matchesKeyword(
            keyword,
            category.id,
            category.name,
            isCategoryActive(category) ? 'active' : 'inactive'
          )
        )
        .sort((left, right) => left.name.localeCompare(right.name, 'vi')),
    [categoriesQuery.data, keyword]
  )

  const columns: ColumnsType<Category> = [
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      render: (name: string) => <Typography.Text strong>{name}</Typography.Text>,
    },
    {
      title: 'Trạng thái',
      width: 140,
      render: (_, category) =>
        isCategoryActive(category) ? (
          <Tag color="green">Đang bán</Tag>
        ) : (
          <Tag color="red">Đã ẩn</Tag>
        ),
    },
    {
      title: '',
      width: 160,
      render: (_, category) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setEditingCategory(category)
              setOpen(true)
            }}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa danh mục?"
            description={`Danh mục "${category.name}" sẽ bị xóa khỏi hệ thống.`}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
            onConfirm={() => deleteMutation.mutate(category.id)}
          >
            <Button danger size="small">
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Danh mục sách
        </Typography.Title>
        <Button
          type="primary"
          onClick={() => {
            setEditingCategory(null)
            form.resetFields()
            setOpen(true)
          }}
        >
          Tạo danh mục
        </Button>
      </Space>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input.Search
            allowClear
            placeholder="Tim theo ten danh muc"
            style={{ maxWidth: 320 }}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Table
            rowKey="id"
            columns={columns}
            dataSource={sortedCategories}
            loading={categoriesQuery.isLoading}
            pagination={{ pageSize: 10 }}
          />
        </Space>
      </Card>

      <Modal
        title={editingCategory ? 'Sửa danh mục' : 'Tạo danh mục'}
        open={open}
        onCancel={() => {
          setOpen(false)
          setEditingCategory(null)
        }}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        okText={editingCategory ? 'Lưu' : 'Tạo'}
        cancelText="Hủy"
        style={{ top: 24 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => saveMutation.mutate({ name: values.name.trim() })}
        >
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[
              { required: true, whitespace: true, message: 'Tên danh mục không được để trống' },
              { max: 120, message: 'Tên danh mục tối đa 120 ký tự' },
            ]}
          >
            <Input placeholder="Ví dụ: Văn học Việt Nam" maxLength={120} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}
