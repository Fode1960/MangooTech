import React, { useState } from 'react';
import { Key, Store, Eye, EyeOff, QrCode } from 'lucide-react';
import { supabase } from '../config/supabase';

const VendorLogin = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentVendor, setCurrentVendor] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Vérifier les identifiants dans la table shop_auth
      const { data: authData, error: authError } = await supabase
        .from('shop_auth')
        .select(`
          *,
          shops!inner(*)
        `)
        .eq('vendor_login', login)
        .eq('vendor_password', password)
        .eq('is_active', true)
        .single();

      if (authError || !authData) {
        throw new Error('Identifiants invalides ou compte désactivé');
      }

      // Vérifier que la boutique est approuvée
      if (authData.shops.status !== 'approved') {
        throw new Error(`Votre boutique est ${authData.shops.status}. Contactez l'administrateur.`);
      }

      // Mettre à jour la dernière connexion
      await supabase
        .from('shop_auth')
        .update({ 
          last_login_at: new Date().toISOString(),
          login_attempts: 0
        })
        .eq('id', authData.id);

      setCurrentVendor({
        shopId: authData.shop_id,
        shopName: authData.shops.name,
        shopUrl: authData.shop_url,
        vendorLogin: authData.vendor_login
      });

      // Rediriger vers le tableau de bord vendeur
      setTimeout(() => {
        window.location.href = `/vendor-dashboard/${authData.shop_id}`;
      }, 1500);

    } catch (error) {
      setError(error.message);
      
      // Incrémenter les tentatives de connexion
      if (login) {
        try {
          const { data: existingAuth } = await supabase
            .from('shop_auth')
            .select('login_attempts')
            .eq('vendor_login', login)
            .single();

          if (existingAuth) {
            const newAttempts = (existingAuth.login_attempts || 0) + 1;
            await supabase
              .from('shop_auth')
              .update({ login_attempts: newAttempts })
              .eq('vendor_login', login);
          }
        } catch (updateError) {
          console.error('Erreur mise à jour tentatives:', updateError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQRLogin = () => {
    // Scanner un QR code pour se connecter rapidement
    alert('Fonction QR Code à implémenter avec la caméra du téléphone');
  };

  if (currentVendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Connexion réussie !</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Bienvenue dans votre boutique <strong>{currentVendor.shopName}</strong>
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Redirection vers votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Connexion Vendeur
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Accédez à votre espace vendeur
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-xs">!</span>
              </div>
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Identifiant Vendeur
            </label>
            <div className="relative">
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Ex: vendor_ABC123"
                required
              />
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Votre mot de passe"
                required
              />
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-green-600 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Connexion...</span>
              </>
            ) : (
              <>
                <Key className="w-4 h-4" />
                <span>Se connecter</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleQRLogin}
            className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <QrCode className="w-4 h-4" />
            <span>Connexion par QR Code</span>
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vous n'avez pas de compte vendeur ?
          </p>
          <a
            href="/vendor/register"
            className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-colors"
          >
            Créer une boutique
          </a>
        </div>
      </div>
    </div>
  );
};

export default VendorLogin;