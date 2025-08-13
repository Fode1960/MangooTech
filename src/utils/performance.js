/**
 * Utilitaires pour l'optimisation des performances
 */

import React, { lazy } from 'react'

/**
 * Configuration du lazy loading avec retry et fallback
 */
const createLazyComponent = (importFn, retries = 3) => {
  return lazy(() => {
    return new Promise((resolve, reject) => {
      const attemptImport = (attempt = 1) => {
        importFn()
          .then(resolve)
          .catch((error) => {
            if (attempt < retries) {
              console.warn(`Failed to load component, retrying... (${attempt}/${retries})`)
              setTimeout(() => attemptImport(attempt + 1), 1000 * attempt)
            } else {
              console.error('Failed to load component after retries:', error)
              reject(error)
            }
          })
      }
      attemptImport()
    })
  })
}

/**
 * Lazy loading des pages avec retry automatique
 */
export const LazyPages = {
  Home: createLazyComponent(() => import('../pages/Home')),
  About: createLazyComponent(() => import('../pages/About')),
  Services: createLazyComponent(() => import('../pages/Services')),
  Contact: createLazyComponent(() => import('../pages/Contact')),
  Login: createLazyComponent(() => import('../pages/Login')),
  Register: createLazyComponent(() => import('../pages/Register')),
  ForgotPassword: createLazyComponent(() => import('../pages/ForgotPassword')),
  ResetPassword: createLazyComponent(() => import('../pages/ResetPassword')),
  EmailConfirmation: createLazyComponent(() => import('../pages/EmailConfirmation')),
  AuthCallback: createLazyComponent(() => import('../pages/AuthCallback')),
  Dashboard: createLazyComponent(() => import('../pages/Dashboard')),
  AdminDashboard: createLazyComponent(() => import('../pages/admin/AdminDashboard')),
  NotFound: createLazyComponent(() => import('../pages/NotFound'))
}

/**
 * Lazy loading des composants lourds
 * Note: Ces composants seront créés selon les besoins
 */
export const LazyComponents = {
  // Chart: createLazyComponent(() => import('../components/ui/Chart')),
  // DataTable: createLazyComponent(() => import('../components/ui/DataTable')),
  // RichTextEditor: createLazyComponent(() => import('../components/ui/RichTextEditor')),
  // ImageGallery: createLazyComponent(() => import('../components/ui/ImageGallery'))
}

/**
 * Hook pour mesurer les performances de rendu
 */
export const usePerformanceMonitor = (componentName) => {
  React.useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      if (import.meta.env.DEV) {
        console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`)
      }
      
      // Envoyer les métriques en production
      if (import.meta.env.PROD && renderTime > 100) {
        // Log des rendus lents
        console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`)
      }
    }
  })
}

/**
 * Hook pour le debouncing des fonctions
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook pour le throttling des fonctions
 */
export const useThrottle = (callback, delay) => {
  const lastRun = React.useRef(Date.now())

  return React.useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args)
      lastRun.current = Date.now()
    }
  }, [callback, delay])
}

/**
 * Hook pour la virtualisation des listes longues
 */
export const useVirtualList = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = React.useState(0)
  const [containerRef, setContainerRef] = React.useState(null)

  const visibleItemsCount = Math.ceil(containerHeight / itemHeight)
  const totalHeight = items.length * itemHeight
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(startIndex + visibleItemsCount + 1, items.length)
  
  const visibleItems = items.slice(startIndex, endIndex).map((item, index) => ({
    ...item,
    index: startIndex + index
  }))

  const handleScroll = useThrottle((e) => {
    setScrollTop(e.target.scrollTop)
  }, 16) // 60fps

  React.useEffect(() => {
    if (containerRef) {
      containerRef.addEventListener('scroll', handleScroll)
      return () => containerRef.removeEventListener('scroll', handleScroll)
    }
  }, [containerRef, handleScroll])

  return {
    containerRef: setContainerRef,
    visibleItems,
    totalHeight,
    startIndex,
    offsetY: startIndex * itemHeight
  }
}

/**
 * Hook pour la mise en cache des résultats de calculs coûteux
 */
export const useMemoizedCalculation = (calculation, dependencies, cacheSize = 10) => {
  const cache = React.useRef(new Map())
  
  return React.useMemo(() => {
    const key = JSON.stringify(dependencies)
    
    if (cache.current.has(key)) {
      return cache.current.get(key)
    }
    
    const result = calculation()
    
    // Limiter la taille du cache
    if (cache.current.size >= cacheSize) {
      const firstKey = cache.current.keys().next().value
      cache.current.delete(firstKey)
    }
    
    cache.current.set(key, result)
    return result
  }, dependencies)
}

/**
 * Hook pour le préchargement des ressources
 */
