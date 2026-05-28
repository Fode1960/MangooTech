import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, LogIn } from 'lucide-react';

const VendorLoginSimple = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDemoLogin = () => {
    console.log('🎯 MODE DEMO FORCÉ');
    
    // Créer la session demo directement
    const vendorSession = {
      id: 'vendor-demo-123',
      email: 'vendor@example.com',
      shopId: 'shop-demo-123',
      shopName: 'Boutique Demo',
      shopSlug: 'boutique-demo',
      role: 'vendor'
    };

    localStorage.setItem('vendor-session', JSON.stringify(vendorSession));
    localStorage.setItem('user', JSON.stringify({
      id: 'vendor-demo-123',
      email: 'vendor@example.com',
      role: 'vendor'
    }));
    
    console.log('✅ Session DEMO créée');
    navigate('/vendor-dashboard');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Vérifier les identifiants demo
    if (email === 'vendor@example.com' && password === 'vendor123') {
      handleDemoLogin();
      return;
    }

    // Pour tout autre cas, utiliser le mode demo quand même pour tester
    console.log('🔄 Identifiants non demo, mais activation demo quand même pour test');
    handleDemoLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Connexion Vendeur</h1>
          <p className="text-gray-600">Accédez à votre espace vendeur</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
              placeholder="vendor@example.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-green-600 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Connexion...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Se connecter
              </>
            )}
          </button>
        </form>

        {/* Bouton de test direct */}
        <div className="mt-6">
          <button
            onClick={handleDemoLogin}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors mb-2"
          >
            🚀 Connexion DEMO Directe
          </button>
          <p className="text-xs text-gray-500 text-center">
            Identifiants demo: vendor@example.com / vendor123
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Pas encore de compte vendeur?{' '}
            <a href="/contact" className="text-orange-600 hover:text-orange-700 font-medium">
              Contactez-nous
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorLoginSimple;