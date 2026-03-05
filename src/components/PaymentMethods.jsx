import React, { useState } from 'react';
import { usePaymentStore, PAYMENT_METHODS } from '../stores/paymentStore';
import { useThemeStore } from '../stores/themeStore';
import { StripePayment } from './StripePayment';
import { PayPalPayment } from './PayPalPayment';

export const PaymentMethods = ({ amount, currency = 'XOF', country = 'CI', onPaymentSuccess, onPaymentError }) => {
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
  
  const { isDark } = useThemeStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Obtenir les méthodes disponibles
  const availableMethods = Object.values(PAYMENT_METHODS);
  
  // Séparer les méthodes locales et internationales pour un meilleur affichage
  // Afficher toutes les méthodes disponibles, mais marquer celles qui ne sont pas dans la devise actuelle
  const localMethods = availableMethods.filter(method => 
    ['ORANGE_MONEY', 'MTN_MOMO', 'MOOV_MONEY'].includes(method.id)
  );
  const internationalMethods = availableMethods.filter(method => 
    ['PAYPAL', 'STRIPE'].includes(method.id)
  );

  const handleMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
    setShowForm(true);
    resetPaymentStatus();
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    try {
      // Convertir le montant dans la devise de la méthode de paiement
      const paymentAmount = currentCurrency !== currency ? 
        convertCurrency(amount, currency, currentCurrency) : amount;
      
      const transaction = await processPayment({
        amount: paymentAmount,
        method: selectedPaymentMethod.id,
        currency: currentCurrency,
        phoneNumber,
        email,
        description: `Achat sur MangooTech - ${paymentAmount} ${currentCurrency}`
      });
      
      if (onPaymentSuccess) {
        onPaymentSuccess(transaction);
      }
      
      // Réinitialiser le formulaire
      setPhoneNumber('');
      setEmail('');
      setShowForm(false);
      
    } catch (error) {
      if (onPaymentError) {
        onPaymentError(error);
      }
    }
  };

  // Convertir le montant dans la devise actuelle
  const convertedAmount = isTransitioning ? amount : convertCurrency(amount, currency, currentCurrency);
  
  // Calculer les frais dans la devise actuelle
  const processingFee = selectedPaymentMethod && !isTransitioning ? calculateProcessingFee(convertedAmount, selectedPaymentMethod.id) : 0;
  
  // Calculer le total
  const totalAmount = parseFloat(convertedAmount) + processingFee;

  return (
    <div className={`rounded-xl shadow-lg p-6 transition-colors duration-300 ${
      isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
    }`}>
      {isTransitioning && (
        <div className="mb-4 p-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg text-center">
          <span className="text-orange-600 dark:text-orange-400 text-sm">🔄 Changement de devise en cours...</span>
        </div>
      )}
      <h3 className={`text-xl font-semibold mb-6 transition-colors duration-300 ${
        isDark ? 'text-white' : 'text-gray-900'
      }`}>
        Choisir un moyen de paiement
      </h3>

      {/* Sélecteur de devise et conversion */}
      <div className={`rounded-lg p-4 mb-6 transition-colors duration-300 ${
        isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <span className={`font-medium transition-colors duration-300 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>Devise:</span>
          <select
            value={currentCurrency}
            onChange={(e) => {
              const newCurrency = e.target.value;
              // Marquer la transition comme en cours
              setIsTransitioning(true);
              
              // Réinitialiser la méthode de paiement si nécessaire
              if (selectedPaymentMethod && selectedPaymentMethod.currency !== newCurrency) {
                setSelectedPaymentMethod(null);
                setShowForm(false);
              }
              
              // Changer la devise après un court délai pour permettre au DOM de se stabiliser
              setTimeout(() => {
                setCurrentCurrency(newCurrency);
                setIsTransitioning(false);
              }, 100);
            }}
            className={`px-3 py-2 rounded-lg border transition-colors duration-300 ${
              isDark 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            disabled={isTransitioning}
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
              {isTransitioning ? '...' : `${parseFloat(convertedAmount).toLocaleString()} ${currentCurrency}`}
            </div>
            <div className="text-xs">Montant converti</div>
          </div>
          <div className={`text-center p-2 rounded ${
            isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>
            <div className="font-medium">
              {isTransitioning ? '...' : `1 ${currency} = ${convertCurrency(1, currency, currentCurrency)} ${currentCurrency}`}
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
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {parseFloat(convertedAmount).toFixed(0)} {currentCurrency}
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
        <div className="flex justify-between items-center pt-2 border-t border-gray-300">
          <span className={`font-semibold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Total:</span>
          <span className={`font-bold text-lg text-orange-600`}>
            {totalAmount.toFixed(0)} {currentCurrency}
          </span>
        </div>
      </div>

      {/* Méthodes de paiement locales */}
      {localMethods.length > 0 && (
        <div className="mb-6" key={`local-${currentCurrency}`}>
          <h4 className={`text-lg font-medium mb-3 transition-colors duration-300 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            💳 Paiements Locaux (Afrique)
          </h4>
          <div className="space-y-3">
            {localMethods.map((method) => (
              <button
                key={method.id}
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

      {internationalMethods.length > 0 && (
        <div className="mb-6" key={`international-${currentCurrency}`}>
          <h4 className={`text-lg font-medium mb-3 transition-colors duration-300 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            🌍 Paiements Internationaux
          </h4>
          <div className="space-y-3">
            {internationalMethods.map((method) => (
              <button
                key={method.id}
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
      {showForm && selectedPaymentMethod && !isTransitioning && (
        <form onSubmit={handlePayment} className="space-y-4" key={`form-${currentCurrency}`}>
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
          
          {/* Champs spécifiques selon la méthode */}
          {selectedPaymentMethod.id.includes('money') && (
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
                placeholder="+225 07 07 07 07 07"
                className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-300 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>
          )}

          {(selectedPaymentMethod.id === 'paypal' || selectedPaymentMethod.id === 'stripe') && (
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
                className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-300 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>
          )}

          {/* Bouton de paiement */}
          <button
            type="submit"
            disabled={isProcessing}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 transform hover:scale-105'
            } text-white`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Traitement en cours...</span>
              </div>
            ) : (
              `Payer ${parseFloat(totalAmount).toLocaleString()} ${currentCurrency} avec ${selectedPaymentMethod.name}`
            )}
          </button>
        </form>
      )}

      {/* Statut du paiement */}
      {paymentStatus && (
        <div className={`rounded-lg p-4 mt-4 transition-colors duration-300 ${
          paymentStatus.success
            ? isDark 
              ? 'bg-green-900 border border-green-700 text-green-300' 
              : 'bg-green-50 border border-green-200 text-green-800'
            : isDark 
              ? 'bg-red-900 border border-red-700 text-red-300' 
              : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-xl">
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

      {/* Message si aucune méthode disponible */}
      {localMethods.length === 0 && internationalMethods.length === 0 && (
        <div className={`rounded-lg p-4 mb-6 text-center transition-colors duration-300 ${
          isDark ? 'bg-yellow-900 border border-yellow-700 text-yellow-300' : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
        }`}>
          <p className="font-medium">⚠️ Aucune méthode de paiement disponible</p>
          <p className="text-sm mt-1">
            Changez de devise : 
            {currentCurrency === 'XOF' && ' Essayez EUR ou USD pour les paiements internationaux'}
            {currentCurrency === 'EUR' && ' Essayez XOF pour les paiements mobiles africains'}
            {currentCurrency === 'USD' && ' Essayez XOF pour les paiements mobiles africains ou EUR'}
          </p>
        </div>
      )}

      {/* Bouton annuler */}
      {showForm && (
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setSelectedPaymentMethod(null);
            resetPaymentStatus();
          }}
          className={`w-full mt-4 py-2 px-4 rounded-lg font-medium transition-colors duration-300 ${
            isDark 
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
          }`}
        >
          Choisir une autre méthode
        </button>
      )}
    </div>
  );
};

export default PaymentMethods;