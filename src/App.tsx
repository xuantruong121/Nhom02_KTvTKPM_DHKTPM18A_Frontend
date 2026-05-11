import AppProviders from '@/app/providers/AppProviders'
import AppRoutes from '@/core/router/AppRoutes'
import '@/shared/styles/global.css'

export default function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  )
}
