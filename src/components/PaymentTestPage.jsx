import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';
import { PayPalPayment } from './PayPalPayment';
import { StripePayment } from './StripePayment';
import { getPaymentPublicConfig } from '../services/paymentPublicConfig';

export const PaymentTestPage = () => {
  const { isDark } = useThemeStore();
  const [testResults, setTestResults] = useState({
    paypal: null,
    stripe: null,
    config: {
      paypal: {
        clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'Non configuré',
        status: 'Vérification...',
        details: []
      },
      stripe: {
        publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'Non configuré',
        status: 'Vérification...',
        details: []
      }
    }
  });

  const [activeTab, setActiveTab] = useState('paypal');
  const [testAmount] = useState(10); // 10 EUR pour les tests

  // Vérifier la configuration des API
  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        const publicConfig = await getPaymentPublicConfig();

        // Vérifier PayPal
        const paypalResponse = await fetch('/api/paypal/config-check');
        const paypalConfig = paypalResponse.ok ? await paypalResponse.json() : { status: 'error' };
        
        // Vérifier Stripe
        const stripeResponse = await fetch('/api/payments/config-check');
        const stripeConfig = stripeResponse.ok ? await stripeResponse.json() : { status: 'error' };

        const paypalDetails = [];
        if (paypalConfig?.config?.clientId === false) paypalDetails.push('clientId backend manquant');
        if (paypalConfig?.config?.clientSecret === false) paypalDetails.push('secret backend manquant');
        if (paypalConfig?.config?.webhookId === false) paypalDetails.push('webhook PayPal manquant');
        if (paypalConfig?.config?.authValid === false) paypalDetails.push('identifiants PayPal invalides');

        const stripeDetails = [];
        if (stripeConfig?.config?.secretKey === false) stripeDetails.push('secret Stripe backend manquant');
        if (stripeConfig?.config?.publishableKey === false) stripeDetails.push('clé publique Stripe manquante');
        if (stripeConfig?.config?.webhookSecret === false) stripeDetails.push('webhook Stripe manquant');
        if (stripeConfig?.config?.authValid === false) stripeDetails.push('clé Stripe invalide');

        setTestResults(prev => ({
          ...prev,
          config: {
            paypal: {
              ...prev.config.paypal,
              clientId: publicConfig.paypalClientId || prev.config.paypal.clientId,
              status: paypalConfig.status === 'ok' ? '✅ Configuré' : '❌ Erreur',
              details: paypalDetails
            },
            stripe: {
              ...prev.config.stripe,
              publishableKey: publicConfig.stripePublishableKey || prev.config.stripe.publishableKey,
              status: stripeConfig.status === 'ok' ? '✅ Configuré' : '❌ Erreur',
              details: stripeDetails
            }
          }
        }));
      } catch (error) {
        console.error('Erreur lors de la vérification de la configuration:', error);
        setTestResults(prev => ({
          ...prev,
          config: {
            paypal: { ...prev.config.paypal, status: '❌ Non disponible', details: [] },
            stripe: { ...prev.config.stripe, status: '❌ Non disponible', details: [] }
          }
        }));
      }
    };

    checkConfiguration();
  }, []);

  const handlePayPalSuccess = (result) => {
    console.log('✅ PayPal Test Réussi:', result);
    setTestResults(prev => ({
      ...prev,
      paypal: { status: 'success', data: result }
    }));
  };

  const handlePayPalError = (error) => {
    console.error('❌ PayPal Test Échoué:', error);
    setTestResults(prev => ({
      ...prev,
      paypal: { status: 'error', error: error.message || 'Erreur inconnue' }
    }));
  };

  const handleStripeSuccess = (result) => {
    console.log('✅ Stripe Test Réussi:', result);
    setTestResults(prev => ({
      ...prev,
      stripe: { status: 'success', data: result }
    }));
  };

  const handleStripeError = (error) => {
    console.error('❌ Stripe Test Échoué:', error);
    setTestResults(prev => ({
      ...prev,
      stripe: { status: 'error', error: error.message || 'Erreur inconnue' }
    }));
  };

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${
      isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">🧪 Test des Paiements</h1>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Page de test pour vérifier le fonctionnement des paiements PayPal et Stripe
          </p>
        </div>

        {/* Statut de Configuration */}
        <div className={`rounded-lg shadow-lg p-6 mb-8 ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold mb-4">📋 Configuration des API</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">PayPal</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Client ID:</span>
                  <span className="font-mono text-xs truncate">
                    {testResults.config.paypal.clientId.substring(0, 20)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Statut:</span>
                  <span>{testResults.config.paypal.status}</span>
                </div>
                {testResults.config.paypal.details.length > 0 && (
                  <div>
                    <span>Détails:</span>
                    <div className="text-xs mt-1">
                      {testResults.config.paypal.details.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Stripe</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Publishable Key:</span>
                  <span className="font-mono text-xs truncate">
                    {testResults.config.stripe.publishableKey.substring(0, 20)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Statut:</span>
                  <span>{testResults.config.stripe.status}</span>
                </div>
                {testResults.config.stripe.details.length > 0 && (
                  <div>
                    <span>Détails:</span>
                    <div className="text-xs mt-1">
                      {testResults.config.stripe.details.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Onglets de Test */}
        <div className={`rounded-lg shadow-lg overflow-hidden ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}">
            <button
              onClick={() => setActiveTab('paypal')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'paypal'
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : isDark
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              💙 PayPal
            </button>
            <button
              onClick={() => setActiveTab('stripe')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'stripe'
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : isDark
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              💳 Stripe
            </button>
          </div>

          <div className="p-6">
            {/* Test PayPal */}
            {activeTab === 'paypal' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Test PayPal - {testAmount} EUR</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Cliquez sur le bouton PayPal ci-dessous pour tester le paiement
                  </p>
                </div>

                <PayPalPayment
                  amount={testAmount}
                  currency="EUR"
                  userId="test-user-123"
                  packId="test-pack-456"
                  packName="Pack Test"
                  packPrice={testAmount}
                  description="Test de paiement PayPal"
                  onSuccess={handlePayPalSuccess}
                  onError={handlePayPalError}
                  onCancel={() => console.log('PayPal annulé')}
                />

                {/* Résultat du test */}
                {testResults.paypal && (
                  <div className={`mt-6 p-4 rounded-lg ${
                    testResults.paypal.status === 'success'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    <h4 className="font-semibold mb-2">
                      {testResults.paypal.status === 'success' ? '✅ Succès' : '❌ Échec'}
                    </h4>
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(testResults.paypal, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Test Stripe */}
            {activeTab === 'stripe' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Test Stripe - {testAmount} EUR</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Remplissez les informations de carte pour tester le paiement
                  </p>
                </div>

                <StripePayment
                  amount={testAmount}
                  currency="eur"
                  onSuccess={handleStripeSuccess}
                  onError={handleStripeError}
                />

                {/* Résultat du test */}
                {testResults.stripe && (
                  <div className={`mt-6 p-4 rounded-lg ${
                    testResults.stripe.status === 'success'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    <h4 className="font-semibold mb-2">
                      {testResults.stripe.status === 'success' ? '✅ Succès' : '❌ Échec'}
                    </h4>
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(testResults.stripe, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Informations de test */}
        <div className={`mt-8 rounded-lg shadow-lg p-6 ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold mb-4">ℹ️ Informations de Test</h3>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Cartes de test Stripe:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>4242 4242 4242 4242 - Succès</li>
                <li>4000 0000 0000 0002 - Échec</li>
                <li>4000 0000 0000 3220 - Authentification requise</li>
              </ul>
            </div>
            <div>
              <strong>Comptes PayPal Sandbox:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Utilisez un compte PayPal sandbox pour les tests</li>
                <li>Les paiements sont simulés et ne sont pas réels</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
