/**
 * Composants de fallback pour le lazy loading et la gestion d'erreurs
 */

import React from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

/**
 * Composant de chargement simple
 */
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} border-4 border-primary border-t-transparent rounded-full`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
        aria-label="Chargement en cours"
      />
    </div>
  )
}

/**
 * Composant de chargement avec skeleton
 */
export const SkeletonLoader = ({ lines = 3, className = '' }) => {
  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  )
}

/**
 * Composant de chargement pour les pages
 */
export const PageLoadingFallback = ({ message }) => {
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px] space-y-4"
    >
      <LoadingSpinner size="lg" />
      <p className="text-gray-600 dark:text-gray-400 text-center">
        {message || t('common.loading')}
      </p>
    </motion.div>
  )
}

/**
 * Composant de chargement pour les composants
 */
export const ComponentLoadingFallback = ({ height = '200px', className = '' }) => {
  return (
    <div 
      className={`flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}
      style={{ height }}
    >
      <LoadingSpinner />
    </div>
  )
}

/**
 * Composant d'erreur de chargement
 */
export const LoadingErrorFallback = ({ error, retry, className = '' }) => {
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center min-h-[300px] space-y-4 p-6 ${className}`}
    >
      <div className="text-red-500 text-6xl mb-4">
        ⚠️
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
        {t('errors.loadingError')}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
        {error?.message || t('errors.genericError')}
      </p>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          {t('common.retry')}
        </button>
      )}
    </motion.div>
  )
}

/**
 * Hook pour gérer les états de chargement
 */
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState)
  const [error, setError] = React.useState(null)

  const startLoading = React.useCallback(() => {
    setIsLoading(true)
    setError(null)
  }, [])

  const stopLoading = React.useCallback(() => {
    setIsLoading(false)
  }, [])

  const setLoadingError = React.useCallback((error) => {
    setIsLoading(false)
    setError(error)
  }, [])

  const reset = React.useCallback(() => {
    setIsLoading(false)
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    reset
  }
}

/**
 * Composant de chargement progressif pour les images
 */
export const ProgressiveImage = ({ 
  src, 
  placeholder, 
  alt, 
  className = '',
  onLoad,
  onError 
}) => {
  const [imageLoaded, setImageLoaded] = React.useState(false)
  const [imageError, setImageError] = React.useState(false)

  const handleLoad = React.useCallback(() => {
    setImageLoaded(true)
    onLoad?.()
  }, [onLoad])

  const handleError = React.useCallback(() => {
    setImageError(true)
    onError?.()
  }, [onError])

  if (imageError) {
    return (
      <div className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">Image non disponible</span>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Image placeholder */}
      {!imageLoaded && placeholder && (
        <img
          src={placeholder}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover filter blur-sm"
        />
      )}
      
      {/* Image principale */}
      <motion.img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        initial={{ opacity: 0 }}
        animate={{ opacity: imageLoaded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Indicateur de chargement */}
      {!imageLoaded && !placeholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  )
}

/**
 * Composant de chargement pour les listes
 */
export const ListLoadingFallback = ({ itemCount = 5, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="flex space-x-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Composant de chargement pour les cartes
 */
export const CardLoadingFallback = ({ className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
        </div>
        <div className="mt-6">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        </div>
      </div>
    </div>
  )
}

/**
 * HOC pour ajouter un fallback de chargement à un composant
 */
export const withLoadingFallback = (Component, FallbackComponent = PageLoadingFallback) => {
  return React.forwardRef((props, ref) => {
    return (
      <React.Suspense fallback={<FallbackComponent />}>
        <Component {...props} ref={ref} />
      </React.Suspense>
    )
  })
}

export default {
  LoadingSpinner,
  SkeletonLoader,
  PageLoadingFallback,
  ComponentLoadingFallback,
  LoadingErrorFallback,
  useLoadingState,
  ProgressiveImage,
  ListLoadingFallback,
  CardLoadingFallback,
  withLoadingFallback
}