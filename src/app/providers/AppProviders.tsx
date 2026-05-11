import { QueryClientProvider } from '@tanstack/react-query'
import { App as AntApp, ConfigProvider } from 'antd'
import viVN from 'antd/locale/vi_VN'
import { useState, type ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { antdTheme } from '@/app/theme'
import AuthInitializer from '@/modules/auth/AuthInitializer'
import { createQueryClient } from '@/shared/lib/queryClient'

type Props = {
  children: ReactNode
}

export default function AppProviders({ children }: Props) {
  const [queryClient] = useState(() => createQueryClient())

  return (
    <ConfigProvider locale={viVN} theme={antdTheme}>
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthInitializer>{children}</AuthInitializer>
          </BrowserRouter>
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  )
}
