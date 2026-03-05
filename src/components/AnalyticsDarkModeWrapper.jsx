import React, { useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';

export const AnalyticsDarkModeWrapper = ({ children }) => {
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    if (isDarkMode) {
      // Forcer l'uniformité du mode nuit avec JavaScript
      const forceDarkMode = () => {
        // Forcer l'arrière-plan principal
        const mainContainer = document.querySelector('.analytics-dashboard');
        if (mainContainer) {
          mainContainer.style.setProperty('background-color', '#0f172a', 'important');
        }

        // Forcer toutes les cartes et sections
        const allCards = document.querySelectorAll('div[class*="rounded"], div[class*="shadow"], div[class*="bg-"]');
        allCards.forEach(el => {
          // Ne pas forcer si c'est déjà analytics-card
          if (!el.classList.contains('analytics-card')) {
            el.style.setProperty('background-color', '#1e293b', 'important');
            el.style.setProperty('border-color', '#334155', 'important');
            el.style.setProperty('color', '#f8fafc', 'important');
          }
        });

        // Forcer les éléments analytics-card
        const analyticsCards = document.querySelectorAll('.analytics-card');
        analyticsCards.forEach(el => {
          el.style.setProperty('background-color', '#1e293b', 'important');
          el.style.setProperty('border-color', '#334155', 'important');
          el.style.setProperty('color', '#f8fafc', 'important');
        });

        // Forcer les tableaux
        const tableElements = document.querySelectorAll('table, thead, tbody, tr, td, th');
        tableElements.forEach(el => {
          el.style.setProperty('background-color', '#1e293b', 'important');
          el.style.setProperty('border-color', '#334155', 'important');
          el.style.setProperty('color', '#f8fafc', 'important');
        });

        // Forcer les textes
        const textElements = document.querySelectorAll('.text-gray-900, .text-gray-600, .text-gray-500, .text-gray-300, h1, h2, h3, h4, h5, h6, p, span');
        textElements.forEach(el => {
          if (el.classList.contains('text-gray-900')) {
            el.style.setProperty('color', '#f8fafc', 'important');
          } else if (el.classList.contains('text-gray-600')) {
            el.style.setProperty('color', '#cbd5e1', 'important');
          } else if (el.classList.contains('text-gray-500') || el.classList.contains('text-gray-300')) {
            el.style.setProperty('color', '#94a3b8', 'important');
          } else if (!el.closest('.analytics-card')) {
            // Forcer les textes non dans analytics-card
            el.style.setProperty('color', '#f8fafc', 'important');
          }
        });

        // Forcer les graphiques
        const chartElements = document.querySelectorAll('.recharts-wrapper, .recharts-surface, .recharts-layer');
        chartElements.forEach(el => {
          el.style.setProperty('background-color', '#1e293b', 'important');
        });

        // Forcer les tooltips
        const tooltipElements = document.querySelectorAll('.recharts-tooltip-wrapper, .recharts-tooltip');
        tooltipElements.forEach(el => {
          el.style.setProperty('background-color', '#1e293b', 'important');
          el.style.setProperty('border-color', '#334155', 'important');
          el.style.setProperty('color', '#f8fafc', 'important');
        });

        // Forcer les selects
        const selectElements = document.querySelectorAll('select, option');
        selectElements.forEach(el => {
          el.style.setProperty('background-color', '#1e293b', 'important');
          el.style.setProperty('border-color', '#334155', 'important');
          el.style.setProperty('color', '#f8fafc', 'important');
        });
      };

      // Exécuter immédiatement
      forceDarkMode();

      // Re-exécuter après un court délai pour capturer les éléments dynamiques
      const timeoutId = setTimeout(forceDarkMode, 300);

      // Observer les changements DOM
      const observer = new MutationObserver(forceDarkMode);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });

      return () => {
        clearTimeout(timeoutId);
        observer.disconnect();
        
        // Nettoyer les styles inline en quittant le mode sombre
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
          el.style.removeProperty('background-color');
          el.style.removeProperty('border-color');
          el.style.removeProperty('color');
        });
      };
    }
  }, [isDarkMode]);

  return <>{children}</>;
};