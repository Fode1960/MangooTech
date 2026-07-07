import React, { useState } from 'react';
import LiveShoppingManager from '../components/LiveShoppingManager';
import { Store, User, Settings, Users, TrendingUp, ShoppingBag, Play, Pause } from 'lucide-react';

const LiveShoppingDemo: React.FC = () => {
  const [mode, setMode] = useState<'host' | 'viewer'>('host');
  const [roomId] = useState('demo-room-123');
  const [userId] = useState(mode === 'host' ? 'host-123' : 'viewer-456');
  const [userName] = useState(mode === 'host' ? 'MangooTech Boutique' : 'Client Premium');
  const [isLive, setIsLive] = useState(false);

  const handleEndStream = () => {
    if (confirm('Êtes-vous sûr de vouloir terminer le live ?')) {
      setIsLive(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6faf3]">
      {/* En-tête de navigation */}
      <div className="bg-white shadow-lg border-b border-[#c8e6c9]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#1b5e20] rounded-full flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">MangooTech Live Shopping</h1>
                <p className="text-gray-600">Démonstration interactive de vente en direct</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-[#e8f5e9] px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span className="text-sm font-medium text-gray-700">
                    {isLive ? 'EN DIRECT' : 'HORS LIGNE'}
                  </span>
                </div>
              </div>
              
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setMode('host')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'host'
                      ? 'bg-[#1b5e20] text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Store className="w-4 h-4 inline mr-2" />
                  Vendeur
                </button>
                <button
                  onClick={() => setMode('viewer')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'viewer'
                      ? 'bg-[#1b5e20] text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <User className="w-4 h-4 inline mr-2" />
                  Client
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'informations */}
      <div className="bg-[#1b5e20] text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span className="font-medium">Mode: {mode === 'host' ? 'Vendeur' : 'Client'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span className="font-medium">Room ID: {roomId}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">Live Shopping Premium</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Cartes d'information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#e8f5e9] rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-[#1b5e20]" />
              </div>
              <span className="text-2xl font-bold text-gray-800">245</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Spectateurs Actifs</h3>
            <p className="text-gray-600 text-sm">Personnes regardant le live en ce moment</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#e8f5e9] rounded-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-[#1b5e20]" />
              </div>
              <span className="text-2xl font-bold text-gray-800">1,247</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Produits Vendus</h3>
            <p className="text-gray-600 text-sm">Total des ventes depuis le début du live</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#e8f5e9] rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#1b5e20]" />
              </div>
              <span className="text-2xl font-bold text-gray-800">87%</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Taux d'Engagement</h3>
            <p className="text-gray-600 text-sm">Interactions des spectateurs</p>
          </div>
        </div>

        {/* Interface Live Shopping */}
        <LiveShoppingManager
          mode={mode}
          roomId={roomId}
          userId={userId}
          userName={userName}
          onEndStream={mode === 'host' ? handleEndStream : undefined}
        />
      </div>

      {/* Instructions */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Comment utiliser le Live Shopping</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mode === 'host' ? (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-[#1b5e20] mb-4">Pour le Vendeur</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-[#1b5e20] text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                      <span>Cliquez sur le bouton PLAY pour démarrer le live</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-[#1b5e20] text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                      <span>Sélectionnez des produits à présenter depuis le panel</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-[#1b5e20] text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                      <span>Interagissez avec les spectateurs via le chat</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-[#1b5e20] text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">4</div>
                      <span>Surveillez les statistiques en temps réel</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1b5e20] mb-4">Fonctionnalités Avancées</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start space-x-3">
                      <Play className="w-5 h-5 text-[#1b5e20] mt-0.5" />
                      <span>Contrôle complet du streaming (play, pause, stop)</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Users className="w-5 h-5 text-[#1b5e20] mt-0.5" />
                      <span>Gestion des spectateurs et modérateurs</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <TrendingUp className="w-5 h-5 text-[#1b5e20] mt-0.5" />
                      <span>Analytiques détaillées en temps réel</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Settings className="w-5 h-5 text-gray-500 mt-0.5" />
                      <span>Paramètres de diffusion personnalisables</span>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-[#1b5e20] mb-4">Pour le Client</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-[#1b5e20] text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                      <span>Regardez le live et découvrez les produits</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-[#1b5e20] text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                      <span>Utilisez le chat pour poser des questions</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-[#1b5e20] text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                      <span>Cliquez sur "Acheter" pour vos produits favoris</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-[#1b5e20] text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">4</div>
                      <span>Partagez le live avec vos amis</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1b5e20] mb-4">Avantages Client</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start space-x-3">
                      <ShoppingBag className="w-5 h-5 text-[#1b5e20] mt-0.5" />
                      <span>Réductions exclusives pendant le live</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Users className="w-5 h-5 text-[#1b5e20] mt-0.5" />
                      <span>Interaction directe avec le vendeur</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <TrendingUp className="w-5 h-5 text-[#1b5e20] mt-0.5" />
                      <span>Découverte de nouveaux produits en avant-première</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <Settings className="w-5 h-5 text-gray-500 mt-0.5" />
                      <span>Expérience d'achat interactive et sociale</span>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveShoppingDemo;