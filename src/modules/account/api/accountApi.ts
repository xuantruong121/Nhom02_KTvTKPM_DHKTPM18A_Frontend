/**
 * Account API — khớp với AccountController ở backend.
 *
 * Endpoints:
 *  GET  /api/v1/accounts/profile
 *  POST /api/v1/accounts/profile   (multipart: phoneNumber?, avatar?)
 *  POST /api/v1/accounts/address
 *  PUT  /api/v1/accounts/address/{id}
 *  DELETE /api/v1/accounts/address/{id}
 */
import { http, unwrapApi } from '@/shared/api/http'
import type { ApiResponse } from '@/shared/api/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AddressDto = {
  id: number
  recipientName?: string
  phoneNumber?: string
  street: string
  ward: string
  city: string
  isDefault: boolean
}

export type ProfileDto = {
  fullName: string
  email: string
  role: string
  phoneNumber?: string
  avatarUrl?: string
  addresses: AddressDto[]
}

export type UpdateProfileRequest = {
  phoneNumber?: string
  avatar?: File
}

export type AddressRequest = {
  recipientName: string
  phoneNumber: string
  street: string
  ward: string
  city: string
  isDefault: boolean
}

export type AdministrativeWardDto = {
  code: string
  name: string
  provinceCode?: string
}

export type AdministrativeProvinceDto = {
  code: string
  name: string
  wards?: AdministrativeWardDto[]
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const accountApi = {
  /** GET /api/v1/accounts/profile */
  getProfile(): Promise<ProfileDto> {
    return unwrapApi(http.get<ApiResponse<ProfileDto>>('/accounts/profile'))
  },

  /** GET /api/v1/accounts/address-units */
  getAddressUnits(): Promise<AdministrativeProvinceDto[]> {
    return unwrapApi(http.get<ApiResponse<AdministrativeProvinceDto[]>>('/accounts/address-units'))
  },

  /** POST /api/v1/accounts/profile — multipart/form-data */
  updateProfile(data: UpdateProfileRequest): Promise<{ avatarUrl?: string }> {
    const form = new FormData()
    if (data.phoneNumber) form.append('phoneNumber', data.phoneNumber)
    if (data.avatar) form.append('avatar', data.avatar)
    return unwrapApi(
      http.post<ApiResponse<{ avatarUrl?: string }>>('/accounts/profile', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    )
  },

  /** POST /api/v1/accounts/address */
  addAddress(payload: AddressRequest): Promise<void> {
    return unwrapApi(http.post<ApiResponse<void>>('/accounts/address', payload))
  },

  /** PUT /api/v1/accounts/address/{id} */
  updateAddress(id: number, payload: AddressRequest): Promise<void> {
    return unwrapApi(http.put<ApiResponse<void>>(`/accounts/address/${id}`, payload))
  },

  /** DELETE /api/v1/accounts/address/{id} */
  deleteAddress(id: number): Promise<void> {
    return unwrapApi(http.delete<ApiResponse<void>>(`/accounts/address/${id}`))
  },
}
