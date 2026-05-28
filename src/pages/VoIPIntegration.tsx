import React, { useState } from 'react';
import SIPClient from '../components/SIPClient';
import { Phone, Settings, User, Server } from 'lucide-react';
import { Toaster, toast } from 'sonner';

/**
 * Page d'intégration VoIP
 * Permet de tester la connexion avec le système FreePBX/Asterisk
 */
const VoIPIntegration: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [sipCredentials, setSipCredentials] = useState({
    username: '', // Laisser vide pour forcer la saisie
    password: '',
    domain: 'mangootech.local'
  });
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const handleConnect = () => {
    setConnectionStatus('connecting');
    
    // Simuler la connexion au système SIP avec les credentials actuels
    setTimeout(() => {
      setIsConnected(true);
      setConnectionStatus('connected');
      toast.success(`Connecté au système VoIP avec ${sipCredentials.username}`);
    }, 2000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setConnectionStatus('disconnected');
    toast.info('Déconnecté du système VoIP');
  };

  const handleCredentialsChange = (field: string, value: string) => {
    setSipCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Phone className="w-8 h-8 text-orange-500 mr-3" />
                Intégration VoIP Mangoo Connect+
              </h1>
              <p className="text-gray-600 mt-2">
                Connectez votre plateforme au système FreePBX/Asterisk
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  connectionStatus === 'connected' ? 'text-green-500' :
                  connectionStatus === 'connecting' ? 'text-yellow-500' :
                  'text-gray-400'
                }`}>
                  {connectionStatus === 'connected' ? '✅' :
                   connectionStatus === 'connecting' ? '⏳' : '❌'}
                </div>
                <div className="text-sm text-gray-500">
                  {connectionStatus === 'connected' ? 'Connecté' :
                   connectionStatus === 'connecting' ? 'Connexion...' :
                   'Déconnecté'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Configuration SIP */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <Settings className="w-6 h-6 text-orange-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">Configuration SIP</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serveur SIP
                </label>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Server className="w-4 h-4" />
                  <span>194.163.190.74:5060 (UDP)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={sipCredentials.username}
                  onChange={(e) => handleCredentialsChange('username', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="vendeur001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={sipCredentials.password}
                  onChange={(e) => handleCredentialsChange('password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="password123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domaine
                </label>
                <input
                  type="text"
                  value={sipCredentials.domain}
                  onChange={(e) => handleCredentialsChange('domain', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="mangootech.local"
                />
              </div>

              <div className="pt-4">
                {!isConnected ? (
                  <button
                    onClick={handleConnect}
                    disabled={connectionStatus === 'connecting'}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    {connectionStatus === 'connecting' ? 'Connexion...' : 'Se connecter'}
                  </button>
                ) : (
                  <button
                    onClick={handleDisconnect}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Se déconnecter
                  </button>
                )}
              </div>
            </div>

            {/* Informations système */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Système VoIP</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Serveur:</span>
                  <span>FreePBX/Asterisk</span>
                </div>
                <div className="flex justify-between">
                  <span>Adresse:</span>
                  <span>194.163.190.74:5060</span>
                </div>
                <div className="flex justify-between">
                  <span>Protocole:</span>
                  <span>SIP/UDP</span>
                </div>
                <div className="flex justify-between">
                  <span>Système:</span>
                  <span>Mangoo Connect+</span>
                </div>
              </div>
            </div>
          </div>

          {/* Client WebRTC */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <User className="w-6 h-6 text-orange-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">Client WebRTC</h2>
            </div>

            {isConnected ? (
              <SIPClient 
                userId={sipCredentials.username}
                sipCredentials={sipCredentials}
              />
            ) : (
              <div className="text-center py-12">
                <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Client WebRTC
                </h3>
                <p className="text-gray-600 mb-4">
                  Connectez-vous au système VoIP pour utiliser le client WebRTC
                </p>
                <button
                  onClick={handleConnect}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Se connecter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Fonctionnalités */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Fonctionnalités VoIP</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Phone className="w-8 h-8 text-orange-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Appels Audio/Vidéo</h3>
              <p className="text-sm text-gray-600">
                Passer des appels audio et vidéo via le navigateur
              </p>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Settings className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Configuration SIP</h3>
              <p className="text-sm text-gray-600">
                Connexion directe à votre système FreePBX/Asterisk
              </p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <User className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Multi-utilisateurs</h3>
              <p className="text-sm text-gray-600">
                Support de multiples utilisateurs et extensions
              </p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Server className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Passerelle SIP</h3>
              <p className="text-sm text-gray-600">
                Pont entre WebRTC et votre infrastructure VoIP
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoIPIntegration;