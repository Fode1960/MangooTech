import React, { useEffect, useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import PropTypes from 'prop-types';
import { useThemeStore } from '../stores/themeStore';

export const PayPalPayment = ({
  amount,
  currency = 'EUR',
  userId,
  packId,
  packName,
  packPrice,
  description,
  onSuccess,
  onError,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  
  const { isDark } = useThemeStore();

  // Configuration PayPal
  const paypalOptions = {
    'client-id': import.meta.env.VITE_PAYPAL_CLIENT_ID || 'YOUR_PAYPAL_CLIENT_ID',
    currency: currency.toUpperCase(),
    intent: 'capture',
    'enable-funding': 'venmo',
    'disable-funding': '',
    'data-page-type': 'checkout',
    components: 'buttons,messages',
  };

  /**
   * Créer une commande PayPal
   */
  const createOrder = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          amount,
          currency,
          pack_id: packId,
          pack_name: packName,
          pack_price: packPrice,
          description,
          return_url: `${window.location.origin}/payment/success`,
          cancel_url: `${window.location.origin}/payment/cancel`
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur API PayPal:', response.status, errorText);
        throw new Error(`Erreur serveur: ${response.status} - ${errorText}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Erreur parsing JSON:', jsonError);
        throw new Error('Réponse invalide du serveur');
      }

      if (data.success && data.orderId) {
        setOrderId(data.orderId);
        setPaymentId(data.paymentId);
        
        // Stocker les informations pour la capture
        sessionStorage.setItem('paypal_order_id', data.orderId);
        sessionStorage.setItem('paypal_payment_id', data.paymentId);
        
        console.log('Commande PayPal créée avec succès:', data.orderId);
        return data.orderId;
      } else {
        throw new Error(data.error || 'Erreur lors de la création de la commande');
      }
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      onError?.(error);
      // Toujours retourner une valeur pour éviter l'erreur PayPal
      const errorOrderId = `ERROR_${Date.now()}`;
      console.log('Retour ID d\'erreur PayPal:', errorOrderId);
      return errorOrderId;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Capturer le paiement
   */
  const onApprove = async (data, actions) => {
    try {
      setIsLoading(true);
      
      // Récupérer les IDs depuis sessionStorage
      const storedOrderId = sessionStorage.getItem('paypal_order_id');
      const storedPaymentId = sessionStorage.getItem('paypal_payment_id');
      
      const orderId = data.orderID || storedOrderId;
      const paymentId = storedPaymentId;

      if (!orderId || !paymentId) {
        throw new Error('Order ID ou Payment ID manquant');
      }
      
      // Capturer le paiement via notre API
      const response = await fetch('/api/paypal/capture-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          paymentId: paymentId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur capture: ${response.status} - ${errorText}`);
      }

      let captureData;
      try {
        captureData = await response.json();
      } catch (jsonError) {
        throw new Error('Réponse invalide du serveur lors de la capture');
      }

      if (captureData.success) {
        // Nettoyer sessionStorage
        sessionStorage.removeItem('paypal_order_id');
        sessionStorage.removeItem('paypal_payment_id');
        
        onSuccess?.(captureData);
      } else {
        throw new Error(captureData.error || 'Erreur lors de la capture du paiement');
      }
    } catch (error) {
      console.error('Erreur lors de la capture du paiement:', error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Gérer l'annulation du paiement
   */
  const onCancelHandler = () => {
    console.log('Paiement annulé par l\'utilisateur');
    onCancel?.();
  };

  /**
   * Gérer les erreurs PayPal
   */
  const onErrorHandler = (err) => {
    console.error('Erreur PayPal:', err);
    onError?.(err);
  };

  // Calculer les frais et le total
  const processingFee = (amount * 0.029) + 0.30;
  const totalAmount = amount + processingFee;

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <div className={`w-full max-w-md mx-auto p-6 rounded-lg shadow-lg transition-colors duration-300 ${
        isDark 
          ? 'bg-gray-800 text-white border border-gray-700' 
          : 'bg-white text-gray-900 border border-gray-200'
      }`}>
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-2xl">💙</span>
            <h3 className="text-xl font-semibold">
              Paiement PayPal
            </h3>
          </div>
          <p className={`text-sm ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Paiement sécurisé via PayPal
          </p>
        </div>

        {/* Résumé du paiement */}
        <div className={`mb-6 p-4 rounded-lg ${
          isDark ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                Montant:
              </span>
              <span className="font-medium">
                {amount.toFixed(2)} {currency.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                Frais PayPal (2.9% + 0.30):
              </span>
              <span className="font-medium">
                {processingFee.toFixed(2)} {currency.toUpperCase()}
              </span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span className="text-lg">
                  {totalAmount.toFixed(2)} {currency.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Boutons PayPal */}
        <div className="paypal-buttons-container">
          <PayPalButtons
            style={{
              layout: 'vertical',
              color: 'gold',
              shape: 'rect',
              label: 'paypal',
              tagline: false,
              height: 45
            }}
            createOrder={createOrder}
            onApprove={onApprove}
            onCancel={onCancelHandler}
            onError={onErrorHandler}
            disabled={isLoading}
          />
        </div>

        {/* Message de chargement */}
        {isLoading && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              <span className="text-sm">Traitement du paiement...</span>
            </div>
          </div>
        )}

        {/* Messages d'information */}
        <div className={`mt-4 text-xs text-center ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <p>
            Vous serez redirigé vers PayPal pour finaliser votre paiement de manière sécurisée.
          </p>
          <p className="mt-1">
            Vos informations bancaires ne sont jamais stockées sur nos serveurs.
          </p>
        </div>
      </div>
    </PayPalScriptProvider>
  );
};

export default PayPalPayment;

PayPalPayment.propTypes = {
  amount: PropTypes.number.isRequired,
  currency: PropTypes.string,
  userId: PropTypes.string.isRequired,
  packId: PropTypes.string,
  packName: PropTypes.string,
  packPrice: PropTypes.number,
  description: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  onCancel: PropTypes.func
};