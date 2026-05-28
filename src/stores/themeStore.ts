import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

const getInitialTheme = () => {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem('theme') || localStorage.getItem('mangoo-theme');
    if (stored) return String(stored).toLowerCase() === 'dark';
  } catch {
  }
  try {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  } catch {
  }
  return false;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => {
      const initial = getInitialTheme()
      return {
        isDark: initial,
        isDarkMode: initial,
      toggleTheme: () =>
        set((state) => {
          const next = !state.isDark
          return { isDark: next, isDarkMode: next }
        }),
      setTheme: (dark: boolean) => set({ isDark: dark, isDarkMode: dark }),
      }
    },
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
