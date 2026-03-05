import { create } from 'zustand';
import { mobileMoneyApi, paypalApi, stripeApi } from '../config/api.js';
import { getCurrentUserId } from '../utils/uuid.js';

// Configuration des méthodes de paiement
export const PAYMENT_METHODS = {
  // Paiements locaux africains
  ORANGE_MONEY: {
    id: 'orange_money',
    name: 'Orange Money',
    icon: '🟠',
    currency: 'XOF',
    countries: ['CI', 'SN', 'ML', 'BF'],
    description: 'Paiement mobile Orange Money',
    processingFee: 0.01, // 1% de frais
  },
  MTN_MOMO: {
    id: 'mtn_momo',
    name: 'MTN Mobile Money',
    icon: '🟡',
    currency: 'XOF',
    countries: ['CI', 'GH', 'UG', 'RW'],
    description: 'Paiement mobile MTN',
    processingFee: 0.015, // 1.5% de frais
  },
  MOOV_MONEY: {
    id: 'moov_money',
    name: 'Moov Money',
    icon: '🔵',
    currency: 'XOF',
    countries: ['CI', 'TG', 'BJ'],
    description: 'Paiement mobile Moov',
    processingFee: 0.012, // 1.2% de frais
  },
  // Paiements internationaux
  PAYPAL: {
    id: 'paypal',
    name: 'PayPal',
    icon: '💙',
    currency: 'EUR',
    countries: ['FR', 'BE', 'CA', 'US'],
    description: 'Paiement sécurisé PayPal',
    processingFee: 0.034, // 3.4% + 0.25€
  },
  STRIPE: {
    id: 'stripe',
    name: 'Carte Bancaire',
    icon: '💳',
    currency: 'EUR',
    countries: ['FR', 'BE', 'DE', 'IT'],
    description: 'Carte Visa, Mastercard, CB',
    processingFee: 0.025, // 2.5% de frais
  },
};

// Taux de change approximatifs
export const EXCHANGE_RATES = {
  EUR: { XOF: 655.957, USD: 1.08 },
  USD: { XOF: 607.5, EUR: 0.92 },
  XOF: { EUR: 0.00152, USD: 0.00164 },
};

