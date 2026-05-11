import { Spin } from 'antd'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthInitializing, useIsAuthenticated } from '@/shared/store/authStore'

type Props = {
  children: ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const isInitializing = useAuthInitializing()
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()

  if (isInitializing) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '40vh' }}>
        <Spin />
      </div>
    )
  }
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}
