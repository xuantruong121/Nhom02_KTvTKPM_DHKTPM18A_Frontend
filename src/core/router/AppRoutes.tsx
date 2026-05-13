import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from '@/core/layouts/AdminLayout'
import PublicLayout from '@/core/layouts/PublicLayout'
import StaffLayout from '@/core/layouts/StaffLayout'
import ProtectedRoute from '@/core/router/ProtectedRoute'
import RoleRoute from '@/core/router/RoleRoute'
import AdminHomePage from '@/modules/admin/pages/AdminHomePage'
import AdminBooksPage from '@/modules/admin/pages/AdminBooksPage'
import AdminImportStocksPage from '@/modules/admin/pages/AdminImportStocksPage'
import AdminOrderDetailPage from '@/modules/admin/pages/AdminOrderDetailPage'
import AdminOrdersPage from '@/modules/admin/pages/AdminOrdersPage'
import AdminPromotionDetailPage from '@/modules/admin/pages/AdminPromotionDetailPage'
import AdminPromotionsPage from '@/modules/admin/pages/AdminPromotionsPage'
import AdminSuppliersPage from '@/modules/admin/pages/AdminSuppliersPage'
import AdminUsersPage from '@/modules/admin/pages/AdminUsersPage'
import AdminLoginPage from '@/modules/auth/pages/AdminLoginPage'
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
import { CheckoutPage } from '@/modules/order/pages/CheckoutPage'
import { MyOrdersPage } from '@/modules/order/pages/MyOrdersPage'
import { OrderDetailPage } from '@/modules/order/pages/OrderDetailPage'
import { PaymentResultPage } from '@/modules/order/pages/PaymentResultPage'
import { MyReturnsPage } from '@/modules/returns/pages/MyReturnsPage'
import StaffHomePage from '@/modules/staff/pages/StaffHomePage'
import StaffPurchaseOrdersPage from '@/modules/staff/pages/StaffPurchaseOrdersPage'
import StaffReturnRequestsPage from '@/modules/staff/pages/StaffReturnRequestsPage'
import StaffStockCheckPage from '@/modules/staff/pages/StaffStockCheckPage'
import ProfilePage from '@/modules/account/pages/ProfilePage'
import AddressPage from '@/modules/account/pages/AddressPage'

export default function AppRoutes() {
  return (
    <Routes>
      {/* ─── Auth (public) ─────────────────────────────────────── */}
      <Route path="/auth/admin-login" element={<AdminLoginPage />} />
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
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/result"
          element={<PaymentResultPage />}
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <MyOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/returns"
          element={
            <ProtectedRoute>
              <MyReturnsPage />
            </ProtectedRoute>
          }
        />
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
          <RoleRoute allowed={['ADMIN']} loginPath="/auth/admin-login">
            <AdminLayout />
          </RoleRoute>
        }
      >
        <Route index element={<AdminHomePage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="orders/:id" element={<AdminOrderDetailPage />} />
        <Route path="returns" element={<StaffReturnRequestsPage />} />
        <Route path="promotions" element={<AdminPromotionsPage />} />
        <Route path="promotions/:id" element={<AdminPromotionDetailPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="suppliers" element={<AdminSuppliersPage />} />
        <Route path="purchase-orders" element={<StaffPurchaseOrdersPage />} />
        <Route path="stock-check" element={<StaffStockCheckPage />} />
        <Route path="books" element={<AdminBooksPage />} />
        <Route path="inventory" element={<AdminImportStocksPage />} />
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
        <Route path="returns" element={<StaffReturnRequestsPage />} />
        <Route path="purchase-orders" element={<StaffPurchaseOrdersPage />} />
        <Route path="stock-check" element={<StaffStockCheckPage />} />
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
