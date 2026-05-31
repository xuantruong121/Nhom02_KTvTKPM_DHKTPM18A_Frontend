import AppProviders from '@/app/providers/AppProviders'
import AppRoutes from '@/core/router/AppRoutes'
import ScrollToTop from '@/core/router/ScrollToTop'
import '@/shared/styles/design-system.css'
import '@/shared/styles/global.css'

export default function App() {
  return (
    <AppProviders>
      <ScrollToTop />
      <AppRoutes />
    </AppProviders>
  )
}
