import { useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';

export const useTheme = () => {
  const { isDark, toggleTheme, setTheme } = useThemeStore();

  useEffect(() => {
    // Appliquer le thème au document root
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Détecter les préférences système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Ne pas écraser le choix utilisateur s'il a déjà fait un choix
      const hasUserPreference = localStorage.getItem('theme');
      if (!hasUserPreference) {
        setTheme(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setTheme]);

  return {
    isDark,
    toggleTheme,
    setTheme,
  };
};
