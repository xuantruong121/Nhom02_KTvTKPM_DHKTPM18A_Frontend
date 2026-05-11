# SEBook Frontend (Nhóm 02)

Ứng dụng web **React 19 + Vite 8 + TypeScript + Ant Design 5**, modular theo feature.

## Yêu cầu

- Node.js **20+** (khuyến nghị LTS)
- npm **10+**

## Cài đặt nhanh

```bash
cd Nhom02_KTvTKPM_DHKTPM18A_Frontend
cp .env.example .env
npm install
npm run dev
```

Mở [http://localhost:5173](http://localhost:5173). API backend mặc định được proxy qua Vite: `/api` → `http://localhost:8080` (`vite.config.ts`).

## Biến môi trường

| Biến | Mô tả |
|------|--------|
| `VITE_API_BASE_URL` | Prefix gọi REST. Dev: `/api/v1` (qua proxy). Prod cross-origin: URL đầy đủ. |

`.env` đã được `.gitignore`, KHÔNG commit. Mọi dev tự copy từ `.env.example`.

## Scripts

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Dev server HMR |
| `npm run build` | TypeScript check + bundle production |
| `npm run preview` | Preview bản build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (write) |
| `npm run format:check` | Prettier check (CI) |

## Cấu trúc thư mục

```
src/
├── app/
│   ├── providers/AppProviders.tsx   # AntdConfig + QueryClient + Router + AuthInitializer
│   └── theme.ts                     # AntD theme tokens (primary, radius, ...)
├── core/
│   ├── layouts/                     # PublicLayout / AdminLayout / StaffLayout
│   └── router/                      # AppRoutes, ProtectedRoute, RoleRoute
├── modules/
│   ├── auth/                        # AuthInitializer, login/register pages, jwt helpers
│   ├── home/                        # Trang chủ Customer
│   ├── admin/                       # Khu vực Admin
│   ├── staff/                       # Khu vực Staff (Seller / Warehouse)
│   └── common/                      # 404, shared pages
├── shared/
│   ├── api/                         # axios http, deviceId, types
│   ├── store/                       # Zustand: authStore, uiStore
│   ├── config/env.ts
│   ├── lib/                         # jwt decode, queryClient
│   └── styles/global.css
├── App.tsx
├── main.tsx
└── vite-env.d.ts
```

## State management — Zustand

Toàn bộ state client-side dùng **Zustand** (không Redux, không Context Provider sâu).
Server state vẫn dùng **TanStack Query** (cache, refetch, mutation).

| Store | Mục đích | Persist |
|-------|----------|---------|
| `shared/store/authStore.ts` | `accessToken` (RAM), `user`, `isInitializing`, actions `login/register/logout/initialize` | **Không** persist token. Chỉ persist `sebook_session` flag (không nhạy cảm) để biết có thể gọi `/auth/refresh`. |
| `shared/store/uiStore.ts` | `siderCollapsed`, `themeMode` | localStorage `sebook_ui` |

### Selector hẹp (tránh re-render thừa)

```tsx
import { useAuthUser, useIsAuthenticated } from '@/shared/store/authStore'

const user = useAuthUser()                  // chỉ re-render khi user đổi
const isAuth = useIsAuthenticated()         // chỉ re-render khi auth state đổi
```

Cần nhiều trường cùng lúc + ổn định identity → dùng `useShallow`:

```tsx
import { useShallow } from 'zustand/react/shallow'
import { useAuthStore } from '@/shared/store/authStore'

const { user, logout } = useAuthStore(useShallow((s) => ({ user: s.user, logout: s.logout })))
```

Hoặc dùng `useAuth()` đã wrap sẵn `useShallow` cho 6 trường phổ biến.

### Truy cập store ngoài React (interceptor, util)

```ts
import { useAuthStore } from '@/shared/store/authStore'

const token = useAuthStore.getState().accessToken
useAuthStore.getState().setAccessToken(newToken)
```

## Auth & token (KHÔNG dùng localStorage cho token)

Backend (Spring) là **JWT stateless** + **refresh token HttpOnly cookie**. FE tuân theo:

- **`accessToken`**: lưu **trong RAM** (Zustand `authStore.accessToken`) — `http` interceptor đọc để gắn `Authorization: Bearer ...`.
- **`refreshToken`**: BE đã set vào cookie **HttpOnly** (FE không đụng được). Mỗi lần gọi `/api/v1/auth/refresh` axios tự đính kèm cookie nhờ `withCredentials: true`.
- **Reload trang**: accessToken mất → `AuthInitializer` gọi `authStore.initialize()` → nếu có `sebook_session` flag mới gọi `/auth/refresh` để khôi phục.
- **401 trong API call**: interceptor gọi `/auth/refresh` (mutex 1 lần), retry request gốc.
- **`X-Device-ID`**: UUID lưu `localStorage` (không nhạy cảm) — BE cần để hỗ trợ multi-device.
- **Session hint**: localStorage `sebook_session=1` (đã/đang có phiên trên server). Logout / refresh fail sẽ xoá.

→ **Không** lưu access/refresh vào `localStorage`/`sessionStorage` → chống XSS đọc credential.

## Phân quyền route

| Route | Yêu cầu |
|-------|---------|
| `/auth/login`, `/auth/register` | Public (Guest) |
| `/` (Customer home), `/books/*` | Public xem được; mua cần đăng nhập |
| `/admin/*` | Role `ADMIN` (`RoleRoute allowed={['ADMIN']}`) |
| `/staff/*` | Role `STAFF_SELLER` hoặc `STAFF_WAREHOUSE` |
| `/profile` | Bất kỳ user đã đăng nhập (`ProtectedRoute`) |

Sau khi đăng nhập, app tự redirect theo role (`@/modules/auth/utils/roleRedirect.ts`):

- `CUSTOMER` → `/`
- `ADMIN` → `/admin`
- `STAFF_*` → `/staff`

## Đăng ký

`/auth/register` **chỉ tạo tài khoản CUSTOMER**. Backend mặc định gán role này cho luồng đăng ký công khai. Tài khoản Admin/Staff phải do Admin tạo trong dashboard (sẽ làm sau).

## Quy ước khi thêm module mới

Ví dụ tạo module `purchase-order` cho Staff:

```
src/modules/purchase-order/
├── api/purchaseOrderApi.ts        # gọi REST qua @/shared/api/http
├── hooks/usePurchaseOrders.ts     # useQuery/useMutation (TanStack Query)
├── pages/PurchaseOrderListPage.tsx
├── pages/PurchaseOrderDetailPage.tsx
├── components/                    # UI riêng của module
└── types.ts
```

1. Đăng ký page trong `core/router/AppRoutes.tsx` dưới layout phù hợp (`AdminLayout` / `StaffLayout`).
2. **Không** import nội bộ giữa các module với nhau; chỉ dùng `@/shared/*`.
3. Type response khớp DTO của Backend (`PurchaseOrderResponse`, `SupplierResponse`, …).
4. Mọi call API đi qua `http` của `@/shared/api/http` (đã có Bearer + refresh interceptor + device id).

## Tài liệu API backend

Tham chiếu `../api_documentation.md` cho danh sách endpoint + role + schema.
