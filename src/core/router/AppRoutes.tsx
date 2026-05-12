import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from '@/core/layouts/AdminLayout'
import PublicLayout from '@/core/layouts/PublicLayout'
import StaffLayout from '@/core/layouts/StaffLayout'
import ProtectedRoute from '@/core/router/ProtectedRoute'
import RoleRoute from '@/core/router/RoleRoute'
import AdminHomePage from '@/modules/admin/pages/AdminHomePage'
import LoginPage from '@/modules/auth/pages/LoginPage'
import RegisterPage from '@/modules/auth/pages/RegisterPage'
import ForgotPasswordPage from '@/modules/auth/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/modules/auth/pages/ResetPasswordPage'
import ChangePasswordPage from '@/modules/auth/pages/ChangePasswordPage'
import { CartPage } from '@/modules/cart/pages/CartPage'
import NotFoundPage from '@/modules/common/pages/NotFoundPage'
import { HomePage } from '@/modules/home/pages/HomePage'
import { BookDetailPage } from '@/modules/catalog/pages/BookDetailPage'
import { BooksPage } from '@/modules/catalog/pages/BooksPage'
import StaffHomePage from '@/modules/staff/pages/StaffHomePage'
import ProfilePage from '@/modules/account/pages/ProfilePage'
import AddressPage from '@/modules/account/pages/AddressPage'

export default function AppRoutes() {
  return (
    <Routes>
      {/* ─── Auth (public) ─────────────────────────────────────── */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route
        path="/admin/login"
        element={
          <LoginPage
            title="Đăng nhập Admin"
            subtitle="SEBook Admin - khu vực quản trị hệ thống"
            allowedRoles={['ADMIN']}
            defaultRedirect="/admin"
            showRegisterLink={false}
          />
        }
      />
      <Route
        path="/staff/login"
        element={
          <LoginPage
            title="Đăng nhập Staff"
            subtitle="SEBook Staff - khu vực vận hành bán hàng và kho"
            allowedRoles={['STAFF_SELLER', 'STAFF_WAREHOUSE']}
            defaultRedirect="/staff"
            showRegisterLink={false}
          />
        }
      />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

      {/* ─── Customer / public (có header chung) ──────────────── */}
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />
        {/* TODO: /checkout ... */}
      </Route>

      {/* ─── Profile (user đã đăng nhập) ──────────────────────── */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <PublicLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ProfilePage />} />
        <Route path="addresses" element={<AddressPage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
      </Route>

      {/* ─── Admin ────────────────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <RoleRoute allowed={['ADMIN']} loginPath="/admin/login">
            <AdminLayout />
          </RoleRoute>
        }
      >
        <Route index element={<AdminHomePage />} />
        {/* TODO: nested admin pages */}
      </Route>

      {/* ─── Staff (cả SELLER và WAREHOUSE) ───────────────────── */}
      <Route
        path="/staff"
        element={
          <RoleRoute allowed={['STAFF_SELLER', 'STAFF_WAREHOUSE']} loginPath="/staff/login">
            <StaffLayout />
          </RoleRoute>
        }
      >
        <Route index element={<StaffHomePage />} />
        {/* TODO: nested staff pages */}
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
