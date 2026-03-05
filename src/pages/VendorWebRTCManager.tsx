import React, { useState } from 'react';
import { Video, Radio, Phone, Settings, Users, ShoppingCart, X } from 'lucide-react';
import WebRTCManagerAfricain from '../components/WebRTCManagerAfricain';

interface VendorWebRTCManagerProps {
  onClose?: () => void;
  mode?: 'video-call' | 'live-shopping';
}

const VendorWebRTCManager: React.FC<VendorWebRTCManagerProps> = ({ 
  onClose, 
  mode = 'video-call' 
}) => {
  const [currentMode, setCurrentMode] = useState<'video-call' | 'live-shopping'>(mode);
  const [roomId, setRoomId] = useState('vendor-room-' + Date.now());
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Données de démonstration pour les produits
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
    setIsStreaming(true);
  };

  const handleStreamEnd = () => {
    setIsStreaming(false);
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
  };

  const generateRoomId = () => {
    const newRoomId = 'mangoo-live-' + Math.random().toString(36).substr(2, 9);
    setRoomId(newRoomId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-green-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {currentMode === 'live-shopping' ? (
              <>
                <Radio className="w-6 h-6 animate-pulse" />
                <span className="text-xl font-bold">Live Shopping MangooTech</span>
              </>
            ) : (
              <>
                <Video className="w-6 h-6" />
                <span className="text-xl font-bold">Appel Vidéo MangooTech</span>
              </>
            )}
          </div>
          {isStreaming && (
            <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">EN DIRECT</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Mode Switcher */}
          <div className="bg-white bg-opacity-20 rounded-lg p-1 flex">
            <button
              onClick={() => setCurrentMode('video-call')}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                currentMode === 'video-call'
                  ? 'bg-white text-orange-600'
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
            >
              <Phone className="w-4 h-4 inline mr-1" />
              Appel
            </button>
            <button
              onClick={() => setCurrentMode('live-shopping')}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                currentMode === 'live-shopping'
                  ? 'bg-white text-green-600'
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
            >
              <Radio className="w-4 h-4 inline mr-1" />
              Live
            </button>
          </div>

          {/* Room ID */}
          <div className="bg-white bg-opacity-20 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-80">Room:</span>
              <span className="font-mono text-sm">{roomId}</span>
              <button
                onClick={generateRoomId}
                className="text-white hover:text-yellow-300 transition-colors"
                title="Générer nouvelle room"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

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
        <div className="flex-1">
          <WebRTCManagerAfricain
            mode={currentMode}
            roomId={roomId}
            userRole="vendor"
            onStreamStart={handleStreamStart}
            onStreamEnd={handleStreamEnd}
          />
        </div>

        {/* Side Panel for Live Shopping */}
        {currentMode === 'live-shopping' && (
          <div className="w-80 bg-gray-900 text-white p-4 overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Produits en Vedette
              </h3>
              
              <div className="space-y-3">
                {demoProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-all hover:bg-gray-800 ${
                      selectedProduct?.id === product.id
                        ? 'border-orange-500 bg-orange-900 bg-opacity-20'
                        : 'border-gray-700'
                    }`}
                    onClick={() => handleProductSelect(product)}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                    <h4 className="font-medium text-sm mb-1">{product.name}</h4>
                    <p className="text-xs text-gray-300 mb-2 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-orange-400 font-bold text-sm">
                        {product.price.toLocaleString('fr-FR')} FCFA
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductSelect(product);
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded text-xs transition-colors"
                      >
                        Présenter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Stats */}
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Statistiques Live
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Spectateurs:</span>
                  <span className="text-green-400 font-medium">{isStreaming ? '12' : '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Messages:</span>
                  <span className="text-blue-400 font-medium">{isStreaming ? '8' : '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Réactions:</span>
                  <span className="text-yellow-400 font-medium">{isStreaming ? '15' : '0'}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded text-sm transition-colors"
              >
                🧹 Effacer sélection
              </button>
              <button
                onClick={generateRoomId}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors"
              >
                🔄 Nouvelle room
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorWebRTCManager;