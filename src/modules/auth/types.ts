/** Khớp với enum `Role` ở backend (`modules/auth/domain/Role.java`). */
export type UserRole = 'ADMIN' | 'STAFF_SELLER' | 'STAFF_WAREHOUSE' | 'CUSTOMER' | 'GUEST'

/** Khớp với `AuthUseCase.TokenPair` ở backend. */
export type TokenPair = {
  accessToken: string
  refreshToken?: string // BE đã set cookie HttpOnly, FE không dùng giá trị này
  deviceId?: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  email: string
  password: string
  fullName: string
}

export type AuthUser = {
  userId: number | null
  email: string
  fullName?: string
  role: UserRole
  permissions: string[]
}
