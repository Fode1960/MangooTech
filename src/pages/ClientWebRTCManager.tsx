import React, { useState } from 'react';
import { Video, Radio, Phone, Settings, Users, ShoppingCart, X, MessageCircle, Heart } from 'lucide-react';
import WebRTCManagerAfricain from '../components/WebRTCManagerAfricain';

interface ClientWebRTCManagerProps {
  onClose?: () => void;
  mode?: 'video-call' | 'live-shopping';
  roomId?: string;
}

const ClientWebRTCManager: React.FC<ClientWebRTCManagerProps> = ({ 
  onClose, 
  mode = 'video-call',
  roomId = 'client-room-demo'
}) => {
  const [currentMode, setCurrentMode] = useState<'video-call' | 'live-shopping'>(mode);
  const [currentRoomId, setCurrentRoomId] = useState(roomId);
  const [isConnected, setIsConnected] = useState(false);
  const [showProductPanel, setShowProductPanel] = useState(true);

  // Données de démonstration pour le live shopping
  const demoProducts = [
    {
      id: 'demo-product-1',
      name: 'iPhone 14 Pro Max (Demo)',
      price: 899000,
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop',
      description: 'Smartphone haut de gamme avec triple appareil photo et écran OLED'
    },
    {
      id: 'demo-product-2',
      name: 'Robe Wax Africain (Demo)',
      price: 45000,
      image: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=400&h=400&fit=crop',
      description: 'Magnifique robe traditionnelle en wax africain aux couleurs vibrantes'
    },
    {
      id: 'demo-product-3',
      name: 'Attiéké Traditionnel (Demo)',
      price: 2500,
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop',
      description: 'Attiéké frais préparé selon la recette traditionnelle ivoirienne'
    }
  ];

  const handleStreamStart = () => {
    setIsConnected(true);
  };

  const handleStreamEnd = () => {
    setIsConnected(false);
  };

  const handleJoinRoom = () => {
    // Simulate joining a room
    const roomInput = prompt('Entrez le code de la room (laissez vide pour demo):');
    if (roomInput !== null) {
      setCurrentRoomId(roomInput || 'demo-room-' + Math.random().toString(36).substr(2, 9));
    }
  };

  const handleBuyProduct = (product: any) => {
    alert(`🛍️ Produit ajouté au panier: ${product.name} - ${product.price.toLocaleString('fr-FR')} FCFA`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-orange-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {currentMode === 'live-shopping' ? (
              <>
                <Radio className="w-6 h-6 animate-pulse" />
                <span className="text-xl font-bold">Live Shopping - Client</span>
              </>
            ) : (
              <>
                <Video className="w-6 h-6" />
                <span className="text-xl font-bold">Appel Vidéo - Client</span>
              </>
            )}
          </div>
          {isConnected && (
            <div className="flex items-center gap-2 bg-green-600 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">CONNECTÉ</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Room Info */}
          <div className="bg-white bg-opacity-20 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-80">Room:</span>
              <span className="font-mono text-sm">{currentRoomId}</span>
              <button
                onClick={handleJoinRoom}
                className="text-white hover:text-yellow-300 transition-colors text-xs"
                title="Rejoindre une autre room"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Product Panel Toggle (for Live Shopping) */}
          {currentMode === 'live-shopping' && (
            <button
              onClick={() => setShowProductPanel(!showProductPanel)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-2 transition-all"
              title={showProductPanel ? 'Masquer produits' : 'Afficher produits'}
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-2 transition-all"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* WebRTC Manager */}
        <div className={`${showProductPanel && currentMode === 'live-shopping' ? 'flex-1' : 'w-full'}`}>
          <WebRTCManagerAfricain
            mode={currentMode}
            roomId={currentRoomId}
            userRole="customer"
            onStreamStart={handleStreamStart}
            onStreamEnd={handleStreamEnd}
          />
        </div>

        {/* Product Panel for Live Shopping */}
        {currentMode === 'live-shopping' && showProductPanel && (
          <div className="w-80 bg-gray-900 text-white p-4 overflow-y-auto border-l border-gray-700">
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Produits en Vedette
              </h3>
              
              <div className="space-y-4">
                {demoProducts.map((product) => (
                  <div
                    key={product.id}
                    className="border border-gray-700 rounded-lg p-3 hover:bg-gray-800 transition-colors"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <h4 className="font-medium text-sm mb-2">{product.name}</h4>
                    <p className="text-xs text-gray-300 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-orange-400 font-bold text-sm">
                        {product.price.toLocaleString('fr-FR')} FCFA
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleBuyProduct(product)}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded text-xs transition-colors flex items-center gap-1"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          Acheter
                        </button>
                        <button
                          onClick={() => alert(`❤️ Produit aimé: ${product.name}`)}
                          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
                        >
                          <Heart className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => alert(`💬 Chat pour: ${product.name}`)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Poser une question
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Stats */}
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Info Session
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">État:</span>
                  <span className={isConnected ? 'text-green-400 font-medium' : 'text-yellow-400 font-medium'}>
                    {isConnected ? 'Connecté' : 'En attente'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mode:</span>
                  <span className="text-blue-400 font-medium">
                    {currentMode === 'live-shopping' ? 'Live Shopping' : 'Appel Vidéo'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Room:</span>
                  <span className="text-purple-400 font-mono text-xs">{currentRoomId}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <button
                onClick={handleJoinRoom}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors"
              >
                🔗 Rejoindre une room
              </button>
              <button
                onClick={() => setCurrentMode(currentMode === 'live-shopping' ? 'video-call' : 'live-shopping')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded text-sm transition-colors"
              >
                🔄 Basculer mode
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientWebRTCManager;