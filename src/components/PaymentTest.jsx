import React, { useState, useEffect } from 'react';
import { PayPalPayment } from './PayPalPayment';
import { StripePayment } from './StripePayment';

export const PaymentTest = () => {
  const [testAmount] = useState(100); // 100 EUR pour les tests
  const [testResults, setTestResults] = useState({
    paypal: null,
    stripe: null
  });
  const [configStatus, setConfigStatus] = useState({
    paypal: 'checking',
    stripe: 'checking'
  });

  useEffect(() => {
    // Vérifier la configuration des paiements
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      // Vérifier PayPal
      const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
      setConfigStatus(prev => ({
        ...prev,
        paypal: paypalClientId && paypalClientId !== 'YOUR_PAYPAL_CLIENT_ID' ? 'configured' : 'missing'
      }));

      // Vérifier Stripe
      const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      setConfigStatus(prev => ({
        ...prev,
        stripe: stripePublishableKey && stripePublishableKey !== 'pk_test_your_stripe_publishable_key_here' ? 'configured' : 'missing'
      }));
    } catch (error) {
      console.error('Erreur lors de la vérification de la configuration:', error);
      setConfigStatus({
        paypal: 'error',
        stripe: 'error'
      });
    }
  };

  const handlePayPalSuccess = (data) => {
    console.log('PayPal - Paiement réussi:', data);
    setTestResults(prev => ({
      ...prev,
      paypal: { success: true, data }
    }));
  };

  const handlePayPalError = (error) => {
    console.error('PayPal - Erreur de paiement:', error);
    setTestResults(prev => ({
      ...prev,
      paypal: { success: false, error: error.message }
    }));
  };

  const handleStripeSuccess = (paymentIntent) => {
    console.log('Stripe - Paiement réussi:', paymentIntent);
    setTestResults(prev => ({
      ...prev,
      stripe: { success: true, data: paymentIntent }
    }));
  };

  const handleStripeError = (error) => {
    console.error('Stripe - Erreur de paiement:', error);
    setTestResults(prev => ({
      ...prev,
      stripe: { success: false, error: error.message }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Test des Paiements</h2>
      
      {/* Statut de configuration */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">État de la Configuration</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-white rounded border">
            <span>PayPal</span>
            <span className={`px-2 py-1 rounded text-sm ${
              configStatus.paypal === 'configured' ? 'bg-green-100 text-green-800' :
              configStatus.paypal === 'missing' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {configStatus.paypal === 'configured' ? 'Configuré' :
               configStatus.paypal === 'missing' ? 'Manquant' :
               'En vérification'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white rounded border">
            <span>Stripe</span>
            <span className={`px-2 py-1 rounded text-sm ${
              configStatus.stripe === 'configured' ? 'bg-green-100 text-green-800' :
              configStatus.stripe === 'missing' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {configStatus.stripe === 'configured' ? 'Configuré' :
               configStatus.stripe === 'missing' ? 'Manquant' :
               'En vérification'}
            </span>
          </div>
        </div>
      </div>

      {/* Tests de paiement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test PayPal */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Test PayPal</h3>
          <p className="text-sm text-gray-600 mb-4">
            Montant de test: {testAmount} EUR
          </p>
          
          {configStatus.paypal === 'configured' ? (
            <PayPalPayment
              amount={testAmount}
              currency="EUR"
              userId="test-user-123"
              description="Test de paiement PayPal"
              onSuccess={handlePayPalSuccess}
              onError={handlePayPalError}
            />
          ) : (
            <div className="text-center p-4 bg-red-50 rounded">
              <p className="text-red-600">Configuration PayPal manquante</p>
            </div>
          )}

          {testResults.paypal && (
            <div className={`mt-4 p-3 rounded ${
              testResults.paypal.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <p className="font-semibold">
                {testResults.paypal.success ? '✅ Succès' : '❌ Échec'}
              </p>
              <p className="text-sm">
                {testResults.paypal.success ? 
                  'Paiement PayPal réussi' : 
                  `Erreur: ${testResults.paypal.error}`
                }
              </p>
            </div>
          )}
        </div>

        {/* Test Stripe */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Test Stripe</h3>
          <p className="text-sm text-gray-600 mb-4">
            Montant de test: {testAmount} EUR
          </p>
          
          {configStatus.stripe === 'configured' ? (
            <StripePayment
              amount={testAmount}
              currency="eur"
              onSuccess={handleStripeSuccess}
              onError={handleStripeError}
            />
          ) : (
            <div className="text-center p-4 bg-red-50 rounded">
              <p className="text-red-600">Configuration Stripe manquante</p>
            </div>
          )}

          {testResults.stripe && (
            <div className={`mt-4 p-3 rounded ${
              testResults.stripe.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <p className="font-semibold">
                {testResults.stripe.success ? '✅ Succès' : '❌ Échec'}
              </p>
              <p className="text-sm">
                {testResults.stripe.success ? 
                  'Paiement Stripe réussi' : 
                  `Erreur: ${testResults.stripe.error}`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Instructions de Test</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Pour PayPal : Utilisez le mode sandbox avec les identifiants de test</li>
          <li>• Pour Stripe : Utilisez les numéros de carte de test (4242 4242 4242 4242)</li>
          <li>• Les montants sont en euros pour les tests</li>
          <li>• Vérifhez la console pour les détails techniques</li>
        </ul>
      </div>
    </div>
  );
};

export default PaymentTest;