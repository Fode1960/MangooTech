// Utilitaires de performance
export const performanceUtils = {
  // Mesurer le temps d'exécution d'une fonction
  measureTime: (fn, label = 'Operation') => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${label} took ${end - start} milliseconds`);
    return result;
  },

  // Débouncer une fonction
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttler une fonction
  throttle: (func, limit) => {
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
  },

  // Optimiser les images
  optimizeImage: (imageUrl, options = {}) => {
    const { width, height, quality = 80, format = 'webp' } = options;
    
    if (!imageUrl) return imageUrl;
    
    // Simulation d'optimisation d'image
    // Dans un vrai projet, vous utiliseriez un service comme Cloudinary ou ImageKit
    let optimizedUrl = imageUrl;
    
    if (width) optimizedUrl += `?w=${width}`;
    if (height) optimizedUrl += `&h=${height}`;
    if (quality) optimizedUrl += `&q=${quality}`;
    if (format) optimizedUrl += `&f=${format}`;
    
    return optimizedUrl;
  },

  // Précharger les images
  preloadImage: (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = src;
    });
  },

  // Obtenir les métriques de performance de la page
  getPageMetrics: () => {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: navigation.responseEnd - navigation.responseStart,
        domInteractive: navigation.domInteractive - navigation.domLoading
      };
    }
    return null;
  }
};

export default performanceUtils;