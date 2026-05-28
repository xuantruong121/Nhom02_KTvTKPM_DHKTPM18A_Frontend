import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { authApi } from '@/modules/auth/api/authApi'
import type {
  AuthUser,
  LoginRequest,
  RegisterRequest,
  UserRole,
} from '@/modules/auth/types'
import { notifySessionExpired } from '@/shared/auth/sessionExpiredEvent'
import { decodeJwt } from '@/shared/lib/jwt'

/**
 * Auth store - Zustand
 *
 * Trạng thái:
 * - `accessToken`: chỉ giữ trong RAM (không persist). Reload trang -> mất.
 * - `user`: decode từ JWT.
 * - `isInitializing`: true khi đang gọi `/auth/refresh` lần đầu để khôi phục phiên.
 *   - **Initial value = `hasSessionHint()`**: nếu chưa từng login thì `false` ngay từ đầu
 *     -> AuthInitializer render thẳng children, không có splash chớp lên.
 *
 * Session hint:
 * - `localStorage.sebook_session=1` khi đã login thành công.
 * - Cờ KHÔNG nhạy cảm -> chỉ để FE biết "có thể có cookie refresh trên server".
 * - Tránh gọi `/auth/refresh` 401 mỗi lần mở app khi chưa từng đăng nhập.
 *
 * Mutex `initInFlight`:
 * - React StrictMode (dev) double-mount effect -> `initialize()` chạy 2 lần.
 * - Nếu cả 2 cùng gọi `/auth/refresh` đồng thời với cùng cookie:
 *     Request 1 đổi refresh A->B (rotation). Request 2 vẫn gửi A (vì cookie B chưa set xong).
 *     Backend coi A là token đã dùng (reuse detection) -> revoke cả family -> user bị logout.
 * - Mutex đảm bảo chỉ chạy đúng 1 lần dù effect chạy bao nhiêu lần.
 *
 * Refresh-once mutex (http.ts interceptor):
 * - Tránh nhiều request 401 đồng thời cùng kích `/auth/refresh`.
 */

const SESSION_HINT_KEY = 'sebook_session'

function setSessionHint() {
  try {
    localStorage.setItem(SESSION_HINT_KEY, '1')
  } catch {
    // ignore quota / privacy mode
  }
}

function clearSessionHint() {
  try {
    localStorage.removeItem(SESSION_HINT_KEY)
  } catch {
    // ignore
  }
}

export function hasSessionHint(): boolean {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === '1'
  } catch {
    return false
  }
}

function decodeAuthUser(token: string | null): AuthUser | null {
  if (!token) return null
  const claims = decodeJwt(token)
  if (!claims) return null
  return {
    userId: typeof claims.userId === 'number' ? claims.userId : null,
    email: claims.sub,
    fullName: typeof claims.fullName === 'string' ? claims.fullName : undefined,
    role: (claims.role as UserRole) ?? 'GUEST',
    permissions: Array.isArray(claims.permissions) ? claims.permissions : [],
  }
}

type AuthState = {
  accessToken: string | null
  user: AuthUser | null
  isInitializing: boolean
  hasInitialized: boolean
}

type AuthActions = {
  /** Ghi đè access token (null = clear). Tự decode user, tự set/clear session hint. */
  setAccessToken: (token: string | null) => void
  /** Xoá token + user + session hint. Dùng khi logout hoặc refresh fail. */
  clearAuth: () => void
  /** Gọi 1 lần khi app mount: thử refresh nếu có session hint. Idempotent + mutex. */
  initialize: () => Promise<void>
  /** Login flow: gọi API, set token, trả về user mới (để page redirect). */
  login: (payload: LoginRequest) => Promise<AuthUser>
  /** Register Customer. KHÔNG auto-login: chỉ gọi API. */
  register: (payload: RegisterRequest) => Promise<void>
  /** Logout: gọi API, clear state cục bộ. */
  logout: () => Promise<void>
}

// Mutex ngoài store (module-scoped) - không cần expose ra ngoài
let initInFlight: Promise<void> | null = null

// Tính trước initial value để không gây flash UI
const INITIAL_IS_INITIALIZING = hasSessionHint()

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  accessToken: null,
  user: null,
  isInitializing: INITIAL_IS_INITIALIZING,
  hasInitialized: false,

  setAccessToken: (token) => {
    const user = decodeAuthUser(token)
    if (token) setSessionHint()
    else clearSessionHint()
    set({ accessToken: token, user })
  },

  clearAuth: () => {
    clearSessionHint()
    set({ accessToken: null, user: null })
  },

  initialize: async () => {
    // Đã init xong rồi (vd: navigate giữa các route mà AuthInitializer remount)
    if (get().hasInitialized) return
    // Đang init -> chia sẻ promise (StrictMode double-mount)
    if (initInFlight) return initInFlight

    initInFlight = (async () => {
      try {
        if (get().accessToken) return
        if (!hasSessionHint()) return
        try {
          const tokens = await authApi.refresh()
          get().setAccessToken(tokens.accessToken)
        } catch {
          // refresh cookie không còn hợp lệ -> dọn dẹp
          get().clearAuth()
          notifySessionExpired()
        }
      } finally {
        set({ isInitializing: false, hasInitialized: true })
        initInFlight = null
      }
    })()
    return initInFlight
  },

  login: async (payload) => {
    const tokens = await authApi.login(payload)
    get().setAccessToken(tokens.accessToken)
    const user = get().user
    if (!user) throw new Error('Token đăng nhập không hợp lệ')
    return user
  },

  register: async (payload) => {
    // KHÔNG set access token: register-only flow.
    // Backend vẫn set cookie refreshToken; lần F5 tiếp theo AuthInitializer
    // sẽ KHÔNG gọi refresh vì session hint chưa được set.
    await authApi.register(payload)
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore: vẫn clear state phía client
    } finally {
      get().clearAuth()
    }
  },
}))

// =================== Selector hooks (re-render hẹp) ===================

/** Trả về object {user, isAuthenticated, isInitializing, login, register, logout} bằng shallow compare. */
export function useAuth() {
  return useAuthStore(
    useShallow((s) => ({
      user: s.user,
      isAuthenticated: s.user !== null,
      isInitializing: s.isInitializing,
      login: s.login,
      register: s.register,
      logout: s.logout,
    }))
  )
}

export const useAuthUser = () => useAuthStore((s) => s.user)
export const useIsAuthenticated = () => useAuthStore((s) => s.user !== null)
export const useAuthInitializing = () => useAuthStore((s) => s.isInitializing)
