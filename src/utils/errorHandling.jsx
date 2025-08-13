/**
 * Système de gestion d'erreurs centralisé pour MangooTech
 */

/**
 * Types d'erreurs personnalisés
 */
export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.timestamp = new Date().toISOString()
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
    this.field = field
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403)
    this.name = 'AuthorizationError'
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network error occurred') {
    super(message, 'NETWORK_ERROR', 0)
    this.name = 'NetworkError'
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

/**
 * Configuration des messages d'erreur par défaut
 */
export const errorMessages = {
  // Erreurs d'authentification
  AUTH_INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
  AUTH_USER_NOT_FOUND: 'Utilisateur non trouvé',
  AUTH_EMAIL_ALREADY_EXISTS: 'Cette adresse email est déjà utilisée',
  AUTH_WEAK_PASSWORD: 'Le mot de passe doit contenir au moins 8 caractères',
  AUTH_INVALID_EMAIL: 'Format d\'email invalide',
  AUTH_SESSION_EXPIRED: 'Votre session a expiré, veuillez vous reconnecter',
  
  // Erreurs de validation
  VALIDATION_REQUIRED_FIELD: 'Ce champ est obligatoire',
  VALIDATION_INVALID_FORMAT: 'Format invalide',
  VALIDATION_MIN_LENGTH: 'Longueur minimale non respectée',
  VALIDATION_MAX_LENGTH: 'Longueur maximale dépassée',
  VALIDATION_INVALID_EMAIL: 'Adresse email invalide',
  VALIDATION_PASSWORD_MISMATCH: 'Les mots de passe ne correspondent pas',
  
  // Erreurs réseau
  NETWORK_CONNECTION_ERROR: 'Erreur de connexion réseau',
  NETWORK_TIMEOUT: 'Délai d\'attente dépassé',
  NETWORK_SERVER_ERROR: 'Erreur serveur, veuillez réessayer plus tard',
  
  // Erreurs génériques
  UNKNOWN_ERROR: 'Une erreur inattendue s\'est produite',
  PERMISSION_DENIED: 'Permissions insuffisantes',
  RESOURCE_NOT_FOUND: 'Ressource non trouvée',
  OPERATION_FAILED: 'L\'opération a échoué'
}

/**
 * Logger d'erreurs centralisé
 */
class ErrorLogger {
  constructor() {
    this.logs = []
    this.maxLogs = 100
  }

  log(error, context = {}) {
    const logEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        code: error.code || 'UNKNOWN',
        stack: error.stack
      },
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    this.logs.unshift(logEntry)
    
    // Limiter le nombre de logs en mémoire
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Log en console en développement
    if (import.meta.env.DEV) {
      console.error('Error logged:', logEntry)
    }

    // Envoyer à un service de monitoring en production
    if (import.meta.env.PROD) {
      this.sendToMonitoring(logEntry)
    }

    return logEntry.id
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  sendToMonitoring(logEntry) {
    // Ici, vous pourriez envoyer les erreurs à un service comme Sentry, LogRocket, etc.
    // Pour l'instant, on stocke localement
    try {
      const existingLogs = JSON.parse(localStorage.getItem('error_logs') || '[]')
      existingLogs.unshift(logEntry)
      localStorage.setItem('error_logs', JSON.stringify(existingLogs.slice(0, 50)))
    } catch (e) {
      console.warn('Failed to store error log:', e)
    }
  }

  getLogs() {
    return this.logs
  }

  clearLogs() {
    this.logs = []
    localStorage.removeItem('error_logs')
  }
}

export const errorLogger = new ErrorLogger()

/**
 * Gestionnaire d'erreurs global
 */
export const handleError = (error, context = {}) => {
  // Logger l'erreur
  const logId = errorLogger.log(error, context)

  // Déterminer le message à afficher à l'utilisateur
  let userMessage = error.message
  
  if (error.code && errorMessages[error.code]) {
    userMessage = errorMessages[error.code]
  } else if (error instanceof AppError) {
    userMessage = error.message
  } else {
    userMessage = errorMessages.UNKNOWN_ERROR
  }

  return {
    logId,
    userMessage,
    code: error.code || 'UNKNOWN_ERROR',
    statusCode: error.statusCode || 500
  }
}

/**
 * Wrapper pour les fonctions async avec gestion d'erreurs
 */
export const withErrorHandling = (fn, context = {}) => {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      const handledError = handleError(error, { ...context, args })
      throw new AppError(handledError.userMessage, handledError.code, handledError.statusCode)
    }
  }
}

/**
 * Hook React pour la gestion d'erreurs
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleAsyncError = React.useCallback(async (asyncFn, context = {}) => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await asyncFn()
      return result
    } catch (err) {
      const handledError = handleError(err, context)
      setError(handledError)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  return {
    error,
    isLoading,
    handleAsyncError,
    clearError
  }
}

/**
 * Composant Error Boundary pour React
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Logger l'erreur
    handleError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo)
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
              Oups ! Une erreur s'est produite
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
              Nous nous excusons pour ce désagrément. L'erreur a été signalée à notre équipe.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Recharger la page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Retour à l'accueil
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                <summary className="cursor-pointer font-medium">Détails de l'erreur (dev)</summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Utilitaires de validation avec gestion d'erreurs
 */
export const validators = {
  required: (value, fieldName) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      throw new ValidationError(`${fieldName} est obligatoire`, fieldName)
    }
    return true
  },

  email: (value, fieldName = 'Email') => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      throw new ValidationError(`${fieldName} invalide`, fieldName)
    }
    return true
  },

  minLength: (value, minLength, fieldName) => {
    if (value.length < minLength) {
      throw new ValidationError(
        `${fieldName} doit contenir au moins ${minLength} caractères`,
        fieldName
      )
    }
    return true
  },

  maxLength: (value, maxLength, fieldName) => {
    if (value.length > maxLength) {
      throw new ValidationError(
        `${fieldName} ne peut pas dépasser ${maxLength} caractères`,
        fieldName
      )
    }
    return true
  },

  password: (value, fieldName = 'Mot de passe') => {
    if (value.length < 8) {
      throw new ValidationError(
        'Le mot de passe doit contenir au moins 8 caractères',
        fieldName
      )
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      throw new ValidationError(
        'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre',
        fieldName
      )
    }
    return true
  }
}

/**
 * Gestionnaire d'erreurs pour les requêtes Supabase
 */
export const handleSupabaseError = (error) => {
  if (!error) {return null}

  const { message, code } = error

  switch (code) {
    case 'invalid_credentials':
      return new AuthenticationError(errorMessages.AUTH_INVALID_CREDENTIALS)
    case 'email_already_exists':
      return new ValidationError(errorMessages.AUTH_EMAIL_ALREADY_EXISTS, 'email')
    case 'weak_password':
      return new ValidationError(errorMessages.AUTH_WEAK_PASSWORD, 'password')
    case 'invalid_email':
      return new ValidationError(errorMessages.AUTH_INVALID_EMAIL, 'email')
    case 'session_expired':
      return new AuthenticationError(errorMessages.AUTH_SESSION_EXPIRED)
    default:
      return new AppError(message || errorMessages.UNKNOWN_ERROR, code)
  }
}

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  NotFoundError,
  errorMessages,
  errorLogger,
  handleError,
  withErrorHandling,
  useErrorHandler,
  ErrorBoundary,
  validators,
  handleSupabaseError
}