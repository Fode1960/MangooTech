import React, { useState } from 'react';
import { Phone, Users, MessageSquare, Play, Info } from 'lucide-react';

const WebRTCTestGuide: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Étape 1: Démarrer le serveur de signalisation",
      description: "Assurez-vous que le serveur WebSocket est en cours d'exécution",
      action: "Vérifiez que le serveur WebSocket tourne sur le port 3001",
      icon: <Play className="w-6 h-6" />
    },
    {
      title: "Étape 2: Ouvrir deux onglets",
      description: "Ouvrez deux onglets séparés dans votre navigateur",
      action: "Onglet 1: http://localhost:3015/webrtc-vendor-final\nOnglet 2: http://localhost:3015/webrtc-client-final",
      icon: <Users className="w-6 h-6" />
    },
    {
      title: "Étape 3: Vérifier la connexion",
      description: "Attendez que les deux onglets affichent 'Connecté'",
      action: "Vous devriez voir un point vert et 'Connecté' dans la barre de statut",
      icon: <Phone className="w-6 h-6" />
    },
    {
      title: "Étape 4: Tester l'appel",
      description: "Cliquez sur 'Appeler le client' dans l'onglet vendeur",
      action: "Le client devrait recevoir une notification d'appel avec une sonnerie",
      icon: <Phone className="w-6 h-6" />
    },
    {
      title: "Étape 5: Répondre à l'appel",
      description: "Sur l'onglet client, cliquez sur 'Répondre'",
      action: "La connexion vidéo/audio devrait s'établir entre les deux parties",
      icon: <MessageSquare className="w-6 h-6" />
    },
    {
      title: "Étape 6: Tester le chat",
      description: "Envoyez des messages dans les deux sens",
      action: "Tapez un message et appuyez sur Entrée ou cliquez sur le bouton d'envoi",
      icon: <MessageSquare className="w-6 h-6" />
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const openVendorTab = () => {
    window.open('http://localhost:3015/webrtc-vendor-final', '_blank');
  };

  const openClientTab = () => {
    window.open('http://localhost:3015/webrtc-client-final', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Guide de Test WebRTC
          </h1>
          <p className="text-lg text-gray-600">
            Testez les appels audio/vidéo et le chat en temps réel
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              {steps[currentStep].title}
            </h2>
            <div className="text-blue-500">
              {steps[currentStep].icon}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 text-lg mb-4">
              {steps[currentStep].description}
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
              <p className="text-gray-700 font-medium whitespace-pre-line">
                {steps[currentStep].action}
              </p>
            </div>
          </div>

          {currentStep === 1 && (
            <div className="mb-6 space-y-3">
              <button
                onClick={openVendorTab}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2"
              >
                <Users className="w-5 h-5" />
                <span>Ouvrir l'onglet Vendeur</span>
              </button>
              <button
                onClick={openClientTab}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2"
              >
                <Users className="w-5 h-5" />
                <span>Ouvrir l'onglet Client</span>
              </button>
            </div>
          )}

          <div className="flex justify-between items-center">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-6 py-2 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-700 font-medium rounded-lg"
            >
              Précédent
            </button>

            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextStep}
              disabled={currentStep === steps.length - 1}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg"
            >
              Suivant
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-6 h-6 text-yellow-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Conseils importants
              </h3>
              <ul className="text-yellow-700 space-y-1">
                <li>• Assurez-vous d'autoriser l'accès à la caméra et au microphone</li>
                <li>• Utilisez des navigateurs modernes (Chrome, Firefox, Safari)</li>
                <li>• Vérifiez que le serveur WebSocket est bien démarré</li>
                <li>• Les appels fonctionnent mieux sur des connexions rapides</li>
                <li>• Testez dans un environnement calme pour la meilleure qualité audio</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Accès rapide aux tests
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="http://localhost:3015/webrtc-vendor-final"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg text-center transition-colors"
              >
                Page Vendeur
              </a>
              <a
                href="http://localhost:3015/webrtc-client-final"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg text-center transition-colors"
              >
                Page Client
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebRTCTestGuide;