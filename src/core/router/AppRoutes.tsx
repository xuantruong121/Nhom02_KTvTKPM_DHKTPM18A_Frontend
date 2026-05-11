import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from '@/core/layouts/AdminLayout'
import PublicLayout from '@/core/layouts/PublicLayout'
import StaffLayout from '@/core/layouts/StaffLayout'
import ProtectedRoute from '@/core/router/ProtectedRoute'
import RoleRoute from '@/core/router/RoleRoute'
import AdminHomePage from '@/modules/admin/pages/AdminHomePage'
import LoginPage from '@/modules/auth/pages/LoginPage'
import RegisterPage from '@/modules/auth/pages/RegisterPage'
import NotFoundPage from '@/modules/common/pages/NotFoundPage'
import { HomePage } from '@/modules/home/pages/HomePage'
import StaffHomePage from '@/modules/staff/pages/StaffHomePage'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth (public) */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />

      {/* Customer / public (có header chung) */}
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        {/* TODO: /books, /books/:id, /cart, /checkout ... */}
      </Route>

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <RoleRoute allowed={['ADMIN']}>
            <AdminLayout />
          </RoleRoute>
        }
      >
        <Route index element={<AdminHomePage />} />
        {/* TODO: nested admin pages */}
      </Route>

      {/* Staff (cả SELLER và WAREHOUSE) */}
      <Route
        path="/staff"
        element={
          <RoleRoute allowed={['STAFF_SELLER', 'STAFF_WAREHOUSE']}>
            <StaffLayout />
          </RoleRoute>
        }
      >
        <Route index element={<StaffHomePage />} />
        {/* TODO: nested staff pages */}
      </Route>

      {/* Ví dụ route private cho mọi user đã login (sau này): /profile */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <PublicLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<div>Profile (placeholder)</div>} />
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
