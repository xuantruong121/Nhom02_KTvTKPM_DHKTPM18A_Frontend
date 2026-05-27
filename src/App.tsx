import AppProviders from '@/app/providers/AppProviders'
import AppRoutes from '@/core/router/AppRoutes'
import ScrollToTop from '@/core/router/ScrollToTop'
import AiChatWidget from '@/modules/ai/components/AiChatWidget'
import RealtimeEventBridge from '@/modules/realtime/RealtimeEventBridge'
import '@/shared/styles/design-system.css'
import '@/shared/styles/global.css'

export default function App() {
  return (
    <AppProviders>
      <ScrollToTop />
      <RealtimeEventBridge />
      <AppRoutes />
      <AiChatWidget />
    </AppProviders>
  )
}
