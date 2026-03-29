// Configuration de l'API Backend
export const API_CONFIG = {
  // URL de base pour le backend
  BASE_URL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3045'),
  
  // Endpoints des paiements
  PAYMENTS: {
    MOBILE_MONEY: '/api/mobile-money/create-payment',
    MOBILE_CONFIRM: '/api/mobile-money/confirm-payment',
    PAYPAL_CREATE: '/api/paypal/create-order',
    PAYPAL_CAPTURE: '/api/paypal/capture-order',
    STRIPE_CREATE: '/api/payments/create-stripe-payment',
    STRIPE_CONFIRM: '/api/payments/confirm-stripe-payment',
  },

  DEMO_BILLING: {
    ACTIVATE_PACK: '/api/demo-billing/activate-pack',
    PRORATA_QUOTE: '/api/demo-billing/prorata-quote',
  },
  
  // Configuration des headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Timeout pour les requêtes (en millisecondes)
  TIMEOUT: 30000,
  
  // Nombre de tentatives en cas d'erreur
  RETRY_ATTEMPTS: 3,
  
  // Délai entre les tentatives (en millisecondes)
  RETRY_DELAY: 1000,
};

// Fonction utilitaire pour construire les URLs complètes
export const buildApiUrl = (endpoint) => {
  // Si l'endpoint commence déjà par http, retourner tel quel
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  // Construire l'URL complète
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, ''); // Enlever le slash final si présent
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${baseUrl}${cleanEndpoint}`;
};

// Fonction pour effectuer des appels API avec gestion d'erreur
export const apiCall = async (endpoint, options = {}) => {
  const url = buildApiUrl(endpoint);
  const headers = { ...API_CONFIG.HEADERS, ...options.headers };
  
  const config = {
    ...options,
    headers,
    signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
  };
  
  let lastError;
  
  for (let attempt = 1; attempt <= API_CONFIG.RETRY_ATTEMPTS; attempt++) {
    try {
      console.log(`🔄 Tentative ${attempt} - Appel API: ${url}`);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Succès - Appel API: ${url}`, data);
      return data;
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Erreur tentative ${attempt} - Appel API: ${url}`, error.message);
      
      if (attempt < API_CONFIG.RETRY_ATTEMPTS) {
        console.log(`⏳ Attente ${API_CONFIG.RETRY_DELAY}ms avant la tentative suivante...`);
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
      }
    }
  }
  
  throw new Error(`Échec après ${API_CONFIG.RETRY_ATTEMPTS} tentatives: ${lastError.message}`);
};

// Fonctions spécifiques pour les paiements
export const mobileMoneyApi = {
  createPayment: async (paymentData) => {
    return apiCall(API_CONFIG.PAYMENTS.MOBILE_MONEY, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },
  
  confirmPayment: async (confirmationData) => {
    return apiCall(API_CONFIG.PAYMENTS.MOBILE_CONFIRM, {
      method: 'POST',
      body: JSON.stringify(confirmationData),
    });
  },
};

export const paypalApi = {
  createOrder: async (orderData) => {
    return apiCall(API_CONFIG.PAYMENTS.PAYPAL_CREATE, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },
  
  captureOrder: async (orderId) => {
    return apiCall(`${API_CONFIG.PAYMENTS.PAYPAL_CAPTURE}/${orderId}`, {
      method: 'POST',
    });
  },
};

export const stripeApi = {
  createPaymentIntent: async (paymentData) => {
    return apiCall(API_CONFIG.PAYMENTS.STRIPE_CREATE, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },
  
  confirmPayment: async (paymentData) => {
    return apiCall(API_CONFIG.PAYMENTS.STRIPE_CONFIRM, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },
};

export const demoBillingApi = {
  activatePack: async ({ userId, packId, source, transactionId }) => {
    const qs = new URLSearchParams({
      userId: String(userId || ''),
      packId: String(packId || ''),
      source: String(source || 'demo_payment'),
    });
    if (transactionId) qs.set('transactionId', String(transactionId));
    return apiCall(`${API_CONFIG.DEMO_BILLING.ACTIVATE_PACK}?${qs.toString()}`);
  },
  prorataQuote: async ({ userId, packId }) => {
    const qs = new URLSearchParams({
      userId: String(userId || ''),
      packId: String(packId || ''),
    });
    return apiCall(`${API_CONFIG.DEMO_BILLING.PRORATA_QUOTE}?${qs.toString()}`);
  },
};
