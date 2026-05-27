import type { UserRole } from '@/modules/auth/types'

/** Đích redirect mặc định sau khi login dựa trên role. */
export function homePathForRole(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return '/admin'
    case 'STAFF_SELLER':
    case 'STAFF_WAREHOUSE':
      return '/staff'
    case 'CUSTOMER':
    default:
      return '/'
  }
}

export function isStaff(role: UserRole): boolean {
  return role === 'STAFF_SELLER' || role === 'STAFF_WAREHOUSE'
}

export function isPathAllowedForRoles(path: string | undefined, roles: UserRole[]): boolean {
  if (!path) return false
  if (roles.includes('ADMIN')) return path === '/admin' || path.startsWith('/admin/')
  if (roles.some(isStaff)) return path === '/staff' || path.startsWith('/staff/')
  if (roles.includes('CUSTOMER')) return !path.startsWith('/admin') && !path.startsWith('/staff')
  return false
}
