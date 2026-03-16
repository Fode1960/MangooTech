import { create } from 'zustand';
import { demoBillingApi, mobileMoneyApi, paypalApi, stripeApi } from '../config/api.js';
import { getCurrentUserId } from '../utils/uuid.js';
import { ensureWalletBalance, debitWalletBalance, creditWalletBalance } from '../utils/demoWallet.js';

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
  WAVE: {
    id: 'wave',
    name: 'Wave',
    icon: '🌊',
    currency: 'XOF',
    countries: ['CI', 'SN', 'ML', 'BF'],
    description: 'Paiement mobile Wave',
    processingFee: 0.01,
  },
  FREE_MOBILE: {
    id: 'free_mobile',
    name: 'Free Mobile',
    icon: '📶',
    currency: 'XOF',
    countries: ['SN'],
    description: 'Paiement mobile Free',
    processingFee: 0.012,
  },
  MANGOO_PAY: {
    id: 'mangoo_balance',
    name: 'Mangoo Pay (Solde)',
    icon: '🧾',
    currency: 'XOF',
    countries: ['CI', 'SN', 'ML', 'BF', 'FR', 'BE', 'CA', 'US', 'DE', 'IT', 'GH', 'UG', 'RW', 'TG', 'BJ'],
    description: 'Paiement via votre solde Mangoo',
    processingFee: 0,
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
    const method = Object.values(PAYMENT_METHODS).find((m) => m.id === methodId) || PAYMENT_METHODS[methodId];
    if (!method) return 0;
    
    const baseAmount = parseFloat(amount);
    if (!Number.isFinite(baseAmount) || baseAmount <= 0) return 0;
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

    const maybeActivateDemoPack = async (transactionId = null) => {
      const packId = paymentData?.packId;
      const userId = paymentData?.userId;
      if (!packId || !userId) return;
      try {
        let previousPackId = null;
        try {
          const rawPrev = localStorage.getItem('mangoo-active-pack');
          const prev = rawPrev ? JSON.parse(rawPrev) : null;
          if (prev && typeof prev === 'object' && String(prev.userId || '') === String(userId)) {
            previousPackId = prev.packId || null;
          }
        } catch {
        }

        const resp = await demoBillingApi.activatePack({ userId, packId, source: `client_${method}`, transactionId });
        const activatedPackId = resp?.userPack?.pack_id || packId;
        const prorata = resp?.userPack?.metadata?.prorata || null;
        const creditAmount = Number(prorata?.creditAmount);
        try {
          localStorage.setItem('mangoo-active-pack', JSON.stringify({
            userId,
            packId: activatedPackId,
            activatedAt: new Date().toISOString(),
            source: `client_${method}`,
            startedAt: resp?.userPack?.started_at || null,
            expiresAt: resp?.userPack?.expires_at || null,
            prorata: prorata || null
          }));

          try {
            const historyRaw = localStorage.getItem('mangoo-pack-history');
            const historyData = historyRaw ? JSON.parse(historyRaw) : {};
            const map = historyData && typeof historyData === 'object' ? historyData : {};
            const key = String(userId);
            const list = Array.isArray(map[key]) ? map[key] : [];
            if (previousPackId && String(previousPackId) === String(activatedPackId)) {
              map[key] = list;
              localStorage.setItem('mangoo-pack-history', JSON.stringify(map));
            } else {
              const entry = {
                at: new Date().toISOString(),
                fromPackId: previousPackId,
                toPackId: activatedPackId,
                source: `client_${method}`,
                txId: resp?.userPack?.metadata?.transactionId || transactionId || null,
                prorata: prorata || null
              };
              map[key] = [entry, ...list].slice(0, 50);
              localStorage.setItem('mangoo-pack-history', JSON.stringify(map));
            }
          } catch {
          }

          if (Number.isFinite(creditAmount) && creditAmount > 0) {
            try {
              creditWalletBalance(String(userId), creditAmount);
            } catch {
            }
          }

          try {
            window.dispatchEvent(new Event('mangoo-pack-updated'));
          } catch {
          }
        } catch {
        }
      } catch {
      }
    };

    const isFetchError = (err) => {
      const msg = String(err?.message || '').toLowerCase();
      return msg.includes('fetch failed') || msg.includes('échec après') || msg.includes('http 500') || msg.includes('database_error');
    };

    const simulateTransaction = async (override = {}) => {
      await new Promise(resolve => setTimeout(resolve, 650));
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
        demo: true,
        ...override,
      };
      get().addTransaction(transaction);
      set({ isProcessing: false, paymentStatus: { success: true, transaction, message: 'Paiement effectué (mode démo)' } });
      await maybeActivateDemoPack(transaction.id);
      return transaction;
    };

    const walletKey = String(paymentData?.userId || '').trim() || String(paymentData?.email || '').trim();
    try {
      if (!amount || !method || !currency) {
        throw new Error('Données de paiement incomplètes');
      }
      if (['orange_money', 'mtn_momo', 'moov_money', 'wave', 'free_mobile'].includes(method) && !phoneNumber) {
        throw new Error('Numéro de téléphone requis pour le paiement mobile');
      }
      if (method === 'paypal' && !email) {
        throw new Error('Email requis pour PayPal');
      }


      if (method === 'mangoo_balance') {
        if (!walletKey) {
          throw new Error('Veuillez vous reconnecter pour utiliser le solde Mangoo Pay');
        }
        const initBalance = ensureWalletBalance(walletKey, 300000) ?? 0;
        const processingFee = get().calculateProcessingFee(amount, method);
        const totalAmount = parseFloat(amount) + processingFee;
        if (initBalance < totalAmount) {
          throw new Error('Solde insuffisant. Veuillez recharger votre solde Mangoo Pay.');
        }
        debitWalletBalance(walletKey, totalAmount);
        const tx = await simulateTransaction({ id: `WAL${Date.now()}`, method: 'mangoo_balance', currency: 'XOF' });
        return tx;
      }
      if (['orange_money', 'mtn_momo', 'moov_money', 'wave', 'free_mobile'].includes(method)) {
        
        
        // Obtenir l'ID utilisateur actuel (anonyme ou connecté)
        const userId = paymentData?.userId || getCurrentUserId();
        console.log(`👤 ID utilisateur utilisé: ${userId}`);
        
        try {
          const createData = await mobileMoneyApi.createPayment({
            user_id: userId,
            amount,
            currency,
            method,
            phone_number: phoneNumber,
            description,
            pack_id: paymentData?.packId,
            pack_name: paymentData?.packName,
            pack_price: paymentData?.packPrice,
          });
          console.log(`✅ Paiement créé:`, createData);
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
          if (confirmData.status === 'succeeded') await maybeActivateDemoPack(createData.transactionId);
          return transaction;
        } catch (err) {
          if (isFetchError(err)) {
            return simulateTransaction({ method, currency });
          }
          throw err;
        }
      }
      
      // PayPal
      if (method === 'paypal') {
        console.log(`🚀 Création commande PayPal`);
        
        const userId = paymentData?.userId || getCurrentUserId();
        
        try {
          const orderData = await paypalApi.createOrder({
            user_id: userId,
            amount,
            currency,
            description,
            email,
            pack_id: paymentData?.packId,
            pack_name: paymentData?.packName,
            pack_price: paymentData?.packPrice,
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
          if (captureData.status === 'completed') await maybeActivateDemoPack(orderData.orderId);
          return transaction;
        } catch (err) {
          if (isFetchError(err)) {
            return simulateTransaction({ method: 'paypal', currency });
          }
          throw err;
        }
      }
      
      // Stripe
      if (method === 'stripe') {
        console.log(`🚀 Création paiement Stripe`);
        
        const userId = paymentData?.userId || getCurrentUserId();
        
        try {
          const intentData = await stripeApi.createPaymentIntent({
            user_id: userId,
            amount,
            currency,
            description,
            customer_email: email,
            pack_id: paymentData?.packId,
            pack_name: paymentData?.packName,
            pack_price: paymentData?.packPrice,
          });
          console.log(`✅ Intent Stripe créé:`, intentData);
        
          if (intentData.paymentId) {
            localStorage.setItem('currentPaymentId', intentData.paymentId);
            console.log(`💾 ID de paiement sauvegardé:`, intentData.paymentId);
          }
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
            status: 'pending',
            paymentId: intentData.paymentId,
            timestamp: new Date().toISOString(),
          };
          console.log(`✅ Transaction Stripe créée (en attente de confirmation):`, transaction);
          get().addTransaction(transaction);
          set({ isProcessing: false, paymentStatus: { success: true, transaction, message: 'Paiement Stripe en cours de confirmation...' } });
          await maybeActivateDemoPack(intentData.paymentIntentId);
          return transaction;
        } catch (err) {
          if (isFetchError(err)) {
            return simulateTransaction({ method: 'stripe', currency });
          }
          throw err;
        }
      }

      return simulateTransaction();
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
