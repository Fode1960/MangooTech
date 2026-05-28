import React, { useState } from 'react';
import LiveShoppingVoIPManager from '../components/LiveShoppingVoIPManager';

const LiveShoppingVoIPTest: React.FC = () => {
  const [testMode, setTestMode] = useState<'host' | 'client' | null>(null);

  if (testMode === 'host') {
    return (
      <div className="min-h-screen bg-gray-100">
        <LiveShoppingVoIPManager
          mode="host"
          roomId="live-room-8888"
          userId="host-8888"
          userName="Vendeur Premium 8888"
          sipNumber="8888"
          sipPassword="8888"
        />
      </div>
    );
  }

  if (testMode === 'client') {
    return (
      <div className="min-h-screen bg-gray-100">
        <LiveShoppingVoIPManager
          mode="viewer"
          roomId="live-room-8888"
          userId="client-8889"
          userName="Client VIP 8889"
          sipNumber="8889"
          sipPassword="8889"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Test Live Shopping VoIP</h1>
          <p className="text-gray-600">Testez les appels entre deux comptes SIP (8888 ↔ 8889)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-2 border-orange-200 rounded-xl p-6 hover:border-orange-400 transition-colors cursor-pointer"
               onClick={() => setTestMode('host')}>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Vendeur (8888)</h3>
              <p className="text-gray-600 text-sm mb-4">Mode hôte avec contrôle complet du live shopping</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Compte SIP:</span>
                  <span className="font-mono font-bold">8888</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Mot de passe:</span>
                  <span className="font-mono font-bold">8888</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-2 border-green-200 rounded-xl p-6 hover:border-green-400 transition-colors cursor-pointer"
               onClick={() => setTestMode('client')}>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Client (8889)</h3>
              <p className="text-gray-600 text-sm mb-4">Mode spectateur avec possibilité d'appeler</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Compte SIP:</span>
                  <span className="font-mono font-bold">8889</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Mot de passe:</span>
                  <span className="font-mono font-bold">8889</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-bold text-blue-800 mb-2">Instructions de test:</h4>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Ouvrez deux navigateurs différents ou deux onnglets</li>
            <li>2. Dans le premier: cliquez sur "Vendeur (8888)"</li>
            <li>3. Dans le second: cliquez sur "Client (8889)"</li>
            <li>4. Sur la page vendeur: démarrez le live et appelez le 8889</li>
            <li>5. Sur la page client: répondez à l'appel entrant</li>
            <li>6. Parlez et vérifiez que la voix est audible dans le casque</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default LiveShoppingVoIPTest;