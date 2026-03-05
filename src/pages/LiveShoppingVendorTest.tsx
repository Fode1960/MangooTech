import React, { useState, useEffect } from 'react';
import { Film, ShoppingBag, Users, MessageCircle, Phone, Video, Play, Pause, Mic, MicOff, Camera, CameraOff, Send } from 'lucide-react';
import WebRTCManagerFinal from '../components/WebRTCManagerFinal';
import { useLiveShopping } from '../contexts/LiveShoppingContext';

const LiveShoppingVendorTest: React.FC = () => {
  const { messages: globalMessages, sendMessage: sendGlobalMessage, currentProduct, selectProduct, isLive: globalIsLive, setIsLive: setGlobalIsLive, viewers: globalViewers, setViewers: setGlobalViewers, setUserRole } = useLiveShopping();
  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [newMessage, setNewMessage] = useState('');
  const [isCalling, setIsCalling] = useState(false);

  // Définir le rôle du vendeur
  useEffect(() => {
    setUserRole('vendor');
  }, []);

  const products = [
    { id: 1, name: 'Robe Wax Ankara', price: 25000, image: '👗', description: 'Magnifique robe wax africain, faite main avec des motifs traditionnels' },
    { id: 2, name: 'Collier Perles', price: 15000, image: '💎', description: 'Collier traditionnel en perles artisanales, parfait pour les occasions spéciales' },
    { id: 3, name: 'Sac Artisanal', price: 20000, image: '👜', description: 'Sac fait main par des artisans locaux, cuir véritable et tissu wax' }
  ];

  const startLive = () => {
    setIsLive(true);
    setGlobalIsLive(true);
    setViewers(Math.floor(Math.random() * 50) + 10);
    setGlobalViewers(Math.floor(Math.random() * 50) + 10);
  };

  const stopLive = () => {
    setIsLive(false);
    setGlobalIsLive(false);
    setViewers(0);
    setGlobalViewers(0);
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      // Utiliser uniquement le contexte pour envoyer le message
      sendGlobalMessage(newMessage, 'Vendeur', 'live-shopping-demo');
      setNewMessage('');
    }
  };

  const handleSelectProduct = (product: any) => {
    selectProduct(product); // Utiliser la fonction du contexte
    // Envoyer un message dans le chat pour notifier
    sendGlobalMessage(`🛍️ Présente maintenant: ${product.name} - ${product.price.toLocaleString()} FCFA`, 'Vendeur', 'live-shopping-demo');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-red-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Film className="w-8 h-8 text-red-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Studio Live Shopping</h1>
                <p className="text-sm text-gray-600">Vendeur - Diffusion en direct</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isLive && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-red-500">EN DIRECT</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium">{viewers} viewers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Zone de diffusion */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                {!isLive ? (
                  <div className="text-center text-white">
                    <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">Prêt à diffuser ?</h3>
                    <p className="text-gray-300 mb-6">Cliquez sur "Démarrer le live" pour commencer</p>
                    <button
                      onClick={startLive}
                      className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-semibold flex items-center space-x-2 mx-auto transition-all duration-200 transform hover:scale-105"
                    >
                      <Play className="w-5 h-5" />
                      <span>Démarrer le live</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-white">
                    <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Film className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Diffusion en cours</h3>
                    <p className="text-gray-300">Vous êtes en direct !</p>
                    <button
                      onClick={stopLive}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium mt-4 transition-all duration-200"
                    >
                      Arrêter le live
                    </button>
                  </div>
                )}
              </div>

              {/* Produits en vedette */}
              {isLive && (
                <div className="p-6 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Produits à présenter</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className={`bg-white rounded-xl p-4 cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                          currentProduct?.id === product.id ? 'ring-2 ring-red-500' : 'hover:shadow-lg'
                        }`}
                        onClick={() => handleSelectProduct(product)}
                      >
                        <div className="text-4xl text-center mb-2">{product.image}</div>
                        <h4 className="font-semibold text-gray-900 text-sm">{product.name}</h4>
                        <p className="text-red-500 font-bold text-sm">{product.price.toLocaleString()} FCFA</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* WebRTC Integration */}
            {isLive && (
              <div className="mt-8">
                <WebRTCManagerFinal
                  role="vendor"
                  roomId="live-shopping-demo"
                  userId="vendor-001"
                  onCallEnd={() => setIsCalling(false)}
                />
              </div>
            )}
          </div>

          {/* Chat et contrôles */}
          <div className="space-y-6">
            {/* Chat */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <MessageCircle className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-900">Chat avec viewers</h3>
              </div>
              
              <div className="h-64 bg-gray-50 rounded-xl p-4 mb-4 overflow-y-auto">
                {globalMessages.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center">Aucun message pour le moment...</p>
                ) : (
                  <div className="space-y-2">
                    {globalMessages.map((message) => (
                      <div key={message.id} className={`rounded-lg p-2 text-sm max-w-xs ${
                        message.from === 'Vendeur' ? 'bg-blue-100 ml-auto' : 
                        message.from === 'Client' ? 'bg-green-100 mr-auto' : 'bg-gray-100 mr-auto'
                      }`}>
                        <div className="font-semibold text-xs text-gray-600">{message.from}</div>
                        <div>{message.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrire un message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-all duration-200"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Statistiques */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Statistiques du live</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Viewers actifs</span>
                  <span className="font-bold text-blue-500">{viewers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Durée</span>
                  <span className="font-bold text-green-500">{isLive ? 'En cours' : 'Arrêté'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Messages</span>
                  <span className="font-bold text-purple-500">{globalMessages.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveShoppingVendorTest;