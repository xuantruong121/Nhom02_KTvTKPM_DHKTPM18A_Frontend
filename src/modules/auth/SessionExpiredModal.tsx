import { Modal } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SESSION_EXPIRED_EVENT } from '@/shared/auth/sessionExpiredEvent'

export default function SessionExpiredModal() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleSessionExpired = () => setOpen(true)
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
  }, [])

  const closeAndGoHome = () => {
    setOpen(false)
    navigate('/', { replace: true })
  }

  const closeAndGoLogin = () => {
    setOpen(false)
    navigate('/auth/login', { replace: true })
  }

  return (
    <Modal
      title="Phiên đăng nhập đã hết hạn"
      open={open}
      okText="Đăng nhập"
      cancelText="Hủy"
      closable={false}
      maskClosable={false}
      onOk={closeAndGoLogin}
      onCancel={closeAndGoHome}
    >
      Phiên đăng nhập đã hết hạn vui lòng đăng nhập lại.
    </Modal>
  )
}
