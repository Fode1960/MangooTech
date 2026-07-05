/* eslint-disable react-refresh/only-export-components */
import React from 'react';

// LazyPages - Composants de pages chargés de manière paresseuse
export const LazyPages = {
  Home: React.lazy(() => import('../pages/Home')),
  About: React.lazy(() => import('../pages/About')),
  Services: React.lazy(() => import('../pages/Services')),
  Contact: React.lazy(() => import('../pages/Contact')),
  MiniBoutique: React.lazy(() => import('../pages/MiniBoutique'))
};

// RoutePreloader - Précharge les composants pour améliorer les performances
export const RoutePreloader = () => {
  React.useEffect(() => {
    // Précharger les composants critiques
    const preloadComponents = async () => {
      try {
        await Promise.all([
          import('../pages/Home'),
          import('../pages/About'),
          import('../pages/Services'),
          import('../pages/Contact'),
          import('../pages/MiniBoutique')
        ]);
      } catch (error) {
        console.warn('Erreur lors du préchargement des composants:', error);
      }
    };

    // Précharger après 2 secondes
    const timer = setTimeout(preloadComponents, 2000);
    return () => clearTimeout(timer);
  }, []);

  return null;
};

// Optimisation des performances
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
