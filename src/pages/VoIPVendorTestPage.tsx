import React from 'react';
import { Link } from 'react-router-dom';
import VoIPSIPManager from '../components/VoIPSIPManager';

const VoIPVendorTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🎧 Test VoIP - Vendeur SIP</h1>
          <p className="text-gray-300 mb-6">
            Testez les appels VoIP avec votre serveur SIP (compte 8888)
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              to="/voip-client-test" 
              target="_blank"
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
            >
              Ouvrir Client VoIP (8889) →
            </Link>
            <Link 
              to="/live-shopping-vendor-test" 
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition-colors"
            >
              Retour Live Shopping
            </Link>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">📞 Configuration SIP</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Compte SIP</h3>
                <p className="text-green-400 font-mono">8888</p>
                <p className="text-sm text-gray-400 mt-1">Serveur: localhost:5060</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Mode</h3>
                <p className="text-blue-400">Vendeur / Marchand</p>
                <p className="text-sm text-gray-400 mt-1">Appelle le client (8889)</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">🎤 Contrôles VoIP SIP</h2>
            <VoIPSIPManager 
              role="vendor"
              sipUsername="8888"
              sipPassword="82014578"
              sipServer="localhost"
              sipPort={5060}
              targetUsername="8889"
            />
          </div>

          <div className="bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded-lg p-4 mt-6">
            <h3 className="text-yellow-300 font-medium mb-2">📋 Instructions de test</h3>
            <ol className="text-yellow-200 text-sm space-y-1">
              <li>1. Ouvrez le client VoIP (8889) dans un autre onglet</li>
              <li>2. Assurez-vous que les deux comptes SIP sont connectés</li>
              <li>3. Cliquez sur "Appeler 8889" depuis ce vendeur</li>
              <li>4. Le client 8889 doit répondre pour établir l'appel</li>
              <li>5. Testez le microphone et les haut-parleurs</li>
              <li>6. Comparez avec vos tests Zoiper habituels</li>
            </ol>
          </div>

          <div className="bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-4 mt-4">
            <h3 className="text-blue-300 font-medium mb-2">🔗 Comparaison avec Zoiper</h3>
            <p className="text-blue-200 text-sm">
              Ce test utilise la même infrastructure que vos comptes 8888/8889 dans Zoiper. 
              Les appels devraient avoir la même qualité audio, sans échos, avec une bonne transmission de voix.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoIPVendorTestPage;