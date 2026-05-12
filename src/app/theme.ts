import type { ThemeConfig } from 'antd'

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#c92127',
    colorInfo: '#c92127',
    colorLink: '#c92127',
    colorText: '#111827',
    colorTextSecondary: '#64748b',
    colorBorder: '#d9d9d9',
    controlHeight: 44,
    controlHeightLG: 48,
    borderRadius: 8,
    fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    Button: { controlHeight: 44, borderRadius: 8 },
    Card: { borderRadiusLG: 8 },
    Input: { controlHeight: 44 },
    InputNumber: { controlHeight: 44 },
    Select: { controlHeight: 44 },
    Layout: {
      headerBg: '#ffffff',
      headerHeight: 64,
      siderBg: '#0f172a',
    },
  },
}
