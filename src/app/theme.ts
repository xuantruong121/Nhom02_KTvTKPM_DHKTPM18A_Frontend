import type { ThemeConfig } from 'antd'

/** Token màu chính cho website bán sách: xanh hoàng gia + accent tím nhạt. */
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1d4ed8',
    colorInfo: '#1d4ed8',
    colorLink: '#1d4ed8',
    borderRadius: 8,
    fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    Button: { controlHeight: 40 },
    Input: { controlHeight: 40 },
    Layout: {
      headerBg: '#ffffff',
      headerHeight: 64,
      siderBg: '#0f172a',
    },
  },
}
