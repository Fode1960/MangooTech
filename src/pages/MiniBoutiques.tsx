import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import MiniBoutiqueManagerModernULTIME from '../components/MiniBoutiqueManagerModern-ULTIME';
import MiniBoutiqueTestMode from '../components/MiniBoutiqueTestMode';

const MiniBoutiques: React.FC = () => {
  const { user } = useAuth();
  
  // Vérifier si on est en mode test
  const isTestMode = localStorage.getItem('test_mode') === 'true'
  const testUser = localStorage.getItem('test_user')
  const isAuthenticated = user || (isTestMode && testUser)
  
  // Obtenir l'ID utilisateur pour le composant enfant
  let vendorId = null
  if (user) {
    vendorId = user.id
  } else if (isTestMode && testUser) {
    const testUserData = JSON.parse(testUser)
    vendorId = testUserData.id
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            🏪 Gestion des Mini-Boutiques
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Créez et gérez vos mini-boutiques en ligne avec des outils professionnels
          </p>
          {isTestMode && (
            <div className="mt-2 p-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-sm">
              🧪 Mode Test Activé - Accès complet pour démonstration
            </div>
          )}
        </div>

        {!isAuthenticated ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Connexion Requise
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Vous devez être connecté pour accéder à la gestion des mini-boutiques.
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Se Connecter
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {isTestMode ? (
              <MiniBoutiqueTestMode vendorId={vendorId} />
            ) : (
              <MiniBoutiqueManagerModernULTIME vendorId={vendorId} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MiniBoutiques;