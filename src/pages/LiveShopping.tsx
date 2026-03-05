import React, { useState, useEffect } from 'react';
import { Film, ShoppingBag, Users, TrendingUp, Play, Phone, MessageCircle, Heart, Share2 } from 'lucide-react';
import WebRTCCall from '../components/WebRTCCall';
import { Toaster } from 'sonner';
import { useLiveShopping } from '../contexts/LiveShoppingContext';

interface LiveSession {
  id: number;
  title: string;
  vendor: string;
  vendorId: string;
  viewers: number;
  duration: string;
  status: 'live' | 'scheduled' | 'ended';
  thumbnail: string;
  isActive: boolean;
}

const LiveShopping: React.FC = () => {
  const { messages, sendMessage, currentProduct, selectProduct, isLive, setIsLive, viewers, setViewers, setUserRole } = useLiveShopping();
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
  const [showCallInterface, setShowCallInterface] = useState(false);
  const [clientId] = useState('client-' + Math.random().toString(36).substr(2, 9));

  // Définir le rôle du client - MODIFIÉ TEMPORAIREMENT POUR TEST
  useEffect(() => {
    setUserRole('vendor');
  }, []);

  const liveSessions: LiveSession[] = [
    {
      id: 1,
      title: 'Collection Wax Ankara 2024',
      vendor: 'MangooTech Boutique',
      vendorId: 'vendor-8888',
      viewers: 245,
      duration: '45 min',
      status: 'live',
      thumbnail: '🎥',
      isActive: true
    },
    {
      id: 2,
      title: 'Bijoux Traditionnels Sénégalais',
      vendor: 'Artisanat Dior',
      vendorId: 'vendor-8889',
      viewers: 128,
      duration: '32 min',
      status: 'live',
      thumbnail: '💎',
      isActive: true
    },
    {
      id: 3,
      title: 'Tissus Wax Premium',
      vendor: 'Tissus Express',
      vendorId: 'vendor-8890',
      viewers: 89,
      duration: '28 min',
      status: 'live',
      thumbnail: '🧵',
      isActive: false
    }
  ];

  const handleJoinSession = (session: LiveSession) => {
    setSelectedSession(session);
    setShowCallInterface(true);
  };

  const handleLeaveSession = () => {
    setSelectedSession(null);
    setShowCallInterface(false);
  };

  const handleCallStart = () => {
    console.log('Appel démarré pour la session:', selectedSession?.title);
  };

  const handleCallEnd = () => {
    console.log('Appel terminé pour la session:', selectedSession?.title);
  };

  if (selectedSession && showCallInterface) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <Toaster position="top-right" />
        
        {/* Header de la session active */}
        <div className="bg-white shadow-lg border-b border-orange-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLeaveSession}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>← Retour</span>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Film className="w-6 h-6 text-red-500 mr-2" />
                    {selectedSession.title}
                  </h1>
                  <p className="text-gray-600">par {selectedSession.vendor}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse flex items-center space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>EN DIRECT</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">{selectedSession.viewers} spectateurs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Zone vidéo principale */}
            <div className="lg:col-span-2">
              <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
                <div className="aspect-video bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-white text-8xl">
                  {selectedSession.thumbnail}
                </div>
                
                {/* Contrôles de streaming */}
                <div className="bg-gray-900 p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-red-600 text-white px-3 py-1 rounded text-sm font-bold animate-pulse">
                      🔴 LIVE
                    </div>
                    <div className="text-white text-sm">
                      Durée: {selectedSession.duration}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Informations du vendeur */}
              <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">À propos du vendeur</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {selectedSession.vendor.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{selectedSession.vendor}</h4>
                    <p className="text-gray-600">Vendeur vérifié • 4.8⭐ (245 avis)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Panneau latéral */}
            <div className="space-y-6">
              {/* Interface d'appel WebRTC */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Appel avec le vendeur</h3>
                <WebRTCCall
                  sessionId={`live-session-${selectedSession.id}`}
                  vendorId={selectedSession.vendorId}
                  clientId={clientId}
                  mode="client"
                  onCallStart={handleCallStart}
                  onCallEnd={handleCallEnd}
                />
              </div>

              {/* Chat */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Chat en direct</h3>
                <div className="h-64 bg-gray-50 rounded-lg p-4 mb-4 overflow-y-auto">
                  <div className="space-y-2">
                    {messages.length === 0 ? (
                      <div className="text-gray-500 text-center py-8">
                        Aucun message pour le moment...
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className={`rounded-lg p-2 text-sm ${
                          msg.from === 'Vendeur' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <div className={`font-medium ${
                            msg.from === 'Vendeur' ? 'text-blue-800' : 'text-gray-800'
                          }`}>
                            {msg.from}
                          </div>
                          <div className={`${
                            msg.from === 'Vendeur' ? 'text-blue-700' : 'text-gray-700'
                          }`}>
                            {msg.message}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Écrire un message..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        if (input.value.trim()) {
                          sendMessage(input.value, 'Client', 'live-shopping-demo');
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button 
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).closest('div')?.querySelector('input') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        sendMessage(input.value, 'Client', 'live-shopping-demo');
                        input.value = '';
                      }
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Produits en vedette */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Produits en vedette</h3>
                
                {/* Produit actuellement présenté */}
                {currentProduct && (
                  <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                        {currentProduct.image}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-orange-800">En vedette maintenant</div>
                        <div className="font-medium text-gray-900">{currentProduct.name}</div>
                        <div className="text-sm text-green-600 font-bold">{currentProduct.price.toLocaleString()} FCFA</div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  <div 
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => {
                      console.log('=== Clic sur Robe Wax Ankara ===');
                      const product = { id: 1, name: 'Robe Wax Ankara', price: 25000, image: '👗', description: 'Magnifique robe wax africain, faite main avec des motifs traditionnels' };
                      console.log('Produit à sélectionner:', product);
                      selectProduct(product);
                    }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
                      👗
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Robe Wax Ankara</div>
                      <div className="text-sm text-green-600 font-bold">25 000 FCFA</div>
                    </div>
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm transition-colors">
                      Acheter
                    </button>
                  </div>
                  
                  <div 
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => {
                      const product = { id: 2, name: 'Collier Perles', price: 15000, image: '💎', description: 'Collier traditionnel en perles artisanales, parfait pour les occasions spéciales' };
                      selectProduct(product);
                    }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                      💎
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Collier traditionnel</div>
                      <div className="text-sm text-green-600 font-bold">15 000 FCFA</div>
                    </div>
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm transition-colors">
                      Acheter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Film className="w-8 h-8 text-red-500 mr-3" />
                Live Shopping
              </h1>
              <p className="text-gray-600 mt-2">Assistez à des ventes en direct et communiquez avec les vendeurs</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{liveSessions.filter(s => s.status === 'live').length}</div>
                <div className="text-sm text-gray-500">En direct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{liveSessions.reduce((sum, s) => sum + s.viewers, 0)}</div>
                <div className="text-sm text-gray-500">Spectateurs</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Sessions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sessions en direct</h2>
          <p className="text-gray-600">Rejoignez nos vendeurs en direct et discutez avec eux</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {liveSessions.map((session) => (
            <div key={session.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-white text-6xl relative">
                {session.thumbnail}
                {session.status === 'live' && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                    🔴 LIVE
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    session.status === 'live' ? 'bg-red-500 text-white animate-pulse' :
                    session.status === 'scheduled' ? 'bg-blue-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {session.status === 'live' ? 'EN DIRECT' :
                     session.status === 'scheduled' ? 'PROGRAMMÉ' :
                     'TERMINÉ'}
                  </span>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">{session.viewers}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{session.title}</h3>
                <p className="text-gray-600 mb-4">par {session.vendor}</p>
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">{session.duration}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-green-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Live</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => handleJoinSession(session)}
                    disabled={!session.isActive}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 px-4 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <Play className="w-5 h-5" />
                    <span>{session.isActive ? 'Rejoindre + Appel' : 'Bientôt disponible'}</span>
                  </button>
                  
                  <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2">
                    <ShoppingBag className="w-5 h-5" />
                    <span>Voir les produits</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Access */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-8 text-white text-center">
          <div className="flex items-center justify-center mb-4">
            <Film className="w-12 h-12 mr-4" />
            <h2 className="text-3xl font-bold">Démonstration Live Shopping</h2>
          </div>
          <p className="text-xl mb-6">
            Essayez notre démonstration interactive de Live Shopping avec appels audio
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="/live-shopping-demo"
              className="bg-white text-red-500 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors inline-flex items-center space-x-2"
            >
              <Play className="w-6 h-6" />
              <span>Démo Vendeur</span>
            </a>
            <a
              href="/client-webrtc?mode=live-shopping"
              className="bg-white text-red-500 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors inline-flex items-center space-x-2"
            >
              <Phone className="w-6 h-6" />
              <span>Démo Client WebRTC</span>
            </a>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Fonctionnalités Premium</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Film className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Streaming HD</h3>
              <p className="text-gray-600">Qualité vidéo haute définition</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Appels Audio</h3>
              <p className="text-gray-600">Discutez directement avec les vendeurs</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Achat Instantané</h3>
              <p className="text-gray-600">Achetez pendant le live</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytiques</h3>
              <p className="text-gray-600">Statistiques en temps réel</p>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveShopping;