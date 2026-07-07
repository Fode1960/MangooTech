import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Store, User, Lock, Mail, Zap, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signInDemo, signInLocal, user } = useAuth();
  const isDev = Boolean(import.meta.env.DEV);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signIn(email, password);
    } catch (error) {
      console.error('Erreur de connexion:', error);
      alert('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mode local ultra-simplifié - bypass complet
  const handleLocalMode = () => {
    // Connexion locale instantanée sans base de données
    const localUser = {
      id: '550e8400-e29b-41d4-a716-446655440010',
      email: 'local@vendeur.com',
      name: 'Local Vendeur',
      role: 'vendor',
      user_metadata: {
        role: 'vendor',
        full_name: 'Local Vendeur',
        phone: '+221771234567'
      }
    };
    
    // Stocker et rediriger
    localStorage.setItem('local_user', JSON.stringify(localUser));
    localStorage.setItem('local_mode', 'true');
    window.location.href = '/dashboard';
  };

  // Mode test ultra-simplifié pour contourner les problèmes d'authentification
  const handleTestMode = () => {
    // Créer un faux utilisateur pour les tests avec un vrai UUID
    const testUser = {
      id: '550e8400-e29b-41d4-a716-446655440000', // UUID valide pour PostgreSQL
      email: 'test@vendeur.com',
      user_metadata: {
        role: 'vendor',
        full_name: 'Vendeur rapide',
        phone: '+221771234567'
      }
    };
    
    // Stocker dans localStorage pour simuler une connexion
    localStorage.setItem('test_user', JSON.stringify(testUser));
    localStorage.setItem('test_mode', 'true');
    
    // Recharger la page pour appliquer le mode test
    window.location.reload();
  };

  // Mode test instantané - bypass complet
  const handleInstantTest = () => {
    handleTestMode();
  };

  // Réinitialisation forcée du mode test
  const handleResetTest = () => {
    // Nettoyer complètement le localStorage
    localStorage.removeItem('test_mode');
    localStorage.removeItem('test_user');
    localStorage.removeItem('supabase.auth.token');
    
    // Créer un nouvel utilisateur de test avec UUID valide
    const newTestUser = {
      id: '550e8400-e29b-41d4-a716-446655440000', // UUID valide PostgreSQL
      email: 'test@vendeur.com',
      user_metadata: {
        role: 'vendor',
        full_name: 'Vendeur rapide',
        phone: '+221771234567'
      }
    };
    
    localStorage.setItem('test_user', JSON.stringify(newTestUser));
    localStorage.setItem('test_mode', 'true');
    
    // Recharger la page
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#f6faf3] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-[#d7e4d1] p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#eef6ea] rounded-2xl border border-[#d7e4d1] flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-[#1b5e20]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">MangooTech</h1>
            <p className="text-gray-600">Connectez-vous à votre compte</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b5e20] focus:border-transparent"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b5e20] focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1b5e20] text-white py-2 px-4 rounded-lg hover:bg-[#16381a] focus:outline-none focus:ring-2 focus:ring-[#1b5e20] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {isLoading ? 'Connexion...' : 'Se Connecter'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/register" className="text-sm text-[#1b5e20] hover:text-[#16381a]">
              Pas encore de compte ? S'inscrire
            </Link>
          </div>

          {isDev && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center mb-4">Accès rapide (dev)</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    const adminUser = {
                      id: 'admin-user-id',
                      email: 'admin@mangoo.tech',
                      role: 'admin',
                      user_metadata: { role: 'admin', full_name: 'Administrateur' }
                    };
                    localStorage.setItem('user', JSON.stringify(adminUser));
                    localStorage.setItem('token', 'fake-admin-token');
                    localStorage.setItem('currentRole', 'admin');
                    window.location.href = '/admin/dashboard';
                  }}
                  className="w-full p-4 bg-[#1b5e20] hover:bg-[#16381a] text-white rounded-lg transition-all duration-200 font-bold flex items-center justify-center space-x-2 shadow-sm"
                >
                  <Shield className="w-5 h-5" />
                  <span>Accès admin</span>
                </button>

                <button
                  type="button"
                  onClick={handleLocalMode}
                  className="w-full p-4 bg-[#1b5e20] hover:bg-[#16381a] text-white rounded-lg transition-all duration-200 font-bold flex items-center justify-center space-x-2 shadow-sm"
                >
                  <Zap className="w-5 h-5" />
                  <span>Mode local</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetTest}
                  className="w-full p-4 bg-[#1b5e20] hover:bg-[#16381a] text-white rounded-lg transition-all duration-200 font-bold flex items-center justify-center space-x-2 shadow-sm"
                >
                  <Zap className="w-5 h-5" />
                  <span>Réinitialiser</span>
                </button>

                <button
                  type="button"
                  onClick={handleInstantTest}
                  className="w-full p-4 bg-[#1b5e20] hover:bg-[#16381a] text-white rounded-lg transition-all duration-200 font-bold flex items-center justify-center space-x-2 shadow-sm"
                >
                  <Zap className="w-5 h-5" />
                  <span>Accès immédiat</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestMode}
                  className="w-full p-3 bg-[#eef6ea] hover:bg-[#d7e4d1] rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Zap className="w-4 h-4 text-[#1b5e20]" />
                  <div className="font-medium text-[#1b5e20]">Mode vendeur</div>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      await signInDemo();
                    } catch (error) {
                      console.error('Erreur connexion rapide:', error);
                      alert("Erreur d'accès rapide");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="w-full p-3 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  disabled={isLoading}
                >
                  <div className="font-medium text-orange-900">🎯 Mode vendeur (bypass)</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const fakeUser = {
                      id: '550e8400-e29b-41d4-a716-446655440002',
                      email: 'fake@vendeur.com',
                      name: 'Fake Vendeur',
                      role: 'vendor',
                      user_metadata: {
                        role: 'vendor',
                        full_name: 'Fake Vendeur',
                        phone: '+221771234567'
                      }
                    };

                    localStorage.setItem('fake_user', JSON.stringify(fakeUser));
                    localStorage.setItem('fake_mode', 'true');
                    window.location.href = '/dashboard';
                  }}
                  className="w-full p-3 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <div className="font-medium text-purple-900">⚡ Connexion directe</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
