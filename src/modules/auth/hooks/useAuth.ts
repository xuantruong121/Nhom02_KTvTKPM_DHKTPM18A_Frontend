// Re-export hook từ store để callsite không phải đổi.
// Nếu component chỉ cần 1 trường (vd: user.email), nên dùng selector hẹp:
//   import { useAuthUser } from '@/shared/store/authStore'
//   const email = useAuthUser()?.email
export { useAuth } from '@/shared/store/authStore'
