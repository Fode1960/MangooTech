import React, { useState } from 'react';
import { Film, ShoppingBag, Users, TrendingUp, Play, Phone, MessageCircle, Heart, Share2, Store, ArrowLeft } from 'lucide-react';
import WebRTCCall from '../components/WebRTCCall';
import { Toaster } from 'sonner';
import { useLiveShopping } from '../contexts/LiveShoppingContext';
import { LiveShoppingLobby } from '../components/LiveShoppingLobby';

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

const EnhancedLiveShopping: React.FC = () => {
  const { 
    messages, 
    sendMessage, 
    currentProduct, 
    selectProduct, 
    isLive, 
    setIsLive, 
    viewers, 
    setViewers, 
    setUserRole,
    currentRoomId,
    leaveRoom
  } = useLiveShopping();
  
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
  const [showCallInterface, setShowCallInterface] = useState(false);
  const [clientId] = useState('client-' + Math.random().toString(36).substr(2, 9));
  const [userRole, setUserRoleState] = useState<'vendor' | 'client'>('client');
  const [currentRoomInfo, setCurrentRoomInfo] = useState<any>(null);

  const handleJoinRoom = (roomId: string, role: 'vendor' | 'client') => {
    console.log(`=== Rejoindre la room: ${roomId} en tant que ${role} ===`);
    setUserRoleState(role);
    setIsLive(true);
    setCurrentRoomInfo({ roomId, role });
    setShowCallInterface(true);
  };

  const handleLeaveRoom = () => {
    console.log('=== Quitter la room ===');
    leaveRoom();
    setSelectedSession(null);
    setShowCallInterface(false);
    setCurrentRoomInfo(null);
    setIsLive(false);
  };

  const handleCallStart = () => {
    console.log('Appel démarré pour la room:', currentRoomInfo?.roomId);
  };

  const handleCallEnd = () => {
    console.log('Appel terminé pour la room:', currentRoomInfo?.roomId);
  };

  if (!showCallInterface) {
    return (
      <LiveShoppingLobby
        onRoomJoined={handleJoinRoom}
        userId={clientId}
        userName="Utilisateur"
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f6faf3]">
      <Toaster position="top-right" />
      
      {/* Header de la session active */}
      <div className="bg-white shadow-lg border-b border-[#cfe0c8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLeaveRoom}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quitter</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Film className="w-6 h-6 text-[#1b5e20] mr-2" />
                  Session Live Shopping
                </h1>
                <p className="text-gray-600">
                  Room: {currentRoomInfo?.roomId} • Rôle: {userRole === 'vendor' ? 'Vendeur' : 'Client'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse flex items-center space-x-1">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>EN DIRECT</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span className="font-medium">{viewers} viewers</span>
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
              <div className="aspect-video bg-[#1b5e20] flex items-center justify-center text-white text-8xl">
                
              </div>
              
              {/* Contrôles de streaming */}
              <div className="bg-gray-900 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-red-600 text-white px-3 py-1 rounded text-sm font-bold animate-pulse">
                     LIVE
                  </div>
                  <div className="text-white text-sm">
                    Room ID: {currentRoomInfo?.roomId}
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

            {/* Interface d'appel WebRTC */}
            <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Communication Audio</h3>
              <WebRTCCall
                sessionId={currentRoomInfo?.roomId || 'default-session'}
                vendorId={userRole === 'vendor' ? clientId : 'vendor-8888'}
                clientId={clientId}
                mode={userRole}
                onCallStart={handleCallStart}
                onCallEnd={handleCallEnd}
              />
            </div>
          </div>

          {/* Panneau latéral */}
          <div className="space-y-6">
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
                        msg.from === 'Vendeur' || msg.from === userRole ? 'bg-[#eef6ea]' : 'bg-gray-100'
                      }`}>
                        <div className={`font-medium ${
                          msg.from === 'Vendeur' || msg.from === userRole ? 'text-[#1b5e20]' : 'text-gray-800'
                        }`}>
                          {msg.from}
                        </div>
                        <div className={`${
                          msg.from === 'Vendeur' || msg.from === userRole ? 'text-[#1b5e20]' : 'text-gray-700'
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
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b5e20]"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      if (input.value.trim()) {
                        sendMessage(input.value, userRole === 'vendor' ? 'Vendeur' : 'Client', currentRoomInfo?.roomId || '');
                        input.value = '';
                      }
                    }
                  }}
                />
                <button 
                  onClick={(e) => {
                    const input = (e.target as HTMLElement).closest('div')?.querySelector('input') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      sendMessage(input.value, userRole === 'vendor' ? 'Vendeur' : 'Client', currentRoomInfo?.roomId || '');
                      input.value = '';
                    }
                  }}
                  className="bg-[#1b5e20] hover:bg-[#16381a] text-white px-4 py-2 rounded-lg transition-colors"
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
                <div className="mb-4 p-4 bg-[#eef6ea] border border-[#cfe0c8] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-[#1b5e20] rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                      {currentProduct.image}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-[#1b5e20]">En vedette maintenant</div>
                      <div className="font-medium text-gray-900">{currentProduct.name}</div>
                      <div className="text-sm text-[#1b5e20] font-bold">{currentProduct.price.toLocaleString()} FCFA</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <div 
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => {
                    const product = { id: 1, name: 'Robe Wax Ankara', price: 25000, image: '', description: 'Magnifique robe wax africain, faite main avec des motifs traditionnels' };
                    selectProduct(product);
                  }}
                >
                  <div className="w-12 h-12 bg-[#1b5e20] rounded-lg flex items-center justify-center text-white font-bold">
                    
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Robe Wax Ankara</div>
                    <div className="text-sm text-[#1b5e20] font-bold">25 000 FCFA</div>
                  </div>
                  <button className="bg-[#1b5e20] hover:bg-[#16381a] text-white px-3 py-1 rounded text-sm transition-colors">
                    Acheter
                  </button>
                </div>
                
                <div 
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => {
                    const product = { id: 2, name: 'Collier Perles', price: 15000, image: '', description: 'Collier traditionnel en perles artisanales, parfait pour les occasions spéciales' };
                    selectProduct(product);
                  }}
                >
                  <div className="w-12 h-12 bg-[#1b5e20] rounded-lg flex items-center justify-center text-white font-bold">
                    
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Collier traditionnel</div>
                    <div className="text-sm text-[#1b5e20] font-bold">15 000 FCFA</div>
                  </div>
                  <button className="bg-[#1b5e20] hover:bg-[#16381a] text-white px-3 py-1 rounded text-sm transition-colors">
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
};

export default EnhancedLiveShopping;