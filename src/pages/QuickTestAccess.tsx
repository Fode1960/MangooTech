import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, User, Zap, Play } from 'lucide-react';

const QuickTestAccess: React.FC = () => {
  const navigate = useNavigate();

  const handleQuickConnect = (role: 'vendor' | 'client') => {
    // Mode local ultra-simplifié - bypass complet
    const localUser = {
      id: 'local-user-' + Date.now(),
      email: `local@${role}.com`,
      name: `Local ${role === 'vendor' ? 'Vendeur' : 'Client'}`,
      role: role,
      user_metadata: {
        role: role,
        full_name: `Local ${role === 'vendor' ? 'Vendeur' : 'Client'}`,
        phone: '+221771234567'
      }
    };
    
    // Stocker et rediriger
    localStorage.setItem('local_user', JSON.stringify(localUser));
    localStorage.setItem('local_mode', 'true');
    localStorage.setItem('test_mode', 'true');
    
    // Rediriger vers la page de test des rooms
    navigate('/test-room-management');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Test Room Management
          </h1>
          <p className="text-gray-600">
            Accès rapide pour tester la gestion des rooms
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleQuickConnect('vendor')}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-3"
          >
            <Zap className="w-5 h-5" />
            <span>Connexion Vendeur (Test)</span>
          </button>

          <button
            onClick={() => handleQuickConnect('client')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-3"
          >
            <User className="w-5 h-5" />
            <span>Connexion Client (Test)</span>
          </button>

          <button
            onClick={() => {
              const keepKeys = ['demo_wallet_balances'];
              const kept = new Map<string, string>();
              for (const key of keepKeys) {
                const v = localStorage.getItem(key);
                if (v != null) kept.set(key, v);
              }
              localStorage.clear();
              for (const [key, v] of kept.entries()) {
                localStorage.setItem(key, v);
              }
              window.location.href = '/login';
            }}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-3"
          >
            <Play className="w-5 h-5" />
            <span>Connexion Normale</span>
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Mode Test:</strong> Connexion sans base de données pour tester rapidement les fonctionnalités.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuickTestAccess;