export const usePreloader = () => {
  const preloadImage = React.useCallback((src) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }, [])

  const preloadComponent = React.useCallback(async (importFn) => {
    try {
      await importFn()
    } catch (error) {
      console.warn('Failed to preload component:', error)
    }
  }, [])

  const preloadRoute = React.useCallback((routeName) => {
    if (LazyPages[routeName]) {
      // Précharger le composant de la route
      const componentImport = LazyPages[routeName]._payload._result
      if (!componentImport) {
        // Déclencher le chargement
        LazyPages[routeName]._payload._result
      }
    }
  }, [])

  return {
    preloadImage,
    preloadComponent,
    preloadRoute
  }
}

/**
 * Composant pour le préchargement intelligent des routes
 */
export const RoutePreloader = ({ routes = [] }) => {
  const { preloadRoute } = usePreloader()

  React.useEffect(() => {
    // Précharger les routes après un délai
    const timer = setTimeout(() => {
      routes.forEach(route => {
        preloadRoute(route)
      })
    }, 2000) // Attendre 2 secondes après le chargement initial

    return () => clearTimeout(timer)
  }, [routes, preloadRoute])

  return null
}

/**
 * Utilitaires pour l'optimisation des images
 */
export const imageOptimization = {
  // Préchargement des images critiques
  preloadCriticalImages: (imageUrls) => {
    imageUrls.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = url
      document.head.appendChild(link)
    })
  },

  // Lazy loading avec Intersection Observer
  setupLazyLoading: (selector = 'img[data-src]') => {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target
            img.src = img.dataset.src
            img.classList.remove('lazy')
            imageObserver.unobserve(img)
          }
        })
      })

      document.querySelectorAll(selector).forEach(img => {
        imageObserver.observe(img)
      })
    }
  }
}

/**
 * Métriques de performance Web Vitals
 */
export const webVitals = {
  // Mesurer le Largest Contentful Paint (LCP)
  measureLCP: () => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        resolve(lastEntry.startTime)
      }).observe({ entryTypes: ['largest-contentful-paint'] })
    })
  },

  // Mesurer le First Input Delay (FID)
  measureFID: () => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          resolve(entry.processingStart - entry.startTime)
        })
      }).observe({ entryTypes: ['first-input'] })
    })
  },

  // Mesurer le Cumulative Layout Shift (CLS)
  measureCLS: () => {
    let clsValue = 0
    new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
    }).observe({ entryTypes: ['layout-shift'] })
    
    return () => clsValue
  }
}

/**
 * Optimisation du bundle
 */
export const bundleOptimization = {
  // Analyser la taille des chunks
  analyzeBundleSize: () => {
    if (import.meta.env.DEV) {
      console.log('Bundle analysis is only available in production build')
      return
    }
    
    // Logique d'analyse du bundle en production
    const scripts = document.querySelectorAll('script[src]')
    scripts.forEach(script => {
      fetch(script.src, { method: 'HEAD' })
        .then(response => {
          const size = response.headers.get('content-length')
          console.log(`Script ${script.src}: ${(size / 1024).toFixed(2)} KB`)
        })
        .catch(console.error)
    })
  },

  // Préchargement des chunks critiques
  preloadCriticalChunks: (chunkNames = []) => {
    chunkNames.forEach(chunkName => {
      const link = document.createElement('link')
      link.rel = 'modulepreload'
      link.href = `/assets/${chunkName}.js`
      document.head.appendChild(link)
    })
  }
}

/**
 * Hook pour surveiller les performances de l'application
 */
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = React.useState({
    lcp: null,
    fid: null,
    cls: null,
    memoryUsage: null
  })

  React.useEffect(() => {
    // Mesurer LCP
    webVitals.measureLCP().then(lcp => {
      setMetrics(prev => ({ ...prev, lcp }))
    })

    // Mesurer FID
    webVitals.measureFID().then(fid => {
      setMetrics(prev => ({ ...prev, fid }))
    })

    // Mesurer CLS
    const getCLS = webVitals.measureCLS()
    const clsTimer = setInterval(() => {
      setMetrics(prev => ({ ...prev, cls: getCLS() }))
    }, 1000)

    // Mesurer l'utilisation mémoire
    const memoryTimer = setInterval(() => {
      if (performance.memory) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          }
        }))
      }
    }, 5000)

    return () => {
      clearInterval(clsTimer)
      clearInterval(memoryTimer)
    }
  }, [])

  return metrics
}

export default {
  LazyPages,
  LazyComponents,
  usePerformanceMonitor,
  useDebounce,
  useThrottle,
  useVirtualList,
  useMemoizedCalculation,
  usePreloader,
  RoutePreloader,
  imageOptimization,
  webVitals,
  bundleOptimization,
  usePerformanceMetrics
}