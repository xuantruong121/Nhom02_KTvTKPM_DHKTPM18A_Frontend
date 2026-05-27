import { Spin } from 'antd'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { homePathForRole } from '@/modules/auth/utils/roleRedirect'
import { useAuthInitializing, useAuthUser } from '@/shared/store/authStore'

type Props = {
  children: ReactNode
}

export default function ProtectedRoute({ children }: Props) {
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
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
  }
  if (user.role !== 'CUSTOMER') {
    return <Navigate to={homePathForRole(user.role)} replace />
  }
  return <>{children}</>
}
