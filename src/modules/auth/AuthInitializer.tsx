import { BookOutlined } from '@ant-design/icons'
import { Spin, Typography } from 'antd'
import { useEffect, type ReactNode } from 'react'
import { useAuthInitializing, useAuthStore } from '@/shared/store/authStore'

type Props = { children: ReactNode }

/**
 * Effect-only component: gọi `authStore.initialize()` 1 lần khi app mount.
 * - KHÔNG sinh ra Context Provider -> không gây re-render cascade.
 * - Block render bằng splash khi `isInitializing` (chỉ true khi có session hint)
 *   để tránh "flash of guest UI" lúc F5 trong khi đang gọi `/auth/refresh`.
 */
export default function AuthInitializer({ children }: Props) {
  const initialize = useAuthStore((s) => s.initialize)
  const isInitializing = useAuthInitializing()

  useEffect(() => {
    void initialize()
  }, [initialize])

  if (isInitializing) {
    return <SessionRestoringSplash />
  }
  return <>{children}</>
}

function SessionRestoringSplash() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(135deg, #eff6ff 0%, #faf5ff 100%)',
        zIndex: 2000,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <BookOutlined style={{ fontSize: 40, color: '#1d4ed8' }} />
        <Typography.Title level={4} style={{ marginTop: 12, marginBottom: 4 }}>
          SEBook
        </Typography.Title>
        <Spin />
        <Typography.Paragraph
          type="secondary"
          style={{ marginTop: 12, marginBottom: 0, fontSize: 13 }}
        >
          Đang khôi phục phiên đăng nhập…
        </Typography.Paragraph>
      </div>
    </div>
  )
}
