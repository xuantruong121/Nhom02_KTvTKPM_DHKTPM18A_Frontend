import { Spin } from 'antd'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { UserRole } from '@/modules/auth/types'
import { homePathForRole } from '@/modules/auth/utils/roleRedirect'
import { useAuthInitializing, useAuthUser } from '@/shared/store/authStore'

type Props = {
  allowed: UserRole[]
  children: ReactNode
  loginPath?: string
}

export default function RoleRoute({ allowed, children, loginPath = '/auth/login' }: Props) {
  const isInitializing = useAuthInitializing()
  const user = useAuthUser()
  const location = useLocation()

  if (isInitializing) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '40vh' }}>
        <Spin />
      </div>
    )
  }
  if (!user) {
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />
  }
  if (!allowed.includes(user.role)) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }
  return <>{children}</>
}
