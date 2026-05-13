import { Form, Input, InputNumber, Modal, Select, Upload } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { useEffect, useState } from 'react'
import type { AdminBook, BookPayload, Category } from '@/modules/admin/api/adminApi'

type Props = {
  open: boolean
  book?: AdminBook | null
  categories: Category[]
  loading?: boolean
  onCancel: () => void
  onSubmit: (payload: BookPayload) => void
}

type BookForm = Omit<BookPayload, 'image'> & {
  image?: UploadFile[]
}

export default function StaffBookModal({ open, book, categories, loading, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<BookForm>()
  const [fileList, setFileList] = useState<UploadFile[]>([])

  useEffect(() => {
    if (!open) return
    if (book) {
      form.setFieldsValue({
        title: book.title,
        author: book.author,
        description: book.description,
        price: Number(book.price),
        originalPrice: book.originalPrice ? Number(book.originalPrice) : undefined,
        quantity: book.quantity,
        categoryIds: book.categoryIds,
        publisher: book.publisher,
        isbn: book.isbn,
        publicationYear: book.publicationYear,
        language: book.language,
        pageCount: book.pageCount,
        coverType: book.coverType,
      })
    } else {
      form.resetFields()
    }
    setFileList([])
  }, [book, form, open])

  return (
    <Modal
      title={book ? 'Cập nhật sách' : 'Tạo sách'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={760}
      style={{ top: 24 }}
      styles={{ body: { maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', paddingRight: 12 } }}
    >
      <Form form={form} layout="vertical" onFinish={(values) => onSubmit(toPayload(values, fileList))}>
        <Form.Item name="title" label="Tên sách" rules={[{ required: !book }]}>
          <Input />
        </Form.Item>
        <Form.Item name="author" label="Tác giả" rules={[{ required: !book }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="price" label="Giá" rules={[{ required: !book }]}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="originalPrice" label="Giá gốc">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="quantity" label="Số lượng" rules={[{ required: !book }]}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="categoryIds" label="Danh mục" rules={[{ required: !book }]}>
          <Select
            mode="multiple"
            options={categories.map((category) => ({ value: category.id, label: category.name }))}
          />
        </Form.Item>
        <Form.Item label="Ảnh bìa">
          <Upload
            beforeUpload={() => false}
            fileList={fileList}
            maxCount={1}
            listType="picture"
            onChange={({ fileList: next }) => setFileList(next)}
          >
            <Input readOnly value="Chọn ảnh" />
          </Upload>
        </Form.Item>
        <Form.Item name="publisher" label="Nhà xuất bản">
          <Input />
        </Form.Item>
        <Form.Item name="isbn" label="ISBN">
          <Input />
        </Form.Item>
        <Form.Item name="publicationYear" label="Năm xuất bản">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="language" label="Ngôn ngữ">
          <Input />
        </Form.Item>
        <Form.Item name="pageCount" label="Số trang">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="coverType" label="Loại bìa">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}

function toPayload(values: BookForm, fileList: UploadFile[]): BookPayload {
  return {
    ...values,
    image: fileList[0]?.originFileObj,
  }
}
