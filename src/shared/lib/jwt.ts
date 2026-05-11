/**
 * Decode JWT payload (KHÔNG verify). Dùng để đọc claim `role`, `permissions`, `userId`, `sub` ở FE.
 * Backend vẫn verify chữ ký RS256 ở mọi request — đây chỉ phục vụ điều hướng UI.
 */

export type JwtClaims = {
  sub: string
  userId?: number
  role?: string
  permissions?: string[]
  exp?: number
  iat?: number
}

function base64UrlDecode(input: string): string {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4))
  const base64 = (input + pad).replace(/-/g, '+').replace(/_/g, '/')
  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    )
  } catch {
    return atob(base64)
  }
}

export function decodeJwt(token: string): JwtClaims | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    return JSON.parse(base64UrlDecode(payload)) as JwtClaims
  } catch {
    return null
  }
}
