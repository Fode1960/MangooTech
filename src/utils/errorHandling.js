// Utilitaires de gestion d'erreurs
export const errorHandling = {
  // Gestionnaire d'erreurs global
  handleError: (error, context = '') => {
    console.error(`[${context}] Erreur:`, error);
    
    // Logique de notification ou de reporting d'erreurs
    if (process.env.NODE_ENV === 'production') {
      // Ici, vous pourriez envoyer l'erreur à un service comme Sentry
      // Sentry.captureException(error);
    }
    
    return {
      message: error.message || 'Une erreur inattendue s\'est produite',
      type: error.name || 'Error',
      context: context,
      timestamp: new Date().toISOString()
    };
  },

  // Gestionnaire d'erreurs asynchrone
  asyncHandler: (fn) => {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        return errorHandling.handleError(error, 'Async Operation');
      }
    };
  },

  // Valider les données d'entrée
  validateInput: (data, schema) => {
    const errors = [];
    
    for (const [key, rules] of Object.entries(schema)) {
      const value = data[key];
      
      if (rules.required && !value) {
        errors.push(`${key} est requis`);
      }
      
      if (value && rules.type && typeof value !== rules.type) {
        errors.push(`${key} doit être de type ${rules.type}`);
      }
      
      if (value && rules.min && value.length < rules.min) {
        errors.push(`${key} doit avoir au moins ${rules.min} caractères`);
      }
      
      if (value && rules.max && value.length > rules.max) {
        errors.push(`${key} ne doit pas dépasser ${rules.max} caractères`);
      }
      
      if (value && rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${key} n'est pas valide`);
      }
    }
    
    return errors.length > 0 ? errors : null;
  },

  // Créer une erreur personnalisée
  createError: (message, code = 'GENERIC_ERROR', details = null) => {
    const error = new Error(message);
    error.code = code;
    error.details = details;
    return error;
  },

  // Réessayer une opération
  retryOperation: async (operation, maxRetries = 3, delay = 1000) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`Tentative ${i + 1} échouée:`, error.message);
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }
    
    throw lastError;
  },

  // Nettoyer les erreurs pour l'affichage utilisateur
  sanitizeError: (error) => {
    if (process.env.NODE_ENV === 'development') {
      return error;
    }
    
    // En production, ne pas exposer les détails techniques
    return {
      message: 'Une erreur s\'est produite. Veuillez réessayer.',
      type: 'Error',
      timestamp: new Date().toISOString()
    };
  }
};

export default errorHandling;