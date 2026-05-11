import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * UI preferences store (persist trong localStorage).
 * - Không nhạy cảm.
 * - Tránh nhồi vào AuthStore để giữ separation of concerns.
 */

export type ThemeMode = 'light' | 'dark'

type UIState = {
  siderCollapsed: boolean
  themeMode: ThemeMode
}

type UIActions = {
  toggleSider: () => void
  setSiderCollapsed: (v: boolean) => void
  setThemeMode: (mode: ThemeMode) => void
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      siderCollapsed: false,
      themeMode: 'light',
      toggleSider: () => set((s) => ({ siderCollapsed: !s.siderCollapsed })),
      setSiderCollapsed: (v) => set({ siderCollapsed: v }),
      setThemeMode: (mode) => set({ themeMode: mode }),
    }),
    {
      name: 'sebook_ui',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
)

export const useSiderCollapsed = () => useUIStore((s) => s.siderCollapsed)
export const useThemeMode = () => useUIStore((s) => s.themeMode)
