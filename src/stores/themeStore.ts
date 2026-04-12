import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      isDarkMode: false,
      toggleTheme: () =>
        set((state) => {
          const next = !state.isDark
          return { isDark: next, isDarkMode: next }
        }),
      setTheme: (dark: boolean) => set({ isDark: dark, isDarkMode: dark }),
    }),
    {
      name: 'mangoo-theme-storage', // Changed name to avoid conflict
      version: 1,
      migrate: (persistedState: any) => {
        const s = (persistedState ?? {}) as any
        if (typeof s.isDark !== 'boolean' && typeof s.isDarkMode === 'boolean') {
          s.isDark = s.isDarkMode
        }
        if (typeof s.isDarkMode !== 'boolean' && typeof s.isDark === 'boolean') {
          s.isDarkMode = s.isDark
        }
        return s as ThemeState
      },
    }
  )
);
