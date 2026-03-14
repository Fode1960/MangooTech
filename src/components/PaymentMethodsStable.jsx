import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { usePaymentStore, PAYMENT_METHODS } from '../stores/paymentStore';
import { useThemeStore } from '../stores/themeStore';
import { toast } from 'sonner';
import { ensureWalletBalance, getWalletBalance, creditWalletBalance } from '../utils/demoWallet';

export const PaymentMethods = ({ 
  amount, 
  currency = 'XOF', 
  country = 'CI', 
  onPaymentSuccess, 
  onPaymentError,
  userId = 'demo-user',
  packId,
  packName,
  packPrice,
  description = 'Paiement MangooTech'
}) => {
  const { isDark } = useThemeStore();
  const { 
    selectedPaymentMethod, 
    setSelectedPaymentMethod, 
    processPayment, 
    isProcessing, 
    paymentStatus,
    resetPaymentStatus,
    calculateProcessingFee,
    convertCurrency,
    setCurrentCurrency,
    currentCurrency
  } = usePaymentStore();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const [walletTopupAmount, setWalletTopupAmount] = useState('');
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [walletTopupChannel, setWalletTopupChannel] = useState('');
  const [walletTopupOpen, setWalletTopupOpen] = useState(false);
  const [walletTopupMethod, setWalletTopupMethod] = useState('wave');
  const [walletTopupReference, setWalletTopupReference] = useState('');

  const walletStorageKey = 'demo_wallet_balances';

  useEffect(() => {
    if (!selectedPaymentMethod || selectedPaymentMethod.id !== 'mangoo_balance') {
      setWalletTopupOpen(false);
      setWalletTopupChannel('');
      setWalletTopupAmount('');
      setWalletTopupReference('');
      return;
    }
    setWalletTopupOpen(false);
    setWalletTopupChannel('');
    setWalletTopupAmount('');
    setWalletTopupReference('');
  }, [selectedPaymentMethod]);

  useEffect(() => {
    try {
      if (!userId) return;
      setWalletBalance(ensureWalletBalance(userId, 300000));
    } catch {
      setWalletBalance(null);
    }
  }, [userId]);

  const refreshWalletBalance = useCallback(() => {
    try {
      if (!userId) return;
      setWalletBalance(getWalletBalance(userId));
    } catch {
      setWalletBalance(null);
    }
  }, [userId]);

  const creditWallet = useCallback((creditAmount) => {
    creditWalletBalance(userId, creditAmount);
  }, [userId]);

  const handleWalletTopup = useCallback(async () => {
    if (!userId) {
      alert('⚠️ Veuillez vous reconnecter pour recharger votre solde.');
      return;
    }

    if (!walletTopupChannel) {
      alert('⚠️ Veuillez choisir une méthode de rechargement.');
      return;
    }

    const cleaned = String(walletTopupAmount || '').replace(/[^\d]/g, '');
    const amount = Number(cleaned);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert('⚠️ Montant invalide.');
      return;
    }

    setIsToppingUp(true);
    try {
      const currentUserRaw = localStorage.getItem('mangoo-current-user') || localStorage.getItem('user');
      const currentUser = currentUserRaw ? (() => { try { return JSON.parse(currentUserRaw); } catch { return null; } })() : null;
      const resolvedUserId = currentUser?.id || currentUser?.email || userId;

      if (walletTopupChannel === 'mobile_money') {
        if (!phoneNumber) {
          alert('⚠️ Numéro de téléphone requis pour le rechargement Mobile Money.');
          return;
        }
        await processPayment({
          method: walletTopupMethod,
          amount: String(amount),
          currency: 'XOF',
          phoneNumber,
          description: 'Recharge solde Mangoo Pay',
          userId: resolvedUserId,
          authToken: localStorage.getItem('token') || 'demo-token'
        });
        creditWallet(amount);
      } else if (walletTopupChannel === 'card') {
        if (!email) {
          alert('⚠️ Email requis pour le rechargement par carte.');
          return;
        }
        await processPayment({
          method: 'stripe',
          amount: String(amount),
          currency: 'XOF',
          email,
          description: 'Recharge solde Mangoo Pay',
          userId: resolvedUserId,
          authToken: localStorage.getItem('token') || 'demo-token'
        });
        creditWallet(amount);
      } else {
        const ref = String(walletTopupReference || '').trim();
        if (ref.length < 4) {
          alert('⚠️ Référence de transfert requise (min 4 caractères).');
          return;
        }
        creditWallet(amount);
      }

      setWalletTopupAmount('');
      setWalletTopupReference('');
      refreshWalletBalance();
      toast.success('Solde rechargé');
    } catch (e) {
      toast.error('Impossible de recharger le solde');
    } finally {
      setIsToppingUp(false);
    }
  }, [creditWallet, email, phoneNumber, processPayment, refreshWalletBalance, userId, walletTopupChannel, walletTopupMethod, walletTopupAmount, walletTopupReference]);

  // Mémoïser les calculs pour éviter les re-rendus inutiles
  const convertedAmount = useMemo(() => {
    if (isTransitioning) return amount;
    return convertCurrency(amount, currency, currentCurrency);
  }, [amount, currency, currentCurrency, convertCurrency, isTransitioning]);
  
  const processingFee = useMemo(() => {
    if (!selectedPaymentMethod || isTransitioning) return 0;
    return calculateProcessingFee(convertedAmount, selectedPaymentMethod.id);
  }, [selectedPaymentMethod, convertedAmount, calculateProcessingFee, isTransitioning]);
  
  const totalAmount = useMemo(() => {
    return parseFloat(convertedAmount) + processingFee;
  }, [convertedAmount, processingFee]);

  // Séparer les méthodes de manière stable - SANS FILTRE PAYS
  const localMethods = useMemo(() => {
    return Object.values(PAYMENT_METHODS).filter(method => 
      ['orange_money', 'mtn_momo', 'moov_money', 'wave', 'free_mobile', 'mangoo_balance'].includes(method.id)
    );
  }, []);
  
  const internationalMethods = useMemo(() => {
    return Object.values(PAYMENT_METHODS).filter(method => 
      ['paypal', 'stripe'].includes(method.id)
    );
  }, []);

  // Gestionnaire sécurisé du changement de devise
  const handleCurrencyChange = useCallback((newCurrency) => {
    if (newCurrency === currentCurrency) return;
    
    setIsTransitioning(true);
    setShowForm(false);
    
    // Utiliser un délai pour permettre au DOM de se stabiliser
    setTimeout(() => {
      setSelectedPaymentMethod(null);
      setCurrentCurrency(newCurrency);
      setIsTransitioning(false);
    }, 150);
  }, [currentCurrency, setSelectedPaymentMethod, setCurrentCurrency]);

  const handleMethodSelect = useCallback((method) => {
    setSelectedPaymentMethod(method);
    setShowForm(true);
    resetPaymentStatus();
  }, [setSelectedPaymentMethod, resetPaymentStatus]);

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!selectedPaymentMethod) return;
    
    // Vérifier que l'utilisateur est toujours connecté avant le paiement
    const currentUserRaw = localStorage.getItem('mangoo-current-user') || localStorage.getItem('user');
    if (!currentUserRaw) {
      alert('⚠️ Votre session a expiré. Veuillez vous reconnecter.');
      if (onPaymentError) {
        onPaymentError(new Error('Session expirée'));
      }
      return;
    }

    let currentUser = null;
    try {
      currentUser = JSON.parse(currentUserRaw);
    } catch {
      currentUser = null;
    }
    if (!currentUser || (!currentUser.id && !currentUser.email)) {
      alert('⚠️ Votre session a expiré. Veuillez vous reconnecter.');
      if (onPaymentError) {
        onPaymentError(new Error('Session expirée'));
      }
      return;
    }
    
    try {
      await processPayment({
        method: selectedPaymentMethod.id,
        amount: convertedAmount,
        currency: currentCurrency,
        phoneNumber: phoneNumber,
        email: email,
        userId: currentUser.id || currentUser.email || 'anonymous',
        authToken: localStorage.getItem('token') || 'demo-token'
      });

      if (selectedPaymentMethod.id === 'mangoo_balance') {
        refreshWalletBalance();
      }
      
      if (onPaymentSuccess) {
        onPaymentSuccess({
          id: `tx-${Date.now()}`,
          provider: selectedPaymentMethod.id,
          method: selectedPaymentMethod,
          amount: totalAmount,
          currency: currentCurrency,
          userId: currentUser.id || currentUser.email
        });
      }
    } catch (error) {
      if (onPaymentError) {
        onPaymentError(error);
      }
    }
  };

  // Fonction pour finaliser le paiement - SIMPLIFIÉ
  const handleFinalizePayment = () => {
    if (!selectedPaymentMethod) {
      alert('Veuillez sélectionner une méthode de paiement');
      return;
    }
    
    // Toujours montrer le formulaire pour toutes les méthodes
    setShowForm(true);
  };

  // Rendu conditionnel pendant la transition
  if (isTransitioning) {
    return (
      <div className={`rounded-xl shadow-lg p-6 transition-colors duration-300 ${
        isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
      }`}>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔄</div>
          <p className={`text-lg font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Changement de devise en cours...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl shadow-lg p-6 transition-colors duration-300 ${
      isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
    }`}>
      <h3 className={`text-xl font-semibold mb-6 transition-colors duration-300 ${
        isDark ? 'text-white' : 'text-gray-900'
      }`}>
        Choisir un moyen de paiement
      </h3>

      {/* Sélecteur de devise */}
      <div className={`rounded-lg p-4 mb-6 transition-colors duration-300 ${
        isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <span className={`font-medium transition-colors duration-300 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>Devise:</span>
          <select
            value={currentCurrency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className={`px-3 py-2 rounded-lg border transition-colors duration-300 ${
              isDark 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="XOF">Franc CFA (XOF)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="USD">Dollar (USD)</option>
          </select>
        </div>
        
        {/* Affichage des conversions */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className={`text-center p-2 rounded ${
            isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>
            <div className="font-medium">{parseFloat(amount).toLocaleString()} {currency}</div>
            <div className="text-xs">Montant original</div>
          </div>
          <div className={`text-center p-2 rounded ${
            isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>
            <div className="font-medium">
              {parseFloat(convertedAmount).toLocaleString()} {currentCurrency}
            </div>
            <div className="text-xs">Montant converti</div>
          </div>
          <div className={`text-center p-2 rounded ${
            isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>
            <div className="font-medium">
              1 {currency} = {convertCurrency(1, currency, currentCurrency)} {currentCurrency}
            </div>
            <div className="text-xs">Taux de change</div>
          </div>
        </div>
      </div>

      {/* Résumé de la commande */}
      <div className={`rounded-lg p-4 mb-6 transition-colors duration-300 ${
        isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex justify-between items-center mb-2">
          <span className={`transition-colors duration-300 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>Montant:</span>
          <span className={`font-semibold transition-colors duration-300 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {parseFloat(convertedAmount).toLocaleString()} {currentCurrency}
          </span>
        </div>
        {selectedPaymentMethod && (
          <div className="flex justify-between items-center mb-2">
            <span className={`transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>Frais ({(selectedPaymentMethod.processingFee * 100).toFixed(1)}%):</span>
            <span className={`font-semibold transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {processingFee.toFixed(0)} {currentCurrency}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-600">
          <span className={`font-semibold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Total:</span>
          <span className={`font-bold text-lg text-orange-600`}>
            {totalAmount.toFixed(0)} {currentCurrency}
          </span>
        </div>
        
        {/* Bouton de finalisation visible - CORRIGÉ */}
        {selectedPaymentMethod && !showForm && (
          <button
            onClick={handleFinalizePayment}
            disabled={false} // Toujours actif pour permettre l'accès au formulaire
            className={`w-full mt-4 py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white shadow-lg`}
          >
            Finaliser le paiement de ${totalAmount.toFixed(0)} ${currentCurrency}
          </button>
        )}
      </div>

      {/* Méthodes de paiement locales */}
      {localMethods.length > 0 && (
        <div className="mb-6">
          <h4 className={`text-lg font-medium mb-3 transition-colors duration-300 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            💳 Paiements Locaux (Afrique)
          </h4>
          <div className="space-y-3">
            {localMethods.map((method) => (
              <button
                key={`${method.id}-${currentCurrency}`}
                type="button"
                onClick={() => handleMethodSelect(method)}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] ${
                  selectedPaymentMethod?.id === method.id
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-lg'
                    : method.currency !== currentCurrency
                    ? isDark
                      ? 'border-yellow-600 bg-yellow-900/20 opacity-75'
                      : 'border-yellow-300 bg-yellow-50 opacity-75'
                    : isDark
                    ? 'border-gray-600 bg-gray-700 hover:bg-gray-600 hover:border-orange-400'
                    : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-orange-400 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{method.icon}</span>
                    <div className="text-left">
                      <div className={`font-medium transition-colors duration-300 ${
                        method.currency !== currentCurrency
                          ? isDark ? 'text-yellow-300' : 'text-yellow-700'
                          : isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {method.name}
                        {method.currency !== currentCurrency && (
                          <span className="ml-2 text-xs font-normal">
                            ({method.currency})
                          </span>
                        )}
                      </div>
                      <div className={`text-sm transition-colors duration-300 ${
                        method.currency !== currentCurrency
                          ? isDark ? 'text-yellow-400' : 'text-yellow-600'
                          : isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {method.description}
                        {method.currency !== currentCurrency && (
                          <span className="block text-xs">
                            Conversion automatique en {currentCurrency}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`text-xs font-medium transition-colors duration-300 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {(method.processingFee * 100).toFixed(1)}% frais
                    </div>
                    {selectedPaymentMethod?.id === method.id && (
                      <div className="text-orange-500 text-lg">✓</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Méthodes de paiement internationaux */}
      {internationalMethods.length > 0 && (
        <div className="mb-6">
          <h4 className={`text-lg font-medium mb-3 transition-colors duration-300 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            🌍 Paiements Internationaux
          </h4>
          <div className="space-y-3">
            {internationalMethods.map((method) => (
              <button
                key={`${method.id}-${currentCurrency}`}
                type="button"
                onClick={() => handleMethodSelect(method)}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] ${
                  selectedPaymentMethod?.id === method.id
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-lg'
                    : method.currency !== currentCurrency
                    ? isDark
                      ? 'border-yellow-600 bg-yellow-900/20 opacity-75'
                      : 'border-yellow-300 bg-yellow-50 opacity-75'
                    : isDark
                    ? 'border-gray-600 bg-gray-700 hover:bg-gray-600 hover:border-orange-400'
                    : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-orange-400 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{method.icon}</span>
                    <div className="text-left">
                      <div className={`font-medium transition-colors duration-300 ${
                        method.currency !== currentCurrency
                          ? isDark ? 'text-yellow-300' : 'text-yellow-700'
                          : isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {method.name}
                        {method.currency !== currentCurrency && (
                          <span className="ml-2 text-xs font-normal">
                            ({method.currency})
                          </span>
                        )}
                      </div>
                      <div className={`text-sm transition-colors duration-300 ${
                        method.currency !== currentCurrency
                          ? isDark ? 'text-yellow-400' : 'text-yellow-600'
                          : isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {method.description}
                        {method.currency !== currentCurrency && (
                          <span className="block text-xs">
                            Conversion automatique en {currentCurrency}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`text-xs font-medium transition-colors duration-300 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {(method.processingFee * 100).toFixed(1)}% frais
                    </div>
                    {selectedPaymentMethod?.id === method.id && (
                      <div className="text-orange-500 text-lg">✓</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Formulaire de paiement */}
      {showForm && selectedPaymentMethod && (
        <form onSubmit={handlePayment} className="space-y-4">
          {/* Info de conversion */}
          {currentCurrency !== currency && (
            <div className={`p-3 rounded-lg text-sm ${
              isDark ? 'bg-blue-900/20 border border-blue-700 text-blue-300' : 'bg-blue-50 border border-blue-200 text-blue-700'
            }`}>
              💱 Conversion: {amount} {currency} = {convertCurrency(amount, currency, currentCurrency)} {currentCurrency}
              <br />
              <span className="text-xs">Taux: 1 {currency} = {convertCurrency(1, currency, currentCurrency)} {currentCurrency}</span>
            </div>
          )}
          
          {/* Champs spécifiques selon la méthode - CORRIGÉ */}
          {['orange_money', 'mtn_momo', 'moov_money', 'wave', 'free_mobile'].includes(selectedPaymentMethod.id) && (
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Numéro de téléphone
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+225 01 23 45 67 89"
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-300 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          )}

          {selectedPaymentMethod.id === 'mangoo_balance' && (
            <div className={`p-3 rounded-lg text-sm ${
              isDark ? 'bg-emerald-900/20 border border-emerald-700 text-emerald-300' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  Solde Mangoo Pay: <span className="font-semibold">{(walletBalance ?? 0).toLocaleString('fr-FR')} XOF</span>
                </div>
                <button
                  type="button"
                  onClick={refreshWalletBalance}
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    isDark ? 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100' : 'bg-emerald-200 hover:bg-emerald-300 text-emerald-900'
                  }`}
                >
                  Actualiser
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setWalletTopupChannel('mobile_money');
                    setWalletTopupOpen(true);
                    setWalletTopupAmount('');
                    setWalletTopupReference('');
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    walletTopupChannel === 'mobile_money'
                      ? isDark ? 'bg-emerald-700 text-white' : 'bg-emerald-300 text-emerald-900'
                      : isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 border border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  Mobile Money
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setWalletTopupChannel('card');
                    setWalletTopupOpen(true);
                    setWalletTopupAmount('');
                    setWalletTopupReference('');
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    walletTopupChannel === 'card'
                      ? isDark ? 'bg-emerald-700 text-white' : 'bg-emerald-300 text-emerald-900'
                      : isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 border border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  Carte bancaire
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setWalletTopupChannel('credit_transfer');
                    setWalletTopupOpen(true);
                    setWalletTopupAmount('');
                    setWalletTopupReference('');
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    walletTopupChannel === 'credit_transfer'
                      ? isDark ? 'bg-emerald-700 text-white' : 'bg-emerald-300 text-emerald-900'
                      : isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 border border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  Transfert de crédit
                </button>
              </div>

              {!walletTopupOpen && (
                <div className={`${isDark ? 'text-emerald-200/80' : 'text-emerald-800/80'} mt-3 text-xs`}>
                  Cliquez sur une méthode ci-dessus pour ouvrir le formulaire de rechargement.
                </div>
              )}

              {walletTopupOpen && walletTopupChannel === 'mobile_money' && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className={`${isDark ? 'text-emerald-200/80' : 'text-emerald-800/80'} md:col-span-3 text-xs`}>
                    Saisissez le numéro Mobile Money qui recevra la demande de paiement.
                  </div>
                  <select
                    value={walletTopupMethod}
                    onChange={(e) => setWalletTopupMethod(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="wave">Wave</option>
                    <option value="orange_money">Orange Money</option>
                    <option value="mtn_momo">MTN Mobile Money</option>
                    <option value="moov_money">Moov Money</option>
                    <option value="free_mobile">Free Mobile</option>
                  </select>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Numéro Mobile Money"
                    className={`md:col-span-2 w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              )}

              {walletTopupOpen && walletTopupChannel === 'card' && (
                <div className="mt-3">
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email de reçu / facturation
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email de reçu / facturation (ex: mdansoko@mangoo.tech)"
                    className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <div className={`${isDark ? 'text-emerald-200/80' : 'text-emerald-800/80'} mt-2 text-xs`}>
                    Mode démo : le paiement par carte est simulé (pas de redirection).
                  </div>
                </div>
              )}

              {walletTopupOpen && walletTopupChannel === 'credit_transfer' && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className={`${isDark ? 'text-emerald-200/80' : 'text-emerald-800/80'} md:col-span-3 text-xs`}>
                    Indiquez la référence reçue après votre transfert de crédit.
                  </div>
                  <input
                    type="text"
                    value={walletTopupReference}
                    onChange={(e) => setWalletTopupReference(e.target.value)}
                    placeholder="Référence / code de transfert"
                    className={`md:col-span-2 w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Téléphone (optionnel)"
                    className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              )}

              {walletTopupOpen && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={walletTopupAmount}
                    onChange={(e) => setWalletTopupAmount(e.target.value)}
                    placeholder="Montant à recharger (ex: 5000)"
                    disabled={isToppingUp}
                    className={`md:col-span-2 w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleWalletTopup}
                    disabled={isToppingUp}
                    className={`w-full py-2 px-3 rounded-lg font-semibold transition-colors ${
                      isToppingUp
                        ? isDark
                          ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isToppingUp ? 'Rechargement…' : 'Recharger'}
                  </button>
                </div>
              )}
            </div>
          )}
          
          {['paypal', 'stripe'].includes(selectedPaymentMethod.id) && (
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-300 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={
              isProcessing ||
              (['orange_money', 'mtn_momo', 'moov_money', 'wave', 'free_mobile'].includes(selectedPaymentMethod.id) && !phoneNumber) ||
              (['paypal', 'stripe'].includes(selectedPaymentMethod.id) && !email)
            }
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
              isProcessing ||
              (['orange_money', 'mtn_momo', 'moov_money', 'wave', 'free_mobile'].includes(selectedPaymentMethod.id) && !phoneNumber) ||
              (['paypal', 'stripe'].includes(selectedPaymentMethod.id) && !email)
                ? isDark
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Traitement...
              </span>
            ) : (
              `Payer ${totalAmount.toFixed(0)} ${currentCurrency}`
            )}
          </button>
        </form>
      )}

      {/* Statut du paiement */}
      {paymentStatus && (
        <div className={`mt-4 p-4 rounded-lg border transition-all duration-300 ${
          paymentStatus.success
            ? isDark
              ? 'bg-green-900/20 border-green-700 text-green-300'
              : 'bg-green-50 border-green-200 text-green-700'
            : isDark
            ? 'bg-red-900/20 border-red-700 text-red-300'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-lg">
              {paymentStatus.success ? '✅' : '❌'}
            </span>
            <span className="font-medium">{paymentStatus.message}</span>
          </div>
          {paymentStatus.success && paymentStatus.transaction && (
            <div className={`mt-2 text-sm transition-colors duration-300 ${
              isDark ? 'text-green-400' : 'text-green-600'
            }`}>
              <p>ID de transaction: {paymentStatus.transaction.id}</p>
              <p>Montant total: {paymentStatus.transaction.totalAmount} {currentCurrency}</p>
            </div>
          )}
        </div>
      )}

      {/* Message si aucune méthode disponible - MODIFIÉ */}
      {localMethods.length === 0 && internationalMethods.length === 0 && (
        <div className={`rounded-lg p-4 text-center transition-colors duration-300 ${
          isDark ? 'bg-yellow-900 border border-yellow-700 text-yellow-300' : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
        }`}>
          <p>Chargement des méthodes de paiement...</p>
          <p className="text-sm mt-1">Si le problème persiste, veuillez rafraîchir la page.</p>
        </div>
      )}
    </div>
  );
};