export const usePaymentStore = create((set, get) => ({
  // État
  selectedPaymentMethod: null,
  currentCurrency: 'XOF',
  exchangeRates: EXCHANGE_RATES,
  availableMethods: [],
  isProcessing: false,
  paymentStatus: null,
  transactionHistory: [],

  // Méthodes
  setSelectedPaymentMethod: (method) => set({ selectedPaymentMethod: method }),
  setCurrentCurrency: (currency) => set({ currentCurrency: currency }),
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  setPaymentStatus: (status) => set({ paymentStatus: status }),
  resetPaymentStatus: () => set({ paymentStatus: null, isProcessing: false }),
  addTransaction: (transaction) => set((state) => ({
    transactionHistory: [transaction, ...state.transactionHistory],
  })),

  // Calculer les frais de traitement
  calculateProcessingFee: (amount, methodId) => {
    const method = PAYMENT_METHODS[methodId];
    if (!method) return 0;
    
    const baseAmount = parseFloat(amount);
    const fee = baseAmount * method.processingFee;
    
    // Minimum de frais pour les petites transactions
    const minFee = method.currency === 'XOF' ? 100 : 0.5;
    return Math.max(fee, minFee);
  },

  // Convertir entre devises
  convertCurrency: (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;
    
    const rates = get().exchangeRates;
    const rate = rates[fromCurrency]?.[toCurrency];
    
    if (!rate) {
      console.error(`Taux de change non disponible: ${fromCurrency} -> ${toCurrency}`);
      return amount;
    }
    
    return (parseFloat(amount) * rate).toFixed(2);
  },

  // Obtenir les méthodes disponibles selon le pays et la devise
  getAvailableMethods: (country, currency) => {
    return Object.values(PAYMENT_METHODS).filter(method => {
      // Filtrer par pays
      if (country && !method.countries.includes(country)) {
        return false;
      }
      
      // Filtrer par devise
      if (currency && method.currency !== currency) {
        return false;
      }
      
      return true;
    });
  },

  // Simuler le processus de paiement
  processPayment: async (paymentData) => {
    const { amount, method, currency, phoneNumber, email, description } = paymentData;
    set({ isProcessing: true, paymentStatus: null });
    try {
      if (!amount || !method || !currency) {
        throw new Error('Données de paiement incomplètes');
      }
      if (['orange_money', 'mtn_momo', 'moov_money'].includes(method) && !phoneNumber) {
        throw new Error('Numéro de téléphone requis pour le paiement mobile');
      }
      if (method === 'paypal' && !email) {
        throw new Error('Email requis pour PayPal');
      }

      if (['orange_money', 'mtn_momo', 'moov_money'].includes(method)) {
        console.log(`🚀 Création paiement mobile ${method} pour ${phoneNumber}`);
        
        // Obtenir l'ID utilisateur actuel (anonyme ou connecté)
        const userId = getCurrentUserId();
        console.log(`👤 ID utilisateur utilisé: ${userId}`);
        
        // Créer le paiement
        const createData = await mobileMoneyApi.createPayment({
          user_id: userId,
          amount,
          currency,
          method,
          phone_number: phoneNumber,
          description,
        });
        
        console.log(`✅ Paiement créé:`, createData);
        
        // Confirmer le paiement
        const confirmData = await mobileMoneyApi.confirmPayment({
          paymentId: createData.paymentId, 
          transactionId: createData.transactionId 
        });
        
        console.log(`✅ Paiement confirmé:`, confirmData);
        const processingFee = get().calculateProcessingFee(amount, method);
        const totalAmount = parseFloat(amount) + processingFee;
        const transaction = {
          id: createData.transactionId,
          amount: parseFloat(amount),
          processingFee,
          totalAmount,
          method,
          currency,
          phoneNumber,
          email,
          description,
          status: confirmData.status === 'succeeded' ? 'completed' : 'failed',
          timestamp: new Date().toISOString(),
        };
        get().addTransaction(transaction);
        set({ isProcessing: false, paymentStatus: { success: confirmData.status === 'succeeded', transaction, message: confirmData.status === 'succeeded' ? 'Paiement effectué avec succès!' : 'Paiement échoué' } });
        return transaction;
      }
      
      // PayPal
      if (method === 'paypal') {
        console.log(`🚀 Création commande PayPal`);
        
        const userId = getCurrentUserId();
        
        const orderData = await paypalApi.createOrder({
          userId: userId,
          amount,
          currency,
          description,
          email,
        });
        
        console.log(`✅ Commande PayPal créée:`, orderData);
        
        const captureData = await paypalApi.captureOrder(orderData.orderId);
        
        console.log(`✅ Commande PayPal capturée:`, captureData);
        
        const processingFee = get().calculateProcessingFee(amount, method);
        const totalAmount = parseFloat(amount) + processingFee;
        const transaction = {
          id: orderData.orderId,
          amount: parseFloat(amount),
          processingFee,
          totalAmount,
          method,
          currency,
          email,
          description,
          status: captureData.status === 'completed' ? 'completed' : 'failed',
          timestamp: new Date().toISOString(),
        };
        get().addTransaction(transaction);
        set({ isProcessing: false, paymentStatus: { success: captureData.status === 'completed', transaction, message: captureData.status === 'completed' ? 'Paiement PayPal effectué avec succès!' : 'Paiement PayPal échoué' } });
        return transaction;
      }
      
      // Stripe
      if (method === 'stripe') {
        console.log(`🚀 Création paiement Stripe`);
        
        const userId = getCurrentUserId();
        
        const intentData = await stripeApi.createPaymentIntent({
          user_id: userId,
          amount,
          currency,
          description,
          email,
        });
        
        console.log(`✅ Intent Stripe créé:`, intentData);
        
        // Sauvegarder l'ID de paiement pour la confirmation backend
        if (intentData.paymentId) {
          localStorage.setItem('currentPaymentId', intentData.paymentId);
          console.log(`💾 ID de paiement sauvegardé:`, intentData.paymentId);
        }
        
        // Le paiement Stripe est déjà confirmé côté client dans le composant StripePayment
        // Nous devons juste attendre la confirmation backend
        const processingFee = get().calculateProcessingFee(amount, method);
        const totalAmount = parseFloat(amount) + processingFee;
        const transaction = {
          id: intentData.paymentIntentId,
          amount: parseFloat(amount),
          processingFee,
          totalAmount,
          method,
          currency,
          email,
          description,
          status: 'pending', // Le statut sera mis à jour après confirmation backend
          paymentId: intentData.paymentId,
          timestamp: new Date().toISOString(),
        };
        
        console.log(`✅ Transaction Stripe créée (en attente de confirmation):`, transaction);
        get().addTransaction(transaction);
        set({ isProcessing: false, paymentStatus: { success: true, transaction, message: 'Paiement Stripe en cours de confirmation...' } });
        return transaction;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      const processingFee = get().calculateProcessingFee(amount, method);
      const totalAmount = parseFloat(amount) + processingFee;
      const transaction = {
        id: `MNG${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        amount: parseFloat(amount),
        processingFee,
        totalAmount,
        method,
        currency,
        phoneNumber,
        email,
        description,
        status: 'completed',
        timestamp: new Date().toISOString(),
      };
      get().addTransaction(transaction);
      set({ isProcessing: false, paymentStatus: { success: true, transaction, message: 'Paiement effectué avec succès!' } });
      return transaction;
    } catch (error) {
      set({ isProcessing: false, paymentStatus: { success: false, error: error.message, message: 'Erreur lors du paiement. Veuillez réessayer.' } });
      throw error;
    }
  },

  // Réinitialiser le statut de paiement
  resetPaymentStatus: () => set({ paymentStatus: null }),

  // Mettre à jour le statut d'une transaction après confirmation backend
  updateTransactionStatus: (transactionId, status, message) => set((state) => ({
    transactionHistory: state.transactionHistory.map(transaction =>
      transaction.id === transactionId 
        ? { ...transaction, status, updatedMessage: message }
        : transaction
    ),
    paymentStatus: state.paymentStatus?.transaction?.id === transactionId 
      ? { ...state.paymentStatus, message }
      : state.paymentStatus,
  })),
}));

export default usePaymentStore;