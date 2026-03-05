import React, { useState } from 'react';
import { Video, Radio, Phone, Users, ShoppingCart, Settings, Play, User, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WebRTCTestHub = () => {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<'vendor' | 'customer'>('vendor');
  const [roomId, setRoomId] = useState('demo-room-' + Math.random().toString(36).substr(2, 9));

  const handleStartVideoCall = () => {
    if (selectedMode === 'vendor') {
      navigate('/vendor-webrtc', { state: { mode: 'video-call', roomId } });
    } else {
      navigate('/client-webrtc', { state: { mode: 'video-call', roomId } });
    }
  };

  const handleStartLiveShopping = () => {
    if (selectedMode === 'vendor') {
      navigate('/vendor-webrtc', { state: { mode: 'live-shopping', roomId } });
    } else {
      navigate('/client-webrtc', { state: { mode: 'live-shopping', roomId } });
    }
  };

  const handleGoToDashboard = () => {
    navigate('/vendor-dashboard');
  };

  const generateNewRoomId = () => {
    setRoomId('demo-room-' + Math.random().toString(36).substr(2, 9));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                🛍️
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
                  MangooTech WebRTC Hub
                </h1>
                <p className="text-gray-600">Testez les fonctionnalités d'appel vidéo et live shopping</p>
              </div>
            </div>
            <button
              onClick={handleGoToDashboard}
              className="bg-gradient-to-r from-orange-500 to-green-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-green-700 transition-all flex items-center gap-2"
            >
              <Store className="w-5 h-5" />
              Tableau de Bord
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Mode Selection */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Choisissez votre mode de test
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setSelectedMode('vendor')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  selectedMode === 'vendor'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Store className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Mode Vendeur</h3>
                  <p className="text-gray-600">Testez les fonctionnalités de vente et de présentation</p>
                </div>
              </button>
              <button
                onClick={() => setSelectedMode('customer')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  selectedMode === 'customer'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Mode Client</h3>
                  <p className="text-gray-600">Testez l'expérience d'achat et d'interaction</p>
                </div>
              </button>
            </div>
          </div>

          {/* Room Configuration */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Configuration de la session
            </h2>
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code de la room
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Entrez le code room"
                  />
                  <button
                    onClick={generateNewRoomId}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors"
                    title="Générer nouveau code"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Test Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Video Call Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Appel Vidéo</h3>
                <p className="text-gray-600">Testez les appels vidéo en temps réel avec WebRTC</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Fonctionnalités incluses:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Partage d'écran</li>
                    <li>• Chat en temps réel</li>
                    <li>• Contrôle audio/vidéo</li>
                    <li>• Mode plein écran</li>
                    <li>• Paramètres avancés</li>
                  </ul>
                </div>
                
                <button
                  onClick={handleStartVideoCall}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Démarrer l'appel vidéo
                </button>
              </div>
            </div>

            {/* Live Shopping Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Radio className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Live Shopping</h3>
                <p className="text-gray-600">Expérience d'achat en direct avec interaction vidéo</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Fonctionnalités incluses:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Présentation produits en direct</li>
                    <li>• Chat interactif</li>
                    <li>• Réactions en temps réel</li>
                    <li>• Achat direct</li>
                    <li>• Statistiques live</li>
                  </ul>
                </div>
                
                <button
                  onClick={handleStartLiveShopping}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Démarrer le live shopping
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-12 bg-gradient-to-r from-orange-100 to-green-100 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              Comment utiliser le système WebRTC
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Pour les vendeurs:</h4>
                <ol className="text-sm text-gray-700 space-y-1">
                  <li>1. Sélectionnez "Mode Vendeur"</li>
                  <li>2. Choisissez le type de session</li>
                  <li>3. Copiez le code room pour le partager</li>
                  <li>4. Démarrer la session et attendre les clients</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Pour les clients:</h4>
                <ol className="text-sm text-gray-700 space-y-1">
                  <li>1. Sélectionnez "Mode Client"</li>
                  <li>2. Entrez le code room fourni par le vendeur</li>
                  <li>3. Rejoignez la session</li>
                  <li>4. Interagissez via chat et vidéo</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebRTCTestHub;