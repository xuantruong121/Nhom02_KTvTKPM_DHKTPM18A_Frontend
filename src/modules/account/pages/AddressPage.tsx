import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Skeleton,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useApiQuery } from '@/shared/hooks/useApiQuery'
import { useApiMutation } from '@/shared/hooks/useApiQuery'
import {
  accountApi,
  type AddressDto,
  type AddressRequest,
  type AdministrativeProvinceDto,
} from '@/modules/account/api/accountApi'

const PROFILE_QUERY_KEY = ['account', 'profile']

type AddressFormValues = AddressRequest

function AddressModal({
  open,
  initial,
  defaults,
  addressUnits,
  onClose,
  onSave,
  saving,
}: {
  open: boolean
  initial?: AddressDto | null
  defaults?: { recipientName?: string; phoneNumber?: string }
  addressUnits: AdministrativeProvinceDto[]
  onClose: () => void
  onSave: (values: AddressRequest) => void
  saving: boolean
}) {
  const [form] = Form.useForm<AddressFormValues>()
  const selectedCity = Form.useWatch('city', form)
  const selectedProvince = addressUnits.find((province) => province.name === selectedCity)
  const wardOptions = selectedProvince?.wards ?? []

  useEffect(() => {
    if (open) {
      if (initial) {
        console.log('[FE] Opening AddressModal for EDIT with data:', initial)
        form.setFieldsValue({
          recipientName: initial.recipientName,
          phoneNumber: initial.phoneNumber,
          street: initial.street,
          ward: initial.ward,
          city: initial.city,
          isDefault: initial.isDefault,
        })
      } else {
        console.log('[FE] Opening AddressModal for CREATE')
        form.resetFields()
        form.setFieldsValue({
          recipientName: defaults?.recipientName,
          phoneNumber: defaults?.phoneNumber,
          isDefault: false,
        })
      }
    }
  }, [open, initial, defaults, form])

  const handleOk = async () => {
    const values = await form.validateFields()
    onSave(values)
  }

  return (
    <Modal
      open={open}
      title={initial ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
      onCancel={() => {
        form.resetFields()
        onClose()
      }}
      onOk={handleOk}
      okText={initial ? 'Lưu thay đổi' : 'Thêm địa chỉ'}
      cancelText="Hủy"
      confirmLoading={saving}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={
          initial
            ? {
                recipientName: initial.recipientName,
                phoneNumber: initial.phoneNumber,
                street: initial.street,
                ward: initial.ward,
                city: initial.city,
                isDefault: initial.isDefault,
              }
            : {
                recipientName: defaults?.recipientName,
                phoneNumber: defaults?.phoneNumber,
                isDefault: false,
              }
        }
      >
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              label="Tên người nhận"
              name="recipientName"
              rules={[{ required: true, message: 'Vui lòng nhập tên người nhận' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="VD: Nguyễn Văn A" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Số điện thoại"
              name="phoneNumber"
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="VD: 0901234567" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="Địa chỉ (số nhà, tên đường)"
              name="street"
              rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
            >
              <Input placeholder="VD: 616/61 Lê Đức Thọ" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Tỉnh / Thành phố"
              name="city"
              rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Chọn tỉnh/thành phố"
                options={addressUnits.map((province) => ({
                  value: province.name,
                  label: province.name,
                }))}
                onChange={(city) => {
                  form.setFieldsValue({ city, ward: undefined })
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Phường / Xã"
              name="ward"
              rules={[{ required: true, message: 'Vui lòng chọn phường/xã' }]}
            >
              <Select
                showSearch
                disabled={!selectedProvince}
                optionFilterProp="label"
                placeholder={selectedProvince ? 'Chọn phường/xã' : 'Chọn tỉnh/thành phố trước'}
                options={wardOptions.map((ward) => ({ value: ward.name, label: ward.name }))}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Đặt làm địa chỉ mặc định" name="isDefault" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

export default function AddressPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AddressDto | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const { data: profile, isLoading } = useApiQuery(PROFILE_QUERY_KEY, () => accountApi.getProfile())
  const { data: addressUnits = [] } = useApiQuery(['account', 'addressUnits'], () =>
    accountApi.getAddressUnits()
  )

  const addresses = profile?.addresses ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })

  const handleSave = async (values: AddressRequest) => {
    console.log('[FE] Starting handleSave with values:', values)
    setSaving(true)
    try {
      if (editTarget) {
        await accountApi.updateAddress(editTarget.id, values)
        void message.success('Cập nhật địa chỉ thành công')
      } else {
        await accountApi.addAddress(values)
        void message.success('Thêm địa chỉ thành công')
      }
      await invalidate()
      console.log('[FE] Address saved successfully, invalidated query')
      setModalOpen(false)
      setEditTarget(null)
    } catch (err) {
      console.error('[FE] Error saving address:', err)
      const msg = err instanceof Error ? err.message : 'Đã xảy ra lỗi'
      void message.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const deleteMutation = useApiMutation((id: number) => accountApi.deleteAddress(id), {
    showErrorMessage: true,
    onSuccess: () => {
      void message.success('Đã xóa địa chỉ')
      void invalidate()
    },
  })

  const confirmDelete = (id: number) => {
    setDeleteId(id)
    Modal.confirm({
      title: 'Xác nhận xóa địa chỉ',
      content: 'Bạn có chắc muốn xóa địa chỉ này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        await deleteMutation.mutateAsync(id)
        setDeleteId(null)
      },
      onCancel: () => setDeleteId(null),
    })
  }

  return (
    <div style={{ maxWidth: 700, margin: '32px auto' }}>
      <Card
        title={
          <Space>
            <EnvironmentOutlined />
            <span>Địa chỉ nhận hàng</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditTarget(null)
              setModalOpen(true)
            }}
          >
            Thêm địa chỉ
          </Button>
        }
        style={{ boxShadow: '0 4px 20px rgba(15,23,42,0.06)' }}
      >
        <div style={{ marginBottom: 16 }}>
          <Link to="/profile">
            <Button icon={<ArrowLeftOutlined />} type="text">
              Quay lại hồ sơ
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : addresses.length === 0 ? (
          <Alert
            type="info"
            message="Bạn chưa có địa chỉ nhận hàng nào"
            description="Nhấn 'Thêm địa chỉ' để thêm địa chỉ giao hàng đầu tiên."
            showIcon
          />
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            {addresses.map((addr) => (
              <Card
                key={addr.id}
                size="small"
                style={{
                  borderColor: addr.isDefault ? '#1d4ed8' : undefined,
                  background: addr.isDefault ? '#eff6ff' : '#fafafa',
                }}
                actions={[
                  <Button
                    key="edit"
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditTarget(addr)
                      setModalOpen(true)
                    }}
                  >
                    Sửa
                  </Button>,
                  <Button
                    key="delete"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    loading={deleteMutation.isPending && deleteId === addr.id}
                    onClick={() => confirmDelete(addr.id)}
                  >
                    Xóa
                  </Button>,
                ]}
              >
                <Space direction="vertical" size={2}>
                  <Space>
                    <Typography.Text strong>
                      {addr.recipientName || profile?.fullName || 'Người nhận'}
                    </Typography.Text>
                    {addr.isDefault && <Tag color="blue">Mặc định</Tag>}
                  </Space>
                  <Typography.Text type="secondary">
                    {addr.phoneNumber || profile?.phoneNumber || 'Chưa có số điện thoại'}
                  </Typography.Text>
                  <Typography.Text>
                    {addr.street}, {addr.ward}
                  </Typography.Text>
                  <Typography.Text type="secondary">{addr.city}</Typography.Text>
                </Space>
              </Card>
            ))}
          </Space>
        )}
      </Card>

      <AddressModal
        open={modalOpen}
        initial={editTarget}
        defaults={{ recipientName: profile?.fullName, phoneNumber: profile?.phoneNumber }}
        addressUnits={addressUnits}
        onClose={() => {
          setModalOpen(false)
          setEditTarget(null)
        }}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  )
}
