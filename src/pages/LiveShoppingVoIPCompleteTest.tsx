import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, PhoneOff, Volume2, Mic, Users, MessageCircle } from 'lucide-react';

const LiveShoppingVoIPCompleteTest: React.FC = () => {
  const [testStep, setTestStep] = useState(0);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const testSteps = [
    {
      name: 'Vérification Serveur VoIP',
      description: 'Test de connexion au serveur SIP',
      action: 'Vérifier que le serveur est accessible'
    },
    {
      name: 'Test Audio 8888 (Vendeur)',
      description: 'Ouvrir la page vendeur et vérifier l\'audio',
      action: 'Ouvrir http://localhost:3015/live-voip-host'
    },
    {
      name: 'Test Audio 8889 (Client)',
      description: 'Ouvrir la page client et vérifier l\'audio',
      action: 'Ouvrir http://localhost:3015/live-voip-client'
    },
    {
      name: 'Test Appel Entrant',
      description: 'Appeler 8889 depuis 8888',
      action: 'Utiliser le bouton "Appeler" sur la page 8888'
    },
    {
      name: 'Test Réponse Appel',
      description: 'Répondre à l\'appel sur 8889',
      action: 'Cliquer sur "Répondre" sur la page 8889'
    },
    {
      name: 'Test Audio Bidirectionnel',
      description: 'Vérifier que la voix est audible dans les deux sens',
      action: 'Parler et écouter dans les deux sens'
    },
    {
      name: 'Test Chat',
      description: 'Envoyer des messages entre les deux pages',
      action: 'Utiliser le chat sur chaque page'
    },
    {
      name: 'Test Raccrochage',
      description: 'Terminer l\'appel proprement',
      action: 'Cliquer sur "Raccrocher"'
    }
  ];

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const startTest = () => {
    setIsTesting(true);
    setTestStep(0);
    setTestResults([]);
    addTestResult('🚀 Début du test complet Live Shopping VoIP');
  };

  const nextStep = () => {
    if (testStep < testSteps.length - 1) {
      setTestStep(testStep + 1);
      addTestResult(`✅ Étape ${testStep + 1} complétée`);
    } else {
      setIsTesting(false);
      addTestResult('🎉 Test complet terminé!');
    }
  };

  const openTestPage = (url: string) => {
    window.open(url, '_blank', 'width=1200,height=800');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center">
            <Phone className="w-10 h-10 text-orange-500 mr-4" />
            Test Complet Live Shopping VoIP
          </h1>
          <p className="text-lg text-gray-600">
            Testez l'intégration complète du système VoIP avec Live Shopping
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Instructions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Users className="w-6 h-6 text-blue-500 mr-3" />
              Instructions de Test
            </h2>

            {!isTesting ? (
              <div className="text-center py-8">
                <button
                  onClick={startTest}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-colors"
                >
                  🚀 Commencer le Test
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-bold text-blue-800 mb-2">
                    Étape {testStep + 1}: {testSteps[testStep].name}
                  </h3>
                  <p className="text-blue-700 mb-4">
                    {testSteps[testStep].description}
                  </p>
                  <div className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
                    <p className="text-sm font-medium text-gray-700">
                      Action: {testSteps[testStep].action}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={nextStep}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    ✅ Étape Suivante
                  </button>
                  
                  {testStep === 1 && (
                    <button
                      onClick={() => openTestPage('http://localhost:3015/live-voip-host')}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                    >
                      📱 Ouvrir 8888
                    </button>
                  )}
                  
                  {testStep === 2 && (
                    <button
                      onClick={() => openTestPage('http://localhost:3015/live-voip-client')}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                    >
                      📱 Ouvrir 8889
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <MessageCircle className="w-6 h-6 text-green-500 mr-3" />
              Résultats du Test
            </h2>

            <div className="h-96 overflow-y-auto bg-gray-50 rounded-lg p-4">
              {testResults.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Volume2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun test effectué</p>
                  <p className="text-sm">Cliquez sur "Commencer le Test" pour démarrer</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-3 text-sm border-l-4 border-green-500"
                    >
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Access Buttons */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Phone className="w-6 h-6 text-orange-500 mr-3" />
            Accès Rapide aux Pages de Test
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => openTestPage('http://localhost:3015/live-voip-host')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-colors"
            >
              📱 Vendeur 8888
            </button>
            
            <button
              onClick={() => openTestPage('http://localhost:3015/live-voip-client')}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-colors"
            >
              👥 Client 8889
            </button>
            
            <button
              onClick={() => openTestPage('http://localhost:3015/voip-final-test')}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-colors"
            >
              🎧 Test Audio Final
            </button>
            
            <button
              onClick={() => openTestPage('http://localhost:3015/test-live-shopping-audio')}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-colors"
            >
              🛍️ Test Live Shopping
            </button>
          </div>
        </div>

        {/* Features Checklist */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Fonctionnalités à Vérifier
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Audio & VoIP</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <Mic className="w-4 h-4 text-blue-500 mr-2" />
                  Barre de niveau Micro dynamique
                </li>
                <li className="flex items-center">
                  <Volume2 className="w-4 h-4 text-green-500 mr-2" />
                  Barre de niveau Casque dynamique
                </li>
                <li className="flex items-center">
                  <Phone className="w-4 h-4 text-orange-500 mr-2" />
                  Boutons Répondre/Raccrocher/Refuser
                </li>
                <li className="flex items-center">
                  <PhoneCall className="w-4 h-4 text-purple-500 mr-2" />
                  Voix audible dans le casque
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Live Shopping</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <Users className="w-4 h-4 text-blue-500 mr-2" />
                  Chat en temps réel
                </li>
                <li className="flex items-center">
                  <MessageCircle className="w-4 h-4 text-green-500 mr-2" />
                  Réactions et animations
                </li>
                <li className="flex items-center">
                  <Phone className="w-4 h-4 text-orange-500 mr-2" />
                  Gestion des appels entrants/sortants
                </li>
                <li className="flex items-center">
                  <Volume2 className="w-4 h-4 text-purple-500 mr-2" />
                  Indicateurs audio en direct
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveShoppingVoIPCompleteTest;