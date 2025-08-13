import React, { createContext, useContext, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

/**
 * Types de toast disponibles
 */
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

/**
 * Configuration des icônes par type
 */
const TOAST_ICONS = {
  [TOAST_TYPES.SUCCESS]: CheckCircle,
  [TOAST_TYPES.ERROR]: AlertCircle,
  [TOAST_TYPES.WARNING]: AlertTriangle,
  [TOAST_TYPES.INFO]: Info
}

/**
 * Configuration des styles par type
 */
const TOAST_STYLES = {
  [TOAST_TYPES.SUCCESS]: {
    container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    title: 'text-green-800 dark:text-green-200',
    message: 'text-green-700 dark:text-green-300',
    closeButton: 'text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300'
  },
  [TOAST_TYPES.ERROR]: {
    container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-800 dark:text-red-200',
    message: 'text-red-700 dark:text-red-300',
    closeButton: 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300'
  },
  [TOAST_TYPES.WARNING]: {
    container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    title: 'text-yellow-800 dark:text-yellow-200',
    message: 'text-yellow-700 dark:text-yellow-300',
    closeButton: 'text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300'
  },
  [TOAST_TYPES.INFO]: {
    container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-800 dark:text-blue-200',
    message: 'text-blue-700 dark:text-blue-300',
    closeButton: 'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300'
  }
}

/**
 * Contexte pour les toasts
 */
const ToastContext = createContext()

/**
 * Hook pour utiliser les toasts
 */
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

/**
 * Composant Toast individuel
 */
const Toast = ({ toast, onClose }) => {
  const { id, type, title, message, duration, persistent } = toast
  const Icon = TOAST_ICONS[type]
  const styles = TOAST_STYLES[type]

  useEffect(() => {
    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        onClose(id)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [id, duration, persistent, onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        'relative flex items-start p-4 rounded-lg border shadow-lg backdrop-blur-sm',
        'max-w-sm w-full pointer-events-auto',
        styles.container
      )}
    >
      {/* Icône */}
      <div className="flex-shrink-0">
        <Icon className={clsx('w-5 h-5', styles.icon)} aria-hidden="true" />
      </div>

      {/* Contenu */}
      <div className="ml-3 flex-1">
        {title && (
          <h4 className={clsx('text-sm font-medium', styles.title)}>
            {title}
          </h4>
        )}
        {message && (
          <p className={clsx('text-sm', title ? 'mt-1' : '', styles.message)}>
            {message}
          </p>
        )}
      </div>

      {/* Bouton de fermeture */}
      <div className="ml-4 flex-shrink-0">
        <button
          onClick={() => onClose(id)}
          className={clsx(
            'inline-flex rounded-md p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
            styles.closeButton
          )}
          aria-label="Fermer la notification"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Barre de progression pour les toasts temporaires */}
      {!persistent && duration > 0 && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-current opacity-30 rounded-b-lg"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  )
}

/**
 * Conteneur des toasts
 */
const ToastContainer = ({ toasts, onClose, position = 'top-right' }) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  }

  return (
    <div
      className={clsx(
        'fixed z-50 pointer-events-none',
        positionClasses[position]
      )}
      aria-live="polite"
      aria-label="Notifications"
    >
      <div className="flex flex-col space-y-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              toast={toast}
              onClose={onClose}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

/**
 * Provider pour les toasts
 */
export const ToastProvider = ({ children, maxToasts = 5, position = 'top-right' }) => {
  const [toasts, setToasts] = useState([])

  const addToast = (toast) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newToast = {
      id,
      type: TOAST_TYPES.INFO,
      duration: 5000,
      persistent: false,
      ...toast
    }

    setToasts((prevToasts) => {
      const updatedToasts = [newToast, ...prevToasts]
      // Limiter le nombre de toasts affichés
      return updatedToasts.slice(0, maxToasts)
    })

    return id
  }

  const removeToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }

  const clearAllToasts = () => {
    setToasts([])
  }

  // Méthodes de convenance
  const success = (message, options = {}) => {
    return addToast({
      type: TOAST_TYPES.SUCCESS,
      message,
      ...options
    })
  }

  const error = (message, options = {}) => {
    return addToast({
      type: TOAST_TYPES.ERROR,
      message,
      duration: 7000, // Plus long pour les erreurs
      ...options
    })
  }

  const warning = (message, options = {}) => {
    return addToast({
      type: TOAST_TYPES.WARNING,
      message,
      ...options
    })
  }

  const info = (message, options = {}) => {
    return addToast({
      type: TOAST_TYPES.INFO,
      message,
      ...options
    })
  }

  const contextValue = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        position={position}
      />
    </ToastContext.Provider>
  )
}

/**
 * Hook pour les notifications d'erreur avec gestion automatique
 */
export const useErrorToast = () => {
  const { error } = useToast()

  const showError = (err, options = {}) => {
    let message = 'Une erreur inattendue s\'est produite'
    let title = 'Erreur'

    if (typeof err === 'string') {
      message = err
    } else if (err?.message) {
      message = err.message
      if (err.name && err.name !== 'Error') {
        title = err.name
      }
    }

    return error(message, {
      title,
      ...options
    })
  }

  return { showError }
}

/**
 * Hook pour les notifications de succès avec gestion automatique
 */
export const useSuccessToast = () => {
  const { success } = useToast()

  const showSuccess = (message, options = {}) => {
    return success(message, {
      title: 'Succès',
      ...options
    })
  }

  return { showSuccess }
}

/**
 * Composant de notification inline (alternative aux toasts)
 */
export const InlineNotification = ({ 
  type = TOAST_TYPES.INFO, 
  title, 
  message, 
  onClose, 
  className = '',
  ...props 
}) => {
  const Icon = TOAST_ICONS[type]
  const styles = TOAST_STYLES[type]

  return (
    <div
      className={clsx(
        'flex items-start p-4 rounded-lg border',
        styles.container,
        className
      )}
      role="alert"
      {...props}
    >
      <div className="flex-shrink-0">
        <Icon className={clsx('w-5 h-5', styles.icon)} aria-hidden="true" />
      </div>

      <div className="ml-3 flex-1">
        {title && (
          <h4 className={clsx('text-sm font-medium', styles.title)}>
            {title}
          </h4>
        )}
        {message && (
          <p className={clsx('text-sm', title ? 'mt-1' : '', styles.message)}>
            {message}
          </p>
        )}
      </div>

      {onClose && (
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={onClose}
            className={clsx(
              'inline-flex rounded-md p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
              styles.closeButton
            )}
            aria-label="Fermer la notification"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}

export default {
  ToastProvider,
  useToast,
  useErrorToast,
  useSuccessToast,
  InlineNotification,
  TOAST_TYPES
}