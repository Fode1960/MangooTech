import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { Store, LogIn, User, Lock } from 'lucide-react';

const VendorLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVendorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Authentification avec compte demo pour tester
      const demoEmail = email.toLowerCase().trim();
      
      if (demoEmail === 'vendor@example.com' && password === 'vendor123') {
        // Mode demo - créer une session vendeur simulée
        console.log('🎯 Mode DEMO activé - création session vendeur');
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
        
        console.log('✅ Session demo créée avec succès');
        navigate('/vendor-dashboard');
        return;
      }

      // 2. Pour les comptes réels - Authentification Supabase
      console.log('🔄 Tentative d\'authentification Supabase...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: password,
      });

      if (authError) {
        console.error('❌ Erreur Supabase:', authError);
        throw new Error('Identifiants invalides ou compte désactivé');
      }
      
      if (!authData.user) {
        throw new Error('Utilisateur non trouvé');
      }

      console.log('✅ Authentification Supabase réussie');

      // 3. Vérifier si l'utilisateur est un vendeur
      const { data: vendorData, error: vendorError } = await supabase
        .from('shop_auth')
        .select('shop_id')
        .eq('user_id', authData.user.id)
        .single();

      if (vendorError || !vendorData) {
        throw new Error('Vous n\'êtes pas autorisé à accéder à l\'espace vendeur');
      }

      // 4. Récupérer les infos de la boutique
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id, name, slug, status')
        .eq('id', vendorData.shop_id)
        .single();

      if (shopError || !shopData) {
        throw new Error('Boutique non trouvée');
      }

      // 5. Vérifier que la boutique est approuvée
      if (shopData.status !== 'approved') {
        throw new Error('Votre boutique n\'est pas encore approuvée par l\'administrateur');
      }

      // 6. Stocker les informations de session
      const vendorSession = {
        id: authData.user.id,
        email: authData.user.email,
        shopId: shopData.id,
        shopName: shopData.name,
        shopSlug: shopData.slug,
        role: 'vendor'
      };

      localStorage.setItem('vendor-session', JSON.stringify(vendorSession));
      localStorage.setItem('user', JSON.stringify({
        id: authData.user.id,
        email: authData.user.email,
        role: 'vendor'
      }));
      
      console.log('✅ Session vendeur créée avec succès');
      // 7. Rediriger vers le tableau de bord
      navigate('/vendor-dashboard');

    } catch (error: any) {
      console.error('❌ Erreur de connexion vendeur:', error);
      setError(error.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si déjà connecté
  useEffect(() => {
    const savedSession = localStorage.getItem('vendor-session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        // Vérifier que la session est toujours valide
        supabase.auth.getUser().then(({ data }) => {
          if (data.user && data.user.id === session.id) {
            navigate('/vendor-dashboard');
          } else {
            localStorage.removeItem('vendor-session');
          }
        });
      } catch (error) {
        localStorage.removeItem('vendor-session');
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Espace Vendeur</h1>
          <p className="text-gray-600">Connectez-vous pour gérer votre boutique</p>
        </div>

        <form onSubmit={handleVendorLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
              placeholder="votre@email.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Bouton de test rapide pour le mode DEMO */}
          <button
            type="button"
            onClick={() => {
              console.log('🎯 TEST RAPIDE - Activation mode DEMO');
              const demoEmail = 'vendor@example.com';
              const demoPassword = 'vendor123';
              setEmail(demoEmail);
              setPassword(demoPassword);
              
              // Forcer la connexion demo immédiatement
              setTimeout(() => {
                console.log('🚀 Connexion DEMO forcée');
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
                
                console.log('✅ Session DEMO créée - redirection...');
                navigate('/vendor-dashboard');
              }, 100);
            }}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            🚀 Test Rapide - Connexion DEMO
          </button>

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

export default VendorLogin;