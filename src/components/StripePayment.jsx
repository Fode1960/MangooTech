import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useThemeStore } from '../stores/themeStore';
import { usePaymentStore } from '../stores/paymentStore';

// Initialiser Stripe avec la clé depuis les variables d'environnement
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_publishable_key_here');

const CheckoutForm = ({ amount, currency = 'eur', onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { isDark } = useThemeStore();
  const { updateTransactionStatus } = usePaymentStore();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Créer le PaymentIntent sur le serveur
      const response = await fetch('/api/payments/create-stripe-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: currency,
          description: 'Achat sur MangooTech',
          user_id: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : 'anonymous',
          customer_email: event.target.email.value,
          // Inclure le token pour maintenir la session
          auth_token: localStorage.getItem('token') || 'demo-token',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur API Stripe:', response.status, errorText);
        throw new Error(`Erreur serveur: ${response.status} - ${errorText}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Erreur parsing JSON:', jsonError);
        throw new Error('Réponse invalide du serveur');
      }

      const { clientSecret, error } = data;

      if (error) {
        throw new Error(error);
      }

      if (!clientSecret) {
        throw new Error('Client secret manquant dans la réponse');
      }

      // Confirmer le paiement sans redirection
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: event.target.name.value,
            email: event.target.email.value,
          },
        },
        redirect: 'if_required', // Important: ne pas rediriger systématiquement
        setup_future_usage: 'off_session', // Permettre les paiements futurs
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.paymentIntent.status === 'succeeded') {
        console.log('✅ Paiement Stripe réussi côté client:', result.paymentIntent.id);
        
        // Confirmer le paiement côté backend
        try {
          const paymentId = localStorage.getItem('currentPaymentId');
          console.log('💾 Payment ID from localStorage:', paymentId);
          
          const confirmResponse = await fetch('/api/payments/confirm-stripe-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: result.paymentIntent.id,
              // Inclure l'ID de paiement si disponible
              paymentId: paymentId,
            }),
          });

          if (!confirmResponse.ok) {
            const errorText = await confirmResponse.text();
            console.error('Erreur confirmation backend:', confirmResponse.status, errorText);
            throw new Error(`Erreur confirmation: ${confirmResponse.status} - ${errorText}`);
          }

          const confirmData = await confirmResponse.json();
          console.log('✅ Paiement confirmé côté backend:', confirmData);
          
          // Nettoyer le payment ID du localStorage
          localStorage.removeItem('currentPaymentId');
          
          // Mettre à jour le statut de la transaction dans le store
          if (confirmData.success && confirmData.transactionId) {
            updateTransactionStatus(confirmData.transactionId, 'completed', 'Paiement confirmé avec succès!');
          }
          
          // Appeler le callback de succès avec les données complètes
          onSuccess({
            ...result.paymentIntent,
            backendConfirmed: true,
            paymentId: confirmData.paymentId || paymentId,
          });
          
        } catch (backendError) {
          console.error('❌ Erreur lors de la confirmation backend:', backendError);
          // Quand même appeler onSuccess pour ne pas bloquer l'utilisateur
          // mais loguer l'erreur pour investigation
          onSuccess({
            ...result.paymentIntent,
            backendConfirmed: false,
            backendError: backendError.message,
          });
        }
        
      } else if (result.paymentIntent.status === 'requires_action') {
        // Si une action supplémentaire est requise, la gérer ici
        console.log('Action supplémentaire requise');
      }

    } catch (error) {
      console.error('Erreur lors du paiement:', error);
      onError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Nom complet
        </label>
        <input
          type="text"
          name="name"
          required
          className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-300 ${
            isDark 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
          placeholder="Jean Dupont"
        />
      </div>

      <div>
        <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Email
        </label>
        <input
          type="email"
          name="email"
          required
          className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-300 ${
            isDark 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
          placeholder="jean@example.com"
        />
      </div>

      <div>
        <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Informations de carte
        </label>
        <div className={`p-3 rounded-lg border transition-colors duration-300 ${
          isDark 
            ? 'bg-gray-700 border-gray-600' 
            : 'bg-white border-gray-300'
        }`}>
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: isDark ? '#ffffff' : '#424770',
                  '::placeholder': {
                    color: isDark ? '#9ca3af' : '#aab7c4',
                  },
                },
                invalid: {
                  color: isDark ? '#fca5a5' : '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
          !stripe || isProcessing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transform hover:scale-105'
        } text-white`}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Traitement...</span>
          </div>
        ) : (
          `Payer ${amount} ${currency.toUpperCase()}`
        )}
      </button>
    </form>
  );
};

export const StripePayment = ({ amount, currency = 'eur', onSuccess, onError }) => {
  const { isDark } = useThemeStore();

  return (
    <div className={`rounded-xl shadow-lg p-6 transition-colors duration-300 ${
      isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
    }`}>
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <span className="text-2xl">💳</span>
          <h3 className={`text-xl font-semibold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Paiement par carte bancaire
          </h3>
        </div>
        <p className={`text-sm transition-colors duration-300 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Paiement sécurisé via Stripe
        </p>
      </div>

      <Elements stripe={stripePromise}>
        <CheckoutForm 
          amount={amount} 
          currency={currency}
          onSuccess={onSuccess}
          onError={onError}
        />
      </Elements>
    </div>
  );
};

export default StripePayment;