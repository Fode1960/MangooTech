import React, { useState, useEffect } from 'react';
import { Phone, Send, Download, Shield, QrCode, CreditCard } from 'lucide-react';

interface MobilePaymentProvider {
  id: string;
  name: string;
  countries: string[];
  color: string;
  features: string[];
  commission: number;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  provider: string;
  phoneNumber: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
}

const AfricanMobilePayment: React.FC = () => {
  const [providers] = useState<MobilePaymentProvider[]>([
    {
      id: 'mpesa',
      name: 'M-Pesa',
      countries: ['Kenya', 'Tanzanie', 'RD Congo'],
      color: 'bg-green-600',
      features: ['Transfert instantané', 'Paiement de factures', 'Retrait sans carte'],
      commission: 1.5
    },
    {
      id: 'orange-money',
      name: 'Orange Money',
      countries: ['Sénégal', 'Mali', 'Côte d\'Ivoire'],
      color: 'bg-orange-500',
      features: ['Transfert international', 'Épargne', 'Microcrédit'],
      commission: 2.0
    },
    {
      id: 'mtn-mobile-money',
      name: 'MTN Mobile Money',
      countries: ['Nigeria', 'Ghana', 'Cameroun'],
      color: 'bg-yellow-500',
      features: ['Achat en ligne', 'Paiement de services', 'Transfert vers banque'],
      commission: 1.8
    },
    {
      id: 'wave',
      name: 'Wave',
      countries: ['Sénégal', 'Côte d\'Ivoire', 'Mali'],
      color: 'bg-blue-600',
      features: ['Zéro commission', 'Transfert instantané', 'Sans compte bancaire'],
      commission: 0.0
    }
  ]);

  const [selectedProvider, setSelectedProvider] = useState<MobilePaymentProvider | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('XOF');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const currencies = [
    { code: 'XOF', name: 'Franc CFA BCEAO', countries: ['Bénin', 'Burkina Faso', 'Côte d\'Ivoire', 'Guinée-Bissau', 'Mali', 'Niger', 'Sénégal', 'Togo'] },
    { code: 'XAF', name: 'Franc CFA BEAC', countries: ['Cameroun', 'République centrafricaine', 'Congo', 'Gabon', 'Guinée équatoriale', 'Tchad'] },
    { code: 'GHS', name: 'Cedi ghanéen', countries: ['Ghana'] },
    { code: 'NGN', name: 'Naira nigérian', countries: ['Nigeria'] },
    { code: 'KES', name: 'Shilling kényan', countries: ['Kenya'] }
  ];

  const handlePayment = async () => {
    if (!selectedProvider || !phoneNumber || !amount) return;

    setIsProcessing(true);
    
    // Simulation de traitement de paiement mobile africain
    setTimeout(() => {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        amount: parseFloat(amount),
        currency,
        provider: selectedProvider.name,
        phoneNumber,
        status: Math.random() > 0.1 ? 'completed' : 'failed',
        timestamp: new Date()
      };

      setTransactions(prev => [newTransaction, ...prev]);
      setIsProcessing(false);
      
      // Réinitialiser le formulaire
      setPhoneNumber('');
      setAmount('');
    }, 2000);
  };

  const generateQRCode = () => {
    if (!amount || !currency) return;
    setShowQR(true);
  };

  const simulateUSSD = () => {
    const ussdCodes = {
      'mpesa': '*150*00#',
      'orange-money': '*144#',
      'mtn-mobile-money': '*126#',
      'wave': '*200#'
    };
    
    if (selectedProvider) {
      alert(`Code USSD ${selectedProvider.name}: ${ussdCodes[selectedProvider.id as keyof typeof ussdCodes]}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-green-50 to-orange-50">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Paiement Mobile Africain</h1>
        <p className="text-lg text-gray-600">Solutions de paiement adaptées aux marchés africains</p>
      </div>

      {/* Sélection du fournisseur */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedProvider?.id === provider.id
                ? 'border-blue-500 shadow-lg'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedProvider(provider)}
          >
            <div className={`w-12 h-12 rounded-lg ${provider.color} flex items-center justify-center mb-3`}>
              <Phone className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{provider.name}</h3>
            <p className="text-sm text-gray-600 mb-2">
              {provider.countries.join(', ')}
            </p>
            <p className="text-xs text-gray-500">
              Commission: {provider.commission}%
            </p>
          </div>
        ))}
      </div>

      {selectedProvider && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Effectuer un paiement avec {selectedProvider.name}</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulaire de paiement */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de téléphone</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+221 77 123 45 67"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Montant</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Devise</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {currencies.map((curr) => (
                      <option key={curr.code} value={curr.code}>{curr.code}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handlePayment}
                  disabled={isProcessing || !phoneNumber || !amount}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  {isProcessing ? 'Traitement...' : 'Envoyer'}
                </button>
                
                <button
                  onClick={generateQRCode}
                  className="bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
                >
                  <QrCode className="w-5 h-5" />
                  QR
                </button>
                
                <button
                  onClick={simulateUSSD}
                  className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  USSD
                </button>
              </div>
            </div>

            {/* Caractéristiques du fournisseur */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Caractéristiques</h3>
              <ul className="space-y-2">
                {selectedProvider.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Commission:</strong> {selectedProvider.commission}% par transaction
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code */}
      {showQR && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Code QR de paiement</h3>
          <div className="flex justify-center">
            <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <QrCode className="w-16 h-16 mx-auto mb-2 text-gray-600" />
                <p className="text-sm text-gray-600">QR Code {amount} {currency}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowQR(false)}
            className="mt-4 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Historique des transactions */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Historique des transactions</h3>
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{transaction.amount} {transaction.currency}</p>
                  <p className="text-sm text-gray-600">{transaction.phoneNumber}</p>
                  <p className="text-xs text-gray-500">{transaction.provider}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    transaction.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : transaction.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {transaction.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AfricanMobilePayment;