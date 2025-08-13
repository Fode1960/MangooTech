/**
 * Utilitaires pour l'analyse et le monitoring des performances
 */

import React from 'react'

/**
 * Configuration des métriques de performance
 */
const PERFORMANCE_CONFIG = {
  // Seuils de performance (en millisecondes)
  thresholds: {
    lcp: 2500, // Largest Contentful Paint
    fid: 100,  // First Input Delay
    cls: 0.1,  // Cumulative Layout Shift
    ttfb: 600, // Time to First Byte
    fcp: 1800  // First Contentful Paint
  },
  
  // Configuration du sampling
  sampleRate: 0.1, // 10% des sessions
  
  // Endpoints pour l'envoi des métriques
  endpoints: {
    performance: '/api/analytics/performance',
    errors: '/api/analytics/errors',
    userActions: '/api/analytics/actions'
  }
}

/**
 * Classe pour la collecte des métriques de performance
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.observers = new Map()
    this.sessionId = this.generateSessionId()
    this.startTime = performance.now()
    
    this.initializeObservers()
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  initializeObservers() {
    // Observer pour LCP
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          this.recordMetric('lcp', lastEntry.startTime)
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.set('lcp', lcpObserver)
      } catch (e) {
        console.warn('LCP observer not supported:', e)
      }

      // Observer pour FID
      try {
        const fidObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => {
            this.recordMetric('fid', entry.processingStart - entry.startTime)
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.set('fid', fidObserver)
      } catch (e) {
        console.warn('FID observer not supported:', e)
      }

      // Observer pour CLS
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
              this.recordMetric('cls', clsValue)
            }
          })
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.set('cls', clsObserver)
      } catch (e) {
        console.warn('CLS observer not supported:', e)
      }

      // Observer pour les ressources
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => {
            this.recordResourceMetric(entry)
          })
        })
        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.set('resource', resourceObserver)
      } catch (e) {
        console.warn('Resource observer not supported:', e)
      }
    }
  }

  recordMetric(name, value, metadata = {}) {
    const metric = {
      name,
      value,
      timestamp: performance.now(),
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...metadata
    }

    this.metrics.set(`${name}-${Date.now()}`, metric)
    
    // Vérifier les seuils
    this.checkThreshold(name, value)
    
    // Envoyer en temps réel si critique
    if (this.isCriticalMetric(name, value)) {
      this.sendMetric(metric)
    }
  }

  recordResourceMetric(entry) {
    const metric = {
      name: 'resource',
      resourceName: entry.name,
      duration: entry.duration,
      size: entry.transferSize || 0,
      type: entry.initiatorType,
      timestamp: entry.startTime,
      sessionId: this.sessionId
    }

    this.metrics.set(`resource-${entry.name}-${Date.now()}`, metric)
  }

  checkThreshold(name, value) {
    const threshold = PERFORMANCE_CONFIG.thresholds[name]
    if (threshold && value > threshold) {
      console.warn(`Performance threshold exceeded for ${name}: ${value}ms (threshold: ${threshold}ms)`)
      
      // Enregistrer l'alerte
      this.recordMetric('threshold_exceeded', value, {
        metricName: name,
        threshold,
        severity: this.getSeverity(name, value, threshold)
      })
    }
  }

  getSeverity(name, value, threshold) {
    const ratio = value / threshold
    if (ratio > 2) {return 'critical'}
    if (ratio > 1.5) {return 'high'}
    if (ratio > 1.2) {return 'medium'}
    return 'low'
  }

  isCriticalMetric(name, value) {
    const threshold = PERFORMANCE_CONFIG.thresholds[name]
    return threshold && value > threshold * 2
  }

  async sendMetric(metric) {
    if (Math.random() > PERFORMANCE_CONFIG.sampleRate) {
      return // Skip based on sample rate
    }

    try {
      await fetch(PERFORMANCE_CONFIG.endpoints.performance, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metric)
      })
    } catch (error) {
      console.warn('Failed to send performance metric:', error)
    }
  }

  async sendBatch() {
    const metrics = Array.from(this.metrics.values())
    if (metrics.length === 0) {return}

    try {
      await fetch(PERFORMANCE_CONFIG.endpoints.performance, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ metrics, sessionId: this.sessionId })
      })
      
      this.metrics.clear()
    } catch (error) {
      console.warn('Failed to send performance metrics batch:', error)
    }
  }

  getMetrics() {
    return Array.from(this.metrics.values())
  }

  getMetricsSummary() {
    const metrics = this.getMetrics()
    const summary = {}
    
    metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          total: 0,
          min: Infinity,
          max: -Infinity,
          avg: 0
        }
      }
      
      const stat = summary[metric.name]
      stat.count++
      stat.total += metric.value
      stat.min = Math.min(stat.min, metric.value)
      stat.max = Math.max(stat.max, metric.value)
      stat.avg = stat.total / stat.count
    })
    
    return summary
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
    this.sendBatch() // Envoyer les métriques restantes
  }
}

/**
 * Classe pour le tracking des erreurs
 */
class ErrorTracker {
  constructor() {
    this.errors = []
    this.setupErrorHandlers()
  }

  setupErrorHandlers() {
    // Erreurs JavaScript
    window.addEventListener('error', (event) => {
      this.recordError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      })
    })

    // Promesses rejetées
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        type: 'unhandled_promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack
      })
    })

    // Erreurs de ressources
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.recordError({
          type: 'resource',
          message: `Failed to load resource: ${event.target.src || event.target.href}`,
          element: event.target.tagName,
          source: event.target.src || event.target.href
        })
      }
    }, true)
  }

  recordError(errorInfo) {
    const error = {
      ...errorInfo,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: performanceMonitor.sessionId
    }

    this.errors.push(error)
    
    // Envoyer immédiatement les erreurs critiques
    this.sendError(error)
    
    console.error('Error tracked:', error)
  }

  async sendError(error) {
    try {
      await fetch(PERFORMANCE_CONFIG.endpoints.errors, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(error)
      })
    } catch (e) {
      console.warn('Failed to send error:', e)
    }
  }

  getErrors() {
    return this.errors
  }
}

/**
 * Classe pour le tracking des actions utilisateur
 */
class UserActionTracker {
  constructor() {
    this.actions = []
    this.setupActionTracking()
  }

  setupActionTracking() {
    // Clics
    document.addEventListener('click', (event) => {
      this.recordAction({
        type: 'click',
        element: event.target.tagName,
        className: event.target.className,
        id: event.target.id,
        text: event.target.textContent?.slice(0, 100)
      })
    })

    // Navigation
    let lastUrl = window.location.href
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        this.recordAction({
          type: 'navigation',
          from: lastUrl,
          to: window.location.href
        })
        lastUrl = window.location.href
      }
    })
    observer.observe(document, { subtree: true, childList: true })
  }

  recordAction(actionInfo) {
    const action = {
      ...actionInfo,
      timestamp: Date.now(),
      sessionId: performanceMonitor.sessionId
    }

    this.actions.push(action)
    
    // Limiter le nombre d'actions stockées
    if (this.actions.length > 100) {
      this.actions = this.actions.slice(-50)
    }
  }

  async sendActions() {
    if (this.actions.length === 0) {return}

    try {
      await fetch(PERFORMANCE_CONFIG.endpoints.userActions, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          actions: this.actions,
          sessionId: performanceMonitor.sessionId
        })
      })
      
      this.actions = []
    } catch (error) {
      console.warn('Failed to send user actions:', error)
    }
  }

  getActions() {
    return this.actions
  }
}

// Instances globales
const performanceMonitor = new PerformanceMonitor()
const errorTracker = new ErrorTracker()
const userActionTracker = new UserActionTracker()

// Envoi périodique des métriques
setInterval(() => {
  performanceMonitor.sendBatch()
  userActionTracker.sendActions()
}, 30000) // Toutes les 30 secondes

// Envoi avant fermeture de la page
window.addEventListener('beforeunload', () => {
  performanceMonitor.sendBatch()
  userActionTracker.sendActions()
})

/**
 * Hook React pour les métriques de performance
 */
export const useAnalytics = () => {
  const trackEvent = React.useCallback((eventName, properties = {}) => {
    userActionTracker.recordAction({
      type: 'custom_event',
      eventName,
      properties
    })
  }, [])

  const trackPageView = React.useCallback((pageName) => {
    performanceMonitor.recordMetric('page_view', performance.now(), {
      pageName,
      referrer: document.referrer
    })
  }, [])

  const trackError = React.useCallback((error, context = {}) => {
    errorTracker.recordError({
      type: 'react_error',
      message: error.message,
      stack: error.stack,
      context
    })
  }, [])

  return {
    trackEvent,
    trackPageView,
    trackError,
    getMetrics: () => performanceMonitor.getMetrics(),
    getMetricsSummary: () => performanceMonitor.getMetricsSummary(),
    getErrors: () => errorTracker.getErrors(),
    getActions: () => userActionTracker.getActions()
  }
}

/**
 * HOC pour tracker automatiquement les pages
 */
export const withPageTracking = (Component, pageName) => {
  return React.forwardRef((props, ref) => {
    const { trackPageView } = useAnalytics()
    
    React.useEffect(() => {
      trackPageView(pageName)
    }, [trackPageView])
    
    return <Component {...props} ref={ref} />
  })
}

/**
 * Utilitaires pour les tests A/B
 */
export const ABTesting = {
  getVariant: (testName, variants = ['A', 'B']) => {
    const userId = localStorage.getItem('userId') || 'anonymous'
    const hash = Array.from(userId + testName).reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    const index = Math.abs(hash) % variants.length
    return variants[index]
  },
  
  trackConversion: (testName, variant, conversionType) => {
    userActionTracker.recordAction({
      type: 'ab_conversion',
      testName,
      variant,
      conversionType
    })
  }
}

export {
  performanceMonitor,
  errorTracker,
  userActionTracker,
  PERFORMANCE_CONFIG
}

export default {
  useAnalytics,
  withPageTracking,
  ABTesting,
  performanceMonitor,
  errorTracker,
  userActionTracker
}