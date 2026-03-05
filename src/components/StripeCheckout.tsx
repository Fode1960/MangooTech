import React, { useState } from 'react';
import { CreditCard, Lock, CheckCircle, AlertCircle } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'card' | 'orange_money' | 'mtn_money' | 'moov_money';
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
}

interface StripeCheckoutProps {
  amount: number;
  currency?: string;
  orderId: string;
  onPaymentSuccess: (paymentMethod: string) => void;
  onPaymentError: (error: string) => void;
}

const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  amount,
  currency = 'XOF',
  orderId,
  onPaymentSuccess,
  onPaymentError
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      type: 'card',
      name: 'Carte Bancaire',
      description: 'Visa, Mastercard, American Express',
      icon: '💳',
      enabled: true
    },
    {
      id: 'orange_money',
      type: 'orange_money',
      name: 'Orange Money',
      description: 'Paiement par Orange Money',
      icon: '🟠',
      enabled: true
    },
    {
      id: 'mtn_money',
      type: 'mtn_money',
      name: 'MTN Money',
      description: 'Paiement par MTN Money',
      icon: '🔶',
      enabled: true
    },
    {
      id: 'moov_money',
      type: 'moov_money',
      name: 'Moov Money',
      description: 'Paiement par Moov Money',
      icon: '🟣',
      enabled: false
    }
  ];

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiryDate(formatExpiryDate(e.target.value));
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      onPaymentError('Veuillez sélectionner une méthode de paiement');
      return;
    }

    if (selectedMethod === 'card') {
      if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
        onPaymentError('Veuillez remplir tous les champs de la carte');
        return;
      }
    }

    if (selectedMethod.includes('money')) {
      if (!phoneNumber) {
        onPaymentError('Veuillez entrer votre numéro de téléphone');
        return;
      }
    }

    setIsProcessing(true);

    // Simulation du traitement du paiement
    setTimeout(() => {
      setIsProcessing(false);
      setShowConfirmation(true);
      
      // Simulation d'un paiement réussi après 2 secondes
      setTimeout(() => {
        setShowConfirmation(false);
        onPaymentSuccess(selectedMethod);
      }, 2000);
    }, 1500);
  };

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method.type) {
      case 'card':
        return '💳';
      case 'orange_money':
        return '🟠';
      case 'mtn_money':
        return '🔶';
      case 'moov_money':
        return '🟣';
      default:
        return '💳';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Paiement Sécurisé</h2>
            <p className="text-blue-100 text-sm">Commande #{orderId}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatAmount(amount)}</div>
            <div className="text-blue-100 text-xs">Montant total</div>
          </div>
        </div>
      </div>

      {/* Corps */}
      <div className="p-6">
        {/* Méthodes de paiement */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Choisir une méthode de paiement</h3>
          <div className="space-y-2">
            {paymentMethods.filter(method => method.enabled).map((method) => (
              <div
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedMethod === method.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getMethodIcon(method)}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{method.name}</h4>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                  {selectedMethod === method.id && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulaire de carte */}
        {selectedMethod === 'card' && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titulaire de la carte
              </label>
              <input
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="Jean Dupont"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de carte
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'expiration
                </label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={handleExpiryDateChange}
                  placeholder="MM/AA"
                  maxLength={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  maxLength={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Lock className="w-4 h-4" />
              <span>Vos informations sont cryptées et sécurisées</span>
            </div>
          </div>
        )}

        {/* Formulaire Mobile Money */}
        {selectedMethod.includes('money') && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="01020304"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <AlertCircle className="w-4 h-4" />
                <span>Un code de validation vous sera envoyé par SMS</span>
              </div>
            </div>
          </div>
        )}

        {/* Bouton de paiement */}
        <button
          onClick={handlePayment}
          disabled={isProcessing || !selectedMethod}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Traitement...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Payer {formatAmount(amount)}
            </>
          )}
        </button>

        {/* Message de confirmation */}
        {showConfirmation && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Paiement en cours de traitement...</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Veuillez patienter pendant que nous finalisons votre paiement.
            </p>
          </div>
        )}

        {/* Sécurité */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Lock className="w-3 h-3" />
            <span>Paiement 100% sécurisé • SSL 256-bit</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripeCheckout;