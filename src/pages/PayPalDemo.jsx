import React, { useState } from 'react';
import { PayPalPayment } from '../components/PayPalPayment';
import { useThemeStore } from '../stores/themeStore';

const PayPalDemo = () => {
  const { isDark } = useThemeStore();
  const [paymentResult, setPaymentResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayPalSuccess = (result) => {
    console.log('✅ Paiement PayPal réussi:', result);
    setPaymentResult({
      success: true,
      message: 'Paiement PayPal réussi!',
      details: result
    });
    setIsProcessing(false);
  };

  const handlePayPalError = (error) => {
    console.error('❌ Erreur PayPal:', error);
    setPaymentResult({
      success: false,
      message: 'Erreur lors du paiement PayPal',
      error: error.message || 'Une erreur est survenue'
    });
    setIsProcessing(false);
  };

  const handlePayPalCancel = () => {
    console.log('🚫 Paiement PayPal annulé');
    setPaymentResult({
      success: false,
      message: 'Paiement annulé par l\'utilisateur'
    });
    setIsProcessing(false);
  };

  return (
    <div className={`min-h-screen py-8 px-4 transition-colors duration-300 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Démonstration Paiement PayPal
          </h1>
          <p className={`text-lg ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Testez l'intégration PayPal avec notre système de paiement
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section Paiement */}
          <div>
            <div className={`rounded-xl shadow-lg p-6 transition-colors duration-300 ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <h2 className={`text-xl font-semibold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Paiement PayPal Sécurisé
              </h2>
              
              <PayPalPayment
                amount={100.00}
                currency="EUR"
                userId="demo-user-123"
                packId="demo-pack-456"
                packName="Pack Premium"
                packPrice={100.00}
                description="Achat du Pack Premium MangooTech"
                onSuccess={handlePayPalSuccess}
                onError={handlePayPalError}
                onCancel={handlePayPalCancel}
              />
            </div>
          </div>

          {/* Section Résultats */}
          <div>
            <div className={`rounded-xl shadow-lg p-6 transition-colors duration-300 ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <h2 className={`text-xl font-semibold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Résultat du Paiement
              </h2>
              
              {!paymentResult ? (
                <div className={`text-center py-8 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <div className="text-4xl mb-4">💳</div>
                  <p>Effectuez un paiement pour voir les résultats ici</p>
                </div>
              ) : (
                <div className={`rounded-lg p-4 ${
                  paymentResult.success 
                    ? isDark 
                      ? 'bg-green-900 border border-green-700' 
                      : 'bg-green-50 border border-green-200'
                    : isDark 
                      ? 'bg-red-900 border border-red-700' 
                      : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">
                      {paymentResult.success ? '✅' : '❌'}
                    </span>
                    <h3 className={`font-semibold ${
                      paymentResult.success 
                        ? isDark ? 'text-green-300' : 'text-green-800'
                        : isDark ? 'text-red-300' : 'text-red-800'
                    }`}>
                      {paymentResult.message}
                    </h3>
                  </div>
                  
                  {paymentResult.details && (
                    <div className={`text-sm mt-2 ${
                      paymentResult.success 
                        ? isDark ? 'text-green-400' : 'text-green-600'
                        : isDark ? 'text-red-400' : 'text-red-600'
                    }`}>
                      <p><strong>ID de transaction:</strong> {paymentResult.details.payment?.id}</p>
                      <p><strong>Montant:</strong> {paymentResult.details.payment?.amount} {paymentResult.details.payment?.currency}</p>
                      <p><strong>Statut:</strong> {paymentResult.details.payment?.status}</p>
                    </div>
                  )}
                  
                  {paymentResult.error && (
                    <p className={`text-sm mt-2 ${
                      isDark ? 'text-red-400' : 'text-red-600'
                    }`}>
                      <strong>Erreur:</strong> {paymentResult.error}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Informations */}
            <div className={`mt-6 rounded-xl shadow-lg p-6 transition-colors duration-300 ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-3 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                À propos de PayPal
              </h3>
              <ul className={`space-y-2 text-sm ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Paiement sécurisé et rapide</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Accepte les cartes bancaires internationales</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Protection acheteur incluse</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Frais de transaction: 2.9% + 0.30€</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayPalDemo;