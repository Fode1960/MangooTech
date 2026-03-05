import React, { useState, useEffect } from 'react';
import { Key, QrCode, Link, Eye, EyeOff, Copy, Check, RefreshCw } from 'lucide-react';
import { supabase } from '../config/supabase';
import QRCode from 'qrcode';

const VendorAuthSystem = ({ boutique }) => {
  const [authSettings, setAuthSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (boutique?.id) {
      loadAuthSettings();
    }
  }, [boutique]);

  const loadAuthSettings = async () => {
    try {
      setLoading(true);
      
      // Vérifier si des paramètres d'authentification existent
      const { data, error } = await supabase
        .from('shop_auth')
        .select('*')
        .eq('shop_id', boutique.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erreur lors du chargement:', error);
      }

      if (data) {
        setAuthSettings(data);
        generateQRCode(data.shop_url);
      } else {
        // Créer les paramètres d'authentification par défaut
        await createDefaultAuthSettings();
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultAuthSettings = async () => {
    try {
      const shopUrl = `https://mangootech.com/shop/${boutique.slug || boutique.id}`;
      const vendorLogin = `vendor_${boutique.id.slice(0, 8)}`;
      const vendorPassword = generateSecurePassword();
      
      // Hacher le mot de passe avant stockage
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(vendorPassword, 10);

      const { data, error } = await supabase
        .from('shop_auth')
        .insert({
          shop_id: boutique.id,
          shop_url: shopUrl,
          vendor_login: vendorLogin,
          vendor_password: hashedPassword,
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur création auth:', error);
        return;
      }

      // Stocker temporairement le mot de passe en clair pour l'affichage unique
      setAuthSettings({
        ...data,
        temp_password: vendorPassword // Ne sera pas sauvegardé en base
      });
      generateQRCode(data.shop_url);
    } catch (error) {
      console.error('Erreur création paramètres:', error);
    }
  };

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const generateQRCode = async (url) => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Erreur génération QR:', error);
    }
  };

  const regeneratePassword = async () => {
    if (!confirm('Êtes-vous sûr de vouloir regénérer le mot de passe ? Le mot de passe actuel sera définitivement perdu.')) return;

    try {
      const newPassword = generateSecurePassword();
      
      // Hacher le nouveau mot de passe
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const { error } = await supabase
        .from('shop_auth')
        .update({ 
          vendor_password: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('shop_id', boutique.id);

      if (error) {
        console.error('Erreur mise à jour:', error);
        return;
      }

      // Afficher le nouveau mot de passe une seule fois
      setAuthSettings(prev => ({
        ...prev,
        temp_password: newPassword
      }));
      
      alert(`Mot de passe regénéré avec succès !\n\nNouveau mot de passe: ${newPassword}\n\nNotez-le immédiatement, il ne sera plus affiché.`);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur copie:', error);
    }
  };

  const toggleAuthStatus = async () => {
    try {
      const { error } = await supabase
        .from('shop_auth')
        .update({ 
          is_active: !authSettings.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('shop_id', boutique.id);

      if (error) {
        console.error('Erreur:', error);
        return;
      }

      setAuthSettings(prev => ({ ...prev, is_active: !prev.is_active }));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-300">Chargement des paramètres d'authentification...</span>
        </div>
      </div>
    );
  }

  if (!authSettings) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-4">Aucun paramètre d'authentification trouvé</p>
          <button
            onClick={createDefaultAuthSettings}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto"
          >
            <Key className="w-4 h-4" />
            <span>Générer les paramètres</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <Key className="w-5 h-5" />
          <span>Paramètres d'Authentification</span>
        </h3>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            authSettings.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {authSettings.is_active ? 'Actif' : 'Inactif'}
          </span>
          <button
            onClick={toggleAuthStatus}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              authSettings.is_active
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {authSettings.is_active ? 'Désactiver' : 'Activer'}
          </button>
        </div>
      </div>

      {/* URL de la Boutique */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
          <Link className="w-4 h-4" />
          <span>URL de la Boutique</span>
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={authSettings.shop_url}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <button
            onClick={() => copyToClipboard(authSettings.shop_url, 'url')}
            className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
            title="Copier l'URL"
          >
            {copied === 'url' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Identifiants de Connexion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Identifiant Vendeur
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={authSettings.vendor_login}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <button
              onClick={() => copyToClipboard(authSettings.vendor_login, 'login')}
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title="Copier l'identifiant"
            >
              {copied === 'login' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mot de passe
          </label>
          <div className="flex items-center space-x-2">
            <input
              type={showPassword ? 'text' : 'password'}
              value={authSettings.temp_password || '••••••••'}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title={showPassword ? 'Cacher' : 'Afficher'}
              disabled={!authSettings.temp_password}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={() => copyToClipboard(authSettings.temp_password || '', 'password')}
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title="Copier le mot de passe"
              disabled={!authSettings.temp_password}
            >
              {copied === 'password' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={regeneratePassword}
              className="p-2 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800 rounded-lg transition-colors"
              title="Regénérer le mot de passe"
            >
              <RefreshCw className="w-4 h-4 text-orange-600" />
            </button>
          </div>
          {!authSettings.temp_password && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Le mot de passe est sécurisé. Cliquez sur "Regénérer" pour créer un nouveau mot de passe.
            </p>
          )}
        </div>
      </div>

      {/* QR Code */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
          <QrCode className="w-4 h-4" />
          <span>QR Code</span>
        </label>
        <div className="flex flex-col items-center space-y-4">
          {qrCodeUrl && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
            </div>
          )}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Scannez ce QR code pour accéder directement à votre boutique
            </p>
            <button
              onClick={() => copyToClipboard(qrCodeUrl, 'qr')}
              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs transition-colors"
            >
              {copied === 'qr' ? 'Copié !' : 'Copier le QR Code'}
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={regeneratePassword}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm transition-colors"
        >
          <Key className="w-4 h-4" />
          <span>Regénérer le mot de passe</span>
        </button>
        
        <a
          href={authSettings.shop_url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm transition-colors"
        >
          <Link className="w-4 h-4" />
          <span>Visiter la boutique</span>
        </a>
      </div>

      {/* Informations de sécurité */}
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Sécurité</h4>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
          <li>• Gardez vos identifiants secrets</li>
          <li>• Changez régulièrement votre mot de passe</li>
          <li>• Ne partagez pas vos accès avec des tiers</li>
          <li>• Le QR code donne un accès direct à votre boutique</li>
        </ul>
      </div>
    </div>
  );
};

export default VendorAuthSystem;