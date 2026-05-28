import React, { useState, useEffect } from 'react';
import { Film, ShoppingBag, Users, MessageCircle, Phone, Video, Play, ShoppingCart, Heart, Send } from 'lucide-react';
import WebRTCManagerFinal from '../components/WebRTCManagerFinal';
import { useLiveShopping } from '../contexts/LiveShoppingContext';

const LiveShoppingClientTest: React.FC = () => {
  const { messages: globalMessages, sendMessage: sendGlobalMessage, currentProduct, setCurrentProduct, isLive: globalIsLive, viewers: globalViewers, products } = useLiveShopping();
  const [isWatching, setIsWatching] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null); // Pour afficher le produit sélectionné

  const liveStream = {
    title: 'Collection Wax Ankara 2024',
    vendor: 'MangooTech Boutique',
    viewers: globalViewers || 245,
    duration: '45 min',
    status: globalIsLive ? 'live' : 'offline'
  };

  // Les produits viennent maintenant du contexte
  const productsFromContext = products;

  const joinLive = () => {
    setIsWatching(true);
  };

  const leaveLive = () => {
    setIsWatching(false);
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      // Utiliser uniquement le contexte pour envoyer le message
      sendGlobalMessage(newMessage, 'Client', 'live-shopping-demo');
      setNewMessage('');
    }
  };

  const addToCart = (product: any) => {
    setCart([...cart, product]);
  };

  // Mettre à jour le produit sélectionné quand le vendeur en choisit un
  useEffect(() => {
    if (currentProduct) {
      setSelectedProduct(currentProduct);
      console.log('Produit sélectionné par le vendeur:', currentProduct);
    }
  }, [currentProduct]);

  const handleSelectProduct = (product: any) => {
    setCurrentProduct(product);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Film className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Live Shopping Viewer</h1>
                <p className="text-sm text-gray-600">Regardez et achetez en direct</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isWatching && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-red-500">EN DIRECT</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium">{liveStream.viewers} viewers</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium">{cart.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Zone de visionnage */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                {!isWatching ? (
                  <div className="text-center text-white">
                    <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">{liveStream.title}</h3>
                    <p className="text-gray-300 mb-2">par {liveStream.vendor}</p>
                    <p className="text-gray-400 mb-6">{liveStream.viewers} personnes regardent</p>
                    <button
                      onClick={joinLive}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold flex items-center space-x-2 mx-auto transition-all duration-200 transform hover:scale-105"
                    >
                      <Play className="w-5 h-5" />
                      <span>Rejoindre le live</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-white">
                    <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Film className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Visionnage en cours</h3>
                    <p className="text-gray-300">Vous regardez: {liveStream.title}</p>
                    <button
                      onClick={leaveLive}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium mt-4 transition-all duration-200"
                    >
                      Quitter le live
                    </button>
                  </div>
                )}
              </div>

              {/* Produits en vedette */}
              {isWatching && (
                <div className="p-6 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Produits présentés</h3>
                  
                  {/* Notification du produit actuel */}
                  {currentProduct && (
                    <div className="mb-4 p-4 bg-blue-100 rounded-xl border-2 border-blue-300">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">{currentProduct.image}</div>
                        <div>
                          <h4 className="font-bold text-blue-900">Produit en cours de présentation</h4>
                          <p className="text-blue-800 font-semibold">{currentProduct.name}</p>
                          <p className="text-blue-600 text-sm">{currentProduct.description}</p>
                          <p className="text-blue-900 font-bold">{currentProduct.price.toLocaleString()} FCFA</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-4">
                    {productsFromContext.map((product) => (
                      <div
                        key={product.id}
                        className={`bg-white rounded-xl p-4 cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                          currentProduct?.id === product.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-lg'
                        }`}
                        onClick={() => handleSelectProduct(product)}
                      >
                        <div className="text-4xl text-center mb-2">{product.image}</div>
                        <h4 className="font-semibold text-gray-900 text-sm">{product.name}</h4>
                        <p className="text-blue-500 font-bold text-sm">{product.price.toLocaleString()} FCFA</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded-lg text-xs transition-all duration-200"
                        >
                          Ajouter
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* WebRTC Integration */}
            {isWatching && (
              <div className="mt-8">
                <WebRTCManagerFinal
                  role="client"
                  roomId="live-shopping-demo"
                  userId="client-001"
                  onCallEnd={() => console.log('Appel terminé')}
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
                <h3 className="font-semibold text-gray-900">Chat avec le vendeur</h3>
              </div>
              
              <div className="h-64 bg-gray-50 rounded-xl p-4 mb-4 overflow-y-auto">
                {globalMessages.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center">Aucun message pour le moment...</p>
                ) : (
                  <div className="space-y-2">
                    {globalMessages.map((message) => (
                      <div key={message.id} className={`rounded-lg p-2 text-sm max-w-xs ${
                        message.from === 'Client' ? 'bg-green-100 ml-auto' : 
                        message.from === 'Vendeur' ? 'bg-blue-100 mr-auto' : 'bg-gray-100 mr-auto'
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
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition-all duration-200"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Panier */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Mon Panier ({cart.length})</h3>
              {cart.length === 0 ? (
                <p className="text-gray-500 text-sm text-center">Votre panier est vide</p>
              ) : (
                <div className="space-y-2">
                  {cart.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{item.image}</span>
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold text-blue-500">{item.price.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center font-bold">
                      <span>Total:</span>
                      <span className="text-blue-500">
                        {cart.reduce((sum, item) => sum + item.price, 0).toLocaleString()} FCFA
                      </span>
                    </div>
                    <button className="w-full mt-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200">
                      Commander
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveShoppingClientTest;