import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';

interface ThemeToggleButtonProps {
  className?: string;
}

export default function ThemeToggleButton({ className = '' }: ThemeToggleButtonProps) {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-200 transform hover:scale-110 active:scale-95 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 ${className}`}
      title={isDark ? "Passer en mode jour" : "Passer en mode nuit"}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-yellow-500 transition-transform duration-300 hover:rotate-180" />
      ) : (
        <Moon className="h-5 w-5 text-gray-600 transition-transform duration-300 hover:rotate-12" />
      )}
    </button>
  );
}