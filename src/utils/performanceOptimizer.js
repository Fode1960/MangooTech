import { useEffect, useMemo } from 'react';

// Service d'optimisation des performances
class PerformanceOptimizer {
  constructor() {
    this.imageCache = new Map();
    this.requestCache = new Map();
    this.debounceTimers = new Map();
    this.lazyLoadObserver = null;
    this.initLazyLoading();
  }

  // Initialiser le lazy loading
  initLazyLoading() {
    if ('IntersectionObserver' in window) {
      this.lazyLoadObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              this.loadImage(img);
              this.lazyLoadObserver.unobserve(img);
            }
          });
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.01
        }
      );
    }
  }

  // Charger une image avec optimisation
  loadImage(img) {
    const src = img.dataset.src;
    if (!src) return;

    // Vérifier le cache
    if (this.imageCache.has(src)) {
      img.src = this.imageCache.get(src);
      return;
    }

    // Charger avec compression WebP si supporté
    const isWebPSupported = this.isWebPSupported();
    const imageUrl = isWebPSupported ? this.convertToWebP(src) : src;

    const image = new Image();
    image.onload = () => {
      this.imageCache.set(src, imageUrl);
      img.src = imageUrl;
      img.classList.add('loaded');
    };
    image.onerror = () => {
      // Fallback vers l'image originale
      img.src = src;
    };
    image.src = imageUrl;
  }

  // Vérifier le support WebP
  isWebPSupported() {
    if (this.webpSupport !== undefined) return this.webpSupport;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    try {
      this.webpSupport = canvas.toDataURL('image/webp').indexOf('webp') !== -1;
    } catch (e) {
      this.webpSupport = false;
    }
    
    return this.webpSupport;
  }

  // Convertir en WebP
  convertToWebP(src) {
    // Ajouter le paramètre de conversion pour les images CDN
    if (src.includes('cdn.') || src.includes('cloudinary')) {
      return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    return src;
  }

  // Observer un élément pour le lazy loading
  observeLazyLoad(element) {
    if (this.lazyLoadObserver && element) {
      this.lazyLoadObserver.observe(element);
    }
  }

  // Débouncer une fonction
  debounce(key, func, delay = 300) {
    return (...args) => {
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key));
      }
      
      const timer = setTimeout(() => {
        func.apply(this, args);
        this.debounceTimers.delete(key);
      }, delay);
      
      this.debounceTimers.set(key, timer);
    };
  }

  // Throttle une fonction
  throttle(key, func, limit = 100) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Mettre en cache une requête API
  cacheRequest(key, requestFunc, ttl = 300000) { // 5 minutes par défaut
    return async (...args) => {
      if (this.requestCache.has(key)) {
        const cached = this.requestCache.get(key);
        if (Date.now() - cached.timestamp < ttl) {
          return cached.data;
        }
      }

      try {
        const data = await requestFunc(...args);
        this.requestCache.set(key, {
          data,
          timestamp: Date.now()
        });
        return data;
      } catch (error) {
        // En cas d'erreur, retourner le cache s'il existe
        if (this.requestCache.has(key)) {
          return this.requestCache.get(key).data;
        }
        throw error;
      }
    };
  }

  // Optimiser le rendu des listes
  optimizeListRendering(items, renderFunc, batchSize = 50) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    return batches.map((batch, index) => (
      <div key={index} className="render-batch">
        {batch.map(renderFunc)}
      </div>
    ));
  }

// Précharger les images critiques
  preloadCriticalImages(imageUrls) {
    imageUrls.forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }

  // Optimiser les polices
  optimizeFonts(fontFamilies) {
    if ('fonts' in document) {
      fontFamilies.forEach(fontFamily => {
        document.fonts.load(`1em ${fontFamily}`).then(() => {
          document.body.classList.add(`${fontFamily.replace(/\s+/g, '-').toLowerCase()}-loaded`);
        });
      });
    }
  }

  // Nettoyer le cache
  clearCache() {
    this.imageCache.clear();
    this.requestCache.clear();
    
    // Nettoyer les timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }

  // Obtenir les métriques de performance
  getPerformanceMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    
    return {
      pageLoadTime: navigation?.loadEventEnd - navigation?.navigationStart || 0,
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.navigationStart || 0,
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      memoryUsage: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 0
    };
  }
}

// Instance singleton
const performanceOptimizer = new PerformanceOptimizer();

// Hooks React pour l'optimisation
export const usePerformanceOptimization = () => {
  return {
    // Lazy loading d'images
    useLazyImage: (src) => {
      useEffect(() => {
        const img = document.querySelector(`img[data-src="${src}"]`);
        if (img) {
          performanceOptimizer.observeLazyLoad(img);
        }
      }, [src]);
    },

    // Débouncing
    useDebounce: (callback, delay = 300) => {
      const debouncedCallback = useMemo(
        () => performanceOptimizer.debounce('debounce', callback, delay),
        [callback, delay]
      );
      return debouncedCallback;
    },

    // Throttling
    useThrottle: (callback, limit = 100) => {
      const throttledCallback = useMemo(
        () => performanceOptimizer.throttle('throttle', callback, limit),
        [callback, limit]
      );
      return throttledCallback;
    },

    // Mise en cache des requêtes
    useCachedRequest: (key, requestFunc, ttl) => {
      const cachedRequest = useMemo(
        () => performanceOptimizer.cacheRequest(key, requestFunc, ttl),
        [key, requestFunc, ttl]
      );
      return cachedRequest;
    }
  };
};

export default performanceOptimizer;
